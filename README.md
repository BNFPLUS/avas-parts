# avas.parts

Motorcycle spare parts catalogue and ordering site for the Maldives. Public browse for
customers, a counter mode for staff, and a part-number decoder that shows what
interchanges with what.

Static site — no build step, no server. `index.html`, `styles.css`, `app.js`, `data.js`.

```
node test.js     # dataset integrity (113 parts, 28 models, decoder coverage)
node qa.mjs      # drives the real page in Chromium, 28 checks + screenshots
```

---

## 1. The market

**The fleet is enormous relative to the population.** Greater Malé alone has about
**103,300 registered motorcycles** out of 119,093 vehicles — roughly one bike per adult.
The country registers 10,000+ new road vehicles a year and **about 90% of those are
motorcycles**. Over five years the government registered 69,780 vehicles, 42,000+ in Malé.

**Most of them are not roadworthy.** Only **21% of motorcycles** in the Malé area pass
roadworthiness. That number is the whole business case: 79% of a 100,000-bike fleet is
running on worn belts, glazed pads, dead batteries and bald tyres.

**The fleet is ASEAN-spec Honda, not Indian-spec.** This is the single most important
sourcing fact and it is easy to get wrong. The bikes sold here are the Vietnamese,
Indonesian and Thai market models — Air Blade, Scoopy, Vario, Click, PCX, ADV, Lead,
Wave — so parts come from Thailand, Vietnam and Indonesia on Honda ASEAN part numbers.
Indian-market Honda parts (Activa, Shine) mostly will not fit. Sourcing from India
because it is closer is the classic mistake.

**Current new-bike pricing** (LITUS Automobiles, MVR):

| Model | cc | Price |
|---|---|---|
| Scoopy Fashion 2026 | 110 | 60,000 |
| Scoopy Prestige / Stylish / Club12 2026 | 110 | 63,000 |
| Air Blade 125 Standard 2026 | 125 | 68,500 |
| Air Blade 125 Special 2026 | 125 | 69,500 |
| Air Blade 160 Standard 2026 | 160 | 71,000 |
| Air Blade 125 Sport 2026 | 125 | 73,000 |
| Air Blade 160 Special 2026 | 160 | 72,000 |
| Air Blade 160 Sport 2026 | 160 | 75,500 |
| Yamaha Aerox Alpha 155 | 155 | 74,400 |
| Yamaha NMAX 155 Neo S | 155 | 82,000 |
| PCX 160 ABS | 160 | 95,000 |
| PCX 160 Roadsync | 160 | 97,000 |
| ADV 160 2026 | 160 | 111,750 |

So the volume of the fleet sits in **110–160cc automatic scooters**, and that is where
your stock money belongs.

**Duty.** Maldives levies ad valorem duty on CIF value. Motorcycles and their components
were reduced from 200% to 100% — but the rate varies by HS line, and parts sit well below
whole vehicles. Confirm each HS code in the Maldives Customs tariff search
(customs.gov.mv/eServices/findtariff) before you commit to a shipment; the difference
between duty bands is the difference between a good margin and none. GST on general goods
is 8% and is built into the site's checkout.

---

## 2. Retailers and wholesalers already in the market

**Authorised distributors (your price ceiling and your fitment reference)**

| Business | Role | Where | Contact |
|---|---|---|---|
| **Sheesha Pvt Ltd** (Honda Maldives) | Sole authorised Honda distributor since Jan 1997. Largest motorcycle dealer in the country. | Malé (3S), Hulhumalé (2S), Hithadhoo/Addu (3S), Kulhudhuffushi (3S), Fuvahmulah (2S), Laamu (2S), Vilingili/Huvadhoo (2S), Thinadhoo (2S) | +960 334-6632 · info@sheesha.com.mv · honda.mv |
| **Alia Investments** (Yamaha Maldives) | Sole Yamaha distributor. Genuine parts across motorcycles, outboards, waverunners. | M. Alia Building, Gandhakoalhi Magu, Malé | +960 300-9797 / 333-6665 · Viber 791-1734 / 729-1734 · yamahamaldives.com |

Note how far Sheesha's branch network already reaches — Addu, Fuvahmulah, Kulhudhuffushi,
Thinadhoo, Laamu. You are not going to beat them on genuine-Honda availability in those
towns. You beat them on **range across brands, aftermarket price points, and delivery to
the islands they do not have a counter on.**

**Multi-brand dealers and parts retailers (your direct competitors)**

