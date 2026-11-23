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
- **Google üretken yapay zekâ ölçümü (2026 güncellemesi):** Search Console'un ayrı **Generative AI performance** raporu AI Overviews/AI Mode dâhil desteklenen AI arama deneyimlerinde gösterimleri, görünen sayfaları ve ülke/cihaz/tarih kırılımlarını raporlar (3 Haziran 2026 duyurusu; 31 Ağustos'ta küresel yayılım). Bu metrikler belirli tek bir yapay zekâ yanıtında atıf, yerleşim, tıklama veya sıralama garantisi vermez. Raporun sitede veri gösterip göstermediğini hesaptan ayrıca doğrula.

## Resmî kılavuzlar
- Google AI arama özellikleri: https://developers.google.com/search/docs/appearance/ai-features
- Google People-first içerik: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google yapılandırılmış veri ilkeleri: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- ChatGPT Search erişimi: https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt
- Bing AI Performance: https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/
- Google llms.txt gerekmediğini açıklıyor: https://developers.google.com/search/updates

## Uzmanlık kaynaklarının güncel denetimi — 23 Kasım 2026

Bu bölüm, resmî belgelere dayalı **öğrenme kaydıdır**; burada yazılan öneriler canlı TractorVS sistemine uygulandı veya başarıyla test edildi anlamına gelmez. `AGENTS.md` ve mevcut dağıtım/yayın güvenliği kuralları önceliklidir.

### Doğrulanmış 2026 değişiklikleri — eski varsayımları güncelle
1. **Google Search Console Generative AI Performance:** 3 Haziran 2026'da duyuruldu, 31 Ağustos 2026 itibarıyla dünya çapında kullanıma sunuldu. AI Overviews/AI Mode gibi üretken AI gösterimlerini, görünen URL'leri ve ülke/cihaz/tarih dağılımını izlemeyi mümkün kılıyor. Eski “Search Console'da AI görünürlüğü için ayrı rapor yok” varsayımı yanlıştır. Rapor, gerçek ChatGPT atıflarını veya belirli AI cevabındaki kesin konumu ölçmez. Kaynak: https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports
2. **Google Search Console multimodal arama:** 24 Eylül 2026 duyurusuna göre Lens, Circle to Search, görsel yükleme ve Chrome görselle arama gibi etkinlikler için multimodal performans filtresi gelmeye başladı. Veri varsa traktör fotoğraflarının keşfinde ayrı analiz et; rapor boşsa görünürlük varmış gibi gösterme. Kaynak: https://developers.google.com/search/blog/2026/09/web-multimodal-in-sc
3. **Bing AI Performance ve Topics Portfolio beta:** AI cevaplarında atıf sayısı, kaynak gösterilen sayfalar ve desteklenen grounding sorgularını izleme; Ekim 2026 Topics Portfolio beta ile konu kümelerini değerlendirme imkânı. Hesapta yeterli veri varsa kullanılabilir; citation sayısı arama sıralaması veya ziyaret sayısıyla eşdeğer değildir. Kaynaklar: https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/ ; https://blogs.bing.com/webmaster/2026/10/introducing-topics-portfolio-beta-in-ai-performance/
4. **GEO için Google'ın resmî tavsiyesi:** Teknik SEO, erişilebilir indekslenebilir HTML ve özgün, kaynaklı, uzmanlık değeri taşıyan içeriğe odaklan. Google'ın üretken arama özellikleri için ayrı “sihirli işaretleme” gerekmiyor; `llms.txt` Google Search'te özel avantaj sağlamıyor. Başka servisler kullanıyorsa dosya korunabilir; sırf Google için çoğaltma, gereksiz “AI chunking” veya yapay bağlantı/atıf oluşturma yok. Kaynak: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

