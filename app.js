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
   which is only fetched when someone asks for it. Belts and impellers (BNF PLUS
   stock, bnf: true) are in data-bnf.js, fetched the same way. Diving (FKM
   O-rings in scuba sizes, also BNF PLUS stock) is in data-dive.js. ---------- */
const VERTICALS_UI = [
  { id: "bikes",         name: "Bikes",                  unit: "bike",    pick: "model" },
  { id: "outboards",     name: "Outboards",              unit: "engine",  pick: "engine" },
  { id: "marine_diesel", name: "Marine diesel",          unit: "engine",  pick: "engine" },
  { id: "jetski",        name: "Jet skis",               unit: "ski",     pick: "ski" },
  { id: "generators",    name: "Generators",             unit: "set",     pick: "generator set" },
  { id: "pumps",         name: "Pumps & power products", unit: "machine", pick: "pump or engine" },
  { id: "machinery",     name: "Heavy machinery",        unit: "machine", pick: "machine" },
  { id: "belts",         name: "Belts",                  unit: "belt",    pick: "size", bnf: true },
  { id: "impellers",     name: "Impellers",              unit: "impeller", pick: "engine", bnf: true },
  { id: "diving",        name: "Diving",                 unit: "O-ring",  pick: "use", bnf: true, dive: true },
];
const VERT_BY_ID = Object.fromEntries(VERTICALS_UI.map(v => [v.id, v]));
const EQ = { loaded: false, loading: null, failed: false, parts: [], models: [], cats: [] };
const BN = { loaded: false, loading: null, failed: false, parts: [], groups: [], cats: [] };
const DV = { loaded: false, loading: null, failed: false, parts: [], groups: [], cats: [] };
const isEq = (p) => !!p.vertical;
const isBnfV = (v) => !!(VERT_BY_ID[v] && VERT_BY_ID[v].bnf);
const isDiveV = (v) => !!(VERT_BY_ID[v] && VERT_BY_ID[v].dive);
const isBnf = (p) => !!p.sku;                 // a belt, impeller or dive O-ring row from BNF PLUS stock
/* What a part is listed under: a belt group (8PK, A section) or the machines it fits. */
const partModels = (p) => p.grp ? [p.grp] : p.fits;
const store = (v) => isDiveV(v) ? DV : isBnfV(v) ? BN : EQ;
const vertReady = (v) => v === "bikes" || store(v).loaded;

const state = {
  vertical: "bikes",
  brand: null,
  model: null,
  cat: null,
  q: "",
  cart: JSON.parse(localStorage.getItem("avas.cart") || "{}"),
  /* which machine an equipment line was added for, so the WhatsApp order says it */
  ctx: JSON.parse(localStorage.getItem("avas.cartctx") || "{}"),
};

const money = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const hasPrice = (p) => !p.askPrice && typeof p.price === "number";

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
const squash = (s) => String(s).replace(/[-\/.\s]/g, "");
function haystack(p) {
  const models = p.fits.map(id => MODEL_BY_ID[id] ? MODEL_BY_ID[id].brand + " " + MODEL_BY_ID[id].name : "").join(" ");
  const pn = parsePN(p.oem);
  return [
    p.name, p.oem, p.oem.replace(/-/g, ""), (p.alts || []).join(" "),
    (p.alts || []).map(a => a.replace(/-/g, "")).join(" "),
    models, CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "",
    pn.group ? GROUP[pn.group] || "" : "",
    pn.family ? FAMILY[pn.family] || "" : "",
    p.universal ? "universal fits all any bike" : "",
    p.note || "",
    bnfText(p.bnf),
  ].join(" ").toLowerCase();
}

/* BNF PLUS stock tag numbers, so a BNF SKU, their number or a bearing
   designation ("6201") finds the part. Never a price. */
function bnfText(b) {
  if (!b) return "";
  return [b.sku, b.brand, b.pn, b.pn ? squash(b.pn) : "", b.designation,
    ...(b.matches || []).map(m => `${m.sku} ${m.brand} ${m.pn}`), "bnf plus stock"].filter(Boolean).join(" ");
}
PARTS.forEach(p => { p._h = haystack(p); });

/* Equipment parts: number as printed and with dashes/slashes/spaces removed,
   alternates, catalogue name, and every fitted machine's name, model number and
   engine code — buyers search by "KTA19", "6HYM", "PC200-8", "WB30XT3". */
function eqModelText(m) {
  return [m.brand, m.name, m.model_number, m.engine, m.kind, m.catalogue, (m.aka || []).join(" ")].filter(Boolean).join(" ");
}
function eqHaystack(p) {
  const v = VERT_BY_ID[p.vertical];
  return [
    p.name, p.oem, squash(p.oem), (p.alts || []).join(" "), (p.alts || []).map(squash).join(" "),
    p.catalogue_name || "",
    p.fits.map(id => MODEL_BY_ID[id] ? eqModelText(MODEL_BY_ID[id]) : "").join(" "),
    CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "", v ? v.name : "",
    p.note || "",
    bnfText(p.bnf),
  ].join(" ").toLowerCase();
}

/* Belts, impellers and dive O-rings: the number as printed and squashed
   ("8PK 1440" and "8PK1440"), stock number, brand, size, cross-reference
   numbers, the belt or dive group, any engine an impeller cross-references to,
   and an O-ring's use and search words ("12.42x1.78", "yoke", "tank neck"). */
function bnfHaystack(p) {
  const v = VERT_BY_ID[p.vertical], g = p.grp && MODEL_BY_ID[p.grp];
  return [
    p.name, p.oem, squash(p.oem), p.sku, p.alt_sku || "", p.brand, p.size || "",
    (p.alts || []).join(" "), (p.alts || []).map(squash).join(" "),
    p.use || "", p.material || "", p.find || "",
    /* a dive O-ring's own use is searched, not its group ("DIN and yoke …") */
    g && !p.use ? `${g.name} ${g.title || ""}` : "",
    p.fits.map(id => MODEL_BY_ID[id] ? eqModelText(MODEL_BY_ID[id]) : "").join(" "),
    CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "", v ? v.name : "",
    "bnf plus stock",
  ].join(" ").toLowerCase();
}

const qTerms = () => { const q = state.q.trim().toLowerCase(); return q ? q.split(/\s+/) : []; };
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
  if (state.model) return partModels(p).includes(state.model);
  if (state.brand) return partModels(p).some(id => MODEL_BY_ID[id] && MODEL_BY_ID[id].brand === state.brand);
  return true;
}

