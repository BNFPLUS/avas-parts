/* Counter-only part fields: cost, bin, re-order point and the held quantity.
   They live in src-data/bike-staff.json; the public data keeps a stock flag
   (1 in stock, 0 on order) and lowStock: true. Shared by tools/split-staff.js
   (rewrites data.js) and build.js (strips anything left before writing dist). */
const vm = require("vm");

const STAFF = ["cost", "bin", "rop"];

function loadData(src) {
  const names = [...src.matchAll(/^const (\w+) = /gm)].map(m => m[1]);
  const head = src.slice(0, src.indexOf("const "));
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src + `\n;globalThis.__D = {${names}};`, ctx);
  return { head, names, D: ctx.__D };
}

/* data.js is written in the generator's format: JSON.stringify(x, null, 1). */
function writeData({ head, names, D }) {
  return head + names.map(n => `const ${n} = ${n === "BRANDS"
    ? "[" + D[n].map(s => JSON.stringify(s)).join(", ") + "]"
    : JSON.stringify(D[n], null, 1)};`).join("\n") + "\n";
}

/* Mutates parts; returns { id: {cost, bin, rop, stock} } for what it removed. */
function stripStaff(parts) {
  const side = {};
  for (const p of parts) {
    if (!STAFF.some(k => k in p) && !(typeof p.stock === "number" && p.stock > 1)) continue;
    const rec = {};
    for (const k of STAFF) if (p[k] != null) rec[k] = p[k];
    if (typeof p.stock === "number") rec.stock = p.stock;
    if (Object.keys(rec).length) side[p.id] = rec;
    for (const k of STAFF) delete p[k];
    if (typeof p.stock === "number") {
      const qty = p.stock;
      p.stock = qty > 0 ? 1 : 0;
      if (qty > 0 && typeof rec.rop === "number" && qty <= rec.rop) p.lowStock = true;
      else delete p.lowStock;
    } else {
      delete p.stock;
    }
  }
  return side;
}

module.exports = { STAFF, loadData, writeData, stripStaff };
