# TractorVS — Kalıcı Çalışma ve Entegrasyon İlkeleri

> Bu dosya, TractorVS / TractorCompare AI projesinde çalışan yapay zekâ asistanları ve geliştiriciler için proje düzeyinde başvuru kaynağıdır. Mevcut güvenlik, yayınlama, araştırma ve SEO kurallarını tamamlar; onlarla çatışıyorsa daha güvenli ve kanıta dayalı kuralı uygula.

## ALTIN KURAL — TAM UYUM, TAM ENTEGRASYON, MAKSİMUM YARAR

Kullanıcının açık ve sürekli talebi:

**“Şimdi ve daha önce eklediğim bütün eklenti, uygulama, her türlü program, entegrasyon, API ve yapay zekâdan; TractorVS'nin doğruluğunu, güvenliğini, SEO'sunu, performansını ve kalitesini iyileştirmek için mümkün olan en yüksek seviyede, birbirleriyle tam uyumlu, maliyet ve gizlilik açısından sorumlu biçimde yararlan. Bu ilkeyi yeni sohbetlerde ve proje görevlerinde de esas al.”**

Bu ilke **her projeyle ilgili görevde** geçerlidir. Tek seferlik bir istek değildir. Yeni araçlar bağlandığında kapsam kendiliğinden genişler; yalnızca aşağıdaki örnek adlarla sınırlı değildir.

### İşlem öncesi keşif ve bağlam
1. Mevcut GitHub kodunu, açık PR ve issue'ları, Supabase şemasını/RLS'yi, veri kayıtlarını, mevcut otomasyonları ve önceki mimari kararları kontrol et. Kullanıcının zaten verdiği bilgiyi tekrar isteme.
2. Kullanılabilir tüm ilgili araç/eklenti/bağlantıları ve bunların güncel yetki/kapasite/kota durumunu keşfet; bir aracın yalnızca kurulmuş olması ile hedef hesaba erişebilir durumda olması arasındaki farkı doğrula.
3. Aracın gerçekten fayda sağlayacağı işi seç; sırf bağlı olduğu için her araçla gereksiz işlem, tekrar sorgu, ücretli çağrı veya veri aktarımı yapma.
4. Yeni veya daha iyi bir araç, izin ya da bağlantı gerçekten gerekiyorsa kullanıcıdan hangi hesap/izin gerektiğini ve somut faydasını açıkça iste. Gizli anahtarları ve parolaları sohbete yapıştırmasını isteme.

### Araçlar arası birlikte çalışma
5. Uygun oldukça resmî üretici sayfaları/PDF'ler ve lisans kanıtlarını Firecrawl veya diğer erişilebilir araştırma araçlarıyla bul; marka, model, yıl, pazar, varyant ve ölçüm standardını bağımsız olarak doğrula. Çıkarım, alıntı, kaynak URL'si, kanıt tarihi ve güven derecesini ayır. Tek bir AI yanıtını teknik kanıt sayma.
6. Supabase'i veri doğruluğu, durum ve RLS için; GitHub'ı versiyonlanmış kod, PR, otomatik test ve dağıtım kontrollleri için kullan. Kanıtlanmamış verileri taslakta tut; yayın politikasıyla uyumlu, doğrulanmış toplu işlemleri ve geri alma planını uygula.
7. Google Search Console / GA4 / Bing ve uygun olduğunda OpenSEO'dan gerçek ölçümlerle SEO fırsatlarını değerlendir. Cloudflare Web Analytics / RUM ile gerçek kullanıcı deneyimini ve uygun olduğunda Core Web Vitals (LCP, INP, CLS) metriklerini denetle. Saha (RUM) ve sentetik (Lighthouse/Playwright) ölçümlerini ayrı yorumla. Google'ın indekslemesini, sıralamasını veya trafik artışını garantili göstermemelisin.
8. Microsoft Clarity, Cloudflare Web Analytics / RUM, GA4, PostHog ve benzeri analiz araçlarını yalnızca uygun ziyaretçi izni, KVKK/GDPR uyumu, maskeleme, erişim kontrolü ve canlı kurulum doğrulandıktan sonra kullan. TractorVS'de GA4, Clarity ve Cloudflare ortak açık izin kontrolüne bağlıdır; Cloudflare otomatik JavaScript enjeksiyonunu yeniden açma, manuel RUM betiğini yalnız izin sonrası ve bir kez yükle. Çerez kullanmamak tek başına hukuki uygunluk kanıtı değildir. Kurulu bir eklentiyi canlı izleme koduyla karıştırma.
9. Google Drive/Docs/Sheets veya diğer uygun belge araçlarıyla kaynak envanterini, izinli belgeleri, fotoğraf lisans kanıtlarını ve terminoloji/çeviri denetimlerini düzenle. Gizli/veri erişimi sınırlı materyalleri kontrolsüz biçimde üçüncü taraflara taşıma.
10. Yeni araçları, API modellerini veya otomasyonları önermeden önce mevcut ücretsiz altyapıyla çözülebilecek işleri ve bütçeyi değerlendir. Ücretli, yıkıcı, yayınlama veya veri paylaşan işlemleri uygun yetki ve güvenlik sınırları içinde tut.

