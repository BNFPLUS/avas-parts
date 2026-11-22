/* Browser QA: drives the real page and screenshots it. Run: node qa.mjs */
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const url = "file://" + path.join(dir, "index.html");
const shots = path.join(dir, "shots");

let fail = 0;
const ok = (c, m) => { console.log(`  ${c ? "ok  " : "FAIL"} ${m}`); if (!c) fail++; };

/* The API and Turnstile are always mocked: nothing in this run may reach the real network for them. */
const TURNSTILE_STUB = `window.__ts = { render: 0, reset: 0, remove: 0 };
window.turnstile = {
  render(el, o) { window.__ts.render++; window.__ts.o = o; el.innerHTML = '<div class="ts-stub">security check</div>'; setTimeout(() => o.callback("test-token")); return "w1"; },
  /* like the real widget, a reset runs the challenge again and issues a fresh token */
  reset() { window.__ts.reset++; setTimeout(() => window.__ts.o.callback("test-token")); },
  remove() { window.__ts.remove++; },
};`;
async function guard(pg, opts = {}) {
  const net = { turnstile: 0, api: [], unexpected: [], replies: [] };
  /* Playwright tries the most recently added route first, so this catch-all goes in first. */
  await pg.route("https://api.avas.parts/**", r => { net.unexpected.push(r.request().url()); return r.abort(); });
  await pg.route("**/challenges.cloudflare.com/**", r => {
    net.turnstile++;
    return r.fulfill({ status: 200, contentType: "text/javascript", body: TURNSTILE_STUB });
  });
  await pg.route("**/api/orders", r => {
    if (r.request().method() === "OPTIONS")
      return r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, idempotency-key", "access-control-allow-methods": "POST" } });
    net.api.push({ url: r.request().url(), headers: r.request().headers(), body: r.request().postDataJSON() });
    const reply = net.replies.shift();
    if (!reply) { net.unexpected.push(r.request().url()); return r.abort(); }
    return r.fulfill({ status: reply.status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(reply.body) });
  });
  if (opts.checkoutOff) {
    /* data.js ships with onlineCheckout: true on this branch; serve it with the flag off. */
    const src = fs.readFileSync(path.join(dir, "data.js"), "utf8").replace('"onlineCheckout": true', '"onlineCheckout": false');
    await pg.route("**/data.js", r => r.fulfill({ status: 200, contentType: "text/javascript", body: src }));
  }
  return net;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

const net1 = await guard(page, { checkoutOff: true });
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
ok(await page.locator("#vertChips [data-vertical]").count() === 7, "category picker lists 7 categories");
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
ok(await page.evaluate(() => SHOP.onlineCheckout) === false, "flag forced off for the WhatsApp run");
ok(await page.locator("#goBtn").isVisible() && !(await page.locator("#coOpen").isVisible()),
   "flag off: WhatsApp send button shown, no Checkout button");
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


/* ================= Online checkout ================= */
const num2 = s => +String(s).replace(/[^0-9]/g, "");
const isApiNoise = t => /Failed to load resource|net::ERR_FAILED/.test(t);
async function checkoutPage(query = "", opts = {}) {
  const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const net = await guard(pg, opts);
  pg.on("pageerror", e => errors.push("pageerror(co): " + e.message));
  pg.on("console", m => { if (m.type() === "error" && !isApiNoise(m.text())) errors.push("console(co): " + m.text()); });
  await pg.goto(url + query);
  await pg.waitForTimeout(600);
  await pg.evaluate(() => { localStorage.removeItem("avas.cart"); localStorage.removeItem("avas.cartctx"); });
  await pg.reload();
  await pg.waitForTimeout(600);
  return { pg, net };
}
async function fillCheckout(pg, phone, destination = "Hulhumalé", address = "Blue Villa, Magu") {
  await pg.fill("#coName", "Aishath <Shifa>");
  await pg.fill("#coPhone", phone);
  await pg.fill("#coEmail", "shifa@example.mv");
  await pg.selectOption("#coDestination", destination);
  await pg.fill("#coAddress", address);
  await pg.fill("#coNotes", "Wave 125i 2019");
}

console.log("\nOnline checkout (flag on)");
{
  const { pg, net } = await checkoutPage();
  ok(net.turnstile === 0, "Turnstile script not loaded before checkout opens");
  const pricedAdd = await pg.locator(".card:has(.price .amt) [data-add]").first().getAttribute("data-add");
  const askAdd = await pg.locator(".card:has(.price .asklab) [data-add]").first().getAttribute("data-add");
  const pricedP = await pg.evaluate(id => PART_BY_ID[id], pricedAdd);
  await pg.click(`.card [data-add="${pricedAdd}"]`);
  await pg.click(`.card [data-add="${pricedAdd}"]`);
  await pg.click(`.card [data-add="${askAdd}"]`);
  await pg.waitForTimeout(200);
  await pg.click("#cartOpen");
  await pg.waitForTimeout(400);
  ok(await pg.locator("#coOpen").isVisible() && !(await pg.locator("#goBtn").isVisible()), "cart shows Checkout instead of the WhatsApp button");
  const cartEst = await pg.locator("#coCartTotals").textContent();
  ok(!/Delivery/.test(cartEst) && /ShippingFree/.test(cartEst) && !/quoted/.test(cartEst), "cart estimate shows free shipping, no fee and no quote wording");
  ok(/Free delivery to Malé, Hulhumalé and boats/.test(await pg.locator("#coFoot").textContent()), "cart footer says delivery is free to the three destinations");
  await pg.click("#coOpen");
  await pg.waitForTimeout(400);
  ok(await pg.locator("#checkout.on").isVisible() && await pg.locator("#coForm").isVisible(), "checkout form opens from the cart");
  const formText = await pg.locator("#coForm").textContent();
  for (const t of ["Free delivery to Malé, Hulhumalé or Boats (harbour drop-off)", "Pay by bank transfer only", "Cash on delivery is not available",
                   "Bank transfer details to follow", "Items marked Ask for price make this a quote request"])
    ok(formText.includes(t), `form says "${t}"`);
  ok(!/quoted manually|quoted later|Bank details will be shared/.test(formText), "form has no shipping-quote or old bank wording");
  const opts = await pg.locator("#coDestination option").evaluateAll(os => os.map(o => [o.value, o.textContent]));
  ok(JSON.stringify(opts) === JSON.stringify([["", "Choose destination"], ["Malé", "Malé"], ["Hulhumalé", "Hulhumalé"], ["Boats", "Boats (harbour drop-off)"]]),
     `destination select offers only Malé, Hulhumalé, Boats (${JSON.stringify(opts)})`);
  ok(await pg.locator("#coAtoll, #coIsland").count() === 0, "no atoll dropdown or island field");
  ok(await pg.locator("#coAddress").getAttribute("placeholder") === "House or shop name, road", "address placeholder for Malé/Hulhumalé");
  await pg.selectOption("#coDestination", "Boats");
  ok(await pg.locator("#coAddress").getAttribute("placeholder") === "Vessel name and harbour" && (await pg.locator("#coAddressLabel").textContent()) === "Vessel and harbour", "Boats switches the address field to vessel name and harbour");
  await pg.selectOption("#coDestination", "Hulhumalé");
  ok(await pg.locator("#coAddress").getAttribute("placeholder") === "House or shop name, road", "switching back restores the house/shop placeholder");
  ok(JSON.stringify(await pg.locator("#zoneList li").allTextContents()) === JSON.stringify(["MaléFree", "HulhumaléFree", "Boats (harbour drop-off)Free"]), "footer delivery list shows only the three free destinations");
  const est = await pg.locator("#coTotals").textContent();
  const sub = pricedP.price * 2, gst = Math.round(sub * 0.08);
  ok(est.includes(`MVR ${sub.toLocaleString("en-US")}`) && est.includes(gst.toLocaleString("en-US")) && est.includes(`MVR ${(sub + gst).toLocaleString("en-US")} + quote`),
     `estimate = subtotal ${sub} + GST ${gst} on priced lines only`);
  ok(/confirmed by our server and your quote/.test(est), "estimate says final totals are confirmed later");
  await pg.waitForTimeout(200);
  ok(net.turnstile === 1, "Turnstile script injected once when the form opens");
  ok(await pg.evaluate(() => window.__ts.render) === 1 && await pg.locator("#coTurnstile .ts-stub").count() === 1, "Turnstile widget rendered into the form");
  ok((await pg.locator("#coSubmit").textContent()).includes("quote"), "submit reads as a quote request when ask-for-price lines are present");
  await pg.screenshot({ path: path.join(shots, "10-checkout.png"), fullPage: false });

  console.log("\nCheckout validation");
  await fillCheckout(pg, "12345");
  await pg.click("#coSubmit");
  await pg.waitForTimeout(250);
  ok(net.api.length === 0, "bad phone blocks submit (no request sent)");
  ok(/7-digit/.test(await pg.locator('.ferr[data-err="phone"]').textContent()) && await pg.locator("#coPhone[aria-invalid=true]").count() === 1, "phone error shown inline");
  await pg.fill("#coName", "");
  await pg.click("#coSubmit");
  await pg.waitForTimeout(150);
  ok(net.api.length === 0 && (await pg.locator('.ferr[data-err="name"]').textContent()).length > 0, "missing name blocks submit");
  await pg.fill("#coName", "Aishath <Shifa>");
  await pg.fill("#coPhone", "+960 771-2345");
  await pg.selectOption("#coDestination", "");
  await pg.click("#coSubmit");
  await pg.waitForTimeout(150);
  ok(net.api.length === 0 && /Malé, Hulhumalé or Boats/.test(await pg.locator('.ferr[data-err="destination"]').textContent()), "missing destination blocks submit");
  await pg.selectOption("#coDestination", "Hulhumalé");

  console.log("\nCheckout error response");
  net.replies.push({ status: 422, body: { error: "invalid_customer", message: "We could not verify <that> phone number.", fields: { phone: "Phone number not recognised" } } });
  await pg.click("#coSubmit");
  await pg.waitForTimeout(500);
  ok(net.api.length === 1, "valid form posts to the API" + (net.api.length ? "" : " → " + await pg.locator("#coError").textContent() + " / " + await pg.locator(".ferr").allTextContents()));
  ok((await pg.locator("#coError").textContent()) === "We could not verify <that> phone number." && await pg.locator("#coError").isVisible(), "server error message shown inline (as text, escaped)");
  ok((await pg.locator('.ferr[data-err="phone"]').textContent()) === "Phone number not recognised", "server field error shown next to the field");
  ok(await pg.locator("#coForm").isVisible() && !(await pg.locator("#coSubmit").isDisabled()), "form kept and submit re-enabled after an error");
  ok(await pg.evaluate(() => window.__ts.reset) === 1, "Turnstile reset after an error");
  ok((await pg.locator("#cartN").textContent()).trim() === "3", "cart untouched after an error");
  await pg.screenshot({ path: path.join(shots, "11-checkout-error.png"), fullPage: false });

  console.log("\nCheckout success");
  await pg.waitForTimeout(100);   // the stub re-issues a token after reset
  net.replies.push({ status: 201, body: { orderNo: "AV-2611-0001", trackUrl: "https://api.avas.parts/track/tok123", status: "quote_requested",
    totals: { currency: "MVR", subtotal: sub, gst, shipping: 0, shippingPending: false, total: null, hasAskLines: true } } });
  await pg.click("#coSubmit");
  await pg.waitForTimeout(500);
  ok(net.api.length === 2, "retry posts again");
  const [first, req] = net.api;
  ok(req.url === "https://api.avas.parts/api/orders", `posts to SHOP.ordersApi /api/orders (${req.url})`);
  ok(req.headers["content-type"] === "application/json", "Content-Type: application/json");
  ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(req.headers["idempotency-key"] || ""), `Idempotency-Key is a UUID (${req.headers["idempotency-key"]})`);
  ok(first.headers["idempotency-key"] === req.headers["idempotency-key"], "retry of the same submission reuses the Idempotency-Key");
  ok(req.body.turnstileToken === "test-token", "turnstileToken sent in the body");
  const want = [{ id: pricedAdd, qty: 2 }, { id: askAdd, qty: 1 }];
  ok(JSON.stringify(req.body.lines.map(({ id, qty }) => ({ id, qty }))) === JSON.stringify(want), `lines carry ids and quantities (${JSON.stringify(req.body.lines)})`);
  ok(req.body.lines.every(l => !("forMachine" in l)), "forMachine omitted when no machine is known");
  const c = req.body.customer;
  ok(c.name === "Aishath <Shifa>" && c.phone === "+9607712345" && c.email === "shifa@example.mv" && c.destination === "Hulhumalé" && c.atoll === "Hulhumalé" &&
     c.island === "Hulhumalé" && c.address === "Blue Villa, Magu" && c.notes === "Wave 125i 2019", `customer fields sent (${JSON.stringify(c)})`);
  ok(await pg.locator("#coDone").isVisible() && (await pg.locator("#coDone .cono").textContent()) === "AV-2611-0001", "confirmation shows the order number");
  const doneQ = await pg.locator("#coDone").textContent();
  ok(/price the items marked Ask for price/.test(doneQ) && /Delivery is free/.test(doneQ) && !/shipping/i.test(doneQ), "confirmation explains the quote request, free delivery, no shipping quote");
  const link = pg.locator("#coDone a.cotrack");
  ok(await link.getAttribute("href") === "https://api.avas.parts/track/tok123" && await link.getAttribute("target") === "_blank" &&
     /noopener/.test(await link.getAttribute("rel")) && (await link.textContent()).includes("Track your order"), "Track your order link opens trackUrl in a new tab");
  ok((await pg.locator("#cartN").textContent()).trim() === "0" && await pg.evaluate(() => localStorage.getItem("avas.cart")) === "{}", "cart cleared after the order");
  await pg.screenshot({ path: path.join(shots, "12-checkout-done.png"), fullPage: false });
  ok(net.unexpected.length === 0, "no unmocked API calls" + (net.unexpected.length ? " → " + net.unexpected.join(", ") : ""));
  const overflow3 = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(overflow3 <= 1, `checkout has no horizontal overflow at 390px (${overflow3}px)`);
  await pg.close();
}

