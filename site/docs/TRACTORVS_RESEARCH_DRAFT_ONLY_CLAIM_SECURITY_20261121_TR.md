# TractorVS — Ücretli araştırma kuyruğunda yalnız taslak hedef seçme koruması
**21 Kasım 2026 — CANLI SUPABASE'DE UYGULANDI / bağımsız salt-okunur denetim yapıldı.**

## Kök neden
`public.tc_claim_next_tractor_research()` (`SECURITY DEFINER`, yalnız `postgres` / `service_role` EXECUTE) kuyruk durumunu (`queued`/`retry` ve eski `running`) ve deneme sınırını kontrol ediyor, ancak hedef `tractors.status` durumunu hiç kontrol etmiyordu. Güncel 406 araştırmaya uygun kaydın **248'i draft, 155'i published, 3'ü archived**. Mevcut üreticiden doğrulanıp yayımlanmış 158 modelin tekrar ücretli araştırma ihtimali vardı. 158 kuyruk satırı bilerek silinmedi, `completed` yapılmadı; kanıtsız başarı kaydı oluşturulmadı.

## Yama
`supabase/patches/20261121_tc_claim_next_draft_only_ALREADY_APPLIED.sql` dosyası **uygulanmış** kodun referans kopyasıdır, tekrar uygulanacak bir migration DEĞİLDİR. Fonksiyon:
- Kayıt seçerken `public.tractors t` üzerinde `t.id=q.tractor_id AND t.status='draft'` JOIN ve filtre kullanır.
- `UPDATE ... SET status='running'` esnasında ikinci kez `EXISTS(t.status='draft')` kontrolü yapar.
- Eski öncelik, retry zamanlaması, 20 dakikalık stale running toparlama, deneme limiti, `FOR UPDATE OF q SKIP LOCKED` ve dönüş tipi korunur.
- Güvenlik: owner `postgres`, `SECURITY DEFINER`, `SET search_path TO ''`, `proacl={postgres=X/postgres,service_role=X/postgres}`, `anon_execute=false`, `authenticated_execute=false` ve `service_execute=true` korundu.
- Hiçbir kuyruk kaydı, traktör kaydı, teknik veri, RLS, yetki/GRANT veya görsel kaydı değiştirilmedi. Bu işlem Gemini çağırmadı.

## Güvenli yedek ve bağımsız kontrol
Tek atomik transaction içinde eski `pg_get_functiondef()`, owner, ACL, güvenlik durumu kaydedildi:
- `tc_backup.maintenance_runs.run_id = a26f0b0a-e2eb-4b89-b8f7-315ea2505132`, `status='completed'`
- `tc_backup.object_snapshots`: tam **1** özgün fonksiyon tanımı
- Transaction sonrası `pg_proc` ve `pg_get_functiondef` ile fonksiyon koruması tekrar doğrulandı. `supabase/verification/20261121_research_claim_draft_only_readonly.sql` sorguları işleme başlatmadan denetler.
- `supabase/rollback/20261121_research_claim_guard_manual_review.sql` **değişiklik yapmaz**; orijinal fonksiyonu restore etmek ödeme israfı doğurabileceği için ayrı manuel etki analizi gerektirir.

## İlgili otomasyon arızası / ayrı eksik
GitHub `tractorvs-research-watchdog.yml` schedule'da `dry_run=true` çalışır: git Actions logunda `dry_run_verified; dispatched=false`. **Bu yama otomatik araştırmayı başlatmaz.** İşlenmeye uygun gerçek taslaklara geçişi güvence altına alır. Ücretli Gemini otomatik kullanımını açmak için önce gerçek maliyet/bütçe denetimi gerekir; dispatch sayısı sınırı token/TL sınırı değildir. Ücretsiz resmî kaynakla toplu araştırma için GitHub #147 açık kalmalıdır.

## SEO / üretim
Bu SQL iş akışı statik HTML oluşturmaz, Cloudflare'ı deploy etmez, Google'a indeks göndermez. Canlı Supabase güncel envanteri 200 published / 263 draft / 5 archived ve 5701 kamu kaynaklı teknik kayıt; `site/src/data/public-catalog-sync.json` anon-only otomasyon tarafından ayrıca güncellenmelidir.
