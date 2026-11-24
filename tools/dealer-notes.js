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
  return segs.length ? publicNote(segs.join("; ")) : null;
}

/* Notes reach the page as text, so they must not name an outside website,
   domain or online vendor. The research source stays in the data (sources,
   source_url, EQUIP.urls); the note keeps only what it tells the customer:
   which catalogue, VERIFY, check the serial, equivalent numbers.
   Idempotent, like cleanNote. Order matters where rules overlap. */
const SOURCE_NAMES = [
  // Parsun: official parts site and the Swedish importer
  [/\bcatalogue: parsunparts\.com official Parsun spare parts website, /g, "Official Parsun spare parts catalogue, "],
  [/\balso on parsun\.eu maintenance list\b/g, "Also on the Parsun importer's maintenance list"],
  [/\bparsun\.eu \(Swedish Parsun importer\) annual-service list/g, "Parsun importer (Sweden) annual-service list"],
  [/\bcatalogue: parsun\.eu engine maintenance material/g, "catalogue: Parsun importer engine maintenance material"],
  // Keeway: the official Hungarian parts catalogue
  [/\bcatalogue: alkatresz\.keeway\.hu official Keeway Hungary/g, "catalogue: official Keeway Hungary"],
  // Mercury / Yamaha outboard kits: keep the plug sku, drop the vendor
  [/\(PartsVu sku (PV\d+)\)/g, "(sku $1)"],
  // Maldives retailer numbers (not checked against a Honda fiche)
  [/\bAuto Care \(Maldives\) retail listing/g, "Maldives retail listing"],
  [/\bcatalogue: autocare\.mv retailer listing/g, "catalogue: Maldives retailer listing"],
  // Indonesian Yamaha dealer article
  [/\bauthorised Yamaha dealer \(BRM, Indonesia\)/g, "authorised Yamaha dealer (Indonesia)"],
  [/\bYamaha BRM dealer article/g, "authorised Yamaha dealer article (Indonesia)"],
  // Thai Yamaha fiche seen only in a search index
  [/\bmototh(?:\.com)? Thai Yamaha fiche/g, "Thai Yamaha parts fiche"],
  [/\bon mototh /g, "on the Thai Yamaha "],
  [/\bmototh part page title/g, "Thai Yamaha fiche part title"],
  [/\bsite itself was down \(DB error\) when fetched/g, "fiche page could not be opened"],
  [/\bsite down\b/g, "page not opened"],
  // Japanese retailer listing of Thai Yamaha OEM parts
  [/\bWebike Japan \(Thai Yamaha OEM parts\)/g, "Japanese retailer listing (Thai Yamaha OEM parts)"],
  [/\bWebike lists\b/g, "a Japanese retailer lists"],
  [/\bWebike (Thai Yamaha OEM listing)/g, "$1"],
  // Honda online fiches
  [/\bhondamoto\.parts lists\b/g, "a Honda parts catalogue lists"],
  [/\bbike-parts-honda lists (\S+ \d{4}) but has no parts catalogue for it/g, "$1 is listed but has no public parts catalogue"],
  [/ on bike-parts-honda\b/g, ""],
  [/\btyre sizes match honda\.mv\b/g, "tyre sizes match the Honda Maldives listing"],
  // A pasted URL: the text around it says what was looked up
  [/:?\s*https?:\/\/[^\s)]+/g, ""],
];

function publicNote(note) {
  if (!note) return note;
  return SOURCE_NAMES.reduce((s, [re, to]) => s.replace(re, to), note);
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

module.exports = { cleanNote, cleanModelNote, publicNote };
