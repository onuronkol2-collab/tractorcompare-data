import type { Locale } from "./locales.ts";

/**
 * Technical term glossary. Order: Chinese, Hindi, Brazilian Portuguese,
 * French, German, Russian, Japanese, Spanish.
 *
 * Translate concepts, not measured values. The stored source measurements,
 * variants, standards and manufacturer-specific names are never rewritten.
 */
const TERM: Record<string, readonly string[]> = {
  // Provenance-aware engineering labels; do not equate a marketing category with measured rated power.
  engine_hp_category: ["厂家标示的马力级别（非实测功率）","निर्माता की HP श्रेणी (मापी गई इंजन शक्ति नहीं)","Categoria de HP informada pelo fabricante (não é potência medida)","Catégorie HP du constructeur (ce n’est pas une puissance mesurée)","Hersteller-PS-Klasse (keine gemessene Motorleistung)","Категория мощности HP по данным производителя (не измеренная мощность)","メーカー公称HP区分（実測出力ではない）","Categoría HP del fabricante (no es potencia medida)"],
  manufacturer_engine_power_unspecified_standard: ["制造商公布的发动机功率（未说明测试标准）","निर्माता की बताई इंजन शक्ति (परीक्षण मानक निर्दिष्ट नहीं)","Potência do motor declarada pelo fabricante (norma de ensaio não informada)","Puissance moteur déclarée par le constructeur (norme d’essai non précisée)","Motorleistung laut Hersteller (Prüfnorm nicht angegeben)","Мощность двигателя по данным производителя (стандарт измерения не указан)","メーカー公表のエンジン出力（測定規格の記載なし）","Potencia del motor declarada por el fabricante (norma de ensayo no indicada)"],
  manufacturer_max_pto_power_unspecified_standard: ["制造商公布的最大动力输出轴功率（未说明测试标准）","निर्माता के अनुसार अधिकतम PTO शक्ति (परीक्षण मानक नहीं दिया गया)","Potência máxima na TDP declarada pelo fabricante (norma não informada)","Puissance maximale à la prise de force déclarée (norme d’essai non précisée)","Maximale Zapfwellenleistung laut Hersteller (Prüfnorm nicht angegeben)","Максимальная мощность ВОМ по данным производителя (стандарт не указан)","メーカー公表の最大PTO出力（測定規格の記載なし）","Potencia máxima en la TDF declarada por el fabricante (norma no indicada)"],
  manufacturer_f25_rops_weight_unscoped: ["F25配备ROPS的重量（变速箱版本未注明）","F25 का ROPS सहित वज़न (ट्रांसमिशन संस्करण नहीं बताया गया)","Peso do F25 com ROPS (versão de transmissão não indicada)","Masse du F25 avec ROPS (version de transmission non précisée)","F25-Gewicht mit Überrollschutz (Getriebevariante nicht angegeben)","Масса F25 с ROPS (вариант коробки передач не указан)","F25のROPS装備重量（変速機仕様の指定なし）","Peso del F25 con ROPS (variante de transmisión sin especificar)"],
  weight_unspecified: ["重量（载荷状态未注明）","वज़न (भार की स्थिति निर्दिष्ट नहीं)","Peso (condição de carga não informada)","Masse (conditions de charge non précisées)","Gewicht (Beladungszustand nicht angegeben)","Масса (состояние загрузки не указано)","重量（積載状態の記載なし）","Peso (estado de carga sin especificar)"],
  transmission_configuration: ["变速箱配置","ट्रांसमिशन विन्यास","Configuração da transmissão","Configuration de la transmission","Getriebekonfiguration","Конфигурация трансмиссии","変速機の仕様","Configuración de la transmisión"],
  engine_aspiration: ["进气方式","इंजन एयर इंडक्शन","Aspiração do motor","Admission du moteur","Ansaugart des Motors","Система впуска двигателя","吸気方式","Aspiración del motor"],
  engine_cylinders: ["气缸数","सिलेंडरों की संख्या","Número de cilindros","Nombre de cylindres","Zylinderzahl","Количество цилиндров","気筒数","Número de cilindros"],
  engine_displacement: ["发动机排量","इंजन विस्थापन","Cilindrada do motor","Cylindrée du moteur","Hubraum","Рабочий объём двигателя","総排気量","Cilindrada del motor"],
  engine_emission_standard: ["排放标准","उत्सर्जन मानक","Norma de emissões","Norme d’émissions","Abgasnorm","Экологический стандарт","排出ガス規制","Norma de emisiones"],
  engine_model: ["发动机型号","इंजन मॉडल","Modelo do motor","Modèle du moteur","Motormodell","Модель двигателя","エンジン型式","Modelo de motor"],
  engine_make: ["发动机制造商","इंजन निर्माता","Fabricante do motor","Constructeur du moteur","Motorhersteller","Производитель двигателя","エンジンメーカー","Fabricante del motor"],
  engine_max_power: ["发动机最大功率","अधिकतम इंजन पावर","Potência máxima do motor","Puissance maximale du moteur","Maximale Motorleistung","Максимальная мощность двигателя","エンジン最高出力","Potencia máxima del motor"],
  engine_power: ["发动机功率","इंजन पावर","Potência do motor","Puissance du moteur","Motorleistung","Мощность двигателя","エンジン出力","Potencia del motor"],
  engine_rated_power: ["发动机额定功率","इंजन की रेटेड पावर","Potência nominal do motor","Puissance nominale du moteur","Motornennleistung","Номинальная мощность двигателя","エンジン定格出力","Potencia nominal del motor"],
  engine_max_power_rpm: ["最大功率转速","अधिकतम पावर पर इंजन RPM","Rotação na potência máxima","Régime à la puissance maximale","Drehzahl bei maximaler Leistung","Обороты при максимальной мощности","最高出力時エンジン回転数","Régimen a potencia máxima"],
  engine_rated_speed: ["额定发动机转速","रेटेड इंजन RPM","Rotação nominal do motor","Régime nominal du moteur","Nenndrehzahl des Motors","Номинальные обороты двигателя","定格エンジン回転数","Régimen nominal del motor"],
  engine_rated_rpm: ["额定发动机转速","रेटेड इंजन RPM","Rotação nominal do motor","Régime nominal du moteur","Nenndrehzahl des Motors","Номинальные обороты двигателя","定格エンジン回転数","Régimen nominal del motor"],
  engine_torque: ["发动机扭矩","इंजन टॉर्क","Torque do motor","Couple moteur","Motordrehmoment","Крутящий момент двигателя","エンジントルク","Par motor"],
  engine_torque_rpm: ["最大扭矩转速","अधिकतम टॉर्क पर इंजन RPM","Rotação no torque máximo","Régime au couple maximal","Drehzahl bei maximalem Drehmoment","Обороты при максимальном крутящем моменте","最大トルク発生回転数","Régimen a par máximo"],
  engine_torque_rated_rpm: ["最大扭矩转速","अधिकतम टॉर्क पर इंजन RPM","Rotação no torque máximo","Régime au couple maximal","Drehzahl bei maximalem Drehmoment","Обороты при максимальном крутящем моменте","最大トルク発生回転数","Régimen a par máximo"],
  engine_torque_rise: ["扭矩储备率","टॉर्क रिज़र्व","Reserva de torque","Réserve de couple","Drehmomentanstieg","Запас крутящего момента","トルク上昇率","Reserva de par"],
  torque_reserve: ["扭矩储备率","टॉर्क रिज़र्व","Reserva de torque","Réserve de couple","Drehmomentanstieg","Запас крутящего момента","トルク上昇率","Reserva de par"],
  engine_torque_with_boost: ["增压扭矩","बूस्ट के साथ टॉर्क","Torque com reforço de potência","Couple avec surpuissance","Drehmoment mit Boost","Крутящий момент с повышением мощности","ブースト時トルク","Par con sobrepotencia"],
  fuel_injection_system: ["燃油喷射系统","ईंधन इंजेक्शन प्रणाली","Sistema de injeção de combustível","Système d’injection","Kraftstoffeinspritzung","Система впрыска топлива","燃料噴射方式","Sistema de inyección de combustible"],
  fuel_injection_pressure: ["燃油喷射压力","ईंधन इंजेक्शन दबाव","Pressão de injeção","Pression d’injection","Einspritzdruck","Давление впрыска","燃料噴射圧力","Presión de inyección"],
  engine_fuel_system: ["燃油供给系统","ईंधन आपूर्ति प्रणाली","Sistema de alimentação de combustível","Système d’alimentation en carburant","Kraftstoffsystem","Топливная система","燃料供給方式","Sistema de alimentación de combustible"],
  engine_fuel_type: ["燃料类型","ईंधन का प्रकार","Tipo de combustível","Type de carburant","Kraftstoffart","Тип топлива","燃料の種類","Tipo de combustible"],
  engine_gross_power: ["发动机总功率","सकल इंजन पावर","Potência bruta do motor","Puissance brute du moteur","Bruttomotorleistung","Полная мощность двигателя","エンジン総出力","Potencia bruta del motor"],
  engine_net_power: ["发动机净功率","शुद्ध इंजन पावर","Potência líquida do motor","Puissance nette du moteur","Netto-Motorleistung","Полезная мощность двигателя","エンジン正味出力","Potencia neta del motor"],
  engine_gross_power_kw: ["发动机总功率（kW）","सकल इंजन पावर (kW)","Potência bruta do motor (kW)","Puissance brute du moteur (kW)","Bruttomotorleistung (kW)","Полная мощность двигателя (кВт)","エンジン総出力（kW）","Potencia bruta del motor (kW)"],
  engine_power_kw: ["发动机功率（kW）","इंजन पावर (kW)","Potência do motor (kW)","Puissance du moteur (kW)","Motorleistung (kW)","Мощность двигателя (кВт)","エンジン出力（kW）","Potencia del motor (kW)"],
  engine_max_power_kw: ["最大功率（kW）","अधिकतम पावर (kW)","Potência máxima (kW)","Puissance maximale (kW)","Maximalleistung (kW)","Максимальная мощность (кВт)","最大出力（kW）","Potencia máxima (kW)"],
  engine_max_power_iso_14396: ["最大功率（ISO 14396）","अधिकतम पावर (ISO 14396)","Potência máxima (ISO 14396)","Puissance maximale (ISO 14396)","Maximalleistung (ISO 14396)","Максимальная мощность (ISO 14396)","最大出力（ISO 14396）","Potencia máxima (ISO 14396)"],
  engine_max_power_sae_j1995: ["最大功率（SAE J1995）","अधिकतम पावर (SAE J1995)","Potência máxima (SAE J1995)","Puissance maximale (SAE J1995)","Maximalleistung (SAE J1995)","Максимальная мощность (SAE J1995)","最大出力（SAE J1995）","Potencia máxima (SAE J1995)"],
  engine_max_power_with_boost: ["增压时最大功率","बूस्ट के साथ अधिकतम पावर","Potência máxima com reforço","Puissance maximale avec surpuissance","Maximalleistung mit Boost","Максимальная мощность с повышением","ブースト時最高出力","Potencia máxima con sobrepotencia"],
  engine_rated_power_with_ipm: ["IPM模式额定功率","IPM के साथ रेटेड पावर","Potência nominal com IPM","Puissance nominale avec IPM","Nennleistung mit IPM","Номинальная мощность с IPM","IPM使用時定格出力","Potencia nominal con IPM"],
  engine_max_power_with_ipm: ["IPM模式最大功率","IPM के साथ अधिकतम पावर","Potência máxima com IPM","Puissance maximale avec IPM","Maximalleistung mit IPM","Максимальная мощность с IPM","IPM使用時最高出力","Potencia máxima con IPM"],
  engine_max_power_with_epm: ["EPM模式最大功率","EPM के साथ अधिकतम पावर","Potência máxima com EPM","Puissance maximale avec EPM","Maximalleistung mit EPM","Максимальная мощность с EPM","EPM使用時最高出力","Potencia máxima con EPM"],
  engine_torque_with_epm: ["EPM模式扭矩","EPM के साथ टॉर्क","Torque com EPM","Couple avec EPM","Drehmoment mit EPM","Крутящий момент с EPM","EPM使用時トルク","Par con EPM"],
  engine_cooling_system: ["发动机冷却系统","इंजन कूलिंग प्रणाली","Sistema de arrefecimento do motor","Système de refroidissement du moteur","Motorkühlsystem","Система охлаждения двигателя","エンジン冷却方式","Sistema de refrigeración del motor"],
  cooling_system: ["冷却系统","कूलिंग प्रणाली","Sistema de arrefecimento","Système de refroidissement","Kühlsystem","Система охлаждения","冷却方式","Sistema de refrigeración"],
  engine_air_cleaner: ["空气滤清器","एयर फ़िल्टर","Filtro de ar","Filtre à air","Luftfilter","Воздушный фильтр","エアクリーナー","Filtro de aire"],
  engine_oil_capacity: ["发动机机油容量","इंजन ऑयल क्षमता","Capacidade de óleo do motor","Capacité d’huile moteur","Motorölfüllmenge","Объём моторного масла","エンジンオイル容量","Capacidad de aceite del motor"],
  engine_bore: ["缸径","सिलेंडर बोर","Diâmetro do cilindro","Alésage","Bohrung","Диаметр цилиндра","ボア","Diámetro del cilindro"],
  engine_stroke: ["活塞行程","पिस्टन स्ट्रोक","Curso do pistão","Course du piston","Hub","Ход поршня","ストローク","Carrera del pistón"],
  engine_valves: ["气门数","वाल्वों की संख्या","Número de válvulas","Nombre de soupapes","Ventilanzahl","Число клапанов","バルブ数","Número de válvulas"],
  transmission_type: ["变速箱类型","ट्रांसमिशन का प्रकार","Tipo de transmissão","Type de transmission","Getriebeart","Тип трансмиссии","変速機形式","Tipo de transmisión"],
  transmission_description: ["变速箱说明","ट्रांसमिशन विवरण","Descrição da transmissão","Description de la transmission","Getriebebeschreibung","Описание трансмиссии","変速機の説明","Descripción de la transmisión"],
  transmission_options: ["变速箱选项","ट्रांसमिशन विकल्प","Opções de transmissão","Options de transmission","Getriebevarianten","Варианты трансмиссии","変速機オプション","Opciones de transmisión"],
  transmission_forward_gears: ["前进挡位数","आगे के गियर","Marchas à frente","Rapports avant","Vorwärtsgänge","Число передач вперёд","前進段数","Marchas adelante"],
  transmission_reverse_gears: ["倒挡位数","रिवर्स गियर","Marchas à ré","Rapports arrière","Rückwärtsgänge","Число передач назад","後進段数","Marchas atrás"],
  transmission_gear_configuration: ["挡位配置","गियर विन्यास","Configuração de marchas","Configuration des rapports","Gangkonfiguration","Схема передач","変速段構成","Configuración de marchas"],
  clutch_type: ["离合器类型","क्लच का प्रकार","Tipo de embreagem","Type d’embrayage","Kupplungsart","Тип сцепления","クラッチ形式","Tipo de embrague"],
  brake_type: ["制动系统类型","ब्रेक का प्रकार","Tipo de freio","Type de freins","Bremsenart","Тип тормозов","ブレーキ形式","Tipo de frenos"],
  steering_type: ["转向系统类型","स्टीयरिंग का प्रकार","Tipo de direção","Type de direction","Lenkungsart","Тип рулевого управления","操舵方式","Tipo de dirección"],
  drive_configuration: ["驱动形式","ड्राइव विन्यास","Tipo de tração","Configuration de transmission","Antriebsart","Колёсная формула","駆動方式","Tipo de tracción"],
  front_axle_drive: ["前桥驱动","फ्रंट एक्सल ड्राइव","Tração do eixo dianteiro","Entraînement du pont avant","Vorderachsantrieb","Привод переднего моста","前輪駆動装置","Tracción del eje delantero"],
  front_tire_size: ["前轮胎规格","अगले टायर का आकार","Medida do pneu dianteiro","Dimensions des pneus avant","Vorderreifengröße","Размер передних шин","前輪タイヤサイズ","Medida del neumático delantero"],
  rear_tire_size: ["后轮胎规格","पिछले टायर का आकार","Medida do pneu traseiro","Dimensions des pneus arrière","Hinterreifengröße","Размер задних шин","後輪タイヤサイズ","Medida del neumático trasero"],
  pto_speeds: ["动力输出轴转速","पीटीओ की गति","Rotações da TDP","Régimes de prise de force","Zapfwellendrehzahlen","Частота вращения ВОМ","PTO回転数","Velocidades de la TDF"],
  pto_nominal_speed: ["动力输出轴额定转速","पीटीओ की नाममात्र गति","Rotação nominal da TDP","Régime nominal de prise de force","Zapfwellen-Nenndrehzahl","Номинальные обороты ВОМ","PTO定格回転数","Velocidad nominal de la TDF"],
  pto_type: ["动力输出轴类型","पीटीओ का प्रकार","Tipo de TDP","Type de prise de force","Zapfwellenart","Тип ВОМ","PTO形式","Tipo de TDF"],
  pto_power: ["动力输出轴功率","पीटीओ पावर","Potência na TDP","Puissance à la prise de force","Zapfwellenleistung","Мощность на ВОМ","PTO出力","Potencia de la TDF"],
  pto_power_kw: ["动力输出轴功率（kW）","पीटीओ पावर (kW)","Potência na TDP (kW)","Puissance à la prise de force (kW)","Zapfwellenleistung (kW)","Мощность ВОМ (кВт)","PTO出力（kW）","Potencia de la TDF (kW)"],
  pto_engine_speed: ["动力输出轴对应发动机转速","पीटीओ गति के लिए इंजन RPM","Rotação do motor para TDP","Régime moteur pour la prise de force","Motordrehzahl für die Zapfwelle","Обороты двигателя для ВОМ","PTO使用時エンジン回転数","Régimen del motor para la TDF"],
  pto_control: ["动力输出轴控制方式","पीटीओ नियंत्रण","Comando da TDP","Commande de prise de force","Zapfwellenbedienung","Управление ВОМ","PTO操作方式","Control de la TDF"],
  hydraulic_main_flow: ["主液压泵流量","मुख्य हाइड्रोलिक पंप प्रवाह","Vazão da bomba hidráulica principal","Débit de la pompe hydraulique principale","Förderleistung der Haupthydraulikpumpe","Подача основного гидронасоса","主油圧ポンプ流量","Caudal de la bomba hidráulica principal"],
  hydraulic_total_flow: ["液压总流量","कुल हाइड्रोलिक प्रवाह","Vazão hidráulica total","Débit hydraulique total","Hydraulik-Gesamtförderstrom","Общий расход гидросистемы","油圧総流量","Caudal hidráulico total"],
  hydraulic_implement_flow: ["机具液压流量","इम्प्लीमेंट हाइड्रोलिक प्रवाह","Vazão hidráulica para implementos","Débit hydraulique des outils","Hydraulikförderstrom für Arbeitsgeräte","Расход гидравлики навесного оборудования","作業機用油圧流量","Caudal hidráulico para implementos"],
  hydraulic_steering_flow: ["转向液压流量","स्टीयरिंग हाइड्रोलिक प्रवाह","Vazão hidráulica da direção","Débit hydraulique de direction","Lenkhydraulik-Förderstrom","Расход гидросистемы рулевого управления","操舵用油圧流量","Caudal hidráulico de dirección"],
  hydraulic_pressure: ["液压系统压力","हाइड्रोलिक दबाव","Pressão do sistema hidráulico","Pression du circuit hydraulique","Hydraulikdruck","Давление гидросистемы","油圧系統圧力","Presión del sistema hidráulico"],
  hydraulic_lift_capacity: ["液压提升能力","हाइड्रोलिक उठाने की क्षमता","Capacidade de levante hidráulico","Capacité de relevage hydraulique","Hydraulische Hubkraft","Грузоподъёмность гидравлики","油圧揚力","Capacidad de elevación hidráulica"],
  rear_lift_capacity: ["后悬挂提升能力","पिछली लिफ्ट क्षमता","Capacidade do levante traseiro","Capacité de relevage arrière","Heckhubkraft","Грузоподъёмность задней навески","後部リフト能力","Capacidad de elevación trasera"],
  front_lift_capacity: ["前悬挂提升能力","अगली लिफ्ट क्षमता","Capacidade do levante dianteiro","Capacité de relevage avant","Fronthubkraft","Грузоподъёмность передней навески","フロントリフト能力","Capacidad de elevación delantera"],
  front_hitch_lift_capacity: ["前悬挂提升能力","अगली लिफ्ट क्षमता","Capacidade do levante dianteiro","Capacité de relevage avant","Fronthubkraft","Грузоподъёмность передней навески","フロントリフト能力","Capacidad de elevación delantera"],
  hydraulic_remote_count: ["后部液压输出接口数","रिमोट हाइड्रोलिक आउटलेट संख्या","Número de saídas hidráulicas remotas","Nombre de distributeurs hydrauliques","Anzahl hydraulischer Steuergeräte","Количество гидровыводов","外部油圧取出口数","Número de tomas hidráulicas remotas"],
  hydraulic_valve_count: ["液压阀门/接口数","हाइड्रोलिक वाल्व/आउटलेट","Válvulas/saídas hidráulicas","Distributeurs/sorties hydrauliques","Hydraulikventile/Anschlüsse","Клапаны/выходы гидравлики","油圧バルブ・取出口数","Válvulas/salidas hidráulicas"],
  hydraulic_remote_valve_count: ["外部液压阀数量","रिमोट हाइड्रोलिक वाल्व","Número de válvulas hidráulicas remotas","Nombre de distributeurs hydrauliques auxiliaires","Anzahl Zusatzsteuergeräte","Количество дополнительных гидрораспределителей","外部油圧バルブ数","Número de válvulas hidráulicas remotas"],
  hydraulic_pump_type: ["液压泵类型","हाइड्रोलिक पंप का प्रकार","Tipo de bomba hidráulica","Type de pompe hydraulique","Hydraulikpumpentyp","Тип гидронасоса","油圧ポンプ形式","Tipo de bomba hidráulica"],
  hydraulic_lift_control: ["提升系统控制方式","लिफ्ट नियंत्रण","Controle do levante","Commande de relevage","Hubwerksregelung","Управление навеской","リフト制御方式","Control de elevación"],
  hydraulic_system_type: ["液压系统类型","हाइड्रोलिक सिस्टम का प्रकार","Tipo de sistema hidráulico","Type de circuit hydraulique","Hydrauliksystemart","Тип гидросистемы","油圧システム形式","Tipo de sistema hidráulico"],
  rear_hitch_category: ["后三点悬挂类别","पिछली तीन-बिंदु लिंकेज श्रेणी","Categoria do engate traseiro","Catégorie de l’attelage trois points arrière","Kategorie der Heckdreipunktaufhängung","Категория задней трёхточечной навески","後部3点リンクのカテゴリー","Categoría del enganche trasero de tres puntos"],
  three_point_linkage_category: ["三点悬挂类别","तीन-बिंदु लिंकेज श्रेणी","Categoria do engate de três pontos","Catégorie de l’attelage trois points","Dreipunkt-Kategorie","Категория трёхточечной навески","3点リンクカテゴリー","Categoría del enganche de tres puntos"],
  top_link_category: ["上拉杆类别","टॉप लिंक श्रेणी","Categoria do terceiro ponto","Catégorie du troisième point","Oberlenkerkategorie","Категория верхней тяги","トップリンクカテゴリー","Categoría del tercer punto"],
  rear_track_width: ["后轮轮距","पिछला ट्रैक चौड़ाई","Bitola traseira","Voie arrière","Hintere Spurweite","Колея задних колёс","後輪トレッド","Ancho de vía trasera"],
  wheelbase: ["轴距","व्हीलबेस","Distância entre eixos","Empattement","Radstand","Колёсная база","ホイールベース","Distancia entre ejes"],
  overall_length: ["整机长度","कुल लंबाई","Comprimento total","Longueur hors tout","Gesamtlänge","Общая длина","全長","Longitud total"],
  overall_width: ["整机宽度","कुल चौड़ाई","Largura total","Largeur hors tout","Gesamtbreite","Общая ширина","全幅","Anchura total"],
  overall_height: ["整机高度","कुल ऊँचाई","Altura total","Hauteur hors tout","Gesamthöhe","Общая высота","全高","Altura total"],
  ground_clearance: ["最小离地间隙","ग्राउंड क्लीयरेंस","Vão livre do solo","Garde au sol","Bodenfreiheit","Дорожный просвет","最低地上高","Distancia libre al suelo"],
  weight_kg: ["工作重量","कार्य भार","Peso operacional","Poids en ordre de marche","Betriebsgewicht","Эксплуатационная масса","作業時重量","Peso operativo"],
  operating_weight_cab: ["驾驶室型工作重量","केबिन के साथ कार्य भार","Peso operacional com cabine","Poids en ordre de marche avec cabine","Betriebsgewicht mit Kabine","Эксплуатационная масса с кабиной","キャブ付き作業時重量","Peso operativo con cabina"],
  operating_weight_no_cab: ["无驾驶室工作重量","बिना केबिन कार्य भार","Peso operacional sem cabine","Poids en ordre de marche sans cabine","Betriebsgewicht ohne Kabine","Эксплуатационная масса без кабины","キャブなし作業時重量","Peso operativo sin cabina"],
  weight_with_cab: ["驾驶室型重量","केबिन के साथ वज़न","Peso com cabine","Poids avec cabine","Gewicht mit Kabine","Масса с кабиной","キャブ付き重量","Peso con cabina"],
  weight_without_cab: ["无驾驶室重量","बिना केबिन वज़न","Peso sem cabine","Poids sans cabine","Gewicht ohne Kabine","Масса без кабины","キャブなし重量","Peso sin cabina"],
  weight_with_rops: ["ROPS型重量","ROPS के साथ वज़न","Peso com ROPS","Poids avec ROPS","Gewicht mit ROPS","Масса с ROPS","ROPS仕様重量","Peso con ROPS"],
  weight_range: ["重量范围","वज़न सीमा","Faixa de peso","Plage de poids","Gewichtsbereich","Диапазон массы","重量範囲","Intervalo de peso"],
  gross_vehicle_weight: ["车辆总重量","सकल वाहन भार","Peso bruto total","Poids total autorisé","Zulässiges Gesamtgewicht","Полная масса машины","車両総重量","Peso bruto total"],
  maximum_permissible_gross_weight: ["最大允许总重量","अधिकतम अनुमत सकल भार","Peso bruto máximo permitido","Poids total maximal autorisé","Zulässiges Höchstgesamtgewicht","Максимальная допустимая полная масса","最大許容総重量","Peso bruto máximo autorizado"],
  fuel_tank_capacity: ["燃油箱容量","ईंधन टैंक क्षमता","Capacidade do tanque de combustível","Capacité du réservoir à carburant","Kraftstofftankvolumen","Ёмкость топливного бака","燃料タンク容量","Capacidad del depósito de combustible"],
  adblue_tank_capacity: ["AdBlue尿素箱容量","AdBlue टैंक क्षमता","Capacidade do tanque de AdBlue","Capacité du réservoir AdBlue","AdBlue-Tankvolumen","Ёмкость бака AdBlue","AdBlueタンク容量","Capacidad del depósito de AdBlue"],
  coolant_capacity: ["冷却液容量","कूलेंट क्षमता","Capacidade do líquido de arrefecimento","Capacité de liquide de refroidissement","Kühlmittelmenge","Объём охлаждающей жидкости","冷却液容量","Capacidad de refrigerante"],
  transmission_hydraulic_system_capacity: ["变速箱/液压系统油液容量","ट्रांसमिशन/हाइड्रोलिक तेल क्षमता","Capacidade de óleo da transmissão/hidráulica","Capacité d’huile transmission/hydraulique","Getriebe-/Hydraulikölfüllmenge","Объём масла трансмиссии/гидравлики","変速機・油圧系統オイル容量","Capacidad de aceite de transmisión/hidráulica"],
  maximum_speed: ["最高车速","अधिकतम गति","Velocidade máxima","Vitesse maximale","Höchstgeschwindigkeit","Максимальная скорость","最高速度","Velocidad máxima"],
  maximum_road_speed: ["最高道路行驶速度","अधिकतम सड़क गति","Velocidade máxima em estrada","Vitesse routière maximale","Höchstgeschwindigkeit auf der Straße","Максимальная транспортная скорость","最高走行速度","Velocidad máxima en carretera"],
  minimum_speed: ["最低车速","न्यूनतम गति","Velocidade mínima","Vitesse minimale","Mindestgeschwindigkeit","Минимальная скорость","最低速度","Velocidad mínima"],
  alternator: ["交流发电机","अल्टरनेटर","Alternador","Alternateur","Lichtmaschine","Генератор","オルタネーター","Alternador"],
  alternator_current: ["发电机输出电流","अल्टरनेटर आउटपुट करंट","Corrente de saída do alternador","Courant de sortie de l’alternateur","Generatorausgangsstrom","Выходной ток генератора","オルタネーター出力電流","Corriente de salida del alternador"],
  alternator_voltage: ["发电机输出电压","अल्टरनेटर वोल्टेज","Tensão do alternador","Tension de l’alternateur","Generatorspannung","Напряжение генератора","オルタネーター電圧","Voltaje del alternador"],
  battery_capacity: ["蓄电池容量","बैटरी क्षमता","Capacidade da bateria","Capacité de batterie","Batteriekapazität","Ёмкость аккумулятора","バッテリー容量","Capacidad de batería"],
  battery_voltage: ["蓄电池电压","बैटरी वोल्टेज","Tensão da bateria","Tension de batterie","Batteriespannung","Напряжение аккумулятора","バッテリー電圧","Voltaje de batería"],
  cab_volume: ["驾驶室容积","केबिन का आयतन","Volume da cabine","Volume de la cabine","Kabinenvolumen","Объём кабины","キャブ容積","Volumen de cabina"],
  seat_adjustment: ["座椅调节","सीट समायोजन","Ajuste do assento","Réglage du siège","Sitzeinstellung","Регулировка сиденья","シート調整","Ajuste del asiento"],
  seat_belt_equipment: ["安全带配置","सीट बेल्ट","Cinto de segurança","Ceinture de sécurité","Sicherheitsgurt","Ремень безопасности","シートベルト","Cinturón de seguridad"],
  safety_equipment: ["安全配置","सुरक्षा उपकरण","Equipamentos de segurança","Équipements de sécurité","Sicherheitsausstattung","Средства безопасности","安全装備","Equipamiento de seguridad"],
  rops_position: ["ROPS防翻滚架配置","ROPS की स्थिति","Configuração ROPS","Configuration ROPS","ROPS-Konfiguration","Конфигурация ROPS","ROPS仕様","Configuración ROPS"],
  front_work_lights_count: ["前工作灯数量","फ्रंट वर्क लाइट की संख्या","Número de faróis de trabalho dianteiros","Nombre de phares de travail avant","Anzahl vorderer Arbeitsscheinwerfer","Количество передних рабочих фар","前作業灯数","Número de faros de trabajo delanteros"],
  rear_braking_system: ["后轮制动系统","पिछली ब्रेक प्रणाली","Sistema de freio traseiro","Système de freinage arrière","Hinterradbremssystem","Система задних тормозов","後輪ブレーキ方式","Sistema de frenos traseros"],
  rear_lift_system_type: ["后提升系统类型","पिछली लिफ्ट प्रणाली का प्रकार","Tipo de sistema de levante traseiro","Type de relevage arrière","Heckhubwerkstyp","Тип задней навески","後部リフト方式","Tipo de elevación trasera"],
  rear_hydraulic_spool_valve_count: ["后部液压多路阀数量","पिछली हाइड्रोलिक स्पूल वाल्व संख्या","Número de distribuidores hidráulicos traseiros","Nombre de distributeurs arrière","Anzahl Hecksteuergeräte","Количество задних гидрораспределителей","後部油圧バルブ数","Número de distribuidores hidráulicos traseros"],
  rear_hydraulic_spool_valve_type: ["后部液压多路阀类型","पिछली हाइड्रोलिक स्पूल वाल्व का प्रकार","Tipo de distribuidor hidráulico traseiro","Type de distributeur arrière","Hecksteuergerätetyp","Тип заднего гидрораспределителя","後部油圧バルブ形式","Tipo de distribuidor hidráulico trasero"],
  engine_power_range: ["制造商公布功率范围","निर्माता की प्रकाशित पावर सीमा","Faixa de potência publicada pelo fabricante","Plage de puissance publiée par le constructeur","Hersteller-Leistungsbereich","Диапазон мощности по данным производителя","メーカー公表出力範囲","Rango de potencia publicado por el fabricante"],
  engine_description: ["发动机说明","इंजन विवरण","Descrição do motor","Description du moteur","Motorbeschreibung","Описание двигателя","エンジン説明","Descripción del motor"],
  engine_make_model: ["发动机品牌/型号","इंजन निर्माता/मॉडल","Fabricante/modelo do motor","Marque et modèle du moteur","Motorhersteller/-modell","Марка и модель двигателя","エンジンメーカー・型式","Marca/modelo del motor"],
};

