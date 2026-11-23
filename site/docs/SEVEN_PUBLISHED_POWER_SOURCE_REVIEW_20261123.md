# TractorVS — 7 yayımlanmış traktörün güç kaynağı incelemesi

**23 Kasım 2026 | Bulgular: Salt-okunur | Yayın: Değişmedi | Kod: Yalnız koruyucu gösterim kontrolü**

Bu çalışma, [100 modellik denetimin](PUBLISHED_100_MODEL_EVIDENCE_PILOT_20261123.md) aynı UUID örneklemindeki yedi modelden devam eder. [Tekrar çalıştırılabilir SQL](../../supabase/verification/20261123_seven_published_power_scope_review.sql) sadece yayımlanmış modelleri okur. Örneklem tüm modeller için sonuç değildir; kayıt veya yayın durumları değiştiğinde üyeliği de değişebilir.

## Üretici gücü: dört Swaraj modelinde doğrulanan şey **güç kategorisi aralığı**

| Model | Resmî üretici ürün sayfası | Resmî sınıf | Sonuç |
|---|---|---|---|
| Swaraj 735 XT | https://www.swarajtractors.com/swaraj-735-xt-tractor | 29.82–33.09 kW / 41–45 HP | Kesin tek HP değeri çıkarılamaz |
| Swaraj 742 XT | https://www.swarajtractors.com/swaraj-742-xt-tractor | 29.82–33.09 kW / 41–45 HP | Kesin tek HP değeri çıkarılamaz |
| Swaraj 744 XT | https://www.swarajtractors.com/swaraj-744-xt | 33.56–37.28 kW / 46–50 HP | Kesin tek HP değeri çıkarılamaz |
| Swaraj 855 FE | https://www.swarajtractors.com/swaraj-855-fe-tractor | 33.56–37.28 kW / 46–50 HP | Kesin tek HP değeri çıkarılamaz |

**Kanıt sınırı:** Üretici sayfaları bu aralıkları "Power Category" veya "Engine HP" başlığı altında gösterebilir. Bu, **not a single measured engine rating**: tek, varyantı/standardı/rpm'si belirtilmiş bir nominal motor gücü olduğunun kanıtı değil. Aralığın üst ucu, alt ucu veya orta noktası `tractors.horsepower` alanına sessizce yazılmamalı; PTO gücü sanılmamalı. Özellikle Swaraj 735 XT ve ayrı 735 XT 4WD sayfaları arasındaki ekipman/aktarma bilgileri model-varyant gözden geçirmesi olmadan birleştirilmemeli.

## Belarus: üç modelde kaynak eşleştirme hâlâ açık

| Model | Yayımdaki varyant/pazar | Mevcut kaynak | İnceleme durumu |
|---|---|---|---|
| BELARUS 922.4 | MTW 922 / Stage IIIa, global | https://kocyigit.com.tr/wp-content/uploads/2024/06/Katalog_Belarus_Traktor.pdf | Tam motor varyantı ve ölçüm sayfası henüz bağımsızca doğrulanmadı |
| BELARUS 923.3 | MTW 923 / Stage II, global | Aynı Türkiye distribütör kataloğu | Resmî kullanım kılavuzu modeli içeriyor, ancak tam motor gücü tablo eşleştirmesi tamamlanmadı |
| BELARUS 952.4 | MTW 952 / D-245.5S3A, global | Aynı Türkiye distribütör kataloğu | Resmî kılavuz dizini MMZ / DEUTZ / MERCER seçeneklerini ayrı listeliyor; eşleşmeyen motorun rakamı kullanılmaz |

Üreticinin belge dizini: https://www.mtz.ru/rukovodst (BELARUS 923.3/923.4 ve 920.4/952.4 için farklı motor kılavuzlarını listeler). Belge bağlantılarının bazıları araştırma sırasında erişim hatası verdi. Bu yüzden 922.4, 923.3 ve 952.4 için kesin güç **doğrulandı** iddiası yoktur. Resmî kılavuzdaki tam model/sürüm ve motor tablo satırı doğrulanana kadar bekletilmeli; komşu 923.4 veya 952.3 modelinden değer taşınmamalı.

## Uygulanan dar gösterim güvenliği

Mevcut `site/src/lib/catalog.ts` fonksiyonu `sourceBackedHorsepower`, katalog ve tarım danışmanında yalnızca kaynağı/kanıtı belirtilmiş tek HP rakamını gösterme yaklaşımını kullanıyordu. Yeni savunma, daha önce yanlışlıkla `engine_power=45` olarak girilmiş olabilen **Power Category 41–45 HP** kanıtını, sayı alanına **tam güç olarak yükseltmeyi engeller**. Yalnızca açık kategori/range kanıtları için konservatif durur; bağımsız tablo/variant doğrulaması gerekliliğini kaldırmaz.

