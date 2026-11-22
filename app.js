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
  /* not a machine catalogue: products filtered by type, grade and vehicle (data-lubes.js) */
  { id: "lubes",         name: "Oils & lubricants",      unit: "product", pick: "product" },
];
const VERT_BY_ID = Object.fromEntries(VERTICALS_UI.map(v => [v.id, v]));
const EQ = { loaded: false, loading: null, failed: false, parts: [], models: [], cats: [] };
const isEq = (p) => !!p.vertical;

const state = {
  vertical: "bikes",
  brand: null,
  model: null,
  cat: null,
  q: "",
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
  ].join(" ").toLowerCase();
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
  return [
    p.name, p.oem, squash(p.oem), (p.alts || []).join(" "), (p.alts || []).map(squash).join(" "),
    p.catalogue_name || "",
    p.fits.map(id => MODEL_BY_ID[id] ? eqModelText(MODEL_BY_ID[id]) : "").join(" "),
    CAT_BY_ID[p.cat] ? CAT_BY_ID[p.cat].name : "", v ? v.name : "",
    p.note || "",
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
  E.parts.forEach(p => {
    p.sources = (p.src || []).map(i => E.urls[i]).filter(Boolean);
    p.source_url = p.sources[0] || null;
  });
  E.parts.forEach(p => { p._h = eqHaystack(p); PART_BY_ID[p.id] = p; });
  EQ.parts = E.parts; EQ.models = E.models; EQ.cats = E.cats;
  EQ.loaded = true; EQ.failed = false;
}

function injectScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => { s.remove(); reject(new Error(src + " failed to load")); };
    document.head.appendChild(s);
  });
}

