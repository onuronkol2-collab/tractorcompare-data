import type {TractorRecord} from "./catalog.ts";
import type {Locale} from "./locales.ts";

/* Rights are NOT transferred by adding a TractorVS label. */
export interface TractorPhoto {
  brand:string; model:string; fileId:string;
  thumbUrl:string; displayUrl:string; fullUrl:string;
  width:number; height:number; sourcePage:string;
  photographer:string; licenseName:string; licenseUrl:string;
  configurationExact:boolean;
}
const W="https://upload.wikimedia.org/wikipedia/commons/";
/* Photographer Homoatrox, own work, CC BY-SA 3.0, Belagro 2019. */
export const APPROVED_TRACTOR_PHOTOS:readonly TractorPhoto[]=[
  {brand:"Belarus",model:"82.1",fileId:"belarus-82-1-homoatrox-2019",
    thumbUrl:W+"thumb/6/67/Belarus_MTZ-82_1_tractor_%2802%29.jpg/480px-Belarus_MTZ-82_1_tractor_%2802%29.jpg",
    displayUrl:W+"thumb/6/67/Belarus_MTZ-82_1_tractor_%2802%29.jpg/960px-Belarus_MTZ-82_1_tractor_%2802%29.jpg",
    fullUrl:W+"6/67/Belarus_MTZ-82_1_tractor_%2802%29.jpg",
    width:2229,height:1824,photographer:"Homoatrox",
    sourcePage:"https://commons.wikimedia.org/wiki/File:Belarus_MTZ-82_1_tractor_(02).jpg",
    licenseName:"CC BY-SA 3.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/3.0/",
    configurationExact:false}
];
function norm(value:string):string{
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/ı/g,"i").replace(/[^a-z0-9]+/g,"");
}
export function tractorPhotos(tractor:Pick<TractorRecord,"brand_name"|"model_name">):TractorPhoto[]{
  return APPROVED_TRACTOR_PHOTOS.filter(photo =>
    norm(photo.brand)===norm(tractor.brand_name)&&norm(photo.model)===norm(tractor.model_name));
}
export function primaryTractorPhoto(tractor:Pick<TractorRecord,"brand_name"|"model_name">):TractorPhoto|null{
  return tractorPhotos(tractor)[0]||null;
}
const LC=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"] as const;
const COPY={
  image:["Photograph:","Fotoğraf:","照片：","फ़ोटो:","Fotografia:","Photo :","Foto:","Фото:","写真：","Fotografía:"],
  open:["View photo full screen","Fotoğrafı tam ekran aç","全屏查看照片","फ़ोटो पूरी स्क्रीन में देखें","Ver foto em tela cheia","Voir la photo en plein écran","Foto im Vollbild öffnen","Открыть фото на весь экран","写真を全画面表示","Ver foto a pantalla completa"],
  close:["Close photo","Fotoğrafı kapat","关闭照片","फ़ोटो बंद करें","Fechar foto","Fermer la photo","Foto schließen","Закрыть фото","写真を閉じる","Cerrar foto"],
  credit:["Photo credit","Fotoğraf kaynağı","照片署名","फ़ोटो श्रेय","Crédito da foto","Crédit photo","Bildnachweis","Автор фото","写真提供","Crédito fotográfico"],
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
