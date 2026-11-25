/**
 * Nuvio (yeni sürüm) simülasyonu: kartları Nuvio'nun gösterdiği gibi basar,
 * her eklentinin süresini ve indirdiği veri miktarını ölçer.
 * Kullanım: node nuvio-sim.js <tmdb> <movie|tv> [s e]
 */
const realFetch = global.fetch;
let stats = {};
let current = "?";
global.fetch = async (url, opts = {}) => {
  const tag = current;
  const r = await realFetch(url, opts);
  // Nuvio gibi: gövdeyi 16 MB'a kadar oku
  let bytes = 0;
  const chunks = [];
  if (r.body && (opts.method || "GET") !== "HEAD") {
    const reader = r.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      chunks.push(value);
      if (bytes > 16 * 1024 * 1024) { reader.cancel(); break; }
    }
  }
  const buf = Buffer.concat(chunks);
  const s = (stats[tag] = stats[tag] || { req: 0, bytes: 0, big: [] });
  s.req++; s.bytes += bytes;
  if (bytes > 300000) s.big.push(`${(bytes / 1048576).toFixed(1)}MB ${String(url).slice(0, 70)}`);
  return new Response(buf.length ? buf : null, { status: r.status, statusText: r.statusText, headers: r.headers });
};
Object.defineProperty(Response.prototype, "url", { get() { return this._u || ""; } });

const [id, type, se, ep] = process.argv.slice(2);
const plugins = ["ultratorrent", "ultrahd", "ultra4k"];
(async () => {
  const t0 = Date.now();
  // Nuvio gibi: hepsi paralel, her biri geldiği an ekrana
  await Promise.all(plugins.map(async (p) => {
    const { getStreams } = require(`./providers/${p}.js`);
    current = p;
    const list = await getStreams(id, type, se ? +se : null, ep ? +ep : null);
    const sorted = list.slice().sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name > b.name ? 1 : 0));
    console.log(`\n================ ${p}: ${list.length} kart, ${((Date.now() - t0) / 1000).toFixed(1)} sn'de ekranda ================`);
    sorted.slice(0, process.env.ALL ? 999 : 6).forEach((s) => {
      console.log("┌ " + s.name.replace(/[\u200B-\u200D\u2060]/g, ""));
      console.log((s.quality || "").split("\n").map((l) => "│ " + l).join("\n"));
    });
  }));
  console.log("\n--- Ağ istatistiği (paralel çalıştığı için yaklaşık) ---");
  console.log(JSON.stringify(stats, null, 1));
})();
