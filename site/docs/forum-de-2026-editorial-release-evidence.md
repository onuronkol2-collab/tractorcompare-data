# TractorVS 2026 traktör bayi memnuniyeti — Almanca yayın kalite kararı (22.11.2026)

## Amaç ve kapsam
Yalnız `de` dili. Kaynak konu `713ab252-a925-4ab7-b2c8-a30ce5b86706`, özgün Türkçe kaynak hash'i `0102e8edcd864b285733fb30cad4d8f1`. Türkçe özgün konu yayımlanmış ve `translation_consent=true`. Önceden onaylı İngilizce `en` korunacak. `es, fr, hi, ja, pt-br, ru, zh` dil taslakları özel kalacak.

## İnceleme kanıtları
- Türkçe ve Almanca metinler Supabase'de tekrar okundu; **96/96 paragraf**, 21 bölüm başlığı, 11 Markdown tablo satırı ve dört haricî kaynak korunuyor.
- Mevcut Almanca taslak, daha doğal bir soru/giriş, Swaraj–Yanmar kategori ayrımı, DSI tanımı, kaynak marka genel puanlarının doğru yorumlanması ve 2,6 puanlık farkın yüzde **olmadığının** açıklığı için **7 noktasal editoryal düzeltme** aldı. Başlık arama amacı korunarak `Traktorhändler-Zufriedenheit 2026: Markenranking und Punktzahlen` olarak iyileştirildi. Tüm düzeltmeler `needs_review` içinde yapıldı.
- Google Sheets'teki kullanıcıya özel `DE Geri Çeviri` sekmesinde **dokuz bölümü içeren tamamı** gerçek Google Translate `de→tr` bağımsız ikinci makine çıktısı olarak tekrar üretildi: **9/9** yanıt. Her bölümün Almancası Türkçe orijinal ile anlam bakımından ayrıca model tarafından karşılaştırıldı.
- Geri çeviri motoru ikinci bölümde Markdown tablo biçimini değiştirdi, altıncı bölümde `Same` marka adını Türkçe `aynı` olarak çevirdi ve yedinci bölümde Markdown başlığının sunumunu değiştirdi. **Orijinal Almanca metinde bu üç kusur yoktur**; Google sonucu otomatik yayınlanmadı.
- PostgreSQL yerleşik `tc_forum_fact_tokens` başlık ve gövde eşleşmesi başarılı, `tc_forum_language_issue` null. Markalar/puanlar/ölçekler 2026 kamu kaynaklarıyla karşılaştırıldı: Same 13,7; Deutz-Fahr 13,2; CLAAS 13,1; John Deere 13,0; Case IH ve Fendt 12,3; Kubota 12,2; New Holland 11,8; Massey Ferguson 11,1. CLIMMAR 10 ülkede, Mechaman 8 ülke ve 561 bayiden bahseder; rakamlar çelişkiyi görmezden gelerek tek örneklem gibi sunulmaz.
- Hindistan FADA 2026 Swaraj traktör kategorisinde 788/1000; 2.045 bütün sektör örneklemi. NAEDA 2026 Yanmar Dealer's Choice, TYM Gold Level; 1.745 bütün ekipman kategorilerinin yanıt sayısı. **Händlerzufriedenheit ist nicht Traktor-Zuverlässigkeit**; arıza oranı veya evrensel üç-bölge sıralaması üretilmez.
- Kaynaklar:
  * https://www.climmar.com/news/climmar-presents-dealer-satisfaction-index-at-eima
  * https://www.mechaman.nl/artikel/20261118/trekkerdealers-minder-tevreden-over-fabrikanten-john-deere-enige-stijger/
  * https://www.rushlane.com/indias-largest-auto-brands-arent-no-1-in-dealer-satisfaction-fada-study-12554950.html
  * https://www.equipmentdealermagazine.com/naeda-announces-2026-dealers-choice-and-gold-level-award-winners/

## Dürüst sınırlama
Buradaki ikinci araç **bağımsız makine çevirisi**, son editoryal değerlendirme **GPT-6** tarafından yapıldı. Bağımsız bir Alman insan editörün imzası **ALINMADI**. Bu yüzden `reviewed_by_model` yalnızca gerçekte gerçekleştirilen iki araçlı incelemeyi adlandırır; insan tarafından imzalanmış kalite sertifikası gibi gösterilemez. Kullanıcının açık, aşamalı yayın kararının çerçevesinde uygulanır. Ücretli sağlayıcı/abonelik/arka plan çevirisi açılmadı.

## Yayın prosedürü
1. `supabase/sql/forum_release_de_dealer_satisfaction_2026.sql` önce `COMMIT` yerine `ROLLBACK` kullanılarak **gerçek canlı veritabanında işlem geri alınmalı prova** ile test edilmeli. Başarılı PR/CI ardından asıl SQL uygulanabilir.
2. Kaynak izni, hash, numara/başlık/testler, 9 marka-sıra-puan çifti, 4 tam URL, 21 başlık, 11 tablo satırı, bayi memnuniyeti ile arıza farkı, NAEDA ödülleri ve 7 özel dil taslağı kontrol edilerek yalnız `de` `ready` + `seo_approved=true` olur.
3. `supabase/verification/verify_forum_de_only_live.sql` başarıyla geçmeli: anonim güvenli görünümde sadece `de,en,tr` görülecek ve diğer yedi dil gizli kalacak.
4. Moderasyonlu public snapshot hash eşitlemesi yalnız anon read-only olarak çalışır. Ardından Cloudflare build ve canlı Alman URL `https://tractorvs.com/de/forum/2026-traktor-bayi-memnuniyeti-siralamasi-markalar-ve-puanlar-713ab252a9254ab7b2c8a30ce5b86706/` için HTTP 200, kendi canonical'ı, H1, doğru robots, reciprocal `de,en,tr` hreflang, forum hub ve sitemap doğrulanır.
5. Yayın başarısız veya hatalıysa `supabase/rollback/forum_release_de_dealer_satisfaction_2026_rollback.sql` yalnız Almancayı yeniden gizler. Statik sayfanın Cloudflare'dan kalkması için yeniden public snapshot/derleme ve canlı doğrulama gerekir.

Arama motorunun Google indekslemesi ayrıca gözlemlenmelidir; başarılı canlı site denetimi indekslenme garantisi değildir.
