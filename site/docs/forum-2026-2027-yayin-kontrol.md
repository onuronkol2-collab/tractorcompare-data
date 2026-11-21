# TractorVS 2026–2027 Güvenilirlik Araştırması — Yayın Kontrolü

## SEO / GEO yayın alanları ve sürüm kontrolü

- **Önerilen H1:** 2026–2027 Traktör Güvenilirlik Araştırması: Markalar ve Gerçek Saha Testleri
- **SEO title:** 2026–2027 Traktör Arıza ve Güvenilirlik Araştırması | TractorVS
- **Meta description:** 2026–2027 traktör arıza araştırması: Fendt, John Deere, Valtra, Kubota ve diğer markalardan gerçek saha testleri, motor saatleri ve satışa göre oran yöntemi.
- **Önerilen slug:** 2026-2027-traktor-marka-model-ariza-arastirmasi
- **Canonical:** Tek Türkçe özgün makale; doğrulanmamış otomatik çeviriye hreflang/canonical verme.
- **Schema:** Gerçek yazar ve yayımlama tarihi mevcut olduğunda DiscussionForumPosting; uydurma değerlendirme puanı veya FAQ rich result garantisi yok.
- **Yayın sınırlaması:** Mevcut forum görünümü ham Markdown'ı semantik olarak işlemiyor ve yazı uzunluğu veritabanında 12.000 karakterle sınırlı. Bu tam araştırma, forumun uzun makale desteği ve kaynağa bağlı editoryal doğrulama tamamlanmadan olduğu gibi yayımlanmamalı.
- **Son güncelleme:** 21 Kasım 2026. Yeni kaynak veya hatanın düzeltilmesi halinde sürüm geçmişini koru.


## Yeni karar: sayı sınırı yok

Forum araştırmalarında 5+5 veya 10 model üst sınırı yoktur. Yalnızca birincil kaynak ve kanıtın sınırı açıklanabilen modeller eklenir. Kamuya açık forum gönderilerinin mevcut 12.000 karakter ve kimlik doğrulama sınırları güvenlik amaçlıdır; araştırma kapsamına konulan model sayısı sınırlamasıyla karıştırılmamalıdır.

## Onay ve teknik geçişler

- GitHub'daki uzun araştırmanın Markdown olarak okunaklı gösterilmesi sağlanmalı; forumun mevcut ham metin gösterimi değiştirilirken XSS ve UGC güvenliği korunmalı.
- İdeal yayın: Tam uzun araştırma tek bir canonical editoryal sayfada; forumda özgün tartışma açılışı ve editoryal sayfaya açık referans. Tek uzun metni iki indexlenebilir URL'de kopyalama.
- Gerçek forum konusu yalnızca oturum açmış yetkili kullanıcının hesap/izinleriyle oluşturulabilir; sistemin RLS veya modere etme kuralları aşılmamalı.
- Sayfa yayınlanmadan önce Lighthouse/Playwright ve SEO/sitemap/structured-data doğrulanmalı. CI sonuçları görülmeden canlı tamamlandı denmemeli.
- Yazar ve yayın tarihi gerçeğe uygun belirlenmeli, iddia edilen araştırma tarihi yayın tarihi gibi gösterilmemeli.
