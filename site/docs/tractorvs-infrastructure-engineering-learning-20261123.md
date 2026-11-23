# TractorVS — Altyapı mühendisliği: resmî kaynaklara dayalı öğrenme ve kabul kriterleri

**Tarih:** 23 Kasım 2026  
**Durum:** Salt-okunur repo ve resmî dokümantasyon araştırması. Bu kayıt canlıda değişiklik, güvenlik açığı tespiti, yeni performans ölçümü veya üretim yayını iddiası değildir.

## Kapsam ve mevcut mimarinin doğrulanmış gerçekleri

- `package.json`: npm workspaces, Node >=22.23.4; `site/package.json`: Astro 7.4.12, Wrangler 4.162.0, statik site build.
- `site/astro.config.mjs`: `output: "static"`, koşullu sitemap, kaynağa dayalı sitemap `lastmod`. 10 dilin bulunması çevirilerin tamamının editoryal olarak onaylandığı anlamına gelmez.
- `wrangler.jsonc` ve `site/worker/index.js`: **Cloudflare Workers Static Assets**, tüm URL'lerde genel Worker değil; `run_worker_first` yalnız seçili rota kümelerinde, ör. kök, dil yönlendirmesi, sitemap alias'ı, coğrafi API ve traktör fotoğrafları.
- `.github/workflows/tractorvs-production-release-check.yml` production bundle'ı **deploy etmeden** denetliyor. `site/docs/CLOUDFLARE_RELEASE_RECOVERY_TR.md` gerçek Cloudflare Workers build ve rollback sözleşmesini açıklıyor. **Pages** belgelerini bu Workers kurulumunun çalıştığını varsayarak kullanma.
- `.github/workflows/tractorvs-publication-autosync.yml` ve `tractorvs-forum-publication-autosync.yml` farklı zamanlanmış, ayrı concurrency group'ları olan, yalnız yayımlanmış içeriği statik build'e yansıtan süreçler. Güncellemeler dakikasına garanti değildir; GitHub cron best-effort'tur.

## Yeni doğrulanan mühendislik ilkeleri

### 1. Cloudflare: Worker-first yalnız gerekli yerde, statik dosya önce

**Kaynak:** https://developers.cloudflare.com/workers/static-assets/routing/worker-script/ ; https://developers.cloudflare.com/workers/platform/pricing/ (23 Kasım 2026 kontrolü)

Cloudflare, Static Assets + Worker için normalde statik dosyayı önce kontrol eder. `assets.run_worker_first` ilgili isteklerde Worker'ı önce çalıştırır. Bu, kimlik doğrulama, URL yönlendirmesi ve lisans kontrollü fotoğraf proxy'si gibi durumlarda gerekli olabilir; ama bütün statik yolları körlemesine Worker'a almak gecikme/maliyet yüzeyi yaratır. Static-asset-first yolları ve Worker-first yolları **ayrı** sınıflandır; gerçek trafik, fatura, fotoğraf lisans zinciri ve fonksiyonel test olmadan rota kaldırma/ekleme yapma.

**TractorVS kontrolü:** 200/404/308/502, doğru MIME, tarayıcı/edge cache, aynı modelin dosya kimliği ve görsel lisans kanıtı, locale cookie yönlendirmesi, sayfa canonical'ı, Worker invocation sayısı. Worker-first fotoğraflarda 429/502 kaynak arızasını sıradan statik asset yanıtıyla karıştırma.

### 2. Cloudflare build, preview ve geri alma: üç farklı kanıt

**Kaynak:** https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ ; https://developers.cloudflare.com/workers/previews/configuration/

