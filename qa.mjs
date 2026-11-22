/* Browser QA: drives the real page and screenshots it. Run: node qa.mjs */
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const url = "file://" + path.join(dir, "index.html");
const shots = path.join(dir, "shots");

let fail = 0;
const ok = (c, m) => { console.log(`  ${c ? "ok  " : "FAIL"} ${m}`); if (!c) fail++; };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
const equipReqs = [];
page.on("request", r => { if (r.url().includes("data-equip.js")) equipReqs.push(r.url()); });

await page.goto(url);
await page.waitForTimeout(900);

console.log("\nLoad");
ok(errors.length === 0, "no JS errors" + (errors.length ? " → " + errors.join(" | ") : ""));
const total = await page.locator(".card").count();
ok(total > 100, `catalogue renders (${total} cards)`);
ok(equipReqs.length === 0, "data-equip.js is not requested on the default bike page");
ok(await page.locator('#vertChips [data-vertical="bikes"][aria-pressed="true"]').count() === 1, "category picker shows Bikes selected by default");
ok(await page.locator("#vertChips [data-vertical]").count() === 8, "category picker lists 8 categories");
ok(await page.locator(".eqcard").count() === 0 && !(await page.locator("#rNote").isVisible()), "no equipment cards or model note on the bike default");
await page.screenshot({ path: path.join(shots, "01-home.png"), fullPage: false });

console.log("\nBike picker");
await page.click('[data-brand="Honda"]');
await page.waitForTimeout(250);
ok(await page.locator("#modelRow").isVisible(), "model row appears after picking a make");
const hondaN = await page.locator(".card").count();
ok(hondaN > 0 && hondaN < total, `Honda narrows the list (${hondaN} parts)`);

const WAVE = "honda-wave125i-th-2018-2022-k73";
await page.click(`[data-model="${WAVE}"]`);
await page.waitForTimeout(250);
const waveN = await page.locator(".card").count();
ok(waveN > 0 && waveN < hondaN, `Wave 125i narrows further (${waveN} parts)`);
ok((await page.locator("#rTitle").textContent()).includes("Wave 125i"), "heading names the bike");

console.log("\nPrices");
const pricedCards = page.locator(".card:has(.price .amt)");
const askCards = page.locator(".card:has(.price .asklab)");
ok(await pricedCards.count() > 0 && await pricedCards.first().isVisible(), `priced cards shown (${await pricedCards.count()})`);
ok(await askCards.count() > 0 && await askCards.first().isVisible(), `"Ask for price" cards shown (${await askCards.count()})`);
ok((await askCards.first().locator(".price").textContent()).trim() === "Ask for price", "ask card reads \"Ask for price\"");
const gridText = await page.locator("#grid").textContent();
ok(!/NaN|MVR\s*0(?![0-9.,])/.test(gridText), "no NaN or MVR 0 on any card");
await page.screenshot({ path: path.join(shots, "02-bike-selected.png") });

console.log("\nFitment correctness");
// Every visible card must fit the selected Wave 125i or be universal.
const bad = await page.evaluate((wave) => {
  const ok = new Set(PARTS.filter(p => p.universal || p.fits.includes(wave)).map(p => p.id));
  return [...document.querySelectorAll(".card [data-detail]")].map(e => e.dataset.detail).filter(id => !ok.has(id));
}, WAVE);
ok(bad.length === 0, "no part shown that does not fit the selected bike" + (bad.length ? " → " + bad.join(", ") : ""));

console.log("\nCategory rail");
await page.click('[data-cat="brake"]');
await page.waitForTimeout(200);
const brakeN = await page.locator(".card").count();
ok(brakeN > 0 && brakeN < waveN, `Brakes category filters (${brakeN} parts)`);
await page.click('[data-cat=""]');
await page.waitForTimeout(200);

console.log("\nPart detail + interchange");
// Priced Wave parts are all universal stock (no structured number), so the
// decoder is checked on an ask-for-price Wave part with a group-family-variant number.
const pricedId = await pricedCards.first().locator("[data-detail]").getAttribute("data-detail");
const askId = await page.evaluate(() => [...document.querySelectorAll(".card")]
  .filter(c => c.querySelector(".price .asklab"))
  .map(c => PARTS.find(p => p.id === c.querySelector("[data-detail]").dataset.detail))
  .find(p => /^\d{5}-[0-9A-Z]{3}-[0-9A-Z]+$/.test(p.oem)).id);
const pricedPart = await page.evaluate(id => PARTS.find(p => p.id === id), pricedId);
await page.click(`[data-detail="${pricedId}"]`);
await page.waitForTimeout(400);
ok(await page.locator("#detail.on").isVisible(), "detail drawer opens");
const dbody = await page.locator("#detailBody").textContent();
ok(dbody.includes("MVR") && !dbody.includes("Ask for price"), "priced detail shows its MVR price");
ok(dbody.includes("Same job, other model families"), "interchange section shown");
ok(dbody.includes("Fits these bikes"), "fitment list shown");
await page.screenshot({ path: path.join(shots, "03-part-detail.png") });

