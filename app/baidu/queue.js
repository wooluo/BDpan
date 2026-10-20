// A small download manager for netdisk files on top of the engine's ranged
// downloader. Each start resolves a fresh CDN url (they expire after ~8h);
// the engine's checkpoint is keyed by destination+size, so a paused file
// resumes from the same partial however many times the link is re-resolved.

import { Archives, Downloads, FileSystem, Http, Platform } from '@ps5-react/core';
import { NETDISK_UA } from './api.js';

const IMAGE_EXT = /\.(ffpfsc|ffpfs|ffpkg|exfat)$/i;
const ARCHIVE_EXT = /\.(zip|rar|7z|tar|tgz|tbz2|txz)$/i;
const STATE_FILE = 'baidupan/downloads.json';

function now() { return Date.now(); }

function hostOf(url) { return url.replace(/^https?:\/\//, '').split('/')[0]; }

function escapeRegExp(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function dirNameOf(path) { const cut = path.lastIndexOf('/'); return cut > 0 ? path.slice(0, cut) : ''; }

function ensureDir(fs, dir) {
  const parts = dir.split('/').filter(Boolean);
  let path = '';
  for (const part of parts) {
    path += `/${part}`;
    try { fs.mkdir(path); } catch (error) {
      if (!fs.exists(path)) throw error;
    }
  }
}

function stateDir(fs) {
  return `${fs.dataDir}/baidupan`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[power]}`;
}

function createDownloadManager({ client, tokens }) {
  const fs = FileSystem;
  console.log('[baidupan] manager created');
  const listeners = new Set();
  let jobs = [];
  let task = null;
  let pumping = false;

  // useSyncExternalStore compares snapshot references: hand out a fresh array
  // whenever anything changed, or React keeps showing the frozen first render.
  const notify = () => {
    jobs = [...jobs];
    listeners.forEach((listener) => listener());
  };
  const subscribe = (listener) => {
    listeners.add(listener);
    listener();
    return () => listeners.delete(listener);
  };

  try {
    jobs = JSON.parse(fs.readFile(`${stateDir(fs)}/downloads.json`)) || [];
    jobs.forEach((job) => {
      // Interrupted transfers wait for the player; queued ones are an ask that was
      // never answered, so they start again by themselves.
      if (job.state === 'downloading' || job.state === 'connecting') job.state = 'paused';
    });
    const pending = jobs.some((job) => job.state === 'queued');
    if (pending) setTimeout(() => pump(), 500);
  } catch {}

  const persist = () => {
    try {
      ensureDir(fs, stateDir(fs));
      const tmp = `${stateDir(fs)}/downloads.json.tmp`;
      fs.writeFile(tmp, JSON.stringify(jobs), { sync: true });
      fs.rename(tmp, `${stateDir(fs)}/downloads.json`);
    } catch (error) {
      console.log(`[baidupan] job save failed: ${error.message}`);
    }
  };

  function destinationFor(job, root) {
    const folder = IMAGE_EXT.test(job.filename)
      ? `${root}/homebrew`
      : `${root}/downloads/baidupan${job.relDir ? `/${job.relDir}` : ''}`;
    ensureDir(fs, folder);
    return `${folder}/${job.filename}`;
  }

  function listDirSafe(folder) {
    try { return fs.readDir(folder) || []; } catch { return []; }
  }

  function walkFiles(folder) {
    const out = [];
    for (const item of listDirSafe(folder)) {
      const full = `${folder}/${item.name}`;
      if (item.isDirectory) out.push(...walkFiles(full));
      else out.push(full);
    }
    return out;
  }

  // ShadowMount+ scans <root>/homebrew: game images found inside an extracted
  // archive are moved there so they show up for install without another step.
  function moveGameImages(folder, root) {
    let moved = 0;
    for (const file of walkFiles(folder)) {
      if (!IMAGE_EXT.test(file)) continue;
      const target = `${root}/homebrew/${file.split('/').pop()}`;
      try {
        ensureDir(fs, `${root}/homebrew`);
        if (fs.exists(target)) continue;
        fs.rename(file, target);
        moved += 1;
      } catch (error) {
        console.log(`[baidupan] image move failed: ${error.message}`);
      }
    }
    return moved;
  }

  // The CDN hands out two kinds of nodes: ones serving ranged bytes straight over
  // https (baidupcs.com, preferred — they work on SNI-filtered networks too) and
  // ones answering a redirect to a plain-http carrier node. Probing picks every
  // direct node as url+mirrors (the engine spreads ranges across them, keeping
  // per-link hit counts low); if only redirecting nodes exist, follow the first
  // Location ourselves — the engine refuses https→http redirect downgrades.
  async function pickDownloadUrl(urls) {
    const direct = [];
    let redirected = null;
    for (const candidate of urls) {
      if (direct.length >= 2) break;
      try {
        // A one-byte ranged GET, not HEAD: the pcs nodes answer HEAD with 403.
        const probe = await Http.request(candidate, {
          method: 'GET',
          headers: { 'User-Agent': NETDISK_UA, Range: 'bytes=0-0' },
          followRedirects: false,
          maxBytes: 64,
        });
        console.log(`[baidupan] probe ${hostOf(candidate)} -> ${probe.status}`);
        if (probe.status >= 200 && probe.status < 300) direct.push(candidate);
        else if (!redirected && probe.status >= 300 && probe.status < 400 && probe.headers?.location) {
          redirected = probe.headers.location;
        }
      } catch (error) {
        const text = String(error.message || error);
        // maxBytes overflowing means the node ignored Range and streamed the file: usable,
        // the engine falls back to one sequential transfer there.
        if (text.includes('exceeds maxBytes')) direct.push(candidate);
        else console.log(`[baidupan] probe ${hostOf(candidate)} threw: ${text}`);
      }
    }
    if (direct.length) return { url: direct[0], mirrors: direct.slice(1) };
    if (redirected) return { url: redirected, mirrors: [] };
    throw new Error('no usable download node');
  }

  async function pump() {
    if (pumping || task) return;
    const job = jobs.find((entry) => entry.state === 'queued');
    if (!job) return;
    pumping = true;
    job.state = 'connecting';
    job.error = null;
    notify();
    try {
      const urls = await client.locate(job.path);
      const { url, mirrors } = await pickDownloadUrl(urls);
      console.log(`[baidupan] download ${job.filename} via ${hostOf(url)} (+${mirrors.length} mirrors)`);
      const destination = job.destination || destinationFor(job, job.root || '/data');
      job.destination = destination;
      // The engine refuses to touch an existing destination; a same-size file from an
      // earlier run counts as delivered rather than as a failure.
      try {
        const stat = fs.stat(destination);
        if (stat?.size === (job.sizeBytes || 0)) {
          job.state = 'done';
          job.written = job.total = job.sizeBytes;
          job.completedAt = now();
          console.log(`[baidupan] ${job.filename} already on disk, marking done`);
          maybeAutoExtract(job);
          return;
        }
      } catch {}
      task = Downloads.enqueue({
        url,
        mirrors,
        destination,
        headers: { 'User-Agent': NETDISK_UA },
        expectedBytes: job.sizeBytes || undefined,
        connections: 16,
        storageRoot: job.root || '/data',
        rejectHtml: true,
      });
      const off = task.subscribe((snapshot) => {
        job.state = snapshot.state === 'downloading' ? 'downloading'
          : snapshot.state === 'connecting' || snapshot.state === 'queued' ? 'connecting'
          : snapshot.state;
        job.written = snapshot.written ?? 0;
        job.total = snapshot.total ?? job.sizeBytes;
        job.bytesPerSecond = snapshot.bytesPerSecond ?? 0;
        if (job.state === 'completed') job.completedAt = now();
        if (job.state === 'failed') job.error = snapshot.error || 'download failed';
        notify();
      });
      await task.done.finally(() => { off(); });
      if (job.state !== 'paused') {
        // The engine's own final snapshot is the truth; the progress callback may
        // lag the done promise. Terminal states are 'completed'/'failed'/'cancelled'.
        const finalState = task.snapshot?.state || job.state;
        const settled = finalState === 'completed' ? 'done' : 'error';
        job.state = settled;
        if (settled === 'error' && !job.error) job.error = task.snapshot?.error || 'download failed';
        if (job.state === 'done') {
          job.completedAt = now();
          maybeAutoExtract(job);
        }
        job.bytesPerSecond = 0;
      }
    } catch (error) {
      if (job.state !== 'paused') {
        // The CDN throttles bursts of link hits; one fresh locate on another node
        // usually clears a 403 without bothering the player.
        const text = String(error.message || error);
        if (text.includes('403') && !job.autoRetried) {
          job.autoRetried = true;
          job.state = 'queued';
          console.log('[baidupan] 403 from the node, re-locating in 4s');
          setTimeout(() => pump(), 4000);
        } else {
          job.state = 'error';
          job.error = text;
        }
      }
    } finally {
      task = null;
      pumping = false;
      persist();
      notify();
      pump();
    }
  }

  // A folder-batch of split RAR volumes extracts itself once every volume of
  // the set has finished downloading; single picks stay manual on purpose.
  function maybeAutoExtract(job) {
    if (!job.batched || !/\.part\d+\.rar$/i.test(job.filename)) return;
    const folder = dirNameOf(job.path);
    const base = job.filename.replace(/\.part\d+\.rar$/i, '');
    const pattern = new RegExp(`^${escapeRegExp(base)}\\.part\\d+\\.rar$`, 'i');
    const set = jobs.filter((entry) => entry.batched && entry.path.startsWith(`${folder}/`) && pattern.test(entry.filename));
    if (set.length < 2 || !set.every((entry) => entry.state === 'done')) return;
    const first = set.find((entry) => /\.part0*1\.rar$/i.test(entry.filename));
    if (first && !first.extractState) runExtract(first);
  }

  async function runExtract(job) {
    if (job.state !== 'done' || !ARCHIVE_EXT.test(job.filename) || job.extractState === 'extracting') return;
      const archive = destinationFor(job, job.root);
      let sources = [archive];
      const part = job.filename.match(/^(.*)\.part0*1\.rar$/i);
      if (part) {
        const folder = dirNameOf(archive);
        const pattern = new RegExp(`^${escapeRegExp(part[1])}\\.part\\d+\\.rar$`, 'i');
        sources = listDirSafe(folder)
          .filter((item) => !item.isDirectory && pattern.test(item.name))
          .map((item) => `${folder}/${item.name}`)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        if (!sources.length) sources = [archive];
      }
      const label = job.filename
        .replace(/\.part\d+\.rar$/i, '')
        .replace(ARCHIVE_EXT, '')
        .replace(/[.]+$/, '') || 'archive';
      const outDir = `${job.root}/downloads/baidupan/${label}`;
      ensureDir(fs, outDir);
      job.extractState = 'extracting';
      job.extractError = null;
      job.extractWritten = 0;
      job.extractTotal = 0;
      notify();
      persist();
      try {
        const task = Archives.extract({ sources, destination: outDir });
        const off = task.subscribe((snapshot) => {
          job.extractWritten = snapshot.written ?? 0;
          job.extractTotal = snapshot.total ?? 0;
          notify();
        });
        try { await task.done; } finally { off(); }
        const images = moveGameImages(outDir, job.root);
        if (!walkFiles(outDir).length) { try { fs.removeTree(outDir); } catch {} }
        job.extractState = 'done';
        job.extractImages = images;
        console.log(`[baidupan] ${job.filename}: extracted, ${images} game image(s) -> ${job.root}/homebrew`);
      } catch (error) {
        job.extractState = 'error';
        job.extractError = error.message || String(error);
        console.log(`[baidupan] extract failed: ${job.extractError}`);
      }
      notify();
      persist();
  }

  const manager = {
    subscribe,
    jobs: () => jobs,
    add(file, root = '/data', { relDir = '', batched = false } = {}) {
      const existing = jobs.find((job) => job.path === file.path);
      if (existing && existing.state !== 'error') return existing;
      const job = existing || {
        id: `dl-${now()}-${Math.floor(Math.random() * 1e6)}`,
        path: file.path,
        filename: file.name,
        sizeBytes: file.size,
        relDir,
        batched,
        root,
        state: 'queued',
        written: 0,
        total: file.size,
        addedAt: now(),
      };
      if (existing) {
        job.state = 'queued';
        job.error = null;
      }
      jobs = [job, ...jobs.filter((entry) => entry.id !== job.id)];
      persist();
      notify();
      pump();
      return job;
    },
    // Recursively walks a netdisk folder (list pages of 1000) and queues every
    // file under it, keeping the subfolder layout below downloads/baidupan/<name>.
    async addFolder(folder, root = '/data', onFound = null) {
      const base = folder.path.replace(/\/+$/, '');
      const found = [];
      const pending = [base];
      while (pending.length) {
        const current = pending.shift();
        for (let page = 1; ; page += 1) {
          const batch = await client.list(current, { page });
          for (const item of batch) {
            if (item.isDir) pending.push(item.path);
            else found.push(item);
          }
          if (onFound) { try { onFound(found.length); } catch {} }
          if (batch.length < 1000) break;
        }
      }
      let count = 0;
      let bytes = 0;
      for (const file of found) {
        const before = jobs.length;
        const relDir = file.path.slice(base.length + 1, file.path.length - file.name.length - 1);
        manager.add({ path: file.path, name: file.name, size: file.size }, root, { relDir, batched: true });
        if (jobs.length > before) { count += 1; bytes += file.size || 0; }
      }
      console.log(`[baidupan] folder ${base}: queued ${count}/${found.length} files (${formatBytes(bytes)})`);
      return { count, bytes, total: found.length };
    },
    // Extracts a finished archive job. Multi-volume RAR (.part1.rar) gathers
    // its sibling volumes from the same folder; extracted game images are
    // routed to <root>/homebrew for ShadowMount+, the rest stays unpacked
    // next to the downloads.
    async extract(id) {
      const job = jobs.find((entry) => entry.id === id);
      if (job) await runExtract(job);
    },
    pause(id) {
      const job = jobs.find((entry) => entry.id === id);
      if (!job || job.state !== 'downloading' || !task) return;
      job.state = 'paused';
      try { task.cancel(); } catch {}
      notify();
    },
    resume(id) {
      const job = jobs.find((entry) => entry.id === id);
      if (!job || job.state !== 'paused' && job.state !== 'error') return;
      job.state = 'queued';
      job.error = null;
      persist();
      notify();
      pump();
    },
    remove(id) {
      const job = jobs.find((entry) => entry.id === id);
      if (!job) return;
      if (job.state === 'downloading' || job.state === 'connecting') {
        job.state = 'paused';
        try { task?.cancel(); } catch {}
      }
      jobs = jobs.filter((entry) => entry.id !== id);
      persist();
      notify();
    },
  };
  return manager;
}

export { createDownloadManager, formatBytes, IMAGE_EXT, ARCHIVE_EXT };
