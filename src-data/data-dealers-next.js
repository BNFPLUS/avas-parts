// avas.parts DRAFT dealer-gap data (dealers-2026-11/gen_data_dealers.py). NOT live, not merged into data-next.js.
// Same part schema as hondamv/data-next.js (bike) and marine/data-marine.js (marine). All prices null + askPrice:true; ref prices only in notes.
// v:1 / confirmed:"verify" = number seen on a retailer/dealer page or nearest-model catalogue, not on the exact model's official fiche.
// NOTE: BRANDS in data-next.js is hard-coded to Honda/Yamaha/Suzuki; CFMoto and Keeway models need a site code change before they can show.
const DEALER_NEW_BRANDS = ["CFMoto", "Keeway"];
const DEALER_NEW_MARINE_BRANDS = ["Parsun"];
const DEALER_MODELS = [
 {
  "id": "yamaha-exciter155-vva-b5v",
  "brand": "Yamaha",
  "name": "Exciter 155 VVA (B5V / T155)",
  "market": "VN/TH/MV (ASEAN)",
  "generation": "2021+",
  "years": "2021–2026",
  "cc": 155,
  "seg": "manual",
  "catalogue_code": "B5V",
  "family_codes": [
   "B5V"
  ],
  "catalogue_url": "https://www.litusautomobiles.com/motorcycles/exciter-155-vva-standard-2026",
  "note": "Sold by LITUS (Standard MVR 83,900 / Premium 86,000) and Alia. Yamaha YPEC not used (terms forbid extraction). Most numbers verify.",
  "pop": 1,
  "status": "dealers-2026-11 draft: verify"
 },
 {
  "id": "yamaha-aerox-alpha155-std-id",
  "brand": "Yamaha",
  "name": "Aerox Alpha 155 (Standard)",
  "market": "ID",
  "generation": "2024+",
  "years": "2024–2026",
  "cc": 155,
  "seg": "auto",
  "catalogue_code": "",
  "family_codes": [
   "B8R",
   "B6H"
  ],
  "catalogue_url": "https://www.litusautomobiles.com/motorcycles/aerox-alpha-155-standard",
  "note": "Sold by LITUS (MVR 74,400). Numbers from authorised Indonesian Yamaha dealer articles; verify against Alia.",
  "pop": 1,
  "status": "dealers-2026-11 draft: verify"
 },
 {
  "id": "cfmoto-150sc-cf150t-31-2025",
  "brand": "CFMoto",
  "name": "CFMoto 150SC (CF150T-31)",
  "market": "AU fiche",
  "generation": "2024+",
  "years": "2024–2026",
  "cc": 149,
  "seg": "auto",
  "catalogue_code": "CF150T-31",
  "family_codes": [],
  "catalogue_url": "https://parts.carrbrothers.com.au/",
  "note": "Sold by MotoX (MVR 69,120). Fiche = Australian CFMoto dealer partFinder.",
  "pop": 1,
  "status": "dealers-2026-11 draft: sourced"
 },
 {
  "id": "cfmoto-300sr-cf300-3-my22",
  "brand": "CFMoto",
  "name": "CFMoto 300SR (CF300-3F)",
  "market": "AU fiche",
  "generation": "MY22+",
  "years": "2022–2026",
  "cc": 292,
  "seg": "sport",
  "catalogue_code": "CF300-3F",
  "family_codes": [],
  "catalogue_url": "https://parts.carrbrothers.com.au/",
  "note": "Sold by MotoX (MVR 120,000; MotoX quotes 298 cc). AU fiche has frame diagrams only; engine service parts from other public sources.",
  "pop": 1,
  "status": "dealers-2026-11 draft: sourced"
 },
 {
  "id": "keeway-vieste-300-xdv-e5",
  "brand": "Keeway",
  "name": "Keeway Vieste 300 XDV (Euro 5)",
  "market": "HU fiche",
  "generation": "Euro 5",
  "years": "2021–2026",
  "cc": 278,
  "seg": "auto",
  "catalogue_code": "",
  "family_codes": [],
  "catalogue_url": "https://alkatresz.keeway.hu/",
  "note": "Sold by MotoX (MVR 100,000). Official Keeway Hungary catalogue; Asian spec may differ.",
  "pop": 1,
  "status": "dealers-2026-11 draft: sourced"
 },
 {
  "id": "honda-wave100-autocare",
  "brand": "Honda",
  "name": "Wave 100 (Auto Care numbers)",
  "market": "?",
  "generation": "?",
  "years": "?",
  "cc": 100,
  "seg": "manual",
  "catalogue_code": "KRS/KTL",
  "family_codes": [
   "KRS",
   "KTL"
  ],
  "catalogue_url": "https://autocare.mv",
  "note": "Only Auto Care retailer numbers; no fiche checked.",
  "pop": 1,
  "status": "dealers-2026-11 draft: verify"
 },
 {
  "id": "honda-dream-autocare",
  "brand": "Honda",
  "name": "Dream (Auto Care numbers)",
  "market": "?",
  "generation": "?",
  "years": "?",
  "cc": 100,
  "seg": "manual",
  "catalogue_code": "GN5",
  "family_codes": [
   "GN5"
  ],
  "catalogue_url": "https://autocare.mv",
  "note": "Only Auto Care retailer numbers.",
  "pop": 1,
  "status": "dealers-2026-11 draft: verify"
 },
 {
  "id": "honda-click-autocare",
  "brand": "Honda",
  "name": "Click 110i (Auto Care numbers)",
  "market": "TH/VN",
  "generation": "?",
  "years": "?",
  "cc": 110,
  "seg": "auto",
  "catalogue_code": "KVB",
  "family_codes": [
   "KVB"
  ],
  "catalogue_url": "https://autocare.mv",
  "note": "Only Auto Care retailer numbers.",
  "pop": 1,
  "status": "dealers-2026-11 draft: verify"
 },
 {
  "id": "honda-moove-autocare",
  "brand": "Honda",
  "name": "Moove (Auto Care numbers)",
  "market": "TH",
  "generation": "?",
  "years": "?",
  "cc": 110,
  "seg": "auto",
  "catalogue_code": "K44",
  "family_codes": [
   "K44",
   "GGC"
  ],
  "catalogue_url": "https://autocare.mv",
  "note": "Only Auto Care retailer numbers.",
  "pop": 1,
  "status": "dealers-2026-11 draft: verify"
 },
 {
  "id": "yamaha-nmax-turbo155-gpd155d",
  "brand": "Yamaha",
  "name": "NMAX Turbo 155",
  "market": "MV/ID (ASEAN)",
  "generation": "2024+",
  "years": "2024–2026",
  "cc": 155,
  "seg": "auto",
  "catalogue_code": "GPD155D-F",
  "family_codes": [
   "B9Y"
  ],
  "note": "Yamaha Maldives current range. Service numbers to be checked against the frame number.",
  "pop": 4,
  "status": "yamaha-maldives-2026 preview: verify"
 },
 {
  "id": "yamaha-mx-king150-2pv",
  "brand": "Yamaha",
  "name": "MX King 150",
  "market": "MV/ID (ASEAN)",
  "generation": "2PV",
  "years": "2015–2026",
  "cc": 150,
  "seg": "underbone",
  "catalogue_code": "2PV",
  "family_codes": [
   "2PV"
  ],
  "note": "Yamaha Maldives current range. Service numbers to be checked against the frame number.",
  "pop": 3,
  "status": "yamaha-maldives-2026 preview: verify"
 },
 {
  "id": "yamaha-gear-ultima125",
  "brand": "Yamaha",
  "name": "Gear Ultima 125",
  "market": "MV/ID (ASEAN)",
  "generation": "2025+",
  "years": "2025–2026",
  "cc": 125,
  "seg": "auto",
  "catalogue_code": "LCP125",
  "family_codes": [
   "B3Y",
   "B5D"
  ],
  "note": "Yamaha Maldives current range. Service numbers to be checked against the frame number.",
  "pop": 3,
  "status": "yamaha-maldives-2026 preview: verify"
 },
 {
  "id": "yamaha-fazzio125",
  "brand": "Yamaha",
  "name": "Fazzio 125",
  "market": "MV/ID (ASEAN)",
  "generation": "2022+",
  "years": "2022–2026",
  "cc": 125,
  "seg": "auto",
  "catalogue_code": "LCF125",
  "family_codes": [
   "B8B",
   "BKF",
   "B3Y",
   "BEJ"
  ],
  "note": "Yamaha Maldives current range. Service numbers to be checked against the frame number.",
  "pop": 3,
  "status": "yamaha-maldives-2026 preview: verify"
 },
 {
  "id": "yamaha-grand-filano125",
  "brand": "Yamaha",
  "name": "Grand Filano Hybrid 125",
  "market": "MV/ID (ASEAN)",
  "generation": "2018+",
  "years": "2018–2026",
  "cc": 125,
  "seg": "auto",
  "catalogue_code": "LTF125-F",
  "family_codes": [
   "B8B",
   "B3Y",
   "BEJ"
  ],
  "note": "Yamaha Maldives current range. Service numbers to be checked against the frame number.",
  "pop": 3,
  "status": "yamaha-maldives-2026 preview: verify"
 },
 {
  "id": "yamaha-freego125",
  "brand": "Yamaha",
  "name": "Freego 125 Connected",
  "market": "MV/ID (ASEAN)",
  "generation": "2019+",
  "years": "2019–2026",
  "cc": 125,
  "seg": "auto",
  "catalogue_code": "LTK125",
  "family_codes": [
   "B5D",
   "2PH"
  ],
  "note": "Yamaha Maldives current range. Service numbers to be checked against the frame number.",
  "pop": 3,
  "status": "yamaha-maldives-2026 preview: verify",
  "notice": "Freego batteries differ by variant: the Freego 125 Connected takes a YTZ6V, some other Freego versions take a YTZ4V. Send your frame number and we will check which one your bike needs."
 }
];
const DEALER_PARTS = [
 {
  "id": "d0001",
  "cat": "engine",
  "name": "Cylinder / head gasket (Cylinder Seal Gasket)",
  "oem": "L-120050115-0001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 16.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "CYLINDER SEAL GASKET",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e06-body-set-cylinder",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e06-body-set-cylinder"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0002",
  "cat": "engine",
  "name": "Cylinder / head gasket (Cylinder Seal Gasket)",
  "oem": "L-120150259-0001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 9.50 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "CYLINDER SEAL GASKET",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e07-cylinder-head",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e07-cylinder-head"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0003",
  "cat": "engine",
  "name": "Spark plug (Spark Plug Ngk Cpr8Ea9)",
  "oem": "L-270960060-0001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 79.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "SPARK PLUG NGK CPR8EA9",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e07-cylinder-head",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e07-cylinder-head"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0004",
  "cat": "engine",
  "name": "Cam chain (Timing Chain)",
  "oem": "L-140610018-0001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 87.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "TIMING CHAIN",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e08-camshaft",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e08-camshaft"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0005",
  "cat": "cvt",
  "name": "Drive belt (Belt)",
  "oem": "L-193000036-0001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 135.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "BELT",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e11-clutch-kit",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e11-clutch-kit"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0006",
  "cat": "cvt",
  "name": "Variator roller (Roller)",
  "oem": "L-192840016-0001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 12.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "ROLLER",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e11-clutch-kit",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e11-clutch-kit"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0007",
  "cat": "engine",
  "name": "Oil filter",
  "oem": "L-150290001-0001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 2.70 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "OIL FILTER",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e12-oil-pump",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e12-oil-pump"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0008",
  "cat": "engine",
  "name": "Thermostat (Thermostat Assy)",
  "oem": "L-160110056-0001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 93.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "THERMOSTAT ASSY",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e13-cooling-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/e13-cooling-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0009",
  "cat": "elec",
  "name": "Ignition coil (Ignition Coil Assy)",
  "oem": "8AJV-003100-1001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 42.50 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "IGNITION COIL ASSY",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f00-ignition-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f00-ignition-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0010",
  "cat": "tyre",
  "name": "Tyre",
  "oem": "30705-1404",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 145.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "TYRE",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f07-front-wheel",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f07-front-wheel"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0011",
  "cat": "brake",
  "name": "Brake disc (Front Brake Disc Assy)",
  "oem": "8AJV-080010-1000",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 64.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "FRONT BRAKE DISC ASSY",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f07-front-wheel",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f07-front-wheel"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0012",
  "cat": "control",
  "name": "Lever (Brake Lever)",
  "oem": "8AJV-080140-1000-28",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 29.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "BRAKE LEVER",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f08-brake-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f08-brake-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0013",
  "cat": "brake",
  "name": "Brake pads (Brake Pad Assy)",
  "oem": "8AJV-0812A0",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 49.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "BRAKE PAD ASSY",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f08-brake-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f08-brake-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0014",
  "cat": "control",
  "name": "Lever (Brake Lever)",
  "oem": "8AJV-080240-1000-28",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 29.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "BRAKE LEVER",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f08-brake-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f08-brake-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0015",
  "cat": "brake",
  "name": "Brake pads (Brake Pad Assy)",
  "oem": "8AJV-0814A0",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 59.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "BRAKE PAD ASSY",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f08-brake-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f08-brake-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0016",
  "cat": "control",
  "name": "Throttle cable",
  "oem": "8AJV-100400-1001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 33.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "THROTTLE CABLE",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f10-steering-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f10-steering-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0017",
  "cat": "control",
  "name": "Throttle cable (Adjustable Throttle Cable)",
  "oem": "8AJV-100500-1001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 33.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "ADJUSTABLE THROTTLE CABLE",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f10-steering-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f10-steering-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0018",
  "cat": "tyre",
  "name": "Tyre",
  "oem": "30705-1302",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 185.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "TYRE",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f11-rear-wheel",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f11-rear-wheel"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0019",
  "cat": "elec",
  "name": "Battery",
  "oem": "6SMV-151600-1001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 405.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "BATTERY",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0020",
  "cat": "elec",
  "name": "Fuse (5A Fuse 5A)",
  "oem": "8010-151301",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 1.40 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "5A FUSE 5A",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0021",
  "cat": "elec",
  "name": "Fuse (10A Fuse 10A)",
  "oem": "806A-151302",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025",
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 1.40 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "10A FUSE 10A",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f15-electric-system",
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0022",
  "cat": "elec",
  "name": "Fuse (15A Fuse 15A)",
  "oem": "806A-151305",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025",
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 1.40 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "15A FUSE 15A",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f15-electric-system",
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0023",
  "cat": "elec",
  "name": "Fuse (25A Fuse)",
  "oem": "806A-151307",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 1.40 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "25A FUSE",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0024",
  "cat": "elec",
  "name": "Fuse (30A Fuse)",
  "oem": "806A-151308",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 2.70 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "30A FUSE",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f15-v2-electric-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0025",
  "cat": "engine",
  "name": "Air filter element (Air Filter Element Assy)",
  "oem": "0UJV-112000-1000",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-150sc-cf150t-31-2025"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 17.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 150SC CF150T-31 2025",
  "catalogue_name": "AIR FILTER ELEMENT ASSY",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f41-air-filter",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2025/150sc-cf150t-31/f41-air-filter"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0026",
  "cat": "tyre",
  "name": "Tyre (Front Tyre)",
  "oem": "30705-1723",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 320.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "FRONT TYRE",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f07-front-wheel",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f07-front-wheel"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0027",
  "cat": "brake",
  "name": "Brake disc (Rear Brake Disc)",
  "oem": "6KJ0-080002-10000",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 62.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "REAR BRAKE DISC",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f08-a-mab-brake-assyiabs-uaesi",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f08-a-mab-brake-assyiabs-uaesi"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0028",
  "cat": "brake",
  "name": "Brake disc (Front Brake Disc)",
  "oem": "6KJ0-080001-20000",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 82.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "FRONT BRAKE DISC",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f08-a-mab-brake-assyiabs-uaesi",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f08-a-mab-brake-assyiabs-uaesi"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0029",
  "cat": "brake",
  "name": "Brake pads (Front Brake Pad Assy)",
  "oem": "6KM0-0812B0",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 25.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "FRONT BRAKE PAD ASSY",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f08-a-mab-brake-assyiabs-uaesi",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f08-a-mab-brake-assyiabs-uaesi"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0030",
  "cat": "brake",
  "name": "Brake pads (Rear Brake Pad Comp)",
  "oem": "6KM0-0911A0",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 25.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "REAR BRAKE PAD COMP",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f08-a-mab-brake-assyiabs-uaesi",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f08-a-mab-brake-assyiabs-uaesi"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0031",
  "cat": "control",
  "name": "Clutch cable",
  "oem": "6KM#-100400-8001",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 64.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "CLUTCH CABLE",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f10-b-steering-systemidouble-throttle-cablei",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f10-b-steering-systemidouble-throttle-cablei"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0032",
  "cat": "tyre",
  "name": "Tyre (Rear Tyre)",
  "oem": "30705-1724",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 440.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "REAR TYRE",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f11-rear-wheel",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f11-rear-wheel"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0033",
  "cat": "drive",
  "name": "Drive chain (Chain Choho 520Hx 104L)",
  "oem": "3120918",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 130.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "CHAIN CHOHO 520HX 104L",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f11-rear-wheel",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f11-rear-wheel"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0034",
  "cat": "drive",
  "name": "Sprocket (Rear Sprocket)",
  "oem": "6KN0-110007-10000",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 88.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "REAR SPROCKET",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f11-rear-wheel",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f11-rear-wheel"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0035",
  "cat": "elec",
  "name": "Regulator / rectifier (Regulator)",
  "oem": "6KJC-177000-8000",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 62.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "REGULATOR",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f15-electric-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f15-electric-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0036",
  "cat": "elec",
  "name": "Starter relay (Relay, Starter)",
  "oem": "6KJ0-150500",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 76.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "RELAY, STARTER",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f15-electric-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f15-electric-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0037",
  "cat": "elec",
  "name": "Battery",
  "oem": "6KMV-151600-M000-M1",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 120.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "BATTERY",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f15-electric-system",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f15-electric-system"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0038",
  "cat": "body",
  "name": "Mirror (Rh Rear View Mirror Assy)",
  "oem": "6KM#-200400-8002",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 115.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "RH REAR VIEW MIRROR ASSY",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f20-v2-tools",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f20-v2-tools"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0039",
  "cat": "body",
  "name": "Mirror (Lh Rear View Mirror Assy)",
  "oem": "6KM#-200300-8002",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 115.00 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "LH REAR VIEW MIRROR ASSY",
  "priority": "B",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f20-v2-tools",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f20-v2-tools"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0040",
  "cat": "engine",
  "name": "Air filter element",
  "oem": "0DM0-110100",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = Australian dealer retail (Carr Brothers fiche), not MVR; ref price 25.10 AUD; catalogue: Carr Brothers Motorcycles (AU) CFMoto partFinder fiche 300SR MY22 CF300-3F (2023)",
  "catalogue_name": "AIR FILTER ELEMENT",
  "priority": "A",
  "source_url": "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f41-air-filter",
  "sources": [
   "https://parts.carrbrothersmotorcycles.com.au/partFinder/fiche/cf-moto/2023/300sr-my22-cf300-3f/f41-air-filter"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0041",
  "cat": "engine",
  "name": "Spark plug",
  "oem": "0700-170200",
  "v": 0,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "EU CFMoto parts retailer; compatibility list includes 300SR CF300-3F EU5 2021-2023 and CF300-5F/5H; ref price 97 RON; catalogue: retailer compatibility list",
  "catalogue_name": "SPARK PLUG",
  "priority": "A",
  "source_url": "https://atvmotoshop.com/en/oils-chemicals-spark-plug/448777-spark-pluc-motorcycle-cfmoto.html",
  "sources": [
   "https://atvmotoshop.com/en/oils-chemicals-spark-plug/448777-spark-pluc-motorcycle-cfmoto.html"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0042",
  "cat": "engine",
  "name": "Oil filter assy",
  "oem": "0DM0-013200",
  "v": 1,
  "alts": [],
  "fits": [
   "cfmoto-300sr-cf300-3-my22"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: CFMOTO Canada official parts store lists fit 300NK, 300SS (same 292cc engine family as 300SR); 300SR fit not stated; ref price 54.42 CAD; catalogue: CFMOTO Canada parts store",
  "catalogue_name": "OIL FILTER ASSY, ENGINE",
  "priority": "A",
  "source_url": "https://cfmoto.ca/en/oil-filter-assy-engine-0dm0-013200",
  "sources": [
   "https://cfmoto.ca/en/oil-filter-assy-engine-0dm0-013200"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0043",
  "cat": "drive",
  "name": "Gear Comp 45 Teeth Click-I, Scoopy-I, Zoomer-X",
  "oem": "23430-KVB-900",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-click-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"Low Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 480.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/gear-comp-45-teeth-click-i-scoopy-i-zoomer-xno23430-kvb",
  "sources": [
   "https://autocare.mv/product/gear-comp-45-teeth-click-i-scoopy-i-zoomer-xno23430-kvb"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0044",
  "cat": "chassis",
  "name": "Nut special 30MM Airblade-I, Click- I",
  "oem": "90202-KN7-670",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-click-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"Low Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 25.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/nut-special-30mm-airblade-i-click-ino-90202-kn7-670",
  "sources": [
   "https://autocare.mv/product/nut-special-30mm-airblade-i-click-ino-90202-kn7-670"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0045",
  "cat": "control",
  "name": "Speedometer Cable Airblade And Click 110 i",
  "oem": "44830-KVB-T00",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-click-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"In Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 120.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/speedometer-cable-airbladeno44830-kvb-t00",
  "sources": [
   "https://autocare.mv/product/speedometer-cable-airbladeno44830-kvb-t00"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0046",
  "cat": "engine",
  "name": "Piston Honda Dream",
  "oem": "13101-GN5-505",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-dream-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"Low Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 200.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/piston-honda-dreamno13101-gn5-505",
  "sources": [
   "https://autocare.mv/product/piston-honda-dreamno13101-gn5-505"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0047",
  "cat": "engine",
  "name": "Gasket, Cylinder Head Zoomer-X,Moove, Scoopy -I",
  "oem": "12251-GGC-901",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-moove-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"In Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 45.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/gasket-cylinder-head-zoomer-xmoove-scoopy-ino12251-ggc-",
  "sources": [
   "https://autocare.mv/product/gasket-cylinder-head-zoomer-xmoove-scoopy-ino12251-ggc-"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0048",
  "cat": "engine",
  "name": "Piston Moove, zoomer-x",
  "oem": "13101-K44-V00",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-moove-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"In Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 250.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/piston-mooveno13101-k44-v00",
  "sources": [
   "https://autocare.mv/product/piston-mooveno13101-k44-v00"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0049",
  "cat": "engine",
  "name": "Ringset Moove",
  "oem": "13011-K44-V00",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-moove-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"In Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 185.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/ringset-mooveno13011-k44-v00",
  "sources": [
   "https://autocare.mv/product/ringset-mooveno13011-k44-v00"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0050",
  "cat": "drive",
  "name": "Shaft Drive Moove, Scoopy-I, Zoomer-X",
  "oem": "23411-KZL-930",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-moove-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"Low Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 160.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/shaft-drive-moove-scoopy-i-zoomer-xno23411-kzl-930",
  "sources": [
   "https://autocare.mv/product/shaft-drive-moove-scoopy-i-zoomer-xno23411-kzl-930"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0051",
  "cat": "engine",
  "name": "Bolt Oil Wave 100",
  "oem": "90145-KRS-T00",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-wave100-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"Low Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 35.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/bolt-oil-wave-100no90145-krs-t00",
  "sources": [
   "https://autocare.mv/product/bolt-oil-wave-100no90145-krs-t00"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0052",
  "cat": "chassis",
  "name": "Front Shock Pipe Wave 100",
  "oem": "51410-KRS-971",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-wave100-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"In Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 240.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/front-shock-pipe-wave-100-no51410-krs-971",
  "sources": [
   "https://autocare.mv/product/front-shock-pipe-wave-100-no51410-krs-971"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0053",
  "cat": "engine",
  "name": "Piston Wave 100",
  "oem": "13101-KTL-850",
  "v": 1,
  "alts": [],
  "fits": [
   "honda-wave100-autocare"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Auto Care (Maldives) retail price and stock \"In Stock\" on 22 Nov 2026; number as published by retailer, not checked against a Honda fiche; ref price 310.00 MVR; catalogue: autocare.mv retailer listing",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://autocare.mv/product/piston-wave-100no13101-ktl-850",
  "sources": [
   "https://autocare.mv/product/piston-wave-100no13101-ktl-850"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0054",
  "cat": "engine",
  "name": "Oil strainer / screen",
  "oem": "P0130610710000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 1856 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "SZŰRŐ",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/blokkfelek",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/blokkfelek"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0055",
  "cat": "elec",
  "name": "Regulator / rectifier",
  "oem": "P0133790250000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 35468 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "FESZÜLTSÉGSZABÁLYZÓ",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elektromos-alkatreszek-fojtoszelep",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elektromos-alkatreszek-fojtoszelep"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0056",
  "cat": "elec",
  "name": "Battery 12V 10Ah",
  "oem": "P0133795500000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail (nem rendelhető); catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "AKKUMULÁTOR 12V/10AH",
  "priority": "A",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elektromos-alkatreszek-fojtoszelep",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elektromos-alkatreszek-fojtoszelep"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0057",
  "cat": "elec",
  "name": "Ignition coil",
  "oem": "P0133780410000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 7138 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "GYÚJTÓTRAFÓ",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elektromos-alkatreszek-fojtoszelep",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elektromos-alkatreszek-fojtoszelep"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0058",
  "cat": "elec",
  "name": "Starter relay",
  "oem": "P0133785110000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 2957 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "INDÍTÓRELÉ",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elektromos-alkatreszek-fojtoszelep",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elektromos-alkatreszek-fojtoszelep"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0059",
  "cat": "brake",
  "name": "Brake disc, front",
  "oem": "P0135410540000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 10070 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "FÉKTÁRCSA ELSŐ 240mm",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-kerek",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-kerek"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0060",
  "cat": "tyre",
  "name": "Tyre",
  "oem": "P0135026520000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail (nem rendelhető); catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "KÜLSŐ GUMI",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-kerek",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-kerek"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0061",
  "cat": "cvt",
  "name": "Drive belt",
  "oem": "P0130900810000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 82499 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "MEGHAJTÓSZÍJ",
  "priority": "A",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-variator-meghajtoszij",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-variator-meghajtoszij"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0062",
  "cat": "cvt",
  "name": "Variator slider",
  "oem": "P0130731320000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 1064 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "CSÚSZÓSZILENT",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-variator-meghajtoszij",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-variator-meghajtoszij"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0063",
  "cat": "cvt",
  "name": "Variator roller",
  "oem": "P0130700470000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 1073 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "GÖRGŐ/DB 13.8g",
  "priority": "A",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-variator-meghajtoszij",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-variator-meghajtoszij"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0064",
  "cat": "cvt",
  "name": "Variator roller",
  "oem": "P0130700700000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 7840 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "GÖRGŐSZORÍTÓ LEMEZ",
  "priority": "A",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-variator-meghajtoszij",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/elso-variator-meghajtoszij"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0065",
  "cat": "brake",
  "name": "Brake pads, front",
  "oem": "P0135472520000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 15544 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "FÉKBETÉT/PÁR ELSŐ",
  "priority": "A",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/fekrendszer",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/fekrendszer"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0066",
  "cat": "brake",
  "name": "Brake pads, rear",
  "oem": "P0135472530000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 13708 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "FÉKBETÉT/PÁR HÁTSÓ",
  "priority": "A",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/fekrendszer",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/fekrendszer"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0067",
  "cat": "control",
  "name": "Brake lever, right",
  "oem": "P0135473630000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 9489 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "FÉKKAR JOBB",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/fekrendszer",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/fekrendszer"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0068",
  "cat": "control",
  "name": "Brake lever, left",
  "oem": "P0135473620000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 9487 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "FÉKKAR BAL",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/fekrendszer",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/fekrendszer"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0069",
  "cat": "brake",
  "name": "Brake disc, rear",
  "oem": "P0135410560000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 9578 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "FÉKTÁRCSA HÁTSÓ 220mm",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hatso-kerek-hatso-sarvedo",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hatso-kerek-hatso-sarvedo"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0070",
  "cat": "tyre",
  "name": "Tyre",
  "oem": "P0135026530000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail (nem rendelhető); catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "KÜLSŐ GUMI",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hatso-kerek-hatso-sarvedo",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hatso-kerek-hatso-sarvedo"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0071",
  "cat": "cvt",
  "name": "Final drive cover gasket",
  "oem": "P0131601590000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 3883 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "KIHAJTÁSFEDÉL TÖMÍTÉS",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hatso-kihajtas",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hatso-kihajtas"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0072",
  "cat": "engine",
  "name": "Cylinder base gasket",
  "oem": "P0131601570000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 1237 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "HENGERTALP TÖMÍTÉS",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/henger-dugattyu",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/henger-dugattyu"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0073",
  "cat": "engine",
  "name": "Thermostat",
  "oem": "P0130420190000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 4977 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "TERMOSZTÁT",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hengerfej-termosztat",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hengerfej-termosztat"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0074",
  "cat": "engine",
  "name": "Cylinder head gasket",
  "oem": "P0131601640000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 4352 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "HENGERFEJ TÖMÍTÉS",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hengerfej-termosztat",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/hengerfej-termosztat"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0075",
  "cat": "control",
  "name": "Throttle cable A",
  "oem": "P0134800740000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 2064 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "GÁZBOWDEN A",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/kormany-gazbowden-kormanykapcsolo",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/kormany-gazbowden-kormanykapcsolo"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0076",
  "cat": "control",
  "name": "Throttle cable B",
  "oem": "P0134800730000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 2064 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "GÁZBOWDEN B",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/kormany-gazbowden-kormanykapcsolo",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/kormany-gazbowden-kormanykapcsolo"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0077",
  "cat": "engine",
  "name": "Air filter element",
  "oem": "P0131531050000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 2833 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "LÉGSZŰRŐBETÉT",
  "priority": "A",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/legszuro",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/legszuro"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0078",
  "cat": "chassis",
  "name": "Rear shock absorber",
  "oem": "P0135121510000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 108287 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "LENGÉSCSILLAPÍTÓ",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/lengescsillapito",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/lengescsillapito"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0079",
  "cat": "engine",
  "name": "Generator cover gasket",
  "oem": "P0131601610000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 1950 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "GENERÁTORFEDÉL TÖMÍTÉS",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/olajszuro-generatorfedel-vizpumpa",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/olajszuro-generatorfedel-vizpumpa"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0080",
  "cat": "engine",
  "name": "Oil strainer / screen",
  "oem": "P0130520700000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 3009 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "SZŰRŐ",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/olajszuro-generatorfedel-vizpumpa",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/olajszuro-generatorfedel-vizpumpa"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0081",
  "cat": "engine",
  "name": "Oil filter element",
  "oem": "P0130520660000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 10852 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "OLAJSZŰRŐ BETÉT",
  "priority": "A",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/olajszuro-generatorfedel-vizpumpa",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/olajszuro-generatorfedel-vizpumpa"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0082",
  "cat": "body",
  "name": "Mirror",
  "oem": "P0135611640000",
  "v": 0,
  "alts": [],
  "fits": [
   "keeway-vieste-300-xdv-e5"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "name translated from Hungarian; ref price = Keeway Hungary retail; ref price 6599 HUF; catalogue: alkatresz.keeway.hu official Keeway Hungary parts catalogue: Vieste 300 XDV Euro 5 (nearest public catalogue to MotoX Vieste 300 XDV; verify Euro 5 vs Asian spec)",
  "catalogue_name": "TÜKÖR/PÁR",
  "priority": "B",
  "source_url": "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/tukor",
  "sources": [
   "https://alkatresz.keeway.hu/vieste-300-xdv-euro-5/tukor"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0083",
  "cat": "cvt",
  "name": "V-belt",
  "oem": "B8R-E7641-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-aerox-alpha155-std-id"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: authorised Yamaha dealer (BRM, Indonesia) quoting Yamaha data: B8R-E7641-00 for Aerox Alpha Standard/CyberCity (Turbo uses B9Y-E7641-00); supersedes B65-E7641-00; ref price 145000 IDR; catalogue: Yamaha BRM dealer article",
  "catalogue_name": "V-BELT",
  "priority": "A",
  "source_url": "https://www.yamahabrm.co.id/news/v-belt-aerox-155-alpha-turbo-kode-asli",
  "sources": [
   "https://www.yamahabrm.co.id/news/v-belt-aerox-155-alpha-turbo-kode-asli"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0084",
  "cat": "brake",
  "name": "Brake pad kit, front",
  "oem": "B63-F5805-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-aerox-alpha155-std-id"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: dealer article: same front pad on Aerox 155 VVA and Aerox Alpha; ref price 80000 IDR; catalogue: Yamaha BRM dealer article",
  "catalogue_name": "BRAKE PAD KIT",
  "priority": "A",
  "source_url": "https://www.yamahabrm.co.id/news/kampas-rem-belakang-aerox-tromol-cakram-kode-harga",
  "sources": [
   "https://www.yamahabrm.co.id/news/kampas-rem-belakang-aerox-tromol-cakram-kode-harga"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0085",
  "cat": "brake",
  "name": "Brake pad kit, rear (disc)",
  "oem": "B6H-F5805-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-aerox-alpha155-std-id"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: dealer article: Aerox Alpha Standard/CyberCity/Turbo rear disc pad; ref price 80000 IDR; catalogue: Yamaha BRM dealer article",
  "catalogue_name": "BRAKE PAD KIT",
  "priority": "A",
  "source_url": "https://www.yamahabrm.co.id/news/kampas-rem-belakang-aerox-tromol-cakram-kode-harga",
  "sources": [
   "https://www.yamahabrm.co.id/news/kampas-rem-belakang-aerox-tromol-cakram-kode-harga"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0086",
  "cat": "elec",
  "name": "Battery YTZ6V",
  "oem": "BN1-H2100-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-aerox-alpha155-std-id"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: dealer article: YTZ6V for Aerox Alpha Standard and CyberCity (Turbo: YTZ7V 2DP-H2100-31); ref price 305500 IDR; catalogue: Yamaha BRM dealer article",
  "catalogue_name": "BATTERY",
  "priority": "A",
  "source_url": "https://www.yamahabrm.co.id/news/aki-aerox-alpha-tipe-ytz6v-ytz7v-per-varian",
  "sources": [
   "https://www.yamahabrm.co.id/news/aki-aerox-alpha-tipe-ytz6v-ytz7v-per-varian"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0087",
  "cat": "engine",
  "name": "Air filter element",
  "oem": "B6H-E4451-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-aerox-alpha155-std-id"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Indonesian Yamaha dealer lists for NMAX New / Aerox New Connected; fit on Aerox Alpha not confirmed; ref price 59000 IDR; catalogue: TM Motor Group dealer listing",
  "catalogue_name": "ELEMENT, AIR CLEANER",
  "priority": "A",
  "source_url": "https://www.tmmotorgroup.com/produk?slug=element-air-cleaner-b6h1-567",
  "sources": [
   "https://www.tmmotorgroup.com/produk?slug=element-air-cleaner-b6h1-567"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0088",
  "cat": "cvt",
  "name": "Roller weight set",
  "oem": "B65-WE763-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-aerox-alpha155-std-id"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: dealer lists for Aerox 155 (Connected, ABS, All New); fit on Aerox Alpha not confirmed; catalogue: TM Motor Group dealer listing",
  "catalogue_name": "WEIGHT SET",
  "priority": "B",
  "source_url": "https://www.tmmotorgroup.com/produk?slug=weight-set-b651-557",
  "sources": [
   "https://www.tmmotorgroup.com/produk?slug=weight-set-b651-557"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0089",
  "cat": "engine",
  "name": "Spark plug NGK CPR8EA-9",
  "oem": "CPR8EA-9",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-aerox-alpha155-std-id",
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "oem-alt",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: from Alia Aerox 155 owner manual (GDR155 generation); Alpha not confirmed; catalogue: Alia owner manual",
  "catalogue_name": "NGK/CPR8EA-9",
  "priority": "A",
  "source_url": "https://yamahamaldives.com/wp-content/uploads/2025/03/AEROX-155_Warranty-Booklet-Owners-Manual.pdf",
  "sources": [
   "https://yamahamaldives.com/wp-content/uploads/2025/03/AEROX-155_Warranty-Booklet-Owners-Manual.pdf",
   "https://yamahamaldives.com/wp-content/uploads/2025/07/EXCITER-155_Warranty-Booklet-Owners-Manual.pdf"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0090",
  "cat": "tyre",
  "name": "Tyre 110/80-14, front",
  "oem": null,
  "v": 0,
  "alts": [],
  "fits": [
   "yamaha-aerox-alpha155-std-id"
  ],
  "tier": "aftermarket",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "size from Litus spec sheet; catalogue: dealer spec",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://www.litusautomobiles.com/motorcycles/aerox-alpha-155-standard",
  "sources": [
   "https://www.litusautomobiles.com/motorcycles/aerox-alpha-155-standard"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0091",
  "cat": "tyre",
  "name": "Tyre 140/70-14, rear",
  "oem": null,
  "v": 0,
  "alts": [],
  "fits": [
   "yamaha-aerox-alpha155-std-id"
  ],
  "tier": "aftermarket",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "size from Litus spec sheet; catalogue: dealer spec",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://www.litusautomobiles.com/motorcycles/aerox-alpha-155-standard",
  "sources": [
   "https://www.litusautomobiles.com/motorcycles/aerox-alpha-155-standard"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0092",
  "cat": "engine",
  "name": "Air filter element",
  "oem": "B5V-E4450-00",
  "v": 0,
  "alts": [],
  "fits": [
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "mototh Thai Yamaha fiche (EXCITER 155 ALL NEW 2021/2022, T155 BAW1/3/4/5) seen via search index on 22 Nov 2026; site itself was down (DB error) when fetched; catalogue: mototh.com Thai Yamaha fiche",
  "catalogue_name": "ELEMENT ASSY, AIR CLEANER",
  "priority": "A",
  "source_url": "https://mototh.com/en/parts/598/Yamaha+EXCITER+155+ALL+NEW+2022/11786/INTAKE",
  "sources": [
   "https://mototh.com/en/parts/598/Yamaha+EXCITER+155+ALL+NEW+2022/11786/INTAKE"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0093",
  "cat": "engine",
  "name": "Oil filter element",
  "oem": "38B-E3440-01",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: listed on mototh Exciter 155 oil-pump fiche (search index only, site down); later number 1S7-E3440-00 also sold as equivalent - verify; catalogue: mototh.com Thai Yamaha fiche",
  "catalogue_name": "ELEMENT ASSY, OIL CLEANER",
  "priority": "A",
  "source_url": "https://mototh.com/en/parts/598/Yamaha+EXCITER+155+ALL+NEW+2022/11785/OIL+PUMP",
  "sources": [
   "https://mototh.com/en/parts/598/Yamaha+EXCITER+155+ALL+NEW+2022/11785/OIL+PUMP"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0094",
  "cat": "brake",
  "name": "Brake pad kit, front",
  "oem": "2DP-F5805-00",
  "v": 0,
  "alts": [],
  "fits": [
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "Webike Thai Yamaha OEM listing; fit list includes T155 EXCITER 155 ALL NEW 2021; catalogue: Webike Japan (Thai Yamaha OEM parts)",
  "catalogue_name": "BRAKE PAD KIT",
  "priority": "A",
  "source_url": "https://japan.webike.net/products/25483516.html",
  "sources": [
   "https://japan.webike.net/products/25483516.html"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0095",
  "cat": "drive",
  "name": "Drive sprocket 14T",
  "oem": "93822-14800",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: Vietnamese parts retailer quoting Yamaha reference numbers for Exciter 155; Auto Care MV also sells 93822-14800 as \"Sprocket Drive Yamaha Exciter\" MVR 80; catalogue: retailer",
  "catalogue_name": "SPROCKET, DRIVE",
  "priority": "A",
  "source_url": "https://phutungchinhhieu.com/snd-did-hdn-exciter155-22-428hdn-126l-14t-46t-black-edp/",
  "sources": [
   "https://phutungchinhhieu.com/snd-did-hdn-exciter155-22-428hdn-126l-14t-46t-black-edp/"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0096",
  "cat": "drive",
  "name": "Rear sprocket 46T",
  "oem": "B5V-F5446-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: retailer reference number only; catalogue: retailer",
  "catalogue_name": "SPROCKET, DRIVEN",
  "priority": "A",
  "source_url": "https://phutungchinhhieu.com/snd-did-hdn-exciter155-22-428hdn-126l-14t-46t-black-edp/",
  "sources": [
   "https://phutungchinhhieu.com/snd-did-hdn-exciter155-22-428hdn-126l-14t-46t-black-edp/"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0097",
  "cat": "drive",
  "name": "Drive chain 428 x 124L",
  "oem": "94568-K8124",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: retailer reference number only; chain length varies by year (124L/126L); catalogue: retailer",
  "catalogue_name": "CHAIN",
  "priority": "A",
  "source_url": "https://phutungchinhhieu.com/snd-did-hdn-exciter155-22-428hdn-126l-14t-46t-black-edp/",
  "sources": [
   "https://phutungchinhhieu.com/snd-did-hdn-exciter155-22-428hdn-126l-14t-46t-black-edp/"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0098",
  "cat": "engine",
  "name": "Cam chain",
  "oem": "94568-J9096",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "VERIFY: mototh part page title seen in search index (EXCITER 155 camshaft & chain); site down; catalogue: mototh.com Thai Yamaha fiche",
  "catalogue_name": "CHAIN",
  "priority": "B",
  "source_url": "https://mototh.com/en/part/57121/94568-J9096",
  "sources": [
   "https://mototh.com/en/part/57121/94568-J9096"
  ],
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0099",
  "cat": "tyre",
  "name": "Tyre 90/80-17, front",
  "oem": null,
  "v": 0,
  "alts": [],
  "fits": [
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "aftermarket",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "size from Litus spec sheet; catalogue: dealer spec",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://www.litusautomobiles.com/motorcycles/exciter-155-vva-standard-2026",
  "sources": [
   "https://www.litusautomobiles.com/motorcycles/exciter-155-vva-standard-2026"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0100",
  "cat": "tyre",
  "name": "Tyre 120/70-17, rear",
  "oem": null,
  "v": 0,
  "alts": [],
  "fits": [
   "yamaha-exciter155-vva-b5v"
  ],
  "tier": "aftermarket",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "size from Litus spec sheet; catalogue: dealer spec",
  "catalogue_name": "",
  "priority": "B",
  "source_url": "https://www.litusautomobiles.com/motorcycles/exciter-155-vva-standard-2026",
  "sources": [
   "https://www.litusautomobiles.com/motorcycles/exciter-155-vva-standard-2026"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "d0101",
  "cat": "cvt",
  "name": "V-belt, drive",
  "oem": "B9Y-E7641-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-nmax-turbo155-gpd155d"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY: number seen on a public ASEAN Yamaha parts listing; confirm against the frame number. NMAX Turbo belt; not the B8R / B65 belt.",
  "catalogue_name": "V-BELT",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0102",
  "cat": "engine",
  "name": "Air filter element",
  "oem": "B6H-E4451-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-nmax-turbo155-gpd155d"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY (NMAX Turbo): number seen on a public ASEAN Yamaha parts listing; confirm against the frame number.",
  "catalogue_name": "ELEMENT, AIR CLEANER",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0103",
  "cat": "engine",
  "name": "Spark plug NGK CPR8EA-9",
  "oem": "CPR8EA-9",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-nmax-turbo155-gpd155d"
  ],
  "tier": "oem-alt",
  "price": null,
  "note": "Specified in the Maldives-market owner's manual (NMAX Turbo 155)",
  "catalogue_name": "NGK/CPR8EA-9",
  "priority": "A",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0104",
  "cat": "brake",
  "name": "Brake pad kit, front",
  "oem": "2DP-F5805-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-nmax-turbo155-gpd155d",
   "yamaha-mx-king150-2pv"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY (NMAX Turbo, MX King 150): number seen on a public ASEAN Yamaha parts listing; confirm against the frame number.",
  "catalogue_name": "BRAKE PAD KIT",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0105",
  "cat": "brake",
  "name": "Brake pad kit, rear (disc)",
  "oem": "B6H-F5805-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-nmax-turbo155-gpd155d"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY (NMAX Turbo): number seen on a public ASEAN Yamaha parts listing; confirm against the frame number.",
  "catalogue_name": "BRAKE PAD KIT",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0106",
  "cat": "tyre",
  "name": "Tyre 110/70-13 tubeless, front",
  "oem": null,
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-nmax-turbo155-gpd155d"
  ],
  "tier": "aftermarket",
  "price": null,
  "note": "Front size specified in the Maldives-market owner's manual (NMAX Turbo 155)",
  "catalogue_name": "",
  "priority": "B",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0107",
  "cat": "tyre",
  "name": "Tyre 130/70-13 tubeless, rear",
  "oem": null,
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-nmax-turbo155-gpd155d"
  ],
  "tier": "aftermarket",
  "price": null,
  "note": "Rear size specified in the Maldives-market owner's manual (NMAX Turbo 155)",
  "catalogue_name": "",
  "priority": "B",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0108",
  "cat": "elec",
  "name": "Battery YTZ6V",
  "oem": "BN1-H2100-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-nmax-turbo155-gpd155d",
   "yamaha-gear-ultima125",
   "yamaha-fazzio125",
   "yamaha-grand-filano125",
   "yamaha-freego125"
  ],
  "tier": "genuine",
  "price": null,
  "note": "Battery type YTZ6V specified in the Maldives-market owner's manual (NMAX Turbo, Gear Ultima, Fazzio, Grand Filano, Freego Connected); genuine number to be checked for these models",
  "catalogue_name": "BATTERY",
  "priority": "A",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0109",
  "cat": "engine",
  "name": "Spark plug NGK CR8E",
  "oem": "CR8E",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-mx-king150-2pv"
  ],
  "tier": "oem-alt",
  "price": null,
  "note": "Specified in the Maldives-market owner's manual",
  "catalogue_name": "NGK/CR8E",
  "priority": "A",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0110",
  "cat": "engine",
  "name": "Oil filter element",
  "oem": "38B-E3440-01",
  "v": 1,
  "alts": [
   "38B-E3440-00"
  ],
  "fits": [
   "yamaha-mx-king150-2pv"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY (MX King 150): number seen on a public ASEAN Yamaha parts listing; 38B-E3440-00 is the earlier number; confirm against the frame number.",
  "catalogue_name": "ELEMENT ASSY, OIL CLEANER",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0111",
  "cat": "engine",
  "name": "Air filter element",
  "oem": "2PV-E4450-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-mx-king150-2pv"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY: number seen on a public ASEAN Yamaha parts listing; confirm against the frame number.",
  "catalogue_name": "ELEMENT, AIR CLEANER",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0112",
  "cat": "brake",
  "name": "Brake pad kit, rear",
  "oem": "1PA-F5806-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-mx-king150-2pv"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY: number seen on a public ASEAN Yamaha parts listing; confirm against the frame number.",
  "catalogue_name": "BRAKE PAD KIT",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0113",
  "cat": "elec",
  "name": "Battery YTZ4V",
  "oem": "YTZ4V",
  "v": 1,
  "alts": [
   "GTZ4V"
  ],
  "fits": [
   "yamaha-mx-king150-2pv"
  ],
  "tier": "oem-alt",
  "price": null,
  "note": "Specified in the Maldives-market owner's manual (YTZ4V or GTZ4V)",
  "catalogue_name": "BATTERY",
  "priority": "A",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0114",
  "cat": "tyre",
  "name": "Tyre 90/80-17, front",
  "oem": null,
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-mx-king150-2pv"
  ],
  "tier": "aftermarket",
  "price": null,
  "note": "Front size specified in the Maldives-market owner's manual (MX King 150)",
  "catalogue_name": "",
  "priority": "B",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0115",
  "cat": "tyre",
  "name": "Tyre 120/70-17, rear",
  "oem": null,
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-mx-king150-2pv"
  ],
  "tier": "aftermarket",
  "price": null,
  "note": "Rear size specified in the Maldives-market owner's manual (MX King 150)",
  "catalogue_name": "",
  "priority": "B",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0116",
  "cat": "cvt",
  "name": "V-belt, drive",
  "oem": "B3Y-E7641-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-gear-ultima125",
   "yamaha-fazzio125",
   "yamaha-grand-filano125"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY: number seen on a public ASEAN Yamaha parts listing; confirm against the frame number. Shared by Fazzio, Grand Filano and Gear Ultima.",
  "catalogue_name": "V-BELT",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0117",
  "cat": "cvt",
  "name": "V-belt, drive",
  "oem": "2PH-E7641-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-freego125"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY: number seen on a public ASEAN Yamaha parts listing; confirm against the frame number. Earlier Gear / Freego belt, not the B3Y belt.",
  "catalogue_name": "V-BELT",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0118",
  "cat": "engine",
  "name": "Air filter element",
  "oem": "B5D-E4450-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-gear-ultima125",
   "yamaha-freego125"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY: number seen on a public ASEAN Yamaha parts listing; confirm against the frame number. Gear 125 / Freego element.",
  "catalogue_name": "ELEMENT, AIR CLEANER",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0119",
  "cat": "engine",
  "name": "Air filter element",
  "oem": "B8B-E4450-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-fazzio125",
   "yamaha-grand-filano125"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY: number seen on a public ASEAN Yamaha parts listing; confirm against the frame number. Fazzio / Grand Filano element.",
  "catalogue_name": "ELEMENT, AIR CLEANER",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0120",
  "cat": "cvt",
  "name": "Roller weight set",
  "oem": "BEJ-WE763-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-fazzio125",
   "yamaha-grand-filano125"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY: number seen on a public ASEAN Yamaha parts listing; confirm against the frame number.",
  "catalogue_name": "WEIGHT SET",
  "priority": "B",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0121",
  "cat": "engine",
  "name": "Spark plug NGK CR6HSA",
  "oem": "CR6HSA",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-fazzio125",
   "yamaha-grand-filano125",
   "yamaha-freego125",
   "yamaha-gear-ultima125"
  ],
  "tier": "oem-alt",
  "price": null,
  "note": "Specified in the Maldives-market owner's manual",
  "catalogue_name": "NGK/CR6HSA",
  "priority": "A",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0122",
  "cat": "brake",
  "name": "Brake pad kit, front",
  "oem": "2BM-F5805-00",
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-fazzio125",
   "yamaha-grand-filano125",
   "yamaha-freego125",
   "yamaha-gear-ultima125"
  ],
  "tier": "genuine",
  "price": null,
  "note": "VERIFY: number seen on a public ASEAN Yamaha parts listing; confirm against the frame number. Rear brake on these 125s is a drum.",
  "catalogue_name": "BRAKE PAD KIT",
  "priority": "A",
  "askPrice": true,
  "confirmed": "verify",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0123",
  "cat": "tyre",
  "name": "Tyre 110/70-12, front / rear",
  "oem": null,
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-gear-ultima125",
   "yamaha-fazzio125",
   "yamaha-grand-filano125"
  ],
  "tier": "aftermarket",
  "price": null,
  "note": "Size specified in the Maldives-market owner's manual",
  "catalogue_name": "",
  "priority": "B",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0124",
  "cat": "tyre",
  "name": "Tyre 100/90-12, front",
  "oem": null,
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-freego125"
  ],
  "tier": "aftermarket",
  "price": null,
  "note": "Front size specified in the Maldives-market owner's manual (Freego)",
  "catalogue_name": "",
  "priority": "B",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 },
 {
  "id": "d0125",
  "cat": "tyre",
  "name": "Tyre 110/90-12, rear",
  "oem": null,
  "v": 1,
  "alts": [],
  "fits": [
   "yamaha-freego125"
  ],
  "tier": "aftermarket",
  "price": null,
  "note": "Rear size specified in the Maldives-market owner's manual (Freego)",
  "catalogue_name": "",
  "priority": "B",
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "yamaha-maldives-2026"
 }
];
const DEALER_MARINE_MODELS = [
 {
  "id": "parsun-f15-f9-9",
  "vertical": "outboards",
  "brand": "Parsun",
  "name": "Parsun F9.9 / F15 (4-stroke)",
  "market": "?",
  "size": "15 HP",
  "status": "dealers-2026-11 draft",
  "catalogue_url": "https://www.parsunparts.com/",
  "note": "MotoX MVR 48,487; generated from dealers-2026-11/parts/parsun-f15-f9-9.csv"
 },
 {
  "id": "parsun-f40-efi",
  "vertical": "outboards",
  "brand": "Parsun",
  "name": "Parsun F40 EFI (4-stroke)",
  "market": "?",
  "size": "40 HP",
  "status": "dealers-2026-11 draft",
  "catalogue_url": "https://www.parsunparts.com/",
  "note": "MotoX lists, unpriced; generated from dealers-2026-11/parts/parsun-f40-efi.csv"
 },
 {
  "id": "parsun-f60-efi",
  "vertical": "outboards",
  "brand": "Parsun",
  "name": "Parsun F60 EFI (4-stroke)",
  "market": "?",
  "size": "60 HP",
  "status": "dealers-2026-11 draft",
  "catalogue_url": "https://www.parsunparts.com/",
  "note": "MotoX MVR 124,455; generated from dealers-2026-11/parts/parsun-f60-efi.csv"
 },
 {
  "id": "parsun-f115-efi",
  "vertical": "outboards",
  "brand": "Parsun",
  "name": "Parsun F115 EFI (4-stroke)",
  "market": "?",
  "size": "115 HP",
  "status": "dealers-2026-11 draft",
  "catalogue_url": "https://www.parsunparts.com/",
  "note": "MotoX MVR 201,784; generated from dealers-2026-11/parts/parsun-f115-efi.csv"
 },
 {
  "id": "yamaha-waverunner-vx-cruiser-1050",
  "vertical": "jetski",
  "brand": "Yamaha",
  "name": "WaveRunner VX Cruiser 1050",
  "market": "MV",
  "size": "1049 cc",
  "status": "yamaha-maldives-2026 preview",
  "note": null
 },
 {
  "id": "yamaha-waverunner-vx-deluxe-1050",
  "vertical": "jetski",
  "brand": "Yamaha",
  "name": "WaveRunner VX Deluxe 1050",
  "market": "MV",
  "size": "1049 cc",
  "status": "yamaha-maldives-2026 preview",
  "note": null
 },
 {
  "id": "yamaha-waverunner-jetblaster-pro-1050",
  "vertical": "jetski",
  "brand": "Yamaha",
  "name": "WaveRunner Jet Blaster Pro 1050",
  "market": "MV",
  "size": "1049 cc",
  "status": "yamaha-maldives-2026 preview",
  "note": null
 }
];
const DEALER_MARINE_PARTS = [
 {
  "id": "md0001",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal 38X52X6)",
  "oem": "F115-05030009",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 11.65 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "OIL SEAL 38x52x6",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0002",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal A Ø85Xø103X7)",
  "oem": "F115-05000003",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 23.20 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "OIL SEAL A Ø85xØ103x7",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0003",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal B 34X45X6.5)",
  "oem": "F115-05080003",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 9.10 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "OIL SEAL B 34x45x6.5",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0004",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal A 22.4X33X5)",
  "oem": "F115-05080002",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 7.20 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "OIL SEAL A 22.4x33x5",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0005",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal 30X45X7)",
  "oem": "F115-04030002",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 9.75 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "OIL SEAL 30x45x7",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0006",
  "vertical": "outboards",
  "cat": "m_pump",
  "name": "Water pump impeller (Impeller Assy)",
  "oem": "F115-04000011",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 35.00 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "IMPELLER ASSY",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0007",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal 28X43X7)",
  "oem": "F115-04000202",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 8.70 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "OIL SEAL 28x43x7",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0008",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "T85-01010005",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 60.50 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/bracket-1/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/bracket-1/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0009",
  "vertical": "outboards",
  "cat": "m_wear",
  "name": "Timing belt (Timing Belt)",
  "oem": "F115-05000091",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 130.80 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "TIMING BELT",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/camshaft/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/camshaft/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0010",
  "vertical": "outboards",
  "cat": "m_service",
  "name": "Thermostat (Thermostat)",
  "oem": "F115-05000032",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 20.90 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "THERMOSTAT",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/crankcase/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/crankcase/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0011",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode, Watercourse)",
  "oem": "F115-05000029",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 6.55 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "ANODE, WATERCOURSE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/crankcase/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/crankcase/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0012",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "F4-04070003",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 4.60 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/crankcase/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/crankcase/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0013",
  "vertical": "outboards",
  "cat": "m_service",
  "name": "Oil filter (Oil Filter)",
  "oem": "F25-05000100",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi",
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 30.80 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "OIL FILTER",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/crankcase/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/crankcase/",
   "https://www.parsunparts.com/4-stroke/f40efi/crankcase/",
   "https://www.parsunparts.com/4-stroke/f60efi/crankcase/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0014",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "F115-05030016",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 15.10 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/cylinder-head-assy/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/cylinder-head-assy/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0015",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Ignition coil (Ignition Coil Assy)",
  "oem": "F60-05000600",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 279.30 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "IGNITION COIL ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/electrical-1/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/electrical-1/",
   "https://www.parsunparts.com/4-stroke/f60efi/electrical-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0016",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Rectifier / regulator (Rectifier Assy)",
  "oem": "F115-05000400",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 220.30 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "RECTIFIER ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/electrical-1/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/electrical-1/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0017",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Fuse (Fuse (50A))",
  "oem": "F115-05000109-1",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 7.45 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "FUSE (50A)",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0018",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Fuse (Fuse Wire (40A))",
  "oem": "F40-05001000-1EFI",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi",
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 2.20 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "FUSE WIRE (40A)",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/",
   "https://www.parsunparts.com/4-stroke/f40efi/electrical-3/",
   "https://www.parsunparts.com/4-stroke/f60efi/electrical-3/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0019",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Fuse (Fuse Wire (15A))",
  "oem": "F40-05001000-3EFI",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi",
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "FUSE WIRE (15A)",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/",
   "https://www.parsunparts.com/4-stroke/f40efi/electrical-3/",
   "https://www.parsunparts.com/4-stroke/f60efi/electrical-3/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0020",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Fuse (Fuse Wire (7.5A))",
  "oem": "F40-05001000-4EFI",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi",
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 2.20 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "FUSE WIRE (7.5A)",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/",
   "https://www.parsunparts.com/4-stroke/f40efi/electrical-3/",
   "https://www.parsunparts.com/4-stroke/f60efi/electrical-3/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0021",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Fuse (Fuse Wire (20A))",
  "oem": "F40-05001000-2EFI",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi",
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "FUSE WIRE (20A)",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/electrical-2/",
   "https://www.parsunparts.com/4-stroke/f40efi/electrical-3/",
   "https://www.parsunparts.com/4-stroke/f60efi/electrical-3/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0022",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Spark plug (Spark Plug)",
  "oem": "F20-05000037",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 17.80 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "SPARK PLUG",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/electrical-3/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/electrical-3/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0023",
  "vertical": "outboards",
  "cat": "m_service",
  "name": "Oil filter (Oil Filter Cleaner)",
  "oem": "F15-07010023",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi",
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 21.45 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "OIL FILTER CLEANER",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/engine-assy-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/engine-assy-repair-kit/",
   "https://www.parsunparts.com/4-stroke/f15bm/cylinder-crankcase-1/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0024",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel filter (Filter Cup Assy)",
  "oem": "F115-05001300",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 125.00 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "FILTER CUP ASSY",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/fuel-system/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/fuel-system/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0025",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel pump (Fuel Pump Assy)",
  "oem": "F115-05040000",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 388.30 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "FUEL PUMP ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/fuel-system/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/fuel-system/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0026",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel filter (Fuel Filter Assy)",
  "oem": "F115-05000019",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 12.50 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "FUEL FILTER ASSY",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/fuel-system/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/fuel-system/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0027",
  "vertical": "outboards",
  "cat": "m_prop",
  "name": "Propeller (Propeller Assy)",
  "oem": "F115-04040000",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 1000.00 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "PROPELLER ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0028",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal, Oil Pump)",
  "oem": "F115-05080009",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 10.45 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "OIL SEAL, OIL PUMP",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/oil-pump-assy/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/oil-pump-assy/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0029",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel filter (Coarse Filter Assy)",
  "oem": "F115-02010100",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f115-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 22.65 USD; catalogue: parsunparts.com official Parsun spare parts website, F115EFI",
  "catalogue_name": "COARSE FILTER ASSY",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f115efi/upper-casing/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f115efi/upper-casing/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0030",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal)",
  "oem": "F15-07040008",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 9.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "OIL SEAL",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0031",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Head gasket (Gasket, Cylinder Head)",
  "oem": "F15-07000100",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 55.35 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "GASKET, CYLINDER HEAD",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0032",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal B)",
  "oem": "F15-07030007",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 19.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "OIL SEAL B",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0033",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal A25X44X6.5)",
  "oem": "F15-07030006",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 19.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "OIL SEAL A25X44X6.5",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0034",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal 13X25X6)",
  "oem": "F15-04000008",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 14.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "OIL SEAL 13X25X6",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0035",
  "vertical": "outboards",
  "cat": "m_pump",
  "name": "Water pump impeller (Impeller Assy)",
  "oem": "F15-06050000",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 19.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "IMPELLER ASSY",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0036",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal)",
  "oem": "F15-06080004",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 16.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "OIL SEAL",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0037",
  "vertical": "outboards",
  "cat": "m_wear",
  "name": "Timing belt (Belt, Timing)",
  "oem": "F15-07000002",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 79.65 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "BELT, TIMING",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/camshaft/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/camshaft/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0038",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "F15-07010008",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 4.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/cylinder-crankcase-1/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/cylinder-crankcase-1/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0039",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Seal, Anode)",
  "oem": "F15-07010009",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9",
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 4.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "SEAL, ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/cylinder-crankcase-1/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/cylinder-crankcase-1/",
   "https://www.parsunparts.com/4-stroke/f40efi/upper-casing/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0040",
  "vertical": "outboards",
  "cat": "m_service",
  "name": "Thermostat (Thermostat (S60))",
  "oem": "F15-07000031",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9",
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 29.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "THERMOSTAT (S60)",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/cylinder-crankcase-1/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/cylinder-crankcase-1/",
   "https://www.parsunparts.com/4-stroke/f40efi/crankcase/",
   "https://www.parsunparts.com/4-stroke/f60efi/crankcase/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0041",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "F15-07010026",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 12.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/cylinder-crankcase-1/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/cylinder-crankcase-1/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0042",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Rectifier / regulator (Rectifier Assy)",
  "oem": "F15-07060001",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 79.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "RECTIFIER ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/electrical-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0043",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Fuse (Fuse Assy)",
  "oem": "F25-05090100W",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9",
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 7.55 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "FUSE ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/electrical-2/",
   "https://www.parsunparts.com/4-stroke/f40efi/electrical-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0044",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Fuse (Fuse Wire (20A))",
  "oem": "F15-07150001W",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9",
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 2.25 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "FUSE WIRE (20A)",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/electrical-2/",
   "https://www.parsunparts.com/4-stroke/f40efi/electrical-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0045",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel filter (Filter Assy)",
  "oem": "F15-07080000",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 29.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "FILTER ASSY",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/fuel/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/fuel/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0046",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel pump (Fuel Pump Assy)",
  "oem": "F15-07140000",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 89.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "FUEL PUMP ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/fuel/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/fuel/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0047",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel filter (Filter Cup)",
  "oem": "F15-07080002",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 8.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "FILTER CUP",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/fuel/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/fuel/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0048",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode, Lower)",
  "oem": "F15-06000004",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; also on parsun.eu maintenance list; ref price 22.50 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "ANODE, LOWER",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0049",
  "vertical": "outboards",
  "cat": "m_prop",
  "name": "Propeller (Propeller Assy)",
  "oem": "TE15-04020000",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 124.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "PROPELLER ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0050",
  "vertical": "outboards",
  "cat": "m_prop",
  "name": "Propeller (Propeller Assy 3-9¼\"X11\")",
  "oem": "F15-06090000-11",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 124.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "PROPELLER ASSY 3-9¼\"x11\"",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0051",
  "vertical": "outboards",
  "cat": "m_prop",
  "name": "Propeller (Propeller Assy 3-9¼\"X12\")",
  "oem": "F20-04050000",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 124.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "PROPELLER ASSY 3-9¼\"x12\"",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0052",
  "vertical": "outboards",
  "cat": "m_prop",
  "name": "Propeller (Propeller Assy 3-9¼\"X8\")",
  "oem": "F15-06090000-8",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 124.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "PROPELLER ASSY 3-9¼\"X8\"",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0053",
  "vertical": "outboards",
  "cat": "m_ctrl",
  "name": "Starter rope (Meatus, Start Rope)",
  "oem": "F4-04130013",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 2.20 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "MEATUS, START ROPE",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/starter/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/starter/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0054",
  "vertical": "outboards",
  "cat": "m_ctrl",
  "name": "Starter rope (Rope, Starter (Ø5. 5X1. 8M))",
  "oem": "F15-07130205",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 9.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F15BM",
  "catalogue_name": "ROPE, STARTER (Ø5. 5X1. 8m)",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f15bm/starter/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f15bm/starter/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0055",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil drain gasket",
  "oem": "F15-04000003",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9",
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "parsun.eu (Swedish Parsun importer) annual-service list for this model; catalogue: parsun.eu engine maintenance material",
  "catalogue_name": "Oil drain gasket",
  "priority": "A",
  "source_url": "https://parsun.eu/parts/f15/engine-maintenance-material",
  "sources": [
   "https://parsun.eu/parts/f15/engine-maintenance-material",
   "https://parsun.eu/parts/f40/engine-maintenance-material",
   "https://parsun.eu/parts/f60/engine-maintenance-material"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0056",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Gear box plug gasket",
  "oem": "F4-03000024",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9",
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "parsun.eu (Swedish Parsun importer) annual-service list for this model; catalogue: parsun.eu engine maintenance material",
  "catalogue_name": "Gear box plug gasket",
  "priority": "A",
  "source_url": "https://parsun.eu/parts/f15/engine-maintenance-material",
  "sources": [
   "https://parsun.eu/parts/f15/engine-maintenance-material",
   "https://parsun.eu/parts/f40/engine-maintenance-material",
   "https://parsun.eu/parts/f60/engine-maintenance-material"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0057",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Spark plug NGK DPR6EA-9 (x2)",
  "oem": "DPR6EA-9",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f15-f9-9"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "parsun.eu (Swedish Parsun importer) annual-service list for this model; catalogue: parsun.eu engine maintenance material",
  "catalogue_name": "Spark plug NGK DPR6EA-9 (x2)",
  "priority": "A",
  "source_url": "https://parsun.eu/parts/f15/engine-maintenance-material",
  "sources": [
   "https://parsun.eu/parts/f15/engine-maintenance-material"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0058",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal B)",
  "oem": "F25-05020003",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 11.55 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "OIL SEAL B",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/appendix-1-repair-kit/",
   "https://www.parsunparts.com/4-stroke/f60efi/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0059",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal A)",
  "oem": "F25-05020002",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 10.90 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "OIL SEAL A",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/appendix-1-repair-kit/",
   "https://www.parsunparts.com/4-stroke/f60efi/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0060",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal 37X50X7)",
  "oem": "F25-05050021",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 7.15 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "OIL SEAL 37X50X7",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/appendix-1-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/appendix-1-repair-kit/",
   "https://www.parsunparts.com/4-stroke/f60efi/appendix-1-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0061",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal)",
  "oem": "F25-02010002",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 7.15 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "OIL SEAL",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0062",
  "vertical": "outboards",
  "cat": "m_pump",
  "name": "Water pump impeller (Impeller Assy)",
  "oem": "F25-04040000",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; also on parsun.eu maintenance list; ref price 29.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "IMPELLER ASSY",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0063",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "E10-01010008",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; also on parsun.eu maintenance list; ref price 30.80 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/bracket-1/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/bracket-1/",
   "https://www.parsunparts.com/4-stroke/f60efi/hydraulic-tilt-assy-1/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0064",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Wire, Anode)",
  "oem": "E10-01010009",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 9.90 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "WIRE, ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/bracket-1/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/bracket-1/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0065",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal B)",
  "oem": "F15-05020003",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 11.55 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "OIL SEAL B",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/crankshaft-piston/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/crankshaft-piston/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0066",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Rectifier / regulator (Rectifier Assy)",
  "oem": "F40-05000500EFI",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 214.83 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "RECTIFIER ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/electrical-2/",
   "https://www.parsunparts.com/4-stroke/f60efi/electrical-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0067",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Ignition coil (Ignition Coil Assy)",
  "oem": "F40-05090200EFI",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 151.80 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "IGNITION COIL ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/electrical-3/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/electrical-3/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0068",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel filter (Fuel Filter)",
  "oem": "F40-05091100EFI",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 9.35 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "FUEL FILTER",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/fuel-common-rail/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/fuel-common-rail/",
   "https://www.parsunparts.com/4-stroke/f60efi/fuel-common-rail/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0069",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel filter (Filter Cup Assy)",
  "oem": "T86-05000300",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 20.35 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "FILTER CUP ASSY",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/fuel-system/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/fuel-system/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0070",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel pump (Fuel Pump Assy)",
  "oem": "F40-05050000",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 107.80 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "FUEL PUMP ASSY",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/fuel-system/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/fuel-system/",
   "https://www.parsunparts.com/4-stroke/f60efi/fuel-system/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0071",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "T40-00000010",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 36.75 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
   "https://www.parsunparts.com/4-stroke/f60efi/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0072",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "T40-00000009",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 18.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
   "https://www.parsunparts.com/4-stroke/f60efi/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0073",
  "vertical": "outboards",
  "cat": "m_prop",
  "name": "Propeller (Propeller Assy 3-11⅛\"X13\")",
  "oem": "T40-04070000-13",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 329.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "PROPELLER ASSY 3-11⅛\"x13\"",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
   "https://www.parsunparts.com/4-stroke/f60efi/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0074",
  "vertical": "outboards",
  "cat": "m_prop",
  "name": "Propeller (Propeller Assy 3-11⅜\"X12\")",
  "oem": "T40-04070000-12",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 329.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "PROPELLER ASSY 3-11⅜\"x12\"",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
   "https://www.parsunparts.com/4-stroke/f60efi/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0075",
  "vertical": "outboards",
  "cat": "m_prop",
  "name": "Propeller (Propeller Assy 3-11⅝\"X11\")",
  "oem": "T40-04070000-11",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 329.95 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "PROPELLER ASSY 3-11⅝\"x11\"",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/lower-casing-drive-2/",
   "https://www.parsunparts.com/4-stroke/f60efi/lower-casing-drive-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0076",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "F40-00000006D",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; also on parsun.eu maintenance list; ref price 10.80 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/manual-tilt-manual-control/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/manual-tilt-manual-control/",
   "https://www.parsunparts.com/4-stroke/f60efi/manual-tilt-manual-control/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0077",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Fuel filter (Filter Assy)",
  "oem": "F40-02010100",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 44.00 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "FILTER ASSY",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/oil-pan-assy/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/oil-pan-assy/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0078",
  "vertical": "outboards",
  "cat": "m_wear",
  "name": "Timing belt (Timing Belt)",
  "oem": "F25-05000023",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 115.50 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "TIMING BELT",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/oil-pump/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/oil-pump/",
   "https://www.parsunparts.com/4-stroke/f60efi/oil-pump/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0079",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal 15X23X5)",
  "oem": "T40-10030202",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 5.50 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "OIL SEAL 15x23x5",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/power-trim-tilt-assy/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/power-trim-tilt-assy/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0080",
  "vertical": "outboards",
  "cat": "m_anode",
  "name": "Anode (Anode)",
  "oem": "F25-02010005",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; also on parsun.eu maintenance list; ref price 5.30 USD; catalogue: parsunparts.com official Parsun spare parts website, F40EFI",
  "catalogue_name": "ANODE",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f40efi/upper-casing/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f40efi/upper-casing/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0081",
  "vertical": "outboards",
  "cat": "m_fuel",
  "name": "Low-pressure fuel filter cup assy",
  "oem": "T85-05000300",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "parsun.eu (Swedish Parsun importer) annual-service list for this model; catalogue: parsun.eu engine maintenance material",
  "catalogue_name": "Low-pressure fuel filter cup assy",
  "priority": "A",
  "source_url": "https://parsun.eu/parts/f40/engine-maintenance-material",
  "sources": [
   "https://parsun.eu/parts/f40/engine-maintenance-material",
   "https://www.parsunparts.com/4-stroke/f60efi/fuel-system/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0082",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Spark plug NGK DPR7EA-9 (x3)",
  "oem": "DPR7EA-9",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f40-efi",
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "parsun.eu (Swedish Parsun importer) annual-service list for this model; catalogue: parsun.eu engine maintenance material",
  "catalogue_name": "Spark plug NGK DPR7EA-9 (x3)",
  "priority": "A",
  "source_url": "https://parsun.eu/parts/f40/engine-maintenance-material",
  "sources": [
   "https://parsun.eu/parts/f40/engine-maintenance-material",
   "https://parsun.eu/parts/f60/engine-maintenance-material"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0083",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal 18X32X9)",
  "oem": "F60-02010002",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; ref price 7.50 USD; catalogue: parsunparts.com official Parsun spare parts website, F60EFI",
  "catalogue_name": "OIL SEAL 18x32x9",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f60efi/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f60efi/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0084",
  "vertical": "outboards",
  "cat": "m_pump",
  "name": "Water pump impeller (Impeller Assy,Water Pump)",
  "oem": "F60-04000300",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; In stock on 22 Nov 2026; also on parsun.eu maintenance list; ref price 22.00 USD; catalogue: parsunparts.com official Parsun spare parts website, F60EFI",
  "catalogue_name": "IMPELLER ASSY,WATER PUMP",
  "priority": "A",
  "source_url": "https://www.parsunparts.com/4-stroke/f60efi/appendix-2-repair-kit/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f60efi/appendix-2-repair-kit/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0085",
  "vertical": "outboards",
  "cat": "m_ign",
  "name": "Ignition coil (Ignition Coil)",
  "oem": "F60-05000601",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; catalogue: parsunparts.com official Parsun spare parts website, F60EFI",
  "catalogue_name": "IGNITION COIL",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f60efi/electrical-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f60efi/electrical-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 },
 {
  "id": "md0086",
  "vertical": "outboards",
  "cat": "m_gasket",
  "name": "Oil seal (Oil Seal Ø17Xø25X5)",
  "oem": "F60-06010003",
  "v": 0,
  "alts": [],
  "fits": [
   "parsun-f60-efi"
  ],
  "tier": "genuine",
  "price": null,
  "cost": null,
  "stock": null,
  "bin": null,
  "rop": null,
  "note": "ref price = parsunparts.com (official Parsun spare-parts site) USD; Sold Out on 22 Nov 2026; ref price 5.50 USD; catalogue: parsunparts.com official Parsun spare parts website, F60EFI",
  "catalogue_name": "OIL SEAL Ø17xØ25x5",
  "priority": "B",
  "source_url": "https://www.parsunparts.com/4-stroke/f60efi/hydraulic-tilt-assy-2/",
  "sources": [
   "https://www.parsunparts.com/4-stroke/f60efi/hydraulic-tilt-assy-2/"
  ],
  "askPrice": true,
  "confirmed": "yes",
  "added_by": "dealers-2026-11"
 }
];
if (typeof module !== 'undefined') module.exports = {DEALER_NEW_BRANDS, DEALER_NEW_MARINE_BRANDS, DEALER_MODELS, DEALER_PARTS, DEALER_MARINE_MODELS, DEALER_MARINE_PARTS};
