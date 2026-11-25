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

/* Links the site may render: the shop WhatsApp, the order mailbox, bearing.wiki,
   same-origin / relative links. Anything else (amanifishing, fiche, dealer and
   maker catalogues) is an outside source link and must never appear. */
const ALLOWED_HREF = /^(https:\/\/(wa\.me|bearing\.wiki)\/|mailto:order@avas\.parts$|#|\.\/|\?|data-equip\.js$)/;
const outsideLinks = (pg, sel) => pg.locator(`${sel} a[href]`).evaluateAll(
  (els, re) => els.map(a => a.getAttribute("href")).filter(h => !new RegExp(re).test(h)), ALLOWED_HREF.source);
const SOURCE_TEXT = /\bSource\b|No source link recorded|amanifishing|bike-parts-honda|https?:\/\//;

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
const bnfReqs = [];
page.on("request", r => { if (r.url().includes("data-bnf.js")) bnfReqs.push(r.url()); });

await page.goto(url);
await page.waitForTimeout(900);

console.log("\nLoad");
ok(errors.length === 0, "no JS errors" + (errors.length ? " → " + errors.join(" | ") : ""));
const total = await page.locator(".card").count();
ok(total > 100, `catalogue renders (${total} cards)`);
ok(equipReqs.length === 0, "data-equip.js is not requested on the default bike page");
ok(bnfReqs.length === 0, "data-bnf.js is not requested on the default bike page");
ok(await page.locator('#vertChips [data-vertical="bikes"][aria-pressed="true"]').count() === 1, "category picker shows Bikes selected by default");
ok(await page.locator("#vertChips [data-vertical]").count() === 9, "category picker lists 9 categories (7 + Belts, Impellers)");
ok(await page.locator(".eqcard").count() === 0 && !(await page.locator("#rNote").isVisible()), "no equipment cards or model note on the bike default");
ok(await page.locator(".card .art, .card .nophoto, .card svg[role=img], .card img").count() === 0, "photoless cards have no image area, icon, drawing or stock image");
ok(!/No photo yet/i.test(await page.locator("#grid, .grid").first().textContent()), "no 'No photo yet' label on cards");
ok(await page.locator(".card").evaluateAll(cs => cs.every(c => c.firstElementChild && c.firstElementChild.classList.contains("cardtop"))), "every bike card starts with its name row");
ok(JSON.stringify(await page.locator("#zoneList li").allTextContents()) === JSON.stringify(["MaléFree", "HulhumaléFree", "Boats (harbour drop-off)Free"]),
   "flag off: footer delivery list is the three free destinations too");
ok(!/every island|nationwide|inhabited island/i.test(await page.locator("body").textContent()), "no every-island / nationwide delivery claims on the page");
await page.screenshot({ path: path.join(shots, "01-home.png"), fullPage: false });

console.log("\nReal photo + broken-photo fallback");
/* IMAGES ships empty; give two parts a photo (one real, one that fails to decode) and re-render.
   A corrupt image fires the same onerror as a 404 without logging a network error. */
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const photoIds = await page.evaluate(png => {
  const ids = [...document.querySelectorAll(".card .addbtn")].slice(0, 3).map(b => b.dataset.add);
  IMAGES[ids[0]] = png; IMAGES[ids[1]] = "data:image/jpeg;base64,bm90IGFuIGltYWdl";
  renderResults();
  return ids;
}, PNG);
await page.waitForTimeout(400);
const cardOf = id => page.locator(".card", { has: page.locator(`[data-add="${id}"]`) });
ok(await cardOf(photoIds[0]).locator(".art > img").count() === 1 && await cardOf(photoIds[0]).locator(".art > img").evaluate(i => i.complete && i.naturalWidth > 0),
   "a part with a real photo shows it in the thumb");
ok(await cardOf(photoIds[0]).locator(".art").evaluate(a => a.children.length === 1 && a.textContent.trim() === ""), "the photo thumb holds only the image");
ok(await cardOf(photoIds[1]).locator(".art, img").count() === 0, "a photo that fails to load leaves no thumb, no broken image and no label");
ok(await cardOf(photoIds[1]).evaluate(c => c.firstElementChild.classList.contains("cardtop")), "the failed-photo card starts with its name row, like a photoless card");
ok(await cardOf(photoIds[2]).locator(".art").count() === 0, "untouched photoless card still has no image area");
const pArt = await cardOf(photoIds[0]).locator(".art").boundingBox(), pCard = await cardOf(photoIds[0]).boundingBox();
ok(pArt.height <= 64 && pArt.height < pCard.height / 4, `real-photo thumb stays modest (${Math.round(pArt.height)}px of a ${Math.round(pCard.height)}px card)`);
const rowTops = await page.locator(".card").evaluateAll(cs => cs.slice(0, 6).map(c => { const r = c.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)]; }));
const sameRow = rowTops.filter(r => r[0] === rowTops[0][0]);
ok(sameRow.length > 1 && sameRow.every(r => r[1] === sameRow[0][1]), "cards in the first row (photo and no photo) line up at the same height");
await page.screenshot({ path: path.join(shots, "01b-photo-and-fallback.png"), fullPage: false });
await page.evaluate(ids => { delete IMAGES[ids[0]]; delete IMAGES[ids[1]]; renderResults(); }, photoIds);
await page.waitForTimeout(200);
ok(await page.locator(".card .art").count() === 0, "removing the photos returns the cards to blank");

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
await page.fill("#custIsland", "MV Sea Star, North Harbour");
ok(JSON.stringify(await page.locator("#zone option").allTextContents()) === JSON.stringify(["Malé — Free", "Hulhumalé — Free", "Boats (harbour drop-off) — Free"]),
   "flag off: delivery select offers only the three free destinations");
