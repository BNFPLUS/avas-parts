/* Engine range for the Step 2 picker: outboards, marine diesel, jet skis, generators.
   Read by tools/build-equip.js. Hand-maintained; no URLs here (research notes,
   with their sources, are in src-data/engine-range-sources.md, which the builder
   does not read).

   MODEL_META   id -> [display name, size, unit, family rank, search aliases?]
                Every model in these four verticals must have an entry; the
                builder stops if one is missing.
   RANGE_MODELS engines sold or common in the Maldives that have no confirmed
                public parts list yet. They ship with zero parts; the site asks
                for a price and the engine serial. No part numbers are invented.

   size   numeric sort key: hp (outboards, lower bound of a range), litres
          (marine diesel, diesel generator sets), kVA (Honda inverter
          generators), cc (jet skis). Step 2 sorts by size, then family, then name.
   family 0 = 2-stroke, 1 = 4-stroke (FourStroke / F / DF / MFS),
          2 = SeaPro / Enduro / Verado, 3 = Avator electric; 0 elsewhere. */

const MODEL_META = {
  /* ---- Outboards: Mercury ---- */
  "mercury-115-fourstroke-efi":         ["FourStroke 2.1L 115 hp", 115, "hp", 1, ["115 FourStroke EFI", "2.1L"]],
  "mercury-fourstroke-v8-4.6l-250-300": ["FourStroke V8 4.6L 250–300 hp", 250, "hp", 1],
  "mercury-verado-l6-200-350":          ["Verado L6 200–350 hp", 200, "hp", 2],
  /* ---- Outboards: Parsun ---- */
  "parsun-f15-f9-9":  ["F9.9 / F15 9.9–15 hp", 9.9, "hp", 1, ["4-stroke"]],
  "parsun-f40-efi":   ["F40 EFI 40 hp", 40, "hp", 1, ["4-stroke"]],
  "parsun-f60-efi":   ["F60 EFI 60 hp", 60, "hp", 1, ["4-stroke"]],
  "parsun-f115-efi":  ["F115 EFI 115 hp", 115, "hp", 1, ["4-stroke"]],
  /* ---- Outboards: Suzuki ---- */
  "suzuki-dt40w-2stroke":         ["2-stroke DT40W 40 hp", 40, "hp", 0],
  "suzuki-df40a-df60a":           ["DF40A – DF60A 40–60 hp", 40, "hp", 1, ["DF50A"]],
  "suzuki-df70a-df90a":           ["DF70A – DF90A 70–90 hp", 70, "hp", 1, ["DF80A"]],
  "suzuki-df100a-df140a":         ["DF100A – DF140A 100–140 hp", 100, "hp", 1, ["DF115A", "DF115SS"]],
  "suzuki-df200-df250-v6-3.6l":   ["DF200 / DF250 V6 3.6L 200–250 hp", 200, "hp", 1],
  "suzuki-df250a-df300a-v6-4.0l": ["DF250A / DF300A V6 4.0L 250–300 hp", 250, "hp", 1],
  /* ---- Outboards: Tohatsu ---- */
  "tohatsu-m40d2-m50d2-2stroke":  ["2-stroke M40D2 / M50D2 40–50 hp", 40, "hp", 0],
  /* ---- Outboards: Yamaha ----
     yamaha-15hp-2stroke is a 2000–2009 US-market service kit. Its numbers overlap
     the 15FMH list only in part (61N-45251-01 anode is shared; the impeller kit
     63V-W0078-04 and filter 61N-24563-10 are not on the 15FMH list), so it is kept
     as its own engine, not merged. E15DMH is a different (Enduro) engine. */
  "yamaha-15fmh-2stroke":            ["2-stroke 9.9FMH / 15FMH 9.9–15 hp", 9.9, "hp", 0],
  "yamaha-15hp-2stroke":             ["2-stroke 15 hp (2000–2009)", 15, "hp", 0],
  "yamaha-e15dmh-enduro-2stroke":    ["Enduro 2-stroke E15DMH 15 hp", 15, "hp", 2, ["6B4"]],
  "yamaha-e25b-30h-2stroke":         ["2-stroke E25B / 25B / 30H 25–30 hp", 25, "hp", 0, ["Enduro"]],
  "yamaha-e40g-e40j-enduro-2stroke": ["Enduro 2-stroke E40G / E40J 40 hp", 40, "hp", 2],
  "yamaha-e40x-enduro-2stroke":      ["Enduro 2-stroke 40X / E40X 40 hp", 40, "hp", 2, ["E40XMH", "E40XWH", "E40XW", "E40XWT"]],
  "yamaha-e60h-enduro-2stroke-2019": ["Enduro 2-stroke E60H 60 hp (2019)", 60, "hp", 2],
  "yamaha-e75-85aet-2stroke-2004":   ["2-stroke 75AET / 85AET 75–85 hp (2004)", 75, "hp", 0],
  "yamaha-f40a-2008":                ["F40A 40 hp (2008+)", 40, "hp", 1],
  "yamaha-f50-2006":                 ["F50 50 hp (2006+)", 50, "hp", 1],
  "yamaha-f115-2014":                ["F115 115 hp (2014+)", 115, "hp", 1],
  "yamaha-f150-f175-2.7-2.8l":       ["F150 / F175 2.7–2.8L 150–175 hp", 150, "hp", 1, ["F175G", "F175"]],
  "yamaha-f200-f225-v6-3.3l":        ["F200 / F225 V6 3.3L 200–225 hp", 200, "hp", 1],
  "yamaha-f250-v6-3.3l":             ["F225 / F250 V6 3.3L 225–250 hp", 225, "hp", 1],
  "yamaha-f250-f300-v6-4.2l-2010":   ["F250 / F300 V6 4.2L 250–300 hp (2010+)", 250, "hp", 1],

  /* ---- Marine diesel (size = displacement in litres) ---- */
  "cummins-marine-qsb5-9": ["QSB5.9 5.9L", 5.9, "L", 0, ["Marine"]],
  "cummins-marine-qsb6-7": ["QSB6.7 6.7L", 6.7, "L", 0, ["Marine"]],
  "cummins-marine-qsc8-3": ["QSC8.3 8.3L", 8.3, "L", 0, ["Marine"]],
  "cummins-marine-qsl":    ["QSL9 8.9L", 8.9, "L", 0, ["Marine", "QSL"]],
  "cummins-marine-qsm":    ["QSM11 10.8L", 10.8, "L", 0, ["Marine", "QSM"]],
  "yanmar-6ch-hte3":   ["6CH-HTE3", 5.8, "L", 0],
  "yanmar-6ha2m-wdt":  ["6HA2M-WDT", 11.1, "L", 0],
  "yanmar-6ha2m-wht":  ["6HA2M-WHT", 11.1, "L", 0],
  "yanmar-6hym-wet":   ["6HYM-WET", 11.1, "L", 0],
  "yanmar-6aym-wet":   ["6AYM-WET", 20.4, "L", 0],
  "yanmar-6aym-wst":   ["6AYM-WST", 20.4, "L", 0],

  /* ---- Jet skis (size = engine cc) ---- */
  "yamaha-waverunner-vx-1050-tr1-2015":     ["WaveRunner VX 1050 (TR-1)", 1049, "cc", 0, ["VX 1050", "V1", "TR-1"]],
  "yamaha-waverunner-vx-cruiser-1050":      ["WaveRunner VX Cruiser 1050", 1049, "cc", 0, ["VX Cruiser", "TR-1"]],
  "yamaha-waverunner-vx-deluxe-1050":       ["WaveRunner VX Deluxe 1050", 1049, "cc", 0, ["VX Deluxe", "TR-1"]],
  "yamaha-waverunner-jetblaster-2022":      ["WaveRunner JetBlaster TR-1 1050 (2022+)", 1049, "cc", 0, ["Jet Blaster", "Jet Blaster Pro"]],
  "yamaha-waverunner-jetblaster-pro-1050":  ["WaveRunner Jet Blaster Pro 1050", 1049, "cc", 0, ["JetBlaster Pro", "Jet Blaster", "TR-1"]],
  "yamaha-waverunner-fx-1.8l-ho-svho-2009": ["WaveRunner FX SVHO 1800", 1812, "cc", 0, ["FX 1800", "FX SVHO", "FX Cruiser", "1.8L HO"]],
  "yamaha-waverunner-vx-1.8l-ho-2016":      ["WaveRunner VX 1.8L HO (2016–2020)", 1812, "cc", 0, ["VX Cruiser"]],
  "seadoo-spark-900ace-2014":               ["Spark 900 ACE (2014+)", 899, "cc", 0],
  "seadoo-gti-130-170-1630ace-2020":        ["GTI 130 / 170 1630 ACE (2020+)", 1630, "cc", 0],
  "seadoo-gtx-rxpx-300-1630ace-sc-2016":    ["GTX / RXP-X 300 1630 ACE SC (2016+)", 1630, "cc", 0],

  /* ---- Generators (diesel sets: litres from the engine code; Honda: kVA) ---- */
  "cummins-x2-5g4-pak-genset":    ["X2.5G4/PAK generator", 2.5, "L", 0],
  "cummins-4bt3-3-genset":        ["4BT3.3 generator", 3.3, "L", 0],
  "cummins-x3-3g2-genset":        ["X3.3G2 generator", 3.3, "L", 0],
  "cummins-s3-8g8-genset":        ["S3.8G8 generator", 3.8, "L", 0],
  "cummins-4b3-9g2-genset":       ["4B3.9G2 generator", 3.9, "L", 0],
  "cummins-4bt3-9g3-g4-genset":   ["4BT3.9G3/G4 generator", 3.9, "L", 0],
  "cummins-4bta3-9g3-g4-genset":  ["4BTA3.9G3/G4 generator", 3.9, "L", 0],
  "cummins-6bt5-9g6-genset":      ["6BT5.9G6 generator", 5.9, "L", 0],
  "cummins-6bta5-9g6-genset":     ["6BTA5.9G6 generator", 5.9, "L", 0],
  "cummins-6ct8-3g2-genset":      ["6CT8.3G2 generator", 8.3, "L", 0],
  "cummins-6cta8-3g2-genset":     ["6CTA8.3G2 generator", 8.3, "L", 0],
  "cummins-6ctaa8-3g1-g3-genset": ["6CTAA8.3G1/G3 generator", 8.3, "L", 0],
  "cummins-qsl9g3-genset":        ["QSL9G3 generator", 8.9, "L", 0],
  "cummins-qsl9g5-genset":        ["QSL9G5 generator", 8.9, "L", 0],
  "cummins-lta10g1-g2-genset":    ["LTA10G1/G2 generator", 10, "L", 0],
  "cummins-nta855g3-genset":      ["NTA855G3 generator", 14, "L", 0],
  "cummins-nta855g5-genset":      ["NTA855G5 generator", 14, "L", 0],
  "cummins-qsx15g7-genset":       ["QSX15G7 generator", 15, "L", 0],
  "cummins-qsx15g9-genset":       ["QSX15G9 generator", 15, "L", 0],
  "cummins-kta19-genset":         ["KTA19 generator", 19, "L", 0],
  "cummins-qsk23g2-genset":       ["QSK23G2 generator", 23, "L", 0],
  "cummins-qsk23g3-genset":       ["QSK23G3 generator", 23, "L", 0],
  "cummins-vta28g5-genset":       ["VTA28G5 generator", 28, "L", 0],
  "cummins-qst30g2-genset":       ["QST30G2 generator", 30, "L", 0],
  "cummins-qst30g3-genset":       ["QST30G3 generator", 30, "L", 0],
  "cummins-qst30g4-genset":       ["QST30G4 generator", 30, "L", 0],
  "cummins-kta38g4-genset":       ["KTA38G4 generator", 38, "L", 0],
  "cummins-kta50g3-genset":       ["KTA50G3 generator", 50, "L", 0],
  "cummins-kta50g9-genset":       ["KTA50G9 generator", 50, "L", 0],
  "cummins-qsk60g5-genset":       ["QSK60G5 generator", 60, "L", 0],
  "cummins-qsk60g6-genset":       ["QSK60G6 generator", 60, "L", 0],
  "perkins-404d-22g-genset":          ["404D-22G generator", 2.2, "L", 0, ["generator engine"]],
  "perkins-1103a-33g-genset":         ["1103A-33G generator", 3.3, "L", 0, ["generator engine"]],
  "perkins-1103a-33tg1-2-genset":     ["1103A-33TG1/2 generator", 3.3, "L", 0, ["generator engine"]],
  "perkins-1104a-44tg2-genset":       ["1104A-44TG2 generator", 4.4, "L", 0, ["generator engine"]],
  "perkins-1104c-44tag2-genset":      ["1104C-44TAG2 generator", 4.4, "L", 0, ["generator engine"]],
  "perkins-1106a-70tg1-genset":       ["1106A-70TG1 generator", 7, "L", 0, ["generator engine"]],
  "perkins-1106a-70tag2-3-4-genset":  ["1106A-70TAG2/3/4 generator", 7, "L", 0, ["generator engine"]],
  "perkins-1506a-e88tag2-genset":     ["1506A-E88TAG2 generator", 8.8, "L", 0, ["generator engine"]],
  "perkins-1506a-e88tag5-genset":     ["1506A-E88TAG5 generator", 8.8, "L", 0, ["generator engine"]],
  "perkins-2506a-e15tag1-genset":     ["2506A-E15TAG1 generator", 15, "L", 0, ["generator engine"]],
  "perkins-2506a-e15tag2-genset":     ["2506A-E15TAG2 generator", 15, "L", 0, ["generator engine"]],
  "perkins-2806a-e18tag1a-genset":    ["2806A-E18TAG1A generator", 18, "L", 0, ["generator engine"]],
  "perkins-2806a-e18tag2-genset":     ["2806A-E18TAG2 generator", 18, "L", 0, ["generator engine"]],
  "perkins-4006tag2a-3a-genset":      ["4006TAG2A/3A generator", 22.9, "L", 0, ["generator engine"]],
  "perkins-4008tag2a-genset":         ["4008TAG2A generator", 30.6, "L", 0, ["generator engine"]],
  "perkins-4012-46tag2a-3a-genset":   ["4012-46TAG2A/3A generator", 45.8, "L", 0, ["generator engine"]],
  "perkins-4012-46tag3a-genset":      ["4012-46TAG3A generator", 45.8, "L", 0, ["generator engine"]],
  "perkins-4012-46twg2a-genset":      ["4012-46TWG2A generator", 45.8, "L", 0, ["generator engine"]],
  "perkins-4016-61trg1-genset":       ["4016-61TRG1 generator", 61.1, "L", 0, ["generator engine"]],
  "perkins-4016-61trg3a-genset":      ["4016-61TRG3A generator", 61.1, "L", 0, ["generator engine"]],
  "perkins-4016tag2a-genset":         ["4016TAG2A generator", 61.1, "L", 0, ["generator engine"]],
  "honda-eu22i-generator":  ["EU22i inverter generator", 2.2, "kVA", 0],
  "honda-eu30is-generator": ["EU30is inverter generator", 3, "kVA", 0],
  "honda-eu70is-generator": ["EU70is inverter generator", 7, "kVA", 0],
};

