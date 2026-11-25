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
// (price null + askPrice true). Priced parts carry the full staff fields in the
// internal sidecar src-data/bike-staff.json (never in the public data.js).
const isPriced = p => typeof p.price === "number" && p.price > 0 && !p.askPrice;
const isAsk    = p => p.price == null && p.askPrice === true;
const PRICED = PARTS.filter(isPriced), ASK = PARTS.filter(isAsk);
const badPrice = PARTS.filter(p => !isPriced(p) && !isAsk(p)).map(p => p.id);
ok(!badPrice.length, "neither priced nor askPrice: " + badPrice.join(", "));
const miss = PARTS.filter(p => !p.name || !p.oem || !p.cat).map(p => p.id);
ok(!miss.length, "missing name/oem/cat: " + miss.join(", "));
// The sidecar is private (gitignored): present on the shop machine, absent in CI
// or a fresh clone. Its checks run when it is there and are skipped otherwise.
const STAFF_PATH = "src-data/bike-staff.json";
const STAFF = fs.existsSync(STAFF_PATH) ? JSON.parse(fs.readFileSync(STAFF_PATH, "utf8")) : null;
if (!STAFF) console.log("  skipping staff/cost checks: " + STAFF_PATH + " not present");
let missStaff = [];
if (STAFF) {
  const staffOf = (p) => STAFF[p.id] || {};
  missStaff = PRICED.filter(p => { const s = staffOf(p);
    return typeof s.cost !== "number" || s.stock == null || s.rop == null || !s.bin; }).map(p => p.id);
  ok(!missStaff.length, "priced parts missing cost/stock/rop/bin: " + missStaff.join(", "));
}
console.log(`  ${PRICED.length} priced · ${ASK.length} ask-for-price · ${miss.length + missStaff.length + badPrice.length ? "problems found" : "every part complete"}`);

sec("Commercial sanity");
if (STAFF) {
  const staffOf = (p) => STAFF[p.id] || {};
  const badMargin = PRICED.filter(p => staffOf(p).cost >= p.price).map(p => p.id);
  ok(!badMargin.length, "cost >= price: " + badMargin.join(", "));
  const margins = PRICED.map(p => (p.price - staffOf(p).cost) / p.price);
  const avg = margins.reduce((a, b) => a + b, 0) / margins.length;
  console.log(`  average gross margin (priced parts) ${(avg * 100).toFixed(1)}%`);
  ok(avg > 0.3 && avg < 0.65, "average margin outside a plausible 30–65% band");
} else console.log("  skipping staff/cost checks: " + STAFF_PATH + " not present");

sec("No staff data in the public data.js");
const staffKeys = PARTS.filter(p => ["cost", "bin", "rop"].some(k => k in p)).map(p => p.id);
ok(!staffKeys.length, "data.js parts ship cost / bin / rop: " + staffKeys.slice(0, 20).join(", "));
const qtyParts = PARTS.filter(p => "stock" in p && p.stock !== 0 && p.stock !== 1).map(p => p.id);
ok(!qtyParts.length, "data.js parts ship an exact stock quantity (must be a 0/1 flag): " + qtyParts.slice(0, 20).join(", "));
const flagged = PARTS.filter(p => "stock" in p);
ok(flagged.length > 0, "some parts ship a public stock flag");
if (STAFF) {
  ok(flagged.every(p => STAFF[p.id] && typeof STAFF[p.id].stock === "number"),
     "every public stock flag comes from a sidecar quantity");
  ok(flagged.every(p => p.stock === (STAFF[p.id].stock > 0 ? 1 : 0)), "public stock flags match the sidecar quantities");
  ok(PARTS.every(p => !p.lowStock || (STAFF[p.id].stock > 0 && STAFF[p.id].stock <= STAFF[p.id].rop)), "lowStock only where qty <= re-order point");
  ok(Object.keys(STAFF).every(id => seen[id]), "every sidecar entry names a part in data.js");
  console.log(`  ${flagged.length} parts ship a stock flag; ${Object.keys(STAFF).length} sidecar entries hold cost / bin / rop / qty`);
} else console.log(`  ${flagged.length} parts ship a stock flag; skipping staff/cost checks: ${STAFF_PATH} not present`);

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
ok(JSON.stringify(ZONES.map(z => z.name)) === JSON.stringify(["Malé", "Hulhumalé", "Boats (harbour drop-off)"]),
   "zones are exactly Malé, Hulhumalé, Boats (harbour drop-off): " + ZONES.map(z => z.name).join(", "));
ok(ZONES.every(z => z.id && z.fee === 0), "every delivery zone is free and has an id");
ok(!ZONES.some(z => /Villim|atoll|resort/i.test(z.name)), "no Villimalé, atoll or resort zones");
console.log(`  ${ZONES.length} zones, all free`);

