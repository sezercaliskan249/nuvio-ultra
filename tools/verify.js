#!/usr/bin/env node
/**
 * Checks that every direct link of a plugin really returns video data.
 *   node tools/verify.js <plugin> <tmdbId> <movie|tv> [season episode]
 */
const path = require("path");
const [plugin = "ultrahd", id = "603", type = "movie", s, e] = process.argv.slice(2);
const { getStreams } = require(path.join(__dirname, "..", "providers", plugin + ".js"));
const log = console.log;
console.log = () => {};
(async () => {
  const streams = await getStreams(id, type, s ? +s : null, e ? +e : null);
  console.log = log;
  const direct = streams.filter((x) => /^https?:/.test(x.url) && !/teshis\.invalid/.test(x.url));
  let ok = 0;
  await Promise.all(
    direct.map(async (x) => {
      const h = Object.assign({ "User-Agent": "ExoPlayerLib/2.19.1" }, x.headers || {}, { Range: "bytes=0-65535" });
      const t = Date.now();
      try {
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), 15000);
        const r = await fetch(x.url, { headers: h, signal: ac.signal });
        const ct = r.headers.get("content-type") || "";
        const reader = r.body.getReader();
        const { value } = await reader.read();
        reader.cancel().catch(() => {});
        clearTimeout(to);
        const buf = Buffer.from(value || []);
        const kind = buf.slice(0, 7).toString() === "#EXTM3U" ? "m3u8" : buf.slice(0, 4).toString("hex") === "1a45dfa3" ? "mkv" : buf.slice(4, 8).toString() === "ftyp" ? "mp4" : ct;
        const good = (r.status === 200 || r.status === 206) && /m3u8|mkv|mp4|video|octet|mpegurl/i.test(kind);
        if (good) ok++;
        x._r = `${good ? "✔" : "✘"} ${r.status} ${kind}${r.status === 206 ? " (seekable)" : ""} ${Date.now() - t}ms`;
      } catch (err) {
        x._r = "✘ " + err.message;
      }
    })
  );
  direct.forEach((x, i) => log(`${String(i + 1).padStart(2)}. ${x.name.replace(/[\u200B-\u200D\u2060]/g, "").padEnd(28)} ${x._r}`));
  log(`\n${ok}/${direct.length} direct links OK`);
  process.exit(0);
})();
