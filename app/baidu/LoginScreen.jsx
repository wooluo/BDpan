import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Text, View, motion } from '@ps5-react/core';
import { Button2 as Button } from '../ui/Button.jsx';
import { FocusRing } from '../ui/FocusRing.jsx';
import { colors } from '../ui/colors.js';
import { useT } from '../i18n/index.js';
import { useAuth } from './auth.js';

const QR_MS = 5 * 60 * 1000; // the QR itself lives ~10 minutes; refresh earlier

function QRFrame({ url }) {
  return (
    <View style={{ padding: 18, backgroundColor: '#f2f2f3', borderRadius: 18 }}>
      <Image source={{ uri: url }} style={{ width: 320, height: 320 }} resizeMode="contain" />
    </View>
  );
}

export function LoginScreen() {
  const t = useT();
  const auth = useAuth();
  const [session, setSession] = useState(null);   // { sign, imgUrl }
  const [phase, setPhase] = useState('starting'); // starting | waiting | scanned | exchanging | error
  const [error, setError] = useState(null);
  const cancelled = useRef(false);

  const run = useCallback(async () => {
    cancelled.current = false;
    setPhase('starting');
    setError(null);
    try {
      const qr = await auth.raw.beginQR();
      console.log(`[baidupan] QR ok: ${qr.sign} img=${qr.imgUrl.slice(0, 60)}`);
      if (cancelled.current) return;
      setSession(qr);
      setPhase('waiting');
      const deadline = Date.now() + QR_MS;
      while (!cancelled.current && Date.now() < deadline) {
        let temp;
        try {
          temp = await auth.raw.waitForScan(qr.sign);
        } catch (pollError) {
          if (cancelled.current) return;
          if (String(pollError.message).includes('cancelled')) throw pollError;
          continue; // poll timed out or dropped: keep waiting while the QR lives
        }
        if (cancelled.current) return;
        setPhase('exchanging');
        await auth.complete(temp);
        return;
      }
      if (!cancelled.current) setPhase('error'), setError(t('login.expired'));
    } catch (runError) {
      if (cancelled.current) return;
      console.log(`[baidupan] login run failed: ${runError.message || runError}`);
      setPhase('error');
      setError(runError.message || String(runError));
    }
  }, [auth, t]);

  useEffect(() => {
    run();
    return () => { cancelled.current = true; };
  }, [run]);

  const status =
    phase === 'starting' ? t('login.starting')
    : phase === 'waiting' ? t('login.waiting')
    : phase === 'exchanging' ? t('login.exchanging')
    : error || t('login.failed');

  return (
    <View style={{ width: 1920, height: 1080, backgroundColor: '#0d0d0f', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: 34 }}>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 44, color: colors.fg }}>
          {t('login.title')}
        </Text>
        {session && phase !== 'error' ? (
          <QRFrame url={session.imgUrl} />
        ) : (
          <View style={{ width: 356, height: 356, borderRadius: 18, backgroundColor: '#17171a', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 24, color: colors.muted }}>
              {phase === 'error' ? t('login.qrGone') : '…'}
            </Text>
          </View>
        )}
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 26, color: phase === 'error' ? '#ff6b6b' : colors.muted }}>
          {status}
        </Text>
        {phase === 'error' ? (
          <Button variant="primary" icon="restart" label={t('login.retry')} onPress={run} />
        ) : null}
      </View>
    </View>
  );
}