const CATEGORIES: Record<string, readonly string[]> = {
  other: ["其他技术参数","अन्य तकनीकी विवरण","Outras especificações","Autres caractéristiques","Weitere technische Daten","Прочие характеристики","その他の技術仕様","Otras especificaciones"],
  engine: ["发动机与功率","इंजन और पावर","Motor e potência","Moteur et puissance","Motor und Leistung","Двигатель и мощность","エンジン・出力","Motor y potencia"],
  transmission: ["变速箱","ट्रांसमिशन","Transmissão","Transmission","Getriebe","Трансмиссия","変速機","Transmisión"],
  hydraulics: ["液压系统","हाइड्रोलिक्स","Hidráulica","Hydraulique","Hydraulik","Гидравлика","油圧系統","Hidráulica"],
  capacities: ["容量","क्षमताएँ","Capacidades","Capacités","Füllmengen","Ёмкости","容量","Capacidades"],
  dimensions_weights: ["尺寸与重量","आयाम और वज़न","Dimensões e peso","Dimensions et poids","Maße und Gewichte","Габариты и масса","寸法・重量","Dimensiones y peso"],
  power_take_off: ["动力输出轴（PTO）","पीटीओ","Tomada de potência (TDP)","Prise de force","Zapfwelle","Вал отбора мощности","PTO（動力取出軸）","Toma de fuerza (TDF)"],
  powertrain: ["传动系统","ड्राइवट्रेन","Sistema de tração","Chaîne cinématique","Antriebsstrang","Трансмиссия и привод","駆動系","Tren de transmisión"],
  implements: ["农具与悬挂装置","इम्प्लीमेंट और लिंकेज","Implementos e engate","Outils et attelage","Anbaugeräte und Hubwerk","Навесное оборудование","作業機・リンク装置","Implementos y enganche"],
  electrical: ["电气系统","विद्युत प्रणाली","Sistema elétrico","Système électrique","Elektrik","Электрооборудование","電装系","Sistema eléctrico"],
  performance: ["性能","प्रदर्शन","Desempenho","Performances","Leistungsdaten","Эксплуатационные показатели","性能","Rendimiento"],
};

