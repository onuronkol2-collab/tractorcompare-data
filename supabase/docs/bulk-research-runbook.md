# TractorVS — 428 taslak için kontrollü toplu araştırma

**20 Kasım 2026 durumu (canlı Supabase salt-okunur denetim):** 462 traktör (428 draft, 32 published, 2 archived), 7.198 teknik özellik, araştırma kuyruğunda 415 queued + 4 retry + 8 needs_source + 1 failed + 20 completed. AI bulguları 442 approved, 226 duplicate, 305 pending.

## Neden yeni bir çalıştırıcı var?

Supabase Edge Function `tractor-ai-research` (v22.7, yayında) kuyruktan kayıtları kilitleyerek alabiliyor ve `process_queue_batch` isteğiyle en fazla **3** kayıt işleyebiliyor. Ancak projede bu işlevi çağıran `pg_cron` / `pg_net` kurulu değil. GitHub Actions çalıştırıcısı bu eksik orkestrasyonu mevcut Edge Function koduna, RLS kurallarına ve kaynak kayıtlarına dokunmadan sağlıyor.

Bu iş akışı **yalnız elle başlatılır**. Gemini çağrıları ücret ve kota tüketebilir; bütçe doğrulanmadan otomatik, sınırsız tarama başlatılmaz. Her çalıştırmada 1, 2, 4 veya 8 grup = en çok 3, 6, 12 veya 24 kayıt; çağrılar sırayla yapılır, eşzamanlı yürütme GitHub Actions `concurrency` tarafından engellenir. Hatalı yanıt, upstream servis arızası veya boş kuyruk görülürse devam etmez.

## Bir defalık gizli anahtar kurulumu

GitHub deposundaki `Settings → Secrets and variables → Actions → New repository secret` bölümünde:

1. `TRACTORVS_SUPABASE_SERVICE_ROLE_JWT`: Supabase projesinin **legacy service_role JWT** anahtarı. Mevcut Edge Function `verify_jwt=true` olduğundan sıradan `sb_publishable_` veya `sb_secret_` anahtarı yerine geçmez. Bu yüksek yetkili gizli anahtarı yalnız GitHub Actions Secrets içine gir; tarayıcıdaki site koduna, PR'a, sohbete veya issue'ya yapıştırma.
2. `TRACTORVS_QUEUE_SECRET`: Supabase Edge Function yapılandırmasında mevcut `TC_QUEUE_SECRET` değerinin aynısı. Yeni bir değer üretip yalnız bir tarafa yazmak kimlik doğrulamasını bozacaktır. Bu değer de yalnız GitHub Actions Secrets içinde tutulmalıdır.

Bu sırların mevcut olup olmadığı GitHub bağlayıcısıyla doğrulanamıyor. Kurulu değilse iş akışı **hiçbir araştırma kuyruğu kaydını almadan** güvenli biçimde hata verecek. Bu durumda iş başlamış gibi raporlama.

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

## Hata yönetimi

- **401 / 403:** JWT biçimi ve mevcut `TC_QUEUE_SECRET` eşleşmesini kontrol et; sırları hiçbir loga yazma.
- **429 / 5xx:** Üst sağlayıcı kota veya geçici hatası; çalışma durur. Kayıttaki `retry` / `needs_source` durumuna ve Gemini hata metnine bak; sınırsız tekrar deneme.
- **Boş kuyruk:** İşlem başarıyla durur; önceki `needs_source`, `failed` ve `pending` veri incelemeleri tamamlandı demek değildir.
- **30 dakika iş süresi sınırı:** İş akışı otomatik kapanabilir; yeniden başlatırken yukarıdaki sayımlardan güvenle devam et. Aynı anda yeni koşu başlatma.

**Yarım kalan iş bildirimi:** GitHub Actions başarısız koşuları ve JSON ilerleme kaydı kanıttır. Kullanıcı için mevcut günlük TractorVS SEO/içerik otomasyonunda ayrıca kaynak/araştırma kuyruğunda yeni takılma ve başarısızlık kontrolü vardır. Bu kontrol günlük olup anlık bildirim sağlamaz.
