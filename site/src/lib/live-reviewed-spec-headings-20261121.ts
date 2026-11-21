import type { Locale } from "./locales.ts";

/**
 * Read-only live audit 2026-11-21: source-identical technical heading fallbacks
 * on 379 published models in Brazilian Portuguese, French and Spanish.
 * Reviewed translations apply ONLY to exact original display headings.
 * Do not rewrite measurements, variants, source evidence or canonical keys.
 * For ambiguous GE/STD/options not fully defined by the OEM, retain source text.
 */
export const LIVE_REVIEWED_SPEC_HEADINGS_20261121: Record<string, Partial<Record<Locale,string>>> = {
  "Kabin IçI GüRüLtü": {
    "pt-br": "Ruído no interior da cabine",
    "fr": "Niveau sonore à l'intérieur de la cabine",
    "es": "Ruido en el interior de la cabina"
  },
  "Main Clutch Type": {
    "pt-br": "Tipo de embreagem principal",
    "fr": "Type d'embrayage principal",
    "es": "Tipo de embrague principal"
  },
  "Mechanical Differential Lock": {
    "pt-br": "Bloqueio mecânico do diferencial",
    "fr": "Blocage mécanique du différentiel",
    "es": "Bloqueo mecánico del diferencial"
  },
  "Minimum Ground Clearance": {
    "pt-br": "Vão livre mínimo ao solo",
    "fr": "Garde au sol minimale",
    "es": "Despeje mínimo al suelo"
  },
  "Minimum Turning Radius": {
    "pt-br": "Raio mínimo de giro",
    "fr": "Rayon de braquage minimal",
    "es": "Radio mínimo de giro"
  },
  "Motor BakıM Aralığı": {
    "pt-br": "Intervalo de manutenção do motor",
    "fr": "Intervalle d'entretien du moteur",
    "es": "Intervalo de mantenimiento del motor"
  },
  "ÖN PTO 1000 IçIn Motor Devri": {
    "pt-br": "Regime do motor para TDP dianteira de 1000 rpm",
    "fr": "Régime moteur pour PDF avant à 1000 tr/min",
    "es": "Régimen del motor para TDF delantera a 1000 rpm"
  },
  "ÖN PTO 1000E IçIn Motor Devri": {
    "pt-br": "Regime do motor para TDP dianteira de 1000E",
    "fr": "Régime moteur pour PDF avant à 1000E",
    "es": "Régimen del motor para TDF delantera a 1000E"
  },
  "Opsiyonel Powershift Yol HıZı": {
    "pt-br": "Velocidade de deslocamento com Powershift opcional",
    "fr": "Vitesse de déplacement avec Powershift en option",
    "es": "Velocidad de desplazamiento con Powershift opcional"
  },
  "Optional Front Track Width": {
    "pt-br": "Bitola dianteira opcional",
    "fr": "Voie avant en option",
    "es": "Ancho de vía delantero opcional"
  },
  "Optional Rear Track Settings": {
    "pt-br": "Ajustes opcionais da bitola traseira",
    "fr": "Réglages de voie arrière en option",
    "es": "Ajustes opcionales del ancho de vía trasero"
  },
  "Powershift Geri Vites SayıSı": {
    "pt-br": "Número de marchas à ré Powershift",
    "fr": "Nombre de rapports arrière Powershift",
    "es": "Número de marchas atrás Powershift"
  },
  "Powershift Ileri Vites SayıSı": {
    "pt-br": "Número de marchas à frente Powershift",
    "fr": "Nombre de rapports avant Powershift",
    "es": "Número de marchas hacia delante Powershift"
  },
  "Powershift Multiplier": {
    "pt-br": "Multiplicador Powershift",
    "fr": "Multiplicateur Powershift",
    "es": "Multiplicador Powershift"
  },
  "Seat Adjustment": {
    "pt-br": "Ajuste do assento",
    "fr": "Réglage du siège",
    "es": "Ajuste del asiento"
  },
  "Specific Fuel Consumption": {
    "pt-br": "Consumo específico de combustível",
    "fr": "Consommation spécifique de carburant",
    "es": "Consumo específico de combustible"
  },
  "Standard Front Track Width": {
    "pt-br": "Bitola dianteira de série",
    "fr": "Voie avant de série",
    "es": "Ancho de vía delantero de serie"
  },
  "Standart Powershift Yol HıZı": {
    "pt-br": "Velocidade de deslocamento com Powershift de série",
    "fr": "Vitesse de déplacement avec Powershift de série",
    "es": "Velocidad de desplazamiento con Powershift de serie"
  },
  "Transmission Creeper Option": {
    "pt-br": "Opção de marchas superlentas",
    "fr": "Option de vitesses rampantes",
    "es": "Opción de marchas superlentas"
  },
  "Transmission Gears – Basic Mechanical Shuttle": {
    "pt-br": "Marchas da transmissão – inversor mecânico básico",
    "fr": "Rapports de transmission – inverseur mécanique de base",
    "es": "Marchas de transmisión – inversor mecánico básico"
  },
  "Transmission Gears – Power Shuttle Option": {
    "pt-br": "Marchas da transmissão – inversor PowerShuttle opcional",
    "fr": "Rapports de transmission – inverseur PowerShuttle en option",
    "es": "Marchas de transmisión – inversor PowerShuttle opcional"
  },
  "Transmission Gears – Splitter Option": {
    "pt-br": "Marchas da transmissão – divisor de marchas opcional",
    "fr": "Rapports de transmission – diviseur de rapports en option",
    "es": "Marchas de transmisión – divisor de marchas opcional"
  },
  "Transmission Standard": {
    "pt-br": "Transmissão de série",
    "fr": "Transmission de série",
    "es": "Transmisión de serie"
  },
  "Transmission Standard Gears": {
    "pt-br": "Marchas da transmissão de série",
    "fr": "Rapports de la transmission de série",
    "es": "Marchas de la transmisión de serie"
  },
  "Travel Speed Max Kmh": {
    "pt-br": "Velocidade máxima de deslocamento (km/h)",
    "fr": "Vitesse maximale de déplacement (km/h)",
    "es": "Velocidad máxima de desplazamiento (km/h)"
  },
  "Vites DeğIşTirme Tipi": {
    "pt-br": "Tipo de troca de marchas",
    "fr": "Type de changement de vitesses",
    "es": "Tipo de cambio de marchas"
  },
  "Weight With Cab And Agricultural Tyres": {
    "pt-br": "Peso com cabine e pneus agrícolas",
    "fr": "Masse avec cabine et pneus agricoles",
    "es": "Peso con cabina y neumáticos agrícolas"
  },
  "Agrotechnical Ground Clearance": {
    "pt-br": "Vão livre agrotécnico",
    "fr": "Garde au sol agrotechnique",
    "es": "Despeje agrotécnico"
  },
  "Azami Seyir HıZı (R1)": {
    "pt-br": "Velocidade máxima de deslocamento (pneus R1)",
    "fr": "Vitesse maximale de déplacement (pneus R1)",
    "es": "Velocidad máxima de desplazamiento (neumáticos R1)"
  },
  "Boş AğıRlıK (YakıTsıZ/BalastsıZ)": {
    "pt-br": "Peso em vazio (sem combustível nem lastro)",
    "fr": "Masse à vide (sans carburant ni lest)",
    "es": "Peso en vacío (sin combustible ni lastre)"
  },
  "En DüşüK SüRüş HıZı": {
    "pt-br": "Velocidade mínima de deslocamento",
    "fr": "Vitesse minimale de déplacement",
    "es": "Velocidad mínima de desplazamiento"
  },
  "En YüKsek SüRüş HıZı": {
    "pt-br": "Velocidade máxima de deslocamento",
    "fr": "Vitesse maximale de déplacement",
    "es": "Velocidad máxima de desplazamiento"
  },
  "Engine Rpm For Stated Power": {
    "pt-br": "Regime do motor na potência declarada",
    "fr": "Régime moteur à la puissance déclarée",
    "es": "Régimen del motor a la potencia declarada"
  },
  "Four-Wheel-Drive Engagement": {
    "pt-br": "Acionamento da tração nas quatro rodas (4WD)",
    "fr": "Enclenchement des quatre roues motrices (4RM)",
    "es": "Activación de la tracción a las cuatro ruedas (4WD)"
  },
  "Front AG Tire Size": {
    "pt-br": "Dimensão do pneu agrícola dianteiro",
    "fr": "Dimension du pneu agricole avant",
    "es": "Medida del neumático agrícola delantero"
  },
  "Hydrostatic Transmission Ranges": {
    "pt-br": "Faixas da transmissão hidrostática",
    "fr": "Gammes de la transmission hydrostatique",
    "es": "Gamas de la transmisión hidrostática"
  },
  "Max Speed": {
    "pt-br": "Velocidade máxima",
    "fr": "Vitesse maximale",
    "es": "Velocidad máxima"
  },
  "Maximum Speed (Brochure, Tyre-Dependent) - Mechanical": {
    "pt-br": "Velocidade máxima (catálogo, dependente dos pneus) – mecânica",
    "fr": "Vitesse maximale (brochure, selon les pneus) – mécanique",
    "es": "Velocidad máxima (folleto, según neumáticos) – mecánica"
  },
  "Maximum Speed (Brochure, Tyre-Dependent) - Powershuttle": {
    "pt-br": "Velocidade máxima (catálogo, dependente dos pneus) – PowerShuttle",
    "fr": "Vitesse maximale (brochure, selon les pneus) – PowerShuttle",
    "es": "Velocidad máxima (folleto, según neumáticos) – PowerShuttle"
  },
  "Number Of Speeds - 5 Gears Transmission - Mechanical Shuttle": {
    "pt-br": "Número de marchas – transmissão de 5 marchas com inversor mecânico",
    "fr": "Nombre de rapports – transmission à 5 vitesses avec inverseur mécanique",
    "es": "Número de marchas – transmisión de 5 velocidades con inversor mecánico"
  },
  "Number Of Speeds - 5 Gears Transmission - Powershuttle": {
    "pt-br": "Número de marchas – transmissão de 5 marchas com PowerShuttle",
    "fr": "Nombre de rapports – transmission à 5 vitesses avec PowerShuttle",
    "es": "Número de marchas – transmisión de 5 velocidades con PowerShuttle"
  },
  "Operating Weight With Ballast": {
    "pt-br": "Peso operacional com lastro",
    "fr": "Masse en service avec lest",
    "es": "Peso operativo con lastre"
  },
  "Optional Narrow-Rim Front Tyre": {
    "pt-br": "Pneu dianteiro opcional com aro estreito",
    "fr": "Pneu avant à jante étroite en option",
    "es": "Neumático delantero opcional con llanta estrecha"
  },
  "PTO Horsepower": {
    "pt-br": "Potência da TDP (hp)",
    "fr": "Puissance de la prise de force (hp)",
    "es": "Potencia de la TDF (hp)"
  },
  "R1 Agricultural Front Tyre": {
    "pt-br": "Pneu agrícola dianteiro R1",
    "fr": "Pneu agricole avant R1",
    "es": "Neumático agrícola delantero R1"
  },
  "R1 Agricultural Rear Tyre": {
    "pt-br": "Pneu agrícola traseiro R1",
    "fr": "Pneu agricole arrière R1",
    "es": "Neumático agrícola trasero R1"
  },
  "Rear AG Tire Size": {
    "pt-br": "Dimensão do pneu agrícola traseiro",
    "fr": "Dimension du pneu agricole arrière",
    "es": "Medida del neumático agrícola trasero"
  },
  "ŞAnzıMan Kademe SayıSı": {
    "pt-br": "Número de gamas da transmissão",
    "fr": "Nombre de gammes de transmission",
    "es": "Número de gamas de la transmisión"
  },
  "ŞAnzıMan Vites SeçEnekleri": {
    "pt-br": "Opções de marchas da transmissão",
    "fr": "Options de rapports de transmission",
    "es": "Opciones de marchas de la transmisión"
  },
  "2WD Toplam GenişLik": {
    "pt-br": "Largura total – 2WD",
    "fr": "Largeur totale – 2RM",
    "es": "Anchura total – 2WD"
  },
  "2WD Toplam YüKseklik (Kabinsiz)": {
    "pt-br": "Altura total sem cabine – 2WD",
    "fr": "Hauteur totale sans cabine – 2RM",
    "es": "Altura total sin cabina – 2WD"
  },
  "2WD TraktöR AğıRlığı": {
    "pt-br": "Peso do trator – 2WD",
    "fr": "Masse du tracteur – 2RM",
    "es": "Peso del tractor – 2WD"
  },
  "2WD Yerden AçıKlıK": {
    "pt-br": "Vão livre ao solo – 2WD",
    "fr": "Garde au sol – 2RM",
    "es": "Despeje al suelo – 2WD"
  },
  "4WD Dingil Mesafesi": {
    "pt-br": "Distância entre eixos – 4WD",
    "fr": "Empattement – 4RM",
    "es": "Distancia entre ejes – 4WD"
  },
  "4WD Toplam GenişLik": {
    "pt-br": "Largura total – 4WD",
    "fr": "Largeur totale – 4RM",
    "es": "Anchura total – 4WD"
  },
  "4WD Toplam YüKseklik (Kabinsiz)": {
    "pt-br": "Altura total sem cabine – 4WD",
    "fr": "Hauteur totale sans cabine – 4RM",
    "es": "Altura total sin cabina – 4WD"
  },
  "4WD TraktöR AğıRlığı": {
    "pt-br": "Peso do trator – 4WD",
    "fr": "Masse du tracteur – 4RM",
    "es": "Peso del tractor – 4WD"
  },
  "4WD Yerden AçıKlıK": {
    "pt-br": "Vão livre ao solo – 4WD",
    "fr": "Garde au sol – 4RM",
    "es": "Despeje al suelo – 4WD"
  },
  "PTO Engagement": {
    "fr": "Enclenchement de la prise de force"
  },
  "Engine RPM At 1000 PTO": {
    "fr": "Régime moteur pour la prise de force à 1000 tr/min"
  },
  "Engine RPM At 540 PTO": {
    "fr": "Régime moteur pour la prise de force à 540 tr/min"
  },
  "Ag Front Tyre": {
    "fr": "Pneu agricole avant"
  },
  "Ag Rear Tyre": {
    "fr": "Pneu agricole arrière"
  },
  "Arka çIm LastiğI": {
    "fr": "Pneu gazon arrière"
  },
  "ÖN çIm LastiğI": {
    "fr": "Pneu gazon avant"
  },
  "Front Axle Type": {
    "fr": "Type de pont avant"
  },
  "Front Pto Rpm Option": {
    "fr": "Régime de la prise de force avant en option (tr/min)"
  },
  "Hitch Category": {
    "fr": "Catégorie de l'attelage"
  },
  "Hydraulic Fixed Pump Flow Lpm": {
    "fr": "Débit de la pompe hydraulique fixe (L/min)"
  },
  "Hydraulic System": {
    "fr": "Système hydraulique"
  },
  "Industrial Front Tyre": {
    "fr": "Pneu industriel avant"
  },
  "Industrial Rear Tyre": {
    "fr": "Pneu industriel arrière"
  },
  "Mid Pto Speed Rpm": {
    "fr": "Régime de la prise de force centrale (tr/min)"
  },
  "Pto Power Hp": {
    "fr": "Puissance de la prise de force (hp)"
  },
  "Rear Aux Spool Valves Standard": {
    "fr": "Distributeurs hydrauliques auxiliaires arrière de série"
  },
  "Rear Lift Control": {
    "fr": "Commande du relevage arrière"
  },
  "Rear Pto Power Cv Iso": {
    "fr": "Puissance de la prise de force arrière (CV, ISO)"
  },
  "Rear Pto Power Kw Iso": {
    "fr": "Puissance de la prise de force arrière (kW, ISO)"
  },
  "Rear Pto Speed Rpm": {
    "fr": "Régime de la prise de force arrière (tr/min)"
  },
  "Rear Pto Speeds Standard": {
    "fr": "Régimes de la prise de force arrière de série"
  },
  "PTO Kavrama Tipi": {
    "fr": "Type d'embrayage de la prise de force"
  },
  "PTO Mil Diş SeçEnekleri": {
    "fr": "Options de cannelures de l'arbre de prise de force"
  },
  "Ground Clearance Ge Mm": {
    "pt-br": "Vão livre ao solo GE (mm)",
    "es": "Despeje al suelo GE (mm)"
  },
  "Ground Clearance Mm": {
    "pt-br": "Vão livre ao solo (mm)",
    "es": "Despeje al suelo (mm)"
  },
  "Ground Clearance Std Mm": {
    "pt-br": "Vão livre ao solo de série (mm)",
    "es": "Despeje al suelo de serie (mm)"
  },
  "Height At Bonnet": {
    "pt-br": "Altura até o capô",
    "es": "Altura hasta el capó"
  },
  "Height Mm": {
    "pt-br": "Altura (mm)",
    "es": "Altura (mm)"
  },
  "Height Rollbar Ge Mm": {
    "pt-br": "Altura do arco de proteção GE (mm)",
    "es": "Altura de la barra de protección GE (mm)"
  },
  "Height Rollbar Std Mm": {
    "pt-br": "Altura do arco de proteção de série (mm)",
    "es": "Altura de la barra de protección de serie (mm)"
  },
  "İZin Verilen Azami Toplam AğıRlıK SeçEnekleri": {
    "pt-br": "Opções de massa total máxima admissível",
    "es": "Opciones de masa total máxima admisible"
  },
  "Length With Ballast Mm": {
    "pt-br": "Comprimento com lastro (mm)",
    "es": "Longitud con lastre (mm)"
  },
  "Maximum Length Range": {
    "pt-br": "Faixa de comprimento máximo",
    "es": "Rango de longitud máxima"
  },
  "Min Width Ge Mm": {
    "pt-br": "Largura mínima GE (mm)",
    "es": "Anchura mínima GE (mm)"
  },
  "Min Width Std Mm": {
    "pt-br": "Largura mínima de série (mm)",
    "es": "Anchura mínima de serie (mm)"
  },
  "Narrow Cab Availability": {
    "pt-br": "Disponibilidade de cabine estreita",
    "es": "Disponibilidad de cabina estrecha"
  },
  "ÖN Iz GenişLiğI Aralığı": {
    "pt-br": "Faixa de bitola dianteira",
    "es": "Rango de ancho de vía delantero"
  },
  "Rear Brake Type": {
    "pt-br": "Tipo de freio traseiro",
    "es": "Tipo de freno trasero"
  },
  "Rear Track Mm": {
    "pt-br": "Bitola traseira (mm)",
    "es": "Ancho de vía trasero (mm)"
  },
  "Standard Cab Or ROPS Availability": {
    "pt-br": "Disponibilidade de cabine ou ROPS de série",
    "es": "Disponibilidad de cabina o ROPS de serie"
  },
  "Tractor Weight Kg": {
    "pt-br": "Peso do trator (kg)",
    "es": "Peso del tractor (kg)"
  },
  "Transport Length With Front Linkage": {
    "pt-br": "Comprimento de transporte com engate dianteiro",
    "es": "Longitud de transporte con enganche delantero"
  },
  "Turning Radius M": {
    "pt-br": "Raio de giro (m)",
    "es": "Radio de giro (m)"
  },
  "Uzunluk (Standart Lastikler)": {
    "pt-br": "Comprimento (pneus padrão)",
    "es": "Longitud (neumáticos estándar)"
  },
  "Weight Unballasted 4wd Platform Kg": {
    "pt-br": "Peso sem lastro, plataforma 4WD (kg)",
    "es": "Peso sin lastre, plataforma 4WD (kg)"
  },
  "Width Mm": {
    "pt-br": "Largura (mm)",
    "es": "Anchura (mm)"
  },
  "YaklaşıK Sevk AğıRlığı öN Aks SüSpansiyonlu": {
    "pt-br": "Peso aproximado de expedição com suspensão do eixo dianteiro",
    "es": "Peso aproximado de expedición con suspensión del eje delantero"
  },
  "YaklaşıK Sevk AğıRlığı Standart": {
    "pt-br": "Peso aproximado de expedição de série",
    "es": "Peso aproximado de expedición estándar"
  },
  "Arka çIm LastiğI SeçEneğI": {
    "pt-br": "Opção de pneu de relva traseiro",
    "es": "Opción de neumático trasero para césped"
  },
  "Arka EndüStriyel Lastik SeçEneğI": {
    "pt-br": "Opção de pneu industrial traseiro",
    "es": "Opción de neumático industrial trasero"
  },
  "Arka Iz Ayar GenişLiğI (R1)": {
    "pt-br": "Amplitude de ajuste da bitola traseira (R1)",
    "es": "Amplitud de ajuste de vía trasera (R1)"
  },
  "Arka Iz GenişLiğI Maksimum": {
    "pt-br": "Bitola traseira máxima",
    "es": "Ancho máximo de vía trasera"
  },
  "Arka Iz GenişLiğI Minimum": {
    "pt-br": "Bitola traseira mínima",
    "es": "Ancho mínimo de vía trasera"
  },
  "Arka TarıM LastiğI (R1)": {
    "pt-br": "Pneu agrícola traseiro (R1)",
    "es": "Neumático agrícola trasero (R1)"
  },
  "Canopy Height": {
    "pt-br": "Altura da cobertura de proteção",
    "es": "Altura de la cubierta protectora"
  },
  "Dingil Mesafesi": {
    "pt-br": "Distância entre eixos",
    "es": "Distancia entre ejes"
  },
  "DöNüş YarıçApı Frensiz (R1)": {
    "pt-br": "Raio de giro sem frenagem (R1)",
    "es": "Radio de giro sin frenado (R1)"
  },
  "Drive Layout": {
    "pt-br": "Configuração de tração",
    "es": "Configuración de tracción"
  },
  "En BüYüK Arka Iz GenişLiğI (R1)": {
    "pt-br": "Bitola traseira máxima (R1)",
    "es": "Ancho máximo de vía trasera (R1)"
  },
  "En KüçüK Arka Iz GenişLiğI (R1)": {
    "pt-br": "Bitola traseira mínima (R1)",
    "es": "Ancho mínimo de vía trasera (R1)"
  },
  "Engine Air Filter": {
    "pt-br": "Filtro de ar do motor",
    "es": "Filtro de aire del motor"
  },
  "Kabin AğıRlığı": {
    "pt-br": "Peso da cabine",
    "es": "Peso de la cabina"
  },
  "Kabin YüKsekliğI": {
    "pt-br": "Altura da cabine",
    "es": "Altura de la cabina"
  },
  "Manufacturer Model Weight (Configuration/Loading Unspecified)": {
    "pt-br": "Peso do modelo informado pelo fabricante (configuração/carga não especificadas)",
    "es": "Peso del modelo declarado por el fabricante (configuración/carga no especificadas)"
  },
  "Manufacturer Operator Station Type": {
    "pt-br": "Tipo de posto do operador informado pelo fabricante",
    "es": "Tipo de puesto del operador declarado por el fabricante"
  },
  "ÖN Aks Yağı Kapasitesi": {
    "pt-br": "Capacidade de óleo do eixo dianteiro",
    "es": "Capacidad de aceite del eje delantero"
  },
  "ÖN çIm LastiğI SeçEneğI": {
    "pt-br": "Opção de pneu de relva dianteiro",
    "es": "Opción de neumático delantero para césped"
  },
  "ÖN EndüStriyel Lastik SeçEneğI": {
    "pt-br": "Opção de pneu industrial dianteiro",
    "es": "Opción de neumático industrial delantero"
  },
  "ÖN Iz GenişLiğI (R1)": {
    "pt-br": "Bitola dianteira (R1)",
    "es": "Ancho de vía delantero (R1)"
  },
  "ÖN Iz GenişLiğI Maksimum": {
    "pt-br": "Bitola dianteira máxima",
    "es": "Ancho máximo de vía delantera"
  },
  "ÖN Iz GenişLiğI Minimum": {
    "pt-br": "Bitola dianteira mínima",
    "es": "Ancho mínimo de vía delantera"
  },
  "ÖN TarıM LastiğI (R1)": {
    "pt-br": "Pneu agrícola dianteiro (R1)",
    "es": "Neumático agrícola delantero (R1)"
  },
  "OperatöR KoltuğU": {
    "pt-br": "Assento do operador",
    "es": "Asiento del operador"
  },
  "OperatöR Tabanı": {
    "pt-br": "Piso do operador",
    "es": "Suelo del puesto del operador"
  },
  "ROPS AğıRlığı": {
    "pt-br": "Peso do ROPS",
    "es": "Peso del ROPS"
  },
  "ROPS Yapı AğıRlığı": {
    "pt-br": "Peso da estrutura ROPS",
    "es": "Peso de la estructura ROPS"
  },
  "ROPS YüKsekliğI": {
    "pt-br": "Altura do ROPS",
    "es": "Altura del ROPS"
  },
  "ŞAnzıMan Yağı Kapasitesi": {
    "pt-br": "Capacidade de óleo da transmissão",
    "es": "Capacidad de aceite de la transmisión"
  },
  "SoğUtma SıVıSı Kapasitesi": {
    "pt-br": "Capacidade de líquido de arrefecimento",
    "es": "Capacidad del líquido refrigerante"
  },
  "Standard-Mode Boost Torque": {
    "pt-br": "Torque com reforço no modo padrão",
    "es": "Par con refuerzo en modo estándar"
  },
  "Standard-Mode Maximum Torque": {
    "pt-br": "Torque máximo no modo padrão",
    "es": "Par máximo en modo estándar"
  },
  "Toplam GenişLik": {
    "pt-br": "Largura total",
    "es": "Anchura total"
  },
  "Toplam Uzunluk": {
    "pt-br": "Comprimento total",
    "es": "Longitud total"
  },
  "Roll-Bar Weight Maximum": {
    "pt-br": "Peso máximo do arco de proteção",
    "es": "Peso máximo de la barra de protección",
    "fr": "Poids maximal de l'arceau de protection"
  },
  "Roll-Bar Weight Minimum": {
    "pt-br": "Peso mínimo do arco de proteção",
    "es": "Peso mínimo de la barra de protección",
    "fr": "Poids minimal de l'arceau de protection"
  },
  "Steering Arrangement And Reversible Seat": {
    "pt-br": "Configuração da direção e assento reversível",
    "es": "Configuración de la dirección y asiento reversible",
    "fr": "Configuration de direction et siège réversible"
  },
  "Front Tire Ge": {
    "fr": "Pneu avant GE"
  },
  "Front Tire Std": {
    "fr": "Pneu avant de série"
  },
  "Rear Tire Ge": {
    "fr": "Pneu arrière GE"
  },
  "Rear Tire Std": {
    "fr": "Pneu arrière de série"
  },
  "Opsiyonel öN PTO 1000 Motor Devri": {
    "fr": "Régime moteur pour PDF avant à 1000 en option"
  },
  "PTO 1000 IçIn Motor Devri": {
    "fr": "Régime moteur pour la prise de force à 1000 tr/min"
  },
  "PTO 1000E IçIn Motor Devri": {
    "fr": "Régime moteur pour la prise de force à 1000E"
  },
  "PTO 540 IçIn Motor Devri": {
    "fr": "Régime moteur pour la prise de force à 540 tr/min"
  },
  "PTO 540E IçIn Motor Devri": {
    "fr": "Régime moteur pour la prise de force à 540E"
  },
  "Steering Wheel Height Ge Mm": {
    "fr": "Hauteur du volant GE (mm)"
  },
  "Steering Wheel Height Std Mm": {
    "fr": "Hauteur du volant de série (mm)"
  },
  "Adjustable Steering Column": {
    "fr": "Colonne de direction réglable"
  },
  "Arka EndüStriyel Lastik": {
    "fr": "Pneu industriel arrière"
  },
  "Arka PTO çAlışMa Tipi": {
    "fr": "Mode de fonctionnement de la prise de force arrière"
  },
  "Arka PTO Mili": {
    "fr": "Arbre de prise de force arrière"
  },
  "Automatic Four-Wheel Drive": {
    "fr": "Quatre roues motrices automatiques (4RM)"
  },
  "Engine RPM At 540E PTO": {
    "fr": "Régime moteur pour la prise de force à 540E"
  },
  "Four-Wheel Braking": {
    "fr": "Freinage sur les quatre roues"
  },
  "Front PTO Speed": {
    "fr": "Régime de la prise de force avant"
  },
  "Groundspeed PTO": {
    "fr": "Prise de force proportionnelle à la vitesse d'avancement"
  },
  "Independent Steering Pump": {
    "fr": "Pompe de direction indépendante"
  },
  "ÖN EndüStriyel Lastik": {
    "fr": "Pneu industriel avant"
  },
  "Orta PTO çAlışMa Tipi": {
    "fr": "Mode de fonctionnement de la prise de force centrale"
  },
  "Orta PTO Mili": {
    "fr": "Arbre de prise de force centrale"
  },
  "PTO çAlışMa Tipi": {
    "fr": "Mode de fonctionnement de la prise de force"
  },
  "PTO GüCü": {
    "fr": "Puissance de la prise de force"
  },
  "Rear Pto Modes": {
    "fr": "Modes de la prise de force arrière"
  }
};
