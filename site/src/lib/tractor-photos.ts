import type {TractorRecord} from "./catalog.ts";
import type {Locale} from "./locales.ts";
import {HISTORICAL_LICENSED_PHOTOS} from "./historical-licensed-photos.ts";

/* Rights are NOT transferred by adding a TractorVS label. */
export interface TractorPhoto {
  brand:string; model:string; fileId:string;
  // Explicitly bind variant-sensitive photos to one published tractor UUID.
  // Omitted for historic model-level photographs.
  tractorId?:string;
  thumbUrl:string; displayUrl:string; fullUrl:string;
  width:number; height:number; sourcePage:string;
  photographer:string; licenseName:string; licenseUrl:string;
  configurationExact:boolean;
  // A holder notice is emitted ONLY after the exact Commons File page
  // independently attests Own work + self-applied license (not merely attribution).
  copyrightOwner?:string;
  copyrightClaimUrl?:string;
  copyrightEvidence?:"commons-own-work-self-license";
  originThumbUrl:string; originDisplayUrl:string; originFullUrl:string;
}
const W="https://upload.wikimedia.org/wikipedia/commons/";
// Since 2026 Wikimedia's direct thumbnail origin only accepts fixed widths.
// Arbitrary 640/720/800px paths return HTTP 400, not a resized JPEG.
// Avoid image SEO regressions by rejecting an unsupported upstream before
// the Worker fetches it; full original URLs stay explicitly allowed.
export const COMMONS_THUMBNAIL_STEPS=new Set([20,40,60,120,250,330,500,960,1280,1920,3840]);
export function isSupportedCommonsPhotoOrigin(source:string):boolean{
  let url:URL;
  try{url=new URL(source);}catch{return false;}
  if(url.protocol!=="https:"||url.hostname!=="upload.wikimedia.org"||
     url.username||url.password||url.search||url.hash||
     !url.pathname.startsWith("/wikipedia/commons/"))return false;
  if(!url.pathname.startsWith("/wikipedia/commons/thumb/"))return true;
  const match=/\/(\d+)px-[^/]+$/.exec(url.pathname);
  return Boolean(match&&COMMONS_THUMBNAIL_STEPS.has(Number(match[1])));
}

