// Her direkt linkin gerçekten video döndürdüğünü doğrular
const { getStreams } = require('./providers/ultra.js');
const [, , id = '693134', type = 'movie', s, e] = process.argv;
const log = console.log; console.log = () => {};
(async () => {
  const streams = await getStreams(id, type, s ? +s : null, e ? +e : null);
  console.log = log;
  const direct = streams.filter(x => !x.url.startsWith('magnet:'));
  let ok = 0;
  await Promise.all(direct.map(async (x, i) => {
    const h = Object.assign({ 'User-Agent': 'ExoPlayerLib/2.19.1' }, x.headers || {}, { Range: 'bytes=0-65535' });
    const t = Date.now();
    try {
      const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 15000);
      const r = await fetch(x.url, { headers: h, signal: ac.signal });
      const ct = r.headers.get('content-type') || '';
      const reader = r.body.getReader(); const { value } = await reader.read(); reader.cancel().catch(()=>{}); clearTimeout(to);
      const buf = Buffer.from(value || []);
      const isM3u8 = buf.slice(0, 7).toString() === '#EXTM3U';
      const mkv = buf.slice(0, 4).toString('hex') === '1a45dfa3';
      const mp4 = buf.slice(4, 8).toString() === 'ftyp';
      const good = (r.status === 200 || r.status === 206) && (isM3u8 || mkv || mp4 || /video|octet|mpegurl/i.test(ct));
      if (good) ok++;
      x._r = `${good ? '✅' : '❌'} ${r.status} ${isM3u8 ? 'm3u8' : mkv ? 'mkv' : mp4 ? 'mp4' : ct} ${r.status === 206 ? '(sarılabilir)' : ''} ${Date.now() - t}ms`;
    } catch (err) { x._r = '❌ ' + err.message; }
  }));
  direct.forEach((x, i) => log(`${String(i + 1).padStart(2)}. ${x.name.padEnd(30)} ${x._r}`));
  log(`\n${ok}/${direct.length} direkt link çalışıyor; torrent: ${streams.length - direct.length}`);
  process.exit(0);
})();
