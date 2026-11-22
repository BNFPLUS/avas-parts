/* avas.parts — part finder, interchange engine, ordering */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

const MODEL_BY_ID = Object.fromEntries(MODELS.map(m => [m.id, m]));
const CAT_BY_ID   = Object.fromEntries(CATS.map(c => [c.id, c]));
const PART_BY_ID  = Object.fromEntries(PARTS.map(p => [p.id, p]));

/* ---------- Verticals: bikes live in data.js; everything else (outboards,
   marine diesel, jet skis, generators, pumps, machinery) is in data-equip.js,
   which is only fetched when someone asks for it. ---------- */
const VERTICALS_UI = [
  { id: "bikes",         name: "Bikes",                  unit: "bike",    pick: "model" },
  { id: "outboards",     name: "Outboards",              unit: "engine",  pick: "engine" },
  { id: "marine_diesel", name: "Marine diesel",          unit: "engine",  pick: "engine" },
  { id: "jetski",        name: "Jet skis",               unit: "ski",     pick: "ski" },
  { id: "generators",    name: "Generators",             unit: "set",     pick: "generator set" },
  { id: "pumps",         name: "Pumps & power products", unit: "machine", pick: "pump or engine" },
  { id: "machinery",     name: "Heavy machinery",        unit: "machine", pick: "machine" },
];
const VERT_BY_ID = Object.fromEntries(VERTICALS_UI.map(v => [v.id, v]));
const EQ = { loaded: false, loading: null, failed: false, parts: [], models: [], cats: [] };
const isEq = (p) => !!p.vertical;
const isEqModel = (m) => !!m.vertical;
/* cards rendered per page; "Show more" adds another page */
const PAGE = 120;

const state = {
  vertical: "bikes",
  brand: null,
  model: null,
  cat: null,
  q: "",
  limit: PAGE,
  skin: localStorage.getItem("avas.skin") || "public",
  cart: JSON.parse(localStorage.getItem("avas.cart") || "{}"),
  /* which machine an equipment line was added for, so the WhatsApp order says it */
  ctx: JSON.parse(localStorage.getItem("avas.cartctx") || "{}"),
};

const money = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const hasPrice = (p) => !p.askPrice && typeof p.price === "number";
const dash = (v, asMoney) => (v == null || v === "") ? "—" : (asMoney ? money(v) : esc(String(v)));

function priceHTML(p) {
  if (!hasPrice(p)) return `<div class="price ask"><span class="asklab">Ask for price</span></div>`;
  return `<div class="price"><span class="cur">MVR</span><span class="amt">${money(p.price)}</span></div>`;
}

function cartTotals(lines) {
  const pricedLines = lines.filter(({ p }) => hasPrice(p));
  const askQty = lines.filter(({ p }) => !hasPrice(p)).reduce((a, { q }) => a + q, 0);
  const sub = pricedLines.reduce((a, { p, q }) => a + p.price * q, 0);
  const del = zoneFee();
  const gst = Math.round((sub + del) * SHOP.gstRate);
  return { pricedLines, askQty, sub, del, gst, total: sub + del + gst };
}

/* ---------- Part-number parsing: the decoder behind the plate ---------- */
function parsePN(oem) {
  const p = String(oem).split("-");
  if (p.length === 3) {
    if (/^\d{5}$/.test(p[0])) {
      return { style: "honda", segs: [
        { val: p[0], lab: "group",  cls: "g" },
        { val: p[1], lab: "family", cls: "f" },
        { val: p[2], lab: "var",    cls: "r" },
      ], group: p[0], family: p[1] };
    }
    if (FAMILY[p[0]]) {
      return { style: "yamaha", segs: [
        { val: p[0], lab: "family",   cls: "f" },
        { val: p[1], lab: "function", cls: "g" },
        { val: p[2], lab: "var",      cls: "r" },
      ], group: null, family: p[0] };
    }
  }
  return { style: "plain", segs: [{ val: oem, lab: "part no", cls: "g" }], group: null, family: null };
}

function plateHTML(oem, plain) {
  const pn = parsePN(oem);
  return `<span class="plate${plain || pn.style === "plain" ? " plain" : ""}">` +
    pn.segs.map(s => `<span class="seg ${s.cls}"><span class="val">${esc(s.val)}</span><span class="lab">${s.lab}</span></span>`).join("") +
    `</span>`;
}

function decodeHTML(oem) {
  const pn = parsePN(oem);
  const bits = [];
  if (pn.group && GROUP[pn.group]) bits.push(`<b>${esc(GROUP[pn.group])}</b>`);
  if (pn.family && FAMILY[pn.family]) bits.push(esc(FAMILY[pn.family]));
  return bits.length ? `<div class="decode">${bits.join(" · ")}</div>` : "";
}

/* Our own shop codes — tyre sizes, consumables, accessories. There is no
   manufacturer number behind these, so "verify before ordering" would be
   nonsense: we are the ones who assigned them. */
const OWN_SKU = /^(AVS-|\d+\/\d+-\d+|TUBE\b|TL VALVE|DOT \d|CHAIN \d)/;
const isOwnSku = (p) => OWN_SKU.test(p.oem);
/* Dealer-sourced rows carry confirmed:"verify" (seen on a retailer page only),
   which overrides v. */
const isConfirmed = (p) => !!p.v && p.confirmed !== "verify";
const needsCheck = (p) => !isConfirmed(p) && !isOwnSku(p);

/* ---------- Search ---------- */
/* "Solé" is found by "sole": accents are folded on both sides. */
const fold = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Size, bearing.wiki designation and BNF PLUS stock numbers, so "6201",
   "6201-2RS", "20x42x12" or a BNF SKU find the part. */
const wikiCode = (p) => p.wiki ? decodeURIComponent(p.wiki.replace(/\/+$/, "").split("/").pop()) : "";
const dims = (s) => s && s.bore_mm != null && s.od_mm != null && s.width_mm != null ? `${s.bore_mm}x${s.od_mm}x${s.width_mm}` : "";
function refText(p) {
  const s = p.size, b = p.bnf;
  return [
    s ? `${s.designation} ${dims(s)} ${s.kind === "bearing" ? "bearing" : s.kind && s.kind.includes("seal") ? "seal oil seal" : ""}` : "",
    wikiCode(p),
    b ? [b.sku, b.brand, b.pn, b.pn ? b.pn.replace(/[-\s]/g, "") : "", b.designation,
         ...(b.matches || []).map(m => `${m.sku} ${m.brand} ${m.pn}`)].filter(Boolean).join(" ") : "",
  ].join(" ");
}