İlgili offline regresyon testleri resmî üreticinin dört aralığını, doğru tekil gücü, çelişen sayıları, yanlış PTO türünü, kaynak yokluğunu ve kaynaktaki kötü niyetli talimat metnini ayrı senaryolar olarak denetler. Bu testler kendi başına bütün AI sisteminin güvenlik onayı değildir.

## Yapılmayan ve hâlâ gereken işler

- **not deployed manually / canlı dağıtım henüz doğrulanmadı:** Supabase şeması, canlı teknik değerler, RLS, forum, SEO URL'leri, kaynak/atıf ve model durumları değiştirilmedi. Kod değişikliğinin GitHub'a birleştirilmesi, Cloudflare canlı dağıtımı ve Google indeksleme ayrı doğrulanmalı.
- Kaynağı bulunan dört Swaraj güç **kategorisini** doğru türde bir özellik olarak kamuya sunma işi ayrı ve kaynaklı kayıt/şablon doğrulaması gerektirir; bu PR bunu yapmaz.
- Belarus için kılavuz PDF sayfası ve tam motor varyantı/doğrulama tarihi bulunmadan `horsepower` doldurulmaz.
- Fotoğrafların lisansı, kullanıcı deneyimi ve saha güvenilirliği bu incelemenin kapsamı dışında kalmıştır.
- Değişiklikten sonra yeni bir gerçek kullanıcı testi veya canlı üretim ölçümü yapıldığı iddia edilmemelidir.

## Geri alma ve kalite kapısı

Kod değişikliği beklenmedik biçimde gerçek, tekil üretici gücünü gizlerse yalnız bu regex koruması ilgili commit üzerinden geri alınabilir. Önce `site/tests/engine-power-category-evidence-20261123.test.mjs`, mevcut `headline-power-provenance`, 10 dil, üretim derlemesi ve Golden Rule CI'leri doğrulanmalı. Hiçbir kullanıcı veya gizli taslak bilgisi repoya aktarılmadı.


## Ek kaynak incelemesi: BELARUS 900 serisi katalog kanıtı (23 Kasım 2026)

**Yeni ama sınırlı kanıt:** 2020 tarihli, Minsk Tractor Works markalı teknik kataloğun Rusça sürümü ve distribütörün barındırdığı İngilizce karşılığı, daha önce yalnızca kaynak bağlantısı bulunan üç BELARUS kaydındaki **aynı motor/varyant sütunlarını** içeriyor. İngilizce PDF'de 923.3 tablo sayfası görsel olarak da incelendi; başka iki sayfanın ekran görüntüsüne erişim zaman aşımı / bot kontrolü nedeniyle her seferinde mümkün olmadı. Bu yüzden ayrıntılı tablo eşleşmeleri için PDF'nin yapılandırılmış metni ve Rusça karşılık ayrıca kontrol edildi.

| Mevcut yayımlanmış model ve varyantı | Katalog sütununda yazılı motor | Katalog güç satırı | Kanıtın kapsamı |
| --- | --- | --- | --- |
| BELARUS 922.4 / MTW 922, Stage IIIa | **D-245.5S3A** | **70 kW (95 h.p.)** | Rusça katalog 900 serisi 922.3–922.5 tablosunda aynı güç hücresi üç sürüme yayılır; ilgili 922.4 model/motor sütunu açık |
| BELARUS 923.3 / MTW 923, Stage II | **D-245.5S2** | **70 kW (95 h.p.)** | İngilizce katalog 923.3–923.5 ortak güç satırı, 923.3 motor ve Stage II dipnotu; PDF görsel tablosu kontrol edildi |
| BELARUS 952.4 / MTW 952, D-245.5S3A | **D-245.5S3A** | **70 kW (95 h.p.)** | Rusça katalogdaki 952.3 ve **952.4** için birleşik 70 kW/95 h.p. sütunları, diğer motorlu 952.5/952.6'dan ayrı |

