import {localizedPath,type Locale} from "./locales.ts";
import {marketDisplayName} from "./market-display.ts";
import type {TractorRecord} from "./catalog.ts";

const labels:Record<Locale,readonly [string,string,string,string,string]>={
  "en": [
    "Cite this model page",
    "Copy reference",
    "Reference copied.",
    "Copy unavailable. Select the reference text manually.",
    "This refers to the TractorVS catalogue page, not an original manufacturer document. Check the linked source for exact specifications."
  ],
  "tr": [
    "Bu model sayfasına atıf yap",
    "Kaynak gösterimini kopyala",
    "Kaynak gösterimi kopyalandı.",
    "Kopyalanamadı. Metni elle seçip kopyalayabilirsin.",
    "Bu atıf TractorVS katalog sayfasına aittir, üreticinin orijinal belgesine değil. Teknik değerleri ilgili kaynakla doğrula."
  ],
  "de": [
    "Diese Modellseite zitieren",
    "Quellenangabe kopieren",
    "Quellenangabe kopiert.",
    "Kopieren nicht möglich. Markieren Sie den Text manuell.",
    "Die Angabe verweist auf die TractorVS-Katalogseite, nicht auf ein Herstelleroriginal. Prüfen Sie die technischen Daten anhand der verlinkten Quelle."
  ],
  "fr": [
    "Citer cette fiche modèle",
    "Copier la référence",
    "Référence copiée.",
    "Copie indisponible. Sélectionnez le texte manuellement.",
    "Cette référence désigne la fiche TractorVS, non le document original du constructeur. Vérifiez les caractéristiques dans la source liée."
  ],
  "es": [
    "Citar esta ficha del modelo",
    "Copiar referencia",
    "Referencia copiada.",
    "No se pudo copiar. Selecciona el texto manualmente.",
    "La referencia corresponde a la ficha de TractorVS, no al documento original del fabricante. Comprueba las especificaciones en la fuente enlazada."
  ],
  "pt-br": [
    "Citar esta ficha do modelo",
    "Copiar referência",
    "Referência copiada.",
    "Não foi possível copiar. Selecione o texto manualmente.",
    "A referência aponta para a ficha do TractorVS, não para o documento original do fabricante. Confira os dados na fonte vinculada."
  ],
  "ru": [
    "Ссылка на эту страницу модели",
    "Копировать ссылку с названием",
    "Ссылка скопирована.",
    "Копирование недоступно. Выделите текст вручную.",
    "Это ссылка на страницу каталога TractorVS, а не оригинал документа производителя. Сверяйте характеристики с указанным источником."
  ],
  "zh": [
    "引用此型号页面",
    "复制引用信息",
    "已复制引用信息。",
    "无法复制，请手动选择引用文本。",
    "此引用指向 TractorVS 型号目录页，而非制造商原始文件。请通过所链接的来源核实技术参数。"
  ],
  "ja": [
    "この型式ページを引用する",
    "引用情報をコピー",
    "引用情報をコピーしました。",
    "コピーできません。引用文を手動で選択してください。",
    "引用先は TractorVS の型式ページであり、メーカーの原資料ではありません。仕様はリンク先の資料で確認してください。"
  ],
  "hi": [
    "इस मॉडल पृष्ठ का संदर्भ दें",
    "संदर्भ कॉपी करें",
    "संदर्भ कॉपी हो गया।",
    "कॉपी उपलब्ध नहीं है। संदर्भ पाठ स्वयं चुनें।",
    "यह संदर्भ TractorVS के कैटलॉग पृष्ठ का है, निर्माता के मूल दस्तावेज़ का नहीं। सटीक विशेषताएँ लिंक किए गए स्रोत से जाँचें।"
  ]
};
export function modelCitationCopy(lang:Locale){
 const [heading,button,success,failure,note]=labels[lang];
 return {heading,button,success,failure,note};
}

/** Plain-text attribution, not a claim that the catalogue itself is an OEM
 * document. Preserve exact identity; never include measurements, prices or
 * invented publication/access dates. */
export function modelPageCitation(tractor:Pick<TractorRecord,"slug"|"brand_name"|"model_name"|"variant"|"market"|"model_year">,lang:Locale,base:URL){
 if(!/^[a-z0-9-]{1,160}$/.test(tractor.slug))return null;
 const url=new URL(localizedPath(lang,"/tractors/"+tractor.slug+"/"),base).toString();
 const identity=[tractor.brand_name+" "+tractor.model_name,tractor.variant?.split(";")[0]?.trim(),marketDisplayName(tractor.market,lang),tractor.model_year].filter(v=>v!==null&&v!==undefined&&v!=="").join(" · ");
 return "TractorVS — "+identity+". "+url;
}