await page.selectOption("#zone", "boats");
await page.waitForTimeout(300);
ok(!(await page.locator("#goBtn").isDisabled()), "send unlocks once contact details are filled");

const sub = await page.locator("#tSub").textContent();
const del = await page.locator("#tDel").textContent();
const gst = await page.locator("#tGst").textContent();
const all = await page.locator("#tAll").textContent();
const num = s => +String(s).replace(/[^0-9]/g, "");
ok(num(sub) === pricedPart.price, `subtotal counts only the priced line (MVR ${sub} = ${pricedPart.price})`);
ok(del.trim() === "Free", `delivery to boats is free (${del})`);
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
ok(waText.includes("Delivery (Boats (harbour drop-off)): Free") && waText.includes("Address: MV Sea Star, North Harbour"), "WhatsApp text: free delivery to boats and the vessel address");

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

console.log("\nShop view only");
ok(await page.locator("#modeSwitch, [data-skin]").count() === 0, "no #modeSwitch and no data-skin buttons");
ok(await page.locator("header.bar button", { hasText: /^\s*(Shop|Counter)\s*$/ }).count() === 0, "no Shop or Counter button in the header");
ok(await page.getAttribute("html", "data-skin") === null, "no skin attribute on <html>");
ok(await page.locator(".staffbox").count() === 0, "no staffbox in the DOM");
ok(!/\b(Cost|Margin|Re-order|Bin)\b/.test(await page.locator("#grid").innerText()), "cards show no cost, margin, re-order or bin");
{
  const ps = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await guard(ps);
  await ps.goto(url);
  await ps.evaluate(() => localStorage.setItem("avas.skin", "staff"));
  await ps.reload();
  await ps.waitForTimeout(700);
  ok(await ps.getAttribute("html", "data-skin") === null && await ps.locator(".staffbox").count() === 0, "a stored avas.skin=staff turns nothing on");
  await ps.close();
}

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
  /* first make that has a model with parts (Caterpillar marine is empty entries only) */
  const firstBrand = await page.evaluate((v) => [...document.querySelectorAll("#brandChips [data-brand]")]
    .findIndex(b => EQ.models.some(m => m.vertical === v && m.brand === b.dataset.brand && EQ.parts.some(p => p.fits.includes(m.id)))), v);
  await page.locator("#brandChips [data-brand]").nth(firstBrand).click();
  await page.waitForTimeout(200);
  const models = await page.locator("#modelChips [data-model]").count();
  /* empty engine entries (0 parts) are checked separately below */
  const firstFull = await page.locator("#modelChips [data-model]").evaluateAll(els =>
    els.findIndex(e => e.querySelector(".cc").textContent !== "0 parts"));
  await page.locator("#modelChips [data-model]").nth(firstFull).click();
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
ok(await page.locator("#detailBody .srclink, #detailBody .srclist").count() === 0 && (await outsideLinks(page, "#detail")).length === 0 &&
   !SOURCE_TEXT.test(eqBody), "detail has no Source section and no outside link");
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
ok(waEq.includes("For: Yamaha F250 / F300 V6 4.2L 250–300 hp (2010+)"), "WhatsApp text names the engine the part is for");
await page.click('#cart [data-close]');
await page.waitForTimeout(300);

console.log("\nNo counter view on equipment");
ok(await page.locator(".eqcard").count() > 0 && await page.locator(".eqcard .staffbox").count() === 0, "equipment cards have no staffbox");
ok(await page.locator(".eqcard .moreb").first().textContent() === "Fitment & notes →", "equipment card button reads \"Fitment & notes →\"");

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
ok(await page.locator("#modelChips [data-model]").count() === 6, "Parsun lists 6 engines (4 with parts, F130 and F300 empty)");