console.log("\nOrdering");
await page.click('#detailBody [data-add]');
await page.waitForTimeout(300);
ok((await page.locator("#cartN").textContent()).trim() === "1", "priced part added to the order");
await page.click('#detail [data-close]');
await page.waitForTimeout(300);

await page.click(`[data-detail="${askId}"]`);
await page.waitForTimeout(400);
const askBody = await page.locator("#detailBody").textContent();
ok(askBody.includes("Ask for price") && askBody.includes("confirm the price on WhatsApp"), "ask-for-price detail explains the price is confirmed on WhatsApp");
ok(askBody.includes("How to read this number"), "part-number decoder shown");
await page.screenshot({ path: path.join(shots, "03b-ask-detail.png") });
await page.click('#detailBody [data-add]');
await page.waitForTimeout(300);
ok((await page.locator("#cartN").textContent()).trim() === "2", "ask-for-price part added to the order");
await page.click('#detail [data-close]');
await page.waitForTimeout(300);

await page.click("#cartOpen");
await page.waitForTimeout(400);
ok(await page.locator("#cart.on").isVisible(), "order drawer opens");
ok(await page.locator("#goBtn").isDisabled(), "send is blocked until name and phone are given");
ok(await page.locator("#cartBody .lp.ask").count() === 1 &&
   (await page.locator("#cartBody .lp.ask").textContent()).trim() === "price to confirm",
   "ask-for-price line reads \"price to confirm\"");

await page.fill("#custName", "Ahmed Nadheem");
await page.fill("#custPhone", "7712345");
await page.fill("#custIsland", "Hithadhoo, Addu City");
await page.selectOption("#zone", "south");
await page.waitForTimeout(300);
ok(!(await page.locator("#goBtn").isDisabled()), "send unlocks once contact details are filled");

const sub = await page.locator("#tSub").textContent();
const del = await page.locator("#tDel").textContent();
const gst = await page.locator("#tGst").textContent();
const all = await page.locator("#tAll").textContent();
const num = s => +String(s).replace(/[^0-9]/g, "");
ok(num(sub) === pricedPart.price, `subtotal counts only the priced line (MVR ${sub} = ${pricedPart.price})`);
ok(num(del) === 300, `south-atoll delivery fee applied (MVR ${del})`);
ok(num(gst) === Math.round((num(sub) + num(del)) * 0.08), "GST computed on priced goods plus delivery");
ok(all.includes("+ prices to confirm"), `total flags prices to confirm (${all})`);
ok(num(all) === num(sub) + num(del) + num(gst), "total adds up, excluding the unpriced line");
ok(await page.locator("#tAskRow").isVisible() && (await page.locator("#tAsk").textContent()).trim() === "1 item",
   "\"Price to confirm: 1 item\" row shown");
await page.screenshot({ path: path.join(shots, "04-order.png") });

console.log("\nWhatsApp order");
await page.evaluate(() => { window.open = (u) => { window.__wa = u; return null; }; });
await page.click("#goBtn");
await page.waitForTimeout(300);
const wa = await page.evaluate(() => window.__wa || "");
ok(wa.startsWith("https://wa.me/9609600000?text="), "order link targets the shop's WhatsApp number");
const waText = decodeURIComponent(wa.split("?text=")[1] || "");
ok(waText.includes("— price to confirm"), "WhatsApp text marks the unpriced line \"price to confirm\"");
ok(waText.includes(`MVR ${pricedPart.price.toLocaleString("en-US")}`) || waText.includes(`MVR ${pricedPart.price}`), "WhatsApp text prices the priced line");
ok(/\*Total: MVR [0-9,.]+ \+ prices to confirm\*/.test(waText), "WhatsApp total notes \"+ prices to confirm\"");
ok(waText.includes("Price to confirm: 1 item"), "WhatsApp text counts the items to confirm");

console.log("\nQuantity control");
await page.click(`#cartBody [data-q="${pricedId}|2"]`);
await page.waitForTimeout(250);
const sub2 = await page.locator("#tSub").textContent();
ok(num(sub2) === num(sub) * 2, "quantity increase doubles the subtotal");
await page.click(`#cartBody [data-q="${askId}|2"]`);
await page.waitForTimeout(250);
ok(num(await page.locator("#tSub").textContent()) === num(sub2), "ask-for-price quantity does not change the subtotal");
ok((await page.locator("#tAsk").textContent()).trim() === "2 items", "price-to-confirm count follows quantity");
await page.click('#cart [data-close]');
await page.waitForTimeout(300);

console.log("\nStaff mode");
await page.click('[data-skin="staff"]');
await page.waitForTimeout(400);
ok(await page.locator(".staffbox").first().isVisible(), "cost, margin, stock and bin appear at the counter");
const askStaff = await page.locator(".card:has(.price .asklab) .staffbox").first().textContent();
ok(askStaff.includes("—") && !/NaN|undefined|null/.test(askStaff), "unpriced parts show — for cost, margin and stock");
const skin = await page.getAttribute("html", "data-skin");
ok(skin === "staff", "dark counter skin applied");
await page.screenshot({ path: path.join(shots, "05-staff-mode.png") });

// cost must never be visible in shop mode
await page.click('[data-skin="public"]');
await page.waitForTimeout(400);
ok(!(await page.locator(".staffbox").first().isVisible()), "cost price hidden again in shop mode");

