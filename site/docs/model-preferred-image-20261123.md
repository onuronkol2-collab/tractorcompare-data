# TractorVS onaylı fotoğrafların Google görsel önizlemesi — 23 Kasım 2026

## Doğrulanmış araştırma
- Google Search Central'ın **2 Mart 2026** tarihli doküman güncellemesi, Search/Discover görsel önizlemesinde ilgili, temsil edici tercih edilen resmi belirtmek için **schema.org `primaryImageOfPage`** veya **`og:image`** kullanılabileceğini açıklıyor. Google seçimi otomatiktir; hiçbir işaretleme gösterim veya sıralama garantisi vermez.
  Kaynaklar: https://developers.google.com/search/updates ; https://developers.google.com/search/docs/appearance/google-images#specify-a-preferred-image-with-metadata
- Google Discover, ilgili ve kaliteli fotoğraflar için **en az 1200 px genişlik**, **300.000'den fazla piksel** ve `max-image-preview:large` öneriyor. Orijinal fotoğrafın gerçek boyutları bu koşulları sağlamıyorsa yol adında `-1920` yazması yeterli değildir; o fotoğrafı hak etmediği kadar yüksek çözünürlüklü sayma. Fotoğrafı yapay olarak kırpma/büyütme veya uygunsuz görsel kullanma.
  Kaynak: https://developers.google.com/search/docs/appearance/google-discover
- Kullanıcı tarafından üretilen spam için **26 Ekim 2026** Google rehber değişikliği de incelendi. `ForumInline.astro` tüm kullanıcı URL'lerini zaten `rel="ugc nofollow noopener noreferrer"` ile etiketliyor; forum yayını `isIndexableForumTopic` ve moderasyon kapılarına bağlı. Bu güvenli uygulamaları aynen koru; spam içeriklerine SEO görünürlüğü kazandırmak için yeni `og:image` veya `DiscussionForumPosting` ekleme.
  Kaynak: https://developers.google.com/search/docs/monitor-debug/prevent-abuse

## Kaynak kodu karşılaştırması
- `site/src/lib/model-seo.ts` bugün onaylı fotoğraf varsa `WebPage.primaryImageOfPage` öğesini `#photo` `ImageObject` düğümüne bağlar, `contentUrl` olarak `photo.fullUrl` (birinci taraf `/images/tractors/{fileId}-1920.jpg`) kullanır; fotoğrafçı, lisans ve fotoğrafa özgü kaynak bağlantıları korunur.
- `site/src/components/TractorDetail.astro` mevcut `ogImage` adresi için aynı onaylı fotoğrafın daha küçük `displayUrl` (`-960.jpg`) sürümünü kullanıyordu. Aynı onaylı model fotoğrafında yüksek çözünürlüklü `fullUrl` ile eşleştirildi. Sahte yeni fotoğraf, genel logo veya başka modele ait görsel eklenmedi.
- `site/src/layouts/SiteLayout.astro` zaten `max-image-preview:large` ve `ogImage` varlığında `og:image`/Twitter image yazar. İlk ekranda indirilen `img` LCP görselinin `srcset`, `sizes`, `eager` ve `fetchpriority` ayarları **değiştirilmedi**; meta OG kaynak adresini yükseltmek LCP kazancı olarak bildirilmez.
- `site/src/lib/tractor-photos.ts`: birinci taraf `fullUrl` yalnız `APPROVED_TRACTOR_PHOTOS` fotoğrafları için mevcut, `resolveApprovedPhotoSource` kaynak alan adı ve destekli Commons boyutunu denetliyor. Kaynağın orijinal genişliği düşükse daha büyük URL gerçek çözünürlük kazandırmaz. Lisans dosyaları ve HTTP/image türü kontrolleri yayın öncesi kapılarda korunur.

## Regresyon testleri ve kabul şartları
1. `site/tests/model-preferred-image-20261123.test.mjs` onaylı model için `WebPage.primaryImageOfPage` referansının aynı `ImageObject.contentUrl` (birinci taraf tam görsel) ile eşleştiğini **10 dilde** doğrular. Eşleşmeyen traktörde fotoğraf/thumbnail schema oluşturulmaz.
2. Aynı test `TractorDetail.astro` şablonunun `og:image` için yalnız onaylı `cover.fullUrl` verdiğini; `SiteLayout`'ın `og:image`/Twitter meta etiketlerini sadece fotoğraf varsa ürettiğini; `max-image-preview:large` kullandığını kontrol eder.
3. Önce ilgili Node testi, tam `npm test`, Astro/Cloudflare build, üretim güvenlik kapısı, Altın Kural, fotoğraf kimliği ve lisans testleri. Cloudflare gerçek yayın gerekiyorsa **dağıtımı ayrıca** doğrula. Google görsel seçimi ve Search Console indeks verisi anında kanıtlanmış sayılamaz.
4. Bir görsel `404`, yanlış MIME, kayıp dosya/hash, yanlış model kimliği veya lisans uygunsuzluğu gösterirse yayın başarısız sayılır; fotoğrafı uygunsuz diğer fotoğrafla doldurma ve testleri bypass etme. Geri alma tek dosyada `cover.fullUrl` → önceki `cover.displayUrl` değişikliğiyle ve tekrar CI + canlı doğrulamayla yapılabilir.

## Açık koşullar
- Bu PR teknik bir **önizleme tutarlılığı** düzeltmesidir, Google'ın gerçek fotoğrafı önizleme olarak seçtiğini veya Discover gösterimi kazanıldığını kanıtlamaz.
- Her fotoğrafın kaynak boyutu, lisans uygunluğu ve canlı 1920 URL sağlığı mevcut toplu fotoğraf yayın/SEO testleriyle doğrulanmalıdır. 1200 px Discover gereği tüm fotoğraflar için kendiliğinden sağlanmış sayılmaz.
