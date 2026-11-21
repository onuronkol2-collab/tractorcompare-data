import type { Locale } from "./locales.ts";
import { REVIEWED_PUBLIC_SPEC_HEADINGS } from "./reviewed-public-spec-headings.ts";
import { RESIDUAL_PUBLIC_SPEC_TERMS } from "./residual-public-spec-translations.ts";
import { LIVE_REVIEWED_SPEC_HEADINGS_20261121 } from "./live-reviewed-spec-headings-20261121.ts";

/**
 * Release-reviewed labels: an early 17-model proof, followed by the current
 * 379-model × 10-locale full static/public audit (2026-11-21).
 * Match the source's display name exactly after whitespace/case/underscore normalization.
 * These translations are ONLY for headings, never raw technical values, standards,
 * OEM variant names, measurements, manufacturer excerpts or model identities.
 * Missing languages keep the existing canonical technical glossary.
 */
export const PUBLISHED_SPEC_TERMS: Record<string, Partial<Record<Locale,string>>> = {
  // Last reviewed against 379-model live content audit; existing canonical entries still take precedence.
  ...REVIEWED_PUBLIC_SPEC_HEADINGS,
  "Engine Valves": {"tr": "Motor supap sayısı", "zh": "发动机气门数", "hi": "इंजन में वाल्वों की संख्या", "pt-br": "Número de válvulas do motor", "fr": "Nombre de soupapes du moteur", "de": "Anzahl der Motorventile", "ru": "Количество клапанов двигателя", "ja": "エンジンバルブ数", "es": "Número de válvulas del motor"},
  "Forward / reverse gears": {"tr": "İleri ve geri vites sayısı", "zh": "前进挡和倒挡数量", "hi": "आगे और पीछे के गियरों की संख्या", "pt-br": "Número de marchas à frente e à ré", "fr": "Nombre de rapports avant et arrière", "de": "Anzahl der Vorwärts- und Rückwärtsgänge", "ru": "Число передач переднего и заднего хода", "ja": "前進・後進の段数", "es": "Número de marchas hacia delante y atrás"},
  "Drivetrain": {"tr": "Güç aktarma sistemi", "zh": "动力传动系统", "hi": "ड्राइवट्रेन", "pt-br": "Sistema de transmissão de potência", "fr": "Chaîne cinématique", "de": "Antriebsstrang", "ru": "Силовая передача", "ja": "駆動系", "es": "Tren motriz"},
  "Rear lift capacity at hitch points": {"tr": "Arka askı bağlantı noktalarında kaldırma kapasitesi", "zh": "后悬挂挂接点提升能力", "hi": "पिछले हिच के जोड़ बिंदुओं पर उठाने की क्षमता", "pt-br": "Capacidade de elevação traseira nos pontos de engate", "fr": "Capacité de relevage arrière aux points d’attelage", "de": "Hubkraft an den hinteren Koppelpunkten", "ru": "Грузоподъёмность задней навески в точках присоединения", "ja": "後部ヒッチ取付点での揚力", "es": "Capacidad de elevación trasera en los puntos de enganche"},
  "Maximum engine power": {"tr": "Azami motor gücü", "zh": "发动机最大功率", "hi": "इंजन की अधिकतम शक्ति", "pt-br": "Potência máxima do motor", "fr": "Puissance maximale du moteur", "de": "Maximale Motorleistung", "ru": "Максимальная мощность двигателя", "ja": "エンジン最高出力", "es": "Potencia máxima del motor"},
  "Standard implement pump flow": {"tr": "Standart ekipman hidrolik pompası debisi", "zh": "标准农具液压泵流量", "hi": "मानक उपकरण हाइड्रोलिक पंप की प्रवाह दर", "pt-br": "Vazão da bomba hidráulica padrão dos implementos", "fr": "Débit de la pompe hydraulique standard des outils", "de": "Förderstrom der Standard-Arbeitshydraulikpumpe", "ru": "Подача штатного насоса гидравлики орудий", "ja": "標準仕様の作業機用油圧ポンプ流量", "es": "Caudal de la bomba hidráulica estándar para aperos"},
  "Standard steering pump flow": {"tr": "Standart direksiyon pompası debisi", "zh": "标准转向泵流量", "hi": "मानक स्टीयरिंग पंप की प्रवाह दर", "pt-br": "Vazão da bomba de direção padrão", "fr": "Débit de la pompe de direction standard", "de": "Förderstrom der Standard-Lenkpumpe", "ru": "Подача штатного насоса рулевого управления", "ja": "標準仕様のステアリングポンプ流量", "es": "Caudal de la bomba de dirección estándar"},
  "Shipping weight": {"tr": "Sevkiyat ağırlığı", "zh": "运输重量", "hi": "शिपिंग के समय वजन", "pt-br": "Peso de embarque", "fr": "Masse à l’expédition", "de": "Versandgewicht", "ru": "Масса при отгрузке", "ja": "出荷時重量", "es": "Peso de expedición"},
  "Hydraulic pump flow": {"tr": "Hidrolik pompa debisi", "zh": "液压泵流量", "hi": "हाइड्रोलिक पंप की प्रवाह दर", "pt-br": "Vazão da bomba hidráulica", "fr": "Débit de la pompe hydraulique", "de": "Förderstrom der Hydraulikpumpe", "ru": "Подача гидравлического насоса", "ja": "油圧ポンプ流量", "es": "Caudal de la bomba hidráulica"},
  "Maximum hydraulic pressure": {"tr": "Azami hidrolik basınç", "zh": "最大液压压力", "hi": "अधिकतम हाइड्रोलिक दबाव", "pt-br": "Pressão hidráulica máxima", "fr": "Pression hydraulique maximale", "de": "Maximaler Hydraulikdruck", "ru": "Максимальное давление в гидросистеме", "ja": "最高油圧", "es": "Presión hidráulica máxima"},
  "Maximum engine power without boost": {"tr": "Güç artırımı olmadan azami motor gücü", "zh": "未启用功率提升时的发动机最大功率", "hi": "पावर बूस्ट के बिना इंजन की अधिकतम शक्ति", "pt-br": "Potência máxima do motor sem potência adicional", "fr": "Puissance maximale du moteur sans surpuissance", "de": "Maximale Motorleistung ohne Boost", "ru": "Максимальная мощность двигателя без режима повышения мощности", "ja": "ブーストなしのエンジン最高出力", "es": "Potencia máxima del motor sin potencia adicional"},
  "Maximum engine power ISO TR 14396": {"tr": "ISO TR 14396’ya göre azami motor gücü", "zh": "按 ISO TR 14396 测定的发动机最大功率", "hi": "ISO TR 14396 के अनुसार इंजन की अधिकतम शक्ति", "pt-br": "Potência máxima do motor segundo ISO TR 14396", "fr": "Puissance maximale du moteur selon ISO TR 14396", "de": "Maximale Motorleistung nach ISO TR 14396", "ru": "Максимальная мощность двигателя по ISO TR 14396", "ja": "ISO TR 14396 に基づくエンジン最高出力", "es": "Potencia máxima del motor según ISO TR 14396"},
  // Exact source headings: OEM range/category figures never become a model's tested rated power.
  "Manufacturer advertised metric power (cv; test standard not independently established by the product page)": {"tr":"Üreticinin tanıttığı güç (cv; ölçüm standardı bu ürün sayfasında doğrulanmıyor)","zh":"制造商宣传的功率（公制马力 cv；该产品页面未证实测试标准）","hi":"निर्माता द्वारा विज्ञापित शक्ति (cv; इस उत्पाद पृष्ठ पर परीक्षण मानक की स्वतंत्र पुष्टि नहीं)","pt-br":"Potência anunciada pelo fabricante (cv; norma de ensaio não comprovada nesta página)","fr":"Puissance annoncée par le constructeur (ch métriques, cv ; norme d’essai non confirmée sur cette page)","de":"Vom Hersteller beworbene Leistung (metrische PS, cv; Prüfnorm auf dieser Produktseite nicht bestätigt)","ru":"Заявленная производителем мощность (метрические л. с., cv; стандарт испытаний на этой странице не подтверждён)","ja":"メーカー公称出力（メートル馬力 cv；この製品ページでは試験規格を確認できない）","es":"Potencia anunciada por el fabricante (cv; norma de ensayo no confirmada en esta página)"},
  "Manufacturer power class (not rated engine output)": {"tr":"Üretici güç sınıfı (nominal motor gücü değil)","zh":"制造商功率级别（非发动机额定输出）","hi":"निर्माता की शक्ति श्रेणी (इंजन की निर्धारित शक्ति नहीं)","pt-br":"Classe de potência do fabricante (não é potência nominal do motor)","fr":"Classe de puissance du constructeur (pas la puissance nominale du moteur)","de":"Leistungsklasse des Herstellers (nicht die Motornennleistung)","ru":"Класс мощности производителя (не номинальная мощность двигателя)","ja":"メーカー公称出力区分（エンジン定格出力ではない）","es":"Clase de potencia del fabricante (no es la potencia nominal del motor)"},
  "Maximum manufacturer engine power": {"tr":"Üreticinin belirttiği azami motor gücü","zh":"制造商公布的发动机最大功率","hi":"निर्माता द्वारा बताई अधिकतम इंजन शक्ति","pt-br":"Potência máxima do motor declarada pelo fabricante","fr":"Puissance maximale du moteur déclarée par le constructeur","de":"Maximale Motorleistung laut Hersteller","ru":"Максимальная мощность двигателя по данным производителя","ja":"メーカー公表のエンジン最高出力","es":"Potencia máxima del motor declarada por el fabricante"},
  "Manufacturer power category (not rated engine HP)": {"tr":"Üretici güç kategorisi (nominal motor HP değeri değil)","zh":"制造商功率类别（非发动机额定马力）","hi":"निर्माता की शक्ति श्रेणी (इंजन की निर्धारित HP नहीं)","pt-br":"Categoria de potência do fabricante (não é potência nominal do motor em HP)","fr":"Catégorie de puissance du constructeur (pas la puissance nominale du moteur en HP)","de":"Leistungskategorie des Herstellers (nicht die Motor-Nennleistung in HP)","ru":"Категория мощности производителя (не номинальная мощность двигателя в HP)","ja":"メーカー出力区分（エンジン定格馬力ではない）","es":"Categoría de potencia del fabricante (no es potencia nominal del motor en HP)"},
  "Maximum ECE R120 power (rounded, HP)": {"tr":"ECE R120 standardına göre azami güç (yuvarlanmış, HP)","zh":"ECE R120 标准最大功率（已取整，HP）","hi":"ECE R120 के अनुसार अधिकतम शक्ति (पूर्णांकित, HP)","pt-br":"Potência máxima segundo ECE R120 (arredondada, HP)","fr":"Puissance maximale selon ECE R120 (arrondie, HP)","de":"Maximalleistung nach ECE R120 (gerundet, HP)","ru":"Максимальная мощность по ECE R120 (округлённая, HP)","ja":"ECE R120に基づく最大出力（四捨五入、HP）","es":"Potencia máxima según ECE R120 (redondeada, HP)"},
  "Manufacturer power class (not exact rated HP)": {"tr":"Üretici güç sınıfı (kesin nominal HP değeri değil)","zh":"制造商功率级别（非精确额定马力）","hi":"निर्माता की शक्ति श्रेणी (सटीक रेटेड HP नहीं)","pt-br":"Classe de potência do fabricante (não é valor nominal exato em HP)","fr":"Classe de puissance du constructeur (pas une valeur nominale exacte en HP)","de":"Leistungsklasse des Herstellers (kein exakter Nennleistungswert in HP)","ru":"Класс мощности производителя (не точное номинальное значение HP)","ja":"メーカー出力区分（正確な定格馬力値ではない）","es":"Clase de potencia del fabricante (no es un valor nominal exacto en HP)"},
  "Series advertised maximum (rounded; not model-specific)": {"tr":"Seri için ilan edilen azami değer (yuvarlanmış; modele özgü değil)","zh":"系列宣传的最大值（取整；非具体型号数据）","hi":"श्रृंखला के लिए घोषित अधिकतम मान (पूर्णांकित; किसी एक मॉडल का नहीं)","pt-br":"Máximo anunciado para a série (arredondado; não específico de um modelo)","fr":"Maximum annoncé pour la gamme (arrondi ; non propre à un modèle)","de":"Beworbener Höchstwert der Baureihe (gerundet; nicht modellspezifisch)","ru":"Заявленный максимум серии (округлён; не относится к конкретной модели)","ja":"シリーズ全体の公称最大値（丸め値・個別モデルの値ではない）","es":"Máximo anunciado para la serie (redondeado; no específico de un modelo)"},
  "YT3 marketing maximum power class (HP)": {"tr":"YT3 serisinin pazarlama amaçlı azami güç sınıfı (HP)","zh":"YT3 系列营销标称的最高功率级别（HP）","hi":"YT3 श्रृंखला की प्रचारित अधिकतम शक्ति श्रेणी (HP)","pt-br":"Classe de potência máxima anunciada para a série YT3 (HP)","fr":"Classe de puissance maximale annoncée pour la série YT3 (HP)","de":"Beworbene maximale Leistungsklasse der YT3-Baureihe (HP)","ru":"Рекламируемый максимальный класс мощности серии YT3 (HP)","ja":"YT3シリーズの宣伝上の最大出力区分（HP）","es":"Clase de potencia máxima anunciada para la serie YT3 (HP)"},
  "3-point hitch category": {tr:"Üç nokta askı sistemi kategorisi"},
  "Alternator": {tr:"Alternatör"},
  "Alternator output current": {tr:"Alternatör çıkış akımı"},
  "Alternator voltage": {tr:"Alternatör gerilimi"},
  "Battery": {tr:"Akü"},
  "Battery voltage": {tr:"Akü gerilimi"},
  "Clutch control": {tr:"Debriyaj kumandası"},
  "Clutch type": {tr:"Debriyaj tipi"},
  "Differential lock": {tr:"Diferansiyel kilidi"},
  "Draft control": {tr:"Çeki kuvveti kontrolü"},
  "Engine": {tr:"Motor"},
  "Engine cooling system": {tr:"Motor soğutma sistemi"},
  "Engine fuel type": {tr:"Motor yakıt türü"},
  "Engine make": {tr:"Motor markası"},
  "Engine power (kW)": {tr:"Motor gücü (kW)"},
  "Front axle": {tr:"Ön aks"},
  "Front work lights count": {tr:"Ön çalışma lambası sayısı"},
  "Hydraulic pump count": {tr:"Hidrolik pompa sayısı"},
  "Hydraulic system type": {tr:"Hidrolik sistem tipi"},
  "Main hydraulic flow": {tr:"Ana hidrolik devre debisi"},
  "Maximum speed": {tr:"Azami hız"},
  "Maximum torque (manufacturer original unit)": {tr:"Azami tork (üreticinin verdiği birim)"},
  "Mechanical top link category": {tr:"Mekanik üst bağlantı kolu kategorisi"},
  "PTO engagement": {tr:"Kuyruk mili kavrama kumandası"},
  "PTO nominal speed": {tr:"Nominal kuyruk mili devri"},
  "Rear braking system": {tr:"Arka fren sistemi"},
  "Rear hydraulic spool valve count": {tr:"Arka hidrolik kumanda valfi sayısı"},
  "Rear hydraulic spool valve type": {tr:"Arka hidrolik kumanda valfi tipi"},
  "Rear lifting system type": {tr:"Arka kaldırma sistemi tipi"},
  "Rear-view mirrors": {tr:"Dikiz aynaları"},
  "Roll-over protection structure": {tr:"Devrilmeye karşı koruyucu yapı (ROPS)"},
  "Safety equipment": {tr:"Güvenlik donanımı"},
  "Seat adjustment": {tr:"Koltuk ayarı"},
  "Seat belt equipment": {tr:"Emniyet kemeri donanımı"},
  "Steering type": {tr:"Direksiyon sistemi tipi"},
  "Tow hook": {tr:"Çeki kancası"},
  "Transmission": {tr:"Şanzıman"},
  "Transmission control": {tr:"Şanzıman kumandası"},
  "Transmission clutch type": {tr:"Şanzıman debriyaj tipi"},
  "Brakes": {tr:"Frenler"},
  "Foot brake control": {tr:"Ayak freni kumandası"},
  "Parking brake control": {tr:"Park freni kumandası"},
  "Front track maximum": {tr:"Azami ön iz genişliği"},
  "Front track minimum": {tr:"Asgari ön iz genişliği"},
  "Rear track maximum": {tr:"Azami arka iz genişliği"},
  "Rear track minimum": {tr:"Asgari arka iz genişliği"},
  "Total length including front weights": {tr:"Ön ağırlıklar dahil toplam uzunluk"},
  "Hydraulic control": {tr:"Hidrolik kumanda"},
  "PTO clutch actuation": {tr:"Kuyruk mili kavramasının kumanda biçimi"},
  "PTO drive type": {tr:"Kuyruk mili tahrik tipi"},
  "Front ballast arrangement": {tr:"Ön ek ağırlık düzeni"},
  "Rear ballast arrangement": {tr:"Arka ek ağırlık düzeni"},
  "Front tyre options": {tr:"Ön lastik seçenekleri"},
  "Rear tyre options": {tr:"Arka lastik seçenekleri"},
  "Three-point linkage category": {tr:"Üç nokta askı sistemi kategorisi"},
  "Minimum turning radius": {tr:"Asgari dönüş yarıçapı"},
  "Operating weight with ballast": {tr:"Ek ağırlıkla çalışma ağırlığı"},
  "Weight without ballast": {tr:"Ek ağırlıksız ağırlık"},
  "Drive arrangement": {tr:"Tahrik düzeni"},
  "Fuel type": {tr:"Yakıt türü"},
  "Specific fuel consumption": {tr:"Özgül yakıt tüketimi"},
  "Maximum forward speed": {tr:"Azami ileri hız"},
  "Maximum reverse speed": {tr:"Azami geri hız"},
  "Minimum forward speed": {tr:"Asgari ileri hız"},
  "Minimum reverse speed": {tr:"Asgari geri hız"},
  "Rated power": {tr:"Nominal güç"},
  "Engine manufacturer": {tr:"Motor üreticisi"},
  "Front Axle Capacity": {"pt-br":"Capacidade do eixo dianteiro",es:"Capacidad del eje delantero"},
  "Rear Lift Capacity At 24 Inches Behind Link Ends": {"pt-br":"Capacidade de elevação traseira a 24 polegadas atrás das extremidades dos braços",es:"Capacidad de elevación trasera a 24 pulgadas detrás de los extremos de los brazos"},
  "Gross Vehicle Weight": {zh:"车辆总质量","pt-br":"Peso bruto do veículo",fr:"Poids total autorisé du véhicule",es:"Peso bruto del vehículo"},
  "Wheelbase": {zh:"轴距","pt-br":"Distância entre eixos",fr:"Empattement",es:"Distancia entre ejes"},
  "Fuel Tank Capacity": {"pt-br":"Capacidade do tanque de combustível",fr:"Capacité du réservoir de carburant",de:"Kraftstofftankvolumen",es:"Capacidad del depósito de combustible"},
  "AdBlue/DEF Tank Capacity": {"pt-br":"Capacidade do tanque de AdBlue/DEF",fr:"Capacité du réservoir AdBlue/DEF",de:"AdBlue-/DEF-Tankvolumen",es:"Capacidad del depósito de AdBlue/DEF"},
  "Rear Differential Lock": {tr:"Arka diferansiyel kilidi","pt-br":"Bloqueio do diferencial traseiro",fr:"Blocage de différentiel arrière",es:"Bloqueo del diferencial trasero"},
  "Traction Type": {"pt-br":"Tipo de tração",fr:"Type de transmission aux roues",es:"Tipo de tracción"},
  "Front Differential Lock": {tr:"Ön diferansiyel kilidi","pt-br":"Bloqueio do diferencial dianteiro",fr:"Blocage de différentiel avant",es:"Bloqueo del diferencial delantero"},
  "Standard Gearbox": {tr:"Standart şanzıman","pt-br":"Caixa de câmbio padrão",fr:"Boîte de vitesses de série",es:"Caja de cambios estándar"},
  "Shipping Weight Average Configuration": {zh:"平均配置运输重量","pt-br":"Peso de transporte da configuração média",fr:"Poids d'expédition en configuration moyenne",es:"Peso de envío en configuración media"},
  "Engine Cylinders": {tr:"Motor silindir sayısı",zh:"发动机气缸数",hi:"इंजन सिलेंडरों की संख्या",ja:"エンジン気筒数"},
  "Engine Displacement": {tr:"Motor hacmi",zh:"发动机排量",hi:"इंजन विस्थापन",ja:"エンジン排気量"},
  "Rated Engine Speed": {tr:"Nominal motor devri",zh:"发动机额定转速",hi:"इंजन की निर्धारित गति",ja:"エンジン定格回転数"},
  "Dynamic RoboShift Transmission Option": {tr:"Dynamic RoboShift şanzıman seçeneği","pt-br":"Opção de transmissão Dynamic RoboShift",fr:"Option de transmission Dynamic RoboShift",es:"Opción de transmisión Dynamic RoboShift"},
  "Efficient Standard Transmission": {tr:"Efficient standart şanzıman","pt-br":"Transmissão de série Efficient",fr:"Transmission de série Efficient",es:"Transmisión de serie Efficient"},
  "Premium HML Option": {tr:"Premium HML seçeneği","pt-br":"Opção Premium HML",fr:"Option Premium HML",es:"Opción Premium HML"},
  "Premium Standard Transmission": {tr:"Premium standart şanzıman","pt-br":"Transmissão de série Premium",fr:"Transmission de série Premium",es:"Transmisión de serie Premium"},
  "Agrotechnical Clearance Under Rear Axle Sleeves": {
    tr:"Arka aks kovanları altında tarımsal açıklık",
    hi:"पिछले एक्सल स्लीव के नीचे कृषि कार्य हेतु निकासी",
    "pt-br":"Vão livre agrícola sob as mangas do eixo traseiro",
    fr:"Garde au sol agricole sous les manchons de l'essieu arrière",
    ru:"Агротехнический просвет под рукавами заднего моста",
    es:"Despeje agrotécnico bajo las carcasas del eje trasero",
  },
  "Factory Shipping Weight": {
    tr:"Fabrika çıkışı sevkiyat ağırlığı",hi:"कारखाने से भेजे जाने का वज़न",
    "pt-br":"Peso de expedição de fábrica",fr:"Poids d'expédition d'usine",
    ru:"Заводская отгрузочная масса",es:"Peso de expedición de fábrica",
  },
  "Maximum Permissible Operating Mass": {
    tr:"İzin verilen azami çalışma kütlesi",hi:"अधिकतम अनुमत परिचालन द्रव्यमान",
    "pt-br":"Massa operacional máxima permitida",fr:"Masse maximale autorisée en service",
    ru:"Максимально допустимая эксплуатационная масса",es:"Masa máxima admisible en servicio",
  },
  "Operating Weight With Ballast Nominal": {
    tr:"Balastlı nominal çalışma ağırlığı",hi:"गिट्टी सहित नाममात्र परिचालन वज़न",
    "pt-br":"Peso operacional nominal com lastro",fr:"Masse en service nominale avec lest",
    ru:"Номинальная эксплуатационная масса с балластом",es:"Peso operativo nominal con lastre",
  },
  "Structural Weight Nominal": {
    tr:"Nominal yapısal ağırlık",hi:"नाममात्र संरचनात्मक वज़न",
    "pt-br":"Peso estrutural nominal",fr:"Masse structurelle nominale",
    ru:"Номинальная конструкционная масса",es:"Peso estructural nominal",
  },
  "Turning Radius With Inner Wheel Braking": {
    tr:"İç teker frenlemesiyle dönüş yarıçapı",hi:"अंदरूनी पहिए के ब्रेक के साथ मोड़ की त्रिज्या",
    "pt-br":"Raio de giro com frenagem da roda interna",fr:"Rayon de braquage avec freinage de la roue intérieure",
    ru:"Радиус поворота с торможением внутреннего колеса",es:"Radio de giro con frenado de la rueda interior",
  },
  "Wheelbase Nominal": {
    tr:"Nominal dingil mesafesi",hi:"नाममात्र व्हीलबेस",
    "pt-br":"Distância nominal entre eixos",fr:"Empattement nominal",
    ru:"Номинальная колёсная база",es:"Distancia nominal entre ejes",
  },
  "Shipping Weight Measured Average Specification": {
    zh:"实测平均配置运输重量","pt-br":"Peso de expedição medido na configuração média",
    fr:"Poids d'expédition mesuré en configuration moyenne",es:"Peso de envío medido en configuración media",
  },
  "Rear PTO Standard Speeds": {"pt-br":"Rotações padrão da TDP traseira",fr:"Régimes standard de la prise de force arrière",es:"Velocidades estándar de la TDF trasera"},
  "Cooling System Capacity": {"pt-br":"Capacidade do sistema de arrefecimento",fr:"Capacité du circuit de refroidissement",de:"Kühlsystem-Füllmenge",es:"Capacidad del sistema de refrigeración"},
  "Engine Maintenance Interval": {zh:"发动机保养间隔",ja:"エンジン整備間隔"},
  "Engine Torque Backup": {zh:"发动机扭矩储备",ja:"エンジントルク余裕率"},
  "Exhaust Aftertreatment": {zh:"排气后处理系统",ja:"排気後処理装置"},
  "Fuel Injection": {zh:"燃油喷射",ja:"燃料噴射方式"},
  "Maximum Engine Torque At 1400 Rpm": {zh:"发动机在1400 rpm时的最大扭矩",ja:"1400 rpm時のエンジン最大トルク"},
  "Rated Engine Power ISO TR 14396": {zh:"发动机额定功率（ISO/TR 14396）",ja:"エンジン定格出力（ISO/TR 14396）"},
  "Cab Filtration Category": {"pt-br":"Categoria de filtragem da cabine",fr:"Catégorie de filtration de la cabine",es:"Categoría de filtración de la cabina"},
  "Rear PTO EFFICIENT Standard": {"pt-br":"TDP traseira de série EFFICIENT",fr:"Prise de force arrière de série EFFICIENT",es:"TDF trasera de serie EFFICIENT"},
  "Rear PTO PREMIUM Standard": {"pt-br":"TDP traseira de série PREMIUM",fr:"Prise de force arrière de série PREMIUM",es:"TDF trasera de serie PREMIUM"},
  "Transmission Gear Configuration": {tr:"Şanzıman vites düzeni"},
  "Forward Gear Count": {tr:"İleri vites sayısı","pt-br":"Número de marchas à frente",fr:"Nombre de rapports avant",es:"Número de marchas hacia adelante"},
  "Maximum Calculated Forward Speed": {tr:"Hesaplanan azami ileri hız","pt-br":"Velocidade máxima calculada à frente",fr:"Vitesse maximale calculée en marche avant",es:"Velocidad máxima calculada hacia adelante"},
  "Reverse Gear Count": {tr:"Geri vites sayısı","pt-br":"Número de marchas à ré",fr:"Nombre de rapports arrière",es:"Número de marchas atrás"},
  "Emissions Stage": {zh:"排放阶段",ja:"排出ガス規制段階"},
  "Engine Speed At Maximum Power": {zh:"最大出力時のエンジン回転数",ja:"最高出力時エンジン回転数"},
  "Drive Type": {tr:"Tahrik tipi","pt-br":"Tipo de tração",fr:"Type de transmission aux roues",es:"Tipo de tracción"},
  "Front Axle Configuration": {tr:"Ön aks düzeni","pt-br":"Configuração do eixo dianteiro",fr:"Configuration de l'essieu avant",es:"Configuración del eje delantero"},
  "GOST Traction Class": {"pt-br":"Classe de tração GOST",fr:"Classe de traction GOST",es:"Clase de tracción GOST"},
  "On-Board Electrical System Voltage": {"pt-br":"Tensão do sistema elétrico de bordo",fr:"Tension du circuit électrique de bord",es:"Tensión del sistema eléctrico de a bordo"},
  "Rated Drawbar Force": {"pt-br":"Força nominal de tração na barra",fr:"Effort nominal à la barre de traction",es:"Fuerza nominal de tiro en barra"},
  "Emission Stage": {zh:"排放阶段",ja:"排出ガス規制段階"},
  "Engine Speed At Max Power": {zh:"最大功率时发动机转速",ja:"最高出力時エンジン回転数"},
  "Front Differential Lock Standard": {"pt-br":"Bloqueio do diferencial dianteiro de série",fr:"Blocage de différentiel avant de série",es:"Bloqueo del diferencial delantero de serie"},
  "Factory Base Front Tire": {tr:"Fabrika standart ön lastiği"},
  "Factory Base Rear Tire": {tr:"Fabrika standart arka lastiği"},
  "Transmission And Hydraulic System Capacity": {tr:"Şanzıman ve hidrolik sistem kapasitesi"},
  "Maximum Engine Torque": {tr:"Azami motor torku",hi:"अधिकतम इंजन टॉर्क"},
  "Rated Engine Power": {tr:"Nominal motor gücü",hi:"इंजन की निर्धारित शक्ति"},
  "Torque Reserve": {tr:"Tork rezervi",hi:"टॉर्क रिज़र्व"},
  "Overall Width": {tr:"Toplam genişlik"},
  "R1 Agricultural Tire - Front": {tr:"R1 tarım lastiği – ön"},
  "Rear Tire Size": {tr:"Arka lastik ölçüsü"},
  "Weight With ROPS": {tr:"ROPS koruma çerçevesiyle ağırlık"},
};