console.log("\nSearch");
await page.click("#clearBtn");
await page.waitForTimeout(200);
await page.fill("#q", "23100");
await page.waitForTimeout(350);
const beltN = await page.locator(".card").count();
ok(beltN >= 6, `searching a group code finds every drive belt (${beltN})`);

await page.fill("#q", "23100K36J01");
await page.waitForTimeout(350);
ok(await page.locator(".card").count() === 1, "searching a part number without dashes finds the exact part");

await page.fill("#q", "brake pad pcx");
await page.waitForTimeout(350);
const bp = await page.locator(".card").count();
ok(bp > 0, `plain-language search works (${bp} results for "brake pad pcx")`);
await page.screenshot({ path: path.join(shots, "06-search.png") });

console.log("\nMobile");
await page.setViewportSize({ width: 390, height: 844 });
await page.fill("#q", "");
await page.waitForTimeout(400);
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(overflow <= 1, `no horizontal overflow at 390px (${overflow}px)`);
await page.screenshot({ path: path.join(shots, "07-mobile.png"), fullPage: false });

console.log("\nPersistence");
await page.reload();
await page.waitForTimeout(700);
ok((await page.locator("#cartN").textContent()).trim() === "4", "order survives a page reload");


/* ================= Marine & equipment ================= */
await page.setViewportSize({ width: 1400, height: 1000 });
const cardIds = () => page.evaluate(() => [...document.querySelectorAll(".card [data-detail]")].map(e => e.dataset.detail));

console.log("\nCategory picker — every non-bike category");
const reqsBefore = equipReqs.length;   // the search step above may have loaded it in the previous page instance
const VERTS = ["outboards", "marine_diesel", "jetski", "generators", "pumps", "machinery"];
for (const v of VERTS) {
  await page.click(`[data-vertical="${v}"]`);
  await page.waitForSelector("#brandChips [data-brand]", { timeout: 10000 });
  await page.waitForTimeout(150);
  const brands = await page.locator("#brandChips [data-brand]").count();
  await page.locator("#brandChips [data-brand]").first().click();
  await page.waitForTimeout(200);
  const models = await page.locator("#modelChips [data-model]").count();
  await page.locator("#modelChips [data-model]").first().click();
  await page.waitForTimeout(200);
  const cards = await page.locator(".card").count();
  const ask = await page.locator(".card:has(.price .asklab)").count();
  const wrongV = await page.locator(`.card:not([data-vert="${v}"])`).count();
  const rail = await page.locator("#catWrap .catbtn").count();
  ok(brands > 0 && models > 0 && cards > 0, `${v}: make chips (${brands}), model chips (${models}), cards (${cards})`);
  ok(ask === cards && wrongV === 0, `${v}: every card is ask-for-price and from this category`);
  ok(rail >= 2, `${v}: category rail lists categories (${rail - 1})`);
}
ok(equipReqs.length - reqsBefore === 1, `data-equip.js loaded once, on demand (${equipReqs.length - reqsBefore} request)`);

console.log("\nExact-model fitment");
const pickModel = async (v, brand, model) => {
  await page.click(`[data-vertical="${v}"]`);
  await page.waitForTimeout(150);
  await page.click(`#brandChips [data-brand="${brand}"]`);
  await page.waitForTimeout(150);
  await page.click(`#modelChips [data-model="${model}"]`);
  await page.waitForTimeout(250);
};
const EXACT = [
  ["outboards", "Yamaha", "yamaha-f250-f300-v6-4.2l-2010", "F250"],
  ["marine_diesel", "Yanmar", "yanmar-6hym-wet", "6HYM"],
  ["generators", "Cummins", "cummins-kta50g3-genset", "KTA50G3"],
  ["machinery", "Komatsu", "komatsu-pc200-8", "PC200-8"],
  ["pumps", "Honda", "honda-wb30xt-water-pump", "WB30XT3"],
];
for (const [v, brand, model, word] of EXACT) {
  await pickModel(v, brand, model);
  const ids = await cardIds();
  const misfit = await page.evaluate(([ids, model]) => ids.filter(id => !PART_BY_ID[id].fits.includes(model)), [ids, model]);
  const title = await page.locator("#rTitle").textContent();
  ok(ids.length > 0 && misfit.length === 0, `${word}: ${ids.length} parts, all fit ${model}` + (misfit.length ? " → " + misfit.join(", ") : ""));
  ok(title.includes(word), `${word}: heading names the machine (${title})`);
}
/* WB30XT3 is the last one picked: model note + serial notice */
ok(await page.locator("#rNote").isVisible() && (await page.locator("#rNote").textContent()).includes("WB30XT3-DR"),
   "model note shows the honda.mv model number and fiche note");
ok(await page.locator(".eqcard .serialnote").count() > 0, "\"Check frame/serial number\" notice shown on serial-dependent parts");
ok((await page.locator("#step2Label").textContent()).includes("pump or engine"), "step 2 label adapts to the category");

