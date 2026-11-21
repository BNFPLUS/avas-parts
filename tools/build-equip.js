/* Builds data-equip.js (marine + equipment catalogue) from the two source files
   in src-data/. Reproducible: same inputs, same output.

     node tools/build-equip.js

   Inputs (copied verbatim, never edited by hand):
     src-data/data-marine.js       VERTICALS, MARINE_CATS, MARINE_MODELS, MARINE_PARTS
     src-data/data-power-next.js   POWER_MODELS, POWER_PARTS (Honda power products, honda.mv)

   Output: data-equip.js — one global, `var EQUIP = {verticals, cats, models, parts}`.
   The site loads it lazily; data.js (bikes) is untouched.

   Rules:
   - No prices are invented. Every part is price:null, askPrice:true.
   - Part numbers are kept exactly as printed (slashes, dashes, spaces).
   - Honda pumps: the honda.mv exact-model lists (WB20XT3, WB30XT3, WT30XK4)
     replace the older marine WB20XT / WB30XT / WT30X models. Marine-only rows for
     those models are kept, re-pointed to the honda.mv model and noted.
   - Rows sharing an OEM number within one vertical merge into one part. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(root, "src-data/data-marine.js"), "utf8") + "\n" +
  fs.readFileSync(path.join(root, "src-data/data-power-next.js"), "utf8") +
  "\n;globalThis.__X = {VERTICALS, MARINE_CATS, MARINE_MODELS, MARINE_PARTS, POWER_MODELS, POWER_PARTS};",
  ctx);
const { VERTICALS, MARINE_CATS, MARINE_MODELS, MARINE_PARTS, POWER_MODELS, POWER_PARTS } = ctx.__X;

/* ---------- Verticals ---------- */
const UNIT = {
  bikes:         ["bike", "bikes"],
  outboards:     ["engine", "engines"],
  marine_diesel: ["engine", "engines"],
  jetski:        ["ski", "skis"],
  generators:    ["set", "sets"],
  pumps:         ["machine", "machines"],
  machinery:     ["machine", "machines"],
};
const verticals = VERTICALS.map(v => ({
  id: v.id,
  name: v.id === "pumps" ? "Pumps & power products" : v.name,
  unit: UNIT[v.id][0],
  units: UNIT[v.id][1],
}));

/* ---------- Categories ---------- */
const cats = MARINE_CATS.map(c => ({ id: c.id, name: c.name }));
const CAT_IDS = new Set(cats.map(c => c.id));

/* ---------- Models ---------- */
/* Several scraped model names are page titles ("PartsVu product", "Yanmar Shop
   (official ...) 6HYM-WET", a kit title). The display name for those is taken
   from the model id; the original title is kept as `src_title` for search. */
const NAME_FIX = {
  "mercury-fourstroke-v8-4.6l-250-300": "FourStroke V8 4.6L 250–300 hp",
  "mercury-verado-l6-200-350":          "Verado L6 200–350 hp",
  "seadoo-gti-130-170-1630ace-2020":    "GTI 130 / 170 (1630 ACE, 2020+)",
  "seadoo-gtx-rxpx-300-1630ace-sc-2016":"GTX / RXP-X 300 (1630 ACE SC, 2016+)",
  "seadoo-spark-900ace-2014":           "Spark (900 ACE, 2014+)",
  "suzuki-df100a-df140a":               "DF100A – DF140A",
  "suzuki-df200-df250-v6-3.6l":         "DF200 / DF250 V6 3.6L",
  "suzuki-df250a-df300a-v6-4.0l":       "DF250A / DF300A V6 4.0L",
  "suzuki-df40a-df60a":                 "DF40A – DF60A",
  "suzuki-df70a-df90a":                 "DF70A – DF90A",
  "yamaha-15hp-2stroke":                "15 hp 2-stroke",
  "yamaha-f115-2014":                   "F115 (2014+)",
  "yamaha-f150-f175-2.7-2.8l":          "F150 / F175 2.7–2.8L",
  "yamaha-f200-f225-v6-3.3l":           "F200 / F225 V6 3.3L",
  "yamaha-f250-f300-v6-4.2l-2010":      "F250 / F300 V6 4.2L (2010+)",
  "yamaha-f250-v6-3.3l":                "F225 / F250 V6 3.3L",
  "yamaha-f40a-2008":                   "F40A (2008+)",
  "yamaha-f50-2006":                    "F50 (2006+)",
  "yamaha-waverunner-fx-1.8l-ho-svho-2009": "WaveRunner FX 1.8L HO / SVHO",
  "yamaha-waverunner-jetblaster-2022":  "WaveRunner JetBlaster (2022+)",
  "yamaha-waverunner-vx-1.8l-ho-2016":  "WaveRunner VX 1.8L HO (2016–2020)",
  "yamaha-waverunner-vx-1050-tr1-2015": "WaveRunner VX 1050 TR-1 (2015)",
};
const stripBrand = (brand, name) => {
  let n = name.replace(/^Yanmar Shop \(official Yanmar parts catalogue\)\s*/, "");
  if (n.toLowerCase().startsWith(brand.toLowerCase() + " ")) n = n.slice(brand.length + 1);
  return n;
};

