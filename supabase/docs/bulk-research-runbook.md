# TractorVS — kontrollü toplu araştırma ve güvenli zincirleme devam

**20 Kasım 2026 kontrol noktası:** 462 traktör (379 draft, 81 published, 2 archived). Son Gemini yeniden denemesinden sonra araştırma kuyruğu 403 queued + 6 retry + 16 needs_source + 3 failed + 20 completed. Bu rakamlar durağan bir envanter değildir; her çalıştırmada `queue_stats` ile yeniden doğrulanır.

## Neden yeni bir çalıştırıcı var?

Supabase Edge Function `tractor-ai-research` (v22.7, yayında) kuyruktan kayıtları kilitleyerek alabiliyor ve `process_queue_batch` isteğiyle en fazla **3** kayıt işleyebiliyor. Ancak projede bu işlevi çağıran `pg_cron` / `pg_net` kurulu değil. GitHub Actions çalıştırıcısı bu eksik orkestrasyonu mevcut Edge Function koduna, RLS kurallarına ve kaynak kayıtlarına dokunmadan sağlıyor.

Bu iş akışı **GitHub'ın yarım saatlik watchdog'u, elden başlatma veya önceki koşunun kontrollü devam tetikleyicisiyle** başlatılır. Gemini çağrıları ücret ve kota tüketebilir; otomasyon, harcama denetimi olmadığı için muhafazakâr çağrı limitine sahiptir ve sınırsız tarama başlatılmaz. Bütçeli otomatik çalışma başına **1 grup, en çok 3 kuyruk kaydı** işlenir. Artık aynı iş akışında manuel 2/4/8 grup seçenekleri maliyet denetimi gerçekleşene kadar devre dışıdır. Çağrılar sırayla yapılır; eşzamanlı araştırma çalıştırmaları GitHub Actions `concurrency` tarafından engellenir. Sistem hatası, kimlik doğrulama sorunu, upstream servis arızası veya boş kuyruk görülürse devam etmez. Edge Function'da `needs_source` olarak tutulan kesin HTTP 422 kayıtlarıysa ayrı incelenmek üzere bırakılır; sadece bu kayıtlardan dolayı diğer modeller engellenmez.

## Bir defalık gizli anahtar kurulumu

GitHub deposundaki `Settings → Secrets and variables → Actions → New repository secret` bölümünde:

1. `TRACTORVS_SUPABASE_ANON_JWT`: Supabase projesinin **legacy anon (role=anon) JWT** anahtarı. Bu anahtar yalnız platformdaki `verify_jwt=true` giriş kontrolünü geçmek içindir; araştırma kuyruğuna yetki veren ayrı gizli anahtar ikinci maddede bulunur. **`service_role` JWT'si KULLANMA**; çalıştırıcı bunu özellikle reddeder. Modern `sb_publishable_` veya `sb_secret_` anahtarları JWT'nin yerine geçmez. Anahtarı GitHub Actions Secrets içine gir; PR/issue/sohbet loguna yapıştırma.
2. `TRACTORVS_QUEUE_SECRET`: Supabase Edge Function yapılandırmasında mevcut `TC_QUEUE_SECRET` değerinin aynısı. Yeni bir değer üretip yalnız bir tarafa yazmak kimlik doğrulamasını bozacaktır. Bu değer de yalnız GitHub Actions Secrets içinde tutulmalıdır.

Bu iki gizli anahtarın GitHub ve Supabase arasında uyuşması, 20 Kasım 2026'da özel değeri yazdırmayan gerçek `queue_stats` testinde doğrulandı (GitHub Actions run 44715321819). Bir anahtar silinir veya değiştirilirse sistem **araştırma başlatmadan** hata vermelidir; değerleri GitHub Issue/log/sohbetine yapıştırma.

## Çalıştırma

GitHub → **Actions → TractorVS controlled research batch → Run workflow** → önce **1** grup seç. Testler geçerse `process` işi çalışır. Sonuç GitHub Actions **Summary** ekranında ve `tractorvs-research-progress` artifact dosyasında görünür. İlk grubun gerçek çıkışı ve olası Gemini maliyeti değerlendirildikten sonra 2/4/8 gruba geçilebilir.

İşlem yeniden çalıştırılabilir: Edge Function'ın mevcut `tc_claim_next_tractor_research` SQL RPC'si kuyruktaki uygun bir sonraki kayıt için çalışır, aynı tamamlanmış kaydı tekrar silip oluşturmaz. Ancak `retry` kayıtları yeniden ele alınabilir. Hata varsa özet ve artifact dosyasındaki durumdan kaldığı yer tespit edilir.

**Yayımlama ayrı kapıdır:** Bu çalıştırıcı hiçbir `tractors.status` değerini değiştirmez; `approved`, `verified_at` ve kamusal sayfaları zorla güncellemez. Güvenilir model/varyant eşleşmesi ve kaynak denetimi bitmeden hiçbir taslak yayınlanmaz. Supabase'deki `ai_research_findings` kayıtlarında `pending` olması yayına hazır olduğu anlamına gelmez.

