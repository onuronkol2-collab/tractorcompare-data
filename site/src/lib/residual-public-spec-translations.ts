import type { Locale } from "./locales.ts";

/**
 * Public, exact-source-heading display translations. The original technical
 * values, standard, equipment variant, model and citations are NEVER altered.
 * 80 distinct Turkish residual headings were reconciled against the 379-model
 * live public-content audit of 2026-11-21 (101 total appearances).
 * Glossary terms can contain verified model-specific qualifiers; never collapse
 * manufacturer-stated power to a measured/rated value, or swap 2WD with 4WD.
 */
export const RESIDUAL_PUBLIC_SPEC_TERMS: Record<string, Partial<Record<Locale,string>>> = {
  "Clutch": {
    "tr": "Debriyaj",
    "pt-br": "Embreagem",
    "fr": "Embrayage",
    "es": "Embrague"
  },
  "Clutch (Exact Listed Mahabali RX 2WD/4WD Trims)": {
    "tr": "Debriyaj (listelenen Mahabali RX 2WD/4WD donanımları)"
  },
  "Cylinder Bore": {
    "tr": "Silindir çapı",
    "pt-br": "Diâmetro do cilindro",
    "fr": "Alésage du cylindre",
    "es": "Diámetro del cilindro",
    "ru": "Диаметр цилиндра"
  },
  "Engine Cooling": {
    "tr": "Motor soğutma sistemi",
    "pt-br": "Arrefecimento do motor",
    "fr": "Refroidissement du moteur",
    "es": "Refrigeración del motor",
    "hi": "इंजन शीतलन",
    "ru": "Охлаждение двигателя"
  },
  "Four-Wheel-Drive Engagement": {
    "tr": "Dört çekerin (4WD) devreye alınması"
  },
  "Front Agricultural Tires": {
    "tr": "Ön tarım lastikleri",
    "pt-br": "Pneus agrícolas dianteiros",
    "fr": "Pneus agricoles avant",
    "es": "Neumáticos agrícolas delanteros"
  },
  "Front Tire Size": {
    "tr": "Ön lastik ölçüsü",
    "pt-br": "Dimensão do pneu dianteiro",
    "fr": "Dimension du pneu avant",
    "es": "Medida del neumático delantero"
  },
  "Gear Count": {
    "tr": "Vites sayısı",
    "pt-br": "Número de marchas",
    "fr": "Nombre de rapports",
    "es": "Número de marchas"
  },
  "Hydrostatic Transmission Ranges": {
    "tr": "Hidrostatik şanzıman hız aralıkları"
  },
  "Max Speed": {
    "tr": "Azami hız"
  },
  "Maximum Speed (Brochure, Tyre-Dependent) - Mechanical": {
    "tr": "Azami hız (broşüre göre, lastiğe bağlı) – mekanik"
  },
  "Maximum Speed (Brochure, Tyre-Dependent) - Powershuttle": {
    "tr": "Azami hız (broşüre göre, lastiğe bağlı) – PowerShuttle"
  },
  "Number Of Speeds - 5 Gears Transmission - Mechanical Shuttle": {
    "tr": "Vites sayısı – 5 vitesli şanzıman, mekanik ileri-geri yön değiştirici"
  },
  "Number Of Speeds - 5 Gears Transmission - Powershuttle": {
    "tr": "Vites sayısı – 5 vitesli şanzıman, PowerShuttle"
  },
  "Operating Weight With ROPS": {
    "tr": "ROPS ile çalışma ağırlığı"
  },
  "Piston Stroke": {
    "tr": "Piston strok uzunluğu",
    "pt-br": "Curso do pistão",
    "fr": "Course du piston",
    "es": "Carrera del pistón",
    "ru": "Ход поршня"
  },
  "Rear Agricultural Tires": {
    "tr": "Arka tarım lastikleri",
    "pt-br": "Pneus agrícolas traseiros",
    "fr": "Pneus agricoles arrière",
    "es": "Neumáticos agrícolas traseros"
  },
  "Robotic Transmission Ranges": {
    "tr": "Robotize şanzıman hız aralıkları",
    "pt-br": "Gamas da transmissão robotizada",
    "fr": "Gammes de la transmission robotisée",
    "es": "Gamas de la transmisión robotizada",
    "ja": "ロボット式変速機のレンジ"
  },
  "Total Admissible Load": {
    "tr": "İzin verilen toplam yük",
    "pt-br": "Carga total admissível",
    "fr": "Charge totale admissible",
    "es": "Carga total admisible",
    "ru": "Максимально допустимая нагрузка"
  },
  "Tractor Weight": {
    "tr": "Traktör ağırlığı",
    "pt-br": "Peso do trator",
    "fr": "Masse du tracteur",
    "es": "Peso del tractor",
    "zh": "拖拉机重量",
    "ru": "Масса трактора",
    "ja": "トラクター重量",
    "hi": "ट्रैक्टर का वज़न"
  },
  "Weight With Cab": {
    "tr": "Kabinli ağırlık",
    "pt-br": "Peso com cabine",
    "fr": "Poids avec cabine",
    "es": "Peso con cabina",
    "hi": "कैब सहित वज़न",
    "ru": "Масса с кабиной"
  },
  "Agrotechnical Clearance Under Front Axle": {
    "tr": "Ön aks altındaki tarımsal yerden açıklık",
    "ru": "Агротехнический просвет под передним мостом",
    "hi": "आगे के एक्सल के नीचे कृषि कार्य के लिए जमीन से ऊँचाई"
  },
  "Agrotechnical Clearance Under Rear Wheel Tubes": {
    "tr": "Arka tekerlek kovanlarının altındaki tarımsal yerden açıklık",
    "ru": "Агротехнический просвет под рукавами задних колёс",
    "hi": "पिछले पहियों की एक्सल स्लीव के नीचे कृषि कार्य हेतु जमीन से ऊँचाई"
  },
  "Available Transmission Options": {
    "tr": "Mevcut şanzıman seçenekleri",
    "pt-br": "Opções de transmissão disponíveis",
    "fr": "Options de transmission disponibles",
    "es": "Opciones de transmisión disponibles"
  },
  "Clutch Configuration": {
    "tr": "Debriyaj düzeni",
    "pt-br": "Configuração da embreagem",
    "fr": "Configuration de l’embrayage",
    "es": "Configuración del embrague"
  },
  "Clutch Standard": {
    "tr": "Standart debriyaj",
    "pt-br": "Embreagem de série",
    "fr": "Embrayage de série",
    "es": "Embrague de serie"
  },
  "Creeper Gearbox Option": {
    "tr": "Sürüngen vitesli şanzıman seçeneği",
    "pt-br": "Opção de caixa de velocidades super-redutora",
    "fr": "Option de boîte de vitesses à rapports rampants",
    "es": "Opción de caja de cambios superreductora"
  },
  "Driven Wheels": {
    "tr": "Tahrik edilen tekerlekler",
    "pt-br": "Rodas motrizes",
    "fr": "Roues motrices",
    "es": "Ruedas motrices"
  },
  "Engine Maker": {
    "tr": "Motor üreticisi",
    "pt-br": "Fabricante do motor",
    "fr": "Fabricant du moteur",
    "es": "Fabricante del motor"
  },
  "Engine Rpm At Stated Power": {
    "tr": "Bildirilen motor gücündeki devir (dev/dak)",
    "pt-br": "Rotação do motor na potência declarada (rpm)",
    "fr": "Régime moteur à la puissance indiquée (tr/min)",
    "es": "Régimen del motor a la potencia declarada (rpm)",
    "de": "Motordrehzahl bei angegebener Leistung",
    "zh": "标称功率下的发动机转速",
    "ru": "Обороты двигателя при заявленной мощности",
    "ja": "公表出力時のエンジン回転数",
    "hi": "घोषित शक्ति पर इंजन की गति (rpm)"
  },
  "F36CHN HST Transmission Ranges": {
    "tr": "F36CHN HST şanzıman hız aralıkları"
  },
  "F36CN Mechanical Gear Configuration": {
    "tr": "F36CN mekanik vites düzeni"
  },
  "Forward Speed Range": {
    "tr": "İleri hız aralığı",
    "pt-br": "Faixa de velocidades para a frente",
    "fr": "Plage de vitesses en marche avant",
    "es": "Rango de velocidades de avance"
  },
  "Forward/Reverse Gear Options": {
    "tr": "İleri/geri vites seçenekleri",
    "pt-br": "Opções de marchas à frente e à ré",
    "fr": "Options de rapports avant et arrière",
    "es": "Opciones de marchas de avance y retroceso"
  },
  "Front Diff Lock Type": {
    "tr": "Ön diferansiyel kilidi tipi",
    "ru": "Тип блокировки переднего дифференциала"
  },
  "Front Tire (Main Configuration)": {
    "tr": "Ön lastik (ana yapılandırma)",
    "hi": "आगे का टायर (मुख्य विन्यास)",
    "ru": "Передняя шина (основная комплектация)"
  },
  "Front Tyre Size": {
    "tr": "Ön lastik ölçüsü",
    "pt-br": "Dimensão do pneu dianteiro",
    "fr": "Dimension du pneu avant",
    "es": "Medida del neumático delantero"
  },
  "Front Wheel Track": {
    "tr": "Ön tekerlek iz genişliği",
    "hi": "आगे के पहियों का ट्रैक",
    "ru": "Колея передних колёс"
  },
  "Height To ROPS Arc Top": {
    "tr": "ROPS kemerinin üst noktasına kadar yükseklik",
    "hi": "ROPS सुरक्षा चाप के शीर्ष तक ऊँचाई",
    "ru": "Высота до верхней точки дуги ROPS"
  },
  "HST Transmission Ranges": {
    "tr": "HST şanzıman hız aralıkları"
  },
  "Hydraulic Flow": {
    "tr": "Hidrolik debi",
    "pt-br": "Vazão hidráulica",
    "fr": "Débit hydraulique",
    "es": "Caudal hidráulico"
  },
  "Hydraulic Oil Reservoir": {
    "tr": "Hidrolik yağ deposu",
    "pt-br": "Reservatório de óleo hidráulico",
    "fr": "Réservoir d’huile hydraulique",
    "es": "Depósito de aceite hidráulico"
  },
  "Hydraulic System Maximum Pressure": {
    "tr": "Hidrolik sistemin azami basıncı",
    "pt-br": "Pressão máxima do sistema hidráulico",
    "fr": "Pression maximale du circuit hydraulique",
    "es": "Presión máxima del sistema hidráulico"
  },
  "Hydraulic Tank Capacity": {
    "tr": "Hidrolik tank kapasitesi",
    "pt-br": "Capacidade do reservatório hidráulico",
    "fr": "Capacité du réservoir hydraulique",
    "es": "Capacidad del depósito hidráulico"
  },
  "Hydrostatic Range Modes": {
    "tr": "Hidrostatik hız aralığı modları",
    "pt-br": "Modos de faixa da transmissão hidrostática",
    "fr": "Modes de gammes hydrostatiques",
    "es": "Modos de gamas hidrostáticas",
    "ja": "静油圧式変速機のレンジモード"
  },
  "Manufacturer Engine Power (Metric Hp)": {
    "tr": "Üreticinin bildirdiği motor gücü (metrik bg)",
    "pt-br": "Potência do motor declarada pelo fabricante (ch métricos)",
    "fr": "Puissance moteur annoncée par le constructeur (ch métriques)",
    "es": "Potencia del motor declarada por el fabricante (CV métricos)",
    "zh": "制造商公布的发动机功率（公制马力）",
    "ru": "Мощность двигателя по данным производителя (метрические л. с.)",
    "ja": "メーカー公表のエンジン出力（メートル馬力）",
    "hi": "निर्माता के अनुसार इंजन शक्ति (मीट्रिक अश्वशक्ति)"
  },
  "Manufacturer Rated Power": {
    "tr": "Üreticinin belirttiği nominal güç",
    "pt-br": "Potência nominal indicada pelo fabricante",
    "fr": "Puissance nominale déclarée par le constructeur",
    "es": "Potencia nominal declarada por el fabricante",
    "de": "Herstellerangabe zur Nennleistung",
    "zh": "制造商公布的额定功率",
    "hi": "निर्माता की घोषित रेटेड शक्ति",
    "ru": "Номинальная мощность по данным производителя",
    "ja": "メーカー公表の定格出力"
  },
  "Manufacturer Selectable Automatic Ranges (SIM)": {
    "tr": "Üreticinin seçilebilir otomatik hız aralıkları (SIM)",
    "ja": "メーカー設定の自動レンジ（SIM）"
  },
  "Manufacturer Stated Power": {
    "tr": "Üreticinin bildirdiği güç",
    "pt-br": "Potência declarada pelo fabricante",
    "fr": "Puissance indiquée par le constructeur",
    "es": "Potencia declarada por el fabricante",
    "zh": "制造商宣称的功率",
    "hi": "निर्माता द्वारा बताई गई शक्ति",
    "ru": "Мощность, заявленная производителем",
    "ja": "メーカー公表出力"
  },
  "Manufacturer-Stated Road Homologation Speed": {
    "tr": "Üreticinin bildirdiği yol homologasyon hızı",
    "pt-br": "Velocidade homologada para estrada declarada pelo fabricante",
    "fr": "Vitesse d’homologation routière déclarée par le constructeur",
    "es": "Velocidad de homologación en carretera declarada por el fabricante"
  },
  "Manufacturer-Stated Tractor Weight": {
    "tr": "Üreticinin bildirdiği traktör ağırlığı",
    "hi": "निर्माता द्वारा घोषित ट्रैक्टर का वज़न",
    "ru": "Масса трактора по данным производителя"
  },
  "Max Speed Variants": {
    "tr": "Azami hız varyantları"
  },
  "Maximum Road Speed (ECO, Tyre Dependent)": {
    "tr": "Azami yol hızı (ECO, lastiğe bağlı)"
  },
  "Operating Weight (Brochure Configuration)": {
    "tr": "Çalışma ağırlığı (broşürdeki yapılandırma)",
    "hi": "परिचालन वज़न (ब्रोशर में दिया गया विन्यास)",
    "ru": "Эксплуатационная масса (комплектация в брошюре)"
  },
  "Operating Weight Without Ballast": {
    "tr": "Balastsız çalışma ağırlığı",
    "hi": "बैलास्ट के बिना परिचालन वज़न"
  },
  "Overall Width Between Rear Wheels": {
    "tr": "Arka tekerlekler arasındaki toplam genişlik",
    "hi": "पिछले पहियों के बीच कुल चौड़ाई",
    "ru": "Общая ширина между задними колёсами"
  },
  "Rear 3-Point Draft/Implement Depth Control": {
    "tr": "Arka üç nokta askı sisteminde çeki kuvveti/ekipman derinliği kontrolü",
    "pt-br": "Controle de esforço/profundidade do implemento no engate traseiro de três pontos",
    "fr": "Contrôle d’effort/de profondeur de l’outil sur l’attelage arrière trois points",
    "es": "Control de esfuerzo/profundidad del implemento en el enganche trasero de tres puntos"
  },
  "Rear Diff Lock Type": {
    "tr": "Arka diferansiyel kilidi tipi",
    "ru": "Тип блокировки заднего дифференциала"
  },
  "Rear Remote Valve Sets": {
    "tr": "Arka hidrolik kumanda valfi grupları",
    "pt-br": "Conjuntos de distribuidores hidráulicos traseiros",
    "fr": "Ensembles de distributeurs hydrauliques arrière",
    "es": "Conjuntos de distribuidores hidráulicos traseros"
  },
  "Rear Tire (Main Configuration)": {
    "tr": "Arka lastik (ana yapılandırma)",
    "hi": "पीछे का टायर (मुख्य विन्यास)",
    "ru": "Задняя шина (основная комплектация)"
  },
  "Rear Tyre Size": {
    "tr": "Arka lastik ölçüsü",
    "pt-br": "Dimensão do pneu traseiro",
    "fr": "Dimension du pneu arrière",
    "es": "Medida del neumático trasero"
  },
  "Reverse Speeds": {
    "tr": "Geri vites hızları"
  },
  "Road Clearance (Main Tyre Configuration)": {
    "tr": "Yerden açıklık (ana lastik yapılandırması)",
    "hi": "सड़क से जमीन की ऊँचाई (मुख्य टायर विन्यास)",
    "ru": "Дорожный просвет (основная комплектация шин)"
  },
  "Speed Range Forward": {
    "tr": "İleri hareket hız aralığı"
  },
  "Speed Range Reverse": {
    "tr": "Geri hareket hız aralığı"
  },
  "Standard Clutch": {
    "tr": "Standart debriyaj"
  },
  "Standard Front Tire Size": {
    "tr": "Standart ön lastik ölçüsü",
    "pt-br": "Dimensão padrão do pneu dianteiro",
    "fr": "Dimension standard du pneu avant",
    "es": "Medida estándar del neumático delantero"
  },
  "Standard Rear Tire Size": {
    "tr": "Standart arka lastik ölçüsü",
    "pt-br": "Dimensão padrão do pneu traseiro",
    "fr": "Dimension standard du pneu arrière",
    "es": "Medida estándar del neumático trasero"
  },
  "Synchro-Shuttle Gear Configuration": {
    "tr": "Synchro-Shuttle vites düzeni",
    "pt-br": "Configuração de marchas Synchro-Shuttle",
    "fr": "Configuration des rapports Synchro-Shuttle",
    "es": "Configuración de marchas Synchro-Shuttle"
  },
  "Synchronised Gear Shifting": {
    "tr": "Senkromeçli vites değiştirme"
  },
  "Transmission Configuration": {
    "tr": "Şanzıman yapılandırması"
  },
  "Transmission Gears": {
    "tr": "Şanzıman vitesleri",
    "pt-br": "Marchas da transmissão",
    "fr": "Rapports de transmission",
    "es": "Marchas de la transmisión"
  },
  "Transmission Option Hilo": {
    "tr": "HiLo şanzıman seçeneği"
  },
  "Transmission Option Hml": {
    "tr": "HML şanzıman seçeneği"
  },
  "Transmission Shuttle Type": {
    "tr": "Şanzıman ileri-geri yön değiştirme tipi",
    "pt-br": "Tipo de inversor de marcha da transmissão",
    "fr": "Type d’inverseur de marche de la transmission",
    "es": "Tipo de inversor de marcha de la transmisión"
  },
  "Weight With Roll Bar": {
    "tr": "Devrilme koruma barıyla ağırlık",
    "hi": "रोल बार के साथ वज़न",
    "ru": "Масса с защитной дугой"
  },
  "With Front Tyre": {
    "tr": "Ön lastikle"
  },
  "With Front Tyre Size": {
    "tr": "Ön lastik ölçüsüyle"
  },
  "With Rear Tyre": {
    "tr": "Arka lastikle"
  },
  "With Rear Tyre Size": {
    "tr": "Arka lastik ölçüsüyle"
  },
  "Manufacturer ROPS/Cabin Weight Range Boundary, Load Status Unspecified": {
    "pt-br": "Limite da faixa de peso ROPS/cabine indicado pelo fabricante (condição de carga não informada)",
    "fr": "Limite de plage de masse ROPS/cabine indiqué par le constructeur (état de charge non précisé)",
    "es": "Límite del rango de peso ROPS/cabina indicado por el fabricante (condición de carga no especificada)",
    "de": "Herstellerangabe zum Gewichtsbereich von ROPS/Kabine (Beladungszustand nicht angegeben)",
    "zh": "制造商公布的 ROPS/驾驶室重量范围界限（载荷状态未注明）",
    "hi": "निर्माता की ROPS/कैब वज़न-सीमा (भार की स्थिति निर्दिष्ट नहीं)",
    "ru": "Указанная производителем граница диапазона массы с ROPS/кабиной (нагрузка не указана)"
  },
  "Powershift Multiplier Stages": {
    "pt-br": "Número de estágios do multiplicador Powershift",
    "es": "Número de etapas del multiplicador Powershift"
  },
  "Length Including 3-Point Hitch": {
    "pt-br": "Comprimento incluindo o engate de três pontos",
    "fr": "Longueur avec attelage trois points"
  },
  "Maximum Forward Speed": {
    "pt-br": "Velocidade máxima em marcha à frente",
    "fr": "Vitesse maximale en marche avant",
    "es": "Velocidad máxima de avance",
    "ru": "Максимальная скорость движения вперёд",
    "ja": "最高前進速度"
  },
  "Track Frame Roller Count": {
    "pt-br": "Número de roletes do chassi de esteiras",
    "fr": "Nombre de galets du châssis à chenilles",
    "es": "Número de rodillos del bastidor de orugas"
  },
  "Wheelbase 4wd Mm": {
    "pt-br": "Distância entre eixos em 4WD (mm)",
    "fr": "Empattement en 4 roues motrices (mm)",
    "es": "Distancia entre ejes en 4WD (mm)"
  },
  "Maximum Reverse Speed": {
    "pt-br": "Velocidade máxima em marcha à ré",
    "fr": "Vitesse maximale en marche arrière",
    "es": "Velocidad máxima de retroceso",
    "ru": "Максимальная скорость заднего хода",
    "ja": "最高後進速度"
  },
  "Minimum Forward Speed": {
    "pt-br": "Velocidade mínima em marcha à frente",
    "fr": "Vitesse minimale en marche avant",
    "es": "Velocidad mínima de avance",
    "ru": "Минимальная скорость движения вперёд",
    "ja": "最低前進速度"
  },
  "Minimum Reverse Speed": {
    "pt-br": "Velocidade mínima em marcha à ré",
    "fr": "Vitesse minimale en marche arrière",
    "es": "Velocidad mínima de retroceso",
    "ru": "Минимальная скорость заднего хода",
    "ja": "最低後進速度"
  },
  "Length Without Front Linkage": {
    "pt-br": "Comprimento sem engate frontal",
    "fr": "Longueur sans relevage avant",
    "es": "Longitud sin enganche delantero"
  },
  "Maker ROPS/Cab Weight Bound (Equipment-Dependent)": {
    "pt-br": "Limite de peso ROPS/cabine declarado pelo fabricante (dependente do equipamento)",
    "fr": "Limite de masse ROPS/cabine indiqué par le constructeur (selon l’équipement)",
    "es": "Límite de peso ROPS/cabina declarado por el fabricante (según equipamiento)",
    "de": "Herstellerangabe zur Gewichtsgrenze von ROPS/Kabine (ausstattungsabhängig)"
  },
  "Standart şAnzıMan": {
    "pt-br": "Transmissão de série",
    "fr": "Transmission de série",
    "es": "Transmisión estándar"
  },
  "Weight (Kg)": {
    "pt-br": "Peso (kg)",
    "fr": "Poids (kg)",
    "es": "Peso (kg)",
    "zh": "重量（kg）",
    "hi": "वज़न (किग्रा)",
    "ru": "Масса (кг)",
    "ja": "重量（kg）"
  },
  "Width Between Rear Axle Shaft Ends": {
    "pt-br": "Largura entre as extremidades dos semieixos traseiros",
    "fr": "Largeur entre les extrémités des arbres d’essieu arrière",
    "es": "Anchura entre los extremos de los semiejes traseros"
  },
  "4WD Front Axle Configuration": {
    "pt-br": "Configuração do eixo dianteiro 4WD",
    "fr": "Configuration de l’essieu avant 4 roues motrices",
    "es": "Configuración del eje delantero 4WD"
  },
  "Arka Lastik SeçEnekleri": {
    "pt-br": "Opções de pneus traseiros",
    "fr": "Options de pneus arrière",
    "es": "Opciones de neumáticos traseros"
  },
  "Brakes Type": {
    "pt-br": "Tipo de freios",
    "fr": "Type de freins",
    "es": "Tipo de frenos"
  },
  "Max Speed 4wd Kmh": {
    "pt-br": "Velocidade máxima em 4WD (km/h)",
    "fr": "Vitesse maximale en 4RM (km/h)",
    "es": "Velocidad máxima en 4WD (km/h)"
  },
  "Min Speed 4wd Kmh": {
    "pt-br": "Velocidade mínima em 4WD (km/h)",
    "fr": "Vitesse minimale en 4RM (km/h)",
    "es": "Velocidad mínima en 4WD (km/h)"
  },
  "Minimum Width": {
    "pt-br": "Largura mínima",
    "fr": "Largeur minimale",
    "es": "Anchura mínima"
  },
  "Transmission Shuttle": {
    "pt-br": "Inversor de marcha da transmissão",
    "fr": "Inverseur de marche de la transmission",
    "es": "Inversor de marcha de la transmisión"
  },
  "Unladen Weight With Cab And All-Wheel Drive": {
    "pt-br": "Peso sem carga com cabine e tração integral",
    "fr": "Masse à vide avec cabine et transmission intégrale",
    "es": "Peso en vacío con cabina y tracción total"
  },
  "Weight With ROPS": {
    "pt-br": "Peso com estrutura ROPS",
    "fr": "Poids avec structure ROPS",
    "es": "Peso con estructura ROPS",
    "zh": "配备 ROPS 防翻滚结构时的重量",
    "hi": "ROPS के साथ वज़न",
    "de": "Gewicht mit ROPS",
    "ru": "Масса с конструкцией ROPS",
    "ja": "ROPS装備時重量"
  },
  "Width Max Mm": {
    "pt-br": "Largura máxima (mm)",
    "fr": "Largeur maximale (mm)",
    "es": "Anchura máxima (mm)"
  },
  "Width Min Mm": {
    "pt-br": "Largura mínima (mm)",
    "fr": "Largeur minimale (mm)",
    "es": "Anchura mínima (mm)"
  },
  "Azami Yol HıZı SeçEnekleri": {
    "pt-br": "Opções de velocidade máxima em estrada",
    "fr": "Options de vitesse routière maximale",
    "es": "Opciones de velocidad máxima en carretera"
  },
  "Clutch Button": {
    "pt-br": "Botão da embreagem",
    "fr": "Bouton d’embrayage",
    "es": "Botón de embrague"
  },
  "Operator Station": {
    "pt-br": "Posto do operador",
    "fr": "Poste de conduite",
    "es": "Puesto del operador"
  },
  "Rear Pto Ground Speed Standard": {
    "pt-br": "TDP traseira proporcional ao avanço de série",
    "fr": "Prise de force arrière proportionnelle à l’avancement de série",
    "es": "TDF trasera sincronizada con el avance de serie"
  },
  "Steering Layout": {
    "pt-br": "Configuração da direção",
    "fr": "Configuration de la direction",
    "es": "Configuración de la dirección",
    "de": "Anordnung der Lenkung"
  },
  "Steering Max Angle Deg": {
    "pt-br": "Ângulo máximo de esterçamento (°)",
    "fr": "Angle de braquage maximal (°)",
    "es": "Ángulo máximo de giro de la dirección (°)"
  },
  "Steering System": {
    "pt-br": "Sistema de direção",
    "fr": "Système de direction",
    "es": "Sistema de dirección",
    "de": "Lenksystem"
  },
  "Rear PTO Shaft": {
    "pt-br": "Eixo da TDP traseira",
    "fr": "Arbre de prise de force arrière",
    "es": "Eje de la TDF trasera"
  },
  "Weight Without Ballast": {
    "pt-br": "Peso sem lastro",
    "fr": "Poids sans lest",
    "es": "Peso sin lastre",
    "ru": "Масса без балласта",
    "hi": "बैलास्ट के बिना वज़न"
  },
  "Crop Clearance": {
    "pt-br": "Vão livre para culturas",
    "fr": "Garde au sol pour cultures",
    "es": "Despeje para cultivos"
  },
  "Arka PTO Devir SeçEnekleri": {
    "pt-br": "Opções de rotação da TDP traseira",
    "fr": "Options de régime de prise de force arrière",
    "es": "Opciones de régimen de la TDF trasera"
  },
  "Opsiyonel şAnzıMan": {
    "pt-br": "Transmissão opcional",
    "fr": "Transmission en option",
    "es": "Transmisión opcional"
  },
  "Minimum Forward Speed 2wd": {
    "pt-br": "Velocidade mínima para a frente em 2WD",
    "fr": "Vitesse minimale en marche avant en 2RM",
    "es": "Velocidad mínima de avance en 2WD"
  },
  "Transmission Control": {
    "pt-br": "Comando da transmissão",
    "fr": "Commande de la transmission",
    "es": "Control de la transmisión",
    "hi": "ट्रांसमिशन का नियंत्रण",
    "ru": "Управление трансмиссией",
    "ja": "変速機の操作方式"
  },
  "Azami Motor GüCü (ECE R120, CV)": {
    "zh": "发动机最大功率 (ECE R120, cv)",
    "hi": "अधिकतम इंजन शक्ति (ECE R120, cv)",
    "pt-br": "Potência máxima do motor (ECE R120, cv)",
    "fr": "Puissance moteur maximale (ECE R120, cv)",
    "de": "Maximale Motorleistung (ECE R120, cv)",
    "ru": "Максимальная мощность двигателя (ECE R120, cv)",
    "ja": "エンジン最高出力（ECE R120、cv）",
    "es": "Potencia máxima del motor (ECE R120, cv)"
  },
  "Azami Motor GüCü (ECE R120, KW)": {
    "zh": "发动机最大功率 (ECE R120, kW)",
    "hi": "अधिकतम इंजन शक्ति (ECE R120, kW)",
    "pt-br": "Potência máxima do motor (ECE R120, kW)",
    "fr": "Puissance moteur maximale (ECE R120, kW)",
    "de": "Maximale Motorleistung (ECE R120, kW)",
    "ru": "Максимальная мощность двигателя (ECE R120, кВт)",
    "ja": "エンジン最高出力（ECE R120、kW）",
    "es": "Potencia máxima del motor (ECE R120, kW)"
  },
  "Nominal Motor GüCü (ECE R120, CV)": {
    "zh": "发动机额定功率 (ECE R120, cv)",
    "hi": "इंजन की रेटेड शक्ति (ECE R120, cv)",
    "pt-br": "Potência nominal do motor (ECE R120, cv)",
    "fr": "Puissance nominale du moteur (ECE R120, cv)",
    "de": "Motor-Nennleistung (ECE R120, cv)",
    "ru": "Номинальная мощность двигателя (ECE R120, cv)",
    "ja": "エンジン定格出力（ECE R120、cv）",
    "es": "Potencia nominal del motor (ECE R120, cv)"
  },
  "Nominal Motor GüCü (ECE R120, KW)": {
    "zh": "发动机额定功率 (ECE R120, kW)",
    "hi": "इंजन की रेटेड शक्ति (ECE R120, kW)",
    "pt-br": "Potência nominal do motor (ECE R120, kW)",
    "fr": "Puissance nominale du moteur (ECE R120, kW)",
    "de": "Motor-Nennleistung (ECE R120, kW)",
    "ru": "Номинальная мощность двигателя (ECE R120, кВт)",
    "ja": "エンジン定格出力（ECE R120、kW）",
    "es": "Potencia nominal del motor (ECE R120, kW)"
  },
  "Azami Tork Devri": {
    "zh": "最大扭矩对应的发动机转速",
    "hi": "अधिकतम टॉर्क पर इंजन की गति",
    "pt-br": "Rotação do motor no torque máximo",
    "fr": "Régime moteur au couple maximal",
    "de": "Motordrehzahl bei maximalem Drehmoment",
    "ru": "Частота вращения при максимальном крутящем моменте",
    "ja": "最大トルク時のエンジン回転数",
    "es": "Régimen del motor al par máximo"
  },
  "OECD Tork Artışı": {
    "zh": "OECD 规定的扭矩增幅",
    "hi": "OECD के अनुसार टॉर्क वृद्धि",
    "pt-br": "Aumento de torque segundo a OECD",
    "fr": "Augmentation du couple selon l’OCDE",
    "de": "Drehmomentanstieg nach OECD",
    "ru": "Прирост крутящего момента по OECD",
    "ja": "OECD基準によるトルク上昇",
    "es": "Aumento del par según la OCDE"
  },
  "Toplam Motor Supabı": {
    "zh": "发动机气门总数",
    "hi": "इंजन वाल्वों की कुल संख्या",
    "pt-br": "Número total de válvulas do motor",
    "fr": "Nombre total de soupapes du moteur",
    "de": "Gesamtzahl der Motorventile",
    "ru": "Общее количество клапанов двигателя",
    "ja": "エンジンバルブ総数",
    "es": "Número total de válvulas del motor"
  },
  "Motor SoğUtma Tipi": {
    "hi": "इंजन का शीतलन प्रकार",
    "zh": "发动机冷却方式"
  },
  "Engine Speed At Maximum Power": {
    "zh": "最大功率时的发动机转速",
    "hi": "अधिकतम शक्ति पर इंजन की गति",
    "pt-br": "Rotação do motor na potência máxima",
    "fr": "Régime moteur à la puissance maximale",
    "de": "Motordrehzahl bei Höchstleistung",
    "ru": "Частота вращения двигателя при максимальной мощности",
    "ja": "最高出力時のエンジン回転数",
    "es": "Régimen del motor a potencia máxima"
  },
  "Engine Speed At Max Power": {
    "zh": "最大功率时的发动机转速",
    "hi": "अधिकतम शक्ति पर इंजन की गति",
    "de": "Motordrehzahl bei Höchstleistung",
    "ru": "Частота вращения двигателя при максимальной мощности",
    "ja": "最高出力時のエンジン回転数",
    "pt-br": "Rotação do motor à potência máxima",
    "fr": "Régime moteur à la puissance maximale",
    "es": "Régimen del motor a la potencia máxima"
  },
  "Max / Rated Power (HP)": {
    "hi": "अधिकतम / रेटेड शक्ति (HP)",
    "pt-br": "Potência máxima / nominal (HP)",
    "fr": "Puissance maximale / nominale (HP)",
    "de": "Maximal- / Nennleistung (HP)",
    "ru": "Максимальная / номинальная мощность (HP)",
    "ja": "最高／定格出力（HP）",
    "es": "Potencia máxima / nominal (HP)"
  },
  "Max / Rated Power (KW)": {
    "hi": "अधिकतम / रेटेड शक्ति (kW)",
    "pt-br": "Potência máxima / nominal (kW)",
    "fr": "Puissance maximale / nominale (kW)",
    "de": "Maximal- / Nennleistung (kW)",
    "ru": "Максимальная / номинальная мощность (кВт)",
    "ja": "最高／定格出力（kW）",
    "es": "Potencia máxima / nominal (kW)"
  },
  "Specific Fuel Consumption At Operating Power": {
    "hi": "संचालन शक्ति पर विशिष्ट ईंधन खपत",
    "ru": "Удельный расход топлива при рабочей мощности"
  },
  "Engine Air Filter": {
    "hi": "इंजन एयर फ़िल्टर"
  },
  "Engine Bore Mm": {
    "hi": "इंजन सिलेंडर का बोर (मिमी)"
  },
  "Engine Compression Ratio": {
    "hi": "इंजन का संपीड़न अनुपात"
  },
  "Engine Max Power Cv Iso": {
    "hi": "ISO के अनुसार इंजन की अधिकतम शक्ति (cv)"
  },
  "Engine Max Power Kw Iso": {
    "hi": "ISO के अनुसार इंजन की अधिकतम शक्ति (kW)"
  },
  "Engine Rpm At Max Torque": {
    "hi": "अधिकतम टॉर्क पर इंजन की गति (rpm)"
  },
  "Engine Stroke Mm": {
    "hi": "इंजन पिस्टन स्ट्रोक (मिमी)"
  },
  "Minimum Turning Radius": {
    "hi": "न्यूनतम मोड़ त्रिज्या",
    "ru": "Минимальный радиус поворота",
    "ja": "最小旋回半径"
  },
  "Specific Fuel Consumption": {
    "hi": "विशिष्ट ईंधन खपत",
    "ru": "Удельный расход топлива"
  },
  "Transmission Gears – Basic Mechanical Shuttle": {
    "hi": "बेसिक मैकेनिकल शटल के साथ ट्रांसमिशन गियर"
  },
  "Transmission Gears – Power Shuttle Option": {
    "hi": "पावर शटल विकल्प के साथ ट्रांसमिशन गियर"
  },
  "Transmission Gears – Splitter Option": {
    "hi": "स्प्लिटर विकल्प के साथ ट्रांसमिशन गियर"
  },
  "Agrotechnical Ground Clearance": {
    "hi": "कृषि कार्य के लिए जमीन से ऊँचाई",
    "ru": "Агротехнический дорожный просвет"
  },
  "Azami Motor Devri": {
    "hi": "इंजन की अधिकतम गति (rpm)"
  },
  "BrüT Motor GüCü (Metrik PS)": {
    "hi": "सकल इंजन शक्ति (मीट्रिक PS)"
  },
  "Canopy Height": {
    "hi": "कैनोपी की ऊँचाई",
    "ru": "Высота навеса"
  },
  "Engine Dual-Element Air Cleaner": {
    "hi": "इंजन का दो-तत्व वाला एयर क्लीनर"
  },
  "Engine Rpm For Stated Power": {
    "hi": "बताई गई शक्ति पर इंजन की गति (rpm)",
    "ru": "Обороты двигателя при заявленной мощности",
    "ja": "公表出力時のエンジン回転数"
  },
  "Large-Volume Diesel Water Separator": {
    "hi": "बड़ी क्षमता वाला डीज़ल जल विभाजक"
  },
  "Motor Hacmi (In³)": {
    "hi": "इंजन का विस्थापन (घन इंच)"
  },
  "Motor SoğUtma": {
    "hi": "इंजन शीतलन",
    "ru": "Охлаждение двигателя"
  },
  "Net Motor GüCü (Metrik PS)": {
    "hi": "शुद्ध इंजन शक्ति (मीट्रिक PS)"
  },
  "Drive Layout": {
    "zh": "驱动系统布局",
    "ru": "Схема привода",
    "ja": "駆動方式の構成"
  },
  "Engine Speed At Listed Power": {
    "ja": "記載出力時のエンジン回転数",
    "hi": "सूचीबद्ध शक्ति पर इंजन की गति",
    "ru": "Частота вращения двигателя при указанной мощности"
  },
  "Manufacturer-Stated Engine Power (KW, Test Standard Unspecified)": {
    "ja": "メーカー公表エンジン出力（kW、試験規格未記載）",
    "hi": "निर्माता द्वारा घोषित इंजन शक्ति (kW, परीक्षण मानक निर्दिष्ट नहीं)"
  },
  "Operator Station / Cab": {
    "ja": "運転席／キャブ",
    "ru": "Рабочее место оператора / кабина"
  },
  "Reverse Gears (12F+12R Gearbox Option)": {
    "ja": "後進段数（12F+12R変速機オプション）"
  },
  "Fuel Capacity – Large Tank Option": {
    "de": "Kraftstoffvolumen – großer Tank als Option",
    "pt-br": "Capacidade de combustível – opção de tanque grande",
    "fr": "Capacité de carburant – option grand réservoir",
    "es": "Capacidad de combustible – opción de depósito grande"
  },
  "Full-Range Lifting Force": {
    "de": "Hubkraft über den gesamten Hubbereich"
  },
  "Maximum Lift Force": {
    "de": "Maximale Hubkraft"
  },
  "Fuel Tank (Auxiliary)": {
    "de": "Kraftstofftank (Zusatztank)"
  },
  "Fuel Tank (Lit)": {
    "de": "Kraftstofftank (Liter)"
  },
  "Manufacturer Cab/ROPS Weight Boundary (Load Condition Unstated)": {
    "de": "Herstellerangabe zur Gewichtsgrenze von Kabine/ROPS (Beladungszustand nicht angegeben)",
    "pt-br": "Limite de peso cabine/ROPS declarado pelo fabricante (condição de carga não informada)",
    "fr": "Limite de masse cabine/ROPS donné par le constructeur (état de charge non précisé)",
    "es": "Límite de peso cabina/ROPS declarado por el fabricante (condición de carga no indicada)"
  },
  "Mid Pto Speed Rpm": {
    "de": "Drehzahl der mittleren Zapfwelle (U/min)"
  },
  "Steering Angle Max Degrees": {
    "de": "Maximaler Lenkwinkel (°)"
  },
  "Front Axle Capacity": {
    "ru": "Допустимая нагрузка на передний мост"
  },
  "Height At Bonnet": {
    "ru": "Высота по капоту"
  },
  "Rear Lift Capacity At 24 Inches Behind Link Ends": {
    "ru": "Грузоподъёмность задней навески на расстоянии 24 дюйма за концами тяг"
  },
  "Four-Post Cab": {
    "ru": "Четырёхстоечная кабина"
  },
  "Front Track Width": {
    "ru": "Ширина передней колеи",
    "hi": "आगे के पहियों की ट्रैक चौड़ाई",
    "pt-br": "Largura da bitola dianteira",
    "fr": "Largeur de voie avant",
    "es": "Ancho de vía delantera"
  },
  "Fuel Tank With Additional Tank, No Front Lift/PTO": {
    "ru": "Топливный бак с дополнительным баком (без передней навески/ВОМ)"
  },
  "Fuel Tank Without Front Lift/PTO": {
    "ru": "Топливный бак без передней навески/ВОМ"
  },
  "Halogen Working Lights": {
    "ru": "Галогенные рабочие фары"
  },
  "Manufacturer Operator Station Type": {
    "ru": "Тип рабочего места оператора по данным производителя"
  },
  "Operating Weight With Ballast": {
    "ru": "Эксплуатационная масса с балластом",
    "hi": "बैलास्ट सहित परिचालन वज़न"
  },
  "Air Cleaner": {
    "ru": "Воздушный фильтр"
  },
  "Engine Max Torque Rpm": {
    "ru": "Обороты двигателя при максимальном крутящем моменте"
  },
  "Rear Hitch Lift Capacity At Linkage Axis": {
    "zh": "后悬挂系统在连杆轴线处的提升能力",
    "ru": "Грузоподъёмность задней навески на оси крепления тяг"
  },
  "Total Height Of Driver'S Cab With Standard Tyres With Fendt Guide": {
    "zh": "安装标准轮胎和 Fendt Guide 时驾驶室总高度"
  },
  "Total Height Of Driver'S Cab With Standard Tyres Without Fendt Guide": {
    "zh": "安装标准轮胎但不配 Fendt Guide 时驾驶室总高度"
  },
  "One-Piece Fully Opening Hood": {
    "hi": "पूरी तरह खुलने वाला एक-टुकड़ा इंजन बोनट"
  },
  "Operator Cup Holder": {
    "hi": "ऑपरेटर के लिए कप होल्डर"
  },
  "ROPS Folded Height": {
    "hi": "मुड़े हुए ROPS की ऊँचाई"
  },
  "Electrohydraulic 4WD And Differential Lock Engagement": {
    "ru": "Электрогидравлическое включение 4WD и блокировки дифференциала"
  },
  "Length With Front Linkage In Transport Position": {
    "pt-br": "Comprimento com engate dianteiro na posição de transporte",
    "fr": "Longueur avec relevage avant en position de transport",
    "es": "Longitud con enganche delantero en posición de transporte"
  },
  "Length With Front Linkage Lowered": {
    "pt-br": "Comprimento com engate dianteiro abaixado",
    "fr": "Longueur avec relevage avant abaissé",
    "es": "Longitud con enganche delantero bajado"
  },
  "Maximum Total Weight At 40 Km/H": {
    "pt-br": "Peso total máximo a 40 km/h",
    "fr": "Masse totale maximale à 40 km/h",
    "es": "Peso total máximo a 40 km/h"
  },
  "Maximum Total Weight At 50 Km/H": {
    "pt-br": "Peso total máximo a 50 km/h",
    "fr": "Masse totale maximale à 50 km/h",
    "es": "Peso total máximo a 50 km/h"
  },
  "ÖN Lastik SeçEnekleri": {
    "pt-br": "Opções de pneus dianteiros",
    "fr": "Options de pneus avant",
    "es": "Opciones de neumáticos delanteros"
  },
  "Creeper Gear": {
    "pt-br": "Marcha superlenta",
    "fr": "Rapport rampant",
    "es": "Marcha superlenta"
  },
  "CVT Opsiyonel üSt HıZı": {
    "pt-br": "Velocidade máxima opcional da CVT",
    "fr": "Vitesse de pointe optionnelle de la CVT",
    "es": "Velocidad máxima opcional de la CVT"
  },
  "CVT Standart üSt HıZı": {
    "pt-br": "Velocidade máxima de série da CVT",
    "fr": "Vitesse de pointe de série de la CVT",
    "es": "Velocidad máxima estándar de la CVT"
  },
  "DEF / AdBlue Deposu": {
    "pt-br": "Tanque de DEF / AdBlue",
    "fr": "Réservoir de DEF / AdBlue",
    "es": "Depósito de DEF / AdBlue"
  },
  "Front Agricultural Tyre": {
    "pt-br": "Pneu agrícola dianteiro",
    "fr": "Pneu agricole avant",
    "es": "Neumático agrícola delantero"
  },
  "Ground PTO": {
    "pt-br": "TDP sincronizada com o deslocamento",
    "fr": "Prise de force proportionnelle à l'avancement",
    "es": "TDF sincronizada con el avance"
  },
  "Height With Maximum Tyre SRI": {
    "pt-br": "Altura com pneu de SRI máximo",
    "fr": "Hauteur avec pneu à SRI maximal",
    "es": "Altura con neumático de SRI máximo"
  },
  "Height With Minimum Tyre SRI": {
    "pt-br": "Altura com pneu de SRI mínimo",
    "fr": "Hauteur avec pneu à SRI minimal",
    "es": "Altura con neumático de SRI mínimo"
  },
  "Kabin Cam Alanı": {
    "pt-br": "Área envidraçada da cabine",
    "fr": "Surface vitrée de la cabine",
    "es": "Superficie acristalada de la cabina"
  },
  "Length With Front Linkage (Transport)": {
    "pt-br": "Comprimento com engate dianteiro (transporte)",
    "fr": "Longueur avec relevage avant (transport)",
    "es": "Longitud con enganche delantero (transporte)"
  },
  "Length Without Front Weight": {
    "pt-br": "Comprimento sem lastro dianteiro",
    "fr": "Longueur sans masse avant",
    "es": "Longitud sin contrapeso delantero"
  },
  "Main Brake": {
    "pt-br": "Freio principal",
    "fr": "Frein principal",
    "es": "Freno principal"
  },
  "Max Speed 2wd Kmh": {
    "pt-br": "Velocidade máxima em 2WD (km/h)",
    "fr": "Vitesse maximale en 2RM (km/h)",
    "es": "Velocidad máxima en 2WD (km/h)"
  },
  "Min Speed 2wd Kmh": {
    "pt-br": "Velocidade mínima em 2WD (km/h)",
    "fr": "Vitesse minimale en 2RM (km/h)",
    "es": "Velocidad mínima en 2WD (km/h)"
  },
  "ÖN Aks Opsiyonları": {
    "pt-br": "Opções de eixo dianteiro",
    "fr": "Options d'essieu avant",
    "es": "Opciones de eje delantero"
  },
  "Overall Height With Cab": {
    "pt-br": "Altura total com cabine",
    "fr": "Hauteur hors tout avec cabine",
    "es": "Altura total con cabina"
  },
  "Rear Agricultural Tyre": {
    "pt-br": "Pneu agrícola traseiro",
    "fr": "Pneu agricole arrière",
    "es": "Neumático agrícola trasero"
  },
  "ŞAnzıMan Tipi": {
    "pt-br": "Tipo de transmissão",
    "fr": "Type de transmission",
    "es": "Tipo de transmisión"
  },
  "Shuttle Type": {
    "pt-br": "Tipo de inversor de marcha",
    "fr": "Type d'inverseur de marche",
    "es": "Tipo de inversor de marcha"
  },
  "Standart Kabin Halojen Far SayıSı": {
    "pt-br": "Número de faróis halógenos da cabine padrão",
    "fr": "Nombre de phares halogènes de la cabine standard",
    "es": "Número de faros halógenos de la cabina estándar"
  },
  "Standart öN Aks": {
    "pt-br": "Eixo dianteiro de série",
    "fr": "Essieu avant de série",
    "es": "Eje delantero de serie"
  },
  "Unladen Weight (Tanks Empty)": {
    "pt-br": "Peso sem carga (tanques vazios)",
    "fr": "Masse à vide (réservoirs vides)",
    "es": "Peso en vacío (depósitos vacíos)"
  },
  "Urea/AdBlue Tank Capacity": {
    "pt-br": "Capacidade do tanque de ureia/AdBlue",
    "fr": "Capacité du réservoir d'urée/AdBlue",
    "es": "Capacidad del depósito de urea/AdBlue"
  },
  "Wheelbase 2wd Mm": {
    "pt-br": "Distância entre eixos em 2WD (mm)",
    "fr": "Empattement en 2RM (mm)",
    "es": "Distancia entre ejes en 2WD (mm)"
  },
  "Width At Minimum Tread": {
    "pt-br": "Largura na bitola mínima",
    "fr": "Largeur à voie minimale",
    "es": "Anchura con vía mínima"
  },
  "Approx Operating Weight": {
    "pt-br": "Peso operacional aproximado",
    "fr": "Masse en ordre de marche approximative",
    "es": "Peso operativo aproximado"
  },
  "Clutch On Gear Lever": {
    "pt-br": "Comando da embreagem na alavanca de marchas",
    "fr": "Commande d'embrayage sur le levier de vitesses",
    "es": "Mando del embrague en la palanca de cambios"
  },
  "Engine Power Rpm": {
    "pt-br": "Rotação do motor na potência indicada (rpm)",
    "fr": "Régime moteur à la puissance indiquée (tr/min)",
    "es": "Régimen del motor a la potencia indicada (rpm)"
  },
  "Height To Top ROPS Or Cab": {
    "pt-br": "Altura até o topo do ROPS ou da cabine",
    "fr": "Hauteur jusqu'au sommet du ROPS ou de la cabine",
    "es": "Altura hasta la parte superior del ROPS o la cabina"
  },
  "Length, CVT": {
    "pt-br": "Comprimento, versão CVT",
    "fr": "Longueur, version CVT",
    "es": "Longitud, versión CVT"
  },
  "Length, Powershift": {
    "pt-br": "Comprimento, versão Powershift",
    "fr": "Longueur, version Powershift",
    "es": "Longitud, versión Powershift"
  },
  "Manufacturer Model Code": {
    "pt-br": "Código de modelo do fabricante",
    "fr": "Code modèle du constructeur",
    "es": "Código de modelo del fabricante"
  },
  "Maximum Height": {
    "pt-br": "Altura máxima",
    "fr": "Hauteur maximale",
    "es": "Altura máxima"
  },
  "Maximum Width": {
    "pt-br": "Largura máxima",
    "fr": "Largeur maximale",
    "es": "Anchura máxima"
  },
  "Minimum Speed": {
    "pt-br": "Velocidade mínima",
    "fr": "Vitesse minimale",
    "es": "Velocidad mínima"
  },
  "Minimum Speed With Creeper": {
    "pt-br": "Velocidade mínima com marcha superlenta",
    "fr": "Vitesse minimale avec gamme rampante",
    "es": "Velocidad mínima con marcha superlenta"
  },
  "Overall Length Frame To Link": {
    "pt-br": "Comprimento total do chassi à ligação",
    "fr": "Longueur totale du châssis au point d'attelage",
    "es": "Longitud total del bastidor al punto de enganche"
  },
  "Powershift Stages": {
    "pt-br": "Número de estágios Powershift",
    "fr": "Nombre de rapports Powershift",
    "es": "Número de etapas Powershift"
  },
  "PTO Rated Power": {
    "pt-br": "Potência nominal da TDP",
    "fr": "Puissance nominale de la prise de force",
    "es": "Potencia nominal de la TDF"
  },
  "Transmission Gears – Creeper Option": {
    "pt-br": "Marchas da transmissão com opção superlenta",
    "fr": "Rapports de transmission avec option rampante",
    "es": "Marchas de la transmisión con opción superlenta"
  },
  "Transmission Gears – Standard": {
    "pt-br": "Marchas da transmissão de série",
    "fr": "Rapports de transmission de série",
    "es": "Marchas de la transmisión estándar"
  },
  "Width With Tires": {
    "pt-br": "Largura com pneus",
    "fr": "Largeur avec pneus",
    "es": "Anchura con neumáticos"
  },
  "Working Weight – CVT": {
    "pt-br": "Peso em trabalho – CVT",
    "fr": "Masse en travail – CVT",
    "es": "Peso de trabajo – CVT"
  },
  "Working Weight – Powershift": {
    "pt-br": "Peso em trabalho – Powershift",
    "fr": "Masse en travail – Powershift",
    "es": "Peso de trabajo – Powershift"
  },
  "2WD Dingil Mesafesi": {
    "pt-br": "Distância entre eixos em 2WD",
    "fr": "Empattement en 2RM",
    "es": "Distancia entre ejes en 2WD"
  },
  "2WD Toplam Uzunluk": {
    "pt-br": "Comprimento total em 2WD",
    "fr": "Longueur totale en 2RM",
    "es": "Longitud total en 2WD"
  },
  "40 Km/Sa HıZda Motor Devri": {
    "pt-br": "Rotação do motor a 40 km/h",
    "fr": "Régime moteur à 40 km/h",
    "es": "Régimen del motor a 40 km/h"
  },
  "4WD Toplam Uzunluk": {
    "pt-br": "Comprimento total em 4WD",
    "fr": "Longueur totale en 4RM",
    "es": "Longitud total en 4WD"
  },
  "50 Km/Sa HıZda Motor Devri": {
    "pt-br": "Rotação do motor a 50 km/h",
    "fr": "Régime moteur à 50 km/h",
    "es": "Régimen del motor a 50 km/h"
  },
  "60 Km/Sa HıZda Motor Devri": {
    "pt-br": "Rotação do motor a 60 km/h",
    "fr": "Régime moteur à 60 km/h",
    "es": "Régimen del motor a 60 km/h"
  },
  "Arka Aks Merkezinden GPS Antenine YüKseklik": {
    "pt-br": "Altura do centro do eixo traseiro até a antena GPS",
    "fr": "Hauteur de l'axe arrière à l'antenne GPS",
    "es": "Altura desde el centro del eje trasero hasta la antena GPS"
  },
  "Arka Aks Merkezinden Tavan üStüNe YüKseklik": {
    "pt-br": "Altura do centro do eixo traseiro até o teto",
    "fr": "Hauteur de l'axe arrière au toit",
    "es": "Altura desde el centro del eje trasero hasta el techo"
  },
  "Arka çAmurluk GenişLiğI UzatmasıZ": {
    "pt-br": "Largura do para-lama traseiro sem extensão",
    "fr": "Largeur d'aile arrière sans extension",
    "es": "Anchura del guardabarros trasero sin extensión"
  },
  "Arka Iz GenişLiğI Aralığı": {
    "pt-br": "Faixa de largura da bitola traseira",
    "fr": "Plage de voie arrière",
    "es": "Rango de ancho de vía trasera"
  },
  "Arka PTO 1000 IçIn Motor Devri": {
    "pt-br": "Rotação do motor para TDP traseira a 1000 rpm",
    "fr": "Régime moteur pour prise de force arrière à 1000 tr/min",
    "es": "Régimen del motor para TDF trasera a 1000 rpm"
  },
  "Arka PTO 1000E IçIn Motor Devri": {
    "pt-br": "Rotação do motor para TDP traseira a 1000E rpm",
    "fr": "Régime moteur pour prise de force arrière 1000E",
    "es": "Régimen del motor para TDF trasera 1000E"
  },
  "Arka PTO 540E IçIn Motor Devri": {
    "pt-br": "Rotação do motor para TDP traseira a 540E rpm",
    "fr": "Régime moteur pour prise de force arrière 540E",
    "es": "Régimen del motor para TDF trasera 540E"
  },
  "Asgari Yerden YüKseklik": {
    "pt-br": "Vão livre mínimo ao solo",
    "fr": "Garde au sol minimale",
    "es": "Despeje mínimo del suelo"
  },
  "Azami Arka Lastik SeçEnekleri": {
    "pt-br": "Opções de pneus traseiros de maior dimensão",
    "fr": "Options de pneus arrière de plus grande dimension",
    "es": "Opciones de neumáticos traseros de mayor tamaño"
  },
  "Azami öN Lastik SeçEnekleri": {
    "pt-br": "Opções de pneus dianteiros de maior dimensão",
    "fr": "Options de pneus avant de plus grande dimension",
    "es": "Opciones de neumáticos delanteros de mayor tamaño"
  },
  "BağLantı Referansları Arası Uzunluk": {
    "pt-br": "Comprimento entre pontos de referência de ligação",
    "fr": "Longueur entre points de référence d'attelage",
    "es": "Longitud entre puntos de referencia de enganche"
  },
  "Baz DonanıM AğıRlığı": {
    "pt-br": "Peso do equipamento básico",
    "fr": "Masse de l'équipement de base",
    "es": "Peso del equipamiento básico"
  },
  "Cab Height Std Mm": {
    "pt-br": "Altura padrão da cabine (mm)",
    "fr": "Hauteur standard de la cabine (mm)",
    "es": "Altura estándar de la cabina (mm)"
  },
  "ÇAmurluk GenişLiğI Geniş Uzatma Ile": {
    "pt-br": "Largura do para-lama com extensão larga",
    "fr": "Largeur d'aile avec extension large",
    "es": "Anchura del guardabarros con extensión ancha"
  },
  "ÇAmurluk GenişLiğI UzatmasıZ": {
    "pt-br": "Largura do para-lama sem extensão",
    "fr": "Largeur d'aile sans extension",
    "es": "Anchura del guardabarros sin extensión"
  },
  "ÇEki Piminden öLçüLen DöNüş YarıçApı": {
    "pt-br": "Raio de giro medido no pino de engate",
    "fr": "Rayon de braquage mesuré à l'axe d'attelage",
    "es": "Radio de giro medido en el pasador de enganche"
  },
  "ÇEkiş SeçEnekleri": {
    "pt-br": "Opções de tração",
    "fr": "Options de traction",
    "es": "Opciones de tracción"
  },
  "Clutch Diameter Mm": {
    "pt-br": "Diâmetro da embreagem (mm)",
    "fr": "Diamètre d'embrayage (mm)",
    "es": "Diámetro del embrague (mm)"
  },
  "Direksiyon DöNüş AçıSı (1960 Mm Iz)": {
    "pt-br": "Ângulo de direção (bitola 1960 mm)",
    "fr": "Angle de braquage (voie de 1960 mm)",
    "es": "Ángulo de dirección (vía de 1960 mm)"
  },
  "Drive Arrangement": {
    "pt-br": "Configuração de tração",
    "fr": "Configuration de la transmission aux roues",
    "es": "Configuración de tracción"
  },
  "Final Drive Reduction": {
    "pt-br": "Redução final de transmissão",
    "fr": "Rapport de réduction final",
    "es": "Relación de reducción final"
  },
  "Front Track Mm": {
    "pt-br": "Bitola dianteira (mm)",
    "fr": "Voie avant (mm)",
    "es": "Ancho de vía delantero (mm)"
  }
};
