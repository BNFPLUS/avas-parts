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

let fail = 0, checks = 0;
const ok  = (c, m) => { checks++; if (!c) { fail++; console.log("  FAIL " + m); } };
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
// confirmed:"verify" (dealer rows seen on a retailer page only) overrides v, as in app.js
const verified = PARTS.filter(p => p.v && p.confirmed !== "verify").length;
console.log(`  ${verified}/${PARTS.length} OEM numbers confirmed against a published source`);
console.log(`  ${PARTS.length - verified} flagged in the UI as "verify before ordering"`);

sec("Dealer merge (src-data/data-dealers-next.js)");
const dctx = {};
vm.createContext(dctx);
vm.runInContext(fs.readFileSync("src-data/data-dealers-next.js", "utf8") +
  "\n;globalThis.__DL = {DEALER_MODELS, DEALER_PARTS, DEALER_MARINE_MODELS, DEALER_MARINE_PARTS};", dctx);
const DL = dctx.__DL;
const { cleanNote } = require("./tools/dealer-notes");
for (const b of ["CFMoto", "Keeway"]) {
  ok(BRANDS.includes(b), `${b} is in BRANDS`);
  const n = MODELS.filter(m => m.brand === b).length;
  ok(n >= 1, `${b} has models (${n})`);
}
ok(JSON.stringify(BRANDS) === JSON.stringify(["Honda", "Yamaha", "Suzuki", "CFMoto", "Keeway"]), "BRANDS = Honda, Yamaha, Suzuki, CFMoto, Keeway");
const missingModels = DL.DEALER_MODELS.filter(m => !mids.has(m.id)).map(m => m.id);
ok(!missingModels.length, "dealer models missing from data.js: " + missingModels.join(", "));
ok(MODELS.every(m => !m.name.startsWith(m.brand + " ")), "model names do not repeat the make");
const oemAll = PARTS.map(p => p.oem);
const oemDupB = oemAll.filter((o, i) => oemAll.indexOf(o) !== i);
ok(!oemDupB.length, "part number used as primary on two bike parts: " + oemDupB.join(", "));
// every dealer row is in data.js, either as its own part or merged onto one
const merged = new Set(PARTS.flatMap(p => p.merged_from || []));
const lost = DL.DEALER_PARTS.filter(d => !seen[d.id] && !merged.has(d.id)).map(d => d.id);
ok(!lost.length, "dealer parts neither added nor merged: " + lost.join(", "));
const newParts = PARTS.filter(p => /^d\d{4}$/.test(p.id));
const badNew = newParts.filter(p => !isAsk(p) || !(p.sources || []).length || !p.source_url).map(p => p.id);
ok(newParts.length > 0 && !badNew.length, "new dealer parts must be askPrice with sources: " + badNew.join(", "));
const flagDrift = newParts.filter(p => {
  const d = DL.DEALER_PARTS.find(x => x.id === p.id);
  return p.v !== d.v || p.confirmed !== d.confirmed || p.note !== cleanNote(d.note) || JSON.stringify(p.sources) !== JSON.stringify(d.sources);
}).map(p => p.id);
ok(!flagDrift.length, "new dealer parts changed v/confirmed/note/sources: " + flagDrift.join(", "));
console.log(`  ${newParts.length} dealer parts added, ${merged.size} merged onto existing numbers`);

const byOem = (o) => PARTS.find(p => p.oem === o);
const belt = byOem("B8R-E7641-00");
ok(belt && belt.fits.includes("aerox155") && belt.fits.includes("yamaha-aerox-alpha155-std-id"),
   "Aerox 155 + Aerox Alpha belt is B8R-E7641-00");
