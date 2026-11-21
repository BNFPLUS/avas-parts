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
ok(PARTS.length  >= 500, "expected 500+ parts");
const mdup = MODELS.map(m => m.id).filter((id, i, a) => a.indexOf(id) !== i);
ok(!mdup.length, "duplicate model ids: " + mdup.join(", "));
const badBrand = MODELS.filter(m => !BRANDS.includes(m.brand)).map(m => m.id);
ok(!badBrand.length, "models with unknown brand: " + badBrand.join(", "));

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
// Every part is either priced (numeric price > 0) or explicitly ask-for-price
// (price null + askPrice true). Priced parts carry the full staff fields.
const isPriced = p => typeof p.price === "number" && p.price > 0 && !p.askPrice;
const isAsk    = p => p.price == null && p.askPrice === true;
const PRICED = PARTS.filter(isPriced), ASK = PARTS.filter(isAsk);
const badPrice = PARTS.filter(p => !isPriced(p) && !isAsk(p)).map(p => p.id);
ok(!badPrice.length, "neither priced nor askPrice: " + badPrice.join(", "));
const miss = PARTS.filter(p => !p.name || !p.oem || !p.cat).map(p => p.id);
ok(!miss.length, "missing name/oem/cat: " + miss.join(", "));
const missStaff = PRICED.filter(p =>
  typeof p.cost !== "number" || p.stock == null || p.rop == null || !p.bin).map(p => p.id);
ok(!missStaff.length, "priced parts missing cost/stock/rop/bin: " + missStaff.join(", "));
console.log(`  ${PRICED.length} priced · ${ASK.length} ask-for-price · ${miss.length + missStaff.length + badPrice.length ? "problems found" : "every part complete"}`);

sec("Commercial sanity");
const badMargin = PRICED.filter(p => p.cost >= p.price).map(p => p.id);
ok(!badMargin.length, "cost >= price: " + badMargin.join(", "));
const margins = PRICED.map(p => (p.price - p.cost) / p.price);
const avg = margins.reduce((a, b) => a + b, 0) / margins.length;
console.log(`  average gross margin (priced parts) ${(avg * 100).toFixed(1)}%`);
ok(avg > 0.3 && avg < 0.65, "average margin outside a plausible 30–65% band");

sec("Part-number decoding");
// Priced parts (the previous catalogue) must fully decode. Ask-for-price parts
// may carry codes the decoder does not describe yet; the UI shows "an unlisted
// group/family" for those, so they are reported, not failed.
function codes(list) {
  const g = new Set(), f = new Set();
  list.forEach(p => {
    const s = p.oem.split("-");
    if (s.length === 3 && /^\d{5}$/.test(s[0])) { g.add(s[0]); f.add(s[1]); }
  });
  return { g, f };
}
const pc = codes(PRICED);
const undG = [...pc.g].filter(x => !GROUP[x]);
const undF = [...pc.f].filter(x => !FAMILY[x]);
ok(!undG.length, "priced parts: group codes with no decoder entry: " + undG.join(", "));
ok(!undF.length, "priced parts: family codes with no decoder entry: " + undF.join(", "));
console.log(`  priced: ${pc.g.size} group codes, ${pc.f.size} family codes — all decode`);
const ac = codes(PARTS);
const aUndG = [...ac.g].filter(x => !GROUP[x]).length, aUndF = [...ac.f].filter(x => !FAMILY[x]).length;
console.log(`  all parts: ${ac.g.size - aUndG}/${ac.g.size} group codes, ${ac.f.size - aUndF}/${ac.f.size} family codes have a decoder entry`);

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
  "tSub","tDel","tGst","tAll","tAskRow","tAsk","goBtn","scrim","toast","detailBody","detailTitle","rTitle",
  "rCount","clearBtn","modeSwitch"];
const missingIds = needed.filter(id => !html.includes(`id="${id}"`));
ok(!missingIds.length, "app.js references ids missing from index.html: " + missingIds.join(", "));
console.log(`  ${needed.length - missingIds.length}/${needed.length} element ids present`);
["data.js","app.js","styles.css"].forEach(f =>
  ok(html.includes(f), `index.html does not load ${f}`));

console.log("\n" + (fail ? `${fail} check(s) FAILED` : "All checks passed"));
process.exit(fail ? 1 : 0);
