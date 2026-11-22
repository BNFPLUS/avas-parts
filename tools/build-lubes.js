/* Copies src-data/lubes/data-lubes.js to ./data-lubes.js after checking it.
   The source file is the record; the root copy is what the page lazy-loads.
   Run: node tools/build-lubes.js */
const fs = require("fs"), path = require("path"), vm = require("vm");

const root = path.join(__dirname, "..");
const src = path.join(root, "src-data/lubes/data-lubes.js");
const text = fs.readFileSync(src, "utf8");

const ctx = {};
vm.createContext(ctx);
vm.runInContext(text + "\n;globalThis.__L = LUBES;", ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8") + "\n;globalThis.__P = PARTS;", ctx);
const L = ctx.__L, partById = Object.fromEntries(ctx.__P.map(p => [p.id, p]));

const problems = [];
const types = new Set(L.types.map(t => t.id));
for (const e of L.entries) {
  if (!e.id || !e.type || !e.title || !(e.packs || []).length) problems.push(`${e.id}: missing id/type/title/packs`);
  if (!types.has(e.type)) problems.push(`${e.id}: unknown type ${e.type}`);
  if (e.price != null) {
    const p = e.avasPart && partById[e.avasPart];
    if (!p) problems.push(`${e.id}: priced without an existing data.js part`);
    else if (p.price !== e.price) problems.push(`${e.id}: price ${e.price} differs from ${e.avasPart} (${p.price})`);
  }
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

fs.writeFileSync(path.join(root, "data-lubes.js"), text);
console.log(`data-lubes.js — ${L.entries.length} entries, ${Object.keys(L.modelOil).length} models with owner-manual fluids`);