ok(belt && belt.alts.includes("B65-E7641-00") && !byOem("B65-E7641-00"), "B65-E7641-00 is an alternate on the B8R belt, not its own part");
ok(belt && /B65-E7641-00 superseded by B8R-E7641-00/.test(belt.note), "belt note records the supersession");
const rpad = byOem("3C1-F5805-10");
ok(rpad && !rpad.fits.includes("aerox155") && rpad.fits.includes("nmax155"), "3C1-F5805-10 no longer fits Aerox 155 (still NMAX)");
ok(!PARTS.some(p => p.cat === "brake" && /rear/i.test(p.name) && /pad/i.test(p.name) && p.fits.includes("aerox155")), "no rear disc pad on the drum-braked Aerox 155");
ok(/drum/.test(MODELS.find(m => m.id === "aerox155").notice || ""), "Aerox 155 carries a drum-brake notice");
const alphaPad = byOem("B6H-F5805-00");
ok(alphaPad && alphaPad.fits.includes("yamaha-aerox-alpha155-std-id") && alphaPad.confirmed === "verify", "Aerox Alpha rear pad B6H-F5805-00, marked verify");
const fpad = byOem("B63-F5805-00");
ok(fpad && fpad.alts.includes("2DP-F5805-00") && fpad.fits.includes("yamaha-exciter155-vva-b5v") && fpad.confirmed === "verify",
   "Exciter 155 VVA front pad: B63-F5805-00 primary, 2DP-F5805-00 alternate, verify");
ok(byOem("06455-KVB-T01").alts.includes("06455-KVB-912"), "Air Blade pad lists 06455-KVB-912 as alternate");
ok(byOem("40530-KPH-902").alts.includes("40530-KPH-901"), "Wave chain lists 40530-KPH-901 as alternate");
// Honda interchange (sameJob) groups by the 5-digit Honda group code; no
// non-Honda-only part may parse into one.
const hondaIds = new Set(MODELS.filter(m => m.brand === "Honda").map(m => m.id));
const leak = PARTS.filter(p => group(p.oem) && !p.universal && !p.fits.some(f => hondaIds.has(f))).map(p => p.id + " " + p.oem);
ok(!leak.length, "non-Honda parts that would enter a Honda interchange group: " + leak.join(", "));
for (const id of ["cfmoto-150sc-cf150t-31-2025", "cfmoto-300sr-cf300-3-my22", "keeway-vieste-300-xdv-e5",
                  "yamaha-exciter155-vva-b5v", "yamaha-aerox-alpha155-std-id"]) {
  ok(PARTS.some(p => p.fits.includes(id)), `${id} has parts`);
}

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
const parsun = E.models.filter(m => m.brand === "Parsun");
ok(parsun.length === 4 && parsun.every(m => m.vertical === "outboards"), `Parsun has 4 outboard models (${parsun.length})`);
const pids = new Set(parsun.map(m => m.id));
const parsunParts = E.parts.filter(p => p.fits.some(f => pids.has(f)));
ok(parsunParts.length === DL.DEALER_MARINE_PARTS.length, `all ${DL.DEALER_MARINE_PARTS.length} Parsun rows are in data-equip.js (${parsunParts.length})`);
ok(parsunParts.every(p => p.price === null && p.askPrice === true && p.src.length), "Parsun parts are ask-for-price with sources");
ok(parsunParts.every(p => p.fits.every(f => pids.has(f))), "Parsun parts fit only Parsun engines");
console.log(`  Parsun: ${parsun.length} models, ${parsunParts.length} parts`);
ok(html.includes('id="vertChips"'), "index.html has the category picker");

sec("No reference prices in customer notes");
// Dealer research (overseas ref prices, competitor stock on a date) must not reach the site.
const REF_PRICE = /ref price|\b(AUD|USD|HUF|IDR|RON|CAD)\b\s*\d|\d[\d.,]*\s*(AUD|USD|HUF|IDR|RON|CAD)\b|Sold Out on/i;
const refBike = PARTS.filter(p => REF_PRICE.test(p.note || "")).map(p => p.id);
const refEq = E.parts.filter(p => REF_PRICE.test(p.note || "")).map(p => p.id);
ok(!refBike.length, "data.js part notes with a reference price / stock remark: " + refBike.slice(0, 20).join(", "));
ok(!refEq.length, "data-equip.js part notes with a reference price / stock remark: " + refEq.slice(0, 20).join(", "));
const dealerModelIds = new Set([...DL.DEALER_MODELS, ...DL.DEALER_MARINE_MODELS].map(m => m.id));
const mvrModels = [...MODELS, ...E.models].filter(m => dealerModelIds.has(m.id) && /\bMVR\b|\bRf\b/.test(m.note || "")).map(m => m.id);
ok(!mvrModels.length, "dealer model notes with an MVR price: " + mvrModels.join(", "));
console.log(`  ${PARTS.length + E.parts.length} part notes checked`);

