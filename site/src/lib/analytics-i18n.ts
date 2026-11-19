import { type Locale } from "./locales.ts";

export const GA4_MEASUREMENT_ID = "G-PZCNNEY1VN" as const;
export const ANALYTICS_CHOICE_KEY = "tractorvs_analytics_choice_v1" as const;

export const ANALYTICS_TEXT: Record<Locale, {
  consentTitle: string;
  consentDescription: string;
  accept: string;
  reject: string;
  settings: string;
  privacyLink: string;
  privacyTitle: string;
  privacyIntro: string;
  privacyCollect: string;
  privacyChoice: string;
  googleInfo: string;
}> = {
  "en": {
    "consentTitle": "Optional site analytics",
    "consentDescription": "If you agree, Google Analytics helps us understand visits to tractor pages. Google may use cookies and process usage data. Nothing is sent to Google Analytics before you choose Accept.",
    "accept": "Accept analytics",
    "reject": "Reject analytics",
    "settings": "Analytics preferences",
    "privacyLink": "Privacy & analytics",
    "privacyTitle": "Privacy and analytics",
    "privacyIntro": "TractorVS uses optional Google Analytics measurement. It is not required for browsing tractor specifications, sources or comparisons.",
    "privacyCollect": "If you accept, Google Analytics may receive pages viewed, interactions, approximate location and device details, and set analytics cookies. Google processes this information under its own terms.",
    "privacyChoice": "Before consent, TractorVS does not load Google Analytics. You can reject analytics and continue using the site. Use “Analytics preferences” in the footer to change your choice. Rejecting future measurement does not delete data already received by Google.",
    "googleInfo": "Google's information about data use"
  },
  "tr": {
    "consentTitle": "İsteğe bağlı site analizi",
    "consentDescription": "İzin verirsen Google Analytics, traktör sayfalarımızın kullanımını anlamamıza yardımcı olur. Google çerez kullanabilir ve kullanım verilerini işleyebilir. Kabul etmeden Google Analytics yüklenmez.",
    "accept": "Analize izin ver",
    "reject": "Analizi reddet",
    "settings": "Analiz tercihleri",
    "privacyLink": "Gizlilik ve analiz",
    "privacyTitle": "Gizlilik ve analiz",
    "privacyIntro": "TractorVS isteğe bağlı Google Analytics ölçümü kullanır. Traktör özelliklerini, kaynakları ve karşılaştırmaları incelemek için bu ölçüm gerekli değildir.",
    "privacyCollect": "Kabul edersen Google Analytics ziyaret edilen sayfaları, etkileşimleri, yaklaşık konumu ve cihaz bilgilerini alabilir; analiz çerezleri kullanabilir. Google bu bilgileri kendi koşullarına göre işler.",
    "privacyChoice": "İzin vermeden Google Analytics yüklenmez. Analizi reddedip siteyi kullanmaya devam edebilirsin. Tercihini değiştirmek için alt kısımdaki “Analiz tercihleri” düğmesini kullan. Reddetmek, Google'a önceden gönderilen verileri silmez.",
    "googleInfo": "Google'ın veri kullanımı hakkında"
  },
  "zh": {
    "consentTitle": "可选的网站分析",
    "consentDescription": "如果您同意，Google Analytics 将帮助我们了解拖拉机页面的使用情况。Google 可能使用 Cookie 并处理使用数据。在您选择同意之前，我们不会加载 Google Analytics。",
    "accept": "同意分析",
    "reject": "拒绝分析",
    "settings": "分析偏好设置",
    "privacyLink": "隐私与分析",
    "privacyTitle": "隐私与分析",
    "privacyIntro": "TractorVS 使用可选的 Google Analytics 分析。浏览拖拉机参数、来源和比较功能无需同意分析。",
    "privacyCollect": "同意后，Google Analytics 可能接收您浏览的页面、交互、粗略位置及设备信息，并设置分析 Cookie。Google 将依照其条款处理相关信息。",
    "privacyChoice": "未经同意，我们不会加载 Google Analytics。您可以拒绝并继续使用网站。通过页脚的“分析偏好设置”更改选择。拒绝后续分析不会删除此前已发送给 Google 的数据。",
    "googleInfo": "了解 Google 如何使用数据"
  },
  "hi": {
    "consentTitle": "वैकल्पिक वेबसाइट विश्लेषण",
    "consentDescription": "यदि आप सहमति देते हैं, तो Google Analytics हमें ट्रैक्टर पेजों के उपयोग को समझने में मदद करता है। Google कुकीज़ का उपयोग और उपयोग संबंधी डेटा प्रोसेस कर सकता है। आपकी सहमति से पहले यह लोड नहीं होता।",
    "accept": "विश्लेषण स्वीकार करें",
    "reject": "विश्लेषण अस्वीकार करें",
    "settings": "विश्लेषण प्राथमिकताएँ",
    "privacyLink": "गोपनीयता और विश्लेषण",
    "privacyTitle": "गोपनीयता और विश्लेषण",
    "privacyIntro": "TractorVS वैकल्पिक Google Analytics का उपयोग करता है। ट्रैक्टर विवरण, स्रोत और तुलना देखने के लिए इसकी अनुमति आवश्यक नहीं है।",
    "privacyCollect": "सहमति देने पर Google Analytics देखे गए पेज, गतिविधियाँ, अनुमानित स्थान और डिवाइस जानकारी प्राप्त कर सकता है तथा विश्लेषण कुकीज़ सेट कर सकता है। Google अपनी शर्तों के अनुसार डेटा प्रोसेस करता है।",
    "privacyChoice": "सहमति से पहले Google Analytics लोड नहीं होता। आप विश्लेषण अस्वीकार करके साइट का उपयोग जारी रख सकते हैं। विकल्प बदलने के लिए फ़ुटर में “विश्लेषण प्राथमिकताएँ” चुनें। अस्वीकृति से Google को पहले भेजा गया डेटा नहीं मिटता।",
    "googleInfo": "Google डेटा का उपयोग कैसे करता है"
  },
  "pt-br": {
    "consentTitle": "Análise opcional do site",
    "consentDescription": "Com sua permissão, o Google Analytics nos ajuda a entender o uso das páginas de tratores. O Google pode usar cookies e tratar dados de utilização. O Analytics não é carregado antes do seu consentimento.",
    "accept": "Aceitar análise",
    "reject": "Recusar análise",
    "settings": "Preferências de análise",
    "privacyLink": "Privacidade e análise",
    "privacyTitle": "Privacidade e análise",
    "privacyIntro": "O TractorVS usa o Google Analytics de forma opcional. Ele não é necessário para consultar especificações, fontes e comparações de tratores.",
    "privacyCollect": "Se você aceitar, o Google Analytics poderá receber páginas acessadas, interações, localização aproximada e dados do dispositivo, além de definir cookies analíticos. O Google trata esses dados conforme seus termos.",
    "privacyChoice": "Antes do consentimento, o Google Analytics não é carregado. Você pode recusar e continuar usando o site. Altere sua decisão em “Preferências de análise” no rodapé. A recusa não apaga dados já enviados ao Google.",
    "googleInfo": "Como o Google usa os dados"
  },
  "fr": {
    "consentTitle": "Statistiques facultatives",
    "consentDescription": "Avec votre accord, Google Analytics nous aide à comprendre l'utilisation des pages de tracteurs. Google peut utiliser des cookies et traiter des données d'utilisation. Aucun outil Analytics n'est chargé avant votre accord.",
    "accept": "Accepter les statistiques",
    "reject": "Refuser",
    "settings": "Préférences statistiques",
    "privacyLink": "Confidentialité et statistiques",
    "privacyTitle": "Confidentialité et statistiques",
    "privacyIntro": "TractorVS utilise Google Analytics de manière facultative. Ce service n'est pas nécessaire pour consulter les fiches techniques, les sources et les comparaisons.",
    "privacyCollect": "Si vous acceptez, Google Analytics peut recevoir les pages consultées, les interactions, une localisation approximative et des données sur l'appareil, et déposer des cookies de mesure. Google traite ces données selon ses conditions.",
    "privacyChoice": "Google Analytics n'est pas chargé avant votre accord. Vous pouvez refuser tout en utilisant le site. Modifiez votre choix via « Préférences statistiques » en pied de page. Le refus n'efface pas les données déjà transmises à Google.",
    "googleInfo": "Comment Google utilise les données"
  },
  "de": {
    "consentTitle": "Optionale Website-Analyse",
    "consentDescription": "Mit Ihrer Zustimmung hilft uns Google Analytics, die Nutzung der Traktorenseiten zu verstehen. Google kann Cookies setzen und Nutzungsdaten verarbeiten. Vor Ihrer Zustimmung wird Analytics nicht geladen.",
    "accept": "Analyse zulassen",
    "reject": "Analyse ablehnen",
    "settings": "Analyse-Einstellungen",
    "privacyLink": "Datenschutz und Analyse",
    "privacyTitle": "Datenschutz und Analyse",
    "privacyIntro": "TractorVS setzt Google Analytics nur optional ein. Für Traktordaten, Quellen und Vergleiche ist die Analyse nicht erforderlich.",
    "privacyCollect": "Nach Ihrer Zustimmung kann Google Analytics aufgerufene Seiten, Interaktionen, ungefähre Standortdaten und Geräteinformationen erhalten und Analyse-Cookies setzen. Google verarbeitet diese Daten nach seinen eigenen Bedingungen.",
    "privacyChoice": "Vor Ihrer Zustimmung wird Google Analytics nicht geladen. Sie können ablehnen und die Website weiter nutzen. Ihre Wahl lässt sich über „Analyse-Einstellungen“ in der Fußzeile ändern. Eine Ablehnung löscht keine zuvor an Google gesendeten Daten.",
    "googleInfo": "Informationen zur Datennutzung durch Google"
  },
  "ru": {
    "consentTitle": "Необязательная аналитика сайта",
    "consentDescription": "С вашего согласия Google Analytics поможет нам понять, как используют страницы тракторов. Google может применять cookie и обрабатывать данные об использовании. До согласия Analytics не загружается.",
    "accept": "Разрешить аналитику",
    "reject": "Отклонить",
    "settings": "Настройки аналитики",
    "privacyLink": "Конфиденциальность и аналитика",
    "privacyTitle": "Конфиденциальность и аналитика",
    "privacyIntro": "TractorVS использует Google Analytics только с согласия. Для просмотра характеристик, источников и сравнения тракторов аналитика не обязательна.",
    "privacyCollect": "После согласия Google Analytics может получать сведения о просмотренных страницах, действиях, примерном местоположении и устройстве, а также устанавливать аналитические cookie. Google обрабатывает данные согласно своим условиям.",
    "privacyChoice": "До согласия Google Analytics не загружается. Вы можете отказаться и продолжать пользоваться сайтом. Изменить выбор можно через «Настройки аналитики» внизу страницы. Отказ не удаляет данные, ранее отправленные Google.",
    "googleInfo": "Как Google использует данные"
  },
  "ja": {
    "consentTitle": "任意のサイト分析",
    "consentDescription": "同意いただくと、Google Analytics によりトラクターのページ利用状況を把握できます。Google は Cookie を使用し、利用データを処理する場合があります。同意前には読み込みません。",
    "accept": "分析に同意する",
    "reject": "分析を拒否する",
    "settings": "分析の設定",
    "privacyLink": "プライバシーと分析",
    "privacyTitle": "プライバシーと分析",
    "privacyIntro": "TractorVS は任意で Google Analytics を利用します。トラクターの仕様、出典、比較機能の閲覧に同意は必要ありません。",
    "privacyCollect": "同意すると、Google Analytics が閲覧ページ、操作、概算の位置情報、端末情報を受け取り、分析用 Cookie を設定する場合があります。Google は独自の規約に従いデータを処理します。",
    "privacyChoice": "同意前に Google Analytics は読み込まれません。拒否してもサイトを利用できます。フッターの「分析の設定」から選択を変更できます。拒否しても以前 Google に送信されたデータは削除されません。",
    "googleInfo": "Google によるデータの利用について"
  },
  "es": {
    "consentTitle": "Análisis opcional del sitio",
    "consentDescription": "Si das tu consentimiento, Google Analytics nos ayuda a entender el uso de las páginas de tractores. Google puede utilizar cookies y procesar datos de uso. No cargamos Analytics antes de que aceptes.",
    "accept": "Aceptar análisis",
    "reject": "Rechazar análisis",
    "settings": "Preferencias de análisis",
    "privacyLink": "Privacidad y análisis",
    "privacyTitle": "Privacidad y análisis",
    "privacyIntro": "TractorVS utiliza Google Analytics de forma opcional. No es necesario para consultar fichas técnicas, fuentes o comparaciones.",
    "privacyCollect": "Si aceptas, Google Analytics puede recibir las páginas visitadas, las interacciones, la ubicación aproximada y datos del dispositivo, así como instalar cookies de análisis. Google procesa estos datos conforme a sus condiciones.",
    "privacyChoice": "Antes del consentimiento, Google Analytics no se carga. Puedes rechazarlo y seguir utilizando el sitio. Cambia tu elección desde «Preferencias de análisis» en el pie de página. Rechazarlo no elimina los datos enviados anteriormente a Google.",
    "googleInfo": "Cómo utiliza Google los datos"
  }
};

export function analyticsText(locale: Locale) {
  return ANALYTICS_TEXT[locale];
}
