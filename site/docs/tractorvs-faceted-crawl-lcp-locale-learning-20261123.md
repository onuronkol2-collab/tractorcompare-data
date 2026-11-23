# TractorVS — Filtreli URL taraması, görsel LCP ve 10 dil: kaynaklı öğrenme kaydı

**Araştırma ve kod okuma tarihi:** 23 Kasım 2026. **Durum:** Resmî dokümantasyon + ana dal kaynak kodu incelendi; bu belge herhangi bir yeni performans testi, GSC indeksi, canlı dağıtım veya üretim değişikliğinin yapıldığı anlamına gelmez.

## 1. Google'ın faceted navigation kuralı — filtreli katalog URL'lerinin yönetimi

**Kaynak:** Google Crawling Infrastructure, *Managing crawling of faceted navigation URLs* (18 Aralık 2025 güncellemesi):
https://developers.google.com/crawling/docs/faceted-navigation

- Marka, güç, yıl, sıralama gibi filtrelerin her kombinasyonu ayrı `?brand=...&power=...&year=...` URL'si üretiyorsa kombinasyon sayısı büyüyebilir. Google, bunun gereksiz taramaya ve gerçek model sayfalarının geç keşfedilmesine yol açabileceğini açıkça bildiriyor.
- **Filtreli URL'ler bağımsız bir arama hedefi değilse**, kaynak tüketimini azaltmak için Google, ilgili facet URL'lerinin `robots.txt` ile taramadan dışlanmasını ya da uygun kullanımda `#fragment` temelli filtreleri öneriyor. **Ancak** bu seçenekler kullanıcının paylaşılabilir bağlantıları, dil geçişleri ve işlevselliği korunarak, mevcut gerçek log/GSC ölçümlerinden sonra değerlendirilmelidir. Değerli marka/model/rehber sayfalarına veya tüm sorgu parametrelerine körlemesine `Disallow` ekleme.
- `rel=canonical`, filtreli varyasyonların ana URL ile ilişkisini belirtebilir fakat Google'a göre **tek başına tarama hacmini hemen durdurmaz**. Canonical bir sinyaldir; robots yasağıyla aynı işlevi görmez. Robots ile engellenmiş bir sayfanın HTML canonical/noindex direktifini Google'ın okuyacağını varsayma.
- Filtreli URL'lerin indekslenmesi gerçekten isteniyorsa URL parametreleri standart `&` ile ayrılmalı; path facet sırası sabit, geçersiz/tekrarlı kombinasyonlar ve sonu olmayan sayfalama kontrol altında olmalı. Gerçek sunucu tarafından sunulan sonuçsuz filtreli sayfa varsa Google `404` tavsiye ediyor; yalnız istemci tarafı filtrelenip filtresiz `200` HTML sunuluyorsa körlemesine her boş istemci görünümünü sunucu hatası sayma. İşlevsel bağlantı ve erişilebilirlik korunmalı.
- Crawl bütçesi optimizasyonu otomatik sıralama artışı garantisi değildir. Önce Googlebot log/Cloudflare olayları, GSC sayfa indeks raporu ve kanonik URL örnekleri incelenmeli.

**Ana dal kodunda saptanan durum (salt-okunur):** `site/src/components/TractorCatalog.astro` içinde URL parametreleri `q`, `brand`, `power`, `year`, `sort` ile `history.replaceState` kullanılarak korunuyor; aynı bileşen bütün yayımlanmış model bağlantılarını önceden işlenmiş HTML'de tutuyor. `site/src/layouts/SiteLayout.astro` canonical URL'yi `Astro.url.pathname` ile temiz URL'den üretiyor. `site/src/pages/robots.txt.ts` üretim yapılandırmasında genel Allow + sitemap kayıtlarını yayımlıyor. **Bu inceleme henüz Google'ın bu filtreli URL'leri aşırı taradığına kanıt sağlamıyor.** Bu nedenle otomatik robots değişikliği, facet yapısını bozma veya noindex ekleme yapılmadı.

**İleride eylem gerektiğinde kabul kriteri:** (a) GSC / bot erişim logu gerçek gereksiz taramayı gösterir; (b) model ve marka sayfalarının 200/canonical/hreflang/sitemap yolları bozulmaz; (c) `q/brand/power/year/sort` paylaşımı, yenileme ve 10 dil geçişi korunur; (d) yeni robots kuralı uygulanacaksa gerçek `robots.txt` çıktısı ve öncesi-sonrası taranabilirlik bot testi ile doğrulanır.

## 2. web.dev LCP: ilk büyük traktör fotoğrafının yüklenmesi

**Kaynak:** web.dev, *Optimize Largest Contentful Paint*:
https://web.dev/articles/optimize-lcp/

