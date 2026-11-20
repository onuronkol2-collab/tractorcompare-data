# TractorVS | SEO + GEO/AEO doğrulanabilir görünürlük planı
**Güncelleme:** 20 Kasım 2026 — yalnızca kanıta dayalı içerik; arama sıralaması veya yapay zekâda alıntılanma garantisi yok.

## Doğrulanan mevcut güçlü noktalar
- Published-only, kaynak ve model/varyant kimliğini koruyan statik traktör katalogu.
- On dilde model sayfaları ve kaynak bağlamına uygun canonical/hreflang.
- Genişletilmiş parça sözlüğü, 3 özgün uygulama rehberi, kaynak denetimi metodolojisi.
- Google için robots.txt, image sitemap, XML sitemap, JSON-LD WebPage/Thing/Breadcrumb.
- Bağlı Google Search Console'da 19–20 Kasım ön verilerinde gösterim bulunuyor; 20 Kasım 24 saatlik kullanıcı ekranında 20 gösterim, 1 tıklama. Bunlar çok küçük sayı ve kesinleşmemiş olabilir.

## Bu pakette yapılan GEO iyileştirmeleri
1. **Kaynağı kontrol edilmiş kısa cevaplar:** model sayfasında yalnızca doğrulama tarihi + kanıt metni + güvenilir URL bulunan ölçümler. Çelişkili güç/ölçüm standartları ve birim uyuşmazlığı otomatik dışlanır. TR/EN özgün, SSR HTML.
2. **Alıntı izlenebilirliği:** Her kısa cevabın yanında üretici veya bağımsız teknik belge linki; modelin WebPage JSON-LD yapısında yalnızca gerçek onaylı kaynaklardan citation.
3. **Yayıncı kimliği:** Site ana sayfalarında WebSite + Organization + WebPage JSON-LD, tüm dillerde aynı kuruluş kimliği. Sahte yıldız puanı, kullanıcı yorumu, Offer, stok/fiyat veya saha testi eklenmez.
4. **AI taranabilirliği:** indexable robots.txt içinde OAI-SearchBot açıkça izinli; noindex önizleme robots koruması devam. `llms.txt` yalnız isteğe bağlı keşif rehberi: Google'a sıralama kazandırdığı iddia edilmez.
5. **CI koruması:** normal ve indexable yapıların her ikisinde yapılandırılmış veri, bot izinleri, kaynaklı cevap kodu ve .txt dosyası kontrol edilir.

## İzle ve geliştir (ölçülebilir)
- **Her hafta:** Search Console 7 gün ve önceki 7 gün; tıklama, gösterim, ortalama konum ve sorgu/sayfa kırılımı. Günlük küçük sayıdan trend çıkarma.
- **Aylık:** Search Console Sayfa Dizine Ekleme: gönderilen / dizine eklenen / keşfedildi fakat dizine eklenmedi / tarandı fakat dizine eklenmedi. Sitemap gönderimi indeks garantisi değildir.
- **Bing Webmaster Tools:** AI Performance ekranından alıntı sayfaları, alıntı/grounding eğilimleri ve yayımlanan rapor kapsamını kontrol et. Bir AI aracının bizi mutlaka kaynak göstereceğini iddia etme.
- **Referans trafik:** Doğrulanmış analitik araçları üzerinden chatgpt.com, bing.com ve diğer AI kaynaklarından gelen referrer'ları ayrı değerlendir. Kaynak verisi olmayan sıralama yüzdeleri uydurma.
- **Crawl ve güvenlik:** Cloudflare bot/WAF tarafından Googlebot/Bingbot/OAI-SearchBot için engelleme yok mu kontrol et; robot izinleri tek başına güvenlik duvarını geçemez.
- **Katalog kalitesi:** Yayımlanmış tüm sayfaların gerçek model/yıl/pazar/varyant eşleşmesi, değer kanıtı, durum ve fotoğraf telif hakları; yalnız yeterli kanıtı olan farklı sayfalar indekslenebilir. Aynı metni anahtar kelime için çoğaltma.
- **Yeni içerik:** Gerçek arama ihtiyacına göre özgün alıcı soruları, doğru birim karşılaştırması, çalışma örnekleri, kaynaklı orijinal analiz; iki dilden başlayıp yalnız gerçekten çevrilmiş sayfalarla genişle.
- **Güncelleme tarihleri:** yalnızca içerikte gerçek değişiklik olduğunda güncelle. Yapay zekâ botları için sahte tazelik veya API anahtarı açıklama.
- **Dış site ölçümleri:** Google Search Console performansı genel web araması için veri verir; AI Overviews'da kaynak gösterimini bire bir garanti/raporlamaz.

## Resmî kılavuzlar
- Google AI arama özellikleri: https://developers.google.com/search/docs/appearance/ai-features
- Google People-first içerik: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google yapılandırılmış veri ilkeleri: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- ChatGPT Search erişimi: https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt
- Bing AI Performance: https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/
- Google llms.txt gerekmediğini açıklıyor: https://developers.google.com/search/updates