function pool() {
  const extra = (EQ.loaded ? EQ.parts : []).concat(BN.loaded ? BN.parts : [], DV.loaded ? DV.parts : []);
  if (!extra.length) return PARTS;
  if (state.vertical === "bikes") return PARTS.concat(extra);
  /* current vertical first, then the rest of the equipment, then bikes */
  const here = extra.filter(p => p.vertical === state.vertical);
  return here.concat(extra.filter(p => p.vertical !== state.vertical), PARTS);
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
  linkBnf();
}

/* Belt groups act as Step 2 "models"; impeller fitment engines come with
   their names so the Impellers page works without data-equip.js. */
function integrateBnf() {
  const B = BNF;
  B.verticals.forEach(v => { if (VERT_BY_ID[v.id]) Object.assign(VERT_BY_ID[v.id], { name: v.name, unit: v.unit }); });
  B.groups.forEach(g => { MODEL_BY_ID[g.id] = g; });
  Object.values(B.models).forEach(m => { if (!MODEL_BY_ID[m.id]) MODEL_BY_ID[m.id] = m; });
  B.cats.forEach(c => { CAT_BY_ID[c.id] = c; });
  B.parts.forEach(p => { p._h = bnfHaystack(p); PART_BY_ID[p.id] = p; });
  BN.parts = B.parts; BN.groups = B.groups; BN.cats = B.cats;
  BN.loaded = true; BN.failed = false;
  linkBnf();
}

/* Dive O-ring groups (Tank neck, valve face, …) act as Step 1 picks. */
function integrateDive() {
  const D = DIVE;
  D.verticals.forEach(v => { if (VERT_BY_ID[v.id]) Object.assign(VERT_BY_ID[v.id], { name: v.name, unit: v.unit }); });
  D.groups.forEach(g => { MODEL_BY_ID[g.id] = g; });
  D.cats.forEach(c => { CAT_BY_ID[c.id] = c; });
  D.parts.forEach(p => { p._h = bnfHaystack(p); PART_BY_ID[p.id] = p; });
  DV.parts = D.parts; DV.groups = D.groups; DV.cats = D.cats;
  DV.loaded = true; DV.failed = false;
}

/* Engine parts whose number a BNF impeller cross-references get the impeller
   SKUs (p.bnfImp), shown as a stock tag linking to the Impellers listing. */
function linkBnf() {
  if (!BN.loaded) return;
  for (const [id, skus] of Object.entries(BNF.links)) {
    const p = PART_BY_ID[id];
    if (!p || p.bnfImp) continue;
    p.bnfImp = skus;
    p._h += " " + skus.join(" ").toLowerCase() + " bnf plus stock impeller";
  }
}

/* A <script> tag, not fetch(): it has to work from file:// too. */
function lazyScript(st, file, has, integrate) {
  if (st.loaded) return Promise.resolve();
  if (has()) { integrate(); return Promise.resolve(); } // single-file bundle
  if (st.loading) return st.loading;
  st.loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = file;
    s.async = true;
    s.onload = () => { try { integrate(); resolve(); } catch (e) { reject(e); } };
    s.onerror = () => { s.remove(); reject(new Error(file + " failed to load")); };
    document.head.appendChild(s);
  }).catch(err => {
    st.loading = null; st.failed = true;
    throw err;
  });
  return st.loading;
}
const loadEquip = () => lazyScript(EQ, "data-equip.js", () => typeof EQUIP !== "undefined", integrateEquip);
const loadBnf = () => lazyScript(BN, "data-bnf.js", () => typeof BNF !== "undefined", integrateBnf);
const loadDive = () => lazyScript(DV, "data-dive.js", () => typeof DIVE !== "undefined", integrateDive);
const loadFor = (v) => isDiveV(v) ? loadDive() : isBnfV(v) ? loadBnf() : loadEquip();
/* A search looks everywhere: equipment, belts, impellers and dive O-rings. */
const loadAll = () => Promise.allSettled([loadEquip(), loadBnf(), loadDive()]);

function ensureFor(v) {
  if (vertReady(v)) return;
  const p = loadFor(v);
  if (vertReady(v)) return;              // bundle: available synchronously
  render();                              // shows the loading state
  p.then(render, () => { render(); toast(`Could not load the ${VERT_BY_ID[v].name.toLowerCase()} catalogue`); });
}

/* ---------- Render: vertical picker + hero copy ---------- */
const BIKE_COPY = { lede: $("#lede").innerHTML, step1: $("#step1Label").innerHTML, step2: $("#step2Label").innerHTML };
const BNF_COPY = {
  belts: {
    lede: "Belts from BNF PLUS stock, by section and length. Pick the type and the size, or type the number printed on the old belt: 8PK1440, 6PK 1230, A68, B87.",
    step1: "Step 1 — pick the belt type", step2: "Step 2 — pick the size",
  },
  impellers: {
    lede: "Flexible impellers from BNF PLUS stock. Type the impeller number or the engine maker's number from the old part, such as 125613-42762 or 3897337. Where that number matches an engine part we list, the engine is shown.",
    step1: "Step 1 — pick the engine make (matched impellers)", step2: "Step 2 — pick the engine",
  },
  diving: {
    lede: "FKM (Viton) O-rings in standard scuba sizes, from BNF PLUS stock. Pick where the O-ring goes, or type the size: AS568-014, 014, 12.42x1.78.",
    step1: "Pick where the O-ring goes", step2: "",
  },
};
/* Shown on the Diving section, above the O-rings. */
const DIVE_SAFETY = "Regulators, first and second stages, BCD inflators and other life-support parts must be serviced by a certified technician. " +
  "This list is only FKM O-rings for seals you can replace yourself: tank neck, valve face, port plugs, hose and inflator ends. " +
  "If you need a service kit or you are not sure of the size, ask us.";

function renderVerticals() {
  $("#vertChips").innerHTML = VERTICALS_UI.map(v =>
    `<button class="chip vchip" data-vertical="${v.id}" aria-pressed="${state.vertical === v.id}">${esc(v.name)}</button>`
  ).join("");
}

function renderHero() {
  const v = VERT_BY_ID[state.vertical];
  const safety = $("#diveNote");
  safety.hidden = !isDiveV(state.vertical);
  if (!safety.hidden && !safety.textContent) safety.innerHTML = `<b>Safety</b> ${esc(DIVE_SAFETY)}`;
  if (state.vertical === "bikes") {
    if ($("#lede").innerHTML !== BIKE_COPY.lede) $("#lede").innerHTML = BIKE_COPY.lede;
    if ($("#step1Label").innerHTML !== BIKE_COPY.step1) $("#step1Label").innerHTML = BIKE_COPY.step1;
    if ($("#step2Label").innerHTML !== BIKE_COPY.step2) $("#step2Label").innerHTML = BIKE_COPY.step2;
    return;
  }
  const copy = BNF_COPY[state.vertical];
  if (copy) {
    $("#lede").textContent = copy.lede + " " + (onlineCheckoutOn() ? "We confirm every price before you pay." : "Every price is confirmed on WhatsApp.");
    $("#step1Label").textContent = copy.step1;
    $("#step2Label").textContent = copy.step2;
    return;
  }
  if ($("#step1Label").innerHTML !== BIKE_COPY.step1) $("#step1Label").innerHTML = BIKE_COPY.step1;
  $("#lede").textContent =
    `One wrong digit means the wrong part on the next boat. Pick the make and the ${v.pick}, ` +
    `and we will show you the exact number from the maker's catalogue ` +
    `and what to check before you order. ` +
    (onlineCheckoutOn() ? `We confirm every price before you pay.` : `Every price is confirmed on WhatsApp.`);
  $("#step2Label").textContent = `Step 2 — pick the ${v.pick}`;
}

