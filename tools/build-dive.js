/* Builds data-dive.js (Diving: FKM O-rings from BNF PLUS stock in standard
   scuba sizes). Reproducible.

     node tools/build-dive.js

   Inputs (price-free, never edited by hand):
     src-data/dive/fkm-orings.csv     every true FKM O-ring BNF PLUS lists (23)
     src-data/dive/scuba-sizes.json   AS568 dash sizes used on scuba gear,
                                      official ID × CS, use group, predicted SKUs

   Output: data-dive.js — `var DIVE = {verticals, cats, groups, parts}`.
   The site loads it lazily, like data-bnf.js.

   Rules:
   - Refuses to build if an input has a price / cost column.
   - A row is listed only if it is FKM (name, part number, type or description,
     never just a cross-reference) and matches a scuba size exactly: ID and CS
     within the tolerance, or an AS-NNN / AS568-NNN part number with that dash.
   - Every size's matches must equal its predicted SKUs, sizes marked
     expect_match:false must match nothing, and every FKM row left over must be
     a known exclusion. Anything else stops the build: no substitutes.
   - Every part is price:null, askPrice:true, no cost / bin / rop, no photo, no
     link. All are BNF indent → stock:0, orderIn:true (Order in). */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { parseCSV, PRICE_COLUMN } = require("./bnf-csv");

const root = path.join(__dirname, "..");
const src = (f) => path.join(root, "src-data/dive", f);

const rows = parseCSV(fs.readFileSync(src("fkm-orings.csv"), "utf8"));
const SIZES = JSON.parse(fs.readFileSync(src("scuba-sizes.json"), "utf8"));
const priceKeys = JSON.stringify(SIZES).match(/"[^"]*(price|cost|mvr|margin)[^"]*":/gi);
if (priceKeys) throw new Error("refusing to build: scuba-sizes.json has price-like keys " + priceKeys.join(", "));
const TOL = SIZES.match_tolerance_mm;
if (!(TOL > 0 && TOL <= 0.02)) throw new Error("match tolerance must be 0 < tol <= 0.02 mm, got " + TOL);

/* FKM rows in the CSV that are deliberately not listed, and why. */
const EXCLUDED = {
  ORN1757: "AS-007: internal regulator piston size, not a user-serviceable seal",
  ORN2693: "AS-007: internal regulator piston size, not a user-serviceable seal",
  ORN2705: "AS-016: large / maker-specific seal",
  ORN2707: "AS-019: large / maker-specific seal",
  ORN2709: "AS-022: large / maker-specific seal",
  ORN2711: "AS-024: large / maker-specific seal",
  ORN2701: "2×12 (12 × 2.00 mm): near AS568-014 but CS is 2.00, not 1.78 — not an exact match",
  ORN2704: "2×14 (14 × 2.00 mm): near AS568-015 but CS is 2.00, not 1.78 — not an exact match",
  ORN2691: "1.78×06.75: not a standard dash size",
  ORN2713: "4X95: large metric ring, not scuba",
  ORN2714: "3.5X95: large metric ring, not scuba",
};

/* Customer copy per dash. Same meaning as scuba-sizes.json; no outside
   dive-gear brand is named. */
const USE = {
  "116": "Tank neck O-ring, 7/8\" UNF (small-neck steel cylinders)",
};
/* Extra words a customer may type for a size (search only, never rendered). */
const WORDS = {
  "tank-neck": "tank neck cylinder scuba",
  "valve-face": "valve face cylinder scuba",
  "ports-hoses": "port plug first stage regulator hose end scuba",
  "inflator-hoses": "inflator hose end bcd scuba",
};

const isFKM = (r) => [r.name, r.part_number, r.type, r.description].some(s => /\bFKM\b/i.test(s));
const near = (a, b) => Math.abs(+a - +b) <= TOL + 1e-9;
const dashOf = (pn) => { const m = pn.match(/^AS(?:568)?-(\d{3})\b/i); return m ? m[1] : null; };

if (rows.some(r => r.category !== "O-Ring")) throw new Error("fkm-orings.csv has a non-O-Ring row");
const fkm = rows.filter(isFKM);
const notFkm = rows.filter(r => !isFKM(r)).map(r => r.sku);
if (notFkm.length) throw new Error("fkm-orings.csv has rows that are not FKM in name / number / type / description: " + notFkm.join(", "));

/* Groups in the order the section shows them. */
const GROUP_ORDER = ["tank-neck", "valve-face", "ports-hoses", "inflator-hoses"];
const TITLE = { "tank-neck": "Tank neck O-rings", "valve-face": "DIN and yoke valve face O-rings",
  "ports-hoses": "Port plug and hose end O-rings", "inflator-hoses": "Inflator and hose end O-rings" };
const groups = new Map();
for (const s of SIZES.sizes) {
  if (!GROUP_ORDER.includes(s.group)) throw new Error("unknown group " + s.group);
  if (!groups.has(s.group)) groups.set(s.group, { id: "dive-" + s.group, vertical: "diving", brand: "Diving",
    name: s.group_name, size: GROUP_ORDER.indexOf(s.group) + 1, title: TITLE[s.group] });
}

