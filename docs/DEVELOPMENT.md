# Development

## Requirements
- Node.js 18+
- `npm install` (installs esbuild plus local copies of the libraries Nuvio provides at runtime)

## Layout

```
manifest.json            Repository manifest read by Nuvio (plugin list + versions)
providers/               Built plugins — the files Nuvio downloads. Never edit by hand.
src/
├── <plugin>/index.js    One folder per plugin: picks which sources it runs
└── ultra/               Shared code
    ├── core.js          Runs sources in parallel, timeouts, dedupe, sorting, 🔍 diagnostics
    ├── format.js        Card design (title / subtitle lines, icons)
    ├── http.js          fetch helpers, timeouts, link health checks
    ├── tmdb.js          Cached TMDB lookups
    ├── m3u8.js          HLS master playlist parser
    ├── lib/b64.js       Pure-JS base64 / UTF-8 (no Buffer / atob in Nuvio)
    ├── sources/         One file per source (111477, Movy, 4KHDHub, …)
    └── tr/              Shared helpers + video host extractors for Turkish sites
tools/
├── build.js             esbuild → providers/ (ES2016, minified; --dev for readable output)
├── test.js              Smoke test of every plugin
├── show.js              Print one plugin's cards like Nuvio does
├── verify.js            Open every direct link and check it returns video
└── serve.js             Serve the repo on your LAN to test an unpublished build
```

`core.js` never imports sources itself. Each `src/<plugin>/index.js` passes only the
sources it needs, so a built plugin contains nothing else:

```js
import { makeGetStreams } from "../ultra/core.js";
import { getVidlinkStreams } from "../ultra/sources/vidlink.js";
import { getVidrockStreams } from "../ultra/sources/vidrock.js";

module.exports = { getStreams: makeGetStreams({ Vidlink: getVidlinkStreams, VidRock: getVidrockStreams }, "Ultra HD") };
```

## Adding a source

1. Create `src/ultra/sources/<name>.js` exporting
   `async function getXStreams(tmdbId, mediaType, season, episode, diag)` that returns
   `[{ url, quality, type: "direct" | "torrent", source, headers?, subtitles?, size? }]`.
   Use `diag.step(msg)` / `diag.fail(msg)` so failures explain themselves.
2. Add its time limit to `TIMEOUTS` in `core.js` and a display name in `format.js`.
3. Add it to a plugin's `index.js` (or create a new plugin folder and a manifest entry).
4. `npm run build && npm run show -- <plugin> 603 movie`.

## Things to know about the Nuvio runtime
- Plugins run in **QuickJS** inside the app. `fetch` is a **synchronous** native bridge:
  requests run one after another even inside `Promise.all`, and a per-request timeout
  can't be enforced (OkHttp waits up to 60 s). Keep request counts low and stop early.
- A plugin has about **60 s** in total; if it's killed, nothing is shown — not even 🔍 lines.
- The new Nuvio card ignores `title` when `name` is set, so all details go into `quality`.
- Cards are sorted alphabetically by label; `core.js` prefixes invisible zero-width
  characters to keep our own order.
- `cheerio-without-node-native` and `crypto-js` are provided by Nuvio (marked external).

## Release process

1. Make changes in `src/`.
2. Bump `version` in `manifest.json` (top level **and** every scraper — Nuvio compares these) and `package.json`.
3. `npm run build && npm test`
4. Add an entry to `CHANGELOG.md`.
5. Commit `Release vX.Y.Z`, tag `vX.Y.Z`, push. Users only need to refresh the repository in Nuvio.
