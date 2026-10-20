// A small download manager for netdisk files on top of the engine's ranged
// downloader. Each start resolves a fresh CDN url (they expire after ~8h);
// the engine's checkpoint is keyed by destination+size, so a paused file
// resumes from the same partial however many times the link is re-resolved.

import { Downloads, FileSystem, Platform } from '@ps5-react/core';
import { NETDISK_UA } from './api.js';

const IMAGE_EXT = /\.(ffpfsc|ffpfs|ffpkg|exfat)$/i;
const STATE_FILE = 'baidupan/downloads.json';

function now() { return Date.now(); }

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
  const listeners = new Set();
  let jobs = [];
  let task = null;
  let pumping = false;

  const notify = () => listeners.forEach((listener) => listener());
  const subscribe = (listener) => {
    listeners.add(listener);
    listener();
    return () => listeners.delete(listener);
  };

  try {
    jobs = JSON.parse(fs.readFile(`${stateDir(fs)}/downloads.json`)) || [];
    jobs.forEach((job) => {
      if (job.state === 'downloading' || job.state === 'connecting' || job.state === 'queued') job.state = 'paused';
    });
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
    const folder = IMAGE_EXT.test(job.filename) ? `${root}/homebrew` : `${root}/downloads/baidupan`;
    ensureDir(fs, folder);
    return `${folder}/${job.filename}`;
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
      const destination = job.destination || destinationFor(job, job.root || '/data');
      job.destination = destination;
      task = Downloads.enqueue({
        url: urls[0],
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
        if (job.state === 'complete') job.completedAt = now();
        if (job.state === 'error') job.error = snapshot.error || 'download failed';
        notify();
      });
      await task.done.finally(() => { off(); });
      if (job.state !== 'paused') {
        job.state = job.state === 'complete' ? 'done' : job.state === 'error' ? 'error' : 'error';
        if (job.state === 'error' && !job.error) job.error = 'download failed';
        job.bytesPerSecond = 0;
      }
    } catch (error) {
      if (job.state !== 'paused') {
        job.state = 'error';
        job.error = error.message || String(error);
      }
    } finally {
      task = null;
      pumping = false;
      persist();
      notify();
      pump();
    }
  }

  return {
    subscribe,
    jobs: () => jobs,
    add(file, root = '/data') {
      const existing = jobs.find((job) => job.path === file.path);
      if (existing && existing.state !== 'error') return existing;
      const job = existing || {
        id: `dl-${now()}-${Math.floor(Math.random() * 1e6)}`,
        path: file.path,
        filename: file.name,
        sizeBytes: file.size,
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
}

export { createDownloadManager, formatBytes, IMAGE_EXT };
