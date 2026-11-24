/* Bundles the site into one self-contained HTML file.
   Used for hosts that block external requests (no font CDN, no separate assets).
   Run: node build.js  →  dist/avas-parts.html */
const fs = require("fs");
const path = require("path");

const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

const { loadData, writeData, stripStaff } = require("./tools/staff-fields");

let html = read("index.html");
let css  = read("styles.css");
/* Cost, bin, re-order point and held quantity are counter data. data.js should
   already be clean (tools/split-staff.js); strip again so dist never ships them. */
const parsed = loadData(read("data.js"));
const leaked = Object.keys(stripStaff(parsed.D.PARTS));
if (leaked.length) console.warn(`data.js still had staff fields on ${leaked.length} parts — stripped from dist; run node tools/split-staff.js`);
const data = writeData(parsed);
const art  = read("art.js");
const app  = read("app.js");
/* The live site lazy-loads data-equip.js with a <script> tag. The bundle is for
   hosts that block every extra request, so the equipment catalogue is inlined;
   app.js sees the EQUIP global and skips the request. */
let equip = "";
try { equip = read("data-equip.js"); } catch { console.warn("data-equip.js missing — run node tools/build-equip.js; bundling bikes only"); }
/* Optional — only exists once import-images.js has been run. */
let images = "";
try { images = read("images.js"); } catch { images = "const IMAGES = {};"; }

/* System-font stack — no CDN available in the sandboxed host.
   Condensed grotesques for display, keeping the technical-catalogue voice. */
css = css
  .replace(
    /--f-disp: .*?;/,
    `--f-disp: "Avenir Next Condensed", "Helvetica Neue Condensed", "Roboto Condensed", "Arial Narrow", system-ui, sans-serif;`)
  .replace(
    /--f-body: .*?;/,
    `--f-body: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;`)
  .replace(
    /--f-mono: .*?;/,
    `--f-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;`)
  .replace(
    /--f-dv: .*?;/,
    `--f-dv: "MV Faseyha", "Faruma", "A_Faruma", var(--f-body);`);

/* Strip the font CDN links and inline the assets.
   Replacements go through a function, never a string: `$$` and `$&` inside a
   String.replace replacement are escapes, and app.js defines `const $$`. */
html = html
  .replace(/<link rel="preconnect"[^>]*>\s*/g, "")
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, "")
  .replace(/<link rel="stylesheet" href="styles\.css">/, () => `<style>\n${css}\n</style>`)
  .replace(/<script src="data\.js"><\/script>\s*<script src="images\.js"><\/script>\s*<script src="art\.js"><\/script>\s*<script src="app\.js"><\/script>/,
           () => `<script>\n${data}\n${equip}\n${images}\n${art}\n${app}\n</script>`);

/* Sanity: nothing external may remain */
const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
if (external.length) {
  console.error("External references still present:\n  " + external.join("\n  "));
  process.exit(1);
}
/* Links the UI renders at runtime never show up as static attributes, so the UI
   code itself is checked. Source / fiche / catalogue URLs may stay in the data
   files as strings; the UI must never read them. Allowed when rendered:
   bearing.wiki, BNF PLUS references, the shop WhatsApp (wa.me), mailto:order@avas.parts,
   same-origin / relative links and Cloudflare Turnstile. */
