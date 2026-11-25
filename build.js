#!/usr/bin/env node
/**
 * Build script - src/ultra -> providers/ultra.js
 * Hermes uyumluluğu için async/await -> generator'a çevrilir (esbuild)
 */
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outDir = path.join(__dirname, 'providers');

const EXTERNAL_MODULES = [
  'cheerio-without-node-native',
  'react-native-cheerio',
  'cheerio',
  'crypto-js',
  'axios'
];

function getProvidersToBuild() {
  const args = process.argv.slice(2).filter(arg => !arg.startsWith('-'));
  if (args.length > 0) return args;
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src/ bulunamadı');
    process.exit(1);
  }
  return fs.readdirSync(srcDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

async function buildProvider(providerName, options = {}) {
  const providerDir = path.join(srcDir, providerName);
  const entryPoint = path.join(providerDir, 'index.js');
  const outFile = path.join(outDir, `${providerName}.js`);

  if (!fs.existsSync(entryPoint)) {
    console.warn(`⚠️  Atlanıyor ${providerName}: src/${providerName}/index.js yok`);
    return false;
  }

  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      outfile: outFile,
      format: 'cjs',
      platform: 'neutral',
      target: 'es2016',
      minify: options.minify || false,
      sourcemap: false,
      external: EXTERNAL_MODULES,
      banner: {
        js: `/**\n * ${providerName} - src/${providerName}/ altından üretildi\n * Tarih: ${new Date().toISOString()}\n */`
      },
      logLevel: 'warning'
    });
    const stats = fs.statSync(outFile);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`✅ ${providerName}.js (${sizeKB} KB)`);
    return true;
  } catch (err) {
    console.error(`❌ ${providerName} build hatası:`, err.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldMinify = args.includes('--minify');
  const providers = getProvidersToBuild();
  if (providers.length === 0) {
    console.log('Build edilecek provider yok.');
    return;
  }
  console.log(`\n📦 ${providers.length} provider build ediliyor...\n`);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  let ok = 0, fail = 0;
  for (const p of providers) {
    const r = await buildProvider(p, { minify: shouldMinify });
    r ? ok++ : fail++;
  }
  console.log(`\n✨ Bitti! ${ok} başarılı, ${fail} başarısız\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