sec("Front-end wiring");
const html = fs.readFileSync("index.html", "utf8");
const app  = fs.readFileSync("app.js", "utf8");
const needed = ["q","grid","catWrap","brandChips","modelChips","modelRow","cartOpen","cartN",
  "cartBody","cartFoot","zone","zoneList","custName","custPhone","custIsland","custNote",
  "tSub","tDel","tGst","tAll","tAskRow","tAsk","goBtn","scrim","toast","detailBody","detailTitle","rTitle",
  "rCount","clearBtn"];
const missingIds = needed.filter(id => !html.includes(`id="${id}"`));
ok(!missingIds.length, "app.js references ids missing from index.html: " + missingIds.join(", "));
console.log(`  ${needed.length - missingIds.length}/${needed.length} element ids present`);

sec("Shop view only: no Counter view, no source links");
ok(!/modeSwitch|data-skin|>\s*(Shop|Counter)\s*</.test(html), "index.html has no Shop / Counter switch");
ok(!/applySkin|state\.skin|avas\.skin|data-skin|staffbox/.test(app), "app.js has no skin switch or staffbox");
const cssSrc = fs.readFileSync("styles.css", "utf8");
ok(!/data-skin|staffbox|\.mode\b/.test(cssSrc), "styles.css has no staff skin, staffbox or mode switch");
ok(!/\bp\.(cost|bin|rop)\b|>(Cost|Margin|Bin|Re-order)</.test(app), "app.js reads or labels no cost / margin / bin / re-order");
ok(!/sourceLinks|srclink|srclist|mnote-src|<h4>Source|No source link recorded/.test(app + cssSrc), "no Source box or source-link markup");
ok(!/\.(source_url|sources|catalogue_url|manual_url|urls)\b/.test(app), "app.js never reads source_url / sources / catalogue_url / manual_url / EQUIP.urls");
ok(!/Counter note/.test(app) && app.includes("<h4>Note</h4>"), "bike drawer note heading is \"Note\"");
ok(app.includes("Fitment &amp; notes →") && !/Fitment, source/.test(app), "equipment card button reads \"Fitment & notes\"");
sec("Online checkout destinations");
ok(html.includes('id="coDestination"') && html.includes('id="coAddressLabel"'), "checkout has the destination select and address label");
ok(!/id="coAtoll"|id="coIsland"/.test(html) && !/\bATOLLS\b|coAtoll|coIsland/.test(app), "atoll dropdown / island field removed");
const dm = app.match(/const DESTINATIONS = \[([\s\S]*?)\];/);
const dvals = dm ? [...dm[1].matchAll(/value: "([^"]+)", label: "([^"]+)"/g)].map(m => m[1] + "=" + m[2]) : [];
ok(JSON.stringify(dvals) === JSON.stringify(["Malé=Malé", "Hulhumalé=Hulhumalé", "Boats=Boats (harbour drop-off)"]), "destinations are exactly Malé, Hulhumalé, Boats: " + dvals.join(", "));
ok(!/quoted manually|quoted later|quote shipping|Bank details will be shared/.test(html + app), "no shipping-quote or old bank wording in the checkout");
ok(html.includes("Bank transfer details to follow") && html.includes("Cash on delivery is not available"), "checkout notes: bank transfer placeholder and no COD");
console.log(`  ${dvals.length} destinations`);

sec("Customer-facing copy");
const css = fs.readFileSync("styles.css", "utf8");
const art = fs.readFileSync("art.js", "utf8");
const STALE = /every island|nationwide|inhabited island|across every atoll|cash on delivery (is )?available|pay (by )?cash/i;
for (const [f, src] of [["index.html", html], ["app.js", app], ["data.js tagline", SHOP.tagline]])
  ok(!STALE.test(src), `${f}: no every-island / nationwide / cash-on-delivery claims` + (STALE.test(src) ? " → " + src.match(STALE)[0] : ""));
ok(/Free delivery/.test(SHOP.tagline), "SHOP.tagline advertises the free delivery area");

sec("No stock or schematic images");
const ictx = { console };
vm.createContext(ictx);
vm.runInContext(fs.readFileSync("images.js", "utf8") + "\n" + art + "\n;globalThis.__A = { artHTML, IMAGES };", ictx);
const A = ictx.__A;
ok(!/unsplash|picsum|pexels|placeholder\.com|loremflickr/i.test(html + app + art + css), "no stock-photo hosts referenced");
ok(!/<svg[^>]*role="img"|schematic/i.test(art), "art.js draws no schematic parts");
const noPhoto = A.artHTML({ id: "zz-none", name: "Drive belt", oem: "23100-K36-J01", cat: "drive" });
ok(noPhoto === "", "a part without a photo renders no image area at all");
const eqNoPhoto = A.artHTML({ id: "zz-eq", name: "Impeller", oem: "6CE-44352-00", cat: "cooling", vertical: "outboards" });
ok(eqNoPhoto === "", "an equipment part without a photo renders no image area either");
ok(!/No photo yet|nophoto|no-photo/i.test(art + css + app), "no 'No photo yet' label, .nophoto icon or no-photo class left in art.js, styles.css or app.js");
const withPhoto = A.artHTML({ id: "zz-photo", name: "Belt <x>", img: "img/belt.jpg" });
ok(/<img src="img\/belt\.jpg"/.test(withPhoto) && /alt="Belt &#60;x&#62;"/.test(withPhoto) && /<svg|No photo/i.test(withPhoto) === false,
   "a real photo is shown, escaped, with nothing else in the thumb");
