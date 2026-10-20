import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { FocusScope, ScrollView, Text, View, motion } from '@ps5-react/core';
import { FocusRing } from '../ui/FocusRing.jsx';
import { Icon } from '../ui/Icon.jsx';
import { colors } from '../ui/colors.js';
import { useT } from '../i18n/index.js';
import { createClient } from './api.js';
import { useAuth } from './auth.js';
import { formatBytes, IMAGE_EXT } from './queue.js';

const SORTS = [
  { id: 'name', order: 'name', desc: false },
  { id: 'time', order: 'time', desc: true },
  { id: 'size', order: 'size', desc: true },
];

function fileName(path) {
  return path.replace(/\/+$/, '').split('/').pop() || '/';
}

function crumbs(path) {
  const parts = path.split('/').filter(Boolean);
  return [{ path: '/', name: '/' }, ...parts.map((part, index) => ({
    path: `/${parts.slice(0, index + 1).join('/')}`,
    name: part,
  }))];
}

function Row({ entry, onPress, focusKey }) {
  const t = useT();
  const isGameImage = !entry.isDir && IMAGE_EXT.test(entry.name);
  return (
    <motion.View
      focusKey={focusKey}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 18, height: 78, paddingHorizontal: 26, borderRadius: 12 }}
    >
      <FocusRing />
      <Icon name={entry.isDir ? 'folder' : 'file'} size={26} color={entry.isDir ? '#ffd166' : colors.muted} fill={entry.isDir ? '#ffd166' : 'none'} />
      <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 26, color: colors.fg }}>
        {entry.name}
      </Text>
      {isGameImage ? (
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 19, color: '#7ee081' }}>{t('browser.autoInstall')}</Text>
      ) : null}
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 21, color: colors.muted, minWidth: 110, textAlign: 'right' }}>
        {entry.isDir ? '' : formatBytes(entry.size)}
      </Text>
      <Icon name={entry.isDir ? 'play' : 'download'} size={20} color={colors.muted} fill="none" />
    </motion.View>
  );
}