Build başarılı = canlıda doğru sürüm değil. Önce CI commit SHA ve fail-closed üretim `build:production`, ardından Worker dry-run/preview, **sonra** Cloudflare'ın aktif production version/commit'i ve gerçek `tractorvs.com` HTTP kanıtı ayrı raporlanmalı. `site/` working directory, `wrangler` dosyası, build-time `SITE_URL` / `PUBLIC_INDEXING_ENABLED` / publishable Supabase anahtarı ve runtime secret ayrımını koru. Preview izolasyonu, indekslenmeme ve veri gizliliğini bağımsız test et. Rollback önceki çalışan version'a dönebilir; veritabanı değişikliklerini otomatik geri almaz.

**Kabul kriteri:** 10 locale'de HTML + canonical/hreflang/robots, sitemap, en az bir karşılaştırma, forumun yalnız yayımlanmış konuları, fotoğraf 200/MIME/hash ve production SHA. Deploy doğrulanmadıysa “yayında” deme.

### 3. Supabase / PostgreSQL: RLS'nin varlığı yerine davranışını kanıtla

**Kaynak:** https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/database/postgres/testing-row-level-security ; https://supabase.com/docs/guides/database/query-optimization

RLS'yi `anon`, `authenticated`, yazar, moderatör ve yetkisiz kullanıcı matrisinde **hem izin verilen hem reddedilen** işlemlerle sınamak gerekir. Supabase `auth.uid()` giriş yapmamış istekte `null` dönebilir. Tarayıcıda asla `service_role`, `sb_secret` veya başka yönetici sırrı kullanılmaz. Önceki `site/docs/INFRASTRUCTURE_AUDIT_20261120_TR.md` bulgularını güncel linter/DDL olmadan hâlâ aktif açık olarak sunma. İndeks eklemeyi sadece FK uyarısına bakarak otomatikleştirme; gerçek sorgu örüntüsü ve `EXPLAIN (ANALYZE, BUFFERS)` çıktısı ile karar ver.

**Kabul kriteri:** pgTAP `supabase test db` yerel/izole testte beklenen pozitif-negatif sonuçları verir; public published view hiçbir draft/archived kayıt döndürmez; yetkisiz forum taslağı ve başka kullanıcının profili okunamaz; migrasyon/rollback ve yedekleme geri yükleme planı önceden hazırlanır.

### 4. GitHub Actions: en az yetki, bağımlılık sabitleme, iş akışları arası yarış analizi

**Kaynak:** https://docs.github.com/en/actions/reference/security/secure-use ; https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency

`GITHUB_TOKEN` varsayılanı salt-okunur, yazma izni yalnız gerçekten commit/PR üreten job'da. Fork/Dependabot/PR güven sınırında secret yok. GitHub'ın güncel güvenlik rehberi uygun ortamda **workflow dependency lockfile** veya doğrulanmış tam SHA ile action bağımlılığını sabitlemeyi öneriyor; sürüm yükseltmesini CI olmadan toplu yapma. `concurrency` aynı group içi koşuları sınırlar; katalog ve forumun **farklı** group'ları birbirlerini seri hale getirmez. Bu olası çatışma alanıdır, gerçekleşmiş race iddiası değildir.

**Kabul kriteri:** Repo otomasyon envanteri, zamanlı tetikleyicilerin hangi dosyaları yazdığı, tek hedef branch'e eşzamanlı commit olup olmadığı, reddedilen push/retry, toplam Actions dakikaları ve gizli değişken kapsamı ölçülür. Yazma işleri için güvenli sıralama/yeniden deneme tasarımı yapılır; yayın işinin ortasında `cancel-in-progress: true` körlemesine uygulanmaz.

### 5. Gözlemlenebilirlik ve maliyet sınırı

**Kaynak:** https://developers.cloudflare.com/workers/observability/logs/workers-logs/ ; https://developers.cloudflare.com/workers/platform/limits/