function haystack(p) {
  const models = p.fits.map(id => MODEL_BY_ID[id] ? MODEL_BY_ID[id].brand + " " + MODEL_BY_ID[id].name : "").join(" ");
  const pn = parsePN(p.oem);
  return fold([
    p.name, p.oem, p.oem.replace(/-/g, ""), (p.alts || []).join(" "),
    (p.alts || []).map(a => a.replace(/-/g, "")).join(" "),
    p.catalogue_name || "",
    models, CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "",
    pn.group ? GROUP[pn.group] || "" : "",
    pn.family ? FAMILY[pn.family] || "" : "",
    p.universal ? "universal fits all any bike" : "",
    p.note || "",
    refText(p),
  ].join(" "));
}
PARTS.forEach(p => { p._h = haystack(p); });

/* Equipment parts: number as printed and with dashes/slashes/spaces removed,
   alternates, catalogue name, and every fitted machine's name, model number and
   engine code — buyers search by "KTA19", "6HYM", "PC200-8", "WB30XT3". */
const squash = (s) => String(s).replace(/[-\/.\s]/g, "");
function eqModelText(m) {
  return [m.brand, m.name, m.model_number, m.engine, m.kind, m.catalogue, m.src_title, m.size].filter(Boolean).join(" ");
}
function eqHaystack(p) {
  const v = VERT_BY_ID[p.vertical];
  return fold([
    p.name, p.oem, squash(p.oem), (p.alts || []).join(" "), (p.alts || []).map(squash).join(" "),
    p.catalogue_name || "",
    p.fits.map(id => MODEL_BY_ID[id] ? eqModelText(MODEL_BY_ID[id]) : "").join(" "),
    CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "", v ? v.name : "",
    p.note || "",
    refText(p),
  ].join(" "));
}

/* "20X42X12", "20×42×12" and "20*42*12" all read as 20x42x12. */
const qTerms = () => { const q = fold(state.q.trim()).replace(/(\d)\s*[×*]\s*(?=\d)/g, "$1x"); return q ? q.split(/\s+/) : []; };

/* Machines whose name, model number or engine code match the query, so a
   machine with no parts list yet (Kama KDP30E, engine KM178FE) is still found. */
function modelHits(terms) {
  if (!terms.length) return [];
  const eq = EQ.loaded ? EQ.models.map(m => [m, fold(eqModelText(m))]) : [];
  const bikes = MODELS.map(m => [m, fold(`${m.brand} ${m.model || ""} ${m.name}`)]);
  return bikes.concat(eq).filter(([, h]) => terms.every(t => h.includes(t) || (t.length > 2 && squash(h).includes(squash(t)))))
    .map(([m]) => m);
}
const termsMatch = (p, terms) => terms.every(t =>
  p._h.includes(t) || (isEq(p) && t.length > 2 && p._h.includes(squash(t))));

/* A query with no make picked searches everything; once a make or model is
   picked, results stay inside that selection. */
function inScope(p, terms) {
  const global = terms.length && !state.brand && !state.model;
  if (!isEq(p)) {
    if (state.vertical !== "bikes" && !global) return false;
    if (state.model && !p.universal && !p.fits.includes(state.model)) return false;
    if (state.brand && !state.model) {
      const ok = p.universal || p.fits.some(id => MODEL_BY_ID[id] && MODEL_BY_ID[id].brand === state.brand);
      if (!ok) return false;
    }
    return true;
  }
  if (global) return true;
  if (p.vertical !== state.vertical) return false;
  if (state.model) return p.fits.includes(state.model);
  if (state.brand) return p.fits.some(id => MODEL_BY_ID[id] && MODEL_BY_ID[id].brand === state.brand);
  return true;
}

function pool() {
  if (!EQ.loaded) return PARTS;
  if (state.vertical === "bikes") return PARTS.concat(EQ.parts);
  /* current vertical first, then the rest of the equipment, then bikes */
  const here = EQ.parts.filter(p => p.vertical === state.vertical);
  return here.concat(EQ.parts.filter(p => p.vertical !== state.vertical), PARTS);
}

function results() {
  const terms = qTerms();
  return pool().filter(p => {
    if (!inScope(p, terms)) return false;
    if (state.cat && p.cat !== state.cat) return false;
    if (terms.length && !termsMatch(p, terms)) return false;
    return true;
  });
}

/* ---------- Interchange: other part numbers doing the same job ---------- */
function sameJob(part) {
  const g = parsePN(part.oem).group;
  if (!g) return [];
  return PARTS.filter(p => p.id !== part.id && parsePN(p.oem).group === g);
}

/* ---------- Lazy load: data-equip.js ----------
   A <script> tag, not fetch(): it has to work from file:// too. */
function integrateEquip() {
  const E = EQUIP;
  E.verticals.forEach(v => { if (VERT_BY_ID[v.id]) Object.assign(VERT_BY_ID[v.id], { name: v.name, unit: v.unit }); });
  E.models.forEach(m => { MODEL_BY_ID[m.id] = m; });
  E.cats.forEach(c => { CAT_BY_ID[c.id] = c; });
  E.parts.forEach(p => { p._h = eqHaystack(p); PART_BY_ID[p.id] = p; });
  EQ.parts = E.parts; EQ.models = E.models; EQ.cats = E.cats;
  EQ.loaded = true; EQ.failed = false;
}

function loadEquip() {
  if (EQ.loaded) return Promise.resolve();
  if (typeof EQUIP !== "undefined") { integrateEquip(); return Promise.resolve(); } // single-file bundle
  if (EQ.loading) return EQ.loading;
  EQ.loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "data-equip.js";
    s.async = true;
    s.onload = () => { try { integrateEquip(); resolve(); } catch (e) { reject(e); } };
    s.onerror = () => { s.remove(); reject(new Error("data-equip.js failed to load")); };
    document.head.appendChild(s);
  }).catch(err => {
    EQ.loading = null; EQ.failed = true;
    throw err;
  });
  return EQ.loading;
}