console.log("\nStep 2 engine order and empty engines");
await page.click('[data-vertical="outboards"]');
await page.waitForTimeout(150);
await page.click('#brandChips [data-brand="Mercury"]');
await page.waitForTimeout(150);
const mChips = await page.locator("#modelChips [data-model]").evaluateAll(els => els.map(e => e.dataset.model));
ok(mChips.length === 18 && mChips[0] === "mercury-avator-7-5e" && mChips.indexOf("mercury-seapro-15") < mChips.indexOf("mercury-seapro-500") &&
   mChips.indexOf("mercury-115-fourstroke-efi") === mChips.indexOf("mercury-seapro-115") - 1,
   `Mercury Step 2 is smallest first, FourStroke 115 just before SeaPro 115 (${mChips.length} engines)`);
await page.click('#modelChips [data-model="mercury-seapro-15"]');
await page.waitForTimeout(250);
ok(await page.locator('#modelChips [data-model="mercury-seapro-15"] .cc').textContent() === "0 parts", "SeaPro 15 chip shows 0 parts");
ok(await page.locator(".card").count() === 0 && await page.locator(".emptymodel h3").textContent() === "Ask for a price" &&
   /engine serial/.test(await page.locator(".emptymodel").textContent()), "empty engine asks for a price and the engine serial");
const askHref = await page.locator("#askEngine").getAttribute("href");
ok(askHref.startsWith("https://wa.me/9609600000?text=") && decodeURIComponent(askHref).includes("Mercury SeaPro 15 hp") &&
   await page.locator("#grid a, #rNote a").count() === 1 && await page.locator("#rNote").isHidden(),
   "the only link is the shop's WhatsApp, prefilled with the engine; no source link");
await page.click('[data-vertical="outboards"]');
await page.waitForTimeout(150);
await page.click('#brandChips [data-brand="Yamaha"]');
await page.waitForTimeout(150);
const yChips = await page.locator("#modelChips [data-model]").evaluateAll(els => els.map(e => e.dataset.model));
ok(yChips[0] === "yamaha-4hp-2stroke" && yChips.indexOf("yamaha-4hp-2stroke") < yChips.indexOf("yamaha-f350"), "Yamaha: 2-stroke 4 hp before F350");

console.log("\nMercury 115 FourStroke EFI (stock list)");
await pickModel("outboards", "Mercury", "mercury-115-fourstroke-efi");
const m115Ids = await cardIds();
const m115Misfit = await page.evaluate((ids) => ids.filter(id => !PART_BY_ID[id].fits.includes("mercury-115-fourstroke-efi")), m115Ids);
ok(m115Ids.length === 58 && m115Misfit.length === 0 && (await page.locator("#rTitle").textContent()) === "Mercury FourStroke 2.1L 115 hp",
   `Outboards > Mercury > FourStroke 2.1L 115 hp lists its 58 parts (${m115Ids.length})`);
ok(await page.locator('#modelChips [data-model="mercury-115-fourstroke-efi"]').textContent() === "FourStroke 2.1L 115 hp58 parts",
   "Step 2 button reads FourStroke 2.1L 115 hp · 58 parts");
const m115Note = await page.locator("#rNote").textContent();
ok(await page.locator("#rNote").isVisible() && /2B095049/.test(m115Note) && await page.locator("#rNote a").count() === 0,
   "115 model note names the serial range and has no link");
ok(await page.locator(".eqcard .stockline").count() === 58 &&
   (await page.locator(".eqcard .stockline").evaluateAll(els => els.every(e => e.textContent.trim().endsWith("In stock")))),
   "every 115 card shows In stock");
ok(await page.locator(".eqcard .staffbox").count() === 0, "no staffbox on the 115 cards");
ok(await page.locator(".eqcard .unver").count() === 13, `13 of the 115 numbers are marked to be confirmed (${await page.locator(".eqcard .unver").count()})`);
const k01 = await page.evaluate(() => EQ.parts.find(p => p.oem === "35-877769K01").id);
await page.click(`[data-detail="${k01}"]`);
await page.waitForTimeout(400);
const k01Body = await page.locator("#detailBody").textContent();
ok(await page.locator("#detailBody .srclink, #detailBody .srclist").count() === 0 && (await outsideLinks(page, "#detail")).length === 0 &&
   !/<h4>Source/.test(await page.locator("#detailBody").innerHTML()) && !SOURCE_TEXT.test(k01Body),
   "35-877769K01 drawer has no Source section, no source link and no \"No source link recorded.\"");
