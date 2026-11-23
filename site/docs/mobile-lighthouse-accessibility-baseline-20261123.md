# TractorVS — Mobil Lighthouse ve erişilebilirlik kanıt kaydı (23 Kasım 2026)

Bu belge, canlı siteden GitHub Actions'ın [23 Kasım 2026 Lighthouse baz ölçümü](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45119323039) ile üretilen **sentetik laboratuvar verilerini** özetler. Saha p75 LCP/INP/CLS ölçümü değildir; farklı diller veya örnek sayfalar arasında tek ölçümle genelleme yapmayın.

| Sayfa / locale | Performans | Erişilebilirlik | Lab LCP (ms) |
| --- | ---: | ---: | ---: |
| TR ana sayfa | 66 | 96 | 2649 |
| EN ana sayfa | 100 | 96 | 1417 |
| ZH ana sayfa | 98 | 96 | 2027 |
| TR katalog | 96 | 100 | 2344 |
| TR model | 97 | 100 | 2352 |
| TR karşılaştırma | 100 | 100 | 1408 |
| TR traktör danışmanı | 97 | 100 | 2158 |
| TR makaleler | 100 | 100 | 1307 |
| EN teknik sözlük | 99 | 100 | 2010 |
| TR seçim rehberi | 100 | 100 | 1392 |
| TR inceleme | 100 | 100 | 1346 |
| TR forum | 98 | 96 | 2069 |
| DE model | 98 | 100 | 2169 |
| JA rehber | 100 | 100 | 1265 |

Bu örneklerin Lighthouse SEO kategorisi 100'dür. Gerçek Google indekslenmesi veya her URL'nin SEO kalitesiyle aynı şey değildir.

## Doğrulanmış sorunlar ve çözüm

1. Ana sayfanın üç örneğinde lisanslı fotoğraf kaynak bağlantısı, koyu zeminde marka yeşili olduğundan 2,31:1 kontrast gösterdi. PR #553 ana sayfa ile sınırlandırılmış daha açık `#d8efc5` rengi kullanır (koyu `#19271f` zemine karşı hesaplanan 12,63:1). Kaynak atfını ve lisans bağlantılarını korur.
2. Forum yayımlanma tarihleri `#6c7d70` / beyaz = 4,37:1, mobil istatistik etiketleri `#708074` / beyaz = 4,17:1; her ikisi normal metin için 4,5:1 eşiğinin altındadır. PR #553 sınırlı `#48634f` / beyaz (6,62:1) kullanır.
3. `<article role="listitem">` etiketinin rolü Lighthouse `aria-allowed-role` hata raporunda geçersizdi. PR #553 forum kartlarında doğal `<article>` HTML semantiğini ve mevcut bağlantıları koruyup uygunsuz list/öğe rollerini kaldırır.
4. TR ana sayfanın 66 puanı, aynı koşullarda EN=100 ve ZH=98 olduğundan tek bir yüksek TBT örneği olarak ayrı tekrarlı ölçüm gerektirir. Bu PR tüm sayfaların hızını yükselttiği veya saha INP sorununu çözdüğü iddiasında değildir.

## Önleme, doğrulama ve sınır

- Yeni `site/tests/lighthouse-contrast-aria-regression.test.mjs` kontrast formülünü ve erişilebilir semantiği çevrimdışı test eder; yeni sayfa değişikliğinde GitHub Actions'ın üretim derleme/test kapısına girer.
- Ayrıca mevcut `mobile-performance-audit.yml` on dört şablonu her hafta ölçer ve Lighthouse JSON tanıları yedi gün artefakt olarak saklar.
- Değişiklik PR'da iken canlı Lighthouse **eski** sürümü ölçer. PR inceleme + CI + güvenli dağıtım sonrası aynı sayfa/cihaz/lab ayarında yeniden ölçüm; sonrasında gerçek kullanıcı p75 CWV kontrolü gerekir.
- Fotoğraf lisansı, exact model/yıl/varyant, 10 dil, RLS, canonical, hreflang, forum moderasyonu ve analitik açık rıza değişmedi.
- Basit geri alma: PR #553'ün ayrı commitlerini `git revert` ile geri çevirmek; RLS/veri üzerinde rollback gerekmez.

Kaynak: GitHub Actions Lighthouse JSON arşivi / test koşulu. Bu ölçüm bir hata düzeltmesinin üretimde başarıyla yayımlandığını kanıtlamaz.