console.log("\nUnverified numbers");
await pickModel("marine_diesel", "Cummins", "cummins-marine-qsm");
const unv = page.locator(".eqcard .unver");
ok(await unv.count() > 0 && (await unv.first().textContent()).includes("Number to be confirmed"), `"Number to be confirmed — verify" badge on unverified numbers (${await unv.count()})`);

console.log("\nPart numbers as printed");
await pickModel("machinery", "JCB", "jcb-3cx-14-backhoe");
const slashOem = await page.evaluate(() => [...document.querySelectorAll(".eqcard .plate .val")].map(e => e.textContent).find(t => t.includes("/")));
ok(!!slashOem, `slash part number kept as printed (${slashOem})`);

console.log("\nEquipment detail drawer");
await pickModel("outboards", "Yamaha", "yamaha-f250-f300-v6-4.2l-2010");
const eqId = (await cardIds())[0];
const eqPart = await page.evaluate(id => { const p = PART_BY_ID[id]; return { oem: p.oem, name: p.name }; }, eqId);
await page.click(`[data-detail="${eqId}"]`);
await page.waitForTimeout(400);
const eqBody = await page.locator("#detailBody").textContent();
ok(eqBody.includes(eqPart.oem), `detail shows the number as printed (${eqPart.oem})`);
ok(eqBody.includes("Fits these engines") && eqBody.includes("F250 / F300"), "detail lists the engines it fits by name");
ok(eqBody.includes("Ask for price") && eqBody.includes("confirm the price on WhatsApp"), "detail: ask for price, confirmed on WhatsApp");
ok(await page.locator("#detailBody a.srclink[href^='http']").count() > 0, "detail links the source catalogue");
ok(!/undefined|NaN|\bnull\b|an unlisted/.test(eqBody), "detail shows no garbage (undefined / NaN / null / bike decoder)");
await page.screenshot({ path: path.join(shots, "08-equipment-detail.png") });

console.log("\nEquipment ordering");
await page.click("#detail [data-close]");
await page.waitForTimeout(300);
await page.click("#cartOpen");
await page.waitForTimeout(300);
const subBefore = await page.locator("#tSub").textContent();
const cartBefore = +(await page.locator("#cartN").textContent());
await page.click('#cart [data-close]');
await page.waitForTimeout(300);
await page.click(`.card [data-add="${eqId}"]`);
await page.waitForTimeout(300);
ok(+(await page.locator("#cartN").textContent()) === cartBefore + 1, "equipment part added to the order");
await page.click("#cartOpen");
await page.waitForTimeout(400);
const eqLine = page.locator("#cartBody .line", { hasText: eqPart.oem });
ok(await eqLine.count() === 1 && (await eqLine.locator(".lp").textContent()).trim() === "price to confirm", "equipment line reads \"price to confirm\"");
ok((await page.locator("#tSub").textContent()) === subBefore, "equipment line does not change the subtotal");
await page.fill("#custName", "Ibrahim Shareef");
await page.fill("#custPhone", "7798765");
await page.waitForTimeout(200);
await page.evaluate(() => { window.open = (u) => { window.__wa = u; return null; }; });
await page.click("#goBtn");
await page.waitForTimeout(300);
const waEq = decodeURIComponent((await page.evaluate(() => window.__wa || "")).split("?text=")[1] || "");
ok(waEq.includes(`${eqPart.oem} — price to confirm`), "WhatsApp text has the OEM number marked \"price to confirm\"");
ok(waEq.includes("For: Yamaha F250 / F300 V6 4.2L (2010+)"), "WhatsApp text names the engine the part is for");
await page.click('#cart [data-close]');
await page.waitForTimeout(300);

console.log("\nCounter skin on equipment");
await page.click('[data-skin="staff"]');
await page.waitForTimeout(300);
const eqStaff = await page.locator(".eqcard .staffbox").first().textContent();
ok(await page.locator(".eqcard .staffbox").first().isVisible() && eqStaff.includes("—") && !/NaN|undefined|null/.test(eqStaff), "counter skin shows — for cost, stock and bin");
await page.click('[data-skin="public"]');
await page.waitForTimeout(300);

console.log("\nBack to bikes");
await page.click('[data-vertical="bikes"]');
await page.waitForTimeout(300);
ok(await page.locator(".eqcard").count() === 0 && await page.locator(".card").count() === total, `bike catalogue restored (${total} cards)`);
ok((await page.locator("#lede").textContent()).includes("Every scooter on these islands"), "bike copy restored");
await page.click('[data-brand="Honda"]');
await page.waitForTimeout(250);
await page.click(`[data-model="${WAVE}"]`);
await page.waitForTimeout(250);
ok(await page.locator(".card").count() === waveN, `Wave 125i shows the same ${waveN} parts as before`);
const bad2 = await page.evaluate((wave) => {
  const ok = new Set(PARTS.filter(p => p.universal || p.fits.includes(wave)).map(p => p.id));
  return [...document.querySelectorAll(".card [data-detail]")].map(e => e.dataset.detail).filter(id => !ok.has(id));
}, WAVE);
ok(bad2.length === 0, "no part shown that does not fit the Wave after switching back");
ok((await page.locator("#rTitle").textContent()).includes("Wave 125i"), "heading names the bike again");
await page.click("#clearBtn");
await page.waitForTimeout(200);

