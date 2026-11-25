/* Matches BNF PLUS impeller cross-reference numbers against engine part
   numbers on the site.

   A BNF xref cell is a messy comma list: OEM numbers, competitor numbers,
   brand words ("Mercury, Mariner, Mercruiser Bravo I, II, III"), labels
   ("Detroit Diesel P, N:", "GLM: 89700") and truncated text ("ohn Deere").
   Only real part numbers are kept, and they are compared whole:

   - key(x): upper case, letters and digits only ("125613-42762" → 12561342762).
   - A usable number has at least 6 characters and at least 5 digits, so short
     numbers (6593, 8514, SP-280, K38) and brand words never match.
   - Same digits, different padding:
       a long all-digit number stored with a trailing "00" equals the unpadded
       number (Cummins 389733700 = 3897337), only when the base keeps 7+ digits;
       leading zeros drop when 6+ characters remain (034440 → 34440 is too
       short, so it is not used).
   - Never substring matching: "7054" does not hit "7054-01", "3897337" does
     not hit "38973371".

     const { tokens, keys, matchImpellers } = require("./match-impeller-xref");  */

const BRAND_WORDS = new Set([
  "MERCURY", "CATERPILLAR", "CATERPILLERMARINE", "SHERWOOD", "YANMAR", "CUMMINS", "JOHN", "OHN", "DEERE",
  "DETROIT", "DIESEL", "MARINER", "MERCRUISER", "BRAVO", "MALLORY", "GLM", "CEF", "FLEETGUARD",
  "NORTHERN", "LIGHTS", "CRUSADER", "VOLVO", "PENTA", "JABSCO", "JOHNSON", "INDMAR", "YAMAHA",
  "ORBITRADE", "MARINE", "PCM", "DJ", "PUMP", "MODELS", "RUBBER", "IMPELLER", "P", "N", "I", "II", "III",
]);

const key = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const digits = (s) => (s.match(/\d/g) || []).length;
const usable = (k) => k.length >= 6 && digits(k) >= 5;

/* Every comparable form of one number. */
function keys(raw) {
  const k = key(raw);
  if (!usable(k)) return [];
  const out = new Set([k]);
  if (/^\d+$/.test(k)) {
    const lead = k.replace(/^0+/, "");
    if (lead !== k && lead.length >= 6) out.add(lead);
    if (k.length >= 9 && k.endsWith("00")) out.add(k.slice(0, -2));
  }
  return [...out];
}

/* Part numbers in one xref cell, as printed (trimmed). Brand words and labels
   are dropped; a piece like "Mercruiser 47-853126" yields "47-853126";
   "119773 42600 1" stays one number. */
function tokens(cell) {
  const out = [];
  for (let piece of String(cell || "").split(",")) {
    piece = piece.replace(/\b[A-Za-z][A-Za-z ]*:\s*/g, " ").trim();   // "GLM: 89700", "Johnson P, N: 10-13021-91"
    if (!piece) continue;
    const words = piece.split(/\s+/).filter(w => !BRAND_WORDS.has(key(w)) || /\d/.test(w));
    const joined = words.join(" ").replace(/\s*\(.*$/, "").trim();      // "8100-01 (09-819B" → "8100-01"
    if (joined && usable(key(joined))) { out.push(joined); continue; }
    for (const w of words) if (usable(key(w))) out.push(w);
  }
  /* "8200-01 (6760-0001) (09-802B)": the bracketed numbers are xrefs too. */
  for (const m of String(cell || "").matchAll(/\(([^()]+)\)/g))
    for (const w of m[1].split(/[,\s]+/)) if (usable(key(w))) out.push(w);
  return [...new Set(out)];
}

/* impellers: [{ sku, pn, xref }]; parts: [{ id, oem, alts }].
   Returns [{ partId, sku, token, oem }] — one row per (part, impeller) pair. */
function matchImpellers(impellers, parts) {
  const index = new Map();               // key → [{ part, oem }]
  for (const p of parts) {
    for (const oem of [p.oem, ...(p.alts || [])]) {
      for (const k of keys(oem)) {
        if (!index.has(k)) index.set(k, []);
        index.get(k).push({ part: p, oem });
      }
    }
  }
  const hits = new Map();
  for (const imp of impellers) {
    const toks = [...new Set([...tokens(imp.xref), ...tokens(imp.pn)])];
    for (const t of toks) {
      for (const k of keys(t)) {
        for (const { part, oem } of index.get(k) || []) {
          const id = part.id + "|" + imp.sku;
          if (!hits.has(id)) hits.set(id, { partId: part.id, sku: imp.sku, token: t, oem });
        }
      }
    }
  }
  return [...hits.values()];
}

module.exports = { key, keys, tokens, usable, matchImpellers, BRAND_WORDS };
