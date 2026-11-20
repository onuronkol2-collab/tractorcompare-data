# TractorVS — kontrollü toplu araştırma ve güvenli zincirleme devam

**20 Kasım 2026 başlangıç durumundan sonraki güncel kontrol:** 462 traktör (379 draft, 81 published, 2 archived). İlk GitHub kuyruk denemesi sonrası 412 queued + 4 retry + 11 needs_source + 1 failed + 20 completed; sayılar her koşuda tekrar okunmalıdır. Önceki 428/32 değerleri artık geçerli değildir.

## Neden yeni bir çalıştırıcı var?

Supabase Edge Function `tractor-ai-research` (v22.7, yayında) kuyruktan kayıtları kilitleyerek alabiliyor ve `process_queue_batch` isteğiyle en fazla **3** kayıt işleyebiliyor. Ancak projede bu işlevi çağıran `pg_cron` / `pg_net` kurulu değil. GitHub Actions çalıştırıcısı bu eksik orkestrasyonu mevcut Edge Function koduna, RLS kurallarına ve kaynak kayıtlarına dokunmadan sağlıyor.

Bu iş akışı ilk kez **elle veya önceki koşunun kontrollü devam tetikleyicisiyle** başlatılır. Gemini çağrıları ücret ve kota tüketebilir; bütçe doğrulanmadan otomatik, sınırsız tarama başlatılmaz. Her çalıştırmada 1, 2, 4 veya 8 grup = en çok 3, 6, 12 veya 24 kayıt; çağrılar sırayla yapılır, eşzamanlı yürütme GitHub Actions `concurrency` tarafından engellenir. Sistem hatası, kimlik doğrulama sorunu, upstream servis arızası veya boş kuyruk görülürse devam etmez. Edge Function'da `needs_source` olarak tutulan kesin HTTP 422 kayıtlarıysa ayrı incelenmek üzere bırakılır; sadece bu kayıtlardan dolayı diğer modeller engellenmez.

## Bir defalık gizli anahtar kurulumu

GitHub deposundaki `Settings → Secrets and variables → Actions → New repository secret` bölümünde:

1. `TRACTORVS_SUPABASE_ANON_JWT`: Supabase projesinin **legacy anon (role=anon) JWT** anahtarı. Bu anahtar yalnız platformdaki `verify_jwt=true` giriş kontrolünü geçmek içindir; araştırma kuyruğuna yetki veren ayrı gizli anahtar ikinci maddede bulunur. **`service_role` JWT'si KULLANMA**; çalıştırıcı bunu özellikle reddeder. Modern `sb_publishable_` veya `sb_secret_` anahtarları JWT'nin yerine geçmez. Anahtarı GitHub Actions Secrets içine gir; PR/issue/sohbet loguna yapıştırma.
2. `TRACTORVS_QUEUE_SECRET`: Supabase Edge Function yapılandırmasında mevcut `TC_QUEUE_SECRET` değerinin aynısı. Yeni bir değer üretip yalnız bir tarafa yazmak kimlik doğrulamasını bozacaktır. Bu değer de yalnız GitHub Actions Secrets içinde tutulmalıdır.

Bu iki değerin GitHub Actions Secrets içinde tanımlı olup olmadığı GitHub bağlayıcısıyla doğrulanamıyor. Kurulu değilse iş akışı **hiçbir araştırma kuyruğu kaydını almadan** güvenli biçimde hata verecek. Bu durumda iş başlamış gibi raporlama.

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


## Bir çalışma biter bitmez sıradakine geçmek (GitHub Actions)

Yeni kontrollü **immediate continuation** seçeneği: GitHub Actions `TractorVS controlled research batch` iş akışında `remaining_cycles` girişini **0 / 1 / 2 / 4 / 8** arasından seç. İşlenen grup sistem hatası olmadan biter, araştırma kuyruğu `queue_stats` tarafından doğrulanır, kuyrukta `queued` veya `retry` kalır, her kayıt ya `success=true` ya da `queue_id` taşıyan belgelenmiş HTTP 422 kaynak eksikliği olduğunda ve devam hakkı kaldığında aynı GitHub Actions çalışma adımının sonunda `GITHUB_TOKEN` + `actions:write` ile **yeni bir workflow_dispatch** oluşturulur. Sonraki çalışma `remaining_cycles` sayısını **bir azaltarak** aynı main dalında başlar; kullanıcı tekrar Run workflow tuşuna basmaz. GitHub'ın concurrency kilidi ile önceki çalışmayla aynı anda çalışmaz.

