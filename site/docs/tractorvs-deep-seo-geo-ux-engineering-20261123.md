# TractorVS — Derin SEO, GEO, altyapı, UX, özgünlük ve mühendislik standartları

**Kaynak taraması:** 23 Kasım 2026 (Türkiye saati)  
**Durum:** Resmî üretici/standart belgeleri ve deneyimsel UX araştırmaları, GitHub ana dalındaki kod ve mevcut denetim notlarıyla karşılaştırıldı. **Bu belge araştırma ve gelecekteki işlere kabul kriteri kaydıdır; canlıya kod dağıtıldığı, yeni bir açık bulunduğu veya Google sıralamasının yükseldiği iddiası değildir.**  
**Önceki kayıtlarla ilişki:** \`AGENTS.md\`, \`site/docs/tractorvs-infrastructure-engineering-learning-20261123.md\`, \`site/docs/GEO_AI_SEARCH_QUALITY_TR.md\`, \`site/docs/seo-launch-gate.md\`, \`site/docs/sitewide-readable-content-audit-20261122.md\` ve geçerli güvenlik/yayın kuralları tamamlanır; kopyalanıp geçersiz kılınmaz.

## A. Kaynak ve karar hiyerarşisi — her görevde uygula

1. **Normatif doğruluk:** Google Search Central, Bing Webmaster, W3C/WCAG, OWASP, Cloudflare, Astro, Supabase/PostgreSQL, GitHub resmî belgeleri. Versiyon, yayımlanma/güncellenme tarihi ve ürün sınırları doğrulanır.
2. **Ölçülmüş TractorVS gerçeği:** Ana dalın güncel SHA'sı, CI sonuçları, dağıtım sürümü, HTTP/DOM çıktıları, gerçek GSC/CrUX/RUM, izinli Supabase şema ve RLS testleri. Önceki raporlar yeni canlı ölçüm değildir.
3. **Sahaya dayalı UX araştırmaları:** Nielsen Norman Group ve Baymard Institute gibi yöntemini açıklayan çalışmalar; e-ticaret bulgularını TractorVS'ye körlemesine aktarma. Burası ilan/satış sitesi değil, traktör inceleme ve karşılaştırma platformudur.
4. **Hipotez/öneri:** Uzman yorumu, topluluk iddiası, AI metni, tahmini fayda yalnız araştırma hipotezidir; kaynak ve sınanabilir kabul kriteri olmadan üretim kuralı olmaz.

Her görev için kısa karar izi: **kullanıcı görevi → gözlenen sorun/kanıt → resmî kaynak (tarih) → etki/risk → çözüm → negatif/pozitif test → CI → üretim SHA/canlı doğrulama → izlem/geri alma.** Öğrenilen ilkeyi \`AGENTS.md\` içinde kısa, detayını kaynaklı docs dosyasında tut; gereksiz kopyaları çoğaltma. "Öğrendim" ve "uyguladım" ayrı şeydir; modelin ağırlıkları bu şekilde yeniden eğitilmiş olmaz.

## B. SEO ve üretken arama (GEO/AEO) — 2026 gerçeği

**Yeni resmî teyit:** Google'ın 2026 **Generative AI Search Guide**'ı GEO/AEO isimlerini açıklarken özel “hack” peşinde koşulmamasını, temel SEO ve kullanıcıya yararlı **özgün** içeriğin esas alınmasını istiyor. Google Search \`llms.txt\` veya yapay zekâya özel metin/Markdown dosyalarını Google'ın üretken arama için özel sinyal olarak kullanmıyor. Konu “sırf AI okusun” diye yapay bloklara bölünmez.

- **Kritik dizin kapısı:** Yayınlanmış modelin adı/yılı/pazarı/varyantı, kullanıcıya gösterilen değer ve kaynak bağlantıları ilk statik HTML içinde bulunur. JavaScript kapalıyken temel içerik ve gerçek \`<a href>\` bağlantıları ulaşılabilir olmalı. Daha sonra JS ile \`noindex\` kaldırmaya güvenme.
- **Indexability:** Production ve preview ayrı; gerçek sayfa HTTP 200, uygun robots, canonical, benzersiz/trafik hedefli adres, tam \`hreflang\`, sitemap ve kaynaklı değişim \`lastmod\`. Google'ın indeks kararı garanti değildir.
- **Yapılandırılmış veri, gerçek içeriği tarif eder:** Forumda yalnız gerçek, moderasyonla yayına alınmış ve görünen metin/gerçek yazar/gerçek etkileşim sayısı varsa \`DiscussionForumPosting\`; üyede kamuya açık gerçek profil varsa \`ProfilePage\`; makalede gerçek yazar ve kaynaklı tarih varsa \`Article\`. Traktör inceleme sitesinde sahte \`Offer\`, \`AggregateRating\`, yapay değerlendirme veya başka uygun olmayan \`Product\` rich-result garantisi üretme. Şema her sayfanın görünen içeriğiyle eşleşir.
- **GEO için içerik tasarımı:** Tarım kullanıcısının gerçek alt sorularına cevap veren, karşılaştırılabilir tablolu, belirsizlikleri işaretleyen, kaynaklara giden bağlantılı açıklamalar; özgün veri analizi ve yöntem bölümü. “AI tarafından önerilme” garantisi yok. Google'ın RAG / query-fan-out açıklaması gerçek sorgu çeşitliliğini gösterir, otomatik anahtar sözcük sayfa üretimini haklı çıkarmaz.
- **Raporlama:** Tarama, indeks, gösterim, tıklama, AI görünürlüğü, görsel/multimodal sorgu ve gerçek ziyaretçi davranışı **ayrı metriklerdir**. Google'ın 16 Kasım 2026 API duyurusundaki \`webMultimodal\` yalnız gerçek hesap yetki/verisi varsa anlamlıdır. Sıfır sonuç “GEO başarısız” veya “başarılı” kanıtı sayılmaz.

**TractorVS uygulama kapısı:** Model ayrıntı, katalog, karşılaştırma, makale, forum ve 10 dil için (1) HTML'de görünen kaynak/başlık, (2) HTTP ve meta, (3) schema görünür içerik paritesi, (4) özelliğin kullanıcı görevini çözmesi, (5) ölçülmüş GSC ve gerçek dönüştürme ayrı raporlanır. "SEO puanı 100" arama sırası garantisi değildir.

**Kaynaklar:**  
Google: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide  
https://developers.google.com/search/docs/fundamentals/creating-helpful-content  
https://developers.google.com/search/docs/fundamentals/using-gen-ai-content  
https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics  
https://developers.google.com/search/docs/crawling-indexing/links-crawlable  
https://developers.google.com/search/docs/appearance/structured-data/sd-policies  
https://developers.google.com/search/docs/appearance/structured-data/discussion-forum  
https://developers.google.com/search/docs/appearance/structured-data/profile-page  
https://developers.google.com/search/blog/2026/11/search-analytics-api-update

## C. Traktör verisinin özgünlüğü, ölçülebilirliği ve yanlışlık önleme

Kayıtları marka/model adıyla değil **model + yıl + pazar + varyant + tahrik + şanzıman + ölçüm koşulu** ile yorumla. Üretici broşüründe tek ölçüm, alternatif motor seçeneği veya farklı standarda ait değer, “bütün modeller için kesin değer” olmaz. Kaynak URL'si, belge tarihi/sürümü, hangi sayfa/ölçüm satırı ve erişim zamanı kaydedilir. Resmî ile bağımsız test çelişirse iki verinin kapsamı açıkça gösterilir; uydurma ortalama veya sahte kronik arıza yüzdesi üretme.

- **Kaynak güven derecesi:** A = tam model/varyant için resmî ölçüm/belge; B = izlenebilir birincil bağımsız ölçüm; C = açıkça etiketlenmiş kullanıcı deneyimi; D = doğrulanmamış aday. D otomatik yayınlanmaz. Bu sınıflama yeni çalışma disiplini önerisidir, mevcut veritabanında böyle bir sütun olduğunu iddia etmez.
- **Editoryal katma değer:** Sırf katalogdan kopyalanmış uzun çok dilli SEO sayfası değil; değerlerin neden farklı olabileceğini ve hangi kullanıcı ihtiyacına uyduğunu kendi yöntemimizle açıkla. Benzer model sayfalarının varyant ve ölçümleri ayrılmalı.
- **Fotoğraf:** CC lisans kapsamı, fotoğrafçı/atıf, özgün file ID, SHA-256, bire bir model/varyant uygunluğu; çözünürlük varyantları ve tam ekranın aynı doğrulanmış esere ait olması gerekir. Fotoğraf yoksa kimliği belirsiz fotoğraf basmak yerine açıklamalı yer tutucu.
- **Forum:** Moderasyon, kaynak bağlantıları, gerçek yazar/tarih ve gerçek etkileşim sayıları; bot veya otomatik içerik gerçek görüş gibi sunulmaz.
- **10 dil:** \`hreflang\` yalnız gerçekten yayımlanmış, tam ana içerik çevirisi gözden geçirilmiş, kendi canonical'ına sahip karşılıklı dil sürümlerinde. Menü çevirisi tam sayfa çevirisi değildir; hp/PTO/2WD/4WD, ölçüm birimleri ve güvenlik uyarıları diller arasında anlam değiştirmez.

**Test:** rastgele ve yüksek riskli model kimliği örneklemi, bağımsız kaynak karşılaştırması, görünür veri/schema/sitemap/hreflang paritesi, yayından kaldırılmış ve taslak kayıtların kamu aramalarından dışlanması, lisans uygunluğu. Kök kural: kaynak eksikliği test bypass gerekçesi değildir.

## D. Kullanıcı dostu arayüz: kanıta dayalı 4 temel görev

**Nielsen Norman Group** veri tablolarında dört kullanıcı görevini tarif eder: kayıt bulma, karşılaştırma, ayrıntı okuma/düzenleme, kayıt üzerinde işlem yapma. Çalışmanın asıl odağı iş yeri tablolarıdır; TractorVS'ye uygulanması **tasarım hipotezi** ve kullanılabilirlik testi gerektirir. **Baymard** filtre kullanıcı deneyimi üzerine saha çalışmaları yapar ama e-ticaret/kasa yönlendirmesi sitemizin amacı değildir.

1. **Bul:** Marka, model, güç aralığı, yıl, tahrik ve pazar filtrelerinin adları anlaşılır; mevcut filtre durumları, sonuç sayısı ve sıfırlama erişilebilir. Filtre panelinin varlığı değil, “aradığım makineyi bulabildim mi?” sorusu ölçülür.
2. **Anla:** Her kartta marka/model + varyant/yıl/pazar kolay okunur; fotoğraf yokluğu açık belirtilir; HP/PTO/hidrolik rakamları kaynak ve birimden kopmaz. Sık kullanılan bilgi önce, ayrıntı sonradır.
3. **Karşılaştır:** 2–4 model yan yana; ilk sütunda sabit özellik adı ve birim; farklılıklar yanlış “kimin daha iyi” çıkarımı olmadan vurgulanır. Mobilde satır başlığı/değer eşleşmesi kaybolmaz; gerekiyorsa erişilebilir yatay kaydırma veya mantıklı iki kart karşılaştırması. Mobil/küçük ekranda masaüstü tablosunu küçültüp okunmaz yapma.
4. **Devam et:** “Modeli incele”, “Karşılaştır”, “Kaynağı aç”, “Foruma dön” aksiyonları kullanıcıyı satış teklifine yönlendirmez. Filtreler/dil/karşılaştırma seçimi gezinme ve yenileme sonrası korunur; boş sonuçta anlaşılır yol gösterilir.

**Ölçülebilir UX kabul senaryoları:** Kullanıcı seçtiği modelin en az iki teknik değerinin kaynağına ulaşabilir; mobilde 2 modeli karıştırmadan yan yana inceleyebilir; filtreleri temizleyebilir; forum konusundan listeye geri dönebilir; klavye ile aynı işleri yapabilir. Süre/hata oranı ancak gerçek testte ölçülür, burada başarı iddiası yok.

**Kaynaklar:** https://www.nngroup.com/articles/data-tables/ ; https://baymard.com/blog/ecommerce-filter-ui

## E. WCAG 2.2 AA: semantik, okunabilirlik ve giriş güvenilirliği

W3C'nin 2.2 AA ölçütleri uygulanır. **2.5.8 Target Size (Minimum)** genelde 24×24 CSS px veya yeterli aralık/eşdeğer istisnaları içerir; 44–48px gibi daha büyük dokunmatik hedefler TractorVS için **tasarım tercihi**, WCAG 2.2 AA'nın evrensel zorunlu sayısı değildir. **2.4.11 Focus Not Obscured (Minimum) AA**: sabit alt menü/banner klavye odağını tamamen kapatmamalı. **2.4.13 Focus Appearance ise AAA**; AA zorunluluğu diye sunma.

- Görünür focus, skip link, gerçek \`<label>\`, semantik başlık/hücre (\`th scope\`), tam adlandırılmış düğmeler; modalda odak yönetimi ve Escape; tek elle/klavye/touch kullanım.
- 200% metin büyütme, dar ekran ve uzun Almanca/Portekizce gibi çeviri alanlarında taşma, sistem yazı boyutu, kontrast ve animasyon azaltma testleri.
- Giriş ekranında şifre yapıştırmayı, parola yöneticisini, erişilebilir oturum sürdürmeyi engelleme; oturum ve kimlik doğrulama güvenliği ayrı denetlenir.
- axe-core otomatik tarama + Playwright klavye/touch + manuel ekran okuyucu sınaması **birlikte**; tek yeşil otomatik test “WCAG 2.2 uyumlu” kanıtı değildir.

**Kaynak:** https://www.w3.org/TR/WCAG22/ ; https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

## F. Core Web Vitals ve performans: önce darboğazı bul

Gerçek kullanıcıların 75. yüzdelik diliminde iyi hedefler: **LCP ≤2,5 s; INP ≤200 ms; CLS ≤0,1** (mobil/masaüstü ayrı). Laboratuvar Lighthouse, Chrome DevTools ve Playwright ile **CrUX/RUM saha verisi** ayrı sınıflandırılır. Ölçülen dağılım, örneklem ve dönem yoksa kazanım yüzdesi söyleme.

- **LCP:** Başlangıç HTML'sinde ana model görseli, doğru \`src/srcset/sizes\`, boyut, yalnız gerçek ilk görsel \`eager\`/\`fetchpriority=high\`; mevcut \`TractorPhoto.astro\` bunu zaten yapıyor, bozma. Alt görseller gecikmeli ve lisanslı; tüm görselleri high yapma.
- **INP:** Traktör katalog arama/filtreleme, 2–4 seçim, tablo değişimi ve mobil menüde pahalı event handler / uzun main-thread task / layout thrashing araştır. Arama güncelleme sıklığı ve erişilebilir geri bildirim korunur. \`content-visibility\`/virtualization ancak odak, metin seçimi, bot keşfi ve tüm gerçek linkler test edilince.
- **Katalog HTML bütçesi:** 22 Kasım denetimi 388 model için yaklaşık 790 KB HTML not etmiş; **bu eski ölçümdür**, bugünkü canlı değer değildir. \`TractorCatalog.astro\` hem marka dizini hem çok sayıda SSR kart ve URL filtre durumunu üretir. Byte büyüklüğünü sıkıştırılmamış/sıkıştırılmış, DOM node ve JS payload olarak ayrı ölç. Sayfalama denenecekse tüm yayımlanmış model URL'leri keşfedilebilir kalmalı, linkler/kullanıcı filtreleri/dil adresleri bozulmamalı. Rastgele \`noindex\`, \`robots\` veya \`rel=canonical\` ile pahalı URL saklama yapılmaz.
- **CSS/font:** Kritik yol, gereksiz CSS, font yükleme ve tarayıcı geri/ileri önbellek davranışını ölç; kültürel dil fontlarını yanlış alt kümelere bölüp boş kare üretme.
- **Görseller ve cache:** Ölçülmüş 429/502, \`Cache-Control\`, MIME, dosya SHA ve LCP waterfall birlikte değerlendirilir; telifi ve tam model kimliğini korumadan agresif sıkıştırma yok.

**Kaynaklar:** https://web.dev/articles/vitals ; https://web.dev/articles/optimize-lcp ; https://web.dev/articles/optimize-inp

## G. Cloudflare Workers Static Assets — yeni önemli dağıtım riski

**12 Kasım 2026 güncel belge:** Cloudflare Workers Static Assets'de Worker sürümü, statik varlık manifestiyle birlikte sürümlenir. Dağıtımın yayılması, kademeli trafik veya açık kalmış eski sekmeler nedeniyle bir sürümün HTML'si başka sürümde bulunmayan JS/CSS/görsel dosyasını isteyebilir (**version skew**). Yalnız build yeşil veya tek URL HTTP 200 olması bu riski dışlamaz.

**TractorVS gerçek kodu:** \`wrangler.jsonc\` ve \`site/worker/index.js\`: selective \`run_worker_first\` kök/dil/sitemap/fotoğraf gibi dinamik davranışa gerek duyan yolları çalıştırır; diğer Astro HTML/statik dosyalar asset-first mantığına dayanır.

**Yeni test disiplini:**
1. Preview ve üretim sürüm/commit SHA kanıtını ayır.
2. Güncelleme öncesi tarayıcıda açık kalan sayfanın eski CSS/JS chunk'ları ve görsel dosyalarını yeni sürümde iste; kritik 404, içerik-türü yerine HTML fallback, bozuk hydration, lightbox/fotoğraf eksilmesi var mı?
3. Aynı ters senaryoyu rollback için sınama; çözüm olarak üretim dizinine eski hash'li varlıkları kontrollü taşıma / aşamalı dağıtım / versiyon yönlendirme seçenekleri değerlendirilebilir. **Bütün route'ları Worker-first yapmak otomatik çözüm değildir.** Cloudflare'ın “yeni sayfa eski sürüme denk gelebilir” sınırlamasını da hesaba kat.
4. \`/images/tractors/*\` için yalnız onaylı dosya/çözünürlük listesi, 200-MIME-hash, 429/502 fail-closed ve lisans korunur. \`Cache-Control\` başlıklarının istemci/edge etkisini ayrı ölç.
5. Tam yayın kanıtı: GitHub merge SHA → başarılı pre/postflight CI → Cloudflare active deployment version → gerçek canlı 200 ve temel kullanıcı akışı.

**Kaynaklar:** https://developers.cloudflare.com/workers/static-assets/ ; https://developers.cloudflare.com/workers/versions-and-deployments/version-skew/ ; https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/

## H. Supabase / PostgreSQL / forum Auth: sürüm duyarlılığı

**4 Kasım 2026 gerçek kırılma:** Supabase CLI **v3** ile \`db push/pull/dump\` gibi komutların varsayılanı local oldu; hosted işlem için güncel söz dizimiyle \`--remote\`, CI için onay gerektiren değişikliklerde \`--yes\` aranır. Bu bir *gelecekte yükseltme kontrolü*dür; mevcut projede CLI v3 bulunduğu veya bozulduğu gözlenmedi. CLI sürümünü, komutun hedef veritabanını, dry-run ve onayı doğrulamadan yükseltme yapma.

**RLS ve şema:** PostgreSQL \`GRANT\` Data API görünürlüğü ile satır bazlı \`RLS\` ayrı; \`SELECT\`/INSERT/UPDATE/DELETE rol matrisi, sahip/moderatör/anon ayrımı ve **reddedilmesi gereken** negatif testler şart. \`auth.uid()\` null davranışı, \`security_invoker\` view ve \`SECURITY DEFINER\` riskleri göz önünde bulundurulur. Müşteri tarafına \`service_role\`/\`sb_secret\` hiç gönderilmez. Önceki \`INFRASTRUCTURE_AUDIT_20261120_TR.md\` bulguları yeni advisor çıktısıyla **yeniden doğrulanmadan güncel açık** denmez.

**Forum ve oturum:** Üye girişi, sekme kapatıp açma/yenileme, refresh token, çıkış, anonim kullanıcı ile özel taslak erişimi, başka kullanıcıya ait profil; tarayıcıdaki token ömrü ve depolama yöntemini güvenlik denetimi olmadan değiştirme. Onaylanmamış/özel forum içeriği sitemap/JSON-LD/static data'ya sızamaz.

**Kaynaklar:** https://supabase.com/changelog/supabase-cli-v3 ; https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/database/postgres/testing-row-level-security ; https://supabase.com/docs/guides/api/securing-your-api ; https://asvs.owasp.org/

## I. GitHub Actions ve tedarik zinciri — 2026'ya özgü iyileştirmeler

**28 Ekim 2026:** GitHub Actions **workflow dependency lockfile** GA oldu (\`.github/workflows/actions.lock\`). GitHub CLI \`gh actions-lock\` ile geçiş workflow bazında yapılabilir. Bu, hareketli \`@v4\` gibi etiketlerin çözdüğü commit'i kilitleme imkânı verir; dependency'nin güvenilir olduğunu tek başına kanıtlamaz. Projede hâlen \`actions/checkout@v4\` / \`actions/setup-node@v4\` görülüyor. **Önce sürüm/politika uyumluluğunu ve mevcut Dependabot PR'larını incele; tüm workflow'ları körlemesine toplu taşıma.**

**Eşzamanlı görevler:** Güncel GitHub concurrency belgeleri aynı grupta varsayılan tek **pending** iş olduğunu, yeni işin eskisini iptal edebileceğini, \`cancel-in-progress:false\` değerinin **pending iptalini tek başına engellemediğini** ve yeni \`queue:max\` seçeneğinin sınırlı/koşullu kullanıldığını açıklar. Katalog ve forum senkron işleri **farklı** group kullanıyor; ikisi de \`main\` dalına yazarsa bu ayar birbirlerine kilit oluşturmaz. Bu, kanıtlanmış çakışma değil, mutlaka log ve yazılan dosyalarla test edilmesi gereken **P0 tasarım riski**.

- CI'da minimum \`permissions\`, secret'ları PR/fork/Dependabot'a açmama, yazma işlerini scope'a göre sınırlama; \`pull_request_target\` gibi ayrıcalıklı durumlarda kaynağı asla körlemesine çalıştırma.
- Taslak içerik ve lisansı belirsiz fotoğraflar “otomatik publish” asla olmaz. Retry, optimistic lock/compare-and-swap, tek yazıcı veya yeniden hesaplanabilir fingerprint ancak gerçek çatışma loguyla seçilir.
- Workflow hata durumunda başarısızlığın artefaktı saklanır; flaky test geçmesi için gizleme/skip yapılmaz.
- \`queue:max\`/action lockfile/Node sürümü gibi yeni imkânların hesap/yürütücü desteği ve maliyeti pilotla doğrulanır; no-op değişiklik için CI dakikaları tüketilmez.

**Kaynaklar:** https://github.blog/changelog/2026-10-28-github-actions-workflow-lockfiles-are-generally-available/ ; https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency ; https://docs.github.com/en/actions/reference/security/secure-use

## J. Ekran türü ve görev bazlı profesyonel kabul matrisi

| Sayfa türü / görev | Kullanıcı başarısı | SEO/GEO önkoşulu | UX/a11y/perf testi | Güvenlik/veri |
|---|---|---|---|---|
| Katalog | Modeli hızla bulur, filtreler, sıfırlar | İlk HTML'de gerçek model linkleri; temiz canonical | 360/390/768/1280px, klavye, INP, filtre persist | Sadece published kayıt |
| Model detayı | Doğru yıl/varyant ve kaynağı görür | Başlık, varyant, lisanslı fotoğraf, kaynaklı ölçüm HTML'de | Metin %200, foto full-screen, LCP/CLS | Draft veya gizli veri çıkmaz |
| Karşılaştırma | 2–4 modelin aynı birimini anlar | İç link ve kaynak, URL davranışı | th/td eşleşmesi, mobil kaydırma, no-JS mümkün akış | Üretici/pazar ölçümü karışmaz |
| Forum | Giriş sonrası konuyu okur/yanıtlar, geri döner | Sadece gerçek published konu + uygun schema | Oturum, klavye, telefon, focus, geri bağlantısı | RLS+moderasyon+profil gizliliği |
| Makale | Özgün cevap ve yöntem bulur | Gerçek yazar/kaynak, doğrulanmış dateModified | Okunabilir tipografi, iç bağlantılar | Otomatik şişirme ve sahte iddia yok |
| 10 dil | Seçtiği dilde gerçek anlamı bulur | Karşılıklı \`hreflang\`, doğru canonical | Taşma, ölçü birimi, semantik karşılaştırma | Çevirisi eksik içerik index dışı |
| Tüm site | Çalışan navigasyon ve güven | Robots/sitemap/noindex bütünlüğü | WCAG 2.2 AA hedefi, p75 CWV | KVKK/rıza, least privilege |

**Yayın kapısı:** P0 güvenlik/veri/yanlış kaynak, yanlış indexability, kritik fonksiyon veya lisans hatası sıfırlanmadan geçilemez. P1 performans ve erişilebilirlik gerilemeleri belgeli istisna olmadan geçilemez. Belirlenen niceleyici eşikler mevcut örneklemle kıyaslanır; ölçülmeyen performans mutlak başarı kabul edilmez.

## K. Önceliklendirilmiş uygulanabilir araştırma backlog'u (üretim değişikliği değildir)

| Öncelik | İş ve kanıt ihtiyacı | Mevcut kod/akış | Başarı/geri alma koşulu |
|---|---|---|---|
| P0 | **Actions aynı main'e yazan işlerin yarış/iptal denetimi** | katalog + forum autosync workflow, ilgili \`scripts/\` | son 30 gün gerçek push/retry/pending logu + güvenli deterministik yaklaşım; başarısızsa mevcut workflow'ya dön |
| P0 | **Yayın sonrası version-skew ve rollback uçtan uca testi** | \`wrangler*.jsonc\`, Worker, Astro assets, release gate | yeni/eski HTML-JS-CSS-foto 200/MIME ve sekme akışları; eski çalışan sürüm korunur |
| P0 | **Forum RLS/Auth negatif senaryo matrisi** | Supabase policy/uygulama oturum kodu | başka kullanıcı/taslak okunamaz; güvenli login/refresh/logout; migration rollback |
| P1 | **Katalog ilk HTML/INP bütçe incelemesi** | \`TractorCatalog.astro\`, compare JS | 10 dil SSR link eşitliği ve gerçek ölçüm; regresyon varsa değişiklik geri alınır |
| P1 | **Mobil semantik karşılaştırma ve WCAG** | \`TractorComparison.astro\`, tasarım CSS | model/özellik/birim ilişkisi korunur, klavye ve dokunma testi |
| P1 | **Kaynaklı içerik ve schema eşleşmesi** | model, makale, forum, çok dil | gerçek görünür değer/sayfa/schema, lisans ve çeviri kontrolü |
| P2 | **GitHub Actions dependency lockfile pilotu** | tek düşük riskli workflow ile başla | action SHA, lock doğrulama ve tüm testler, gereksiz maliyet yok |
| P2 | **Supabase CLI v3 yükseltme uyumluluk kaydı** | kurulu sürüm + CI scripti envanteri | hosted/local hedef testleri; izinsiz prod komutu yok |
| P2 | **RUM/GSC multimodal ve özgünlük ölçüm raporu** | erişim izinli analitik kanalları | dönem, örneklem, privacy, ayrı metrik, pazarlama garantisi yok |

## L. Her işte okunacak işletim sözleşmesi

1. \`AGENTS.md\` son ana dal sürümünü **o görevde** oku; ilgili eski PR, CI, otomasyon, tekrar edilen işler ve kaynak tarihlerini kontrol et. Bu belge ve önceki altyapı rehberi referanstır.
2. Kullanıcının ana amacını belirle: güvenilir teknik inceleme ve karşılaştırma; alım-satım sitesi değil. Her önerinin bu göreve etkisini yaz.
3. Önce doğrulanmış kaynak ve mevcut davranış; sonra düşük-riskli, toplu ama modüler çözüm. Ücretsiz/düşük maliyet önceliği, sır ve ziyaretçi rızası sınırı korunur.
4. Değişiklik için **negatif ve pozitif test**, 10 dil, mobil, SEO/GEO, güvenlik, veri varyant eşleşmesi, lisans, performans, rollback düşün. Test sonucu olmadan “geçti” yazma.
5. Tek PR'de tek tutarlı değişiklik sınıfı; diğer açık PR'ların aynı dosyalara müdahalesini önceden denetle. Gerekirse ana dal yenilenerek çatışma çözülür.
6. \`erişildi / incelendi / önerildi / değiştirildi / CI'da test edildi / ana dala birleştirildi / Cloudflare canlıda doğrulandı / Google'da indekslendi\` durumlarını **ayrı** raporla.
7. Kaynakta güncelleme, yeni test bulgusu veya kullanıcı geribildirimi varsa eski varsayımı silmeden **tarih + karar gerekçesi + regresyon kanıtı** ile düzelt. İlgili periyodik uzmanlık taraması otomasyonu varsa aynı işi yeni otomasyonla çoğaltma.
8. Bu kaynak kaydı otomatik uygulama, modelin kalıcı içsel yeniden eğitimi veya gizli bir arka plan görevi değildir; kalıcılık GitHub'daki dosya ve versiyon tarihçesindedir.

## M. Kaynak dizini ve yeniden kontrol tetikleyicileri

- **Google** (AI SEO ve özel \`llms.txt\` iddiaları): https://developers.google.com/search/docs/fundamentals/ai-optimization-guide — Search dokümantasyonu değiştiğinde.
- **Google** (çoklu dil): https://developers.google.com/search/docs/specialty/international/localized-versions — yeni locale/yayın akışında.
- **Google** (görsel arama API, 16 Kasım 2026): https://developers.google.com/search/blog/2026/11/search-analytics-api-update — hesabın raporları erişilebilir olduğunda.
- **web.dev** (Core Web Vitals): https://web.dev/articles/vitals — yeni saha örneklemi, perf regresyonunda.
- **W3C** (WCAG 2.2): https://www.w3.org/TR/WCAG22/ — arayüz/kimlik doğrulama düzeninde.
- **Cloudflare** (Static Assets): https://developers.cloudflare.com/workers/static-assets/ — Worker config/derleme/asset rotası değişiminde.
- **Cloudflare** (Version skew): https://developers.cloudflare.com/workers/versions-and-deployments/version-skew/ — üretim deploy/rollback planında.
- **Supabase** (v3 breaking change, 4 Kasım 2026): https://supabase.com/changelog/supabase-cli-v3 — CLI yükseltmede.
- **Supabase** (RLS): https://supabase.com/docs/guides/database/postgres/row-level-security — Auth/permission değişiminde.
- **GitHub** (workflow lockfile GA, 28 Ekim 2026): https://github.blog/changelog/2026-10-28-github-actions-workflow-lockfiles-are-generally-available/ — Actions dependency güncellemesinde.
- **GitHub** (concurrency): https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency — zamanlı yayın işlerinin sıralamasında.
- **OWASP** (ASVS 5): https://asvs.owasp.org/ — yeni güvenlik yüzeyi oluşturan özellikte.
- **Nielsen Norman Group** (Page Laubheimer, 3 Nisan 2022): https://www.nngroup.com/articles/data-tables/ — karşılaştırma ergonomisi doğrulamasında.
- **Baymard Institute** (17 Nisan 2026): https://baymard.com/blog/ecommerce-filter-ui — katalog filtre prototip testinde, e-ticaret/satış davranışı siteden ayrılarak.

**Sonuç:** Hiçbir kaynak tek başına “100 SEO”, “Google'da ilk sıra”, “AI alıntı garantisi” veya “tüm WCAG geçti” iddiasını haklı kılmaz. Altyapı uzmanlığı, kanıt ve canlı test ile sürdürülen tekrarlanabilir bir geliştirme disiplinidir.