function ensureEquip() {
  if (EQ.loaded) return;
  const p = loadEquip();
  if (EQ.loaded) return;                 // bundle: available synchronously
  render();                              // shows the loading state
  p.then(render, () => { render(); toast("Could not load the marine & equipment catalogue"); });
}

/* ---------- Render: vertical picker + hero copy ---------- */
const BIKE_COPY = { lede: $("#lede").innerHTML, step2: $("#step2Label").innerHTML };

function renderVerticals() {
  $("#vertChips").innerHTML = VERTICALS_UI.map(v =>
    `<button class="chip vchip" data-vertical="${v.id}" aria-pressed="${state.vertical === v.id}">${esc(v.name)}</button>`
  ).join("");
}

function renderHero() {
  const v = VERT_BY_ID[state.vertical];
  if (state.vertical === "bikes") {
    if ($("#lede").innerHTML !== BIKE_COPY.lede) $("#lede").innerHTML = BIKE_COPY.lede;
    if ($("#step2Label").innerHTML !== BIKE_COPY.step2) $("#step2Label").innerHTML = BIKE_COPY.step2;
    return;
  }
  $("#lede").textContent =
    `One wrong digit means the wrong part on the next boat. Pick the make and the ${v.pick}, ` +
    `and we will show you the exact number from the maker's catalogue ` +
    `and what to check before you order. Every price is confirmed on WhatsApp.`;
  $("#step2Label").textContent = `Step 2 — pick the ${v.pick}`;
}

function renderEqPickers() {
  const wrap = $("#modelRow");
  if (!EQ.loaded) {
    $("#brandChips").innerHTML = EQ.failed
      ? `<span class="loading">Could not load this catalogue. <button class="clearbtn" data-vertical="${state.vertical}">Try again</button></span>`
      : `<span class="loading" role="status">Loading the ${esc(VERT_BY_ID[state.vertical].name.toLowerCase())} catalogue…</span>`;
    wrap.hidden = true; $("#modelChips").innerHTML = "";
    return;
  }
  const models = EQ.models.filter(m => m.vertical === state.vertical);
  const brands = [...new Set(models.map(m => m.brand))].sort();
  $("#brandChips").innerHTML = brands.map(b =>
    `<button class="chip" data-brand="${esc(b)}" aria-pressed="${state.brand === b}">${esc(b)}</button>`
  ).join("");

  const list = state.brand ? models.filter(m => m.brand === state.brand) : [];
  if (!list.length) { wrap.hidden = true; $("#modelChips").innerHTML = ""; return; }
  wrap.hidden = false;
  const count = {};
  EQ.parts.forEach(p => { if (p.vertical === state.vertical) p.fits.forEach(id => { count[id] = (count[id] || 0) + 1; }); });
  $("#modelChips").innerHTML = list
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }))
    .map(m => `<button class="chip" data-model="${esc(m.id)}" aria-pressed="${state.model === m.id}">${esc(m.name)}<span class="cc">${count[m.id] ? count[m.id] + " parts" : "no parts list yet"}</span></button>`)
    .join("");
}

/* ---------- Render: brand + model pickers ---------- */
function renderPickers() {
  if (state.vertical !== "bikes") return renderEqPickers();
  $("#brandChips").innerHTML = BRANDS.filter(b => MODELS.some(m => m.brand === b)).map(b =>
    `<button class="chip" data-brand="${esc(b)}" aria-pressed="${state.brand === b}">${esc(b)}</button>`
  ).join("");

  const list = state.brand ? MODELS.filter(m => m.brand === state.brand) : [];
  const wrap = $("#modelRow");
  if (!list.length) { wrap.hidden = true; $("#modelChips").innerHTML = ""; return; }
  wrap.hidden = false;
  $("#modelChips").innerHTML = list
    .sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name))
    .map(m => `<button class="chip${m.pop >= 5 ? " hotpick" : ""}" data-model="${m.id}" aria-pressed="${state.model === m.id}">${esc(m.name)}<span class="cc">${m.cc}cc</span></button>`)
    .join("");
}

/* ---------- Render: category rail ---------- */
function renderRail() {
  const terms = qTerms();
  const base = pool().filter(p => inScope(p, terms) && (!terms.length || termsMatch(p, terms)));
  const counts = {};
  base.forEach(p => { counts[p.cat] = (counts[p.cat] || 0) + 1; });

  $("#catWrap").innerHTML =
    `<button class="catbtn" data-cat="" aria-pressed="${!state.cat}">
       <span>All parts</span><span class="k">${base.length}</span></button>` +
    CATS.concat(EQ.cats).filter(c => counts[c.id]).map(c =>
      `<button class="catbtn" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">
         <span>${esc(c.name)}</span><span class="k">${counts[c.id]}</span></button>`
    ).join("");
}

/* ---------- Render: part cards ---------- */
function stockLine(p) {
  if (p.stock == null)   return "";
  if (p.stock <= 0)      return `<span class="stockline"><span class="dotr">●</span> On order</span>`;
  if (p.stock <= p.rop)  return `<span class="stockline"><span class="doty">●</span> Low stock</span>`;
  return `<span class="stockline"><span class="dotg">●</span> In stock</span>`;
}

/* Notes that say the fit depends on a serial, frame, hull or engine code. */
const SERIAL_HINT = /serial|frame no|engine code|variant|\bhull\b|type range|verify engine/i;
const needsSerial = (p) => SERIAL_HINT.test(p.note || "");
const unverified = (p) => p.tier === "genuine-unverified";
const eqModelName = (m) => `${m.brand} ${m.name}`;

/* ---------- Size, bearing.wiki and BNF PLUS stock references ----------
   BNF PLUS prices are not public, so only the SKU, brand, their number and
   availability are shown; the part itself stays "Ask for price". */
const AVAIL = { stock: "in stock", low: "low stock", indent: "on indent" };
const availLabel = (a) => AVAIL[a] || a || "";
const SIZE_KIND = { bearing: "Bearing", seal: "Seal", oil_seal: "Oil seal", tyre: "Tyre" };

function sizeLabel(s) {
  if (!s) return "";
  const d = dims(s);
  return `${SIZE_KIND[s.kind] || "Size"} ${s.designation}${d && d !== s.designation ? ` · ${d.replace(/x/g, "×")} mm` : ""}`;
}

