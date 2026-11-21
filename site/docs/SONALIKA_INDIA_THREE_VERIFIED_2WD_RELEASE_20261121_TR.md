# TractorVS / Sonalika India — kaynağı doğrulanmış üç yeni 2WD traktör
**Üretim işlemi:** 21 Kasım 2026 | **Batch:** `20261121_sonalika_di30_di734_gt20_v1`

## Kesinleşen kapsam
Üç traktör mevcut özgün `public.tractors` UUID üzerinde, Hindistan pazarı ve üretici resmî **2WD fiyat/varyant tabloları** esas alınarak yayımlandı. `model_year` bilinmediği için `NULL`; önceki `tractors.horsepower` değerleri teknik olarak `HP Category` (pazarlama sınıfı), bağımsız motor testi olmadığı için **`NULL`** yapıldı; önceki satırlar geri alınabilir yedektedir.

| Traktör / kayıt UUID | Üretici ürün sayfası | Kaynaklı kamu teknik satırı | Dikkat gerektiren ölçüm |
|---|---|---:|---|
| Sonalika DI 30 Baagban, `ad248a3c-d9af-45f9-9aff-93c54d2f45e8` | https://www.sonalika.com/tractor/di-30-baagban.html | 14/14 | 2WD orchard/vineyard 8F+2R; 2 silindir, 1800rpm, 29 L, 1250kg lift (bağlantı noktasının ölçüm yeri belirtilmiyor). 9.5-24 ve 11.2-24 arka lastik **seçenek** |
| Sonalika DI 734, `d5d14815-e556-4485-a747-a3de3ebf2b81` | https://www.sonalika.com/tractor/DI-734 | **13/14** | 2WD 8F+2R; 34 HP yalnız kategori; 2000rpm, 55L, 2000kg lift (noktası belirtilmiyor). **Hava filtresi çelişkisi** nedeniyle `air_filter_type` `verified_at=NULL` |
| Sonalika GT 20, `15fca0db-11a6-486d-872e-fc0518d78cd0` | https://www.sonalika.com/tractor/gt-20.html | 14/14 | 2WD fiyat tablosu; 6F+2R, 2700rpm, 31.5L, 650kg lift. Ön lastik 5.0-12/5.20-14, arka 8.0-18/8.3-20 **seçenek**, tek sabit donanım değil |

### Üreticinin kendi sitesinde çözülmeyi bekleyen çelişkiler
**DI 734:** Teknik özellikler tablosu *Oil Bath with Pre Cleaner* hava filtresi yazarken aynı model ürün sayfasındaki *Features → Air Cleaner* açıklaması **Dry type** tanımlıyor. Bunlardan birini seçip kesin veri gibi yayımlamadık. `air_filter_type` kaynak kaydı ve çelişki notuyla veritabanında tutuldu fakat RLS tabanlı `tractorvs_public_specs` kamu görünümüne alınmadı. **OIB fren** teknik özelliklerde görünse de üreticinin pazarlama metni bu donanımı *optional* diyor; teknik kayıt bu koşulu açıklıyor. Mekanik direksiyon temel varyant, power steering opsiyon.

**GT 20:** Kaynakta modelin fiyat/konfigürasyon tablosu açıkça **2WD** yazıyor. Genel özellik açıklamasında *4 Wheel Drive* başlığı da bulunuyor; tanıtım bloğu 2WD tablosuna göre ayrı donanım kanıtı sayılmadı. Kesinleşmeyen 4WD donanımı, bu yayımlanan 2WD kaydına eklenmedi.

**GT 22 4WD (henüz taslak):** Üretici sayfası model adını ve 4WD özelliğini kullanıyor, ancak aynı sayfanın *Variant/Price* tablosu **2WD** diyor. Modelin çekiş kimliği uyuşmadığından `63dd7323-7ea0-4837-881c-7ada91cd4854` taslağına doğrulama veya yayın verilmedi. Kaynak: https://www.sonalika.com/tractor/gt-22-4wd

**DI 734 Power Plus (henüz taslak):** Resmî ürün sayfasında teknik özellikler *Sliding Mesh with Centre shift* şanzıman yazarken pazarlama bloğu *Constant mesh gearbox with side shift* tarif ediyor. `fb435078-e556-417b-a5be-4084d6cf26f7` taslağı karışık donanım olarak yayımlanmadı. Kaynak: https://www.sonalika.com/tractor/DI-734-Power-Plus

## Teknik risk, hukuk ve veri güvenliği
- Her kayıt son yayımlanmamış kaynak satır sayısına ve kesin üretici URL'sine göre tek seferde kontrol edilip **aynı SQL transaction** içinde veri yedeği alındı: 3 tractor + 42 teknik spec = **45 özel snapshot**.
- Veritabanı yayın kapısına giren alanlar tam **41/41**; `DI734.air_filter_type` **taslak/denetimde**. Kaynaksız 2026 model yılı, ölçümsüz beygir, traktör fotoğrafı, fiyat veya stok uydurulmadı.
- Supabase yayın sonrası kontrol: **213 published / 252 draft / 7 archived**, **5.888** kamuya açık `verified_at` ve `evidence_text` kaynaklı teknik satır.
- Anon özel `tractorvs_image_candidates` erişimi yok. `tractorvs_public_specs` `security_invoker=true` ve `security_barrier=true` olmaya devam ediyor; RLS/grants/Auth değişmedi.
- Yeni kaynakların üretici sayfalarındaki **fotoğraflarının yeniden kullanım hakları doğrulanmadı** ve siteye eklenmedi.
- GitHub statik Astro katalog parmak izi, Supabase sorgusu ve Cloudflare deploy **ayrı** kontrol edilmelidir. Sayfa oluşturulduğu veya Google tarafından indekslendiği yalnız `status='published'` ile kanıtlanamaz.

## Denetim ve geri alma
- `supabase/verification/20261121_sonalika_three_official_release_readonly.sql`: tam ayrı kaynak, varyant ve RLS denetimi.
- `supabase/rollback/20261121_sonalika_three_official_release_review.sql`: yalnız koşul/bağımlılık kontrolü, **hiçbir DDL/DML yazmayan** manuel geri alma ön incelemesi.
- Takip eden araştırmalarda önce 252 taslağın kaynakları ve otomatik görevler canlı kontrol edilmeli; burada tamamlanmış 3 kayıt yeniden verified yapılmamalı.
