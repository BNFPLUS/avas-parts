/* Moves the counter-only fields of bike parts (cost, bin, re-order point and the
   held stock quantity) out of the public data.js into src-data/bike-staff.json.
   data.js is served as-is and inlined into dist, so it keeps only what a
   customer may see: `stock` becomes a flag (1 = in stock, 0 = on order) and
   `lowStock: true` marks a held quantity at or under the re-order point.

   Run after anything that regenerates data.js with staff fields:
     node tools/split-staff.js
   Idempotent: parts already split keep their sidecar entry. */
const fs = require("fs");
const path = require("path");
const { loadData, writeData, stripStaff } = require("./staff-fields");

const root = path.join(__dirname, "..");
const DATA = path.join(root, "data.js");
const SIDE = path.join(root, "src-data", "bike-staff.json");

const data = loadData(fs.readFileSync(DATA, "utf8"));
const moved = stripStaff(data.D.PARTS);
const side = { ...(fs.existsSync(SIDE) ? JSON.parse(fs.readFileSync(SIDE, "utf8")) : {}), ...moved };

/* The generator's header described the staff fields; keep it accurate. */
data.head = data.head.replace(/^\/\/ price\/cost\/stock\/bin\/rop .*$/m,
  "// price is copied from the previous catalogue only when the OEM number matches exactly (price_flag 'kept_from_pXXX'). stock is a public flag (1 in stock, 0 on order).");

fs.writeFileSync(DATA, writeData(data));
const sorted = Object.fromEntries(Object.keys(side).sort().map(k => [k, side[k]]));
fs.writeFileSync(SIDE, JSON.stringify(sorted, null, 1) + "\n");
console.log(`data.js: ${Object.keys(moved).length} parts split; src-data/bike-staff.json holds ${Object.keys(sorted).length} entries`);