function wikiLink(p) {
  return p.wiki && /^https:\/\/bearing\.wiki\//.test(p.wiki)
    ? `<a class="wikilink" href="${esc(p.wiki)}" target="_blank" rel="noopener noreferrer">bearing.wiki ↗</a>` : "";
}

function bnfSummary(b) {
  if (b.sku) return `${esc(b.sku)} · ${esc(b.brand)} ${esc(b.pn)}${b.avail ? " · " + esc(availLabel(b.avail)) : ""}`;
  const ms = b.matches || [];
  const brands = [...new Set(ms.map(m => m.brand))];
  const inStock = ms.filter(m => m.avail === "stock").length;
  return `${ms.length} match${ms.length === 1 ? "" : "es"} · ${esc(brands.slice(0, 3).join(", "))}${brands.length > 3 ? ` +${brands.length - 3}` : ""}` +
    (inStock ? ` · ${inStock} in stock` : "");
}

function refsHTML(p) {
  if (!p.size && !p.wiki && !p.bnf) return "";
  return `<div class="refs">
    ${p.size || p.wiki ? `<div class="refrow">${p.size ? `<span class="sizechip">${esc(sizeLabel(p.size))}</span>` : ""}${wikiLink(p)}</div>` : ""}
    ${p.bnf ? `<div class="bnfline"><b>BNF PLUS stock</b> ${bnfSummary(p.bnf)}</div>` : ""}
  </div>`;
}

function refsDetailHTML(p) {
  if (!p.size && !p.wiki && !p.bnf) return "";
  const ms = p.bnf ? (p.bnf.matches || []) : [];
  const rows = ms.slice(0, 8).map(m =>
    `<div class="altrow"><span>${esc(m.sku)} · ${esc(m.brand)} ${esc(m.pn)}</span><span class="tag">${esc(availLabel(m.avail))}</span></div>`).join("");
  return `<div class="dsec"><h4>Size &amp; stock references</h4>
    ${p.size || p.wiki ? `<div class="refrow">${p.size ? `<span class="sizechip">${esc(sizeLabel(p.size))}</span>` : ""}${wikiLink(p)}</div>` : ""}
    ${p.bnf ? `<p class="hint" style="margin-top:8px"><b>BNF PLUS stock${p.bnf.sku ? "" : ` for ${esc(p.bnf.designation || (p.size ? p.size.designation : ""))}`}:</b> ${p.bnf.sku ? bnfSummary(p.bnf) : `${ms.length} matching item${ms.length === 1 ? "" : "s"}`}</p>
      ${p.bnf.sku ? "" : `<div class="altlist">${rows}</div>${ms.length > 8 ? `<p class="hint">+${ms.length - 8} more matching items</p>` : ""}`}
      <p class="hint">BNF PLUS prices are not public. Ask for the price on WhatsApp.</p>` : ""}
  </div>`;
}

function eqPlateHTML(oem) {
  return `<span class="plate plain eq"><span class="seg g"><span class="val">${esc(oem)}</span><span class="lab">part no</span></span></span>`;
}

function eqFlagsHTML(p) {
  return (unverified(p) ? `<span class="unver">Number to be confirmed — verify</span>` : "") +
    (needsSerial(p) ? `<span class="serialnote">Check frame/serial number</span>` : "");
}

function eqCardHTML(p) {
  const v = VERT_BY_ID[p.vertical];
  /* the selected machine first, so it never hides behind "+N more" */
  const fits = state.model && p.fits.includes(state.model)
    ? [state.model, ...p.fits.filter(id => id !== state.model)] : p.fits;
  const fitNames = fits.slice(0, 4).map(id => {
    const m = MODEL_BY_ID[id];
    return m ? `<span class="fitchip${state.model === id ? " on" : ""}">${esc(eqModelName(m))}</span>` : "";
  }).join("") + (p.fits.length > 4 ? `<span class="fitchip">+${p.fits.length - 4} more</span>` : "");

  return `<article class="card eqcard" data-vert="${esc(p.vertical)}">
    ${artHTML(p)}
    <div class="eqtag">${esc(v ? v.name : "")} · ${esc(CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "")}</div>
    <div class="cardtop">
      <h3 class="cardname">${esc(p.name)}</h3>
      <span class="tier genuine">genuine</span>
    </div>
    ${eqPlateHTML(p.oem)}
    ${eqFlagsHTML(p)}
    ${refsHTML(p)}
    <div class="ribbon">${fitNames}</div>
    <div class="staffbox">
      <div><span class="l">Cost</span><span class="v">—</span></div>
      <div><span class="l">Margin</span><span class="v marg">—</span></div>
      <div><span class="l">Stock</span><span class="v">—</span></div>
      <div><span class="l">Re-order</span><span class="v">—</span></div>
      <div><span class="l">Bin</span><span class="v">—</span></div>
    </div>
    <button class="moreb" data-detail="${esc(p.id)}">Fitment &amp; notes →</button>
    <div class="cardfoot">
      <div>${priceHTML(p)}</div>
      <button class="addbtn" data-add="${esc(p.id)}">Add</button>
    </div>
  </article>`;
}

function cardHTML(p) {
  if (isEq(p)) return eqCardHTML(p);
  const fitNames = p.universal
    ? `<span class="fitchip uni">Fits any bike</span>`
    : p.fits.slice(0, 5).map(id => {
        const m = MODEL_BY_ID[id];
        if (!m) return "";
        return `<span class="fitchip${state.model === id ? " on" : ""}">${esc(m.name)}</span>`;
      }).join("") + (p.fits.length > 5 ? `<span class="fitchip">+${p.fits.length - 5} more</span>` : "");

  const margin = hasPrice(p) && typeof p.cost === "number"
    ? Math.round(((p.price - p.cost) / p.price) * 100) + "%"
    : "—";
  const stockLow = typeof p.stock === "number" && typeof p.rop === "number" && p.stock <= p.rop;

  return `<article class="card">
    ${artHTML(p)}
    <div class="cardtop">
      <h3 class="cardname">${esc(p.name)}</h3>
      <span class="tier ${p.tier}">${p.tier === "oem-alt" ? "OEM alt" : p.tier}</span>
    </div>
    ${plateHTML(p.oem)}
    ${decodeHTML(p.oem)}
    ${needsCheck(p) ? `<span class="unver">Verify number before ordering</span>` : ""}
    ${refsHTML(p)}
    <div class="ribbon">${fitNames}</div>
    <div class="staffbox">
      <div><span class="l">Cost</span><span class="v">${dash(p.cost, true)}</span></div>
      <div><span class="l">Margin</span><span class="v marg">${margin}</span></div>
      <div><span class="l">Stock</span><span class="v ${stockLow ? "low" : ""}">${dash(p.stock)}</span></div>
      <div><span class="l">Re-order</span><span class="v">${dash(p.rop)}</span></div>
      <div><span class="l">Bin</span><span class="v">${dash(p.bin)}</span></div>
    </div>
    <button class="moreb" data-detail="${p.id}">Fitment, alternates &amp; interchange →</button>
    <div class="cardfoot">
      <div>
        ${priceHTML(p)}
        ${stockLine(p)}
      </div>
      <button class="addbtn" data-add="${p.id}">Add</button>
    </div>
  </article>`;
}

