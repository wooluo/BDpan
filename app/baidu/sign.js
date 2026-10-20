// Baidu PCS "locatedownload" request signing, matching BaiduPCS-Go's netdisksign
// package. Verified against its unit-test vector:
//   (time=1571140066, uid=10086, bduss="test_bduss")
//   -> rand "b6bb7a6f46899e181baea58798d4fdb889775c2c"

import { md5Hex, sha1Hex } from "./hash.js";

const SALT = "ebrcUYiuxaZv2XGu7KIYKxUrqfnOfpDF";

function devUid(bduss) {
  return md5Hex(bduss).toUpperCase() + "|0";
}

function signParams(bduss, uid, now) {
  const time = Math.floor(now / 1000);
  const devuid = devUid(bduss);
  const rand = sha1Hex(sha1Hex(bduss) + uid + SALT + time + devuid);
  return { time, rand, devuid, cuid: devuid };
}

export { devUid, signParams };
