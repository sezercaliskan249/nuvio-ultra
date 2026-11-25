/** Ultra FilmModu — Turkish dubbed / subtitled movies. */
import { makeGetStreams } from "../ultra/core.js";
import { getFilmModuStreams } from "../ultra/sources/filmmodu.js";

module.exports = { getStreams: makeGetStreams({ FilmModu: getFilmModuStreams }, "Ultra FilmModu") };
