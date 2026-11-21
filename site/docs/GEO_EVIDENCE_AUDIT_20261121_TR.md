# TractorVS — GEO / yapay zekâ araması kanıt ve düzeltme kaydı (21.11.2026)

## Kapsam ve amaç
Bu denetim, ChatGPT Search / OAI-SearchBot ve Google AI özelliklerinde kamusal bilgilerin doğru keşfedilebilmesi, sayfa içinde doğrulanmış cevapların okunabilmesi, teknik kaynakların açıklığı ve mevcut SEO altyapısının bozulmamasını hedefler. **Hiçbir arama motorunda gösterim, atıf, sıralama veya indeksleme garantisi yoktur.**

### Canlıda gözlenen başlangıç
- `https://tractorvs.com/robots.txt`: HTTP 200, `Allow: /` ve `OAI-SearchBot` izni; üç sitemap URL'si.
- `https://tractorvs.com/sitemap-index.xml`: HTTP 200 ve `sitemap-0.xml` dizini.
- `https://tractorvs.com/forum-sitemap.xml`: HTTP 200 fakat kontrol tarihinde boş URL listesi; doğrulanmış forum konuları bulunmadan yapay bir liste üretilmemeli.
- `https://tractorvs.com/tractors/mccormick-x5-120-a02c4df2/`: HTTP 200, indexable meta, HTTPS self-canonical, görünür kaynaklı teknik kayıtlar, Thing/WebPage/BreadcrumbList JSON-LD, soru/cevap bileşeni.
- `https://tractorvs.com/tr/tractors/antonio-carraro-tigre-3800-fc5f6f1d/`: HTTP 200 ve HTTPS self-canonical, kaynaklı özellikler. Bu örnekte kısa cevap kartı yoktu; dolayısıyla kanıtsız yeni bilgi eklemek yerine yalnız mevcut kanıtın kapsadığı sorular cevaplanmalı.
- Eski canlı denetimde HTTP sürümünün 200 dönmesi P0 sorunu olarak açıldı: [Issue #181](https://github.com/onuronkol2-collab/tractorcompare-data/issues/181). Bu PR Cloudflare SSL/TLS / Redirect Rules ayarlarını yapmaz; hesap üzerinde düzeltme ve canlı yeniden test gerekir.
- GitHub'daki `production-seo-audit.mjs` ve `edge-canonical-audit.mjs` dahil mevcut denetimler korunmalıdır.

## Bu değişikliklerin amacı
1. Model sayfalarındaki İngilizce/Türkçe kısa cevap motoruna iki yeni **kanıtlı** alan eklemek: motor hacmi (litre) ve arka askı kaldırma kapasitesi (kg). Katalog özetinden tahmin yapılmaz; model eşleşmeli kaynak URL'si, kanıt açıklaması, `verified_at` gerekir.
2. Birim, çelişen değer veya ölçüm standardı belirsizliğinde sayısal cevap üretmemek. cc, kW veya daN değerleri otomatik olarak litre/kg diye yorumlanmaz; opsiyonel ekipman koşullarına dikkat çekilir.
3. Her resmî/bağımsız kaynak kartında yalnız ilişkili doğrulanmış teknik kayıtlardan gelen **en son kayıt doğrulama tarihini** göstermek. Bu tarih **belgenin yayımlanma tarihi**, yeni site güncellemesi veya bütün kaynakların eşzamanlı denetlendiği iddiası değildir. Geçersiz/gelecek tarih gösterilmez.
4. Üreticinin web ürün sayfasını yanlışlıkla “üretici belgesi” diye adlandırmak yerine “üretici kaynağı” ifadesini kullanmak; 10 dilde kaynağı türüne göre doğru tanımlamak.
5. Mevcut `Thing`, `WebPage`, `BreadcrumbList`, kaynak bağlantıları, güvenli HTML, 10 dil/kanonikler, yayımlanmış-kayıt filtreleri, RLS, API anahtarı sınırları, forum moderasyonu, fotoğraf lisansı ve açık izinli analitiğe dokunmamak.

## Kabul ve doğrulama
- Otomatik: `npm run test --workspace=tractorvs-site`, `site-build.yml`, ilgili SEO/GEO birim testleri, PR'da Playwright/axe-core erişilebilirlik kontrolleri.
- Canlıya almadan önce: PR CI sonucu ve güvenlik uyarılarını incele; başarısızsa birleştirme.
- Canlı dağıtımdan sonra: örnek üretici/bağımsız kaynak sayfalarında görünür tarihler ile içerik uyumunu, gerçek bot erişimini, canonical/hreflang/sitemap'i doğrula.
- Ölçüm: Search Console'daki Generative AI performans raporu ve elde edilen gerçek AI atıfları; üçüncü taraf GEO skorlarını gerçek Google/ChatGPT gösterimi gibi sunma.

## Yapılmaması gerekenler
- Sırf AI için `llms.txt`/uydurma `FAQPage`, sahte `Product` teklifleri, doğrulanmamış yazar/inceleme/puan şeması ekleme.
- Kaynaksız arıza sayıları, model yılı, tavsiye, insan tarafından yapılmamış test veya simüle edilmiş fiyat yayımlama.
- İçeriği makine çevirisiyle 10 dilde kalitesiz, birbirini tekrarlayan sayfalara dönüştürme.

## Kalan engeller
1. **P0 Cloudflare HTTP → HTTPS:** Issue #181, SSL/TLS Always Use HTTPS ve olası www alias kontrolü; ancak yapılmadıkça tamamlandı denmez.
2. **Forum kaynaklı GEO içeriği:** canlı forum-sitemap boş; moderasyonlu, insanlara yararlı ilk konular olmadan yapay içerik üretilmemeli.
3. **Gerçek AI görünürlüğü:** OpenSEO projesi tanımlı ama AI visibility tracker yapılandırılmamış. Ücretli kontrol için önce maliyet onayı, ücretsiz kaynaklardan ise gerçek Search Console raporu gerekir.
4. **Tüm arama motorları / ağ koşulları:** robots.txt izni tek başına Cloudflare WAF'ın her botu kabul ettiğini ispat etmez; canlı log veya user-agent denetimi gerekir.

## Dayanaklar
- Google Search Central, *Google's Guide to Optimizing for Generative AI Features*: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Search Central, *AI features and your website*: https://developers.google.com/search/docs/appearance/ai-features
- OpenAI, *Publishers and Developers FAQ*: https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
- İçerik bütünlüğü: `AGENTS.md`, `site/src/lib/model-evidence-answers.ts`, `site/src/lib/model-source-index.ts`, `site/docs/seo-launch-gate.md`.

## Geri alma
Kod değişiklikleri yalnız `site/` kapsamındadır. PR merge edildiğinde gerekiyorsa ilgili commit/PR revert edilerek build yeniden çalıştırılır. Veritabanı şeması, RLS, kullanıcı hesabı veya gizli anahtar değişikliği yapılmaz.
