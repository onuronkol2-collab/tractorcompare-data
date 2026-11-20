/** TractorVS editorial learning articles. Original educational examples; no field-test claims. */
export const TECHNICAL_DEEP_DIVES = [
  {
    "slug": "pto-and-power-take-off",
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
      "tr": "Traktörünüz tarlada ilerlerken arkasındaki biçme makinesi nasıl döner? İşte bu gücü aktaran parça kuyruk milidir. Ancak bir traktörde 'PTO var' yazması, her ekipmanın güvenle çalışacağı anlamına gelmez. Devir, mil bağlantısı ve gerçek çıkış gücü ayrı ayrı incelenmelidir.",
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
            "Motorun ürettiği dönme hareketi, traktörün aktarma düzeni üzerinden arka veya ön çıkış miline iletilir. Koruyuculu bir kardan miliyle bağlanan ekipman bu hareketi kullanarak kendi rotorunu, bıçaklarını veya pompasını döndürebilir. Buradaki iş, ekipmanı çekmekten farklıdır: çekiş için lastiğe, döner makine için PTO'ya güç gerekir.",
            "Örneğin bir rotovatör hem traktörle birlikte ilerler hem de toprağı işlemek için döner. Hareketi sağlayan iki işlevin güç ihtiyacı aynı değerde gösterilmez. Traktör seçerken üreticinin motor gücü ile kuyruk mili gücünü ayrı satırlarda arayın."
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
            "540 rpm, birçok tarım ekipmanının kullanabildiği nominal PTO dönüş hızıdır. 540E ise uygun traktörde aynı PTO devrinin daha düşük motor devrinde elde edilmesini amaçlayan ekonomik kademedir; ekipman hafif yükteyse gürültü ve tüketimi azaltmaya yardımcı olabilir. Bu özellik her traktörde bulunmaz ve her yükte avantaj sağlamaz.",
            "1000 rpm, 540 rpm'nin 'daha güçlü seçeneği' olarak rastgele seçilmez. Ekipman etiketinde izin verilen dönüş hızı hangi değerse onu kullanın. 540 rpm için tasarlanmış bir ekipmanı 1000 rpm'de çalıştırmak ciddi hasara veya yaralanmaya yol açabilir."
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
            "Motor gücü krank milinde, PTO gücü ise kuyruk mili çıkışında ifade edilir. Aktarma sistemindeki kayıplar nedeniyle eşit olmak zorunda değildir. Ekipmanın ihtiyaç duyduğu asgari güç açıklanmışsa onu aynı birimdeki PTO gücüyle karşılaştırın; ölçümün tahmini mi test sonucu mu olduğuna da bakın.",
            "PTO milinde çap ve kanal (yiv) sayısı önemlidir. Yaygın 1⅜ inç altı kanallı ve farklı yiv sayılarına sahip miller aynı bağlantı değildir. Mil uzunluğunun, kardan korumasının ve şaft açısının uygunluğunu ekipmanın üretici kılavuzundan kontrol edin."
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
            "Bağımsız PTO, traktörün yürüyüş hareketinden ayrı devreye alınabilen sistemleri anlatır. Çift kademeli debriyaj ise pedala ilk basıldığında yürüyüşün, ikinci kademede kuyruk milinin ayrıldığı bazı düzenlerde görülür. Bu iki tanım her modelde aynı mekanizma değildir.",
            "Özellikle balya makinesiyle dur-kalk yapılacaksa traktörün PTO'sunun hangi koşulda çalışmaya devam ettiğine bakın. Katalogda yalnızca 'independent' yazıyorsa kumanda tipi, kavrama ve emniyet koşullarını ayrıca okuyun."
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
            "Önce kullanacağınız ekipmanın izin verilen PTO devirlerini ve güç gereksinimini yazın. Sonra traktörün gerçek kuyruk mili güç değerini, 540/540E/1000 seçeneklerini, mil kanal sayısını ve ekipmana bağlanma ölçülerini karşılaştırın. Bir değer eksikse eminmiş gibi kabul etmeyin.",
            "Son olarak ekipmanın ağırlığını, üç nokta askı kategorisini ve gerekiyorsa hidrolik bağlantılarını da kontrol edin. Kuyruk mili uyumu, toplam ekipman uyumunun yalnızca bir parçasıdır. Döner şaftta koruma kapağı, kardan muhafazası ve motor kapalıyken bağlantı kuralı hayati önem taşır."
          ],
          "en": [
            "Write down the implement's permitted PTO speeds and power requirement. Then compare verified tractor PTO power, selectable speed modes, spline geometry and coupling dimensions. An unlisted feature is unknown—not automatically present.",
            "Finally consider hitch category, implement mass and any required hydraulic couplers. PTO compatibility is only part of the overall machine match. Never operate an unguarded rotating shaft."
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
      "tr": "Bir katalogda '3.000 kg hidrolik kaldırma' yazıyor. Bu değer, traktörün her koşulda 3 tonluk ekipmanı güvenle taşıyabileceği anlamına gelir mi? Hayır. Ölçüm konumu, ekipmanın ağırlık merkezi, traktörün dengesi ve hidrolik donanımı sonucu değiştirir.",
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
            "Üç nokta askı sisteminin belirli bir konum ve standart altında kaldırabildiği yükü ifade eder. Bu sınır, römorkun çekme kapasitesiyle aynı şey değildir. Ekipmanın yalnızca kütlesi değil, bağlantı pimlerinden ne kadar uzağa uzandığı da önemlidir.",
            "Aynı kütlede ama ağırlık merkezi daha geride olan bir ekipman, traktörün ön dingilini farklı derecede hafifletebilir. Kaldırma kapasitesini ön aks yük sınırı, uygun balast, fren ve yol taşımacılığı kurallarıyla birlikte değerlendirin."
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
            "Üretici teknik tablolarında 'at ball ends' (askı kolu uçlarında) ve '610 mm behind' (uçlardan 610 mm geride) ifadelerini görebilirsiniz. Yük askıdan uzaklaştıkça aynı kütlenin oluşturduğu moment artar; bu yüzden iki konum için verilen sayıların aynı olması beklenmez.",
            "Örneğin iki traktörden birinin askı ucunda 3.000 kg, diğerinin 610 mm geride 2.700 kg kaldırdığını görürseniz sırf 3.000 daha büyük diye ilkini güçlü ilan etmeyin. Aynı ölçüm noktasındaki ve aynı şartlardaki değerleri karşılaştırın."
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
            "Debi, birim zamanda taşınan yağ hacmidir ve hidrolik silindirin ne kadar hızlı hareket edebileceğiyle ilişkilidir. Basınç ise silindirin oluşturabileceği kuvveti etkiler. Çok yüksek bar değeri tek başına hızlı bir ön yükleyici demek değildir; çok yüksek debi de tek başına ağır yük kaldırma garantisi vermez.",
            "Üstelik katalogdaki 'toplam debi' ile dış ekipman kullanımına ayrılmış 'implement flow' aynı olmayabilir. Direksiyon pompasının akışı toplam pompa değerine dahil olabilir. Bu ayrım özellikle ön yükleyici, kepçe ve hidrolik motor kullanan makinelerde önemlidir."
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
            "Kategori I, II ve III gibi ifadeler bağlantı pimi ve geometri ölçü sınıflarını anlatır; doğrudan kaldırma kapasitesi sıralaması değildir. Traktörle ekipmanın askı kategorileri uyumlu olmalıdır; bazı bağlantılar ancak üreticinin izin verdiği uygun parçalarla kullanılabilir.",
            "Harici hidrolik çıkışlar, ekipmanın silindirini, katlanan bölümünü veya hidrolik motorunu çalıştırmak için yağ sağlar. Gerekli çıkış çiftinin sayısını, tek/çift etkili çalışma türünü ve debi gereksinimini ayrıca yazın."
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
            "Bir ekipman için yalnız 'kaç kilo?' sorusuyla ilerlemeyin: toplam kütle, ağırlık merkezinin geriye uzaklığı, bağlantı kategorisi, hidrolik çıkış sayısı ve ön balast gereksinimi birlikte incelenir. Traktör kılavuzundaki izin verilen aks yükleri de bu kararın parçasıdır.",
            "İki farklı kataloğun verdiği kaldırma değerlerinde ölçüm konumu yazmıyorsa farkı kesin bir performans sıralamasına çevirmeyin. Teknik tabloya 'ölçüm noktası açıklanmamış' notu koymak, yanlış kesinlikten daha değerlidir."
          ],
          "en": [
            "Record implement mass, how far its centre of gravity extends rearward, hitch category, remote outlets and front ballast needs. Check tractor axle limits and the actual implement manual.",
            "If two brochures omit the lift measurement point, the honest comparison is 'not directly comparable' rather than a confident winner."
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
    "group": "engine",
    "heroPhoto": {
      "brand": "McCormick",
      "model": "X5.120"
    },
    "title": {
      "tr": "Traktörde Beygir Gücü ve Tork: HP, PS, kW ve PTO Farkları",
      "en": "Tractor Horsepower and Torque: HP, PS, kW and PTO Compared"
    },
    "description": {
      "tr": "Traktörde beygir gücü neyi gösterir? HP, PS, kW, tork, nominal güç, boost ve PTO farklarını gerçek kullanım örnekleriyle öğrenin.",
      "en": "A practical guide to tractor horsepower, PS and kW, rated versus maximum output, torque and how to compare engine and PTO ratings."
    },
    "lead": {
      "tr": "İki traktörün broşüründe '100 beygir' yazıyor diye tarlada aynı işi yapmalarını beklemek doğru değildir. Devir, tork eğrisi, güç standardı, şanzıman kayıpları ve lastiğin yere tutunması sonucu değiştirir. Bu rehber rakamların ne anlattığını ve ne anlatmadığını açıklıyor.",
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
            "HP, İngiliz mekanik beygir gücünü; PS (metrik beygir gücü) farklı tanımlanmış bir gücü; kW ise uluslararası sistemdeki güç birimini belirtir. Yaklaşık olarak 1 kW = 1,341 HP = 1,360 PS. Bu nedenle farklı birimle yazılmış iki rakamı doğrudan yan yana koymak hatalı olabilir.",
            "Örneğin katalogdaki 75 kW yaklaşık 100,6 HP veya 102,0 PS eder. Bu dönüşüm yalnız birimi değiştirir; azami güç ile nominal güç arasındaki farkı ortadan kaldırmaz. Hangi test standardının kullanıldığı yine incelenmelidir."
          ],
          "en": [
            "Mechanical hp, metric PS and kilowatts measure power but have different unit sizes. Approximately 1 kW equals 1.341 mechanical hp or 1.360 PS. Compare values in a shared unit before drawing conclusions.",
            "For example, 75 kW is approximately 100.6 hp or 102.0 PS. Converting units does not make rated power and maximum power comparable unless their test basis also matches."
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
            "Nominal güç, üreticinin belirttiği anma devir koşulundaki çıkıştır. Azami güç motorun başka bir devirde ürettiği tepe değeri olabilir. Boost ise bazı traktörlerde yalnız belirli PTO veya nakliye koşullarında sunulan ek güçtür. Bu üçü aynı değer değildir.",
            "Bir model '120 HP + 15 HP boost' olarak tanıtılıyorsa her ağır tarla işinde 135 HP kullanılacağını varsaymayın. Boost'un etkinleşme koşulunu, motor devrini ve ECE R120/ISO 14396 gibi test açıklamasını kaynaktan bulun."
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
            "Tork, krank milinin döndürme momentidir. Yük artıp devir düşünce motorun nasıl tepki verdiğini anlamak için tork eğrisi ve tork artış oranı yararlı olabilir. Ancak krank mili torku doğrudan lastiğin yere uyguladığı çekiş kuvveti değildir.",
            "Bir traktör yüksek tork verebilir ama çok hızlı seçilmiş bir vites, yanlış lastik veya fazla patinaj nedeniyle tarlada verimsiz kalabilir. Motorun gücünü, torkun hangi rpm'de geldiğini ve uygun vites kademelerini birlikte ele alın."
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
            "Pulluk çekme, biçme, balyalama ve yükleyici işleri güçten farklı biçimde yararlanır. Çeki işi için tekerleklerde kullanılabilen çekiş gücü ve patinaj önemlidir; döner makinede PTO çıkış gücü öne çıkar; hidrolik yükleyicide basınç, debi ve denge de hesaba katılır.",
            "Aynı motor gücündeki iki traktörün PTO testlerinde farklı sonuçlar vermesi mümkündür. Testlerin aynı koşul ve standartta yapılması gerekir. Üreticinin motor HP değerini bağımsız bir PTO ölçümünün yerine koymayın."
          ],
          "en": [
            "Ploughing, mowing, baling and loader work demand power in different ways. Drawbar work depends on traction and slip; rotary implements depend on PTO output; loaders add hydraulic flow, pressure and stability.",
            "Two tractors with the same engine rating may have different PTO test results. Never substitute a maker's engine declaration for an independent PTO measurement."
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
            "Önce modelin yılını, ülke/pazar sürümünü ve motor kodunu doğrulayın. Sonra her sayı için HP mi PS mi kW mı olduğuna, nominal/azami/boost türüne, test standardına ve belirtilen motor devrine bakın. Bu koşullar eşleşmiyorsa tablonuza bir uyarı ekleyin.",
            "'Daha büyük sayı her işte daha iyi traktör' demek yerine; ekipman ihtiyacını, PTO devrini, kaldırma kapasitesini, traktör ağırlığını, lastikleri ve servis koşullarını da değerlendirin. Doğru seçim tek rakamla değil, işin gereksinimiyle yapılır."
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