### Kalite ve kontrol
11. Birleştirilmiş, kanıtlı ve özgün içerik üret; kullanıcıya gerçek yarar sağlamayan SEO sayfa şişirmesi, otomatik ve kontrolsüz çok dilli yayın, lisansı doğrulanmamış görsel, uydurma teknik özellik veya pazarlama iddiası yapma.
12. Kod ve veri değişikliklerinden önce etki/geri alma planını hazırla; sonrasında Playwright ile Chromium/Firefox/WebKit/mobil tarayıcı testlerini, axe-core ile erişilebilirliği, CodeQL/Dependabot güvenlik uyarılarını ve ilgili SEO, link, canonical/hreflang/sitemap/structured-data, performans ve RLS kontrollerini uygula. Axe-core ciddi/kritik bulgularını ve önemli güvenlik uyarılarını çözmeden kaliteyi tamamlanmış ilan etme; atlanan testleri ve kapsamı açıkça belirt.
13. Yapılmamış işi yapılmış gibi sunma. Raporlarda ayrı ayrı belirt: **erişim doğrulandı / incelendi / değiştirildi / test edildi / dağıtıldı / engellendi veya tamamlanamadı**.
14. Kullanıcıya tek tek tekrar eden komutlar yaptırmak yerine kapsamlı analiz ve mantıklı toplu çözümler kullan; kapsam belirsiz veya riskliyse önce salt-okunur kontrol yap.
15. Bu kuralları yeni bir proje görevi üstlenirken tekrar incele; araçların erişilebilirliğini ve proje durumunu yeniden doğrula. Yalnızca geçmiş raporlara dayanma.

### Yeni bağlanan ve etkinleştirilen araçlar — uygulama protokolü (21 Kasım 2026)

Bu araçlar Altın Entegrasyon Kuralı'nın parçasıdır. Her görevde ilgili olanları keşfet, mevcut erişimlerini ve gerçek çalışma durumlarını kontrol et; yalnızca somut fayda sağlayanları kullan. **Bağlı olmak, etkin analiz toplamak veya yayınlanmış kod çalıştırmakla aynı şey değildir.**

