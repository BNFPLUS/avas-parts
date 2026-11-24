<!-- Research notes for src-data/data-engine-range.js. tools/build-equip.js does NOT read
     this file; nothing here ships to the site. No prices, images or text copied. -->
# Engine range: where the empty model entries come from

Public Maldives dealer pages (checked for the 2026-11 research pass, see
avas-preview-inputs/mercury115/maldives-engine-gaps.md):

| Make | Dealer page | Entries added (0 parts) |
|---|---|---|
| Mercury | Hassan Marine, https://hassanmarine.com/mercury/ | SeaPro 15/25/60/90/115/150/200/250/300/350/500, Verado V10 400, Avator 7.5e/20e/35e |
| Yamaha outboards | Yamaha Maldives / Alia, https://yamahamaldives.com | 2-stroke 4, 8; F6, F15, F25, F60, F80, F100, F350, V8 F400, XTO 450 |
| Yamaha WaveRunner | https://yamahamaldives.com/waverunners/ | FX 1.9L HO, VX Cruiser 1.9L HO |
| Suzuki | MTCC, https://mtcc.mv/suzuki-outboard-engines/ | DF2.5S, DF4A, DF6A, DF9.9A, DF15A, DF20A, DF25AL, DF30A, DF150A, DF175A, DF200A, DF250AP, DF325A |
| Tohatsu | MEQ, https://meq.mv | MFS50A |
| Parsun | MotoX Maldives | F130, F300 |
| Caterpillar marine | ILAA Maldives | C12, C18, C32 |

Not added: Mercury FourStroke 2.5–150 / Pro XS (Hassan Marine does not list the models);
Doosan marine (no model codes confirmed on a public VAMCO page); Yanmar 6LY (no Maldives
dealer page found); Kawasaki jet skis (no Maldives dealer); new generator models (no
dealer page names one we lack).

SeaPro 115 is left empty: the 115 stock list is confirmed for the FourStroke 2.1L 115
only, and no public SeaPro 115 listing was used to confirm the same numbers.

Sizes in MODEL_META are sort keys: outboard hp (lower bound of a range), litres for
diesels (Cummins / Perkins / CAT from the engine code; Yanmar 6CH 5.8L, 6HA2M / 6HYM
11.1L, 6AYM 20.4L), kVA for Honda inverter generators, cc for jet skis.
