import type {Locale} from "./locales.ts";

/**
 * Genuine localized editorial-index copy. The linked long-form body is NOT
 * automatically translated: destination language is checked separately.
 * card order matches the six curated entries in EditorialHub.astro.
 */
type EditorialCopy = {
 title:string;description:string;eyebrow:string;heading:string;intro:string;
 home:string;hub:string;jump:string;methods:string;trust:string;
 rules:readonly (readonly [string,string])[];
 guides:string;review:string;guidesIntro:string;reviewIntro:string;
 reviewLabel:string;guideLabel:string;checked:string;read:string;
 disclaimer:string;next:string;compare:string;catalog:string;
 breadcrumb:string;englishOriginal:string;
 cards:readonly (readonly [string,string])[];
};
export const EDITORIAL_HUB_TRANSLATIONS: Partial<Record<Locale,EditorialCopy>> = {
 zh:{
 title:"拖拉机文章与技术指南 | TractorVS",
 description:"阅读有资料依据的拖拉机指南：动力、扭矩、动力输出轴（PTO）、液压、选购方法及具体车型技术分析。",
 eyebrow:"有据可查的技术知识 • TRACTORVS",
 heading:"拖拉机文章与技术指南",
 intro:"选购拖拉机不能只比较宣传册上最大的数字。我们区分制造商声明、独立测试结果和技术解读，帮助您了解数据真正代表什么。",
 home:"首页",hub:"文章",jump:"浏览文章",methods:"了解我们的数据核实方法",trust:"我们如何编写这些文章？",
 rules:[
  ["核对原始资料","在适当位置提供制造商文件与测试资料链接，并将原始数据与我们的解读分开。"],
  ["不虚构实地测试","基于文件的车型分析并不等同于车主长期使用报告或独立田间试验。"],
  ["不捏造故障率","没有可比的样本规模和观察期，就不编造每百台拖拉机故障率或品牌可靠性排名。"]
 ],
 guides:"技术指南",review:"有来源依据的车型分析",
 guidesIntro:"先弄清测量值和测试条件，再比较不同拖拉机。",
 reviewIntro:"针对具体车型及配置、以制造商文件为基础的技术分析。",
 reviewLabel:"文件分析 • 非实地测试",guideLabel:"技术指南",checked:"最后编辑核查",read:"阅读文章",
 disclaimer:"未经核实的研究及尚未发表的草稿不在此列。搜索引擎是否收录及排名无法保证。",
 next:"把这些知识应用到实际车型",compare:"比较拖拉机",catalog:"拖拉机目录",
 breadcrumb:"导航路径",englishOriginal:"全文仅有英语版",
 cards:[
  ["如何选择适合工作的拖拉机","结合地形、农具、牵引力、维修服务和 PTO 要求制定选购清单。"],
  ["拖拉机部件和技术术语","以通俗例子解释发动机、传动系统、液压装置等部件。"],
  ["发动机功率、扭矩与测试标准","理解发动机功率、PTO 输出功率和牵引杆功率为何不能混为一谈。"],
  ["如何理解液压提升能力","区分液压泵流量、提升额定值及其测量位置。"],
  ["拖拉机 PTO 动力输出轴如何工作","了解 PTO 转速、输出功率、连接方式和农具安全要求。"],
  ["Başak 2075 BK：有依据的技术分析","结合具体配置和测量条件审视制造商提供的技术参数。"]
 ]
 },
 hi:{
 title:"ट्रैक्टर लेख और तकनीकी मार्गदर्शिकाएँ | TractorVS",
 description:"स्रोत-आधारित ट्रैक्टर लेख: इंजन शक्ति, टॉर्क, PTO, हाइड्रोलिक्स, ट्रैक्टर चयन और मॉडल-विशिष्ट तकनीकी विश्लेषण।",
 eyebrow:"प्रमाण-आधारित जानकारी • TRACTORVS",heading:"ट्रैक्टर लेख और तकनीकी मार्गदर्शिकाएँ",
 intro:"ट्रैक्टर चुनना केवल विवरणिका में दी गई सबसे बड़ी संख्या की तुलना करना नहीं है। यहाँ हम निर्माता के दावों, स्वतंत्र परीक्षणों और तकनीकी व्याख्या को अलग-अलग रखते हैं, ताकि आप आँकड़ों को सही संदर्भ में समझ सकें।",
 home:"मुख्य पृष्ठ",hub:"लेख",jump:"लेख देखें",methods:"हम डेटा कैसे सत्यापित करते हैं",trust:"हम लेख कैसे तैयार करते हैं?",
 rules:[
  ["मूल स्रोत जाँचें","जहाँ लागू हो, निर्माता के दस्तावेज़ और परीक्षण स्रोत जोड़ते हैं; स्रोत की जानकारी को अपने विश्लेषण से अलग रखते हैं।"],
  ["मैदानी परीक्षण का झूठा दावा नहीं","दस्तावेज़-आधारित समीक्षा को मालिक के लंबे अनुभव या स्वतंत्र खेत परीक्षण के रूप में प्रस्तुत नहीं करते।"],
  ["बिना प्रमाण प्रतिशत नहीं","तुलनीय नमूने और अवलोकन अवधि के बिना प्रति 100 ट्रैक्टर खराबी की दर या विश्वसनीयता क्रम नहीं बनाते।"]
 ],
 guides:"तकनीकी मार्गदर्शिकाएँ",review:"स्रोत-आधारित मॉडल विश्लेषण",
 guidesIntro:"माप का अर्थ और परीक्षण की शर्तें समझें, फिर अलग-अलग ट्रैक्टरों के आँकड़ों की तुलना करें।",
 reviewIntro:"सही मॉडल और वैरिएंट के निर्माता दस्तावेज़ों पर आधारित विश्लेषण।",
 reviewLabel:"दस्तावेज़ विश्लेषण • खेत परीक्षण नहीं",guideLabel:"तकनीकी मार्गदर्शिका",checked:"अंतिम संपादकीय जाँच",read:"लेख पढ़ें",
 disclaimer:"असत्यापित शोध और अप्रकाशित मसौदे यहाँ शामिल नहीं हैं। सर्च इंजन में सूचीबद्ध होने या रैंकिंग की गारंटी नहीं है।",
 next:"सीखी गई जानकारी को वास्तविक मॉडलों पर लागू करें",compare:"ट्रैक्टरों की तुलना करें",catalog:"ट्रैक्टर सूची",
 breadcrumb:"नेविगेशन क्रम",englishOriginal:"पूरा लेख केवल अंग्रेज़ी में",
 cards:[
  ["हॉर्सपावर से आगे: ट्रैक्टर कैसे चुनें","जमीन, कृषि उपकरण, पहियों की कर्षण क्षमता, सर्विस और PTO की जरूरतों की व्यावहारिक सूची बनाएँ।"],
  ["ट्रैक्टर के पुर्जे और तकनीकी शब्द","इंजन, ट्रांसमिशन, हाइड्रोलिक्स और अन्य पुर्जों के काम को सरल उदाहरणों से समझें।"],
  ["इंजन शक्ति, टॉर्क और परीक्षण मानक","जानें कि इंजन, PTO और ड्रॉबार की शक्ति एक ही माप नहीं हैं।"],
  ["हाइड्रोलिक उठाने की क्षमता समझें","पंप प्रवाह, उठाने की क्षमता और माप के स्थान का अंतर जानें।"],
  ["ट्रैक्टर का PTO कैसे काम करता है","PTO गति, शक्ति, कनेक्शन और उपकरण सुरक्षा समझें।"],
  ["Başak 2075 BK: स्रोत-आधारित तकनीकी समीक्षा","निर्माता के आँकड़े सही वैरिएंट और माप की सीमाओं के साथ पढ़ें।"]
 ]
 },
 "pt-br":{
 title:"Artigos e guias técnicos sobre tratores | TractorVS",
 description:"Artigos com fontes sobre potência, torque, TDP, hidráulica, escolha de tratores e análise técnica de modelos específicos.",
 eyebrow:"CONHECIMENTO COM FONTES • TRACTORVS",heading:"Artigos e guias técnicos sobre tratores",
 intro:"Escolher um trator não é apenas comparar o maior número de um catálogo. Aqui distinguimos declarações do fabricante, medições independentes e interpretação técnica para apoiar decisões mais bem fundamentadas.",
 home:"Início",hub:"Artigos",jump:"Explorar artigos",methods:"Como verificamos os dados",trust:"Como preparamos nossos artigos?",
 rules:[
  ["Fontes que você pode consultar","Indicamos documentos dos fabricantes e ensaios quando pertinentes, separando os dados da nossa interpretação."],
  ["Sem testes de campo inventados","Uma análise documental não é apresentada como experiência prolongada de um proprietário nem como ensaio independente em campo."],
  ["Sem percentuais fictícios","Sem amostras e períodos de observação comparáveis, não inventamos falhas por 100 tratores nem rankings de confiabilidade."]
 ],
 guides:"Guias técnicos",review:"Análise de modelo com fontes",
 guidesIntro:"Entenda o significado e as condições das medições antes de comparar especificações.",
 reviewIntro:"Análise baseada nos documentos do fabricante para o modelo e a versão exatos.",
 reviewLabel:"ANÁLISE DOCUMENTAL • NÃO É TESTE DE CAMPO",guideLabel:"GUIA TÉCNICO",checked:"Última revisão editorial",read:"Ler artigo",
 disclaimer:"Pesquisas não verificadas e rascunhos ainda não publicados não aparecem aqui. Não garantimos indexação nem posições nos buscadores.",
 next:"Aplique o conhecimento a modelos reais",compare:"Comparar tratores",catalog:"Catálogo de tratores",
 breadcrumb:"Caminho de navegação",englishOriginal:"Texto completo disponível apenas em inglês",
 cards:[
  ["Como escolher um trator além da potência","Monte uma lista prática considerando terreno, implementos, tração, assistência e requisitos da TDP."],
  ["Peças e termos técnicos de tratores","Entenda motor, transmissão, hidráulica e componentes com exemplos simples."],
  ["Potência do motor, torque e normas de ensaio","Saiba por que potência do motor, da TDP e da barra de tração são medições diferentes."],
  ["Como interpretar a capacidade de levante hidráulico","Diferencie vazão da bomba, capacidade de levante e ponto de medição."],
  ["Como funciona a tomada de potência (TDP)","Conheça rotação, potência, acoplamento e segurança dos implementos."],
  ["Başak 2075 BK: análise técnica com fontes","Leia os dados do fabricante respeitando a versão e os limites de medição."]
 ]
 },
 fr:{
 title:"Articles et guides techniques sur les tracteurs | TractorVS",
 description:"Guides sourcés sur la puissance, le couple, la prise de force, l'hydraulique, le choix d'un tracteur et les analyses de modèles.",
 eyebrow:"CONNAISSANCES SOURCÉES • TRACTORVS",heading:"Articles et guides techniques sur les tracteurs",
 intro:"Choisir un tracteur ne consiste pas simplement à comparer les plus grands chiffres d'une brochure. Nous distinguons les données des constructeurs, les essais indépendants et l'interprétation technique pour faciliter une décision éclairée.",
 home:"Accueil",hub:"Articles",jump:"Parcourir les articles",methods:"Comment nous vérifions les données",trust:"Comment préparons-nous nos articles ?",
 rules:[
  ["Des sources vérifiables","Nous indiquons les documents des constructeurs et les méthodes d'essai pertinentes en séparant les faits de notre analyse."],
  ["Aucun essai de terrain inventé","Une analyse documentaire n'est présentée ni comme un retour d'expérience à long terme ni comme un essai indépendant au champ."],
  ["Aucun taux fictif","Sans échantillons ni périodes d'observation comparables, nous n'inventons pas de pannes pour 100 tracteurs ni de classement de fiabilité."]
 ],
 guides:"Guides techniques",review:"Analyse de modèle documentée",
 guidesIntro:"Comprenez chaque mesure et ses conditions avant de comparer des tracteurs.",
 reviewIntro:"Une analyse des documents du constructeur pour un modèle et une variante précis.",
 reviewLabel:"ANALYSE DOCUMENTAIRE • PAS D'ESSAI AU CHAMP",guideLabel:"GUIDE TECHNIQUE",checked:"Dernière vérification éditoriale",read:"Lire l'article",
 disclaimer:"Les recherches non vérifiées et les brouillons non publiés ne figurent pas ici. L'indexation et le classement ne sont pas garantis.",
 next:"Appliquez ces notions à de vrais modèles",compare:"Comparer les tracteurs",catalog:"Catalogue des tracteurs",
 breadcrumb:"Fil d'Ariane",englishOriginal:"Article intégral disponible uniquement en anglais",
 cards:[
  ["Choisir un tracteur : au-delà de la puissance","Établissez une liste pratique selon le terrain, les outils, la traction, le SAV et la prise de force."],
  ["Pièces et termes techniques des tracteurs","Découvrez les fonctions du moteur, de la transmission, de l'hydraulique et des composants."],
  ["Puissance moteur, couple et normes d'essai","Comprenez pourquoi les puissances moteur, à la prise de force et à la barre de traction diffèrent."],
  ["Comprendre la capacité de relevage hydraulique","Distinguez débit de pompe, capacité de relevage et point de mesure."],
  ["Fonctionnement de la prise de force (PDF)","Comprenez la vitesse, la puissance, les raccordements et la sécurité des outils."],
  ["Başak 2075 BK : analyse technique sourcée","Examinez les données du constructeur en respectant la variante et les limites de mesure."]
 ]
 },
 de:{
 title:"Traktorartikel und technische Ratgeber | TractorVS",
 description:"Quellenbasierte Artikel zu Motorleistung, Drehmoment, Zapfwelle, Hydraulik, Traktorwahl und technischen Modellanalysen.",
 eyebrow:"QUELLENBASIERTE INFORMATIONEN • TRACTORVS",heading:"Traktorartikel und technische Ratgeber",
 intro:"Bei der Wahl eines Traktors zählt mehr als die größte Zahl im Prospekt. Wir unterscheiden Herstellerangaben, unabhängige Messungen und technische Einordnungen, damit Daten sachgerecht verglichen werden können.",
 home:"Startseite",hub:"Artikel",jump:"Artikel entdecken",methods:"So prüfen wir unsere Daten",trust:"So entstehen unsere Artikel",
 rules:[
  ["Nachprüfbare Quellen","Wir verlinken relevante Herstellerunterlagen und Prüfverfahren und trennen deren Angaben von unserer Einordnung."],
  ["Keine erfundenen Praxistests","Eine Dokumentenanalyse geben wir weder als Langzeiterfahrung eines Besitzers noch als unabhängigen Feldtest aus."],
  ["Keine erfundenen Quoten","Ohne vergleichbare Stichproben und Beobachtungszeiträume behaupten wir keine Defekte je 100 Traktoren und keine Zuverlässigkeitsrangliste."]
 ],
 guides:"Technische Ratgeber",review:"Quellenbasierte Modellanalyse",
 guidesIntro:"Erst Messgröße und Prüfbedingungen verstehen, dann technische Werte vergleichen.",
 reviewIntro:"Dokumentenbasierte Einordnung eines bestimmten Modells und seiner Ausführung.",
 reviewLabel:"DOKUMENTENANALYSE • KEIN PRAXISTEST",guideLabel:"TECHNISCHER RATGEBER",checked:"Letzte redaktionelle Prüfung",read:"Artikel lesen",
 disclaimer:"Ungeprüfte Untersuchungen und unveröffentlichte Entwürfe werden hier nicht gelistet. Suchmaschinenindexierung und Platzierung sind nicht garantiert.",
 next:"Das Wissen auf echte Modelle anwenden",compare:"Traktoren vergleichen",catalog:"Traktorkatalog",
 breadcrumb:"Navigationspfad",englishOriginal:"Vollständiger Artikel nur auf Englisch",
 cards:[
  ["Den passenden Traktor auswählen: mehr als PS","Erstellen Sie eine Checkliste zu Gelände, Geräten, Traktion, Service und Zapfwelle."],
  ["Traktorteile und technische Begriffe","Erfahren Sie anhand einfacher Beispiele mehr über Motor, Getriebe, Hydraulik und Bauteile."],
  ["Motorleistung, Drehmoment und Prüfnormen","Warum Motor-, Zapfwellen- und Zugleistung nicht dieselbe Messgröße sind."],
  ["Hydraulische Hubkraft richtig verstehen","Unterscheiden Sie Pumpenfördermenge, Hubkraftangabe und Messpunkt."],
  ["So funktioniert die Zapfwelle","Drehzahl, Leistung, Kupplung und Sicherheit der Anbaugeräte verstehen."],
  ["Başak 2075 BK: technische Analyse mit Quellen","Ordnen Sie Herstellerangaben anhand der konkreten Ausführung und Messbedingungen ein."]
 ]
 },
 ru:{
 title:"Статьи и технические руководства по тракторам | TractorVS",
 description:"Материалы с источниками: мощность, крутящий момент, ВОМ, гидравлика, выбор трактора и технический разбор моделей.",
 eyebrow:"ИНФОРМАЦИЯ С ПОДТВЕРЖДЁННЫМИ ИСТОЧНИКАМИ • TRACTORVS",heading:"Статьи и технические руководства по тракторам",
 intro:"Выбор трактора — не просто сравнение самых больших чисел в каталогах. Мы отделяем данные производителей, независимые испытания и техническую интерпретацию, чтобы характеристики можно было оценивать корректно.",
 home:"Главная",hub:"Статьи",jump:"Перейти к статьям",methods:"Как мы проверяем данные",trust:"Как мы готовим статьи?",
 rules:[
  ["Проверяемые источники","По возможности приводим ссылки на документы производителей и методики испытаний, отделяя факты от наших выводов."],
  ["Без вымышленных полевых испытаний","Анализ документации не выдаётся за длительный опыт владельца или независимые испытания в поле."],
  ["Без выдуманных процентов","Без сопоставимых выборок и сроков наблюдения мы не рассчитываем число поломок на 100 тракторов и не составляем рейтинг надёжности."]
 ],
 guides:"Технические руководства",review:"Разбор модели с источниками",
 guidesIntro:"Сначала выясните, что и как измерено, а затем сравнивайте характеристики.",
 reviewIntro:"Анализ документов производителя применительно к конкретной модели и комплектации.",
 reviewLabel:"АНАЛИЗ ДОКУМЕНТОВ • НЕ ПОЛЕВЫЕ ИСПЫТАНИЯ",guideLabel:"ТЕХНИЧЕСКОЕ РУКОВОДСТВО",checked:"Последняя редакционная проверка",read:"Читать статью",
 disclaimer:"Непроверенные исследования и неопубликованные черновики здесь не представлены. Индексация и позиции в поиске не гарантируются.",
 next:"Примените знания при сравнении моделей",compare:"Сравнить тракторы",catalog:"Каталог тракторов",
 breadcrumb:"Навигационная цепочка",englishOriginal:"Полный текст доступен только на английском",
 cards:[
  ["Как выбрать трактор: не только мощность","Составьте список требований к рельефу, оборудованию, тяге, сервису и ВОМ."],
  ["Узлы трактора и технические термины","Разберитесь в работе двигателя, трансмиссии, гидравлики и других компонентов."],
  ["Мощность двигателя, крутящий момент и стандарты испытаний","Почему мощность двигателя, ВОМ и тяговая мощность — разные показатели."],
  ["Как понимать грузоподъёмность гидронавески","Отличайте расход насоса, грузоподъёмность и точку измерения."],
  ["Как работает вал отбора мощности (ВОМ)","Скорость, мощность, соединение и безопасность навесного оборудования."],
  ["Başak 2075 BK: технический разбор с источниками","Читайте данные производителя с учётом комплектации и условий измерения."]
 ]
 },
 ja:{
 title:"トラクターの技術記事・選び方ガイド | TractorVS",
 description:"出典に基づくトラクター解説。馬力、トルク、PTO、油圧、選び方、機種別の技術資料を分かりやすく整理します。",
 eyebrow:"根拠のある技術情報 • TRACTORVS",heading:"トラクターの技術記事・選び方ガイド",
 intro:"トラクター選びは、カタログの大きな数値だけを比較すればよいわけではありません。メーカー公表値、独立した試験結果、技術的な解釈を区別し、仕様を適切に理解できるようにします。",
 home:"ホーム",hub:"記事",jump:"記事を見る",methods:"データの確認方法",trust:"記事の作成方針",
 rules:[
  ["根拠を確認できるようにする","関連するメーカー資料や試験方法へのリンクを示し、資料の記載と当サイトの解釈を分けます。"],
  ["実施していない試験を装わない","資料に基づく分析を、所有者の長期使用レビューや独自の実地試験として紹介しません。"],
  ["根拠のない故障率は示さない","比較可能な調査台数と観察期間がなければ、100台当たりの故障率や信頼性順位を作りません。"]
 ],
 guides:"技術ガイド",review:"出典に基づく機種分析",
 guidesIntro:"異なるトラクターを比べる前に、測定項目と試験条件を確認しましょう。",
 reviewIntro:"機種と仕様を特定し、メーカー資料に基づいて検討します。",
 reviewLabel:"資料分析 • 実地試験ではありません",guideLabel:"技術ガイド",checked:"最終編集確認",read:"記事を読む",
 disclaimer:"未検証の調査や未公開の下書きは掲載しません。検索エンジンへの登録や順位は保証されません。",
 next:"実際の機種比較に役立てる",compare:"トラクターを比較",catalog:"トラクター一覧",
 breadcrumb:"ページ階層",englishOriginal:"本文は英語版のみ",
 cards:[
  ["馬力だけで決めないトラクターの選び方","地形、作業機、けん引力、整備体制、PTO要件を整理します。"],
  ["トラクターの部品と技術用語","エンジン、変速機、油圧装置などの役割を具体例で説明します。"],
  ["エンジン出力・トルク・試験規格","エンジン出力、PTO出力、けん引出力の違いを解説します。"],
  ["油圧揚力の正しい読み方","ポンプ流量、揚力の公表値、測定位置の違いを確認します。"],
  ["トラクターのPTO（動力取出軸）とは","回転数、出力、接続方式、作業機の安全性を理解します。"],
  ["Başak 2075 BK：出典に基づく技術分析","メーカー公表値を仕様と測定条件に即して読み解きます。"]
 ]
 },
 es:{
 title:"Artículos y guías técnicas de tractores | TractorVS",
 description:"Artículos con fuentes sobre potencia, par motor, TDF, hidráulica, elección de tractor y análisis técnico de modelos.",
 eyebrow:"INFORMACIÓN TÉCNICA CON FUENTES • TRACTORVS",heading:"Artículos y guías técnicas sobre tractores",
 intro:"Elegir un tractor no consiste únicamente en comparar las cifras más altas de un catálogo. Distinguimos entre datos del fabricante, mediciones independientes e interpretación técnica para ayudarte a tomar decisiones fundamentadas.",
 home:"Inicio",hub:"Artículos",jump:"Explorar artículos",methods:"Cómo verificamos los datos",trust:"¿Cómo elaboramos nuestros artículos?",
 rules:[
  ["Fuentes que puedes consultar","Enlazamos la documentación de fabricantes y los métodos de ensayo pertinentes, separando los datos de nuestra interpretación."],
  ["Sin pruebas de campo inventadas","Un análisis documental no se presenta como experiencia prolongada de un propietario ni como ensayo de campo independiente."],
  ["Sin porcentajes ficticios","Sin muestras y periodos comparables, no inventamos averías por cada 100 tractores ni clasificaciones de fiabilidad."]
 ],
 guides:"Guías técnicas",review:"Análisis de modelo con fuentes",
 guidesIntro:"Comprende qué se mide y en qué condiciones antes de comparar especificaciones.",
 reviewIntro:"Análisis de la documentación del fabricante para el modelo y la variante concretos.",
 reviewLabel:"ANÁLISIS DOCUMENTAL • NO ES UNA PRUEBA DE CAMPO",guideLabel:"GUÍA TÉCNICA",checked:"Última revisión editorial",read:"Leer artículo",
 disclaimer:"No incluimos investigaciones sin verificar ni borradores pendientes de publicación. La indexación y la posición en buscadores no están garantizadas.",
 next:"Aplica lo aprendido a modelos reales",compare:"Comparar tractores",catalog:"Catálogo de tractores",
 breadcrumb:"Ruta de navegación",englishOriginal:"Texto completo solo en inglés",
 cards:[
  ["Cómo elegir un tractor más allá de la potencia","Organiza los requisitos de terreno, aperos, tracción, servicio técnico y toma de fuerza."],
  ["Componentes y términos técnicos del tractor","Comprende el motor, la transmisión, la hidráulica y otras piezas con ejemplos sencillos."],
  ["Potencia del motor, par y normas de ensayo","Por qué la potencia del motor, la TDF y la barra de tiro no son medidas equivalentes."],
  ["Cómo interpretar la capacidad de elevación hidráulica","Distingue caudal de la bomba, elevación nominal y punto de medición."],
  ["Cómo funciona la toma de fuerza (TDF)","Descubre las revoluciones, la potencia, las conexiones y la seguridad de los aperos."],
  ["Başak 2075 BK: análisis técnico con fuentes","Interpreta los datos del fabricante según la variante y las condiciones de medición."]
 ]
 }
};
export function editorialHubTranslation(lang:Locale): EditorialCopy|undefined {
 return EDITORIAL_HUB_TRANSLATIONS[lang];
}
