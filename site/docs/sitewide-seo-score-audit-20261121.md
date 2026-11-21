# TractorVS — site genelinde SEO 100 puanı ve taranabilirlik kalite kapısı

**Denetim tarihi:** 21 Kasım 2026 · **Bağlam:** güncel `AGENTS.md`, dört bağımsız OpenSEO HTML+Lighthouse taraması, canlı kaynak kodu ve tüm dizin için zaten mevcut üretim sitemap tarayıcısı.

## Gerçek durum: “Lighthouse 100” ≠ “Google'da iyi indekslenme”

Bu raporda üç şeyi ayırıyoruz:

1. **Lighthouse SEO puanı (0–100):** Bir URL'nin belirli bir laboratuvar koşulunda standart teknik kontrolleri. Zamana, tarayıcıya ve hangi denetimlerin etkin olduğuna göre değişebilir; sıralama garantisi değildir.
2. **İndekslenebilirlik ve kanonik dizin:** 10 dil, yüzlerce model ve binlerce dil URL'sinde canonical, hreflang, H1, robots ve sitemap bütünlüğü. Bunlar sayfa sayısı nedeniyle yalnız Lighthouse örneğiyle kanıtlanamaz.
3. **Search Console indeks ve arama performansı:** Google'ın keşfetmesi ve dizine eklemesi ayrıdır; 100 Lighthouse puanı Google'da otomatik indeksleme demek değildir.

Bazı dilde boş forum arşivleri **bilerek noindex** tutulur. Böyle sayfaların Lighthouse SEO indekslenebilirlik puanını zorla artırmak için açılması veri ve kullanıcı güvenini zedeler; **bu yapılmadı**.

## Canlı bağımsız taramalar (OpenSEO)

| Audit ID (başlangıç) | Gezinilen sayfa sınırı | Lighthouse başarılı | Lighthouse başarısız |
|---|---:|---:|---:|
| `2010ea89-1ccb-4ed0-b97d-a1580bcdc496` (/) | 50 | 1/20 | 19/20 |
| `0156a258-dd94-46e5-b86e-7d8cf7a7938b` (/articles/) | 35 | 11/20 | 9/20 |
| `535ac34a-c1de-415e-a600-e21ba6c7c6e3` (/tr/farm-advisor/) | 35 | 11/20 | 9/20 |
| `553c9947-c3bd-43eb-a3f9-05994748a636` (/tr/forum/) | 35 | 10/20 | 10/20 |

Dört audit'te **33/80 Lighthouse örnek sonucu döndü**; dönenlerin hepsinde **Lighthouse SEO = 100**. Kalan **47** ölçüm, açık `INSUFFICIENT_CREDITS` hatasıyla bitti; bunlar SEO 0 ya da sayfa hatası **değildir**. Aynı modelin farklı denetimlerde tekrar ölçülmesi mümkündür; 33 benzersiz URL veya 155 benzersiz sayfa diye raporlanmamalıdır. Ek ücretli çağrı yapılmadı.

HTML crawllarının uyarılarında kritik SEO sorunu görülmedi. Info düzeyinde bazı model başlıkları 60 karakteryi, iki Çince model snippet'i OpenSEO'nun 70 karakter eşiğini aşıyor/altında kalıyor; bunlar Google'ın sert sınırları değildir. Üretici/yıl/pazar/varyant bilgisi kaybına yol açacak title/description kısaltması yapılmadı.

Güncel canlı spot-check kapsamı: EN/TR/ZH ana sayfalar; EN/TR katalog, karşılaştırma, asistan, forum, makale merkezi; EN sözlük, TR teknik makale, DE model ve DE model incelemesi — bunlarda URL'ler 200, gerçek indekslenebilirlerde tek canonical/H1, resimlerde `alt` mevcuttu. `/forum/` İngilizce bilinçli `noindex,nofollow` idi. Tüm üretim URL'lerinde Lighthouse çalıştığı iddia edilmiyor.

## Bu PR'daki somut düzeltme ve ölçüm disiplini

1. **Küçük şablon yerine tüm sayfa türleri:** Mevcut, ücretsiz, haftalık GitHub mobil Lighthouse akışı 4 yerine **14 farklı şablon/dil örneği** ölçer: TR home/catalog/model/compare/advisor/articles/selection/review/forum; EN glossary/home; ZH home; DE model; JA guide. Her sayfanın gerçek SEO alt-denetimleri `seoFindings` ile raporlanır ve **100'ün altında başarılı bir ölçüm varsa workflow hata verir**. Ölçülemeyen sonuç 100 sayılmaz.
2. **Tüm dizin URL'lerinde ücretsiz teknik kontrol:** Var olan `site/scripts/production-seo-audit.mjs` zaten üretim sitemap-indeks içindeki gerçek URL'leri GET ile dolaşıp başlık, H1, self canonical, hreflang, dil, robots, model şemasını kontrol ediyordu. Buna tüm sitemap URL'lerinde görünen **`<main>` landmark**, `<main>` içindeki her `<img>` için **alt özniteliği (boş dekoratif alt geçerli)**, **tüm sayfa türlerinde parse edilebilir JSON-LD** kontrolleri eklendi. Bu **Lighthouse 100 ölçümü değil**, otomatik teknik regresyon taramasıdır.
3. **Gerçek kaynak olmadan kaynak linki uydurmamak:** Paylaşılan fotoğraf lightbox artık HTML'e href'siz iki `<a>` koymuyor. İzinli fotoğraf düğmesine basılıp kaynak ve lisans HTTPS/HTTP URL'si doğrulandığında bağlantıyı JavaScript oluşturuyor. Karşılaştırmada fotoğrafı olmayan gizli panellerin `href` alanı varsa gerçek katalog sayfasına döner; fotoğraf varsa gerçek kaynak URL'si korunur. Asıl kullanıcı lisans bağlantısı ve modal davranışı aynıdır.
4. **Regresyon testleri:** Görsel `alt` için gerçek HTML fixture'ları (dekoratif boş `alt` dahil), test edilen gerçek kaynak URL'si olmadan modal linki olmaması, karşılaştırmadaki görünmeyen panel fallback'i, 14 rota ve SEO altında kalan Lighthouse audit kimliklerinin doğru işlenmesi.

