/* Builds data-bnf.js (Belts and Impellers from BNF PLUS stock) and applies the
   BNF PLUS stock tags to the two bike bearings in data.js. Reproducible.

     node tools/build-equip.js   (first: equipment parts + their BNF tags)
     node tools/build-bnf.js

   Inputs (price-free, never edited by hand):
     src-data/bnf/belts.csv       550 Belt rows
     src-data/bnf/impellers.csv   64 Impeller rows
     src-data/bnf/bnf-tags.json   BNF stock tags for parts already on the site
     data-equip.js, data.js       engine parts the impeller xrefs are matched to

   Output: data-bnf.js — `var BNF = {verticals, cats, groups, models, parts, links}`.
   The site loads it lazily, like data-equip.js.

   Rules:
   - Refuses to build if an input has a price / cost column: BNF PLUS prices
     are not public and never reach the site.
   - Every part is price:null, askPrice:true, no cost / bin / rop, no photo,
     no source or catalogue link.
   - Availability is a public flag only: stock / low → stock:1 (In stock);
     indent → stock:0, orderIn:true (Order in).
   - IMP1080 (Sherwood G1010) is a complete pump, not an impeller: skipped.
   - Impeller xrefs are matched to site engine parts by tools/match-impeller-xref.js.
     A match puts that part's engines on the impeller and the impeller SKU on
     the part (links). Nothing else is inferred. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { matchImpellers } = require("./match-impeller-xref");
const { loadData, writeData } = require("./staff-fields");

const root = path.join(__dirname, "..");
const src = (f) => path.join(root, "src-data/bnf", f);

const { parseCSV } = require("./bnf-csv");
const read = (f) => parseCSV(fs.readFileSync(src(f), "utf8"));

const BRAND = { MITSUBOSHI: "Mitsuboshi", MITSUSMI: "Mitsusmi", HENGSHUI: "Hengshui", SHERWOOD: "Sherwood" };
const brandName = (b) => BRAND[b] || b;
const avail = (a) => {
  if (a === "stock" || a === "low") return { stock: 1 };
  if (a === "indent") return { stock: 0, orderIn: true };
  throw new Error("unknown availability " + a);
};
const uniq = (a) => [...new Set(a.filter(Boolean))];

/* ---------- Belts ---------- */
/* Step 1 (type) → Step 2 (group). size orders the groups across the section. */
const TYPES = [
  { brand: "V-ribbed (PK)",     cat: "belt_pk",  catName: "V-ribbed belts (PK)" },
  { brand: "Classical V",       cat: "belt_v",   catName: "Classical V-belts" },
  { brand: "Raw edge & cogged", cat: "belt_raw", catName: "Raw edge & cogged V-belts" },
  { brand: "Timing & metric",   cat: "belt_tm",  catName: "Timing & metric belts" },
];
const TYPE = Object.fromEntries(TYPES.map(t => [t.cat, t]));
const groups = new Map();
function group(cat, slug, name, size, title) {
  const id = "belts-" + slug;
  if (!groups.has(id)) groups.set(id, { id, vertical: "belts", brand: TYPE[cat].brand, name, size, title });
  return id;
}

function beltOf(r) {
  const printed = r.part_number;
  const base = { brand: brandName(r.brand) };
  let m;
  if (r.type === "V-Ribbed Belt") {
    m = printed.match(/^(\d+)\s*PK\s*-?\s*(\d+)$/i);
    if (!m) throw new Error("PK belt without NPK length: " + r.sku + " " + printed);
    const ribs = +m[1], len = +m[2];
    return { ...base, cat: "belt_pk", grp: group("belt_pk", ribs + "pk", `${ribs}PK`, ribs, `${ribs}PK V-ribbed belts`),
      oem: printed, name: `V-ribbed belt ${ribs}PK × ${len} mm`, len };
  }
  if (r.type === "V-Belt" && (m = r.size.match(/^([A-Z])-section · (\d+)$/))) {
    const sec = m[1], len = +m[2];
    const ord = { A: 100, B: 101, M: 102 }[sec] || 103;
    return { ...base, cat: "belt_v", grp: group("belt_v", sec.toLowerCase(), `${sec} section`, ord, `${sec}-section V-belts`),
      oem: `${sec}${len}`, name: `Classical V-belt ${sec}${len}`, len };
  }
  if (r.type === "V-Belt") {
    /* 3L190 (timing L), 5485 (HTD 5M), 13X990Li (metric Li) */
    const len = +((r.size.match(/(\d+)\s*mm(?!.*\d+\s*mm)/) || [])[1] || (printed.match(/(\d{3,4})/) || [])[1] || 0);
    return { ...base, cat: "belt_tm", grp: group("belt_tm", "timing", "Timing & metric", 300, "Timing & metric belts"),
      oem: printed, name: `Belt ${printed}`, len };
  }
  /* Raw edge (REMF / MPMF), raw edge cogged (RECMF, RPF), cogged (HTD). */
  const len = +((r.size.match(/(\d+)\s*mm/) || [])[1] || (printed.match(/(\d{3,4})$/) || [])[1] || 0);
  let slug, name, ord, title;
  if (r.type === "Raw Edge V-Belt") { slug = "rawedge"; name = "Raw edge"; ord = 200; title = "Raw edge V-belts"; }
  else if (r.type === "Raw Edge Cogged V-Belt") { slug = "rawedge-cogged"; name = "Raw edge cogged"; ord = 201; title = "Raw edge cogged V-belts"; }
  else if (r.type === "Cogged V-Belt") { slug = "cogged"; name = "Cogged"; ord = 202; title = "Cogged V-belts"; }
  else throw new Error("unknown belt type " + r.type + " on " + r.sku);
  return { ...base, cat: "belt_raw", grp: group("belt_raw", slug, name, ord, title),
    oem: printed, name: `${title.replace(/s$/, "")} ${printed}`, len };
}

