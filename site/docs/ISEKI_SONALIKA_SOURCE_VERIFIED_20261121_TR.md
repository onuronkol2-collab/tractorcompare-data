# TractorVS — Iseki TXGS24 ve Sonalika FP-18 üretici kaynaklı toplu yayın
**21 Kasım 2026 · Canlı Supabase kontrol noktası · Veritabanı batch: `20261121_iseki_txgs24_sonalika_fp18_v1`**

## Canlı işlem sonucu
- İlk durum: 193 published / 268 draft / 3 archived; 5.560 public view teknik satırı.
- **Iseki TXGS24**: Birleşik Krallık kaynak pazarı, üretici broşüründeki hidrostatik 4WD / katlanabilir ROPS; 29 mevcut teknik satırın **28'i** bağımsız kaynak karşılaştırmasından sonra doğrulanarak yayımlandı, 1 çelişkili kayıt beklemeye alındı.
- **Sonalika FP-18**: International / 2WD üretici teknik föyü; **38/38** kayıt, üreticinin orijinal birimleri ve koşulları korunarak yayımlandı.
- Son durum: **195 published / 266 draft / 3 archived**, 5.626 public teknik satırı. 69 eski satırın (2 tractor + 67 spec) transaction-içi özel yedeği `tc_backup.tractor_publication_patches` içinde tutuluyor.
- Sadece iki UUID hedefli tek transaction; RLS/anon grant/fotoğraf forum veri değişikliği yok.

## Resmî kaynaklar, belge kapsamları
1. Iseki TXGS24 UK: https://www.iseki.co.uk/wp-content/uploads/2021/02/Iseki-TXGS24-Range-WEB-2.pdf
   - Ayrıntılı **Technical Specifications**, PDF sayfa 7/8 (0-indeks sayfa 6), sadece `TXGS24` sütunu; 23 hp/16.8 kW, 1.123 cm³ 3 silindir, HST, 4WD; 540 kg kaldırma **alt bağlantı uçlarında**; 790 kg ağırlık **operatör dahil**, teker ölçüleri koşullu.
   - **BİLİNEN ÇELİŞKİ:** Broşürün anlatım kısmı motor hızını 2.400 rpm olarak açıklar, ayrıntılı teknik tabloda 2.600 rpm yazar. `engine_rated_speed` satırı `verified_at=null` kaldı ve **kamu görünümüne çıkmadı**.
2. Sonalika FP-18 manufacturer International: https://international.sonalika.com/wp-content/uploads/brouchers/Sonalika-FP-18.pdf
   - PDF sayfa 2/2, tam FP-18 teknik değerleri; 1 silindir, 863.5 cc, 2WD, 6F + 2R, 28 L (üretici toleransı ±5%), 700 kg arka askı (**ölçüm noktası verilmemiş**), 540/540E, 1.160 kg üreticinin yalnız `Weight` olarak verdiği değer.
   - `operating_weight` kavramı **`weight_unspecified` olarak düzeltildi**: ağırlığın balastlı/operasyonel/kuru olduğu iddia edilmez.
   - Üretici 18'i `HP Category` olarak belirtir: bu değer deneysel motor gücü değil, **pazarlama sınıfıdır**. `tractors.horsepower` için kesin HP sayısı üretilmedi.

PDF metinleri üretici kaynaklarından alındı ve değerler ayrı ayrı kontrol edildi. Web PDF görsel-sayfa ekran görüntüsü bu oturumun aracında alınamadı (cache miss); bu sınır kayıtlıdır. İlgili satırları kaynak içeriğiyle açıklamadan toplu `verified_at` geçişi yapılmamalıdır.

## Yayın / SEO koşulları
- `status='published'` kaynağı Astro'nun statik site üretimiyle eş anlamlı değildir. `site/src/data/public-catalog-sync.json` otomasyonun anon-only public view hash'i üzerinden güncellenince ayrı Cloudflare build/deploy yapılmalı.
- Canonical, 10 dil hreflang, sitemap, yeni iki URL'nin HTTP 200 ve içerik kaynağı doğrulanmalı. GSC sitemap gönderimi **indeks kanıtı değildir**. Canlı Cloudflare/GSC sonucu alınmadan iddia edilmez.
- `supabase/verification/20261121_iseki_sonalika_release_readonly.sql` tekrar denetimi, `supabase/rollback/20261121_iseki_sonalika_manual_review.sql` yalnız koşullu güvenlik incelemesi içerir.

## Araştırma sıradaki blokajlar
- Swaraj 735 XT 4WD: üretici aynı sayfada 4WD/1700 kg ve 2WD/1650 kg çelişkisi; taslak.
- Swaraj 843 XM: tarihsel 2019 broşür vs güncel sayfa çelişkisi; taslak.
- Sonalika FP-18 model yılı belge kaynağından anlaşılamıyor; `model_year=null` bırakıldı.
