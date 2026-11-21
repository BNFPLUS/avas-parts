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

sec("Equipment catalogue (data-equip.js)");
const ectx = { console };
vm.createContext(ectx);
vm.runInContext(fs.readFileSync("data-equip.js", "utf8") + "\n;globalThis.__E = EQUIP;", ectx);
const E = ectx.__E;
console.log(`  verticals ${E.verticals.length} · categories ${E.cats.length} · models ${E.models.length} · parts ${E.parts.length}`);
const eAskBad = E.parts.filter(p => p.price !== null || p.askPrice !== true).map(p => p.id);
ok(!eAskBad.length, "equipment parts not price:null + askPrice:true: " + eAskBad.slice(0, 20).join(", "));
const emids = new Set(E.models.map(m => m.id));
const eBadFit = [];
E.parts.forEach(p => { if (!p.fits || !p.fits.length) eBadFit.push(p.id + "->(none)");
  (p.fits || []).forEach(f => { if (!emids.has(f)) eBadFit.push(`${p.id}->${f}`); }); });
ok(!eBadFit.length, "equipment fits that are not equipment model ids: " + eBadFit.slice(0, 20).join(", "));
const ecids = new Set(E.cats.map(c => c.id));
const eBadCat = E.parts.filter(p => !ecids.has(p.cat)).map(p => p.id);
ok(!eBadCat.length, "equipment parts with unknown category: " + eBadCat.join(", "));
const allPartIds = PARTS.map(p => p.id).concat(E.parts.map(p => p.id));
const pidDup = allPartIds.filter((id, i, a) => a.indexOf(id) !== i);
ok(!pidDup.length, "duplicate part ids across bikes + equipment: " + pidDup.slice(0, 20).join(", "));
const allModelIds = MODELS.map(m => m.id).concat(E.models.map(m => m.id));
const midDup = allModelIds.filter((id, i, a) => a.indexOf(id) !== i);
ok(!midDup.length, "duplicate model ids across bikes + equipment: " + midDup.join(", "));
const vids = new Set(E.verticals.map(v => v.id));
ok(vids.has("bikes") && E.verticals.length === 7, "expected 7 verticals including bikes");
ok(E.models.every(m => vids.has(m.vertical) && m.vertical !== "bikes"), "equipment model with a bad vertical");
ok(E.parts.every(p => vids.has(p.vertical) && p.vertical !== "bikes"), "equipment part with a bad vertical");
ok(E.parts.every(p => p.fits.every(f => E.models.find(m => m.id === f).vertical === p.vertical)),
   "equipment part fits a model from another vertical");
for (const v of E.verticals.filter(v => v.id !== "bikes")) {
  const nm = E.models.filter(m => m.vertical === v.id).length;
  const np = E.parts.filter(p => p.vertical === v.id).length;
  console.log(`  ${v.name.padEnd(24)} ${String(nm).padStart(3)} models ${String(np).padStart(5)} parts`);
  ok(nm >= 1 && np >= 1, `vertical ${v.id} needs at least one model and part`);
}
ok(E.verticals.find(v => v.id === "pumps").name === "Pumps & power products", "pumps vertical is labelled Pumps & power products");
const eNoOem = E.parts.filter(p => typeof p.oem !== "string" || !p.oem.trim()).map(p => p.id);
ok(!eNoOem.length, "equipment parts with an empty OEM: " + eNoOem.join(", "));
const eNoName = E.parts.filter(p => !p.name).map(p => p.id);
ok(!eNoName.length, "equipment parts with no name: " + eNoName.join(", "));
for (const [label, re] of [["WB20XT", /\bWB20XT/], ["WB30XT", /\bWB30XT/], ["WT30X", /\bWT30X/]]) {
  const hits = E.models.filter(m => re.test(m.name)).map(m => m.id);
  ok(hits.length === 1, `Honda ${label} pump should exist exactly once, found: ${hits.join(", ") || "none"}`);
}
ok(!emids.has("honda-wt30x-trash-pump"), "old marine WT30X model should be replaced by WT30XK4");
ok(emids.has("honda-wx10-water-pump"), "Honda WX10 (not in honda.mv) should be kept");
const oemSeen = {}, oemDup = [];
E.parts.forEach(p => { const k = p.vertical + "|" + p.oem; if (oemSeen[k]) oemDup.push(k); oemSeen[k] = 1; });
ok(!oemDup.length, "duplicate OEM within a vertical: " + oemDup.slice(0, 20).join(", "));
const eBadSrc = E.parts.filter(p => !(p.src || []).length || p.src.some(i => !/^https?:\/\//.test(E.urls[i] || ""))).map(p => p.id);
ok(!eBadSrc.length, "equipment parts without a resolvable source url: " + eBadSrc.slice(0, 20).join(", "));
ok(E.parts.some(p => /\//.test(p.oem)), "slash part numbers (e.g. JCB 320/B4420) kept as printed");
const unv = E.parts.filter(p => p.tier === "genuine-unverified").length;
ok(unv > 0 && E.parts.every(p => p.tier === "genuine" || p.tier === "genuine-unverified"), "tiers are genuine / genuine-unverified");
console.log(`  ${unv} numbers marked "to be confirmed"; ${E.urls.length} distinct source urls`);
ok(app.includes('"data-equip.js"') && !html.includes('src="data-equip.js"'), "data-equip.js is lazy-loaded by app.js, not by index.html");
ok(html.includes('id="vertChips"'), "index.html has the category picker");

console.log("\n" + (fail ? `${fail} check(s) FAILED` : "All checks passed"));
process.exit(fail ? 1 : 0);
