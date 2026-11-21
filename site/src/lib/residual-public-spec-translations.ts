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
    "es": "Diámetro del cilindro"
  },
  "Engine Cooling": {
    "tr": "Motor soğutma sistemi",
    "pt-br": "Arrefecimento do motor",
    "fr": "Refroidissement du moteur",
    "es": "Refrigeración del motor"
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
    "es": "Gamas de la transmisión robotizada"
  },
  "Total Admissible Load": {
    "tr": "İzin verilen toplam yük",
    "pt-br": "Carga total admissível",
    "fr": "Charge totale admissible",
    "es": "Carga total admisible"
  },
  "Tractor Weight": {
    "tr": "Traktör ağırlığı",
    "pt-br": "Peso do trator",
    "fr": "Masse du tracteur",
    "es": "Peso del tractor"
  },
  "Weight With Cab": {
    "tr": "Kabinli ağırlık",
    "pt-br": "Peso com cabine",
    "fr": "Poids avec cabine",
    "es": "Peso con cabina"
  },
  "Agrotechnical Clearance Under Front Axle": {
    "tr": "Ön aks altındaki tarımsal yerden açıklık"
  },
  "Agrotechnical Clearance Under Rear Wheel Tubes": {
    "tr": "Arka tekerlek boruları altındaki tarımsal yerden açıklık"
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
    "es": "Régimen del motor a la potencia declarada (rpm)"
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
    "tr": "Ön diferansiyel kilidi tipi"
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
    "es": "Modos de gamas hidrostáticas"
  },
  "Manufacturer Engine Power (Metric Hp)": {
    "tr": "Üreticinin bildirdiği motor gücü (metrik bg)",
    "pt-br": "Potência do motor declarada pelo fabricante (ch métricos)",
    "fr": "Puissance moteur annoncée par le constructeur (ch métriques)",
    "es": "Potencia del motor declarada por el fabricante (CV métricos)"
  },
  "Manufacturer Rated Power": {
    "tr": "Üreticinin belirttiği nominal güç",
    "pt-br": "Potência nominal indicada pelo fabricante",
    "fr": "Puissance nominale déclarée par le constructeur",
    "es": "Potencia nominal declarada por el fabricante"
  },
  "Manufacturer Selectable Automatic Ranges (SIM)": {
    "tr": "Üreticinin seçilebilir otomatik hız aralıkları (SIM)"
  },
  "Manufacturer Stated Power": {
    "tr": "Üreticinin bildirdiği güç",
    "pt-br": "Potência declarada pelo fabricante",
    "fr": "Puissance indiquée par le constructeur",
    "es": "Potencia declarada por el fabricante"
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
    "es": "Límite del rango de peso ROPS/cabina indicado por el fabricante (condición de carga no especificada)"
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
    "es": "Velocidad máxima de avance"
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
    "es": "Velocidad máxima de retroceso"
  },
  "Minimum Forward Speed": {
    "pt-br": "Velocidade mínima em marcha à frente",
    "fr": "Vitesse minimale en marche avant",
    "es": "Velocidad mínima de avance"
  },
  "Minimum Reverse Speed": {
    "pt-br": "Velocidade mínima em marcha à ré",
    "fr": "Vitesse minimale en marche arrière",
    "es": "Velocidad mínima de retroceso"
  },
  "Length Without Front Linkage": {
    "pt-br": "Comprimento sem engate frontal",
    "fr": "Longueur sans relevage avant",
    "es": "Longitud sin enganche delantero"
  },
  "Maker ROPS/Cab Weight Bound (Equipment-Dependent)": {
    "pt-br": "Limite de peso ROPS/cabine declarado pelo fabricante (dependente do equipamento)",
    "fr": "Limite de masse ROPS/cabine indiqué par le constructeur (selon l’équipement)",
    "es": "Límite de peso ROPS/cabina declarado por el fabricante (según equipamiento)"
  },
  "Standart şAnzıMan": {
    "pt-br": "Transmissão de série",
    "fr": "Transmission de série",
    "es": "Transmisión estándar"
  },
  "Weight (Kg)": {
    "pt-br": "Peso (kg)",
    "fr": "Poids (kg)",
    "es": "Peso (kg)"
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
    "es": "Peso con estructura ROPS"
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
    "es": "Configuración de la dirección"
  },
  "Steering Max Angle Deg": {
    "pt-br": "Ângulo máximo de esterçamento (°)",
    "fr": "Angle de braquage maximal (°)",
    "es": "Ángulo máximo de giro de la dirección (°)"
  },
  "Steering System": {
    "pt-br": "Sistema de direção",
    "fr": "Système de direction",
    "es": "Sistema de dirección"
  },
  "Rear PTO Shaft": {
    "pt-br": "Eixo da TDP traseira",
    "fr": "Arbre de prise de force arrière",
    "es": "Eje de la TDF trasera"
  },
  "Weight Without Ballast": {
    "pt-br": "Peso sem lastro",
    "fr": "Poids sans lest",
    "es": "Peso sin lastre"
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
    "es": "Control de la transmisión"
  }
};
