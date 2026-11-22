# TractorVS — 2026 bayi memnuniyeti forum konusunun dokuz dilde çeviri denetimi

Tarih: 22 Kasım 2026. Konu ID: `713ab252-a925-4ab7-b2c8-a30ce5b86706`. Kaynak başlık: **2026 Traktör Bayi Memnuniyeti Sıralaması: Markalar ve Puanlar**. Kaynak dili: Türkçe, yayımlanmış konu, `translation_consent=true`. Kaynak MD5: `0102e8edcd864b285733fb30cad4d8f1`.

## Şu anda doğrulanmış durum

- Dokuz tam çeviri taslağı `tc_forum_topic_translations` tablosunda kayıtlı: `en, zh, hi, pt-br, fr, de, ru, ja, es`.
- Hepsi `needs_review`, `seo_approved=false`, `reviewed_by_model=NULL`; bu bir editoryal onay **değildir**. Eski otomatik kuyruktaki dokuz iş taslak hazırlanması nedeniyle `done` işaretli, yayımlandığı anlamına gelmiyor.
- Her dilde 21 Markdown bölüm başlığı, 18 madde satırı, 11 tablo satırı, dört kaynak URL'si ve bütün temel sayısal olgular korunmuştur. Çince/Japoncada ek numara görünen aylar Türkçedeki yazıyla yazılmış ayların yerelleştirilmiş biçimleridir.
- İngilizce ve Hintçede karışabilecek ondalık/binlik ayraçlar ve yüzde işaretinin konumu düzeltilmiş, güncel `tc_forum_fact_tokens` karşılaştırması tekrar geçmiş durumda. Arama motoruna / canlı çok dilli URL'ye açılmadılar.
- 22 Kasım'da `tc_topic_translation_public` SELECT RLS ve `tc_forum_localized_topics` SECURITY INVOKER görünümü ek `seo_approved IS TRUE` şartıyla sıkılaştırıldı. Anonim testte yalnız `tr` orijinali görünüyordu; `needs_review` taslakları erişilemez.
- Supabase Edge `tractor-forum-translate` v21 yalnız özel yetkilendirmeli `action=status` kabul eder; Azure/Cloudflare M2M100/Gemini çeviri API çağrısı ve eski GitHub Actions `TEST`, `TOPLU_TEST`, `ONAY` işleme seçenekleri kapalıdır. Bu değişiklik, sağlayıcı hesabındaki mevcut aboneliği veya anahtarı otomatik iptal etmez.

## Bağımsız kalite değerlendirmesi bekleyen noktalar

**Yapısal ve sayısal kontrol, dilsel doğruluk kontrolü değildir.** Her dil, anadili düzeyinde veya gerçekten bağımsız bir editoryal inceleme gerektirir. İnceleme sırasında özellikle şu hataları ara:

- **Tüm diller:** Bayi memnuniyeti, teknik güvenilirlik veya mekanik arıza oranı gibi sunulmamalıdır. Avrupa (CLIMMAR), Hindistan (FADA) ve Kuzey Amerika (NAEDA) birbirinden farklı örnekleme ve ölçeklere sahiptir; dünya sıralaması yapılamaz.
- **Rakamlar:** Same 13,7; Deutz-Fahr 13,2; CLAAS 13,1; John Deere 13,0; Case IH/Fendt 12,3; Kubota 12,2; New Holland 11,8; Massey Ferguson 11,1. Fark 2,6 puandır; **%2,6 arıza olasılığı farkı değildir**. Hindistan Swaraj 788 / 1.000. Kuzey Amerika Yanmar Dealer's Choice ve TYM Gold Level. Ortak ölçek gibi sunulmaz.
- **Örneklem kapsamı:** CLIMMAR resmî açıklamasındaki on ülke ile Mechaman'daki sekiz ülke/561 bayi yanıtı aynı tekil örneklem gibi birleştirilmemelidir. NAEDA 1.745 yanıt bütün ekipman kategorilerindendir, yalnız traktör kategorisi değil.
- **Fransızca (fr):** `1er septembre` yerelleştirilmiş doğru tarih olabilir, ancak PostgreSQL `tc_forum_fact_tokens` işlevi bunu ek `1er` / eksik `1` olarak işaretler. Tarihi yanlış dil biçimine zorlamak yerine tarih bağlamıyla ayrı QA gerektirir.
- **Çince / Japonca (zh / ja):** Türkçe `10 Kasım 2026` ifadesinin `2026年11月10日` yerelleştirmesi ay numarası ekler; mevcut veritabanı yayın tetikleyicisi bunu başka sayısal olgu gibi işaretler. Ay adını veya gün/yıl sayısını doğru eşleştirmeden sayısal kontrolü gevşetme.
- **Birimin korunması:** `75 hp` sayısını `75 PS` olarak sessizce çevirmek gibi dönüşümler fiziksel birim eşdeğerliği değerlendirilmeden onaylanmaz. Kaynak URL, marka adı, model/yıl/varyant ve Markdown tablo yapısı korunur.
- **Yüzde ve binlik biçimleri:** İngilizce/Hintçe `2,045` (iki bin kırk beş) ve `13.7` (on üç virgül yedi), diğer dillerin yerel gösterimlerinden farklı olabilir. Yüzde işareti sayıdan önce veya sonra doğru yerleştirilirken değer değişmemelidir.

## Yayın kapıları

1. Kaynak konunun `published`, `translation_consent=true` olması ve kaynak hashinin halen aynı olması.
2. Dokuz dilde tam metin tercümesi; tablolar ve başlıklar; URL, marka, teknik birim, sayı, veri kapsamı ve araştırma çekinceleri denetlenmiş olması.
3. Dilsel/bağımsız editoryal inceleme gerçekten yapılmış ve sonucu izlenebilir biçimde kayıtlı olması. Yapay zekâ kendi çevirisini bağımsız ikinci editör gibi göstermemelidir.
4. PostgreSQL yayın tetikleyicisinin meşru yerelleştirmeleri tutarlı biçimde desteklemesi; hatalı sayıları hâlâ engellemesi. Gerekli düzeltme ayrı test ve kod incelemesinden geçmelidir.
5. Yalnız bunlardan sonra `state=ready` ve `seo_approved=true`; ardından sayfanın canonical/hreflang/sitemap/anon RLS ve gerçek canlı erişim kontrolleri. Google sıralama garantisi yok.

## Tekrar çalıştırılabilir güvenlik doğrulaması

`supabase/verification/verify_forum_translation_publication_guard.sql` veritabanını değiştirmeden iki bağımsız yayına çıkma şartını ve özel taslakların sızmadığını test eder.

İlgili değişiklikler: [PR #379](https://github.com/onuronkol2-collab/tractorcompare-data/pull/379), [PR #383](https://github.com/onuronkol2-collab/tractorcompare-data/pull/383); eski M2M100 hataları [issue #377](https://github.com/onuronkol2-collab/tractorcompare-data/issues/377). `AGENTS.md` en üst düzey kaynak olarak esas alınır.
