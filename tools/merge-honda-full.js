/* Merges the full Honda kept-parts lists into data.js, and attaches the BNF PLUS
   stock references / bearing.wiki links for bike parts.

     node tools/merge-honda-full.js

   Inputs (copied verbatim from the extractor, never edited by hand):
     src-data/catalogue-2026-11/honda-full-models.json  24 Honda models (5 new Click)
     src-data/catalogue-2026-11/honda-full-parts.json   kept parts from the public
                                                         bike-parts-honda.com fiches
     src-data/catalogue-2026-11/bnf-links.json          BNF PLUS stock / size links

   Like tools/merge-dealers.js this edits data.js in place (data.js is generated
   outside this repo) and writes it back in the same format. Idempotent.

   Rules:
   - No prices or part numbers are invented. New parts are price:null,
     askPrice:true, confirmed:"verify", v:1 (fiche number, still to be checked
     against the frame number), with the fiche page as source.
   - A number already in PARTS is merged onto that part (fits, sources, alts,
     notes, size). Its price, staff fields, name, category and flags are kept.
   - The extractor's alts are suffix lineage (same Honda stem, another suffix
     seen in this set). They stay searchable and are listed in `lineage` so the
     UI does not call them supersessions. The input marks none obsolete.
   - BNF PLUS references carry sku / brand / their number / availability only.
     No price is copied (bnf-links.json has none). */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { sizeObj, bnfRef, bnfSize } = require("./catalogue-refs");

const root = path.join(__dirname, "..");
const IN = path.join(root, "src-data/catalogue-2026-11");
const DATA = path.join(root, "data.js");
const src = fs.readFileSync(DATA, "utf8");
const names = [...src.matchAll(/^const (\w+) = /gm)].map(m => m[1]);
const head = src.slice(0, src.indexOf("const "));
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src + `\n;globalThis.__D = {${names}};`, ctx);
const D = ctx.__D;
const HM = JSON.parse(fs.readFileSync(path.join(IN, "honda-full-models.json"), "utf8"));
const HP = JSON.parse(fs.readFileSync(path.join(IN, "honda-full-parts.json"), "utf8"));
const BNF = JSON.parse(fs.readFileSync(path.join(IN, "bnf-links.json"), "utf8"));
const TAG = "honda-full-2026-11";

const uniq = (a) => [...new Set(a.filter(Boolean))];
const addNote = (p, n) => {
  if (!n) return;
  const cur = (p.note || "").trim();
  if (cur.includes(n)) return;
  p.note = cur ? `${cur}; ${n}` : n;
};
const byOem = new Map(D.PARTS.map(p => [p.oem, p]));
const byId = new Map(D.PARTS.map(p => [p.id, p]));
const CAT_IDS = new Set(D.CATS.map(c => c.id));
const stats = { modelsAdded: [], added: 0, merged: 0, bnf: 0, wiki: 0, size: 0 };

/* ---------- Models ---------- */
/* Family codes for a new model come from the same place as the existing ones:
   the middle code of its air filter / belt / disc / throttle cable numbers. */
const FAMILY_FROM = /^(17210|23100|45251|17910)-([0-9A-Z]{3})-/;
for (const m of HM) {
  if (D.MODELS.some(x => x.id === m.id)) continue;
  if (!m.new_model) throw new Error("model missing from data.js but not marked new: " + m.id);
  const fam = uniq(HP.filter(p => p.fits.includes(m.id)).map(p => (p.oem.match(FAMILY_FROM) || [])[2])).sort();
  D.MODELS.push({
    id: m.id, brand: m.brand, model: m.model, name: m.name, market: m.market,
    /* data.js calls scooters "auto" (automatic), not "scooter" */
    generation: m.generation, years: m.years, cc: m.cc, seg: m.seg === "scooter" ? "auto" : m.seg, pop: 4,
    catalogue_code: m.catalogue_code, catalogue_url: m.catalogue_url, manual_url: null,
    status: m.status,
    note: "Full kept list from the public bike-parts-honda.com fiche (engine, frame, electrical, service/wear); numbers to verify against the frame number.",
    family_codes: fam,
    family_codes_from: "middle code of air filter / belt / disc / throttle cable PNs in catalogue",
    added_by: TAG,
  });
  stats.modelsAdded.push(m.id);
}

/* ---------- Parts ---------- */
/* Fiche names are upper case ("DAMPER SET, WHEEL"). Sentence case reads better;
   words with digits and bracketed maker codes ("20X25X4", "(NOK)") keep their case. */
