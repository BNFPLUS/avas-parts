/* Preview screenshots of the Diving section (desktop 1280 and 390px mobile).
   Serves the folder over http, like shots-preview.mjs, so the lazy load of
   data-dive.js is exercised the way the live site does it.
   Run: node shots-dive.mjs [outdir]   (default ~/Claude/avas-preview-inputs/dive/shots) */
import { chromium } from "playwright";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import net from "net";
import os from "os";
import path from "path";
import fs from "fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(os.homedir(), "Claude/avas-preview-inputs/dive/shots");
fs.mkdirSync(out, { recursive: true });

const port = await new Promise(res => {
  const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
});
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: dir, stdio: "ignore" });
const base = `http://127.0.0.1:${port}/index.html`;
for (let i = 0; i < 50; i++) {
  try { await fetch(base); break; } catch { await new Promise(r => setTimeout(r, 100)); }
}

const SIZES = [["desktop", { width: 1280, height: 900 }], ["mobile390", { width: 390, height: 844 }]];
const browser = await chromium.launch();
let fail = 0;
const written = [];
const shot = async (page, name, full) => {
  const f = path.join(out, name + ".png");
  await page.screenshot({ path: f, fullPage: !!full }); written.push(f);
};
const scrollTo = (page, sel) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (document.querySelector(".bar").offsetHeight + 8));
}, sel);

for (const [label, viewport] of SIZES) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: label === "desktop" ? 1 : 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));

  /* (a) Diving home: group chips + safety note */
  await page.goto(`${base}?v=diving`);
  await page.waitForSelector(".bnfcard", { timeout: 10000 });
  await page.waitForTimeout(300);
  if (await page.locator(".card").count() !== 12 || !(await page.locator("#diveNote").isVisible())) { fail++; console.log(`FAIL ${label}: diving home`); }
  if (label !== "desktop") await scrollTo(page, ".vrow");
  await shot(page, `diving-home-${label}`);
  if (label === "desktop") await shot(page, `diving-home-${label}-full`, true);

  /* (b) Tank neck group */
  await page.goto(`${base}?v=diving&m=dive-tank-neck`);
  await page.waitForSelector(".bnfcard", { timeout: 10000 });
  await page.waitForTimeout(300);
  if (await page.locator(".card").count() !== 2) { fail++; console.log(`FAIL ${label}: tank neck`); }
  await scrollTo(page, label === "desktop" ? "#brandChips" : "#diveNote");
  await page.waitForTimeout(150);
  await shot(page, `diving-tank-neck-${label}`);

  /* valve face group (shows the yoke and DIN face O-rings) */
  await page.goto(`${base}?v=diving&m=dive-valve-face`);
  await page.waitForSelector(".bnfcard", { timeout: 10000 });
  await page.waitForTimeout(300);
  await scrollTo(page, label === "desktop" ? "#brandChips" : ".rhead");
  await page.waitForTimeout(150);
  await shot(page, `diving-valve-face-${label}`);

  /* (c) search AS-014 from the default Bikes page */
  await page.goto(base);
  await page.waitForTimeout(500);
  await page.fill("#q", "AS-014");
  await page.waitForSelector('.bnfcard [data-detail="orn2700"]', { timeout: 10000 });
  await page.waitForTimeout(300);
  if (await page.locator('#vertChips [data-vertical="bikes"][aria-pressed="true"]').count() !== 1) { fail++; console.log(`FAIL ${label}: search left the Bikes page`); }
  await scrollTo(page, ".rhead");
  await page.waitForTimeout(150);
  await shot(page, `search-as014-${label}`);

  if (errors.length) { fail++; console.log(`FAIL ${label}: JS errors → ${errors.join(" | ")}`); }
  await ctx.close();
}
await browser.close();
server.kill();
console.log(written.join("\n"));
console.log(fail ? `\n${fail} problem(s)` : "\nAll screenshots written");
process.exit(fail ? 1 : 0);
