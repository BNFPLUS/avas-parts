/* Schematic part drawings.
 *
 * Line art in the language of a printed parts catalogue — no manufacturer
 * photography, nothing scraped. A part resolves to a drawing by its group
 * code first (so a drive belt looks like a belt whatever bike it fits),
 * then by category.
 *
 * When a part has `img` set in data.js, the photo is used instead and this
 * is ignored. Photograph your own stock and fill that field in.
 */

const ART = {
  belt: `<path d="M34 26h52a20 20 0 0 1 0 28H34a20 20 0 0 1 0-28z"/>
    <path d="M34 32h52M34 48h52" class="f"/>
    <path d="M40 26v6M50 26v6M60 26v6M70 26v6M80 26v6M40 48v6M50 48v6M60 48v6M70 48v6M80 48v6"/>`,

  roller: `<circle cx="60" cy="40" r="24"/>
    <circle cx="60" cy="20" r="6" class="f"/><circle cx="77" cy="30" r="6"/>
    <circle cx="77" cy="50" r="6"/><circle cx="60" cy="60" r="6"/>
    <circle cx="43" cy="50" r="6"/><circle cx="43" cy="30" r="6"/>`,

  clutch: `<circle cx="60" cy="40" r="26"/><circle cx="60" cy="40" r="9"/>
    <path d="M60 14a26 26 0 0 1 22 13l-14 8a10 10 0 0 0-8-5z" class="f"/>
    <path d="M82 53a26 26 0 0 1-44 0l14-8a10 10 0 0 0 16 0z"/>
    <path d="M38 27a26 26 0 0 1 0 26"/>`,

  pad: `<rect x="26" y="26" width="30" height="30" rx="4"/>
    <rect x="26" y="26" width="30" height="8" rx="3" class="f"/>
    <rect x="64" y="26" width="30" height="30" rx="4"/>
    <rect x="64" y="26" width="30" height="8" rx="3" class="f"/>
    <path d="M31 40h20M31 46h20M69 40h20M69 46h20"/>`,

  shoe: `<path d="M60 16a24 24 0 0 1 24 24"/><path d="M60 22a18 18 0 0 1 18 18"/>
    <path d="M60 64a24 24 0 0 1-24-24"/><path d="M60 58a18 18 0 0 1-18-18"/>
    <circle cx="60" cy="40" r="5" class="f"/>`,

  battery: `<rect x="30" y="24" width="60" height="34" rx="3"/>
    <rect x="38" y="18" width="9" height="6" class="f"/><rect x="73" y="18" width="9" height="6"/>
    <path d="M30 34h60" /><path d="M42 44v8M38 48h8" class="f"/><path d="M74 48h8"/>`,

  plug: `<path d="M54 14h12v16H54z"/><path d="M52 30h16v10H52z" class="f"/>
    <path d="M56 40h8v14h-8z"/><path d="M60 54v10"/>
    <path d="M64 64h-8a4 4 0 0 1 0-8"/><path d="M50 34h20M50 37h20"/>`,

  airfilter: `<rect x="24" y="24" width="72" height="32" rx="3"/>
    <path d="M32 24v32M40 24v32M48 24v32M56 24v32M64 24v32M72 24v32M80 24v32M88 24v32"/>
    <rect x="24" y="24" width="72" height="6" class="f"/>`,

  oilfilter: `<circle cx="60" cy="40" r="22"/><circle cx="60" cy="40" r="9" class="f"/>
    <path d="M45 25l30 30M75 25L45 55M38 40h44M60 18v44"/>`,

  camchain: `<path d="M28 40h64"/>
    <circle cx="34" cy="40" r="5"/><circle cx="48" cy="40" r="5"/><circle cx="62" cy="40" r="5" class="f"/>
    <circle cx="76" cy="40" r="5"/><circle cx="90" cy="40" r="5"/>
    <path d="M30 34h64M30 46h64"/>`,

  piston: `<rect x="42" y="18" width="36" height="26" rx="3"/>
    <path d="M42 24h36M42 29h36M42 34h36" class="f"/>
    <path d="M56 44v8M64 44v8"/><path d="M60 52l-8 20h16z"/>
    <circle cx="60" cy="66" r="4"/>`,

  tyre: `<circle cx="60" cy="40" r="28"/><circle cx="60" cy="40" r="14" class="f"/>
    <circle cx="60" cy="40" r="8"/>
    <path d="M60 12v8M60 60v8M32 40h8M80 40h8M40 20l6 6M80 60l-6-6M40 60l6-6M80 20l-6 6"/>`,

  tube: `<circle cx="60" cy="40" r="24"/><circle cx="60" cy="40" r="16"/>
    <rect x="56" y="10" width="8" height="10" rx="2" class="f"/>`,

  chain: `<rect x="24" y="34" width="18" height="12" rx="6"/>
    <rect x="40" y="34" width="18" height="12" rx="6" class="f"/>
    <rect x="56" y="34" width="18" height="12" rx="6"/>
    <rect x="72" y="34" width="18" height="12" rx="6"/>
    <circle cx="33" cy="40" r="2"/><circle cx="49" cy="40" r="2"/>
    <circle cx="65" cy="40" r="2"/><circle cx="81" cy="40" r="2"/>`,

  sprocket: `<circle cx="60" cy="40" r="22"/><circle cx="60" cy="40" r="8" class="f"/>
    <path d="M60 14v-6M60 72v-6M38 40h-6M88 40h-6M44 24l-4-4M80 60l-4-4M44 56l-4 4M80 20l-4 4"/>`,

  shock: `<circle cx="60" cy="16" r="5"/><circle cx="60" cy="64" r="5"/>
    <path d="M60 21v6"/><path d="M60 59v-6"/>
    <path d="M50 28h20l-20 6h20l-20 6h20l-20 6h20l-20 6h20" class="f"/>`,

  bearing: `<circle cx="60" cy="40" r="24"/><circle cx="60" cy="40" r="10"/>
    <circle cx="60" cy="23" r="4" class="f"/><circle cx="77" cy="40" r="4"/>
    <circle cx="60" cy="57" r="4"/><circle cx="43" cy="40" r="4"/>
    <circle cx="72" cy="28" r="4"/><circle cx="72" cy="52" r="4"/>
    <circle cx="48" cy="28" r="4"/><circle cx="48" cy="52" r="4"/>`,

  mirror: `<ellipse cx="66" cy="30" rx="20" ry="14"/>
    <ellipse cx="66" cy="30" rx="14" ry="9" class="f"/>
    <path d="M52 40l-12 18"/><path d="M34 58h14"/>`,

  cable: `<rect x="22" y="36" width="12" height="8" rx="2" class="f"/>
    <path d="M34 40c14 0 14-16 28-16s14 16 28 16"/>
    <rect x="86" y="36" width="12" height="8" rx="2"/>`,

  lever: `<path d="M30 34c22-4 44 0 60 8"/><path d="M30 42c22-4 44 0 60 8"/>
    <circle cx="30" cy="38" r="7" class="f"/>`,

  oil: `<path d="M52 16h16v8h-16z" class="f"/>
    <path d="M46 24h28a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H46a4 4 0 0 1-4-4V28a4 4 0 0 1 4-4z"/>
    <path d="M48 38h24v14H48z"/>`,

  helmet: `<path d="M60 14c16 0 28 12 28 28v10a8 8 0 0 1-8 8H62l-4 6H42a12 12 0 0 1-10-6c-2-4-3-9-3-14 0-17 13-32 31-32z"/>
    <path d="M50 32c10-4 22-3 30 4v12c-9 3-20 3-30 0z" class="f"/>
    <path d="M32 52h26"/>`,

  box: `<path d="M32 30h56v28H32z"/><path d="M32 30l8-8h40l8 8" class="f"/>
    <path d="M56 30v28M32 44h56"/>`,

  light: `<circle cx="60" cy="38" r="18"/><circle cx="60" cy="38" r="10" class="f"/>
    <path d="M60 12v-6M60 70v-6M34 38h-6M92 38h-6M42 20l-4-4M82 60l-4-4"/>`,

  panel: `<path d="M34 22h52l-8 36H42z"/><path d="M42 30h36" class="f"/>
    <path d="M46 58l-4 10h36l-4-10"/>`,

  switch: `<rect x="30" y="28" width="60" height="24" rx="4"/>
    <circle cx="46" cy="40" r="6" class="f"/><rect x="62" y="34" width="16" height="12" rx="2"/>`,

  screen: `<path d="M40 62c0-26 6-40 20-46 14 6 20 20 20 46z"/>
    <path d="M46 56c0-20 4-30 14-35 10 5 14 15 14 35z" class="f"/>
    <path d="M36 62h48"/>`,

  cover: `<path d="M26 56c6-22 16-34 34-34s28 12 34 34z"/>
    <path d="M26 56h68v8H26z" class="f"/>
    <path d="M44 26c4 10 4 22 2 30M76 26c-4 10-4 22-2 30"/>`,
};