| Business | What they do | Where |
|---|---|---|
| **LITUS Automobiles** | Est. 2014. Largest multi-brand motorcycle dealer — Honda, Yamaha, Suzuki, electric. Sale, lease, service, genuine parts. Publishes live pricing. | Malé · litusautomobiles.com |
| **Motorize** | Motorcycle spare parts and accessories, plus car aftermarket. Has its own service centre. | Moon Shadow, Handhuvaree Higun, Maafanu, Malé · +960 999-2266 |
| **Motorhead MV** | Genuine and aftermarket motorcycle parts and accessories, competitive pricing. | Malé |
| **Lotus Bike Shop** | Bike shop and parts. | Aanuveli Buruzu Magu, Malé |
| **Kingston Showroom** | Motorcycle dealership. | M. Galholhu Villa, Malé · +960 331-3033 |
| **Auto Care** | Tyres for motorcycles and cars. | autocare.mv |
| **Auto Parts Galore** | Automotive spare parts and accessories. | Malé |
| **Motrade Pvt Ltd** | One of the larger general vehicle suppliers. | Malé |
| **iBay Maldives** | Classifieds marketplace — the de facto price reference for used and aftermarket parts. | ibay.com.mv |

**What this map tells you.** Everything is concentrated in Malé. Sheesha is the only
player with a real atoll counter network, and it is Honda-only. Nobody in the list above
is running a proper searchable online catalogue with fitment and interchange. **That gap
is the whole opportunity, and it is what this site is built for.**

---

## 3. Observed retail prices (iBay, MVR)

Real transacted price points, useful as your ceiling on aftermarket lines:

| Item | MVR |
|---|---|
| LED motorcycle headlight | 100 |
| Bar-end / cruiser mirror | 300 |
| Security alarm 12V | 300–350 |
| Exciter 150/155 auto tensioner | 350 |
| Exciter 150 / Y15ZR visor | 300 |
| LC135 / Wave 125 brake lever | 385 |
| LED turn signal set | 400 |
| AIRMEZ A201 Bluetooth GPS tracker | 499 |
| Seat cover | 500 |
| Full-face helmet | 550 |
| PCX160 windshield | 800 |
| Wave 125 swing arm | 1,200 |
| Air Blade LCD display | 1,200 |
| Wave 125 / Supra X RGB park light | 1,650 |

The catalogue's aftermarket lines are priced against these. Genuine OEM lines are priced
at an estimated landed cost plus a normal parts margin — the dataset averages **44.5%
gross margin**, which `node test.js` asserts stays in a plausible 30–65% band.

---

## 4. What to actually buy for opening stock

Ranked by turns, not by ticket price. A parts shop dies from cash tied up in slow stock.

**Tier 1 — buy deep, these pay the rent**
- Scooter engine oil 10W-30 MB (0.8 L and 1 L) — every bike, every 2,000–3,000 km
- Final drive gear oil 120 ml — every second oil service
- Spark plugs NGK CPR6EA-9 / CPR7EA-9 / CPR8EA-9 — the three cover almost the whole fleet
- Drive belts: `23100-K35-V01` (125cc), `23100-K36-J01` (150cc), `23100-K1Z-J11` (PCX160/ADV160), `23100-KVB-901` (Vario/Click 110), `23100-KVY-901` (Scoopy/Beat)
- CVT roller weight sets — always sold with the belt
- Front brake pads `06455-KVB-901` (110–125 fleet) and `06455-KRE-K02` (PCX family)
- Rear brake shoes `06430-KVB-900` and `06430-KWN-900`
- Battery GTZ6V `31500-KZR-602` — fits nearly the entire 110–125 Honda fleet
- Tyres 80/90-14, 90/90-14, 100/80-14
- Air filters and oil strainers for the top five models

**Tier 2 — carry a few**
- Battery GTZ7V (PCX160, NMAX, Aerox)
- Tyres 110/70-13, 130/70-13 (PCX / NMAX / Aerox)
- Fork oil seals — salt air makes these a steady mover here
- Wheel bearings 6301-2RS, clutch weight sets, cam chain tensioners
- Cables, levers, mirrors, horns, bulbs
- Body covers, seat covers, rain suits, helmets, phone mounts

**Tier 3 — order in, do not stock**
- Body panels and fairings (colour-coded — always read the colour code off the frame plate)
- Fuel pumps, stators, ECUs, LCD clusters, starter motors
- Full piston and valve sets

**Seasonal.** The May–November monsoon roughly doubles sell-through on rain suits, body
covers, tyres and brake parts. Buy that stock in April.

---

## 5. How the part finder works

Honda part numbers are three blocks — `23100-K36-J01`:

| Block | Meaning | Example |
|---|---|---|
| `23100` | **Group** — what the part *is* | Drive belt |
| `K36` | **Family** — which model line | PCX150 / Vario 150 / Click 150 |
| `J01` | **Variant** — revision | — |

Two parts sharing the first two blocks almost always interchange. The site turns this into
a working tool:

- **Segmented plate.** Every part number is displayed split into its three blocks with each
  block labelled, so staff and customers learn the system while using it.
- **Decoder.** 46 group codes and 19 family codes are mapped to plain English. `test.js`
  fails if any part number in the catalogue uses a code the decoder does not know.
- **"Same job, other model families."** For any part, the site lists every other number in
  the same group and which bikes each fits. This is the answer to *"this belt doesn't fit
  your bike — the one you want is `23100-K1Z-J11`."*
- **Alternates.** Supersessions and aftermarket equivalents (Bando, Aspira, Federal, TDR,
  IRC, FDR, Yuasa, NGK, Denso) are listed per part.
