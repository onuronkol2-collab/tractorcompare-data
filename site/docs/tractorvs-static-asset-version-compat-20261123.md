# TractorVS — Cloudflare Astro statik dosya bütünlüğü ve sürümler arası uyumluluk

**Tarih:** 23 Kasım 2026. **Durum:** Kanıta dayalı önleyici yayın kapısı + çevrimdışı test. Bu belge canlı Cloudflare dağıtımının doğru SHA'da olduğunu veya gerçek ziyaretçide sürüm hatası yaşandığını kanıtlamaz.

## Gerçek mimari ve bulgu

TractorVS Astro 7 statik HTML'ini Cloudflare Workers Static Assets ile yayımlıyor. `site/wrangler.jsonc` içinde statik yollar varsayılan olarak asset-first, yalnız dil, kök, sitemap ve lisanslı fotoğraf gibi özel yollar Worker-first. `site/public/_headers` içindeki `/_astro/*` kuralı zaten `Cache-Control: public, max-age=31536000, immutable` içeriyor. **Önbellekleme bir sürümde eksik dosyanın diğer sürümde bulunmasını garanti etmez.** O nedenle tüm yolları Worker-first yapmadık, tarayıcı önbelleğini körlemesine değiştirmedik.

Cloudflare'ın **12 Kasım 2026** güncellenen version-skew belgesine göre her Worker sürümü kendi asset manifestini kullanır. HTML bir sürümden, JS/CSS/font başka bir sürümden gelebilir. Bir dağıtımın yayılması, bölünmüş trafik, uzun süre açık kalan tarayıcı sekmeleri ve rollback iki yönde de uyumsuzluk oluşturabilir. Salt `wrangler deploy` başarısı veya yeni sürümün asset dosyalarının varlığı diğer sürümün eksik dosyaları servis edeceği anlamına gelmez.

**Resmî kaynaklar:**
- Cloudflare (12 Kasım 2026): https://developers.cloudflare.com/workers/versions-and-deployments/version-skew/
- Cloudflare Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Cloudflare static headers: https://developers.cloudflare.com/workers/static-assets/headers/
- Astro Cloudflare deploy: https://docs.astro.build/en/guides/deploy/cloudflare/

## Bu PR'deki somut geliştirme

1. `site/scripts/verify-static-assets-version-compat.mjs`: oluşturulan `dist` klasöründeki HTML ve `/_astro` içindeki JS/CSS çıktılarının **ilk taraf, dosya uzantılı** `/_astro/` başvurularını çıkarır. Her başvurunun aynı derlemede fiziksel bir statik dosyaya karşılık gelmesini denetler. Şüpheli dizin segmentlerini ve symlink'leri reddeder.
2. `site/scripts/production-release-gate.mjs`: mevcut fail-closed `postflight` içine bu denetimi ekler. Eksik JS, CSS veya font varsa Cloudflare'a paket göndermeden önce yayın durur. Model verileri, bağlantılar, 10 dil, forum, analitik izinleri, fotoğraf lisansları, RLS ve SEO kuralları değiştirilmez.
3. İsteğe bağlı **iki derleme karşılaştırması**: `node site/scripts/verify-static-assets-version-compat.mjs site/dist /guvenilir/onceki-dist` eski sürümden yeniye kaybolan statik dosyaları ve tersi yöndeki riskleri ayrı sayar. Bu rapor **olası sürüm riski** kaydıdır; gerçek canlı hata veya dağıtım durumu değildir.
4. `site/tests/verify-static-assets-version-compat.test.mjs`: hem eksik dosya hem temiz derleme, eski/yeni sürüm, tutulmuş önceki varlıklar, traversal ve symlink gibi negatif/pozitif senaryolar.

**Sınırlar:** Dinamik fotoğraf proxy'sinin kaynak kimliği/HTTP/MIME/SHA denetimi bu skriptin kapsamı dışında; mevcut ayrı fotoğraf testleri devam eder. JavaScript tarafından çalışma zamanında hesaplanan keyfi dosya yollarını statik metin taraması bütünüyle keşfedemez. Cloudflare'ın eski ve yeni canlı sürümlerini bu PR karşılaştırmıyor; önceki build çıktısı sağlanmadıkça iki sürümlü rapor üretilemez. İsteğe bağlı iki sürüm karşılaştırması, geri alma için kopyalanması gereken tüm dolaylı dosyaların kesin kanıtı değil, tespit edilen uyumsuzlukların konservatif kanıtıdır.

## İzleme ve kalite kriterleri

- **P0 aynı derleme bütünlüğü:** Üretim derlemesi yayın öncesinde hatalı `/_astro/` başvurusu olmadan geçmeli. `node --test` ve CodeQL de başarılı olmalı.
- **P1 iki sürüm ve rollback provası:** Güvenilir önceki statik build artefaktı bulunduktan sonra eski HTML'nin bütün JS/CSS/font dosyaları yeni manifestte mi; yeni HTML'nin dosyaları eski sürümde mi; eski sekmede karşılaştırma/forum/fotoğraf lightbox çalışıyor mu? İki yönü ayrı kontrol et. Cloudflare'ın yayımlanmış aktif Worker sürüm/commit SHA'sı ayrı delildir.
- **P1 mobil performans:** Mevcut haftalık `catalog-mobile-footprint-monitor.yml` ölçümlerine göre 10 dilde exact model bağlantı setleri ve HTML boyutu zaten denetleniyor. Onun yerine yeni paralel cron açma. Gerçek kullanıcı INP ve RUM erişimi yoksa Lighthouse veya ham HTML boyutunu INP iyileşmesi diye sunma.
- **P2 aşamalı varlık tutma:** Gözlenmiş eski dosya kaybı ve önceki artefaktlar varsa, eski hash'li dosyaları kısa süre koruma, iki aşamalı dağıtım ya da Cloudflare'ın desteklediği version affinity/override seçenekleri için kısıtlı pilot değerlendir. Yeni sürümün eski sürümde bulunmaması sorunu yalnız yeni dosyayı bugünkü release'e eklemekle çözülmez. Varsayılan olarak ücretli kaynak veya yeni Worker route açma.

## Uygulama gerçeği

**Yazıldı/PR'de test edildi/ana dala alındı/canlıda ölçüldü** adımlarını ayrı yaz. CI'da yalnız bir derlemenin link bütünlüğünün geçmesi `version skew sıfır` anlamına gelmez. Cloudflare rollback ve farklı PoP yayılımı gerçek test olmadan doğrulanmış gösterilemez.