/* Marine pump models replaced by the honda.mv exact-model lists. */
const PUMP_REPLACE = {
  "honda-wb20xt-water-pump": { to: "honda-wb20xt-water-pump",  fiche: "WB20XT" },
  "honda-wb30xt-water-pump": { to: "honda-wb30xt-water-pump",  fiche: "WB30XT" },
  "honda-wt30x-trash-pump":  { to: "honda-wt30xk4-trash-pump", fiche: "WT30X"  },
};

const models = [];
for (const m of POWER_MODELS) {
  const base = m.model_number.split(/[- ]/)[0];
  const kind = m.kind.replace(/^Honda\s+/, "").toLowerCase();
  const size = (m.catalogue.match(/\b(\d+)in\b/) || [])[1];
  models.push({
    id: m.id, vertical: "pumps", brand: m.brand,
    name: `${base} ${kind}`,
    size: size ? `${size} in` : null,
    model_number: m.model_number,
    kind: m.kind,
    engine: m.engine,
    catalogue: m.catalogue,
    catalogue_url: m.sheesha_url,
    note: m.note,
  });
}
const powerIds = new Set(models.map(m => m.id));
let droppedModels = [];
for (const m of MARINE_MODELS) {
  if (PUMP_REPLACE[m.id]) { droppedModels.push(m.id); continue; }
  if (powerIds.has(m.id)) throw new Error("unexpected model id collision " + m.id);
  const name = NAME_FIX[m.id] || stripBrand(m.brand, m.name);
  const out = {
    id: m.id, vertical: m.vertical, brand: m.brand, name,
    size: m.size || null,
    catalogue_url: m.catalogue_url,
    /* "generated from x.csv" is build provenance, not a customer note */
    note: /^generated from /.test(m.note) ? null : m.note,
  };
  if (name !== m.name && !m.name.endsWith(name)) out.src_title = m.name;
  models.push(out);
}
const MODEL = Object.fromEntries(models.map(m => [m.id, m]));

/* ---------- Parts ---------- */
const POWER_CAT = {
  "Filters": "e_filter",
  "Pump end": "e_pumpend",
  "Seals & gaskets": "m_gasket",
  "Ignition": "m_ign",
  "Fuel": "m_fuel",
  "Starter": "m_ctrl",
  "Service": "e_other",          // caps, nozzles, governor shafts, cutter blades
  "Hoses & fittings": "e_other",
  "Exhaust": "e_other",
};

const rows = [];   // normalised rows, power first so honda.mv data wins merges
for (const p of POWER_PARTS) {
  const cat = POWER_CAT[p.category];
  if (!cat) throw new Error("unmapped power category " + p.category);
  rows.push({
    id: p.id, vertical: "pumps", cat, name: p.name, oem: p.oem, v: 1,
    alts: [], fits: [...p.fits], tier: "genuine",
    note: p.note || "", catalogue_name: p.catalogue_name, priority: p.priority,
    sources: [...(p.sources || [])],
  });
}
const powerHas = new Set(POWER_PARTS.flatMap(p => p.fits.map(f => f + "|" + p.oem)));

let noNumber = [], makerCode = 0, repointed = 0, repointedNoted = 0;
for (const p of MARINE_PARTS) {
  let oem = p.oem, alts = [...(p.alts || [])];
  if (!oem) {
    /* Spark plugs where the catalogue only gives the plug maker's code.
       That code is the number as printed, so it becomes the part number. */
    if (!alts.length) { noNumber.push(p.id); continue; }
    oem = alts.shift(); makerCode++;
  }
  let fits = p.fits, note = p.note || "";
  if (p.vertical === "pumps" && fits.some(f => PUMP_REPLACE[f])) {
    const fiche = [];
    fits = fits.map(f => {
      const r = PUMP_REPLACE[f];
      if (!r) return f;
      if (!powerHas.has(r.to + "|" + oem)) fiche.push(r.fiche);
      return r.to;
    });
    fits = [...new Set(fits)];
    repointed++;
    if (fiche.length) {
      repointedNoted++;
      note = [note, `from ${[...new Set(fiche)].join("/")} fiche; check serial`].filter(Boolean).join("; ");
    }
  }
  if (!CAT_IDS.has(p.cat)) throw new Error("unknown cat " + p.cat);
  rows.push({
    id: p.id, vertical: p.vertical, cat: p.cat, name: p.name, oem, v: p.v ? 1 : 0,
    alts, fits: [...fits], tier: p.tier, note,
    catalogue_name: p.catalogue_name, priority: p.priority,
    sources: [...new Set([p.source_url, ...(p.sources || [])].filter(Boolean))],
  });
}

