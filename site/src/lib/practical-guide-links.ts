import {localizedPath,type Locale} from "./locales.ts";
import {farmCostText} from "./farm-cost-i18n.ts";
import {farmExtrasText} from "./farm-extras-i18n.ts";
import {farmDecisionText} from "./farm-decision-i18n.ts";
import {t} from "./ui.ts";

// Both routes are published in all ten languages. These are same-page
// fragment destinations, not additional indexable URLs or compatibility claims.
const copy:Record<Locale,readonly [string,string,string]>={
  "en": [
    "Put the guide into practice",
    "Use your own measured fuel use, field width, working speed and costs to compare scenarios. For equipment, confirm the manufacturer's requirements; numerical screening does not certify compatibility.",
    "Read the tractor selection guide before comparing power or choosing equipment."
  ],
  "tr": [
    "Rehberi uygulamaya dönüştür",
    "Ölçtüğün yakıt tüketimi, iş genişliği, çalışma hızı ve giderlerle senaryoları karşılaştır. Ekipmanda üreticinin gereksinimlerini doğrula; sayısal kontrol uyumluluk onayı değildir.",
    "Gücü karşılaştırmadan veya ekipman seçmeden önce traktör seçim rehberini oku."
  ],
  "de": [
    "Den Ratgeber praktisch anwenden",
    "Vergleichen Sie Szenarien mit gemessenem Verbrauch, Arbeitsbreite, Geschwindigkeit und eigenen Kosten. Prüfen Sie die Geräteanforderungen des Herstellers; Zahlen allein bestätigen keine Kompatibilität.",
    "Lesen Sie vor dem Leistungsvergleich oder der Gerätewahl den Traktorauswahl-Ratgeber."
  ],
  "fr": [
    "Mettre le guide en pratique",
    "Comparez les scénarios avec votre consommation mesurée, largeur, vitesse et coûts. Vérifiez les exigences du constructeur de l’outil ; un contrôle numérique ne certifie pas la compatibilité.",
    "Lisez le guide de choix du tracteur avant de comparer les puissances ou de choisir un outil."
  ],
  "es": [
    "Poner la guía en práctica",
    "Compara escenarios con tu consumo medido, anchura, velocidad y costes. Comprueba los requisitos del fabricante del apero; una comprobación numérica no certifica la compatibilidad.",
    "Lee la guía de selección de tractores antes de comparar potencias o elegir aperos."
  ],
  "pt-br": [
    "Coloque o guia em prática",
    "Compare cenários com seu consumo medido, largura, velocidade e custos. Confirme os requisitos do fabricante do implemento; a análise numérica não certifica compatibilidade.",
    "Leia o guia de seleção de tratores antes de comparar potências ou escolher implementos."
  ],
  "ru": [
    "Примените руководство на практике",
    "Сравните сценарии по измеренному расходу топлива, рабочей ширине, скорости и своим затратам. Проверьте требования производителя орудия: числовая проверка не подтверждает совместимость.",
    "Прочитайте руководство по выбору трактора перед сравнением мощности или выбором орудия."
  ],
  "zh": [
    "将选型指南用于实际决策",
    "使用实测油耗、作业幅宽、速度和自身成本比较作业方案。核对农具制造商的要求；数值筛查不代表兼容性认证。",
    "比较功率或选择农具前，请阅读拖拉机选型指南。"
  ],
  "ja": [
    "ガイドを実際の選定に活用する",
    "実測燃費、作業幅、速度、費用を入力して作業条件を比較できます。作業機メーカーの要件を確認してください。数値による確認は適合性の認証ではありません。",
    "出力比較や作業機選びの前に、トラクター選定ガイドをお読みください。"
  ],
  "hi": [
    "मार्गदर्शिका को व्यवहार में अपनाएँ",
    "मापी गई ईंधन खपत, कार्य चौड़ाई, गति और अपनी लागत से परिदृश्यों की तुलना करें। उपकरण निर्माता की आवश्यकताएँ जाँचें; संख्यात्मक जाँच अनुकूलता का प्रमाण नहीं है।",
    "शक्ति की तुलना या उपकरण चुनने से पहले ट्रैक्टर चयन मार्गदर्शिका पढ़ें।"
  ]
};
export function practicalGuideLinks(lang:Locale){
 const [heading,description,returnNote]=copy[lang];
 const base=localizedPath(lang,"/guides/farm-cost-calculator/");
 return {heading,description,returnNote,guide:{href:localizedPath(lang,"/guides/choosing-a-tractor/"),label:t(lang,"guideLink")},
 links:[
  {href:base+"#farm-scenarios",label:farmExtrasText(lang).scenario},
  {href:base+"#farm-equipment",label:farmDecisionText(lang).equipment},
  {href:base+"#farm-cost-form",label:farmCostText(lang).title}
 ]};
}