function renderModelNote() {
  const box = $("#rNote");
  const m = state.model ? MODEL_BY_ID[state.model] : null;
  if (!m || state.q.trim()) { box.hidden = true; box.innerHTML = ""; return; }
  /* Bike model notes are build provenance; only a customer-facing notice shows. */
  if (state.vertical === "bikes") {
    box.innerHTML = m.notice ? `<div class="mnote-note">${esc(m.notice)}</div>` : "";
    box.hidden = !box.innerHTML;
    return;
  }
  const bits = [];
  if (m.model_number) bits.push(`<span><b>Model</b> ${esc(m.model_number)}</span>`);
  if (m.engine) bits.push(`<span><b>Engine</b> ${esc(m.engine)}</span>`);
  if (m.size) bits.push(`<span><b>Size</b> ${esc(m.size)}</span>`);
  if (m.catalogue) bits.push(`<span><b>Catalogue</b> ${esc(m.catalogue)}</span>`);
  const note = m.note ? `<div class="mnote-note">${SERIAL_HINT.test(m.note) || /unverified|nearest/i.test(m.note) ? `<span class="serialnote">Check frame/serial number</span> ` : ""}${esc(m.note)}</div>` : "";
  /* Plain text only: no product-page, store or source links. */
  box.innerHTML = `${bits.length ? `<div class="mnote-bits">${bits.join("")}</div>` : ""}${note}`;
  box.hidden = !box.innerHTML;
}

