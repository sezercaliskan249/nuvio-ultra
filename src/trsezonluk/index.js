/** Ultra SezonlukDizi — Turkish subtitled / dubbed TV series. */
import { makeGetStreams } from "../ultra/core.js";
import { getSezonlukDiziStreams } from "../ultra/sources/sezonlukdizi.js";

module.exports = { getStreams: makeGetStreams({ SezonlukDizi: getSezonlukDiziStreams }, "Ultra SezonlukDizi") };
