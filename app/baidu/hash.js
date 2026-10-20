// Pure-JS MD5 + SHA-1 for Baidu's client-side request signing. Written with
// plain arrays and 32-bit integer math only: the console engine build has no
// typed arrays. Not used for anything security-relevant beyond what Baidu's
// own apps compute on device.

function bytesOf(text) {
  const bytes = [];
  for (let i = 0; i < text.length; i++) bytes.push(text.charCodeAt(i) & 0xff);
  return bytes;
}

function hex(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += (bytes[i] & 0xff).toString(16).padStart(2, '0');
  return out;
}

function rotl(x, c) { return ((x << c) | (x >>> (32 - c))) | 0; }

// ---- MD5 ----
const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];
const MD5_K = [];
for (let i = 0; i < 64; i++) MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;

function md5Bytes(input) {
  const len = input.length;
  const withPadding = (((len + 8) >> 6) + 1) * 64;
  const msg = input.slice();
  msg[len] = 0x80;
  for (let i = len + 1; i < withPadding; i++) msg[i] = 0;
  const bitLen = len * 8;
  msg[withPadding - 8] = bitLen & 0xff;
  msg[withPadding - 7] = (bitLen >>> 8) & 0xff;
  msg[withPadding - 6] = (bitLen >>> 16) & 0xff;
  msg[withPadding - 5] = (bitLen >>> 24) & 0xff;
  msg[withPadding - 4] = Math.floor(bitLen / 4294967296) & 0xff;
  msg[withPadding - 3] = 0; msg[withPadding - 2] = 0; msg[withPadding - 1] = 0;
  let a0 = 0x67452301 | 0, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476 | 0;
  for (let off = 0; off < withPadding; off += 64) {
    const M = [];
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      M[i] = (msg[j] | (msg[j + 1] << 8) | (msg[j + 2] << 16) | (msg[j + 3] << 24)) | 0;
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + MD5_K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, MD5_S[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  const out = [];
  const words = [a0, b0, c0, d0];
  for (const word of words) {
    out.push(word & 0xff, (word >>> 8) & 0xff, (word >>> 16) & 0xff, (word >>> 24) & 0xff);
  }
  return out;
}

// ---- SHA-1 ----
function sha1Bytes(input) {
  const len = input.length;
  const withPadding = (((len + 8) >> 6) + 1) * 64;
  const msg = input.slice();
  msg[len] = 0x80;
  for (let i = len + 1; i < withPadding; i++) msg[i] = 0;
  // big-endian 64-bit bit length: high 32 bits at -8..-5, low 32 bits at -4..-1
  const bitLen = len * 8;
  const high = Math.floor(bitLen / 4294967296);
  const low = bitLen % 4294967296;
  msg[withPadding - 8] = (high >>> 24) & 0xff;
  msg[withPadding - 7] = (high >>> 16) & 0xff;
  msg[withPadding - 6] = (high >>> 8) & 0xff;
  msg[withPadding - 5] = high & 0xff;
  msg[withPadding - 4] = Math.floor(low / 16777216) & 0xff;
  msg[withPadding - 3] = Math.floor(low / 65536) & 0xff;
  msg[withPadding - 2] = Math.floor(low / 256) & 0xff;
  msg[withPadding - 1] = low & 0xff;

  let h0 = 0x67452301 | 0, h1 = 0xefcdab89 | 0, h2 = 0x98badcfe | 0, h3 = 0x10325476 | 0, h4 = 0xc3d2e1f0 | 0;
  const w = [];
  for (let off = 0; off < withPadding; off += 64) {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      w[i] = ((msg[j] << 24) | (msg[j + 1] << 16) | (msg[j + 2] << 8) | msg[j + 3]) | 0;
    }
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999 | 0; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1 | 0; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc | 0; }
      else { f = b ^ c ^ d; k = 0xca62c1d6 | 0; }
      const t = (rotl(a, 5) + f + e + k + w[i]) | 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = t;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  const out = [];
  for (const word of [h0, h1, h2, h3, h4]) {
    out.push((word >>> 24) & 0xff, (word >>> 16) & 0xff, (word >>> 8) & 0xff, word & 0xff);
  }
  return out;
}

function md5Hex(text) { return hex(md5Bytes(bytesOf(text))); }
function sha1Hex(text) { return hex(sha1Bytes(bytesOf(text))); }

export { md5Hex, sha1Hex };
