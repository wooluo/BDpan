import { Text, View, motion } from '@ps5-react/core';
import { FocusRing } from './FocusRing.jsx';
import { colors } from './colors.js';
import { useT } from '../i18n/index.js';
import { useSections } from './useSections.js';
import { formatBytes } from '../baidu/queue.js';

function Tab({ label, focusKey, current, onPress }) {
  return (
    <motion.View focusKey={focusKey} onPress={onPress}
      style={{ position: 'relative', height: 60, paddingHorizontal: 26, borderRadius: 14999, alignItems: 'center', justifyContent: 'center' }}>
      <FocusRing round="full" />
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 23, color: current ? colors.fg : '#f2f2f3a6' }}>{label}</Text>
    </motion.View>
  );
}

function Header({ children, quota }) {
  const t = useT();
  const { section, on, keyOf } = useSections();
  return (
    <View style={{ width: 1920, height: 1080 }}>
      <View style={{ position: 'absolute', left: 40, top: 22, flexDirection: 'row', alignItems: 'center', gap: 24, zIndex: 10 }}>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 30, color: colors.fg }}>{t('app.title')}</Text>
        <Tab label={t('section.browser')} focusKey={keyOf('browser')} current={section === 'browser'} onPress={on.browser} />
        <Tab label={t('section.downloads')} focusKey={keyOf('downloads')} current={section === 'downloads'} onPress={on.downloads} />
      </View>
      {quota ? (
        <Text style={{ position: 'absolute', right: 40, top: 34, fontFamily: 'Inter-Regular', fontSize: 20, color: colors.muted }}>
          {formatBytes(quota.used)} / {formatBytes(quota.total)}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export { Header };