function renderResults() {
  if (state.vertical !== "bikes" && !EQ.loaded) {
    $("#rTitle").textContent = VERT_BY_ID[state.vertical].name;
    $("#rCount").textContent = "";
    $("#clearBtn").hidden = true;
    $("#rNote").hidden = true;
    $("#catWrap").innerHTML = "";
    $("#grid").innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>${EQ.failed ? "Could not load this catalogue" : "Loading the catalogue…"}</h3>
      <p>${EQ.failed ? "Check your connection and pick the category again." : "Part numbers for every engine and machine we cover."}</p></div>`;
    return;
  }
  const r = results();
  const m = state.model ? MODEL_BY_ID[state.model] : null;
  let title = "All parts";
  if (state.vertical !== "bikes") title = `${VERT_BY_ID[state.vertical].name} · all parts`;
  if (m) title = `${m.brand} ${m.name}`;
  else if (state.brand) title = state.vertical === "bikes" ? state.brand : `${state.brand} ${VERT_BY_ID[state.vertical].name.toLowerCase()}`;
  if (state.cat && CAT_BY_ID[state.cat]) title += ` · ${CAT_BY_ID[state.cat].name}`;
  if (state.q.trim()) title = `“${state.q.trim()}”`;

  $("#rTitle").textContent = title;
  $("#rCount").textContent = `${r.length} ${r.length === 1 ? "part" : "parts"}`;
  $("#clearBtn").hidden = !(state.brand || state.model || state.cat || state.q.trim());
  renderModelNote();

  const hits = state.q.trim() ? modelHits(qTerms()) : [];
  const hitsHTML = hits.length ? `<div class="modelhits" style="grid-column:1/-1">
      <span class="mh-lab">Machines matching</span>
      ${hits.slice(0, 6).map(hm => {
        const n = (isEqModel(hm) ? EQ.parts : PARTS).filter(p => p.fits.includes(hm.id)).length;
        return `<button class="chip" data-pick="${esc(hm.id)}">${esc(hm.brand)} ${esc(hm.name)}<span class="cc">${n ? n + " parts" : "no parts list yet"}</span></button>`;
      }).join("")}${hits.length > 6 ? `<span class="mh-lab">+${hits.length - 6} more</span>` : ""}
    </div>` : "";

  if (!r.length) {
    const noList = m && !state.q.trim() && !state.cat && isEqModel(m);
    $("#grid").innerHTML = hitsHTML + (noList
      ? `<div class="empty" style="grid-column:1/-1">
          <h3>No parts list for this ${esc(VERT_BY_ID[m.vertical].unit)} yet</h3>
          <p>The maker has not published a parts catalogue we can check. Send the nameplate (model and serial number) on WhatsApp and we will find the part number for you.</p>
        </div>`
      : hits.length
      ? `<div class="empty" style="grid-column:1/-1">
          <h3>No parts listed under that search</h3>
          <p>Pick the machine above to see what we have for it, or send the nameplate on WhatsApp and we will find the part number.</p>
        </div>`
      : `<div class="empty" style="grid-column:1/-1">
          <h3>Nothing matches that yet</h3>
          <p>Try the part number without dashes, the model, a bearing or seal size (“6201”, “20x42x12”), or what the part does — “belt”, “brake pad”, “battery”.</p>
          <button class="clearbtn" data-clear="1">Reset the search</button>
        </div>`);
    return;
  }
  /* Large lists render a page at a time; the count above is always the full total. */
  const shown = r.slice(0, state.limit);
  const rest = r.length - shown.length;
  $("#grid").innerHTML = hitsHTML + shown.map(cardHTML).join("") + (rest > 0
    ? `<div class="morewrap" style="grid-column:1/-1"><button class="clearbtn morebtn" data-more="1">Show ${Math.min(PAGE, rest)} more <span class="cc">${rest} not shown</span></button></div>`
    : "");
}

/* ---------- Detail drawer: equipment part ---------- */
function openEqDetail(p) {
  const v = VERT_BY_ID[p.vertical];
  const fitModels = p.fits.map(id => MODEL_BY_ID[id]).filter(Boolean);
  const fitBlock = `<div class="fitfull">${fitModels.map(m =>
    `<span class="m"><b>${esc(eqModelName(m))}</b>${m.model_number ? " · " + esc(m.model_number) : ""}</span>`).join("")}</div>` +
    fitModels.filter(m => m.note).map(m =>
      `<p class="hint"><b>${esc(m.name)}:</b> ${esc(m.note)}</p>`).join("");

  const altBlock = (p.alts && p.alts.length)
    ? `<div class="altlist">${p.alts.map(a => `<div class="altrow"><span>${esc(a)}</span><span class="tag">cross-reference</span></div>`).join("")}</div>`
    : `<p style="margin:0;font-size:13px;color:var(--ink-3)">No alternate numbers recorded.</p>`;

  $("#detailBody").innerHTML = `
    <div class="dsec">
      <h4>Part number</h4>
      ${eqPlateHTML(p.oem)}
      <p class="hint" style="margin-top:6px">${unverified(p)
        ? `<span class="unver">Number to be confirmed — verify</span> The source lists this number with a doubt. We confirm it before we order.`
        : "Printed exactly as the maker's catalogue shows it."}</p>
      ${needsSerial(p) ? `<p class="hint"><span class="serialnote">Check frame/serial number</span> The fit depends on the serial, frame or engine code. Send it with your order.</p>` : ""}
      ${p.catalogue_name ? `<p class="hint">Catalogue name: ${esc(p.catalogue_name)}</p>` : ""}
    </div>
    <div class="dsec"><h4>Fits these ${esc(v ? v.unit : "machine")}s</h4>${fitBlock}</div>
    <div class="dsec"><h4>Also sold as</h4>${altBlock}</div>
    ${refsDetailHTML(p)}
    ${p.note ? `<div class="dsec"><h4>Catalogue note</h4><div class="notebox">${esc(p.note)}</div></div>` : ""}
    <div class="dsec">
      <h4>Price</h4>
      ${priceHTML(p)}
      <p class="hint">${["We'll confirm the price on WhatsApp", esc(v ? v.name : ""), esc(CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "")].filter(Boolean).join(" · ")}</p>
    </div>
    <button class="gobtn" data-add="${esc(p.id)}">Add to order</button>`;

  $("#detailTitle").textContent = p.name;
  openDrawer("#detail");
}

/* ---------- Detail drawer: the full interchange view ---------- */
function openDetail(id) {
  const p = PART_BY_ID[id];
  if (!p) return;
  if (isEq(p)) return openEqDetail(p);
  const pn = parsePN(p.oem);
  const others = sameJob(p);

  const fitBlock = p.universal
    ? `<p style="margin:0;font-size:13.5px;color:var(--ink-2)">Universal — fits any motorcycle or scooter.</p>`
    : `<div class="fitfull">${p.fits.map(id2 => {
        const m = MODEL_BY_ID[id2];
        return m ? `<span class="m"><b>${esc(m.name)}</b> · ${m.cc}cc · ${esc(m.years)}</span>` : "";
      }).join("")}</div>`;

  /* Lineage alts are other suffixes of the same Honda stem seen on other
     fiches: searchable, but not a confirmed supersession. */
  const lineage = new Set(p.lineage || []);
  const altBlock = (p.alts && p.alts.length)
    ? `<div class="altlist">${p.alts.map(a => {
        const oemish = /^[0-9A-Z]{3,5}-/.test(a);
        const tag = lineage.has(a) ? "other suffix · confirm frame no." : oemish ? "supersession / OEM" : "aftermarket equivalent";
        return `<div class="altrow"><span>${esc(a)}</span><span class="tag">${tag}</span></div>`;
      }).join("")}</div>`
    : `<p style="margin:0;font-size:13px;color:var(--ink-3)">No alternate numbers recorded.</p>`;

  const jobBlock = others.length
    ? `<div class="altlist">${others.map(o => `
        <div class="altrow">
          <span>${esc(o.oem)}</span>
          <span class="tag">${esc(o.fits.slice(0,2).map(i => MODEL_BY_ID[i] ? MODEL_BY_ID[i].name : "").filter(Boolean).join(", ")) || "universal"}${o.fits.length > 2 ? " +" + (o.fits.length - 2) : ""}</span>
        </div>`).join("")}</div>`
    : `<p style="margin:0;font-size:13px;color:var(--ink-3)">No other numbers in this group yet.</p>`;

  $("#detailBody").innerHTML = `
    <div class="dsec">
      <h4>Part number</h4>
      ${plateHTML(p.oem)}
      ${decodeHTML(p.oem)}
      ${isConfirmed(p) ? `<p class="hint" style="margin-top:6px">Confirmed against a published parts source.</p>` : isOwnSku(p) ? `<p class="hint" style="margin-top:6px">An avas.parts shop code. There is no manufacturer number for this item.</p>` : `<p class="hint" style="margin-top:6px"><span class="unver">Not yet confirmed</span> — check this number against the bike’s frame number before you order.</p>`}
    </div>

    ${pn.group || pn.family ? `<div class="dsec">
      <h4>How to read this number</h4>
      <p style="margin:0;font-size:13.5px;color:var(--ink-2)">
        ${pn.group ? `<b style="color:var(--ink)">${esc(pn.group)}</b> says what the part is — ${esc(GROUP[pn.group] || "an unlisted group")}. ` : ""}
        ${pn.family ? `<b style="color:var(--hot)">${esc(pn.family)}</b> is the model family — ${esc(FAMILY[pn.family] || "an unlisted family")}. ` : ""}
        The last block is the revision. Two parts sharing the first two blocks almost always interchange.
      </p>
    </div>` : ""}

    <div class="dsec"><h4>Fits these bikes</h4>${fitBlock}</div>
    <div class="dsec"><h4>Also sold as</h4>${altBlock}</div>
    <div class="dsec"><h4>Same job, other model families</h4>${jobBlock}</div>
    ${refsDetailHTML(p)}
    ${p.note ?`<div class="dsec"><h4>Counter note</h4><div class="notebox">${esc(p.note)}</div></div>` : ""}

    <div class="dsec">
      <h4>Price</h4>
      ${priceHTML(p)}
      <p class="hint">${[stockLine(p).replace(/<[^>]+>/g, "").trim(), !hasPrice(p) ? "We'll confirm the price on WhatsApp" : "", esc(CAT_BY_ID[p.cat].name)].filter(Boolean).join(" · ")}</p>
    </div>
    <button class="gobtn" data-add="${p.id}">Add to order</button>`;

  $("#detailTitle").textContent = p.name;
  openDrawer("#detail");
}

/* ---------- Cart ---------- */
const cartCount = () => Object.values(state.cart).reduce((a, b) => a + b, 0);
const cartLines = () => Object.entries(state.cart)
  .map(([id, q]) => ({ p: PART_BY_ID[id], q }))
  .filter(x => x.p);

/* "Honda WB30XT3 water pump (WB30XT3-DR)" — the machine an equipment line is for. */
function machineLabel(p) {
  const pick = state.ctx[p.id] && MODEL_BY_ID[state.ctx[p.id]] ? [state.ctx[p.id]] : p.fits;
  const names = pick.slice(0, 2).map(id => {
    const m = MODEL_BY_ID[id];
    return m ? eqModelName(m) + (m.model_number ? ` (${m.model_number})` : "") : "";
  }).filter(Boolean);
  return names.join(", ") + (pick.length > 2 ? ` +${pick.length - 2} more` : "");
}

function saveCart() {
  localStorage.setItem("avas.cart", JSON.stringify(state.cart));
  for (const id of Object.keys(state.ctx)) if (!state.cart[id]) delete state.ctx[id];
  localStorage.setItem("avas.cartctx", JSON.stringify(state.ctx));
  const n = cartCount();
  $("#cartN").textContent = n;
  $("#cartN").dataset.empty = n ? "0" : "1";
}

function addToCart(id, silent) {
  const part = PART_BY_ID[id];
  if (part && isEq(part) && state.model && part.fits.includes(state.model)) state.ctx[id] = state.model;
  state.cart[id] = (state.cart[id] || 0) + 1;
  saveCart();
  if (!silent) {
    const p = PART_BY_ID[id];
    toast(`${p.name} added`);
  }
  renderCart();
}

function setQty(id, q) {
  if (q <= 0) delete state.cart[id]; else state.cart[id] = q;
  saveCart(); renderCart();
}

function zoneFee() {
  const z = ZONES.find(z => z.id === $("#zone").value);
  return z ? z.fee : 0;
}

function renderCart() {
  const lines = cartLines();
  const body = $("#cartBody");

  if (!lines.length) {
    body.innerHTML = `<div class="empty">
      <h3>No parts yet</h3>
      <p>Pick your bike or engine, then add the parts you need. We deliver to every inhabited island.</p>
    </div>`;
    $("#cartFoot").hidden = true;
    return;
  }
  $("#cartFoot").hidden = false;

  body.innerHTML = lines.map(({ p, q }) => `
    <div class="line">
      <div class="info">
        <div class="nm">${esc(p.name)}</div>
        <div class="pn">${esc(p.oem)}</div>
        ${isEq(p) ? `<div class="pn">For ${esc(machineLabel(p))}</div>` : ""}
        <div class="qty">
          <button data-q="${p.id}|${q - 1}" aria-label="Fewer">−</button>
          <span>${q}</span>
          <button data-q="${p.id}|${q + 1}" aria-label="More">+</button>
        </div>
      </div>
      <div class="rt"><div class="lp${hasPrice(p) ? "" : " ask"}">${hasPrice(p) ? money(p.price * q) : "price to confirm"}</div></div>
    </div>`).join("");

  const { pricedLines, askQty, sub, del, gst, total } = cartTotals(lines);
  $("#tSub").textContent = pricedLines.length ? money(sub) : "—";
  $("#tAsk").textContent = askQty ? `${askQty} item${askQty === 1 ? "" : "s"}` : "";
  $("#tAskRow").hidden = !askQty;
  $("#tDel").textContent = money(del);
  $("#tGst").textContent = money(gst);
  $("#tAll").textContent = askQty
    ? "MVR " + money(total) + " + prices to confirm"
    : "MVR " + money(total);
  $("#goBtn").disabled = !$("#custName").value.trim() || !$("#custPhone").value.trim();
}

function orderText() {
  const lines = cartLines();
  const z = ZONES.find(z => z.id === $("#zone").value);
  const { pricedLines, askQty, sub, del, gst, total } = cartTotals(lines);
  const ref = "AVAS-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  return [
    `*avas.parts order ${ref}*`, "",
    ...lines.map(({ p, q }) => hasPrice(p)
      ? `${q} × ${p.name}\n   ${p.oem} — MVR ${money(p.price * q)}`
      : isEq(p)
        ? `${q} × ${p.name}\n   ${p.oem} — price to confirm\n   For: ${machineLabel(p)}`
        : `${q} × ${p.name}\n   ${p.oem} — price to confirm`),
    "",
    pricedLines.length ? `Subtotal: MVR ${money(sub)}` : "Subtotal: —",
    askQty ? `Price to confirm: ${askQty} item${askQty === 1 ? "" : "s"}` : "",
    `Delivery (${z.name}): MVR ${money(del)}`,
    `GST 8%: MVR ${money(gst)}`,
    askQty
      ? `*Total: MVR ${money(total)} + prices to confirm*`
      : `*Total: MVR ${money(total)}*`,
    "",
    `Name: ${$("#custName").value.trim()}`,
    `Phone: ${$("#custPhone").value.trim()}`,
    `Island: ${$("#custIsland").value.trim() || "—"}`,
    `Zone: ${z.name} (${z.eta})`,
    $("#custNote").value.trim() ? `Note: ${$("#custNote").value.trim()}` : "",
  ].filter(Boolean).join("\n");
}

function sendOrder() {
  const txt = orderText();
  const url = `https://wa.me/960${SHOP.whatsapp}?text=${encodeURIComponent(txt)}`;
  window.open(url, "_blank", "noopener");
  navigator.clipboard?.writeText(txt).catch(() => {});
  toast("Order opened in WhatsApp — also copied");
}

/* ---------- Drawers, toast, skin ---------- */
function openDrawer(sel) { $(sel).classList.add("on"); $("#scrim").classList.add("on"); }
function closeDrawers() {
  $$(".drawer").forEach(d => d.classList.remove("on"));
  $("#scrim").classList.remove("on");
}

let toastT;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("on"), 1900);
}

