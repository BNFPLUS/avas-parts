/* Dealer research notes carry overseas reference prices and dated stock remarks
   (what a competitor or foreign dealer charges, and whether they had it on a
   given day). That is research for the shop, never for customers, so it is cut
   from every note that reaches data.js / data-equip.js. Segments are the
   "; "-separated pieces the dealer file uses; everything else is kept as is.
   Idempotent: cleaning a cleaned note returns it unchanged. */
const CUR = "AUD|USD|HUF|IDR|RON|CAD|MVR|EUR|SEK|THB|VND|Rp|Rf";
const PRICE = new RegExp(`\\b(${CUR})\\b\\s*\\d|\\d[\\d.,]*\\s*(${CUR})\\b|\\bHET\\b`, "i");
const DROP = [
  /^ref price\b/i,                                       // "ref price 16.00 AUD", "ref price = ..."
  /^(sold out|in stock|low stock|out of stock)\b/i,      // "Sold Out on 22 Nov 2026"
  PRICE,                                                 // any amount in a currency
];

function cleanNote(note) {
  if (!note) return null;
  const segs = note.split(/;\s*/)
    /* Auto Care VERIFY notes name the shop's price and stock on a date; the
       VERIFY point (retailer-only number) stays. */
    .map(s => s.replace(/ retail price and stock "[^"]*" on \d{1,2} \w+ \d{4}/i, " retail listing").trim())
    .filter(s => s && !DROP.some(re => re.test(s)));
  return segs.length ? segs.join("; ") : null;
}

/* Dealer model notes name the local seller's machine price, e.g.
   "Sold by MotoX (MVR 120,000; MotoX quotes 298 cc)". Drop the price parts. */
function cleanModelNote(note) {
  if (!note) return note;
  return note.replace(/\s*\(([^)]*)\)/g, (all, inner) => {
    if (!PRICE.test(inner) && !/\bMVR\b/.test(inner)) return all;
    const keep = inner.split(/;\s*/).filter(s => !PRICE.test(s) && !/\bMVR\b/.test(s));
    return keep.length ? ` (${keep.join("; ")})` : "";
  });
}

module.exports = { cleanNote, cleanModelNote };
