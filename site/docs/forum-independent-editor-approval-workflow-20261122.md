# TractorVS: Bağımsız çok dilli editör onayı — özel dokümanlarla sıfır ücretli API süreci

Son kontrol: 22 Kasım 2026. Konu kimliği: `713ab252-a925-4ab7-b2c8-a30ce5b86706`. Kaynak hash: `0102e8edcd864b285733fb30cad4d8f1`.

## Durum ve kaynak

Yayımlanmış Türkçe `2026 Traktör Bayi Memnuniyeti Sıralaması: Markalar ve Puanlar` konusu için 9 tam çeviri (`en,de,fr,es,pt-br,ru,zh,ja,hi`) gizli Supabase `needs_review` taslaklarıdır. Kayıtların `seo_approved=false`, `reviewed_by_model=NULL` kalması zorunludur. Teknik denetim, aynı yapay zekâ tarafından yapılan ikinci bir dil denetimi veya otomatik dilbilgisi kontrolü bağımsız bir editörün onayı değildir.

## Gerçekleştirilen özel inceleme paketi

Google Drive'da **TractorVS – 2026 Forum Çeviri Onayları (Özel)** adlı özel bir klasör oluşturuldu. Her dil için bir yerel Google Dokümanı ve ayrıca özel bir ana dizin bulunuyor (toplam 10 dosya). Belgeler şu bilgileri içerir:

- Kaynak Türkçe başlığın ve gövdenin **tamamı**; hedef dilde başlık/gövdenin **tamamı**; aynı kaynak MD5 hash'i.
- Tam anlam eşleşmesi, 2026 araştırma kapsamı, dokuz marka-sıra-puan tablosu, dört kaynak URL'si, tarih, teknik birimler, yüzde/binlik yazım ve SEO riskleri için açıklanmış kontrol talimatları.
- Yalnızca **gerçek bağımsız editörün** doldurması gereken kimlik, nitelik, tarih, düzeltilmiş satırlar ve açık onay/ret kaydı.
- Belgeler ve klasör Drive bağlayıcısıyla okunup doğrulandı; şu anda `shared=false`, sadece sahibiyle paylaşılıyor. Belge ID'lerini veya özel bağlantılarını herkese açık GitHub Issue/PR açıklamasına yapıştırma.

**Bu paket gerçek bağımsız onayın alındığı anlamına gelmez.** Sahte `reviewed_by_model` veya onay imzası oluşturulmaz.

## Yayına giden uygulanabilir süreç

1. Her hedef dil için Türkçe kaynakla karşılaştırma yapabilecek gerçek bir çevirmen/dil uzmanı seç. Türkçe bilmiyorsa **kaynak anlamı** için ayrıca çift dilli denetim gerekir. Ücretsiz gönüllü de olabilir, fakat kimliği ve yaptığı denetim doğrulanabilir olmalı.
2. Yalnız hedef dilin Google Dokümanı, kullanıcı tarafından belirlenen editörün hesabına sınırlı yetkiyle açılır. Onay verilmeden `anyone` erişimi açma. Dış servisler ücretsiz denemeyle otomatik metin toplamasın.
3. Editörün bütün metni okuyup belge içinde satıra bağlı düzeltmeleri ve gerekçeleri vermesi, kaydı tarih ve doğrulanabilir kimliğiyle tamamlaması gerekir. Yalnızca dilbilgisi yazılımı kullanılması yeterli değildir.
4. Düzeltmeleri yayımlanmamış hedef Supabase taslağına **kaynak hash'i korunarak** işle; tüm sayısal ve RLS testlerini tekrar çalıştır. Yanlış puan, değişmiş model/yıl, `hp` / `PS`, yanlış gün/ay/yıl, kaynak URL kaybı reddedilsin.
5. Editör kararı kaydedilince ve doğrulama geçince **yalnız ilgili dil** için `state=ready`, `seo_approved=true`; mevcut yayın tetikleyicisi ve yayın kurallarından geçilir. Diğer diller özel kalır.
6. Onaylı statik site veri eşitlemesi/Cloudflare derlemesi tamamlandıktan sonra **gerçek canlı URL** için HTTP 200, canonical, reciprocal hreflang, sitemap, 2026 istatistikleri, Schema.org, mobil görünüm, görseller ve anon RLS yeniden denetlenir. Sadece GitHub birleştirmesi canlı SEO kanıtı değildir.
7. Orijinal konu güncellenirse kaynak hash değişir; eski bağımsız onay yeni metne kendiliğinden taşınmaz. Editör onayı yenilenir.

## Alternatif araçların gerçek sınırları

- LanguageTool'un topluluğa açık API'si ve kendi kendine barındırılabilen Java sürümü vardır. Ancak HTTP servisinde hız/kota şartları, self-host için indirme/bakım kaynakları ve ayrı gizlilik koşulları bulunur. Yazım, dilbilgisi ve stil kontrolü **tam semantik editoryal onay değildir**. Henüz çalıştırıldığı veya dokuz dilde başarılı sonuç verdiği iddia edilmiyor.
- Firecrawl kullanılabilir kredi: 0; TinyFish çalıştırma cüzdanı yetersiz. Bakiye artırma/ücretli yeni istek başlatılmadı.
- LangCorrect topluluğunun resmî kuralları, makine tarafından oluşturulmuş/çevrilmiş yazıyı kullanıcının özgün yazısı gibi topluluk gönderisi olarak paylaşmayı yasaklıyor. Bu kanal AI çevirilerinin toplu harici yayımlanması için **uygun değil**; oraya hiçbir metin yüklenmedi.
- Bağımsız insan uzman veya bağımsız erişilebilir modelin gerçekten yaptığı inceleme açıkça doğrulanamıyorsa alanlar `pending` olarak kalır.
- ChatGPT Plus'ın bağımsız üçüncü taraf bir editör/ücretli çeviri API'sine erişim sağladığı varsayılmaz.

## Geri dönüştürülebilir ve tekrar kullanılabilir kontroller

- `supabase/verification/verify_nine_locale_forum_prepublication.sql`
- `supabase/verification/verify_forum_contextual_date_facts.sql`
- `supabase/verification/verify_forum_locale_grouping_facts.sql`
- `scripts/tractor-forum-manual-translation-qa.mjs` ve testleri
- `site/docs/forum-nine-language-publication-readiness-20261122.md`
- `site/docs/forum-locale-typography-and-independent-review-20261122.md`

Onay belgesiyle ilgili somut reviewer bilgisi, izin/yayımlama durumunu etkileyen güncellemeler veya kişisel iletişim bilgileri GitHub'da herkese açık olarak saklanmamalıdır. GitHub Issue #388 yalnız genel dil bazlı **bekliyor / düzeltme / onaylandı / yayımlandı** durumunu ve teknik test sonuçlarını izler.

## Editör için kopyalanabilir kontrol kaydı (dil başına)

- Hedef dil: ______
- Gerçek ikinci editörün nitelikleri ve doğrulanabilir kimliği: ______
- Kaynağın tamamını ve hedef metnin tamamını karşılaştırdı: Evet/Hayır
- Anlam, 2026 anketi kapsamı ve sıralamalar korundu: Evet/Hayır
- Dilsel/terminolojik düzeltmeler ve kanıt: ______
- Bağımsız editör kararı: Onay / Düzeltme iste / Ret
- Karar tarihi: ______
- Kaynak hash eşleşmesi ve sayı, URL, RLS, SEO test sonucu: ______

**Bu alanlar bu aşamada doldurulmuş veya onaylanmış değildir.**
