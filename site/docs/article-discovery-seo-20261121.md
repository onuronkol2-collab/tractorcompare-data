# TractorVS — makale keşfi, dil bütünlüğü ve GEO/SEO bağlantı denetimi

**Tarih:** 21 Kasım 2026 · **Dayanak:** güncel `AGENTS.md`, canlı statik sayfalar, OpenSEO üzerinden Google Search Console URL Inspection ve Google Search Central.

## Doğrulanmış mevcut durum

- 10 makale merkezi zaten gerçek çevirilerle HTTPS 200, self-canonical, karşılıklı dil seçenekleri, `CollectionPage` / `ItemList` ve indekslenebilir HTML sunuyor.
- GSC URL Inspection, 21.11.2026 sorgusunda `/articles/` (EN) ve `/pt-br/articles/` için `Submitted and indexed`; `/tr/articles/`, `/zh/articles/`, `/hi/articles/`, `/fr/articles/`, `/de/articles/`, `/ru/articles/`, `/ja/articles/`, `/es/articles/` için `URL is unknown to Google` gösterdi. **Bu bir teknik hata kanıtı değildir**, yeni URL keşfi zamana bağlıdır; ne indekslenme ne de sıralama garantidir.
- Search Console geçmiş 28 gün `/guides/` filtresi mevcut sorguda sıfır satır döndü. Bu sonuç toplam SEO trafiği için sıfır demek değildir.
- OpenSEO'nun önceki 50 URL taraması tüm kataloğu kapsamıyor. Yeni tarama için ücretli gereksiz SEO denemesi ve çok sayıda düşük değerli kopya sayfa oluşturulmadı.
- Ana menü ve footer zaten makale merkezlerine link veriyordu. Eksik olan, ana sayfa **kendi gövde metninde**, gerçek içerikle ilgili makale bağlantısı ve 8 ek dilde model verilerini okuyan kullanıcı için kendi dilinde açıklayıcı rehber bağlantısıydı.

## Değişiklikler

1. `HomeExperience.astro`: 10 dilde, sunucu tarafından HTML olarak üretilen ve ana sayfa gövdesine yerleştirilen bir **kaynaklı makaleler** bölümü. Arşivin gerçek başlıkları/özetleri kullanıldı: yerel `/articles/`, tam metni gerçekten mevcut yerel `/guides/choosing-a-tractor/` ve `/reviews/basak-2075-bk/`. İçeriği olmayan dil URL'si, sözde yeni makale veya tekrar edilen teknik rakam eklenmedi. Site üstündeki katalog/karşılaştırma/asistan işlevleri değişmedi.
2. `TractorDetail.astro`: EN/TR'de mevcut 96 terimli **orijinal iki dilli teknik sözlük** banner'ı korunuyor. Diğer 8 dilde yalnız var olan ve içeriği çevrilmiş yerel traktör seçim rehberi gösteriliyor. Mevcut model kaynakları, specs, forum ve RLS etkilenmiyor.
3. `home-experience.css`: masaüstünde 2 sütun, mobilde 1 sütun; klavye `focus-visible`, okunabilir metin ve mevcut sage/green tasarımına uyum.
4. Node testleri 10 dilde **geçerli URL, çeviri matrisi, CSS mobil kuralları ve sahte çeviri üretmeme** koşullarını kontrol ediyor. Playwright, 10 ana sayfanın gerçek SSR linkleri ve iki temsilî model için gezinme testi gerçekleştiriyor.

## Sınırlar ve geri alma

- `Googlebot`, `OAI-SearchBot`, `robots.txt` mevcut izinleri ve Search Console bağlamı korunuyor; yeni sitemap kopyası, sahte `lastmod` veya botlara özel farklı HTML oluşturulmadı.
- Google 2026 AI Search optimizasyon rehberi, özel llms.txt/hile yerine kullanıcıya gerçekten yararlı, kaynaklı ve erişilebilir içeriği öneriyor. Burada takip edilen hedef **daha iyi erişilebilir gezinme ve keşif**, yapay zekâ sıralama iddiası değil.
- 32 eksik tam metin dil kombinasyonu hâlâ yoktur; `draft` çeviri çalışması, bağımsız dil/teknik QA bitmeden ana dala alınmaz.
- Sıradaki doğrulama: GitHub CI Node+Astro+CodeQL+Playwright/axe; merge sonrası Cloudflare canlı 10 dil ana sayfalarında linkler ve model örnekleri, ardından GSC'nin tarihiyle beraber indeks kontrolü. GSC URL Inspection geçmiş durumdur; canlı güncelleme anlamına gelmez.
- Geri alma: ilgili PR squash commit'i revert edilir, eski HTML navigasyonu geri gelir. Supabase / veri onayı / forum moderasyon / fotoğraf lisansı / analitik izni değişmez.

## Resmî kılavuzlar

- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/search/docs/specialty/international/localized-versions
