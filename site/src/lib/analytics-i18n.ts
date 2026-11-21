import { type Locale } from "./locales.ts";

export const GA4_MEASUREMENT_ID = "G-PZCNNEY1VN" as const;
export const ANALYTICS_CHOICE_KEY = "tractorvs_analytics_choice_v3" as const;
// Public Cloudflare site token verified in the live HTML. Not a secret key.
export const CLOUDFLARE_WEB_ANALYTICS_TOKEN = "3797c345a61a40c180b72ef3a95a23eb" as const;
export const CLARITY_PROJECT_ID = "zgzm6vovif" as const;

export const ANALYTICS_TEXT: Record<Locale, {
  consentTitle: string;
  consentDescription: string;
  clarityConsent: string;
  cloudflareConsent: string;
  accept: string;
  reject: string;
  settings: string;
  privacyLink: string;
  privacyTitle: string;
  privacyIntro: string;
  privacyCollect: string;
  privacyChoice: string;
  clarityCollect: string;
  cloudflareCollect: string;
  cloudflareInfo: string;
  microsoftInfo: string;
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
    "clarityConsent": "With your permission, Microsoft Clarity also measures clicks and scrolling and records browsing sessions with sensitive content masked. It is not loaded until you accept analytics.",
    "clarityCollect": "If you accept analytics, Microsoft Clarity may process page interactions, clicks, scrolling, device details and session recordings with sensitive content masked. Masking is an additional safeguard and does not replace privacy review. Clarity does not load before you agree.",
    "microsoftInfo": "Microsoft's privacy statement",
    "googleInfo": "Google's information about data use",
    "cloudflareConsent": "With your consent, Cloudflare Web Analytics also measures visits and page-loading performance without using cookies or browser storage. Its script loads only after you accept.",
    "cloudflareCollect": "If you accept analytics, Cloudflare Web Analytics measures page views and performance indicators, including Core Web Vitals. Its beacon does not use cookies or browser storage, but sends network requests to Cloudflare. TractorVS loads it only after consent.",
    "cloudflareInfo": "Cloudflare Web Analytics privacy information"
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
    "clarityConsent": "İzin verirsen Microsoft Clarity tıklama ve kaydırmaları ölçer, hassas içerikleri maskelenmiş gezinme oturumlarını kaydeder. Analize izin vermeden yüklenmez.",
    "clarityCollect": "Analize izin verirsen Microsoft Clarity sayfa etkileşimlerini, tıklamaları, kaydırmaları, cihaz bilgilerini ve hassas içerikleri maskelenmiş oturum kayıtlarını işleyebilir. Maskeleme, gizlilik denetiminin yerini tutmaz. İzin vermeden Clarity yüklenmez.",
    "microsoftInfo": "Microsoft'un gizlilik bildirimi",
    "googleInfo": "Google'ın veri kullanımı hakkında",
    "cloudflareConsent": "İzin verirsen Cloudflare Web Analytics, çerez veya tarayıcı depolaması kullanmadan sayfa ziyaretlerini ve yüklenme performansını ölçer. Analize izin vermeden yüklenmez.",
    "cloudflareCollect": "Analize izin verirsen Cloudflare Web Analytics sayfa görüntülemelerini ve Core Web Vitals dahil performans göstergelerini ölçer. İzleme kodu çerez veya tarayıcı depolaması kullanmaz; yine de Cloudflare'a ağ istekleri gönderilir. TractorVS, izin vermeden bu kodu yüklemez.",
    "cloudflareInfo": "Cloudflare Web Analytics gizlilik bilgileri"
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
    "clarityConsent": "经您同意后，Microsoft Clarity 还会分析点击、滚动并记录已遮蔽敏感内容的浏览会话。未经分析许可，不会加载该服务。",
    "clarityCollect": "如果您同意分析，Microsoft Clarity 可能处理页面交互、点击、滚动、设备信息及已遮蔽敏感内容的会话记录。遮蔽措施不能替代隐私审查。未经同意，不会加载 Clarity。",
    "microsoftInfo": "Microsoft 隐私声明",
    "googleInfo": "了解 Google 如何使用数据",
    "cloudflareConsent": "经您同意，Cloudflare Web Analytics 还会在不使用 Cookie 或浏览器存储空间的情况下测量页面访问和加载性能。未经同意，不会加载该脚本。",
    "cloudflareCollect": "如果您同意分析，Cloudflare Web Analytics 会测量页面浏览量及包括 Core Web Vitals 在内的性能指标。其脚本不使用 Cookie 或浏览器存储空间，但仍会向 Cloudflare 发送网络请求。TractorVS 不会在您同意前加载它。",
    "cloudflareInfo": "Cloudflare Web Analytics 隐私信息"
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
    "clarityConsent": "आपकी सहमति पर Microsoft Clarity क्लिक और स्क्रॉल का विश्लेषण करता है और संवेदनशील सामग्री छिपाकर ब्राउज़िंग सत्र रिकॉर्ड करता है। विश्लेषण की अनुमति के बिना यह लोड नहीं होता।",
    "clarityCollect": "विश्लेषण की अनुमति मिलने पर Microsoft Clarity पेज पर गतिविधियाँ, क्लिक, स्क्रॉल, डिवाइस की जानकारी और संवेदनशील सामग्री छिपाकर रिकॉर्ड किए गए सत्र प्रोसेस कर सकता है। जानकारी छिपाना गोपनीयता समीक्षा का विकल्प नहीं है। सहमति से पहले Clarity लोड नहीं होता।",
    "microsoftInfo": "Microsoft का गोपनीयता विवरण",
    "googleInfo": "Google डेटा का उपयोग कैसे करता है",
    "cloudflareConsent": "आपकी सहमति पर Cloudflare Web Analytics कुकीज़ या ब्राउज़र स्टोरेज के बिना पेज विज़िट और लोड होने की गति मापता है। सहमति से पहले इसकी स्क्रिप्ट लोड नहीं होती।",
    "cloudflareCollect": "यदि आप विश्लेषण स्वीकार करते हैं, तो Cloudflare Web Analytics पेज व्यू और Core Web Vitals सहित प्रदर्शन संकेतक मापता है। यह कुकीज़ या ब्राउज़र स्टोरेज का उपयोग नहीं करता, लेकिन Cloudflare को नेटवर्क अनुरोध भेजता है। सहमति से पहले TractorVS इसे लोड नहीं करता।",
    "cloudflareInfo": "Cloudflare Web Analytics की गोपनीयता जानकारी"
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
    "clarityConsent": "Com sua autorização, o Microsoft Clarity também analisa cliques e rolagens e grava sessões de navegação com conteúdo sensível ocultado. Ele não é carregado antes do consentimento.",
    "clarityCollect": "Se você aceitar a análise, o Microsoft Clarity poderá processar interações com páginas, cliques, rolagens, dados do dispositivo e gravações de sessões com conteúdo sensível ocultado. O mascaramento não substitui a revisão de privacidade. O Clarity não é carregado antes do consentimento.",
    "microsoftInfo": "Declaração de privacidade da Microsoft",
    "googleInfo": "Como o Google usa os dados",
    "cloudflareConsent": "Com sua permissão, o Cloudflare Web Analytics também mede visitas e desempenho de carregamento sem usar cookies ou armazenamento do navegador. O script só é carregado após seu consentimento.",
    "cloudflareCollect": "Se você aceitar a análise, o Cloudflare Web Analytics mede visualizações de páginas e indicadores de desempenho, incluindo Core Web Vitals. Seu script não usa cookies nem armazenamento do navegador, mas envia solicitações de rede à Cloudflare. O TractorVS só o carrega após sua permissão.",
    "cloudflareInfo": "Informações de privacidade do Cloudflare Web Analytics"
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
    "clarityConsent": "Avec votre accord, Microsoft Clarity analyse aussi les clics et le défilement et enregistre des sessions dont le contenu sensible est masqué. Il n'est pas chargé avant votre consentement.",
    "clarityCollect": "Si vous acceptez les statistiques, Microsoft Clarity peut traiter les interactions avec les pages, les clics, le défilement, les informations sur l'appareil et les enregistrements de session dont le contenu sensible est masqué. Le masquage ne remplace pas un contrôle de confidentialité. Clarity n'est pas chargé sans votre accord.",
    "microsoftInfo": "Déclaration de confidentialité de Microsoft",
    "googleInfo": "Comment Google utilise les données",
    "cloudflareConsent": "Avec votre accord, Cloudflare Web Analytics mesure aussi les visites et la vitesse de chargement sans utiliser de cookies ni le stockage du navigateur. Son script n'est chargé qu'après votre consentement.",
    "cloudflareCollect": "Si vous acceptez les statistiques, Cloudflare Web Analytics mesure les pages vues et les indicateurs de performance, dont les Core Web Vitals. Son script n'utilise ni cookies ni stockage du navigateur, mais envoie des requêtes à Cloudflare. TractorVS ne le charge pas avant votre accord.",
    "cloudflareInfo": "Informations de confidentialité de Cloudflare Web Analytics"
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
    "clarityConsent": "Mit Ihrer Einwilligung analysiert Microsoft Clarity auch Klicks und Scrollbewegungen und zeichnet Sitzungen mit maskierten sensiblen Inhalten auf. Vor Ihrer Zustimmung wird es nicht geladen.",
    "clarityCollect": "Wenn Sie der Analyse zustimmen, kann Microsoft Clarity Seiteninteraktionen, Klicks, Scrollbewegungen, Geräteinformationen und Sitzungsaufzeichnungen mit maskierten sensiblen Inhalten verarbeiten. Die Maskierung ersetzt keine Datenschutzprüfung. Ohne Einwilligung wird Clarity nicht geladen.",
    "microsoftInfo": "Datenschutzerklärung von Microsoft",
    "googleInfo": "Informationen zur Datennutzung durch Google",
    "cloudflareConsent": "Mit Ihrer Einwilligung misst Cloudflare Web Analytics auch Seitenaufrufe und Ladeleistung, ohne Cookies oder Browserspeicher zu verwenden. Das Skript wird erst nach Ihrer Zustimmung geladen.",
    "cloudflareCollect": "Bei Ihrer Einwilligung misst Cloudflare Web Analytics Seitenaufrufe und Leistungswerte einschließlich Core Web Vitals. Das Skript nutzt weder Cookies noch Browserspeicher, sendet aber Netzwerkanfragen an Cloudflare. TractorVS lädt es erst nach Ihrer Zustimmung.",
    "cloudflareInfo": "Datenschutzinformationen zu Cloudflare Web Analytics"
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
    "clarityConsent": "С вашего согласия Microsoft Clarity также анализирует клики и прокрутку и записывает сеансы с маскировкой конфиденциального содержимого. Без согласия на аналитику сервис не загружается.",
    "clarityCollect": "Если вы разрешите аналитику, Microsoft Clarity может обрабатывать взаимодействия со страницами, клики, прокрутку, сведения об устройстве и записи сеансов с маскировкой конфиденциального содержимого. Маскировка не заменяет проверку конфиденциальности. Без согласия Clarity не загружается.",
    "microsoftInfo": "Заявление Microsoft о конфиденциальности",
    "googleInfo": "Как Google использует данные",
    "cloudflareConsent": "С вашего согласия Cloudflare Web Analytics также измеряет посещения страниц и скорость загрузки без cookie и хранилища браузера. Скрипт загружается только после согласия.",
    "cloudflareCollect": "Если вы разрешите аналитику, Cloudflare Web Analytics измеряет просмотры страниц и показатели производительности, включая Core Web Vitals. Скрипт не использует cookie или хранилище браузера, но отправляет сетевые запросы в Cloudflare. TractorVS не загружает его до вашего согласия.",
    "cloudflareInfo": "Информация о конфиденциальности Cloudflare Web Analytics"
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
    "clarityConsent": "同意いただくと、Microsoft Clarity もクリックやスクロールを分析し、機密情報を隠した閲覧セッションを記録します。分析への同意前には読み込みません。",
    "clarityCollect": "分析に同意した場合、Microsoft Clarity はページ操作、クリック、スクロール、端末情報、機密情報を隠したセッション記録を処理することがあります。マスキングはプライバシー審査の代わりにはなりません。同意前には Clarity を読み込みません。",
    "microsoftInfo": "Microsoft のプライバシーに関する声明",
    "googleInfo": "Google によるデータの利用について",
    "cloudflareConsent": "同意いただいた場合、Cloudflare Web Analytics も Cookie やブラウザーの保存領域を使用せず、ページ閲覧数と読み込み性能を測定します。同意前にはスクリプトを読み込みません。",
    "cloudflareCollect": "分析に同意すると、Cloudflare Web Analytics はページ表示数と Core Web Vitals を含む性能指標を測定します。Cookie やブラウザーの保存領域は使いませんが、Cloudflare への通信は発生します。TractorVS は同意前には読み込みません。",
    "cloudflareInfo": "Cloudflare Web Analytics のプライバシー情報"
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
    "clarityConsent": "Con tu consentimiento, Microsoft Clarity también analiza clics y desplazamientos y graba sesiones de navegación con el contenido sensible oculto. No se carga antes de que aceptes el análisis.",
    "clarityCollect": "Si aceptas el análisis, Microsoft Clarity puede procesar interacciones con las páginas, clics, desplazamientos, datos del dispositivo y grabaciones de sesiones con contenido sensible oculto. El enmascaramiento no sustituye una revisión de privacidad. Clarity no se carga sin tu consentimiento.",
    "microsoftInfo": "Declaración de privacidad de Microsoft",
    "googleInfo": "Cómo utiliza Google los datos",
    "cloudflareConsent": "Con tu consentimiento, Cloudflare Web Analytics también mide las visitas y el rendimiento de carga sin utilizar cookies ni almacenamiento del navegador. Su código solo se carga después de aceptar.",
    "cloudflareCollect": "Si aceptas el análisis, Cloudflare Web Analytics mide páginas vistas e indicadores de rendimiento, incluidos los Core Web Vitals. Su código no utiliza cookies ni almacenamiento del navegador, pero envía solicitudes de red a Cloudflare. TractorVS no lo carga antes de tu consentimiento.",
    "cloudflareInfo": "Información de privacidad de Cloudflare Web Analytics"
  }
};

export function analyticsText(locale: Locale) {
  return ANALYTICS_TEXT[locale];
}