### TractorVS'ye uygulama ilkeleri ve kontrol edilebilir kabul koşulları
| Alan | Kanıta dayalı prensip | Kabul/ölçüm |
| --- | --- | --- |
| Teknik SEO | Yayınlanmış her modelin varyant/pazar/yıl/birim/kaynak kimliği ilk HTTP HTML'de görünür; robots, canonical, hreflang ve sitemap birbiriyle tutarlı olmalı | Örnek değil, ilgili değişiklik etkisindeki tüm URL'lerde ve 10 dilde uygun otomatik regresyon; canlı indeks verileri ayrı |
| GEO/içerik | Teknik soruları kaynak göstererek açık yanıtla, gerçek karşılaştırma ve sınırları açıkla; özgün analiz ekle; uydurma uzmanlık/puan/tecrübe yaratma | Kaynak URL + son kanıt tarihi + model/varyant kimliği; editoryal QA |
| Yapılandırılmış veri | Yalnız sayfada görünür, doğrulanmış içerik için uygun `Article`, `DiscussionForumPosting`, `ImageObject`, `WebPage` vb. kullan; sahte `Offer`, rating veya inceleme ekleme | Rich Results Test + gerçek HTML eşleşmesi, uygun sayfa türü ve yayın durumu |
| Çok dil | Her dil sayfası gerçekten yerelleştirilmiş içerik taşımalı; kendisi dâhil karşılıklı `hreflang` ve doğru canonical eşleşmesi olmalı | 10 dil × etkilenen sayfa türü: ters bağlantı, 200, indexable, doğal çeviri QA |
| Görsel keşfi | Tam model kimliğine uygun, lisansı/atıfı kanıtlı ve gerçek fotoğrafı kullan; açıklayıcı alt metin, sayfa bağlamı ve uygun çözünürlük sağla | Kaynak/izin kanıtı, görsel HTTP/MIME/hash, sayfa HTML, gerektiğinde GSC multimodal verisi |
| Performans | Gerçek kullanıcının 75. yüzdelik değerinde iyi hedefler: LCP ≤ 2,5 s; INP ≤ 200 ms; CLS ≤ 0,1. Laboratuvar ve RUM'u karıştırma | Mobil ve masaüstü ayrı CrUX/RUM; Lighthouse değişiklik regresyonu |
| Tasarım/erişilebilirlik | WCAG 2.2 AA hedefi; 10 dilde okunabilir metin, klavye/odak, dokunma alanı, kontrast, açıklayıcı hata; karşılaştırma filtresi kullanıcıyı şaşırtmamalı | axe-core + gerçek klavye/mobil akış testi, ekran görüntüsü, gerçek görev tamamlama; otomatik axe tüm WCAG'ı kanıtlamaz |
| Ölçüm disiplini | Sitemap gönderimi, erişim, tarama, indeksleme, gösterim, tıklama ve AI atıf/gösterim birbirinden farklıdır | Ölçüm türü, kaynak, tarih, kapsam, eksik veri ve olası gecikme ayrı kayıt |
| Güvenlik/gizlilik | Mevcut Supabase RLS, forum oturumları, analitik açık izin politikası, fotoğraf telifleri ve 10 dil korunur | Etki ve geri alma planı; test+CI; canlı değişiklikte üretim doğrulaması |

### Bağımsız güvenilir başvuru koleksiyonu
- Google temel SEO ve yararlı içerik: https://developers.google.com/search/docs/fundamentals/seo-starter-guide ; https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google JavaScript SEO ve çok dilli sayfalar: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics ; https://developers.google.com/search/docs/specialty/international/localized-versions
- Google görsel SEO ve forum JSON-LD: https://developers.google.com/search/docs/appearance/google-images ; https://developers.google.com/search/docs/appearance/structured-data/discussion-forum
- web.dev ölçümler ve yüksek etkili performans çözümleri: https://web.dev/articles/vitals ; https://web.dev/articles/top-cwv
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- MDN web performansı: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance
- Nielsen Norman Group UX heuristikleri: https://www.nngroup.com/articles/ten-usability-heuristics/
- Baymard filtreleme araştırması (e-ticaret bulgularını TractorVS **bilgi/karşılaştırma sitesi** bağlamına uyarlayarak): https://baymard.com/research/ecommerce-product-lists

### Tekrarlanabilir öğrenme döngüsü
1. Her TractorVS görevinde **önce güncel `AGENTS.md` ve ilgili repo belgeleri** okunur; bu not görev talimatlarının yerine geçmez.
2. Soruna karşılık gelen **resmî güncel kaynak** ve bağımsız deneysel bulgular denetlenir; kaynak tarihi/erişim tarihi ve önceki uygulamayla fark yazılır.
3. Önce mevcut kod ve canlı veri araştırılır; kök neden saptanmadan puan için değişiklik yapılmaz. Çözüm, beklenen fayda ve olası regresyon riskini içeren plan oluşturulur.
4. Toplu ama güvenli değişiklikler ayrı PR'da uygulanır; Playwright/axe, çok dilli SEO, güvenlik, fotoğraf lisansı ve yayın kuralları test edilir. Hesaptaki canlı ölçümler ancak erişim ve veri varsa raporlanır.
5. Sonuçlar `incelendi / değiştirildi / test edildi / ana dala birleştirildi / canlıda doğrulandı` olarak ayrı işaretlenir. Başarılı teknik ve tekrarlanmayı önleyecek regresyon testi repo belgelerine eklenir.