/* Step 2 entries for a vertical: engines / machines, belt groups, or the
   engines BNF impellers cross-reference to. */
function pickerModels(v) {
  if (!isBnfV(v)) return EQ.models.filter(m => m.vertical === v);
  const ids = new Set(BN.parts.filter(p => p.vertical === v).flatMap(partModels));
  return [...ids].map(id => MODEL_BY_ID[id]).filter(Boolean);
}

function renderEqPickers() {
  const wrap = $("#modelRow");
  const st = store(state.vertical), bnf = isBnfV(state.vertical);
  if (!st.loaded) {
    $("#brandChips").innerHTML = st.failed
      ? `<span class="loading">Could not load this catalogue. <button class="clearbtn" data-vertical="${state.vertical}">Try again</button></span>`
      : `<span class="loading" role="status">Loading the ${esc(VERT_BY_ID[state.vertical].name.toLowerCase())} catalogue…</span>`;
    wrap.hidden = true; $("#modelChips").innerHTML = "";
    return;
  }
  /* Diving: the use groups are the only pick, straight away. */
  if (isDiveV(state.vertical)) {
    const n = (id) => DV.parts.filter(p => p.grp === id).length;
    $("#brandChips").innerHTML = DV.groups.map(g =>
      `<button class="chip" data-model="${esc(g.id)}" aria-pressed="${state.model === g.id}">${esc(g.name)}<span class="cc">${n(g.id)} O-ring${n(g.id) === 1 ? "" : "s"}</span></button>`
    ).join("");
    wrap.hidden = true; $("#modelChips").innerHTML = "";
    return;
  }
  const models = pickerModels(state.vertical).sort(byEngineSize);
  /* belt types keep their own order (ribbed first); makes go A–Z */
  const brands = [...new Set(models.map(m => m.brand))];
  if (!bnf || state.vertical === "impellers") brands.sort();
  $("#brandChips").innerHTML = brands.map(b =>
    `<button class="chip" data-brand="${esc(b)}" aria-pressed="${state.brand === b}">${esc(b)}</button>`
  ).join("");

  const list = state.brand ? models.filter(m => m.brand === state.brand) : [];
  if (!list.length) { wrap.hidden = true; $("#modelChips").innerHTML = ""; return; }
  wrap.hidden = false;
  const count = {};
  st.parts.forEach(p => { if (p.vertical === state.vertical) partModels(p).forEach(id => { count[id] = (count[id] || 0) + 1; }); });
  const noun = (n) => bnf ? (n === 1 ? VERT_BY_ID[state.vertical].unit : VERT_BY_ID[state.vertical].unit + "s") : "parts";
  $("#modelChips").innerHTML = list
    .sort(byEngineSize)
    .map(m => `<button class="chip" data-model="${esc(m.id)}" aria-pressed="${state.model === m.id}">${esc(m.name)}<span class="cc">${count[m.id] || 0} ${noun(count[m.id] || 0)}</span></button>`)
    .join("");
}

/* Step 2 engines: smallest first (hp, litres, kVA or cc from m.size), then
   family (2-stroke, 4-stroke, SeaPro / Enduro / Verado, electric), then name.
   Models without a numeric size (pumps, machinery) sort by name after them. */
function byEngineSize(a, b) {
  const n = (m) => typeof m.size === "number" ? m.size : Infinity;
  return (n(a) - n(b)) || ((a.fam || 0) - (b.fam || 0)) || a.name.localeCompare(b.name, "en", { numeric: true });
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
    CATS.concat(EQ.cats, BN.cats, DV.cats).filter(c => counts[c.id]).map(c =>
      `<button class="catbtn" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">
         <span>${esc(c.name)}</span><span class="k">${counts[c.id]}</span></button>`
    ).join("");
}

/* ---------- Render: part cards ---------- */
function stockLine(p) {
  if (p.stock == null)   return "";
  if (p.stock <= 0)      return `<span class="stockline"><span class="dotr">●</span> ${p.orderIn ? "Order in" : "On order"}</span>`;
  if (p.lowStock)       return `<span class="stockline"><span class="doty">●</span> Low stock</span>`;
  return `<span class="stockline"><span class="dotg">●</span> In stock</span>`;
}

/* Notes that say the fit depends on a serial, frame, hull or engine code. */
const SERIAL_HINT = /serial|frame no|engine code|variant|\bhull\b|type range|verify engine/i;
const needsSerial = (p) => SERIAL_HINT.test(p.note || "");
const unverified = (p) => p.tier === "genuine-unverified";
const eqModelName = (m) => `${m.brand} ${m.name}`;

function eqPlateHTML(oem) {
  return `<span class="plate plain eq"><span class="seg g"><span class="val">${esc(oem)}</span><span class="lab">part no</span></span></span>`;
}

function eqFlagsHTML(p) {
  return (unverified(p) ? `<span class="unver">Number to be confirmed — verify</span>` : "") +
    (needsSerial(p) ? `<span class="serialnote">Check frame/serial number</span>` : "");
}

/* ---------- BNF PLUS stock references ----------
   BNF PLUS prices are not public, so only the SKU, brand, their number and
   availability are shown; the part itself stays "Ask for price". */
const AVAIL = { stock: "in stock", low: "in stock", indent: "order in" };
const availLabel = (a) => AVAIL[a] || "";
const partAvail = (p) => p.stock == null ? "" : p.stock > 0 ? "in stock" : p.orderIn ? "order in" : "on order";

function bnfSummary(b) {
  if (b.sku) return `${esc(b.sku)} · ${esc(b.brand)} ${esc(b.pn)}${b.avail ? " · " + esc(availLabel(b.avail)) : ""}`;
  const ms = b.matches || [];
  const brands = [...new Set(ms.map(m => m.brand))];
  const inStock = ms.filter(m => m.avail === "stock" || m.avail === "low").length;
  return `${b.designation ? esc(b.designation) + " · " : ""}${ms.length} match${ms.length === 1 ? "" : "es"} · ${esc(brands.slice(0, 3).join(", "))}${brands.length > 3 ? ` +${brands.length - 3}` : ""}` +
    (inStock ? ` · ${inStock} in stock` : "");
}

