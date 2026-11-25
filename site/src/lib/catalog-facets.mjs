/**
 * Catalogue browsing UX. No external data and no invented tractor facts:
 * only source-published model attributes can qualify a filter.
 * These parameters are visitor view state, never canonical search pages.
 */
import {MARKET_COUNTRIES} from "./market-prices.ts";
import {matchesDocumentedCatalogueMarket} from "./farm-advisor.ts";

export const CATALOG_MARKET_COPY = {
  en:{label:"Documented model market",note:"Not local availability or approval."},
  tr:{label:"Belgelenmiş model pazarı",note:"Yerel satış durumu veya onay anlamına gelmez."},
  zh:{label:"有记录的型号市场",note:"不代表当地有货或已获批准。"},
  hi:{label:"दर्ज मॉडल बाज़ार",note:"स्थानीय उपलब्धता या मंज़ूरी का प्रमाण नहीं।"},
  "pt-br":{label:"Mercado documentado do modelo",note:"Não indica disponibilidade ou aprovação local."},
  fr:{label:"Marché documenté du modèle",note:"Ne garantit ni disponibilité ni homologation locale."},
  de:{label:"Dokumentierter Modellmarkt",note:"Keine Aussage zur lokalen Verfügbarkeit oder Zulassung."},
  ru:{label:"Документированный рынок модели",note:"Не означает наличие или допуск на местном рынке."},
  ja:{label:"資料に記載されたモデル市場",note:"現地での販売状況や認可を示すものではありません。"},
  es:{label:"Mercado documentado del modelo",note:"No indica disponibilidad ni homologación local."},
};
export const CATALOG_FACET_COPY = {
  en:{filters:"Refine published models",brand:"Manufacturer",power:"Engine power",year:"Model year",sort:"Sort models",all:"All",up50:"Up to 50 HP",p51:"Over 50–100 HP",p101:"Over 100–150 HP",over150:"Over 150 HP",recent:"2020 or newer",older:"Before 2020",default:"Manufacturer A–Z",newest:"Newest model year",powerAsc:"Power: low to high",powerDesc:"Power: high to low",reset:"Reset filters"},
  tr:{filters:"Yayımlanmış modelleri filtrele",brand:"Marka",power:"Motor gücü",year:"Model yılı",sort:"Modelleri sırala",all:"Tümü",up50:"50 HP ve altı",p51:"50 üzeri–100 HP",p101:"100 üzeri–150 HP",over150:"150 HP üzeri",recent:"2020 ve sonrası",older:"2020 öncesi",default:"Marka A–Z",newest:"En yeni model yılı",powerAsc:"Güç: düşükten yükseğe",powerDesc:"Güç: yüksekten düşüğe",reset:"Filtreleri sıfırla"},
  zh:{filters:"筛选已发布型号",brand:"制造商",power:"发动机功率",year:"型号年份",sort:"型号排序",all:"全部",up50:"50 马力及以下",p51:"50–100 马力以上区间",p101:"100–150 马力以上区间",over150:"超过 150 马力",recent:"2020 年及以后",older:"2020 年以前",default:"品牌 A–Z",newest:"型号年份最新",powerAsc:"功率：由低到高",powerDesc:"功率：由高到低",reset:"重置筛选"},
  hi:{filters:"प्रकाशित मॉडल फ़िल्टर करें",brand:"निर्माता",power:"इंजन शक्ति",year:"मॉडल वर्ष",sort:"मॉडल क्रम",all:"सभी",up50:"50 HP तक",p51:"50 से अधिक–100 HP",p101:"100 से अधिक–150 HP",over150:"150 HP से अधिक",recent:"2020 या उसके बाद",older:"2020 से पहले",default:"ब्रांड A–Z",newest:"नया मॉडल वर्ष",powerAsc:"शक्ति: कम से अधिक",powerDesc:"शक्ति: अधिक से कम",reset:"फ़िल्टर रीसेट करें"},
  "pt-br":{filters:"Filtrar modelos publicados",brand:"Fabricante",power:"Potência do motor",year:"Ano do modelo",sort:"Ordenar modelos",all:"Todos",up50:"Até 50 HP",p51:"Mais de 50–100 HP",p101:"Mais de 100–150 HP",over150:"Mais de 150 HP",recent:"2020 ou mais recente",older:"Antes de 2020",default:"Marca A–Z",newest:"Ano mais recente",powerAsc:"Potência: crescente",powerDesc:"Potência: decrescente",reset:"Limpar filtros"},
  fr:{filters:"Filtrer les modèles publiés",brand:"Constructeur",power:"Puissance moteur",year:"Année du modèle",sort:"Trier les modèles",all:"Tous",up50:"Jusqu’à 50 ch",p51:"Plus de 50 à 100 ch",p101:"Plus de 100 à 150 ch",over150:"Plus de 150 ch",recent:"2020 ou après",older:"Avant 2020",default:"Marque A–Z",newest:"Année la plus récente",powerAsc:"Puissance croissante",powerDesc:"Puissance décroissante",reset:"Réinitialiser les filtres"},
  de:{filters:"Veröffentlichte Modelle filtern",brand:"Hersteller",power:"Motorleistung",year:"Modelljahr",sort:"Modelle sortieren",all:"Alle",up50:"Bis 50 PS",p51:"Über 50–100 PS",p101:"Über 100–150 PS",over150:"Über 150 PS",recent:"Ab 2020",older:"Vor 2020",default:"Hersteller A–Z",newest:"Neuestes Modelljahr",powerAsc:"Leistung aufsteigend",powerDesc:"Leistung absteigend",reset:"Filter zurücksetzen"},
  ru:{filters:"Фильтр опубликованных моделей",brand:"Производитель",power:"Мощность двигателя",year:"Год модели",sort:"Сортировка",all:"Все",up50:"До 50 л. с.",p51:"Более 50–100 л. с.",p101:"Более 100–150 л. с.",over150:"Более 150 л. с.",recent:"С 2020 года",older:"До 2020 года",default:"Бренд А–Я",newest:"Новые годы моделей",powerAsc:"Мощность по возрастанию",powerDesc:"Мощность по убыванию",reset:"Сбросить фильтры"},
  ja:{filters:"公開済みモデルを絞り込む",brand:"メーカー",power:"エンジン出力",year:"モデル年式",sort:"モデルの並び順",all:"すべて",up50:"50 HP 以下",p51:"50 超～100 HP",p101:"100 超～150 HP",over150:"150 HP 超",recent:"2020 年以降",older:"2020 年より前",default:"メーカー順",newest:"新しい年式順",powerAsc:"出力の低い順",powerDesc:"出力の高い順",reset:"絞り込みを解除"},
  es:{filters:"Filtrar modelos publicados",brand:"Fabricante",power:"Potencia del motor",year:"Año del modelo",sort:"Ordenar modelos",all:"Todos",up50:"Hasta 50 HP",p51:"Más de 50–100 HP",p101:"Más de 100–150 HP",over150:"Más de 150 HP",recent:"2020 o posterior",older:"Antes de 2020",default:"Marca A–Z",newest:"Año más reciente",powerAsc:"Potencia: menor a mayor",powerDesc:"Potencia: mayor a menor",reset:"Restablecer filtros"}
};
export const VALID_POWER = ["up50","p51","p101","over150"];
export const VALID_YEAR = ["recent","older"];
export const VALID_SORT = ["brand","newest","powerAsc","powerDesc"];
export function normalizedFacetState(params,brands=[]) {
  const brand=params.get("brand")||"";
  const power=params.get("power")||"";
  const year=params.get("year")||"";
  const sort=params.get("sort")||"brand";
  const market=params.get("market")||"";
  return {
    brand:brands.includes(brand)?brand:"",
    power:VALID_POWER.includes(power)?power:"",
    year:VALID_YEAR.includes(year)?year:"",
    market:MARKET_COUNTRIES.includes(market)?market:"",
    sort:VALID_SORT.includes(sort)?sort:"brand",
  };
}
export function matchesCatalogueFacet(row,state) {
  if(state.brand && row.brand!==state.brand)return false;
  if(state.market&&!matchesDocumentedCatalogueMarket(row.market??null,state.market))return false;
  if(state.power) {
    const hp=Number(row.power);
    if(row.power==null || row.power==="" || !Number.isFinite(hp))return false;
    if(state.power==="up50" && hp>50)return false;
    if(state.power==="p51" && !(hp>50&&hp<=100))return false;
    if(state.power==="p101" && !(hp>100&&hp<=150))return false;
    if(state.power==="over150" && hp<=150)return false;
  }
  if(state.year) {
    const year=Number(row.year);
    if(row.year==null||!Number.isInteger(year))return false;
    if(state.year==="recent" && year<2020)return false;
    if(state.year==="older" && year>=2020)return false;
  }
  return true;
}
export function compareCatalogueRows(a,b,sort) {
  const name=(x)=>String(x.name||"");
  const fallback=()=>name(a).localeCompare(name(b),"en",{sensitivity:"base"});
  const numeric=(field,descending)=>{
    const left=Number(a[field]),right=Number(b[field]);
    const validL=a[field]!=null&&a[field]!==""&&Number.isFinite(left);
    const validR=b[field]!=null&&b[field]!==""&&Number.isFinite(right);
    if(validL!==validR)return validL?-1:1;
    if(!validL)return fallback();
    return (left-right)*(descending?-1:1)||fallback();
  };
  if(sort==="newest")return numeric("year",true);
  if(sort==="powerAsc")return numeric("power",false);
  if(sort==="powerDesc")return numeric("power",true);
  return fallback();
}
