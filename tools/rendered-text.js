/* Finds outside website / domain names in text the site renders.

   Rendered: part and model names, notes, notices, catalogue labels, cross-
   reference numbers and lookup tables in data.js and data-equip.js, plus the
   UI copy in app.js (string and template literals) and index.html (markup,
   minus <link>/<script src> tags and xmlns). Not rendered, so not scanned:
   source_url, sources, catalogue_url, manual_url, sheesha_url, EQUIP.urls,
   p.src, ids and fit lists. Those may keep outside URLs as internal data.

   A hit is a hostname (parsunparts.com, honda.mv, www.x), a pasted URL, or the
   name of a site the data itself links to (partsvu, webike, mototh,
   bike-parts-honda: the hostname labels from the internal URLs, minus maker
   names such as Honda or Cummins). Allowed: avas.parts (and its subdomains /
   order@ address), bearing.wiki, wa.me, and the Turnstile script host.

     const { renderedDomainHits } = require("./tools/rendered-text");
     renderedDomainHits(rootDir)  // [{ where, found, text }]  */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TLD = "com|net|org|mv|eu|co|uk|th|vn|jp|io|parts|wiki|me|shop|store|info|biz|de|fr|au|in|cn|tw|my|id|ph|sg|nz|us|ca|hu|ru|tv|app|dev|site|online|za";
const HOST = new RegExp(`(?:https?://|www\\.)[^\\s)"'<>]*|\\b(?:[a-z0-9-]+\\.)+(?:${TLD})\\b`, "gi");
const ALLOWED = /^(?:(?:[a-z0-9-]+\.)*avas\.parts|bearing\.wiki|wa\.me|https:\/\/wa\.me\/.*|challenges\.cloudflare\.com|https:\/\/challenges\.cloudflare\.com\/.*|https:\/\/(?:api\.)?avas\.parts\/?.*)$/i;
/* Rendered data fields. Lookup tables (CATS, FAMILY, GROUP, ZONES, verticals,
   cats) are rendered whole. */
const FIELDS = ["name", "note", "notice", "catalogue_name", "catalogue", "engine", "kind",
  "model_number", "aka", "alts", "oem", "years", "size", "unit", "units", "tagline", "hours", "email"];

function load(root) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8") +
    "\n;globalThis.__D = {MODELS, PARTS, CATS, ZONES, FAMILY, GROUP, SHOP};", ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "data-equip.js"), "utf8") + "\n;globalThis.__E = EQUIP;", ctx);
  return { D: ctx.__D, E: ctx.__E };
}

/* Second-level labels of every host the internal URL data points at. */
function siteLabels(D, E) {
  const urls = [...E.urls];
  const add = (u) => { if (typeof u === "string" && /^https?:/.test(u)) urls.push(u); };
  for (const p of D.PARTS) { add(p.source_url); (p.sources || []).forEach(add); }
  for (const m of [...D.MODELS, ...E.models]) {
    add(m.catalogue_url); add(m.manual_url); add(m.sheesha_url);
    if (m.sold_by_sheesha_as) add(m.sold_by_sheesha_as.url);
  }
  const makers = new Set([...D.MODELS, ...E.models].map(m => m.brand.toLowerCase().replace(/[^a-z0-9]/g, "")));
  makers.add("brp"); // Sea-Doo's maker, named as a maker in notes
  const labels = new Set();
  for (const u of urls) {
    let h;
    try { h = new URL(u).hostname.replace(/^www\./, "").split("."); } catch { continue; }
    const i = h.length > 2 && /^(co|com|org|net|gov|ac)$/.test(h[h.length - 2]) ? h.length - 3 : h.length - 2;
    if (h[i] && !makers.has(h[i].replace(/-/g, ""))) labels.add(h[i]);
  }
  return [...labels];
}

function scan(text, where, labelRe, hits) {
  if (typeof text !== "string" || !text) return;
  const found = [...text.matchAll(HOST)].map(m => m[0]).filter(h => !ALLOWED.test(h));
  for (const m of text.matchAll(labelRe)) found.push(m[0]);
  if (found.length) hits.push({ where, found: [...new Set(found)], text: text.slice(0, 200) });
}

function walk(o, where, labelRe, hits) {
  if (typeof o === "string") scan(o, where, labelRe, hits);
  else if (Array.isArray(o)) o.forEach((x, i) => walk(x, `${where}[${i}]`, labelRe, hits));
  else if (o && typeof o === "object") for (const k of Object.keys(o)) walk(o[k], `${where}.${k}`, labelRe, hits);
}