## Tam sitemap ve ilk ücretsiz 14-şablon Lighthouse sonucu

**GitHub PR kalite koşusu:** `mobile_lighthouse` iş akışı (`job 136928507213`) 14 indekslenebilir gerçek sayfayı Lighthouse v12.8.2 mobil simülasyonuyla ölçtü. **14/14 SEO = 100 ve 14/14 alt SEO audit bulgusu = 0**; bu tüm üretim URL'lerinin ayrı ayrı ölçüldüğü anlamına gelmez.

| Temsilî sayfa | Lighthouse SEO | Performans | Erişilebilirlik |
|---|---:|---:|---:|
| TR ana sayfa | 100 | 99 | 100 |
| TR katalog | 100 | 98 | 100 |
| TR Belarus model | 100 | 95 | 100 |
| TR karşılaştırma | 100 | 99 | 100 |
| TR traktör asistanı | 100 | 99 | 100 |
| TR makaleler | 100 | 100 | 100 |
| EN teknik sözlük | 100 | 95 | 100 |
| TR seçim rehberi | 100 | 100 | 100 |
| TR Başak incelemesi | 100 | 100 | **96** |
| TR forum | 100 | 98 | 100 |
| EN ana sayfa | 100 | 99 | 100 |
| ZH ana sayfa | 100 | 99 | 100 |
| DE Antonio Carraro model | 100 | 96 | 100 |
| JA seçim rehberi | 100 | 100 | 100 |

Başak incelemesinde **SEO 100 ama erişilebilirlik 96**: Lighthouse `review-overline` etiketinde ön plan `#438253`, arkaplan `#f7faf5` ve **4.37:1 kontrast** ölçtü. Gerçek yeni teknik kaynak uydurmadan bu açık-zemin etiketi `#315f3d` yapıldı. Sonraki ölçüm canlı dağıtımdan sonra doğrulanacak.

**Tam sitemap dry-run** (`inspect` job `136928506290`): canlı `3880/3880` URL HTTP, yapı, model kimliği ve dil tutarlılığı kontrolünden geçti; `3790` model detay URL'si (`379` marka-model kaydı × 10 dil), `40/40` editoryal URL sitemap'te. **Tek yeni hata grubu:** her on dilde iki karşılaştırma boş resim önizlemesinin `alt` özniteliğinin denetim tarafından eksik sayılması (**20 kayıt**). Canlı HTML'de `alt=""` görülmesi nedeniyle bunun bilinçli dekoratif boş alt ile gerçek eksik arasındaki farkı kesinleştirmeden “20 bozuk resim” denmemeli. Yeni model önizlemesi artık, gerçek fotoğraf olmadığında, her dilde `photoText(lang,"pending")` açıklamasını kullanıyor; tam canlı audit merged-main deploy sonrasında tekrar çalışacak.

**PR/production ayrımı:** `inspect` iş akışı bir PR'da yalnız o anda canlı eski HTML'i denetlediği için, henüz yayımlanmamış düzeltmenin yokluğunu beklenmedik test hatası yapmamak adına tam **3.880-URL strict live audit** PR öncesi yerine main merge/schedule/manuel koşusunda çalışır. PR'daki Node/Playwright/Astro/CodeQL üretim paketi testleri açık ve aktiftir. Ana dala alınan kodun canlıya ulaşması ve bütün alt denetimlerden geçmesi ayrıca raporlanır.

## Sonuç sınırları / yayın ve geri alma

- Güvenli yayın için GitHub Node, Astro, Cloudflare üretim, CodeQL, Playwright Chromium/Firefox/WebKit ve mobil/axe-core, canlı sitemap audit ve haftalık mobil Lighthouse testlerinin sonuçları ayrı kontrol edilir.
- **100 Lighthouse sonucunu tüm 3.800+ URL için vaat etmiyoruz:** Tek tip model şablonu ve sitemap genel linter'ı siteyi genişlemesine göre korur, ama her URL'yi hızla Lighthouse'ta çalıştırmak parasal ve zaman maliyetidir.
- Yeni otomasyon kurulmadı; mevcut haftalık ölçüme odaklanıldı. Google indeks sırası, GSC performansı, organik trafik veya AI alıntılanması garanti edilmiyor.
- Supabase, RLS, 10 dil içeriği, kullanıcı girişi, veri/fotoğraf lisansı, Cloudflare analitik izinleri ve yayın politikaları değişmedi.
- Revert: Bu PR'ın squash commit'i tek başına geri alınabilir.

Kaynaklar:
- https://developer.chrome.com/docs/lighthouse/seo/
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
