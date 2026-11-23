# TractorVS: forum rich results, AI içerik güvenilirliği ve INP mühendislik kılavuzu

**Araştırma tarihi:** 23 Kasım 2026  
**Kanıt seviyesi:** Güncel resmî Google/web.dev kaynakları + GitHub ana dalında kaynak kodu salt-okunur incelemesi. Bu belge **yayımlanmış yeni şema, canlı site optimizasyonu veya ölçülmüş INP başarısı iddia etmez.**

## Kaynaklar ve öğrenilen kesin kurallar

1. **Google `DiscussionForumPosting`** — yalnız gerçekten kullanıcıların oluşturduğu gönderiler için uygundur. `author`, `author.name`, `datePublished` ve `text` / `image` / `video` alanlarından en az biri zorunludur. Gönderi metni ve aynı sayfada gösterilen yorum metinleri eksiksiz yansıtılır. Doğrudan site yayıncısının yazdığı makale için bu tür kullanılmaz. `SocialMediaPosting` desteklense de genel TractorVS forumu bağlamında uygun tür `DiscussionForumPosting` olur; gerçekten Q&A formatı ağırlıktaysa Q&A tercihleri ayrıca değerlendirilir.
    Kaynak: https://developers.google.com/search/docs/appearance/structured-data/discussion-forum
2. **Google `ProfilePage`** — ana odağı bir kullanıcı/kurum olan gerçek, erişilebilir profil sayfasını işaretler; `mainEntity` ve `name`/gerekliyse `alternateName` gerçek görünür veriden gelmelidir. Üye paneli, kullanıcı arama, özel giriş formu veya lider tablosu başlı başına ProfilePage değildir.
    Kaynak: https://developers.google.com/search/docs/appearance/structured-data/profile-page
3. **Google AI içerik rehberi (1 Ekim 2026 güncellemesi)** — AI ile hızlıca çok sayfa oluşturmak, orijinal yarar ve doğruluk incelemesi olmadan `scaled content abuse` riski oluşturabilir. İçerik araştırması, gerçek kaynaklar, doğrulama ve editoryal kalite kapısı otomatik yayın hızından daha önemlidir. Blogu forum gönderisi gibi göstermeyin.
    Kaynaklar: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content ; https://developers.google.com/search/docs/essentials/spam-policies
4. **Google `digitalSourceType` alanı** — desteklenen forum şemasında AI veya otomasyonla üretilmiş içeriğin kökenini göstermek için kullanılabilir. Özellikle `TrainedAlgorithmicMediaDigitalSource` ile `AlgorithmicMediaDigitalSource` ayrımını yapan gerçek oluşturma zinciri kanıtı olmadan etiket eklemeyin. Google, alan yoksa insan yazımı varsayabileceğini belirtiyor; makine çevirisini otomatik olarak insan yazımı orijinal gönderi diye aktarmak hatalı olabilir. Provenans ve gerçek yayın türü önceden çözülmeden mevcut Schema değiştirilmeyecek.
    Kaynak: https://developers.google.com/search/docs/appearance/structured-data/discussion-forum
5. **INP (web.dev)** — `input delay`, `processing duration`, `presentation delay` olarak 3 aşamalı. LCP/CLS düzelmesi INP'yi kanıtlamaz. Etkileşimleri gerçek kullanıcı p75, cihaz sınıfı, sayfa türü ve mümkünse `web-vitals` attribution / Chrome Performance ile ayrı ölçün. Yavaşlık ölçülmeden tüm `input` olaylarını debounce etmek veya bağlantıları JS ile oluşturmak yanlış olabilir.
    Kaynaklar: https://web.dev/articles/optimize-inp/ ; https://web.dev/articles/inp

## Mevcut kod tespiti — kanıta bağlı ve riskten kaçınan

| Kod/veri alanı | 23 Kasım 2026 incelemesi | Korunacak davranış |
|---|---|---|
| `site/src/lib/forum.ts` | `tc_forum_localized_topics` kamu seçimi: `id,topic_id,locale,original_locale,slug,category,tractor_id,created_at,updated_at,status,title,body,seo_ready,machine_translated`; **yazar kimliği alanı yok** | Uydurma kişi kimliği, IP/e-posta ve özel `auth.users` verisi açığa çıkarılmamalı |
| `site/src/components/ForumTopic.astro` | `eligible=isIndexableForumTopic(topic)` ve yalnız uygunsa `@type:WebPage`; görünür tarih ve medya, ancak yazar veya yapay sayaç yok | Editoryal konuları sahte `DiscussionForumPosting` biçimine dönüştürme; üretime almadan önce veri kaynağı/izin kontrolü |
| `site/src/components/ForumMemberPanel.astro` | Profiller isteğe bağlı `show_leaderboard` tercihi, gizlilik ve RLS sınırlamalarına bağlı; kullanıcı paneli, ayrı her-hesaba-özgü kamusal URL değil | Kullanıcıya özel veri/gizli profil için `ProfilePage` yaratılmamalı |
| `site/src/components/TractorCatalog.astro` | Arama `input` olayı sırasında her kartın önhesaplanmış sorgu anahtarını eşleştirip yalnız gerekli `hidden` durumunu değiştiriyor, sıralamada kartları taşıyor | INP yavaşlığı kanıtlanmadan JS/kritik SSR linklerini bozacak değişiklik yok |
| `site/tests/forum-session-engagement-new-members.test.mjs` | Gerçek istatistik sınırlarını ve sahte schema sayılarını kontrol eden testler var | Yeni schema güven testleri mevcut kontrolleri tamamlar; yinelenen sunucu sorgusu eklemez |

