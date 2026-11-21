/* Preview screenshots of the category picker and five equipment pages.
   Serves the folder over http (python3 -m http.server on a free port), so it
   also proves the lazy load of data-equip.js works over http.
   Run: node shots-preview.mjs [outdir]   (default ~/Claude/avas-preview-inputs/shots) */
import { chromium } from "playwright";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import net from "net";
import os from "os";
import path from "path";
import fs from "fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(os.homedir(), "Claude/avas-preview-inputs/shots");
fs.mkdirSync(out, { recursive: true });

const port = await new Promise(res => {
  const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: dir, stdio: "ignore" });
const base = `http://127.0.0.1:${port}/index.html`;
for (let i = 0; i < 50; i++) {
  try { await fetch(base); break; } catch { await new Promise(r => setTimeout(r, 100)); }
}

const PAGES = [
  ["02-yamaha-f250",   "outboards",     "yamaha-f250-f300-v6-4.2l-2010"],
  ["03-yanmar-6hym",   "marine_diesel", "yanmar-6hym-wet"],
  ["04-cummins-genset","generators",    "cummins-kta50g3-genset"],
  ["05-honda-wb30xt3", "pumps",         "honda-wb30xt-water-pump"],
  ["06-komatsu-pc200", "machinery",     "komatsu-pc200-8"],
];
const SIZES = [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]];

const browser = await chromium.launch();
let fail = 0;
const written = [];
for (const [label, viewport] of SIZES) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: label === "mobile" ? 2 : 1 });
  const page = await ctx.newPage();
  const errors = [];
  const equipReqs = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", r => { if (r.url().includes("data-equip.js")) equipReqs.push(r.url()); });

  /* 01: default page, picker visible, no equipment request */
  await page.goto(base);
  await page.waitForTimeout(700);
  if (equipReqs.length) { fail++; console.log(`FAIL ${label}: data-equip.js requested on default load`); }
  await page.locator("#vertChips").scrollIntoViewIfNeeded();
  const f1 = path.join(out, `01-picker-${label}.png`);
  await page.screenshot({ path: f1 }); written.push(f1);

  /* lazy load over http by clicking a category */
  await page.click('[data-vertical="outboards"]');
  await page.waitForSelector(".eqcard", { timeout: 10000 });
  if (!equipReqs.length) { fail++; console.log(`FAIL ${label}: data-equip.js not requested after picking a category`); }
  else console.log(`ok   ${label}: data-equip.js lazy-loaded over http after picking Outboards`);

  for (const [name, v, model] of PAGES) {
    await page.goto(`${base}?v=${v}&m=${encodeURIComponent(model)}`);
    await page.waitForSelector(".eqcard", { timeout: 10000 });
    await page.waitForTimeout(300);
    const n = await page.locator(".card").count();
    console.log(`ok   ${label}: ${name} — ${n} cards`);
    /* viewport shot with the results header and first cards in view */
    await page.evaluate(() => {
      const el = document.querySelector(".rhead");
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (document.querySelector('.bar').offsetHeight + 8));
    });
    await page.waitForTimeout(200);
    const fv = path.join(out, `${name}-${label}.png`);
    await page.screenshot({ path: fv }); written.push(fv);
    if (label === "desktop") {
      await page.evaluate(() => window.scrollTo(0, 0));
      const ff = path.join(out, `${name}-${label}-full.png`);
      await page.screenshot({ path: ff, fullPage: true }); written.push(ff);
    }
  }
  if (errors.length) { fail++; console.log(`FAIL ${label}: JS errors → ${errors.join(" | ")}`); }
  await ctx.close();
}
await browser.close();
server.kill();
console.log("\n" + written.join("\n"));
console.log(fail ? `\n${fail} problem(s)` : "\nAll screenshots written");
process.exit(fail ? 1 : 0);
