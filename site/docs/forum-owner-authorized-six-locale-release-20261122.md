# TractorVS — Forum konu çevirilerinin kontrollü altı dil yayını (22 Kasım 2026)

## Kapsam
- Konu kimliği: `713ab252-a925-4ab7-b2c8-a30ce5b86706`.
- Türkçe asıl metin MD5: `0102e8edcd864b285733fb30cad4d8f1`. Kaynak `published`, `translation_consent=true`.
- Önceden yayımlananlar: `tr`, `en`, `de`. Bu üç dilin metinlerine dokunulmadı.
- 22 Kasım 2026'da kullanıcı tarafından yayınlanması açıkça istenen ek diller: `fr`, `pt-br`, `ru`.
- Gizli kalanlar: `es`, `ja`, `zh`, `hi`.

## Kanıt ve sınır
- Yedi taslak için 96/96 paragraf, 21 Markdown başlığı, 11 tablo satırı, dört değiştirilmemiş araştırma URL'si, dokuz marka/sıra/puan eşleşmesi, sayı-tarih/birim kaynak eşitliği, SQL dil koruması ve anonim görünürlük kontrolleri başarılıydı (bkz. PR #421 ve `supabase/verification/verify_forum_remaining_seven_bulk_qa.sql`).
- Google Translate ters çeviri kayıtları: yedi dilde dokuz bölüm olmak üzere 63/63 çıktı; ilk üç yayın adayında (`fr`, `pt-br`, `ru`) ikinci motorda tablo/özel ad/başlık biçimi farkı raporlanmadı.
- 2026 CLIMMAR, Mechaman, FADA ve NAEDA kaynaklarında araştırma kapsamları ve kategorik ödüller birbirinden ayrı tutuldu. Bayi memnuniyeti, mekanik arıza oranı değildir.
- Bu bir **kullanıcı/işletmeci talebi üzerine**, GPT-6 editoryal kontrolü ve ikinci makine ters çevirisiyle verilen yayın kararıdır. **Bağımsız insan / anadil editörü onayı yapılmadı ve yapılmış gibi gösterilmedi**. Supabase `reviewed_by_model` ve `qa_notes` alanları gerçek inceleme türünü açıkça belirtir.
- Yalnız üç eşleşen ve gizli taslağın `state=ready`, `seo_approved=true` geçişi yapıldı. Kaynak yazı, sayılar, URL'ler, şema, RLS, üye verileri, ücretli çeviri API'leri, çalışan otomatik görevler değişmedi.

## Gerçekleştirilmiş kontrol / dağıtım ayrımı
1. Veritabanı öncesi `BEGIN ... ROLLBACK` yayın provası başarıyla altı `seo_ready` satırı verdi.
2. Aynı koşullara bağlı transaksiyon `COMMIT` ile `fr`, `pt-br`, `ru` için uygulandı; yedi dilin durumları yeniden okundu.
3. `SET LOCAL ROLE anon` altında `tc_forum_localized_topics` yalnız `tr`, `en`, `de`, `fr`, `pt-br`, `ru` gösterdi.
4. **Veritabanına yayınlama ile Cloudflare'a dağıtım farklı aşamalardır.** Sonraki ana dal Cloudflare üretim derlemesi başarılı olmadıkça yeni statik sayfalar canlı doğrulanmış sayılamaz. Hedefler: gerçek HTTP 200, doğru dil, self canonical, reciprocal hreflang, forum sitemap, ana sitemap, yapılandırılmış veri, mobil görünüm.
5. Dört gizli taslakta `needs_review` / `seo_approved=false` korunur. Google geri çevirisindeki ES tablo, JA başlık, HI/ ZH özel isim işaretleri özgün hedef taslakta teyit edilmeden gerçek kusur sayılmaz.

## Geri alma planı
Yeni üç dili geçici gizlemek gerekirse **yalnız aynı konu kimliği ve dil üçlüsünü** hedefleyerek `state='needs_review',seo_approved=false,reviewed_by_model=NULL` yap; orijinal `qa_notes` denetim kaydını silme. RLS ve diğer dil kayıtlarını değiştirme. Sonra anonim görünümü, Cloudflare üretim eşitlemesini, canonical/hreflang/sitemap kapsamasını yeniden doğrula. Kullanıcının açık yeni yayın kararını gerekçesiz otomatik geri alma.
