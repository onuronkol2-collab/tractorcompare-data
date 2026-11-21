# TractorVS — Makale kalitesi / SEO / GEO yayın kontrolü (21 Kasım 2026)

Bu kontrol listesinde depo kökündeki [AGENTS.md](../../AGENTS.md) altın entegrasyon kuralı esastır. Araştırma içeriği, kullanıcı deneyimleri, üretici broşürleri, bağımsız saha testleri ve laboratuvar ölçümleri birbirine eşitlenemez.

## Makale arşivi

- Makale arşivi **10 dilde** yerelleştirilmiş metin ve altı gerçek içerik için kürasyon sunar. Ancak uzun makale gövdesinin çeviri kapsamı ayrıdır: seçim rehberi ve Başak 2075 BK analizi 10 dilde, diğer dört uzun makale yalnız TR/EN sürümündedir. Diğer 8 dildeki arşiv sayfaları bu dört yazı için açıkça İngilizce tam metin etiketi ve gerçek İngilizce URL'si gösterir; olmayan dil URL'si üretmez.
- Arşive yeni bir yazı, gerçek URL ve tüm yayın kontrolleri tamamlanmadan alınmaz. 2026–2027 arıza araştırması PR #213 ve ansiklopedi PR #127 taslaktır; yalnızca PR var diye arşivde bağlantı oluşturulmaz.
- Gerçek çalışma saatleri, arıza olayları, kullanıcı şikâyetleri, şikâyet/100 traktör ve en az bir kez arıza yapan araç/100 traktör aynı metrik değildir; örneklem ve gözlem süresi olmadan marka sıralaması yapılmaz.
- İçerik, doğrulanabilen özgün açıklama ve gerçek kullanıcı yararı üretmelidir. Alıntı, görsel, kaynak tarihleri ve lisans kontrolü yapılır; yapay yazar adı, deneyim ve sahte laboratuvar testi yazılmaz.
- Açık olarak farklı varyant, ülke, model yılı ve test standardı karşılaştırılmadan teknik değer kesinleştirilmez.

## Yayın güvenlik kapısı

1. Güncel AGENTS.md, PR/CI ve kod durumunu okuyun. Değişiklikleri önce ayrı branch ve PR üzerinden inceleyin.
2. Node testleri, Astro üretim derlemesi, `PUBLIC_INDEXING_ENABLED=true` / `SITE_URL` ile canonical, hreflang, robots ve sitemap kontrolü yapın. `CollectionPage`, `ItemList`, `BreadcrumbList` ve `TechArticle` JSON-LD görünür HTML ile uyuşmalı.
3. Playwright Chromium/Firefox/WebKit/mobil, klavye erişimi, responsive görünüm ve axe-core testlerini çalıştırın. Ciddi/kritik erişilebilirlik hatası veya güvenlik açığı varsa otomatik yayın yapmayın.
4. Birleştirmeden sonra gerçek canlı URL HTTP 200, sayfa başlığı, indeksleme izni, sitemap, dahili linkler ve Search Console görünümünü doğrulayın. CI geçişi **canlı dağıtım kanıtı değildir**.
5. Her makalede *kaynak, üretici beyanı, bağımsız doğrulama, yöntem, tarih ve belirsizlik* açık tutulmalıdır. Yalnız kelime artırmak veya yapay zekâ sonucu elde etmek için içerik çoğaltmayın.

**Geri alma:** Bu geliştirme dalındaki GitHub commit'i revert edilir; Supabase veri ve RLS kuralları, forum moderasyonu ve analitik izinleri değişmez.

**Resmî referanslar:** Google Search Central [AI arama optimizasyonu](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article), [BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb). Google indeksleme veya GEO görünürlüğü garanti edilmez.