function niceName(n) {
  if (n !== n.toUpperCase() || !/[A-Z]/.test(n)) return n;
  let depth = 0;
  const out = n.split(/(\s+)/).map(w => {
    const opens = (w.match(/\(/g) || []).length, closes = (w.match(/\)/g) || []).length;
    const inside = depth > 0 || opens > 0;
    depth += opens - closes;
    return inside || /\d/.test(w) ? w : w.toLowerCase();
  }).join("");
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/* Fiche text quirks: "--- " marks a line printed from the French fiche,
   "X --- X" repeats the name, and the extractor cut some names mid-bracket
   ("(NISSI"). The raw text stays in catalogue_name; nothing is translated. */
function cleanName(raw) {
  let n = raw.trim();
  const dup = n.match(/^(.*?)\s+-{3}\s+(.*)$/);
  if (dup && dup[1].toLowerCase() === dup[2].toLowerCase()) n = dup[1];
  n = n.replace(/^-+\s*/, "");
  if ((n.match(/\(/g) || []).length > (n.match(/\)/g) || []).length) {
    n = /\(\s*$/.test(n) ? n.replace(/\s*\(\s*$/, "") : n + "…)";
  }
  return niceName(n);
}

/* A few fiche lines print no name at all ("-"): name the part after the
   fiche diagram it sits on, and say so. */
function partName(h) {
  const n = cleanName(h.name);
  if (/[A-Za-z]/.test(n)) return n;
  const d = ((h.diagrams || [])[0] || {}).diagram;
  if (!d) throw new Error(`no name and no diagram for ${h.oem}`);
  return `${niceName(d.replace(/^-+\s*/, ""))} part (no name on fiche)`;
}

function partSize(h) {
  const s = h.size || {};
  return sizeObj(s.kind, s.designation, s.bore_mm, s.od_mm, s.width_mm);
}

let nextId = Math.max(0, ...D.PARTS.filter(p => /^h\d+$/.test(p.id)).map(p => +p.id.slice(1))) + 1;
for (const h of HP) {
  if (!CAT_IDS.has(h.cat)) throw new Error(`unknown cat ${h.cat} on ${h.oem}`);
  if (h.obsolete) throw new Error(`input marks ${h.oem} obsolete: handle supersession explicitly`);
  const size = partSize(h), wiki = (h.size || {}).wiki || null;
  const sources = uniq([h.source_url, ...(h.sources || [])]);
  const t = byOem.get(h.oem);
  if (t) {
    const before = JSON.stringify(t);
    t.fits = uniq([...t.fits, ...h.fits]);
    t.sources = uniq([...(t.sources || []), t.source_url, ...sources]);
    if (!t.source_url) t.source_url = sources[0];
    t.alts = uniq([...t.alts, ...h.alts]).filter(a => a !== t.oem);
    if (h.alts.length) t.lineage = uniq([...(t.lineage || []), ...h.alts]);
    addNote(t, h.note);
    if (!t.catalogue_name) t.catalogue_name = h.catalogue_name;
    if (size && !t.size) t.size = size;
    if (wiki && !t.wiki) t.wiki = wiki;
    if (JSON.stringify(t) !== before) stats.merged++;
    continue;
  }
  const p = {
    id: "h" + String(nextId++).padStart(4, "0"),
    cat: h.cat, name: partName(h), oem: h.oem, v: 1,
    alts: [...h.alts], fits: [...h.fits], tier: "genuine",
    price: null, cost: null, stock: null, bin: null, rop: null,
    note: h.note || "",
    catalogue_name: h.catalogue_name, priority: h.priority,
    source_url: sources[0], sources,
    askPrice: true, confirmed: "verify", added_by: TAG,
  };
  if (h.alts.length) p.lineage = [...h.alts];
  if (size) p.size = size;
  if (wiki) p.wiki = wiki;
  D.PARTS.push(p); byOem.set(p.oem, p); byId.set(p.id, p);
  stats.added++;
}

/* ---------- BNF PLUS stock references / bearing.wiki / sizes ---------- */
const missing = [];
for (const r of BNF.filter(r => r.vertical === "bikes")) {
  const t = (r.avas_part_id && byId.get(r.avas_part_id)) || byOem.get(r.avas_oem);
  if (!t || t.oem !== r.avas_oem) { missing.push(r.avas_part_id || r.avas_oem); continue; }
  const ref = bnfRef(r);
  if (ref) t.bnf = ref;
  if (r.bearing_wiki_url) t.wiki = r.bearing_wiki_url;
  const s = bnfSize(r);
  if (s && !t.size) t.size = s;
}
if (missing.length) throw new Error("bnf-links rows with no matching bike part: " + missing.join(", "));
stats.bnf = D.PARTS.filter(p => p.bnf).length;
stats.wiki = D.PARTS.filter(p => p.wiki).length;
stats.size = D.PARTS.filter(p => p.size).length;

/* ---------- Integrity before writing ---------- */
const oems = D.PARTS.map(p => p.oem);
const dupOem = oems.filter((o, i) => oems.indexOf(o) !== i);
if (dupOem.length) throw new Error("duplicate part numbers: " + dupOem.join(", "));
const ids = D.PARTS.map(p => p.id);
const dupId = ids.filter((o, i) => ids.indexOf(o) !== i);
if (dupId.length) throw new Error("duplicate part ids: " + dupId.join(", "));
const mids = new Set(D.MODELS.map(m => m.id));
const dangling = D.PARTS.flatMap(p => p.fits.filter(f => !mids.has(f)).map(f => p.id + "->" + f));
if (dangling.length) throw new Error("dangling fits: " + dangling.join(", "));
if (D.PARTS.some(p => p.bnf && /price/i.test(JSON.stringify(p.bnf)))) throw new Error("a BNF reference mentions a price");

/* ---------- Write back in the generator's format ---------- */
const out = head + names.map(n => `const ${n} = ${n === "BRANDS"
  ? "[" + D[n].map(s => JSON.stringify(s)).join(", ") + "]"
  : JSON.stringify(D[n], null, 1)};`).join("\n") + "\n";
fs.writeFileSync(DATA, out);

const count = {};
D.PARTS.forEach(p => p.fits.forEach(f => { count[f] = (count[f] || 0) + 1; }));
console.log(`models added: ${stats.modelsAdded.join(", ") || "none"}`);
console.log(`parts added: ${stats.added}, existing parts updated: ${stats.merged}`);
console.log(`parts with BNF reference: ${stats.bnf}, bearing.wiki link: ${stats.wiki}, size: ${stats.size}`);
for (const m of HM) console.log(`  ${m.id.padEnd(36)} ${count[m.id] || 0} parts`);
console.log(`data.js: ${D.MODELS.length} models, ${D.PARTS.length} parts (${(Buffer.byteLength(out) / 1048576).toFixed(2)} MB)`);