/* An impeller SKU linking to its card on the Impellers page (same site). */
function impRef(sku) {
  const i = PART_BY_ID[sku.toLowerCase()];
  return `<a class="implink" href="?v=impellers&amp;q=${encodeURIComponent(sku)}" data-imp="${esc(sku)}">${esc(sku)}</a>` +
    (i ? ` · ${esc(partAvail(i))}` : "");
}

function refsHTML(p) {
  const lines = [];
  if (p.bnf) lines.push(`<div class="bnfline"><b>BNF PLUS stock</b> ${bnfSummary(p.bnf)}</div>`);
  if (p.bnfImp) lines.push(`<div class="bnfline"><b>BNF PLUS stock</b> Impeller ${p.bnfImp.map(impRef).join(", ")}</div>`);
  return lines.length ? `<div class="refs">${lines.join("")}</div>` : "";
}

function refsDetailHTML(p) {
  if (!p.bnf && !p.bnfImp) return "";
  const ms = p.bnf ? (p.bnf.matches || []) : [];
  const rows = ms.slice(0, 8).map(m =>
    `<div class="altrow"><span>${esc(m.sku)} · ${esc(m.brand)} ${esc(m.pn)}</span><span class="tag">${esc(availLabel(m.avail))}</span></div>`).join("");
  const imps = (p.bnfImp || []).map(sku => {
    const i = PART_BY_ID[sku.toLowerCase()];
    return `<div class="altrow"><span>${impRef(sku).replace(/ · [^<]*$/, "")}${i ? ` · ${esc(i.brand)} ${esc(i.oem)}` : ""}</span><span class="tag">${i ? esc(partAvail(i)) : ""}</span></div>`;
  }).join("");
  return `<div class="dsec"><h4>BNF PLUS stock</h4>
    ${p.bnf ? `<p class="hint"><b>${p.bnf.sku ? "Same number:" : `For ${esc(p.bnf.designation || "")}:`}</b> ${p.bnf.sku ? bnfSummary(p.bnf) : `${ms.length} matching item${ms.length === 1 ? "" : "s"}`}</p>
      ${p.bnf.sku ? "" : `<div class="altlist">${rows}</div>${ms.length > 8 ? `<p class="hint">+${ms.length - 8} more matching items</p>` : ""}`}` : ""}
    ${imps ? `<p class="hint"><b>Impellers that cross-reference this number:</b></p><div class="altlist">${imps}</div>` : ""}
    <p class="hint">BNF PLUS prices are not public. ${askPriceHint()}.</p>
  </div>`;
}

/* Belts and impellers: brand instead of "genuine", the size, the stock number. */
function bnfCardHTML(p) {
  const v = VERT_BY_ID[p.vertical], g = p.grp && MODEL_BY_ID[p.grp];
  const fitNames = p.fits.slice(0, 4).map(id => {
    const m = MODEL_BY_ID[id];
    return m ? `<span class="fitchip${state.model === id ? " on" : ""}">${esc(eqModelName(m))}</span>` : "";
  }).join("") + (p.fits.length > 4 ? `<span class="fitchip">+${p.fits.length - 4} more</span>` : "");
  return `<article class="card eqcard bnfcard" data-vert="${esc(p.vertical)}">
    ${artHTML(p)}
    <div class="eqtag">${esc(v ? v.name : "")} · ${esc(g ? g.name : CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "")}</div>
    <div class="cardtop">
      <h3 class="cardname">${esc(p.name)}</h3>
      <span class="tier brand">${esc(p.brand)}</span>
    </div>
    ${eqPlateHTML(p.oem)}
    ${p.size ? `<div class="sizeline">${esc(p.size)}</div>` : ""}
    ${p.use ? `<div class="useline">${esc(p.use)}</div>` : ""}
    ${fitNames ? `<div class="ribbon">${fitNames}</div>` : ""}
    <div class="refs"><div class="bnfline"><b>BNF PLUS stock</b> ${esc(p.sku)}</div></div>
    <button class="moreb" data-detail="${esc(p.id)}">${p.vertical === "impellers" ? "Cross-reference &amp; fitment →" : "Size &amp; details →"}</button>
    <div class="cardfoot">
      <div>
        ${priceHTML(p)}
        ${stockLine(p)}
      </div>
      <button class="addbtn" data-add="${esc(p.id)}">Add</button>
    </div>
  </article>`;
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
    <div class="ribbon">${fitNames}</div>
    ${refsHTML(p)}
    <button class="moreb" data-detail="${esc(p.id)}">Fitment &amp; notes →</button>
    <div class="cardfoot">
      <div>
        ${priceHTML(p)}
        ${stockLine(p)}
      </div>
      <button class="addbtn" data-add="${esc(p.id)}">Add</button>
    </div>
  </article>`;
}

function cardHTML(p) {
  if (isBnf(p)) return bnfCardHTML(p);
  if (isEq(p)) return eqCardHTML(p);
  const fitNames = p.universal
    ? `<span class="fitchip uni">Fits any bike</span>`
    : p.fits.slice(0, 5).map(id => {
        const m = MODEL_BY_ID[id];
        if (!m) return "";
        return `<span class="fitchip${state.model === id ? " on" : ""}">${esc(m.name)}</span>`;
      }).join("") + (p.fits.length > 5 ? `<span class="fitchip">+${p.fits.length - 5} more</span>` : "");

  return `<article class="card">
    ${artHTML(p)}
    <div class="cardtop">
      <h3 class="cardname">${esc(p.name)}</h3>
      <span class="tier ${p.tier}">${p.tier === "oem-alt" ? "OEM alt" : p.tier}</span>
    </div>
    ${plateHTML(p.oem)}
    ${decodeHTML(p.oem)}
    ${needsCheck(p) ? `<span class="unver">Verify number before ordering</span>` : ""}
    <div class="ribbon">${fitNames}</div>
    ${refsHTML(p)}
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
  /* Engines carry hp / litres in the name; size there is only a sort key. */
  if (typeof m.size === "string") bits.push(`<span><b>Size</b> ${esc(m.size)}</span>`);
  if (m.catalogue) bits.push(`<span><b>Catalogue</b> ${esc(m.catalogue)}</span>`);
  const note = m.note ? `<div class="mnote-note">${SERIAL_HINT.test(m.note) || /unverified|nearest/i.test(m.note) ? `<span class="serialnote">Check frame/serial number</span> ` : ""}${esc(m.note)}</div>` : "";
  /* Plain text only: no catalogue, product-page or source links. */
  box.innerHTML = `${bits.length ? `<div class="mnote-bits">${bits.join("")}</div>` : ""}${note}`;
  box.hidden = !box.innerHTML;
}

