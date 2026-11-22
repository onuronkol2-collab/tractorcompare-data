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