## Güvenli kontrol SQL'i (salt-okunur)

```sql
SELECT status, COUNT(*) AS items
FROM public.tractor_research_queue
GROUP BY status
ORDER BY status;

SELECT review_status, COUNT(*) AS findings
FROM public.ai_research_findings
GROUP BY review_status
ORDER BY review_status;

SELECT status, COUNT(*) AS tractors
FROM public.tractors
GROUP BY status
ORDER BY status;

SELECT COUNT(*) AS technical_specifications
FROM public.tractor_specs;
```

**Dikkat:** 305 bekleyen bulgudan yalnız 25'i `ai_research_documents.identity_evidence_verified = true` işaretli. Bu 25 içinde Deutz-Fahr 6165 TTV konfigürasyonu ve Fendt 724 Vario üretim dönemi / brüt ağırlık / gücün rated–maximum ayrımı gibi özel ölçüm ve varyant sorunları var. `identity_evidence_verified` bayrağını tek başına otomatik onay veya yayın ölçütü sayma.



## Kesintisiz güvenli geri dönüş: otomatik watchdog (20 Kasım 2026)

`.github/workflows/tractorvs-research-watchdog.yml` varsayılan dalda GitHub Actions zamanlamasıyla UTC **:11 ve :41** dakikalarında çalışır. GitHub zamanlayıcı gecikebilir veya zaman zaman koşuları atlayabilir; 30 dakika kesinliği ya da arka planda ChatGPT'den bağımsız mutlak süreklilik garantisi yoktur.

Her döngüde:
1. Yalnız güvenilir `onuronkol2-collab/tractorcompare-data` ana dalı ve GitHub token'ı kabul edilir.
2. GitHub Actions API'sinden o UTC ayına ait **`workflow_dispatch`** araştırma çalışmaları okunur. Liste eksikse, API hata verirse veya 100'den fazla toplam manuel dispatch varsa sistem **fail-closed** durur.
3. Araştırma workflow'una ait gerçekleşmiş ve başlatılmış tüm dispatchler sayılır. **UTC günlük en çok 6, UTC aylık en çok 24 workflow_dispatch** yürütmesi yapılır. Mevcut işlerin toplam sayısı bu sınırlara dahildir. Her research dispatch **1 batch = en çok 3 kuyruk claim** ile sınırlanır. Teorik tavan: en çok **72 kuyruk claim / UTC ay** (diğer Gemini araştırma tetikleyicileri hariç). Bu sınır **Türk lirası veya token bazlı garanti değildir**; Google ücret ve harcamaları ayrıca denetlenmelidir.
4. Başka bir research dispatch `queued/in_progress` ise yenisi başlatılmaz. En son bitmiş iki araştırma çalışması da başarısızsa en son başarısızlıktan itibaren **en az 6 saat** otomatik beklenir. Tekil hatalar atlanıp bir sonraki watchdog zamanında sıradaki uygun kuyruk kaydı araştırılabilir.
5. Sadece mevcut Edge Function'ın gizli anahtarla yetkilendirilmiş **`queue_stats`** okuma isteği yapılır; kuyruk `queued+retry=0` ise işlem başlatılmaz. `needs_source` ve `failed` kayıtları insan/kaynak incelemesinde kalır.
6. Gerekli koşullar sağlanınca yalnızca **bir** `tractor-research-batch.yml` dispatch edilir (`batches=1`, `remaining_cycles=2`). Bu iş akışındaki **işlem öncesi kota kapısı** günlük/aylık hakkı yeniden sorgular; başarı sonrası **devam kotası** sıradaki dispatch'i göndermeden tekrar sorgular. Limit dolunca o UTC gün/ay boyunca otomatik bekler; süresi bittiğinde yeniden başlayabilir.

**Arıza güvenliği:** Ayrı bir model için HTTP 422 `needs_source` kararını diğer modellerin çalışmasını durdurma nedeni olarak kullanma. 401/403, 429, 5xx, Gemini sağlayıcı hataları ve yanlış JSON sonuçları olay bazında durdurulur; watchdog daha sonra bütçe ve bekleme korumalarına göre yeniden ele alır. Sistemin arızalı modele tekrar tekrar ücretli istek atmasına izin verme. Hiçbir aşama `tractors.status='published'` yapmaz.

**Kontroller:** `Actions → TractorVS automatic recovery watchdog` ekranındaki `workflow_dispatch` başlangıç varsayılanı **dry_run=true**; gerçek Gemini işlemi başlatmadan kota ve kuyruk doğrulanabilir. Tam otomasyon GitHub'da `Settings → Actions` üzerinden gerektiğinde devre dışı bırakılabilir. Durdurma için bu workflow'un schedule koşularını kapat veya ilgili dosyadan schedule'ı kaldır; gizli anahtarları açığa çıkarma.