export function BrowserScreen({ manager, client }) {
  const t = useT();
  const auth = useAuth();
  const [dir, setDir] = useState('/');
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [sortIndex, setSortIndex] = useState(0);
  const [quota, setQuota] = useState(null);
  const [picked, setPicked] = useState(null); // file detail dialog

  const jobs = useSyncExternalStore(manager.subscribe, manager.jobs);
  const activeJob = jobs.find((job) => job.state === 'downloading' || job.state === 'connecting');

  const load = useCallback(async (path, sort) => {
    setEntries(null);
    setError(null);
    try {
      const list = await client.list(path, SORTS[sort]);
      console.log(`[baidupan] listed ${path}: ${list.length} entries`);
      const folders = list.filter((entry) => entry.isDir);
      const files = list.filter((entry) => !entry.isDir);
      setEntries([...folders, ...files]);
    } catch (listError) {
      if (listError.sessionExpired) {
        auth.logout();
        return;
      }
      setError(listError.message || String(listError));
    }
  }, [client, auth]);

  useEffect(() => { load(dir, sortIndex); }, [load, dir, sortIndex]);
  useEffect(() => {
    client.quota().then(setQuota).catch(() => {});
  }, [client]);

  const open = (entry) => {
    if (entry.isDir) { setPicked(null); setDir(entry.path); return; }
    setPicked(entry);
  };

  const sort = SORTS[sortIndex];
  const trail = crumbs(dir);

  return (
    <FocusScope focusKey="screen" autoFocus>
      <View style={{ flex: 1, paddingTop: 16 }}>
        {/* breadcrumb + sort */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 34, height: 64, gap: 8 }}>
          <ScrollView horizontal style={{ flex: 1 }} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {trail.map((crumb, index) => (
              <motion.View key={crumb.path} focusKey={`crumb:${crumb.path}`}
                onPress={() => setDir(crumb.path)}
                style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FocusRing />
                {index > 0 ? <Text style={{ fontFamily: 'Inter-Regular', fontSize: 22, color: colors.muted }}> / </Text> : null}
                <Text numberOfLines={1} style={{ maxWidth: 420, fontFamily: 'Inter-Regular', fontSize: 22, color: index === trail.length - 1 ? colors.fg : colors.muted }}>
                  {crumb.name}
                </Text>
              </motion.View>
            ))}
          </ScrollView>
          <motion.View focusKey="sort" onPress={() => setSortIndex((index) => (index + 1) % SORTS.length)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 20, borderRadius: 10 }}>
            <FocusRing />
            <Icon name="list" size={18} color={colors.muted} fill="none" />
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 21, color: colors.muted }}>{t(`browser.sort.${sort.id}`)}</Text>
          </motion.View>
        </View>

        {/* entries */}
        {entries === null && !error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 26, color: colors.muted }}>{t('browser.loading')}</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 25, color: '#ff6b6b', maxWidth: 1200, textAlign: 'center' }}>{error}</Text>
            <motion.View focusKey="retry" onPress={() => load(dir, sortIndex)}
              style={{ height: 58, paddingHorizontal: 28, borderRadius: 10, backgroundColor: '#212125', alignItems: 'center', justifyContent: 'center' }}>
              <FocusRing />
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 23, color: colors.fg }}>{t('browser.retry')}</Text>
            </motion.View>
          </View>
        ) : entries.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 26, color: colors.muted }}>{t('browser.empty')}</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 26, paddingBottom: 130, gap: 4 }}>
            {entries.map((entry, index) => (
              <Row key={entry.path} entry={entry} focusKey={`entry:${entry.path}`}
                onPress={() => open(entry)} />
            ))}
          </ScrollView>
        )}

        {/* footer: active download strip */}
        {activeJob ? (
          <View style={{ position: 'absolute', left: 26, right: 26, bottom: 18, height: 64, borderRadius: 12, backgroundColor: '#17171acc', flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 22 }}>
            <Icon name="download" size={20} color="#7ee081" fill="none" />
            <Text numberOfLines={1} style={{ maxWidth: 720, fontFamily: 'Inter-Regular', fontSize: 21, color: colors.fg }}>{activeJob.filename}</Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 20, color: colors.muted }}>
              {formatBytes(activeJob.bytesPerSecond || 0)}/s
            </Text>
            <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#2b2b30', overflow: 'hidden' }}>
              <View style={{ width: `${activeJob.total ? Math.min(100, (activeJob.written / activeJob.total) * 100) : 0}%`, height: 8, backgroundColor: '#7ee081' }} />
            </View>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 20, color: colors.muted, minWidth: 150, textAlign: 'right' }}>
              {activeJob.total ? `${Math.floor((activeJob.written / activeJob.total) * 100)}%` : ''}
            </Text>
          </View>
        ) : null}

        {/* file dialog */}
        {picked ? (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#000000cc', alignItems: 'center', justifyContent: 'center' }}>
            <FocusScope focusKey="dialog" autoFocus trap>
              <View style={{ width: 880, borderRadius: 16, backgroundColor: '#17171a', padding: 40, gap: 26 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                  <Icon name="file" size={30} color={colors.muted} fill="none" />
                  <Text numberOfLines={2} style={{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 28, color: colors.fg }}>{picked.name}</Text>
                </View>
                <View style={{ gap: 8 }}>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 22, color: colors.muted }}>{t('browser.size')}: {formatBytes(picked.size)}</Text>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 22, color: colors.muted }}>
                    {t('browser.dest')}: {IMAGE_EXT.test(picked.name) ? '/data/homebrew (' + t('browser.destGame') + ')' : '/data/downloads/baidupan'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 18 }}>
                  <motion.View focusKey="dialog:download" onPress={() => { manager.add(picked); setPicked(null); }}
                    style={{ height: 64, paddingHorizontal: 30, borderRadius: 10, backgroundColor: '#f2f2f3', alignItems: 'center', justifyContent: 'center' }}>
                    <FocusRing />
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 24, color: '#0d0d0f' }}>{t('browser.download')}</Text>
                  </motion.View>
                  <motion.View focusKey="dialog:cancel" onPress={() => setPicked(null)}
                    style={{ height: 64, paddingHorizontal: 30, borderRadius: 10, backgroundColor: '#212125', alignItems: 'center', justifyContent: 'center' }}>
                    <FocusRing />
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 24, color: colors.fg }}>{t('common.cancel')}</Text>
                  </motion.View>
                </View>
              </View>
            </FocusScope>
          </View>
        ) : null}
      </View>
    </FocusScope>
  );
}