ok(/onerror="this\.closest\('\.art'\)\.remove\(\);"/.test(withPhoto), "a photo that fails to load removes the whole thumb (blank fallback)");
const photoN = PARTS.filter(p => p.img || A.IMAGES[p.id]).length;
console.log(`  ${photoN} part(s) with a real photo; ${PARTS.length - photoN} have no image area`);

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
/* Mercury 115 stock-list parts deliberately ship with no source link (research
   URLs stay in src-data/mercury-115-sources.md); every other part needs one. */
const M115 = "mercury-115-fourstroke-efi";
const isM115 = (p) => p.fits.length === 1 && p.fits[0] === M115;
const eBadSrc = E.parts.filter(p => !isM115(p)).filter(p => !(p.src || []).length || p.src.some(i => !/^https?:\/\//.test(E.urls[i] || ""))).map(p => p.id);
ok(!eBadSrc.length, "equipment parts without a resolvable source url: " + eBadSrc.slice(0, 20).join(", "));
ok(E.parts.some(p => /\//.test(p.oem)), "slash part numbers (e.g. JCB 320/B4420) kept as printed");
const unv = E.parts.filter(p => p.tier === "genuine-unverified").length;
ok(unv > 0 && E.parts.every(p => p.tier === "genuine" || p.tier === "genuine-unverified"), "tiers are genuine / genuine-unverified");
console.log(`  ${unv} numbers marked "to be confirmed"; ${E.urls.length} distinct source urls`);
ok(app.includes('"data-equip.js"') && !html.includes('src="data-equip.js"'), "data-equip.js is lazy-loaded by app.js, not by index.html");
const parsun = E.models.filter(m => m.brand === "Parsun");
ok(parsun.length === 6 && parsun.every(m => m.vertical === "outboards"), `Parsun has 6 outboard models (${parsun.length})`);
const parsunDealerIds = DL.DEALER_MARINE_MODELS.map(m => m.id);
ok(parsunDealerIds.length === 4 && parsunDealerIds.every(id => E.models.some(m => m.id === id)), "the 4 MotoX Parsun models with parts are all in the picker");
const pids = new Set(parsun.map(m => m.id));
const parsunParts = E.parts.filter(p => p.fits.some(f => pids.has(f)));
ok(parsunParts.length === DL.DEALER_MARINE_PARTS.length, `all ${DL.DEALER_MARINE_PARTS.length} Parsun rows are in data-equip.js (${parsunParts.length})`);
ok(parsunParts.every(p => p.price === null && p.askPrice === true && p.src.length), "Parsun parts are ask-for-price with sources");
ok(parsunParts.every(p => p.fits.every(f => pids.has(f))), "Parsun parts fit only Parsun engines");
ok(parsunDealerIds.every(id => parsunParts.some(p => p.fits.includes(id))), "every MotoX Parsun model with a parts list has parts");
ok(["parsun-f130", "parsun-f300"].every(id => pids.has(id) && !parsunParts.some(p => p.fits.includes(id))), "Parsun F130 and F300 are empty engine entries");
console.log(`  Parsun: ${parsun.length} models, ${parsunParts.length} parts`);
ok(html.includes('id="vertChips"'), "index.html has the category picker");

sec("Mercury 115 FourStroke EFI (stock list)");
const m115 = E.models.find(m => m.id === M115);
ok(m115 && m115.vertical === "outboards" && m115.brand === "Mercury" && m115.name === "FourStroke 2.1L 115 hp",
   "model mercury-115-fourstroke-efi is an outboard named Mercury FourStroke 2.1L 115 hp");
ok(m115 && !m115.catalogue_url && !/https?:|www\./i.test(m115.note || ""), "Mercury 115 model has no outside link");
ok(m115 && /2B095049/.test(m115.note) && /serial/i.test(m115.note), "Mercury 115 model note asks for the engine serial");
const m115Parts = E.parts.filter(p => p.fits.includes(M115));
ok(m115Parts.length === 58 && m115Parts.every(isM115), `Mercury 115 has 58 parts fitting only that engine (${m115Parts.length})`);
ok(m115Parts.every(p => p.price === null && p.askPrice === true), "Mercury 115 parts are ask-for-price");
ok(m115Parts.every(p => p.stock === 1 && !("rop" in p) && !("bin" in p) && !("cost" in p)), "Mercury 115 parts ship a stock flag of 1 only (no qty, rop, bin, cost)");
ok(m115Parts.every(p => Array.isArray(p.src) && p.src.length === 0 && !p.source_url && !p.sources), "Mercury 115 parts ship no source urls");
ok(m115Parts.every(p => !/https?:|www\./i.test(p.note || "")), "Mercury 115 notes carry no links");
ok(E.parts.filter(p => "stock" in p).every(isM115), "only Mercury 115 parts ship a stock flag");
const m115By = Object.fromEntries(m115Parts.map(p => [p.oem, p]));
for (const pn of ["35-877769K01", "35-877769Q01", "35-877761K01", "35-877761Q01"])
  ok(m115By[pn], `${pn} is its own Mercury 115 part`);
ok(m115By["35-877761K01"] && m115By["35-877761K01"].tier === "genuine", "35-877761K01 is confirmed (genuine)");
ok(m115By["35-877769K01"] && m115By["35-877769K01"].tier === "genuine-unverified", "35-877769K01 is to be confirmed (genuine-unverified)");
const m115Unv = m115Parts.filter(p => p.tier === "genuine-unverified").length;
ok(m115Unv === 13 && m115Parts.length - m115Unv === 45, `Mercury 115: 45 confirmed + 13 to be confirmed (${m115Parts.length - m115Unv} + ${m115Unv})`);
ok(m115By["8M0133370"] && m115By["8M0133370"].alts.includes("8M0-0133370"), "list spelling 8M0-0133370 kept as an alternate");
// The blank-PN Clamp must not appear; the clamps that are listed all carry a 54- number.
const noPN = m115Parts.filter(p => !p.oem.trim() || (/^clamp\b/i.test(p.name) && !/^54-/.test(p.oem)) ||
  /end fitting|gear oil|gear lube|80W-?40|SAE ?90/i.test(p.oem + " " + p.name)).map(p => p.id);
ok(!noPN.length, "no needs-a-part-number rows (blank Clamp, FF End Fitting, 80W-40, SAE 90) in the catalogue: " + noPN.join(", "));
// The site search haystack (app.js eqHaystack) finds 35-877769K01.
const appCtx = { console };
vm.createContext(appCtx);
const squashSrc = app.match(/const squash = [^\n]+/);
ok(squashSrc, "app.js defines squash()");
if (squashSrc) {
  vm.runInContext(squashSrc[0] + ";globalThis.__sq = squash;", appCtx);
  const sq = appCtx.__sq;
  const hit = m115Parts.filter(p => [p.oem, sq(p.oem), ...p.alts, ...p.alts.map(sq)].join(" ").toLowerCase().includes(sq("35-877769K01").toLowerCase()));
  ok(hit.length === 1 && hit[0].oem === "35-877769K01", "search for 35-877769K01 finds exactly that part, not Q01");
}
console.log(`  ${m115Parts.length} parts: ${m115Parts.length - m115Unv} confirmed, ${m115Unv} to be confirmed`);

sec("Engine range: empty models, names, Step 2 sort");
const ENGINE_V = ["outboards", "marine_diesel", "jetski", "generators"];
const RG = {};
vm.createContext(RG);
vm.runInContext(fs.readFileSync("src-data/data-engine-range.js", "utf8") + "\n;globalThis.__R = {MODEL_META, RANGE_MODELS};", RG);
const rangeIds = new Set(RG.__R.RANGE_MODELS.map(r => r[0]));
const fitCount = {};
E.parts.forEach(p => p.fits.forEach(f => { fitCount[f] = (fitCount[f] || 0) + 1; }));
const emptyModels = E.models.filter(m => !fitCount[m.id]);
ok(emptyModels.length === rangeIds.size && emptyModels.every(m => rangeIds.has(m.id)),
   `only the engine-range entries are empty (${emptyModels.length} empty, ${rangeIds.size} range entries)`);
ok(emptyModels.every(m => !m.catalogue_url && !m.source_url && !m.sources && !m.note && !m.src),
   "empty engine entries ship no catalogue / source link and no note");
ok(!/https?:|www\./i.test(fs.readFileSync("src-data/data-engine-range.js", "utf8")), "src-data/data-engine-range.js holds no URLs");
ok(E.models.every(m => !("src_title" in m)), "no scraped page titles shipped as model text");
const ODD = /PartsVu|Yanmar Shop|spec book|Service Kit|\bproduct\b/i;
ok(!E.models.some(m => ODD.test(m.name) || ODD.test((m.aka || []).join(" "))), "no page-title or kit-title model names: " +
   E.models.filter(m => ODD.test(m.name)).map(m => m.name).join(", "));
ok(E.models.filter(m => ENGINE_V.includes(m.vertical)).every(m => typeof m.size === "number" && m.size > 0 && m.unit),
   "every outboard, marine diesel, jet ski and generator has a numeric size and unit");
const nameDup = E.models.filter((m, i, a) => a.findIndex(o => o.vertical === m.vertical && o.brand === m.brand && o.name === m.name) !== i);
ok(!nameDup.length, "duplicate Step 2 names within a make: " + nameDup.map(m => m.id).join(", "));
const HM = ["SeaPro 15 hp", "SeaPro 25 hp", "SeaPro 60 hp", "SeaPro 90 hp", "SeaPro 2.1L 115 hp", "SeaPro 3.0L 150 hp",
  "SeaPro V6 3.4L 200 hp", "SeaPro V8 4.6L 250 hp", "SeaPro V8 4.6L 300 hp", "SeaPro V10 5.7L 350 hp", "SeaPro V12 7.6L 500 hp",
  "Verado V10 5.7L 400 hp", "Avator 7.5e", "Avator 20e", "Avator 35e",
  "FourStroke 2.1L 115 hp", "FourStroke V8 4.6L 250–300 hp", "Verado L6 200–350 hp"];
const merc = E.models.filter(m => m.vertical === "outboards" && m.brand === "Mercury");
ok(HM.every(n => merc.some(m => m.name === n)) && merc.length === HM.length, `Mercury lists the Hassan Marine range + existing engines (${merc.length})`);
ok(!fitCount["mercury-seapro-115"], "SeaPro 115 does not carry the FourStroke 115 stock list");
ok(E.models.some(m => m.id === "yamaha-15fmh-2stroke") && E.models.some(m => m.id === "yamaha-e15dmh-enduro-2stroke"), "Yamaha 15FMH and E15DMH stay separate engines");
// The picker's sort, run from app.js on the shipped models.
const sortSrc = app.match(/function byEngineSize[\s\S]*?\n}\n/);
ok(sortSrc, "app.js defines byEngineSize()");
if (sortSrc) {
  const sctx = {};
  vm.createContext(sctx);
  vm.runInContext(sortSrc[0] + ";globalThis.__s = byEngineSize;", sctx);
  const step2 = (v, b) => E.models.filter(m => m.vertical === v && m.brand === b).sort(sctx.__s).map(m => m.name);
  const before = (list, a, b) => list.indexOf(a) >= 0 && list.indexOf(b) >= 0 && list.indexOf(a) < list.indexOf(b);
  const mList = step2("outboards", "Mercury"), yList = step2("outboards", "Yamaha");
  ok(before(mList, "SeaPro 15 hp", "SeaPro V12 7.6L 500 hp"), "Mercury: SeaPro 15 before SeaPro 500");
  ok(mList[0] === "Avator 7.5e" && before(mList, "FourStroke 2.1L 115 hp", "SeaPro 2.1L 115 hp"), "Mercury: 7.5 hp first; FourStroke 115 before SeaPro 115");
  ok(yList[0] === "2-stroke 4 hp" && before(yList, "2-stroke 4 hp", "F350 350 hp") && yList[yList.length - 1] === "XTO 450 hp", "Yamaha: 2-stroke 4 hp first, XTO 450 last");
  ok(before(yList, "2-stroke 15 hp (2000–2009)", "F15 15 hp") && before(yList, "F15 15 hp", "Enduro 2-stroke E15DMH 15 hp"), "Yamaha 15 hp: 2-stroke, then F, then Enduro");
  ok(step2("generators", "Honda").join("|") === "EU22i inverter generator|EU30is inverter generator|EU70is inverter generator", "Honda generators by kVA");
  ok(step2("jetski", "Sea-Doo")[0].startsWith("Spark"), "Sea-Doo: Spark first");
  for (const v of ENGINE_V) for (const b of [...new Set(E.models.filter(m => m.vertical === v).map(m => m.brand))]) {
    const sizes = E.models.filter(m => m.vertical === v && m.brand === b).sort(sctx.__s).map(m => m.size);
    ok(sizes.every((x, i) => !i || sizes[i - 1] <= x), `${v} / ${b}: Step 2 sizes ascend`);
  }
}
for (const v of ENGINE_V) {
  const ms = E.models.filter(m => m.vertical === v);
  console.log(`  ${v.padEnd(14)} ${ms.length} models (${ms.filter(m => !fitCount[m.id]).length} empty)`);
}

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

const { renderedDomainHits } = require("./tools/rendered-text");
const renderedDomainHitsFn = renderedDomainHits;

sec("Belts and impellers from BNF PLUS stock (data-bnf.js)");
const bctx = { console };
vm.createContext(bctx);
vm.runInContext(fs.readFileSync("data-bnf.js", "utf8") + "\n;globalThis.__B = BNF;", bctx);
const B = bctx.__B;
const BELTS = B.parts.filter(p => p.vertical === "belts"), IMPS = B.parts.filter(p => p.vertical === "impellers");
const csvRows = (f) => fs.readFileSync(f, "utf8").trim().split("\n").length - 1;
ok(csvRows("src-data/bnf/belts.csv") === 550 && BELTS.length === 550, `Belts lists all 550 belts.csv rows (${BELTS.length})`);
ok(csvRows("src-data/bnf/impellers.csv") === 64 && IMPS.length === 63, `Impellers lists 63 of 64 rows (${IMPS.length})`);
ok(!IMPS.some(p => p.sku === "IMP1080") && !/G1010/.test(JSON.stringify(B)), "IMP1080 (Sherwood G1010 pump) is skipped");
for (const f of ["src-data/bnf/belts.csv", "src-data/bnf/impellers.csv"])
  ok(!/price|cost/i.test(fs.readFileSync(f, "utf8").split("\n")[0]), `${f} has no price / cost column`);
ok(B.parts.every(p => p.price === null && p.askPrice === true), "every belt and impeller is price:null + askPrice:true");
const bnfPriceKeys = B.parts.filter(p => Object.keys(p).some(k => /price_mvr|price_note|cost|^bin$|^rop$/i.test(k)) ||
  Object.entries(p).some(([k, v]) => /price/i.test(k) && typeof v === "number")).map(p => p.id);
ok(!bnfPriceKeys.length, "no belt / impeller row has a numeric price, price_mvr, cost, bin or rop: " + bnfPriceKeys.slice(0, 10).join(", "));
ok(!/price_mvr|price_note/.test(fs.readFileSync("data-bnf.js", "utf8") + fs.readFileSync("data.js", "utf8") + fs.readFileSync("data-equip.js", "utf8") + app),
   "no price_mvr / price_note anywhere in the shipped data or app.js");
ok(B.parts.every(p => !p.img && !A.IMAGES[p.id] && A.artHTML(p) === ""), "belts and impellers have no photo and render no image area");
ok(B.parts.every(p => !("src" in p) && !p.sources && !p.source_url && !p.catalogue_url), "belts and impellers ship no source or catalogue url");
ok(B.parts.every(p => (p.stock === 1 && !p.orderIn) || (p.stock === 0 && p.orderIn === true)), "availability is a 0/1 flag: In stock or Order in");
ok(BELTS.filter(p => p.orderIn).length === 95 && IMPS.filter(p => p.orderIn).length === 17, "indent rows show Order in (95 belts, 17 impellers)");
const bid = new Set(B.parts.map(p => p.id));
ok(bid.size === B.parts.length && !PARTS.some(p => bid.has(p.id)) && !E.parts.some(p => bid.has(p.id)), "belt / impeller ids are unique across the site");
const G = Object.fromEntries(B.groups.map(g => [g.id, g]));
ok(BELTS.every(p => G[p.grp] && G[p.grp].vertical === "belts" && !p.fits.length), "every belt sits in a group and fits no engine");
const grpCount = (id) => BELTS.filter(p => p.grp === id).length;
ok(grpCount("belts-4pk") === 124 && grpCount("belts-6pk") === 127 && grpCount("belts-8pk") === 142 && grpCount("belts-a") === 52 && grpCount("belts-b") === 53 && grpCount("belts-m") === 2,
   "PK by rib count, classical by section: 4PK 124, 6PK 127, 8PK 142, A 52, B 53, M 2");
const lenOf = (p) => +(p.oem.match(/(\d+)$/) || [])[1];
ok(["belts-8pk", "belts-a"].every(g => { const l = BELTS.filter(p => p.grp === g).map(lenOf); return l.every((x, i) => !i || l[i - 1] <= x); }), "belts sort by length within a group");
ok(BELTS.filter(p => p.oem.replace(/\s/g, "") === "5PK890").map(p => p.sku).sort().join() === "BLT044,BLT522", "5PK890 stays two rows (Mitsuboshi BLT044, Mitsusmi BLT522)");
ok(["Mitsuboshi", "Mitsusmi"].every(b => BELTS.some(p => p.brand === b)) && IMPS.every(p => p.brand === "Hengshui"), "product brand shown: Mitsuboshi / Mitsusmi / Hengshui");
const vui = app.match(/const VERTICALS_UI = \[([\s\S]*?)\];/);
ok(vui && /id: "belts"[^}]*bnf: true/.test(vui[1]) && /id: "impellers"[^}]*bnf: true/.test(vui[1]), "VERTICALS_UI has Belts and Impellers chips");
ok(app.includes('"data-bnf.js"') && !html.includes('src="data-bnf.js"'), "data-bnf.js is lazy-loaded by app.js, not by index.html");

// Search: the app's own haystack + term matcher on the shipped rows.
{
  const sctx = { console, VERT_BY_ID: { belts: { name: "Belts" }, impellers: { name: "Impellers" } },
    CAT_BY_ID: Object.fromEntries(B.cats.map(c => [c.id, c])),
    MODEL_BY_ID: Object.fromEntries([...B.groups, ...Object.values(B.models)].map(m => [m.id, m])),
    isEq: (p) => !!p.vertical };
  vm.createContext(sctx);
  const grab = (re, what) => { const m = app.match(re); ok(m, `app.js defines ${what}`); return m ? m[0] : ""; };
  vm.runInContext([grab(/const squash = [^\n]+/, "squash()"), grab(/function eqModelText[\s\S]*?\n}\n/, "eqModelText()"),
    grab(/function bnfHaystack[\s\S]*?\n}\n/, "bnfHaystack()"),
    "let state = { q: '' };", grab(/const qTerms = [^\n]+/, "qTerms()"), grab(/const termsMatch = [\s\S]*?;\n/, "termsMatch()"),
    "globalThis.__S = (q) => { state.q = q; const t = qTerms(); return BNF_PARTS.filter(p => termsMatch(p, t)); };"].join("\n"), sctx);
  sctx.BNF_PARTS = B.parts.map(p => ({ ...p, _h: sctx.bnfHaystack ? sctx.bnfHaystack(p) : "" }));
  vm.runInContext("var BNF_PARTS = globalThis.BNF_PARTS;", sctx);
  const find = (q) => sctx.__S(q).map(p => p.sku);
  ok(find("8PK1440").includes("BLT443") && find("8PK 1440").includes("BLT443") && find("8pk-1440").includes("BLT443"), "search 8PK1440 / 8PK 1440 / 8pk-1440 finds the belt (BLT443)");
  ok(find("1440").includes("BLT443"), "search 1440 finds the 8PK 1440 belt");
  ok(find("5PK890").length === 2, "search 5PK890 finds both brands");
  ok(find("A68").includes("BLT504") && find("B87").includes("BLT518"), "search A68 / B87 find the classical V-belts");
  ok(find("IMP1043").join() === "IMP1043", "search by impeller SKU finds it");
  ok(find("125613-42762").sort().join() === "IMP1002,IMP1043", "search 125613-42762 (Yanmar OEM xref) finds IMP1043 and IMP1002");
  ok(find("3897337").join() === "IMP1036" && find("6593").join() === "IMP1014", "search 3897337 / 6593 (OEM xrefs) find the BNF impeller");
  ok(find("6HYM").sort().join() === "IMP1002,IMP1043", "search 6HYM finds the impellers matched to the Yanmar 6HYM");
}