**Kaynaklar ve sayfa yönlendirmeleri:**
- MTW markalı Rusça 2020 teknik katalog: https://agroline.kz/img/pdf/6/4/1646905690034801811/katalog-traktornoy-tekhniki-2020_v1.5.1.pdf — 922 (basılı s. 24 civarı), 923 (s. 25), 952 (s. 29); yayın yılı dosya adından, kaynak erişimi 23 Kasım 2026. Katalog bütün güncel pazarlarda satılan donanımları kapsama garantisi değildir.
- İngilizce teknik katalog, distribütörde mevcut kaydın orijinal URL'si: https://kocyigit.com.tr/wp-content/uploads/2024/06/Katalog_Belarus_Traktor.pdf — 922 özellikleri basılı s. 23; 923 özellikleri s. 25; 952 özellikleri s. 27. PDF üzerinde basılan sayfa numarasıyla PDF görüntüleyicisinin sıfır tabanlı indeksini karıştırma.
- Minsk Tractor Works bağlantılı kılavuz dizini: https://www.mtz.ru/rukovodst — **952.4 için MMZ, DEUTZ ve MERCER motor kılavuzları ayrı** listeleniyor. https://mtzavr.ru/rukovodstva-po-ekspluatatsii/ aynı modelin ayrıca Cummins varyantına da işaret eder. Bu kayıtların teknik değerlerini birbirine aktarmak yasaktır.

**İspat düzeyi:** Bu, üretici markalı **katalog beyanı**dır. 70 kW değerini resmî bağımsız test / OECD PTO gücü / SAE net motor gücü / yetkilendirilmiş bir test standardı gibi etiketlemiyoruz. Katalogdaki "95 h.p." birim ifadesinin kesinlikle tüm pazarlarda kullanılan SAE mechanical hp ile özdeş olduğunu varsaymıyoruz; kaynak sunumunu koruyoruz. Özellikle 952.4'ün başka motor seçenekleri olduğu için `engine_rated_power` veya üst düzey `tractors.horsepower` alanına doğrudan ve otomatik kopyalama yapılmamalı.

**Kalite kararları ve sonraki adım:** Üç modelin hedef motor varyantı için **yeni kaynak kanıtı bulundu**; ancak ölçüm standardının netliği, tam model/yıl/pazar kapsamı ve bağımsız üretici kullanım kılavuzu sayfası henüz ikinci aşamada doğrulanmalı. Yalnız ilgili **kaynaklı üretici beyanı** türünde değerlendirilebilecek taslak kayıt ayrı denetimden geçmelidir. Bu ek araştırma sırasında **Supabase INSERT/UPDATE, RLS değişikliği, AI onayı, yayın, fotoğraf, SEO adresi veya Cloudflare dağıtımı yapılmadı**. Eski 7-model denetimi ve diğer çalışmalar aynen korunur.


## İkinci aşama: üretici kullanım kılavuzu ve motor-varyant çapraz doğrulaması (23 Kasım 2026)

Bu bölüm bir önceki 2020 üretici markalı katalog araştırmasına **yeni kaynak katmanı** ekler. Önceki tablodaki "kılavuz eşleştirmesi bekliyor" açıklaması o araştırma aşamasının tarihsel durumudur; aşağıdaki kanıt, erişilebilen **tam model/motor** dokümanlarıyla sonraki kontrolü temsil eder. Her rakam üreticinin katalog/kılavuz **beyanıdır**; PTO'da bağımsız OECD test sonucu değildir.

| Yayımlanmış kimlik | Kayıtlı motor | Yeni ikinci kanıt | Kaynaktaki sonuç | Sınır |
|---|---|---|---|---|
| BELARUS **922.4**, MTW 922 / Stage IIIa | **D-245.5S3A** | MTZ markalı **BELARUS 922** seri katalog tablosu, basılı s. **23**, 922.4 sütunu; ayrıca model-özgül MTZAVR ürün sayfası | **70 kW (95 hp)** motor gücü beyanı, nominal motor devri **1.800 dev/dak** | 922.4 parça/konstrüksiyon kataloğu **D-245.5S3AM = 70 kW** ve **Deutz TCD2012 L04 2V C3UT72 = 72 kW** alternatiflerini de listeler; başka motorun gücü bu satıra taşınamaz |
| BELARUS **923.3**, MTW 923 / Stage II | **D-245.5S2** | **2015 BELARUS 923.3/923.4 işletme kılavuzu**, tablo 1.1.1, basılı s. **12**, *923.3 sütunu*; ayrıntılı distribütör ürün sayfasında aynı motor teyidi | **70 kW nominal**, **66,7 ± 2,0 kW işletme gücü**, **1.800 dev/dak** | 923.4'ün **D-245.5S3AM** veya **D-245.5S3A** motorlarını 923.3'e atama |
| BELARUS **952.4**, MTW 952 / D-245.5S3A | **D-245.5S3A** | **BELARUS 920.4/952.4 işletme kılavuzu**, bölüm 1.2.2, tablo 1, basılı s. **6**, *952.4 sütunu* | **70,0 ± 2,0 kW nominal**, **66,7 ± 2,0 kW işletme gücü**, **1.800 dev/dak** | **920.4 D-245.43S3A**, 952.4'ün DEUTZ/MERCER veya başka motor seçeneklerinin gücü olarak yanlış yorumlanamaz |

