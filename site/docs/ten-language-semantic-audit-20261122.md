# TractorVS — 10 dilde metin ve anlam eşleşmesi kontrolü (22 Kasım 2026)

## Kapsam ve bulgular
Depo ana dalındaki `AGENTS.md` ilkeleri ve mevcut denetimler okundu. Bu PR, genel metinlerin **anlamını** hedefleyen ilk düzeltme dilimidir; tüm kelimelerin profesyonel onayla incelendiği iddia edilmez.

1. `UI.catalogDesc`: İngilizce ana metin "compare specifications" dediği hâlde dokuz yerel dil yalnızca "inceleyin/görüntüleyin" çağrışımına kaymıştı. Dokuz dilde de **karşılaştırma** fiili ile **kaynağı doğrulanmış üretici bağlantısı** birlikte korundu.
2. `advisor-i18n.ts`: Japonca "Tractor condition" alanı yalnız "yeni/ikinci el" diyordu; yeni metin "トラクターの状態（新車・中古）" alanı ve seçenekleri açıklar.
3. `site/tests/ten-language-copy-integrity.test.mjs` ana menü, ana sayfa, forum, üyelik, forum editörü, forum paneli, gizlilik/analitik ve bağımsız kaynak uyarılarının **10 dil anahtar eşleşmesi, boş metin ve şablon değişkenlerinin korunmasını** denetler. Aynı zamanda katalog açıklamasındaki anlam kaymasını regresyon olarak engeller.
4. Mevcut `site/scripts/published-translation-audit.mjs` yayımlanan traktör teknik özellik başlıklarını ve isteğe bağlı SEO/hreflang yapısını denetlemeye devam eder. Aynı kontrolü gereksiz yeni bir canlı tarama iş akışıyla çoğaltmıyoruz.

## Henüz tamamlanmış sayılmayanlar
- Bütün 10 dilde her kelimenin ana dili konuşan tarım makineleri editörü tarafından anlam ve üslup bakımından kontrolü yapılmış değildir; otomatik anahtar/tip/birim kontrolü bunun yerine geçmez.
- Veritabanı kaynaklı model açıklamaları ve forum kullanıcı yazıları bu PR ile değiştirilmedi. Özel `needs_review` forum çevirileri anonim ziyaretçiye açılmamalıdır.
- 21 Kasım tarihli editoryal raporda uzun makale kapsamı 28/60 dil-kombinasyonu olarak belirtilmişti; **güncel** yayın kapsamı yeniden gözlenmeden aynı rakam canlı gerçekmiş gibi sunulmamalıdır. Çevrilmemiş makaleler için sahte alternatif dil sayfası üretilmemelidir.
- Bu dalda CI başarısı ve Cloudflare canlı dağıtımı ayrı ayrı doğrulanmadan yayınlandı demek yanlıştır.

## Sıradaki öncelik
1. Geri çağırma, kaynak doğrulaması, teknik koşullar, kg/hp/kW/Nm/PTO birimleri, olumsuzluklar ve güvenlik uyarıları.
2. Uzun makaleler ve forum kaynaklı tam metin çeviri/kaynak-hash eşleşmesi.
3. Statik sayfalarda görünür dil kaçakları, bölünmüş ifadeler, doğal SEO/H1/meta ve yerel deyimler.
4. Bağımsız dil editörleriyle anlam doğrulaması; test, PR incelemesi, canlı sitemap/canonical/hreflang kontrolü.

**Değişmeyen sınır:** Teknik ölçüm değerleri, markalar, model/yıl/varyantlar, Supabase RLS/yayın durumları ve forum çeviri onay mekanizması korunmuştur.

## İkinci güvenlik ve fiyat doğruluğu düzeltme grubu
- Traktör seçim asistanında **5 anlamı yüksek etkili uyarı** 10 dilde karşılaştırıldı; eksik cümleler düzeltildi (41 tekil hücre).
- `priceNote`: ülke/varyantlar arasında fiyat aktarmama ilkesi ve lastik, vergi, bayi koşulları dokuz dilde açıklandı.
- `bigha`: değişken yerel alan birimini akre/hektara dönüştürürken **doğrulanmış yerel dönüşüm** seçeneği geri getirildi.
- `unavailable`: güç verisi olmayan/uygun olmayan sonuçların yanıltıcı sunumu önlendi; kriter değiştirme veya kataloğu açma yönlendirmesi tamamlandı.
- `plowCaution`: lastik tutunması, işleme derinliği, balast ve ekipman üretici teknik şartları birlikte belirtildi.
- `loaderCaution`: ön yükleyici için güvenli kaldırma talimatı, aks yükü, hidrolik ve denge uyarıları korunarak tamamlandı.
- Bu madde ve ilk katalog düzeltmesi **kaynak kodunda ve taslak PR'dadır**; ana dala birleştirme veya üretim dağıtımı değildir.

