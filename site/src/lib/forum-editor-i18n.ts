import type {Locale} from "./locales.ts";

/**
 * UI-only translations. Technical facts, user text, rights declarations and
 * manufacturer names are NEVER translated without the existing moderation gate.
 */
export type ForumEditorCopy={
 toolbar:string;bold:string;italic:string;list:string;quote:string;code:string;
 emoji:string;preview:string;write:string;photos:string;photoHint:string;
 photoRights:string;alt:string;remove:string;noPreview:string;
 photoTooLarge:string;photoUnsupported:string;photoLimit:string;photoProcessing:string;
 photoRightsRequired:string;photoAltRequired:string;photoUploadFailed:string;
 photoPending:string;retryPhotos:string;photoRetrySuccess:string;previewTitle:string;
 words:string;characters:string;photoPrivacy:string;photoDuplicate:string;
};
export const FORUM_EDITOR_COPY:Record<Locale,ForumEditorCopy>={
 en:{
  toolbar:"Writing tools",bold:"Bold",italic:"Italic",list:"Bulleted list",quote:"Quote",code:"Inline code",
  emoji:"Emoji",preview:"Preview",write:"Continue editing",photos:"Add photos",photoHint:"Up to 3 photos · JPEG, PNG or WebP · converted to private WebP (max. 400 KB each).",
  photoRights:"I own these photos or have permission to share them publicly after moderation.",
  alt:"Describe the photo for accessibility",remove:"Remove photo",noPreview:"Start typing to see a preview.",
  photoTooLarge:"This photo could not be compressed safely below 400 KB. Choose a smaller photo.",
  photoUnsupported:"This photo is unsupported or could not be decoded. Use JPEG, PNG or WebP.",
  photoLimit:"You can attach at most 3 photos per post.",photoProcessing:"Preparing the photo securely…",
  photoRightsRequired:"Confirm that you may share the attached photos.",
  photoAltRequired:"Each photo needs a meaningful description (10–160 characters).",
  photoUploadFailed:"Your text is published, but some photos failed to upload. Retry the photos without posting twice.",
  photoPending:"Text published; photos await separate moderation and stay private until approved.",
  retryPhotos:"Retry photos",photoRetrySuccess:"Photos sent for moderation.",
  previewTitle:"Post preview",words:"Words",characters:"Characters",
  photoPrivacy:"Photos are resized in your browser to remove embedded location/camera metadata; uploads are private until reviewed.",
  photoDuplicate:"That photo is already selected."
 },
 tr:{
  toolbar:"Yazım araçları",bold:"Kalın",italic:"İtalik",list:"Madde işaretli liste",quote:"Alıntı",code:"Kod",
  emoji:"Emoji",preview:"Önizleme",write:"Düzenlemeye dön",photos:"Fotoğraf ekle",photoHint:"En fazla 3 fotoğraf · JPEG, PNG veya WebP · özel WebP'ye dönüştürülür (her biri en çok 400 KB).",
  photoRights:"Bu fotoğraflar bana ait veya moderasyon sonrasında herkese açık paylaşma iznim var.",
  alt:"Erişilebilirlik için fotoğrafı anlat",remove:"Fotoğrafı kaldır",noPreview:"Önizleme için yazmaya başla.",
  photoTooLarge:"Fotoğraf güvenli biçimde 400 KB altına küçültülemedi. Daha küçük bir fotoğraf seç.",
  photoUnsupported:"Fotoğraf biçimi desteklenmiyor veya açılamadı. JPEG, PNG ya da WebP kullan.",
  photoLimit:"Bir gönderiye en fazla 3 fotoğraf ekleyebilirsin.",photoProcessing:"Fotoğraf güvenli biçimde hazırlanıyor…",
  photoRightsRequired:"Eklediğin fotoğrafları paylaşma hakkına sahip olduğunu onayla.",
  photoAltRequired:"Her fotoğrafa açıklayıcı bir metin yaz (10–160 karakter).",
  photoUploadFailed:"Metnin yayımlandı ancak bazı fotoğraflar yüklenemedi. Konuyu yeniden açmadan fotoğrafları tekrar deneyebilirsin.",
  photoPending:"Metin yayımlandı; fotoğraflar ayrıca incelenene kadar gizli kalır.",
  retryPhotos:"Fotoğrafları yeniden dene",photoRetrySuccess:"Fotoğraflar incelemeye gönderildi.",
  previewTitle:"Gönderi önizlemesi",words:"Kelime",characters:"Karakter",
  photoPrivacy:"Fotoğraflar tarayıcında küçültülerek konum/kamera meta verileri kaldırılır; onaydan önce özel alanda saklanır.",
  photoDuplicate:"Bu fotoğraf zaten seçili."
 },
 zh:{
  toolbar:"编辑工具",bold:"粗体",italic:"斜体",list:"项目符号列表",quote:"引用",code:"行内代码",
  emoji:"表情符号",preview:"预览",write:"继续编辑",photos:"添加照片",photoHint:"每帖最多3张 · JPEG、PNG或WebP · 自动转换为私有WebP（每张不超过400 KB）。",
  photoRights:"这些照片属于我，或我有权在审核通过后公开分享。",
  alt:"为无障碍访问描述照片",remove:"移除照片",noPreview:"输入内容以查看预览。",
  photoTooLarge:"无法将照片安全压缩到400 KB以下。请选择较小的照片。",
  photoUnsupported:"无法读取此照片。请使用JPEG、PNG或WebP。",
  photoLimit:"每篇帖子最多上传3张照片。",photoProcessing:"正在安全处理照片…",
  photoRightsRequired:"请确认你拥有分享这些照片的权利。",
  photoAltRequired:"请为每张照片添加10至160个字符的描述。",
  photoUploadFailed:"文字已发布，但部分照片上传失败。请重试照片，不要重复发帖。",
  photoPending:"文字已发布；照片须单独审核，获批前保持私密。",
  retryPhotos:"重试照片上传",photoRetrySuccess:"照片已提交审核。",
  previewTitle:"帖子预览",words:"词数",characters:"字符数",
  photoPrivacy:"照片将在浏览器内缩放并移除位置/相机元数据；审核前仅私人存储。",
  photoDuplicate:"这张照片已选中。"
 },
 hi:{
  toolbar:"लेखन उपकरण",bold:"बोल्ड",italic:"इटैलिक",list:"बुलेट सूची",quote:"उद्धरण",code:"इनलाइन कोड",
  emoji:"इमोजी",preview:"पूर्वावलोकन",write:"संपादन जारी रखें",photos:"फ़ोटो जोड़ें",photoHint:"प्रति पोस्ट अधिकतम 3 फ़ोटो · JPEG, PNG या WebP · निजी WebP में बदला जाएगा (प्रत्येक अधिकतम 400 KB)।",
  photoRights:"ये फ़ोटो मेरी हैं या समीक्षा के बाद सार्वजनिक रूप से साझा करने की अनुमति मेरे पास है।",
  alt:"सुलभता के लिए फ़ोटो का वर्णन करें",remove:"फ़ोटो हटाएँ",noPreview:"पूर्वावलोकन देखने के लिए लिखें।",
  photoTooLarge:"फ़ोटो को सुरक्षित रूप से 400 KB से कम नहीं किया जा सका। छोटी फ़ोटो चुनें।",
  photoUnsupported:"फ़ोटो नहीं खोली जा सकी। JPEG, PNG या WebP इस्तेमाल करें।",
  photoLimit:"एक पोस्ट में अधिकतम 3 फ़ोटो जोड़ सकते हैं।",photoProcessing:"फ़ोटो सुरक्षित रूप से तैयार हो रही है…",
  photoRightsRequired:"फ़ोटो साझा करने के अधिकार की पुष्टि करें।",
  photoAltRequired:"हर फ़ोटो के लिए 10–160 अक्षरों का विवरण दें।",
  photoUploadFailed:"पाठ प्रकाशित हो गया है, लेकिन कुछ फ़ोटो अपलोड नहीं हुईं। दोबारा पोस्ट किए बिना फ़ोटो पुनः भेजें।",
  photoPending:"पाठ प्रकाशित है; फ़ोटो अलग समीक्षा तक निजी रहेंगी।",
  retryPhotos:"फ़ोटो पुनः भेजें",photoRetrySuccess:"फ़ोटो समीक्षा के लिए भेज दी गईं।",
  previewTitle:"पोस्ट का पूर्वावलोकन",words:"शब्द",characters:"अक्षर",
  photoPrivacy:"फ़ोटो को ब्राउज़र में छोटा करके स्थान/कैमरा मेटाडेटा हटाया जाता है; समीक्षा तक निजी रखा जाता है।",
  photoDuplicate:"यह फ़ोटो पहले से चुनी गई है।"
 },
 "pt-br":{
  toolbar:"Ferramentas de escrita",bold:"Negrito",italic:"Itálico",list:"Lista com marcadores",quote:"Citação",code:"Código",
  emoji:"Emoji",preview:"Pré-visualizar",write:"Voltar à edição",photos:"Adicionar fotos",photoHint:"Até 3 fotos · JPEG, PNG ou WebP · convertidas em WebP privado (máx. 400 KB por foto).",
  photoRights:"Sou titular das fotos ou tenho autorização para divulgá-las após a moderação.",
  alt:"Descreva a foto para acessibilidade",remove:"Remover foto",noPreview:"Comece a escrever para ver a prévia.",
  photoTooLarge:"Não foi possível reduzir a foto com segurança para menos de 400 KB. Escolha uma menor.",
  photoUnsupported:"Não foi possível abrir a foto. Use JPEG, PNG ou WebP.",
  photoLimit:"É possível anexar até 3 fotos por publicação.",photoProcessing:"Preparando a foto com segurança…",
  photoRightsRequired:"Confirme seu direito de compartilhar as fotos.",
  photoAltRequired:"Descreva cada foto em 10 a 160 caracteres.",
  photoUploadFailed:"O texto foi publicado, mas algumas fotos falharam. Reenvie as fotos sem duplicar a publicação.",
  photoPending:"Texto publicado; fotos ficam privadas até aprovação separada.",
  retryPhotos:"Reenviar fotos",photoRetrySuccess:"Fotos enviadas para análise.",
  previewTitle:"Prévia da publicação",words:"Palavras",characters:"Caracteres",
  photoPrivacy:"As fotos são redimensionadas no navegador para remover metadados de localização/câmera e ficam privadas até a aprovação.",
  photoDuplicate:"Esta foto já foi selecionada."
 },
 fr:{
  toolbar:"Outils de rédaction",bold:"Gras",italic:"Italique",list:"Liste à puces",quote:"Citation",code:"Code",
  emoji:"Émojis",preview:"Aperçu",write:"Revenir à l’édition",photos:"Ajouter des photos",photoHint:"3 photos maximum · JPEG, PNG ou WebP · conversion en WebP privé (400 Ko max. chacune).",
  photoRights:"Je possède ces photos ou j’ai l’autorisation de les publier après modération.",
  alt:"Décrivez la photo pour l’accessibilité",remove:"Retirer la photo",noPreview:"Commencez à écrire pour afficher l’aperçu.",
  photoTooLarge:"Impossible de compresser la photo sous 400 Ko en toute sécurité. Choisissez-en une plus petite.",
  photoUnsupported:"Photo illisible. Utilisez JPEG, PNG ou WebP.",
  photoLimit:"Vous pouvez ajouter au maximum 3 photos par publication.",photoProcessing:"Préparation sécurisée de la photo…",
  photoRightsRequired:"Confirmez votre droit de partager ces photos.",
  photoAltRequired:"Décrivez chaque photo en 10 à 160 caractères.",
  photoUploadFailed:"Le texte est publié, mais certaines photos n'ont pas été envoyées. Réessayez sans republier.",
  photoPending:"Texte publié ; les photos restent privées jusqu'à leur validation séparée.",
  retryPhotos:"Réessayer l’envoi",photoRetrySuccess:"Photos soumises à modération.",
  previewTitle:"Aperçu de la publication",words:"Mots",characters:"Caractères",
  photoPrivacy:"Les photos sont redimensionnées dans le navigateur et leurs métadonnées GPS/appareil supprimées ; elles restent privées avant validation.",
  photoDuplicate:"Cette photo est déjà sélectionnée."
 },
 de:{
  toolbar:"Schreibwerkzeuge",bold:"Fett",italic:"Kursiv",list:"Aufzählung",quote:"Zitat",code:"Code",
  emoji:"Emoji",preview:"Vorschau",write:"Weiter bearbeiten",photos:"Fotos hinzufügen",photoHint:"Bis zu 3 Fotos · JPEG, PNG oder WebP · Umwandlung in privates WebP (max. 400 KB je Foto).",
  photoRights:"Ich besitze diese Fotos oder darf sie nach der Moderation öffentlich teilen.",
  alt:"Foto für Barrierefreiheit beschreiben",remove:"Foto entfernen",noPreview:"Schreibe einen Text, um die Vorschau zu sehen.",
  photoTooLarge:"Das Foto konnte nicht sicher auf unter 400 KB verkleinert werden. Bitte ein kleineres wählen.",
  photoUnsupported:"Das Foto konnte nicht geöffnet werden. JPEG, PNG oder WebP verwenden.",
  photoLimit:"Pro Beitrag sind höchstens 3 Fotos möglich.",photoProcessing:"Foto wird sicher aufbereitet…",
  photoRightsRequired:"Bitte bestätige, dass du diese Fotos teilen darfst.",
  photoAltRequired:"Jedes Foto benötigt eine Beschreibung mit 10–160 Zeichen.",
  photoUploadFailed:"Der Text wurde veröffentlicht, einige Fotos konnten jedoch nicht hochgeladen werden. Bitte nur die Fotos erneut senden.",
  photoPending:"Text veröffentlicht; Fotos bleiben bis zur separaten Freigabe privat.",
  retryPhotos:"Fotos erneut senden",photoRetrySuccess:"Fotos wurden zur Prüfung eingereicht.",
  previewTitle:"Beitragsvorschau",words:"Wörter",characters:"Zeichen",
  photoPrivacy:"Fotos werden im Browser verkleinert und von Standort-/Kamerametadaten befreit. Bis zur Freigabe bleiben sie privat.",
  photoDuplicate:"Dieses Foto ist bereits ausgewählt."
 },
 ru:{
  toolbar:"Инструменты редактора",bold:"Полужирный",italic:"Курсив",list:"Маркированный список",quote:"Цитата",code:"Код",
  emoji:"Эмодзи",preview:"Предпросмотр",write:"Вернуться к редактированию",photos:"Добавить фото",photoHint:"До 3 фотографий · JPEG, PNG или WebP · преобразование в закрытый WebP (не более 400 КБ каждая).",
  photoRights:"Эти фотографии принадлежат мне или у меня есть разрешение опубликовать их после модерации.",
  alt:"Опишите фото для доступности",remove:"Удалить фото",noPreview:"Начните писать для предпросмотра.",
  photoTooLarge:"Не удалось безопасно сжать фото до 400 КБ. Выберите фото меньшего размера.",
  photoUnsupported:"Не удалось открыть фото. Используйте JPEG, PNG или WebP.",
  photoLimit:"К сообщению можно приложить не более 3 фото.",photoProcessing:"Безопасная обработка фото…",
  photoRightsRequired:"Подтвердите право на публикацию фотографий.",
  photoAltRequired:"Опишите каждое фото (10–160 символов).",
  photoUploadFailed:"Текст опубликован, но часть фотографий не загрузилась. Повторите отправку фото без нового сообщения.",
  photoPending:"Текст опубликован; фото остаются закрытыми до отдельного одобрения.",
  retryPhotos:"Повторить загрузку фото",photoRetrySuccess:"Фото отправлены на проверку.",
  previewTitle:"Предпросмотр сообщения",words:"Слова",characters:"Символы",
  photoPrivacy:"Фото уменьшаются в браузере, метаданные геопозиции и камеры удаляются. До одобрения файлы остаются закрытыми.",
  photoDuplicate:"Это фото уже выбрано."
 },
 ja:{
  toolbar:"編集ツール",bold:"太字",italic:"斜体",list:"箇条書き",quote:"引用",code:"コード",
  emoji:"絵文字",preview:"プレビュー",write:"編集に戻る",photos:"写真を追加",photoHint:"1投稿につき3枚まで · JPEG、PNG、WebP対応 · 非公開のWebPへ変換（1枚400 KB以下）。",
  photoRights:"これらの写真の権利を所有しているか、審査後に公開する許可を得ています。",
  alt:"アクセシビリティのため写真を説明",remove:"写真を削除",noPreview:"入力するとプレビューが表示されます。",
  photoTooLarge:"安全に400 KB以下へ圧縮できませんでした。小さい写真を選んでください。",
  photoUnsupported:"写真を読み込めません。JPEG、PNG、WebPを使用してください。",
  photoLimit:"1投稿に添付できる写真は3枚までです。",photoProcessing:"写真を安全に処理しています…",
  photoRightsRequired:"写真を共有する権利があることを確認してください。",
  photoAltRequired:"各写真に10～160文字の説明を入力してください。",
  photoUploadFailed:"文章は公開されましたが、一部の写真のアップロードに失敗しました。投稿し直さず写真のみ再送してください。",
  photoPending:"文章は公開済みです。写真は別途承認されるまで非公開です。",
  retryPhotos:"写真を再送",photoRetrySuccess:"写真を審査に送信しました。",
  previewTitle:"投稿のプレビュー",words:"単語",characters:"文字",
  photoPrivacy:"写真はブラウザー内で縮小し、位置情報・カメラのメタデータを除去します。承認までは非公開です。",
  photoDuplicate:"この写真は選択済みです。"
 },
 es:{
  toolbar:"Herramientas de escritura",bold:"Negrita",italic:"Cursiva",list:"Lista con viñetas",quote:"Cita",code:"Código",
  emoji:"Emoji",preview:"Vista previa",write:"Volver a editar",photos:"Añadir fotos",photoHint:"Hasta 3 fotos · JPEG, PNG o WebP · conversión a WebP privado (máx. 400 KB cada una).",
  photoRights:"Estas fotos son mías o tengo permiso para compartirlas públicamente tras la moderación.",
  alt:"Describe la foto para mejorar la accesibilidad",remove:"Quitar foto",noPreview:"Empieza a escribir para ver la vista previa.",
  photoTooLarge:"No se pudo reducir la foto de forma segura a menos de 400 KB. Elige otra más pequeña.",
  photoUnsupported:"No se pudo abrir la foto. Usa JPEG, PNG o WebP.",
  photoLimit:"Puedes adjuntar un máximo de 3 fotos por publicación.",photoProcessing:"Preparando la foto de forma segura…",
  photoRightsRequired:"Confirma que tienes derecho a compartir las fotos.",
  photoAltRequired:"Cada foto necesita una descripción de 10 a 160 caracteres.",
  photoUploadFailed:"El texto ya está publicado, pero algunas fotos no se cargaron. Reintenta solo las fotos.",
  photoPending:"Texto publicado; las fotos seguirán privadas hasta su aprobación por separado.",
  retryPhotos:"Reintentar fotos",photoRetrySuccess:"Fotos enviadas a revisión.",
  previewTitle:"Vista previa",words:"Palabras",characters:"Caracteres",
  photoPrivacy:"Las fotos se reducen en tu navegador y se eliminan los metadatos de ubicación/cámara. Siguen privadas hasta la aprobación.",
  photoDuplicate:"Esta foto ya está seleccionada."
 }
};

