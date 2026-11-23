# TractorVS | SEO + GEO/AEO doğrulanabilir görünürlük planı
Son kaynak denetimi 23 Kasım 2026. Bu rehber, [AGENTS.md içindeki on önceliğin](../../AGENTS.md#seo-ve-geo) PR incelemesinde, yayında ve haftalık ölçümde nasıl kullanılacağını açıklar. Teknik dağıtım koşulları [SEO yayın rehberinde](seo-launch-gate.md) yer alır.

## 20 Kasım 2026 tarihli başlangıç kaydı
- Published-only, kaynak ve model/varyant kimliğini koruyan statik traktör katalogu.
- On dilde model sayfaları ve kaynak bağlamına uygun canonical/hreflang.
- Genişletilmiş parça sözlüğü, 3 özgün uygulama rehberi, kaynak denetimi metodolojisi.
- Google için robots.txt, image sitemap, XML sitemap, JSON-LD WebPage/Thing/Breadcrumb.
- Bağlı Google Search Console'da 19–20 Kasım ön verilerinde gösterim bulunuyor; 20 Kasım 24 saatlik kullanıcı ekranında 20 gösterim, 1 tıklama. Bunlar çok küçük sayı ve kesinleşmemiş olabilir.

## Bu pakette yapılan GEO iyileştirmeleri
1. **Kaynağı kontrol edilmiş kısa cevaplar:** model sayfasında yalnızca doğrulama tarihi + kanıt metni + güvenilir URL bulunan ölçümler. Çelişkili güç/ölçüm standartları ve birim uyuşmazlığı otomatik dışlanır. TR/EN özgün, SSR HTML.
2. **Alıntı izlenebilirliği:** Her kısa cevabın yanında üretici veya bağımsız teknik belge linki; modelin WebPage JSON-LD yapısında yalnızca gerçek onaylı kaynaklardan citation.
3. **Yayıncı kimliği:** Site ana sayfalarında WebSite + Organization + WebPage JSON-LD, tüm dillerde aynı kuruluş kimliği. Sahte yıldız puanı, kullanıcı yorumu, Offer, stok/fiyat veya saha testi eklenmez.
4. **AI taranabilirliği:** indexable robots.txt içinde OAI-SearchBot açıkça izinli; noindex önizleme robots koruması devam. `llms.txt` yalnız isteğe bağlı keşif rehberi: Google'a sıralama kazandırdığı iddia edilmez.
5. Önizleme ve indekslenebilir derleme kontrolleri yayıncı kimliğini, robot kurallarını ve kaynaklı yanıtları doğrular. İsteğe bağlı `llms.txt` sunuluyorsa dosyanın derlemeye eksiksiz ulaştığı ve gerçek yayın kapsamını anlattığı da kontrol edilir.

## Arama sonucu

Google ve Bing için önce hedef sayfanın keşfedilebilirliğini ve dizine uygunluğunu, sonra sonuçta nasıl temsil edilebileceğini incele. Aşağıdaki görünüm özelliklerinde platformun güncel kurallarını kullan. [Google Search Essentials](https://developers.google.com/search/docs/essentials) · [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)

| Öğe | TractorVS kontrolü |
| --- | --- |
| Adres ve keşif | Kalıcı olarak taşınan içeriği eşdeğer yeni adrese 301/308 ile yönlendir. Karşılığı olmadan kaldırılan içerik 404/410 dönmeli. İç bağlantılar, canonical ve güncel site haritası son adresi göstermeli. Arama motorunun seçtiği adresi kendi denetim aracında kontrol et. [Yönlendirmeler](https://developers.google.com/search/docs/crawling-indexing/301-redirects) · [Tarama hataları](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors) |
| Başlık ve metin önizlemesi | `<title>`, görünür ana başlık ve açılış metni aynı arama ihtiyacını doğru dilde karşılamalı. Meta açıklaması o sayfanın özgün özetini vermeli. Google başlığı birden fazla kaynaktan, önizlemeyi ise çoğunlukla sayfa metninden seçer. Cihazın genişliği ve sorgu görüntülenen metni etkiler. Karakter hedefi uğruna varyantı, birimi veya önemli koşulu kesme. [Başlık bağlantısı](https://developers.google.com/search/docs/appearance/title-link) · [Metin önizlemesi](https://developers.google.com/search/docs/appearance/snippet) |
| Site adı ve simgesi | Kök ana sayfanın `WebSite.name` alanı görünür TractorVS markasıyla, `WebSite.url` alanı kanonik alan adı köküyle eşleşmeli. Dil klasörleri aynı site kimliğini kullanır. Ana sayfada `rel="icon"` ile sabit adresli kare PNG sun. Googlebot ana sayfaya, Googlebot-Image simgeye erişebilmeli. PNG'nin HTTP durumunu, MIME türünü, açılabildiğini ve kare boyutunu doğrula. [Site adı](https://developers.google.com/search/docs/appearance/site-names) · [Site simgesi](https://developers.google.com/search/docs/appearance/favicon-in-search) |
| Gezinme ve ek bağlantılar | Marka, model, karşılaştırma ve rehberler arasında açıklayıcı bağlantılar kur. `BreadcrumbList` ziyaretçinin izleyebildiği gerçek gezinme yoluyla eşleşmeli. Google ek site bağlantılarını otomatik seçer. Şema uygunluğu, arama sonucunda gösterimden ayrı kaydedilir. [Site bağlantıları](https://developers.google.com/search/docs/appearance/sitelinks) · [Gezinme yolu](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) |
| Görsel ve zengin sonuç | Modeli temsil eden lisanslı fotoğrafı taranabilir HTML'de sun. Uygun sayfalarda büyük görsel önizlemesine izin ver. Sosyal paylaşım kartı, arama küçük resmi ve zengin sonuç farklı sistemlerce seçilir. Desteklenen şemanın görünür metinle ve fotoğrafla eşleşmesini denetle. [Görsel arama](https://developers.google.com/search/docs/appearance/google-images) · [Yapılandırılmış veri ilkeleri](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) |

Mevcut haftalık incelemede, sonuç görünümüyle ilgili bir değişiklik araştırılıyorsa URL, sorgu, ülke, dil, cihaz ve tarihi kaydet. Üretilen HTML, motorun dizin kaydı ve gözlenen sonuç ayrı kanıtlardır. Benzer koşullarda gösterim ve tıklanma oranı değişimini aşağıdaki ölçüm tablosuyla yorumla. Üretken yanıtta kaynak bağlantısı için ilgili platformun verisini kullan.

## Ölçümden karara

Haftalık indeksleme raporunda aynı URL'leri, dilleri ve tamamlanmış tarih aralıklarını karşılaştır. Yedi günlük hacim küçükse daha uzun, eşit iki dönemi kullan. Aylık değerlendirmede dizine girmesi beklenen model, karşılaştırma, makale ve onaylı forum URL'lerinin dağılımını ayrı incele. Her bulguda kaynağı, dönemi, kapsamı ve örneklemi belirt. Rapor erişimi, düşük hacim ve ölçülen sıfır farklı durumlardır.

| Sorulacak soru | Veri ve yorum | Sonuca göre ilk işlem |
| --- | --- | --- |
| Google doğru URL'yi dizine aldı mı? | URL Denetimi'nde dizin durumu, son tarama ve Google'ın seçtiği canonical. Site haritası, HTTP yanıtı ve IndexNow kabulü keşif veya erişim kanıtıdır. | İndeksleme sorunu varsa ilk HTML, robots, önizleme sınırı, tercih edilen URL ve iç bağlantıyı incele. [URL Denetimi](https://support.google.com/webmasters/answer/9012289) |
| Kullanıcı hangi sorudan geliyor? | Search Console Arama Sonuçları raporunda sorgu, sayfa, ülke ve cihaz bazında gösterim, tıklama, tıklanma oranı ve ortalama konum. | Benzer sorgu, cihaz ve konumda gösterim alıp az tıklanan sayfada başlığı, sonuç özetini ve sayfanın sunduğu yanıtı incele. [Arama performansı](https://support.google.com/webmasters/answer/7576553) |
| Google'ın yapay zekâ yanıtında bağlantı göründü mü? | Search Console üretken yapay zekâ raporu AI Overviews ve AI Mode bağlantı **gösterimlerini** sağlar. Sayfa, ülke, cihaz ve tarih kırılımlarını kullan. Yeterli gösterim yoksa rapor görünmeyebilir. | Dizin ve snippet uygunluğunu, gerektiğinde mülkün üst mülkten devraldığı dahil etme tercihini salt okunur doğrula. [Rapor](https://support.google.com/webmasters/answer/16984139) · [Katılım ayarı](https://support.google.com/webmasters/answer/16908024) |
| Bing veya Copilot hangi sayfayı kaynak gösterdi? | Bing Webmaster Tools AI Performance desteklenen deneyimlerde atıf sayısını, kaynak URL'lerini ve örnek arama ifadelerini gösterir. | Atıf alan model veya konunun ölçüm standardını ve kaynağını incele. Sonucu Bing'in belgelenmiş kapsamıyla raporla. [Bing AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/) |
| Ziyaretçi gelip karşılaştırma yaptı mı? | GA4'te tanınan ChatGPT, Gemini ve benzeri yönlendirmeler **Yapay Zekâ Asistanı** kanalındadır. Google AI Overviews ve AI Mode ziyaretleri **Organik Arama** kanalına dahildir. Genel bir alan adı yönlendirmesi tek başına AI atfını kanıtlamaz. | Mevcut rıza kapsamında toplanması doğrulanmışsa karşılaştırma başlatma, tamamlama veya üretici belgesini açma olayını izle. Tamamlama oranı verirken aynı dönem ve kesitteki başlangıç sayısını payda olarak belirt. Olay kurulmamışsa veri durumunu kaydet. [GA4 kanal tanımları](https://support.google.com/analytics/answer/9756891?hl=tr) |

**Yayın ve erişim.** Google'ın üretken arama özellikleri için sayfanın dizinde ve metin önizlemesine uygun olması gerekir. ChatGPT aramasında `OAI-SearchBot`, eğitim tercihinde `GPTBot` geçerlidir. Bir erişim sorunu gözlenirse robots, HTTP ve CDN davranışını ilgili sağlayıcının yayımladığı doğrulama bilgileriyle incele. Erişim veya gösterim, bir sonraki yanıtta atıf garantisi vermez. [Google'ın GEO rehberi](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) · [OpenAI tarayıcıları](https://developers.openai.com/api/docs/bots)

**Editoryal örnek.** Türkiye pazarı GS donanımında 5090 D ve 5100 D için ECE R120 nominal motor gücü sırasıyla 86 ve 97 HP'dir. Üretici tablosu kuyruk mili devir seçeneklerini ayrı verir. Bunlardan kuyruk mili çıkış gücü türetilmez. Kabul örneği, iki değeri de aynı satırda göstermek, aradaki 11 HP farkın anlamını açıklamak ve ilgili PDF sayfasına bağlantı vermektir. Her modele kendi belgesi uygulanır. [Üretici tablosu, basılı s. 15](https://www.deutz-fahr.com/media/5D_Keyline_Faz_5_TRK.pdf) · [Yayımlanmış karşılaştırma](https://tractorvs.com/tr/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/)

**Araştırma sonuçlarının kapsamı.** Pew'in Mart 2025 ABD örnekleminde AI özeti görülen ziyaretlerin %8'inde, özet görülmeyenlerin %15'inde klasik sonuca tıklandı. TractorVS için çıkarım gösterimi, ziyareti ve tamamlanan görevi ayrı izlemektir. Siteye ait hedef ve eşikler kendi ölçümümüzden türetilir. [Pew araştırması ve yöntemi](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/)

## Resmî kılavuzlar
- Google AI arama özellikleri: https://developers.google.com/search/docs/appearance/ai-features
- Google People-first içerik: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google yapılandırılmış veri ilkeleri: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- ChatGPT Search erişimi: https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt
- Bing AI Performance: https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/
- Google llms.txt gerekmediğini açıklıyor: https://developers.google.com/search/updates

## Uzmanlık kaynaklarının güncel denetimi — 23 Kasım 2026

Bu bölüm, resmî belgelere dayalı **öğrenme kaydıdır**; burada yazılan öneriler canlı TractorVS sistemine uygulandı veya başarıyla test edildi anlamına gelmez. `AGENTS.md` ve mevcut dağıtım/yayın güvenliği kuralları önceliklidir.

### Doğrulanmış 2026 değişiklikleri — eski varsayımları güncelle
1. **Google Search Console Generative AI Performance:** 3 Haziran 2026'da duyuruldu, 31 Ağustos 2026 itibarıyla dünya çapında kullanıma sunuldu. AI Overviews/AI Mode gibi üretken AI gösterimlerini, görünen URL'leri ve ülke/cihaz/tarih dağılımını izlemeyi mümkün kılıyor. Eski “Search Console'da AI görünürlüğü için ayrı rapor yok” varsayımı yanlıştır. Rapor, gerçek ChatGPT atıflarını veya belirli AI cevabındaki kesin konumu ölçmez. Kaynak: https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports
2. **Google Search Console multimodal arama:** 24 Eylül 2026 duyurusuna göre Lens, Circle to Search, görsel yükleme ve Chrome görselle arama gibi etkinlikler için multimodal performans filtresi gelmeye başladı. Veri varsa traktör fotoğraflarının keşfinde ayrı analiz et; rapor boşsa görünürlük varmış gibi gösterme. Kaynak: https://developers.google.com/search/blog/2026/09/web-multimodal-in-sc
3. **Bing AI Performance ve Topics Portfolio beta:** AI cevaplarında atıf sayısı, kaynak gösterilen sayfalar ve desteklenen grounding sorgularını izleme; Ekim 2026 Topics Portfolio beta ile konu kümelerini değerlendirme imkânı. Hesapta yeterli veri varsa kullanılabilir; citation sayısı arama sıralaması veya ziyaret sayısıyla eşdeğer değildir. Kaynaklar: https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/ ; https://blogs.bing.com/webmaster/2026/10/introducing-topics-portfolio-beta-in-ai-performance/
4. **GEO için Google'ın resmî tavsiyesi:** Teknik SEO, erişilebilir indekslenebilir HTML ve özgün, kaynaklı, uzmanlık değeri taşıyan içeriğe odaklan. Google'ın üretken arama özellikleri için ayrı “sihirli işaretleme” gerekmiyor; `llms.txt` Google Search'te özel avantaj sağlamıyor. Başka servisler kullanıyorsa dosya korunabilir; sırf Google için çoğaltma, gereksiz “AI chunking” veya yapay bağlantı/atıf oluşturma yok. Kaynak: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

### TractorVS'ye uygulama ilkeleri ve kontrol edilebilir kabul koşulları
| Alan | Kanıta dayalı prensip | Kabul/ölçüm |
| --- | --- | --- |
| Teknik SEO | Yayınlanmış her modelin varyant/pazar/yıl/birim/kaynak kimliği ilk HTTP HTML'de görünür; robots, canonical, hreflang ve sitemap birbiriyle tutarlı olmalı | Örnek değil, ilgili değişiklik etkisindeki tüm URL'lerde ve 10 dilde uygun otomatik regresyon; canlı indeks verileri ayrı |
| GEO/içerik | Teknik soruları kaynak göstererek açık yanıtla, gerçek karşılaştırma ve sınırları açıkla; özgün analiz ekle; uydurma uzmanlık/puan/tecrübe yaratma | Kaynak URL + son kanıt tarihi + model/varyant kimliği; editoryal QA |
| Yapılandırılmış veri | Editoryal yazıda uygun `Article`, gerçek kullanıcı gönderisinde görünür yazar, yayın tarihi ve içerik kanıtlandığında `DiscussionForumPosting`, kanıt yetersizse `WebPage` kullan. Fotoğraf, tarih ve atıflar ekranda görülen bilgiyle eşleşir. | Desteklenen türlerde Rich Results Test ve gerçek HTML. Ana yazının yazarını, forum onayını ve kullanıcı gizliliğini ayrı doğrula. [Forum kuralları](https://developers.google.com/search/docs/appearance/structured-data/discussion-forum) |
| Çok dil | Şablonu desteklenen on dilde denetle. Tekil içerikte yalnız tam çevrilmiş ve yayımlanmış eşdeğerler birbirini belirtir. Pazar, varyant, birim, dipnot ve kaynak korunur. | Yayımlanmış dil kümesinde kendisini içeren karşılıklı `hreflang`, doğru canonical, 200 ve doğal çeviri. Taslak dil alternatifler arasına girmez. |
| Görsel keşfi | Tam model kimliğine uygun, lisansı/atıfı kanıtlı ve gerçek fotoğrafı kullan; açıklayıcı alt metin, sayfa bağlamı ve uygun çözünürlük sağla | Kaynak/izin kanıtı, görsel HTTP/MIME/hash, sayfa HTML, gerektiğinde GSC multimodal verisi |
| Performans | Gerçek kullanıcının 75. yüzdelik değerinde iyi hedefler: LCP ≤ 2,5 s; INP ≤ 200 ms; CLS ≤ 0,1. Laboratuvar ve RUM'u karıştırma | Mobil ve masaüstü ayrı CrUX/RUM; Lighthouse değişiklik regresyonu |
| Tasarım/erişilebilirlik | WCAG 2.2 AA hedefi; 10 dilde okunabilir metin, klavye/odak, dokunma alanı, kontrast, açıklayıcı hata; karşılaştırma filtresi kullanıcıyı şaşırtmamalı | axe-core + gerçek klavye/mobil akış testi, ekran görüntüsü, gerçek görev tamamlama; otomatik axe tüm WCAG'ı kanıtlamaz |
| Ölçüm disiplini | Sitemap gönderimi, erişim, tarama, indeksleme, gösterim, tıklama ve AI atıf/gösterim birbirinden farklıdır | Ölçüm türü, kaynak, tarih, kapsam, eksik veri ve olası gecikme ayrı kayıt |
| Güvenlik/gizlilik | Mevcut Supabase RLS, forum oturumları, analitik açık izin politikası, fotoğraf telifleri ve 10 dil korunur | Etki ve geri alma planı; test+CI; canlı değişiklikte üretim doğrulaması |

### Bağımsız güvenilir başvuru koleksiyonu
- Google temel SEO ve yararlı içerik: https://developers.google.com/search/docs/fundamentals/seo-starter-guide ; https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google JavaScript SEO ve çok dilli sayfalar: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics ; https://developers.google.com/search/docs/specialty/international/localized-versions
- Google görsel SEO ve forum JSON-LD: https://developers.google.com/search/docs/appearance/google-images ; https://developers.google.com/search/docs/appearance/structured-data/discussion-forum
- web.dev ölçümler ve yüksek etkili performans çözümleri: https://web.dev/articles/vitals ; https://web.dev/articles/top-cwv
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- MDN web performansı: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance
- Nielsen Norman Group UX heuristikleri: https://www.nngroup.com/articles/ten-usability-heuristics/
- Baymard filtreleme araştırması (e-ticaret bulgularını TractorVS **bilgi/karşılaştırma sitesi** bağlamına uyarlayarak): https://baymard.com/research/ecommerce-product-lists

### Tekrarlanabilir öğrenme döngüsü
1. Her TractorVS görevinde **önce güncel `AGENTS.md` ve ilgili repo belgeleri** okunur; bu not görev talimatlarının yerine geçmez.
2. Soruna karşılık gelen **resmî güncel kaynak** ve bağımsız deneysel bulgular denetlenir; kaynak tarihi/erişim tarihi ve önceki uygulamayla fark yazılır.
3. Önce mevcut kod ve canlı veri araştırılır; kök neden saptanmadan puan için değişiklik yapılmaz. Çözüm, beklenen fayda ve olası regresyon riskini içeren plan oluşturulur.
4. Toplu ama güvenli değişiklikler ayrı PR'da uygulanır; Playwright/axe, çok dilli SEO, güvenlik, fotoğraf lisansı ve yayın kuralları test edilir. Hesaptaki canlı ölçümler ancak erişim ve veri varsa raporlanır.
5. Sonuçlar `incelendi / değiştirildi / test edildi / ana dala birleştirildi / canlıda doğrulandı` olarak ayrı işaretlenir. Başarılı teknik ve tekrarlanmayı önleyecek regresyon testi repo belgelerine eklenir.
6. Haftalık kaynak taraması resmî belgedeki değişikliği mevcut kuralla karşılaştırır. Değişen hüküm, kanıt ve doğrulama yöntemi aynı PR'da güncellenir. Haftalık indeksleme görevi yukarıdaki ölçümleri eldeki verilerle izler. Gerileme sürüyorsa etkilenen URL'yi, gözlemi ve yeniden ölçüm koşulunu bir sonraki rapora taşır. Anlamlı değişiklik yoksa yeni görev veya yinelenen PR açılmaz.
