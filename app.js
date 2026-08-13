/* avas.parts — part finder, interchange engine, ordering */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

const MODEL_BY_ID = Object.fromEntries(MODELS.map(m => [m.id, m]));
const CAT_BY_ID   = Object.fromEntries(CATS.map(c => [c.id, c]));

const state = {
  brand: null,
  model: null,
  cat: null,
  q: "",
  skin: localStorage.getItem("avas.skin") || "public",
  cart: JSON.parse(localStorage.getItem("avas.cart") || "{}"),
};

const money = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

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
const needsCheck = (p) => !p.v && !isOwnSku(p);

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

function results() {
  const q = state.q.trim().toLowerCase();
  const terms = q ? q.split(/\s+/) : [];
  return PARTS.filter(p => {
    if (state.model && !p.universal && !p.fits.includes(state.model)) return false;
    if (state.brand && !state.model) {
      const ok = p.universal || p.fits.some(id => MODEL_BY_ID[id] && MODEL_BY_ID[id].brand === state.brand);
      if (!ok) return false;
    }
    if (state.cat && p.cat !== state.cat) return false;
    if (terms.length && !terms.every(t => p._h.includes(t))) return false;
    return true;
  });
}

/* ---------- Interchange: other part numbers doing the same job ---------- */
function sameJob(part) {
  const g = parsePN(part.oem).group;
  if (!g) return [];
  return PARTS.filter(p => p.id !== part.id && parsePN(p.oem).group === g);
}

