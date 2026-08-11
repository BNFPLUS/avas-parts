/* Bundles the site into one self-contained HTML file.
   Used for hosts that block external requests (no font CDN, no separate assets).
   Run: node build.js  →  dist/avas-parts.html */
const fs = require("fs");
const path = require("path");

const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

let html = read("index.html");
let css  = read("styles.css");
const data = read("data.js");
const app  = read("app.js");

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
  .replace(/<script src="data\.js"><\/script>\s*<script src="app\.js"><\/script>/,
           () => `<script>\n${data}\n${app}\n</script>`);

/* Sanity: nothing external may remain */
const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
if (external.length) {
  console.error("External references still present:\n  " + external.join("\n  "));
  process.exit(1);
}
for (const marker of ["styles.css", "data.js", "app.js"]) {
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