await page.keyboard.press("Escape");
await page.waitForTimeout(250);

console.log("\nYamaha 9.9FMH / 15FMH (parts sourced from amanifishing.com): no Source box");
const YFMH = "yamaha-15fmh-2stroke";
ok(await page.evaluate(id => EQ.parts.some(p => p.fits.includes(id) && (p.src || []).some(i => /amanifishing\.com/.test(EQUIP.urls[i]))), YFMH),
   "data still records amanifishing.com sources for this engine (internal only)");
await pickModel("outboards", "Yamaha", YFMH);
ok((await page.locator("#rTitle").textContent()).includes("2-stroke 9.9FMH / 15FMH 9.9–15 hp"), "model page opens");
const yPage = await page.locator("main").innerText();
ok((await outsideLinks(page, "main")).length === 0 && !/amanifishing/i.test(await page.locator("main").innerHTML()),
   "model page has no amanifishing or other outside link");
ok(!/\bSource\b|Product page|amanifishing/i.test(yPage) && await page.locator(".mnote-src, .srclink").count() === 0,
   "model page and model note show no Source box or product-page link");
const yPart = await page.evaluate(id => EQ.parts.find(p => p.fits.includes(id) && (p.src || []).length).id, YFMH);
await page.click(`[data-detail="${yPart}"]`);
await page.waitForTimeout(400);
const yBody = await page.locator("#detailBody").textContent();
ok(await page.locator("#detailBody .srclink, #detailBody .srclist").count() === 0 && (await outsideLinks(page, "#detail")).length === 0 &&
   !SOURCE_TEXT.test(yBody) && !/amanifishing/i.test(await page.locator("#detail").innerHTML()),
   `part drawer (${yPart}) has no Source section and no amanifishing link`);
await page.keyboard.press("Escape");
await page.waitForTimeout(250);
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
await searchFinds("35-877769K01", `p.oem === "35-877769K01"`, "the Mercury 115 oil filter by number");
{
  const oems = await page2.locator(".card [data-detail]").evaluateAll(els => els.map(e => PART_BY_ID[e.dataset.detail].oem));
  /* Q01 may also show (its note names K01), but always as its own card. */
  ok(oems.filter(o => o === "35-877769K01").length === 1 && oems.every(o => o === "35-877769K01" || o === "35-877769Q01"),
     `search 35-877769K01 shows one K01 card; Q01 stays a separate part (${oems.join(", ")})`);
  ok(await page2.locator(".eqcard .stockline", { hasText: "In stock" }).count() > 0, "the 35-877769K01 result shows In stock");
}
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


