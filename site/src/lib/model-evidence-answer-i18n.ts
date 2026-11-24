import type {Locale} from "./locales.ts";

// Preserve HP as recorded: PS/ch/CV are not automatically equivalent units.
// Keep source notes in their original wording; never translate a measurement
// standard into a different standard or imply a new independent test.
export type AnswerField="rated-power"|"pto-power"|"engine-displacement"|"rear-hitch-lift"|"wheelbase"|"fuel";
export const MODEL_ANSWER_UI:Record<Locale,Record<"eyebrow"|"heading"|"intro"|"measurement"|"manufacturer"|"independent"|"explain"|"method"|"rpm",string>>={
  "en": {
    "eyebrow": "SHORT ANSWERS WITH SOURCES",
    "heading": "Documented facts about this tractor",
    "intro": "Only reviewed, source-linked technical entries are summarized here. Missing or conflicting claims are not guessed.",
    "measurement": "Measurement note",
    "manufacturer": "Manufacturer source",
    "independent": "Independent technical source",
    "explain": "Explain the term",
    "method": "How we verify technical sources",
    "rpm": "rpm"
  },
  "tr": {
    "eyebrow": "KAYNAĞI GÖSTERİLEN KISA CEVAPLAR",
    "heading": "Bu traktör hakkında doğrulanabilen bilgiler",
    "intro": "Buradaki rakamlar yalnızca bağlantılı kanıtı bulunan teknik kayıtlarımızdan alınır. Eksik veya çelişkili bilgiler kesinmiş gibi özetlenmez.",
    "measurement": "Ölçüm notu",
    "manufacturer": "Üretici kaynağı",
    "independent": "Bağımsız teknik kaynak",
    "explain": "Terimi açıkla",
    "method": "Kaynaklarımızı nasıl doğruluyoruz?",
    "rpm": "dev/dk"
  },
  "de": {
    "eyebrow": "KURZANTWORTEN MIT QUELLEN",
    "heading": "Belegte technische Angaben zu diesem Traktor",
    "intro": "Die Angaben beruhen auf geprüften technischen Daten mit Quellenbeleg. Fehlende oder widersprüchliche Werte werden nicht geschätzt.",
    "measurement": "Originaler Mess- oder Quellenhinweis",
    "manufacturer": "Herstellerquelle",
    "independent": "Unabhängige technische Quelle",
    "explain": "Begriff erläutern",
    "method": "Wie wir technische Quellen prüfen (Englisch)",
    "rpm": "U/min"
  },
  "hi": {
    "eyebrow": "स्रोत सहित संक्षिप्त उत्तर",
    "heading": "इस ट्रैक्टर के प्रमाणित तकनीकी आँकड़े",
    "intro": "ये आँकड़े स्रोत से जुड़े समीक्षित तकनीकी रिकॉर्ड से लिए गए हैं। अनुपलब्ध या परस्पर विरोधी आँकड़ों का अनुमान नहीं लगाया जाता।",
    "measurement": "मूल माप या स्रोत का नोट",
    "manufacturer": "निर्माता का स्रोत",
    "independent": "स्वतंत्र तकनीकी स्रोत",
    "explain": "तकनीकी शब्द समझें",
    "method": "हम तकनीकी स्रोतों की जाँच कैसे करते हैं (अंग्रेज़ी)",
    "rpm": "चक्कर/मिनट"
  },
  "zh": {
    "eyebrow": "附有来源的简明回答",
    "heading": "这款拖拉机有据可查的技术参数",
    "intro": "以下数值仅来自经过审核且附有来源的技术记录；不推测缺失或存在冲突的数据。",
    "measurement": "原始测量或来源说明",
    "manufacturer": "制造商资料",
    "independent": "独立技术资料",
    "explain": "了解术语",
    "method": "我们如何核验技术资料（英文）",
    "rpm": "转/分钟"
  },
  "pt-br": {
    "eyebrow": "RESPOSTAS CURTAS COM FONTES",
    "heading": "Dados técnicos documentados deste trator",
    "intro": "Os valores vêm apenas de registros técnicos revisados com fontes. Dados ausentes ou conflitantes não são estimados.",
    "measurement": "Nota original da medição ou da fonte",
    "manufacturer": "Fonte do fabricante",
    "independent": "Fonte técnica independente",
    "explain": "Entender o termo",
    "method": "Como verificamos as fontes técnicas (em inglês)",
    "rpm": "rpm"
  },
  "fr": {
    "eyebrow": "RÉPONSES COURTES AVEC SOURCES",
    "heading": "Données techniques documentées de ce tracteur",
    "intro": "Ces valeurs proviennent uniquement de données techniques examinées et sourcées. Les valeurs manquantes ou contradictoires ne sont pas estimées.",
    "measurement": "Note originale de mesure ou de source",
    "manufacturer": "Source du constructeur",
    "independent": "Source technique indépendante",
    "explain": "Comprendre le terme",
    "method": "Comment nous vérifions les sources techniques (en anglais)",
    "rpm": "tr/min"
  },
  "ru": {
    "eyebrow": "КРАТКИЕ ОТВЕТЫ С ИСТОЧНИКАМИ",
    "heading": "Документированные технические данные трактора",
    "intro": "Значения приведены только по проверенным техническим записям со ссылками на источники. Отсутствующие или противоречивые данные не заменяются догадками.",
    "measurement": "Исходное примечание к измерению или источнику",
    "manufacturer": "Источник производителя",
    "independent": "Независимый технический источник",
    "explain": "Объяснение термина",
    "method": "Как мы проверяем технические источники (на английском)",
    "rpm": "об/мин"
  },
  "ja": {
    "eyebrow": "出典付きの短い回答",
    "heading": "このトラクターの資料で確認できる技術仕様",
    "intro": "数値は出典を確認した技術記録に基づきます。欠落や矛盾がある数値は推測しません。",
    "measurement": "測定条件・出典の原文注記",
    "manufacturer": "メーカー資料",
    "independent": "独立した技術資料",
    "explain": "用語の解説",
    "method": "技術資料の確認方法（英語）",
    "rpm": "rpm"
  },
  "es": {
    "eyebrow": "RESPUESTAS BREVES CON FUENTES",
    "heading": "Datos técnicos documentados de este tractor",
    "intro": "Los valores proceden de registros técnicos revisados y con fuente. No se estiman datos ausentes ni contradictorios.",
    "measurement": "Nota original de medición o de la fuente",
    "manufacturer": "Fuente del fabricante",
    "independent": "Fuente técnica independiente",
    "explain": "Entender el término",
    "method": "Cómo verificamos las fuentes técnicas (en inglés)",
    "rpm": "rpm"
  }
};
export const LOCALIZED_MODEL_ANSWERS:Record<Exclude<Locale,"en"|"tr">,Record<AnswerField,{question:string;answer:string}>>={
  "de": {
    "rated-power": {
      "question": "Welche Motorleistung ist für {n} dokumentiert?",
      "answer": "Eine geprüfte Quelle nennt für {n} eine Motorleistung von {v} HP. Das ist keine Messung der Zapfwellen- oder Zugleistung."
    },
    "pto-power": {
      "question": "Welche Zapfwellenleistung ist für {n} dokumentiert?",
      "answer": "Für {n} sind {v} HP Zapfwellenleistung dokumentiert. Vor einem Vergleich Drehzahl und Prüfverfahren prüfen; Motorleistung ist nicht gleich Zapfwellenleistung."
    },
    "engine-displacement": {
      "question": "Welchen Hubraum hat {n} laut Quelle?",
      "answer": "Für {n} sind {v} Liter Hubraum dokumentiert. Hubraum bezeichnet das Motorvolumen, nicht Leistung oder Kraftstoffverbrauch."
    },
    "rear-hitch-lift": {
      "question": "Welche Heckhubkraft ist für {n} dokumentiert?",
      "answer": "Für {n} sind {v} kg Heckhubkraft dokumentiert. Messpunkt und montierte Ausstattung sind vor einem Vergleich zu prüfen."
    },
    "wheelbase": {
      "question": "Welchen Radstand hat {n} laut Quelle?",
      "answer": "Der dokumentierte Radstand von {n} beträgt {v} mm. Gemeint ist der Abstand der Achsmitten, nicht die Gesamtlänge."
    },
    "fuel": {
      "question": "Wie groß ist der Kraftstofftank von {n} laut Quelle?",
      "answer": "Für {n} ist ein Tankvolumen von {v} Litern dokumentiert. Daraus lässt sich der stündliche Kraftstoffverbrauch nicht ableiten."
    }
  },
  "hi": {
    "rated-power": {
      "question": "{n} की दस्तावेज़ में दर्ज इंजन शक्ति कितनी है?",
      "answer": "समीक्षित स्रोत में {n} की इंजन शक्ति {v} HP दर्ज है। यह PTO या खींचने की शक्ति का परीक्षण नहीं है।"
    },
    "pto-power": {
      "question": "{n} की दस्तावेज़ में दर्ज PTO शक्ति कितनी है?",
      "answer": "{n} की PTO शक्ति {v} HP दर्ज है। यह इंजन शक्ति से अलग है; तुलना से पहले गति और परीक्षण विधि जाँचें।"
    },
    "engine-displacement": {
      "question": "{n} के इंजन का विस्थापन कितना है?",
      "answer": "{n} के इंजन का दस्तावेज़ में दर्ज विस्थापन {v} लीटर है। यह इंजन का आयतन है, शक्ति या ईंधन खपत नहीं।"
    },
    "rear-hitch-lift": {
      "question": "{n} की पिछली तीन-बिंदु लिंकेज की उठाने की क्षमता कितनी है?",
      "answer": "{n} की पिछली लिंकेज की दस्तावेज़ में दर्ज उठाने की क्षमता {v} kg है। तुलना से पहले माप बिंदु और लगे उपकरण की जाँच करें।"
    },
    "wheelbase": {
      "question": "{n} का व्हीलबेस कितना है?",
      "answer": "{n} का दर्ज व्हीलबेस {v} mm है। यह आगे और पीछे के धुरों के केंद्रों की दूरी है, कुल लंबाई नहीं।"
    },
    "fuel": {
      "question": "{n} के ईंधन टैंक की क्षमता कितनी है?",
      "answer": "{n} के ईंधन टैंक की दर्ज क्षमता {v} लीटर है। इससे प्रति घंटे ईंधन खपत निर्धारित नहीं होती।"
    }
  },
  "zh": {
    "rated-power": {
      "question": "{n} 有据可查的发动机功率是多少？",
      "answer": "经审核的资料显示，{n} 的发动机功率为 {v} HP。这不是动力输出轴或牵引功率的测试值。"
    },
    "pto-power": {
      "question": "{n} 有据可查的动力输出轴（PTO）功率是多少？",
      "answer": "{n} 的动力输出轴（PTO）功率记录为 {v} HP。该数值不同于发动机功率；比较前应核对转速及试验方法。"
    },
    "engine-displacement": {
      "question": "{n} 的发动机排量是多少？",
      "answer": "资料记录 {n} 的发动机排量为 {v} 升。排量表示发动机容积，并非功率或油耗。"
    },
    "rear-hitch-lift": {
      "question": "{n} 的后悬挂提升能力是多少？",
      "answer": "资料记录 {n} 的后悬挂提升能力为 {v} kg。比较前应确认测量点和所配装置。"
    },
    "wheelbase": {
      "question": "{n} 的轴距是多少？",
      "answer": "{n} 的轴距记录为 {v} mm，即前后车轴中心之间的距离，并非整车长度。"
    },
    "fuel": {
      "question": "{n} 的燃油箱容量是多少？",
      "answer": "{n} 的燃油箱容量记录为 {v} 升。油箱容积不能用于判断每小时油耗。"
    }
  },
  "pt-br": {
    "rated-power": {
      "question": "Qual é a potência do motor documentada do {n}?",
      "answer": "Uma fonte revisada informa {v} HP de potência do motor para o {n}. Não se trata de potência na TDP nem de potência na barra de tração."
    },
    "pto-power": {
      "question": "Qual é a potência documentada na tomada de potência (TDP) do {n}?",
      "answer": "A potência documentada na TDP do {n} é de {v} HP. Confira a rotação e o método de ensaio antes de comparar; esse valor não equivale à potência do motor."
    },
    "engine-displacement": {
      "question": "Qual é a cilindrada documentada do {n}?",
      "answer": "A cilindrada documentada do {n} é de {v} litros. Cilindrada é volume do motor, não potência ou consumo."
    },
    "rear-hitch-lift": {
      "question": "Qual é a capacidade de levante traseiro documentada do {n}?",
      "answer": "A capacidade de levante traseiro documentada do {n} é de {v} kg. Confira o ponto de medição e os equipamentos instalados antes de comparar."
    },
    "wheelbase": {
      "question": "Qual é a distância entre eixos documentada do {n}?",
      "answer": "A distância entre eixos documentada do {n} é de {v} mm. É a distância entre os centros dos eixos, não o comprimento total."
    },
    "fuel": {
      "question": "Qual é a capacidade documentada do tanque de combustível do {n}?",
      "answer": "O tanque de combustível do {n} tem capacidade documentada de {v} litros. Esse volume não determina o consumo por hora."
    }
  },
  "fr": {
    "rated-power": {
      "question": "Quelle puissance moteur est documentée pour le {n} ?",
      "answer": "Une source examinée indique {v} HP de puissance moteur pour le {n}. Il ne s’agit ni d’une mesure à la prise de force ni d’une mesure à la barre de traction."
    },
    "pto-power": {
      "question": "Quelle puissance à la prise de force est documentée pour le {n} ?",
      "answer": "La puissance documentée à la prise de force du {n} est de {v} HP. Vérifiez le régime et la méthode d’essai avant toute comparaison ; ce n’est pas la puissance moteur."
    },
    "engine-displacement": {
      "question": "Quelle est la cylindrée documentée du {n} ?",
      "answer": "La cylindrée documentée du {n} est de {v} litres. Elle représente le volume du moteur, non sa puissance ni sa consommation."
    },
    "rear-hitch-lift": {
      "question": "Quelle capacité de relevage arrière est documentée pour le {n} ?",
      "answer": "La capacité de relevage arrière documentée du {n} est de {v} kg. Vérifiez le point de mesure et les équipements montés avant toute comparaison."
    },
    "wheelbase": {
      "question": "Quel est l’empattement documenté du {n} ?",
      "answer": "L’empattement documenté du {n} est de {v} mm. Il correspond à la distance entre les centres des essieux, non à la longueur totale."
    },
    "fuel": {
      "question": "Quelle est la capacité documentée du réservoir du {n} ?",
      "answer": "Le réservoir de carburant du {n} a une capacité documentée de {v} litres. Ce volume ne permet pas de déduire la consommation horaire."
    }
  },
  "ru": {
    "rated-power": {
      "question": "Какая мощность двигателя документирована для {n}?",
      "answer": "В проверенном источнике указана мощность двигателя {n} — {v} HP. Это не результат измерения мощности на ВОМ или тяговой мощности."
    },
    "pto-power": {
      "question": "Какая мощность на валу отбора мощности (ВОМ) документирована для {n}?",
      "answer": "Документированная мощность на ВОМ у {n} составляет {v} HP. Перед сравнением проверьте частоту вращения и методику испытаний; это не мощность двигателя."
    },
    "engine-displacement": {
      "question": "Какой рабочий объём двигателя документирован для {n}?",
      "answer": "Документированный рабочий объём двигателя {n} составляет {v} л. Рабочий объём не равен мощности или расходу топлива."
    },
    "rear-hitch-lift": {
      "question": "Какая грузоподъёмность задней навески документирована для {n}?",
      "answer": "Документированная грузоподъёмность задней навески {n} составляет {v} кг. Перед сравнением уточните точку измерения и установленное оборудование."
    },
    "wheelbase": {
      "question": "Какая колёсная база документирована для {n}?",
      "answer": "Документированная колёсная база {n} — {v} мм. Это расстояние между центрами передней и задней осей, а не общая длина."
    },
    "fuel": {
      "question": "Какой объём топливного бака документирован для {n}?",
      "answer": "Документированный объём топливного бака {n} — {v} л. По этому объёму нельзя определить часовой расход топлива."
    }
  },
  "ja": {
    "rated-power": {
      "question": "{n} の資料に記載されたエンジン出力は？",
      "answer": "確認した資料では、{n} のエンジン出力は {v} HP と記載されています。PTO出力やけん引出力の測定値ではありません。"
    },
    "pto-power": {
      "question": "{n} の資料に記載されたPTO出力は？",
      "answer": "{n} のPTO出力は資料上 {v} HP です。エンジン出力とは異なり、比較前に回転数と試験方法を確認してください。"
    },
    "engine-displacement": {
      "question": "{n} の資料に記載されたエンジン排気量は？",
      "answer": "{n} の資料上のエンジン排気量は {v} L です。排気量はエンジンの容積で、出力や燃料消費量とは異なります。"
    },
    "rear-hitch-lift": {
      "question": "{n} の資料に記載された後部ヒッチの揚力は？",
      "answer": "{n} の後部ヒッチの揚力は資料上 {v} kg です。比較前に測定位置と装着機器を確認してください。"
    },
    "wheelbase": {
      "question": "{n} の資料に記載されたホイールベースは？",
      "answer": "{n} の資料上のホイールベースは {v} mm です。前後車軸の中心間距離で、全長ではありません。"
    },
    "fuel": {
      "question": "{n} の資料に記載された燃料タンク容量は？",
      "answer": "{n} の資料上の燃料タンク容量は {v} L です。タンク容量から1時間当たりの燃料消費量は判断できません。"
    }
  },
  "es": {
    "rated-power": {
      "question": "¿Qué potencia del motor está documentada para el {n}?",
      "answer": "Una fuente revisada indica {v} HP de potencia del motor para el {n}. No es una medición de potencia en la TDF ni en la barra de tiro."
    },
    "pto-power": {
      "question": "¿Qué potencia en la toma de fuerza (TDF) está documentada para el {n}?",
      "answer": "La potencia documentada en la TDF del {n} es de {v} HP. Antes de comparar, comprueba el régimen y el método de ensayo; no equivale a la potencia del motor."
    },
    "engine-displacement": {
      "question": "¿Qué cilindrada está documentada para el {n}?",
      "answer": "La cilindrada documentada del {n} es de {v} litros. Es el volumen del motor, no la potencia ni el consumo de combustible."
    },
    "rear-hitch-lift": {
      "question": "¿Qué capacidad de elevación trasera está documentada para el {n}?",
      "answer": "La capacidad de elevación trasera documentada del {n} es de {v} kg. Comprueba el punto de medición y el equipo instalado antes de comparar."
    },
    "wheelbase": {
      "question": "¿Qué distancia entre ejes está documentada para el {n}?",
      "answer": "La distancia entre ejes documentada del {n} es de {v} mm. Es la distancia entre los centros de los ejes, no la longitud total."
    },
    "fuel": {
      "question": "¿Qué capacidad del depósito de combustible está documentada para el {n}?",
      "answer": "La capacidad documentada del depósito del {n} es de {v} litros. No permite deducir el consumo por hora."
    }
  }
};

export function localizedEvidenceCopy(locale:Exclude<Locale,"en"|"tr">,field:AnswerField,name:string,value:string){
 const copy=LOCALIZED_MODEL_ANSWERS[locale][field];
 // Single pass: a model name containing literal braces cannot create placeholders.
 const fill=(text:string)=>text.replace(/\{([nv])\}/g,(_,key)=>key==="n"?name:value);
 return {question:fill(copy.question),answer:fill(copy.answer)};
}
// Methodology and the three technical term guides currently exist only in EN/TR.
export function modelAnswerMethodLocale(locale:Locale):"en"|"tr" {return locale==="tr"?"tr":"en";}
export function hasModelAnswerTermGuides(locale:Locale):boolean {return locale==="en"||locale==="tr";}
