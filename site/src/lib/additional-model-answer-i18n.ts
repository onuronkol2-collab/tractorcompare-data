import type {Locale} from "./locales.ts";

// Exact, separate hydraulic circuits; never treat total, main, implement and steering flow as synonyms.
export const ADDITIONAL_ANSWER_FIELDS = ["engine-cylinders","hydraulic-main-flow","hydraulic-implement-flow","hydraulic-total-flow","hydraulic-steering-flow","ground-clearance"] as const;
export type AdditionalAnswerField=typeof ADDITIONAL_ANSWER_FIELDS[number];
export function isAdditionalAnswerField(id:string):id is AdditionalAnswerField {return (ADDITIONAL_ANSWER_FIELDS as readonly string[]).includes(id);}
const COPY:Record<Locale,Record<AdditionalAnswerField,readonly [string,string]>>={
  "en": {
    "engine-cylinders": [
      "How many engine cylinders are documented for {n}?",
      "{n}: The reviewed source lists {v} engine cylinders. Cylinder count alone does not establish power or fuel consumption."
    ],
    "hydraulic-main-flow": [
      "What main hydraulic pump flow is documented for {n}?",
      "{n}: The source lists a main pump flow of {v} {u}. Check pump speed and operating conditions; this is not necessarily implement flow."
    ],
    "hydraulic-implement-flow": [
      "What implement hydraulic flow is documented for {n}?",
      "{n}: The source lists {v} {u} for implement hydraulics. Check available flow at the couplers and operating conditions."
    ],
    "hydraulic-total-flow": [
      "What total hydraulic flow is documented for {n}?",
      "{n}: The source lists total hydraulic flow of {v} {u}. Total flow need not be available to implements."
    ],
    "hydraulic-steering-flow": [
      "What steering hydraulic flow is documented for {n}?",
      "{n}: The source lists steering hydraulic flow of {v} {u}. This is not implement hydraulic flow."
    ],
    "ground-clearance": [
      "What ground clearance is documented for {n}?",
      "{n}: The source lists ground clearance of {v} {u}. Check tyres, equipment and the measurement point before comparing."
    ]
  },
  "tr": {
    "engine-cylinders": [
      "{n} modelinin belgelenmiş motor silindir sayısı kaç?",
      "{n}: İncelenen kaynak motorun {v} silindirli olduğunu belirtiyor. Silindir sayısı tek başına güç veya yakıt tüketimini göstermez."
    ],
    "hydraulic-main-flow": [
      "{n} modelinin ana hidrolik pompa debisi kaç?",
      "{n}: Kaynak ana pompa debisini {v} {u} olarak veriyor. Pompa devrini ve çalışma koşullarını kontrol edin; bu değer ekipman debisiyle aynı olmayabilir."
    ],
    "hydraulic-implement-flow": [
      "{n} modelinin ekipman hidrolik debisi kaç?",
      "{n}: Kaynak ekipman hidrolik debisini {v} {u} olarak veriyor. Bağlantı noktalarındaki kullanılabilir debiyi ve çalışma koşullarını kontrol edin."
    ],
    "hydraulic-total-flow": [
      "{n} modelinin toplam hidrolik debisi kaç?",
      "{n}: Kaynak toplam hidrolik debiyi {v} {u} olarak veriyor. Bu debinin tamamı ekipmanlara ayrılmış olmayabilir."
    ],
    "hydraulic-steering-flow": [
      "{n} modelinin direksiyon hidrolik debisi kaç?",
      "{n}: Kaynak direksiyon hidrolik debisini {v} {u} olarak veriyor. Bu, ekipman hidrolik debisi değildir."
    ],
    "ground-clearance": [
      "{n} modelinin belgelenmiş yerden yüksekliği kaç?",
      "{n}: Kaynak yerden yüksekliği {v} {u} olarak veriyor. Karşılaştırmadan önce lastikleri, donanımı ve ölçüm noktasını kontrol edin."
    ]
  },
  "de": {
    "engine-cylinders": [
      "Wie viele Motorzylinder sind für {n} dokumentiert?",
      "{n}: Die Quelle nennt {v} Motorzylinder. Die Zylinderzahl allein bestimmt weder Leistung noch Verbrauch."
    ],
    "hydraulic-main-flow": [
      "Welcher Förderstrom der Haupthydraulikpumpe ist für {n} dokumentiert?",
      "{n}: Die Quelle nennt {v} {u} für die Hauptpumpe. Drehzahl und Betriebsbedingungen prüfen; dies ist nicht zwingend der Förderstrom für Arbeitsgeräte."
    ],
    "hydraulic-implement-flow": [
      "Welcher Hydraulikförderstrom für Arbeitsgeräte ist für {n} dokumentiert?",
      "{n}: Die Quelle nennt {v} {u} für Arbeitsgeräte. Verfügbaren Förderstrom an den Anschlüssen und Betriebsbedingungen prüfen."
    ],
    "hydraulic-total-flow": [
      "Welcher Gesamthydraulikförderstrom ist für {n} dokumentiert?",
      "{n}: Die Quelle nennt insgesamt {v} {u}. Nicht der gesamte Förderstrom muss Arbeitsgeräten zur Verfügung stehen."
    ],
    "hydraulic-steering-flow": [
      "Welcher Lenkhydraulikförderstrom ist für {n} dokumentiert?",
      "{n}: Die Quelle nennt {v} {u} für die Lenkhydraulik, nicht für Arbeitsgeräte."
    ],
    "ground-clearance": [
      "Welche Bodenfreiheit ist für {n} dokumentiert?",
      "{n}: Die Quelle nennt {v} {u} Bodenfreiheit. Vor Vergleichen Reifen, Ausstattung und Messpunkt prüfen."
    ]
  },
  "fr": {
    "engine-cylinders": [
      "Combien de cylindres sont documentés pour le moteur du {n} ?",
      "{n} : la source indique {v} cylindres. Leur nombre ne suffit pas à déterminer la puissance ou la consommation."
    ],
    "hydraulic-main-flow": [
      "Quel débit de pompe hydraulique principale est documenté pour le {n} ?",
      "{n} : la source indique {v} {u} pour la pompe principale. Vérifiez le régime et les conditions ; ce débit n'est pas nécessairement celui des outils."
    ],
    "hydraulic-implement-flow": [
      "Quel débit hydraulique des outils est documenté pour le {n} ?",
      "{n} : la source indique {v} {u} pour les outils. Vérifiez le débit disponible aux raccords et les conditions de fonctionnement."
    ],
    "hydraulic-total-flow": [
      "Quel débit hydraulique total est documenté pour le {n} ?",
      "{n} : la source indique un débit total de {v} {u}. Il n'est pas forcément entièrement disponible pour les outils."
    ],
    "hydraulic-steering-flow": [
      "Quel débit hydraulique de direction est documenté pour le {n} ?",
      "{n} : la source indique {v} {u} pour la direction, et non pour les outils."
    ],
    "ground-clearance": [
      "Quelle garde au sol est documentée pour le {n} ?",
      "{n} : la source indique {v} {u} de garde au sol. Vérifiez les pneus, l'équipement et le point de mesure avant de comparer."
    ]
  },
  "es": {
    "engine-cylinders": [
      "¿Cuántos cilindros del motor están documentados para el {n}?",
      "{n}: la fuente indica {v} cilindros. Su número por sí solo no determina la potencia ni el consumo."
    ],
    "hydraulic-main-flow": [
      "¿Qué caudal de la bomba hidráulica principal está documentado para el {n}?",
      "{n}: la fuente indica {v} {u} para la bomba principal. Comprueba el régimen y las condiciones; no equivale necesariamente al caudal de los aperos."
    ],
    "hydraulic-implement-flow": [
      "¿Qué caudal hidráulico para implementos está documentado para el {n}?",
      "{n}: la fuente indica {v} {u} para implementos. Comprueba el caudal disponible en los acoplamientos y las condiciones de trabajo."
    ],
    "hydraulic-total-flow": [
      "¿Qué caudal hidráulico total está documentado para el {n}?",
      "{n}: la fuente indica un caudal total de {v} {u}. No todo el caudal tiene que estar disponible para implementos."
    ],
    "hydraulic-steering-flow": [
      "¿Qué caudal hidráulico de dirección está documentado para el {n}?",
      "{n}: la fuente indica {v} {u} para la dirección, no para los implementos."
    ],
    "ground-clearance": [
      "¿Qué distancia libre al suelo está documentada para el {n}?",
      "{n}: la fuente indica {v} {u} de distancia libre al suelo. Comprueba neumáticos, equipamiento y punto de medición antes de comparar."
    ]
  },
  "pt-br": {
    "engine-cylinders": [
      "Quantos cilindros do motor estão documentados para o {n}?",
      "{n}: a fonte informa {v} cilindros. O número de cilindros, por si só, não determina potência nem consumo."
    ],
    "hydraulic-main-flow": [
      "Qual vazão da bomba hidráulica principal está documentada para o {n}?",
      "{n}: a fonte informa {v} {u} para a bomba principal. Confira a rotação e as condições de operação; essa vazão não é necessariamente a dos implementos."
    ],
    "hydraulic-implement-flow": [
      "Qual vazão hidráulica para implementos está documentada para o {n}?",
      "{n}: a fonte informa {v} {u} para implementos. Confira a vazão disponível nos engates e as condições de operação."
    ],
    "hydraulic-total-flow": [
      "Qual vazão hidráulica total está documentada para o {n}?",
      "{n}: a fonte informa vazão total de {v} {u}. Nem toda essa vazão precisa estar disponível aos implementos."
    ],
    "hydraulic-steering-flow": [
      "Qual vazão hidráulica da direção está documentada para o {n}?",
      "{n}: a fonte informa {v} {u} para a direção, não para os implementos."
    ],
    "ground-clearance": [
      "Qual vão livre do solo está documentado para o {n}?",
      "{n}: a fonte informa {v} {u} de vão livre do solo. Confira pneus, equipamentos e ponto de medição antes de comparar."
    ]
  },
  "ru": {
    "engine-cylinders": [
      "Сколько цилиндров двигателя указано в документации для {n}?",
      "{n}: источник указывает {v} цилиндров двигателя. Их число само по себе не определяет мощность или расход топлива."
    ],
    "hydraulic-main-flow": [
      "Какая подача основного гидронасоса указана для {n}?",
      "{n}: в источнике указано {v} {u} для основного насоса. Уточняйте обороты и условия работы; это не обязательно расход для орудий."
    ],
    "hydraulic-implement-flow": [
      "Какой расход гидравлики для навесного оборудования указан для {n}?",
      "{n}: источник указывает {v} {u} для орудий. Проверяйте доступный расход на соединениях и условия работы."
    ],
    "hydraulic-total-flow": [
      "Какой общий расход гидросистемы указан для {n}?",
      "{n}: в источнике указан общий расход {v} {u}. Он не обязательно полностью доступен навесному оборудованию."
    ],
    "hydraulic-steering-flow": [
      "Какой расход гидравлики рулевого управления указан для {n}?",
      "{n}: источник указывает {v} {u} для рулевого управления, а не для орудий."
    ],
    "ground-clearance": [
      "Какой дорожный просвет указан для {n}?",
      "{n}: источник указывает дорожный просвет {v} {u}. Перед сравнением проверьте шины, оснащение и точку измерения."
    ]
  },
  "zh": {
    "engine-cylinders": [
      "资料记载的 {n} 发动机有几个气缸？",
      "{n}：资料记载发动机有 {v} 个气缸。仅凭气缸数无法确定功率或油耗。"
    ],
    "hydraulic-main-flow": [
      "资料记载的 {n} 主液压泵流量是多少？",
      "{n}：资料记载主泵流量为 {v} {u}。请核对转速和工况；该值不一定等于农具可用流量。"
    ],
    "hydraulic-implement-flow": [
      "资料记载的 {n} 农具液压流量是多少？",
      "{n}：资料记载农具液压流量为 {v} {u}。请核对接头处的可用流量和工况。"
    ],
    "hydraulic-total-flow": [
      "资料记载的 {n} 液压总流量是多少？",
      "{n}：资料记载液压总流量为 {v} {u}。总流量不一定全部可供农具使用。"
    ],
    "hydraulic-steering-flow": [
      "资料记载的 {n} 转向液压流量是多少？",
      "{n}：资料记载转向液压流量为 {v} {u}，并非农具液压流量。"
    ],
    "ground-clearance": [
      "资料记载的 {n} 离地间隙是多少？",
      "{n}：资料记载离地间隙为 {v} {u}。比较前请核对轮胎、配置及测量位置。"
    ]
  },
  "ja": {
    "engine-cylinders": [
      "{n} のエンジン気筒数は資料でいくつと確認できますか？",
      "{n}：確認済み資料ではエンジンは {v} 気筒です。気筒数だけでは出力や燃料消費量は判断できません。"
    ],
    "hydraulic-main-flow": [
      "{n} の主油圧ポンプ流量は資料でいくつと確認できますか？",
      "{n}：資料では主ポンプ流量は {v} {u} です。回転数と作動条件を確認してください。作業機用の流量と同じとは限りません。"
    ],
    "hydraulic-implement-flow": [
      "{n} の作業機用油圧流量は資料でいくつと確認できますか？",
      "{n}：資料では作業機用流量は {v} {u} です。接続部で利用できる流量と作動条件を確認してください。"
    ],
    "hydraulic-total-flow": [
      "{n} の油圧総流量は資料でいくつと確認できますか？",
      "{n}：資料では油圧総流量は {v} {u} です。全量を作業機で使えるとは限りません。"
    ],
    "hydraulic-steering-flow": [
      "{n} の操舵用油圧流量は資料でいくつと確認できますか？",
      "{n}：資料では操舵用流量は {v} {u} です。作業機用の流量ではありません。"
    ],
    "ground-clearance": [
      "{n} の地上高は資料でいくつと確認できますか？",
      "{n}：資料では地上高は {v} {u} です。比較前にタイヤ、装備、測定位置を確認してください。"
    ]
  },
  "hi": {
    "engine-cylinders": [
      "{n} के इंजन में कितने सिलेंडर दर्ज हैं?",
      "{n}: स्रोत में इंजन के {v} सिलेंडर दर्ज हैं। केवल सिलेंडरों की संख्या से शक्ति या ईंधन खपत तय नहीं होती।"
    ],
    "hydraulic-main-flow": [
      "{n} के मुख्य हाइड्रोलिक पंप का दर्ज प्रवाह कितना है?",
      "{n}: स्रोत में मुख्य पंप का प्रवाह {v} {u} दर्ज है। गति और संचालन की शर्तें जाँचें; यह उपकरणों को उपलब्ध प्रवाह के बराबर होना आवश्यक नहीं है।"
    ],
    "hydraulic-implement-flow": [
      "{n} के कृषि उपकरणों के लिए दर्ज हाइड्रोलिक प्रवाह कितना है?",
      "{n}: स्रोत में उपकरणों के लिए {v} {u} दर्ज है। कनेक्टरों पर उपलब्ध प्रवाह और संचालन की शर्तें जाँचें।"
    ],
    "hydraulic-total-flow": [
      "{n} का कुल दर्ज हाइड्रोलिक प्रवाह कितना है?",
      "{n}: स्रोत में कुल प्रवाह {v} {u} दर्ज है। पूरा प्रवाह उपकरणों के लिए उपलब्ध होना आवश्यक नहीं है।"
    ],
    "hydraulic-steering-flow": [
      "{n} का दर्ज स्टीयरिंग हाइड्रोलिक प्रवाह कितना है?",
      "{n}: स्रोत में स्टीयरिंग के लिए {v} {u} दर्ज है, यह उपकरणों का प्रवाह नहीं है।"
    ],
    "ground-clearance": [
      "{n} का दर्ज ग्राउंड क्लीयरेंस कितना है?",
      "{n}: स्रोत में ग्राउंड क्लीयरेंस {v} {u} दर्ज है। तुलना से पहले टायर, उपकरण और माप बिंदु जाँचें।"
    ]
  }
};
export function additionalEvidenceCopy(lang:Locale,id:AdditionalAnswerField,name:string,value:string,unit:string){
 const [q,a]=COPY[lang][id];
 const displayUnit=unit==="l/min"?(lang==="tr"?"L/dk":lang==="ru"?"л/мин":"L/min"):unit==="mm"&&lang==="ru"?"мм":unit;
 const fill=(s:string)=>s.replace(/\{([nvu])\}/g,(_,key)=>key==="n"?name:key==="v"?value:displayUnit);
 return {question:fill(q),answer:fill(a)};
}
