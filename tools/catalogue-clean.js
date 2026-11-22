/* Customer-facing clean-up of the bike catalogue in data.js.

     node tools/catalogue-clean.js

   1. French fiche names to English. Some fiche pages were scraped from the
      French bike-parts-honda.com site ("--- FAISCEAU ..."). The display name
      (and the French catalogue_name) is replaced from
      src-data/catalogue-2026-11/name-translations-en.json. Colour codes,
      sizes, tooth counts and makers' names stay as printed.
   2. Truncated catalogue names. The fiche cut many names at 25 characters
      ("GASKET, CYLINDER HEAD COV"). A cut word or bracket is completed only
      when the rest of the catalogue shows a single completion; sizes, part
      digits and short maker stubs ("(F", "(630", "(12V 35/3") are left as is.
   3. No outbound links. Parts carry no source_url / sources, and models no
      catalogue_url / manual_url / dealer page. BNF PLUS references and
      bearing.wiki links (p.bnf, p.wiki) are internal references and stay.

   tools/merge-honda-full.js and tools/merge-dealers.js run clean() before
   writing, so a rebuild stays clean. Idempotent. No part number, price, flag,
   fit or reference is changed. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const TR = JSON.parse(fs.readFileSync(path.join(root, "src-data/catalogue-2026-11/name-translations-en.json"), "utf8"));
const CUT = 25; // the fiche's name width

/* ---------- Fiche name formatting (shared with merge-honda-full.js) ---------- */
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

/* "--- " marks a line printed from the French fiche, "X --- X" repeats the
   name, and the fiche cut some names mid-bracket ("(NISSI"). */