const fail = (msg) => { console.error(msg); process.exit(1); };
const ui = { "index.html": read("index.html"), "app.js": app, "art.js": art };
const ALLOWED_URL = /^(https:\/\/(bearing\.wiki|wa\.me|challenges\.cloudflare\.com)\/|mailto:order@avas\.parts$)/;
const SOURCE_UI = [
  [/\bsourceLinks\b/, "sourceLinks()"],
  [/\bsrclink\b|\bsrclist\b|\bmnote-src\b/, "source-link markup (srclink / srclist / mnote-src)"],
  [/<h4>\s*Source/i, "a Source heading"],
  [/No source link recorded/, "the 'No source link recorded' line"],
  [/\.(source_url|sources|catalogue_url|manual_url|urls)\b|\[["'](source_url|sources|catalogue_url|manual_url|urls)["']\]/,
   "a read of source_url / sources / catalogue_url / manual_url / EQUIP.urls"],
];
for (const [file, code] of Object.entries(ui)) {
  for (const [re, what] of SOURCE_UI) {
    const m = code.match(re);
    if (m) fail(`${file} renders outside source links: ${what} (near "${m[0]}")`);
  }
  for (const m of code.matchAll(/(?:href|src)\s*=\s*["'`]?((?:https?:|mailto:)[^"'`\s>]*)/gi)) {
    if (m[1].startsWith("https://fonts.") && file === "index.html") continue; // stripped above
    if (!ALLOWED_URL.test(m[1])) fail(`${file} renders an outside link: ${m[1]}`);
  }
  for (const m of code.matchAll(/["'`](https?:\/\/[^"'`\s$]+)/g)) {
    if (m[1].startsWith("https://fonts.") && file === "index.html") continue;
    if (!ALLOWED_URL.test(m[1]) && !m[1].startsWith("http://www.w3.org/")) fail(`${file} carries an outside URL: ${m[1]}`);
  }
}
/* Interpolated hrefs: only the WhatsApp builder and the order-tracking link the
   orders API returns may feed an href. */
for (const m of app.matchAll(/href="\$\{([^}]*)\}"/g)) {
  if (!/^esc\((waURL\(|track\))/.test(m[1].trim())) fail(`app.js interpolates an unexpected href: ${m[1]}`);
}

/* Rendered text (notes, names, notices, catalogue labels, UI copy) must not
   name an outside site or domain; internal URL fields may. */
const domHits = require("./tools/rendered-text").renderedDomainHits(__dirname);
if (domHits.length) fail("rendered text names an outside site:\n  " +
  domHits.slice(0, 20).map(h => `${h.where}: ${h.found.join(", ")}`).join("\n  "));

/* No counter view and no staff data in dist. */
const COUNTER = [
  [/modeSwitch|data-skin|avas\.skin|applySkin|\bstate\.skin\b/, "the Shop/Counter view switch"],
  [/>\s*Counter\s*</, "a Counter button"],
  [/staffbox/, "the staffbox"],
  [/>\s*(Margin|Cost|Bin|Re-order)\s*</, "a Margin / Cost / Bin / Re-order label"],
  [/["']?\b(cost|bin|rop)\b["']?\s*:\s*(-?\d|"|null)/, "a cost / bin / rop data field"],
  [/\bp\.(cost|bin|rop)\b/, "a read of p.cost / p.bin / p.rop"],
];
for (const [re, what] of COUNTER) {
  const m = html.match(re);
  if (m) fail(`dist contains ${what} (near "${m[0]}")`);
}
const qty = [...html.matchAll(/"stock":\s*(-?\d+(?:\.\d+)?)/g)].map(m => +m[1]).filter(n => n !== 0 && n !== 1);
if (qty.length) fail(`dist ships exact stock quantities (${qty.slice(0, 5).join(", ")}); stock must be a 0/1 flag`);

for (const marker of ["styles.css", "data.js", "images.js", "art.js", "app.js"]) {
  if (html.includes(`"${marker}"`)) { console.error("Un-inlined asset: " + marker); process.exit(1); }
}

/* The inlined script must still parse, and must match the source byte for byte
   in the places replacement-string escapes would have mangled. */
const inlined = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
try { new Function(inlined); }
catch (e) { console.error("Inlined script does not parse: " + e.message); process.exit(1); }
for (const token of ["const $$", "const $ ", "$$(", "$("]) {
  if (!inlined.includes(token)) { console.error("Inlining mangled the source near: " + token); process.exit(1); }
}

fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "dist", "avas-parts.html"), html);
console.log(`dist/avas-parts.html — ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB, fully self-contained`);

/* Second target: hosts that supply their own <!doctype>/<html>/<head>/<body>
   skeleton and want page content only, with <title> near the top. */
const pick = (re) => { const m = html.match(re); return m ? m[0] : ""; };
const title = pick(/<title>[\s\S]*?<\/title>/);
const style = pick(/<style>[\s\S]*?<\/style>/);
const meta  = pick(/<meta name="description"[^>]*>/);
const body  = html.slice(html.indexOf("<body>") + 6, html.lastIndexOf("</body>")).trim();

const frag = [title, meta, style, body].filter(Boolean).join("\n");
for (const t of ["<!doctype", "<html", "<head>", "<body>"]) {
  if (frag.toLowerCase().includes(t)) { console.error("Fragment still contains " + t); process.exit(1); }
}
if (!title || !style || !frag.includes("<script>")) { console.error("Fragment is missing title, style or script"); process.exit(1); }
fs.writeFileSync(path.join(__dirname, "dist", "avas-parts.fragment.html"), frag);
console.log(`dist/avas-parts.fragment.html — ${(Buffer.byteLength(frag) / 1024).toFixed(1)} KB, content only`);
