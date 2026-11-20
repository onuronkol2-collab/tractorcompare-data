# TractorVS Topluluk / Forum — Güvenli Başlangıç ve Moderasyon
**21 Kasım 2026 — gerçek üretim veritabanı + 10 dilli Astro site**

## Yayın kuralı
- Forumda yalnız gerçek kullanıcı gönderileri yer alır; yapay ya da sahte “soru / kullanıcı yorumu” oluşturmayın.
- Kullanıcılar Supabase Auth ile e-postayla giriş yapar; yeni konu ve yanıtlar **pending** olarak eklenir. Herhangi bir kullanıcı kendi gönderisini doğrudan `published` yapamaz.
- Bir yönetici, Supabase Table Editor'da `public.tc_forum_topics` ve `public.tc_forum_replies` üzerinden içeriği güvenlik, özgünlük, spam, kişisel veri ve yasal içerik yönünden inceler. Sadece onaylananları `published` yapar. Red veya gizleme için `rejected` / `hidden` kullanın.
- Her gün kişi başına 3 yeni konu ve 12 yanıt sınırı, PostgreSQL SECURITY INVOKER tetikleyicisinde denetlenir. Postgres RLS, modere edilmiş yayın dışında yazma imkânı sağlamaz.
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
- Forum URL'leri ana sitemap'ten çıkarılmıştır, çünkü boş/noindex sayfa üretimini önlemek gerekir. Kullanıcıların onaylanmış konularının keşfi için yalnız indexable konuları listeleyen ayrı `/forum-sitemap.xml` robots.txt'de referanslanır.
- Moderasyon verisi Cloudflare'a anlık olarak gitmez: statik sayfaların yeniden build edilmesi gerekir. Anon-view-only `tractor-forum-publication-autosync.mjs` yarım saatlik izleme fingerprint'i değişirse ana dala minimal kaynak güncellemesi yazar; sonra normal güvenli Cloudflare build tetiklenir. Başarılı CI **Google indeks garantisi değildir**.

## Yeni moderatör prosedürü
1. Konu içeriğini özgünlük, güvenli bakım tavsiyesi, hassas bilgi ve spam açısından denetleyin.
2. Gerçek model varsa kimliği, pazar/yıl/varyant ve iddiaların kanıt durumunu kontrol edin.
3. Uygunsa yalnız `status='published'` yapın. **Yapay yorum veya etkileşim sayısı üretmeyin.**
4. Forum ile katalog senkron CI ve Cloudflare üretim kontrolleri yeşil olmalı. Gerekirse yalnızca `hidden` ile uygunsuz konuyu geri çekin.
5. Çeviri açık rıza ve ayrıca dilsel QA olmadan otomatik yayınlanmaz.

## Denetimde doğrulanan güvenlik
- Supabase `authenticated` için kısıtlı `INSERT` mevcut; `anon` yazma yok; kullanıcılar statüyü güncelleyemez.
- Gerçek kullanıcı JWT bağlamında bir *pending* gönderinin `BEGIN … ROLLBACK` içinde kaydedilebildiği test edildi; işlem geri alındı, hiçbir test konusu canlıya taşınmadı.
- RLS `UPDATE` için kullanıcı politikası yok; otomatik onay yok.
- Forumun mevcut tek sahte Gemini demo konusunun durumu `hidden`, gerçek yayımlanmış konu ve yanıt sayısı **0**.
