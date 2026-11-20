# TractorVS — Altyapı / Güvenlik / Yayın / SEO Denetimi
**Tarih:** 20 Kasım 2026. **Kapsam:** GitHub main, Supabase TractorCompareAI veritabanı (okuma ve izin kontrolü), Cloudflare Workers yapılandırması, site Astro kaynakları, CI/testler, temel SEO/GEO.
**Not:** Cloudflare Dashboard içindeki aktif runtime ve canlı HTTP/Lighthouse skorları bu incelemede doğrudan ölçülemedi; geçerli bir canlı hız puanı iddia edilmiyor.

## Doğrulanmış envanter
- PostgreSQL 17.11, Supabase projesi ACTIVE_HEALTHY.
- 462 traktör: **172 published, 288 draft, 2 archived**.
- Published traktörlerde 5.273 teknik özellik; tamamen özelliksiz yayımlanmış model **0**; 25+ özellikli yayımlanmış model **115**.
- Repo: statik Astro 7, Cloudflare Workers static assets, 10 dil, anon-only yayın revision monitor, üretim release gate.
- Public model view `tractorvs_public_specs` üzerinde `security_invoker=true`, `security_barrier=true`, `t.status='published'` filtresi doğrulandı.
- Forum localized view'larda `security_invoker=true` ve `published` koşulları var.
- SECURITY DEFINER fonksiyonların hiçbiri anon/authenticated tarafından doğrudan EXECUTE edilemiyor (audit anında).

## Uygulandı — yüksek öncelikli güvenlik
- Dokuz postgres-owned public tablosu, `anon` ve `authenticated` için gereksiz `TRUNCATE`, `REFERENCES`, `TRIGGER` ve PostgreSQL 17 `MAINTAIN` yetkileriyle oluşturulmuştu. RLS, `TRUNCATE` işlemini sınırlandırmaz.
- `20261120195808_tractorvs_revoke_public_dangerous_table_privileges_20261120` göçü uygulandı. İki role ait bu yetkiler geri alındı, `postgres` rolü için `public` şemasındaki *yeni tabloların* varsayılan yetkileri daraltıldı.
- **Bağımsız tekrar kontrol:** tehlikeli yetkisi kalan public temel tablo **0**. `anon SELECT` izinleri `tractors`, `tractor_specs`, `brands` ve `tractorvs_public_specs` için korunuyor. Hiçbir veri değiştirilmedi.
- Bu düzeltme `supabase_admin` rolünün kendi varsayılan yetkilerini değiştirmez. Yeni Supabase nesnelerindeki GRANT/RLS denetimi sürmeli.

## GitHub PR'de — güçlü yayın koruması
- GitHub'da `site/src/data/public-catalog-sync.json` doğrulanmış, yalnızca published modeli okuyan bir envanterdir: bu anda **172**.
- Önceki release gate minimum 100 model kontrol ediyordu. Böylece 172 → 120 gibi büyük bir gerileme yanlışlıkla yayına çıkabilirdi.
- Yeni gate, son envanterin en az %95'ini korur: **172 için eşik 164**; ayrıca environment üzerinden belirlenmiş daha yüksek sayıya saygı duyar. `site/verify-published-site-inventory.mjs` tüm 10 dilin model sluglarının ve sitemap `<loc>` girişlerinin tam olarak eşleşmesini, örnek model canonical'larını ve image sitemap varlığını kontrol eder.
- Anon-only yarım saatlik otomatik envanter senkronu da eski modele kıyasla %5'ten büyük düşüşte GitHub commit üretmez. Bu bir güvenlik durdurucusudur; kasıtlı büyük yayından kaldırma varsa önce araştırılmalı.
- Yeni kontroller yalnız gerçek üretim deploy sırasında fail-closed; önizlemeler `noindex` olmaya devam ediyor. Başarılı GitHub CI + Cloudflare Production gerekir.

## Kalan Supabase danışman bulguları
1. **12 adet `function_search_path_mutable` uyarısı.** İncelenen 12 fonksiyonun tamamı `SECURITY INVOKER`. Körlemesine `SET search_path=''` yapmak unqualified tablo/fonksiyon adlarını bozabilir. Önce tanımları ve çağrı zincirleri denetlenmeli; definer yükseltmesi yapılmamalı.
2. **7 adet indekslenmemiş yabancı anahtar**: AI research runs/findings, `price_history.source_id` (şu an 0 satır) ve `tractor_specs.source_document_id`. Son kullanıma ve `EXPLAIN` sonuçlarına göre küçük, kontrollü indeks PR'ları yapılabilir; gereksiz yedi indeks otomatik eklenmedi.
3. **4 adet çoklu permissive RLS uyarısı**. `brands` için iki aynı SELECT policy (sadeleştirilebilir); forum topic/reply için “yazarın kendi bekleyen içeriği” ve “yayındaki içerik” ayrımı amaçlı olabilir, birleştirilmesi izin davranışını değiştirebilir.
4. **11 adet policy'siz RLS tablo uyarısı INFO**. İç araştırma/işleme tablolarında dış okuma olmaması beklenebilir; public `SELECT` grant kontrolü yapılmadan otomatik politika eklenmeyecek.
5. **Auth leaked password protection kapalı (WARN).** Supabase Dashboard'da Auth şifre politikası ve mevcut kullanıcı akışı gözden geçirilmeli. Otomatik ve doğrulanmadan değiştirilmedi.

## Sonraki yatırımın en yüksek getirili alanları
- **P0 — Düzenli canlı denetim:** gerçek 200/404, robots/noindex/canonical/hreflang, sitemap ve fotoğraf proxy'leri; CI ile Cloudflare deploy ayrımını koru.
- **P1 — Mobil performans:** 4 örnek sayfada gerçek Lighthouse ve Core Web Vitals ölç; LCP, CLS, INP, görsel ağırlığı, JS ve cache. Kodda srcset, responsive img ölçüsü, lazy loading mevcut; ölçüm olmadan skor iddia etme.
- **P1 — Arama ve GEO:** Search Console sorgu+sayfa, Bing AI Performance desteklenirse gerçek kaynak görünürlüğü; daha fazla model yayınlandığında 10 dil ve kaynaklı özgün içerik.
- **P1 — Veri tabanı:** kaynak verisi yoğun, duplicate tespiti ve eksik verified_at alanlarında toplu salt-okunur analiz; varyant/saha ölçümü karıştırma.
- **P2 — Sürüm geri alma:** Cloudflare'da son çalışan deploy/önceki sürüm görünürlüğünü düzenli doğrula. Site verisi sunucuda değil statik build içinde olduğundan başarısız build eski sayfaları otomatik güncellemez.
- **P2 — Hata ve uyarılar:** Cloudflare Worker 5xx/timeout, Supabase REST başarısızlıkları, otomatik yayın senkronundan beklenmeyen düşüşler; ücretli servise bağımlı olmadan düşük hacimli uyarı.

## Bağlantılar ve güvenlik prensipleri
- Supabase API authorization: https://supabase.com/docs/guides/api/securing-your-api
- PostgreSQL row security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Google SEO / AI: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Cloudflare Builds: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- Veritabanı schema değişikliği öncesinde dry-run/kanıt, minimum DDL, bağımsız son sorgu ve gerekiyorsa rollback hazırlanır.