/* group code (first 5 digits) -> drawing */
const ART_BY_GROUP = {
  "23100": "belt",     "22123": "roller",   "22535": "clutch",   "22401": "clutch",
  "06455": "pad",      "06430": "shoe",     "45530": "lever",    "53175": "lever",
  "15412": "oilfilter","17210": "airfilter","14401": "camchain", "14520": "camchain",
  "13101": "piston",   "14711": "piston",   "12191": "piston",   "91201": "bearing",
  "91051": "bearing",  "53210": "bearing",  "31500": "battery",  "31600": "switch",
  "31200": "switch",   "31120": "switch",   "30510": "plug",     "16700": "switch",
  "33100": "light",    "37200": "switch",   "38100": "light",    "35100": "switch",
  "35130": "switch",   "35070": "switch",   "51490": "shock",    "52400": "shock",
  "52100": "panel",    "50500": "panel",    "17910": "cable",    "43460": "cable",
  "44830": "cable",    "44711": "tyre",     "42711": "tyre",     "42753": "tube",
  "40530": "chain",    "06406": "sprocket", "08234": "oil",      "08232": "oil",
  "64300": "screen",   "64301": "panel",    "88110": "mirror",   "17620": "panel",
  "53165": "lever",
};

const ART_BY_CAT = {
  cvt: "belt", brake: "pad", engine: "piston", elec: "battery", tyre: "tyre",
  chassis: "shock", body: "panel", control: "cable", drive: "chain",
  fluid: "oil", acc: "helmet",
};