## Uygulamaya hazır ve sınırları belli çalışma planı

### A. Forum schema yükseltmesi gerekiyorsa

1. **Sınıflandırma:** Kullanıcı gönderisi mi, editör makalesi mi, moderasyonlu soru-cevap mı? Yalnız gerçek kullanıcı paylaşımına `DiscussionForumPosting`; aksi durumda mevcut `WebPage` veya doğrulanmış `Article`.
2. **İzin/projeksiyon:** Önce RLS ve veri minimizasyonunu salt-okunur testle; kullanıcı onayına bağlı **kamusal görünen takma adı** ve gerekliyse ayrı herkese açık, kalıcı profil URL'sini tanımla. `auth.users`, e-posta, kimlik sağlayıcı gerçek adı, gizli avatar, telefon, özel profil veya gizli taslak asla JSON-LD'ye aktarılmaz.
3. **Alan eşleşmesi:** `author.name` gerçekten sayfada görünmeli, `datePublished` gerçek UTC/ISO tarih olmalı; `text` orijinal gönderi metniyle, yayımlanan yorumlar `comment` alanıyla eşleşmeli. `commentCount`/etkileşimler ancak aynı modere edilmiş, tam belirli konu/dil/yayın görünümünü yansıtan onaylı sayımlardan elde edilmişse eklenebilir. Dil çevirileri orijinal yorum sayısını çoğaltamaz.
4. **Köken:** Yapay zekâ katkısı veya makine çevirisinin türünü gizleme; belge türü ve `digitalSourceType` için gerçek veri ve Google şema kuralları karşılaştırılmalı, otomatik etiket eklenmemeli.
5. **Yayın koşulu:** `status=published` ve `seo_ready=true`, moderasyon/onay, gerçek kaynak/çeviri ve uygun hreflang/canonical; taslak, özel profil, çevirisi eksik konu indekslenemez. `Rich Results Test` + Google URL Inspection + gerçek HTML denetimi. *Uygun olmak aramada zengin sonuç çıkacağını garanti etmez.*
6. **Geri alma:** Şema eklentisini ayrı PR ile ve revizyonlanabilir biçimde yayımla; sorun varsa kod commit'ini revert et. Özel profil/RLS genişletmesi **otomatik uygulanamaz**, ayrı izin ve veri güvenliği incelemesi gerektirir.

### B. Katalog/foruma yönelik INP iyileştirmesi gerekiyorsa

1. RUM/CrUX üzerinden gerçek 75. yüzdelik mobil ve masaüstü `INP` değerlerini ve örnek sayfa URL'lerini al; mevcut `GA4`/`Clarity`/`Cloudflare` açık izin kurallarını koru, yeni izleme kodunu otomatik ekleme.
2. Playwright + düşük güçlü cihaz/CPU throttling ile katalog araması (`#tractor-search`), marka/güç/yıl/sıralama facetleri (`#catalog-facet-*`), forum beğeni/kayıt (`[data-like-toggle]`, mevcut composer) ve dil geçişini tekrar üret. İlk etkileşim/yükleme sırasında da ölç.
3. Chrome Performance/Long Animation Frames/`web-vitals` attribution ile gecikmenin `input delay`, JS callback süresi veya sonraki çizimden mi geldiğini sınıflandır.
4. Soruna özel küçük optimizasyon uygula (ör. yalnız gerçekten gereksiz DOM işlemlerini azalt, kritik arayüz geri bildirimini engelleme). Ana model bağlantıları SSR HTML'de kalmalı; filtre/değer/sıralama/ekran okuyucu davranışı korunmalı.
5. Öncesi-sonrası lab ölçümü ve gerçek RUM trendi **ayrı** raporla. Varsayılan hedef p75 `INP ≤ 200 ms`; örnek sayısı/istatistik güveni yetersizse kesin kazanım iddia etme.
6. Düşük güçlü mobil, 10 dil uzun metinler, klavye/odak, 2–4 model karşılaştırması, forum oturumlarının korunması; Playwright/axe ve mevcut CI yeşil olmadan merge yok.

## Kalıcı regresyon ve günlük iş akışı

- Test: `cd site && node --experimental-strip-types --test tests/forum-public-schema-trust-20261123.test.mjs`.
- Mevcut tam test: `cd site && npm test`; üretim derleme ve Golden Rule dahil GitHub CI kontrolü.
- Güncel kod/test/PR/dağıtım anlaşmazlığında `AGENTS.md` ve daha güvenli kanıt bazlı yayın şartları önceliklidir.
- Bu doküman otomatik yayınlanan bir özelliğin veya ölçümün ispatı değil, bir sonraki iş için **test edilebilir karar ve uygulama protokolüdür**.