const beltRows = read("belts.csv");
if (beltRows.some(r => r.category !== "Belt")) throw new Error("belts.csv has a non-Belt row");
const belts = beltRows.map(r => {
  const b = beltOf(r);
  const xref = uniq(r.xref.split(",").map(s => s.trim()).filter(s => s && s !== r.part_number && s !== b.oem));
  return {
    id: r.sku.toLowerCase(), vertical: "belts", cat: b.cat, grp: b.grp,
    name: b.name, oem: b.oem, brand: b.brand, sku: r.sku,
    ...(r.alt_sku && r.alt_sku !== r.sku ? { alt_sku: r.alt_sku } : {}),
    size: r.size || null,
    alts: uniq([b.oem !== r.part_number ? r.part_number : "", ...xref]),
    len: b.len,
    fits: [], tier: "brand", price: null, askPrice: true, ...avail(r.availability),
  };
});

/* ---------- Impellers ---------- */
const SKIP = { IMP1080: "Sherwood G1010 Rubber Impeller Pump is a complete pump, not an impeller" };
const impRows = read("impellers.csv");
if (impRows.some(r => r.category !== "Impeller")) throw new Error("impellers.csv has a non-Impeller row");
const skipped = impRows.filter(r => SKIP[r.sku]).map(r => ({ sku: r.sku, pn: r.part_number, why: SKIP[r.sku] }));
/* "ohn Deere DZ108622": the export cut the first letter. */
const tidy = (s) => s.replace(/^ohn Deere\b/, "John Deere").replace(/\s+/g, " ").trim();
const impellers = impRows.filter(r => !SKIP[r.sku]).map(r => {
  const pieces = uniq(r.xref.split(",").map(tidy).filter(s => /\d/.test(s) && s !== r.part_number && !/\($/.test(s)));
  return {
    id: r.sku.toLowerCase(), vertical: "impellers", cat: "imp_flex",
    name: "Flexible impeller", oem: r.part_number, brand: brandName(r.brand), sku: r.sku,
    size: r.size || null,
    alts: pieces,
    fits: [], tier: "brand", price: null, askPrice: true, ...avail(r.availability),
    _xref: r.xref,
  };
});

/* ---------- Match impeller xrefs to engine parts on the site ---------- */
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data-equip.js"), "utf8") + "\n;globalThis.__E = EQUIP;", ctx);
const E = ctx.__E;
const dataSrc = fs.readFileSync(path.join(root, "data.js"), "utf8");
const DATA = loadData(dataSrc);
const sitePartsAll = [...E.parts, ...DATA.D.PARTS];
const SITE = Object.fromEntries(sitePartsAll.map(p => [p.id, p]));
const MODELS = Object.fromEntries([...E.models, ...DATA.D.MODELS].map(m => [m.id, m]));

const hits = matchImpellers(impellers.map(i => ({ sku: i.sku, pn: i.oem, xref: i._xref })), sitePartsAll);
const links = {};
for (const h of hits) {
  const imp = impellers.find(i => i.sku === h.sku), part = SITE[h.partId];
  (links[h.partId] = links[h.partId] || []).push(h.sku);
  imp.fits = uniq([...imp.fits, ...part.fits]);
  imp.xparts = uniq([...(imp.xparts || []), part.id]);
}
for (const i of impellers) delete i._xref;

/* Engine names for impeller fitment chips, so the Impellers page does not need
   the whole equipment catalogue. No links, no notes. */
const models = {};
for (const id of new Set(impellers.flatMap(i => i.fits))) {
  const m = MODELS[id];
  if (!m) throw new Error("matched part fits an unknown model " + id);
  models[id] = Object.fromEntries(["id", "vertical", "brand", "name", "size", "unit", "fam", "model_number", "engine"]
    .filter(k => m[k] != null).map(k => [k, m[k]]));
  if (!models[id].vertical) models[id].vertical = "bikes";
}
/* The matched engine parts, for the impeller drawer ("Same number as"). */
const xparts = {};
for (const id of Object.keys(links)) {
  const p = SITE[id];
  xparts[id] = { id, name: p.name, oem: p.oem, fits: p.fits, vertical: p.vertical || "bikes" };
}

/* ---------- Order: type, group, length, brand ---------- */
const GORDER = [...groups.values()].sort((a, b) => a.size - b.size).map(g => g.id);
belts.sort((a, b) => GORDER.indexOf(a.grp) - GORDER.indexOf(b.grp) || a.len - b.len ||
  a.oem.localeCompare(b.oem, "en", { numeric: true }) || a.brand.localeCompare(b.brand) || a.sku.localeCompare(b.sku));
impellers.sort((a, b) => (b.fits.length ? 1 : 0) - (a.fits.length ? 1 : 0) || a.oem.localeCompare(b.oem, "en", { numeric: true }));
for (const b of belts) delete b.len;

const parts = [...belts, ...impellers];
const ids = new Set([...E.parts, ...DATA.D.PARTS].map(p => p.id));
const clash = parts.filter(p => ids.has(p.id)).map(p => p.id);
if (clash.length) throw new Error("BNF part ids clash with site parts: " + clash.join(", "));
const leak = parts.filter(p => Object.keys(p).some(k => /price_|cost|bin|rop|img|source|catalogue_url|url/i.test(k)));
if (leak.length) throw new Error("BNF parts carry a forbidden field: " + leak.map(p => p.id).join(", "));

const BNF = {
  verticals: [
    { id: "belts", name: "Belts", unit: "belt", units: "belts" },
    { id: "impellers", name: "Impellers", unit: "impeller", units: "impellers" },
  ],
  cats: [...TYPES.map(t => ({ id: t.cat, name: t.catName })), { id: "imp_flex", name: "Flexible impellers" }],
  groups: GORDER.map(id => groups.get(id)),
  models, xparts, links, parts,
};
const banner = "/* avas.parts Belts + Impellers from BNF PLUS stock. GENERATED by tools/build-bnf.js from src-data/bnf/ — do not edit.\n" +
  "   Every part is ask-for-price (price:null, askPrice:true). stock is a public flag only. No prices, no photos, no links. */\n";
fs.writeFileSync(path.join(root, "data-bnf.js"), banner + "var BNF=" + JSON.stringify(BNF) + ";\n");

/* ---------- BNF stock tags on the bike bearings (data.js) ---------- */
const TAGS = JSON.parse(fs.readFileSync(src("bnf-tags.json"), "utf8"));
const byId = Object.fromEntries(DATA.D.PARTS.map(p => [p.id, p]));
let bikeTagged = 0;
for (const t of TAGS.bike) {
  const p = byId[t.id];
  if (!p || p.oem !== t.oem) throw new Error(`bike tag ${t.id} ${t.oem}: part missing or number changed`);
  p.bnf = t.bnf; bikeTagged++;
}
const out = writeData(DATA);
if (out !== dataSrc) fs.writeFileSync(path.join(root, "data.js"), out);

/* ---------- Report ---------- */
const count = (list, f) => list.reduce((o, x) => { const k = f(x); o[k] = (o[k] || 0) + 1; return o; }, {});
console.log(`data-bnf.js written (${fs.statSync(path.join(root, "data-bnf.js")).size} bytes)`);
console.log(`belts: ${belts.length} of ${beltRows.length} rows`);
for (const g of BNF.groups) console.log(`  ${g.brand.padEnd(18)} ${g.name.padEnd(16)} ${belts.filter(b => b.grp === g.id).length}`);
console.log(`impellers: ${impellers.length} of ${impRows.length} rows; skipped: ${skipped.map(s => `${s.sku} (${s.pn}: ${s.why})`).join("; ")}`);
console.log(`availability: ${JSON.stringify(count(parts, p => p.orderIn ? "order in" : "in stock"))}`);
console.log(`impeller xref matches: ${hits.length} (part, impeller) pairs on ${Object.keys(links).length} site parts`);
for (const h of hits) console.log(`  ${h.sku} ${h.token} → ${h.partId} ${h.oem} (${SITE[h.partId].name}; ${SITE[h.partId].fits.join(", ")})`);
console.log(`impellers with engine fitment: ${impellers.filter(i => i.fits.length).length}`);
console.log(`bike BNF stock tags in data.js: ${bikeTagged}${out !== dataSrc ? " (data.js updated)" : " (unchanged)"}`);