/* Photographer Homoatrox, own work, CC BY-SA 3.0, Belagro 2019. */
const ORIGINAL_PHOTO_ORIGINS:readonly Omit<TractorPhoto,"originThumbUrl"|"originDisplayUrl"|"originFullUrl">[]=[
  {brand:"Belarus",model:"82.1",fileId:"belarus-82-1-homoatrox-2019",
    thumbUrl:W+"thumb/6/67/Belarus_MTZ-82_1_tractor_%2802%29.jpg/480px-Belarus_MTZ-82_1_tractor_%2802%29.jpg",
    displayUrl:W+"thumb/6/67/Belarus_MTZ-82_1_tractor_%2802%29.jpg/960px-Belarus_MTZ-82_1_tractor_%2802%29.jpg",
    fullUrl:W+"6/67/Belarus_MTZ-82_1_tractor_%2802%29.jpg",
    width:2229,height:1824,photographer:"Homoatrox",
    sourcePage:"https://commons.wikimedia.org/wiki/File:Belarus_MTZ-82_1_tractor_(02).jpg",
    licenseName:"CC BY-SA 3.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/3.0/",
    configurationExact:false},
  {
    brand:"New Holland",model:"T5.110",fileId:"new-holland-t5-110-pere-igor-2016",
    thumbUrl:W+"thumb/5/53/Lanouaille_New_Holland_T5.110.jpg/480px-Lanouaille_New_Holland_T5.110.jpg",
    displayUrl:W+"thumb/5/53/Lanouaille_New_Holland_T5.110.jpg/960px-Lanouaille_New_Holland_T5.110.jpg",
    fullUrl:W+"5/53/Lanouaille_New_Holland_T5.110.jpg",
    width:2649,height:1990,photographer:"Père Igor",
    sourcePage:"https://commons.wikimedia.org/wiki/File:Lanouaille_New_Holland_T5.110.jpg",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  },
  {
    brand:"New Holland",model:"T6.180",fileId:"new-holland-t6-180-marcelx42-2025",
    thumbUrl:W+"thumb/3/34/New_Holland_T6.180_Agritechnica_2025_%28DSC00717%29.jpg/480px-New_Holland_T6.180_Agritechnica_2025_%28DSC00717%29.jpg",
    displayUrl:W+"thumb/3/34/New_Holland_T6.180_Agritechnica_2025_%28DSC00717%29.jpg/960px-New_Holland_T6.180_Agritechnica_2025_%28DSC00717%29.jpg",
    fullUrl:W+"3/34/New_Holland_T6.180_Agritechnica_2025_%28DSC00717%29.jpg",
    width:7008,height:3944,photographer:"MarcelX42",
    sourcePage:"https://commons.wikimedia.org/wiki/File:New_Holland_T6.180_Agritechnica_2025_(DSC00717).jpg",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  },
  {
    brand:"Case IH",model:"Puma 150",fileId:"case-ih-puma-150-chris-woodrich-2025",
    thumbUrl:W+"thumb/f/fb/Case_IH_Puma_150_Tractor%2C_Harrow_Fair%2C_Harrow%2C_Ontario%2C_2025-08-31_01.jpg/480px-Case_IH_Puma_150_Tractor%2C_Harrow_Fair%2C_Harrow%2C_Ontario%2C_2025-08-31_01.jpg",
    displayUrl:W+"thumb/f/fb/Case_IH_Puma_150_Tractor%2C_Harrow_Fair%2C_Harrow%2C_Ontario%2C_2025-08-31_01.jpg/960px-Case_IH_Puma_150_Tractor%2C_Harrow_Fair%2C_Harrow%2C_Ontario%2C_2025-08-31_01.jpg",
    fullUrl:W+"f/fb/Case_IH_Puma_150_Tractor%2C_Harrow_Fair%2C_Harrow%2C_Ontario%2C_2025-08-31_01.jpg",
    width:4600,height:3680,photographer:"Chris Woodrich",
    sourcePage:"https://commons.wikimedia.org/wiki/File:Case_IH_Puma_150_Tractor,_Harrow_Fair,_Harrow,_Ontario,_2025-08-31_01.jpg",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  },
  {
    brand:"McCormick",model:"X5.120 P3-Drive",fileId:"mccormick-x5-120-marcelx42-2023",
    thumbUrl:W+"thumb/6/66/McCormick_X5.120_P3-Drive_Agritechnica_2023_%28DSC03865%29.jpg/480px-McCormick_X5.120_P3-Drive_Agritechnica_2023_%28DSC03865%29.jpg",
    displayUrl:W+"thumb/6/66/McCormick_X5.120_P3-Drive_Agritechnica_2023_%28DSC03865%29.jpg/960px-McCormick_X5.120_P3-Drive_Agritechnica_2023_%28DSC03865%29.jpg",
    fullUrl:W+"6/66/McCormick_X5.120_P3-Drive_Agritechnica_2023_%28DSC03865%29.jpg",
    width:7008,height:3944,photographer:"MarcelX42",
    sourcePage:"https://commons.wikimedia.org/wiki/File:McCormick_X5.120_P3-Drive_Agritechnica_2023_(DSC03865).jpg",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  },
  {brand:"Belarus",model:"82.1",fileId:"belarus-82-1-homoatrox-open-day-2017-1",
    thumbUrl:W+"thumb/d/d9/Belarus_82.1_%28open_day_2017%29_1.jpg/480px-Belarus_82.1_%28open_day_2017%29_1.jpg",
    displayUrl:W+"thumb/d/d9/Belarus_82.1_%28open_day_2017%29_1.jpg/960px-Belarus_82.1_%28open_day_2017%29_1.jpg",
    fullUrl:W+"d/d9/Belarus_82.1_%28open_day_2017%29_1.jpg",
    width:3576,height:3156,photographer:"Homoatrox",
    sourcePage:"https://commons.wikimedia.org/wiki/File:Belarus_82.1_(open_day_2017)_1.jpg",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  },
  {brand:"Belarus",model:"82.1",fileId:"belarus-82-1-homoatrox-open-day-2017-2",
    thumbUrl:W+"thumb/f/f1/Belarus_82.1_%28open_day_2017%29_2.jpg/480px-Belarus_82.1_%28open_day_2017%29_2.jpg",
    displayUrl:W+"thumb/f/f1/Belarus_82.1_%28open_day_2017%29_2.jpg/960px-Belarus_82.1_%28open_day_2017%29_2.jpg",
    fullUrl:W+"f/f1/Belarus_82.1_%28open_day_2017%29_2.jpg",
    width:2976,height:3240,photographer:"Homoatrox",
    sourcePage:"https://commons.wikimedia.org/wiki/File:Belarus_82.1_(open_day_2017)_2.jpg",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  },
  {brand:"Belarus",model:"82.1",fileId:"belarus-82-1-eugene-zelenko-rakaw-1",
    thumbUrl:W+"thumb/3/34/Belarus-Rakaw-Belarus_82.1-1.jpg/480px-Belarus-Rakaw-Belarus_82.1-1.jpg",
    displayUrl:W+"thumb/3/34/Belarus-Rakaw-Belarus_82.1-1.jpg/960px-Belarus-Rakaw-Belarus_82.1-1.jpg",
    fullUrl:W+"3/34/Belarus-Rakaw-Belarus_82.1-1.jpg",
    width:6000,height:4000,photographer:"Eugene Zelenko",
    sourcePage:"https://commons.wikimedia.org/wiki/File:Belarus-Rakaw-Belarus_82.1-1.jpg",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  },
  {brand:"Landini",model:"5-110 RoboShift",fileId:"landini-5-110-roboshift-marcelx42-2023",
    thumbUrl:W+"thumb/9/9b/Landini_5-110_RoboShift_Agritechnica_2023_%28DSC05711%29.jpg/480px-Landini_5-110_RoboShift_Agritechnica_2023_%28DSC05711%29.jpg",
    displayUrl:W+"thumb/9/9b/Landini_5-110_RoboShift_Agritechnica_2023_%28DSC05711%29.jpg/960px-Landini_5-110_RoboShift_Agritechnica_2023_%28DSC05711%29.jpg",
    fullUrl:W+"9/9b/Landini_5-110_RoboShift_Agritechnica_2023_%28DSC05711%29.jpg",
    width:6487,height:3651,photographer:"MarcelX42",
    sourcePage:"https://commons.wikimedia.org/wiki/File:Landini_5-110_RoboShift_Agritechnica_2023_(DSC05711).jpg",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  },
  {brand:"McCormick",model:"X5.110 HC",fileId:"mccormick-x5-110-hc-marcelx42-2023",
    thumbUrl:W+"thumb/c/c2/McCormick_X5.110_HC_Agritechnica_2023_%28DSC06793%29.jpg/480px-McCormick_X5.110_HC_Agritechnica_2023_%28DSC06793%29.jpg",
    displayUrl:W+"thumb/c/c2/McCormick_X5.110_HC_Agritechnica_2023_%28DSC06793%29.jpg/960px-McCormick_X5.110_HC_Agritechnica_2023_%28DSC06793%29.jpg",
    fullUrl:W+"c/c2/McCormick_X5.110_HC_Agritechnica_2023_%28DSC06793%29.jpg",
    width:7008,height:3944,photographer:"MarcelX42",
    sourcePage:"https://commons.wikimedia.org/wiki/File:McCormick_X5.110_HC_Agritechnica_2023_(DSC06793).jpg",
    copyrightOwner:"MarcelX42",
    copyrightClaimUrl:"https://commons.wikimedia.org/wiki/File:McCormick_X5.110_HC_Agritechnica_2023_(DSC06793).jpg",
    copyrightEvidence:"commons-own-work-self-license",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  },
  {brand:"Belarus",model:"80.1",fileId:"belarus-80-1-nikolai-bulykin-kosmos-2026",
    thumbUrl:W+"thumb/7/72/%D0%9A%D0%BE%D1%81%D0%BC%D0%BE%D1%81%2C_%D0%9C%D0%A2%D0%97-80.1_%D0%BD%D0%B0_%D0%96%D0%B5%D0%BB%D1%82%D0%BE%D0%BA%D1%81%D0%B0%D0%BD%D0%B5.jpg/480px-%D0%9A%D0%BE%D1%81%D0%BC%D0%BE%D1%81%2C_%D0%9C%D0%A2%D0%97-80.1_%D0%BD%D0%B0_%D0%96%D0%B5%D0%BB%D1%82%D0%BE%D0%BA%D1%81%D0%B0%D0%BD%D0%B5.jpg",
    displayUrl:W+"thumb/7/72/%D0%9A%D0%BE%D1%81%D0%BC%D0%BE%D1%81%2C_%D0%9C%D0%A2%D0%97-80.1_%D0%BD%D0%B0_%D0%96%D0%B5%D0%BB%D1%82%D0%BE%D0%BA%D1%81%D0%B0%D0%BD%D0%B5.jpg/960px-%D0%9A%D0%BE%D1%81%D0%BC%D0%BE%D1%81%2C_%D0%9C%D0%A2%D0%97-80.1_%D0%BD%D0%B0_%D0%96%D0%B5%D0%BB%D1%82%D0%BE%D0%BA%D1%81%D0%B0%D0%BD%D0%B5.jpg",
    fullUrl:W+"7/72/%D0%9A%D0%BE%D1%81%D0%BC%D0%BE%D1%81%2C_%D0%9C%D0%A2%D0%97-80.1_%D0%BD%D0%B0_%D0%96%D0%B5%D0%BB%D1%82%D0%BE%D0%BA%D1%81%D0%B0%D0%BD%D0%B5.jpg",
    width:4525,height:2545,photographer:"Nikolai Bulykin",
    sourcePage:"https://commons.wikimedia.org/wiki/File:%D0%9A%D0%BE%D1%81%D0%BC%D0%BE%D1%81%2C_%D0%9C%D0%A2%D0%97-80.1_%D0%BD%D0%B0_%D0%96%D0%B5%D0%BB%D1%82%D0%BE%D0%BA%D1%81%D0%B0%D0%BD%D0%B5.jpg",
    licenseName:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
    configurationExact:false
  }
];
/** Curated historical archive candidates are staged in code; they reach public pages
 * ONLY if an exact brand/model is found in the published Supabase public catalogue.
 * Displayed model variant warning remains mandatory for each photo. */
