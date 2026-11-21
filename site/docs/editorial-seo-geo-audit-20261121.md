# TractorVS makale bölümü — SEO / GEO / özgünlük derin denetimi

**Tarih:** 21 Kasım 2026 · **Kapsam:** `/articles/` ve dokuz çeviri arşivi; gerçekten yayımlanmış altı uzun yazı (iki tanesi 10 dil, dördü TR/EN); kaynak ve link hiyerarşisi.

## Yönetici özeti

- **Doğru olanı koru:** 10 arşiv yerelleştirilmiş, ayrı canonical/hreflang, gerçek kullanıcı metni ve altı doğrulanabilir yazı bağlantısı içeriyor. Dört yazının diğer sekiz dildeki tam metinleri **yoktur**; İngilizce tam metin uyarısıyla bağlantı verilir. Sahte 10-dil uzun makale oluşturulmadı.
- **Bulgular:** Google hâlihazırda İngilizce makale hub'ını indekslemiş ancak örnek alınan TR/ZH/HI hub'larını ve İngilizce terim ansiklopedisini henüz bilmiyor. Bu indeks durumu, ilgili sayfanın kalitesiz/engelli olduğunun kanıtı değildir.
- **Uygulanan düzeltme:** Altı yazının gerçek EN/TR gövdelerinde ve iki tam metni 10 dilde olan yazının diğer dil varyantlarında, makale merkezine kullanıcıya anlamlı geri bağlantı ve aynı hiyerarşiyi izleyen `BreadcrumbList` eklendi. TechnicalDeepDive `TechArticle.citation`, yazıda zaten görünür olan kaynak bağlantılarıyla eşleştirildi.
- **Yayın kapısı:** Statik test, Cloudflare build, Playwright/axe, CodeQL, release gate ve canlı içerik doğrulanmadan yayımlandı denemez.

## Doğrudan kanıtlar

### Google Search Console URL Inspection

`sc-domain:tractorvs.com`, 21 Kasım 2026'da mevcut durumu sorgulandı (URL Inspection geçmiş Google keşif/tarama durumudur, canlı tarama değildir):

| URL | GSC durumu |
|---|---|
| `/articles/` | Submitted and indexed; Google canonical eşit, mobil crawl 2026-11-21T16:08:37Z |
| `/tr/articles/` | URL is unknown to Google |
| `/zh/articles/` | URL is unknown to Google |
| `/hi/articles/` | URL is unknown to Google |
| `/guides/tractor-technical-terms/` | URL is unknown to Google |
| `/guides/tractor-engine-power-and-torque/` | Submitted and indexed |
| `/ja/guides/choosing-a-tractor/` | Submitted and indexed |
| `/de/reviews/basak-2075-bk/` | Submitted and indexed |

28 günlük GSC `/articles/` page filtreli sorguda **0 satır** döndü; bundan sıfır toplam trafik, sıralama veya gelecekteki performans çıkarılmamalıdır. AI citation/brand share-of-voice için OpenSEO AI visibility tracker **configured=false**: ölçülmüş mention veya citation oranı yoktur.

### Gerçek kullanıcıya açık HTML

Bu denetimde 21 Kasım 2026'da 10 dil arşivinden, bir EN/TR terim rehberinden, bir EN/TR motor güç rehberinden, Japonca seçme rehberinden ve Almanca Başak incelemesinden alınan canlı örnekler 200 döndü. Arşivlerde `CollectionPage/ItemList/BreadcrumbList`, doğru `html lang`, öz canonical ve 10 dil + x-default alternates var. TR/EN ansiklopedi ve derin rehberler yalnız var olan EN/TR hreflang içeriyor. Sahte `FAQPage`, `Product` satış puanları veya sahte marka arıza yüzdeleri önerilmiyor.

