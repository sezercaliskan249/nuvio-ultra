/**
 * Plugin test scripti
 * Kullanım: node test.js
 * veya: node test.js 550 movie
 * veya: node test.js 1396 tv 1 1
 */
const { getStreams } = require('./providers/ultra.js');

async function run() {
  const args = process.argv.slice(2);
  const tmdbId = args[0] || '550'; // Fight Club
  const mediaType = args[1] || 'movie';
  const season = args[2] ? parseInt(args[2], 10) : null;
  const episode = args[3] ? parseInt(args[3], 10) : null;

  console.log(`\n🔍 Test: ${mediaType} TMDB ${tmdbId} ${season ? `S${season}E${episode}` : ''}\n`);

  try {
    const streams = await getStreams(tmdbId, mediaType, season, episode);
    console.log(`\n✅ ${streams.length} stream bulundu:\n`);
    streams.forEach((s, i) => {
      console.log(`${i + 1}. [${s.url && s.url.indexOf('magnet:') === 0 ? 'torrent' : 'direct'}] ${s.name}`);
      console.log(`   Kalite: ${s.quality} | ${s.title}`);
      console.log(`   URL: ${String(s.url).substring(0, 110)}...\n`);
    });
    if (streams.length === 0) {
      console.log('⚠️  Hiç stream dönmedi. Kaynaklar değişmiş olabilir, loglara bakın.');
    }
  } catch (e) {
    console.error('❌ Hata:', e);
  }
}

run();