function applySkin() {
  document.documentElement.dataset.skin = state.skin;
  $$("#modeSwitch button").forEach(b =>
    b.setAttribute("aria-pressed", b.dataset.skin === state.skin));
  localStorage.setItem("avas.skin", state.skin);
}

/* ---------- Zones in footer + select ---------- */
function renderZones() {
  $("#zone").innerHTML = ZONES.map(z =>
    `<option value="${z.id}">${esc(z.name)} — MVR ${z.fee} · ${esc(z.eta)}</option>`).join("");
  $("#zoneList").innerHTML = ZONES.map(z =>
    `<li class="zline"><span>${esc(z.name)}</span><span>${esc(z.eta)}</span></li>`).join("");
}

/* ---------- Wire up ---------- */
function render() {
  state.limit = PAGE;
  renderVerticals(); renderHero(); renderPickers();
  if (state.vertical !== "bikes" && !EQ.loaded) { renderResults(); syncURL(); return; }
  renderRail(); renderResults(); syncURL();
}

/* ---------- Deep links: ?v=outboards&m=<model-id>&q=… ---------- */
const BOOT_PARAMS = new URLSearchParams(location.search);
let urlTouched = ["v", "m", "b", "q"].some(k => BOOT_PARAMS.has(k));
function syncURL() {
  if (!urlTouched && state.vertical === "bikes") return;   // the bike default never touches the URL
  urlTouched = true;
  const ps = new URLSearchParams();
  if (state.vertical !== "bikes") ps.set("v", state.vertical);
  if (state.model) ps.set("m", state.model);
  else if (state.brand) ps.set("b", state.brand);
  if (state.q.trim() && BOOT_PARAMS.has("q")) ps.set("q", state.q.trim());
  const qs = ps.toString();
  try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash); } catch {}
}

