# TractorVS Maksimum Geliştirme Hızı — kalite ve ücretsiz bütçe korunarak

## Ölçülen başlangıç noktası

25 Kasım 2026, #705, gerçek üretim SHA `692fe414fc050c008f9071cb829092e98afa238c`.
[Ön yayın](https://github.com/onuronkol2-collab/tractorcompare-data/pull/705/checks); [canlı tarayıcı](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45666528664); [canlı SEO](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45666528754).
- Node/derleme işi 39 saniye; en uzun PR tarayıcı işi 3,6 dakika.
- Canlı seri iş 16,1 dakika (172 gerçek tarayıcı testi, 7,7 dakika test yürütümü; kalan kurulum/runner hazırlığı).
- Birleştirme 17:36 UTC, Cloudflare başarılı 17:46 UTC, ilk erken test DEPLOYMENT_PENDING, başarılı doğrulama 18:04 UTC. Yaklaşık 28 dakika uçtan uca.
- 44/44 canlı SEO HTTP, 15 stil dosyası ve 172/172 canlı test. Ön yayın ve üretim kanıtı ayrı.

## Uygulanan aday mimari ve kalite kapıları

Tek ortak release-readiness, güvenilir Cloudflare check ve aynı SHA'lı gerçek karşılaştırma/katalog HTML; 46 deneme × 20 saniye üst bekleme aralığı (ağ istekleri ve runner süreleri ayrıca; job timeout 25 dk). Gerçek ana dal ardılı kabul edilir, eski veya karışık sürüm kabul edilmez. Kanıt hazır olmadan tarayıcı kurulumu yok. Matrix `max-parallel: 2`, dört tam proje, bir worker/proje, yalnız gereken motor; her projenin başında/sonunda aynı gerçek SHA. Üretim 43+ test/proje, sıfır skip/flaky/başarısız, 11+ baseline PR testi ve yalnız 32 belgeli sürüme bağlı istisna; raporda yeni test, kapsam ve süre gerçek sayılır. Stable aggregate production-browser; her iki kapı başarısı gerekli. SEO tarih kanıtı da aynı güvenilir check seçicisini kullanır. Her işin çıktısı ayrı 7 gün saklanır; gizli bilgi yok. Yeni iş akışı eklenmez.

## Ek zaman kazancı planı (uygulama durumu ayrı izlenir)

1. **Toplu koordinasyon:** açık PR dosyalarını ve bağımlılıklarını tek turda incele; aynı kök nedenli değişiklikleri aynı PR, bağımsız riskleri ayrı tut. İş sahibi/branch/base SHA/etkilenen dosyalar/kanıt/sonraki adım PR kaydında. Aynı işi başka ajanla tekrar başlatma. Ana dalın gerçek durumu son birleştirmeden önce kontrol edilir.
2. **Erken ve ucuz hata tespiti:** birim/şema/JSON/çeviri/syntax kontrollerini ilk toplu çağrıda, güvenlik ve ilgili tam browser gruplarını paralel yürüt; kaynak SHA değişince gerekli kapsam tekrar test edilir. Hata günlüklerinden kök neden düzelt; başarılı kontrollerin gereksiz rerun'u yok.
3. **Kurulum ve cache:** npm lockfile cache; Playwright yalnız gereken engine. Playwright resmî dokümanı browser binary cache'in çoğu durumda indirme kadar sürebildiğini belirtiyor; önce ölç, cache yalnız exact Playwright/OS anahtarı ile pilot. Cloudflare Build Caching ve watch paths paneli yetkili erişimle denetlenmeli; ayar değişikliği burada yapılmadı. Sadece kanıtlanmış docs-only değişiklikler için watch paths değerlendirilir; ortak kaynak, lockfile, data, worker, scripts ve QA kapıları hariç bırakılmaz.
4. **Build artifact reuse pilot:** yerel inert build'in dört browser job'da tekrar oluşturulması runner süresini artırabilir. Önce süre/boyut ölçümü. Aynı SHA, lockfile, Node/OS, tüm build girdileri, env/manifest ve artifact hash; salt okunur build, gerçek üretim secret ve Supabase verisi yok; production Cloudflare postflight bağımsız kalır. İndirme maliyeti ek kritik yol kazancından düşükse tek build pilotu. Doğrulanmamış cross-PR/üretim artifact reuse yok.
5. **Veri ve görsel:** kaynak ailesi başına toplu doğrulama, UUID ve hash tekilleştirme, aynı kaynak dosyasının tekrar indirilmemesi, eksik modellerin önceliklendirilmesi, lisans/atıf/model/ön-yan görünüm/10 dil ve canlı kanıt aynen korunur. RLS ve nominal teknik yayın gate değişmez.
6. **Ortak bileşen ve test sözleşmesi:** tekrar eden arama, filtre, klavye, locale, hata durumu ve fotoğraf bileşenleri tek test edilmiş yardımcıdan; kapsam dışı yeniden yazma yok. Yeni özellik önce küçük prototip/ölçülebilir kabul ölçütleri, sonra uyumlu toplu uygulama.
7. **Ölçüm:** aynı kapsamla önce/sonra en az üç gerçek release; queue, kurulum, build, dört proje, canlı doğrulama, runner-minutes, retry/flaky/skip, kaynak/Foto UUID başına süre; median ve p95, hata nedenleri. Hedef 28 dakikadan daha kısa; 14 dakika hedef, garanti değil. Üretim 429/5xx veya maliyet artışı görülürse parallel=1 ya da pilotu geri al. 4 eşzamanlı projeye ancak ölçümden sonra geç. Uzun süreli otomasyon yalnız mevcut zamanlanmış görevlerle ve ücretsiz kotalarla.
8. **Dağıtım koordinasyonu:** main push sonrası ortak gate ve son canlı SHA; zaman aşımı gerçek durum olarak DEPLOYMENT_PENDING. Yetkili ve güvenli ise Cloudflare check tamamlanma olayı ile tetikleme pilotu; önce GitHub event/branch/token/fork ve mevcut check kuralları doğrulanmalı. Aynı release'i iki farklı workflow ile tekrar tarama yok. Otomatik merge yalnız gerekli branch-protection kuralları gerçekten uygulanıyorsa; durum bilinmiyorsa manuel güvenli merge.

## Geri alma ve durdurma şartları

PR tüm zorunlu ön yayın kontrolleri geçmeden ana dala alınmaz. Matrix eksik/iptal/flaky/skip üretim başarısı değildir. Rate-limit/Retry-After, yetkisiz erişim, sürüm uyuşmazlığı veya gerçek yeni hata halinde dur ve kaydet. Bu paket CI/rehber değişikliğidir; veri tabanı, fotoğraf hakları, canlı UI ve Cloudflare hesap ayarları değiştirilmez. Sorun çıkarsa squash commit revert, önceki seri workflow ve mevcut yayın kapıları korunur. Kaliteyi düşürerek süre kazanma yok.

Resmî kaynaklar: [Playwright CI](https://playwright.dev/docs/ci), [Sharding](https://playwright.dev/docs/test-sharding), [GitHub Actions matrix ve concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Cloudflare Workers build caching](https://developers.cloudflare.com/workers/ci-cd/builds/build-caching/), [Workers build watch paths](https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/).