function fixCatalogueText(raw) {
  let n = String(raw).trim();
  const dup = n.match(/^(.*?)\s+-{3}\s+(.*)$/);
  if (dup) {
    /* "X --- X", or a cut first copy: "X (TYPE-A --- X (TYPE-A)" keeps the full one. */
    const [a, b] = [dup[1].toUpperCase(), dup[2].toUpperCase()];
    if (a === b || b.startsWith(a)) n = dup[2];
    else if (a.startsWith(b)) n = dup[1];
  }
  return n.replace(/^-+\s+(?=\S)/, "");
}
function cleanName(raw) {
  let n = fixCatalogueText(raw);
  if ((n.match(/\(/g) || []).length > (n.match(/\)/g) || []).length) {
    n = /\(\s*$/.test(n) ? n.replace(/\s*\(\s*$/, "") : n + "…)";
  }
  return niceName(n);
}

/* ---------- 1. French to English ---------- */
const COLOUR_WORD = new RegExp(`\\b(${Object.keys(TR.words).join("|")})\\b`, "g");
function englishColours(s) {
  return s.replace(/\(([A-Z0-9]+) ([^()*]+?)\)/g, (m, code, desc) =>
    TR.colours[desc] ? `(${code} ${TR.colours[desc]})` : m)
    .replace(/\(([A-Z0-9]+ )?([^()]*)(\)|$)/g, (m, code, body, close) =>
      `(${code || ""}${body.replace(COLOUR_WORD, w => TR.words[w])}${close}`);
}
function englishName(name) {
  const i = name.indexOf("*");
  const head = (i < 0 ? name : name.slice(0, i)).trim();
  const tail = i < 0 ? "" : name.slice(i);
  const en = TR.heads[head] || englishColours(head);
  return (en + (tail ? " " + englishColours(tail) : "")).replace(/\s+/g, " ").trim();
}

/* ---------- 2. Truncated catalogue names ---------- */
function buildVocab(names) {
  const complete = names.filter(n => n.length !== CUT);
  const words = new Set(), groups = new Set();
  for (const n of names) {
    const toks = n.split(/[\s(),*]+/).filter(Boolean);
    (n.length === CUT ? toks.slice(0, -1) : toks).forEach(t => words.add(t));
  }
  for (const n of complete) for (const g of n.matchAll(/\(([^()]+)\)/g)) groups.add(g[1]);
  return { complete, words, groups };
}

/* Cut words with one obvious completion that the evidence rules miss (the
   word is printed in full on a sibling part, or the stub is unambiguous in
   context). Checked by hand. Maker stubs and sizes are never listed here. */
const HAND = {
  "BALL ASSY., STEERING STEE": "BALL ASSY., STEERING STEM",
  "BUSH, GUIDE (CHUANNAN ABS": "BUSH, GUIDE (CHUANNAN ABSORBER)",
  "CAP, TAPPET ADJUSTING HOL": "CAP, TAPPET ADJUSTING HOLE",
  "COVER, TAPPET ADJUSTING H": "COVER, TAPPET ADJUSTING HOLE",
  "CLAMPER A, OIL TEMPERATUR": "CLAMPER A, OIL TEMPERATURE",
  "CLIP, HARNESS BAND (NATUR": "CLIP, HARNESS BAND (NATURAL)",
  "CHARGER UNIT, USB (TYPE-C": "CHARGER UNIT, USB (TYPE-C)",
  "COLLAR, FR. FENDER (BLACK": "COLLAR, FR. FENDER (BLACK)",
  "COLLAR, FR. FENDER (WHITE": "COLLAR, FR. FENDER (WHITE)",
  "GASKET, CYLINDER (LEAKLES": "GASKET, CYLINDER (LEAKLESS)",
  "GASKET, EX. TAPPET HOLE C": "GASKET, EX. TAPPET HOLE COVER",
  "GASKET, IN. TAPPET HOLE C": "GASKET, IN. TAPPET HOLE COVER",
  "HOUSING COMP., STARTER SW": "HOUSING COMP., STARTER SWITCH",
  "PIPE COMP., STEERING HAND": "PIPE COMP., STEERING HANDLE",
  "PLATE COMP., GEARSHIFT DR": "PLATE COMP., GEARSHIFT DRUM",
  "PLATE, L. PILLION STEP CL": "PLATE, L. PILLION STEP CLICK",
  "PLATE, R. PILLION STEP CL": "PLATE, R. PILLION STEP CLICK",
  "PLATE, MISSION BEARING SE": "PLATE, MISSION BEARING SETTING",
  "PLATE, CLUTCH LIFTER (F.C": "PLATE, CLUTCH LIFTER (F.C.C.)",
  "OIL SEAL, 24X31X3.5 (F.C.": "OIL SEAL, 24X31X3.5 (F.C.C.)",
  "OUTER COMP., CLUTCH (F.C.": "OUTER COMP., CLUTCH (F.C.C.)",
  "RACE, STEERING BOTTOM BAL": "RACE, STEERING BOTTOM BALL",
  "RELAY COMP., WINKER (MITS": "RELAY COMP., WINKER (MITSUBA)",
  "RING, BACK UP (CHUANNAN A": "RING, BACK UP (CHUANNAN ABSORBER)",
  "RING, PISTON (CHUANNAN AB": "RING, PISTON (CHUANNAN ABSORBER)",
  "ROLLER COMP., CAM CHAIN G": "ROLLER COMP., CAM CHAIN GUIDE",
  "RUBBER, HANDLE CUSHION UN": "RUBBER, HANDLE CUSHION UNDER",
  "RUBBER, HANDLE CUSHION UP": "RUBBER, HANDLE CUSHION UPPER",
  "RUBBER, STARTER PINION HO": "RUBBER, STARTER PINION HOLDER",
  "SEAL, SPEEDOMETER GEAR BO": "SEAL, SPEEDOMETER GEAR BOX",
  "SENSOR ASSY., AIR TEMPERA": "SENSOR ASSY., AIR TEMPERATURE",
  "SENSOR ASSY., OIL TEMPERA": "SENSOR ASSY., OIL TEMPERATURE",
  "SOCKET COMP., POSITION LI": "SOCKET COMP., POSITION LIGHT",
  "SPRING, BRAKE LOCK ARM RE": "SPRING, BRAKE LOCK ARM RETURN",
  "SPRING, FR. BRAKE ARM RET": "SPRING, FR. BRAKE ARM RETURN",
  "SPRING, GEARSHIFT DRUM ST": "SPRING, GEARSHIFT DRUM STOPPER",
  "STAY COMP., ELECTRONIC CO": "STAY COMP., ELECTRONIC CONTROL",
  "SUB HARNESS, WATER TEMPER": "SUB HARNESS, WATER TEMPERATURE",
  "SUSPENSION, LED CONTROL U": "SUSPENSION, LED CONTROL UNIT",
  "THREAD COMP., STEERING HE": "THREAD COMP., STEERING HEAD",
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* Returns the repaired name, or the input when the cut is not clear. */
function repairCut(n, V) {
  if (n.length !== CUT || /[)*]$/.test(n) || /\(\s*$/.test(n)) return n;
  const open = (n.match(/\(/g) || []).length > (n.match(/\)/g) || []).length;
  const lastStar = n.lastIndexOf("*");
  if (lastStar >= 0 && (n.match(/\*/g) || []).length % 2) return n; // colour code cut
  const m = n.match(/([^\s(]+)$/);
  if (!m) return n;
  const T = m[1], before = n.slice(0, n.length - T.length);
  const inner = open ? n.slice(n.lastIndexOf("(") + 1) : "";
  /* Tooth counts are complete tokens; other digits are sizes cut short. */
  if (/\d/.test(T) && !(open && /^\d+T$/.test(T) && inner === T)) return n;
  if (HAND[n]) return HAND[n];

  /* Evidence 1: longer catalogue names that start with exactly this text. */
  const sib = V.complete.filter(c => c.length > CUT && c.toUpperCase().startsWith(n.toUpperCase()))
    .map(c => c.slice(n.length));
  const ext = sib.map(r => r.match(/^[^\s(),*]*/)[0]);
  const short = T.replace(/[^A-Z]/g, "").length < 3;
  if (short && open) return n; // "(A", "(F.", "(NO": a maker or variant cut short
  let C = null;
  if (ext.length && new Set(ext).size === 1) C = T + ext[0];
  else if (short) return n;
  if (C === null && !ext.length) {
    if (V.words.has(T)) C = T; // already a whole word
    else {
      const cand = [...V.words].filter(w => w.startsWith(T) && w.length > T.length);
      if (cand.length === 1) C = cand[0];
      else if (cand.length > 1) {
        /* Evidence 2: the same phrase, complete, elsewhere ("CHAIN TENS" -> "CHAIN TENSIONER"). */
        const prev = before.trim().split(/\s+/).pop();
        const re = new RegExp(`(?:^|[\\s(])${esc(prev)} (${esc(T)}[^\\s(),*]*)`);
        const hits = new Set(V.complete.map(c => (c.match(re) || [])[1]).filter(Boolean));
        if (hits.size === 1) C = [...hits][0];
      }
    }
  }
  if (C === null) return n;
  if (!open) return C === T ? n : before + C;
  /* Inside a bracket: close it only when that whole bracket is printed elsewhere. */
  const group = inner.slice(0, inner.length - T.length) + C;
  const closesHere = sib.every((r, i) => r.charAt(ext[i].length) === ")");
  if (V.groups.has(group) && closesHere) return before + C + ")";
  return C === T ? n : before + C;
}

/* ---------- 3. Outbound links ---------- */
const URL_RE = /\s*(?::\s*)?https?:\/\/[^\s)]+/g;
function stripLinks(D) {
  let parts = 0, models = 0;
  for (const p of D.PARTS) {
    if ("source_url" in p || "sources" in p) parts++;
    delete p.source_url; delete p.sources;
  }
  for (const m of D.MODELS) {
    const before = JSON.stringify(m);
    delete m.catalogue_url; delete m.manual_url; delete m.sheesha_url;
    if (m.sold_by_sheesha_as && !Array.isArray(m.sold_by_sheesha_as)) delete m.sold_by_sheesha_as.url;
    for (const k of ["note", "notice"]) if (typeof m[k] === "string") m[k] = m[k].replace(URL_RE, "").trim();
    if (JSON.stringify(m) !== before) models++;
  }
  return { parts, models };
}

/* ---------- Run ---------- */
function clean(D) {
  const isFrench = require("./french-words");
  const stats = { french: 0, frenchNames: new Set(), catFrench: 0, cutRepaired: 0, cutLeft: 0, nameRepaired: 0, examplesRepaired: [], examplesLeft: [] };

  /* 1. French: display name, then a French / colour-French catalogue name. */
  for (const p of D.PARTS) {
    if (isFrench(p.name)) {
      const en = englishName(p.name);
      if (en !== p.name) { stats.french++; stats.frenchNames.add(p.name); p.name = en; }
    }
    if (p.catalogue_name) {
      const raw = p.catalogue_name, fixed = fixCatalogueText(raw);
      let out = fixed;
      if (isFrench(fixed)) {
        const nice = cleanName(fixed), en = englishName(nice);
        out = en !== nice ? en.toUpperCase() : englishColours(fixed);
      }
      if (out !== raw) { if (isFrench(raw)) stats.catFrench++; p.catalogue_name = out; }
      if (/\s-{3}\s/.test(p.name)) p.name = cleanName(out);
    }
  }

  /* 2. Truncated catalogue names, and display names built from them. */
  const V = buildVocab(D.PARTS.map(p => p.catalogue_name).filter(Boolean));
  for (const p of D.PARTS) {
    const n = p.catalogue_name;
    if (!n || n.length !== CUT || /[)*]$/.test(n)) continue;
    const r = repairCut(n, V);
    if (r === n) {
      if (/[A-Z]$|\($|\(\S*$|[\d/.-]$/.test(n) && !V.words.has(n.split(/[\s(),*]+/).pop())) {
        stats.cutLeft++; if (stats.examplesLeft.length < 12 && !stats.examplesLeft.includes(n)) stats.examplesLeft.push(n);
      }
      continue;
    }
    stats.cutRepaired++;
    if (stats.examplesRepaired.length < 16 && !stats.examplesRepaired.some(e => e.startsWith(n))) stats.examplesRepaired.push(`${n} -> ${r}`);
    p.catalogue_name = r;
    /* Display name: rebuilt if it was the fiche text, else its cut tail fixed. */
    const T = n.match(/([^\s(]+)$/)[1], C = r.slice(n.length - T.length).replace(/\)$/, "");
    const oldNice = cleanName(n);
    if (p.name === oldNice) { p.name = cleanName(r); stats.nameRepaired++; continue; }
    const tail = new RegExp(`${esc(T)}(…\\))?$`, "i");
    const mt = p.name.match(tail);
    if (mt) {
      const inParen = (n.match(/\(/g) || []).length > (n.match(/\)/g) || []).length;
      const lower = !inParen;
      p.name = p.name.slice(0, mt.index) + (lower ? C.toLowerCase() : C) + (r.endsWith(")") ? ")" : mt[1] || "");
      stats.nameRepaired++;
    }
  }

  stats.links = stripLinks(D);
  stats.frenchNames = stats.frenchNames.size;
  return stats;
}

function load(file) {
  const src = fs.readFileSync(file, "utf8");
  const names = [...src.matchAll(/^const (\w+) = /gm)].map(m => m[1]);
  const head = src.slice(0, src.indexOf("const "));
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src + `\n;globalThis.__D = {${names}};`, ctx);
  return { D: ctx.__D, names, head };
}
function serialise({ D, names, head }) {
  return head + names.map(n => `const ${n} = ${n === "BRANDS"
    ? "[" + D[n].map(s => JSON.stringify(s)).join(", ") + "]"
    : JSON.stringify(D[n], null, 1)};`).join("\n") + "\n";
}

module.exports = { clean, niceName, cleanName, englishName, repairCut, buildVocab, load, serialise };

if (require.main === module) {
  const file = path.join(root, "data.js");
  const before = fs.statSync(file).size;
  const L = load(file);
  const stats = clean(L.D);
  const out = serialise(L);
  fs.writeFileSync(file, out);
  console.log(JSON.stringify({ ...stats, bytes: { before, after: Buffer.byteLength(out) } }, null, 1));
}