/* ================= Belts and impellers (BNF PLUS stock) ================= */
console.log("\nBelts");
{
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  pg.on("pageerror", e => errors.push("pageerror(bnf): " + e.message));
  pg.on("console", m => { if (m.type() === "error") errors.push("console(bnf): " + m.text()); });
  const reqs = [];
  pg.on("request", r => { if (/data-(equip|bnf)\.js/.test(r.url())) reqs.push(r.url().split("/").pop()); });
  await pg.goto(url);
  await pg.waitForTimeout(500);
  await pg.click('[data-vertical="belts"]');
  await pg.waitForSelector(".bnfcard", { timeout: 8000 });
  ok(reqs.join() === "data-bnf.js", `Belts loads only data-bnf.js (${reqs.join(", ")})`);
  ok(await pg.locator(".card").count() === 550 && (await pg.locator("#rCount").textContent()) === "550 belts", "Belts lists 550 belts");
  ok(await pg.locator(".card:has(.price .asklab)").count() === 550, "every belt reads Ask for price");
  ok(await pg.locator(".card .art, .card img").count() === 0, "belt cards have no photo area");
  ok((await pg.locator("#brandChips").innerText()).split("\n").join("|") === "V-ribbed (PK)|Classical V|Raw edge & cogged|Timing & metric", "Step 1 lists the belt types, ribbed first");
  ok((await pg.locator("#step1Label").textContent()).includes("belt type") && (await pg.locator("#step2Label").textContent()).includes("size"), "step labels talk about belt type and size");
  await pg.click('#brandChips [data-brand="V-ribbed (PK)"]');
  await pg.waitForTimeout(200);
  const groupsPK = await pg.locator("#modelChips [data-model]").evaluateAll(els => els.map(e => e.dataset.model));
  ok(groupsPK.join() === "belts-4pk,belts-5pk,belts-6pk,belts-7pk,belts-8pk,belts-9pk,belts-10pk,belts-12pk,belts-15pk,belts-23pk", "Step 2 groups PK belts by rib count");
  await pg.click('#modelChips [data-model="belts-8pk"]');
  await pg.waitForTimeout(250);
  const lens = await pg.locator(".card .plate .val").evaluateAll(els => els.map(e => +e.textContent.match(/(\d+)$/)[1]));
  ok(lens.length === 142 && lens.every((x, i) => !i || lens[i - 1] <= x), `8PK lists 142 belts, shortest first (${lens[0]}–${lens[lens.length - 1]} mm)`);
  ok((await pg.locator("#rTitle").textContent()) === "8PK V-ribbed belts" && pg.url().includes("v=belts&m=belts-8pk"), "8PK heading and ?v=belts&m=belts-8pk URL");
  ok(await pg.locator(".bnfcard .stockline", { hasText: /In stock|Order in/ }).count() === 142, "every 8PK card shows In stock or Order in");
  ok(!/\bMVR\s*\d/.test(await pg.locator("#grid").innerText()), "no price shown on any belt card");
  await pg.screenshot({ path: path.join(shots, "13-belts-8pk.png") });
  const beltId = await pg.locator(".card [data-detail]").first().getAttribute("data-detail");
  await pg.click(`[data-detail="${beltId}"]`);
  await pg.waitForTimeout(350);
  const bBody = await pg.locator("#detailBody").textContent();
  ok(/Size & type/.test(bBody) && /BNF PLUS stock no\./.test(bBody) && /Ask for price/.test(bBody) && !/undefined|NaN|\bnull\b/.test(bBody) &&
     (await outsideLinks(pg, "#detail")).length === 0 && !SOURCE_TEXT.test(bBody), "belt drawer: size, stock no., ask for price; no source, no outside link");
  await pg.click("#detailBody [data-add]");
  await pg.waitForTimeout(250);
  await pg.click("#detail [data-close]");
  await pg.click("#cartOpen");
  await pg.waitForTimeout(300);
  const bLine = await pg.locator("#cartBody .line").last().textContent();
  ok(/BNF PLUS stock BLT/.test(bLine) && /price to confirm/.test(bLine) && !/For /.test(bLine), "belt cart line: stock no., price to confirm, no machine");
  await pg.click("#cart [data-close]");
  await pg.waitForTimeout(250);

  console.log("\nImpellers");
  await pg.click('[data-vertical="impellers"]');
  await pg.waitForTimeout(400);
  ok(await pg.locator(".card").count() === 63 && (await pg.locator("#rCount").textContent()) === "63 impellers", "Impellers lists 63 impellers");
  ok(await pg.locator(".card:has(.price .asklab)").count() === 63 && await pg.locator(".card .art, .card img").count() === 0, "every impeller: Ask for price, no photo");
  ok(await pg.evaluate(() => !PART_BY_ID.imp1080), "IMP1080 (Sherwood G1010 pump) is not listed");
  const impChips = await pg.locator(".bnfcard", { hasText: "IMP1043" }).locator(".fitchip").allTextContents();
  ok(impChips.join() === "Yanmar 6HYM-WET", `IMP1043 shows its matched engine (${impChips.join(", ")})`);
  await pg.screenshot({ path: path.join(shots, "14-impellers.png") });
  await pg.click('#brandChips [data-brand="Cummins"]');
  await pg.waitForTimeout(250);
  ok((await pg.locator(".card [data-detail]").evaluateAll(els => els.map(e => PART_BY_ID[e.dataset.detail].sku))).sort().join() === "IMP1036,IMP1037", "Impellers › Cummins lists IMP1036 and IMP1037");
  await pg.close();
}

console.log("\nBelt and impeller search from the default page");
{
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  pg.on("pageerror", e => errors.push("pageerror(bnf2): " + e.message));
  await pg.goto(url);
  await pg.waitForTimeout(500);
  const finds = async (q, want) => {
    await pg.fill("#q", q);
    await pg.waitForSelector(".bnfcard", { timeout: 8000 }).catch(() => {});
    await pg.waitForTimeout(300);
    const got = await pg.locator(".card [data-detail]").evaluateAll(els => els.map(e => PART_BY_ID[e.dataset.detail].sku || PART_BY_ID[e.dataset.detail].id));
    ok(want.every(w => got.includes(w)), `search "${q}" on the Bikes page finds ${want.join(" + ")} (${got.length} result${got.length === 1 ? "" : "s"})`);
    return got;
  };
  ok((await finds("8PK1440", ["BLT443"])).length === 1, "8PK1440 is exact");
  await finds("8PK 1440", ["BLT443"]);
  await finds("1440", ["BLT443"]);
  await finds("5PK890", ["BLT044", "BLT522"]);
  await finds("A68", ["BLT504"]);
  await finds("B87", ["BLT518"]);
  await finds("IMP1036", ["IMP1036"]);
  await finds("125613-42762", ["IMP1043", "IMP1002", "m01249"]);
  await finds("3897337", ["IMP1036", "m00020"]);
  await finds("8PK1440", ["BLT443"]);
  await pg.screenshot({ path: path.join(shots, "15-search-8pk1440.png") });
  await pg.close();
}

