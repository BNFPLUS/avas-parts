/* CSV reader for the BNF PLUS stock exports (tools/build-bnf.js, tools/build-dive.js).
   Refuses any price-like column: BNF PLUS prices never reach the site. */
const PRICE_COLUMN = /price|cost|mvr|margin/i;

function parseCSV(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const head = rows.shift();
  const bad = head.filter(h => PRICE_COLUMN.test(h));
  if (bad.length) throw new Error(`refusing to build: price-like column(s) ${bad.join(", ")} — BNF PLUS prices never reach the site`);
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((k, i) => [k, (r[i] || "").trim()])));
}

module.exports = { parseCSV, PRICE_COLUMN };
