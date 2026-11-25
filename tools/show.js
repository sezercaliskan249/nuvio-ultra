#!/usr/bin/env node
/**
 * Prints a plugin's results the way Nuvio shows them.
 *   node tools/show.js <plugin> <tmdbId> <movie|tv> [season episode]
 *   node tools/show.js ultra4k 603 movie
 *   node tools/show.js trsezonluk 1396 tv 1 1
 */
const path = require("path");
const [plugin, id, type = "movie", s, e] = process.argv.slice(2);
if (!plugin || !id) {
  console.log("usage: node tools/show.js <plugin> <tmdbId> <movie|tv> [season episode]");
  process.exit(1);
}
const { getStreams } = require(path.join(__dirname, "..", "providers", plugin + ".js"));
getStreams(id, type, s ? +s : null, e ? +e : null).then((list) => {
  console.log(`\n== ${list.length} result(s)`);
  list.forEach((x) => {
    console.log("┌ " + x.name.replace(/[\u200B-\u200D\u2060]/g, ""));
    console.log((x.quality || "").split("\n").map((l) => "│ " + l).join("\n"));
  });
});