/* ---------- Render: brand + model pickers ---------- */
function renderPickers() {
  $("#brandChips").innerHTML = BRANDS.map(b =>
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
  const base = PARTS.filter(p => {
    if (state.model && !p.universal && !p.fits.includes(state.model)) return false;
    if (state.brand && !state.model) {
      if (!(p.universal || p.fits.some(id => MODEL_BY_ID[id] && MODEL_BY_ID[id].brand === state.brand))) return false;
    }
    const q = state.q.trim().toLowerCase();
    if (q && !q.split(/\s+/).every(t => p._h.includes(t))) return false;
    return true;
  });
  const counts = {};
  base.forEach(p => { counts[p.cat] = (counts[p.cat] || 0) + 1; });

  $("#catWrap").innerHTML =
    `<button class="catbtn" data-cat="" aria-pressed="${!state.cat}">
       <span>All parts</span><span class="k">${base.length}</span></button>` +
    CATS.filter(c => counts[c.id]).map(c =>
      `<button class="catbtn" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">
         <span>${esc(c.name)}</span><span class="k">${counts[c.id]}</span></button>`
    ).join("");
}

/* ---------- Render: part cards ---------- */
function stockLine(p) {
  if (p.stock <= 0)      return `<span class="stockline"><span class="dotr">●</span> On order</span>`;
  if (p.stock <= p.rop)  return `<span class="stockline"><span class="doty">●</span> Low stock</span>`;
  return `<span class="stockline"><span class="dotg">●</span> In stock</span>`;
}

function cardHTML(p) {
  const fitNames = p.universal
    ? `<span class="fitchip uni">Fits any bike</span>`
    : p.fits.slice(0, 5).map(id => {
        const m = MODEL_BY_ID[id];
        if (!m) return "";
        return `<span class="fitchip${state.model === id ? " on" : ""}">${esc(m.name)}</span>`;
      }).join("") + (p.fits.length > 5 ? `<span class="fitchip">+${p.fits.length - 5} more</span>` : "");

  const margin = p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;

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
      <div><span class="l">Cost</span><span class="v">${money(p.cost)}</span></div>
      <div><span class="l">Margin</span><span class="v marg">${margin}%</span></div>
      <div><span class="l">Stock</span><span class="v ${p.stock <= p.rop ? "low" : ""}">${p.stock}</span></div>
      <div><span class="l">Re-order</span><span class="v">${p.rop}</span></div>
      <div><span class="l">Bin</span><span class="v">${esc(p.bin)}</span></div>
    </div>
    <button class="moreb" data-detail="${p.id}">Fitment, alternates &amp; interchange →</button>
    <div class="cardfoot">
      <div>
        <div class="price"><span class="cur">MVR</span><span class="amt">${money(p.price)}</span></div>
        ${stockLine(p)}
      </div>
      <button class="addbtn" data-add="${p.id}">Add</button>
    </div>
  </article>`;
}

function renderResults() {
  const r = results();
  const m = state.model ? MODEL_BY_ID[state.model] : null;
  let title = "All parts";
  if (m) title = `${m.brand} ${m.name}`;
  else if (state.brand) title = state.brand;
  if (state.cat) title += ` · ${CAT_BY_ID[state.cat].name}`;
  if (state.q.trim()) title = `“${state.q.trim()}”`;

  $("#rTitle").textContent = title;
  $("#rCount").textContent = `${r.length} ${r.length === 1 ? "part" : "parts"}`;
  $("#clearBtn").hidden = !(state.brand || state.model || state.cat || state.q.trim());

  if (!r.length) {
    $("#grid").innerHTML = `<div class="empty" style="grid-column:1/-1">
      <h3>Nothing matches that yet</h3>
      <p>Try the part number without dashes, the bike model, or what the part does — “belt”, “brake pad”, “battery”.</p>
      <button class="clearbtn" data-clear="1">Reset the search</button>
    </div>`;
    return;
  }
  $("#grid").innerHTML = r.map(cardHTML).join("");
}

/* ---------- Detail drawer: the full interchange view ---------- */
function openDetail(id) {
  const p = PARTS.find(x => x.id === id);
  if (!p) return;
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
      ${p.v ? `<p class="hint" style="margin-top:6px">Confirmed against a published parts source.</p>` : isOwnSku(p) ? `<p class="hint" style="margin-top:6px">An avas.parts shop code. There is no manufacturer number for this item.</p>` : `<p class="hint" style="margin-top:6px"><span class="unver">Not yet confirmed</span> — check this number against the bike’s frame number before you order.</p>`}
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
      <div class="price"><span class="cur">MVR</span><span class="amt">${money(p.price)}</span></div>
      <p class="hint">${stockLine(p).replace(/<[^>]+>/g, "")} · ${esc(CAT_BY_ID[p.cat].name)}</p>
    </div>
    <button class="gobtn" data-add="${p.id}">Add to order</button>`;

  $("#detailTitle").textContent = p.name;
  openDrawer("#detail");
}

/* ---------- Cart ---------- */
const cartCount = () => Object.values(state.cart).reduce((a, b) => a + b, 0);
const cartLines = () => Object.entries(state.cart)
  .map(([id, q]) => ({ p: PARTS.find(x => x.id === id), q }))
  .filter(x => x.p);

function saveCart() {
  localStorage.setItem("avas.cart", JSON.stringify(state.cart));
  const n = cartCount();
  $("#cartN").textContent = n;
  $("#cartN").dataset.empty = n ? "0" : "1";
}

function addToCart(id, silent) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  saveCart();
  if (!silent) {
    const p = PARTS.find(x => x.id === id);
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
      <p>Pick your bike, then add the parts you need. We deliver to every inhabited island.</p>
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
        <div class="qty">
          <button data-q="${p.id}|${q - 1}" aria-label="Fewer">−</button>
          <span>${q}</span>
          <button data-q="${p.id}|${q + 1}" aria-label="More">+</button>
        </div>
      </div>
      <div class="rt"><div class="lp">${money(p.price * q)}</div></div>
    </div>`).join("");

  const sub = lines.reduce((a, { p, q }) => a + p.price * q, 0);
  const del = zoneFee();
  const gst = Math.round((sub + del) * SHOP.gstRate);
  $("#tSub").textContent = money(sub);
  $("#tDel").textContent = money(del);
  $("#tGst").textContent = money(gst);
  $("#tAll").textContent = "MVR " + money(sub + del + gst);
  $("#goBtn").disabled = !$("#custName").value.trim() || !$("#custPhone").value.trim();
}

function orderText() {
  const lines = cartLines();
  const z = ZONES.find(z => z.id === $("#zone").value);
  const sub = lines.reduce((a, { p, q }) => a + p.price * q, 0);
  const del = zoneFee();
  const gst = Math.round((sub + del) * SHOP.gstRate);
  const ref = "AVAS-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  return [
    `*avas.parts order ${ref}*`, "",
    ...lines.map(({ p, q }) => `${q} × ${p.name}\n   ${p.oem} — MVR ${money(p.price * q)}`),
    "",
    `Subtotal: MVR ${money(sub)}`,
    `Delivery (${z.name}): MVR ${money(del)}`,
    `GST 8%: MVR ${money(gst)}`,
    `*Total: MVR ${money(sub + del + gst)}*`,
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
function render() { renderPickers(); renderRail(); renderResults(); }

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-brand],[data-model],[data-cat],[data-add],[data-detail],[data-q],[data-clear],[data-skin],[data-close]");
  if (!t) return;

  if (t.dataset.brand !== undefined) {
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

$("#q").addEventListener("input", (e) => { state.q = e.target.value; renderRail(); renderResults(); });
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
