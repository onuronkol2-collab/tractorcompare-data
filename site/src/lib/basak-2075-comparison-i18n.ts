import type {Locale} from "./locales.ts";

/**
 * Ten-language source-bounded editorial comparison of two distinct Başak variants.
 * Numeric values are sourced in the component from the exact manufacturer pages;
 * this module translates only prose and labels, never technical evidence.
 */
export interface BasakVariantComparisonCopy {
  heading:string;lead:string;metric:string;bk:string;bt:string;
  labels:readonly [string,string,string,string,string];
  note:string;twoWheel:string;sources:string;viewBt:string;checked:string;
}

export const BASAK_VARIANT_COMPARISON_COPY: Record<Locale,BasakVariantComparisonCopy> = {
  "en": {
    "heading": "Başak 2075 BK 4WD vs 2075 BT: what actually differs?",
    "lead": "Both manufacturer product tables report 72 hp, 273 Nm and a 16-forward/8-reverse gearbox. Their listed wheelbases and unballasted tractor masses are not the same; the exact variant must be checked before comparing.",
    "metric": "Manufacturer specification",
    "bk": "2075 BK (listed 4WD configuration)",
    "bt": "2075 BT (listed configuration)",
    "labels": [
      "Engine power",
      "Maximum engine torque",
      "Gearbox",
      "Wheelbase",
      "Tractor mass without additional ballast"
    ],
    "note": "The manufacturer's figures differ by 85 mm in wheelbase and 435 kg in unballasted mass. Neither difference by itself measures traction, fuel consumption, safe implement load or field performance; equipment, year and market must be checked.",
    "twoWheel": "Important: Başak lists the separate 2075 BK 2WD with a 16-forward/6-reverse gearbox. Do not transfer the 4WD gearbox or mass figures to the 2WD model.",
    "sources": "Read both manufacturer tables and the separate 2WD variant",
    "viewBt": "View the published 2075 BT model on TractorVS",
    "checked": "Manufacturer pages reviewed 22 November 2026; no independent field test was performed."
  },
  "tr": {
    "heading": "Başak 2075 BK 4WD ile 2075 BT: gerçekten hangi değerler farklı?",
    "lead": "Üreticinin iki ürün tablosunda 72 HP, 273 Nm ve 16 ileri/8 geri şanzıman yer alıyor. Ancak dingil açıklığı ve ek ağırlıksız traktör kütlesi aynı değil; karşılaştırmadan önce tam varyantı kontrol etmek gerekiyor.",
    "metric": "Üretici teknik özelliği",
    "bk": "2075 BK (belgelenen 4WD düzeni)",
    "bt": "2075 BT (belgelenen düzen)",
    "labels": [
      "Motor gücü",
      "Azami motor torku",
      "Şanzıman",
      "Dingil açıklığı",
      "Ek ağırlıksız traktör kütlesi"
    ],
    "note": "Üretici tablolarında dingil açıklığı 85 mm, ek ağırlıksız kütle 435 kg farklı. Bu farklar tek başına çekişi, yakıt tüketimini, güvenli ekipman yükünü veya saha performansını kanıtlamaz; donanım, yıl ve pazarı doğrulayın.",
    "twoWheel": "Önemli: Başak, ayrı 2075 BK 2WD sürümünde 16 ileri/6 geri şanzıman belirtiyor. 4WD şanzıman ve kütle değerlerini 2WD modele aktarmayın.",
    "sources": "İki üretici tablosu ve ayrı 2WD varyantı için resmî kaynaklar",
    "viewBt": "TractorVS'de yayımlanmış 2075 BT modelini incele",
    "checked": "Üretici sayfaları 22 Kasım 2026'da yeniden incelendi; bağımsız saha testi yapılmadı."
  },
  "zh": {
    "heading": "Başak 2075 BK 四驱版与 2075 BT：哪些参数确实不同？",
    "lead": "制造商的两份产品参数表均列出 72 HP、273 Nm 和前进 16 挡／倒退 8 挡，但轴距和不含附加配重的整机质量并不相同。对比前应确认具体配置。",
    "metric": "制造商公布的参数",
    "bk": "2075 BK（所列四驱配置）",
    "bt": "2075 BT（所列配置）",
    "labels": [
      "发动机功率",
      "发动机最大扭矩",
      "变速箱挡位",
      "轴距",
      "不含附加配重的整机质量"
    ],
    "note": "制造商列出的轴距相差 85 mm，未加配重的质量相差 435 kg。这些差异本身不能证明牵引力、油耗、安全挂载重量或田间性能；还须核实配置、年份及销售市场。",
    "twoWheel": "注意：Başak 为独立的 2075 BK 两驱版列出前进 16 挡／倒退 6 挡。不得将四驱版的变速箱或质量数据直接用于两驱版。",
    "sources": "查看两份制造商参数表及独立的两驱版本",
    "viewBt": "查看 TractorVS 已发布的 2075 BT 型号",
    "checked": "制造商页面于 2026 年 11 月 22 日复核；未进行独立田间测试。"
  },
  "hi": {
    "heading": "Başak 2075 BK 4WD और 2075 BT: वास्तव में क्या अलग है?",
    "lead": "निर्माता की दोनों तकनीकी तालिकाओं में 72 HP, 273 Nm और 16 आगे/8 पीछे गियर दर्ज हैं, लेकिन व्हीलबेस तथा अतिरिक्त भार के बिना ट्रैक्टर का द्रव्यमान अलग है। तुलना से पहले सही संस्करण की पुष्टि करें।",
    "metric": "निर्माता का तकनीकी विवरण",
    "bk": "2075 BK (दर्ज 4WD संस्करण)",
    "bt": "2075 BT (दर्ज संस्करण)",
    "labels": [
      "इंजन की शक्ति",
      "अधिकतम इंजन टॉर्क",
      "गियरबॉक्स",
      "व्हीलबेस",
      "अतिरिक्त भार के बिना ट्रैक्टर का द्रव्यमान"
    ],
    "note": "निर्माता के आँकड़ों में व्हीलबेस का अंतर 85 mm और अतिरिक्त भार रहित द्रव्यमान का अंतर 435 kg है। इससे अपने आप खिंचाव, ईंधन खपत, सुरक्षित औज़ार भार या खेत में प्रदर्शन सिद्ध नहीं होता; उपकरण, वर्ष और बाज़ार की जाँच करें।",
    "twoWheel": "महत्त्वपूर्ण: अलग 2075 BK 2WD संस्करण के लिए Başak ने 16 आगे/6 पीछे गियर दर्ज किए हैं। 4WD के गियरबॉक्स या द्रव्यमान के आँकड़े 2WD पर लागू न करें।",
    "sources": "निर्माता की दोनों तालिकाएँ और अलग 2WD संस्करण देखें",
    "viewBt": "TractorVS पर प्रकाशित 2075 BT मॉडल देखें",
    "checked": "निर्माता पृष्ठों की 22 नवंबर 2026 को पुनः जाँच हुई; स्वतंत्र मैदानी परीक्षण नहीं किया गया।"
  },
  "pt-br": {
    "heading": "Başak 2075 BK 4WD e 2075 BT: quais dados realmente diferem?",
    "lead": "As duas tabelas do fabricante informam 72 HP, 273 Nm e câmbio de 16 marchas à frente/8 à ré. Entretanto, a distância entre eixos e a massa sem lastro adicional são diferentes. Confirme a configuração exata antes de comparar.",
    "metric": "Especificação do fabricante",
    "bk": "2075 BK (configuração 4WD indicada)",
    "bt": "2075 BT (configuração indicada)",
    "labels": [
      "Potência do motor",
      "Torque máximo do motor",
      "Câmbio",
      "Distância entre eixos",
      "Massa do trator sem lastro adicional"
    ],
    "note": "Os dados do fabricante diferem em 85 mm de entre-eixos e 435 kg de massa sem lastro. Essas diferenças, isoladamente, não comprovam tração, consumo, carga segura do implemento ou desempenho em campo; verifique versão, ano e mercado.",
    "twoWheel": "Atenção: a versão separada 2075 BK 2WD apresenta câmbio de 16 marchas à frente/6 à ré. Não aplique ao 2WD os dados de câmbio ou massa da configuração 4WD.",
    "sources": "Consulte as duas tabelas oficiais e a versão 2WD separada",
    "viewBt": "Ver o modelo 2075 BT publicado no TractorVS",
    "checked": "Páginas do fabricante verificadas em 22 de novembro de 2026; não houve ensaio independente de campo."
  },
  "fr": {
    "heading": "Başak 2075 BK 4WD et 2075 BT : quelles données diffèrent vraiment ?",
    "lead": "Les deux fiches constructeur indiquent 72 HP, 273 Nm et une boîte à 16 rapports avant/8 arrière. L'empattement et la masse sans lest supplémentaire diffèrent cependant. Vérifiez la version exacte avant toute comparaison.",
    "metric": "Caractéristique constructeur",
    "bk": "2075 BK (configuration 4WD indiquée)",
    "bt": "2075 BT (configuration indiquée)",
    "labels": [
      "Puissance moteur",
      "Couple moteur maximal",
      "Boîte de vitesses",
      "Empattement",
      "Masse du tracteur sans lest supplémentaire"
    ],
    "note": "Les données constructeur présentent un écart de 85 mm d'empattement et de 435 kg de masse sans lest. Ces écarts ne prouvent pas, à eux seuls, la traction, la consommation, la charge sûre des outils ou les performances au champ ; vérifiez équipements, année et marché.",
    "twoWheel": "Attention : pour la version distincte 2075 BK 2WD, Başak indique 16 rapports avant/6 arrière. Ne transposez pas à cette version les données de boîte ou de masse du modèle 4WD.",
    "sources": "Consulter les deux fiches constructeur et la version 2WD distincte",
    "viewBt": "Voir le modèle 2075 BT publié sur TractorVS",
    "checked": "Pages constructeur revérifiées le 22 novembre 2026 ; aucun essai au champ indépendant."
  },
  "de": {
    "heading": "Başak 2075 BK 4WD und 2075 BT: Welche Daten unterscheiden sich?",
    "lead": "Beide Herstellerdatenblätter nennen 72 HP, 273 Nm und ein Getriebe mit 16 Vorwärts- und 8 Rückwärtsgängen. Radstand und Masse ohne Zusatzballast unterscheiden sich jedoch. Vor dem Vergleich die genaue Ausführung prüfen.",
    "metric": "Herstellerangabe",
    "bk": "2075 BK (angegebene 4WD-Ausführung)",
    "bt": "2075 BT (angegebene Ausführung)",
    "labels": [
      "Motorleistung",
      "Maximales Motordrehmoment",
      "Getriebe",
      "Radstand",
      "Traktormasse ohne Zusatzballast"
    ],
    "note": "Die Herstellerangaben unterscheiden sich beim Radstand um 85 mm und bei der Masse ohne Zusatzballast um 435 kg. Daraus allein folgen keine Aussagen zu Zugkraft, Kraftstoffverbrauch, sicherer Gerätebelastung oder Feldleistung; Ausstattung, Baujahr und Markt prüfen.",
    "twoWheel": "Wichtig: Für die separate Ausführung 2075 BK 2WD nennt Başak 16 Vorwärts- und 6 Rückwärtsgänge. Getriebe- und Massedaten der 4WD-Ausführung dürfen nicht übernommen werden.",
    "sources": "Beide Herstellerdatenblätter und die separate 2WD-Version prüfen",
    "viewBt": "Veröffentlichtes Modell 2075 BT auf TractorVS ansehen",
    "checked": "Herstellerseiten am 22. November 2026 erneut geprüft; kein unabhängiger Praxistest."
  },
  "ru": {
    "heading": "Başak 2075 BK 4WD и 2075 BT: какие характеристики действительно различаются?",
    "lead": "В двух таблицах производителя указаны 72 HP, 273 Н·м и коробка с 16 передачами вперёд/8 назад. Однако колёсная база и масса без дополнительного балласта отличаются. Перед сравнением уточните конкретную комплектацию.",
    "metric": "Данные производителя",
    "bk": "2075 BK (указанная версия 4WD)",
    "bt": "2075 BT (указанная версия)",
    "labels": [
      "Мощность двигателя",
      "Максимальный крутящий момент",
      "Коробка передач",
      "Колёсная база",
      "Масса трактора без дополнительного балласта"
    ],
    "note": "По сведениям производителя колёсная база различается на 85 мм, а масса без балласта — на 435 кг. Эти различия сами по себе не доказывают тяговое усилие, расход топлива, допустимую нагрузку орудия или работу в поле; проверьте оснащение, год и рынок.",
    "twoWheel": "Важно: для отдельной версии 2075 BK 2WD Başak указывает 16 передач вперёд/6 назад. Нельзя переносить на неё данные коробки или массы версии 4WD.",
    "sources": "Открыть обе таблицы производителя и отдельную версию 2WD",
    "viewBt": "Посмотреть опубликованную модель 2075 BT на TractorVS",
    "checked": "Страницы производителя повторно проверены 22 ноября 2026 года; независимых полевых испытаний не проводилось."
  },
  "ja": {
    "heading": "Başak 2075 BK 4WD と 2075 BT：実際に異なる仕様は？",
    "lead": "メーカーの両製品仕様表には72 HP、273 Nm、前進16段／後進8段と記載されています。一方、ホイールベースと追加バラストを除いた車体質量は異なります。比較前に仕様を特定してください。",
    "metric": "メーカー公表仕様",
    "bk": "2075 BK（掲載の4WD仕様）",
    "bt": "2075 BT（掲載仕様）",
    "labels": [
      "エンジン出力",
      "エンジン最大トルク",
      "変速段数",
      "ホイールベース",
      "追加バラストを除くトラクター質量"
    ],
    "note": "メーカー掲載値ではホイールベースに85 mm、追加バラストなしの質量に435 kgの差があります。これだけで牽引力、燃料消費、安全な作業機荷重、実地性能の優劣は判断できません。装備、年式、市場を確認してください。",
    "twoWheel": "注意：別仕様の2075 BK 2WDは前進16段／後進6段と記載されています。4WDの変速機や質量の値を2WDに流用しないでください。",
    "sources": "メーカーの2製品仕様表と別の2WD仕様を確認",
    "viewBt": "TractorVS掲載の2075 BTモデルを見る",
    "checked": "メーカーサイトを2026年11月22日に再確認。独立した実地試験は行っていません。"
  },
  "es": {
    "heading": "Başak 2075 BK 4WD frente a 2075 BT: ¿qué datos cambian realmente?",
    "lead": "Las dos fichas del fabricante indican 72 HP, 273 Nm y una caja de 16 marchas adelante/8 atrás. Sin embargo, la distancia entre ejes y la masa sin lastre adicional difieren. Compruebe la versión exacta antes de comparar.",
    "metric": "Especificación del fabricante",
    "bk": "2075 BK (configuración 4WD indicada)",
    "bt": "2075 BT (configuración indicada)",
    "labels": [
      "Potencia del motor",
      "Par motor máximo",
      "Caja de cambios",
      "Distancia entre ejes",
      "Masa del tractor sin lastre adicional"
    ],
    "note": "Las cifras del fabricante difieren en 85 mm de distancia entre ejes y 435 kg de masa sin lastre. Estas diferencias por sí solas no demuestran tracción, consumo, carga segura del apero ni rendimiento en campo; compruebe equipamiento, año y mercado.",
    "twoWheel": "Importante: para la versión independiente 2075 BK 2WD, Başak indica 16 marchas adelante/6 atrás. No traslade a esa versión los datos de caja o masa de la 4WD.",
    "sources": "Consultar ambas fichas del fabricante y la versión 2WD independiente",
    "viewBt": "Ver el modelo 2075 BT publicado en TractorVS",
    "checked": "Páginas del fabricante revisadas el 22 de noviembre de 2026; no se realizó una prueba de campo independiente."
  }
};
