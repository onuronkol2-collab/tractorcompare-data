/**
 * Crawlable brand shortcuts for the one existing catalogue URL.
 *
 * Never fabricates brand descriptions, prices or unlisted manufacturers.
 * The directory is derived entirely from published catalogue rows.
 */
export function brandAnchorId(name){
  const source=String(name||"");
  const part=source.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ş/g,"s")
    .replace(/ç/g,"c").replace(/ö/g,"o").replace(/ü/g,"u")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"manufacturer";
  // Unicode-sensitive 32-bit FNV-1a avoids duplicate HTML IDs where two brand
  // names have the same ASCII slug. Deterministic across all language builds.
  let hash=2166136261;
  for(const codepoint of source){hash=Math.imul(hash^codepoint.codePointAt(0),16777619)>>>0;}
  return "brand-"+part+"-"+hash.toString(36);
}

export function catalogBrandIndex(published){
  const items=new Map();
  for(const tractor of published){
    const name=String(tractor.brand_name||"").trim();
    if(!name||!tractor.tractor_id||!tractor.slug)continue;
    let item=items.get(name);
    if(!item){
      item={name,anchorId:brandAnchorId(name),firstTractorId:tractor.tractor_id,count:0};
      items.set(name,item);
    }
    item.count++;
  }
  return [...items.values()].sort((a,b)=>a.name.localeCompare(b.name,"en",{sensitivity:"base"})||
    a.name.localeCompare(b.name,"en"));
}

export const BRAND_NAV_COPY={
  en:{heading:"Browse by manufacturer",intro:"Jump to models from a manufacturer. This directory shows published TractorVS records, not every model a brand has made.",models:"models"},
  tr:{heading:"Markaya göre traktörler",intro:"Marka seçerek yayımlanmış modellere git. Bu liste, üreticinin tüm ürünlerini değil TractorVS'de yayımlanan kayıtları gösterir.",models:"model"},
  zh:{heading:"按品牌浏览拖拉机",intro:"选择制造商，查看 TractorVS 已发布的型号；此目录不代表该品牌生产过的全部型号。",models:"款型号"},
  hi:{heading:"निर्माता के अनुसार ट्रैक्टर",intro:"निर्माता चुनकर TractorVS पर प्रकाशित मॉडल देखें। यह उस ब्रांड के सभी ट्रैक्टरों की पूरी सूची नहीं है।",models:"मॉडल"},
  "pt-br":{heading:"Tratores por fabricante",intro:"Escolha uma fabricante para ver os modelos publicados no TractorVS. Esta não é a linha completa de produtos da marca.",models:"modelos"},
  fr:{heading:"Tracteurs par constructeur",intro:"Choisissez un constructeur pour consulter les modèles publiés sur TractorVS. Ce répertoire ne représente pas toute sa gamme.",models:"modèles"},
  de:{heading:"Traktoren nach Hersteller",intro:"Wählen Sie einen Hersteller, um die bei TractorVS veröffentlichten Modelle zu sehen. Dies ist keine vollständige Modellübersicht des Herstellers.",models:"Modelle"},
  ru:{heading:"Тракторы по производителям",intro:"Выберите производителя для просмотра опубликованных на TractorVS моделей. Список не охватывает всю продукцию бренда.",models:"моделей"},
  ja:{heading:"メーカー別のトラクター",intro:"メーカーを選ぶと、TractorVSに公開済みのモデルへ移動します。各メーカーの全製品を網羅するものではありません。",models:"モデル"},
  es:{heading:"Tractores por fabricante",intro:"Elige un fabricante para ir a sus modelos publicados en TractorVS. El directorio no representa toda la gama de la marca.",models:"modelos"}
};

/** Human-reviewed, intent-specific catalogue title text. No keyword stuffing. */
export const CATALOG_SEARCH_TITLES={
  en:"Tractor Models & Technical Specifications",
  tr:"Traktör Modelleri ve Teknik Özellikleri",
  zh:"拖拉机型号与技术参数",
  hi:"ट्रैक्टर मॉडल और तकनीकी विवरण",
  "pt-br":"Modelos de tratores e fichas técnicas",
  fr:"Modèles de tracteurs et fiches techniques",
  de:"Traktormodelle und technische Daten",
  ru:"Модели тракторов и характеристики",
  ja:"トラクターのモデルと技術仕様",
  es:"Modelos de tractores y fichas técnicas"
};