console.log("\nImpeller tags on engine parts");
{
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  pg.on("pageerror", e => errors.push("pageerror(bnf3): " + e.message));
  await pg.goto(url + "?v=marine_diesel&m=yanmar-6hym-wet");
  await pg.waitForSelector(".eqcard", { timeout: 8000 });
  await pg.waitForFunction(() => PART_BY_ID.m01249 && PART_BY_ID.m01249.bnfImp, null, { timeout: 8000 });
  await pg.evaluate(() => renderResults());
  const card = pg.locator(".eqcard", { has: pg.locator('[data-detail="m01249"]') });
  const tagText = await card.locator(".refs").innerText();
  ok(/BNF PLUS stock/i.test(tagText) && /IMP1043 · order in/.test(tagText) && /IMP1002 · in stock/.test(tagText), `Yanmar 125613-42762 shows both impellers honestly (${tagText.replace(/\n/g, " ")})`);
  const hrefs = await card.locator(".implink").evaluateAll(els => els.map(a => a.getAttribute("href")));
  ok(hrefs.join() === "?v=impellers&q=IMP1043,?v=impellers&q=IMP1002", "the tags link to the Impellers listing (same site)");
  ok((await outsideLinks(pg, "main")).length === 0, "no outside link on the engine page");
  await pg.screenshot({ path: path.join(shots, "16-yanmar-impeller-tag.png") });
  await pg.click('[data-detail="m01249"]');
  await pg.waitForTimeout(300);
  ok(/Impellers that cross-reference this number/.test(await pg.locator("#detailBody").textContent()), "engine part drawer lists the cross-referencing impellers");
  await pg.keyboard.press("Escape");
  await card.locator('.implink[data-imp="IMP1043"]').click();
  await pg.waitForTimeout(400);
  ok(pg.url().includes("v=impellers") && await pg.locator('.bnfcard [data-detail="imp1043"]').count() === 1, "clicking IMP1043 opens it on the Impellers page");
  await pg.goto(url + "?v=marine_diesel&m=cummins-marine-qsl");
  await pg.waitForFunction(() => PART_BY_ID.m00020 && PART_BY_ID.m00020.bnfImp, null, { timeout: 8000 });
  await pg.evaluate(() => renderResults());
  ok(/IMP1036/.test(await pg.locator(".eqcard", { has: pg.locator('[data-detail="m00020"]') }).locator(".refs").innerText()), "Cummins QSL Kit, WP Repair (389733700) shows IMP1036");
  const tagged = await pg.evaluate(() => ["m00003", "m01339"].map(id => PART_BY_ID[id] && PART_BY_ID[id].bnf && PART_BY_ID[id].bnf.sku));
  ok(tagged.join() === "FIL1784,FIL1397", "ported BNF filter tags are on m00003 / m01339");
  await pg.goto(url + "?v=impellers&m=yanmar-6hym-wet");
  await pg.waitForSelector(".bnfcard", { timeout: 8000 });
  await pg.waitForTimeout(250);
  ok((await pg.locator("#rTitle").textContent()) === "Yanmar 6HYM-WET · impellers" && await pg.locator(".card").count() === 2, "?v=impellers&m=<engine> lists that engine's impellers");
  await pg.goto(url + "?v=belts");
  await pg.waitForSelector(".bnfcard", { timeout: 8000 });
  ok(await pg.locator('#vertChips [data-vertical="belts"][aria-pressed="true"]').count() === 1, "?v=belts opens the Belts section");
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 1, "no horizontal overflow at 390px on Belts");
  await pg.close();
}
{
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto(url);
  await pg.waitForTimeout(400);
  const bearing = pg.locator(".card", { has: pg.locator('[data-detail="n0117"]') });
  ok(/BNF PLUS stock/i.test(await bearing.locator(".refs").innerText()) && !/MVR|price/i.test(await bearing.locator(".refs").innerText()), "bike bearing n0117 shows its BNF PLUS stock line, no price");
  await pg.close();
}


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
  const askDetail = await pg.locator(".card:has(.price .asklab) [data-detail]").first().getAttribute("data-detail");
  await pg.click(`[data-detail="${askDetail}"]`);
  await pg.waitForTimeout(400);
  const askText = await pg.locator("#detailBody").textContent();
  ok(/confirm the price and send you a quote/.test(askText) && !/WhatsApp/.test(askText), "flag on: ask-for-price detail says we quote it, not \"order on WhatsApp\"");
  await pg.click("#detail [data-close]");
  await pg.waitForTimeout(300);
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