export type ForumWritingCopy={heading:string;headingPlaceholder:string;table:string;column:string;cell:string;expand:string;collapse:string;cannotInsert:string};
export const FORUM_WRITING_COPY:Record<Locale,ForumWritingCopy>={
 en:{heading:"Heading",headingPlaceholder:"Section heading",table:"Insert table",column:"Column",cell:"Cell",expand:"Expand writing area",collapse:"Reduce writing area",cannotInsert:"Choose a single line for a heading, place the cursor for a table, and check the character limit."},
 tr:{heading:"Başlık",headingPlaceholder:"Bölüm başlığı",table:"Tablo ekle",column:"Sütun",cell:"Hücre",expand:"Yazı alanını genişlet",collapse:"Yazı alanını küçült",cannotInsert:"Başlık için tek satır seçin, tablo için imleci yerleştirin ve karakter sınırını kontrol edin."},
 zh:{heading:"标题",headingPlaceholder:"章节标题",table:"插入表格",column:"列",cell:"单元格",expand:"扩大编辑区",collapse:"缩小编辑区",cannotInsert:"标题请选择单行文字，表格请定位光标，并检查字符限制。"},
 hi:{heading:"शीर्षक",headingPlaceholder:"अनुभाग शीर्षक",table:"तालिका जोड़ें",column:"स्तंभ",cell:"सेल",expand:"लेखन क्षेत्र बड़ा करें",collapse:"लेखन क्षेत्र छोटा करें",cannotInsert:"शीर्षक के लिए एक पंक्ति चुनें, तालिका के लिए कर्सर रखें और वर्ण सीमा जाँचें।"},
 "pt-br":{heading:"Título",headingPlaceholder:"Título da seção",table:"Inserir tabela",column:"Coluna",cell:"Célula",expand:"Ampliar área de escrita",collapse:"Reduzir área de escrita",cannotInsert:"Selecione uma linha para o título, posicione o cursor para a tabela e verifique o limite de caracteres."},
 fr:{heading:"Titre",headingPlaceholder:"Titre de section",table:"Insérer un tableau",column:"Colonne",cell:"Cellule",expand:"Agrandir la zone de rédaction",collapse:"Réduire la zone de rédaction",cannotInsert:"Sélectionnez une ligne pour le titre, placez le curseur pour le tableau et vérifiez la limite de caractères."},
 de:{heading:"Überschrift",headingPlaceholder:"Abschnittsüberschrift",table:"Tabelle einfügen",column:"Spalte",cell:"Zelle",expand:"Schreibbereich vergrößern",collapse:"Schreibbereich verkleinern",cannotInsert:"Wählen Sie eine Zeile für die Überschrift, setzen Sie den Cursor für die Tabelle und prüfen Sie das Zeichenlimit."},
 ru:{heading:"Заголовок",headingPlaceholder:"Заголовок раздела",table:"Вставить таблицу",column:"Столбец",cell:"Ячейка",expand:"Увеличить поле ввода",collapse:"Уменьшить поле ввода",cannotInsert:"Выберите одну строку для заголовка, установите курсор для таблицы и проверьте лимит символов."},
 ja:{heading:"見出し",headingPlaceholder:"セクションの見出し",table:"表を挿入",column:"列",cell:"セル",expand:"入力欄を広げる",collapse:"入力欄を縮める",cannotInsert:"見出しは1行を選択し、表はカーソル位置を指定して、文字数制限を確認してください。"},
 es:{heading:"Título",headingPlaceholder:"Título de sección",table:"Insertar tabla",column:"Columna",cell:"Celda",expand:"Ampliar área de escritura",collapse:"Reducir área de escritura",cannotInsert:"Selecciona una línea para el título, coloca el cursor para la tabla y comprueba el límite de caracteres."}
};