const PHOTO_ORIGINS:readonly Omit<TractorPhoto,"originThumbUrl"|"originDisplayUrl"|"originFullUrl">[]=[
  ...ORIGINAL_PHOTO_ORIGINS,
  ...HISTORICAL_LICENSED_PHOTOS
];
/** Stable, first-party indexable image URLs; a fixed Worker allowlist proxies only approved photos. */
export const APPROVED_TRACTOR_PHOTOS:readonly TractorPhoto[]=PHOTO_ORIGINS.map(source=>({
  ...source,
  originThumbUrl:source.thumbUrl.replace("/480px-", "/500px-"),
  originDisplayUrl:source.displayUrl,
  originFullUrl:source.width<=1920 ? source.fullUrl : source.displayUrl.replace("/960px-","/1920px-"),
  thumbUrl:"/images/tractors/"+source.fileId+"-480.jpg",
  displayUrl:"/images/tractors/"+source.fileId+"-960.jpg",
  fullUrl:"/images/tractors/"+source.fileId+"-1920.jpg",
}));
export function resolveApprovedPhotoSource(pathname:string):string|null {
  const m=/^\/images\/tractors\/([a-z0-9-]+)-(480|960|1920)\.jpg$/.exec(pathname);
  if(!m)return null;
  const photo=APPROVED_TRACTOR_PHOTOS.find(item=>item.fileId===m[1]);
  const origin=photo ? m[2]==="480" ? photo.originThumbUrl
    : m[2]==="960" ? photo.originDisplayUrl : photo.originFullUrl : null;
  // Refuse unrecognized domains, invalid Commons paths and non-standard
  // Wikimedia thumbnail widths. Never fall back to another tractor image.
  return origin&&isSupportedCommonsPhotoOrigin(origin)?origin:null;
}
function norm(value:string):string{
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/ı/g,"i").replace(/[^a-z0-9]+/g,"");
}
type TractorPhotoLookup=Pick<TractorRecord,"brand_name"|"model_name">&Partial<Pick<TractorRecord,"tractor_id">>;
/** A model-level photo may illustrate the named model, but a variant-scoped
 * photo must NEVER appear on other models with an identical display name. */
