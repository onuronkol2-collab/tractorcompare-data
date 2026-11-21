# TractorVS — Playwright, axe-core, CodeQL, Dependabot, Cloudflare Web Analytics kurulum ve güvenlik planı

## Kim ne yapar?

- **GitHub PR:** Playwright gerçek tarayıcı duman testleri, axe-core erişilebilirlik taraması ve Dependabot sürüm güncelleme önerileri bu PR ile tanıtılıyor; PR ana dala alınmadan etkin değildir.
- **Kullanıcı GitHub arayüzü:** CodeQL **Default setup**, Dependency graph, Dependabot alerts ve Dependabot security updates uygun ise etkinleştirilmeli.
- **Kullanıcı Cloudflare arayüzü:** Web Analytics ayarları incelenmeli. Otomatik JS enjeksiyonu gizlilik/izin metninden bağımsız olarak kod yükleyebilir; bu nedenle mevcut izin politikasıyla çatışmadığından emin olmadan açılmamalıdır.

## 1. GitHub tarayıcı testleri (hazır PR)

PR içindeki dosyalar:
- `site/playwright.config.mjs`: Chromium, Firefox, WebKit, Pixel 7 mobil görünüm.
- `site/e2e/tractorvs-smoke.spec.mjs`: on dilin tamamında ana sayfa erişimi/dil bildirimi, TR/EN temel sayfalar, mobil karşılaştırma menüsü, katalog, karşılaştırma, forum, analitik reddetme/kabul/geri çekme ve axe-core kritik sorunları.
- `.github/workflows/playwright-accessibility.yml`: site kod PR'larında, haftalık ve elle çalışır. Üretim veritabanına erişim vermez, kullanıcı eylemleri yalnız localhost'ta, dış analitik istekleri bloke edilir. Kod testleri canlı Cloudflare dağıtımı yerine yerel statik Astro çıktısını denetler.

İlk aşamada axe-core **critical** bulguları başarısız kabul edilir; serious/moderate/minor bulgular test çıktısında kayıtlıdır ve sonraki kalite PR'larıyla çözülmelidir. Bu durum tüm WCAG uygunluğunun onaylandığı anlamına gelmez.

Test bağımlılıkları CI içinde `@playwright/test@1.65.1` ve `@axe-core/playwright@4.14.0` olarak sabit sürümle, yalnızca iş akışında kurulur; sitenin üretim JS paketine dahil edilmez. Projede kalıcı devDependency kullanımı için gelecekte `package-lock.json` da birlikte güncellenmelidir.

## 2. CodeQL (GitHub hesabından)

Aç: https://github.com/onuronkol2-collab/tractorcompare-data/settings/security_analysis

`Security / Code security` bölümünde `CodeQL analysis` -> `Set up` -> `Default` -> `Enable CodeQL` seç. Ücretsiz kamuya açık depoda JavaScript/TypeScript analizi uygundur. Eğer CodeQL daha önce etkinse **ikinci analiz workflow'u oluşturma**; mevcut durumu kullan. Sorunları `Security` -> `Code scanning` bölümünden incele.

GitHub'ın güncel ekran isimleri Türkçe/İngilizce farklı olabilir. Eğer ayar görünmüyorsa ekran görüntüsüyle doğrula.

## 3. Dependabot (hazır PR + GitHub ayarı)

`.github/dependabot.yml` npm ve GitHub Actions için haftalık otomatik **PR önerileri** oluşturur. Güncellemeleri doğrudan üretim koduyla birleştirmez; lockfile ve testler kontrol edilmelidir.

Yönetici arayüzünde ayrıca `Dependency graph`, `Dependabot alerts`, `Dependabot security updates` ayarlarını aç. Bu üçü sürüm güncelleme PR'larından farklı özelliklerdir. Açmak mevcut RLS/veritabanını değiştirmez.

## 4. Cloudflare Web Analytics (kullanıcının hesabında)

Cloudflare paneline git: https://dash.cloudflare.com/?to=/:account/web-analytics

- `Web Analytics` -> `TractorVS / tractorvs.com` kontrol et. Zaten site ekliyse **tekrar site veya snippet oluşturma**.
- `Manage site` -> etkinleştirme seçeneğini incele. Cloudflare-proxy kullanılan alan adlarında otomatik JS enjeksiyonu mümkün olabilir.
- Mevcut site analitik politikası GA4/Clarity için açık opt-in gerektirir. Cloudflare otomatik enjeksiyonun kullanıcı tercihini atlayabileceğini göz önünde tut. Site gizlilik bilgilendirmesini ve KVKK/GDPR değerlendirmesini tamamlayana kadar otomatik enjeksiyonu açma.
- Etkinleştirmeden sonra tarayıcıda `static.cloudflareinsights.com/beacon.min.js` isteğinin yalnızca beklenen bağlamda **tek kez** yüklendiğini, `/cdn-cgi/rum` verilerinin geldiğini ve mevcut GA4/Clarity öncesi izin kuralının ihlal edilmediğini kontrol et.
- Veri eksikliği varsa EU exclusion veya otomatik enjeksiyon ayarlarının etkisini ayrıca kontrol et.

Çerez kullanmaması, KVKK/GDPR kapsamında her türlü bilgilendirme yükümlülüğünü otomatik olarak kaldırmaz. İzleme kodunu iki farklı yerden kurma.

## Test / yayın kuralları

- Ana dala yeni araç PR'sını ancak CI başarılı olduğunda, hiçbir mevcut SEO/RLS/gizlilik kuralı bozulmadığında al.
- CodeQL ayarı ve Cloudflare etkinleştirme GitHub dosyası oluşturarak kendiliğinden tamamlanmaz; kullanıcı panelinden gözle doğrulanmalıdır.
- Bu araçlar saha kullanıcı verilerini toplamaz: Playwright+axe-core sentetik testtir; Cloudflare Web Analytics gerçek ziyaretçi performansı ölçümüdür.

## Resmî belge bağlantıları

- Playwright CI: https://playwright.dev/docs/ci
- axe-core Playwright: https://www.npmjs.com/package/@axe-core/playwright
- CodeQL default setup: https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configure-code-scanning
- Dependabot: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-version-updates
- Cloudflare Web Analytics: https://developers.cloudflare.com/web-analytics/get-started/