Her yeniden başlatma geçişinde GitHub Actions başlatma kuyruğu gecikmesi olabilir; anlık/milisaniye süre garantisi yoktur. `remaining_cycles=0` ise zincir başlatılmaz. Varsayılan 1 batch + 2 yeniden başlatma = en fazla 9 araştırma kuyruğu görevi. Üst sınır 8 batch ve 8 yeniden başlatma = en fazla 216 iş; bu maliyetli olabilir ve **Gemini limitini aşabilir**. Aylık 500–1000 TL bütçe doğrulanmadan büyük bir zincir başlatma. Kaynak/model kimliği doğrulanamayan HTTP 422 kayıtları `needs_source` durumunda bırakılır, koşunun `source_gaps` sayacında görünür ve güvenilir bilgi gibi yayımlanmaz. Kaynak eksikliğinden farklı hata (401, 429, 5xx, geçersiz cevap) **zinciri durdurur**; boş kuyruk da sonlandırır.

ÖNEMLİ: Bu akış mevcut Edge Function üzerinden araştırma kuyruğunu işler; **doğrudan `tractors.status` alanını `published` yapmaz.** Kaynak doğrulaması, model varyant kontrolü, SQL güvenlik kapısı ve Cloudflare üretim yeniden derlemesi kullanıcıdan yetkili olan ayrı yayın iş akışında sürdürülmelidir. GitHub bağlantısı `TRACTORVS_SUPABASE_ANON_JWT` ve `TRACTORVS_QUEUE_SECRET` isimli iki GitHub Actions Secret olmadan çalışmaz. Bu secret'ların kurulu olup olmadığı bağlayıcı tarafından doğrulanmamıştır; koyulduğunu varsayma. `service_role` JWT kullanma.

Bu işlem her tamamlandığında kendi kendine yeniden başlayan **sınırlı** bir araştırma zinciridir; ChatGPT'nin saatlik görev sınırını değiştirmez. `workflow_run` ile sınırsız zincir kurulmamalı (GitHub 3 seviye sınırı). Proje güvenliği, araştırma maliyeti ve kaynak kalitesi nedeniyle sınırsız `remaining_cycles` desteklenmez.

## Hata yönetimi

- **401 / 403:** JWT biçimi ve mevcut `TC_QUEUE_SECRET` eşleşmesini kontrol et; sırları hiçbir loga yazma.
- **HTTP 422 + gerçek kuyruk kaydı:** Resmî kaynak bulunamadı veya model kimliği belirsiz. Satır `needs_source` durumda kalır, `source_gaps` sayılır; diğer kayıtlar devam edebilir. Yanlışlıkla teknik veri yayımlanmaz.
- **429 / 5xx:** Üst sağlayıcı kota veya geçici hatası; çalışma durur. Kayıttaki `retry` / `needs_source` durumuna ve Gemini hata metnine bak; sınırsız tekrar deneme.
- **Boş kuyruk:** İşlem başarıyla durur; önceki `needs_source`, `failed` ve `pending` veri incelemeleri tamamlandı demek değildir.
- **30 dakika iş süresi sınırı:** İş akışı otomatik kapanabilir; yeniden başlatırken yukarıdaki sayımlardan güvenle devam et. Aynı anda yeni koşu başlatma.

**Yarım kalan iş bildirimi:** GitHub Actions başarısız koşuları ve JSON ilerleme kaydı kanıttır. Kullanıcı için mevcut günlük TractorVS SEO/içerik otomasyonunda ayrıca kaynak/araştırma kuyruğunda yeni takılma ve başarısızlık kontrolü vardır. Bu kontrol günlük olup anlık bildirim sağlamaz.
