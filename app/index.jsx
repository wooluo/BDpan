import { useEffect, useMemo, useState } from 'react';
import { AppRegistry, View } from '@ps5-react/core';
import { LocaleProvider, useLocale } from './i18n/index.js';
import { NavProvider, useNavState } from './state/nav.jsx';
import { Header } from './ui/Header.jsx';
import { Legend } from './ui/Legend.jsx';
import { Splash } from './ui/Splash.jsx';
import { useInterfaceHaptics } from './ui/haptics.js';
import { useInterfaceSounds } from './ui/sounds.js';
import { AuthProvider, useAuth } from './baidu/auth.js';
import { createClient } from './baidu/api.js';
import { createDownloadManager } from './baidu/queue.js';
import { LoginScreen } from './baidu/LoginScreen.jsx';
import { BrowserScreen } from './baidu/BrowserScreen.jsx';
import { DownloadsScreen } from './baidu/DownloadsScreen.jsx';
import { VERSION } from './version.js';

function App() {
  useInterfaceSounds();
  useInterfaceHaptics();
  const auth = useAuth();
  const { top } = useNavState();
  const { rtl } = useLocale();

  const client = useMemo(() => createClient({ tokens: () => auth.tokens }), [auth.tokens]);
  const manager = useMemo(
    () => createDownloadManager({ client, tokens: () => auth.tokens }),
    [client, auth.tokens],
  );

  if (!auth.tokens) return <LoginScreen />;

  return (
    <View style={[{ width: 1920, height: 1080, backgroundColor: '#0d0d0f' }, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <Header>
        <View
          key={top.name}
          style={{
            position: 'absolute', left: 0, right: 0, top: 96,
            bottom: top.name === 'downloads' ? 0 : 60,
          }}
        >
          {top.name === 'downloads'
            ? <DownloadsScreen manager={manager} />
            : <BrowserScreen manager={manager} client={client} />}
        </View>
        <Legend screen={top.name} />
      </Header>
    </View>
  );
}

function Boot() {
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setBooted(true), 2500);
    return () => clearTimeout(id);
  }, []);
  return (
    <View style={{ width: 1920, height: 1080, backgroundColor: '#0d0d0f' }}>
      {booted ? (
        <LocaleProvider>
          <AuthProvider>
            <NavProvider>
              <App />
            </NavProvider>
          </AuthProvider>
        </LocaleProvider>
      ) : (
        <Splash onDone={() => setBooted(true)} />
      )}
    </View>
  );
}

console.log(`[baidupan] version ${VERSION}`);
AppRegistry.registerComponent('baidupan', () => () => <Boot />);
