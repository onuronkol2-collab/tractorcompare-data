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
    "license": "CC BY-SA 4.0",
    "width": 6229,
    "height": 4672
  },
  {
    "brand": "Zetor",
    "model": "FORTERRA 140",
    "fileId": "zetor-forterra-140-346bcbde",
    "path": "2/2e/Zetor_Forterra_140_HSX.jpg",
    "photographer": "Bene Riobó",
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
    "license": "CC BY-SA 4.0",
    "width": 6164,
    "height": 4627
  },
  {
    "brand": "Massey Ferguson",
    "model": "5M.95",
    "fileId": "massey-ferguson-5m-95-bene-riobo-2025",
    "path": "e/ee/Massey_Ferguson_5M.95.jpg",
    "photographer": "Bene Riobó",
    "license": "CC BY-SA 4.0",
    "width": 3650,
    "height": 5475
  },
  {
    "brand": "Allis-Chalmers",
    "model": "IB",
    "fileId": "allis-chalmers-ib-acroterion-2026",
    "path": "5/54/Allis-Chalmers_IB_tractor_MD3.jpg",
    "photographer": "Acroterion",
    "license": "CC BY-SA 4.0",
    "width": 5664,
    "height": 5120
  },
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
    thumbUrl:W+"thumb/"+p.path+"/480px-"+filename,
    displayUrl:W+"thumb/"+p.path+"/960px-"+filename,
    fullUrl:W+p.path,
    width:p.width,height:p.height,
    sourcePage:"https://commons.wikimedia.org/wiki/File:"+filename,
    photographer:p.photographer,licenseName:p.license,licenseUrl:licenseUrl(p.license),
    configurationExact:false
  };
});