/* [id, vertical, brand, name, size, unit, family, search aliases?] — empty model entries. */
const RANGE_MODELS = [
  /* Mercury, Hassan Marine range (SeaPro, Verado V10, Avator). SeaPro 115 stays
     empty: the 115 stock list is confirmed for the FourStroke 2.1L 115 only. */
  ["mercury-seapro-15",      "outboards", "Mercury", "SeaPro 15 hp",            15, "hp", 2],
  ["mercury-seapro-25",      "outboards", "Mercury", "SeaPro 25 hp",            25, "hp", 2],
  ["mercury-seapro-60",      "outboards", "Mercury", "SeaPro 60 hp",            60, "hp", 2],
  ["mercury-seapro-90",      "outboards", "Mercury", "SeaPro 90 hp",            90, "hp", 2],
  ["mercury-seapro-115",     "outboards", "Mercury", "SeaPro 2.1L 115 hp",     115, "hp", 2],
  ["mercury-seapro-150",     "outboards", "Mercury", "SeaPro 3.0L 150 hp",     150, "hp", 2],
  ["mercury-seapro-200",     "outboards", "Mercury", "SeaPro V6 3.4L 200 hp",  200, "hp", 2],
  ["mercury-seapro-250",     "outboards", "Mercury", "SeaPro V8 4.6L 250 hp",  250, "hp", 2],
  ["mercury-seapro-300",     "outboards", "Mercury", "SeaPro V8 4.6L 300 hp",  300, "hp", 2],
  ["mercury-seapro-350",     "outboards", "Mercury", "SeaPro V10 5.7L 350 hp", 350, "hp", 2],
  ["mercury-seapro-500",     "outboards", "Mercury", "SeaPro V12 7.6L 500 hp", 500, "hp", 2],
  ["mercury-verado-v10-400", "outboards", "Mercury", "Verado V10 5.7L 400 hp", 400, "hp", 2],
  ["mercury-avator-7-5e",    "outboards", "Mercury", "Avator 7.5e",            7.5, "hp", 3],
  ["mercury-avator-20e",     "outboards", "Mercury", "Avator 20e",              20, "hp", 3],
  ["mercury-avator-35e",     "outboards", "Mercury", "Avator 35e",              35, "hp", 3],

  /* Yamaha, Yamaha Maldives / Alia outboard range. */
  ["yamaha-4hp-2stroke",  "outboards", "Yamaha", "2-stroke 4 hp",    4, "hp", 0],
  ["yamaha-8hp-2stroke",  "outboards", "Yamaha", "2-stroke 8 hp",    8, "hp", 0],
  ["yamaha-f6",           "outboards", "Yamaha", "F6 6 hp",          6, "hp", 1],
  ["yamaha-f15",          "outboards", "Yamaha", "F15 15 hp",       15, "hp", 1],
  ["yamaha-f25",          "outboards", "Yamaha", "F25 25 hp",       25, "hp", 1],
  ["yamaha-f60",          "outboards", "Yamaha", "F60 60 hp",       60, "hp", 1, ["FT60", "FT60J"]],
  ["yamaha-f80",          "outboards", "Yamaha", "F80 80 hp",       80, "hp", 1],
  ["yamaha-f100",         "outboards", "Yamaha", "F100 100 hp",    100, "hp", 1],
  ["yamaha-f350",         "outboards", "Yamaha", "F350 350 hp",    350, "hp", 1],
  ["yamaha-v8-f400",      "outboards", "Yamaha", "V8 F400 400 hp", 400, "hp", 1, ["F400"]],
  ["yamaha-xto-450",      "outboards", "Yamaha", "XTO 450 hp",     450, "hp", 1, ["XTO", "F450"]],

  /* Suzuki, MTCC outboard range not covered by an existing group. DF200A is the
     inline-4, not the DF200 V6 3.6L group; DF250AP is kept apart from the
     DF250A / DF300A group because the fit is not confirmed. */
  ["suzuki-df2-5s",   "outboards", "Suzuki", "DF2.5S 2.5 hp",  2.5, "hp", 1],
  ["suzuki-df4a",     "outboards", "Suzuki", "DF4A 4 hp",        4, "hp", 1],
  ["suzuki-df6a",     "outboards", "Suzuki", "DF6A 6 hp",        6, "hp", 1],
  ["suzuki-df9-9a",   "outboards", "Suzuki", "DF9.9A 9.9 hp",  9.9, "hp", 1],
  ["suzuki-df15a",    "outboards", "Suzuki", "DF15A 15 hp",     15, "hp", 1],
  ["suzuki-df20a",    "outboards", "Suzuki", "DF20A 20 hp",     20, "hp", 1],
  ["suzuki-df25al",   "outboards", "Suzuki", "DF25AL 25 hp",    25, "hp", 1],
  ["suzuki-df30a",    "outboards", "Suzuki", "DF30A 30 hp",     30, "hp", 1],
  ["suzuki-df150a",   "outboards", "Suzuki", "DF150A 150 hp",  150, "hp", 1],
  ["suzuki-df175a",   "outboards", "Suzuki", "DF175A 175 hp",  175, "hp", 1],
  ["suzuki-df200a",   "outboards", "Suzuki", "DF200A 200 hp",  200, "hp", 1],
  ["suzuki-df250ap",  "outboards", "Suzuki", "DF250AP 250 hp", 250, "hp", 1],
  ["suzuki-df325a",   "outboards", "Suzuki", "DF325A 325 hp",  325, "hp", 1],

  /* Tohatsu, MEQ. */
  ["tohatsu-mfs50a",  "outboards", "Tohatsu", "MFS50A 50 hp", 50, "hp", 1],

  /* Parsun, MotoX (sold; no public parts list). */
  ["parsun-f130",     "outboards", "Parsun", "F130 130 hp", 130, "hp", 1],
  ["parsun-f300",     "outboards", "Parsun", "F300 300 hp", 300, "hp", 1],

  /* Caterpillar marine, ILAA Maldives. Doosan (no model codes confirmed) and
     Yanmar 6LY (no Maldives dealer page found) are not added. */
  ["caterpillar-c12-marine", "marine_diesel", "Caterpillar", "C12 12.0L", 12,   "L", 0],
  ["caterpillar-c18-marine", "marine_diesel", "Caterpillar", "C18 18.1L", 18.1, "L", 0],
  ["caterpillar-c32-marine", "marine_diesel", "Caterpillar", "C32 32.1L", 32.1, "L", 0],

  /* Yamaha WaveRunners on Alia with a 1.9L engine; the 1.8L parts are not
     re-pointed to them. */
  ["yamaha-waverunner-fx-1.9l-ho",        "jetski", "Yamaha", "WaveRunner FX Series 1900",     1898, "cc", 0, ["FX 1900", "FX 1.9L HO"]],
  ["yamaha-waverunner-vx-cruiser-1.9l-ho","jetski", "Yamaha", "WaveRunner VX Cruiser HO 1900", 1898, "cc", 0, ["VX Cruiser HO", "VX 1900", "1.9L HO"]],
];

/* Trim models that take the same service parts as an engine already listed.
   source id -> target ids; tools/build-equip.js adds the targets to every part
   that fits the source. Targets are real models (DEALER_MARINE_MODELS), not
   RANGE_MODELS, so they ship with parts. */
const SHARE_FITS = {
  /* VX Cruiser and VX Deluxe 1050 run the same TR-1 1049 cc engine as the VX 1050. */
  "yamaha-waverunner-vx-1050-tr1-2015": ["yamaha-waverunner-vx-cruiser-1050", "yamaha-waverunner-vx-deluxe-1050"],
  "yamaha-waverunner-jetblaster-2022":  ["yamaha-waverunner-jetblaster-pro-1050"],
};
