/** Ultra Torrent — Torrentio: 4K / 1080p / 720p torrents with seeders. */
import { makeGetStreams } from "../ultra/core.js";
import { getTorrentStreams } from "../ultra/sources/torrentio.js";

module.exports = { getStreams: makeGetStreams({ Torrentio: getTorrentStreams }, "Ultra Torrent") };