function applyDeepLink() {
  const ps = BOOT_PARAMS;
  const v = ps.get("v"), m = ps.get("m"), b = ps.get("b"), q = ps.get("q");
  if (q) { state.q = q; $("#q").value = q; }
  const apply = () => {
    const model = m && MODEL_BY_ID[m];
    if (model) {
      state.vertical = model.vertical || "bikes";
      state.brand = model.brand; state.model = m;
    } else if (b) state.brand = b;
    render();
  };
  if (v && VERT_BY_ID[v]) state.vertical = v;
  const needEq = state.vertical !== "bikes" || (m && !MODEL_BY_ID[m]) || (q && q.trim().length >= 2);
  if (needEq) { ensureEquip(); loadEquip().then(apply, () => {}); }
  else if (m || b || q) apply();
}

function chooseVertical(v) {
  if (!VERT_BY_ID[v]) return;
  if (v === state.vertical && (EQ.loaded || v === "bikes")) return;
  state.vertical = v;
  state.brand = state.model = state.cat = null;
  if (v !== "bikes") ensureEquip();
  render();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-vertical],[data-brand],[data-model],[data-cat],[data-add],[data-detail],[data-q],[data-clear],[data-skin],[data-close],[data-more],[data-pick]");
  if (!t) return;

  if (t.dataset.more) {
    state.limit += PAGE; renderResults();
  } else if (t.dataset.pick) {
    const m = MODEL_BY_ID[t.dataset.pick];
    if (!m) return;
    state.vertical = m.vertical || "bikes";
    state.brand = m.brand; state.model = m.id; state.cat = null;
    state.q = ""; $("#q").value = "";
    render();
  } else if (t.dataset.vertical !== undefined) {
    chooseVertical(t.dataset.vertical);
  } else if (t.dataset.brand !== undefined) {
    state.brand = state.brand === t.dataset.brand ? null : t.dataset.brand;
    state.model = null; render();
  } else if (t.dataset.model !== undefined) {
    state.model = state.model === t.dataset.model ? null : t.dataset.model;
    render();
  } else if (t.dataset.cat !== undefined) {
    state.cat = t.dataset.cat || null; render();
  } else if (t.dataset.add) {
    addToCart(t.dataset.add);
  } else if (t.dataset.detail) {
    openDetail(t.dataset.detail);
  } else if (t.dataset.q) {
    const [id, q] = t.dataset.q.split("|"); setQty(id, +q);
  } else if (t.dataset.clear) {
    state.brand = state.model = state.cat = null; state.q = ""; $("#q").value = ""; render();
  } else if (t.dataset.skin) {
    state.skin = t.dataset.skin; applySkin();
  } else if (t.dataset.close !== undefined) {
    closeDrawers();
  }
});

/* Typing a query pulls in the equipment catalogue (debounced) so a part number
   like 6CE-WS24A-00 or an engine code like KTA19 is found from any page. */
let eqSearchT;
$("#q").addEventListener("input", (e) => {
  state.q = e.target.value; state.limit = PAGE; renderRail(); renderResults();
  if (!EQ.loaded && state.q.trim().length >= 2) {
    clearTimeout(eqSearchT);
    eqSearchT = setTimeout(() => loadEquip().then(() => { renderRail(); renderResults(); }, () => {}), 250);
  }
});
$("#cartOpen").addEventListener("click", () => { renderCart(); openDrawer("#cart"); });
$("#scrim").addEventListener("click", closeDrawers);
$("#zone").addEventListener("change", renderCart);
["custName", "custPhone"].forEach(id => $("#" + id).addEventListener("input", renderCart));
$("#goBtn").addEventListener("click", sendOrder);
$("#clearBtn").addEventListener("click", () => {
  state.brand = state.model = state.cat = null; state.q = ""; $("#q").value = ""; render();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawers();
  if (e.key === "/" && document.activeElement !== $("#q")) { e.preventDefault(); $("#q").focus(); }
});

applySkin();
renderZones();
render();
saveCart();
renderCart();
applyDeepLink();
/* An order saved with equipment lines needs the equipment catalogue to show them. */
if (Object.keys(state.cart).some(id => !PART_BY_ID[id])) loadEquip().then(renderCart, () => {});
