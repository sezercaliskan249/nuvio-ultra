#!/usr/bin/env node
/**
 * Builds src/<plugin>/index.js -> providers/<plugin>.js with esbuild.
 *
 *   node tools/build.js              # all plugins listed in manifest.json (minified)
 *   node tools/build.js ultra4k      # a single plugin
 *   node tools/build.js --dev        # readable output (no minify) for debugging
 *
 * Target is ES2016 so async/await is down-leveled for Nuvio's JS engine.
 */
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcDir = path.join(root, "src");
const outDir = path.join(root, "providers");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

const args = process.argv.slice(2);
const dev = args.includes("--dev");
const fromManifest = manifest.scrapers.map((s) => path.basename(s.filename, ".js"));
const targets = args.filter((a) => !a.startsWith("-"));
const plugins = targets.length ? targets : fromManifest;

async function build(name) {
  const entry = path.join(srcDir, name, "index.js");
  const out = path.join(outDir, `${name}.js`);
  if (!fs.existsSync(entry)) throw new Error(`src/${name}/index.js not found`);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    outfile: out,
    format: "cjs",
    platform: "neutral",
    target: "es2016",
    minify: !dev,
    legalComments: "none",
    // provided by the Nuvio runtime, never bundled
    external: ["cheerio-without-node-native", "react-native-cheerio", "cheerio", "crypto-js", "axios"],
    banner: { js: `/* ${name} — Nuvio Ultra v${manifest.version} — https://github.com/sezercaliskan249/nuvio-ultra */` },
    logLevel: "warning",
  });
  return fs.statSync(out).size;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  let total = 0;
  for (const p of plugins) {
    const size = await build(p);
    total += size;
    console.log(`✔ providers/${p}.js  ${(size / 1024).toFixed(1)} KB`);
  }
  console.log(`\n${plugins.length} plugin(s), ${(total / 1024).toFixed(1)} KB total${dev ? " (dev build)" : ""}`);
})().catch((e) => {
  console.error("✘ " + e.message);
  process.exit(1);
});
