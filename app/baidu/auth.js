// Baidu account login: the passport QR-code protocol the official app uses.
//   getqrcode -> QR image + sign; poll channel/unicast until the phone confirms;
//   exchange the one-time bduss at qrbdusslogin, which answers with a quirky
//   single-quoted JSONP whose body carries the real bduss/stoken (no cookies
//   are ever read — the engine never exposes Set-Cookie).

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FileSystem, Http, Platform } from '@ps5-react/core';

const UA_BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function grab(body, key) {
  const m = new RegExp(`['"]${key}['"]\\s*:\\s*['"]([^'"]*)['"]`).exec(body || '');
  return m ? m[1] : null;
}

async function getJSON(url, { headers, signal } = {}) {
  const response = await Http.request(url, { headers, signal, maxBytes: 4 * 1024 * 1024 });
  const text = await response.text();
  return { status: response.status, text, json: () => JSON.parse(text) };
}

// The login body quotes some keys with ' and some with ", and escapes inside
// stokenList; per-field regex is the only sane reader.
function parseLoginBody(body) {
  const bduss = grab(body, 'bduss');
  if (!bduss) {
    const no = grab(body, 'no');
    throw new Error(`login exchange failed (no=${no || '?'})`);
  }
  let netdiskStoken = null;
  const listMatch = /['"]stokenList['"]\s*:\s*['"](.*?)['"]\s*[,}]/.exec(body);
  if (listMatch) {
    const inner = listMatch[1].replace(/\\/g, '');
    const m = /netdisk[#,\\'"]+([a-z0-9-]{16,})/i.exec(inner);
    if (m) netdiskStoken = m[1];
  }
  return { bduss, stoken: grab(body, 'stoken') || '', netdiskStoken };
}

function tokensPath(dataDir) {
  return Platform.OS === 'ps5' ? `${dataDir}/baidupan/tokens.json` : `${dataDir}/baidupan/tokens.json`;
}

function readTokens(dataDir) {
  try {
    return JSON.parse(FileSystem.readFile(tokensPath(dataDir)));
  } catch {
    return null;
  }
}

function writeTokens(dataDir, tokens) {
  const dir = `${dataDir}/baidupan`;
  try { FileSystem.mkdir(dir); } catch {}
  const tmp = `${dir}/tokens.json.tmp`;
  FileSystem.writeFile(tmp, JSON.stringify(tokens), { sync: true });
  FileSystem.rename(tmp, tokensPath(dataDir));
}

function clearTokens(dataDir) {
  try { FileSystem.remove(tokensPath(dataDir)); } catch {}
}

async function fetchUid(bduss) {
  const { json } = await getJSON('https://tieba.baidu.com/mo/q/newmoindex', {
    headers: { 'User-Agent': UA_BROWSER, Cookie: `BDUSS=${bduss}` },
  });
  const uid = json()?.data?.uid;
  if (!uid) throw new Error('could not read Baidu uid');
  return uid;
}

function createAuth({ dataDir }) {
  let tokens = readTokens(dataDir);
  return {
    tokens: () => tokens,
    isLoggedIn: () => !!tokens?.bduss,
    async beginQR(signal) {
      const { json } = await getJSON('https://passport.baidu.com/v2/api/getqrcode?lp=pc&qrloginfrom=pc', {
        headers: { 'User-Agent': UA_BROWSER }, signal,
      });
      const data = json();
      if (!data?.sign || !data?.imgurl) throw new Error('QR session refused');
      // The API hands out the image address with or without the leading "//"; normalize both.
      const raw = data.imgurl;
      const imgUrl = raw.startsWith('http') ? raw : raw.startsWith('//') ? `https:${raw}` : `https://${raw}`;
      return { sign: data.sign, imgUrl };
    },
    // One call waits out the server's long poll; resolve = confirmed, reject = keep waiting.
    async waitForScan(sign, signal) {
      const { text } = await getJSON(
        `https://passport.baidu.com/channel/unicast?channel_id=${sign}&callback=this_is_callback`,
        { headers: { 'User-Agent': UA_BROWSER }, signal },
      );
      const inner = /channel_v['"]\s*:\s*['"](.+?)['"]\s*[,}]/.exec(text || '');
      if (!inner) throw new Error('poll ended without an answer');
      const event = JSON.parse(inner[1].replace(/\\"/g, '"'));
      if (event.status !== 0 || !event.v) throw new Error('QR was cancelled on the phone');
      return event.v;
    },
    async complete(tempBduss) {
      const { text } = await getJSON(
        `https://passport.baidu.com/v3/login/main/qrbdusslogin?bduss=${encodeURIComponent(tempBduss)}`,
        { headers: { 'User-Agent': UA_BROWSER } },
      );
      const parsed = parseLoginBody(text);
      parsed.uid = await fetchUid(parsed.bduss);
      tokens = parsed;
      writeTokens(dataDir, parsed);
      return parsed;
    },
    async manualLogin(bduss) {
      const uid = await fetchUid(bduss);
      tokens = { bduss, stoken: '', netdiskStoken: null, uid };
      writeTokens(dataDir, tokens);
      return tokens;
    },
    logout() {
      tokens = null;
      clearTokens(dataDir);
    },
  };
}

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [auth] = useState(() => createAuth({ dataDir: FileSystem.dataDir }));
  const [state, setState] = useState({ ready: true, tokens: auth.tokens() });
  const value = useMemo(() => ({
    ...state,
    async complete(temp) {
      const tokens = await auth.complete(temp);
      setState({ ready: true, tokens });
    },
    async manual(bduss) {
      const tokens = await auth.manualLogin(bduss);
      setState({ ready: true, tokens });
    },
    logout() {
      auth.logout();
      setState({ ready: true, tokens: null });
    },
    raw: auth,
  }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const useAuth = () => useContext(AuthContext);

export { createAuth, useAuth, AuthProvider, fetchUid };
