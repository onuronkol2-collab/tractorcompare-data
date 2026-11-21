# TractorVS — Makale çevirileri: 10 dil kalite ve kapsam denetimi
**Tarih:** 21 Kasım 2026
**Kapsam:** Makale arşivi, Traktör seçme rehberi, Başak 2075 BK kaynaklı incelemesi; diğer dört yazının yayımlanmış dil kapsamı.
**Temel kural:** Depo kökündeki `AGENTS.md` (SEO + GEO + özgünlük + kanıt ve güvenli yayın).

## Gerçek çeviri matrisi

| İçerik | en | tr | zh | hi | pt-BR | fr | de | ru | ja | es |
|---|---|---|---|---|---|---|---|---|---|---|
| Makale arşivi, başlık ve altı özet | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Traktör seçme rehberi, tam metin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Başak 2075 BK incelemesi, tam metin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teknik terimler ve parçalar, tam metin | ✓ | ✓ | — | — | — | — | — | — | — | — |
| Motor gücü ve tork, tam metin | ✓ | ✓ | — | — | — | — | — | — | — | — |
| Hidrolik kaldırma, tam metin | ✓ | ✓ | — | — | — | — | — | — | — | — |
| PTO / kuyruk mili, tam metin | ✓ | ✓ | — | — | — | — | — | — | — |

28/60 uzun makale–dil kombinasyonu gerçek tam metin sayfasına sahiptir. 32/60 henüz çevrilmemiştir; **bunlar yayımlanmış gibi gösterilemez**. Arşivin sekiz ek dilinde açık İngilizce tam metin uyarısı verilir. Bu tablo bir çeviri kapsamı listesi olup tüm dillerde uzman çevirmen onayı değildir.

## Kaynak/kod ve canlı kontroller

1. Türkçe/İngilizce asıllar ve sekiz dilde `editorial-hub-i18n.ts`, `tractor-guide-i18n.ts`, `basak-2075-review-i18n.ts` karşılaştırıldı.
2. Sekiz seçme rehberinde **6 bölüm × 2 açıklama**, bölüm soruları, aynı kaynak dizini ve **5 satırlı** karşılaştırma tablosu korundu.
3. Sekiz Başak incelemesinde **4 bölüm × 2 paragraf**, **8 veri satırı**, 3 yerel ölçüm açıklaması, üretici kaynaklarının isimleri ve varyant uyarısı korundu. 53 kW / 72 hp, 273 Nm, 3142 cm³, 540E, 1953/1506 motor dev/dak, 3000 kg ve 3080 kg gibi sayısal değerler değişmedi. `2500 rpm` tüm diller için ortak, çevrilmeyen teknik değer hücresindedir.
4. Yayında on makale merkezinin tamamı HTTPS 200, yerelleştirilmiş H1, kendine ait canonical, 10 dil + x-default hreflang ve `CollectionPage`/`ItemList`/`BreadcrumbList` JSON-LD sundu. Sekiz ek dilde dört gerçek İngilizce bağlantısı uyarıyla gösteriliyor.
5. Sekiz dilin seçme rehberi ve Başak incelemesi (toplam **16 tam metin URL**) ayrı ayrı HTTP 200, dil etiketleri, karşılıklı kaynaklı teknik değerler ve 6/4 bölüm yapısı açısından canlı denetlendi.
6. Dil sorunları: Hintçe 'आँकड़े तुलना करें' ifadesi 'आँकड़ों की तुलना करें' olarak düzeltildi; muğlak 'पकड़' yerine çekişi belirten 'पहियों की कर्षण क्षमता' seçildi. Tüm dil arşivlerinde İngilizce tam metin bağlantısına `hreflang=en`, ekran okuyucu için dil uyarısına erişilebilir etiket eklendi. Uzun makalelerde İngilizce kalan navigasyon `aria-label` metinleri 10 dildeki gerçek etiketlerle değiştirildi.
7. Kurumsal kaynak sayfa başlıkları gerektiğinde orijinal İngilizce bırakıldı ve `lang=en` ile işaretlendi; bunlar çevrilmiş makale gövdesi yerine geçmez.
8. Bu denetim için `site/tests/editorial-translation-integrity.test.mjs` ve `site/e2e/editorial-hub.spec.mjs` regresyon testleri eklendi.

## Yayın engeli ve dürüst sınırlamalar

- Çevirilerde boş segment, eksik bölüm veya ölçüm rakamı farkı tespit edilmemiş olması tek başına **ana dili konuşan uzman tarafından cümle cümle onay** değildir. 10 dilin tamamı için bağımsız yerel teknik editör onayı bu çalışmada alınmadı; yüzde 100 kusursuzluk beyanı yapılamaz.
- Çevrilmeyen dört uzun yazı için sekiz dilde sahte içerik, aynı İngilizce gövdeyi kopyalayan SEO sayfası veya yanıltıcı `hreflang` açılmamalıdır.
- `AGENTS.md` gereğince yeni PR'ın CodeQL, Astro build, üretim paket kontrolü, Playwright/axe ve diğer CI kapıları geçmeden ana dala birleştirilmesi uygun değildir. Birleştirme ve Cloudflare dağıtımı sonrasında **canlı** HTML ve sitemap tekrar doğrulanmalıdır.
- Canlı URL ve doğru `hreflang` bulunması Google indekslenmesi, AI arama görünürlüğü veya trafik artışı garantisi değildir.
- Gerçek tam metinler kaynaklı teknik analizdir; sahada test yapıldığı iddiası taşımaz. Üretici verileri saha güvenilirlik/arıza oranı şeklinde yorumlanamaz.

## Tekrar kontrol edilmesi gerekenler

Her editoryal dil eklemesinde otomatik testlerin ardından yerel terminoloji, güvenlik talimatları, sayısal değerler/birimler, teknik model yılı–pazar–varyant, link varlığı, canonical/hreflang/sitemap, doğal dil kalitesi ve gerçek kaynak URL'leri yeniden incelenmelidir. Mümkün olduğunda ana dilde tarım makineleri uzmanı incelemesi ayrıca alınmalıdır.