const parts = [], unmatched = [], used = new Set(), problems = [];
for (const s of SIZES.sizes) {
  const hits = fkm.filter(r => (near(r.id_mm, s.id_mm) && near(r.width_mm, s.cs_mm)) || dashOf(r.part_number) === s.dash);
  const want = s.predicted_skus || [];
  const got = hits.map(r => r.sku);
  if (s.expect_match === false) {
    if (got.length) problems.push(`AS568-${s.dash} was expected to have no FKM match but matched ${got.join(", ")}`);
    unmatched.push(s);
    continue;
  }
  if (got.sort().join() !== [...want].sort().join())
    problems.push(`AS568-${s.dash}: predicted ${want.join(", ") || "none"}, matched ${got.join(", ") || "none"}`);
  for (const r of hits) {
    if (used.has(r.sku)) problems.push(`${r.sku} matches more than one size`);
    used.add(r.sku);
    /* the row's own size must agree with the dash, whichever way it matched */
    if (!near(r.id_mm, s.id_mm) || !near(r.width_mm, s.cs_mm))
      problems.push(`${r.sku} ${r.part_number}: ${r.id_mm} × ${r.width_mm} is not AS568-${s.dash} (${s.id_mm} × ${s.cs_mm})`);
    if (r.availability !== "indent") problems.push(`${r.sku}: availability ${r.availability}, expected indent`);
    const oem = "AS568-" + s.dash;
    const id = (+s.id_mm).toFixed(2), cs = (+s.cs_mm).toFixed(2);
    parts.push({
      id: r.sku.toLowerCase(), vertical: "diving", cat: "dive_oring", grp: "dive-" + s.group,
      name: "FKM O-ring " + oem, oem, brand: r.brand, sku: r.sku,
      size: `${id} × ${cs} mm (ID × CS)`,
      use: USE[s.dash] || s.use,
      material: "FKM (Viton)",
      alts: [r.part_number],
      find: [`${id}x${cs}`, `${+id}x${+cs}`, `as${s.dash}`, `as-${s.dash}`, WORDS[s.group]].join(" "),
      dash: +s.dash,
      fits: [], tier: "brand", price: null, askPrice: true, stock: 0, orderIn: true,
    });
  }
}
const left = fkm.filter(r => !used.has(r.sku));
const unknownLeft = left.filter(r => !EXCLUDED[r.sku]).map(r => `${r.sku} ${r.part_number}`);
if (unknownLeft.length) problems.push("FKM rows neither listed nor a known exclusion: " + unknownLeft.join(", "));
const listedExcluded = parts.filter(p => EXCLUDED[p.sku]).map(p => p.sku);
if (listedExcluded.length) problems.push("excluded rows were matched: " + listedExcluded.join(", "));
if (problems.length) throw new Error("stopping — dive O-ring matching needs a person to look:\n  " + problems.join("\n  "));

/* group order, then dash number */
parts.sort((a, b) => GROUP_ORDER.indexOf(a.grp.slice(5)) - GROUP_ORDER.indexOf(b.grp.slice(5)) || a.dash - b.dash);
for (const p of parts) delete p.dash;

/* ids must not clash with anything else on the site */
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8") + "\n;globalThis.__P = PARTS;", ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data-equip.js"), "utf8") + "\n;globalThis.__E = EQUIP;", ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data-bnf.js"), "utf8") + "\n;globalThis.__B = BNF;", ctx);
const ids = new Set([...ctx.__P, ...ctx.__E.parts, ...ctx.__B.parts].map(p => p.id));
const clash = parts.filter(p => ids.has(p.id)).map(p => p.id);
if (clash.length) throw new Error("dive part ids clash with site parts: " + clash.join(", "));
const leak = parts.filter(p => Object.keys(p).some(k => PRICE_COLUMN.test(k) && k !== "askPrice" && k !== "price" || /^(bin|rop)$|img|source|url/i.test(k)));
if (leak.length) throw new Error("dive parts carry a forbidden field: " + leak.map(p => p.id).join(", "));
if (parts.some(p => p.price !== null || p.askPrice !== true)) throw new Error("every dive part must be price:null, askPrice:true");

const DIVE = {
  verticals: [{ id: "diving", name: "Diving", unit: "O-ring", units: "O-rings" }],
  cats: [{ id: "dive_oring", name: "FKM O-rings" }],
  groups: GROUP_ORDER.map(g => groups.get(g)),
  parts,
};
const banner = "/* avas.parts Diving: FKM O-rings in scuba sizes from BNF PLUS stock. GENERATED by tools/build-dive.js from src-data/dive/ — do not edit.\n" +
  "   Every part is ask-for-price (price:null, askPrice:true) and Order in. No prices, no photos, no links. */\n";
fs.writeFileSync(path.join(root, "data-dive.js"), banner + "var DIVE=" + JSON.stringify(DIVE) + ";\n");

console.log(`data-dive.js written (${fs.statSync(path.join(root, "data-dive.js")).size} bytes)`);
console.log(`FKM rows: ${fkm.length}; listed: ${parts.length}`);
for (const g of DIVE.groups) console.log(`  ${g.name.padEnd(26)} ${parts.filter(p => p.grp === g.id).map(p => `${p.oem} ${p.sku}`).join(", ")}`);
console.log(`sizes with no FKM match: ${unmatched.map(s => `AS568-${s.dash} (${s.id_mm} × ${s.cs_mm})`).join(", ")}`);
console.log(`FKM rows not listed: ${left.map(r => `${r.sku} ${r.part_number}`).join(", ")}`);
