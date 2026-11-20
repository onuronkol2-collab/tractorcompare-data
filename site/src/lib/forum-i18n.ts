import type {Locale} from "./locales.ts";
type Copy={
 name:string;heading:string;intro:string;empty:string;search:string;all:string;
 compose:string;title:string;body:string;category:string;model:string;noModel:string;
 consent:string;submit:string;submitReply:string;reply:string;replies:string;
 email:string;sendLink:string;otp:string;verify:string;login:string;logout:string;
 sent:string;pending:string;authRequired:string;signinNote:string;guidelines:string;
 questions:string;maintenance:string;reviews:string;news:string;comparison:string;general:string;
 noResults:string;back:string;loading:string;translated:string;help:string;
};
export const FORUM_TEXT:Record<Locale,Copy>={
 en:{
 name:"Community",heading:"Tractor questions, repairs and owner experiences",
 intro:"Ask about real tractor models, compare experiences and discuss maintenance. New posts are reviewed before appearing publicly.",
 empty:"No community discussions have been approved yet. You can be the first to submit a useful question.",
 search:"Search discussions",all:"All topics",compose:"Start a discussion",title:"Discussion title",body:"Describe the question or experience",category:"Topic category",model:"Related tractor",noModel:"No particular model",
 consent:"I agree to an optional AI translation of my post into other languages. This is not required to participate.",
 submit:"Submit for review",submitReply:"Send reply for review",reply:"Write a helpful reply",replies:"Replies",
 email:"Your email address",sendLink:"Send sign-in email",otp:"Email verification code (if supplied)",verify:"Verify code",login:"Sign in to post",logout:"Sign out",
 sent:"Email sent. Open its sign-in link or enter the code if your message contains one.",pending:"Submitted for moderation. It will not appear publicly until approved.",
 authRequired:"Please sign in using your email before submitting.",signinNote:"Email sign-in depends on your mail provider and allowed redirect settings.",
 guidelines:"Share original experiences. No advertising, personal contact details, unsupported safety claims or copied specifications.",
 questions:"Questions",maintenance:"Maintenance & repairs",reviews:"Owner experiences",news:"Industry news",comparison:"Comparisons",general:"General",
 noResults:"No discussions match these filters.",back:"All discussions",loading:"Processing…",translated:"Reviewed translation",help:"Need help finding a model? Use the catalogue first."
 },
 tr:{
 name:"Topluluk",heading:"Traktör soruları, arızalar ve kullanıcı deneyimleri",
 intro:"Gerçek traktör modellerini sor, deneyimleri karşılaştır ve bakım konularını tartış. Yeni içerikler yayınlanmadan önce incelenir.",
 empty:"Henüz onaylanmış bir tartışma yok. Faydalı ilk soruyu sen gönderebilirsin.",
 search:"Konularda ara",all:"Tüm konular",compose:"Yeni konu aç",title:"Konu başlığı",body:"Sorunu veya deneyimini anlat",category:"Konu kategorisi",model:"İlgili traktör",noModel:"Belirli bir model yok",
 consent:"İçeriğimin diğer dillere isteğe bağlı yapay zekâ çevirisini kabul ediyorum. Katılmak için zorunlu değildir.",
 submit:"İncelemeye gönder",submitReply:"Yanıtı incelemeye gönder",reply:"Faydalı bir yanıt yaz",replies:"Yanıtlar",
 email:"E-posta adresin",sendLink:"Giriş bağlantısı gönder",otp:"E-postadaki doğrulama kodu (varsa)",verify:"Kodu doğrula",login:"Yazmak için giriş yap",logout:"Çıkış yap",
 sent:"E-posta gönderildi. Giriş bağlantısına tıkla veya e-postada kod varsa gir.",pending:"İçerik moderasyona gönderildi. Onaylanmadan herkese açık görünmez.",
 authRequired:"Göndermeden önce e-posta ile giriş yapmalısın.",signinNote:"E-posta girişi için sağlayıcı ve izin verilen yönlendirme adresleri doğru ayarlanmalıdır.",
 guidelines:"Özgün deneyimlerini paylaş. Reklam, kişisel iletişim bilgileri, kanıtsız güvenlik iddiaları ve kopya teknik tablolar gönderme.",
 questions:"Sorular",maintenance:"Bakım ve arızalar",reviews:"Kullanıcı deneyimleri",news:"Sektör haberleri",comparison:"Karşılaştırmalar",general:"Genel",
 noResults:"Bu filtrelere uygun konu bulunamadı.",back:"Tüm tartışmalar",loading:"İşleniyor…",translated:"Kontrol edilmiş çeviri",help:"Model seçmek için önce traktör kataloğunu kullanabilirsin."
 },
 zh:{
 name:"社区",heading:"拖拉机问答、维修与车主经验",intro:"交流真实机型、保养维修及使用经验。新内容经审核后公开。",
 empty:"暂无审核通过的讨论。欢迎提交第一个有价值的问题。",search:"搜索讨论",all:"全部主题",compose:"发表主题",title:"主题标题",body:"详细描述问题或使用经验",
 category:"主题类别",model:"相关拖拉机",noModel:"不指定机型",
 consent:"我同意将帖子选择性地翻译为其他语言；不同意也可以参与。",submit:"提交审核",submitReply:"提交回复审核",reply:"撰写有帮助的回复",replies:"回复",
 email:"电子邮箱",sendLink:"发送登录邮件",otp:"邮件验证码（如有）",verify:"验证代码",login:"登录后发帖",logout:"退出登录",
 sent:"邮件已发送。请点击登录链接，或输入邮件中的验证码。",pending:"已提交审核，批准前不会公开。",
 authRequired:"请先使用邮箱登录。",signinNote:"邮箱登录需要正确的邮件服务与回调网址设置。",
 guidelines:"分享真实经验，不发布广告、个人联系方式、未经证实的安全建议或复制的技术资料。",
 questions:"问题",maintenance:"保养与维修",reviews:"车主经验",news:"行业新闻",comparison:"机型比较",general:"综合讨论",
 noResults:"没有符合条件的讨论。",back:"所有讨论",loading:"处理中…",translated:"已审核翻译",help:"寻找机型？请先查看拖拉机目录。"
 },
 hi:{
 name:"समुदाय",heading:"ट्रैक्टर सवाल, मरम्मत और मालिकों के अनुभव",intro:"वास्तविक ट्रैक्टर मॉडलों, रखरखाव और खेती के अनुभवों पर चर्चा करें। नई पोस्ट समीक्षा के बाद सार्वजनिक होती हैं।",
 empty:"अभी कोई स्वीकृत चर्चा नहीं है। आप पहला उपयोगी सवाल भेज सकते हैं।",search:"चर्चा खोजें",all:"सभी विषय",compose:"नई चर्चा शुरू करें",title:"विषय का शीर्षक",body:"समस्या या अनुभव विस्तार से लिखें",
 category:"विषय की श्रेणी",model:"संबंधित ट्रैक्टर",noModel:"कोई विशेष मॉडल नहीं",
 consent:"मैं अपनी पोस्ट का अन्य भाषाओं में वैकल्पिक AI अनुवाद स्वीकार करता/करती हूँ। भाग लेने के लिए यह ज़रूरी नहीं है।",submit:"समीक्षा के लिए भेजें",submitReply:"उत्तर समीक्षा के लिए भेजें",reply:"उपयोगी उत्तर लिखें",replies:"उत्तर",
 email:"ईमेल पता",sendLink:"लॉगिन ईमेल भेजें",otp:"ईमेल सत्यापन कोड (यदि मिला हो)",verify:"कोड सत्यापित करें",login:"पोस्ट करने के लिए लॉगिन करें",logout:"लॉग आउट",
 sent:"ईमेल भेज दिया गया। लॉगिन लिंक खोलें या संदेश में मिला कोड भरें।",pending:"समीक्षा के लिए भेज दिया गया। स्वीकृति से पहले सार्वजनिक नहीं होगा।",
 authRequired:"भेजने से पहले ईमेल से लॉगिन करें।",signinNote:"ईमेल लॉगिन के लिए मेल सेवा और अनुमत रीडायरेक्ट सेटिंग सही होनी चाहिए।",
 guidelines:"अपने वास्तविक अनुभव साझा करें। विज्ञापन, निजी संपर्क जानकारी, बिना प्रमाण की सुरक्षा सलाह या कॉपी किए गए विनिर्देश न डालें।",
 questions:"सवाल",maintenance:"रखरखाव और मरम्मत",reviews:"मालिकों के अनुभव",news:"उद्योग समाचार",comparison:"तुलना",general:"सामान्य चर्चा",
 noResults:"इस खोज से कोई चर्चा नहीं मिली।",back:"सभी चर्चाएँ",loading:"प्रक्रिया जारी है…",translated:"समीक्षित अनुवाद",help:"मॉडल ढूँढने के लिए पहले ट्रैक्टर सूची देखें।"
 },
 "pt-br":{
 name:"Comunidade",heading:"Dúvidas, manutenção e experiências com tratores",intro:"Converse sobre modelos reais, manutenção e experiências no campo. As novas publicações passam por moderação.",
 empty:"Ainda não há discussões aprovadas. Envie a primeira pergunta útil.",search:"Buscar discussões",all:"Todos os tópicos",compose:"Criar discussão",title:"Título do tópico",body:"Descreva sua dúvida ou experiência",
 category:"Categoria",model:"Trator relacionado",noModel:"Nenhum modelo específico",
 consent:"Aceito a tradução opcional da minha publicação por IA para outros idiomas. Não é obrigatória.",
 submit:"Enviar para análise",submitReply:"Enviar resposta para análise",reply:"Escreva uma resposta útil",replies:"Respostas",
 email:"Seu e-mail",sendLink:"Enviar link de acesso",otp:"Código recebido por e-mail (se houver)",verify:"Validar código",login:"Entre para publicar",logout:"Sair",
 sent:"E-mail enviado. Abra o link de acesso ou digite o código recebido.",pending:"Enviado para moderação. Não aparecerá publicamente antes da aprovação.",
 authRequired:"Entre com seu e-mail antes de enviar.",signinNote:"O acesso por e-mail depende do provedor e dos redirecionamentos permitidos.",
 guidelines:"Compartilhe experiências reais. Não publique publicidade, contatos pessoais, recomendações de segurança sem provas nem tabelas copiadas.",
 questions:"Perguntas",maintenance:"Manutenção e consertos",reviews:"Experiências de proprietários",news:"Notícias do setor",comparison:"Comparações",general:"Geral",
 noResults:"Nenhuma discussão encontrada.",back:"Todas as discussões",loading:"Processando…",translated:"Tradução revisada",help:"Para encontrar um modelo, consulte primeiro o catálogo."
 },
 fr:{
 name:"Communauté",heading:"Questions, pannes et retours d'expérience sur les tracteurs",intro:"Échangez sur les modèles réels, l'entretien et l'utilisation. Les nouveaux messages sont modérés avant publication.",
 empty:"Aucune discussion approuvée pour le moment. Posez la première question utile.",search:"Rechercher",all:"Tous les sujets",compose:"Créer un sujet",title:"Titre du sujet",body:"Décrivez votre question ou votre expérience",
 category:"Catégorie",model:"Tracteur concerné",noModel:"Aucun modèle particulier",
 consent:"J'accepte la traduction facultative de mon message par IA. Ce n'est pas obligatoire pour participer.",
 submit:"Envoyer à la modération",submitReply:"Envoyer la réponse à la modération",reply:"Rédiger une réponse utile",replies:"Réponses",
 email:"Adresse e-mail",sendLink:"Envoyer un lien de connexion",otp:"Code reçu par e-mail (si fourni)",verify:"Vérifier le code",login:"Se connecter pour publier",logout:"Se déconnecter",
 sent:"E-mail envoyé. Ouvrez le lien ou saisissez le code reçu.",pending:"Envoyé à la modération. Rien ne sera publié avant approbation.",
 authRequired:"Connectez-vous par e-mail avant d'envoyer.",signinNote:"La connexion par e-mail nécessite un fournisseur et des redirections autorisées.",
 guidelines:"Partagez des expériences authentiques. Pas de publicité, de coordonnées personnelles, de conseils de sécurité non étayés ni de fiches copiées.",
 questions:"Questions",maintenance:"Entretien et réparations",reviews:"Avis des propriétaires",news:"Actualités du secteur",comparison:"Comparaisons",general:"Général",
 noResults:"Aucune discussion correspondante.",back:"Toutes les discussions",loading:"Traitement…",translated:"Traduction vérifiée",help:"Pour trouver un modèle, consultez d'abord le catalogue."
 },
 de:{
 name:"Community",heading:"Traktorfragen, Reparaturen und Erfahrungen",intro:"Tauschen Sie sich über konkrete Modelle, Wartung und Praxiserfahrungen aus. Neue Beiträge werden vor der Veröffentlichung geprüft.",
 empty:"Noch keine freigegebenen Diskussionen. Stellen Sie die erste hilfreiche Frage.",search:"Diskussionen suchen",all:"Alle Themen",compose:"Thema erstellen",title:"Titel",body:"Frage oder Erfahrung beschreiben",
 category:"Kategorie",model:"Betroffener Traktor",noModel:"Kein bestimmtes Modell",
 consent:"Ich stimme einer optionalen KI-Übersetzung meines Beitrags zu. Dies ist keine Voraussetzung für die Teilnahme.",
 submit:"Zur Prüfung senden",submitReply:"Antwort zur Prüfung senden",reply:"Hilfreiche Antwort schreiben",replies:"Antworten",
 email:"E-Mail-Adresse",sendLink:"Anmeldelink senden",otp:"E-Mail-Code (falls vorhanden)",verify:"Code prüfen",login:"Zum Schreiben anmelden",logout:"Abmelden",
 sent:"E-Mail gesendet. Öffnen Sie den Anmeldelink oder geben Sie den Code ein.",pending:"Zur Moderation eingereicht. Erst nach Freigabe öffentlich sichtbar.",
 authRequired:"Bitte melden Sie sich zuerst per E-Mail an.",signinNote:"E-Mail-Anmeldung setzt einen korrekt konfigurierten Anbieter und erlaubte Weiterleitungen voraus.",
 guidelines:"Nur echte Erfahrungen. Keine Werbung, privaten Kontaktdaten, unbelegten Sicherheitstipps oder kopierten Datenblätter.",
 questions:"Fragen",maintenance:"Wartung und Reparatur",reviews:"Erfahrungsberichte",news:"Branchenmeldungen",comparison:"Vergleiche",general:"Allgemein",
 noResults:"Keine passenden Diskussionen.",back:"Alle Diskussionen",loading:"Wird verarbeitet…",translated:"Geprüfte Übersetzung",help:"Ein Modell finden Sie im Traktorkatalog."
 },
 ru:{
 name:"Сообщество",heading:"Вопросы, ремонт и опыт владельцев тракторов",intro:"Обсуждайте реальные модели, обслуживание и работу в поле. Новые сообщения публикуются после модерации.",
 empty:"Одобренных обсуждений пока нет. Задайте первый полезный вопрос.",search:"Поиск обсуждений",all:"Все темы",compose:"Создать тему",title:"Заголовок",body:"Опишите вопрос или свой опыт",
 category:"Категория",model:"Модель трактора",noModel:"Без конкретной модели",
 consent:"Я согласен(-на) на необязательный перевод моей публикации с помощью ИИ. Для участия это не требуется.",
 submit:"Отправить на проверку",submitReply:"Отправить ответ на проверку",reply:"Написать полезный ответ",replies:"Ответы",
 email:"Электронная почта",sendLink:"Отправить ссылку для входа",otp:"Код из письма (если есть)",verify:"Проверить код",login:"Войти для публикации",logout:"Выйти",
 sent:"Письмо отправлено. Перейдите по ссылке или введите код из письма.",pending:"Отправлено на модерацию. До одобрения не отображается публично.",
 authRequired:"Для отправки войдите через электронную почту.",signinNote:"Для входа нужны настроенная почта и разрешённые адреса перенаправления.",
 guidelines:"Делитесь реальным опытом. Без рекламы, личных контактов, непроверенных советов по безопасности и скопированных таблиц.",
 questions:"Вопросы",maintenance:"Обслуживание и ремонт",reviews:"Опыт владельцев",news:"Новости отрасли",comparison:"Сравнения",general:"Общие темы",
 noResults:"Подходящих обсуждений нет.",back:"Все обсуждения",loading:"Обработка…",translated:"Проверенный перевод",help:"Сначала найдите модель в каталоге."
 },
 ja:{
 name:"コミュニティ",heading:"トラクターの質問・整備・オーナーの体験談",intro:"実際の機種、整備、使用経験について情報交換できます。新しい投稿は審査後に公開されます。",
 empty:"承認済みの投稿はまだありません。最初の役立つ質問を投稿できます。",search:"投稿を検索",all:"すべての話題",compose:"新しい話題を投稿",title:"話題のタイトル",body:"質問や体験を詳しく書く",
 category:"カテゴリー",model:"関連するトラクター",noModel:"特定の機種なし",
 consent:"投稿を他の言語にAIで翻訳することを任意で許可します。参加には必須ではありません。",
 submit:"審査に送信",submitReply:"返信を審査に送信",reply:"役立つ返信を書く",replies:"返信",
 email:"メールアドレス",sendLink:"ログインメールを送信",otp:"メールの確認コード（ある場合）",verify:"コードを確認",login:"投稿するにはログイン",logout:"ログアウト",
 sent:"メールを送信しました。ログインリンクを開くか、記載されたコードを入力してください。",pending:"審査に提出しました。承認されるまで公開されません。",
 authRequired:"先にメールでログインしてください。",signinNote:"メールログインには、メール設定と許可されたリダイレクト先の設定が必要です。",
 guidelines:"実際の経験を共有してください。広告、個人の連絡先、根拠のない安全助言、コピーした仕様表は投稿しないでください。",
 questions:"質問",maintenance:"整備と修理",reviews:"オーナー体験談",news:"業界ニュース",comparison:"比較",general:"全般",
 noResults:"条件に合う投稿がありません。",back:"すべての話題",loading:"処理中…",translated:"確認済みの翻訳",help:"機種を探すには、まずトラクター一覧をご覧ください。"
 },
 es:{
 name:"Comunidad",heading:"Preguntas, averías y experiencias con tractores",intro:"Comparte información sobre modelos reales, mantenimiento y trabajo agrícola. Las publicaciones nuevas se moderan antes de aparecer.",
 empty:"Todavía no hay debates aprobados. Puedes enviar la primera pregunta útil.",search:"Buscar debates",all:"Todos los temas",compose:"Crear tema",title:"Título del tema",body:"Describe tu duda o experiencia",
 category:"Categoría",model:"Tractor relacionado",noModel:"Sin modelo específico",
 consent:"Acepto una traducción opcional de mi publicación con IA. No es necesaria para participar.",
 submit:"Enviar a revisión",submitReply:"Enviar respuesta a revisión",reply:"Escribe una respuesta útil",replies:"Respuestas",
 email:"Correo electrónico",sendLink:"Enviar enlace de acceso",otp:"Código de correo (si se recibió)",verify:"Verificar código",login:"Inicia sesión para publicar",logout:"Cerrar sesión",
 sent:"Correo enviado. Abre el enlace o introduce el código recibido.",pending:"Enviado a moderación. No aparecerá públicamente hasta su aprobación.",
 authRequired:"Inicia sesión con tu correo antes de enviar.",signinNote:"El acceso por correo requiere configurar el proveedor y las URL de redirección permitidas.",
 guidelines:"Comparte experiencias reales. Sin publicidad, datos de contacto personales, consejos de seguridad sin fundamento ni fichas técnicas copiadas.",
 questions:"Preguntas",maintenance:"Mantenimiento y averías",reviews:"Experiencias de propietarios",news:"Noticias del sector",comparison:"Comparativas",general:"General",
 noResults:"No se encontraron debates.",back:"Todos los debates",loading:"Procesando…",translated:"Traducción revisada",help:"Para localizar un modelo, consulta primero el catálogo."
 }
};
export const FORUM_CATEGORY_KEYS=["questions","maintenance","reviews","news","comparison","general"] as const;
export function forumText(lang:Locale,key:keyof Copy):string{return FORUM_TEXT[lang][key]}