Repo `wrangler.jsonc` içindeki `observability.head_sampling_rate=0.1` örneklemli günlüklemeyi gösteriyor; bunun fiilen canlı sürümde aktif olduğu yalnız config okuyarak kanıtlanmaz. Kullanıcı/oturum gizliliği gözetilerek Worker 5xx/1102, fotoğraf 502 ve origin 429, Supabase REST hata oranları, yönlendirme döngüleri, CDN hit/miss ve yayın SHA etiketleri incelenmeli. Cloudflare belgeye göre **1 Aralık 2026**'da Workers Logs fiyatlandırması değişecek; maliyeti ve mevcut hesabın limitlerini yeniden doğrulamadan sampling'i 1'e çekme.

**Kabul kriteri:** dönem, örneklem oranı, URL/locale, sürüm SHA, hata türü, kullanıcı etkisi, anonimleştirme ve aylık maliyet tahmini belirtilir. RUM/CrUX saha p75 ile Lighthouse/Playwright laboratuvar testleri ayrı kaydedilir.

### 6. SEO/GEO altyapısı: taranabilir gerçek HTML ve kanıta dayalı görünürlük

**Kaynak:** https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics ; https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap ; https://developers.google.com/crawling/docs/crawl-budget

Statik Astro çıktısı model adı, teknik veri, bağlantı ve kaynakları **ilk HTML içinde** kullanıcı ve bot için erişilebilir tutmalı. `<lastmod>` güncelleme kanıtıyla eşleşmeli; her locale yalnız gerçek çevrilmiş ve yayımlanmış içeriğe canonical/hreflang vermeli; preview yanlışlıkla indekslenmemeli. Google'ın ayrıntılı “crawl budget” kılavuzu çok büyük/hızlı değişen siteleri hedefler; TractorVS için önce gerçek GSC verisi ve URL indeksi kanıtı gerekir, özel “bütçe krizi” varsayma.

**Kabul kriteri:** URL Inspection/GSC durumları, indexability, robots, canonical, sitemap, yazar/kaynak/veri doğruluğu ve gerçek arama gösterimleri ayrı raporlanır; sıralama/AI citation garantisi verilmez.

## Önceliklendirilmiş ölçüm / iyileştirme sırası

| Öncelik | Karar kapısı | Önce istenecek kanıt | Kapsam dışı otomatik davranış |
| --- | --- | --- | --- |
| P0 | Canlı veri gizliliği/RLS ve yayın bütünlüğü | pgTAP, anon/author matrix, kaynak + live SHA, rollback | RLS'yi gevşetmek, taslağı yayımlamak |
| P0 | Eşzamanlı yazan otomasyonların yarış analizi | Actions log, push retry, değişen fingerprint yolları | Tüm cron'ları durdurmak |
| P1 | Fotoğraf Worker/origin cache | 200/502/429, cache headers, Worker çağrısı, foto kimliği | Lisans/kimlik denetimini kaldırmak |
| P1 | 10 dilde ilk HTML + mobil saha deneyimi | GSC, p75 CWV, canlı HTTP, gerçek çeviri | Çevrilmemiş locale'yi indekslemek |
| P1 | Yayın/rollback güvenilirliği | Build SHA -> Cloudflare version -> canlı SHA | Sadece yeşil CI'ya dayanmak |
| P2 | DB sorgu maliyeti/indeks | `EXPLAIN`, tablolar ve linter geçmişi | Körlemesine indeks eklemek |
| P2 | Operasyon bütçesi | Worker requests/CPU, loglar, CI dakikaları | Varsayılan ücretli servis açmak |

## Uygulama disiplini

**Öğrenildi / doğrulandı / uygulandı / test edildi / ana dala alındı / canlıda doğrulandı** ifadeleri birbirine karıştırılmayacak. Var olan release gate, ana model/fotoğraf eşleşmesi, 10 dil, forum moderasyonu, rıza kontrolü ve güvenlik politikaları korunacak. Büyük etkili değişikliklerde önce salt-okunur veri, sonra ölçülebilir hipotez, küçük ve geri alınabilir PR, negatif regresyon testleri, canlı SHA doğrulaması. Bu belge canlı iyileştirme yapmaz; sonraki çalışma için karar ve test standardı oluşturur.
