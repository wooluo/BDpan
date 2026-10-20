// Baidu netdisk API client on top of the engine's Http (text/JSON only).
// Auth travels as cookies we already hold as strings; downloads leave this
// module as plain CDN URLs for the engine's ranged downloader.

import { Http } from '@ps5-react/core';
import { signParams } from './sign.js';

const UA_BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const UA_NETDISK =
  'netdisk;P2SP;3.0.0.8;netdisk;11.12.3;ANG-AN00;android-android;10.0;JSbridge4.4.0;jointBridge;1.1.0;';

class SessionExpired extends Error {
  constructor() { super('Baidu session expired'); this.sessionExpired = true; }
}

function qs(params) {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.join('&');
}

function createClient({ tokens }) {
  const cookie = () => {
    const { bduss, netdiskStoken, stoken } = tokens();
    const parts = [`BDUSS=${bduss}`];
    const pan = netdiskStoken || stoken;
    if (pan) parts.push(`STOKEN=${pan}`);
    return parts.join('; ');
  };
  const get = async (host, pathAndQuery, ua, signal) => {
    const response = await Http.request(`https://${host}${pathAndQuery}`, {
      headers: { 'User-Agent': ua, Cookie: cookie() }, signal, maxBytes: 4 * 1024 * 1024,
    });
    const text = await response.text();
    return { status: response.status, text };
  };
  const getJSON = async (host, pathAndQuery, ua, signal) => {
    const { status, text } = await get(host, pathAndQuery, ua, signal);
    let json;
    try { json = JSON.parse(text); } catch { throw new Error(`${host} answered ${status}, not JSON`); }
    if (json.errno === -6 || json.errno === 111) throw new SessionExpired();
    return json;
  };
  return {
    async list(dir, { order = 'name', desc = false, page = 1, signal } = {}) {
      const json = await getJSON('pan.baidu.com', `/api/list?${qs({
        dir, order, desc: desc ? 1 : 0, clienttype: 0, num: 1000, page,
      })}`, UA_BROWSER, signal);
      if (json.errno !== 0) throw new Error(`list failed (errno ${json.errno})`);
      return (json.list || []).map((entry) => ({
        path: entry.path,
        name: entry.server_filename,
        isDir: entry.isdir === 1,
        size: entry.size || 0,
        modifiedAt: (entry.server_mtime || 0) * 1000,
      }));
    },
    async quota(signal) {
      const json = await getJSON('pan.baidu.com', '/api/quota?checkfree=1&checkexpire=1', UA_BROWSER, signal);
      if (json.errno !== 0) throw new Error(`quota failed (errno ${json.errno})`);
      return { total: json.total || 0, used: json.used || 0 };
    },
    // Signed PCS call -> fresh CDN urls (valid ~8h).
    async locate(path, signal) {
      const { bduss, uid } = tokens();
      const sign = signParams(bduss, uid, Date.now());
      const base = qs({
        app_id: 250528, method: 'locatedownload', path, ver: '4.0', clienttype: 17,
        channel: 0, apn_id: '1_0', freeisp: 0, queryfree: 0, use: 0, es: 1, esl: 1,
        check_blue: 1, ant: 1,
      });
      const signed = `${base}&${qs(sign)}`;
      const response = await Http.request(`https://pcs.baidu.com/rest/2.0/pcs/file?${signed}`, {
        method: 'POST',
        headers: { 'User-Agent': UA_NETDISK, Cookie: cookie(), 'Content-Type': 'application/x-www-form-urlencoded' },
        signal, maxBytes: 4 * 1024 * 1024,
      });
      const text = await response.text();
      let json;
      try { json = JSON.parse(text); } catch { throw new Error(`locate answered HTTP ${response.status}`); }
      if (json.errno === -6) throw new SessionExpired();
      if (json.error_code) throw new Error(`locate failed (${json.error_code}: ${json.error_msg || ''})`);
      const urls = (json.urls || []).map((entry) => entry.url).filter(Boolean);
      if (!urls.length) throw new Error('locate returned no urls');
      return urls;
    },
  };
}

const NETDISK_UA = UA_NETDISK;

export { createClient, SessionExpired, NETDISK_UA };
