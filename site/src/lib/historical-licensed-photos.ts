/** 2026-11-14 historical catalogue: manually screened exact-model Commons file titles.
 * Licensing metadata was retrieved from Wikimedia Commons API 2026-11-19.
 * All photos are illustrative of the MODEL, never claims about exact variant
 * or original copyright ownership. Only public models render in Astro pages.
 */
const W="https://upload.wikimedia.org/wikipedia/commons/";
const candidates=[
  {
    "brand": "Belarus",
    "model": "132N",
    "fileId": "belarus-132n-picture30-2011",
    "path": "c/c9/Belarus-132N.jpg",
    "photographer": "Picture30",
    "copyrightOwner": "Picture30",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Belarus-132N.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 3.0",
    "width": 3072,
    "height": 2304
  },
  {
    "brand": "Belarus",
    "model": "152",
    "fileId": "belarus-152-homoatrox-2021",
    "path": "2/28/Belarus_152_tractor_%28Belagro-2021%29.jpg",
    "photographer": "Homoatrox",
    "license": "CC BY-SA 3.0",
    "width": 4578,
    "height": 3746
  },
  {
    "brand": "Valtra",
    "model": "Q265",
    "fileId": "valtra-q265-65863feb",
    "path": "8/89/Valtra_Q265_agra_2024_%28DSC03934%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_Q265_agra_2024_%28DSC03934%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6852,
    "height": 3856
  },
  {
    "brand": "Valtra",
    "model": "G135",
    "fileId": "valtra-g135-9d4a4ea3",
    "path": "1/11/Valtra_G135_Agritechnica_2025_%28DSC09509%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_G135_Agritechnica_2025_%28DSC09509%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 5993,
    "height": 4495
  },
  {
    "brand": "Valtra",
    "model": "F105",
    "fileId": "valtra-f105-80828837",
    "path": "e/e0/Valtra_F105_auf_der_Agritechnica_2023.jpg",
    "photographer": "Johann Brause",
    "license": "CC0",
    "width": 3440,
    "height": 2488
  },
  {
    "brand": "Valtra",
    "model": "Q245",
    "fileId": "valtra-q245-2d50312e",
    "path": "5/5e/Valtra_Q245_Agritechnica_2025_%28DSC05243%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_Q245_Agritechnica_2025_%28DSC05243%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6224,
    "height": 3501
  },
  {
    "brand": "Valtra",
    "model": "Q305",
    "fileId": "valtra-q305-d4c20807",
    "path": "6/60/Valtra_Q305_Agritechnica_2025_%28DSC04493%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_Q305_Agritechnica_2025_%28DSC04493%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6148,
    "height": 4611
  },
  {
    "brand": "Valtra",
    "model": "T215",
    "fileId": "valtra-t215-88d0ab88",
    "path": "9/94/Valtra_T215_DLG-Feldtage_2026_%28DSC06544%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_T215_DLG-Feldtage_2026_%28DSC06544%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6912,
    "height": 3888
  },
  {
    "brand": "Valtra",
    "model": "S416",
    "fileId": "valtra-s416-4506a2eb",
    "path": "4/46/Valtra_S416%2C_Agritechnica_2023%2C_Hanover_%28P1140916%29.jpg",
    "photographer": "MB-one",
    "license": "CC BY-SA 4.0",
    "width": 4608,
    "height": 3456
  },
  {
    "brand": "Valtra",
    "model": "A85",
    "fileId": "valtra-a85-af39c01a",
    "path": "e/e1/Valtra_A85_Traktor.jpg",
    "photographer": "JoachimKohler-HB",
    "copyrightOwner": "JoachimKohler-HB",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_A85_Traktor.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 4000,
    "height": 3000
  },
  {
    "brand": "Valtra",
    "model": "Q225",
    "fileId": "valtra-q225-a6c1308e",
    "path": "6/6e/Valtra_Q225.jpg",
    "photographer": "Bene Riobó",
    "license": "CC BY-SA 4.0",
    "width": 4650,
    "height": 3100
  },
  {
    "brand": "Valtra",
    "model": "T255",
    "fileId": "valtra-t255-622d182c",
    "path": "c/ca/Valtra_T255_01.jpg",
    "photographer": "Bene Riobó",
    "copyrightOwner": "Bene Riobó",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_T255_01.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6000,
    "height": 4000
  },
  {
    "brand": "Valtra",
    "model": "N175",
    "fileId": "valtra-n175-e4277f5d",
    "path": "4/4a/Valtra_N175_Agritechnica_2023_%28DSC04032%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_N175_Agritechnica_2023_%28DSC04032%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 7008,
    "height": 3944
  },
  {
    "brand": "Valtra",
    "model": "A75",
    "fileId": "valtra-a75-f99b4394",
    "path": "7/76/Valtra_A75-4.jpg",
    "photographer": "Bene Riobó",
    "copyrightOwner": "Bene Riobó",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_A75-4.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6000,
    "height": 4000
  },
  {
    "brand": "Valtra",
    "model": "N135",
    "fileId": "valtra-n135-beef7a3c",
    "path": "7/7e/Valtra_N135_en_Roma.jpg",
    "photographer": "Bene Riobó",
    "copyrightOwner": "Bene Riobó",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_N135_en_Roma.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 5265,
    "height": 3510
  },
  {
    "brand": "Valtra",
    "model": "A105",
    "fileId": "valtra-a105-cd63351d",
    "path": "9/91/Valtra_A105.jpg",
    "photographer": "Bene Riobó",
    "copyrightOwner": "Bene Riobó",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Valtra_A105.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6000,
    "height": 4000
  },
  {
    "brand": "Valtra",
    "model": "T235",
    "fileId": "valtra-t235-c552da4d",
    "path": "6/6d/Valtra_T235_with_V%C3%A4derstad_Rapid_400C_seed_drill.jpg",
    "photographer": "Antti Leppänen",
    "license": "CC BY 4.0",
    "width": 4608,
    "height": 3072
  },
  {
    "brand": "Başak Traktör",
    "model": "5120",
    "fileId": "basak-5120-7915e01c",
    "path": "e/ee/Ba%C5%9Fak_5120_Red_Power_Agritechnica_2023_%28DSC06644%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 7008,
    "height": 3944
  },
  {
    "brand": "Antonio Carraro",
    "model": "TTR 3800 HST II",
    "fileId": "antonio-carraro-ttr-3800-hst-ii-5b2e5a48",
    "path": "8/8b/Antonio_Carraro_TTR_3800_HST_II_%C3%96ko-Feldtage_2025_%28DSC01924%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 6924,
    "height": 4616
  },
  {
    "brand": "Antonio Carraro",
    "model": "TONY 8700 V",
    "fileId": "antonio-carraro-tony-8700-v-3a40790b",
    "path": "6/6a/Antonio_Carraro_TONY_8700V_%282022%29.jpg",
    "photographer": "Ubraxa",
    "copyrightOwner": "Ubraxa",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Antonio_Carraro_TONY_8700V_%282022%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 3648,
    "height": 2736
  },
  {
    "brand": "Antonio Carraro",
    "model": "TIGRE 3800",
    "fileId": "antonio-carraro-tigre-3800-439af04e",
    "path": "a/ae/Eko-Las_-_Antonio_Carraro_Tigre_3800_-_05.09.2025_12-42-28.jpg",
    "photographer": "Radosław Drożdżewski (Zwiadowca21)",
    "license": "CC BY-SA 4.0",
    "width": 4288,
    "height": 2848
  },
  {
    "brand": "TAFE",
    "model": "7515 GE",
    "fileId": "tafe-7515-ge-b58817d2",
    "path": "0/05/TAFE_7515_GE_Agritechnica_2025_%28DSC04081%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 6054,
    "height": 4541
  },
  {
    "brand": "TAFE",
    "model": "7515 CAB",
    "fileId": "tafe-7515-cab-37863e86",
    "path": "4/42/TAFE_7515_Cab_Agritechnica_2023_%28DSC03680%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:TAFE_7515_Cab_Agritechnica_2023_%28DSC03680%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 7008,
    "height": 3944
  },
  {
    "brand": "TAFE",
    "model": "6028 M",
    "fileId": "tafe-6028-m-826b548b",
    "path": "d/d3/TAFE_6028M_agra_2024_%28DSC01244%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:TAFE_6028M_agra_2024_%28DSC01244%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6900,
    "height": 3883
  },
  {
    "brand": "TAFE",
    "model": "7515",
    "fileId": "tafe-7515-d8c32d69",
    "path": "5/50/Tafe_7515%2C_Agritechnica_2023%2C_Hanover_%28P1160312%29.jpg",
    "photographer": "MB-one",
    "copyrightOwner": "MB-one",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Tafe_7515%2C_Agritechnica_2023%2C_Hanover_%28P1160312%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 4608,
    "height": 3456
  },
  {
    "brand": "TAFE",
    "model": "240 S",
    "fileId": "tafe-240-s-c45f9eaf",
    "path": "0/0c/TAFE_240S_agra_2026_%28DSC2787%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:TAFE_240S_agra_2026_%28DSC2787%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6229,
    "height": 4672
  },
  {
    "brand": "Zetor",
    "model": "FORTERRA 140",
    // The Commons file depicts HSX equipment; never silently label CL/HD as HSX.
    "tractorId": "aabda943-446b-4543-a019-c73b743652eb",
    "fileId": "zetor-forterra-140-346bcbde",
    "path": "2/2e/Zetor_Forterra_140_HSX.jpg",
    "photographer": "Bene Riobó",
    "copyrightOwner": "Bene Riobó",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Zetor_Forterra_140_HSX.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 4200,
    "height": 2800
  },
  {
    "brand": "Zetor",
    "model": "FORTERRA 110",
    "fileId": "zetor-forterra-110-536b7625",
    "path": "4/48/Zetor_Forterra_110_HSX_%28Leipzig_2023%29.jpg",
    "photographer": "Manataworf",
    "copyrightOwner": "Manataworf",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Zetor_Forterra_110_HSX_%28Leipzig_2023%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 4888,
    "height": 3888
  },
  {
    "brand": "Versatile",
    "model": "Nemesis 255",
    "fileId": "versatile-nemesis-255-be32337e",
    "path": "9/9e/Versatile_Nemesis_255_CVT_Agritechnica_2025_%28DSC08750%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Versatile_Nemesis_255_CVT_Agritechnica_2025_%28DSC08750%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6224,
    "height": 4672
  },
  {
    "brand": "Versatile",
    "model": "Nemesis 175",
    "fileId": "versatile-nemesis-175-e95b1863",
    "path": "2/2f/Versatile_Nemesis_175_Agritechnica_2025_%28DSC00300%29.jpg",
    "photographer": "MarcelX42",
    "copyrightOwner": "MarcelX42",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Versatile_Nemesis_175_Agritechnica_2025_%28DSC00300%29.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 6224,
    "height": 4672
  },
  {
    "brand": "Yanmar",
    "model": "SA222",
    "fileId": "yanmar-sa222-b0cb8c8c",
    "path": "5/5d/Yanmar_SA222-Q_Agritechnica_2025_%28DSC07302%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 5949,
    "height": 4462
  },
  {
    "brand": "Deutz-Fahr",
    "model": "6165",
    "fileId": "deutz-fahr-6165-29b10f3c",
    "path": "8/8b/Deutz-Fahr_6165_TTV.jpg",
    "photographer": "Bene Riobó",
    "license": "CC BY-SA 4.0",
    "width": 5250,
    "height": 3500
  },
  {
    "brand": "Deutz-Fahr",
    "model": "AgroStar 6.11",
    "fileId": "deutz-fahr-agrostar-6-11-bd6749bd",
    "path": "3/3d/Deutz-Fahr_AgroStar_6.11.jpg",
    "photographer": "JohannesErwinEugen.R",
    "license": "CC BY-SA 3.0",
    "width": 1900,
    "height": 1425
  },
  {
    "brand": "Mahindra",
    "model": "JIVO 245 DI",
    "fileId": "mahindra-jivo-245-di-d2fc00a0",
    "path": "8/8c/Mahindra_JIVO_245_DI_4WD_Agritechnica_2017_-_Front_and_left_side.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 5456,
    "height": 3064
  },
  {
    "brand": "Fendt",
    "model": "724 Vario",
    "fileId": "fendt-724-vario-01a39bcb",
    "path": "3/3f/Fendt-724-Vario.jpg",
    "photographer": "AGCO-Fendt",
    "copyrightOwner": "AGCO-Fendt",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Fendt-724-Vario.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 2464,
    "height": 1640
  },
  {
    "brand": "Fendt",
    "model": "516 Vario",
    "fileId": "fendt-516-vario-87a9b947",
    "path": "6/67/Fendt_516_Vario.jpg",
    "photographer": "AGCO-Fendt",
    "license": "CC BY-SA 4.0",
    "width": 2464,
    "height": 1640
  },
  {
    "brand": "Kubota",
    "model": "M6-141",
    "fileId": "kubota-m6-141-4d0694e5",
    "path": "9/9c/Kubota_M6-141_Utility_Agritechnica_2023_%28DSC06031%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 7008,
    "height": 3944
  },
  {
    "brand": "Kubota",
    "model": "M5-112",
    "fileId": "kubota-m5-112-c3be6b9d",
    "path": "8/8a/Kubota_M5-112_5D410039_2023_09_06_JM.jpg",
    "photographer": "Johannes Maximilian",
    "license": "CC BY-SA 4.0",
    "width": 1499,
    "height": 999
  },
  {
    "brand": "Swaraj",
    "model": "735 FE",
    "fileId": "swaraj-735-fe-0269bdfd",
    "path": "b/b2/Swaraj_735_FE.jpg",
    "photographer": "Rupal Vaidya",
    "license": "CC BY 2.0",
    "width": 2972,
    "height": 2397
  },
  {
    "brand": "John Deere",
    "model": "5075E",
    "fileId": "john-deere-5075e-8bc5afbe",
    "path": "a/a5/John_Deere_5075E_at_Arold_Service_M%C3%BCnchenbernsdorf.jpg",
    "photographer": "Steffen Mokosch",
    "license": "CC BY-SA 4.0",
    "width": 4080,
    "height": 3060
  },
  {
    "brand": "John Deere",
    "model": "6R 150",
    "fileId": "john-deere-6r-150-2c198cee",
    "path": "6/69/John_Deere_6R_150%2C_Agritechnica_2023%2C_Hanover_%28P1140827%29.jpg",
    "photographer": "MB-one",
    "license": "CC BY-SA 4.0",
    "width": 4608,
    "height": 3456
  },
  {
    "brand": "CLAAS",
    "model": "Axion 870",
    "fileId": "claas-axion-870-1c6e17f1",
    "path": "5/5b/Claas_Axion_870.jpg",
    "photographer": "JoachimKohler-HB",
    "license": "CC BY-SA 4.0",
    "width": 4000,
    "height": 3000
  },
  {
    "brand": "CLAAS",
    "model": "Arion 660",
    "fileId": "claas-arion-660-7f5952d2",
    "path": "a/a6/Claas_Arion_660_Traktor_%282023%29.jpg",
    "photographer": "JoachimKohler-HB",
    "license": "CC BY-SA 4.0",
    "width": 4200,
    "height": 2800
  },
  {
    "brand": "Steyr",
    "model": "6200 IMPULS",
    "fileId": "steyr-6200-impuls-2025",
    "path": "6/6c/Steyr_6200_Impuls_CVT_Agritechnica_2025_%28DSC03498%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 5946,
    "height": 4459
  },
  {
    "brand": "Steyr",
    "model": "6440 CERVUS CVT",
    "fileId": "steyr-6440-cervus-cvt-2025",
    "path": "2/23/Steyr_6440_Cervus_CVT_Agritechnica_2025_%28DSC04360%29.jpg",
    "photographer": "MarcelX42",
    "resizedDerivative": true,
    "license": "CC BY-SA 4.0",
    "width": 6164,
    "height": 4627
  },
  // 21 November 2026: exact-model Commons file pages, dimensions,
  // photographer and compatible CC BY-SA licenses checked individually.
  // JPEG thumbnails were fetched as official 500px derivatives and
  // committed into site/public/images/tractors (no speculative imagery).
  {
    "brand": "Belarus",
    "model": "1220.4",
    "fileId": "belarus-1220-4-dgolnik-2013",
    "path": "8/8e/Belarus_1220.4.jpg",
    "photographer": "Dgolnik",
    "license": "CC BY-SA 3.0",
    "width": 2048,
    "height": 1536
  },
  {
    "brand": "Belarus",
    "model": "1221.3",
    "fileId": "belarus-1221-3-homoatrox-2019",
    "path": "6/63/Belarus_MTZ-1221_3_tractor.jpg",
    "photographer": "Homoatrox",
    "license": "CC BY-SA 3.0",
    "width": 2197,
    "height": 1824
  },
  {
    "brand": "Belarus",
    "model": "622",
    "fileId": "belarus-622-homoatrox-2021",
    "path": "4/48/Belarus_622_tractor.jpg",
    "photographer": "Homoatrox",
    "license": "CC BY-SA 3.0",
    "width": 5393,
    "height": 3595
  },
  {
    "brand": "Belarus",
    "model": "920.2",
    "fileId": "belarus-920-2-homoatrox-2021",
    "path": "9/93/Belarus_920.2_tractor.jpg",
    "photographer": "Homoatrox",
    "license": "CC BY-SA 3.0",
    "width": 4000,
    "height": 6000
  },
  {
    "brand": "Belarus",
    "model": "952.4",
    "fileId": "belarus-952-4-homoatrox-2021",
    "path": "8/8c/Belarus_952.4_tractor.jpg",
    "photographer": "Homoatrox",
    "license": "CC BY-SA 3.0",
    "width": 4058,
    "height": 4000
  },
  {
    "brand": "Steyr",
    "model": "4120 PLUS",
    "fileId": "steyr-4120-plus-marcelx42-2023",
    "path": "0/00/Steyr_4120_Plus_Agritechnica_2023_%28DSC05974%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 6918,
    "height": 3893
  },
  // 21 November 2026: exact published-model Commons photographs;
  // static 500px thumbnail content is produced only after the one-time
  // Wikimedia licence/artist/dimensions download gate has succeeded.
  {
    "brand": "Belarus",
    "model": "892",
    "fileId": "belarus-892-ivan2010-2013",
    "path": "a/a7/Tractor_arando_la_tierra_para_cultivo.jpg",
    "photographer": "Ivan2010",
    "license": "CC BY-SA 4.0",
    "width": 2654,
    "height": 1880
  },
  {
    "brand": "Belarus",
    "model": "892.2",
    "fileId": "belarus-892-2-globetrotter19-2025",
    "path": "c/c6/Belarus_892.2%2C_2025_Dunapataj.jpg",
    "photographer": "Globetrotter19",
    "license": "CC BY-SA 4.0",
    "width": 2592,
    "height": 1944
  },
  {
    "brand": "Belarus",
    "model": "952",
    "fileId": "belarus-952-fraxinus-croat-2011",
    "path": "b/b6/Belarus_952.jpg",
    "photographer": "Fraxinus Croat",
    "license": "CC BY-SA 3.0",
    "width": 2048,
    "height": 1536
  },
  // 2026-11-21: Eight exact-model Commons photographs independently checked
  // by one-time Wikimedia API + JPEG integrity gate. Each local 480px JPEG
  // and original file-specific CC BY-SA 4.0 attribution is preserved.
  {
    "brand": "Steyr",
    "model": "4075 KOMPAKT",
    "fileId": "steyr-4075-kompakt-joachim-2018",
    "path": "2/26/Steyr_4075_Kompakt.jpg",
    "photographer": "JoachimKohlerBremen",
    "copyrightOwner": "JoachimKohlerBremen",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Steyr_4075_Kompakt.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 4200,
    "height": 2800
  },
  {
    "brand": "Steyr",
    "model": "4095 KOMPAKT",
    "fileId": "steyr-4095-kompakt-joachim-2019",
    "path": "0/09/Steyr_4095_Kompakt_mit_Kuhn_BRP28_Mulch-_und_H%C3%A4ckselger%C3%A4t.jpg",
    "photographer": "JoachimKohler-HB",
    "license": "CC BY-SA 4.0",
    "width": 4200,
    "height": 3150
  },
  {
    "brand": "Steyr",
    "model": "4105 KOMPAKT",
    "fileId": "steyr-4105-kompakt-gt1976-2018",
    "path": "8/82/2018-06-28_%28801%29_Steyr_4105_Kompakt_in_Kirchberg_an_der_Pielach.jpg",
    "photographer": "GT1976",
    "license": "CC BY-SA 4.0",
    "width": 4000,
    "height": 3000
  },
  {
    "brand": "Steyr",
    "model": "4115 KOMPAKT",
    "fileId": "steyr-4115-kompakt-joachim-2019",
    "path": "9/92/Steyr_Kompakt_4115.jpg",
    "photographer": "JoachimKohler-HB",
    "license": "CC BY-SA 4.0",
    "width": 4200,
    "height": 3150
  },
  {
    "brand": "Steyr",
    "model": "4130 EXPERT CVT",
    "fileId": "steyr-4130-expert-cvt-marcel-2024",
    "path": "4/41/Steyr_4130_Expert_CVT_agra_2024_%28DSC01621%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 6642,
    "height": 3738
  },
  {
    "brand": "Steyr",
    "model": "4140 EXPERT CVT",
    "fileId": "steyr-4140-expert-cvt-marcel-2023",
    "path": "d/d9/Steyr_4140_Expert_CVT_Agritechnica_2023_%28DSC05407%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 7008,
    "height": 3944
  },
  {
    "brand": "Steyr",
    "model": "6280 ABSOLUT CVT",
    "fileId": "steyr-6280-absolut-cvt-marcel-2024",
    "path": "d/d7/Steyr_6280_Absolut_CVT_agra_2024_%28DSC02603%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 7008,
    "height": 3944
  },
  {
    "brand": "Zetor",
    "model": "6170",
    "fileId": "zetor-6170-marcel-agritechnica-2025",
    "path": "0/0d/Zetor_6170_Agritechnica_2025_%28DSC05468%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 5974,
    "height": 4480
  },
  // Wikimedia Commons exact-model originals, photographer and CC license
  // rechecked 2026-11-21. SHA-256 500px derivative proof is in
  // site/docs/photo-import-evidence-mccormick-20261121.json.
  {
    "brand": "McCormick",
    "model": "X4.080",
    "fileId": "mccormick-x4-080-mbone-agritechnica-2023",
    "path": "3/33/McCormick_X4.080%2C_Agritechnica_2023%2C_Hanover_%28P1140946%29.jpg",
    "photographer": "MB-one",
    "license": "CC BY-SA 4.0",
    "width": 3371,
    "height": 2697
  },
  {
    "brand": "McCormick",
    "model": "X8.631 VT-Drive",
    "fileId": "mccormick-x8-631-vt-drive-marcel-2023",
    "path": "7/77/McCormick_X8.631_VT-Drive_Agritechnica_2023_%28DSC05857%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 7008,
    "height": 3944
  },
  {
    "brand": "Belarus",
    "model": "952.3",
    "fileId": "belarus-952-3-gabinho-bucharest-2011",
    "path": "3/3f/Belarus_952.3_Tractor_in_Bucharest_2011.jpg",
    "photographer": "Gabinho",
    "license": "CC BY-SA 3.0",
    "width": 2592,
    "height": 1944
  },
  // 2026-11-21: exact Commons source, artist, rights and real JPEG verified.
  // Approval ledger: site/docs/steyr-photo-source-audit-20261121.json.
  {
    "brand": "Steyr",
    "model": "4085 KOMPAKT",
    "fileId": "steyr-4085-kompakt-ecotech-commons",
    "path": "1/16/Steyr_4085_Kompakti_Ecotech.jpg",
    "photographer": "JoachimKohler-HB",
    "license": "CC BY-SA 4.0",
    "width": 4000,
    "height": 3200
  },
  {
    "brand": "Steyr",
    "model": "6340 TERRUS CVT",
    "fileId": "steyr-6340-terrus-marcel-2023",
    "path": "8/8c/Steyr_6340_Terrus_CVT_Agritechnica_2023_%28DSC04861%29.jpg",
    "photographer": "MarcelX42",
    "license": "CC BY-SA 4.0",
    "width": 7008,
    "height": 3944
  },
  // 22 November 2026: Exact model photos licensed by their Commons authors.
  // These are staged on a private candidate PR branch and cannot be released
  // until real first-party JPEGs plus source SHA/HTTP/SEO gates have passed.
  {
    "brand": "Belarus",
    "model": "510",
    "fileId": "belarus-510-homoatrox-open-day-2017",
    "path": "1/19/Belarus_510_%28open_day_2017%29_1.jpg",
    "photographer": "Homoatrox",
    "license": "CC BY-SA 4.0",
    "width": 2484,
    "height": 2748
  },
  {
    "brand": "Belarus",
    "model": "922.3",
    "fileId": "belarus-922-3-bulykin-almaty-2026",
    "path": "4/45/%D0%90%D0%BB%D0%BC%D0%B0%D1%82%D1%8B%2C_%D0%91%D0%B5%D0%BB%D0%B0%D1%80%D1%83%D1%81-922.3_%D0%BD%D0%B0_%D0%9A%D1%83%D0%BB%D1%8B%D0%BC%D0%B1%D0%B5%D1%82%D0%BE%D0%B2%D0%B0-%D0%91%D1%80%D1%83%D0%BD%D0%BE.jpg",
    "photographer": "Nikolai Bulykin",
    "license": "CC BY-SA 4.0",
    "width": 5077,
    "height": 3385
  },
  // 22 Nov 2026 batch 2: Commons own-work CC BY-SA, exact published model.
  // Photo never proves recorded engine/power/market/variant configuration.
  // Real first-party JPEGs/attribution must pass CI prior to release.
  {
    "brand": "Belarus",
    "model": "451",
    "fileId": "belarus-451-homoatrox-open-day-2017",
    "path": "8/8c/Belarus_451_%28open_day_2017%29_1.jpg",
    "photographer": "Homoatrox",
    "license": "CC BY-SA 4.0",
    "width": 1480,
    "height": 2216
  },
  {
    "brand": "Belarus",
    "model": "572",
    "fileId": "belarus-572-bronzedrache-2022",
    "path": "7/72/Belazs_MTZ_572.jpg",
    "photographer": "BronzeDrache",
    "license": "CC BY-SA 4.0",
    "width": 2000,
    "height": 1500
  },
  {
    "brand": "Belarus",
    "model": "923.4",
    "fileId": "belarus-923-4-homoatrox-open-day-2017",
    "path": "f/fc/Belarus_923.4_%28open_day_2017%29_1.jpg",
    "photographer": "Homoatrox",
    "license": "CC BY-SA 4.0",
    "width": 3024,
    "height": 2760
  },
  // 22 Nov 2026: exact-model CC BY-SA McCormick photos; hashes in photo-evidence-mccormick-four-20261122.json.
  {"brand":"McCormick","model":"X4.085 TM","fileId":"mccormick-x4-085-tm-marcelx42-2023","path":"f/fb/McCormick_X4.085_TM_Agritechnica_2023_%28DSC05776%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":7008,"height":3944},
  {"brand":"McCormick","model":"X6.414 P6-Drive","fileId":"mccormick-x6-414-p6-drive-marcelx42-2023","path":"5/55/McCormick_X6.414_P6-Drive_Agritechnica_2023_%28DSC04843%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":7008,"height":3944},
  {"brand":"McCormick","model":"X7.618 VT-Drive","fileId":"mccormick-x7-618-vt-drive-marcelx42-2023","path":"5/50/McCormick_X7.618_VT-Drive_Agritechnica_2023_%28DSC05850%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":7008,"height":3944},
  {"brand":"McCormick","model":"X7.624 VT-Drive","fileId":"mccormick-x7-624-vt-drive-marcelx42-2023","path":"a/aa/McCormick_X7.624_VT-Drive_Agritechnica_2023_%28DSC05875%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":7008,"height":3944},
  // 2026-11-22: manufacturer 112H-01 heading refers to 112N-01 in body; Commons own-work CC BY-SA 3.0.
  {"brand":"Belarus","model":"112N-01","fileId":"belarus-112n-01-homoatrox-belagro-2021","path":"1/1b/Belarus_112H-01_tractor_%28Belagro-2021%29.jpg","photographer":"Homoatrox","license":"CC BY-SA 3.0","width":3201,"height":4385},
  // 2026-11-22 cross-platform licensed image search: verified original self-licence and exact family/model.
  // https://commons.wikimedia.org/wiki/File:Steyr_Absolut_6240.jpg
  // Self-authored by Blonder1984 (2022); public-domain dedication plus CC BY 4.0.
  {"brand":"Steyr","model":"6240 ABSOLUT CVT","fileId":"steyr-6240-absolut-blonder1984-2022","path":"d/d7/Steyr_Absolut_6240.jpg","photographer":"Blonder1984","license":"CC BY 4.0","width":4608,"height":3456},
  // https://commons.wikimedia.org/wiki/File:ZETOR_PROXIMA.jpg
  // JJ7777 own work, CC BY-SA 4.0; generic PROXIMA model, no equipment/year assertion.
  {"brand":"Zetor","model":"PROXIMA","fileId":"zetor-proxima-jj7777-2021","path":"4/4c/ZETOR_PROXIMA.jpg","photographer":"JJ7777","license":"CC BY-SA 4.0","width":2048,"height":1154},
  // https://commons.wikimedia.org/wiki/File:Zetor_Proxima%2C_WAW.jpg
  // Raf24~commonswiki own work, CC BY-SA 4.0; second independently attributed view.
  {"brand":"Zetor","model":"PROXIMA","fileId":"zetor-proxima-raf24-warsaw-2019","path":"8/81/Zetor_Proxima%2C_WAW.jpg","photographer":"Raf24~commonswiki","license":"CC BY-SA 4.0","width":4096,"height":3072},
  // 22 November 2026: exact-model Commons photo author/source licenses;
  // 480/960/1920 first-party SHA-256 JPEGs in proof ledger
  // site/docs/photo-import-evidence-mccormick-tym-wave2-20261122.json.
  // TYM alias names checked against manufacturer; configurationExact=false.
  {"brand":"McCormick","model":"X5.085","fileId":"mccormick-x5-085-mbone-2023","path":"b/b2/McCormick%2C_Agritechnica_2023%2C_Hanover_%28P1140949%29.jpg","photographer":"MB-one","license":"CC BY-SA 4.0","width":3161,"height":3951},
  {"brand":"TYM","model":"T6115","fileId":"tym-t6115-t115-marcelx42-2025","path":"0/01/TYM_T115_Agritechnica_2025_%28DSC04612%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6139,"height":4093},
  {"brand":"TYM","model":"T2025P","fileId":"tym-t2025p-t25-marcelx42-2025","path":"0/0b/TYM_T25_Agritechnica_2025_%28DSC04615%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6011,"height":4508},

  // 23 Nov 2026: three independently verified exact F50CHN views (PR #465).
  // These photographs MUST NOT appear on F50, F50CN or an ID-less T3048 page.
  {"brand":"TYM","model":"T3048","tractorId":"458be7b8-f6b8-4319-b264-dc6c7cc36ae7","fileId":"tym-t3048-f50chn-55-marcelx42-2025","path":"c/c2/TYM_F50Chn_Agritechnica_2025_%28DSC04655%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":5904,"height":4428},
  {"brand":"TYM","model":"T3048","tractorId":"458be7b8-f6b8-4319-b264-dc6c7cc36ae7","fileId":"tym-t3048-f50chn-57-marcelx42-2025","path":"2/27/TYM_F50Chn_Agritechnica_2025_%28DSC04657%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":5897,"height":4423},
  {"brand":"TYM","model":"T3048","tractorId":"458be7b8-f6b8-4319-b264-dc6c7cc36ae7","fileId":"tym-t3048-f50chn-73-marcelx42-2025","path":"6/60/TYM_F50Chn_Agritechnica_2025_%28DSC04673%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":5962,"height":4472},
  // 23 Nov 2026: existing T25/T115 front views are reused, not duplicated.
  // Two separately licensed rear angles, scoped only to the published International UUIDs.
  {"brand":"TYM","model":"T2025P","tractorId":"622ddce0-f3a8-48ad-8ec6-45ca936dba6f","fileId":"tym-t2025p-t25-rear-marcelx42-2025","path":"d/d7/TYM_T25_Agritechnica_2025_%28DSC04675%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":5944,"height":4458},
  {"brand":"TYM","model":"T6115","tractorId":"80fd42a2-3059-40bb-a0e1-511ae6100213","fileId":"tym-t6115-t115-rear-marcelx42-2025","path":"c/ca/TYM_T115_Agritechnica_2025_%28DSC04663%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6224,"height":4149},
  {
    "brand": "Zetor",
    "model": "FORTERRA 140",
    "tractorId": "0a900d97-3df4-444b-a25d-2c9885683b99",
    "fileId": "zetor-forterra-140-hd-maindistorsion",
    "path": "0/05/Zetor_Forterra_140_HD.jpg",
    "photographer": "Maindistorsion",
    "copyrightOwner": "Maindistorsion",
    "copyrightClaimUrl": "https://commons.wikimedia.org/wiki/File:Zetor_Forterra_140_HD.jpg",
    "copyrightEvidence": "commons-own-work-self-license",
    "license": "CC BY-SA 4.0",
    "width": 1296,
    "height": 1122
  },
  {
    "brand": "Belarus",
    "model": "920",
    "tractorId": "21e79b33-189b-44c1-a1e2-703ad8836d92",
    "fileId": "belarus-920-aschroet-crispendorf",
    "path": "4/4e/D%C3%B6rflas%2C_Crispendorf_09.jpg",
    "photographer": "Aschroet",
    "license": "CC0",
    "width": 4608,
    "height": 3456
  },
  {
    "brand": "Swaraj",
    "model": "855 FE",
    "tractorId": "270602da-150d-48d7-82c8-7d0536ac00c8",
    "fileId": "swaraj-855-fe-edward-middleton",
    "path": "2/23/Swaraj.jpg",
    "photographer": "Edward Middleton",
    "license": "CC BY-SA 4.0",
    "width": 5422,
    "height": 3615
  },
  {
    "brand": "Swaraj",
    "model": "744 FE",
    "tractorId": "50becf25-9554-4223-9b74-5709dddf3433",
    "fileId": "swaraj-744-fe-vikshipta-anik-var",
    "path": "7/7a/Nature-tk005.jpg",
    "photographer": "Vikshipta Anik Var",
    "license": "CC BY-SA 4.0",
    "width": 4608,
    "height": 3072
  },
  {
    "brand": "Kioti",
    "model": "HX1402ATC-EU",
    "tractorId": "cfc1d71f-91ed-fe20-9234-af87297968f9",
    "fileId": "kioti-hx1402atc-eu-eko-las-28",
    "path": "8/8d/Eko-Las_-_Kioti_HX1402_-_05.09.2025_14-47-28.jpg",
    "photographer": "Rados\u0142aw Dro\u017cd\u017cewski (Zwiadowca21)",
    "license": "CC BY-SA 4.0",
    "width": 3585,
    "height": 2676
  },
  {
    "brand": "Kioti",
    "model": "HX1402ATC-EU",
    "tractorId": "cfc1d71f-91ed-fe20-9234-af87297968f9",
    "fileId": "kioti-hx1402atc-eu-eko-las-46",
    "path": "9/9a/Eko-Las_-_Kioti_HX1402_-_05.09.2025_14-47-46.jpg",
    "photographer": "Rados\u0142aw Dro\u017cd\u017cewski (Zwiadowca21)",
    "license": "CC BY-SA 4.0",
    "width": 4288,
    "height": 2848
  },
  {"brand":"Zetor","model":"MAJOR","tractorId":"755e44bc-8043-4d41-9e08-f40e818ac00b","fileId":"zetor-major-cl80-jj7777","path":"6/6a/ZETOR_MAJOR.jpg","photographer":"JJ7777","license":"CC BY-SA 4.0","width":4969,"height":3313},
  {"brand":"Massey Ferguson","model":"4708 Standard","tractorId":"5727a834-a31d-4d85-9d0a-22468b2fa6c7","fileId":"mf-4708-platform-pere-igor-2016","path":"a/a8/Lanouaille_Massey_Ferguson_4708.jpg","photographer":"Père Igor","license":"CC BY-SA 4.0","width":2996,"height":2247,"resizedDerivative":true},
  {"brand":"JCB","model":"6260","tractorId":"a2c6eec1-e9f1-44f9-97c3-661b7ba69996","fileId":"jcb-6260-marcelx42-2025","path":"7/77/JCB_Fastrac_6260_Agritechnica_2025_%28DSC05623%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6224,"height":4672,"resizedDerivative":true},
  {"brand":"JCB","model":"6300","tractorId":"7c90179a-5584-40ab-9338-2850180d2197","fileId":"jcb-6300-marcelx42-2025","path":"9/9a/JCB_Fastrac_6300_Agritechnica_2025_%28DSC00362%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6224,"height":4672,"resizedDerivative":true},
  {"brand":"Versatile","model":"295","tractorId":"9a8bdada-0a7c-4a19-a5df-dc56ff9c159e","fileId":"versatile-295-marcelx42-2025","path":"7/79/Versatile_295_Agritechnica_2025_%28DSC03651%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6224,"height":4672,"resizedDerivative":true},
  {"brand":"Versatile","model":"460","tractorId":"259a5389-2bf4-4a25-97a6-01fe6484843e","fileId":"versatile-460-marcelx42-2025","path":"e/ed/Versatile_460_Agritechnica_2025_%28DSC00494%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6224,"height":4672,"resizedDerivative":true},
  {"brand":"Versatile","model":"620DT","tractorId":"cbdfd364-e6a9-4323-ac6d-72010165d9a0","fileId":"versatile-620dt-marcelx42-2025","path":"f/f8/Versatile_620DT_Agritechnica_2025_%28DSC00990%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":4880,"height":3253,"resizedDerivative":true},
  {"brand":"Lindner","model":"Lintrac 160 LDrive","tractorId":"7999a853-ec41-4c44-9f1d-2fa326713a81","fileId":"lindner-lintrac-160-ldrive-marcelx42-front","path":"5/59/Lindner_Lintrac_160_LDrive_Agritechnica_2025_%28DSC08766%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":5959,"height":4469,"resizedDerivative":true},
  {"brand":"Lindner","model":"Lintrac 160 LDrive","tractorId":"7999a853-ec41-4c44-9f1d-2fa326713a81","fileId":"lindner-lintrac-160-ldrive-marcelx42-rear","path":"4/49/Lindner_Lintrac_160_LDrive_Agritechnica_2025_%28DSC08778%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6143,"height":4611,"resizedDerivative":true},
  {"brand":"Lindner","model":"Lintrac 95 LS","tractorId":"092125c4-ef05-44ac-a2b3-9c653dda01f4","fileId":"lindner-lintrac-95-ls-alpin-marcelx42","path":"5/50/Lindner_Lintrac_95_LS_Alpin_Agritechnica_2023_%28DSC05164%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6680,"height":3759,"resizedDerivative":true},
  {"brand":"Solis","model":"S 26 HST","tractorId":"45b7ce31-c2d1-492d-a2eb-8b081fc89c7f","fileId":"solis-s26-hst-sebleouf-2019","path":"7/70/Sommet_de_l%27%C3%89levage_2019_-_Tracteur_Solis_26_HST.jpg","photographer":"Sebleouf","license":"CC BY-SA 4.0","width":4032,"height":3016,"resizedDerivative":true},
  {"brand":"Solis","model":"90 HVAC Stage V","tractorId":"8760f728-4121-4f22-85c5-dbf5c99ab64b","fileId":"solis-s90-shuttle-xl-cabin-marcelx42-2025","path":"9/90/Solis_S90_Shuttle_XL_Cabin_Agritechnica_2025_%28DSC04064%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":5847,"height":4385,"resizedDerivative":true},
  {"brand":"TYM","model":"T3047","tractorId":"8f3833e6-7eea-4a5c-a7eb-caa01b065cd5","fileId":"tym-t3047-t475c-marcelx42-2023","path":"7/77/TYM_T475C_Agritechnica_2023_%28DSC03513%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6738,"height":3792,"resizedDerivative":true},
  {"brand":"TYM","model":"T4049","tractorId":"1e6d82f3-7a8a-4c3e-8aca-44f0e63f257d","fileId":"tym-t4049-t495sh-marcelx42-2025","path":"b/b8/TYM_T495SH_Agritechnica_2025_%28DSC04665%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6017,"height":4011,"resizedDerivative":true},
  {"brand":"Hattat","model":"B 3105","tractorId":"5b745a3d-b5f6-4635-b90a-b77c61709cfe","fileId":"hattat-b3105-marcelx42-2023","path":"c/ce/Hattat_B3105_Agritechnica_2023_%28DSC04248%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":7008,"height":3944,"copyrightOwner":"MarcelX42","copyrightClaimUrl":"https://commons.wikimedia.org/wiki/File:Hattat_B3105_Agritechnica_2023_%28DSC04248%29.jpg","copyrightEvidence":"commons-own-work-self-license","resizedDerivative":true},
  {"brand":"Hattat","model":"B 3105","tractorId":"5b745a3d-b5f6-4635-b90a-b77c61709cfe","fileId":"hattat-b3105-matti-blume-2023","path":"e/e4/Hattat_B_3105%2C_Agritechnica_2023%2C_Hanover_%28P1160245%29.jpg","photographer":"Matti Blume","license":"CC BY-SA 4.0","width":4608,"height":3456,"resizedDerivative":true},
  {"brand":"TAFE","model":"7515 CAB Advanced","tractorId":"2009a1ab-5c09-4484-8356-0ce5b957ae27","fileId":"tafe-7515-cab-advanced-representative-marcelx42-2023","path":"a/a6/TAFE_7515_Cab_Agritechnica_2023_%28DSC06665%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":7008,"height":3944,"copyrightOwner":"MarcelX42","copyrightClaimUrl":"https://commons.wikimedia.org/wiki/File:TAFE_7515_Cab_Agritechnica_2023_%28DSC06665%29.jpg","copyrightEvidence":"commons-own-work-self-license","resizedDerivative":true},
  {"brand":"Başak Traktör","model":"2055","tractorId":"d1258ec7-f544-4d8b-b5a3-dee2d2b15a6b","fileId":"basak-2055-kompakt-marcelx42-2023","path":"e/e1/Ba%C5%9Fak_2055_Kompakt_Agritechnica_2023_%28DSC04448%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":7008,"height":3944,"resizedDerivative":true},
  {"brand":"Bobcat","model":"CT2540","tractorId":"70e438cb-c57c-4744-bf9f-2ae0a38e35b6","fileId":"bobcat-ct2540-marcelx42-2025","path":"8/8a/Bobcat_CT2540_Agritechnica_2025_%28DSC05725%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6224,"height":4672,"resizedDerivative":true},
  {"brand":"Bobcat","model":"CT4058","tractorId":"cafcb2bc-d2a4-452e-bdc8-3a52e9a5db81","fileId":"bobcat-ct4058-marcelx42-2025","path":"f/fd/Bobcat_CT4058_Agritechnica_2025_%28DSC08950%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6030,"height":4523,"resizedDerivative":true},
  {"brand":"Başak Traktör","model":"3026","tractorId":"2bc6ed35-ed73-4a0d-9edb-53462f0045fc","fileId":"basak-3026-front-marcelx42-2025","path":"c/c6/Ba%C5%9Fak_3026_Agritechnica_2025_%28DSC03713%29.jpg","photographer":"MarcelX42","license":"CC BY-SA 4.0","width":6139,"height":4604,"resizedDerivative":true},
] as const;
function licenseUrl(name:string):string{
  if(name==="CC0")return "https://creativecommons.org/publicdomain/zero/1.0/";
  const m=/^CC BY(-SA)? (2\.0|3\.0|4\.0)$/.exec(name);
  if(!m)throw new Error("Unapproved media license "+name);
  return "https://creativecommons.org/licenses/by"+(m[1]?"-sa":"")+"/"+m[2]+"/";
}
export const HISTORICAL_LICENSED_PHOTOS=candidates.map(p=>{
  const filename=p.path.split("/").at(-1)!;
  return {
    brand:p.brand,model:p.model,fileId:p.fileId,
    ...("tractorId" in p && typeof p.tractorId==="string" ? {tractorId:p.tractorId} : {}),
    thumbUrl:W+"thumb/"+p.path+"/480px-"+filename,
    displayUrl:W+"thumb/"+p.path+"/960px-"+filename,
    fullUrl:W+p.path,
    width:p.width,height:p.height,
    sourcePage:"https://commons.wikimedia.org/wiki/File:"+filename,
    photographer:p.photographer,licenseName:p.license,licenseUrl:licenseUrl(p.license),
    ...("copyrightOwner" in p && "copyrightClaimUrl" in p && "copyrightEvidence" in p
      ? {copyrightOwner:p.copyrightOwner,
         copyrightClaimUrl:p.copyrightClaimUrl,
         copyrightEvidence:p.copyrightEvidence} : {}),
    ...("resizedDerivative" in p && p.resizedDerivative===true ? {resizedDerivative:true} : {}),
    configurationExact:false
  };
});