function fields(o, where, labelRe, hits) {
  for (const k of FIELDS) if (k in o) walk(o[k], `${where}.${k}`, labelRe, hits);
}

/* String and template-literal text of a JS source, without ${...} code.
   A small lexer: comments, regex literals and nested templates are skipped. */
function jsLiterals(src) {
  const out = [], tpl = [];            // tpl: brace depth per open template
  let i = 0, prev = "(", braces = 0;
  const readStr = (q) => { let j = i + 1, t = "";
    while (j < src.length && src[j] !== q) { if (src[j] === "\\") t += src[j++]; t += src[j++]; }
    out.push(t); i = j + 1; prev = "a"; };
  const readTpl = () => { let t = "";
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") { t += src[i] + src[i + 1]; i += 2; continue; }
      if (c === "`") { i++; out.push(t); prev = "a"; return; }
      if (c === "$" && src[i + 1] === "{") { out.push(t); i += 2; tpl.push(braces); braces = 0; prev = "("; return; }
      t += c; i++;
    }
    out.push(t); };
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && n === "*") { i = src.indexOf("*/", i + 2) + 2 || src.length; continue; }
    if (c === "'" || c === '"') { readStr(c); continue; }
    if (c === "`") { i++; readTpl(); continue; }
    if (c === "/" && /[(,=:[!&|?{};+\-*%<>~^]|^$/.test(prev)) {   // regex literal
      let j = i + 1, cls = false;
      while (j < src.length && (cls || src[j] !== "/")) {
        if (src[j] === "\\") j++; else if (src[j] === "[") cls = true; else if (src[j] === "]") cls = false;
        j++;
      }
      i = j + 1; prev = "a"; continue;
    }
    if (c === "{") braces++;
    if (c === "}") { if (!braces && tpl.length) { braces = tpl.pop(); i++; readTpl(); continue; } braces--; }
    if (!/\s/.test(c)) prev = /[\w$)\]]/.test(c) ? "a" : c;
    if (/[\w$]/.test(c)) { const w = /^[\w$]+/.exec(src.slice(i))[0];
      prev = /^(return|typeof|case|in|of|else|void|yield|await)$/.test(w) ? "(" : "a"; i += w.length; continue; }
    i++;
  }
  return out;
}

/* UI copy: string and template literal text in app.js, markup in index.html. */
function uiCopy(root) {
  const lits = jsLiterals(fs.readFileSync(path.join(root, "app.js"), "utf8"));
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<script\b[^>]*\bsrc=[^>]*>\s*<\/script>/gi, "")
    .replace(/\sxmlns(?::\w+)?="[^"]*"/g, "");
  return { "app.js": lits, "index.html": [html] };
}

function renderedDomainHits(root = path.join(__dirname, "..")) {
  const { D, E } = load(root);
  const labels = siteLabels(D, E).map(l => l.replace(/[-.]/g, "[-. ]?"));
  const labelRe = new RegExp(`\\b(?:${labels.join("|")})\\b`, "gi");
  const hits = [];
  D.PARTS.forEach(p => fields(p, `data.js PARTS ${p.id}`, labelRe, hits));
  D.MODELS.forEach(m => fields(m, `data.js MODELS ${m.id}`, labelRe, hits));
  fields(D.SHOP, "data.js SHOP", labelRe, hits);
  for (const k of ["CATS", "ZONES", "FAMILY", "GROUP"]) walk(D[k], `data.js ${k}`, labelRe, hits);
  E.parts.forEach(p => fields(p, `data-equip.js parts ${p.id}`, labelRe, hits));
  E.models.forEach(m => fields(m, `data-equip.js models ${m.id}`, labelRe, hits));
  walk(E.verticals, "data-equip.js verticals", labelRe, hits);
  walk(E.cats, "data-equip.js cats", labelRe, hits);
  for (const [file, texts] of Object.entries(uiCopy(root))) texts.forEach(t => scan(t, file, labelRe, hits));
  return hits;
}

module.exports = { renderedDomainHits, jsLiterals };

if (require.main === module) {
  const hits = renderedDomainHits();
  for (const h of hits) console.log(`${h.where}: ${h.found.join(", ")}\n    ${h.text}`);
  console.log(hits.length ? `${hits.length} rendered field(s) name an outside site` : "no outside site or domain in rendered text");
  process.exit(hits.length ? 1 : 0);
}