- **Playwright — tarayıcı kalite testi:** `site/e2e/`, `site/playwright.config.mjs` ve `.github/workflows/playwright-accessibility.yml` üzerinden Chromium, Firefox, WebKit ve mobil Chromium/Pixel senaryolarını denetle. Traktör sayfaları, karşılaştırma, forum, dil geçişleri (10 dil), mobil navigasyon ve analitik izin/reddetme/geri çekme akışlarında regresyon testi yaz. Yerel statik site testinin canlı üretim testi olmadığını belirt. CI sonuçlarını görmeden başarılı deme.
- **axe-core / @axe-core/playwright — erişilebilirlik:** Playwright ile WCAG tabanlı otomatik kontroller yap. `serious` ve `critical` bulgularını CI için hata kabul et; diğer önem seviyelerini de raporla ve düzeltme planına al. Görünür etiket/erişilebilir ad uyumu, klavye/odak, semantik yapı ve mobil erişilebilirliği koru. Otomatik testlerin tek başına tam WCAG uygunluğunu kanıtlamadığını hatırla.
- **GitHub CodeQL (Default setup) — güvenlik:** JavaScript/TypeScript, Python ve GitHub Actions kod analizlerini ve Security / Code scanning uyarılarını takip et. Mevcut varsayılan yapılandırma varsa ikinci, çakışan CodeQL iş akışı oluşturma. Başarılı analiz sıfır güvenlik açığı garantisi değildir.
- **Dependabot + Dependency graph + Malware alerts:** `.github/dependabot.yml` ile npm ve GitHub Actions paketlerini haftalık kontrol et; Dependabot alerts, security updates ve grouped security updates bildirimlerini denetle. Güvenlik/sürüm güncelleme PR'larını otomatik birleştirme. Üretime almadan önce sürüm, lockfile, lisans, güvenlik, CI, arayüz ve SEO regresyonunu test et. İkinci `dependabot.yml` oluşturma.
- **GitHub Secret Protection / Push protection / Private vulnerability reporting:** Desteklenen sızdırılmış anahtarların engellenmesini, gizli güvenlik bildirimlerini ve ilgili uyarıları takip et. Belirteç, parola, API anahtarı veya güvenlik açığı ayrıntısını gereksiz yere sohbetlere, açık PR'lara ve günlüklere taşıma. Copilot Autofix önerilerini de test/review olmadan birleştirme.
- **Cloudflare Web Analytics / RUM:** `tractorvs.com` için zaten var olan siteye ait ölçüm sistemini kullan. Cloudflare panelinde **Enable with JS Snippet installation** (manuel betik) ayarını koru; `Enable` veya AB hariç otomatik enjeksiyonu tekrar açma. Site, Cloudflare RUM betiğini yalnızca mevcut analitik izin sistemi onay verdikten sonra ve bir kez yüklemelidir. İzin öncesi, reddetmede ve geri çekmeden sonra GA4, Microsoft Clarity ve Cloudflare dışa giden izleme isteklerini canlı tarayıcıda doğrula. Cloudflare'ın çerezsiz olması KVKK/GDPR bilgilendirmesini otomatik olarak ortadan kaldırmaz. RUM performans metriklerini Core Web Vitals, Google Search Console ve GA4'ten gelen farklı ölçümlerle dikkatle çapraz değerlendir.
- **Microsoft Clarity + GA4 + PostHog:** Clarity oturum kayıtlarında **Katı maskeleme**, açık izin, çerez ayarları ve ConsentV2 şartlarını koru. GA4/Clarity/Cloudflare'ın tek ortak izin politikası, 10 dilde açık bilgilendirme ve test edilebilir ret/geri çekme davranışı olmalıdır. PostHog bağlantısı kurulu olsa bile sitede ürün olayları ve izleme kodu gerçekten mevcut mu kontrol et; gereksiz çift ölçüm, izinsiz veri toplama veya ücretli kota aşımı yaratma.

**Sürekli çalışma sırası:** Güncel `AGENTS.md`, repo kodu/PR/CI ve Supabase RLS'yi oku → uygun mevcut ve yeni araçları keşfet ve erişimini doğrula → kaynaklara dayalı toplu çözüm uygula → CodeQL/Dependabot ve Playwright/axe-core kontrollerini yap → gerekiyorsa gerçek mobil tarayıcı, canlı ağ istekleri, Core Web Vitals ve SEO'yu doğrula → yalnız geçerli güvenli yayın politikasına uygun biçimde birleştir/dağıt → doğrulanmış, değiştirilen, test edilen, canlıya alınan ve açık kalan işleri ayrı raporla.

**Durum ve doğruluk:** 21 Kasım'da Playwright/axe-core ve Dependabot yapılandırması ile ortak GA4/Clarity/Cloudflare izin kodu ana dala birleştirildi. CodeQL, Dependabot güvenlik ayarları ve Cloudflare manuel snippet seçimi hesabın ekran görüntülerinde doğrulandı; canlı HTML'de otomatik Cloudflare enjeksiyonunun bulunmadığı kontrol edildi. Bunlar geçmiş doğrulamalardır; her yeni görevde güncel durum tekrar kontrol edilmelidir. Cloudflare, PostHog ve diğer haricî hesaplara erişimin mevcut olması, her araçta canlı veri/olay aktığı anlamına gelmez.

### Bağlantı örnekleri (2026-11-21, dinamik envanter)
GitHub (Actions, CodeQL, Dependabot, Dependency graph, Malware alerts, Secret Protection, Push protection, Private vulnerability reporting), Playwright, axe-core, Supabase, Cloudflare Workers, Cloudflare Web Analytics / RUM, ChatGPT otomasyonları, Firecrawl, Microsoft Clarity (Windsor.ai bağlantısı), PostHog, OpenSEO, Google Drive, Google Search Console, GA4 ve Bing Webmaster. **Bu liste sabit değildir**: eklenmiş, kaldırılmış veya bağlantısı değişmiş araçlar için oturumun güncel erişim durumunu kontrol et.

### İzinli forum çevirileri için gerçek işleyici (21 Kasım 2026)