/** Exact canonical synonyms only; do not alias max/nominal power or different flows. */
const ALIASES: Record<string,string> = {
  forward_gears: "transmission_forward_gears",
  reverse_gears: "transmission_reverse_gears",
  rated_engine_power: "engine_rated_power",
  steering_pump_flow: "hydraulic_steering_flow",
  engine_air_filter_type: "engine_air_cleaner",
  engine_max_power_hp: "engine_max_power",
  engine_rated_power_kw: "engine_rated_power",
  front_tire_standard: "front_tire_size",
  rear_tire_standard: "rear_tire_size",
  rear_pto_speeds: "pto_speeds",
  fuel_tank_capacity_standard: "fuel_tank_capacity",
  hydraulic_pump_standard_flow: "hydraulic_main_flow",
  operating_weight_range_kg: "weight_range",
  rear_lift_capacity_daN: "rear_lift_capacity",
  hydraulic_spool_valve_count: "hydraulic_remote_valve_count",
};

const EXTRA: Record<string,readonly string[]> = {
  turning_radius: ["转弯半径","मुड़ने की त्रिज्या","Raio de giro","Rayon de braquage","Wenderadius","Радиус разворота","最小旋回半径","Radio de giro"],
  forward_speed_range: ["前进速度范围","आगे की गति सीमा","Faixa de velocidades à frente","Plage de vitesses en marche avant","Vorwärts-Geschwindigkeitsbereich","Диапазон скоростей движения вперёд","前進速度範囲","Intervalo de velocidades de avance"],
  reverse_speed_range: ["倒车速度范围","पीछे की गति सीमा","Faixa de velocidades à ré","Plage de vitesses en marche arrière","Rückwärts-Geschwindigkeitsbereich","Диапазон скоростей заднего хода","後進速度範囲","Intervalo de velocidades de retroceso"],
  front_pto_speed_optional: ["选装前动力输出轴转速","वैकल्पिक फ्रंट पीटीओ गति","Rotação da TDP dianteira opcional","Régime de prise de force avant en option","Drehzahl der optionalen Frontzapfwelle","Обороты дополнительного переднего ВОМ","オプション前部PTO回転数","Régimen de la TDF delantera opcional"],
  fuel_tank_capacity_optional: ["选装燃油箱容量","वैकल्पिक ईंधन टैंक क्षमता","Capacidade opcional do tanque","Capacité du réservoir en option","Optionales Tankvolumen","Ёмкость топливного бака (опция)","オプション燃料タンク容量","Capacidad del depósito opcional"],
  hydraulic_pump_optional_flow: ["选装液压泵流量","वैकल्पिक हाइड्रोलिक पंप प्रवाह","Vazão opcional da bomba hidráulica","Débit de pompe hydraulique en option","Optionaler Hydraulikpumpen-Förderstrom","Подача дополнительного гидронасоса","オプション油圧ポンプ流量","Caudal opcional de bomba hidráulica"],
  transmission_shuttle_type: ["换向机构类型","शटल रिवर्सर का प्रकार","Tipo de reversor","Type d’inverseur de marche","Wendeschaltung","Тип реверса трансмиссии","前後進切替方式","Tipo de inversor de marcha"],
  exhaust_aftertreatment: ["排气后处理系统","एग्जॉस्ट आफ्टरट्रीटमेंट","Pós-tratamento de gases de escape","Post-traitement des gaz d’échappement","Abgasnachbehandlung","Система нейтрализации выхлопных газов","排気後処理装置","Postratamiento de gases de escape"],
  engine_rated_power_with_dp_kw: ["DP模式额定功率（kW）","DP के साथ रेटेड पावर (kW)","Potência nominal com DP (kW)","Puissance nominale avec DP (kW)","Nennleistung mit DP (kW)","Номинальная мощность с DP (кВт)","DP使用時定格出力（kW）","Potencia nominal con DP (kW)"],
  engine_max_power_with_dp_kw: ["DP模式最大功率（kW）","DP के साथ अधिकतम पावर (kW)","Potência máxima com DP (kW)","Puissance maximale avec DP (kW)","Maximalleistung mit DP (kW)","Максимальная мощность с DP (кВт)","DP使用時最高出力（kW）","Potencia máxima con DP (kW)"],
  front_tire_option_1: ["前轮胎选项1","अगला टायर विकल्प 1","Pneu dianteiro opcional 1","Pneu avant en option 1","Vorderreifenoption 1","Вариант передних шин 1","前輪タイヤ選択肢1","Neumático delantero opcional 1"],
  rear_tire_option_1: ["后轮胎选项1","पिछला टायर विकल्प 1","Pneu traseiro opcional 1","Pneu arrière en option 1","Hinterreifenoption 1","Вариант задних шин 1","後輪タイヤ選択肢1","Neumático trasero opcional 1"],
  available_hydraulic_oil: ["可用液压油量","उपलब्ध हाइड्रोलिक तेल","Volume de óleo hidráulico disponível","Volume d’huile hydraulique disponible","Verfügbares Hydraulikölvolumen","Доступный объём гидравлического масла","使用可能な油圧オイル量","Volumen de aceite hidráulico disponible"],
};

const INDEX: Record<string, number> = { zh:0, hi:1, "pt-br":2, fr:3, de:4, ru:5, ja:6, es:7 };

export function localizedSpecificationName(key: string | null, specName: string, lang: Locale): string | null {
  if (lang === "en" || lang === "tr") return null;
  const value = EXTRA[key || ""] ?? TERM[ALIASES[key || ""] || (key || "")] ?? TERM[specName.trim()];
  return value?.[INDEX[lang]] ?? null;
}

export function localizedCategoryName(category: string | null, lang: Locale): string | null {
  if (lang === "en" || lang === "tr") return null;
  return CATEGORIES[category || ""]?.[INDEX[lang]] ?? null;
}

export function validateTechnicalGlossary(): void {
  for (const [key, terms] of Object.entries({ ...TERM, ...EXTRA, ...CATEGORIES })) {
    if (terms.length !== 8 || terms.some((term) => !term.trim())) {
      throw new Error("Invalid technical translation for " + key);
    }
  }
}