/* Keyword rules for parts whose number carries no group code.
   Word boundaries matter: an unanchored /rain/ matches "drain plug", which
   put a body panel on the oil strainer. Most specific rules first. */
const ART_BY_WORD = [
  [/\bhelmet\b/i, "helmet"],
  [/\btop box\b/i, "box"],
  [/\bstrainer\b|\boil filter\b/i, "oilfilter"],
  [/\bair (filter|cleaner)\b/i, "airfilter"],
  [/\bspark plug\b/i, "plug"],
  [/\bwindshield\b|\bvisor\b|\bscreen\b/i, "screen"],
  [/\brain suit\b|\bcover\b/i, "cover"],
  [/\btyre\b|\btube\b/i, "tyre"],
  [/\bvalve\b/i, "tube"],
  [/\bchain lubricant\b|\bcleaner\b/i, "oil"],
  [/\boil\b|\bcoolant\b|\bfluid\b/i, "oil"],
  [/\bled\b|\blight\b|\bsignal\b/i, "light"],
  [/\bmirror\b/i, "mirror"],
  [/\bgrip\b|\blever\b/i, "lever"],
  [/\balarm\b|\btracker\b|\busb\b|\bcharger\b|\bholder\b|\block\b/i, "switch"],
  [/\bbelt\b/i, "belt"],
  [/\bchain\b/i, "chain"],
  [/\bbearing\b/i, "bearing"],
];

function artFor(part) {
  const seg = String(part.oem).split("-");
  const group = seg.length === 3 && /^\d{5}$/.test(seg[0]) ? seg[0] : null;
  let key = group && ART_BY_GROUP[group];
  if (!key) {
    const hit = ART_BY_WORD.find(([re]) => re.test(part.name));
    key = hit ? hit[1] : ART_BY_CAT[part.cat] || "panel";
  }
  return ART[key] ? key : "panel";
}

/* A photo, when one exists, otherwise the drawing.
   The drawing stays in the DOM underneath: if the photo 404s or fails to
   decode, onerror drops back to it rather than leaving a blank panel. */
function artHTML(part) {
  const key = artFor(part);
  const svg = `<svg viewBox="0 0 120 80" role="img" aria-label="${part.name}, schematic">${ART[key]}</svg>`;
  const photo = part.img || (typeof IMAGES !== "undefined" && IMAGES[part.id]) || null;

  if (photo) {
    return `<div class="art has-photo" data-art="${key}">
      <img src="${photo}" alt="${part.name}" loading="lazy" decoding="async"
           onerror="this.closest('.art').classList.remove('has-photo'); this.remove();">
      ${svg}
    </div>`;
  }
  return `<div class="art" data-art="${key}">${svg}</div>`;
}