- Kullanıcının makalede çeviri kutucuğunu seçmesi yalnızca 9 dil için `tc_forum_translation_jobs` kuyruğu oluşturur; otomatik çevrildiği veya başka dilde yayımlandığı anlamına gelmez.
- Sunucu tarafı `tractor-forum-translate` Edge Function, anonim JWT + özel kuyruk sırrıyla GitHub Actions içinden çağrılır. Servis rolü ve Gemini API anahtarı yalnız Supabase Edge ortamında kalır. İzin vermemiş kullanıcı, gizli konu, değişmiş kaynak metin ve özel medya Gemini'ye gönderilmez.
- Kaynağı `published`, `translation_consent=true` ve güncel source_hash ile doğrulayan, retry/idempotency ve denetlenebilir job statüsü olan sınırlı işleyici kullan. Kaynak iptal/değişikliklerinde `superseded` yapılır; sessizce uydurma çeviri yayımlanmaz.
- Diller: en, zh, hi, pt-br, fr, de, ru, ja, es. Her dilde tamamlanmış içerik için sayı, ölçüm, marka, araştırma kapsamı, kaynak URL, tam tablo/başlık yapısı ve ikinci bağımsız Gemini kalite incelemesi gerekir. Kusurlu çıktılar `needs_review`, SEO dışı ve görünmez kalır.
- Statik dil sayfaları yalnız hazır, kaynak özetiyle eşleşen ve QA onaylı `ready` çevirilerin ardından normal Cloudflare eşitlemesiyle üretilir. GitHub schedule gecikebilir; 9 dilin anında yayımlanmasını vaat etme.

### Yeni gönderiler için canlı okuma katmanı (21 Kasım 2026)

- Mevcut statik Astro HTML sayfaları, canonical/hreflang, sitemap ve SEO kalitesi **aynen korunur**. ForumHub içindeki ek istemci katmanı yalnız anonim RLS korumalı `tc_forum_localized_topics` görünümünden henüz Cloudflare build'ine girmemiş konuları ziyaretçilere gösterir.
- Canlı liste yalnız güvenli metin kullanır: DOM `textContent` ve güvenli kaynak bağlantıları (`rel=ugc nofollow noopener noreferrer`). HTML çalıştırılmaz, özel API anahtarları veya kayıt dışı medya yüklenmez.
- Cloudflare'da kalıcı URL henüz oluşmamışsa ziyaretçiye uydurma/404 link verilmez. Tam metin forum ana sayfasında açılır; kalıcı konu URL'si, yanıtlar, onaylı medya ve SEO indeksi normal eşitleme/build sonrasında oluşur.
- Bu canlı katman anında Google indekslemesi sağlamaz; JavaScript kapalıyken statik HTML yedeği korunur. Supabase kesintisinde statik içerik silinmez, açık uyarı gösterilir.
- CI gerçek tarayıcı testleri anonim okuma, gizli/yanlış dil satırlarının reddi, tek sekmede yenileme, XSS korunumu, statik yedek, mobile ve erişilebilirlik senaryolarını kapsamalıdır.

### Forumun uçtan uca yayını için ek kalite kapısı (21 Kasım 2026)

- **Veritabanı statüsü ile gerçek sayfa aynı değildir:** `published` yalnız güvenli Supabase kaydını gösterir; statik Astro/Cloudflare sayfası bir sonraki başarılı eşitleme ve üretim dağıtımını gerektirir. Kullanıcıya yanlış 'siteye anında çıktı' bildirimi verme.
- Yeni gönderi yaşam döngüsü: kullanıcı kimliği ve RLS → anonim kamu görünümü → 10 dakikada bir best-effort GitHub eşitlemesi → üretim build ve Cloudflare deploy → **gerçek herkese açık URL, hub, canonical, robots ve sitemap doğrulaması**. GitHub cron ve Cloudflare dağıtımı için kesin süre vaat etme.
- `scripts/tractor-forum-live-visibility-audit.mjs` denetimi 45 dakikayı aşan bütün yayımlanmış kısa/uzun konular, yanıtlar ve onaylı fotoğraflarda görünürlük farkını hata sayar; yalnız `seo_ready` konular için sitemap/index beklentisi uygular; yarım saatlik bağımsız workflow tek bir GitHub sorunu açar. Yayınla ilgili başarısızlıklar sessizce 'başarılı' etiketlenmez.
- Sınırlı otomatik kurtarma yalnız doğrulanmış canlı uyuşmazlıkta GitHub site derlemesini yeniden ister; RLS/moderasyonu aşmaz, 2 saatte 1 / günde 2 denemeyi aşamaz. Başarısız kaynak erişimini veri yayınlama gerekçesi sayma.
- Forumda bu denetimlerin varlığı 'anlık SEO indeksleme' veya '0 hata' garantisi değildir. İlk onaydan önceki test ve gerçek canlı yayın sonrası denetimi ayrı raporla.

