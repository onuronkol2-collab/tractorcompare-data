# TractorVS — Google Discover ve sosyal önizlemede onaylı büyük traktör fotoğrafı

**Tarih:** 23 Kasım 2026. **Kapsam:** yalnızca model detayındaki `og:image` / `twitter:image` için seçilen fotoğraf URL'si, tersine regresyon testleri ve kalıcı AGENTS.md kuralı.

## Resmî kaynak / açıklama

- Google Search Central Discover: https://developers.google.com/search/docs/appearance/google-discover . Büyük görseller için en az 1.200 piksel genişlik, uygun çözünürlük ve sayfayla gerçek ilişki önerilir. `max-image-preview:large` ve `og:image`/schema.org görsel tercihini destekler. 16:9 otomatik kırpma emri değildir.
- Google görsel SEO: https://developers.google.com/search/docs/appearance/google-images . Sayfa HTML'sindeki `img/srcset`, gerçek görsel bağlamı, crawl erişimi ve kalite önemlidir.
- Google görsel lisans bilgisi: https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata . `contentUrl` fotoğrafla eşleşmelidir; `license` ve fotoğrafçı/hak sahibi bilgisi uydurulamaz.
- Görsellerin Discover veya Google Images'ta gösterimi **garanti edilemez**; gerçek sonuç için Search Console/Googlebot kanıtı gerekir.

## Kök neden: koddan doğrulanan durum

1. `TractorDetail.astro` önceden `primaryTractorPhoto(tractor)` dönen onaylı fotoğrafın `displayUrl` adresini (birinci taraf `-960.jpg`) `ogImage` prop'una veriyordu.
2. `SiteLayout.astro`, aynı `ogImage` değerini `og:image` ve `twitter:image` olarak işliyor; indekslenebilir sayfalarda `max-image-preview:large` robots zaten etkin. Yeni robots/meta eklenmedi.
3. `model-seo.ts`, aynı birincil fotoğraf için `ImageObject.contentUrl` olarak `fullUrl` (birinci taraf `-1920.jpg`) kullanıyor. Bu var olan güvenli photo proxy kimlik ve lisans denetimlerini sürdürüyor.
4. `TractorPhoto.astro` ilk hero görselini `eager/fetchpriority=high` ve `srcset` ile servis ediyor. Bu kritik yüklemeye dokunulmadı.

## Uygulama kararı ve savunmacı koşullar

- `preferredTractorPreviewUrl(photo)` yalnızca zaten eşleşmiş `TractorPhoto` kaydı alır. Fotoğraf yoksa `null` döndürür; sahte/varsayılan bir traktör fotoğrafı üretmez.
- Kaynak en-boy bilgilerinde `width >= 1200`, pozitif ve sonlu `height` varsa mevcut `fullUrl` (`-1920.jpg`) önizlemeye seçilir. Daha küçük kaynaklarda mevcut `displayUrl` (`-960.jpg`) kalır. URL sonundaki 1920, kaynağın mutlaka tam 1920 genişlikte olduğu iddiası değildir: Worker küçük orijinali servis edebilir.
- `og:image`, `twitter:image` aynı onaylı fotoğraf URL'sini kullanır; JSON-LD `ImageObject.contentUrl` yüksek çözünürlük kaynağının kimliğini korur. Görselin sayfadaki görünümü, Lightbox, lisans, model/UUID sınırı, fotoğraf kaynak kanıtı ve 10 dil değişmez.
- Küçük veya dar/dikey fotoğrafları sırf Discover için 16:9 kırpma, sahte fotoğraf telif beyanı, yeni CDN/ücretli image resize ekleme yok.

## Test ve canlı yayın kapıları

- `site/tests/tractor-og-image-preview-20261123.test.mjs`: tüm onaylı fotoğraflarda kaynağın gerçek boyutuna göre seçim; gerçek birinci taraf proxy çözümlemesi; fotoğrafı olmayan model, küçük fotoğraf ve 10 dilde `ImageObject` aynı kimliği korur.
- `site/tests/tractor-photos.test.mjs`: bütün model/UUID kimlikleri, kaynak ve lisans kayıtları, dönüştürme/thumbnail proxy korumaları.
- `site/tests/model-seo.test.mjs`: ürün/teklif/sahte rating olmadığını ve model alanlarını doğrular.
- Üretim paketi: Astro, 10 dil, sitemap/canonical/hreflang, Cloudflare Worker ve CI yeşil olmadan merge yok.
- Merge, deploy ve canlı gözlem birbirinden ayrı değerlendirilir: canlı üretim HTML `og:image`, Twitter kartı, `200`/MIME ve görsel boyutu doğrulanmadan “canlıda doğrulandı” denmez. Google'ın yeniden taraması ve gerçek Discover gösterimleri garanti edilmez.

**Geri alma:** yalnızca bu PR'ın uygulama kodu değişikliklerini revert ederek eski `-960.jpg` sosyal önizleme davranışına dön; diğer traktör fotoğrafı varlıklarını silme.