sec("Impeller cross-reference matcher (tools/match-impeller-xref.js)");
const MX = require("./tools/match-impeller-xref");
const mx = (xref, oem) => MX.matchImpellers([{ sku: "T", pn: "", xref }], [{ id: "p", oem, alts: [] }]).length === 1;
ok(mx("8200-01, 125613-42762, 500115", "125613-42762"), "125613-42762 ↔ 125613-42762");
ok(mx("7600-01K, 3802444, 3897337, 3916852", "389733700"), "Cummins 3897337 ↔ 389733700 (trailing 00)");
ok(mx("7608-01K, 27000, 27000K, 3974456", "397445600"), "Cummins 3974456 ↔ 397445600 (trailing 00)");
ok(!mx("Mercury, Mariner, Mercruiser Bravo I, II, III", "MERCURY") && MX.keys("MERCURY").length === 0, "brand word MERCURY never matches");
ok(!mx("7054-01, 6593, 8514", "6593") && MX.keys("6593").length === 0, "short number 6593 never matches");
ok(!mx("7054, 3897337", "7054-01") && !mx("3897337", "38973371") && !mx("3897337", "13897337"), "no substring matches (7054 vs 7054-01, 3897337 vs 38973371)");
ok(!mx("3897330", "389733") && !mx("8973370", "89733700") , "trailing 00 only folds on long all-digit numbers");
ok(MX.tokens("Detroit Diesel P, N: 5196168, ohn Deere DZ108622, GLM: 89700").join() === "5196168,DZ108622",
   "labels and brand words are stripped; short numbers dropped");