Kaynaklar ve **belge düzeyi**:
1. 922.4 MTZ üretici markalı katalog (s. 23, 922.4 sütunu): https://www.istokrtps.ru/catalog_images/traktory/MTZ922/MTZ_922.pdf
2. 922.3 / 922.4 parça ve varyant kataloğu (motor alternatiflerinin özeti): https://agropartner-mtz.ru/files/incoming/files/catalogs/6.pdf
3. 922.4 ilgili MMZ motorlu satır için distribütör ürünü: https://mtzavr.ru/product/traktor-belarus-mtz-922-4/
4. 923.3 işletme kılavuzu (2015, tablo 1.1.1, s. 12): https://mtzavr.ru/wp-content/uploads/2023/09/re-belarus-923.3_923.4-2015.pdf
5. 923.3 model ve D-245.5S2 motorunu doğrulayan distribütör sayfası: https://www.belmtz.ru/catalog/tractors/900/traktor_belarus_923_3_(923_3_81_21_0000010_003).html
6. 952.4 işletme kılavuzu (s. 6, 952.4 sütunu): https://beltrakt.ru/upload/iblock/a08/akjfreahpb4ymrsd5d8tpg7mttw336a8.pdf
7. MTZ ilgili motor seçeneklerinin ayrı kılavuz dizini: https://www.mtz.ru/rukovodst

**Doğrulama yöntemi ve sınırı:** Üretici markalı PDF'nin yapılandırılmış tablo metinleri, motor satırı ve ilgili kılavuzun model sütunları karşılaştırıldı; 952.4 için basılı s. 6 görseli ayrıca incelendi. Web kaynaklarındaki bazı büyük PDF görsel çağrıları *cache miss* döndürdü; görseli görüntülenemeyen belge için “tam görsel doğrulandı” denmiyor. 922.4 parça kataloğundaki başka motor seçenekleri, bugün yayımlanan \`global\` pazar satırının bütün üretim yıllarında tek konfigürasyon olduğu sonucunu engeller.

**Salt-okunur Supabase çapraz kontrolü:** Üç yayımlanmış satırın mevcut \`engine_model\` değerleri sırasıyla **D-245.5S3A / D-245.5S2 / D-245.5S3A** ve kaynakla eşleşiyor. Üç satırda da \`tractors.horsepower IS NULL\`, açık motor gücü için \`tractor_specs\` satırı henüz **yok**. Bu bir *veri tamamlanma fırsatıdır*; daha önce girilen kayıtların yanlış olduğu iddiası değildir.

**Yayın kararı:** 922.4'te alternatif motor ve \`global\` kapsam riskini çözmeden, 923.3 ve 952.4'te birim/ölçüm sınıfı ile belgeye ait yıl/sürümü kaydetmeden \`tractors.horsepower\` veya gösterilen nominal HP değerini otomatik doldurma. Üreticinin **70 kW nominal** ve **66,7 kW işletme** beyanları ayrı özellik olarak kaynak, kılavuz sayfası, motor, durum ve yıl notuyla değerlendirilebilir; **95 hp** ifadesi üreticinin parantez içi beyanı olup kullanıcıya sunulacak hesaplama standardı ayrıca tanımlanmalıdır. Bu çalışma **veri tabanına hiçbir kayıt eklemedi**, sitede yayın veya Cloudflare dağıtımı yapmadı.

**Canlı dağıtım doğrulama sınırı:** PR #533 ana dala birleştirildi ve GitHub tarafındaki beş PR iş akışı başarılıydı. **Cloudflare canlı sürümü aynı commit'i barındırıyor** iddiası için ayrıca Cloudflare deployment kimliği / dağıtım SHA veya gerçek HTTP ve sayfa davranışı kanıtı gerekiyor. Bu araştırma sırasında \`tractorvs.com\` otomatik web okuma denemeleri sonuç vermedi ve bağlı Firecrawl hesabı kota yetersizliği bildirdi; bu yüzden gerçek canlı sürümün dağıtıldığını **doğrulamadık**. GitHub derlemesi canlı yayın kanıtı değildir.

