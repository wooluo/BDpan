import { useSyncExternalStore } from 'react';
import { FocusScope, ScrollView, Text, View, motion } from '@ps5-react/core';
import { FocusRing } from '../ui/FocusRing.jsx';
import { Icon } from '../ui/Icon.jsx';
import { colors } from '../ui/colors.js';
import { useT } from '../i18n/index.js';
import { formatBytes } from './queue.js';

const STATE_LABEL = {
  queued: 'downloads.queued', connecting: 'downloads.connecting', downloading: 'downloads.downloading',
  paused: 'downloads.paused', done: 'downloads.done', error: 'downloads.error',
};

const STATE_COLOR = {
  queued: colors.muted, connecting: colors.muted, downloading: '#7ee081',
  paused: '#ffd166', done: '#7ee081', error: '#ff6b6b',
};

function JobRow({ job, manager }) {
  const t = useT();
  const percent = job.total ? Math.floor((job.written / job.total) * 100) : null;
  const running = job.state === 'downloading' || job.state === 'connecting';
  return (
    <View style={{ borderRadius: 14, backgroundColor: '#17171a', padding: 24, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 24, color: colors.fg }}>{job.filename}</Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 20, color: STATE_COLOR[job.state] || colors.muted }}>
          {t(STATE_LABEL[job.state] || 'downloads.queued')}
        </Text>
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: '#2b2b30', overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, percent ?? 0)}%`, height: 10, backgroundColor: STATE_COLOR[job.state] || colors.muted }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 20, color: colors.muted }}>
          {formatBytes(job.written || 0)} / {formatBytes(job.total || job.sizeBytes || 0)}
        </Text>
        {running ? (
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 20, color: colors.muted }}>{formatBytes(job.bytesPerSecond || 0)}/s</Text>
        ) : null}
        {job.error ? (
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 19, color: '#ff6b6b', textAlign: 'right' }}>{job.error}</Text>
        ) : null}
        <View style={{ flex: job.error ? 0 : 1 }} />
        {running ? (
          <motion.View focusKey={`pause:${job.id}`} onPress={() => manager.pause(job.id)}
            style={actionStyle}>
            <FocusRing />
            <Icon name="pause" size={18} color={colors.fg} fill="none" />
            <Text style={actionTextStyle}>{t('downloads.pause')}</Text>
          </motion.View>
        ) : job.state === 'paused' || job.state === 'error' ? (
          <motion.View focusKey={`resume:${job.id}`} onPress={() => manager.resume(job.id)}
            style={actionStyle}>
            <FocusRing />
            <Icon name="play" size={18} color={colors.fg} fill="none" />
            <Text style={actionTextStyle}>{t('downloads.resume')}</Text>
          </motion.View>
        ) : null}
        <motion.View focusKey={`remove:${job.id}`} onPress={() => manager.remove(job.id)}
          style={actionStyle}>
          <FocusRing />
          <Icon name="trash" size={18} color={colors.fg} fill="none" />
          <Text style={actionTextStyle}>{t('downloads.remove')}</Text>
        </motion.View>
      </View>
    </View>
  );
}

const actionStyle = { flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingHorizontal: 18, borderRadius: 9, backgroundColor: '#212125' };
const actionTextStyle = { fontFamily: 'Inter-Regular', fontSize: 20, color: colors.fg };

export function DownloadsScreen({ manager }) {
  const t = useT();
  const jobs = useSyncExternalStore(manager.subscribe, manager.jobs);

  return (
    <FocusScope focusKey="screen" autoFocus>
      <ScrollView style={{ flex: 1, paddingTop: 20 }} contentContainerStyle={{ paddingHorizontal: 34, paddingBottom: 120, gap: 16 }}>
        {jobs.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 220 }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 26, color: colors.muted }}>{t('downloads.none')}</Text>
          </View>
        ) : jobs.map((job) => (
          <JobRow key={job.id} job={job} manager={manager} />
        ))}
      </ScrollView>
    </FocusScope>
  );
}