ok(JSON.stringify(B.links.m01249) === JSON.stringify(["IMP1043", "IMP1002"]), "Yanmar 125613-42762 (m01249) links to IMP1043 and IMP1002");
ok(JSON.stringify(B.links.m00020) === JSON.stringify(["IMP1036"]), "Cummins QSL WP repair kit m00020 links to IMP1036");
ok(JSON.stringify(B.links.m00005) === JSON.stringify(["IMP1037"]), "Cummins QSB WP repair kit m00005 links to IMP1037");
ok(Object.keys(B.links).every(id => E.parts.some(p => p.id === id) || PARTS.some(p => p.id === id)), "every link names a site part");
const impBy = Object.fromEntries(IMPS.map(p => [p.sku, p]));
ok(impBy.IMP1043.fits.join() === "yanmar-6hym-wet" && impBy.IMP1002.fits.join() === "yanmar-6hym-wet", "IMP1043 / IMP1002 fitment chips: Yanmar 6HYM");
ok(impBy.IMP1036.fits.join() === "cummins-marine-qsl" && impBy.IMP1037.fits.sort().join() === "cummins-marine-qsb5-9,cummins-marine-qsb6-7", "IMP1036 → Cummins QSL; IMP1037 → Cummins QSB5.9 / QSB6.7");
ok(IMPS.filter(p => p.fits.length).length === 4 && IMPS.filter(p => !p.fits.length).every(p => !p.xparts), "only matched impellers carry engines (no invented fitment)");
ok(app.includes("?v=impellers&amp;q=") && !/href="https?:[^"]*imp/i.test(app), "the impeller tag links inside the site only");