console.log("\nCheckout: pending payment, machine context, ?checkout=online and ?api=");
{
  const { pg, net } = await checkoutPage("?checkout=online&api=http://127.0.0.1:8787/", { checkoutOff: true });
  ok(await pg.evaluate(() => SHOP.onlineCheckout) === false, "flag off in data, on via ?checkout=online");
  await pg.click('[data-brand="Honda"]');
  await pg.waitForTimeout(200);
  await pg.click(`[data-model="${WAVE}"]`);
  await pg.waitForTimeout(250);
  ok(new URL(pg.url()).searchParams.get("checkout") === "online", "?checkout=online survives the URL rewrite when a model is picked");
  const id = await pg.locator(".card:has(.price .amt) [data-add]").first().getAttribute("data-add");
  await pg.click(`.card [data-add="${id}"]`);
  await pg.click("#cartOpen");
  await pg.waitForTimeout(400);
  ok(await pg.locator("#coOpen").isVisible(), "Checkout button shown via ?checkout=online");
  await pg.click("#coOpen");
  await pg.waitForTimeout(400);
  ok(await pg.locator("#coAskNote").isHidden() && (await pg.locator("#coSubmit").textContent()).trim() === "Place order", "no quote-request note without ask-for-price lines");
  await fillCheckout(pg, "7712345", "Boats", "MV Sea Star, North Harbour");
  net.replies.push({ status: 200, body: { orderNo: "AV-2611-0002", trackUrl: "javascript:alert(1)", status: "pending_payment",
    totals: { currency: "MVR", subtotal: 100, gst: 8, shipping: 0, shippingPending: false, total: 108, hasAskLines: false } } });
  await pg.click("#coSubmit");
  await pg.waitForTimeout(500);
  const req = net.api[0];
  ok(req && req.url === "http://127.0.0.1:8787/api/orders", `?api= overrides the API base (${req && req.url})`);
  ok(req && req.body.lines[0].forMachine && req.body.lines[0].forMachine.includes("Wave 125i"), `forMachine names the picked bike (${req && req.body.lines[0].forMachine})`);
  ok(req && req.body.customer.phone === "7712345", "7-digit phone accepted without +960");
  ok(req && req.body.customer.destination === "Boats" && req.body.customer.atoll === "Boats" && req.body.customer.island === "Boats" && req.body.customer.address === "MV Sea Star, North Harbour", `Boats sent as the canonical destination (${req && JSON.stringify(req.body.customer)})`);
  const doneP = await pg.locator("#coDone").textContent();
  ok(/awaiting payment by bank transfer/.test(doneP) && /Bank transfer details to follow/.test(doneP) && /cash on delivery is not available/i.test(doneP) && /Total with free delivery: MVR 108/.test(doneP) && !/quote shipping|before shipping/.test(doneP),
     "confirmation explains awaiting bank transfer, free delivery, no COD");
  ok(await pg.locator("#coDone a.cotrack").count() === 0, "non-http trackUrl is not linked");
  await pg.close();
}
{
  const { pg, net } = await checkoutPage("?checkout=online&api=javascript:alert(1)", { checkoutOff: true });
  await pg.click(".card:has(.price .amt) [data-add] >> nth=0");
  await pg.click("#cartOpen");
  await pg.waitForTimeout(300);
  await pg.click("#coOpen");
  await pg.waitForTimeout(400);
  await fillCheckout(pg, "7712345");
  net.replies.push({ status: 500, body: "oops" });
  await pg.click("#coSubmit");
  await pg.waitForTimeout(500);
  ok(net.api[0] && net.api[0].url === "https://api.avas.parts/api/orders", "non-http ?api= is ignored");
  ok(/error 500/.test(await pg.locator("#coError").textContent()), "a server error without a message still shows a readable error");
  await pg.close();
}
{
  const { pg, net } = await checkoutPage("", { checkoutOff: true });
  await pg.click(".card:has(.price .amt) [data-add] >> nth=0");
  await pg.click("#cartOpen");
  await pg.waitForTimeout(300);
  ok(await pg.locator("#goBtn").isVisible() && !(await pg.locator("#coOpen").isVisible()) && await pg.locator("#checkout.on").count() === 0, "flag off: WhatsApp button still there, no checkout");
  ok(net.turnstile === 0 && net.api.length === 0, "flag off: no Turnstile or API requests");
  await pg.close();
}
ok(net1.turnstile === 0 && net1.api.length === 0, "WhatsApp run made no Turnstile or API requests");

ok(errors.length === 0, "still no JS errors after the full run" + (errors.length ? " → " + errors.join(" | ") : ""));

await browser.close();
console.log("\n" + (fail ? `${fail} check(s) FAILED` : "All browser checks passed"));
process.exit(fail ? 1 : 0);