function renderResults() {
  if (!vertReady(state.vertical)) {
    const failed = store(state.vertical).failed;
    $("#rTitle").textContent = VERT_BY_ID[state.vertical].name;
    $("#rCount").textContent = "";
    $("#clearBtn").hidden = true;
    $("#rNote").hidden = true;
    $("#catWrap").innerHTML = "";
    $("#grid").innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>${failed ? "Could not load this catalogue" : "Loading the catalogue…"}</h3>
      <p>${failed ? "Check your connection and pick the category again." : isDiveV(state.vertical) ? "FKM O-rings in standard scuba sizes." : isBnfV(state.vertical) ? "Every belt and impeller in BNF PLUS stock." : "Part numbers for every engine and machine we cover."}</p></div>`;
    return;
  }
  const r = results();
  const m = state.model ? MODEL_BY_ID[state.model] : null;
  const vu = VERT_BY_ID[state.vertical], bnfV = isBnfV(state.vertical);
  let title = "All parts";
  if (state.vertical !== "bikes") title = vu.dive ? "FKM O-rings for diving" : bnfV ? `All ${vu.name.toLowerCase()}` : `${vu.name} · all parts`;
  if (m) title = m.title || (bnfV ? `${m.brand} ${m.name} · ${vu.name.toLowerCase()}` : `${m.brand} ${m.name}`);
  else if (state.brand) title = state.vertical === "bikes" ? state.brand : `${state.brand} ${VERT_BY_ID[state.vertical].name.toLowerCase()}`;
  if (state.cat && CAT_BY_ID[state.cat]) title += ` · ${CAT_BY_ID[state.cat].name}`;
  if (state.q.trim()) title = `“${state.q.trim()}”`;

  $("#rTitle").textContent = title;
  const unit = bnfV && !state.q.trim() ? vu.unit : "part";
  $("#rCount").textContent = `${r.length} ${r.length === 1 ? unit : unit + "s"}`;
  $("#clearBtn").hidden = !(state.brand || state.model || state.cat || state.q.trim());
  renderModelNote();

  if (!r.length && m && state.vertical !== "bikes" && !bnfV && !state.q.trim() && !EQ.parts.some(p => p.fits.includes(m.id))) {
    $("#grid").innerHTML = emptyModelHTML(m);
    return;
  }
  if (!r.length) {
    $("#grid").innerHTML = `<div class="empty" style="grid-column:1/-1">
      <h3>Nothing matches that yet</h3>
      <p>Try the part number without dashes, the model, or what the part does — “belt”, “brake pad”, “battery”.</p>
      <button class="clearbtn" data-clear="1">Reset the search</button>
    </div>`;
    return;
  }
  $("#grid").innerHTML = r.map(cardHTML).join("");
}

/* An engine we sell for but have no confirmed parts list for: no invented
   numbers, just ask for a price with the serial. */
function emptyModelHTML(m) {
  const txt = `Hi, I need parts for a ${eqModelName(m)}. Engine serial number: `;
  return `<div class="empty emptymodel" style="grid-column:1/-1">
      <h3>Ask for a price</h3>
      <p>We have no confirmed part numbers for the ${esc(eqModelName(m))} on the site yet. Send us the engine serial number and the part you need, and we will find the right part and price it.</p>
      <a class="clearbtn" id="askEngine" href="${esc(waURL(txt))}" target="_blank" rel="noopener">Send the engine serial on WhatsApp</a>
    </div>`;
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
    ${p.note ? `<div class="dsec"><h4>Catalogue note</h4><div class="notebox">${esc(p.note)}</div></div>` : ""}
    ${refsDetailHTML(p)}
    <div class="dsec">
      <h4>Price</h4>
      ${priceHTML(p)}
      <p class="hint">${[askPriceHint(), esc(v ? v.name : ""), esc(CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "")].filter(Boolean).join(" · ")}</p>
    </div>
    <button class="gobtn" data-add="${esc(p.id)}">Add to order</button>`;

  $("#detailTitle").textContent = p.name;
  openDrawer("#detail");
}

/* ---------- Detail drawer: belt or impeller ---------- */
function openBnfDetail(p) {
  const v = VERT_BY_ID[p.vertical], g = p.grp && MODEL_BY_ID[p.grp];
  const row = (k, val) => val ? `<div class="altrow"><span>${esc(val)}</span><span class="tag">${esc(k)}</span></div>` : "";
  const facts = [
    row("size", p.size),
    row("use", p.use),
    row("material", p.material),
    row("type", g ? g.title || g.name : CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : ""),
    row("brand", p.brand),
    row("BNF PLUS stock no.", p.sku + (p.alt_sku ? " / " + p.alt_sku : "")),
  ].join("");
  let fitSec = "";
  if (p.vertical === "impellers") {
    const fitModels = p.fits.map(id => MODEL_BY_ID[id]).filter(Boolean);
    const xs = (p.xparts || []).map(id => BNF.xparts[id]).filter(Boolean);
    fitSec = `<div class="dsec"><h4>Fits these engines</h4>${fitModels.length
      ? `<div class="fitfull">${fitModels.map(m => `<span class="m"><b>${esc(eqModelName(m))}</b>${m.model_number ? " · " + esc(m.model_number) : ""}</span>`).join("")}</div>
         <div class="altlist">${xs.map(x => `<div class="altrow"><span>${esc(x.oem)} · ${esc(x.name)}</span><span class="tag">engine part, same number</span></div>`).join("")}</div>
         <p class="hint">This impeller's cross-reference list includes the engine part's number. Compare the size with the old impeller before you order.</p>`
      : `<p class="hint" style="margin:0">No engine we list carries one of these numbers yet. Send us the number on the old impeller, or the engine model and serial, and we will check the fit.</p>`}</div>`;
  }
  const altBlock = (p.alts && p.alts.length)
    ? `<div class="altlist">${p.alts.map(a => `<div class="altrow"><span>${esc(a)}</span><span class="tag">cross-reference</span></div>`).join("")}</div>`
    : `<p style="margin:0;font-size:13px;color:var(--ink-3)">No other numbers recorded.</p>`;
  $("#detailBody").innerHTML = `
    <div class="dsec">
      <h4>Part number</h4>
      ${eqPlateHTML(p.oem)}
      <p class="hint" style="margin-top:6px">As printed on the BNF PLUS stock list.</p>
    </div>
    <div class="dsec"><h4>Size &amp; type</h4><div class="altlist">${facts}</div></div>
    ${isDiveV(p.vertical) ? `<div class="dsec"><p class="hint" style="margin:0">${esc(DIVE_SAFETY)}</p></div>` : ""}
    ${fitSec}
    <div class="dsec"><h4>${p.vertical === "impellers" ? "Cross-reference numbers" : "Also sold as"}</h4>${altBlock}</div>
    <div class="dsec">
      <h4>Price</h4>
      ${priceHTML(p)}
      <p class="hint">${[stockLine(p).replace(/<[^>]+>/g, "").replace("●", "").trim(), askPriceHint(), esc(v ? v.name : "")].filter(Boolean).join(" · ")}</p>
    </div>
    <button class="gobtn" data-add="${esc(p.id)}">Add to order</button>`;
  $("#detailTitle").textContent = `${p.name}`;
  openDrawer("#detail");
}

/* ---------- Detail drawer: the full interchange view ---------- */
function openDetail(id) {
  const p = PART_BY_ID[id];
  if (!p) return;
  if (isBnf(p)) return openBnfDetail(p);
  if (isEq(p)) return openEqDetail(p);
  const pn = parsePN(p.oem);
  const others = sameJob(p);

  const fitBlock = p.universal
    ? `<p style="margin:0;font-size:13.5px;color:var(--ink-2)">Universal — fits any motorcycle or scooter.</p>`
    : `<div class="fitfull">${p.fits.map(id2 => {
        const m = MODEL_BY_ID[id2];
        return m ? `<span class="m"><b>${esc(m.name)}</b> · ${m.cc}cc · ${esc(m.years)}</span>` : "";
      }).join("")}</div>`;

  const altBlock = (p.alts && p.alts.length)
    ? `<div class="altlist">${p.alts.map(a => {
        const oemish = /^[0-9A-Z]{3,5}-/.test(a);
        return `<div class="altrow"><span>${esc(a)}</span><span class="tag">${oemish ? "supersession / OEM" : "aftermarket equivalent"}</span></div>`;
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
    ${p.note ? `<div class="dsec"><h4>Note</h4><div class="notebox">${esc(p.note)}</div></div>` : ""}
    ${refsDetailHTML(p)}

    <div class="dsec">
      <h4>Price</h4>
      ${priceHTML(p)}
      <p class="hint">${[stockLine(p).replace(/<[^>]+>/g, "").trim(), !hasPrice(p) ? askPriceHint() : "", esc(CAT_BY_ID[p.cat].name)].filter(Boolean).join(" · ")}</p>
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
  if (part && state.model && (part.universal || part.fits.includes(state.model))) state.ctx[id] = state.model;
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

/* Unpriced parts: online orders are quoted after checkout; the WhatsApp fallback confirms in the chat. */
function askPriceHint() {
  return onlineCheckoutOn() ? "We'll confirm the price and send you a quote when you order" : "We'll confirm the price on WhatsApp";
}

function zoneFee() {
  const z = ZONES.find(z => z.id === $("#zone").value);
  return z ? z.fee : 0;
}

function renderCart() {
  const lines = cartLines();
  const body = $("#cartBody");
  const online = onlineCheckoutOn();
  $("#waFoot").hidden = online;
  $("#coFoot").hidden = !online;

  if (!lines.length) {
    body.innerHTML = `<div class="empty">
      <h3>No parts yet</h3>
      <p>Pick your bike or engine, then add the parts you need. Free delivery to Malé, Hulhumalé and boats (harbour drop-off).</p>
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
        ${isBnf(p) ? `<div class="pn">BNF PLUS stock ${esc(p.sku)}</div>` : ""}
        ${isEq(p) && machineLabel(p) ? `<div class="pn">For ${esc(machineLabel(p))}</div>` : ""}
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
  $("#tDel").textContent = del ? money(del) : "Free";
  $("#tGst").textContent = money(gst);
  $("#tAll").textContent = askQty
    ? "MVR " + money(total) + " + prices to confirm"
    : "MVR " + money(total);
  $("#goBtn").disabled = !$("#custName").value.trim() || !$("#custPhone").value.trim();
  if (online) { $("#coCartTotals").innerHTML = estimateHTML(); renderCheckout(); }
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
        ? `${q} × ${p.name}\n   ${p.oem} — price to confirm` + (isBnf(p) ? `\n   BNF PLUS stock ${p.sku}` : "") +
          (machineLabel(p) ? `\n   For: ${machineLabel(p)}` : "")
        : `${q} × ${p.name}\n   ${p.oem} — price to confirm`),
    "",
    pricedLines.length ? `Subtotal: MVR ${money(sub)}` : "Subtotal: —",
    askQty ? `Price to confirm: ${askQty} item${askQty === 1 ? "" : "s"}` : "",
    `Delivery (${z.name}): ${del ? "MVR " + money(del) : "Free"}`,
    `GST 8%: MVR ${money(gst)}`,
    askQty
      ? `*Total: MVR ${money(total)} + prices to confirm*`
      : `*Total: MVR ${money(total)}*`,
    "",
    `Name: ${$("#custName").value.trim()}`,
    `Phone: ${$("#custPhone").value.trim()}`,
    `Address: ${$("#custIsland").value.trim() || "—"}`,
    $("#custNote").value.trim() ? `Note: ${$("#custNote").value.trim()}` : "",
  ].filter(Boolean).join("\n");
}

