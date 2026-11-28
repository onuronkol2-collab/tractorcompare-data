import type {Locale} from "./locales";
const keys=["title","ownership","area","maintenance","total","balance","perHour","perHa","rental","interest","note","fleet","operation","passes","workedArea","operating","fleetNote","unknown"] as const;
const rows:Record<Locale,readonly string[]>={
  "en": [
    "Long-term ownership and field-work planning",
    "Ownership cost over 1, 3, 5 and 10 years",
    "Annual area (ha, optional)",
    "Maintenance per hour (currency/h)",
    "Total cost after resale",
    "Remaining loan principal",
    "Cost per working hour",
    "Cost per hectare",
    "Total rental cost",
    "Interest paid to date",
    "Use one currency and your own estimates. Leave resale, area or rental blank if unknown. Constant annual usage and costs; fixed-rate loan without fees. Sale at each horizon repays outstanding principal. No tax, inflation, opportunity cost or time-value adjustment. Do not enter loan payments or depreciation again as expenses. Compare equivalent rental services.",
    "Sequential field-work plan",
    "Operation",
    "Passes",
    "Total worked area (ha)",
    "Total operating cost",
    "Two sequential operations; use the same currency for both. Repeated passes count as worked area, not distinct land. No parallel scheduling, transport, downtime or safe equipment approval is inferred.",
    "Not available"
  ],
  "tr": [
    "Uzun vadeli sahiplik ve tarla iş planı",
    "1, 3, 5 ve 10 yıllık sahiplik maliyeti",
    "Yıllık alan (ha, isteğe bağlı)",
    "Saatlik bakım gideri (para birimi/sa)",
    "Satış sonrası toplam maliyet",
    "Kalan kredi anaparası",
    "Çalışma saati başına maliyet",
    "Hektar başına maliyet",
    "Toplam kiralama maliyeti",
    "O tarihe kadar ödenen faiz",
    "Kendi tahminlerini aynı para biriminde gir. Bilinmeyen satış değerini, alanı veya kiralamayı boş bırak. Yıllık kullanım ve giderler sabit; kredi sabit faizli ve masrafsız varsayılır. Her süre sonunda satışta kalan anapara kapatılır. Vergi, enflasyon, fırsat maliyeti ve paranın zaman değeri hesaba katılmaz. Taksit ve amortismanı yeniden gider olarak girme. Eşdeğer kiralama hizmetlerini karşılaştır.",
    "Sıralı tarla iş planı",
    "İşlem",
    "Geçiş sayısı",
    "Toplam işlenen alan (ha)",
    "Toplam işletme maliyeti",
    "Sırayla yapılan iki işlem; ikisinde de aynı para birimini kullan. Tekrarlanan geçişler benzersiz arazi değil işlenen alan olarak sayılır. Paralel planlama, taşıma, duruş ve güvenli ekipman uyumluluğu hesaplanmaz.",
    "Bilgi yok"
  ],
  "de": [
    "Langfristige Besitzkosten und Feldarbeitsplanung",
    "Besitzkosten nach 1, 3, 5 und 10 Jahren",
    "Jährliche Fläche (ha, optional)",
    "Wartung je Stunde (Währung/h)",
    "Gesamtkosten nach Verkauf",
    "Restschuld",
    "Kosten je Betriebsstunde",
    "Kosten je Hektar",
    "Gesamte Mietkosten",
    "Bis dahin gezahlte Zinsen",
    "Eigene Schätzwerte in einer Währung verwenden. Restwert, Fläche und Miete bei Unkenntnis leer lassen. Konstante Jahresnutzung und Kosten, Festzinskredit ohne Gebühren. Beim Verkauf wird die Restschuld beglichen. Ohne Steuer, Inflation, Opportunitätskosten und Zeitwert des Geldes. Raten und Abschreibung nicht nochmals als Kosten erfassen. Gleichwertige Mietleistungen vergleichen.",
    "Aufeinanderfolgende Feldarbeiten",
    "Arbeitsgang",
    "Überfahrten",
    "Bearbeitete Gesamtfläche (ha)",
    "Gesamte Betriebskosten",
    "Zwei aufeinanderfolgende Arbeitsgänge in derselben Währung. Wiederholte Überfahrten zählen als bearbeitete Fläche, nicht als separate Grundstücke. Keine Parallelplanung, Transport-, Stillstands- oder Sicherheitsbewertung.",
    "Nicht verfügbar"
  ],
  "fr": [
    "Planification des coûts de détention et des travaux agricoles",
    "Coût de détention sur 1, 3, 5 et 10 ans",
    "Surface annuelle (ha, facultatif)",
    "Entretien horaire (devise/h)",
    "Coût total après revente",
    "Capital restant dû",
    "Coût par heure de travail",
    "Coût par hectare",
    "Coût total de location",
    "Intérêts payés à cette date",
    "Utilisez vos estimations dans une seule devise. Laissez vides la revente, la surface ou la location inconnues. Usage et charges annuels constants, crédit à taux fixe sans frais. La revente rembourse le capital restant dû. Hors fiscalité, inflation, coût d’opportunité et actualisation. Ne comptez pas deux fois les mensualités ou l’amortissement. Comparez des locations équivalentes.",
    "Plan de travaux successifs",
    "Opération",
    "Passages",
    "Surface totale travaillée (ha)",
    "Coût total de fonctionnement",
    "Deux opérations successives dans la même devise. Les passages répétés comptent comme surface travaillée, non comme parcelles distinctes. Pas de planification parallèle, transport, temps d’arrêt ni validation de sécurité.",
    "Indisponible"
  ],
  "es": [
    "Planificación de propiedad a largo plazo y labores agrícolas",
    "Coste de propiedad a 1, 3, 5 y 10 años",
    "Superficie anual (ha, opcional)",
    "Mantenimiento por hora (moneda/h)",
    "Coste total tras la reventa",
    "Capital pendiente",
    "Coste por hora de trabajo",
    "Coste por hectárea",
    "Coste total de alquiler",
    "Intereses pagados hasta esa fecha",
    "Usa tus estimaciones en una sola moneda. Deja en blanco la reventa, superficie o alquiler si no se conocen. Uso y costes anuales constantes; préstamo a tipo fijo sin comisiones. La venta liquida el capital pendiente. Sin impuestos, inflación, coste de oportunidad ni descuento temporal. No dupliques cuotas ni depreciación. Compara servicios de alquiler equivalentes.",
    "Plan de labores sucesivas",
    "Operación",
    "Pasadas",
    "Superficie total trabajada (ha)",
    "Coste total de funcionamiento",
    "Dos operaciones sucesivas en la misma moneda. Las pasadas repetidas cuentan como superficie trabajada, no como terrenos distintos. No estima trabajos simultáneos, transporte, paradas ni compatibilidad segura.",
    "No disponible"
  ],
  "pt-br": [
    "Planejamento de propriedade e operações agrícolas",
    "Custo de propriedade em 1, 3, 5 e 10 anos",
    "Área anual (ha, opcional)",
    "Manutenção por hora (moeda/h)",
    "Custo total após a revenda",
    "Saldo devedor do principal",
    "Custo por hora de trabalho",
    "Custo por hectare",
    "Custo total de aluguel",
    "Juros pagos até essa data",
    "Use suas estimativas em uma única moeda. Deixe revenda, área ou aluguel em branco se desconhecidos. Uso e custos anuais constantes; financiamento com taxa fixa e sem tarifas. Na venda, o saldo devedor é quitado. Sem impostos, inflação, custo de oportunidade ou desconto temporal. Não some novamente parcelas ou depreciação. Compare serviços equivalentes de aluguel.",
    "Plano de operações sequenciais",
    "Operação",
    "Passadas",
    "Área total trabalhada (ha)",
    "Custo operacional total",
    "Duas operações sequenciais na mesma moeda. Passadas repetidas contam como área trabalhada, não como terrenos distintos. Não estima trabalho paralelo, transporte, paradas ou compatibilidade segura.",
    "Indisponível"
  ],
  "ru": [
    "Долгосрочные затраты на владение и план полевых работ",
    "Затраты на владение за 1, 3, 5 и 10 лет",
    "Годовая площадь (га, необязательно)",
    "Обслуживание в час (валюта/ч)",
    "Общие затраты после продажи",
    "Остаток основного долга",
    "Затраты на час работы",
    "Затраты на гектар",
    "Общие затраты на аренду",
    "Уплаченные к этому сроку проценты",
    "Используйте собственные оценки в одной валюте. Неизвестные стоимость перепродажи, площадь и аренду оставьте пустыми. Годовая нагрузка и расходы постоянны; кредит с фиксированной ставкой без комиссий. При продаже погашается остаток долга. Без налогов, инфляции, альтернативных издержек и дисконтирования. Не учитывайте платежи и амортизацию повторно. Сравнивайте равноценные услуги аренды.",
    "План последовательных полевых работ",
    "Операция",
    "Проходы",
    "Общая обработанная площадь (га)",
    "Общие эксплуатационные затраты",
    "Две последовательные операции в одной валюте. Повторные проходы учитываются как обработанная площадь, а не отдельные участки. Без параллельного планирования, перевозки, простоев и подтверждения безопасности.",
    "Нет данных"
  ],
  "zh": [
    "长期持有成本与田间作业规划",
    "1、3、5 和 10 年持有成本",
    "年作业面积（公顷，可选）",
    "每小时维护费用（货币单位/小时）",
    "转售后总成本",
    "剩余贷款本金",
    "每工作小时成本",
    "每公顷成本",
    "租赁总成本",
    "截至该时点已付利息",
    "请用同一种货币填写自己的估算值。未知的转售价值、面积或租赁费可留空。假设年用量及费用不变，贷款固定利率且无手续费。转售时结清剩余本金。不计税费、通胀、机会成本及货币时间价值。不要重复计入还款或折旧。请比较同等租赁服务。",
    "顺序田间作业计划",
    "作业",
    "作业遍数",
    "累计作业面积（公顷）",
    "总运行成本",
    "两项顺序作业使用同一种货币。重复作业计入累计作业面积，而非独立土地面积。不估算并行作业、运输、停工或安全匹配。",
    "暂无数据"
  ],
  "hi": [
    "दीर्घकालीन स्वामित्व लागत और खेत कार्य योजना",
    "1, 3, 5 और 10 वर्षों की स्वामित्व लागत",
    "वार्षिक क्षेत्रफल (हेक्टेयर, वैकल्पिक)",
    "प्रति घंटे रखरखाव (मुद्रा/घंटा)",
    "पुनर्विक्रय के बाद कुल लागत",
    "शेष ऋण मूलधन",
    "प्रति कार्य घंटा लागत",
    "प्रति हेक्टेयर लागत",
    "कुल किराया लागत",
    "उस समय तक चुकाया गया ब्याज",
    "एक ही मुद्रा में अपने अनुमान भरें। पुनर्विक्रय मूल्य, क्षेत्रफल या किराया अज्ञात हो तो खाली छोड़ें। सालाना उपयोग और लागत स्थिर हैं; ऋण की दर स्थिर है और शुल्क नहीं है। बिक्री पर शेष मूलधन चुकाया जाता है। कर, महंगाई, अवसर लागत और समय मूल्य शामिल नहीं हैं। किस्त और मूल्यह्रास दोबारा न जोड़ें। समान किराया सेवाओं की तुलना करें।",
    "क्रमिक खेत कार्य योजना",
    "कार्य",
    "चक्कर",
    "कुल कार्य क्षेत्र (हेक्टेयर)",
    "कुल परिचालन लागत",
    "दो क्रमिक कार्यों में एक ही मुद्रा उपयोग करें। दोहराए गए चक्कर कुल कार्य क्षेत्र में जुड़ते हैं, अलग जमीन में नहीं। समानांतर कार्य, परिवहन, रुकावट या सुरक्षित उपकरण अनुकूलता का आकलन नहीं है।",
    "उपलब्ध नहीं"
  ],
  "ja": [
    "長期保有費用と圃場作業計画",
    "1・3・5・10 年間の保有費用",
    "年間作業面積（ha、任意）",
    "時間当たり整備費（通貨/時）",
    "売却後の総費用",
    "ローン元本残高",
    "作業時間当たり費用",
    "ヘクタール当たり費用",
    "総レンタル費用",
    "その時点までの支払利息",
    "同じ通貨でご自身の見積額を入力してください。売却額、面積、レンタル料が不明なら空欄にします。年間利用量と費用は一定、固定金利で手数料なしと仮定します。売却時に元本残高を返済します。税、インフレ、機会費用、貨幣の時間価値は含みません。返済額や減価償却費を二重計上しないでください。同等のレンタルサービスを比較してください。",
    "順次圃場作業計画",
    "作業",
    "作業回数",
    "延べ作業面積（ha）",
    "総運転費用",
    "順次行う2つの作業で同じ通貨を使用します。繰り返し作業は延べ面積として数え、別の土地面積とはみなしません。並行作業、輸送、停止時間、安全適合性は評価しません。",
    "データなし"
  ]
};
const extraKeys=["horizonOperating","rentalDifference","differenceNote","fleetTotal","fleetFuel"] as const;
const extraRows:Record<Locale,readonly string[]>={
 en:["Operating cost over the period","Ownership cost minus rental cost","A negative difference means the entered ownership scenario costs less than the entered rental scenario; a positive difference means it costs more. Missing resale or rental values leave the difference unknown.","Combined operations","Fuel used (L)"],
 tr:["Dönem boyunca işletme maliyeti","Sahiplik maliyeti eksi kiralama maliyeti","Negatif fark, girilen sahiplik senaryosunun kiralamadan daha düşük maliyetli; pozitif fark, daha yüksek maliyetli olduğunu gösterir. Satış değeri veya kiralama bedeli bilinmiyorsa fark hesaplanmaz.","İşlemlerin toplamı","Tüketilen yakıt (L)"],
 zh:["期间运行成本","持有成本减租赁成本","负差值表示输入的持有方案成本较低，正差值表示较高。转售价值或租赁费未知时不计算差值。","各项作业合计","燃油消耗（L）"],
 hi:["अवधि की परिचालन लागत","स्वामित्व लागत घटा किराया लागत","ऋणात्मक अंतर का अर्थ है कि दर्ज स्वामित्व लागत किराये से कम है, धनात्मक अंतर का अर्थ है अधिक लागत। पुनर्विक्रय या किराया अज्ञात हो तो अंतर नहीं निकाला जाता।","सभी कार्यों का योग","ईंधन खपत (लीटर)"],
 "pt-br":["Custo operacional no período","Custo de propriedade menos custo de aluguel","Uma diferença negativa indica que o cenário de propriedade informado custa menos que o aluguel; uma diferença positiva indica custo maior. Sem valor de revenda ou aluguel, a diferença fica desconhecida.","Total das operações","Combustível consumido (L)"],
 fr:["Coût de fonctionnement sur la période","Coût de détention moins coût de location","Un écart négatif indique un coût de détention saisi inférieur à celui de la location ; un écart positif indique un coût supérieur. Sans valeur de revente ou de location, l’écart reste inconnu.","Total des opérations","Carburant consommé (L)"],
 de:["Betriebskosten im Zeitraum","Besitzkosten abzüglich Mietkosten","Eine negative Differenz bedeutet geringere Kosten im eingegebenen Besitzszenario als bei Miete, eine positive höhere Kosten. Ohne Restwert oder Mietkosten bleibt die Differenz unbekannt.","Summe der Arbeitsgänge","Kraftstoffverbrauch (L)"],
 ru:["Эксплуатационные затраты за период","Затраты на владение минус затраты на аренду","Отрицательная разница означает меньшие затраты на владение по введённым данным, положительная — большие. Без стоимости перепродажи или аренды разница не рассчитывается.","Сумма операций","Расход топлива (л)"],
 ja:["期間中の運転費用","保有費用からレンタル費用を引いた差額","負の差額は入力した保有費用がレンタル費用より低く、正の差額は高いことを示します。売却額またはレンタル費用が不明なら差額は計算されません。","作業の合計","燃料消費量（L）"],
 es:["Coste de funcionamiento del período","Coste de propiedad menos coste de alquiler","Una diferencia negativa indica que el escenario de propiedad introducido cuesta menos que el alquiler; una positiva indica un coste mayor. Sin valor de reventa o alquiler, no se calcula la diferencia.","Total de las operaciones","Combustible consumido (L)"]
};
const fleetKeys=["operationCount","dailyHours","dayEstimate","multiFleetNote"] as const;
const fleetRows:Record<Locale,readonly string[]>={
 en:["Number of operations","Available working hours per day (optional)","Estimated working days","Plan 1–6 sequential operations in one currency. Repeated passes count as worked area, not unique land. Days use entered working hours; no parallel work, transport, downtime, weather or equipment safety is inferred."],
 tr:["İşlem sayısı","Günlük kullanılabilir çalışma saati (isteğe bağlı)","Tahmini çalışma günü","1–6 sıralı işlemi aynı para birimiyle planlayın. Tekrarlanan geçişler benzersiz arazi değil işlenen alan olarak sayılır. Gün hesabı girilen çalışma saatine dayanır; paralel çalışma, taşıma, duruş, hava koşulları ve ekipman güvenliği hesaplanmaz."],
 zh:["作业数量","每日可用工作小时（可选）","预计工作天数","以同一种货币规划1至6项顺序作业。重复作业计入累计作业面积，而非独立土地面积。天数按输入的工作小时计算，不估算并行作业、运输、停工、天气或设备安全性。"],
 hi:["कार्यों की संख्या","प्रतिदिन उपलब्ध कार्य घंटे (वैकल्पिक)","अनुमानित कार्य दिवस","एक ही मुद्रा में 1–6 क्रमिक कार्यों की योजना बनाएं। दोहराए गए चक्कर कुल कार्य क्षेत्र में जुड़ते हैं, अलग जमीन में नहीं। दिन दर्ज कार्य घंटों पर आधारित हैं; समानांतर कार्य, परिवहन, रुकावट, मौसम और उपकरण सुरक्षा का अनुमान नहीं लगाया जाता।"],
 "pt-br":["Número de operações","Horas de trabalho disponíveis por dia (opcional)","Dias de trabalho estimados","Planeje de 1 a 6 operações sequenciais na mesma moeda. Passadas repetidas contam como área trabalhada, não como terreno distinto. Os dias usam as horas informadas; não estima trabalho paralelo, transporte, paradas, clima ou segurança dos equipamentos."],
 fr:["Nombre d’opérations","Heures de travail disponibles par jour (facultatif)","Jours de travail estimés","Planifiez de 1 à 6 opérations successives dans une seule devise. Les passages répétés comptent dans la surface travaillée, non dans des parcelles distinctes. Les jours reposent sur les heures saisies ; travail parallèle, transport, arrêts, météo et sécurité des équipements ne sont pas estimés."],
 de:["Anzahl der Arbeitsgänge","Verfügbare Arbeitsstunden pro Tag (optional)","Geschätzte Arbeitstage","1–6 aufeinanderfolgende Arbeitsgänge in derselben Währung planen. Wiederholte Überfahrten zählen zur bearbeiteten Fläche, nicht zu getrennten Flächen. Arbeitstage beruhen auf eingegebenen Stunden; Parallelbetrieb, Transport, Stillstand, Wetter und Gerätesicherheit werden nicht bewertet."],
 ru:["Количество операций","Доступные рабочие часы в день (необязательно)","Расчётное число рабочих дней","Планируйте 1–6 последовательных операций в одной валюте. Повторные проходы учитываются как обработанная площадь, а не отдельные участки. Дни рассчитываются по введённым часам; параллельные работы, транспорт, простои, погода и безопасность оборудования не оцениваются."],
 ja:["作業数","1日当たりの作業可能時間（任意）","推定作業日数","同じ通貨で1～6件の順次作業を計画します。繰り返し作業は延べ作業面積として数えます。日数は入力した作業時間に基づき、並行作業、輸送、停止時間、天候、機器の安全性は評価しません。"],
 es:["Número de operaciones","Horas de trabajo disponibles al día (opcional)","Días de trabajo estimados","Planifica de 1 a 6 operaciones sucesivas en una sola moneda. Las pasadas repetidas cuentan como superficie trabajada, no como terrenos distintos. Los días se basan en las horas introducidas; no se estiman trabajos simultáneos, transporte, paradas, clima ni seguridad del equipo."]
};
const reportKeys=["downloadReport","reportPrivacy","exportFailed"] as const;
const reportRows:Record<Locale,readonly string[]>={
  "en": [
    "Download results (.txt)",
    "The copied or downloaded report contains calculated results and limitations. Share only with people you trust.",
    "Could not prepare the download."
  ],
  "tr": [
    "Sonuçları indir (.txt)",
    "Kopyalanan veya indirilen rapor hesaplanan sonuçları ve sınırlamaları içerir. Yalnızca güvendiğiniz kişilerle paylaşın.",
    "İndirme hazırlanamadı."
  ],
  "zh": [
    "下载结果（.txt）",
    "复制或下载的报告包含计算结果及限制。请仅与信任的人分享。",
    "无法准备下载。"
  ],
  "hi": [
    "परिणाम डाउनलोड करें (.txt)",
    "कॉपी या डाउनलोड की गई रिपोर्ट में गणना के परिणाम और सीमाएँ हैं। केवल भरोसेमंद लोगों से साझा करें।",
    "डाउनलोड तैयार नहीं हो सका।"
  ],
  "pt-br": [
    "Baixar resultados (.txt)",
    "O relatório copiado ou baixado contém resultados calculados e limitações. Compartilhe apenas com pessoas de confiança.",
    "Não foi possível preparar o download."
  ],
  "fr": [
    "Télécharger les résultats (.txt)",
    "Le rapport copié ou téléchargé contient les résultats calculés et leurs limites. Partagez-le uniquement avec des personnes de confiance.",
    "Impossible de préparer le téléchargement."
  ],
  "de": [
    "Ergebnisse herunterladen (.txt)",
    "Der kopierte oder heruntergeladene Bericht enthält berechnete Ergebnisse und Einschränkungen. Nur mit vertrauenswürdigen Personen teilen.",
    "Der Download konnte nicht vorbereitet werden."
  ],
  "ru": [
    "Скачать результаты (.txt)",
    "Скопированный или скачанный отчёт содержит результаты расчёта и ограничения. Делитесь им только с теми, кому доверяете.",
    "Не удалось подготовить загрузку."
  ],
  "ja": [
    "結果をダウンロード（.txt）",
    "コピーまたはダウンロードしたレポートには計算結果と制約が含まれます。信頼できる相手とのみ共有してください。",
    "ダウンロードを準備できませんでした。"
  ],
  "es": [
    "Descargar resultados (.txt)",
    "El informe copiado o descargado contiene los resultados calculados y sus limitaciones. Compártelo solo con personas de confianza.",
    "No se pudo preparar la descarga."
  ]
};
export function investmentPlanningText(lang:Locale){return Object.fromEntries([...keys.map((k,i)=>[k,rows[lang][i]]),...extraKeys.map((k,i)=>[k,extraRows[lang][i]]),...fleetKeys.map((k,i)=>[k,fleetRows[lang][i]]),...reportKeys.map((k,i)=>[k,reportRows[lang][i]])]) as Record<typeof keys[number]|typeof extraKeys[number]|typeof fleetKeys[number]|typeof reportKeys[number],string>;}