sec("BNF PLUS stock tags ported from preview-catalogue (24)");
const TAGS = JSON.parse(fs.readFileSync("src-data/bnf/bnf-tags.json", "utf8"));
const EQ_TAG_IDS = ["m00003", "m00014", "m00023", "m01279", "m01280", "m01300", "m01309", "m01310", "m01314", "m01316", "m01318",
  "m01320", "m01321", "m01325", "m01327", "m01329", "m01331", "m01332", "m01333", "m01334", "m01336", "m01339"];
ok(TAGS.equipment.map(t => t.id).join() === EQ_TAG_IDS.join() && TAGS.bike.map(t => t.id).join() === "n0117,n0568", "src-data/bnf/bnf-tags.json holds the 22 equipment + 2 bike tags");
const eqTagged = E.parts.filter(p => p.bnf).map(p => p.id).sort();
ok(eqTagged.join() === EQ_TAG_IDS.join(), `the 22 equipment filters carry a bnf tag (${eqTagged.length})`);
ok(E.parts.filter(p => p.bnf).every(p => p.bnf.kind === "filter_exact" && p.bnf.sku && p.bnf.pn && p.bnf.brand), "equipment tags: filter_exact with SKU, brand, number");
const bikeTagged = PARTS.filter(p => p.bnf).map(p => p.id).sort();
ok(bikeTagged.join() === "n0117,n0568" && PARTS.filter(p => p.bnf).every(p => p.bnf.kind === "bearing_confirmed" && p.bnf.matches.length), "the 2 bike bearings (n0117, n0568) carry their bearing tags");
const tagJSON = JSON.stringify([...E.parts, ...PARTS].filter(p => p.bnf).map(p => p.bnf));
ok(!/price|cost|mvr/i.test(tagJSON), "no ported tag carries a price");
ok(!PARTS.some(p => /^h3[45]\d\d$/.test(p.id)), "the 27 Honda fiche-only tags (h3442–h3522) are not imported");
ok(/function refsHTML/.test(app) && /function bnfSummary/.test(app) && /bnfText\(p\.bnf\)/.test(app), "app.js renders and searches BNF tags (refsHTML / bnfSummary / haystack)");

