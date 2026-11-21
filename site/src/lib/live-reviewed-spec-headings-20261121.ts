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
  }
};