/* Merge rows with the same OEM inside a vertical. */
const byKey = new Map();
const uniq = (a) => [...new Set(a.filter(Boolean))];
let merged = 0, mergedPumps = 0;
for (const r of rows) {
  const key = r.vertical + "|" + r.oem;
  const prev = byKey.get(key);
  if (!prev) { byKey.set(key, r); continue; }
  merged++; if (r.vertical === "pumps") mergedPumps++;
  prev.fits = uniq([...prev.fits, ...r.fits]);
  prev.alts = uniq([...prev.alts, ...r.alts]).filter(a => a !== prev.oem);
  prev.sources = uniq([...prev.sources, ...r.sources]);
  prev.note = uniq([...prev.note.split("; "), ...r.note.split("; ")]).join("; ");
  if (r.tier === "genuine") prev.tier = "genuine";
  prev.v = Math.max(prev.v, r.v);
}

const urls = [], URL_IX = new Map();
const parts = [...byKey.values()].map(r => {
  const fits = r.fits.filter(f => MODEL[f]);
  if (fits.length !== r.fits.length) throw new Error("dangling fit on " + r.id);
  const out = {
    id: r.id, vertical: r.vertical, cat: r.cat, name: r.name, oem: r.oem,
    v: r.v, alts: r.alts, fits, tier: r.tier,
    price: null, askPrice: true,
  };
  if (r.note) out.note = r.note;
  if (r.catalogue_name && r.catalogue_name.toLowerCase() !== r.name.toLowerCase()) out.catalogue_name = r.catalogue_name;
  if (r.priority) out.priority = r.priority;
  /* Source URLs repeat across hundreds of rows, so they are stored once in
     EQUIP.urls and referenced by index; the app expands p.src back into
     p.sources / p.source_url when it loads the file. */
  out.src = r.sources.map(u => {
    if (!URL_IX.has(u)) { URL_IX.set(u, urls.length); urls.push(u); }
    return URL_IX.get(u);
  });
  return out;
});

/* Drop models that ended up with no parts (none expected). */
const used = new Set(parts.flatMap(p => p.fits));
const emptyModels = models.filter(m => !used.has(m.id)).map(m => m.id);

const EQUIP = { verticals, cats, models: models.filter(m => used.has(m.id)), urls, parts };
const banner = "/* avas.parts marine + equipment catalogue. GENERATED by tools/build-equip.js from src-data/ — do not edit.\n" +
  "   Every part is ask-for-price (price:null, askPrice:true). Part numbers as printed. */\n";
fs.writeFileSync(path.join(root, "data-equip.js"), banner + "var EQUIP=" + JSON.stringify(EQUIP) + ";\n");

/* ---------- Report ---------- */
const rowsIn = POWER_PARTS.length + MARINE_PARTS.length;
console.log(`data-equip.js written (${fs.statSync(path.join(root, "data-equip.js")).size} bytes)`);
console.log(`inputs: ${MARINE_MODELS.length} marine + ${POWER_MODELS.length} power models; ${MARINE_PARTS.length} marine + ${POWER_PARTS.length} power part rows = ${rowsIn}`);
console.log(`dropped marine pump models (replaced by honda.mv lists): ${droppedModels.join(", ")}`);
console.log(`marine pump rows re-pointed to honda.mv models: ${repointed} (${repointedNoted} not in the honda.mv list, noted "check serial")`);
console.log(`plug rows with only a maker code (code used as part number): ${makerCode}`);
console.log(`rows dropped with no part number at all: ${noNumber.length}${noNumber.length ? " (" + noNumber.join(", ") + ")" : ""}`);
console.log(`rows merged by OEM within a vertical: ${merged} (pumps: ${mergedPumps})`);
if (emptyModels.length) console.log(`models with no parts, omitted: ${emptyModels.join(", ")}`);
console.log(`output: ${EQUIP.models.length} models, ${parts.length} parts`);
for (const v of verticals.filter(v => v.id !== "bikes")) {
  const nm = EQUIP.models.filter(m => m.vertical === v.id).length;
  const np = parts.filter(p => p.vertical === v.id).length;
  console.log(`  ${v.name.padEnd(24)} ${String(nm).padStart(3)} models  ${String(np).padStart(4)} parts`);
}