/* ================= Phones: 360px and 390px ================= */
async function mobileRun(width) {
  console.log(`\nPhone ${width}px`);
  const pg = await browser.newPage({ viewport: { width, height: 780 }, isMobile: true, hasTouch: true });
  const net = await guard(pg);
  pg.on("pageerror", e => errors.push(`pageerror(${width}): ` + e.message));
  pg.on("console", m => { if (m.type() === "error" && !isApiNoise(m.text())) errors.push(`console(${width}): ` + m.text()); });
  await pg.goto(url);
  await pg.evaluate(() => { localStorage.clear(); });
  await pg.reload();
  await pg.waitForTimeout(700);
  const over = () => pg.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
  const box = sel => pg.locator(sel).first().boundingBox();
  const inView = b => b && b.x >= -0.5 && b.x + b.width <= width + 0.5 && b.height > 0;
  const tall = async (sel, min = 40) => { const b = await box(sel); return !!b && b.height >= min; };

  ok(await over() <= 1, `home: no horizontal overflow (${await over()}px)`);
  const [logo, q, cart] = await Promise.all([".logo", "#q", "#cartOpen"].map(box));
  ok([logo, q, cart].every(inView), "header: logo, search and Order all on screen");
  ok(await pg.locator("#modeSwitch, [data-skin], header.bar .mode").count() === 0 &&
     await pg.locator("header.bar button", { hasText: /^\s*(Shop|Counter)\s*$/ }).count() === 0, "header: no Shop / Counter switch");
  ok(Math.abs(logo.y - cart.y) < 12 && q.y > cart.y, "header: logo and Order share the first row; search below");
  ok(q.width >= width - 40 && q.height >= 44, `search is full width and 44px tall (${Math.round(q.width)}×${Math.round(q.height)})`);
  ok(await pg.locator("#q").evaluate(e => parseFloat(getComputedStyle(e).fontSize)) >= 16, "search text is 16px (no iOS zoom on focus)");
  ok(await tall("#cartOpen") && await tall("#vertChips .chip", 44) && await tall("#brandChips .chip", 44), "Order and picker chips are tappable (≥40/44px)");
  ok(await tall(".card .addbtn", 44), "Add button is 44px tall");
  ok(await pg.locator(".card .art, .card .nophoto, .card img").count() === 0 && await pg.locator(".card").first().evaluate(c => c.firstElementChild.classList.contains("cardtop")),
     "photoless cards have no image box and start with the name row");
  const firstAdd = await pg.locator(".card .addbtn").first().getAttribute("data-add");
  await pg.evaluate(id => { IMAGES[id] = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="; renderResults(); }, firstAdd);
  await pg.waitForTimeout(250);
  const art = await box(".card .art"), card = await box(".card");
  ok(!!art && inView(art) && art.height <= 64 && art.height < card.height / 4, `real-photo thumb stays modest and on screen (${art ? Math.round(art.height) : "-"}px of a ${Math.round(card.height)}px card)`);
  ok(await over() <= 1, `home with a photo card: no horizontal overflow (${await over()}px)`);
  await pg.evaluate(id => { delete IMAGES[id]; renderResults(); }, firstAdd);
  await pg.waitForTimeout(250);
  ok(await pg.locator(".kicker").evaluate(e => e.scrollWidth <= e.clientWidth + 1), "kicker wraps instead of overflowing");
  ok(await pg.locator(".foot").evaluate(e => e.scrollWidth <= e.clientWidth + 1), "footer wraps instead of overflowing");
  await pg.screenshot({ path: path.join(shots, `m${width}-01-home.png`) });

  /* model page */
  await pg.click('[data-brand="Honda"]');
  await pg.waitForTimeout(250);
  await pg.click(`[data-model="${WAVE}"]`);
  await pg.waitForTimeout(300);
  ok((await pg.locator("#rTitle").textContent()).includes("Wave 125i"), "model chip selectable by tap");
  ok(await over() <= 1, `model page: no horizontal overflow (${await over()}px)`);
  ok(await tall("#catWrap .catbtn", 44), "category rail buttons are 44px tall");
  const railScrolls = await pg.locator("#catWrap").evaluate(e => e.scrollWidth > e.clientWidth);
  await pg.locator('#catWrap [data-cat="brake"]').click();
  await pg.waitForTimeout(250);
  ok(railScrolls && await pg.locator('#catWrap [data-cat="brake"][aria-pressed="true"]').count() === 1, "category rail scrolls sideways and a category can be picked");
  const askPrice = pg.locator(".card .price .asklab").first();
  if (await askPrice.count()) ok(await askPrice.evaluate(e => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().right <= innerWidth), "\"Ask for price\" not clipped");
  await pg.screenshot({ path: path.join(shots, `m${width}-02-model.png`) });
  await pg.click('#catWrap [data-cat=""]');
  await pg.waitForTimeout(200);

  /* search (from the whole catalogue) */
  await pg.click("#clearBtn");
  await pg.waitForTimeout(250);
  await pg.fill("#q", "brake pad pcx");
  await pg.waitForTimeout(400);
  ok(await pg.locator(".card").count() > 0 && await over() <= 1, `search: results and no horizontal overflow (${await over()}px)`);
  await pg.fill("#q", "");
  await pg.waitForTimeout(300);

  /* cart */
  const add = pg.locator(".card:has(.price .amt) .addbtn").first();
  await add.scrollIntoViewIfNeeded();
  await add.tap();
  await pg.waitForTimeout(250);
  ok((await pg.locator("#cartN").textContent()).trim() === "1", "Add works by tap");
  const cart2 = await box("#cartOpen");
  ok(inView(cart2) && inView(await box(".logo")) && inView(await box("#q")), "header still fits with the cart count showing");
  await pg.locator("#cartOpen").tap();
  await pg.waitForTimeout(450);
  const drawer = await box("#cart");
  ok(drawer && Math.round(drawer.width) === width && drawer.x === 0, "order drawer is full width");
  ok(await tall("#cart .xbtn", 44) && await tall("#cartBody .qty button", 40), "close and quantity buttons are tappable");
  const coOpen = await box("#coOpen");
  ok(coOpen && coOpen.y + coOpen.height <= 780 && coOpen.height >= 48, "Checkout button visible without scrolling");
  ok(await over() <= 1, `cart: no horizontal overflow (${await over()}px)`);
  await pg.screenshot({ path: path.join(shots, `m${width}-03-cart.png`) });

  /* checkout form */
  await pg.locator("#coOpen").tap();
  await pg.waitForTimeout(450);
  ok(await pg.locator("#checkout.on").isVisible(), "checkout opens");
  for (const id of ["#coName", "#coPhone", "#coEmail", "#coDestination", "#coAddress"]) {
    const b = await box(id);
    ok(inView(b) && b.height >= 44 && await pg.locator(id).evaluate(e => parseFloat(getComputedStyle(e).fontSize)) >= 16, `${id} is full-size (${Math.round(b.width)}×${Math.round(b.height)}, 16px text)`);
  }
  await fillCheckout(pg, "7712345", "Boats", "MV Sea Star, North Harbour");
  ok(await pg.locator("#coAddress").inputValue() === "MV Sea Star, North Harbour" && await pg.locator("#coDestination").inputValue() === "Boats", "fields fillable on a phone");
  await pg.locator("#coSubmit").scrollIntoViewIfNeeded();
  const sub = await box("#coSubmit");
  ok(sub && sub.y >= 0 && sub.y + sub.height <= 780 && sub.height >= 48 && inView(sub), "Place order button reachable and full-size");
  ok(await over() <= 1, `checkout: no horizontal overflow (${await over()}px)`);
  await pg.screenshot({ path: path.join(shots, `m${width}-04-checkout.png`) });
  await pg.waitForTimeout(150);
  net.replies.push({ status: 201, body: { orderNo: "AV-2611-0009", trackUrl: "https://api.avas.parts/track/tok9", status: "pending_payment",
    totals: { currency: "MVR", subtotal: 100, gst: 8, shipping: 0, shippingPending: false, total: 108, hasAskLines: false } } });
  await pg.locator("#coSubmit").tap();
  await pg.waitForTimeout(500);
  ok(await pg.locator("#coDone").isVisible() && /Bank transfer details to follow/.test(await pg.locator("#coDone").textContent()), "confirmation shows, with the bank-transfer placeholder");
  const track = await box("#coDone a.cotrack");
  ok(inView(track) && await over() <= 1, "confirmation fits the screen");
  await pg.screenshot({ path: path.join(shots, `m${width}-05-done.png`) });
  ok(net.unexpected.length === 0, "no unmocked API calls");
  await pg.close();
}
await mobileRun(360);
await mobileRun(390);

ok(net1.turnstile === 0 && net1.api.length === 0, "WhatsApp run made no Turnstile or API requests");

ok(errors.length === 0, "still no JS errors after the full run" + (errors.length ? " → " + errors.join(" | ") : ""));

await browser.close();
console.log("\n" + (fail ? `${fail} check(s) FAILED` : "All browser checks passed"));
process.exit(fail ? 1 : 0);
