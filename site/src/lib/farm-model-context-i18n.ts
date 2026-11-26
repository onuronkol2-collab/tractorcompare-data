import type {Locale} from "./locales";
const keys=["choose","select","facts","empty","open","caution","fieldArea","operatingPerHa","operatingField","areaUnit"] as const;
const rows:Record<Locale,readonly string[]>={
  "en": [
    "Choose a published tractor model",
    "Select a model",
    "Documented equipment-related facts",
    "No reviewed equipment facts are available for this exact model.",
    "Open model specifications",
    "Use these facts as references only; manually confirm measurement conditions and the implement manufacturer's requirements before entering them. Missing information stays unknown.",
    "Field area",
    "Operating cost per hectare (fuel + other hourly costs)",
    "Field operating cost (excluding annual fixed costs)",
    "Area unit"
  ],
  "tr": [
    "Yayımlanmış bir traktör modeli seç",
    "Model seç",
    "Ekipmanla ilgili belgelenmiş bilgiler",
    "Bu model için incelenmiş ekipman bilgisi bulunmuyor.",
    "Modelin teknik özelliklerini aç",
    "Bu bilgileri yalnızca referans olarak kullan; değerleri girmeden önce ölçüm koşullarını ve ekipman üreticisinin gereksinimlerini doğrula. Eksik bilgi bilinmiyor olarak kalır.",
    "Tarla alanı",
    "Hektar başına işletme gideri (yakıt + diğer saatlik giderler)",
    "Tarla işletme gideri (yıllık sabit giderler hariç)",
    "Alan birimi"
  ],
  "de": [
    "Veröffentlichtes Traktormodell auswählen",
    "Modell wählen",
    "Dokumentierte gerätebezogene Angaben",
    "Für dieses Modell liegen keine geprüften Geräteangaben vor.",
    "Technische Modelldaten öffnen",
    "Angaben nur als Referenz verwenden; Messbedingungen und Anforderungen des Geräteherstellers vor Eingabe prüfen. Fehlende Angaben bleiben unbekannt.",
    "Feldfläche",
    "Betriebskosten je Hektar (Kraftstoff + weitere Stundenkosten)",
    "Betriebskosten der Fläche (ohne jährliche Fixkosten)",
    "Flächeneinheit"
  ],
  "fr": [
    "Choisir un modèle de tracteur publié",
    "Choisir le modèle",
    "Données documentées liées aux outils",
    "Aucune donnée vérifiée sur les outils pour ce modèle précis.",
    "Ouvrir la fiche technique",
    "Utilisez ces données comme références uniquement ; vérifiez les conditions de mesure et les exigences du fabricant de l’outil avant la saisie. Les données manquantes restent inconnues.",
    "Surface de la parcelle",
    "Coût d’utilisation par hectare (carburant + autres coûts horaires)",
    "Coût d’utilisation de la parcelle (hors coûts fixes annuels)",
    "Unité de surface"
  ],
  "es": [
    "Elegir un modelo de tractor publicado",
    "Elegir modelo",
    "Datos documentados relativos a aperos",
    "No hay datos revisados de aperos para este modelo exacto.",
    "Abrir especificaciones del modelo",
    "Usa estos datos solo como referencia; confirma las condiciones de medición y los requisitos del fabricante del apero antes de introducirlos. Los datos ausentes siguen siendo desconocidos.",
    "Superficie del campo",
    "Coste operativo por hectárea (combustible + otros costes horarios)",
    "Coste operativo del campo (sin costes fijos anuales)",
    "Unidad de superficie"
  ],
  "pt-br": [
    "Escolher um modelo de trator publicado",
    "Escolher modelo",
    "Dados documentados relativos a implementos",
    "Não há dados revisados de implementos para este modelo exato.",
    "Abrir especificações do modelo",
    "Use os dados apenas como referência; confirme condições de medição e requisitos do fabricante do implemento antes de inserir valores. Dados ausentes permanecem desconhecidos.",
    "Área do talhão",
    "Custo operacional por hectare (combustível + outros custos por hora)",
    "Custo operacional do talhão (sem custos fixos anuais)",
    "Unidade de área"
  ],
  "ru": [
    "Выберите опубликованную модель трактора",
    "Выбрать модель",
    "Документированные данные об орудиях",
    "Для этой модели нет проверенных данных об орудиях.",
    "Открыть характеристики модели",
    "Используйте сведения только для справки; перед вводом проверьте условия измерения и требования производителя орудия. Отсутствующие сведения остаются неизвестными.",
    "Площадь поля",
    "Эксплуатационные затраты на гектар (топливо + прочие почасовые расходы)",
    "Эксплуатационные затраты на поле (без годовых постоянных затрат)",
    "Единица площади"
  ],
  "zh": [
    "选择已发布的拖拉机型号",
    "选择型号",
    "与农具有关的有据参数",
    "该具体型号暂无已审核的农具相关数据。",
    "打开型号技术参数",
    "这些数据仅供参考；输入前请确认测量条件和农具制造商的要求。缺失信息保持未知。",
    "田块面积",
    "每公顷运行成本（燃油＋其他小时成本）",
    "田块运行成本（不含年度固定成本）",
    "面积单位"
  ],
  "ja": [
    "公開済みトラクター型式を選択",
    "型式を選ぶ",
    "作業機に関する出典付き情報",
    "この型式には確認済みの作業機関連情報がありません。",
    "型式の仕様を開く",
    "情報は参考のみ。入力前に測定条件と作業機メーカーの要件を確認してください。不明な情報は不明のまま扱います。",
    "圃場面積",
    "1 ha当たり運用費（燃料＋その他時間費用）",
    "圃場運用費（年間固定費を除く）",
    "面積単位"
  ],
  "hi": [
    "प्रकाशित ट्रैक्टर मॉडल चुनें",
    "मॉडल चुनें",
    "उपकरण से जुड़े दस्तावेज़ी तथ्य",
    "इस सटीक मॉडल के लिए समीक्षित उपकरण तथ्य उपलब्ध नहीं हैं।",
    "मॉडल की तकनीकी विशेषताएँ खोलें",
    "इन तथ्यों को केवल संदर्भ मानें; दर्ज करने से पहले मापन की स्थितियाँ और उपकरण निर्माता की आवश्यकताएँ पुष्टि करें। अनुपलब्ध जानकारी अज्ञात ही रहती है।",
    "खेत का क्षेत्रफल",
    "प्रति हेक्टेयर संचालन लागत (ईंधन + अन्य प्रति घंटा खर्च)",
    "खेत संचालन लागत (वार्षिक स्थिर खर्च छोड़कर)",
    "क्षेत्रफल इकाई"
  ]
};
export function farmModelText(lang:Locale):Record<typeof keys[number],string>{return Object.fromEntries(keys.map((key,i)=>[key,rows[lang][i]])) as Record<typeof keys[number],string>}