function loadEquip() {
  if (EQ.loaded) return Promise.resolve();
  if (typeof EQUIP !== "undefined") { integrateEquip(); return Promise.resolve(); } // single-file bundle
  if (EQ.loading) return EQ.loading;
  EQ.loading = injectScript("data-equip.js").then(integrateEquip).catch(err => {
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

/* ---------- Oils & lubricants: data-lubes.js, lazy-loaded like data-equip.js ----------
   Entries are products (grade + spec + pack sizes), not part numbers. Three of
   them are the same item as an existing priced part in data.js (entry.avasPart);
   that pack adds the existing part. Every other pack is an ask-for-price line. */
const LB = { loaded: false, loading: null, failed: false, entries: [], byId: {}, typeName: {}, modelOil: {}, forOf: {} };

/* "For" tags are derived here from the entry's type and fitsVerticals, plus the
   tags of the engine oils that fit the same models (so the outboard gearcase oil
   is "Outboard 2-stroke" and "4-stroke" because both kinds of engine are in its
   fits). The data file itself is not changed. */
const FOR_TAGS = [
  ["scooter", "Scooter"], ["moto", "Manual bike"], ["ob2", "Outboard 2-stroke"], ["ob4", "Outboard 4-stroke"],
  ["jetski", "Jet ski"], ["diesel", "Diesel & generators"], ["car", "Car"],
  ["machinery", "Machinery & hydraulics"], ["workshop", "Workshop"],
];
const FOR_NAME = Object.fromEntries(FOR_TAGS);
const TYPE_FOR = {
  "engine-scooter": ["scooter"], "engine-moto": ["moto"], "engine-2t": ["moto", "workshop"],
  "engine-outboard-2t": ["ob2"], "engine-outboard-4t": ["ob4"], "engine-pwc": ["jetski"],
  "engine-diesel": ["diesel"], "engine-car": ["car"], "atf": ["car"], "hydraulic": ["machinery"],
  "brake": ["scooter", "moto", "car"], "chain": ["moto"], "fork": ["scooter", "moto"],
  "grease": ["workshop"], "assembly": ["workshop"], "compressor": ["workshop"],
};
const VERT_FOR = {
  bikes: ["scooter", "moto"], outboards: ["ob2", "ob4"], jetski: ["jetski"],
  marine_diesel: ["diesel"], generators: ["diesel"], machinery: ["machinery"], pumps: ["machinery"],
};
const LF_PARAMS = { type: "t", grade: "g", spec: "s", pack: "pk", for: "for", veh: "veh", e: "e" };
const blankLF = () => ({ type: null, grade: "", spec: "", pack: "", for: null, veh: "", e: "" });
state.lf = blankLF();
state.lpack = {};

const lubeKey = (e, pack) => `lube~${e.id}~${pack}`;
const squashPack = (s) => String(s).toLowerCase().replace(/\s+/g, "");
const modelLabel = (m) => `${m.brand} ${m.name}`;
const vertOf = (id) => MODEL_BY_ID[id] ? (MODEL_BY_ID[id].vertical || "bikes") : null;
const lubeFits = (e, id) => e.fits.includes(id) || e.fitsVerticals.includes(vertOf(id));

/* The pack the existing data.js part is; its name carries the size
   ("Brake fluid DOT 4, 500 ml"). */
function pricedPack(e) {
  const p = e.avasPart && PART_BY_ID[e.avasPart];
  if (!p || typeof e.price !== "number" || p.price !== e.price) return null;
  const name = squashPack(p.name);
  return e.packs.find(k => name.includes(squashPack(k))) || (e.packs.length === 1 ? e.packs[0] : null);
}

function integrateLubes() {
  const L = LUBES;
  LB.typeName = Object.fromEntries(L.types.map(t => [t.id, t.name]));
  LB.entries = L.entries;
  LB.byId = Object.fromEntries(L.entries.map(e => [e.id, e]));
  LB.modelOil = L.modelOil || {};
  const byModel = {};
  L.entries.forEach(e => { if (/^engine-/.test(e.type)) e.fits.forEach(id => {
    byModel[id] = byModel[id] || new Set();
    (TYPE_FOR[e.type] || []).forEach(t => byModel[id].add(t));
  }); });
  L.entries.forEach(e => {
    const s = new Set(TYPE_FOR[e.type] || []);
    e.fitsVerticals.forEach(v => (VERT_FOR[v] || []).forEach(t => s.add(t)));
    e.fits.forEach(id => (byModel[id] || []).forEach(t => s.add(t)));
    LB.forOf[e.id] = FOR_TAGS.map(([k]) => k).filter(k => s.has(k));
    e._pp = pricedPack(e);
    e._h = [e.title, e.grade, e.spec, (e.brands || []).join(" "), (e.apps || []).join(" "),
      LB.typeName[e.type] || "", LB.forOf[e.id].map(k => FOR_NAME[k]).join(" ")].join(" ").toLowerCase();
    /* cart lines for the ask-for-price packs */
    e.packs.forEach(pack => {
      if (pack === e._pp) return;
      const id = lubeKey(e, pack);
      PART_BY_ID[id] = { id, name: `${e.title} — ${pack}`, oem: e.spec || e.grade, price: null, askPrice: true, fits: [], cat: "lubes", lube: e.id };
    });
  });
  LB.loaded = true; LB.failed = false;
}

function loadLubes() {
  if (LB.loaded) return Promise.resolve();
  if (typeof LUBES !== "undefined") { integrateLubes(); return Promise.resolve(); } // single-file bundle
  if (LB.loading) return LB.loading;
  LB.loading = injectScript("data-lubes.js").then(integrateLubes).catch(err => {
    LB.loading = null; LB.failed = true;
    throw err;
  });
  return LB.loading;
}

function ensureLubes() {
  if (LB.loaded) return;
  const p = loadLubes();
  if (LB.loaded) return;
  render();
  p.then(render, () => { render(); toast("Could not load oils & lubricants"); });
}

function lubeMatch(e, skip) {
  const f = state.lf;
  if (f.e && e.id !== f.e) return false;
  if (f.type && skip !== "type" && e.type !== f.type) return false;
  if (f.grade && e.grade !== f.grade) return false;
  if (f.spec && e.spec !== f.spec) return false;
  if (f.pack && !e.packs.includes(f.pack)) return false;
  if (f.for && skip !== "for" && !LB.forOf[e.id].includes(f.for)) return false;
  if (f.veh && !lubeFits(e, f.veh)) return false;
  const terms = qTerms();
  return terms.every(t => e._h.includes(t));
}

const lubePack = (e) => e.packs.includes(state.lpack[e.id]) ? state.lpack[e.id] : (e._pp || e.packs[0]);
const lubeLineId = (e, pack) => pack === e._pp ? e.avasPart : lubeKey(e, pack);
const lubePriceHTML = (e, pack) => priceHTML(pack === e._pp ? PART_BY_ID[e.avasPart] : { price: null, askPrice: true });
const uniqSorted = (xs) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

function renderLubeFilters() {
  const row = $("#lubeRow");
  if (!LB.loaded) {
    row.innerHTML = LB.failed
      ? `<span class="loading">Could not load oils &amp; lubricants. <button class="clearbtn" data-vertical="lubes">Try again</button></span>`
      : `<span class="loading" role="status">Loading oils &amp; lubricants…</span>`;
    return;
  }
  const f = state.lf;
  const count = {};
  LB.entries.forEach(e => { if (lubeMatch(e, "type")) count[e.type] = (count[e.type] || 0) + 1; });
  const types = LUBES.types.filter(t => LB.entries.some(e => e.type === t.id));
  const chips = `<button class="chip" data-lf="type" data-val="" aria-pressed="${!f.type}">All types</button>` +
    types.map(t => `<button class="chip" data-lf="type" data-val="${esc(t.id)}" aria-pressed="${f.type === t.id}">${esc(t.name)}<span class="cc">${count[t.id] || 0}</span></button>`).join("");

  const opts = (vals, cur, all) => `<option value="">${all}</option>` +
    vals.map(v => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(v)}</option>`).join("");
  const sel = (key, id, label, inner) =>
    `<div class="field"><label for="${id}">${label}</label><select id="${id}" data-lsel="${key}">${inner}</select></div>`;

  const group = (label, models) => `<optgroup label="${esc(label)}">` + models.map(m =>
    `<option value="${esc(m.id)}"${m.id === f.veh ? " selected" : ""}>${esc(modelLabel(m))}</option>`).join("") + `</optgroup>`;
  let veh = `<option value="">Any vehicle</option>`;
  BRANDS.forEach(b => {
    const ms = MODELS.filter(m => m.brand === b).sort((x, y) => x.name.localeCompare(y.name, "en", { numeric: true }));
    if (ms.length) veh += group(b, ms);
  });
  if (EQ.loaded) {
    VERTICALS_UI.filter(v => v.id !== "bikes" && v.id !== "lubes").forEach(v => {
      const ms = EQ.models.filter(m => m.vertical === v.id).sort((x, y) => modelLabel(x).localeCompare(modelLabel(y), "en", { numeric: true }));
      if (ms.length) veh += group(v.name, ms);
    });
  } else if (f.veh && !MODEL_BY_ID[f.veh]) {
    veh += `<option value="${esc(f.veh)}" selected>Loading…</option>`;
  } else {
    veh += `<option value="__eq">${EQ.loading ? "Loading engines and machines…" : "Outboards, jet skis, generators, machinery…"}</option>`;
  }

  row.innerHTML = `
    <div class="pickrow"><div class="picklabel">Type</div><div class="chips lchips">${chips}</div></div>
    <div class="lfilters">
      ${sel("veh", "lfVeh", "Vehicle", veh)}
      ${sel("grade", "lfGrade", "Grade", opts(uniqSorted(LB.entries.map(e => e.grade)), f.grade, "Any grade"))}
      ${sel("spec", "lfSpec", "Spec", opts(uniqSorted(LB.entries.map(e => e.spec)), f.spec, "Any spec"))}
      ${sel("pack", "lfPack", "Pack size", opts(uniqSorted(LB.entries.flatMap(e => e.packs)), f.pack, "Any size"))}
    </div>`;
}

function renderLubeRail() {
  $("#railHead").textContent = "For";
  if (!LB.loaded) { $("#catWrap").innerHTML = ""; return; }
  const base = LB.entries.filter(e => lubeMatch(e, "for"));
  const count = {};
  base.forEach(e => LB.forOf[e.id].forEach(k => { count[k] = (count[k] || 0) + 1; }));
  $("#catWrap").innerHTML =
    `<button class="catbtn" data-lf="for" data-val="" aria-pressed="${!state.lf.for}"><span>Everything</span><span class="k">${base.length}</span></button>` +
    FOR_TAGS.filter(([k]) => count[k] || state.lf.for === k).map(([k, name]) =>
      `<button class="catbtn" data-lf="for" data-val="${k}" aria-pressed="${state.lf.for === k}"><span>${esc(name)}</span><span class="k">${count[k] || 0}</span></button>`
    ).join("");
}

function lubeCardHTML(e) {
  const pack = lubePack(e);
  const packs = e.packs.map(k =>
    `<button class="chip pk" data-lpack="${esc(e.id)}" data-pack="${esc(k)}" aria-pressed="${k === pack}">${esc(k)}</button>`).join("");
  return `<article class="card lubecard" data-lube="${esc(e.id)}">
    <div class="eqtag">${esc(LB.typeName[e.type] || "")}</div>
    <div class="cardtop"><h3 class="cardname">${esc(e.title)}</h3></div>
    <div class="lspec"><b>${esc(e.grade)}</b>${e.spec ? " · " + esc(e.spec) : ""}</div>
    <div class="chips lpacks" role="group" aria-label="Pack size">${packs}</div>
    ${(e.apps || []).length ? `<p class="lapps">${esc(e.apps.join("; "))}</p>` : ""}
    ${(e.brands || []).length ? `<p class="lbrands"><b>Brands we can source:</b> ${esc(e.brands.join(", "))}</p>` : ""}
    ${e.note ? `<p class="lnote">${esc(e.note)}</p>` : ""}
    <button class="moreb" data-lubedetail="${esc(e.id)}">Details &amp; what it fits →</button>
    <div class="cardfoot">
      <div>${lubePriceHTML(e, pack)}</div>
      <button class="addbtn" data-add="${esc(lubeLineId(e, pack))}">Add</button>
    </div>
  </article>`;
}

/* Owner-manual fluids for a bike, shown exactly as the manual gives them. */
function fluidsHTML(modelId, shop) {
  const mo = LB.loaded && LB.modelOil[modelId];
  if (!mo) return "";
  const rows = mo.items.map(i =>
    `<div class="fl-row"><span class="fl-k">${esc(i.item)}</span><span class="fl-v">${esc(i.value)}</span></div>`).join("");
  const target = mo.entry && LB.byId[mo.entry];
  const shopBtn = shop && target
    ? `<a class="addbtn fl-shop" href="?v=lubes&amp;e=${encodeURIComponent(mo.entry)}" data-lubejump="e" data-val="${esc(mo.entry)}">Shop this oil</a>` : "";
  return `<div class="fluids">
    <div class="fl-head">Fluids (owner manual)</div>
    <div class="fl-rows">${rows}</div>
    ${mo.note ? `<div class="hint">${esc(mo.note)}</div>` : ""}
    <div class="fl-foot">
      <span class="mnote-src"><b>Source</b> <a class="srclink" href="${esc(mo.url)}" target="_blank" rel="noopener noreferrer">${esc(mo.source)} ↗</a></span>
      ${shopBtn}
    </div>
  </div>`;
}

const LUBE_LINE = "Prices confirmed on WhatsApp. Check your owner's manual for grade and capacity.";

function renderLubeResults() {
  const f = state.lf;
  const box = $("#rNote");
  if (!LB.loaded) {
    $("#rTitle").textContent = "Oils & lubricants";
    $("#rCount").textContent = "";
    $("#clearBtn").hidden = true;
    box.hidden = true;
    $("#grid").innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>${LB.failed ? "Could not load oils & lubricants" : "Loading oils & lubricants…"}</h3>
      <p>${LB.failed ? "Check your connection and pick the category again." : "Engine oil, gear oil, grease, coolant and brake fluid."}</p></div>`;
    return;
  }
  const r = LB.entries.filter(e => lubeMatch(e));
  const veh = f.veh && MODEL_BY_ID[f.veh];
  let title = "Oils & lubricants";
  if (f.e && LB.byId[f.e]) title = LB.byId[f.e].title;
  else if (veh) title = `Oils for ${modelLabel(veh)}`;
  if (!f.e && f.type && LB.typeName[f.type]) title += ` · ${LB.typeName[f.type]}`;
  if (!f.e && f.for) title += ` · ${FOR_NAME[f.for]}`;
  if (state.q.trim()) title = `“${state.q.trim()}”`;
  $("#rTitle").textContent = title;
  $("#rCount").textContent = `${r.length} ${r.length === 1 ? "product" : "products"}`;
  $("#clearBtn").hidden = !(Object.values(f).some(Boolean) || state.q.trim());

  box.innerHTML = `<div class="mnote-note">${esc(LUBE_LINE)}</div>` + (f.veh ? fluidsHTML(f.veh, false) : "") +
    (f.e ? `<div><button class="clearbtn" data-clear="1">See all oils &amp; lubricants</button></div>` : "");
  box.hidden = false;

  if (!r.length) {
    $("#grid").innerHTML = `<div class="empty" style="grid-column:1/-1">
      <h3>Nothing matches that yet</h3>
      <p>Try fewer filters, or search for a grade like “10W-40” or a job like “grease”.</p>
      <button class="clearbtn" data-clear="1">Reset the filters</button>
    </div>`;
    return;
  }
  $("#grid").innerHTML = r.map(lubeCardHTML).join("");
}

function renderLubes() {
  renderLubeFilters(); renderLubeRail(); renderLubeResults();
}

function openLubeDetail(id) {
  const e = LB.byId[id];
  if (!e) return;
  const pack = lubePack(e);
  const missing = e.fits.filter(f => !MODEL_BY_ID[f]).length;
  if (missing && !EQ.loaded && !EQ.failed) {
    loadEquip().then(() => { if ($("#detail").classList.contains("on") && $("#detailBody").dataset.lube === id) openLubeDetail(id); }, () => {});
  }
  const fitModels = e.fits.map(f => MODEL_BY_ID[f]).filter(Boolean);
  const verts = e.fitsVerticals.map(v => VERT_BY_ID[v] ? VERT_BY_ID[v].name : "").filter(Boolean);
  const fitBlock = (fitModels.length ? `<div class="fitfull">${fitModels.map(m => `<span class="m"><b>${esc(modelLabel(m))}</b></span>`).join("")}</div>` : "") +
    (missing && !EQ.loaded ? `<p class="hint">${EQ.failed ? `${missing} more engines and skis (names could not load).` : `Loading ${missing} engine and ski names…`}</p>` : "") +
    (verts.length ? `<p class="hint">Also suits: ${esc(verts.join(", "))}</p>` : "") +
    (!fitModels.length && !missing && !verts.length ? `<p class="hint">General use. Check your manual for the grade it needs.</p>` : "");
  const packs = e.packs.map(k =>
    `<button class="chip pk" data-lpack="${esc(e.id)}" data-pack="${esc(k)}" aria-pressed="${k === pack}">${esc(k)}</button>`).join("");
  const forTags = LB.forOf[e.id].map(k => `<span class="fitchip">${esc(FOR_NAME[k])}</span>`).join("");

  $("#detailBody").dataset.lube = id;
  $("#detailBody").innerHTML = `
    <div class="dsec"><h4>Grade and spec</h4>
      <p class="lspec" style="margin:0"><b>${esc(e.grade)}</b>${e.spec ? " · " + esc(e.spec) : ""}</p>
      <p class="hint">${esc(LB.typeName[e.type] || "")}</p></div>
    <div class="dsec"><h4>Pack size</h4><div class="chips lpacks">${packs}</div></div>
    ${(e.apps || []).length ? `<div class="dsec"><h4>Used for</h4><p class="lapps" style="margin:0">${esc(e.apps.join("; "))}</p>
      ${forTags ? `<div class="ribbon" style="margin-top:7px">${forTags}</div>` : ""}</div>` : ""}
    ${(e.brands || []).length ? `<div class="dsec"><h4>Brands we can source</h4><p class="lapps" style="margin:0">${esc(e.brands.join(", "))}</p></div>` : ""}
    ${e.note ? `<div class="dsec"><h4>Note</h4><div class="notebox">${esc(e.note)}</div></div>` : ""}
    <div class="dsec"><h4>Fits</h4>${fitBlock}</div>
    <div class="dsec">
      <h4>Price</h4>
      ${lubePriceHTML(e, pack)}
      <p class="hint">${pack === e._pp ? `Price is for the ${esc(pack)} pack.` : "We'll confirm the price on WhatsApp."} Check your owner's manual for grade and capacity.</p>
    </div>
    <button class="gobtn" data-add="${esc(lubeLineId(e, pack))}">Add to order</button>`;
  $("#detailTitle").textContent = e.title;
  openDrawer("#detail");
}

/* Jump into the lubes view with one filter set: "Shop this oil", "Matching oils". */
function goLubes(filter) {
  state.vertical = "lubes";
  state.brand = state.model = state.cat = null;
  state.q = ""; $("#q").value = "";
  state.lf = Object.assign(blankLF(), filter);
  if (filter.veh && !MODEL_BY_ID[filter.veh]) loadEquip().then(render, () => {});
  ensureLubes();
  render();
  const h = $(".rhead");
  window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - ($(".bar").offsetHeight + 8));
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
  if (state.vertical === "lubes") {
    $("#lede").textContent =
      "Engine oil, gear oil, grease, coolant and brake fluid for bikes, boats, generators and machinery. " +
      "Pick a type or your vehicle and add what you need. We'll confirm the price on WhatsApp.";
    return;
  }
  if (state.vertical === "bikes") {
    if ($("#lede").innerHTML !== BIKE_COPY.lede) $("#lede").innerHTML = BIKE_COPY.lede;
    if ($("#step2Label").innerHTML !== BIKE_COPY.step2) $("#step2Label").innerHTML = BIKE_COPY.step2;
    return;
  }
  $("#lede").textContent =
    `One wrong digit means the wrong part on the next boat. Pick the make and the ${v.pick}, ` +
    `and we will show you the exact number from the maker's catalogue, where it was sourced, ` +
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
    .map(m => `<button class="chip" data-model="${esc(m.id)}" aria-pressed="${state.model === m.id}">${esc(m.name)}<span class="cc">${count[m.id] || 0} parts</span></button>`)
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
  if (state.vertical === "lubes") { renderLubeFilters(); return renderLubeRail(); }
  $("#railHead").textContent = "Category";
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
    <div class="ribbon">${fitNames}</div>
    <div class="staffbox">
      <div><span class="l">Cost</span><span class="v">—</span></div>
      <div><span class="l">Margin</span><span class="v marg">—</span></div>
      <div><span class="l">Stock</span><span class="v">—</span></div>
      <div><span class="l">Re-order</span><span class="v">—</span></div>
      <div><span class="l">Bin</span><span class="v">—</span></div>
    </div>
    <button class="moreb" data-detail="${esc(p.id)}">Fitment, source &amp; notes →</button>
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

function sourceLinks(urls) {
  return (urls || []).filter(u => /^https?:\/\//.test(u)).map(u => {
    let label = u;
    try { const x = new URL(u); label = x.hostname.replace(/^www\./, "") + (x.pathname.length > 1 ? x.pathname.replace(/\/$/, "").slice(0, 38) + (x.pathname.length > 39 ? "…" : "") : ""); } catch {}
    return `<a class="srclink" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  }).join("");
}

function renderModelNote() {
  const box = $("#rNote");
  const m = state.model ? MODEL_BY_ID[state.model] : null;
  if (!m || state.q.trim()) { box.hidden = true; box.innerHTML = ""; return; }
  /* A model page shows its owner-manual fluids / matching oils, so the first
     model picked fetches data-lubes.js; the home page never does. */
  if (!LB.loaded && !LB.failed) {
    const p = loadLubes();
    if (!LB.loaded) p.then(() => { if (state.model === m.id) renderModelNote(); }, () => {});
  }
  /* Bike model notes are build provenance; only a customer-facing notice shows. */
  if (state.vertical === "bikes") {
    box.innerHTML = (m.notice ? `<div class="mnote-note">${esc(m.notice)}</div>` : "") + fluidsHTML(m.id, true);
    box.hidden = !box.innerHTML;
    return;
  }
  const bits = [];
  if (m.model_number) bits.push(`<span><b>Model</b> ${esc(m.model_number)}</span>`);
  if (m.engine) bits.push(`<span><b>Engine</b> ${esc(m.engine)}</span>`);
  if (m.size) bits.push(`<span><b>Size</b> ${esc(m.size)}</span>`);
  if (m.catalogue) bits.push(`<span><b>Catalogue</b> ${esc(m.catalogue)}</span>`);
  const note = m.note ? `<div class="mnote-note">${SERIAL_HINT.test(m.note) || /unverified|nearest/i.test(m.note) ? `<span class="serialnote">Check frame/serial number</span> ` : ""}${esc(m.note)}</div>` : "";
  /* Power products link their honda.mv page. A marine model's catalogue_url is
     just the first page scraped (often one part's product page), so it is not
     shown as "the" catalogue; each part's drawer links its own sources. */
  const src = m.model_number && m.catalogue_url ? `<div class="mnote-src"><b>Product page</b> ${sourceLinks([m.catalogue_url])}</div>` : "";
  const oils = LB.loaded && LB.entries.some(e => lubeFits(e, m.id))
    ? `<div class="mnote-src"><b>Oils</b> <a class="srclink" href="?v=lubes&amp;veh=${encodeURIComponent(m.id)}" data-lubejump="veh" data-val="${esc(m.id)}">Matching oils →</a></div>` : "";
  box.innerHTML = `${bits.length ? `<div class="mnote-bits">${bits.join("")}</div>` : ""}${note}${src}${oils}`;
  box.hidden = !box.innerHTML;
}

function renderResults() {
  if (state.vertical === "lubes") return renderLubeResults();
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

  const links = sourceLinks(p.sources && p.sources.length ? p.sources : [p.source_url]);

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
    <div class="dsec"><h4>Source</h4>${links ? `<div class="srclist">${links}</div>` : `<p class="hint">No source link recorded.</p>`}</div>
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
  delete $("#detailBody").dataset.lube;
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
    ${p.note ? `<div class="dsec"><h4>Counter note</h4><div class="notebox">${esc(p.note)}</div></div>` : ""}

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
  renderVerticals(); renderHero();
  const lubes = state.vertical === "lubes";
  $("#brandRow").hidden = lubes;
  $("#lubeRow").hidden = !lubes;
  if (lubes) { $("#modelRow").hidden = true; renderLubes(); syncURL(); return; }
  renderPickers();
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
  if (state.vertical === "lubes") {
    for (const [k, p] of Object.entries(LF_PARAMS)) if (state.lf[k]) ps.set(p, state.lf[k]);
  } else if (state.model) ps.set("m", state.model);
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
  if (v === "lubes") {
    state.vertical = "lubes";
    for (const [k, p] of Object.entries(LF_PARAMS)) if (ps.get(p)) state.lf[k] = ps.get(p);
    if (state.lf.veh && !MODEL_BY_ID[state.lf.veh]) loadEquip().then(render, () => {});
    ensureLubes();
    render();
    return;
  }
  if (v && VERT_BY_ID[v]) state.vertical = v;
  const needEq = state.vertical !== "bikes" || (m && !MODEL_BY_ID[m]) || (q && q.trim().length >= 2);
  if (needEq) { ensureEquip(); loadEquip().then(apply, () => {}); }
  else if (m || b || q) apply();
}

function chooseVertical(v) {
  if (!VERT_BY_ID[v]) return;
  if (v === state.vertical && (v === "lubes" ? LB.loaded : EQ.loaded || v === "bikes")) return;
  state.vertical = v;
  state.brand = state.model = state.cat = null;
  if (v === "lubes") { state.lf = blankLF(); ensureLubes(); }
  else if (v !== "bikes") ensureEquip();
  render();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-vertical],[data-brand],[data-model],[data-cat],[data-add],[data-detail],[data-q],[data-clear],[data-skin],[data-close]");
  if (!t) return;

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
    state.brand = state.model = state.cat = null; state.q = ""; $("#q").value = ""; state.lf = blankLF(); render();
  } else if (t.dataset.skin) {
    state.skin = t.dataset.skin; applySkin();
  } else if (t.dataset.close !== undefined) {
    closeDrawers();
  }
});

/* Oils & lubricants: filter chips, pack pickers, detail drawer, jumps from a model page. */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-lf],[data-lpack],[data-lubedetail],[data-lubejump]");
  if (!t) return;
  if (t.dataset.lf) {
    const k = t.dataset.lf, v = t.dataset.val || null;
    state.lf[k] = state.lf[k] === v ? null : v;
    state.lf.e = "";
    render();
  } else if (t.dataset.lpack) {
    state.lpack[t.dataset.lpack] = t.dataset.pack;
    if (state.vertical === "lubes") renderLubeResults();
    if ($("#detail").classList.contains("on") && $("#detailBody").dataset.lube === t.dataset.lpack) openLubeDetail(t.dataset.lpack);
  } else if (t.dataset.lubedetail) {
    openLubeDetail(t.dataset.lubedetail);
  } else if (t.dataset.lubejump) {
    e.preventDefault();
    goLubes({ [t.dataset.lubejump]: t.dataset.val });
  }
});
$("#lubeRow").addEventListener("change", (e) => {
  const s = e.target.closest("[data-lsel]");
  if (!s) return;
  if (s.value === "__eq") {
    s.value = state.lf.veh || "";
    loadEquip().then(render, () => { render(); toast("Could not load the engine and machine list"); });
    render();
    return;
  }
  state.lf[s.dataset.lsel] = s.value;
  state.lf.e = "";
  render();
});

/* Typing a query pulls in the equipment catalogue (debounced) so a part number
   like 6CE-WS24A-00 or an engine code like KTA19 is found from any page.
   In the oils view the search stays inside the oils. */
let eqSearchT;
$("#q").addEventListener("input", (e) => {
  state.q = e.target.value; renderRail(); renderResults();
  if (state.vertical !== "lubes" && !EQ.loaded && state.q.trim().length >= 2) {
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
  state.brand = state.model = state.cat = null; state.q = ""; $("#q").value = ""; state.lf = blankLF(); render();
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
/* An order saved with equipment or oil lines needs that catalogue to show them. */
const savedIds = Object.keys(state.cart);
if (savedIds.some(id => id.startsWith("lube~"))) loadLubes().then(renderCart, () => {});
if (savedIds.some(id => !id.startsWith("lube~") && !PART_BY_ID[id])) loadEquip().then(renderCart, () => {});
