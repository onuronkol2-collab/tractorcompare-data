/** TractorVS editorial learning articles. Original educational examples; no field-test claims. */
export const TECHNICAL_DEEP_DIVES = [
  {
    "slug": "pto-and-power-take-off",
    "comparisonNote": {
      "tr": "Biçme makinesinin kılavuzunda 540 dev/dk yazıyorsa önce traktörün kuyruk milinde bu devri sağlayıp sağlamadığına bakın. Sonra mil bağlantısını ve ekipmanın istediği PTO gücünü kontrol edin. Katalogdaki motor gücü tek başına bu iki soruyu yanıtlamaz.",
      "en": "If a mower calls for 540 rpm, first check that the tractor can deliver that speed at the PTO shaft. Then match the shaft connection and the mower’s PTO power requirement. Engine horsepower alone answers neither question."
    },
    "group": "pto",
    "heroPhoto": {
      "brand": "New Holland",
      "model": "T5.110"
    },
    "title": {
      "tr": "Traktörde PTO (Kuyruk Mili) Nedir? 540, 540E ve 1000 Devir Rehberi",
      "en": "What Is a Tractor PTO? 540, 540E and 1000 RPM Explained"
    },
    "description": {
      "tr": "PTO kuyruk mili ne işe yarar? 540, 540E ve 1000 rpm, PTO gücü, mil ölçüsü ve ekipman uyumu sade örneklerle açıklanıyor.",
      "en": "Learn how the tractor power take-off works, why 540, 540E and 1000 rpm differ, and how to check safe implement compatibility."
    },
    "lead": {
      "tr": "Traktörün arkasındaki biçme makinesinin bıçakları nasıl döner? Traktör yalnızca makineyi çekmez; kuyruk mili denilen çıkışından döndürme gücü de verir. İşte PTO budur. Ancak traktörde PTO bulunması, her makinenin ona uyacağı anlamına gelmez. Ekipmanın istediği devir, milin bağlantısı ve kuyruk milinde kullanılabilen güç ayrı ayrı kontrol edilmelidir.",
      "en": "How does a mower rotate while the tractor moves? The power take-off carries mechanical power to the implement. But seeing 'PTO' on a specification sheet does not mean every attachment is compatible: speed, shaft coupling and usable power are separate questions."
    },
    "sections": [
      {
        "anchor": "nasil-calisir",
        "title": {
          "tr": "PTO nasıl çalışır, hangi işe yarar?",
          "en": "What does the PTO actually do?"
        },
        "paragraphs": {
          "tr": [
            "Bunu bir el mikserine benzetebilirsiniz: Mikserin içindeki motor ucu döndürür. Traktörde de motorun oluşturduğu dönme hareketi, aktarma parçalarından geçerek arkadaki kuyruk mili çıkışına ulaşır. Bir şaftla bağlanan biçme makinesi veya rotovatör, bu dönme hareketi sayesinde çalışır.",
            "Traktörün ilerlemesi başka, arkasındaki makinenin dönmesi başka iştir. Örneğin rotovatörün toprağa doğru ilerlemesini lastikler sağlar; içindeki bıçakları ise PTO döndürür. Bu yüzden yalnızca motor beygirini değil, ekipmana aktarılabilen kuyruk mili gücünü de öğrenmelisiniz."
          ],
          "en": [
            "The engine's rotation passes through the driveline to a rear or front power output. With the correct guarded shaft, the implement uses that rotation for its blades, rotor or pump. Pulling an implement and rotating it are different tasks, so tyre traction and PTO power have different roles.",
            "A rotary tiller moves across the field while its rotor turns. These demands should not be described by one horsepower figure. Look for separate engine output and PTO output values."
          ]
        }
      },
      {
        "anchor": "540-540e-1000",
        "title": {
          "tr": "540, 540E ve 1000 rpm: Aynı hız mı?",
          "en": "540, 540E and 1000 rpm: why they differ"
        },
        "paragraphs": {
          "tr": [
            "540 ve 1000 sayıları, kuyruk milinin bir dakikada kaç tur döndüğünü anlatır. Ekipmanın üstünde 540 yazıyorsa traktörde 540'a uygun ayar kullanılmalıdır. 1000 seçmek makinenin iki kat hızlı döndürülmesi anlamına gelebilir ve ciddi tehlike yaratabilir.",
            "540E, bazı traktörlerde bulunan ekonomik ayardır. Kuyruk milini 540 devirde döndürürken motorun daha düşük devirde çalışmasına izin verebilir. Bu ayar özellikle hafif işlerde yararlı olabilir; fakat ağır yükte her zaman uygun değildir. Ekipmanın ve traktörün kullanım kılavuzuna uyun."
          ],
          "en": [
            "540 rpm is a common rated PTO shaft speed. On a compatible tractor, 540E can deliver a 540 rpm output at a lower engine speed, potentially reducing fuel use and noise in light work. It is not a universal feature or a guarantee of savings at heavy load.",
            "Never select 1000 rpm simply because it sounds more powerful. Match the implement's specified operating speed. Driving a 540 rpm implement at 1000 rpm can cause severe damage or injury."
          ]
        }
      },
      {
        "anchor": "guc-ve-baglanti",
        "title": {
          "tr": "PTO gücü ve mil ölçüsü nasıl kontrol edilir?",
          "en": "Checking PTO power and coupling size"
        },
        "paragraphs": {
          "tr": [
            "Motor gücü ile PTO gücü aynı şey değildir. Motor, gücü önce kendi içinde üretir. Bu güç kuyruk miline ulaşıncaya kadar aktarma parçalarından geçer. Bu nedenle 100 beygirlik motorun PTO'da tam 100 beygir vermesini beklemeyin. Ekipmanın istediği gücü PTO gücüyle karşılaştırın.",
            "Milin ucundaki yivler ve çap da önemlidir. Bir tornavidanın yanlış uçla vidaya uymaması gibi, farklı kanallı şaftlar da birbirine doğrudan uymaz. Ayrıca kardan milinin uzunluğu, bağlantısı ve koruma kılıfı doğru olmalıdır. Şaft takarken motoru durdurun ve üreticinin güvenlik adımlarını izleyin."
          ],
          "en": [
            "Engine power is measured at the engine; PTO power is available at the output shaft and may be lower because of transmission losses. Compare the implement's stated requirement with PTO power on the same unit and test basis.",
            "PTO output diameter and spline count determine connection geometry. Shafts with different splines are not interchangeable. Check the implement manual for permitted shaft length, angle, guarding and coupler type."
          ]
        }
      },
      {
        "anchor": "bagimsiz-pto",
        "title": {
          "tr": "Bağımsız PTO ile çift kademeli debriyaj aynı mı?",
          "en": "Independent PTO versus two-stage clutch"
        },
        "paragraphs": {
          "tr": [
            "Bazı traktörlerde ayağınızı debriyaja basıp yürüyüşü durdurduğunuzda kuyruk mili dönmeye devam edebilir. Bu özellik işinize göre yararlı olabilir. Bağımsız PTO denilen sistemlerde kuyruk mili, yürüyüşten ayrı bir kumandayla devreye alınıp kapatılabilir.",
            "İki kademeli debriyaj ise başka bir düzen olabilir: Pedala ilk basıldığında traktör durur, daha fazla basıldığında kuyruk mili de ayrılır. Her traktör aynı şekilde çalışmaz. Özellikle balya makinesi gibi ekipmanlarla çalışmadan önce modelin debriyaj ve PTO kullanımını kılavuzdan öğrenin."
          ],
          "en": [
            "An independent PTO can be controlled separately from tractor travel. In some two-stage clutch systems, pressing the pedal first disengages travel and then the PTO. Those mechanisms are not identical and should not be assumed to behave the same.",
            "For baling and frequent stops, inspect the exact engagement arrangement in the model's manual rather than relying on a generic PTO label."
          ]
        }
      },
      {
        "anchor": "satin-alma",
        "title": {
          "tr": "PTO kullanan ekipman için kısa kontrol listesi",
          "en": "A pre-purchase PTO compatibility check"
        },
        "paragraphs": {
          "tr": [
            "Bir ekipman almadan önce üç temel soruyla başlayın: Makine 540 mı 1000 devir mi istiyor? Yaklaşık kaç beygirlik PTO gücüne ihtiyaç duyuyor? Kardan milinin bağlantısı traktörünüze uyuyor mu? Bu üç bilgi yoksa yalnızca traktörün marka ve beygirine bakarak karar vermeyin.",
            "Sonra ekipmanın ağırlığına, arka askı bağlantısına ve gerekiyorsa hidrolik hortumlarına bakın. Kuyruk mili uyumlu olsa bile askı ya da ağırlık uygun olmayabilir. Dönen şafta yaklaşmayın ve korumasız çalıştırmayın. Bağlantı veya ayar öncesinde traktör ve ekipman kılavuzlarını izleyin: park frenini uygulayın, kumandaları boş konuma alın ve PTO tahrikini kapatın, motoru durdurun, anahtarı çıkarın ve tüm hareketin durmasını bekleyin. Kalan enerji kaynaklarını güvenli biçimde ayırmak için kılavuzlara uyun."
          ],
          "en": [
            "Write down the implement's permitted PTO speeds and power requirement. Then compare verified tractor PTO power, selectable speed modes, spline geometry and coupling dimensions. An unlisted feature is unknown—not automatically present.",
            "Finally consider hitch category, implement mass and any required hydraulic couplers. PTO compatibility is only part of the overall machine match. Never operate an unguarded rotating shaft. Before making or adjusting a PTO connection, follow the tractor and implement manuals: secure the parking brake, place the controls in neutral and switch off the PTO drive, shut down the engine, take out the key and wait for all movement to cease. Follow the manuals for isolating any remaining energy sources."
          ]
        }
      }
    ],
    "glossary": [
      "pto",
      "pto-power",
      "pto-speeds",
      "pto-shaft",
      "independent-pto"
    ]
  },
  {
    "slug": "tractor-hydraulic-lift-explained",
    "comparisonNote": {
      "tr": "İki traktörün kaldırma kapasitesini karşılaştırırken kilogram değerinin nerede ölçüldüğünü bulun. Askı kollarının ucunda verilen kapasite ile kolların gerisinde ölçülen kapasiteyi aynı sütunda sıralamak yanıltıcıdır.",
      "en": "Before comparing two lift ratings, find where each load was measured. A rating at the link ends and one measured behind them describe different loading conditions, even when both are given in kilograms."
    },
    "group": "hydraulics",
    "heroPhoto": {
      "brand": "Case IH",
      "model": "Puma 150"
    },
    "title": {
      "tr": "Traktörde Hidrolik Kaldırma Kapasitesi Nedir? 610 mm, Debi ve Basınç",
      "en": "Tractor Hydraulic Lift Capacity Explained: Flow, Pressure and 610 mm"
    },
    "description": {
      "tr": "Traktör hidrolik kaldırma kapasitesi, 610 mm ölçümü, pompa debisi ve basınç farkı nedir? Ekipman seçerken doğru karşılaştırma rehberi.",
      "en": "Understand rear linkage lift capacity, the 610 mm measurement point, hydraulic flow versus pressure and safe implement matching."
    },
    "lead": {
      "tr": "Bir traktör ilanında “3.000 kg kaldırır” yazısını gördünüz. Peki bu, arkasına bağlanan her üç tonluk pulluğu güvenle kaldıracağı anlamına gelir mi? Hayır. Ekipmanın ne kadar arkaya uzandığı, yükün nereden ölçüldüğü ve traktörün dengesi çok önemlidir. Bu yazıda hidrolik kaldırıcıyı, yağın nasıl iş yaptığını ve katalogdaki sayıların neden farklı olabildiğini günlük örneklerle anlatıyoruz.",
      "en": "A brochure claims a rear hitch lift of 3,000 kg. Can the tractor safely carry any three-tonne implement? Not necessarily. The measurement point, implement centre of gravity, machine stability and hydraulic configuration all matter."
    },
    "sections": [
      {
        "anchor": "kapasite-nedir",
        "title": {
          "tr": "Arka kaldırma kapasitesi tam olarak neyi ölçer?",
          "en": "What does rear lift capacity measure?"
        },
        "paragraphs": {
          "tr": [
            "Traktörün arkasındaki iki alt kol ve bir orta kol, pulluk gibi ekipmanları tutar. Hidrolik sistem bu kolları yukarı kaldırır. Katalogda yazan kaldırma kapasitesi, kolların belirli bir noktada ve koşulda kaldırabileceği yükle ilgilidir. Bu, römorkun çekilebileceği ağırlık değildir.",
            "Şöyle düşünün: Ağır bir çantayı elinize yakın taşımak, kolunuzu uzatarak taşımaktan daha kolaydır. Ekipman traktörden ne kadar geriye uzanırsa onu taşımak da o kadar zorlaşabilir. Traktörün ön tarafının hafiflemesi gibi denge sorunları da hesaba katılmalıdır."
          ],
          "en": [
            "Rear hitch lift capacity describes the mass a three-point linkage can raise under specified conditions. It is not the same as drawbar towing capacity.",
            "An implement whose centre of gravity sits farther behind the hitch may unload the front axle more than a compact implement of the same mass. Front ballast, axle limits and stability remain relevant."
          ]
        }
      },
      {
        "anchor": "610-mm",
        "title": {
          "tr": "Askı uçlarında ölçüm ile 610 mm geriden ölçüm neden farklı?",
          "en": "Why 610 mm behind the hitch matters"
        },
        "paragraphs": {
          "tr": [
            "Teknik tabloda “askı uçlarında” yazıyorsa yük, arka kolların bağlandığı yere yakın ölçülmüştür. “610 mm geride” yazıyorsa ölçüm, bu noktanın yaklaşık 61 santimetre arkasında yapılmıştır. Aynı ağırlık daha geride olduğunda traktöre daha fazla döndürme etkisi yapabilir.",
            "Örneğin bir traktör “3.000 kg askı uçlarında”, diğeri “2.700 kg 610 mm geride” diyorsa ilkini hemen daha güçlü ilan etmek doğru olmaz. Çünkü iki sayı aynı yerden ölçülmemiştir. Gerçek karşılaştırma için aynı ölçüm noktasına ve aynı koşullara ait değerleri arayın."
          ],
          "en": [
            "Brochures may give a figure 'at ball ends' or '610 mm behind the ball ends'. Moving the load farther away increases the lever effect, so the two ratings are not necessarily equivalent.",
            "If Tractor A claims 3,000 kg at the ends and Tractor B claims 2,700 kg at 610 mm, the larger number alone does not prove A can manage a given rear-mounted implement better. Match measurement points first."
          ]
        }
      },
      {
        "anchor": "debi-basinc",
        "title": {
          "tr": "Pompa debisi (L/dk) ile basınç (bar) aynı şey mi?",
          "en": "Flow in L/min versus pressure in bar"
        },
        "paragraphs": {
          "tr": [
            "Hidrolik sistemin içinde yağ dolaşır. Pompa yağı gönderir, kumanda valfi yağı yönlendirir, silindir ise bu basınçla itme veya çekme hareketi yapar. Debi “bir dakikada ne kadar yağ gidiyor?” sorusunun cevabıdır. Basınç ise o yağın silindirde oluşturabileceği kuvvetle ilgilidir.",
            "Bir kepçenin hızlı hareket etmesi için uygun yağ akışı gerekir; ağır yük kaldırmak içinse silindirin yapısı ve basınç gibi başka şartlar da önemlidir. Katalogdaki toplam pompa debisinin tamamı kepçeye gitmeyebilir; direksiyon ayrı yağ kullanıyor veya toplam değere dahil ediliyor olabilir."
          ],
          "en": [
            "Hydraulic flow is the volume of oil available per unit time and influences cylinder speed. Pressure contributes to the force a cylinder can generate. High pressure does not automatically mean fast loader motion, nor does high flow guarantee lifting strength.",
            "Also distinguish total pump flow from the flow available to implements. Steering circuits may account for part of the declared total."
          ]
        }
      },
      {
        "anchor": "askilar-kategoriler",
        "title": {
          "tr": "Üç nokta askı kategorisi ve hidrolik çıkışlar",
          "en": "Three-point hitch categories and remote valves"
        },
        "paragraphs": {
          "tr": [
            "Arkadan bağlanan ekipmanlar çoğunlukla iki alt kol ve bir orta kolla tutulur. Kategori I, II veya III yazıyorsa bu, bağlantı pimlerinin ve askının ölçü sınıfını gösterir. Sayının büyük olması tek başına traktörün her ağır ekipmanı kaldıracağı anlamına gelmez.",
            "Bir römorkun kasasını kaldırmak veya katlanan bir ekipmanı açmak için hidrolik hortumlar gerekebilir. Bu hortumlar traktörün arka hidrolik soketlerine takılır. Soket sayısını ve nasıl çalıştığını kontrol edin; yalnızca “hidrolik var” yazması her ekipmanın uyacağını göstermez."
          ],
          "en": [
            "Categories I, II and III refer to linkage pin sizes and geometry; they are not simply a ranking of load capacity. The tractor and implement connection categories must be compatible.",
            "Remote hydraulic valves supply external cylinders or motors. Confirm outlet pairs, single/double-acting control and usable flow against the implement manual."
          ]
        }
      },
      {
        "anchor": "guvenli-kontrol",
        "title": {
          "tr": "Ekipman satın almadan önce nasıl karar verilir?",
          "en": "A practical implement-matching method"
        },
        "paragraphs": {
          "tr": [
            "Ekipman seçerken yalnızca kilogram sayısına bakmayın. Ekipmanın gerçek ağırlığını, ne kadar arkaya uzandığını, bağlantı kategorisini ve ihtiyaç duyduğu hidrolik soketleri yazın. Traktörün ön ağırlık gereksinimi ve aks sınırları da bu hesabın parçasıdır.",
            "İki traktörü karşılaştırırken birinin kaldırma kapasitesi askı uçlarında, diğerininki 610 mm geride açıklanmışsa bu farkı görünür biçimde not edin. Ölçüm yeri belirtilmemişse eminmiş gibi sonuç çıkarmayın. Bakım veya bağlantı sırasında hidrolik basıncını güvenle boşaltın; kaçakları elle aramayın."
          ],
          "en": [
            "Record implement mass, how far its centre of gravity extends rearward, hitch category, remote outlets and front ballast needs. Check tractor axle limits and the actual implement manual.",
            "If two brochures omit the lift measurement point, the honest comparison is 'not directly comparable' rather than a confident winner. Before hydraulic maintenance or hose connections, follow the manufacturer's procedure to release stored pressure safely. Never feel for a pressurized hydraulic leak with bare hands: high-pressure fluid can penetrate skin and cause serious injury."
          ]
        }
      }
    ],
    "glossary": [
      "rear-lift",
      "hydraulic-flow",
      "hydraulic-pressure",
      "hydraulic-remotes",
      "hitch-category"
    ]
  },
  {
    "slug": "tractor-engine-power-and-torque",
    "comparisonNote": {
      "tr": "İki katalogda da 100 hp görürseniz sayıların yanındaki tanımları okuyun. Biri azami motor gücünü, diğeri nominal gücü bildiriyorsa aynı çalışma noktasını karşılaştırmıyorsunuz. Ekipman kuyruk milinden güç alıyorsa ayrıca PTO çıkışındaki ölçümü arayın.",
      "en": "When two brochures both say 100 hp, read the label beside each figure. Maximum engine power on one sheet and rated power on the other describe different operating points. For a PTO-driven implement, look for a separate measurement at the shaft."
    },
    "group": "engine",
    "heroPhoto": {
      "brand": "McCormick",
      "model": "X5.120 P3-Drive"
    },
    "title": {
      "tr": "Traktörde Beygir Gücü ve Tork: HP, PS, kW ve PTO Farkları",
      "en": "Tractor Horsepower and Torque: HP, PS, kW and PTO Compared"
    },
    "description": {
      "tr": "Traktör motor gücü, tork ve PTO değerlerini karşılaştırın. HP, PS ve kW farklarını öğrenin; devirden mil gücü veya tork hesaplayın.",
      "en": "Compare tractor engine horsepower, torque and PTO ratings. Understand hp, PS and kW, and calculate shaft power or torque from RPM."
    },
    "lead": {
      "tr": "Traktör bakarken en çok sorulan soru “Kaç beygir?” olur. Ama iki traktörün ikisinde de 100 beygir yazması, tarlada her işi aynı yapacakları anlamına gelmez. Çünkü güç, tork ve kuyruk miline aktarılan güç farklı şeylerdir. Ayrıca kataloglarda HP, PS ve kW gibi farklı birimler kullanılır. Gelin bu terimleri günlük örneklerle tanıyalım ve hangi sayıya ne zaman bakacağımızı anlayalım.",
      "en": "Two brochures both advertise '100 horsepower'—but that does not promise identical field performance. Engine speed, torque curve, test standard, driveline losses and tyre traction all influence the result. This guide explains what the figures actually mean."
    },
    "sections": [
      {
        "anchor": "hp-ps-kw",
        "title": {
          "tr": "HP, PS ve kW aynı birim mi?",
          "en": "Are HP, PS and kW the same units?"
        },
        "paragraphs": {
          "tr": [
            "HP, PS ve kW aynı şeyi, yani gücü anlatmak için kullanılan farklı ölçü birimleridir. Tıpkı metre ve santimetrenin uzunluğu farklı sayılarla göstermesi gibi düşünün. Yaklaşık olarak 1 kW, 1,341 HP veya 1,360 PS eder. Bu yüzden farklı birimle yazılmış rakamları doğrudan yarıştırmayın.",
            "Örneğin 75 kW yazan bir motor yaklaşık 100,6 HP veya 102 PS değerindedir. Burada motor değişmedi, yalnızca sayı başka bir birime çevrildi. Ancak güç birimini eşitlemek yetmez: İki değerin de nominal mi, azami mi olduğuna ve hangi standartla ölçüldüğüne bakmalısınız.",
            "Gerçek bir üretici örneği: Başak 2075 BK resmî broşüründe 53 kW / 72 hp motor gücü yazıyor. NIST birim katsayılarına göre 53 kW yaklaşık 72,1 metrik PS, ancak 71,1 mekanik hp eder. Bu nedenle üreticinin ‘hp’ etiketini hangi beygir tanımında kullandığını ayrıca teyit etmeden bu iki birimi aynıymış gibi yorumlamayın. Broşürdeki 53 kW ile 72 hp ifadelerini üretici beyanı olarak aynen koruyun; bunlardan bağımsız PTO gücü veya standart bilgisi türetmeyin."
          ],
          "en": [
            "Mechanical hp, metric PS and kilowatts measure power but have different unit sizes. Approximately 1 kW equals 1.341 mechanical hp or 1.360 PS. Compare values in a shared unit before drawing conclusions.",
            "For example, 75 kW is approximately 100.6 hp or 102.0 PS. Converting units does not make rated power and maximum power comparable unless their test basis also matches.",
            "A real manufacturer example: Başak's official 2075 BK brochure states engine power as 53 kW / 72 hp. Under NIST unit factors, 53 kW is approximately 72.1 metric PS but 71.1 mechanical hp. Do not silently treat the maker's ‘hp’ label as either horsepower definition without checking the unit convention. Preserve both original manufacturer figures as reported; they are not an independent PTO power result or proof of a particular test standard."
          ]
        }
      },
      {
        "anchor": "nominal-max-boost",
        "title": {
          "tr": "Nominal, azami ve ek güç (boost) farkı",
          "en": "Rated, maximum and boost power"
        },
        "paragraphs": {
          "tr": [
            "Nominal güç, motorun belirtilen devirdeki güç değeridir. Azami güç, motorun belli koşullarda ulaşabildiği en yüksek değerdir. Boost ise bazı modellerde yalnız belirli işlerde geçici olarak verilen ek güç olabilir. Bu üçünü aynı sayıymış gibi karşılaştırmak yanıltır.",
            "Bir modelin ilanında 120 beygir ve ayrıca 15 beygir boost gördünüz. Bu, bütün gün pulluk çekerken sürekli 135 beygir vereceği anlamına gelmez. Ek gücün hangi şartta açıldığını üretici belgesinden kontrol edin. Bir bilgiden emin değilseniz o farkı açıkça belirtin."
          ],
          "en": [
            "Rated power refers to an output at stated rated conditions. Maximum output may occur at another engine speed. Boost can add power only under particular transport or PTO conditions, depending on the tractor.",
            "If a product advertises '120 hp plus 15 hp boost', do not assume 135 hp is constantly available for every field task. Inspect the enabling conditions and standard used."
          ]
        }
      },
      {
        "anchor": "tork",
        "title": {
          "tr": "Tork (Nm) neden önemli, neden tek başına yetmez?",
          "en": "Why torque in Nm matters—but not alone"
        },
        "paragraphs": {
          "tr": [
            "Tork motorun döndürme kuvvetidir. Sıkışmış bir kavanoz kapağını açarken daha güçlü çevirmek zorunda kalırsınız; burada konuştuğumuz kuvvetin benzerini motor krank milinde üretir. Tork özellikle motor zorlandığında nasıl tepki vereceğini anlamaya yardım eder.",
            "Pulluk sert toprağa girince motorun devri düşebilir. Bazı motorlar o sırada torkunu artırıp işi sürdürmeye daha iyi uyum sağlayabilir. Fakat yüksek tork tek başına iyi çekiş demek değildir: Uygun vites, lastik, traktör ağırlığı ve patinaj da sonucu değiştirir."
          ],
          "en": [
            "Torque is turning moment at the crankshaft. A torque curve and torque rise can help explain how the engine behaves when load increases and rpm falls. Crankshaft torque is not the same thing as drawbar pull.",
            "A machine may have strong engine torque yet perform poorly with inappropriate gearing, unsuitable tyres or excessive wheel slip. Review torque against rpm and driveline choices."
          ]
        }
      },
      {
        "anchor": "motor-ve-pto",
        "title": {
          "tr": "Motor gücü mü PTO gücü mü daha önemli?",
          "en": "Engine power versus PTO power"
        },
        "paragraphs": {
          "tr": [
            "Motor gücü, motorun ürettiği gücü anlatır. Kuyruk mili gücü, bu gücün arkadaki dönen ekipmana ulaşan kısmıdır. Çeki işi yaparken lastiğin yere tutunması önem kazanır; biçme makinesi çalıştırırken kuyruk milindeki güç daha doğrudan bir bilgi olabilir.",
            "Örneğin iki traktörün motoru 100 beygir diye açıklanmış olsa da kuyruk mili güçleri farklı olabilir. Birinin 100 beygir motor gücünü diğerinin kuyruk mili ölçümüyle yan yana koymayın. Aynı yerden ve benzer koşullarda ölçülen değerleri karşılaştırın."
          ],
          "en": [
            "Ploughing, mowing, baling and loader work demand power in different ways. Drawbar work depends on traction and slip; rotary implements depend on PTO output; loaders add hydraulic flow, pressure and stability.",
            "Two tractors with the same engine rating may have different PTO test results. Never substitute a maker's engine declaration for an independent PTO measurement."
          ]
        }
      },
      {
        "anchor": "olcum-standartlari",
        "title": {
          "tr": "ISO 14396, UN/ECE R120 ve OECD Code 2: aynı güç ölçümü mü?",
          "en": "ISO 14396, UN/ECE R120 and OECD Code 2: which power is measured?"
        },
        "paragraphs": {
          "tr": [
            "Bir üretici katalogunda ISO 14396 veya UN/ECE R120 ifadesini görmeniz, gücün belirli bir motor test yöntemine göre beyan edildiğini anlatır. Bu bilgi motor gücüne ilişkindir; aynı sayıyı doğrudan traktörün kuyruk milinde (PTO) veya çekiş noktasında kullanabileceğiniz güç olarak yorumlamayın. Standart adını, motor devrini ve nominal/azami güç ayrımını birlikte okuyun.",
            "OECD Code 2 farklı bir soruya yanıt verir: Traktörün performansı, belirlenmiş deney koşullarında kuyruk mili, çeki demiri ve mevcut hidrolik çıkışlar gibi noktalardan ölçülür. Bu nedenle OECD raporundaki PTO veya çeki gücü ile üreticinin motor gücü beyanı aynı ölçüm değildir. Örneğin 100 HP motor gücü ile 100 HP PTO gücünü tek bir sütunda eşdeğer kabul etmeyin.",
            "Bir karşılaştırma yapmadan önce beş bilgiyi kontrol edin: tam model ve varyant, ülke/pazar ve emisyon sürümü, ölçüm standardı, güç değeri için belirtilen motor devri, ek gücün (boost) hangi koşullarda etkin olduğu. Bağımsız bir OECD raporu varsa test edilen traktörün lastik, donanım ve motor sürümüyle aradığınız modelin gerçekten eşleştiğini doğrulayın. Eksik bilgi varsa sonuç 'doğrudan karşılaştırılamaz' olmalıdır."
          ],
          "en": [
            "A brochure mentioning ISO 14396 or UN/ECE R120 is describing an engine-output declaration measured under a defined engine test procedure. It is not automatically the power available at the tractor's PTO shaft or drawbar. Read the standard, engine speed and rated-versus-maximum qualification together before comparing advertised horsepower.",
            "OECD Code 2 answers a different question by testing the tractor's performance under specified procedures. Its published summaries may include PTO power and fuel consumption, drawbar performance and available hydraulic output. A maker's engine claim is therefore not interchangeable with an OECD PTO or drawbar test value. Even identical numerical horsepower figures are not equivalent unless the measured output and procedure are the same.",
            "Before deciding, check five details: exact model/variant, country and emissions version, measurement standard, rpm associated with the power figure, and when any temporary boost becomes available. If an independent test is cited, verify the tested tractor's equipment and engine version against the one you are buying. An unavailable test basis should be labelled 'not directly comparable', not silently assumed."
          ]
        }
      },
      {
        "anchor": "katalog-karsilastirma",
        "title": {
          "tr": "İki traktörün gücünü güvenilir biçimde karşılaştırın",
          "en": "How to compare two horsepower figures fairly"
        },
        "paragraphs": {
          "tr": [
            "İlk önce iki traktörün gerçekten aynı model yılına, ülke sürümüne ve motor düzenine ait olup olmadığını öğrenin. Sonra güç sayısının yanına şu bilgileri yazın: HP mi PS mi kW mı? Nominal mi azami mi? Kaç devirde verilmiş? Hangi ölçüm standardı kullanılmış?",
            "Bir bilgi eksikse bunu “bilinmiyor” diye not etmek doğru bir davranıştır. Daha büyük beygir sayısı her zaman daha uygun traktör anlamına gelmez. Yapacağınız iş için gereken kuyruk mili devri, hidrolik kapasite, vites aralığı, lastikler ve servis desteğini de birlikte düşünün."
          ],
          "en": [
            "Confirm model year, market edition and engine code. Identify the unit, power category, test standard and rpm for each claim. If these differ or are unknown, mark the comparison as qualified rather than pretending the figures are identical.",
            "The better tractor depends on tasks and implements, not only the larger horsepower number. PTO modes, lift capacity, weight, tyres and service support should also inform the decision."
          ]
        }
      }
    ],
    "glossary": [
      "engine-power",
      "rated-power",
      "maximum-power",
      "torque",
      "pto-power"
    ]
  }
] as const;
export type TechnicalDeepDiveSlug = typeof TECHNICAL_DEEP_DIVES[number]['slug'];
export function getTechnicalDeepDive(slug:string) { return TECHNICAL_DEEP_DIVES.find(x=>x.slug===slug) ?? null; }