sec("Oils & lubricants (data-lubes.js)");
const lubesSrc = fs.readFileSync("data-lubes.js", "utf8");
ok(lubesSrc === fs.readFileSync("src-data/lubes/data-lubes.js", "utf8"), "data-lubes.js matches src-data/lubes/data-lubes.js (run node tools/build-lubes.js)");
const lctx = {};
vm.createContext(lctx);
vm.runInContext(lubesSrc + "\n;globalThis.__L = LUBES;", lctx);
const L = lctx.__L;
ok(L && Array.isArray(L.entries) && Array.isArray(L.types), "LUBES loads with types and entries");
ok(L.entries.length === 33, `33 lubricant entries (${L.entries.length})`);
const lTypes = new Set(L.types.map(t => t.id));
const lMiss = L.entries.filter(e => !e.id || !e.type || !e.title || !Array.isArray(e.packs) || !e.packs.length).map(e => e.id);
ok(!lMiss.length, "entries missing id/type/title/packs: " + lMiss.join(", "));
const lBadType = L.entries.filter(e => !lTypes.has(e.type)).map(e => e.id);
ok(!lBadType.length, "entries with a type not in LUBES.types: " + lBadType.join(", "));
const lIds = L.entries.map(e => e.id);
ok(lIds.every((id, i) => lIds.indexOf(id) === i), "lubricant ids are unique");
const allMids = new Set(MODELS.map(m => m.id).concat(E.models.map(m => m.id)));
const lBadFit = L.entries.flatMap(e => e.fits.filter(f => !allMids.has(f)).map(f => `${e.id}->${f}`));
ok(!lBadFit.length, "lubricant fits that are not bike or equipment model ids: " + lBadFit.join(", "));
const lBadVert = L.entries.flatMap(e => (e.fitsVerticals || []).filter(v => !vids.has(v)).map(v => `${e.id}->${v}`));
ok(!lBadVert.length, "lubricant fitsVerticals that are not verticals: " + lBadVert.join(", "));
const partById = Object.fromEntries(PARTS.map(p => [p.id, p]));
const priced = L.entries.filter(e => e.price != null);
ok(priced.every(e => typeof e.price === "number" && e.avasPart), "no lubricant price without an existing data.js part (avasPart)");
ok(L.entries.filter(e => e.avasPart).every(e => partById[e.avasPart] && partById[e.avasPart].price === e.price),
   "every avasPart entry's price equals the data.js part price");
ok(JSON.stringify(priced.map(e => `${e.avasPart}:${e.price}`).sort()) === JSON.stringify(["p030:165", "p058:145", "p133:165"]),
   "only brake fluid (p030 165), coolant (p058 145) and chain lube (p133 165) carry a price");
const badOil = Object.keys(L.modelOil).filter(id => !mids.has(id));
ok(!badOil.length, "modelOil keys that are not data.js model ids: " + badOil.join(", "));
const lIdSet = new Set(lIds);
ok(Object.values(L.modelOil).every(o => o.url && /^https:\/\//.test(o.url) && o.items.length && (o.entry == null || lIdSet.has(o.entry))),
   "every modelOil has a manual url, items and a valid entry link");
ok(/0\.80 L/.test(L.modelOil["honda-airblade125-ad-2023"].items[0].value), "Air Blade 125 (2023+) engine oil 0.80 L at change");
const COMPETITORS = ["Leo", "Seagear", "Motul shop", "Arzol shop", "Sonee", "Auto Care", "Petrol Ofisi", "Sinopec", "Prestone"];
const named = COMPETITORS.filter(n => new RegExp(`\\b${n}\\b`, "i").test(lubesSrc));
ok(!named.length, "competitor names in data-lubes.js: " + named.join(", "));
const stockCodes = ["BRIT0", "SGR10", "MO00", "AR00"].filter(c => lubesSrc.includes(c));
ok(!stockCodes.length, "competitor stock codes in data-lubes.js: " + stockCodes.join(", "));
ok(app.includes('"data-lubes.js"') && !html.includes('src="data-lubes.js"'), "data-lubes.js is lazy-loaded by app.js, not by index.html");
console.log(`  ${L.entries.length} entries · ${L.types.length} types · ${priced.length} priced · ${Object.keys(L.modelOil).length} models with owner-manual fluids`);

console.log(`\n${checks} checks`);
console.log("\n" + (fail ? `${fail} check(s) FAILED` : "All checks passed"));
process.exit(fail ? 1 : 0);