console.log("\nNew makes and dealer models");
const fitCheck = (want) => page.evaluate((want) =>
  [...document.querySelectorAll(".card [data-detail]")].map(e => PART_BY_ID[e.dataset.detail])
    .filter(p => !p.universal && !p.fits.some(f => want.includes(f))).map(p => p.id), want);
await page.click('#brandChips [data-brand="CFMoto"]');
await page.waitForTimeout(250);
const cfIds = await page.evaluate(() => MODELS.filter(m => m.brand === "CFMoto").map(m => m.id));
const cfN = await page.locator(".card").count();
ok(cfN > 0 && (await fitCheck(cfIds)).length === 0, `CFMoto make shows CFMoto parts (${cfN})`);
ok(await page.locator('#brandChips [data-brand="Keeway"]').count() === 1, "Keeway make chip shown");
ok(await page.locator('#brandChips [data-brand="Suzuki"]').count() === 0, "makes with no models still hidden (Suzuki)");
const BIKES = [
  ["CFMoto", "cfmoto-300sr-cf300-3-my22", "300SR"],
  ["Keeway", "keeway-vieste-300-xdv-e5", "Vieste 300 XDV"],
  ["Yamaha", "yamaha-exciter155-vva-b5v", "Exciter 155 VVA"],
  ["Yamaha", "yamaha-aerox-alpha155-std-id", "Aerox Alpha"],
];
for (const [brand, model, word] of BIKES) {
  await page.click("#clearBtn").catch(() => {});
  await page.waitForTimeout(150);
  await page.click(`#brandChips [data-brand="${brand}"]`);
  await page.waitForTimeout(200);
  await page.click(`#modelChips [data-model="${model}"]`);
  await page.waitForTimeout(250);
  const n = await page.locator(".card").count();
  const title = await page.locator("#rTitle").textContent();
  ok(n > 0 && (await fitCheck([model])).length === 0 && title.includes(word) && !title.includes(`${brand} ${brand}`),
     `${brand} ${word} loads its parts (${n}) under "${title.trim()}"`);
}
ok(await page.locator('.card [data-detail]').evaluateAll(els => els.some(e => PART_BY_ID[e.dataset.detail].oem === "B8R-E7641-00")),
   "Aerox Alpha shows the B8R-E7641-00 belt");
await page.click("#clearBtn");
await page.waitForTimeout(150);
await page.click('#brandChips [data-brand="Yamaha"]');
await page.waitForTimeout(150);
await page.click('#modelChips [data-model="aerox155"]');
await page.waitForTimeout(250);
ok(await page.locator("#rNote").isVisible() && /drum/.test(await page.locator("#rNote").textContent()), "Aerox 155 shows the drum rear-brake notice");
const aeroxOems = await page.locator('.card [data-detail]').evaluateAll(els => els.map(e => PART_BY_ID[e.dataset.detail].oem));
ok(!aeroxOems.includes("3C1-F5805-10") && aeroxOems.includes("B8R-E7641-00"), "Aerox 155: no 3C1 rear pad, belt is B8R-E7641-00");
await page.click("#clearBtn");
await page.waitForTimeout(150);
ok(!(await page.locator("#rNote").isVisible()), "notice clears with the selection");

await pickModel("outboards", "Parsun", "parsun-f60-efi");
const parsunIds = await cardIds();
const parsunMisfit = await page.evaluate((ids) => ids.filter(id => !PART_BY_ID[id].fits.includes("parsun-f60-efi")), parsunIds);
ok(parsunIds.length > 0 && parsunMisfit.length === 0 && (await page.locator("#rTitle").textContent()).includes("Parsun F60"),
   `Outboards > Parsun > F60 loads its parts (${parsunIds.length})`);
ok(await page.locator("#modelChips [data-model]").count() === 4, "Parsun lists 4 engines");
await page.click('[data-vertical="bikes"]');
await page.waitForTimeout(250);
await page.click("#clearBtn").catch(() => {});
await page.waitForTimeout(150);

