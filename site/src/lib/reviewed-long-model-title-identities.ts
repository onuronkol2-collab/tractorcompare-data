/** Exact public catalogue identities reviewed 2026-11-24.
 * Title-only display labels. The original raw catalogue strings and evidence,
 * measurement caveats and source conflicts remain in descriptions and JSON-LD.
 * Never apply an entry to changed or unknown equipment, market, or year.
 * No inferred power figures, drive types, or new technical claims.
 */
export type ReviewedLongTitleRow = {
  brand:string; model:string; rawVariant:string; rawMarket:string;
  year:number|null; variant:string; market:string|null;
};
export const REVIEWED_LONG_TITLE_ROWS:readonly ReviewedLongTitleRow[] = [
  {
    "brand": "Agrale",
    "model": "4125",
    "rawVariant": "Brazil / original 4125 / 25 cv manufacturer power at 2400rpm",
    "rawMarket": "Brazil",
    "year": null,
    "variant": "original",
    "market": null
  },
  {
    "brand": "Agrale",
    "model": "4233",
    "rawVariant": "Brazil / isodiametric / 30 cv manufacturer power at 3000rpm",
    "rawMarket": "Brazil",
    "year": null,
    "variant": "isodiametric",
    "market": null
  },
  {
    "brand": "Agrale",
    "model": "525",
    "rawVariant": "Brazil / Agrale 3 cyl / 25 cv product-page power at 2350rpm / 8F×8R / torque 83–100 Nm range",
    "rawMarket": "Brazil",
    "year": null,
    "variant": "Agrale 3 cyl, 8F×8R",
    "market": null
  },
  {
    "brand": "Agrale",
    "model": "575 Compact",
    "rawVariant": "Brazil 575 Compact / Perkins 1104D-44 / 15F×15R / 75 cv marketing, ISO/SAE power versions differ",
    "rawMarket": "Brazil",
    "year": null,
    "variant": "Perkins 1104D-44, 15F×15R",
    "market": null
  },
  {
    "brand": "Agrale",
    "model": "575 Super",
    "rawVariant": "Brazil 575 Super / Perkins 1104D-44 / 15F×15R / 75 cv marketing, ISO/SAE power versions differ",
    "rawMarket": "Brazil",
    "year": null,
    "variant": "Perkins 1104D-44, 15F×15R",
    "market": null
  },
  {
    "brand": "Agrale",
    "model": "6185",
    "rawVariant": "Brazil MWM 229-6 TCE 6200cc / factory cab / 24F x 12R / 175cv manufacturer",
    "rawMarket": "Brazil",
    "year": null,
    "variant": "MWM 229-6 TCE, factory cab, 24F×12R",
    "market": null
  },
  {
    "brand": "Agrale",
    "model": "7215",
    "rawVariant": "Brazil MWM Maxx Force 6.0A / 220cv manufacturer / synchronized mechanical transmission",
    "rawMarket": "Brazil",
    "year": null,
    "variant": "MWM Maxx Force 6.0A, synchronized mechanical",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "MACH 4 R",
    "rawVariant": "Europe Stage V / MACH 4 R 8900 R / 4 rubber tracks / ROPS or cab versions",
    "rawMarket": "Europe",
    "year": null,
    "variant": "8900 R, Stage V, 4 rubber tracks, ROPS or cab",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "Panther 26 H",
    "rawVariant": "Europe Stage V / Panther 26 H / hydrostatic 3-range 4WD / 1,035 kg manufacturer weight",
    "rawMarket": "Europe",
    "year": null,
    "variant": "Stage V, 3-range hydrostatic 4WD",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "Panther 26 M",
    "rawVariant": "Europe Stage V / Panther 26 M / 4WD mechanical 9F×3R / 950 kg manufacturer weight",
    "rawMarket": "Europe",
    "year": null,
    "variant": "Stage V, 4WD mechanical 9F×3R",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "SN 6800 V",
    "rawVariant": "Europe Stage V / S90 16F×16R / 1775-1965 kg ROPS and 1925-2115 kg RedCab / TORA 6800 V",
    "rawMarket": "Europe",
    "year": null,
    "variant": "Stage V, TORA, S90 16F×16R, ROPS/RedCab",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "TC 6800 F",
    "rawVariant": "Europe Stage V / S90 16F×16R / ROPS 1870-2075 kg / TC F TORA, not SN articulated",
    "rawMarket": "Europe",
    "year": null,
    "variant": "Stage V, TORA, S90 16F×16R, ROPS",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "TGF 7800 S",
    "rawVariant": "Europe / TGF 7800 S / Yanmar 3319cc Stage V / 16F×16R / ROPS 2090–2310kg",
    "rawMarket": "Europe",
    "year": null,
    "variant": "Yanmar 3319cc, Stage V, 16F×16R, ROPS",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "TONY 8700 V",
    "rawVariant": "Europe Stage V / 8700 V model only / hybrid mechanical-hydrostatic / Deutz 2900cc / cab 2525-2725 kg",
    "rawMarket": "Europe",
    "year": null,
    "variant": "Stage V, mechanical-hydrostatic hybrid, Deutz 2900cc, cab",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "TONY 8900 TRG",
    "rawVariant": "Europe / TONY 8900 TRG / Kubota 3769cc Stage V / 4 automated SIM ranges / ROPS 2290–2400kg",
    "rawMarket": "Europe",
    "year": null,
    "variant": "Kubota 3769cc, Stage V, 4 automated SIM ranges, ROPS",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "TRX 5800",
    "rawVariant": "Europe Stage V / TRX 5800 / S90 16F x 16R / ROPS or RedCab weight ranges",
    "rawMarket": "Europe",
    "year": null,
    "variant": "Stage V, S90 16F×16R, ROPS/RedCab",
    "market": null
  },
  {
    "brand": "Antonio Carraro",
    "model": "TRX 7800 S",
    "rawVariant": "Europe / TRX 7800 S / Yanmar 3319cc Stage V / reversible 16F×16R / ROPS 2160–2340kg",
    "rawMarket": "Europe",
    "year": null,
    "variant": "Yanmar 3319cc, Stage V, reversible 16F×16R, ROPS",
    "market": null
  },
  {
    "brand": "ArmaTrac",
    "model": "804 Fruit Garden Cabin",
    "rawVariant": "International / 804 Fruit Garden Cabin / Perkins / Stage IIIA / 80 HP maker claim / cab",
    "rawMarket": "International",
    "year": null,
    "variant": "Perkins, Stage IIIA",
    "market": null
  },
  {
    "brand": "ArmaTrac",
    "model": "804.4 Fruit Garden ROPS",
    "rawVariant": "International / 804.4 Fruit Garden ROPS / Perkins / Stage IIIA / 80 HP maker claim / ROPS",
    "rawMarket": "International",
    "year": null,
    "variant": "Perkins, Stage IIIA",
    "market": null
  },
  {
    "brand": "Belarus",
    "model": "1025.2",
    "rawVariant": "D-245S Stage I / 16F + 8R / 56 L/min regional configuration",
    "rawMarket": "Kazakhstan",
    "year": null,
    "variant": "D-245S Stage I, 16F+8R",
    "market": null
  },
  {
    "brand": "Belarus",
    "model": "1221.3",
    "rawVariant": "Agromeh D-260.2S2 Stage II / 16F + 8R or optional 24F + 12R",
    "rawMarket": "Moldova",
    "year": null,
    "variant": "Agromeh D-260.2S2 Stage II, 16F+8R or optional 24F+12R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "ARJUN 555 DI",
    "rawVariant": "India / 8 F + 2 R / drive type not stated by maker spec",
    "rawMarket": "India",
    "year": null,
    "variant": "8F+2R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "ARJUN 605 DI i",
    "rawVariant": "India / 8 F + 2 R / drive type not stated by maker spec",
    "rawMarket": "India",
    "year": null,
    "variant": "8F+2R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "ARJUN 605 DI MS",
    "rawVariant": "India / 8 F + 2 R / drive type not stated by maker spec",
    "rawMarket": "India",
    "year": null,
    "variant": "8F+2R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "ARJUN 605 DI MS V1",
    "rawVariant": "India / 16 F + 4 R / drive type not stated by maker spec",
    "rawMarket": "India",
    "year": null,
    "variant": "16F+4R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "JIVO 305 DI 4WD VINEYARD",
    "rawVariant": "India 4WD VINEYARD / 8F x 4R / PTO source conflict",
    "rawMarket": "India",
    "year": null,
    "variant": "8F×4R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "NOVO 605 DI 4WD V1",
    "rawVariant": "India 4WD / 15F x 15R / page technical table also lists 2WD family",
    "rawMarket": "India",
    "year": null,
    "variant": "15F×15R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "NOVO 605 DI PS 4WD V1",
    "rawVariant": "India 4WD / 15F x 15R / page technical table covers 2WD and 4WD",
    "rawMarket": "India",
    "year": null,
    "variant": "15F×15R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "NOVO 605 DI V1",
    "rawVariant": "India 2WD or 4WD family / 15F x 3R / exact drivetrain unscoped",
    "rawMarket": "India",
    "year": null,
    "variant": "2WD or 4WD family, 15F×3R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "NOVO 655 DI PP V1",
    "rawVariant": "India 2WD / 15F x 15R / family technical table also lists 4WD",
    "rawMarket": "India",
    "year": null,
    "variant": "2WD, 15F×15R",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "OJA 3132",
    "rawVariant": "India 4WD / 8F x 8R / single clutch / synchro shuttle",
    "rawMarket": "India",
    "year": null,
    "variant": "4WD, 8F×8R, single clutch, synchro shuttle",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "OJA 3136",
    "rawVariant": "India 4WD / 12F x 12R / single clutch / synchro shuttle",
    "rawMarket": "India",
    "year": null,
    "variant": "4WD, 12F×12R, single clutch, synchro shuttle",
    "market": null
  },
  {
    "brand": "Mahindra",
    "model": "OJA 3140",
    "rawVariant": "India 4WD / 12F x 12R / single clutch / synchro shuttle",
    "rawMarket": "India",
    "year": null,
    "variant": "4WD, 12F×12R, single clutch, synchro shuttle",
    "market": null
  },
  {
    "brand": "Solis",
    "model": "60 HVAC Stage V",
    "rawVariant": "Stage V · 4WD · HVAC kabin · radyal lastik · 12F/12R",
    "rawMarket": "Türkiye",
    "year": 2026,
    "variant": "4WD, HVAC, radial tyres, 12F/12R",
    "market": null
  },
  {
    "brand": "Solis",
    "model": "75 HVAC Stage V",
    "rawVariant": "Stage V · 4WD · HVAC kabin · radyal lastik · 12F/12R",
    "rawMarket": "Türkiye",
    "year": 2025,
    "variant": "4WD, HVAC, radial tyres, 12F/12R",
    "market": null
  },
  {
    "brand": "Solis",
    "model": "90 HVAC Stage V",
    "rawVariant": "Stage V · 4WD · HVAC kabin · radyal lastik · 12F/12R",
    "rawMarket": "Türkiye",
    "year": 2025,
    "variant": "4WD, HVAC, radial tyres, 12F/12R",
    "market": null
  },
  {
    "brand": "Sonalika",
    "model": "DI 42 P+",
    "rawVariant": "India 2WD family / trim options (Sikander, Sikander-Rx, DLX-Rx)",
    "rawMarket": "India",
    "year": null,
    "variant": "2WD family, Sikander/Sikander-Rx/DLX-Rx options",
    "market": null
  },
  {
    "brand": "Sonalika",
    "model": "DI 734",
    "rawVariant": "India 2WD / single clutch / 8F+2R / optional brake and steering trims",
    "rawMarket": "India",
    "year": null,
    "variant": "2WD, single clutch, 8F+2R, brake/steering options",
    "market": null
  },
  {
    "brand": "Sonalika",
    "model": "DI 734 Power Plus",
    "rawVariant": "India 2WD / 8F×2R centre gear / standard and Rx trims",
    "rawMarket": "India",
    "year": null,
    "variant": "2WD, 8F×2R centre gear, standard/Rx trims",
    "market": null
  },
  {
    "brand": "Sonalika",
    "model": "DI 740 III",
    "rawVariant": "2WD DI 740 III / HDM, Super, Sikander trim options",
    "rawMarket": "India",
    "year": null,
    "variant": "2WD, HDM/Super/Sikander options",
    "market": null
  },
  {
    "brand": "Sonalika",
    "model": "RX 42",
    "rawVariant": "2WD RX 42 / Sikander family / optional steering and clutch",
    "rawMarket": "India",
    "year": null,
    "variant": "2WD, Sikander family, steering/clutch options",
    "market": null
  },
  {
    "brand": "Sonalika",
    "model": "Tiger DI 50",
    "rawVariant": "2WD Tiger DI 50 / clutch, gearbox and rear tyre options",
    "rawMarket": "India",
    "year": null,
    "variant": "2WD, clutch/gearbox/rear tyre options",
    "market": null
  },
  {
    "brand": "Valtra",
    "model": "A75",
    "rawVariant": "A Series Gen5 Stage V / Gear lever, optional HiTech 2",
    "rawMarket": "International (2025 brochure)",
    "year": null,
    "variant": "Gen5 Stage V, gear lever, optional HiTech 2",
    "market": "International"
  },
  {
    "brand": "Valtra",
    "model": "A85",
    "rawVariant": "A Series Gen5 Stage V / Gear lever, optional HiTech 2",
    "rawMarket": "International (2025 brochure)",
    "year": null,
    "variant": "Gen5 Stage V, gear lever, optional HiTech 2",
    "market": "International"
  },
  {
    "brand": "Valtra",
    "model": "A95",
    "rawVariant": "A Series Gen5 Stage V / Gear lever, optional HiTech 2",
    "rawMarket": "International (2025 brochure)",
    "year": null,
    "variant": "Gen5 Stage V, gear lever, optional HiTech 2",
    "market": "International"
  },
  {
    "brand": "Versatile",
    "model": "405",
    "rawVariant": "4WD / narrow frame / Stage V / Cat TA19 powershift",
    "rawMarket": "North America",
    "year": null,
    "variant": "4WD, narrow frame, Stage V, Cat TA19 powershift",
    "market": null
  },
  {
    "brand": "Versatile",
    "model": "430",
    "rawVariant": "4WD / narrow frame / Stage V / Cat TA19 powershift",
    "rawMarket": "North America",
    "year": null,
    "variant": "4WD, narrow frame, Stage V, Cat TA19 powershift",
    "market": null
  },
  {
    "brand": "Versatile",
    "model": "460",
    "rawVariant": "4WD / narrow frame / Stage V / Cat TA19 powershift",
    "rawMarket": "North America",
    "year": null,
    "variant": "4WD, narrow frame, Stage V, Cat TA19 powershift",
    "market": null
  },
  {
    "brand": "Versatile",
    "model": "530",
    "rawVariant": "4WD / large frame / Stage V / Cat TA22 powershift",
    "rawMarket": "North America",
    "year": null,
    "variant": "4WD, large frame, Stage V, Cat TA22 powershift",
    "market": null
  },
  {
    "brand": "Versatile",
    "model": "580",
    "rawVariant": "4WD / large frame / Stage V / Cat TA22 powershift",
    "rawMarket": "North America",
    "year": null,
    "variant": "4WD, large frame, Stage V, Cat TA22 powershift",
    "market": null
  },
  {
    "brand": "Versatile",
    "model": "620",
    "rawVariant": "4WD / large frame / Stage V / Cat TA22 powershift",
    "rawMarket": "North America",
    "year": null,
    "variant": "4WD, large frame, Stage V, Cat TA22 powershift",
    "market": null
  },
  {
    "brand": "Yanmar",
    "model": "YM347",
    "rawVariant": "YM3 / North America synchronized 8F/8R shuttle / ROPS",
    "rawMarket": "North America (2022 OEM YM datasheet; Turkey marketing class separately)",
    "year": null,
    "variant": "YM3, synchronized 8F/8R shuttle, ROPS",
    "market": "North America"
  },
  {
    "brand": "Yanmar",
    "model": "YM359",
    "rawVariant": "YM3 / North America synchronized 8F/8R shuttle / ROPS",
    "rawMarket": "North America (2022 OEM YM datasheet; Turkey marketing class separately)",
    "year": null,
    "variant": "YM3, synchronized 8F/8R shuttle, ROPS",
    "market": "North America"
  }
];
const key=(brand:string,model:string,variant:string,market:string,year:number|null)=>
  JSON.stringify([brand,model,variant,market,year]);
const registry=new Map(REVIEWED_LONG_TITLE_ROWS.map(row=>
  [key(row.brand,row.model,row.rawVariant,row.rawMarket,row.year),row]));
export function reviewedLongTitleRow(brand:string,model:string,variant:string|null,market:string|null,year:number|null){
  return variant&&market ? registry.get(key(brand,model,variant,market,year)) : undefined;
}
