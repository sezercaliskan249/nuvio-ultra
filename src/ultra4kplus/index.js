/** Ultra 4K+ — Cinejoy (4K HDR10) + CNO (4K) + VidBolt (1080p) HLS, ported from VyseTV's open-source sources. */
import { makeGetStreams } from "../ultra/core.js";
import { getCinejoyStreams } from "../ultra/sources/cinejoy.js";
import { getCnoStreams } from "../ultra/sources/cno.js";
import { getVidboltStreams } from "../ultra/sources/vidbolt.js";

module.exports = {
  getStreams: makeGetStreams({ Cinejoy: getCinejoyStreams, CNO: getCnoStreams, VidBolt: getVidboltStreams }, "Ultra 4K+"),
};