const waURL = (txt) => `https://wa.me/960${SHOP.whatsapp}?text=${encodeURIComponent(txt)}`;

function sendOrder() {
  const txt = orderText();
  window.open(waURL(txt), "_blank", "noopener");
  navigator.clipboard?.writeText(txt).catch(() => {});
  toast("Order opened in WhatsApp — also copied");
}

/* ---------- Online checkout (behind a flag; WhatsApp ordering otherwise) ---------- */
function onlineCheckoutOn() {
  return SHOP.onlineCheckout === true || BOOT_PARAMS.get("checkout") === "online";
}

/* ?api=<url> points the form at a local Worker while testing; only http(s) is accepted. */
function ordersApiBase() {
  const raw = BOOT_PARAMS.get("api");
  if (raw && /^https?:\/\//i.test(raw)) {
    try { return new URL(raw).href.replace(/\/+$/, ""); } catch {}
  }
  return String(SHOP.ordersApi || "").replace(/\/+$/, "");
}

const TURNSTILE_SITEKEY = "0x4AAAAAAGNINAID53bzGUrq";
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
/* Online orders deliver only here, free of charge. value = the canonical name the Worker stores. */
const DESTINATIONS = [
  { value: "Malé", label: "Malé", address: "Address", placeholder: "House or shop name, road" },
  { value: "Hulhumalé", label: "Hulhumalé", address: "Address", placeholder: "House or shop name, road" },
  { value: "Boats", label: "Boats (harbour drop-off)", address: "Vessel and harbour", placeholder: "Vessel name and harbour" },
];
const destinationOf = (v) => DESTINATIONS.find(d => d.value === v);
const co = { key: null, sig: null, token: null, widget: null, tsLoading: null, busy: false };

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/* Priced lines only; delivery is free to every destination we offer. */
function estimateHTML() {
  const lines = cartLines();
  const sub = lines.filter(({ p }) => hasPrice(p)).reduce((a, { p, q }) => a + p.price * q, 0);
  const askQty = lines.filter(({ p }) => !hasPrice(p)).reduce((a, { q }) => a + q, 0);
  const gst = Math.round(sub * SHOP.gstRate);
  return `
    <div><span>Subtotal</span><span>${sub ? "MVR " + money(sub) : "—"}</span></div>
    ${askQty ? `<div class="pending"><span>Ask for price</span><span>${askQty} item${askQty === 1 ? "" : "s"}</span></div>` : ""}
    <div><span>GST 8%</span><span>${money(gst)}</span></div>
    <div><span>Shipping</span><span>Free</span></div>
    <div class="grand"><span>Estimate</span><span>MVR ${money(sub + gst)}${askQty ? " + quote" : ""}</span></div>
    <p class="hint">Estimate only. Final totals are confirmed by our server and your quote.</p>`;
}