export function photoMatchesTractor(
  photo:Pick<TractorPhoto,"brand"|"model"|"tractorId">,
  tractor:TractorPhotoLookup
):boolean{
  if(norm(photo.brand)!==norm(tractor.brand_name)||
     norm(photo.model)!==norm(tractor.model_name))return false;
  if(photo.tractorId)return photo.tractorId===tractor.tractor_id;
  return true;
}
export function tractorPhotos(tractor:TractorPhotoLookup):TractorPhoto[]{
  return APPROVED_TRACTOR_PHOTOS.filter(photo=>photoMatchesTractor(photo,tractor));
}
export function primaryTractorPhoto(tractor:Pick<TractorRecord,"brand_name"|"model_name">):TractorPhoto|null{
  return tractorPhotos(tractor)[0]||null;
}
const LC=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"] as const;
const COPY={
  image:["Photograph:","Fotoğraf:","照片：","फ़ोटो:","Fotografia:","Photo :","Foto:","Фото:","写真：","Fotografía:"],
  open:["View photo full screen","Fotoğrafı tam ekran aç","全屏查看照片","फ़ोटो पूरी स्क्रीन में देखें","Ver foto em tela cheia","Voir la photo en plein écran","Foto im Vollbild öffnen","Открыть фото на весь экран","写真を全画面表示","Ver foto a pantalla completa"],
  close:["Close photo","Fotoğrafı kapat","关闭照片","फ़ोटो बंद करें","Fechar foto","Fermer la photo","Foto schließen","Закрыть фото","写真を閉じる","Cerrar foto"],
  pending:["Verified model photograph not available yet.","Bu modelin doğrulanmış fotoğrafı henüz yok.","此型号暂无已核实的照片。","इस मॉडल की सत्यापित फ़ोटो अभी उपलब्ध नहीं है।","Ainda não há foto verificada deste modelo.","Aucune photo vérifiée pour ce modèle.","Für dieses Modell liegt noch kein geprüftes Foto vor.","Проверенная фотография этой модели пока недоступна.","このモデルの確認済み写真はまだありません。","Aún no hay una foto verificada de este modelo."],
  credit:["Photo credit","Fotoğraf kaynağı","照片署名","फ़ोटो श्रेय","Crédito da foto","Crédit photo","Bildnachweis","Автор фото","写真提供","Crédito fotográfico"],
  resizedDerivative:[
    "A resized and re-encoded copy of the credited photograph may be displayed.",
    "Kaynağı belirtilen fotoğrafın boyutu değiştirilmiş ve yeniden kodlanmış sürümü gösterilebilir.",
    "显示的可能是已署名照片经过缩放和重新编码的版本。",
    "दिखाई गई तस्वीर श्रेयित मूल फ़ोटो का आकार बदला और पुनः एन्कोड किया गया रूप हो सकती है।",
    "A imagem pode ser uma versão redimensionada e recodificada da foto creditada.",
    "L’image peut être une version redimensionnée et réencodée de la photo créditée.",
    "Das Bild kann eine verkleinerte und neu kodierte Version des genannten Fotos sein.",
    "Изображение может быть уменьшенной и перекодированной версией указанной фотографии.",
    "表示画像は、クレジット表記された写真を縮小・再エンコードしたものの場合があります。",
    "La imagen puede ser una versión redimensionada y recodificada de la foto acreditada."
  ],
  representative:[
    "Photographed equipment may differ from this recorded configuration.",
    "Fotoğraftaki donanım, kayıtlı varyanttan farklı olabilir.",
    "照片中的配置可能与本页面记录的版本不同。",
    "तस्वीर का उपकरण दर्ज विन्यास से अलग हो सकता है।",
    "O equipamento fotografado pode diferir da configuração registrada.",
    "L'équipement photographié peut différer de la configuration enregistrée.",
    "Die abgebildete Ausstattung kann von der erfassten Variante abweichen.",
    "Комплектация на фото может отличаться от указанной.",
    "写真の装備は記載された仕様と異なる場合があります。",
    "El equipamiento fotografiado puede diferir de la variante registrada."
  ]
} as const;
export function photoText(locale:Locale,key:keyof typeof COPY):string{
  return COPY[key][LC.indexOf(locale)]||COPY[key][0];
}
export function tractorPhotoAlt(
  tractor:Pick<TractorRecord,"brand_name"|"model_name">,locale:Locale
):string{return photoText(locale,"image")+" "+tractor.brand_name+" "+tractor.model_name;}
