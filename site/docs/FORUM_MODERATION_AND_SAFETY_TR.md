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
- **Kayıt ve görünürlük farklıdır:** Supabase 'published' yazıların veritabanında yayımlandığı anlamına gelir. Cloudflare üzerindeki statik HTML konularının oluşması otomatik eşitleme ve güvenli üretim dağıtımına bağlıdır. Kullanıcıya veritabanı kaydı ile canlı sayfanın iki ayrı durum olduğu açıkça gösterilir.
- Ücretsiz anon-only `tractor-forum-publication-autosync.mjs` artık yoğun saatler dışında **yaklaşık her 10 dakikada bir** kaynağı kontrol etmeyi dener. GitHub zamanlanmış işler gecikebilir veya atlanabilir; süre garantisi vermeyin. Fingerprint değişince ana dala yalnız public revision commit'i yazar, hiçbir içeriği onaylamaz veya service role kullanmaz.
- **Bağımsız yayın bekçisi:** `tractorvs-forum-live-visibility-watchdog.yml` yaklaşık yarım saatte bir Supabase'in anonim görünür bütün konuları, yanıtları ve onaylanmış fotoğraflarıyla gerçek forum listesi, konu HTML'si, canonical/robots ve forum sitemap'ini karşılaştırır. Kısa konular canlıda okunabilmeli ama `seo_ready` değilse sitemap'e girmemelidir. Yeni gönderilere 45 dakikalık dağıtım toleransı tanır. Hatalı veya silinmiş/gizlenmiş sayfa sitemap'te kalırsa hata üretir ve tek bir açık GitHub sorunu oluşturur.
- **Kontrollü kurtarma:** Doğrulanmış canlı yayın uyumsuzluğu varsa yeni bir Cloudflare derlemesi isteyebilir; iki saatten kısa aralıkla tekrar etmez ve 24 saat içinde en fazla iki deneme yapar. Ağ/Supabase denetimi başarısız olduğunda doğrulanmamış veriyi yayımlamaz. Hata kalırsa GitHub issue açık kalır.
- **SEO ve gerçek teslim:** Başarılı CI, GitHub commit veya Supabase 'published' statüsü tek başına yeterli değildir. Canlı HTML 200, doğru canonical, indexleme yönergesi, bağlantılı forum hub ve sitemap gözlenmeden kullanıcıya 'site yayını tamam' demeyin. Google'da indekslenme ayrıca Google'a bağlıdır.

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
- Yapay Gemini deneme konusu `hidden` tutulur. 21 Kasım 2026'da gerçek ilk araştırma konusu yayımlandı ve canlı site/sitemap üzerinden doğrulandı. Güncel konu sayısı her görevde yeniden sorgulanmalıdır.


## Forum yayın aksaklığı kurtarma adımları (21 Kasım 2026)

1. Önce Supabase `tc_forum_localized_topics` anonim görünümünde gerçek gönderinin durumunu, `seo_ready` alanını, slug'ını ve saatini **salt okunur** olarak doğrulayın. Özel e-posta veya üye bilgilerini raporlamayın.
2. Gerçek `https://tractorvs.com/<dil>/forum/<slug>/` sayfasını, ilgili dil forum listesini ve `/forum-sitemap.xml` dosyasını kontrol edin. Boş forum ana sayfası, DB kaydının kayıp olduğunu tek başına göstermez.
3. Eşitleme işini GitHub Actions → **TractorVS published forum static content refresh** üzerinden `workflow_dispatch` ve `dry_run=false` ile güvenli biçimde başlatın. Bu yalnız anonim kamu verisini okur; içeriği manuel olarak yayımlamaz.
4. GitHub Actions derlemesi ve **Workers Builds: tractorvs-site** sonucunu ayrı kontrol edin. Üretim Cloudflare dağıtımı tamamlanmadan 'canlıda' demeyin. 45 dakikayı aşan görünmezlik için watchdog sorunu ve sınırlı kurtarma bilgisine bakın.
5. Güvenlik/SEO önceliği: Gizli/retli kayıtları açmayın, RLS'yi kapatmayın, sahte konular üretmeyin, Google indeksini garanti etmeyin. Otomatik kurtarma günlük limitine ulaşırsa önce yapılandırma hatasını düzeltin.
