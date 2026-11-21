# TractorVS Topluluk / Forum — Güvenli Başlangıç ve Moderasyon
**21 Kasım 2026 — gerçek üretim veritabanı + 10 dilli Astro site**

## Yayın kuralı — 2026-11-21 güncellemesi
- Forumda yalnız gerçek kullanıcı gönderileri yer alır; yapay ya da sahte “soru / kullanıcı yorumu” oluşturmayın.
- Kullanıcılar Supabase Auth ile giriş yapar. Doğrulanmış, anonim olmayan oturumlar `published` statüsünde doğrudan **metin konu/yanıtı** oluşturabilir. `pending` seçeneği RLS'de geriye dönük uyumluluk için korunur. Günlük kişi başı sınır 3 konu / 12 yanıttır; yeni gönderiler ayrıca kısa aralık sınırlamasına tabidir.
- Yeni metinler artık zorunlu ön moderasyondan geçmez. Yönetici kötüye kullanım, spam ve hukuka aykırı içerikleri yayından kaldırmak için `hidden` / `rejected` statülerini kullanabilir; kullanıcıların durum güncelleme yetkisi yoktur. **Fotoğraflar hâlâ özel depoda `pending` olarak kalır**, lisans ve dosya onayı olmadan yayımlanamaz.
- Her gün kişi başına 3 yeni konu ve 12 yanıt sınırı, PostgreSQL SECURITY INVOKER tetikleyicisinde denetlenir. Postgres RLS, yalnız kendi gönderilerini oluşturmasına izin verir; yetkisiz güncelleme veya anonim yazma imkânı sağlamaz.
- Seçili bir traktörün bağlantısı yalnız *published* katalog kimliğini kabul eder. Spam, telefon/e-posta, özel iletişim bilgileri ve yanlış teknik güvenlik tavsiyeleri onaylanmaz.
- `translation_consent` isteğe bağlı ve varsayılan **false**. İzin vermeyen kullanıcıların içeriği çeviri kuyruğuna girmez, hazır çevirileri anon view/RLS'le de gösterilmez.
- `tc_forum_localized_topics`, `tc_forum_localized_replies`, `tc_forum_translation_sources` **security_invoker=true**, kaynak statüsüne ve çeviri onayına bağlıdır. `anon` yalnız yayımlanmış verileri okuyabilir.

## Supabase Auth yapılandırması
Supabase Dashboard > Authentication > URL Configuration sayfasında **Site URL** olarak `https://tractorvs.com` tanımlayın. E-posta yönlendirmelerinin çalışması için `https://tractorvs.com/**` veya sadece gerçek `/forum/`, `/tr/forum/`, diğer dil forum sayfalarını kapsayan güvenli redirect allowlist gerekir. Yeni kullanıcı e-posta bağlantı şablonunu ve rate limits’i kontrol edin. E-posta sağlayıcısı ve teslimi bu kodun GitHub CI testleriyle doğrulanamaz. OTP veya sihirli bağlantı yalnız çalışırsa gerçekten giriş yapılabilir; aksi hâlde ön yüz hatayı gösterir.
**Doğrudan tarayıcıya service_role, Supabase secret key veya admin şifresi koymayın.**

## İçerik/SEO modeli
- İlk açılışta gerçek onaylı konu olmadığından forum ana sayfaları **noindex**; eski Gemini deneme konusu `hidden` (silinmedi).
- İçeriği yeterince detaylı ve özgün olan, `seo_ready=true` konular kendi adreslerinde **index,follow** olabilir. Çeviri görünmesi bile, özgünlük/uzunluk/yazar kimliği kontrolü olmadan indeks garantisi değildir.
- Başlık/URL, metin, kategori, yayım günü ve model bağlantısı dil bağlamıyla sunulur. Yapılmamış saha testleri, sahte puan, `DiscussionForumPosting` yazar/etkileşim JSON-LD'si eklenmez.
- Gelecekte doğrulanmış, kullanıcı onaylı yazar bilgisi eklenirse uygun JSON-LD ayrıca denetlenebilir.
- Forum URL'leri ana sitemap dışında tutulur. `seo_ready=true` ve yeterli özgün içeriğe sahip yayımlanmış konular `/forum-sitemap.xml` içerisinde sunulur. Kamuya açık bir postun indekslenmesi otomatik değildir; kalite ve içerik denetimi sürdürülmelidir.
- Moderasyon verisi Cloudflare'a anlık olarak gitmez: statik sayfaların yeniden build edilmesi gerekir. Anon-view-only `tractor-forum-publication-autosync.mjs` yaklaşık yarım saatlik zamanlanmış kontrolünde yayımlanmış içerik fingerprint'i değişirse ana dala minimal kaynak güncellemesi yazar; sonra normal güvenli Cloudflare build tetiklenir. Başarılı CI **Google indeks garantisi değildir**.

## Yeni moderatör prosedürü
- Metin yayınları doğrudandır; moderatör gerektiğinde sonradan gizler. Yayına alma öncesi onay yalnız fotoğraflar için zorunludur.
1. Konu içeriğini özgünlük, güvenli bakım tavsiyesi, hassas bilgi ve spam açısından denetleyin.
2. Gerçek model varsa kimliği, pazar/yıl/varyant ve iddiaların kanıt durumunu kontrol edin.
3. Uygunsa yalnız `status='published'` yapın. **Yapay yorum veya etkileşim sayısı üretmeyin.**
4. Forum ile katalog senkron CI ve Cloudflare üretim kontrolleri yeşil olmalı. Gerekirse yalnızca `hidden` ile uygunsuz konuyu geri çekin.
5. Çeviri açık rıza ve ayrıca dilsel QA olmadan otomatik yayınlanmaz.

## Denetimde doğrulanan güvenlik
- Supabase `authenticated` için kısıtlı `INSERT` mevcut; `anon` yazma yok; kullanıcılar statüyü güncelleyemez.
- Önceki sürümde gerçek kullanıcı JWT bağlamında bir *pending* gönderinin `BEGIN … ROLLBACK` içinde kaydedilebildiği test edildi; işlem geri alındı, hiçbir test konusu canlıya taşınmadı.
- RLS `UPDATE` için kullanıcı politikası yok. Yeni sürümde doğrulanmış üyelerin yazılı içerikleri `INSERT` sırasında doğrudan yayımlanabilir; fotoğraf onayı ayrı kalır.
- Forumun mevcut tek sahte Gemini demo konusunun durumu `hidden`, gerçek yayımlanmış konu ve yanıt sayısı **0**.