## Üçüncü aşama — 388 model × 10 dil canlı kaynak başlıkları

22 Kasım 2026 tarihli [canlı çeviri denetimi](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45056633686) `3976` benzersiz sitemap URL'si içinde `388` model × `10` dil = `3880` model HTML sayfasını inceledi; `3492` model-dil çiftini karşıladı, `0` tarama hatası raporladı. İngilizce kalmış teknik başlıklar (benzersiz ad / görünme sayısı): pt-br `121 / 154`, fr `116 / 166`, es `109 / 113`. Diğer diller bu **konum-temelli** kontrolün kapsamına giren kriterde sıfır eşleşmeyle geçti; bu tüm metinlerinin kusursuzluğu anlamına gelmez. Terimlerin bir kısmı OEM marka/ürün adları olup bire bir aynılık tek başına yanlış çeviri kanıtı değildir.

`site/src/lib/reviewed-live-technical-headings-20261122.ts` dosyasında, canlı kanıtta tam metin ve kaynak bağlamı eşleşen **156 farklı İngilizce kaynak başlığı** için yalnızca gerçekten İngilizce kalan pt-BR/fr/es hücreleri elle, teknik şartları ve ürün/marka adlarını koruyarak yerelleştirildi. Bu başlıkların önceki canlı gözlemde toplam `pt-br: 149`, `fr: 162`, `es: 112` başlık görünümünü karşılaması öngörülür. **Bunlar model sayfalarında yapılan yeni bir canlı doğrulama değil, kaynak başlığı+locale eşleşmelerinden hesaplanan potansiyel kapatılan gözlem sayılarıdır.** Yeni bir üretim derlemesi/sitemap doğrulaması olmadan gerçekleşen yayın sayısı olarak raporlanamaz. `PowerShuttle` gibi marka isimleri semantik ipucu olmadan çevrilmedi.

Kaynak orijinal teknik sayıları, hp/kW/Nm/rpm birimleri, varyant, model/üretim yılı, üretici belgesi ve Supabase kayıtları değiştirilmedi. `site/tests/reviewed-live-technical-headings-20261122.test.mjs` her kaynağın tam eşleşmesini, yerel etiketin oluşmasını ve orijinal verinin bozulmamasını test eder.

**Kalan kanıt/doğrulama:** Önceki kaydın tamamı yeni kodun canlı yayına alınmış hali değildir; PR üzerinde kaynak/derleme/Playwright/axe ve çeviri önizleme audit'lerinin başarılı sonuçlarını kontrol et; bağımsız doğal dil/yerel tarım terminolojisi QA'sı ve gerçek Cloudflare yayın sonrası audit olmadan tüm site %100 tamamlandı deme.

### İkinci başlık grubu ve bilinçli istisnalar
Kaynak düzeyinde doğrulanmış teknik koşullara yönelik 58 ek kaynak başlığı/94 yerel etiket daha eklendi. Önceki canlı rapordaki gözlem dağılımı: pt-BR 154 göstergeden 149'u, Fransızca 166'dan 162'si, İspanyolca 113'ten 112'si için yeni yerel tam karşılık oluşturuldu. Böylece toplam **433 gözlemden 423'ü** kod düzeyinde kapsandı. Kalan: pt-BR `PowerShuttle` (4 kez) ve belirsiz `Pitch` (1 kez); Fransızca `PowerShuttle` (4 kez); İspanyolca `Pitch` (1 kez). `PowerShuttle` özel ürün/teknoloji adı olarak korunur; `Pitch` alt bileşen ve veri bağlamı görülmeden çevrilmez. Bunların tümü ham veri değiştirmeden yalnız görüntüleme etiketleri içindir.

Sayılar 22 Kasım saat 18:44 UTC canlı yayımdaki eski rapor üzerinden kuramsal düzeltme kapsamıdır; yeni PR önizleme/açık canlı dağıtımda doğrulanmış sonuç değildir.

**Tam rapor artefaktı uzlaştırması:** `live.json` içindeki pt-BR 121 başlığın sonuncusu önceki konsol çıktısının `top 120` sınırı nedeniyle eksik görünüyordu: `Wheelbase F-ROPS Mechanical` (1 görünüm). Tam rapordan bulunarak bu alan da eklendi; toplam teknik başlık potansiyel kapsaması **423/433** oldu (pt-BR 149, FR 162, ES 112). Kalan 10 görünüm, 8 adet PowerShuttle ürün adı ve iki Pitch bağlamı doğrulanmamış alanıdır.
