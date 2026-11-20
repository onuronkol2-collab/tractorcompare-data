/** Original TractorVS educational copy. No claims of first-hand testing. */
export const GLOSSARY_SECTIONS = {
  "engine": {
    "tr": [
      "Motor ve güç",
      "Beygir gücü tek başına bir sonuç değildir: hangi güç, hangi devir ve hangi standart sorularını birlikte sorun."
    ],
    "en": [
      "Engine and power",
      "Horsepower alone does not tell the whole story: ask which power, at what rpm and under which test standard."
    ]
  },
  "drivetrain": {
    "tr": [
      "Şanzıman ve aktarma",
      "Aynı motor, farklı şanzıman ve çekiş düzeninde farklı işe uygun olabilir."
    ],
    "en": [
      "Transmission and driveline",
      "The same engine can behave differently with another gearbox or traction layout."
    ]
  },
  "pto": {
    "tr": [
      "Kuyruk mili (PTO)",
      "Ekipmanı döndürür; güç, devir ve bağlantı biçimi birbirinden ayrı kontrol edilmelidir."
    ],
    "en": [
      "Power take-off (PTO)",
      "It turns implements; power, speed and coupling must be checked separately."
    ]
  },
  "hydraulics": {
    "tr": [
      "Hidrolik ve ekipman bağlantıları",
      "Yağ debisi, basınç, kaldırma kapasitesi ve bağlantı ölçüsü aynı şey değildir."
    ],
    "en": [
      "Hydraulics and implement connections",
      "Flow, pressure, lifting capacity and linkage category are different specifications."
    ]
  },
  "dimensions": {
    "tr": [
      "Ölçüler, lastikler ve denge",
      "Katalogdaki ölçüyü lastik ve donanım koşuluyla birlikte okumak gerekir."
    ],
    "en": [
      "Dimensions, tyres and stability",
      "Always read dimensions alongside tyre and equipment configuration."
    ]
  },
  "safety": {
    "tr": [
      "Güvenlik ve operatör alanı",
      "Koruyucu donanımın varlığı kadar doğru kullanımı ve standardı da önemlidir."
    ],
    "en": [
      "Safety and operator station",
      "Protection depends on the correct equipment, its standard and proper use."
    ]
  },
  "ownership": {
    "tr": [
      "Bakım, tüketim ve doğrulama",
      "Kullanım maliyeti ve teknik iddialar için gerçek belgeyi ve ölçüm şartını arayın."
    ],
    "en": [
      "Maintenance, operating costs and evidence",
      "Check the source and measurement conditions behind performance and running-cost claims."
    ]
  }
} as const;
export const GLOSSARY_ROWS = [
  [
    "engine",
    "engine-power",
    "Motor gücü",
    "Engine power",
    "Motorun birim zamanda yapabildiği işin ölçüsüdür; HP, PS/CV veya kW olarak verilir.",
    "The rate at which an engine can do work, shown as hp, metric PS/CV or kW.",
    "Örneğin römork çekişi ile çim biçme aynı güç ihtiyacını oluşturmaz.",
    "Trailer hauling and mowing can demand power in different ways.",
    "Ölçüm noktası ve hp/PS dönüşümünü kontrol edin; model adındaki sayı güç değildir.",
    "Compare the test point and hp/PS units; a model number is not a verified power figure."
  ],
  [
    "engine",
    "rated-power",
    "Nominal motor gücü",
    "Rated engine power",
    "Üreticinin belirtilmiş motor devrinde ilan ettiği sürekli çalışma referans gücüdür.",
    "Power specified by the manufacturer at a stated rated engine speed.",
    "İki traktörün ikisi de 100 HP deniyorsa önce bunun nominal değer olup olmadığına bakın.",
    "When two tractors are called 100 hp, first check whether both figures are rated outputs.",
    "Nominal, azami ve ek güç (boost) değerlerini aynı sütunda karşılaştırmayın.",
    "Do not compare rated, maximum and boost power as if they were interchangeable."
  ],
  [
    "engine",
    "maximum-power",
    "Azami motor gücü ve boost",
    "Maximum power and boost",
    "Azami güç motorun belirli koşuldaki en yüksek çıkışı; boost ise yalnız bazı koşullarda devreye giren ek güç olabilir.",
    "Maximum power is a peak output under specified conditions; boost can be available only in certain operating states.",
    "Nakliyede geçici güç artışı sunan traktör, tarlada her an o değeri üretmeyebilir.",
    "A tractor offering transport boost may not supply it continuously in the field.",
    "Üreticinin boost etkinleşme şartlarını ve ECE/ISO standardını okuyun.",
    "Read the manufacturer’s boost activation conditions and ECE/ISO standard."
  ],
  [
    "engine",
    "torque",
    "Tork (Nm)",
    "Torque (Nm)",
    "Krank milindeki döndürme momentidir; yük altında motorun davranışını açıklar ama tek başına çekiş kuvveti değildir.",
    "Turning moment at the crankshaft; it helps describe loaded engine behaviour but is not drawbar pull.",
    "Yavaş devirli ağır işte tork eğrisi, tek bir tepe sayıdan daha anlamlı olabilir.",
    "During slow heavy work, a torque curve can matter more than one peak figure.",
    "Torku hangi devirde verdiğini ve vites oranlarını birlikte inceleyin.",
    "Check the rpm at which torque occurs and the gearing."
  ],
  [
    "engine",
    "torque-rise",
    "Tork rezervi / tork artışı",
    "Torque rise / torque reserve",
    "Yük bindiğinde devir düşünce motor torkunun ne kadar artabildiğini anlatan oransal göstergedir.",
    "A percentage describing how much torque can increase as engine speed drops under load.",
    "Pulluk daha ağır toprağa girdiğinde motorun toparlanmasını etkileyebilir.",
    "It may affect how the engine responds when a plough meets tougher soil.",
    "Üreticilerin hesap yöntemi ve temel devirleri farklı olabilir.",
    "Manufacturers may calculate it using different reference speeds."
  ],
  [
    "engine",
    "displacement",
    "Motor hacmi (cm³ / L)",
    "Engine displacement (cc / L)",
    "Silindirlerin bir çevrimde taradığı toplam hacimdir; örneğin 3000 cm³ yaklaşık 3,0 litredir.",
    "The total volume swept by the pistons; 3,000 cc is about 3.0 litres.",
    "Aynı hacimde iki motor, turbo ve elektronik ayarla farklı güç üretebilir.",
    "Two engines of the same displacement can produce different outputs.",
    "Büyük hacim otomatik olarak daha iyi veya daha az yakıt tüketimi demek değildir.",
    "A larger engine is not automatically more capable or more fuel-efficient."
  ],
  [
    "engine",
    "cylinders",
    "Silindir sayısı",
    "Number of cylinders",
    "Pistonların içinde çalıştığı silindir adedidir; motor dengesi, boyutları ve çalışma karakterini etkiler.",
    "The number of piston cylinders, influencing size, smoothness and engine character.",
    "Üç ve dört silindirli iki modelin titreşim ve ağırlık davranışı farklı olabilir.",
    "A three-cylinder and a four-cylinder model may feel and weigh differently.",
    "Silindir sayısından tek başına dayanıklılık veya güç sonucu çıkarmayın.",
    "Cylinder count alone does not prove reliability or output."
  ],
  [
    "engine",
    "bore-stroke",
    "Silindir çapı ve piston stroku",
    "Bore and stroke",
    "Çap silindirin iç genişliği, strok pistonun bir uçtan diğerine hareket mesafesidir.",
    "Bore is cylinder diameter; stroke is piston travel between dead centres.",
    "Üretici kataloğunda '110 × 116 mm' bu iki ölçüyü belirtir.",
    "A specification of '110 × 116 mm' denotes these two dimensions.",
    "Bu değerlerden hesaplanan hacim açıklanan hacimle uyuşmuyorsa kaynakta hata olabilir.",
    "If calculated displacement conflicts with the listed volume, flag the inconsistency."
  ],
  [
    "engine",
    "rpm",
    "Motor devri (rpm)",
    "Engine speed (rpm)",
    "Krank milinin bir dakikadaki dönüş sayısıdır; motor devri ile kuyruk mili devri aynı değildir.",
    "Crankshaft revolutions per minute; engine rpm is not the same as PTO rpm.",
    "540 PTO devri için motorun farklı bir devirde çalışması gerekebilir.",
    "A 540 rpm PTO setting can require a different engine rpm.",
    "Azami güç ve azami tork değerlerinin hangi rpm'de ölçüldüğünü okuyun.",
    "Check the rpm attached to peak power and torque figures."
  ],
  [
    "engine",
    "turbo",
    "Turboşarj ve intercooler",
    "Turbocharger and intercooler",
    "Turbo egzoz enerjisiyle havayı sıkıştırır; intercooler sıkışan havayı soğutmaya yardım eder.",
    "A turbo uses exhaust energy to compress intake air; an intercooler cools the compressed charge.",
    "Küçük hacimli turbo motor, uygun ayarla yüksek güç sağlayabilir.",
    "A smaller turbocharged engine can deliver substantial output.",
    "Turbo bulunması tek başına yakıt tüketimi veya ömür garantisi vermez.",
    "A turbo alone guarantees neither fuel economy nor service life."
  ],
  [
    "engine",
    "fuel-injection",
    "Common Rail / yakıt enjeksiyonu",
    "Common rail / fuel injection",
    "Yakıtı belirli basınç ve zamanlamayla silindire püskürten sistemdir.",
    "The system that meters and injects fuel at controlled pressure and timing.",
    "Elektronik kontrollü enjeksiyon, farklı yüklerde yanmayı ayarlamaya yardımcı olur.",
    "Electronic injection helps control combustion across loads.",
    "Basınç değerini doğrudan motor gücü veya güvenilirlik skoru saymayın.",
    "Injection pressure is not itself a power or reliability score."
  ],
  [
    "engine",
    "emission",
    "Emisyon standardı (Stage / Tier)",
    "Emissions standard (Stage / Tier)",
    "Motorun satıldığı pazar ve dönem için geçerli egzoz emisyon sınırlarını ifade eder.",
    "Exhaust-emission limits that apply to a market and regulatory period.",
    "Stage V ile eski Stage IIIA farklı düzenleme seviyelerini gösterir.",
    "Stage V and older Stage IIIA refer to different regulatory regimes.",
    "Aynı model adı farklı pazarlarda farklı emisyon donanımı taşıyabilir.",
    "The same model name may have different emissions equipment by market."
  ],
  [
    "engine",
    "dpf-scr",
    "DPF, SCR ve AdBlue",
    "DPF, SCR and AdBlue/DEF",
    "DPF kurum parçacıklarını tutar; SCR uygun sıvıyla azot oksitleri azaltır.",
    "DPF traps soot particles; SCR uses a dosing fluid to reduce nitrogen oxides.",
    "AdBlue deposu olan bir traktörde o sıvı dizel yakıt deposuna konmaz.",
    "A tractor with DEF has a separate tank; it must not go into the diesel tank.",
    "Her emisyon standardı aynı sistemi zorunlu kılmaz; model kılavuzuna bakın.",
    "Not every emissions class mandates identical hardware; consult the model manual."
  ],
  [
    "drivetrain",
    "manual-gearbox",
    "Mekanik şanzıman",
    "Manual transmission",
    "Vites ve kademeler mekanik dişli oranlarıyla seçilir; debriyaj gereksinimi modele göre değişir.",
    "Gear ratios are selected mechanically; clutch operation depends on the design.",
    "12F/12R yazıyorsa 12 ileri ve 12 geri oran vardır.",
    "12F/12R means 12 forward and 12 reverse ratios.",
    "Vites adedi tek başına geçiş konforunu veya dayanıklılığı göstermez.",
    "Gear count alone does not establish comfort or durability."
  ],
  [
    "drivetrain",
    "powershift",
    "Powershift",
    "Powershift transmission",
    "Bazı vites veya kademe geçişlerini yük altında debriyaj pedalına basmadan yapabilen şanzıman düzenidir.",
    "A gearbox allowing some ratio changes under load without clutch-pedal operation.",
    "Tarla sonunda hız ayarı yapmak veya çekişe uyum sağlamak kolaylaşabilir.",
    "It can make speed adjustments easier while working.",
    "Kısmi powershift ile tüm kademeleri powershift olan sistem aynı değildir.",
    "Partial powershift is not the same as full-range powershift."
  ],
  [
    "drivetrain",
    "cvt",
    "CVT / kademesiz şanzıman",
    "CVT / continuously variable transmission",
    "Belirli çalışma aralığında motor devri ile ilerleme hızını sürekli değişken biçimde ilişkilendirir.",
    "Continuously varies drive ratio over an operating range.",
    "Belli bir tarla hızını motor devrini ayrı ayarlayarak korumaya yardımcı olabilir.",
    "It may maintain a chosen field speed while adjusting engine rpm.",
    "Her CVT aynı çalışma biçimi, verim veya bakım gereksinimine sahip değildir.",
    "Not all CVTs share the same operating principle, efficiency or maintenance needs."
  ],
  [
    "drivetrain",
    "hst",
    "HST / hidrostatik şanzıman",
    "HST / hydrostatic transmission",
    "Hidrolik pompa ve motor üzerinden ilerleme hızının hassas ayarlanabildiği aktarma düzenidir.",
    "A driveline using a hydraulic pump and motor to vary ground speed smoothly.",
    "Ön yükleyiciyle sık ileri geri yapılırken kullanışlı olabilir.",
    "It is useful during repeated loader manoeuvres.",
    "HST aktarma ile ekipmana güç veren dış hidrolik devre farklı sistemlerdir.",
    "Hydrostatic drive is not the same as auxiliary implement hydraulics."
  ],
  [
    "drivetrain",
    "shuttle",
    "Shuttle / reverser",
    "Shuttle / reverser",
    "Traktörün ileri ve geri yönünü seçen kumanda veya yön değiştirme mekanizmasıdır.",
    "The control or mechanism used to select forward and reverse travel.",
    "Balya istiflerken sürekli geri-ileri dönüşleri kolaylaştırır.",
    "It eases frequent direction changes during bale handling.",
    "Mekanik, senkromeçli ve elektrohidrolik reverser farklı özelliklerdir.",
    "Mechanical, synchronized and electrohydraulic reversers differ."
  ],
  [
    "drivetrain",
    "clutch",
    "Debriyaj ve çift kavrama",
    "Clutch and dual clutch",
    "Motor ile aktarma arasında hareketi ayırıp birleştirir; çift kademeli sistemlerde PTO kontrolü ayrılabilir.",
    "Connects or disconnects drive; two-stage designs may separate PTO engagement from travel.",
    "Bazı traktörlerde pedalın ikinci kademesi kuyruk milini etkiler.",
    "On some tractors a second pedal stage controls PTO drive.",
    "Çift kavrama ifadesi her zaman otomobil tipi çift kavramalı şanzıman demek değildir.",
    "Dual clutch does not necessarily mean a car-style DCT gearbox."
  ],
  [
    "drivetrain",
    "traction",
    "2WD ve 4WD çekiş",
    "2WD and 4WD drive",
    "Motor gücünün iki ya da dört tekerlekten çekişe katılmasını anlatır.",
    "Indicates whether two or four wheels can contribute driven traction.",
    "Islak tarlada 4WD patinajı azaltabilir; sert zeminde 2WD yeterli olabilir.",
    "4WD may reduce slip on wet soil; 2WD may suffice on firm ground.",
    "Çekiş lastik, ağırlık ve zeminle de belirlenir; 4WD her işte üstün değildir.",
    "Tyres, weight and soil matter; 4WD is not universally superior."
  ],
  [
    "drivetrain",
    "diff-lock",
    "Diferansiyel kilidi",
    "Differential lock",
    "Aynı aks tekerleklerinin hız farkını sınırlandırarak kaygan zeminde tutunmayı artırabilir.",
    "Limits differential wheel-speed difference to help traction on slippery ground.",
    "Bir teker boşa dönerken kilit faydalı olabilir.",
    "It can help when one wheel spins.",
    "Dönüşte ve sert zeminde kullanım talimatlarına uyun; her hızda açık tutulmaz.",
    "Follow turning and hard-surface instructions; do not use it indiscriminately."
  ],
  [
    "drivetrain",
    "final-drive",
    "Son dişli, aks ve 4x4 diferansiyel",
    "Final drive, axle and 4x4 differential",
    "Şanzımandan gelen torku tekerleğe taşıyan son aktarma ve aks bileşenleridir.",
    "Final gearing and axle components transmit driveline torque to the wheels.",
    "Portal veya planet dişli farklı yerden yükseklik ve tork dağılımı sunabilir.",
    "Portal and planetary arrangements can affect clearance and torque reduction.",
    "Tek başına aks biçimi bir arızasızlık veya çekiş garantisi değildir.",
    "Axle type alone does not establish durability or traction."
  ],
  [
    "pto",
    "pto",
    "PTO / kuyruk mili",
    "PTO / power take-off",
    "Traktörün gücünü döner ekipmanlara mekanik olarak aktarır.",
    "Transfers tractor power mechanically to rotating implements.",
    "Biçme makinesi, yem karma veya rotovatör kuyruk miliyle çalışabilir.",
    "Mowers, mixers and rotary tillers can use PTO power.",
    "Kuyruk mili muhafazası sökülmemeli; hareketliyken temas ölümcül olabilir.",
    "Never remove PTO guarding; contact with a rotating shaft can be fatal."
  ],
  [
    "pto",
    "pto-power",
    "PTO gücü",
    "PTO power",
    "Kuyruk mili çıkışında mevcut gücü belirtir; motor çıkış gücünden genellikle daha düşüktür.",
    "Power available at the PTO shaft, typically below crankshaft output.",
    "PTO ile çalışan makinenin güç ihtiyacını karşılaştırırken bu değeri arayın.",
    "Use it when checking the input power required by an implement.",
    "Motor HP ve PTO HP, üreticinin tahmini ile test ölçümü ayrı tutulmalıdır.",
    "Do not confuse engine and PTO power or manufacturer estimates and tested results."
  ],
  [
    "pto",
    "pto-speeds",
    "540 / 540E / 1000 PTO devri",
    "540 / 540E / 1000 PTO speeds",
    "Kuyruk milinin nominal dönme hızı seçenekleridir; 540E daha düşük motor devrinde 540 çıkış sağlayabilir.",
    "Selectable PTO shaft speeds; 540E may reach 540 shaft rpm at lower engine rpm.",
    "Bir ekipman 540 rpm isterken 1000 rpm seçmek güvenli değildir.",
    "An implement requiring 540 rpm must not be driven at 1,000 rpm.",
    "Makinenin kılavuzundaki izin verilen PTO hızı ve mil tipini eşleştirin.",
    "Match the implement manual’s permitted PTO speed and shaft type."
  ],
  [
    "pto",
    "independent-pto",
    "Bağımsız PTO / canlı PTO",
    "Independent PTO / live PTO",
    "PTO'nun ilerleme kavramasından ne kadar bağımsız kontrol edildiğini anlatır.",
    "Describes how independently PTO engagement can be controlled from ground drive.",
    "Traktör dururken ekipmanın dönmeye devam etmesi bazı sistemlerde mümkündür.",
    "Some systems let the implement continue turning while travel stops.",
    "Bağımsız, canlı ve çift kademeli PTO aynı mekanizma değildir.",
    "Independent, live and two-stage PTO are not identical arrangements."
  ],
  [
    "pto",
    "ground-pto",
    "Yol hızına bağlı PTO",
    "Ground-speed PTO",
    "Kuyruk mili devri ilerleme hareketiyle ilişkilendirilen özel PTO düzenidir.",
    "A PTO mode tied to the tractor’s ground travel.",
    "Belirli tarım ekipmanlarında ilerleme hızıyla senkron hareket gerekebilir.",
    "Certain implements require rotation tied to travel speed.",
    "Standart 540 PTO modu yerine geçmez; yanlış seçim ekipmana zarar verebilir.",
    "It is not interchangeable with a standard 540 rpm mode."
  ],
  [
    "pto",
    "pto-shaft",
    "PTO mil çapı ve kanal sayısı",
    "PTO shaft size and spline count",
    "PTO çıkış milinin bağlantı geometrisini belirtir.",
    "Describes the PTO output shaft coupling geometry.",
    "Altı yivli 1⅜ inç ve 21 yivli mil birbirine doğrudan uymaz.",
    "A six-spline 1⅜-inch shaft and a 21-spline shaft are not directly interchangeable.",
    "Devir ve bağlantı ölçüsü ayrı kontrol edilir; gerekirse yetkili adaptör kullanılır.",
    "Check speed and shaft geometry separately; use only an approved adaptor."
  ],
  [
    "pto",
    "front-pto",
    "Ön kuyruk mili",
    "Front PTO",
    "Traktör önündeki PTO bağlantısından ekipman çalıştırma olanağıdır.",
    "A PTO outlet at the front for front-mounted implements.",
    "Ön biçme makinesiyle arka ekipmanı aynı geçişte çalıştırmaya yardımcı olabilir.",
    "It can enable front and rear implements to work together.",
    "Her modelde standart değildir; ön askı ve güç sınırı da gerekir.",
    "Often optional; front linkage and power ratings also matter."
  ],
  [
    "hydraulics",
    "hydraulic-flow",
    "Hidrolik debi (L/dk)",
    "Hydraulic flow (L/min)",
    "Pompanın belirli koşullarda taşıdığı yağ hacminin zaman başına miktarıdır.",
    "The volume of oil moved per unit time under stated conditions.",
    "Yükleyici silindirinin hareket hızı kullanılabilir debiden etkilenir.",
    "Loader cylinder speed is affected by available oil flow.",
    "Toplam pompa debisi, direksiyon debisi ve ekipmana ayrılan debi ayrı olabilir.",
    "Total pump, steering and implement-available flows can differ."
  ],
  [
    "hydraulics",
    "hydraulic-pressure",
    "Hidrolik basınç (bar)",
    "Hydraulic pressure (bar)",
    "Hidrolik devredeki basınç değeridir; kuvvet üretme kapasitesiyle ilişkilidir.",
    "Hydraulic circuit pressure; related to force capability.",
    "Basınç ve silindir alanı kaldırma kuvvetini birlikte etkiler.",
    "Pressure and cylinder area together affect force.",
    "Yüksek bar tek başına hızlı veya yüksek kaldırma anlamına gelmez.",
    "Higher pressure alone does not guarantee fast or large lifting."
  ],
  [
    "hydraulics",
    "rear-lift",
    "Arka kaldırma kapasitesi",
    "Rear linkage lift capacity",
    "Üç nokta askının belirtilen konum ve ölçüm şartında kaldırabildiği yükü ifade eder.",
    "How much a rear three-point linkage can lift at a specified point and test condition.",
    "2.500 kg uç ölçümünü, 610 mm geriden ölçülmüş 2.500 kg ile doğrudan eşitlemeyin.",
    "2,500 kg at the ball ends is not the same claim as 2,500 kg at 610 mm behind.",
    "Değerin 'uçta', '610 mm geride' veya 'tüm hareket boyunca' olup olmadığını okuyun.",
    "Check whether the figure is at ball ends, 610 mm rearward or across the full lift arc."
  ],
  [
    "hydraulics",
    "hydraulic-remotes",
    "Hidrolik çıkış / SCV / spool",
    "Remote hydraulics / SCV / spool",
    "Harici ekipmanın silindir veya hidrolik motoruna yağ yönlendiren kontrol ve bağlantı çiftleridir.",
    "Valves and couplers that direct oil to external cylinders and motors.",
    "Hidrolik katlanan bir tırmık için yeterli çıkış çifti gerekir.",
    "A folding rake needs the required number of hydraulic couplers.",
    "Tek/çift etkili vana, debi ve bağlantı sayısı ayrı sorgulanmalıdır.",
    "Check single/double-acting function, flow and outlet count separately."
  ],
  [
    "hydraulics",
    "three-point",
    "Üç nokta askı sistemi",
    "Three-point linkage",
    "İki alt kol ve bir üst kolla ekipmanı traktöre bağlayan askı geometrisidir.",
    "An implement attachment arrangement using two lower links and a top link.",
    "Pulluk, mibzer ve rotovatörün traktöre hizalanmasını sağlar.",
    "It positions ploughs, drills and rotary tillers relative to the tractor.",
    "Kapasite kadar bağlantı boyu, kategori ve ekipman ağırlık merkezi önemlidir.",
    "Link geometry, category and implement centre of gravity matter as much as lift rating."
  ],
  [
    "hydraulics",
    "hitch-category",
    "Askı kategorisi (I, II, III)",
    "Hitch category (I, II, III)",
    "Üç nokta askı pimleri ve bağlantılarının boyut sınıfıdır.",
    "Standard size class of three-point linkage pins and connections.",
    "Kategori I ekipmanın pimleri, kategori III bağlantıya adaptörsüz uymayabilir.",
    "Category I implement pins may not match Category III linkage without adaptation.",
    "Kategori daha yüksekse traktörün ekipmanı güvenle kaldırdığı sonucu çıkmaz.",
    "A higher category does not automatically mean safe lifting of any implement."
  ],
  [
    "hydraulics",
    "ehr",
    "EHR / elektronik askı kontrolü",
    "EHR / electronic hitch control",
    "Askı kollarının konum veya çekiş tepkisini elektronik kumandayla yöneten sistemdir.",
    "Electronic control of linkage position or draft response.",
    "Tarla sonunda ekipmanı aynı yüksekliğe geri almak kolaylaşabilir.",
    "It may help return an implement to a repeatable headland height.",
    "Sensör ve kontrol türü marka/model arasında değişir.",
    "Sensor design and control features vary by model."
  ],
  [
    "hydraulics",
    "draft-control",
    "Çeki kontrolü / pozisyon kontrolü",
    "Draft control / position control",
    "Çeki kontrolü ekipman direncine, pozisyon kontrolü askı yüksekliğine tepki verir.",
    "Draft control reacts to implement resistance; position control targets linkage position.",
    "Pullukta çeki kontrolü, tesviye aletinde pozisyon ayarı daha önemli olabilir.",
    "Draft control can matter for ploughing; position control for grading.",
    "Toprak ve ekipman ayarı olmadan otomatik performans beklemeyin.",
    "It still requires proper soil and implement setup."
  ],
  [
    "hydraulics",
    "front-linkage",
    "Ön askı / ön kaldırıcı",
    "Front linkage",
    "Traktör önüne üç nokta veya özel askı üzerinden ekipman bağlamaya yarar.",
    "An implement mounting and lifting arrangement at the tractor front.",
    "Ön ağırlık yerine ön biçme makinesi veya ekipman bağlanabilir.",
    "It can carry a front mower or implement instead of a simple weight.",
    "Ön PTO, kaldırma kapasitesi ve aks yük sınırları ayrı belgelenmelidir.",
    "Front PTO, lifting capacity and front axle limits must be checked separately."
  ],
  [
    "hydraulics",
    "hydraulic-types",
    "Açık ve kapalı merkez hidrolik",
    "Open-centre and closed-centre hydraulics",
    "Pompanın ve valflerin talep olmadığında yağı nasıl yönettiğini anlatan devre tasarımlarıdır.",
    "Circuit architectures describing how pump and valves handle flow when no function is demanded.",
    "Değişken debili sistemler talebe göre yağ sağlayabilir.",
    "Variable-displacement systems can adjust delivered flow to demand.",
    "Açık/kapalı merkez etiketi tek başına performans karşılaştırması değildir.",
    "Open/closed-centre labels alone do not determine implement performance."
  ],
  [
    "dimensions",
    "wheelbase",
    "Dingil mesafesi",
    "Wheelbase",
    "Ön ve arka aks merkezleri arasındaki uzunlamasına mesafedir.",
    "Longitudinal distance between front and rear axle centres.",
    "Kısa dingil mesafesi dar yerde dönüşe yardımcı olabilir.",
    "A shorter wheelbase may help manoeuvring in tight spaces.",
    "Dönüş çapı yalnız dingil mesafesinden hesaplanmaz.",
    "Turning radius depends on more than wheelbase."
  ],
  [
    "dimensions",
    "track-width",
    "İz genişliği",
    "Track width",
    "Aynı aks üzerindeki sağ ve sol tekerleğin merkez hatları arası mesafedir.",
    "Distance between the centres of the left and right wheels on one axle.",
    "Sıra arası çalışmada iz genişliğinin ayarlanabilmesi önemlidir.",
    "Adjustable track width matters for row crops.",
    "Lastik dıştan dışa genişliği ile teker merkezleri arası iz genişliği aynı değildir.",
    "Overall width is not the same as wheel-centre track width."
  ],
  [
    "dimensions",
    "ground-clearance",
    "Yerden yükseklik",
    "Ground clearance",
    "Traktörün altındaki en düşük belirtilmiş nokta ile zemin arası açıklıktır.",
    "The distance from the ground to the specified lowest underside point.",
    "Yüksek ürün sıralarında gövdenin bitkilere temasını etkiler.",
    "It matters for clearance over crops and obstacles.",
    "Lastik ölçüsü ve hangi noktadan ölçüldüğü sonucu değiştirir.",
    "Tyre size and measurement point alter the result."
  ],
  [
    "dimensions",
    "dimensions",
    "Uzunluk, genişlik, yükseklik",
    "Overall length, width and height",
    "Traktörün kapladığı fiziksel dış ölçülerdir.",
    "The external dimensions of the tractor.",
    "Sera kapısı yüksekliği veya bağ sıraları için belirleyicidir.",
    "They determine whether the tractor fits a greenhouse door or vineyard row.",
    "Kabin, ROPS, ağırlık ve lastik seçimine göre değişebilir.",
    "They can vary with cab, ROPS, ballast and tyre configuration."
  ],
  [
    "dimensions",
    "operating-weight",
    "Boş ağırlık / çalışma ağırlığı",
    "Unladen and operating weight",
    "Traktörün hangi sıvı, sürücü ve donanımla tartıldığını anlatan farklı kütle tanımlarıdır.",
    "Different mass definitions according to fluids, driver and fitted equipment.",
    "Kabinli model, açık platformdan daha ağır olabilir.",
    "A cab variant can weigh more than an open-station model.",
    "Nakliye kütlesi, kuru ağırlık ve işletme ağırlığı eşit kabul edilmez.",
    "Shipping, dry and operating weights must not be treated as identical."
  ],
  [
    "dimensions",
    "ballast",
    "Balast / ön ağırlık",
    "Ballast / front weights",
    "Çekiş ve denge için traktöre eklenen kontrollü kütledir.",
    "Additional weight used for traction and balance.",
    "Ağır arka ekipman için uygun ön balast gerekebilir.",
    "A heavy rear implement may require suitable front ballast.",
    "Fazla balast zemin sıkışmasını ve aks yükünü artırabilir.",
    "Excess ballast increases soil compaction and axle load."
  ],
  [
    "dimensions",
    "tyre-size",
    "Lastik ölçüsü",
    "Tyre size",
    "Lastiğin kesit genişliği, yanak/yapı ve jant ölçüsünü belirtir.",
    "Defines tyre section, construction and rim size.",
    "13.6-28 ve 14.9-28 lastikler aynı nominal ölçüde değildir.",
    "13.6-28 and 14.9-28 tyres are different nominal sizes.",
    "Ön/arka çevre uyumu özellikle 4WD'de önemli; rastgele değiştirilemez.",
    "Front/rear rolling circumference matters on 4WD; substitutions need approval."
  ],
  [
    "dimensions",
    "tyre-pressure",
    "Lastik basıncı ve toprak basıncı",
    "Tyre inflation and soil pressure",
    "Şişirme basıncı lastiğin davranışını; temas yüküyle birlikte zemin baskısını etkiler.",
    "Inflation pressure affects tyre behaviour and, with load, soil contact stress.",
    "Yüke uygun basınç çekişe ve toprak izine etki edebilir.",
    "Load-appropriate pressure affects traction and soil imprint.",
    "Lastik üreticisinin hız-yük tablosu kullanılmadan basınç önerilmez.",
    "Do not recommend inflation without the tyre maker’s load/speed tables."
  ],
  [
    "dimensions",
    "turning-radius",
    "Dönüş yarıçapı",
    "Turning radius",
    "Direksiyon tam kırıldığında yapılan dönüşün geometrik yarıçapıdır.",
    "The geometric radius of a turn at full steering lock.",
    "Dar avluda manevra kabiliyeti seçimi etkiler.",
    "It affects manoeuvrability in yards.",
    "Lastik, 4WD, fren desteği ve ölçüm yöntemi sonucu değiştirir.",
    "Tyres, 4WD, brake assistance and test method affect the figure."
  ],
  [
    "dimensions",
    "drawbar",
    "Çeki demiri ve çeki gücü",
    "Drawbar and drawbar power",
    "Çeki demiri römork/ekipman bağlantısı; çeki gücü ise çekişte yere aktarılabilen iş oranıdır.",
    "The drawbar connects a towed load; drawbar power is useful work delivered to the pull.",
    "Römork bağlantısı uygun olsa bile fren ve izin verilen çekilen ağırlık sınırları vardır.",
    "An attached trailer still must meet braking and permitted mass limits.",
    "Motor HP, PTO HP ve çeki demiri gücü aynı ölçüm değildir.",
    "Engine, PTO and drawbar power are different measurements."
  ],
  [
    "dimensions",
    "axle-load",
    "İzin verilen aks yükü ve toplam kütle",
    "Permitted axle load and gross mass",
    "Üreticinin şasi ve akslar için belirlediği sınırları belirtir.",
    "Manufacturer limits for axle loads and total machine mass.",
    "Ön yükleyici ve balast kombinasyonunda aks sınırını kontrol edin.",
    "Check axle limits when combining a loader and ballast.",
    "Kaldırma kapasitesi izin verilen yüklü kütle sınırını geçersiz kılmaz.",
    "Lift rating does not override the permitted mass limits."
  ],
  [
    "safety",
    "rops",
    "ROPS / devrilme koruması",
    "ROPS / rollover protection",
    "Devrilme sırasında operatör için koruyucu alan oluşturmaya yönelik test edilmiş yapıdır.",
    "A tested protective structure intended to maintain operator clearance in a rollover.",
    "Açık platform traktörde ROPS ve emniyet kemeri birlikte kritik olabilir.",
    "On open-station tractors, ROPS and a seat belt work together.",
    "ROPS var diye kemersiz sürüş güvenli hale gelmez; katlanır ROPS talimatına uyun.",
    "ROPS alone does not make unbelted driving safe; follow foldable-ROPS instructions."
  ],
  [
    "safety",
    "fops",
    "FOPS / düşen cisim koruması",
    "FOPS / falling-object protection",
    "Operatörü yukarıdan düşen belirli cisimlere karşı korumak için tasarlanan yapıdır.",
    "A structure designed to protect from specified falling-object hazards.",
    "Orman işi ve ön yükleyici kullanımında ayrı koruma gereksinimleri olabilir.",
    "Forestry and loader tasks can create distinct protection needs.",
    "ROPS ile FOPS aynı sertifikasyon değildir; model kanıtı gerektirir.",
    "ROPS and FOPS are not the same certification."
  ],
  [
    "safety",
    "brakes",
    "Kuru ve yağ banyolu fren",
    "Dry and wet disc brakes",
    "Sürtünme yüzeyinin kuru veya yağ içinde çalıştığı fren tasarımlarıdır.",
    "Brake designs with friction components operating dry or in oil.",
    "Yağ banyolu düzen ısı ve aşınmayı farklı yönetebilir.",
    "A wet-disc system can manage heat and wear differently.",
    "Fren mesafesi lastik, yük, yol ve bakım durumuna da bağlıdır.",
    "Stopping distance also depends on tyres, loading, surface and maintenance."
  ],
  [
    "safety",
    "seatbelt",
    "Emniyet kemeri ve koltuk",
    "Seat belt and operator seat",
    "Operatörü koruma alanında tutmaya ve titreşim aktarımını azaltmaya yarayan donanımlardır.",
    "Equipment intended to retain the operator and reduce transmitted vibration.",
    "ROPS bulunan traktörde uygun kemer kullanımı koruyucu alan için önemlidir.",
    "Proper belt use is essential to benefit from rollover protection.",
    "Trafik ve saha güvenliği için kılavuzdaki kuralları izleyin.",
    "Follow the machine manual and local safety requirements."
  ],
  [
    "safety",
    "steering",
    "Hidrostatik direksiyon / power steering",
    "Hydrostatic / power steering",
    "Direksiyon çevirmeyi hidrolik destekle hafifleten düzenlerdir.",
    "Steering systems assisted by hydraulic power.",
    "Ön yükleyicili traktörde düşük hız manevraları kolaylaşabilir.",
    "Low-speed loader manoeuvres can be easier.",
    "Direksiyon tipi ile hidrostatik sürüş şanzımanı aynı şey değildir.",
    "Power steering is not the same as an HST drive gearbox."
  ],
  [
    "safety",
    "cab-air",
    "Kabin filtresi ve klima",
    "Cab filtration and air conditioning",
    "Operatör konforunu ve uygun donanımda kabine giren havanın filtrelenmesini etkiler.",
    "Equipment for operator comfort and, where specified, air filtration.",
    "Tozlu biçerdöver yakınında filtre bakımı önemli hale gelir.",
    "Filter care matters in dusty operations.",
    "Standart kabin filtresi pestisitlere karşı sertifikalı koruma anlamına gelmez.",
    "A normal cab filter is not certified pesticide protection."
  ],
  [
    "safety",
    "noise",
    "Gürültü ve titreşim",
    "Noise and vibration",
    "Operatörün uzun süreli maruz kalabileceği ses ve titreşim seviyeleridir.",
    "Noise and vibration levels to which an operator may be exposed.",
    "Uzun iş gününde kabin, koltuk ve kulak koruması fark yaratabilir.",
    "Cab, seat and hearing protection can matter on long shifts.",
    "dB(A) ölçüm yeri ve standart olmadan markaları sıralamayın.",
    "Do not rank machines from dB(A) figures without test location and standard."
  ],
  [
    "ownership",
    "fuel-tank",
    "Yakıt deposu kapasitesi",
    "Fuel tank capacity",
    "Depoya alınabilen yakıt miktarıdır; tek başına tüketim veya menzil değildir.",
    "Amount of fuel a tank holds; not a measure of consumption or range.",
    "80 litrelik depo, sabit çalışma saati garantisi vermez.",
    "An 80-litre tank does not promise a fixed number of hours.",
    "İşin yükü, motor devri ve yakıt tüketimi ayrıca ölçülür.",
    "Consumption varies with load, speed and operating conditions."
  ],
  [
    "ownership",
    "service-interval",
    "Bakım aralığı",
    "Service interval",
    "Belirtilen çalışma saati veya takvim süresi sonunda yapılması gereken bakım noktasıdır.",
    "A prescribed operating-hour or calendar interval for maintenance.",
    "Motor yağı ile hidrolik yağın bakım periyotları farklı olabilir.",
    "Engine oil and hydraulic fluid may have different intervals.",
    "Ağır tozlu kullanımlarda kılavuz daha sık bakım isteyebilir.",
    "Severe dusty operation may require shorter intervals."
  ],
  [
    "ownership",
    "filters",
    "Hava, yakıt ve yağ filtreleri",
    "Air, fuel and oil filters",
    "Kir ve parçacıkların motora ya da devreye ulaşmasını sınırlandıran bakım parçalarıdır.",
    "Service parts that limit contaminants reaching the engine or fluid circuits.",
    "Tıkalı hava filtresi motor verimini etkileyebilir.",
    "A restricted air filter can affect engine performance.",
    "Uygun filtre ve değişim aralığını motor/model kılavuzundan doğrulayın.",
    "Use model-approved filters and maintenance intervals."
  ],
  [
    "ownership",
    "test-standards",
    "ECE R120, ISO 14396 ve OECD testleri",
    "ECE R120, ISO 14396 and OECD tests",
    "Motor standardı güç açıklamasının koşulunu; OECD testleri belirli traktör performans ölçümlerini tanımlar.",
    "Engine standards describe declared power conditions; OECD codes define tractor testing procedures.",
    "Üretici motor gücü ile Nebraska PTO testini aynı rakammış gibi kıyaslamayın.",
    "Do not compare an engine declaration with a Nebraska PTO test as the same metric.",
    "PTO/çeki demiri gücü, motor çıkışı, test yılı ve standardı birlikte verin.",
    "Always name the test point, year, procedure and measurement standard."
  ],
  [
    "ownership",
    "source-quality",
    "Üretici broşürü ile bağımsız test farkı",
    "Manufacturer brochure vs independent test",
    "Broşür üreticinin beyanını; bağımsız test belirli koşullarda ölçülmüş sonucu sunar.",
    "A brochure records a maker's claim; an independent test reports measurements under stated conditions.",
    "Katalogdaki PTO tahmini Nebraska test ölçümüyle aynı belge türü değildir.",
    "An estimated catalogue PTO figure is not the same as a laboratory PTO test.",
    "Belgesiz değerleri 'doğrulandı' veya 'test edildi' diye sunmayın.",
    "Do not label undocumented values as verified or independently tested."
  ],
  [
    "ownership",
    "options",
    "Standart, opsiyonel ve pazar varyantı",
    "Standard, optional and market variants",
    "Standart ekipmanla ücretli seçimleri veya farklı pazar sürümlerini ayıran açıklamadır.",
    "Distinguishes base equipment, optional packages and regional configurations.",
    "Aynı modelin ABD HST sürümü Avrupa mekanik şanzımanlı sürümden farklı olabilir.",
    "A US HST version may differ from a European manual version of the same name.",
    "Seçeneklerin tümü aynı traktörde bulunuyormuş gibi listelemeyin.",
    "Do not imply every listed option is fitted to one tractor."
  ]
] as const;
export type GlossaryLanguage = "en" | "tr";
export type GlossaryCategory = keyof typeof GLOSSARY_SECTIONS;
export const GLOSSARY_TERMS = GLOSSARY_ROWS.map((r) => ({
  category:r[0], id:r[1], name:{tr:r[2],en:r[3]},
  definition:{tr:r[4],en:r[5]}, example:{tr:r[6],en:r[7]},
  caution:{tr:r[8],en:r[9]}
}));
/** Stable glossary anchors for source-backed public specification canonical keys. */
export function glossaryAnchorForKey(key:string|null|undefined):string|null {
  const k=(key||"").toLowerCase();
  if(!k)return null;
  const rules:[RegExp,string][]= [
    [/power_range|engine_power_class|published_power_range/,"engine-power"],
    [/pto.*(power|hp|kw)|power.*pto/,"pto-power"],
    [/engine.*(boost|max.*power)|max.*engine.*power/,"maximum-power"],
    [/rated.*(engine_)?power|engine.*rated.*power|rated_engine_power/,"rated-power"],
    [/engine.*(power|horsepower)|horsepower|power_kw/,"engine-power"],
    [/torque.*rise|reserve.*torque|torque_reserve/,"torque-rise"],
    [/torque/,"torque"],[/displacement|engine_capacity/,"displacement"],
    [/bore|stroke/,"bore-stroke"],[/cylinders|cylinder_count/,"cylinders"],
    [/rpm|rated_speed|engine_speed/,"rpm"],[/turbo|aspiration|intercooler/,"turbo"],
    [/common.rail|inject|fuel_system/,"fuel-injection"],
    [/emission|stage_v|tier_/,"emission"],[/adblue|dpf|scr|aftertreatment|def_tank/,"dpf-scr"],
    [/transmission.*(cvt|direct)|cvt/,"cvt"],[/powershift|power_shift/,"powershift"],
    [/hydrostatic.*transmission|transmission.*hst|hst_transmission/,"hst"],
    [/reverse|reverser|shuttle/,"shuttle"],[/clutch/,"clutch"],
    [/differential_lock|diff_lock/,"diff-lock"],
    [/final_drive|front_axle|rear_axle|planetary/,"final-drive"],
    [/drivetrain|drive_system|drive_configuration|four_wheel_drive|2wd|4wd/,"traction"],
    [/transmission|gear|speed_range|creeper/,"manual-gearbox"],
    [/front.*pto/,"front-pto"],[/pto.*(shaft|spline)|shaft.*pto/,"pto-shaft"],
    [/ground.*pto|pto.*ground/,"ground-pto"],
    [/independent.*pto|pto.*engagement/,"independent-pto"],
    [/pto.*(speed|rpm)|rear_pto|mid_pto/,"pto-speeds"],[/pto/,"pto"],
    [/implement.*pump.*flow|total.*pump.*flow|hydraulic.*flow|pump.*flow|flow_lpm|flow_rate/,"hydraulic-flow"],
    [/hydraulic.*pressure|working_pressure|system_pressure/,"hydraulic-pressure"],
    [/lift_capacity|hitch.*capacity|rear_lift|lifting_capacity/,"rear-lift"],
    [/remote|scv|spool|hydraulic.*outlet|auxiliary_valve/,"hydraulic-remotes"],
    [/hitch_category|linkage_category/,"hitch-category"],[/ehr|electronic.*hitch/,"ehr"],
    [/draft_control|position_control|hydraulic_control/,"draft-control"],
    [/front.*(linkage|hitch|lift)/,"front-linkage"],
    [/hydraulic.*(open.center|closed.center)|load_sensing/,"hydraulic-types"],
    [/hitch|three.point|linkage/,"three-point"],
    [/wheelbase/,"wheelbase"],[/track/,"track-width"],[/ground_clearance/,"ground-clearance"],
    [/tyre|tire|wheel_size/,"tyre-size"],[/ballast|front_weight/,"ballast"],
    [/turning_radius|turning_circle/,"turning-radius"],
    [/drawbar/,"drawbar"],[/axle_load|permitted_mass|gross_mass/,"axle-load"],
    [/weight|mass|shipping_weight|operating_weight/,"operating-weight"],
    [/overall|width|length|height|dimension/,"dimensions"],
    [/rops|rollover/,"rops"],[/fops|falling_object/,"fops"],
    [/brake/,"brakes"],[/seat|belt/,"seatbelt"],[/steering/,"steering"],
    [/cab.*(air|filter|climate)|air_condition/,"cab-air"],[/noise|vibration/,"noise"],
    [/fuel_tank|tank_capacity/,"fuel-tank"],[/service_interval|maintenance/,"service-interval"],
    [/air_filter|oil_filter|fuel_filter/,"filters"],[/standard|iso14396|ece_r120|oecd/,"test-standards"],
    [/option|variant|package/,"options"]
  ];
  return rules.find(([rule])=>rule.test(k))?.[1] ?? null;
}