function normalizeSpecName(name:string): string {
  return name.trim().replace(/_/g," ").replace(/\s+/g," ").toLocaleLowerCase("en");
}
const NORMALIZED_TRANSLATIONS=new Map(
  Object.entries(PUBLISHED_SPEC_TERMS).map(([name,translations]) => [normalizeSpecName(name),translations]),
);
const NORMALIZED_RESIDUAL=new Map(
  Object.entries(RESIDUAL_PUBLIC_SPEC_TERMS).map(([name,translations]) => [normalizeSpecName(name),translations]),
);
const NORMALIZED_LIVE_REVIEWED=new Map(
  Object.entries(LIVE_REVIEWED_SPEC_HEADINGS_20261121).map(([name,translations]) => [normalizeSpecName(name),translations]),
);
/**
 * True only for reviewed, exact original source headings. Use ahead of generic
 * canonical-key mappings when a source explicitly carries a condition such as
 * ECE R120, equipment level, weight status or tractor gear variant.
 */
export function auditedResidualSpecificationLabel(specName:string,lang:Locale):string|null{
  if(lang==="en")return null;
  const key=normalizeSpecName(specName);
  return NORMALIZED_RESIDUAL.get(key)?.[lang] || NORMALIZED_LIVE_REVIEWED.get(key)?.[lang] || null;
}
export function publishedSpecificationLabel(specName:string,lang:Locale):string|null{
  if(lang==="en")return null;
  const normalized=normalizeSpecName(specName);
  return NORMALIZED_TRANSLATIONS.get(normalized)?.[lang]
    || NORMALIZED_RESIDUAL.get(normalized)?.[lang]
    || NORMALIZED_LIVE_REVIEWED.get(normalized)?.[lang]
    || null;
}
export function validatePublishedSpecTranslations():void {
  for (const [name,entries] of [
    ...Object.entries(PUBLISHED_SPEC_TERMS),
    ...Object.entries(RESIDUAL_PUBLIC_SPEC_TERMS),
    ...Object.entries(LIVE_REVIEWED_SPEC_HEADINGS_20261121),
  ]){
    if (!name.trim() || !Object.keys(entries).length) throw new Error("Missing term "+name);
    for (const [locale,text] of Object.entries(entries)){
      if (!text.trim() || locale==="en" || text.trim().toLowerCase()===name.toLowerCase())
        throw new Error("Invalid localized technical label "+name+" "+locale);
    }
  }
}