### Makale ve rehber yayınında ALTIN editoryal kural (21 Kasım 2026)

**SEO + GEO + özgünlük + kanıt = tek kalite kapısı.** Bu ölçütler birbiriyle çatıştığında asla doğruluktan ödün verilmez. Arama motoru veya yapay zekâ cevaplarında daha çok görünürlük beklentisi, yanlış bilgi, hayalî uzmanlık veya kanıtsız oran yayımlamak için gerekçe değildir.

- **Önce soru, sonra belge:** Her makale gerçek kullanıcının belirli bir sorusuna kendi açıklamasıyla yanıt verir. Üretici beyanı, bağımsız laboratuvar testi, kullanıcı beyanı ve editoryal yorum ayrı etiketlenir; sayısal iddianın kaynağı doğrudan erişilebilir olur. Kaynakların güncelliği, model-yıl-pazar-varyant ve ölçüm standardı özellikle korunur.
- **Gerçek yazar ve yöntem:** Yalnız gerçekten yapılan analiz ve doğrulamalar anlatılır. Gerçekte yazan kurum TractorVS ise uygun kurumsal yazarlık gösterilir; sahte uzman, sahiplik, saha testi, kullanıcı deneyimi, alıntı, puan ve fiyat oluşturulmaz. Kaynak ve kontrol tarihi görünür olmalı; sadece içerik değişmişse `dateModified` değiştirilmelidir.
- **Sayı ve kıyas şeffaflığı:** Arıza oranı, garanti sıklığı, tüketim, güvenilirlik veya performans sıralaması için aynı ölçüm tanımı, dönem ve örneklem doğrulanmadan yüzdenin yanında **100 traktöre düşen şikâyet** gibi ayrı metrikler birbirine karıştırılmaz. Boş veriye sahte değer eklenmez.
- **Arşiv ve dil doğruluğu:** Makale **arşivi** 10 dilde özgün yerelleştirilmiş özet ve açıklamaları gösterir. Tam makale **gövdesi** hangi dillerde varsa yalnız o dillere bağlantı verir; başka dildeki içerik için açıkça «İngilizce tam metin» gibi etiket gösterir. Arşivin 10 dilde olması tüm uzun makalelerin 10 dilde çevrildiği anlamına gelmez. Taslak PR'lar, forum onayı bekleyen yazılar veya eksik çevirilerin sahte adresleri sitemap/hreflang'e alınmaz.
- **Google ve GEO uyumu:** Tarayıcı tarafından görülebilen, giriş gerektirmeyen, semantik HTML; doğru `title`, H1, özgün meta açıklaması, `canonical`, `hreflang`, sitemap, robots, iç bağlantılar ve görünür içeriğe bire bir uyan `Article` / `TechArticle`, `CollectionPage`, `ItemList`, `BreadcrumbList` kullanılır. Gereksiz anahtar kelime yığını, şişirilmiş sayfa, sahte SSS/puan, sözde GEO hilesi veya izinsiz görsel uygulanmaz.
- **Yayın ve geri alma:** Önce ayrı PR; Node + Astro build, CodeQL, Playwright (Chromium/Firefox/WebKit/mobil), axe-core, yayın paketindeki iki arşiv sayfası, canonical/index/sitemap kontrolleri başarılı olmalı. Ardından gerçek HTTP 200, indekslenebilirlik ve Search Console'da mevcut durum ayrıca ölçülmeli. Kodun merge edilmiş olması **canlı dağıtım veya Google indekslenmesi değildir**. Sorunlarda ilgili commit geri alınabilir; çalışan katalog/forum/Supabase RLS özellikleri bozulmaz.

Ek ayrıntı: `site/docs/editorial-quality-gate-20261121.md` ve `site/tests/editorial-hub.test.mjs`.

## Süreklilik ve dürüst sınır
Bu dosya GitHub deposunda saklanan, değişiklik geçmişi olan **kalıcı proje kaynağıdır**. Asistanın ChatGPT iç belleğine silinemez bir kayıt yazıldığı veya her yeni sohbette bu dosyanın kendiliğinden okunduğu anlamına gelmez. Yeni sohbetlerin aynı ilkeyi uygulaması için bu dosyanın bağlantısını ChatGPT Project Instructions / Proje Talimatları içinde tutmak ve işe başlarken dosyayı okumak en güvenilir yöntemdir.

*Son kabul edilen kullanıcı talebi: 21 Kasım 2026.*