sec("Rendered-text guard still bites");
{
  const os = require("os"), path = require("path");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "avas-rt-"));
  for (const f of ["data.js", "data-equip.js", "data-bnf.js", "app.js", "index.html"]) fs.copyFileSync(f, path.join(tmp, f));
  const bsrc = fs.readFileSync("data-bnf.js", "utf8").replace('"name":"Flexible impeller"', '"name":"Flexible impeller see bnfplus.com"');
  fs.writeFileSync(path.join(tmp, "data-bnf.js"), bsrc);
  const hitsBad = renderedDomainHitsFn(tmp);
  ok(hitsBad.some(h => /data-bnf\.js/.test(h.where) && h.found.some(f => /bnfplus\.com/i.test(f))), "a forbidden domain in a belt / impeller name is caught");
  fs.copyFileSync("data-bnf.js", path.join(tmp, "data-bnf.js"));
  const esrc = fs.readFileSync("data-equip.js", "utf8").replace('"note":"FIG 29 cooling pumpsea water"', '"note":"FIG 29 cooling pumpsea water, see bnf.plus"');
  fs.writeFileSync(path.join(tmp, "data-equip.js"), esrc);
  ok(esrc.includes("bnf.plus") && renderedDomainHitsFn(tmp).some(h => h.found.some(f => /bnf\.plus/i.test(f))), "a forbidden domain in an engine part note is caught");
  fs.rmSync(tmp, { recursive: true, force: true });
}

sec("No outside site or domain in rendered text");
// Notes, names, notices, catalogue labels and UI copy must not name an outside
// website (tools/rendered-text.js). Internal URL fields are not scanned.
const domHits = renderedDomainHits(__dirname);
ok(!domHits.length, "rendered text names an outside site: " +
  domHits.slice(0, 10).map(h => `${h.where} (${h.found.join(", ")})`).join("; "));
console.log(`  ${domHits.length ? domHits.length + " hits" : "none"} (allowed: avas.parts, bearing.wiki, wa.me)`);

console.log("\n" + (fail ? `${fail} check(s) FAILED` : "All checks passed"));
process.exit(fail ? 1 : 0);