- Kritik ilk ekran fotoğrafı ilk HTML'de `img src/srcset` olarak bulunmalı. JavaScript ile sonradan oluşturma veya sayfa üstü LCP adayına `loading=lazy` vermek indirmeyi geciktirir.
- LCP görseli gerçekten önemli olduğunda `fetchpriority=high` kullanılabilir. Bunu çok sayıda görsele koymak ağ önceliklendirmesini etkisizleştirir. Görünmeyen ikincil görsellere lazy, ilk ana görsele eager tercih edilir. Kopya preload/yeni origin eklemeden önce Chrome network waterfall ve RUM ile ölçülür.
- En iyi dosya formatı, `srcset/sizes`, sabit `width/height`, cihazın ihtiyacına uygun veri boyutu ve önbellek politikası birlikte değerlendirilir; lisansı veya görsel hash/kimliğini kaybetmeden değişiklik yapılır.

**Ana dal kodunda saptanan durum (salt-okunur):** `site/src/components/TractorPhoto.astro` içinde `mode=hero` ve `index=0` için halihazırda `loading=eager` + `fetchpriority=high`, `srcset/sizes`, `width/height` var; diğerleri lazy. Onaylı mobil JPEG/WebP varyantları `approvedMobilePhotoFormats` üzerinden eşleniyor. **Bu doğru davranış yeniden yazılmasın.** İleride ölçüm yapılırken fotoğrafı olmayan modeller, mobil/masaüstü ve gerçek p75 LCP verisi ayrı tutulmalı; burada henüz yeni bir saha iyileşmesi ölçülmedi.

**Kabul kriteri:** 10 dilde ilgili model sayfalarında ilk görselin HTML'den keşfi, fotoğraf kimliği/atfı/lisansı, 200/MIME/hash, responsif kaynaklar ve Lightbox korunmalı. Lighthouse ve RUM ayrı raporlanmalı.

## 3. Gerçek 10 dil içeriği ve karşılıklı hreflang

**Kaynaklar:** Google Search Central, *Localized versions of your pages* ve *How Google crawls locale-adaptive pages*:
https://developers.google.com/search/docs/specialty/international/localized-versions
https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages

- Gerçek çevirisi bulunan **ana içerik** farklı dil sürümü olabilir. Menü, başlık veya footer çevrilirken ana gövde aynı dilde kaldıysa Google bunu yinelenen içerik sayabilir. Bir dil etiketi tek başına içerik dilinin kanıtı değildir.
- Google, `hreflang` için kendisi dahil her dilin tam nitelikli URL'sini ve karşılıklı bağlantısını ister. Yalnızca gerçekten var olan, yayımlanmış, kendisi canonical olan, erişilebilir dil sürümlerini birbirine bağla. Hatalı, noindex/taslak veya aslında çevrilmemiş sürümü SEO için varmış gibi sunma. `x-default` yalnız uygun varsayılan hedefi göstermeli.
- Yalnız IP/Accept-Language ile farklı içerik döndürmek risklidir; Googlebot çoğu zaman `Accept-Language` belirtmez. Ayrı locale URL'leri korunmalı, otomatik yönlendirme botları ve kullanıcıların dil tercihlerini kilitlememeli.

**Ana dal kodunda saptanan durum (salt-okunur):** `site/src/layouts/SiteLayout.astro` canonical URL ve `indexableLocales` üzerinden `hreflang` alternatiflerini oluşturuyor. Bu yapının varlığı, her sayfada gerçek tam çeviri olduğunu tek başına kanıtlamaz. Forum ve makale yayınında daha önceki bağımsız çeviri/review kapıları korunmalı; 10/10 menü çevirisini tam içerik çevirisi olarak değerlendirme.

**Kabul kriteri:** Etkilenen sayfa türlerinde gerçek ana dil içeriği kontrolü, doğru 200/canonical/noindex durumu, karşılıklı `hreflang`, aynı model/varyant kimliği, dil seçimi ve erişilebilir bağlantı doğrulaması. Botun hangi dilde HTML aldığını canlı ağ testi ile değerlendir.

## Öğrenilenleri yeni işlerde kullanma

Sıralama: (1) gerçek kanıt ve kullanıcı sorunu, (2) etki + regressyon riski, (3) kaynak ve çözüm önerisi, (4) mevcut PR/otomasyon çakışma kontrolü, (5) güvenli kod değişikliği/CI, (6) canlı doğrulama ve zaman içinde gerçek GSC/RUM gözlemi. AGENTS.md ve mevcut yayın/güvenlik kuralları her zaman geçerlidir. Bu belge **bulgu kaydıdır, açık bir üretim değişikliği talimatı değildir**.
