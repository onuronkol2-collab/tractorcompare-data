import type {Locale} from "./locales";
const copy:Record<Locale,readonly [string,string,string]>={
  "en": [
    "Ownership cost: fuel price −20%",
    "Ownership cost: fuel price +20%",
    "Illustrative sensitivity: only fuel price changes by 20% in either direction. All other inputs stay constant. These are not forecasts."
  ],
  "tr": [
    "Sahiplik maliyeti: yakıt fiyatı −%20",
    "Sahiplik maliyeti: yakıt fiyatı +%20",
    "Örnek duyarlılık analizi: yalnızca yakıt fiyatı iki yönde %20 değişir. Diğer girdiler sabittir. Bunlar fiyat tahmini değildir."
  ],
  "de": [
    "Besitzkosten: Kraftstoffpreis −20 %",
    "Besitzkosten: Kraftstoffpreis +20 %",
    "Beispielhafte Sensitivität: Nur der Kraftstoffpreis ändert sich um ±20 %. Alle anderen Eingaben bleiben konstant. Keine Prognose."
  ],
  "fr": [
    "Coût de détention : carburant −20 %",
    "Coût de détention : carburant +20 %",
    "Analyse de sensibilité illustrative : seul le prix du carburant varie de ±20 %. Les autres données restent constantes. Ce ne sont pas des prévisions."
  ],
  "es": [
    "Coste de propiedad: combustible −20 %",
    "Coste de propiedad: combustible +20 %",
    "Sensibilidad ilustrativa: solo cambia el precio del combustible en ±20 %. Las demás entradas permanecen constantes. No son previsiones."
  ],
  "pt-br": [
    "Custo de propriedade: combustível −20%",
    "Custo de propriedade: combustível +20%",
    "Sensibilidade ilustrativa: apenas o preço do combustível varia em ±20%. Os demais dados permanecem constantes. Não são previsões."
  ],
  "ru": [
    "Затраты на владение: цена топлива −20 %",
    "Затраты на владение: цена топлива +20 %",
    "Иллюстративный анализ: меняется только цена топлива на ±20 %. Остальные параметры постоянны. Это не прогноз."
  ],
  "zh": [
    "持有成本：油价下降20%",
    "持有成本：油价上涨20%",
    "示例敏感性分析：仅改变燃油价格，上下浮动20%，其余输入不变。这不是预测。"
  ],
  "hi": [
    "स्वामित्व लागत: ईंधन मूल्य −20%",
    "स्वामित्व लागत: ईंधन मूल्य +20%",
    "उदाहरणात्मक संवेदनशीलता: केवल ईंधन का मूल्य ±20% बदलता है। अन्य इनपुट स्थिर हैं। ये पूर्वानुमान नहीं हैं।"
  ],
  "ja": [
    "保有費用：燃料価格 −20%",
    "保有費用：燃料価格 +20%",
    "感度分析の例：燃料価格だけを±20%変え、その他の入力は固定します。予測ではありません。"
  ]
};
export function fuelSensitivityText(lang:Locale){const [low,high,note]=copy[lang];return {low,high,note};}