/* The machine a line was added for, when we know it. */
function forMachine(id) {
  const m = MODEL_BY_ID[state.ctx[id]];
  return m ? eqModelName(m) + (m.model_number ? ` (${m.model_number})` : "") : undefined;
}

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!co.tsLoading) {
    co.tsLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = TURNSTILE_SRC; s.async = true; s.defer = true;
      s.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing"));
      s.onerror = () => { co.tsLoading = null; s.remove(); reject(new Error("turnstile failed")); };
      document.head.appendChild(s);
    });
  }
  return co.tsLoading;
}

function mountTurnstile() {
  if (co.widget != null) return;
  loadTurnstile().then(ts => {
    if (co.widget != null) return;
    co.widget = ts.render($("#coTurnstile"), {
      sitekey: TURNSTILE_SITEKEY,
      callback: (t) => { co.token = t; },
      "expired-callback": () => { co.token = null; },
      "error-callback": () => { co.token = null; },
    });
  }, () => showCoError("The security check could not load. Check your connection and reopen checkout."));
}

function resetTurnstile() {
  co.token = null;
  if (window.turnstile && co.widget != null) window.turnstile.reset(co.widget);
}

function openCheckout() {
  if (!cartLines().length) return;
  $("#coForm").hidden = false;
  $("#coDone").hidden = true;
  $("#coTitle").textContent = "Checkout";
  renderCheckout();
  $("#cart").classList.remove("on");
  openDrawer("#checkout");
  mountTurnstile();
}

function renderCheckout() {
  const ask = cartLines().some(({ p }) => !hasPrice(p));
  $("#coAskNote").hidden = !ask;
  $("#coTotals").innerHTML = estimateHTML();
  if (!co.busy) $("#coSubmit").textContent = ask ? "Send quote request" : "Place order";
}

function showCoError(msg) {
  $("#coError").textContent = msg;
  $("#coError").hidden = !msg;
}

function setFieldErrors(errs) {
  $$("#coForm .ferr").forEach(el => {
    const msg = errs[el.dataset.err] || "";
    el.textContent = msg;
    const input = el.parentElement.querySelector("input,select,textarea");
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  });
}

function readCustomer() {
  const v = (id) => $("#" + id).value.trim();
  return {
    name: v("coName"), phone: v("coPhone").replace(/[\s-]/g, ""), email: v("coEmail"),
    destination: v("coDestination"), address: v("coAddress"), notes: v("coNotes"),
  };
}

function validateCustomer(c) {
  const e = {};
  if (!c.name) e.name = "Enter your name.";
  if (!c.phone) e.phone = "Enter your phone number.";
  else if (!/^(\+?960)?\d{7}$/.test(c.phone)) e.phone = "Enter a 7-digit Maldives number, e.g. 7712345 or +960 7712345.";
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e.email = "Check the email address.";
  if (!destinationOf(c.destination)) e.destination = "Choose Malé, Hulhumalé or Boats (harbour drop-off).";
  if (!c.address) e.address = c.destination === "Boats" ? "Enter the vessel name and harbour." : "Enter your address.";
  return e;
}

async function submitCheckout(ev) {
  ev.preventDefault();
  if (co.busy) return;
  showCoError("");
  const customer = readCustomer();
  const errs = validateCustomer(customer);
  setFieldErrors(errs);
  if (Object.keys(errs).length) {
    $("#coForm [aria-invalid='true']").focus();
    return;
  }
  const lines = Object.entries(state.cart).map(([id, qty]) => {
    const l = { id, qty };
    const fm = forMachine(id);
    if (fm) l.forMachine = fm;
    return l;
  });
  if (!lines.length) { showCoError("Your order is empty."); return; }
  if (!co.token) { showCoError("Please wait for the security check to finish, then try again."); return; }

  /* Older Workers read atoll/island; send the same canonical destination there too. */
  customer.atoll = customer.island = customer.destination;
  /* One key per attempt: a retry of the same details reuses it, an edit gets a new one. */
  const sig = JSON.stringify({ customer, lines });
  if (sig !== co.sig) { co.sig = sig; co.key = uuid(); }

  co.busy = true;
  const btn = $("#coSubmit"), label = btn.textContent;
  btn.disabled = true; btn.textContent = "Sending…";
  let res, data = null;
  try {
    res = await fetch(ordersApiBase() + "/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": co.key },
      body: JSON.stringify({ customer, lines, turnstileToken: co.token }),
    });
    data = await res.json().catch(() => null);
  } catch {
    res = null;
  }
  co.busy = false;
  btn.disabled = false; btn.textContent = label;

  if (res && (res.status === 200 || res.status === 201) && data && data.orderNo) {
    showConfirmation(data);
    return;
  }
  if (!res) showCoError("We could not reach the order server. Check your connection and try again.");
  else {
    if (data && data.fields && typeof data.fields === "object") {
      const f = {};
      for (const [k, msg] of Object.entries(data.fields)) {
        const key = k.replace(/^customer\./, "");
        f[key === "atoll" || key === "island" ? "destination" : key] = String(msg);
      }
      setFieldErrors(f);
    }
    showCoError((data && data.message) ? String(data.message) : `Something went wrong (error ${res.status}). Please try again.`);
  }
  resetTurnstile();
}

