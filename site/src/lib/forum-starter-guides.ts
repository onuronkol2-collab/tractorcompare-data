import type {Locale} from "./locales.ts";
/** Original editorial writing prompts. Not user-generated posts or SEO discussion pages. */
export interface ForumStarterGuide {heading:string;intro:string;items:readonly {title:string;detail:string}[]}
export const FORUM_STARTER_GUIDES:Record<Locale,ForumStarterGuide>={
  "en": {
    "heading": "Start with a question others can actually answer",
    "intro": "These are editorial examples, not fabricated community posts. Share the exact tractor and working conditions; avoid posting personal details.",
    "items": [
      {
        "title": "Cold-start difficulty",
        "detail": "Name the model, model year, ambient temperature and any dashboard warning. Describe what you observed without reaching near moving engine parts."
      },
      {
        "title": "Choosing a compatible implement",
        "detail": "State the tractor variant, PTO requirement, attachment weight and the implement's manufacturer label. Do not assume that PTO power equals engine power."
      },
      {
        "title": "Comparing real fuel use",
        "detail": "Describe the task, hours, field area, fuel quantity, tyres and soil conditions. One owner's result is not a universal consumption figure."
      }
    ]
  },
  "tr": {
    "heading": "Başkalarının yanıtlayabileceği bir soru sor",
    "intro": "Bunlar gerçek kullanıcı gönderisi değil, editoryal konu örnekleridir. Traktörün tam kimliğini ve çalışma koşullarını belirt; kişisel bilgilerini paylaşma.",
    "items": [
      {
        "title": "Soğuk havada zor çalışma",
        "detail": "Marka, model, yıl, hava sıcaklığı ve varsa gösterge uyarısını belirt. Gözlemini anlatırken hareketli motor parçalarına yaklaşma."
      },
      {
        "title": "Uygun ekipman seçimi",
        "detail": "Traktör varyantını, ekipmanın kuyruk mili gereksinimini, ağırlığını ve üretici etiketini yaz. Motor gücü ile kuyruk mili gücünü aynı kabul etme."
      },
      {
        "title": "Gerçek yakıt tüketimini karşılaştırma",
        "detail": "Yapılan işi, çalışma saatini, alanı, yakıt miktarını, lastikleri ve toprak koşullarını belirt. Tek bir kullanıcının verisini tüm modellere genelleme."
      }
    ]
  },
  "zh": {
    "heading": "提出别人能够准确回答的问题",
    "intro": "以下是编辑提供的示例，并非真实用户帖子。请说明拖拉机的具体型号和作业条件，不要公开个人信息。",
    "items": [
      {
        "title": "寒冷天气下启动困难",
        "detail": "写明品牌、型号、年份、气温及仪表盘警告信息。描述观察到的现象，不要靠近运转中的发动机部件。"
      },
      {
        "title": "选择匹配的农具",
        "detail": "注明拖拉机配置、农具所需的动力输出轴转速、重量和制造商铭牌。不要将发动机功率等同于动力输出轴功率。"
      },
      {
        "title": "比较实际燃油消耗",
        "detail": "说明作业类型、工时、作业面积、用油量、轮胎和土壤条件。不要把单个用户的数据当作所有车型的表现。"
      }
    ]
  },
  "hi": {
    "heading": "ऐसा सवाल पूछें जिसका सही जवाब दिया जा सके",
    "intro": "ये संपादकीय उदाहरण हैं, वास्तविक उपयोगकर्ताओं की पोस्ट नहीं। ट्रैक्टर का सटीक मॉडल और काम की परिस्थितियाँ बताएँ; निजी जानकारी साझा न करें।",
    "items": [
      {
        "title": "ठंड में स्टार्ट होने में परेशानी",
        "detail": "ब्रांड, मॉडल, वर्ष, तापमान और डैशबोर्ड पर दिखी चेतावनी बताएँ। अपना अनुभव लिखें, लेकिन चलते इंजन के पुर्ज़ों के पास न जाएँ।"
      },
      {
        "title": "सही कृषि उपकरण चुनना",
        "detail": "ट्रैक्टर का वेरिएंट, उपकरण की PTO आवश्यकता, वजन और निर्माता के लेबल का विवरण दें। इंजन पावर और PTO पावर को एक जैसा न मानें।"
      },
      {
        "title": "वास्तविक डीज़ल खपत की तुलना",
        "detail": "काम का प्रकार, घंटे, खेत का क्षेत्रफल, इस्तेमाल हुआ ईंधन, टायर और मिट्टी की स्थिति लिखें। एक व्यक्ति के आँकड़ों को सभी मॉडलों पर लागू न करें।"
      }
    ]
  },
  "pt-br": {
    "heading": "Faça uma pergunta que outras pessoas possam responder",
    "intro": "Estes são exemplos editoriais, não publicações inventadas de usuários. Informe o modelo exato e as condições de trabalho, sem divulgar dados pessoais.",
    "items": [
      {
        "title": "Dificuldade para ligar no frio",
        "detail": "Informe marca, modelo, ano, temperatura ambiente e avisos no painel. Descreva o que observou sem se aproximar de peças do motor em movimento."
      },
      {
        "title": "Escolha de um implemento compatível",
        "detail": "Indique a versão do trator, a rotação exigida na TDP, o peso e a identificação do fabricante do implemento. Não confunda potência do motor com potência na TDP."
      },
      {
        "title": "Comparação do consumo real",
        "detail": "Registre a tarefa, as horas, a área trabalhada, o combustível usado, os pneus e as condições do solo. Um relato isolado não representa todos os modelos."
      }
    ]
  },
  "fr": {
    "heading": "Posez une question à laquelle on peut répondre précisément",
    "intro": "Il s'agit d'exemples rédigés par l'équipe éditoriale, pas de faux messages d'utilisateurs. Précisez le modèle et les conditions de travail, sans données personnelles.",
    "items": [
      {
        "title": "Démarrage difficile par temps froid",
        "detail": "Indiquez la marque, le modèle, l'année, la température et les éventuels voyants. Décrivez les symptômes sans vous approcher des pièces du moteur en mouvement."
      },
      {
        "title": "Choisir un outil compatible",
        "detail": "Précisez la version du tracteur, le régime de prise de force requis, le poids et la plaque constructeur de l'outil. Ne confondez pas puissance moteur et puissance à la prise de force."
      },
      {
        "title": "Comparer la consommation réelle",
        "detail": "Mentionnez la tâche, les heures, la surface, le carburant consommé, les pneus et le sol. Une mesure individuelle ne vaut pas pour tous les modèles."
      }
    ]
  },
  "de": {
    "heading": "Stelle eine Frage, die andere konkret beantworten können",
    "intro": "Dies sind redaktionelle Beispiele und keine erfundenen Nutzerbeiträge. Nenne das genaue Traktormodell und die Einsatzbedingungen, aber keine persönlichen Daten.",
    "items": [
      {
        "title": "Startprobleme bei Kälte",
        "detail": "Nenne Hersteller, Modell, Baujahr, Außentemperatur und Warnanzeigen. Beschreibe deine Beobachtungen, ohne in die Nähe beweglicher Motorteile zu greifen."
      },
      {
        "title": "Passendes Anbaugerät wählen",
        "detail": "Gib die Traktorvariante, die erforderliche Zapfwellendrehzahl, das Gerätegewicht und die Herstellerangaben an. Motor- und Zapfwellenleistung sind nicht dasselbe."
      },
      {
        "title": "Tatsächlichen Kraftstoffverbrauch vergleichen",
        "detail": "Beschreibe Arbeit, Betriebsstunden, bearbeitete Fläche, Kraftstoffmenge, Reifen und Bodenverhältnisse. Ein einzelner Erfahrungswert gilt nicht für alle Modelle."
      }
    ]
  },
  "ru": {
    "heading": "Задайте вопрос, на который можно ответить по существу",
    "intro": "Это редакционные примеры, а не вымышленные сообщения пользователей. Укажите точную модель и условия работы, не публикуя личные данные.",
    "items": [
      {
        "title": "Трудный запуск в мороз",
        "detail": "Укажите марку, модель, год, температуру воздуха и предупреждения на панели. Опишите симптомы, не приближаясь к движущимся деталям работающего двигателя."
      },
      {
        "title": "Подбор совместимого навесного оборудования",
        "detail": "Укажите исполнение трактора, требуемые обороты ВОМ, массу и данные с таблички производителя агрегата. Не путайте мощность двигателя и мощность на ВОМ."
      },
      {
        "title": "Сравнение реального расхода топлива",
        "detail": "Укажите вид работ, часы, площадь, объём топлива, шины и состояние почвы. Опыт одного владельца нельзя переносить на все модели."
      }
    ]
  },
  "ja": {
    "heading": "正確に答えてもらえる質問の書き方",
    "intro": "以下は編集部が作成した例で、架空の利用者投稿ではありません。トラクターの型式と作業条件を具体的に示し、個人情報は書かないでください。",
    "items": [
      {
        "title": "寒い日にエンジンが始動しにくい",
        "detail": "メーカー、型式、年式、外気温、警告灯の状態を記載してください。運転中のエンジンの可動部に近づかず、観察した症状を説明してください。"
      },
      {
        "title": "作業機の適合性を確認したい",
        "detail": "トラクターの仕様、作業機が必要とするPTO回転数、重量、メーカー銘板の情報を示してください。エンジン出力とPTO出力は同一ではありません。"
      },
      {
        "title": "実際の燃料消費量を比べたい",
        "detail": "作業内容、稼働時間、作業面積、燃料使用量、タイヤ、土壌条件を記載してください。一人の結果を全モデルに当てはめないでください。"
      }
    ]
  },
  "es": {
    "heading": "Haz una pregunta que otros puedan responder con precisión",
    "intro": "Son ejemplos editoriales, no publicaciones inventadas de usuarios. Indica el modelo exacto y las condiciones de trabajo sin compartir datos personales.",
    "items": [
      {
        "title": "Dificultad para arrancar en frío",
        "detail": "Indica la marca, el modelo, el año, la temperatura y las alertas del tablero. Describe los síntomas sin acercarte a las piezas móviles del motor."
      },
      {
        "title": "Elegir un implemento compatible",
        "detail": "Especifica la versión del tractor, el régimen de la toma de fuerza requerido, el peso y la placa del fabricante del implemento. No confundas potencia del motor con potencia en la TDF."
      },
      {
        "title": "Comparar el consumo real de combustible",
        "detail": "Anota la labor, las horas, la superficie, el combustible empleado, los neumáticos y el suelo. Una medición individual no representa a todos los modelos."
      }
    ]
  }
};
