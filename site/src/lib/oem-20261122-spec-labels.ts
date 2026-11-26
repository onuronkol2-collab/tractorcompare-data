import type { Locale } from "./locales.ts";

/**
 * Exact-display-name translations for owner-approved, manufacturer-sourced
 * additions to the published catalogue on 22 November 2026.
 *
 * These labels MUST NOT rewrite model identities, evidence, raw OEM values,
 * qualifiers (optional/unknown) or measurement units. They are not evidence
 * for an original manufacturer's test standard or configuration availability.
 */
export const OEM_20261122_SPEC_LABELS: Record<string, Partial<Record<Locale,string>>> = {
  "Braking system": {
    tr:"Fren sistemi",zh:"制动系统",hi:"ब्रेक प्रणाली", "pt-br":"Sistema de freios",fr:"Système de freinage",de:"Bremssystem",ru:"Тормозная система",ja:"ブレーキシステム",es:"Sistema de frenos"
  },
  "Front axle type": {
    tr:"Ön aks tipi",zh:"前桥类型",hi:"अगले एक्सल का प्रकार","pt-br":"Tipo de eixo dianteiro",fr:"Type d’essieu avant",de:"Vorderachstyp",ru:"Тип переднего моста",ja:"前車軸の形式",es:"Tipo de eje delantero"
  },
  "PTO speed selection": {
    tr:"PTO hız seçimi",zh:"动力输出轴转速选择",hi:"पीटीओ गति विकल्प","pt-br":"Seleção de rotações da TDP",fr:"Choix des régimes de prise de force",de:"Zapfwellendrehzahl-Auswahl",ru:"Выбор частоты вращения ВОМ",ja:"PTO回転数の選択",es:"Selección de velocidades de la TDF"
  },
  "Clutch options": {
    tr:"Debriyaj seçenekleri",zh:"离合器选项",hi:"क्लच विकल्प","pt-br":"Opções de embreagem",fr:"Options d’embrayage",de:"Kupplungsoptionen",ru:"Варианты сцепления",ja:"クラッチの選択肢",es:"Opciones de embrague"
  },
  "Manufacturer-stated service interval": {
    tr:"Üreticinin belirttiği bakım aralığı",zh:"制造商标示的保养间隔",hi:"निर्माता द्वारा बताया गया सर्विस अंतराल","pt-br":"Intervalo de manutenção informado pelo fabricante",fr:"Intervalle d’entretien annoncé par le constructeur",de:"Wartungsintervall laut Hersteller",ru:"Межсервисный интервал по данным производителя",ja:"メーカー公表の整備間隔",es:"Intervalo de mantenimiento indicado por el fabricante"
  },
  "Manufacturer-quoted PTO power": {
    tr:"Üreticinin bildirdiği PTO gücü",zh:"制造商标示的动力输出轴功率",hi:"निर्माता के अनुसार पीटीओ शक्ति","pt-br":"Potência da TDP declarada pelo fabricante",fr:"Puissance à la prise de force annoncée par le constructeur",de:"Zapfwellenleistung laut Hersteller",ru:"Мощность ВОМ по данным производителя",ja:"メーカー公表のPTO出力",es:"Potencia de la TDF declarada por el fabricante"
  },
  "Manufacturer-listed clutch feature": {
    tr:"Üreticinin belirttiği debriyaj özelliği",zh:"制造商列出的离合器配置",hi:"निर्माता द्वारा बताई गई क्लच सुविधा","pt-br":"Recurso de embreagem informado pelo fabricante",fr:"Fonction d’embrayage mentionnée par le constructeur",de:"Vom Hersteller genanntes Kupplungsmerkmal",ru:"Особенность сцепления, указанная производителем",ja:"メーカー記載のクラッチ機能",es:"Función de embrague indicada por el fabricante"
  },
  "Manufacturer-listed implement side-shift feature": {
    tr:"Üreticinin belirttiği ekipman yan kaydırma özelliği",zh:"制造商列出的农具侧移功能",hi:"निर्माता द्वारा बताई गई उपकरण की पार्श्व स्थानांतरण सुविधा","pt-br":"Deslocamento lateral do implemento conforme o fabricante",fr:"Fonction de déport latéral d’outil selon le constructeur",de:"Seitliche Geräteverschiebung laut Hersteller",ru:"Боковое смещение навесного оборудования по данным производителя",ja:"メーカー記載の作業機横移動機能",es:"Desplazamiento lateral del implemento según el fabricante"
  },
  "Wheel arrangement": {
    tr:"Tekerlek düzeni",zh:"车轮布置",hi:"पहियों की व्यवस्था","pt-br":"Configuração das rodas",fr:"Disposition des roues",de:"Radanordnung",ru:"Компоновка колёс",ja:"車輪配置",es:"Disposición de las ruedas"
  },
  // Exact source-heading terminology, nominal catalogue preflight 2026-11-26.
  // Generic labels only; no draft model identity or private evidence.
  "Service brake type": {"tr":"Servis freni tipi","zh":"行车制动器类型","hi":"सर्विस ब्रेक का प्रकार","pt-br":"Tipo de freio de serviço","fr":"Type de frein de service","de":"Betriebsbremsenart","ru":"Тип рабочего тормоза","ja":"常用ブレーキ形式","es":"Tipo de freno de servicio"},
  "Cab": {"tr":"Kabin","zh":"驾驶室","hi":"केबिन","pt-br":"Cabine","fr":"Cabine","de":"Kabine","ru":"Кабина","ja":"キャブ","es":"Cabina"},
  "Transmission clutch": {"tr":"Şanzıman debriyajı","zh":"变速箱离合器","hi":"ट्रांसमिशन क्लच","pt-br":"Embreagem da transmissão","fr":"Embrayage de transmission","de":"Getriebekupplung","ru":"Сцепление трансмиссии","ja":"変速機クラッチ","es":"Embrague de la transmisión"},
  "Nominal engine power (ISO 14396)": {"tr":"Nominal motor gücü (ISO 14396)","zh":"发动机标定功率（ISO 14396）","hi":"इंजन की निर्धारित शक्ति (ISO 14396)","pt-br":"Potência nominal do motor (ISO 14396)","fr":"Puissance nominale du moteur (ISO 14396)","de":"Motornennleistung (ISO 14396)","ru":"Номинальная мощность двигателя (ISO 14396)","ja":"エンジン定格出力（ISO 14396）","es":"Potencia nominal del motor (ISO 14396)"},
  "Front ballast": {"tr":"Ön balast","zh":"前部配重","hi":"अगला बैलास्ट","pt-br":"Lastro dianteiro","fr":"Lest avant","de":"Frontballast","ru":"Передний балласт","ja":"前部バラスト","es":"Lastre delantero"},
  "Front differential": {"tr":"Ön diferansiyel","zh":"前差速器","hi":"अगला डिफरेंशियल","pt-br":"Diferencial dianteiro","fr":"Différentiel avant","de":"Vorderachsdifferenzial","ru":"Передний дифференциал","ja":"前輪デファレンシャル","es":"Diferencial delantero"},
  "Adjustable front track width": {"tr":"Ayarlanabilir ön iz genişliği","zh":"可调前轮距","hi":"समायोज्य अगली ट्रैक चौड़ाई","pt-br":"Bitola dianteira ajustável","fr":"Voie avant réglable","de":"Verstellbare vordere Spurweite","ru":"Регулируемая передняя колея","ja":"前輪トレッド調整範囲","es":"Ancho de vía delantero ajustable"},
  "Front track": {"tr":"Ön iz genişliği","zh":"前轮距","hi":"अगली ट्रैक चौड़ाई","pt-br":"Bitola dianteira","fr":"Voie avant","de":"Vordere Spurweite","ru":"Передняя колея","ja":"前輪トレッド","es":"Ancho de vía delantero"},
  "Front track range": {"tr":"Ön iz genişliği aralığı","zh":"前轮距范围","hi":"अगली ट्रैक चौड़ाई की सीमा","pt-br":"Faixa de bitola dianteira","fr":"Plage de voie avant","de":"Bereich der vorderen Spurweite","ru":"Диапазон передней колеи","ja":"前輪トレッド範囲","es":"Rango de ancho de vía delantero"},
  "Front tyre option 1": {"tr":"Ön lastik seçeneği 1","zh":"前轮胎选项1","hi":"अगला टायर विकल्प 1","pt-br":"Opção de pneu dianteiro 1","fr":"Option de pneu avant 1","de":"Vorderreifenoption 1","ru":"Вариант передних шин 1","ja":"前輪タイヤ選択肢1","es":"Opción de neumático delantero 1"},
  "Front tyre size": {"tr":"Ön lastik ölçüsü","zh":"前轮胎规格","hi":"अगले टायर का आकार","pt-br":"Medida do pneu dianteiro","fr":"Dimension du pneu avant","de":"Vorderreifengröße","ru":"Размер передних шин","ja":"前輪タイヤサイズ","es":"Medida del neumático delantero"},
  "Lift capacity at pivot point (minimum)": {"tr":"Mafsaldaki asgari kaldırma kapasitesi","zh":"铰接点最小提升能力","hi":"धुरी बिंदु पर न्यूनतम उठाने की क्षमता","pt-br":"Capacidade mínima de elevação no ponto de articulação","fr":"Capacité minimale de relevage au point de pivot","de":"Mindesthubkraft am Drehpunkt","ru":"Минимальная подъёмная способность в точке шарнира","ja":"支点での最小揚力","es":"Capacidad mínima de elevación en el punto de pivote"},
  "Maximum hydraulic pump pressure": {"tr":"Azami hidrolik pompa basıncı","zh":"液压泵最大压力","hi":"हाइड्रोलिक पंप का अधिकतम दबाव","pt-br":"Pressão máxima da bomba hidráulica","fr":"Pression maximale de la pompe hydraulique","de":"Maximaler Hydraulikpumpendruck","ru":"Максимальное давление гидравлического насоса","ja":"油圧ポンプ最高圧力","es":"Presión máxima de la bomba hidráulica"},
  "Hydraulic outlets / valves": {"tr":"Hidrolik çıkışlar / valfler","zh":"液压输出口／阀","hi":"हाइड्रोलिक आउटलेट / वाल्व","pt-br":"Saídas hidráulicas / válvulas","fr":"Sorties hydrauliques / distributeurs","de":"Hydraulikanschlüsse / Ventile","ru":"Гидравлические выходы / клапаны","ja":"油圧取出口／バルブ","es":"Salidas hidráulicas / válvulas"},
  "Standard hydraulic outlets": {"tr":"Standart hidrolik çıkışlar","zh":"标准液压输出口","hi":"मानक हाइड्रोलिक आउटलेट","pt-br":"Saídas hidráulicas de série","fr":"Sorties hydrauliques de série","de":"Serienmäßige Hydraulikanschlüsse","ru":"Штатные гидравлические выходы","ja":"標準油圧取出口","es":"Salidas hidráulicas de serie"},
  "Standard rear hydraulic outlets": {"tr":"Standart arka hidrolik çıkışlar","zh":"标准后部液压输出口","hi":"मानक पिछले हाइड्रोलिक आउटलेट","pt-br":"Saídas hidráulicas traseiras de série","fr":"Sorties hydrauliques arrière de série","de":"Serienmäßige hintere Hydraulikanschlüsse","ru":"Штатные задние гидравлические выходы","ja":"標準後部油圧取出口","es":"Salidas hidráulicas traseras de serie"},
  "Hydraulic output circuits": {"tr":"Hidrolik çıkış devreleri","zh":"液压输出回路","hi":"हाइड्रोलिक आउटपुट सर्किट","pt-br":"Circuitos de saída hidráulica","fr":"Circuits de sortie hydraulique","de":"Hydraulische Ausgangskreise","ru":"Выходные гидравлические контуры","ja":"油圧出力回路","es":"Circuitos de salida hidráulica"},
  "Minimum operating mass": {"tr":"Asgari çalışma kütlesi","zh":"最小工作质量","hi":"न्यूनतम परिचालन द्रव्यमान","pt-br":"Massa operacional mínima","fr":"Masse minimale en ordre de marche","de":"Minimale Betriebsmasse","ru":"Минимальная эксплуатационная масса","ja":"最小運転質量","es":"Masa mínima en funcionamiento"},
  "Minimum turning radius": {"tr":"Asgari dönüş yarıçapı","zh":"最小转弯半径","hi":"न्यूनतम मोड़ त्रिज्या","pt-br":"Raio mínimo de giro","fr":"Rayon de braquage minimal","de":"Minimaler Wendekreisradius","ru":"Минимальный радиус поворота","ja":"最小旋回半径","es":"Radio mínimo de giro"},
  "Length including front ballast": {"tr":"Ön balast dahil uzunluk","zh":"含前部配重的长度","hi":"अगले बैलास्ट सहित लंबाई","pt-br":"Comprimento incluindo lastro dianteiro","fr":"Longueur avec lest avant","de":"Länge einschließlich Frontballast","ru":"Длина с передним балластом","ja":"前部バラスト込みの全長","es":"Longitud con lastre delantero"},
  "Parking brake control": {"tr":"Park freni kumandası","zh":"驻车制动操纵","hi":"पार्किंग ब्रेक का नियंत्रण","pt-br":"Comando do freio de estacionamento","fr":"Commande du frein de stationnement","de":"Betätigung der Feststellbremse","ru":"Управление стояночным тормозом","ja":"駐車ブレーキ操作方式","es":"Accionamiento del freno de estacionamiento"},
  "Rear PTO type": {"tr":"Arka kuyruk mili tipi","zh":"后动力输出轴类型","hi":"पिछले पीटीओ का प्रकार","pt-br":"Tipo de TDP traseira","fr":"Type de prise de force arrière","de":"Art der Heckzapfwelle","ru":"Тип заднего ВОМ","ja":"後部PTO形式","es":"Tipo de TDF trasera"},
  "Maximum engine power rpm": {"tr":"Azami motor gücündeki devir","zh":"最大功率时发动机转速","hi":"अधिकतम इंजन शक्ति पर आरपीएम","pt-br":"Rotação do motor à potência máxima","fr":"Régime moteur à puissance maximale","de":"Motordrehzahl bei maximaler Leistung","ru":"Частота вращения двигателя при максимальной мощности","ja":"最高出力時のエンジン回転数","es":"Régimen del motor a potencia máxima"},
  "Nominal engine speed": {"tr":"Nominal motor devri","zh":"发动机标定转速","hi":"इंजन की निर्धारित गति","pt-br":"Rotação nominal do motor","fr":"Régime nominal du moteur","de":"Motornenndrehzahl","ru":"Номинальная частота вращения двигателя","ja":"エンジン定格回転数","es":"Régimen nominal del motor"},
  "Rear ballast": {"tr":"Arka balast","zh":"后部配重","hi":"पिछला बैलास्ट","pt-br":"Lastro traseiro","fr":"Lest arrière","de":"Heckballast","ru":"Задний балласт","ja":"後部バラスト","es":"Lastre trasero"},
  "Adjustable rear track width": {"tr":"Ayarlanabilir arka iz genişliği","zh":"可调后轮距","hi":"समायोज्य पिछली ट्रैक चौड़ाई","pt-br":"Bitola traseira ajustável","fr":"Voie arrière réglable","de":"Verstellbare hintere Spurweite","ru":"Регулируемая задняя колея","ja":"後輪トレッド調整範囲","es":"Ancho de vía trasero ajustable"},
  "Rear tyre option 1": {"tr":"Arka lastik seçeneği 1","zh":"后轮胎选项1","hi":"पिछला टायर विकल्प 1","pt-br":"Opção de pneu traseiro 1","fr":"Option de pneu arrière 1","de":"Hinterreifenoption 1","ru":"Вариант задних шин 1","ja":"後輪タイヤ選択肢1","es":"Opción de neumático trasero 1"},
  "Rear tyre size": {"tr":"Arka lastik ölçüsü","zh":"后轮胎规格","hi":"पिछले टायर का आकार","pt-br":"Medida do pneu traseiro","fr":"Dimension du pneu arrière","de":"Hinterreifengröße","ru":"Размер задних шин","ja":"後輪タイヤサイズ","es":"Medida del neumático trasero"},
  "Service brake system": {"tr":"Servis freni sistemi","zh":"行车制动系统","hi":"सर्विस ब्रेक प्रणाली","pt-br":"Sistema de freio de serviço","fr":"Système de freinage de service","de":"Betriebsbremssystem","ru":"Рабочая тормозная система","ja":"常用ブレーキシステム","es":"Sistema de freno de servicio"},
  "Standard transmission gearing": {"tr":"Standart şanzıman vites düzeni","zh":"标准变速箱挡位配置","hi":"मानक ट्रांसमिशन गियर विन्यास","pt-br":"Configuração de marchas da transmissão de série","fr":"Configuration des rapports de série","de":"Serienmäßige Gangkonfiguration","ru":"Штатная конфигурация передач","ja":"標準変速段構成","es":"Configuración de marchas de serie"},
  "Optional transmission gearing": {"tr":"Opsiyonel şanzıman vites düzeni","zh":"选装变速箱挡位配置","hi":"वैकल्पिक ट्रांसमिशन गियर विन्यास","pt-br":"Configuração opcional de marchas","fr":"Configuration optionnelle des rapports","de":"Optionale Gangkonfiguration","ru":"Опциональная конфигурация передач","ja":"オプション変速段構成","es":"Configuración opcional de marchas"},
  "Weight without additional ballast": {"tr":"Ek balastsız ağırlık","zh":"不含额外配重的质量","hi":"अतिरिक्त बैलास्ट के बिना वजन","pt-br":"Peso sem lastro adicional","fr":"Masse sans lest supplémentaire","de":"Gewicht ohne Zusatzballast","ru":"Масса без дополнительного балласта","ja":"追加バラストなしの重量","es":"Peso sin lastre adicional"},
  "Ground clearance range": {"tr":"Yerden yükseklik aralığı","zh":"离地间隙范围","hi":"ग्राउंड क्लियरेंस की सीमा","pt-br":"Faixa de vão livre do solo","fr":"Plage de garde au sol","de":"Bereich der Bodenfreiheit","ru":"Диапазон дорожного просвета","ja":"最低地上高の範囲","es":"Rango de altura libre al suelo"},
  "Rear hitch lifting capacity (point unspecified)": {"tr":"Arka askı kaldırma kapasitesi (ölçüm noktası belirtilmemiş)","zh":"后悬挂提升能力（测量点未注明）","hi":"पिछले हिच की उठाने की क्षमता (मापन बिंदु निर्दिष्ट नहीं)","pt-br":"Capacidade de elevação do engate traseiro (ponto de medição não indicado)","fr":"Capacité de relevage arrière (point de mesure non précisé)","de":"Heckhubkraft (Messpunkt nicht angegeben)","ru":"Подъёмная способность задней навески (точка измерения не указана)","ja":"後部ヒッチ揚力（測定点の記載なし）","es":"Capacidad de elevación del enganche trasero (punto de medición no indicado)"},
  "Rear track range": {"tr":"Arka iz genişliği aralığı","zh":"后轮距范围","hi":"पिछली ट्रैक चौड़ाई की सीमा","pt-br":"Faixa de bitola traseira","fr":"Plage de voie arrière","de":"Bereich der hinteren Spurweite","ru":"Диапазон задней колеи","ja":"後輪トレッド範囲","es":"Rango de ancho de vía trasero"}
};
export function oem20261122SpecLabel(name:string,locale:Locale):string|null {
  const exact=name.trim();
  const qualified=OEM_20261122_SPEC_LABELS[exact];
  if(!qualified)return null;
  // Preserve the exact manufacturer qualifier in English too: generic
  // canonical-key mappings otherwise reduce it to e.g. "PTO power".
  return locale==="en"?exact:(qualified[locale]||null);
}