- **Search** matches part numbers with or without dashes, model names, categories, and
  plain language like "brake pad pcx".

**Verification status.** Of 113 lines: **26** OEM numbers are confirmed against published
parts sources, **29** are avas.parts shop codes for items with no manufacturer number
(helmets, tyres by size, consumables), and **58** are manufacturer-pattern numbers that are
supplier-cited or inferred from the numbering convention but **not confirmed**. Only those
58 carry the **"verify number before ordering"** flag — a shop code has nothing to verify. Confirm those against a frame number
before you pick and pack. Set `v: 1` in `data.js` as you confirm each one.

---

## 6. Running the shop from the site

**Counter mode** (the `Counter` toggle) switches to a dark skin and reveals landed cost,
gross margin, stock on hand, re-order point and bin location on every card. The skin change
is deliberate: a customer glancing at the screen can tell instantly whether they are looking
at a customer view, so cost prices never leak by accident.

**Orders** are collected in the browser and handed off to WhatsApp with a formatted order
including the line items, part numbers, delivery zone, GST and total. The order text is also
copied to the clipboard as a fallback.

**Delivery zones** and fees are defined in `data.js` → `ZONES`, from same-day in Malé
(MVR 50) to south atolls (MVR 300) and resorts (MVR 400).

---

## 7. Before you go live — things only you can set

1. **`SHOP.whatsapp` in `data.js`** is a placeholder (`9600000`). Put your real number in.
   Orders will not reach you until you do.
2. **Prices and stock** in `data.js` are researched estimates, not your actual buy prices.
   Replace `price`, `cost`, `stock`, `bin` and `rop` with real figures once you have
   supplier quotes.
3. **Payment.** The site currently hands off to WhatsApp. For card payment, BML runs the
   only 3D-secure gateway in the country; Ooredoo m-Faisaa and Dhiraagu Pay cover mobile
   wallets. There is an open-source PHP library (`aharen/Pay`) that wraps BML MPG, MIB and
   m-Faisaa if you want to take payment on-site later.
4. **Verify the 87 unconfirmed part numbers** against supplier catalogues as you place your
   first orders.

---

## 8. Images — read this before you trust them

Every part shows a **schematic line drawing**, not a photograph. There are 28 drawings
in `art.js`, matched to a part by its group code first (so a drive belt looks like a belt
whatever bike it fits), then by keyword, then by category.

**These are category illustrations, not pictures of the actual item.** Two different
brake pads get the same drawing. That is honest for a catalogue — it says "this is a
brake pad", not "this is what you will receive" — but it is not a substitute for real
photography.

**No manufacturer photography is used.** Supplier and OEM catalogue images are
copyrighted, so none were taken.

### Putting real photos in

Drop the files into `img/`, named after the part number, and run the importer:

```
img/23100-K36-J01.jpg      # part number
img/31500KZR602.jpg        # dashes optional
img/p005.webp              # part id also works

node import-images.js
```

That writes `images.js`, a plain `id -> path` map the page reads. `data.js` is never
touched, so re-running is safe and deleting an image brings its drawing back. Files that
match no part are listed so you can rename them.

A photo that 404s or fails to decode falls back to the schematic automatically — the
drawing stays in the DOM underneath and an `onerror` handler reveals it, so a bad path
never leaves an empty panel.

**On rights.** Only publish images you may publish. Selling into one country does not by
itself license manufacturer photography — the Maldives is a Berne Convention signatory, so
OEM catalogue images are protected there as elsewhere. If a distributor has given you
assets, or you are covered as an authorised reseller, that is a real basis. Photographs of
your own stock always are. Shoot the part on a plain background, square on; start with the
fast movers and let the drawings carry the long tail.

## 9. Deployment

Live at **https://bnfplus.github.io/avas-parts/** — GitHub Pages, served from the `site`
branch at root. Every push to `site` redeploys. `sh wait-live.sh` polls until Pages has
finished building.

### Putting it on avas.parts

The domain is already on Cloudflare nameservers (`opal`/`lloyd.ns.cloudflare.com`) but has
no address records. Add these in the Cloudflare dashboard for the `avas.parts` zone, all
with proxy **off** (grey cloud — GitHub terminates TLS itself, and an orange cloud breaks
certificate issuance):

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `bnfplus.github.io` |

Then run:

```sh
sh set-domain.sh          # writes CNAME, pushes, points Pages at avas.parts
```

Do it in that order. Setting the custom domain before DNS resolves makes GitHub redirect
the working github.io URL to a domain that does not answer, taking the site offline until
DNS catches up. HTTPS certificate issuance takes a few minutes after the domain verifies.

## Sources

Ministry of Transport / Maldives Bureau of Statistics vehicle registration data · Maldives
Customs Service tariff schedule · LITUS Automobiles · Honda Maldives (Sheesha Pvt Ltd) ·
Yamaha Maldives (Alia Investments) · iBay Maldives · bike-parts-honda.com · Yuminashi ·
published Honda and Yamaha parts catalogues.
