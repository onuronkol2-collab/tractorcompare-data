import type {Locale} from "./locales.ts";
import {compareFieldScenarios} from "./farm-extras.mjs";
export const FARM_SCENARIO_EXAMPLE_COPY:Record<Locale,readonly [string,string,string]>={
  "en": [
    "Worked example: hourly fuel vs fuel per hectare",
    "Both hypothetical setups cover 8 ha at 5 km/h and 80% field efficiency, with 5 available field hours per day. No particular tractor, fuel price or safe daily working limit is assumed.",
    "B uses more fuel per hour but covers the same field in less time, so its total fuel use is lower in this example. Actual results depend on measured inputs and compatible equipment."
  ],
  "tr": [
    "Örnek: saatlik yakıt ile dekar başına yakıt farkı",
    "İki varsayımsal düzen de 8 hektar (80 dekar) alanda 5 km/sa hız, %80 tarla verimi ve günlük 5 saat kullanılabilir tarla süresiyle çalışır. Belirli bir traktör, yakıt fiyatı veya güvenli çalışma sınırı varsayılmaz.",
    "B saatte daha fazla yakıt tüketse de aynı alanı daha kısa sürede işler; bu örnekte toplam yakıtı daha azdır. Gerçek sonuçlar ölçülen değerlere ve uyumlu ekipmana bağlıdır."
  ],
  "de": [
    "Rechenbeispiel: Stundenverbrauch und Verbrauch je Hektar",
    "Beide fiktiven Varianten bearbeiten 8 ha mit 5 km/h, 80 % Feldwirkungsgrad und 5 verfügbaren Feldstunden pro Tag. Es werden weder ein bestimmter Traktor noch ein Kraftstoffpreis oder eine sichere Arbeitszeitgrenze vorausgesetzt.",
    "B verbraucht pro Stunde mehr Kraftstoff, bearbeitet die gleiche Fläche aber schneller und benötigt in diesem Beispiel insgesamt weniger Kraftstoff. Tatsächliche Ergebnisse hängen von Messwerten und passenden Geräten ab."
  ],
  "fr": [
    "Exemple : consommation horaire et par hectare",
    "Les deux configurations fictives travaillent 8 ha à 5 km/h, avec 80 % d’efficacité au champ et 5 heures disponibles par jour. Aucun tracteur précis, prix du carburant ni durée de travail sûre n’est supposé.",
    "B consomme davantage par heure, mais termine la même parcelle plus vite et consomme donc moins au total dans cet exemple. Les résultats réels dépendent des mesures et de la compatibilité des outils."
  ],
  "es": [
    "Ejemplo: consumo por hora y por hectárea",
    "Ambas configuraciones hipotéticas trabajan 8 ha a 5 km/h, con un 80 % de eficiencia de campo y 5 horas disponibles al día. No se supone un tractor concreto, un precio del combustible ni un límite seguro de trabajo.",
    "B consume más combustible por hora, pero termina la misma superficie antes y en este ejemplo gasta menos en total. Los resultados reales dependen de las mediciones y de aperos compatibles."
  ],
  "pt-br": [
    "Exemplo: consumo por hora e por hectare",
    "As duas configurações hipotéticas trabalham 8 ha a 5 km/h, com 80% de eficiência de campo e 5 horas disponíveis por dia. Não se presume um trator específico, preço de combustível ou limite seguro de trabalho.",
    "B consome mais combustível por hora, mas termina a mesma área mais rapidamente e, neste exemplo, consome menos no total. Os resultados reais dependem de medições e implementos compatíveis."
  ],
  "ru": [
    "Пример: расход топлива за час и на гектар",
    "Обе условные конфигурации обрабатывают 8 га со скоростью 5 км/ч, полевой эффективностью 80% и доступным временем 5 часов в день. Конкретный трактор, цена топлива и безопасная продолжительность работы не предполагаются.",
    "B расходует больше топлива за час, но обрабатывает ту же площадь быстрее, поэтому в примере суммарный расход ниже. Фактический результат зависит от измерений и совместимости орудий."
  ],
  "zh": [
    "计算示例：每小时油耗与每公顷油耗",
    "两种假设配置均作业8公顷，速度5千米/小时，田间效率80%，每天可用田间时间5小时。不假设具体拖拉机、油价或安全作业时限。",
    "B的每小时油耗更高，但完成相同面积所需时间更短，因此本例总油耗更低。实际结果取决于实测数据和机具匹配情况。"
  ],
  "ja": [
    "計算例：時間当たり燃料消費量と面積当たり燃料消費量",
    "仮想の2条件で8 haを作業します。速度5 km/h、圃場作業効率80%、1日の利用可能時間5時間とします。特定機種、燃料価格、安全な作業時間の上限を仮定していません。",
    "Bは時間当たりの燃料消費量が多くても、同じ面積を短時間で処理するため、この例では総燃料消費量が少なくなります。実際の結果は実測値と作業機の適合性に左右されます。"
  ],
  "hi": [
    "उदाहरण: प्रति घंटे और प्रति हेक्टेयर ईंधन खपत",
    "दो काल्पनिक व्यवस्थाएँ 8 हेक्टेयर में 5 किमी/घंटा गति, 80% खेत दक्षता और प्रतिदिन 5 उपलब्ध कार्य घंटों के साथ काम करती हैं। किसी खास ट्रैक्टर, ईंधन मूल्य या सुरक्षित कार्य सीमा का अनुमान नहीं लगाया गया है।",
    "B प्रति घंटे अधिक ईंधन लेता है, लेकिन समान क्षेत्र का काम कम समय में पूरा करता है, इसलिए इस उदाहरण में कुल खपत कम है। वास्तविक परिणाम मापे गए आँकड़ों और संगत उपकरणों पर निर्भर हैं।"
  ]
};
export function farmScenarioExample(){
 const shared={area:8,unit:"ha",price:0,dailyHours:5};
 const a={width:2,speed:5,efficiency:80,fuel:8,other:0};
 const b={...a,width:4,fuel:12};
 return {shared,a,b,result:compareFieldScenarios(shared,a,b)};
}