console.log("\nSearch from the default page");
const page2 = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page2.on("pageerror", e => errors.push("pageerror(2): " + e.message));
page2.on("console", m => { if (m.type() === "error") errors.push("console(2): " + m.text()); });
const req2 = [];
page2.on("request", r => { if (r.url().includes("data-equip.js")) req2.push(r.url()); });
await page2.goto(url);
await page2.waitForTimeout(600);
ok(req2.length === 0, "fresh default page: no data-equip.js request");
const searchFinds = async (q, test, label) => {
  await page2.fill("#q", q);
  await page2.waitForSelector(".eqcard", { timeout: 8000 }).catch(() => {});
  await page2.waitForTimeout(250);
  const ids = await page2.evaluate(() => [...document.querySelectorAll(".card [data-detail]")].map(e => e.dataset.detail));
  const hits = await page2.evaluate(([ids, src]) => ids.filter(id => new Function("p", "return " + src)(PART_BY_ID[id])).length, [ids, test]);
  ok(hits > 0, `search "${q}" finds ${label} (${hits} of ${ids.length})`);
};
await searchFinds("KTA19", `p.fits && p.fits.includes("cummins-kta19-genset")`, "KTA19 genset parts");
ok(req2.length === 1, "typing a search lazy-loads data-equip.js");
await searchFinds("6CE-W0078-02-00", `p.oem === "6CE-W0078-02-00"`, "the Yamaha F250 water pump kit by number");
await searchFinds("6CEW00780200", `p.oem === "6CE-W0078-02-00"`, "the same part without dashes");
await searchFinds("6P3-WS24A", `p.oem === "6P3-WS24A-02-00"`, "the V6 fuel filter by partial number");
await searchFinds("400/17725", `p.oem === "400/17725"`, "a slash part number");
await searchFinds("6HYM", `p.vertical && p.fits.includes("yanmar-6hym-wet")`, "Yanmar 6HYM parts");
await searchFinds("PC200-8", `p.vertical && p.fits.includes("komatsu-pc200-8")`, "Komatsu PC200-8 parts");
await searchFinds("F250 oil filter", `p.vertical === "outboards"`, "F250 oil filter");
await searchFinds("WB30XT3", `p.vertical && p.fits.includes("honda-wb30xt-water-pump")`, "Honda WB30XT3 parts");
ok(await page2.locator(".eqcard .eqtag").first().isVisible(), "equipment results are labelled with category and part type");
for (const q of ["B65-E7641-00", "B8R-E7641-00", "06455-KVB-912", "40530-KPH-901"]) {
  await page2.fill("#q", q);
  await page2.waitForTimeout(350);
  const oems = await page2.locator(".card [data-detail]").evaluateAll(els => els.map(e => PART_BY_ID[e.dataset.detail].oem));
  const want = { "B65-E7641-00": "B8R-E7641-00", "B8R-E7641-00": "B8R-E7641-00", "06455-KVB-912": "06455-KVB-T01", "40530-KPH-901": "40530-KPH-902" }[q];
  ok(oems.includes(want), `search "${q}" finds ${want} (${oems.length} result${oems.length === 1 ? "" : "s"})`);
}
await page2.fill("#q", "23100K36J01");
await page2.waitForTimeout(350);
ok(await page2.locator(".card").count() === 1, "bike part-number search still returns exactly one part with equipment loaded");
await page2.screenshot({ path: path.join(shots, "09-equipment-search.png") });

console.log("\nDeep link + mobile");
await page2.goto(url + "?v=outboards&m=yamaha-f250-f300-v6-4.2l-2010");
await page2.waitForSelector(".eqcard", { timeout: 8000 }).catch(() => {});
await page2.waitForTimeout(250);
ok((await page2.locator("#rTitle").textContent()).includes("F250") && await page2.locator(".eqcard").count() > 0, "?v=…&m=… deep link opens the model");
await page2.setViewportSize({ width: 390, height: 844 });
await page2.waitForTimeout(300);
const overflow2 = await page2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(overflow2 <= 1, `no horizontal overflow at 390px on an equipment page (${overflow2}px)`);
await page2.close();

/* ================= Oils & lubricants ================= */
console.log("\nOils & lubricants");
const page3 = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page3.on("pageerror", e => errors.push("pageerror(3): " + e.message));
page3.on("console", m => { if (m.type() === "error") errors.push("console(3): " + m.text()); });
const req3 = { lubes: 0, equip: 0 };
page3.on("request", r => {
  if (r.url().includes("data-lubes.js")) req3.lubes++;
  if (r.url().includes("data-equip.js")) req3.equip++;
});
const lubeIds = () => page3.evaluate(() => [...document.querySelectorAll(".lubecard")].map(e => e.dataset.lube));
await page3.goto(url);
await page3.waitForTimeout(700);
ok(req3.lubes === 0 && req3.equip === 0, "fresh bike home: no request for data-lubes.js or data-equip.js");
ok((await page3.locator('#vertChips [data-vertical="lubes"]').textContent()).trim() === "Oils & lubricants", "\"Oils & lubricants\" chip shown");

await page3.click('[data-vertical="lubes"]');
await page3.waitForSelector(".lubecard", { timeout: 8000 });
const lubeN = await page3.locator(".lubecard").count();
ok(lubeN >= 30, `oils view renders every product (${lubeN} cards)`);
ok(req3.lubes === 1 && req3.equip === 0, `data-lubes.js loaded once on demand, data-equip.js not needed (${req3.lubes}/${req3.equip})`);
ok(page3.url().includes("v=lubes"), "URL records ?v=lubes");
ok((await page3.locator("#rNote").textContent()).includes("Prices confirmed on WhatsApp. Check your owner's manual for grade and capacity."), "price / owner's manual line shown");
ok(!(await page3.locator("#brandRow").isVisible()) && await page3.locator("#lfVeh").isVisible(), "make picker replaced by oil filters");
await page3.screenshot({ path: path.join(shots, "lubes-desktop.png") });

await page3.click('[data-lf="type"][data-val="engine-scooter"]');
await page3.waitForTimeout(200);
const scooterIds = (await lubeIds()).sort();
ok(JSON.stringify(scooterIds) === JSON.stringify(["lub-scooter-10w30-mb", "lub-scooter-10w40-mb"]), `Type = Scooter engine oil shows the 10W-30 and 10W-40 JASO MB oils (${scooterIds.join(", ")})`);
await page3.click('[data-lf="type"][data-val=""]');
await page3.waitForTimeout(200);

