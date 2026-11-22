/* Shared helpers for the 2026-11 catalogue inputs (src-data/catalogue-2026-11/):
   size objects for bearings / seals / tyres, and BNF PLUS stock references.

   BNF PLUS references carry the SKU, brand, BNF's own part number and the
   availability word only. bnf-links.json has no price field and nothing here
   may ever add one: BNF prices are not public, the customer asks for a price. */

const num = (v) => (v === "" || v == null || isNaN(+v) ? undefined : +v);

/* {kind, designation, bore_mm, od_mm, width_mm}; undefined keys dropped. */
function sizeObj(kind, designation, bore, od, width) {
  if (!designation) return null;
  const s = { kind, designation: String(designation), bore_mm: num(bore), od_mm: num(od), width_mm: num(width) };
  for (const k of Object.keys(s)) if (s[k] === undefined) delete s[k];
  return s;
}

/* "FIL1784 FLEETGUARD LF-3959 (indent)" or
   "BGC1432 NACHI 6007 NACHI 6007 2NSE CM avail=indent" */
function parseMatch(s) {
  const m = s.trim().match(/^(\S+)\s+(\S+)\s+(.*?)\s*(?:\((\w+)\)|avail=(\w+))$/);
  if (!m) return null;
  let pn = m[3].trim();
  const rep = pn.match(new RegExp(`^\\S+\\s+${m[2].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(.+)$`));
  if (rep) pn = rep[1];
  return { sku: m[1], brand: m[2], pn, avail: m[4] || m[5] };
}

/* One bnf-links.json row -> the `bnf` object stored on a part, or null when the
   row names no BNF stock at all (most seal-size rows). */
function bnfRef(row) {
  const matches = (row.bnf_stock_matches || "").split(/;\s*/).filter(Boolean).map(parseMatch).filter(Boolean);
  if (!row.bnf_sku && !matches.length) return null;
  const out = { kind: row.kind };
  if (row.bnf_sku) Object.assign(out, { sku: row.bnf_sku, brand: row.bnf_brand, pn: row.bnf_part_number, avail: row.bnf_availability });
  else if (row.designation) out.designation = row.designation;
  out.matches = matches;
  return out;
}

const KIND = { bearing_fiche: "bearing", bearing_confirmed: "bearing", oil_seal_size: "oil_seal" };
function bnfSize(row) {
  return KIND[row.kind] ? sizeObj(KIND[row.kind], row.designation, row.bore_mm, row.od_mm, row.width_mm) : null;
}

module.exports = { sizeObj, bnfRef, bnfSize, parseMatch };
