#!/usr/bin/env node
/**
 * Serves the repo on your local network so Nuvio can load an unpublished build:
 *   node tools/serve.js   ->  add http://<your-pc-ip>:3000/manifest.json in Nuvio
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const root = path.join(__dirname, "..");
const PORT = +process.env.PORT || 3000;
const types = { ".json": "application/json", ".js": "application/javascript" };

http
  .createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const file = path.join(root, decodeURIComponent(req.url.split("?")[0]));
    if (!file.startsWith(root) || !/\.(json|js)$/.test(file)) return res.writeHead(404).end();
    fs.readFile(file, (err, body) => {
      if (err) return res.writeHead(404).end();
      res.writeHead(200, { "Content-Type": types[path.extname(file)] }).end(body);
    });
  })
  .listen(PORT, "0.0.0.0", () => {
    const ip = Object.values(os.networkInterfaces()).flat().find((i) => i.family === "IPv4" && !i.internal);
    console.log(`Manifest: http://${ip ? ip.address : "localhost"}:${PORT}/manifest.json`);
  });
