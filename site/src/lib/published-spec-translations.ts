import type { Locale } from "./locales.ts";

/**
 * Audited against the 170 public tractor detail pages (17 models x 10 languages).
 * Match the source's display name exactly after whitespace/case/underscore normalization.
 * These translations are ONLY for headings, never raw technical values, standards,
 * OEM variant names, measurements, manufacturer excerpts or model identities.
 * Missing languages keep the existing canonical technical glossary.
 */
export const PUBLISHED_SPEC_TERMS: Record<string, Partial<Record<Locale,string>>> = {
  "Gross Vehicle Weight": {zh:"车辆总质量","pt-br":"Peso bruto do veículo",fr:"Poids total autorisé du véhicule",es:"Peso bruto del vehículo"},
  "Wheelbase": {zh:"轴距","pt-br":"Distância entre eixos",fr:"Empattement",es:"Distancia entre ejes"},
  "Fuel Tank Capacity": {"pt-br":"Capacidade do tanque de combustível",fr:"Capacité du réservoir de carburant",de:"Kraftstofftankvolumen",es:"Capacidad del depósito de combustible"},
  "AdBlue/DEF Tank Capacity": {"pt-br":"Capacidade do tanque de AdBlue/DEF",fr:"Capacité du réservoir AdBlue/DEF",de:"AdBlue-/DEF-Tankvolumen",es:"Capacidad del depósito de AdBlue/DEF"},
  "Rear Differential Lock": {"pt-br":"Bloqueio do diferencial traseiro",fr:"Blocage de différentiel arrière",es:"Bloqueo del diferencial trasero"},
  "Traction Type": {"pt-br":"Tipo de tração",fr:"Type de transmission aux roues",es:"Tipo de tracción"},
  "Front Differential Lock": {"pt-br":"Bloqueio do diferencial dianteiro",fr:"Blocage de différentiel avant",es:"Bloqueo del diferencial delantero"},
  "Standard Gearbox": {tr:"Standart şanzıman","pt-br":"Caixa de câmbio padrão",fr:"Boîte de vitesses de série",es:"Caja de cambios estándar"},
  "Shipping Weight Average Configuration": {zh:"平均配置运输重量","pt-br":"Peso de transporte da configuração média",fr:"Poids d'expédition en configuration moyenne",es:"Peso de envío en configuración media"},
  "Engine Cylinders": {zh:"发动机气缸数",hi:"इंजन सिलेंडरों की संख्या",ja:"エンジン気筒数"},
  "Engine Displacement": {zh:"发动机排量",hi:"इंजन विस्थापन",ja:"エンジン排気量"},
  "Rated Engine Speed": {zh:"发动机额定转速",hi:"इंजन की निर्धारित गति",ja:"エンジン定格回転数"},
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
  "Engine Valves": {zh:"发动机气门数",ja:"エンジンバルブ数"},
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
  "Drive Type": {"pt-br":"Tipo de tração",fr:"Type de transmission aux roues",es:"Tipo de tracción"},
  "Front Axle Configuration": {"pt-br":"Configuração do eixo dianteiro",fr:"Configuration de l'essieu avant",es:"Configuración del eje delantero"},
  "GOST Traction Class": {"pt-br":"Classe de tração GOST",fr:"Classe de traction GOST",es:"Clase de tracción GOST"},
  "On-Board Electrical System Voltage": {"pt-br":"Tensão do sistema elétrico de bordo",fr:"Tension du circuit électrique de bord",es:"Tensión del sistema eléctrico de a bordo"},
  "Rated Drawbar Force": {"pt-br":"Força nominal de tração na barra",fr:"Effort nominal à la barre de traction",es:"Fuerza nominal de tiro en barra"},
  "Emission Stage": {zh:"排放阶段",ja:"排出ガス規制段階"},
  "Engine Speed At Max Power": {zh:"最大功率时发动机转速",ja:"最高出力時エンジン回転数"},
  "Front Differential Lock Standard": {"pt-br":"Bloqueio do diferencial dianteiro de série",fr:"Blocage de différentiel avant de série",es:"Bloqueo del diferencial delantero de serie"},
  "Factory Base Front Tire": {tr:"Fabrika standart ön lastiği"},
  "Factory Base Rear Tire": {tr:"Fabrika standart arka lastiği"},
  "Transmission And Hydraulic System Capacity": {tr:"Şanzıman ve hidrolik sistem kapasitesi"},
  "Maximum Engine Torque": {hi:"अधिकतम इंजन टॉर्क"},
  "Rated Engine Power": {hi:"इंजन की निर्धारित शक्ति"},
  "Torque Reserve": {hi:"टॉर्क रिज़र्व"},
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
export function publishedSpecificationLabel(specName:string,lang:Locale):string|null{
  if(lang==="en")return null;
  return NORMALIZED_TRANSLATIONS.get(normalizeSpecName(specName))?.[lang]||null;
}
export function validatePublishedSpecTranslations():void {
  for (const [name,entries] of Object.entries(PUBLISHED_SPEC_TERMS)){
    if (!name.trim() || !Object.keys(entries).length) throw new Error("Missing term "+name);
    for (const [locale,text] of Object.entries(entries)){
      if (!text.trim() || locale==="en" || text.trim().toLowerCase()===name.toLowerCase())
        throw new Error("Invalid localized technical label "+name+" "+locale);
    }
  }
}