const AB = "honda-airblade125-ad-2023";
await page3.selectOption("#lfVeh", AB);
await page3.waitForTimeout(200);
const abIds = await lubeIds();
ok(abIds.includes("lub-scooter-10w30-mb") && !abIds.includes("lub-moto-10w30-ma"), `Vehicle = Air Blade 125 includes the scooter 10W-30 MB, not the JASO MA oil (${abIds.length} products)`);
const abMisfit = await page3.evaluate((id) => [...document.querySelectorAll(".lubecard")].map(e => e.dataset.lube).filter(x => !lubeFits(LB.byId[x], id)), AB);
ok(abMisfit.length === 0, "every product shown fits the Air Blade 125" + (abMisfit.length ? " → " + abMisfit.join(", ") : ""));
ok((await page3.locator("#rNote").textContent()).includes("0.80 L"), "vehicle filter shows its owner-manual fluids");
await page3.click("#clearBtn");
await page3.waitForTimeout(200);
ok(await page3.locator(".lubecard").count() === lubeN, "Reset clears the oil filters");

await page3.click('[data-lf="for"][data-val="ob2"]');
await page3.waitForTimeout(200);
const ob2 = await lubeIds();
ok(ob2.includes("lub-2t-tcw3") && ob2.includes("lub-outboard-gear") && !ob2.includes("lub-scooter-10w30-mb"), `For = Outboard 2-stroke lists TC-W3 and gearcase oil (${ob2.length})`);
await page3.click('[data-lf="for"][data-val=""]');
await page3.waitForTimeout(200);

await page3.fill("#q", "TC-W3");
await page3.waitForTimeout(350);
const tcw = await lubeIds();
ok(tcw.includes("lub-2t-tcw3") && tcw.length < 5, `search in the oils view finds TC-W3 oil (${tcw.join(", ")})`);
await page3.fill("#q", "Mobil Delvac");
await page3.waitForTimeout(350);
ok(JSON.stringify(await lubeIds()) === JSON.stringify(["lub-diesel-15w40-ci4"]), "search matches brands we can source");
ok(req3.equip === 0, "searching oils does not load the equipment catalogue");
await page3.fill("#q", "");
await page3.waitForTimeout(300);

const brake = page3.locator('.lubecard[data-lube="lub-brake-dot4"]');
const brakePrice = `${(await brake.locator(".price .cur").textContent()).trim()} ${(await brake.locator(".price .amt").textContent()).trim()}`;
ok(brakePrice === "MVR 165", `brake fluid DOT 4 shows MVR 165 (${brakePrice})`);
ok(await page3.locator(".lubecard .price .amt").count() === 3, "only the three existing catalogue items carry a price");
await brake.locator('[data-pack="250 ml"]').click();
await page3.waitForTimeout(150);
ok((await brake.locator(".price").textContent()).trim() === "Ask for price", "brake fluid 250 ml (not in the catalogue) is ask for price");
await brake.locator('[data-pack="500 ml"]').click();
await page3.waitForTimeout(150);
await brake.locator(".addbtn").click();
await page3.waitForTimeout(200);
ok(await page3.evaluate(() => state.cart.p030 === 1), "adding brake fluid 500 ml adds the existing p030 part");

const tcwCard = page3.locator('.lubecard[data-lube="lub-2t-tcw3"]');
await tcwCard.locator('[data-pack="4 L"]').click();
await page3.waitForTimeout(150);
await tcwCard.locator(".addbtn").click();
await page3.waitForTimeout(200);
await page3.click("#cartOpen");
await page3.waitForTimeout(400);
const tcwLine = page3.locator("#cartBody .line", { hasText: "TC-W3" });
ok(await tcwLine.count() === 1 && (await tcwLine.locator(".nm").textContent()).includes("4 L"), "cart line names the chosen pack size (4 L)");
ok((await tcwLine.locator(".lp").textContent()).trim() === "price to confirm", "ask-for-price oil reads \"price to confirm\"");
ok(await page3.locator("#tAskRow").isVisible() && (await page3.locator("#tAskRow").textContent()).includes("Price to confirm"), "\"Price to confirm\" row shown in the cart");
ok(+(await page3.locator("#tSub").textContent()).replace(/[^0-9]/g, "") === 165, "subtotal counts only the priced brake fluid");
await page3.fill("#custName", "Aishath Shiuna");
await page3.fill("#custPhone", "7754321");
await page3.waitForTimeout(150);
await page3.evaluate(() => { window.open = (u) => { window.__wa = u; return null; }; });
await page3.click("#goBtn");
await page3.waitForTimeout(250);
const waL = decodeURIComponent((await page3.evaluate(() => window.__wa || "")).split("?text=")[1] || "");
ok(waL.includes("Outboard 2-stroke oil, NMMA TC-W3 — 4 L") && waL.includes("— price to confirm"), "WhatsApp text has the oil, its pack size and \"price to confirm\"");
ok(waL.includes("Brake fluid DOT 4, 500 ml") && waL.includes("MVR 165"), "WhatsApp text prices the brake fluid");
await page3.click('#cart [data-close]');
await page3.waitForTimeout(300);