## Bir çalışma biter bitmez sıradakine geçmek (GitHub Actions)

Yeni kontrollü **immediate continuation** seçeneği: GitHub Actions `TractorVS controlled research batch` iş akışında `remaining_cycles` girişini **0 / 1 / 2 / 4 / 8** arasından seç. İşlenen grup sistem hatası olmadan biter, araştırma kuyruğu `queue_stats` tarafından doğrulanır, kuyrukta `queued` veya `retry` kalır, her kayıt ya `success=true` ya da `queue_id` taşıyan belgelenmiş HTTP 422 kaynak eksikliği olduğunda ve devam hakkı kaldığında aynı GitHub Actions çalışma adımının sonunda `GITHUB_TOKEN` + `actions:write` ile **yeni bir workflow_dispatch** oluşturulur. Sonraki çalışma `remaining_cycles` sayısını **bir azaltarak** aynı main dalında başlar; kullanıcı tekrar Run workflow tuşuna basmaz. GitHub'ın concurrency kilidi ile önceki çalışmayla aynı anda çalışmaz.

Her yeniden başlatma geçişinde GitHub Actions başlatma kuyruğu gecikmesi olabilir; anlık/milisaniye süre garantisi yoktur. `remaining_cycles=0` ise zincir başlatılmaz. Varsayılan 1 batch + 2 yeniden başlatma *yalnız kota elverdiğinde* en fazla 9 araştırma kuyruğu işine kadar ilerler; günlük 6 / aylık 24 koşu ve `batches=1` sınırları mevcut zincir içinde de uygulanır. Diğer büyük seçimler bütçe denetimine kadar kapalıdır. Aylık 500–1000 TL bütçe doğrulanmadan büyük bir zincir başlatma. Kaynak/model kimliği doğrulanamayan HTTP 422 kayıtları `needs_source` durumunda bırakılır, koşunun `source_gaps` sayacında görünür ve güvenilir bilgi gibi yayımlanmaz. Kaynak eksikliğinden farklı hata (401, 429, 5xx, geçersiz cevap) **zinciri durdurur**; boş kuyruk da sonlandırır.

ÖNEMLİ: Bu akış mevcut Edge Function üzerinden araştırma kuyruğunu işler; **doğrudan `tractors.status` alanını `published` yapmaz.** Kaynak doğrulaması, model varyant kontrolü, SQL güvenlik kapısı ve Cloudflare üretim yeniden derlemesi kullanıcıdan yetkili olan ayrı yayın iş akışında sürdürülmelidir. GitHub bağlantısı `TRACTORVS_SUPABASE_ANON_JWT` ve `TRACTORVS_QUEUE_SECRET` isimli iki GitHub Actions Secret olmadan çalışmaz. Bu secret'ların kurulu olup olmadığı bağlayıcı tarafından doğrulanmamıştır; koyulduğunu varsayma. `service_role` JWT kullanma.

Bu işlem her tamamlandığında, bütçe hakkı kalırsa hemen, dolduysa yarım saatlik watchdog ve sonraki UTC bütçe döneminde yeniden başlayan **sınırlı** araştırma zinciridir; ChatGPT'nin saatlik görev sınırını değiştirmez. `workflow_run` ile sınırsız zincir kurulmamalı (GitHub 3 seviye sınırı). Proje güvenliği, araştırma maliyeti ve kaynak kalitesi nedeniyle sınırsız `remaining_cycles` desteklenmez.

## Hata yönetimi

- **401 / 403:** JWT biçimi ve mevcut `TC_QUEUE_SECRET` eşleşmesini kontrol et; sırları hiçbir loga yazma.
- **HTTP 422 + gerçek kuyruk kaydı:** Resmî kaynak bulunamadı veya model kimliği belirsiz. Satır `needs_source` durumda kalır, `source_gaps` sayılır; diğer kayıtlar devam edebilir. Yanlışlıkla teknik veri yayımlanmaz.
- **429 / 5xx:** Üst sağlayıcı kota veya geçici hatası; çalışma durur. Kayıttaki `retry` / `needs_source` durumuna ve Gemini hata metnine bak; sınırsız tekrar deneme.
- **Boş kuyruk:** İşlem başarıyla durur; önceki `needs_source`, `failed` ve `pending` veri incelemeleri tamamlandı demek değildir.
- **30 dakika iş süresi sınırı:** İş akışı otomatik kapanabilir; yeniden başlatırken yukarıdaki sayımlardan güvenle devam et. Aynı anda yeni koşu başlatma.

**Yarım kalan iş bildirimi:** GitHub Actions başarısız koşuları ve JSON ilerleme kaydı kanıttır. Kullanıcı için mevcut günlük TractorVS SEO/içerik otomasyonunda ayrıca kaynak/araştırma kuyruğunda yeni takılma ve başarısızlık kontrolü vardır. Bu kontrol günlük olup anlık bildirim sağlamaz.