**Teknik temelin olumlu yönleri:** 96 özgün teknik tanım ve 57 traktör parçası anlatımı; PTO 540/540E/1000 farkları, motor/PTO/drawbar güç ayrımı, hidrolik debi ile kaldırma kapasitesinin farklı birimler olması; üretici/bağımsız test ayrımı; gerçek paragraf/bölüm ve telifli olmayan lisanslanmış fotoğraf/kredi kaydı. DLG, OECD ve Nebraska kaynakları kamuya açık HTML üzerinden ayrı doğrulandı. Bir Eur-Lex sayfası otomatik tarayıcıya bot kontrolü gösterdi; bu tek başına kaynak URL'sinin bozuk olduğunu kanıtlamaz.

### Crawl kapsamı ve uyarı yorumu

OpenSEO yalnız **50** sayfa gezebildi (`auditId: 5b7839cf-a9a6-4466-a071-d2fc6b401d3e`), 1.194 adres kapsam dışında kaldı. Bu sonuç **tam site taraması değildir**. 41 `title-too-long` bildirimi çoğunlukla model sayfaları; 2 kısa Çince model meta açıklaması ve 1 uzun forum açıklaması düşük öncelikli. Bu uyarılar bir Google cezası veya makale sıralama sorunu kanıtı değildir. Teknik model / varyant / pazarı sırf sabit karakter sınırına uymak için başlıktan çıkarmayın.

Ansiklopedinin canlı SSR HTML'i yaklaşık 281 KiB (Türkçesi 291 KiB) ve zengin içerik barındırıyor; gerçek mobil LCP/INP/CLS saha verisi olmadan bu boyuttan performans hükmü verilmemeli. P1: mobil RUM/CrUX doğrulamasıyla görünür gezinme ve HTML yükünü ölç; daha küçük bölüm sayfalarına ayırma ancak URL/anchor/SEO koruması varsa düşün.

### GEO hakkında doğru sınır

Google'ın 2026 AI Search optimizasyon rehberi: GEO için özel işaretleme / sahte `llms.txt` zorunluluğu yok; kaliteli ve erişilebilir özgün içerik temeldir. `TechArticle.citation` yalnız zaten görünür, gerçek referans URL'lerini tekrarlar. Bu alanın eklenmesi AI cite garantisi, ranking ya da ölçülebilir uplift beyanı değildir.

Resmî kaynaklar:
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://www.oecd.org/en/topics/tractors.html
- https://tractortestlab.unl.edu/
- https://www.dlg.org/en/magazin/survey-tests/tractor-model-descriptions-no-standardised-information

## Yayın sonrası ölçülecek iş listesi

1. Yeni kod ana dala girdikten sonra **Cloudflare canlı HTML** ve altı yazının lokalize breadcrumb linkleri/şema değerleri/HTTP 200 doğrulanır.
2. Google Search Console'da TR/ZH/HI arşivlerini ve İngilizce ansiklopediyi ileriki indeks durumu için yeniden kontrol et; sitemap keşfini engelleyici gerçek hata olursa düzelt. İndeksleme garantisi verme veya tekrar tekrar gereksiz sitemap gönderme.
3. 32 eksik dil–makale gövdesini, her bölümü yerel teknik uzman/QA ile doğrulamadan yayımlama. Özgün vaka, karşılaştırma örneği veya doğrulanmış kaynaklı açıklama eklemek; sırf metin uzunluğu artırmaktan daha değerlidir.
4. `/articles/` ve bağımlı rehberleri site içi makul bağlantı düzeyinde tut; ana katalog mobil Core Web Vitals sorunu ayrı, yüksek etkili iştir. Gerçek kullanıcı saha ölçümü olmadan tek puan uydurma.
5. OpenSEO AI visibility tracker yok. Gerçek ChatGPT/Gemini/Google AI mention ölçümleri istenirse önce prompt kapsamı ve ücret/kota için açık onay al; ölçümsüz «GEO arttı» beyanı yazma.

**Geri alma:** Bu PR'ın kod commit'i revert edilebilir; Supabase, forum, RLS, analitik izinleri ve 10 dilin içerik veri tabloları etkilenmez.
