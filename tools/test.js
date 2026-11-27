#!/usr/bin/env node
/**
 * Smoke test: runs every plugin in manifest.json once and prints a summary.
 *   node tools/test.js            # movie 603 (The Matrix) + tv 1396 S1E1 (Breaking Bad)
 *   node tools/test.js 27205 movie
 * Some sources block datacenter IPs (111477, Movy) or sit behind Cloudflare
 * (Webteizle); those show their 🔍 reason instead of links.
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const [id, type] = process.argv.slice(2);
const cases = id ? [[id, type || "movie"]] : [["603", "movie"], ["1396", "tv", 1, 1]];

(async () => {
  const log = console.log;
  for (const [tmdb, t, s, e] of cases) {
    log(`\n▶ ${t} ${tmdb}${s ? ` S${s}E${e}` : ""}`);
    for (const sc of manifest.scrapers) {
      if (!sc.supportedTypes.includes(t)) continue;
      const { getStreams } = require(path.join(root, sc.filename));
      const t0 = Date.now();
      console.log = () => {};
      let list = [];
      try {
        list = await getStreams(tmdb, t, s || null, e || null);
      } catch (err) {
        list = [{ name: "🔍 crash: " + err.message }];
      }
      console.log = log;
      const real = list.filter((x) => !/^https:\/\/teshis\.invalid/.test(x.url || ""));
      const why = list.find((x) => /🔍/.test(x.name || ""));
      const reason = !real.length && why ? "  " + why.name.replace(/[\u200B-\u200D\u2060]/g, "") : "";
      log(`  ${real.length ? "✔" : "·"} ${sc.name.padEnd(20)} ${String(real.length).padStart(2)} link(s)  ${((Date.now() - t0) / 1000).toFixed(1)}s${reason}`);
    }
  }
})();
