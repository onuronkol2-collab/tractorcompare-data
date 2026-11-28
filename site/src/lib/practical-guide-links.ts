import {localizedPath,type Locale} from "./locales.ts";
import {farmCostText} from "./farm-cost-i18n.ts";
import {farmExtrasText} from "./farm-extras-i18n.ts";
import {farmDecisionText} from "./farm-decision-i18n.ts";
import {t} from "./ui.ts";
import {advisorText} from "./advisor-i18n.ts";
import {investmentPlanningText} from "./farm-investment-planning-i18n.ts";

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
 advisor:{href:localizedPath(lang,"/farm-advisor/"),label:advisorText(lang,"heading")},
 links:[
  {href:base+"#farm-scenarios",label:farmExtrasText(lang).scenario},
  {href:base+"#farm-equipment",label:farmDecisionText(lang).equipment},
  {href:base+"#farm-cost-form",label:farmCostText(lang).title},
  {href:base+"#farm-ownership-plan",label:investmentPlanningText(lang).ownership},
  {href:base+"#farm-field-plan",label:investmentPlanningText(lang).fleet}
 ]};
}


const archiveToolCopy:Record<Locale,readonly [string,string]>={
  "en": [
    "Practical farming calculators",
    "Apply your own measurements to field-work planning, fuel costs and equipment screening. These are interactive tools, not additional articles or model test results."
  ],
  "tr": [
    "Uygulamalı tarım hesaplayıcıları",
    "Tarla işlerini, yakıt giderlerini ve ekipman gereksinimlerini kendi ölçümlerinle değerlendir. Bunlar etkileşimli araçlardır; yeni makale veya model testi değildir."
  ],
  "de": [
    "Praktische Landwirtschaftsrechner",
    "Planen Sie Feldarbeit, Kraftstoffkosten und Geräteanforderungen mit eigenen Messwerten. Dies sind interaktive Werkzeuge, keine zusätzlichen Artikel oder Modelltests."
  ],
  "fr": [
    "Calculateurs agricoles pratiques",
    "Planifiez les travaux, les coûts de carburant et vérifiez les besoins des outils avec vos propres mesures. Il s’agit d’outils interactifs, pas d’articles ni d’essais supplémentaires."
  ],
  "es": [
    "Calculadoras agrícolas prácticas",
    "Planifica el trabajo, los costes de combustible y los requisitos de los aperos con tus propias mediciones. Son herramientas interactivas, no nuevos artículos ni ensayos de modelos."
  ],
  "pt-br": [
    "Calculadoras agrícolas práticas",
    "Planeje o trabalho de campo, os custos de combustível e as exigências dos implementos com suas próprias medições. São ferramentas interativas, não novos artigos nem testes de modelos."
  ],
  "hi": [
    "व्यावहारिक कृषि कैलकुलेटर",
    "अपने मापों से खेत का काम, ईंधन लागत और उपकरण की आवश्यकताएँ जाँचें। ये इंटरैक्टिव उपकरण हैं, अतिरिक्त लेख या मॉडल परीक्षण नहीं।"
  ],
  "zh": [
    "实用农业计算器",
    "使用自己的测量数据规划田间作业、燃油成本和农具需求。这些是交互工具，并非新增文章或机型测试。"
  ],
  "ja": [
    "実用農業計算ツール",
    "実測値を使って圃場作業、燃料費、作業機の要件を検討できます。追加の記事や機種試験ではなく、操作できる計算ツールです。"
  ],
  "ru": [
    "Практические сельскохозяйственные калькуляторы",
    "Планируйте полевые работы, расходы топлива и проверку требований к орудиям по своим измерениям. Это интерактивные инструменты, а не новые статьи или испытания моделей."
  ]
};
export function editorialPracticalTools(lang:Locale){
 const [heading,description]=archiveToolCopy[lang];
 return {heading,description,primary:{href:localizedPath(lang,"/guides/farm-cost-calculator/"),label:farmCostText(lang).title},links:practicalGuideLinks(lang).links.filter(link=>!link.href.endsWith("#farm-cost-form")),advisor:practicalGuideLinks(lang).advisor};
}


export const ADVISOR_DISCOVERY_NOTE:Record<Locale,string>={
  "en": "Use your land and equipment requirements to screen published models. Results are suggestions, not a guarantee of suitability.",
  "tr": "Arazi ve ekipman gereksinimlerinle yayımlanmış modelleri ön elemeden geçir. Sonuçlar öneridir, uygunluk garantisi değildir.",
  "zh": "根据农地和农具需求初步筛选已发布的机型。结果仅供参考，不保证适用性。",
  "hi": "भूमि और उपकरण की आवश्यकताओं के आधार पर प्रकाशित मॉडलों की प्रारंभिक छँटाई करें। परिणाम सुझाव हैं, उपयुक्तता की गारंटी नहीं।",
  "pt-br": "Faça uma triagem dos modelos publicados conforme sua área e seus implementos. Os resultados são sugestões, não garantia de adequação.",
  "fr": "Présélectionnez les modèles publiés selon vos terres et vos outils. Les résultats sont des suggestions, sans garantie d’adéquation.",
  "de": "Grenzen Sie veröffentlichte Modelle anhand Ihrer Flächen- und Geräteanforderungen ein. Die Ergebnisse sind Vorschläge, keine Eignungsgarantie.",
  "ru": "Выполните предварительный отбор опубликованных моделей по требованиям хозяйства и орудий. Результаты — рекомендации, а не гарантия пригодности.",
  "ja": "農地や作業機の条件から公開済み機種を絞り込みます。結果は候補の提案であり、適合性を保証しません。",
  "es": "Filtra los modelos publicados según tus terrenos y aperos. Los resultados son sugerencias, no una garantía de idoneidad."
};
