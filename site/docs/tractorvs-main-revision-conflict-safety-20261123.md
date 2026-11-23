# TractorVS — GitHub ana dal yayın senkronlarında çatışma dayanıklılığı

**Tarih:** 23 Kasım 2026. **Kapsam:** katalog ve forumdaki kamuya açık, yalnız yayımlanmış içeriğin GitHub üzerinden statik sürüm yenilemesi.

## Gözlem ve kanıt sınırı

- Salt-okunur incelemede son 400 GitHub Actions kaydı içinde bu iki senkrona ait 11 yakın tarihli işin **11'i başarılı**. Bu örneklemde gerçek 409 çatışması veya yayın kaybı doğrulanmadı; geri kalan işlerin otomatik olarak başarılı olduğu varsayılmamalı.
- `.github/workflows/tractorvs-publication-autosync.yml` ve `.github/workflows/tractorvs-forum-publication-autosync.yml` birbirinden ayrı `concurrency.group` kullanıyor. Her ikisinde de ana dal içerik API'sine `PUT` çağrıları var: katalog `site/src/data/public-catalog-sync.json`, forum `site/src/data/public-forum-sync.json`.
- GitHub Actions aynı grupta varsayılan tek pending run'u ve grup bazında eşzamanlılık sınırını belgeler; **farklı gruplar birbirini seri hâle getirmez**. GitHub Repository Contents API eşzamanlı yazma isteklerinde çatışma doğabileceğini belirtir. Somut bir olay değil, başarısız durumda bütünlük kaybını önleme tedbiridir.
- Kaynak: https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency
- Kaynak: https://docs.github.com/en/rest/repos/contents

## Uygulanan düşük riskli düzeltme (bu PR içinde)

Her iki `run*Sync` fonksiyonu GitHub'da **yalnız `409 Conflict`** aldığında (en fazla bir kez):
1. GitHub'da hedef dosyanın güncel SHA'sını ve fingerprint'ini yeniden okur.
2. Supabase'de yeniden **yalnız anon rolüyle erişilebilir, yayımlanmış kamu görünümünü** okur; eski veri hash'ini kullanmaz.
3. Zaten başka yazar aynı fingerprint'i kaydetmişse yeni commit üretmez; işlemi idempotent olarak tamamlar.
4. Yayın verisi değiştiyse mevcut katalogun kitleyle yayımdan kaldırma kontrolünü tekrar işletir; forumda gerçek moderasyonla kaldırılan içerik için bloklayıcı model sayısı eşiği uydurmaz.
5. Yeni SHA ve güncellenmiş fingerprint ile yalnız bir ikinci `PUT` dener. İkinci `409` dahil tüm kalıcı hatalar **başarısız** olur; sonsuz retry, force push, bypass, secret veya draft veri aktarımı yoktur.

**GitHub 401/403, Supabase 401/500, yanlış JWT/scope ve eksik sayfa** durumları normal, fail-closed hata davranışını korur. Zaman aşımı veya bağlantı belirsizliği güvenli olarak başarısızdır; bir sonraki zamanlı tetikleme kamu durumunu tekrar hesaplar. Aynı ana dala yazan diğer işlerin olası yarışları bu mekanizma ile azalır; tüm dağıtımlarda sıfır hata garantisi değildir.

## Testler ve kabul

- **Pozitif:** 409 sonrası yeni SHA ve yeni anon-only veri ile ikinci `PUT`; 409 sonrası diğer yazıcının aynı hash'i işlemiş olması; mevcut değişmeyen/dry-run; taslak veya servis rolünün erişememesi.
- **Negatif:** İki 409 sonrasında başarısızlık; 403 sonrası tekrar denememek; yanlış branch; veri düşüşünü durdurma; bozuk Supabase okumada asla GitHub yazmama.
- **CI kapıları:** `node --test scripts/tractor-publication-autosync.test.mjs scripts/tractor-forum-publication-autosync.test.mjs`, `site build`, `Golden Rule` ve CodeQL.
- **Canlı:** PR/CI başarılı olması Cloudflare'ın gerçek yayın sürümü, arama motoru indeks kararı veya Google sıralama kazanımı değildir. Birleştirme sonrası bir sonraki planlı **gerçek** katalog/forum senkron işinin sonucunu ve Cloudflare'daki üretim sürümünü ayrı kontrol et.

## Öğrenilen kalıcı kural

İki yazan otomasyon farklı `concurrency.group` içinde olduğunda Github Contents API'nin `GET` → `PUT` zinciri atomik bütün-kasa kilidi sayılamaz. 409 yalnızca yeniden `PUT` yapılarak değil, **uzak SHA + gerçek yayımlanmış kaynak yeniden okunarak**, tek sınırlı deneme ve mutlak fail-closed ilkesiyle ele alınır. Ayrıca zamanla `queue: max` kullanımı, ortak grup ve diğer main writers ancak ölçülmüş kuyruk/kota/CI verisiyle değerlendirilir; mevcut cron sıklığı veya diğer iş akışları körlemesine değiştirilmez.
