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
    "tr": "Vites sayısı"
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
    "es": "Carrera del pistón"
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
    "ja": "トラクター重量"
  },
  "Weight With Cab": {
    "tr": "Kabinli ağırlık",
    "pt-br": "Peso com cabine",
    "fr": "Poids avec cabine",
    "es": "Peso con cabina"
  },
  "Agrotechnical Clearance Under Front Axle": {
    "tr": "Ön aks altındaki tarımsal yerden açıklık",
    "ru": "Агротехнический просвет под передним мостом"
  },
  "Agrotechnical Clearance Under Rear Wheel Tubes": {
    "tr": "Arka tekerlek boruları altındaki tarımsal yerden açıklık",
    "ru": "Агротехнический просвет под трубами задних колёс"
  },
  "Available Transmission Options": {
    "tr": "Mevcut şanzıman seçenekleri",
    "pt-br": "Opções de transmissão disponíveis",
    "fr": "Options de transmission disponibles",
    "es": "Opciones de transmisión disponibles"
  },
  "Clutch Configuration": {
    "tr": "Debriyaj düzeni"
  },
  "Clutch Standard": {
    "tr": "Standart debriyaj",
    "pt-br": "Embreagem de série",
    "fr": "Embrayage de série",
    "es": "Embrague de serie"
  },
  "Creeper Gearbox Option": {
    "tr": "Sürüngen vitesli şanzıman seçeneği"
  },
  "Driven Wheels": {
    "tr": "Tahrik edilen tekerlekler"
  },
  "Engine Maker": {
    "tr": "Motor üreticisi"
  },
  "Engine Rpm At Stated Power": {
    "tr": "Bildirilen motor gücündeki devir (dev/dak)",
    "pt-br": "Rotação do motor na potência declarada (rpm)",
    "fr": "Régime moteur à la puissance indiquée (tr/min)",
    "es": "Régimen del motor a la potencia declarada (rpm)",
    "de": "Motordrehzahl bei angegebener Leistung",
    "zh": "标称功率下的发动机转速",
    "ru": "Обороты двигателя при заявленной мощности",
    "ja": "公表出力時のエンジン回転数"
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
    "tr": "İleri/geri vites seçenekleri"
  },
  "Front Diff Lock Type": {
    "tr": "Ön diferansiyel kilidi tipi",
    "ru": "Тип блокировки переднего дифференциала"
  },
  "Front Tire (Main Configuration)": {
    "tr": "Ön lastik (ana yapılandırma)"
  },
  "Front Tyre Size": {
    "tr": "Ön lastik ölçüsü",
    "pt-br": "Dimensão do pneu dianteiro",
    "fr": "Dimension du pneu avant",
    "es": "Medida del neumático delantero"
  },
  "Front Wheel Track": {
    "tr": "Ön tekerlek iz genişliği"
  },
  "Height To ROPS Arc Top": {
    "tr": "ROPS kemerinin üst noktasına kadar yükseklik"
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
    "ja": "メーカー公表のエンジン出力（メートル馬力）"
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
    "tr": "Üreticinin bildirdiği traktör ağırlığı"
  },
  "Max Speed Variants": {
    "tr": "Azami hız varyantları"
  },
  "Maximum Road Speed (ECO, Tyre Dependent)": {
    "tr": "Azami yol hızı (ECO, lastiğe bağlı)"
  },
  "Operating Weight (Brochure Configuration)": {
    "tr": "Çalışma ağırlığı (broşürdeki yapılandırma)"
  },
  "Operating Weight Without Ballast": {
    "tr": "Balastsız çalışma ağırlığı"
  },
  "Overall Width Between Rear Wheels": {
    "tr": "Arka tekerlekler arasındaki toplam genişlik"
  },
  "Rear 3-Point Draft/Implement Depth Control": {
    "tr": "Arka üç nokta askı sisteminde çeki kuvveti/ekipman derinliği kontrolü",
    "pt-br": "Controle de esforço/profundidade do implemento no engate traseiro de três pontos",
    "fr": "Contrôle d’effort/de profondeur de l’outil sur l’attelage arrière trois points",
    "es": "Control de esfuerzo/profundidad del implemento en el enganche trasero de tres puntos"
  },
  "Rear Diff Lock Type": {
    "tr": "Arka diferansiyel kilidi tipi"
  },
  "Rear Remote Valve Sets": {
    "tr": "Arka hidrolik kumanda valfi grupları"
  },
  "Rear Tire (Main Configuration)": {
    "tr": "Arka lastik (ana yapılandırma)"
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
    "tr": "Yerden açıklık (ana lastik yapılandırması)"
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
    "tr": "Standart ön lastik ölçüsü"
  },
  "Standard Rear Tire Size": {
    "tr": "Standart arka lastik ölçüsü"
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
    "tr": "Şanzıman vitesleri"
  },
  "Transmission Option Hilo": {
    "tr": "HiLo şanzıman seçeneği"
  },
  "Transmission Option Hml": {
    "tr": "HML şanzıman seçeneği"
  },
  "Transmission Shuttle Type": {
    "tr": "Şanzıman ileri-geri yön değiştirme tipi"
  },
  "Weight With Roll Bar": {
    "tr": "Devrilme koruma barıyla ağırlık"
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
    "zh": "制造商公布的 ROPS/驾驶室重量范围界限（载荷状态未注明）"
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
    "ru": "Масса без балласта"
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
    "hi": "इंजन का शीतलन प्रकार"
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
    "ja": "最高出力時のエンジン回転数"
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
    "ja": "記載出力時のエンジン回転数"
  },
  "Manufacturer-Stated Engine Power (KW, Test Standard Unspecified)": {
    "ja": "メーカー公表エンジン出力（kW、試験規格未記載）"
  },
  "Operator Station / Cab": {
    "ja": "運転席／キャブ"
  },
  "Reverse Gears (12F+12R Gearbox Option)": {
    "ja": "後進段数（12F+12R変速機オプション）"
  },
  "Fuel Capacity – Large Tank Option": {
    "de": "Kraftstoffvolumen – großer Tank als Option"
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
    "de": "Herstellerangabe zur Gewichtsgrenze von Kabine/ROPS (Beladungszustand nicht angegeben)"
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
    "ru": "Ширина передней колеи"
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
    "ru": "Эксплуатационная масса с балластом"
  },
  "Air Cleaner": {
    "ru": "Воздушный фильтр"
  },
  "Engine Max Torque Rpm": {
    "ru": "Обороты двигателя при максимальном крутящем моменте"
  }
};