function showConfirmation(d) {
  const quote = d.status === "quote_requested";
  const track = /^https?:\/\//i.test(d.trackUrl || "") ? d.trackUrl : "";
  const t = d.totals || {};
  const total = typeof t.total === "number"
    ? `<p class="hint">Total with free delivery: ${esc(t.currency || "MVR")} ${money(t.total)}${t.hasAskLines ? " + items to price" : ""}</p>` : "";
  $("#coDone").innerHTML = `
    <div class="codone">
      <div class="colab">${quote ? "Quote request received" : "Order received"}</div>
      <div class="cono">${esc(d.orderNo)}</div>
      <p>${quote
        ? "We'll price the items marked Ask for price and send you a quote. Delivery is free."
        : "Your order is awaiting payment by bank transfer. Delivery is free. Bank transfer details to follow."}</p>
      ${total}
      ${track ? `<a class="gobtn cotrack" href="${esc(track)}" target="_blank" rel="noopener">Track your order</a>` : ""}
      <p class="hint">Keep your order number. Pay by bank transfer only; cash on delivery is not available.</p>
    </div>`;
  $("#coForm").hidden = true;
  $("#coDone").hidden = false;
  $("#coTitle").textContent = quote ? "Quote requested" : "Thank you";
  $("#coNotes").value = "";
  setFieldErrors({});
  co.key = co.sig = null;
  if (window.turnstile && co.widget != null) window.turnstile.remove(co.widget);
  co.widget = null; co.token = null;
  state.cart = {}; saveCart(); renderCart();
}

/* ---------- Drawers, toast ---------- */
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

/* ---------- Zones in footer + select ---------- */
function renderZones() {
  const fee = z => z.fee ? `MVR ${z.fee}` : "Free";
  $("#zone").innerHTML = ZONES.map(z =>
    `<option value="${z.id}">${esc(z.name)} — ${fee(z)}</option>`).join("");
  $("#zoneList").innerHTML = onlineCheckoutOn()
    ? DESTINATIONS.map(d => `<li class="zline"><span>${esc(d.label)}</span><span>Free</span></li>`).join("")
    : ZONES.map(z => `<li class="zline"><span>${esc(z.name)}</span><span>${fee(z)}</span></li>`).join("");
}

/* ---------- Wire up ---------- */
function render() {
  renderVerticals(); renderHero(); renderPickers();
  if (!vertReady(state.vertical)) { renderResults(); syncURL(); return; }
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
  for (const k of ["checkout", "api"]) if (BOOT_PARAMS.has(k)) ps.set(k, BOOT_PARAMS.get(k));
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
      /* ?v=impellers&m=<engine> lists the impellers for that engine, not the engine page */
      if (!isBnfV(state.vertical)) state.vertical = model.vertical || "bikes";
      /* Diving picks a group directly; there is no make to show. */
      state.brand = isDiveV(state.vertical) ? null : model.brand; state.model = m;
    } else if (b) state.brand = b;
    render();
  };
  if (v && VERT_BY_ID[v]) state.vertical = v;
  const wide = (q && q.trim().length >= 2) || (m && !MODEL_BY_ID[m] && !isBnfV(state.vertical));
  if (wide) { ensureFor(state.vertical); loadAll().then(apply); }
  else if (state.vertical !== "bikes") { ensureFor(state.vertical); loadFor(state.vertical).then(apply, () => {}); }
  else if (m || b || q) apply();
}

function chooseVertical(v) {
  if (!VERT_BY_ID[v]) return;
  if (v === state.vertical && vertReady(v)) return;
  state.vertical = v;
  state.brand = state.model = state.cat = null;
  if (v !== "bikes") ensureFor(v);
  render();
}

/* A BNF impeller tag on an engine part: open that impeller on the Impellers page. */
function showImpeller(sku) {
  closeDrawers();
  state.vertical = "impellers";
  state.brand = state.model = state.cat = null;
  state.q = sku; $("#q").value = sku;
  ensureFor("impellers");
  render();
  $("#rTitle").scrollIntoView({ block: "start", behavior: "smooth" });
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-imp],[data-vertical],[data-brand],[data-model],[data-cat],[data-add],[data-detail],[data-q],[data-clear],[data-close]");
  if (!t) return;
  if (t.dataset.imp) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;   // new tab: let the link work
    e.preventDefault();
    return showImpeller(t.dataset.imp);
  }

  if (t.dataset.vertical !== undefined) {
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
  } else if (t.dataset.close !== undefined) {
    closeDrawers();
  }
});

/* Phones have no "/" shortcut and less room: keep the search hint short. */
if (matchMedia("(max-width: 640px)").matches) $("#q").placeholder = "Part number, model or what it does…";

/* Typing a query pulls in the equipment catalogue, the belts / impellers and
   the dive O-rings (debounced) so a part number like 6CE-WS24A-00, an engine
   code like KTA19, a belt size like 8PK1440 or an O-ring like AS-014 is found
   from any page. */
let eqSearchT;
$("#q").addEventListener("input", (e) => {
  state.q = e.target.value; renderRail(); renderResults();
  if (!(EQ.loaded && BN.loaded && DV.loaded) && state.q.trim().length >= 2) {
    clearTimeout(eqSearchT);
    eqSearchT = setTimeout(() => loadAll().then(() => { renderRail(); renderResults(); }), 250);
  }
});
$("#cartOpen").addEventListener("click", () => { renderCart(); openDrawer("#cart"); });
$("#scrim").addEventListener("click", closeDrawers);
$("#zone").addEventListener("change", renderCart);
["custName", "custPhone"].forEach(id => $("#" + id).addEventListener("input", renderCart));
$("#goBtn").addEventListener("click", sendOrder);
$("#coOpen").addEventListener("click", openCheckout);
$("#coBack").addEventListener("click", () => { $("#checkout").classList.remove("on"); renderCart(); openDrawer("#cart"); });
$("#coForm").addEventListener("submit", submitCheckout);
$("#coDestination").innerHTML = `<option value="">Choose destination</option>` +
  DESTINATIONS.map(d => `<option value="${esc(d.value)}">${esc(d.label)}</option>`).join("");
function syncAddressField() {
  const d = destinationOf($("#coDestination").value) || DESTINATIONS[0];
  $("#coAddressLabel").textContent = d.address;
  $("#coAddress").placeholder = d.placeholder;
}
$("#coDestination").addEventListener("change", syncAddressField);
syncAddressField();
$("#clearBtn").addEventListener("click", () => {
  state.brand = state.model = state.cat = null; state.q = ""; $("#q").value = ""; render();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawers();
  if (e.key === "/" && document.activeElement !== $("#q")) { e.preventDefault(); $("#q").focus(); }
});

renderZones();
render();
saveCart();
renderCart();
applyDeepLink();
/* An order saved with equipment lines needs the equipment catalogue to show them. */
if (Object.keys(state.cart).some(id => !PART_BY_ID[id])) loadAll().then(renderCart);
