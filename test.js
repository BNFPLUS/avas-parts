/* Dataset + finder integrity tests. Run: node test.js */
const fs = require("fs"), vm = require("vm");

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync("data.js", "utf8") +
  "\n;globalThis.__X = {MODELS,PARTS,CATS,ZONES,FAMILY,GROUP,BRANDS,SHOP};",
  ctx
);
const { MODELS, PARTS, CATS, ZONES, FAMILY, GROUP, BRANDS, SHOP } = ctx.__X;

let fail = 0;
const ok  = (c, m) => { if (!c) { fail++; console.log("  FAIL " + m); } };
const sec = (n) => console.log("\n" + n);

sec("Dataset shape");
console.log(`  models ${MODELS.length} · parts ${PARTS.length} · categories ${CATS.length} · zones ${ZONES.length}`);
ok(MODELS.length >= 25, "expected 25+ models");
ok(PARTS.length  >= 100, "expected 100+ parts");

sec("Referential integrity");
const mids = new Set(MODELS.map(m => m.id));
const cids = new Set(CATS.map(c => c.id));
const badFit = [];
PARTS.forEach(p => (p.fits || []).forEach(f => { if (!mids.has(f)) badFit.push(`${p.id}->${f}`); }));
ok(!badFit.length, "unknown model ids in fits: " + badFit.join(", "));
const badCat = PARTS.filter(p => !cids.has(p.cat)).map(p => p.id);
ok(!badCat.length, "unknown category: " + badCat.join(", "));
const seen = {}, dup = [];
PARTS.forEach(p => { if (seen[p.id]) dup.push(p.id); seen[p.id] = 1; });
ok(!dup.length, "duplicate part ids: " + dup.join(", "));
console.log(`  ${badFit.length + badCat.length + dup.length === 0 ? "all references resolve" : "problems found"}`);

sec("Required fields");
const miss = PARTS.filter(p =>
  !p.name || !p.oem || !p.cat || p.price == null || p.cost == null ||
  p.stock == null || p.rop == null || !p.bin).map(p => p.id);
ok(!miss.length, "missing fields: " + miss.join(", "));
console.log(`  ${miss.length ? miss.length + " incomplete" : "every part complete"}`);

sec("Commercial sanity");
const badMargin = PARTS.filter(p => p.cost >= p.price).map(p => p.id);
ok(!badMargin.length, "cost >= price: " + badMargin.join(", "));
const margins = PARTS.map(p => (p.price - p.cost) / p.price);
const avg = margins.reduce((a, b) => a + b, 0) / margins.length;
console.log(`  average gross margin ${(avg * 100).toFixed(1)}%`);
ok(avg > 0.3 && avg < 0.65, "average margin outside a plausible 30–65% band");

sec("Part-number decoding");
const gCodes = new Set(), fCodes = new Set();
PARTS.forEach(p => {
  const s = p.oem.split("-");
  if (s.length === 3 && /^\d{5}$/.test(s[0])) { gCodes.add(s[0]); fCodes.add(s[1]); }
});
const undG = [...gCodes].filter(x => !GROUP[x]);
const undF = [...fCodes].filter(x => !FAMILY[x]);
ok(!undG.length, "group codes with no decoder entry: " + undG.join(", "));
ok(!undF.length, "family codes with no decoder entry: " + undF.join(", "));
console.log(`  ${gCodes.size} group codes, ${fCodes.size} family codes — all decode`);

sec("Fleet coverage");
const cov = new Set();
PARTS.forEach(p => (p.fits || []).forEach(f => cov.add(f)));
const uncovered = MODELS.filter(m => !cov.has(m.id));
console.log(`  ${MODELS.length - uncovered.length}/${MODELS.length} models have at least one specific part`);
if (uncovered.length) console.log("  universal-only: " + uncovered.map(m => m.name).join(", "));

sec("Interchange engine");
function group(oem) { const s = oem.split("-"); return (s.length === 3 && /^\d{5}$/.test(s[0])) ? s[0] : null; }
const belts = PARTS.filter(p => group(p.oem) === "23100");
ok(belts.length >= 6, "expected several drive belts to cross-reference");
console.log(`  drive belts (group 23100): ${belts.length} numbers across the fleet`);
const pads = PARTS.filter(p => group(p.oem) === "06455");
console.log(`  front brake pads (group 06455): ${pads.length} numbers`);
ok(pads.length >= 4, "expected several brake pad numbers");

sec("Verification status");
const verified = PARTS.filter(p => p.v).length;
console.log(`  ${verified}/${PARTS.length} OEM numbers confirmed against a published source`);
console.log(`  ${PARTS.length - verified} flagged in the UI as "verify before ordering"`);

sec("Delivery zones");
ok(ZONES.every(z => z.name && z.eta && typeof z.fee === "number"), "zone missing name/eta/fee");
console.log(`  ${ZONES.length} zones, MVR ${Math.min(...ZONES.map(z=>z.fee))}–${Math.max(...ZONES.map(z=>z.fee))}`);

sec("Front-end wiring");
const html = fs.readFileSync("index.html", "utf8");
const app  = fs.readFileSync("app.js", "utf8");
const needed = ["q","grid","catWrap","brandChips","modelChips","modelRow","cartOpen","cartN",
  "cartBody","cartFoot","zone","zoneList","custName","custPhone","custIsland","custNote",
  "tSub","tDel","tGst","tAll","goBtn","scrim","toast","detailBody","detailTitle","rTitle",
  "rCount","clearBtn","modeSwitch"];
const missingIds = needed.filter(id => !html.includes(`id="${id}"`));
ok(!missingIds.length, "app.js references ids missing from index.html: " + missingIds.join(", "));
console.log(`  ${needed.length - missingIds.length}/${needed.length} element ids present`);
["data.js","app.js","styles.css"].forEach(f =>
  ok(html.includes(f), `index.html does not load ${f}`));

console.log("\n" + (fail ? `${fail} check(s) FAILED` : "All checks passed"));
process.exit(fail ? 1 : 0);