await page3.click('[data-lubedetail="lub-scooter-10w30-mb"]');
await page3.waitForTimeout(300);
const lDet = await page3.locator("#detailBody").textContent();
ok(lDet.includes("Air Blade 125 (2023+, Asia-direct)") && lDet.includes("JASO MB") && lDet.includes("Ask for price"), "detail drawer lists grade, the models it fits and the price");
await page3.click("#detail [data-close]");
await page3.waitForTimeout(300);
await page3.click('[data-lubedetail="lub-ob4-10w30-fcw"]');
await page3.waitForFunction(() => document.querySelector("#detailBody").textContent.includes("F250"), null, { timeout: 8000 }).catch(() => {});
ok((await page3.locator("#detailBody").textContent()).includes("Yamaha F250 / F300"), "outboard oil detail names the engines it fits (equipment names loaded on demand)");
await page3.click("#detail [data-close]");
await page3.waitForTimeout(300);

console.log("\nOils deep link + model pages");
await page3.goto(url + "?v=lubes&t=engine-scooter");
await page3.waitForSelector(".lubecard", { timeout: 8000 });
await page3.waitForTimeout(200);
ok(await page3.locator('#vertChips [data-vertical="lubes"][aria-pressed="true"]').count() === 1 && await page3.locator(".lubecard").count() === 2, "?v=lubes&t=… deep link opens the filtered oils view");
await page3.goto(url + "?v=lubes");
await page3.waitForSelector(".lubecard", { timeout: 8000 });
ok(await page3.locator(".lubecard").count() === lubeN, "?v=lubes deep link opens the oils view");

await page3.goto(url);
await page3.waitForTimeout(500);
await page3.click('#brandChips [data-brand="Honda"]');
await page3.waitForTimeout(200);
await page3.click(`#modelChips [data-model="${AB}"]`);
await page3.waitForSelector("#rNote .fluids", { timeout: 8000 }).catch(() => {});
const fl = page3.locator("#rNote .fluids");
ok(await fl.count() === 1 && (await fl.textContent()).includes("Fluids (owner manual)") && (await fl.textContent()).includes("0.80 L"), "Air Blade 125 (2023+) shows the owner-manual fluids box with 0.80 L");
ok(((await fl.locator("a.srclink").getAttribute("href")) || "").includes("hondamotopub.com"), "fluids box links the owner manual");
await page3.evaluate(() => {
  const el = document.querySelector(".rhead");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (document.querySelector(".bar").offsetHeight + 80));
});
await page3.waitForTimeout(150);
await page3.screenshot({ path: path.join(shots, "lubes-airblade-fluids.png") });
const shop = fl.locator("a.fl-shop");
ok(((await shop.getAttribute("href")) || "").includes("v=lubes") && ((await shop.getAttribute("href")) || "").includes("e=lub-scooter-10w30-mb"), "\"Shop this oil\" links to the filtered oils view");
await shop.click();
await page3.waitForSelector(".lubecard", { timeout: 8000 });
await page3.waitForTimeout(200);
ok(JSON.stringify(await lubeIds()) === JSON.stringify(["lub-scooter-10w30-mb"]) && page3.url().includes("e=lub-scooter-10w30-mb"), "\"Shop this oil\" opens the oils view on the scooter 10W-30 JASO MB");

await page3.goto(url + "?m=honda-wave125i-th-2018-2022-k73");
await page3.waitForTimeout(800);
ok(await page3.locator("#rNote .fluids").count() === 0, "a model without owner-manual data shows no fluids box");

await page3.goto(url + "?v=outboards&m=yamaha-f250-f300-v6-4.2l-2010");
await page3.waitForSelector('#rNote [data-lubejump="veh"]', { timeout: 8000 }).catch(() => {});
const mo = page3.locator('#rNote [data-lubejump="veh"]');
ok(await mo.count() === 1, "outboard model page shows a \"Matching oils\" link");
await mo.click();
await page3.waitForSelector(".lubecard", { timeout: 8000 });
await page3.waitForTimeout(200);
const f250 = await lubeIds();
ok(f250.includes("lub-ob4-10w30-fcw") && f250.includes("lub-outboard-gear") && !f250.includes("lub-scooter-10w30-mb"), `Matching oils for the F250 lists the FC-W and gearcase oils (${f250.length})`);

console.log("\nOils on mobile");
await page3.setViewportSize({ width: 390, height: 844 });
await page3.goto(url + "?v=lubes");
await page3.waitForSelector(".lubecard", { timeout: 8000 });
await page3.waitForTimeout(300);
const overflow3 = await page3.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(overflow3 <= 1, `no horizontal overflow at 390px in the oils view (${overflow3}px)`);
await page3.screenshot({ path: path.join(shots, "lubes-mobile.png") });
await page3.close();

ok(errors.length === 0, "still no JS errors after the full run" + (errors.length ? " → " + errors.join(" | ") : ""));

await browser.close();
console.log("\n" + (fail ? `${fail} check(s) FAILED` : "All browser checks passed"));
process.exit(fail ? 1 : 0);
