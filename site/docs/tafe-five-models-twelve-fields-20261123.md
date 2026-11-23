# TAFE Türkiye — beş modelde 12 alanın resmî kaynak QA kaydı

**23 Kasım 2026** — TractorVS Supabase `aaufxtcvnzgavtlintiv`, yayınlanmış model/varyant kayıtları. Kullanıcının SEO/GEO/özgünlük/kanıta dayalı teknik yayın kuralı uygulanmıştır.

## Birebir eşlenen üretici kaynakları

| Türkiye modeli | Kimlik (UUID) | Üretici kaynağı | Doğrulanan alanlar |
|---|---|---|---|
| TAFE 240 S 2WD | `b6b226a4-27ce-4043-83aa-548fb3f08a68` | https://tafetractors.com/en-tr/products/tafe-240s-2wd | `engine_emission_standard=EU Stage V`; `transmission_type=Sliding mesh` (2) |
| TAFE 6020 M 4WD | `46f5fd77-7b3e-4954-868d-80e90a5b9e19` | https://tafetractors.com/en-tr/products/tafe-6020m-4wd | `pto_speeds=540/750 rpm`; `transmission_type=Constant mesh` (2) |
| TAFE 6515 CAB Advanced 4WD | `1cad70da-8aa5-4f44-8b98-31675c9c0e77` | https://tafetractors.com/en-tr/products/tafe-6515-cab-advanced-4wd | `cab_climate_control=HVAC`; `engine_emission_standard=EU Stage V`; `transmission_type=Synchromesh mechanical shuttle` (3) |
| TAFE 7515 CAB Advanced 4WD | `2009a1ab-5c09-4484-8356-0ce5b957ae27` | https://tafetractors.com/en-tr/products/tafe-7515-cab-advanced-4wd | `cab_climate_control=HVAC`; `engine_emission_standard=EU Stage V`; `transmission_type=Synchromesh mechanical shuttle` (3) |
| TAFE 7515 GE 4WD | `021c5a78-4a54-48c6-970f-8cfd1cd5b2a2` | https://tafetractors.com/en-tr/products/tafe-7515-ge-4wd | `engine_emission_standard=EU Stage V`; `transmission_type=Synchromesh mechanical shuttle` (2) |
| **Toplam** | **5 model** | **5 canlı üretici ürün sayfası** | **12 doğrulanmış satır** |

Üretici sayfalarının başlıkları/model kimlikleri, varyantı, şanzıman konfigürasyonu ve Euro Stage V/HVAC ifadeleri bağımsız olarak okunarak `public.tractor_specs` veri kaynağıyla birebir karşılaştırıldı.

### Bilinçli olarak doğrulanmayan çelişkiler

- **TAFE 7515 GE 4WD motor gücü:** Resmî Türkiye sayfasının bir paragrafında `74 HP`, başka bir paragrafında `75 hp` yazıyor; kesin değer olarak `engine_power=74` üretim satırına yeni doğrulama tarihi verilmedi. Önce yıl/donanım/ölçüm standardı veya üretici revizyonu çözülmeli.
- **TAFE 6020 M 4WD Euro Stage V:** Bu üretici sayfasında 540/750 PTO ve Constant Mesh doğrudan kanıtlı; `EU Stage V` değeri aynı sayfadan açıkça doğrulanamadığı için **doğrulanmadı**.
- **TAFE 6515 4WD (CAB olmayan):** 12F/12R ve Euro Stage V üretici metni doğrulanmış, ancak şanzımanın *mekanik shuttle* alt türü aynı ürün sayfasında açıkça ifade edilmiyor. Bu alan ayrı belgede önceki dört alan yayınında da **onaysız** bırakıldı.

### Uygulanan üretim kontrolü

Her model için tam `public.tractors.id`, `model_name`, `variant`, `status='published'`, pazar `Turkey/TR`, `public.data_sources.id`, `source_type='manufacturer_specification'`, **tam üretici URL'si**, `canonical_key` ve **tam kaynak `spec_value`** çiftleri, eski `verified_at IS NULL AND last_verified_at IS NULL` koşullarıyla karşılaştırıldı. Aynı transaction için **12/12** eşleşme şartı sağlandıktan sonra yalnız `verified_at`, `last_verified_at` ve kanıt açıklaması `evidence_text` değiştirildi. Commit sonrası **2+2+3+3+2=12/12** gerçek tarih damgası yeniden sorgulandı.

Teknik değer/birim, model yılı, üretim statüsü, kaynak ID/öncelik, fiyat, fotoğraflar, forum/SEO/RLS, canonical ve analytics izinleri **değişmedi**. Başka TAFE modeline otomatik teknik özellik ataması yapılmadı.

### Yayın süreci

[TAFE 6515 4WD için dört ayrı resmî alan](tafe-6515-4wd-official-four-fields-20261123.md) aynı PR kapsamında kaynaklı olarak kayıtlıdır. Bu ikinci dalga ile **altı Türkiye TAFE modelindeki toplam 16 alan** denetlenmiş oldu. Veritabanında veri hazır; üretim HTML'e geçtiği ancak canlı model sayfası + resmî kaynak ve canonical ile kontrol edilince söylenebilir.

- Site build, Altın Kural, production Worker kontrolleri yeşil olmalı. Branch'in son SHA'sı yeniden kontrol edilsin; eski SHA test sonuçlarını yeni SHA için kabul etme.
- Cloudflare yayını sonrası `/tr/tractors/tafe-6515-01b0b5ac/` ve beş ilgili gerçek model URL'si, kaynak bağlantıları ve farklı birimlerin etiketleri kontrol edilsin. Eski statik sayfaya ait **10 TAFE 6515** kaydı artık **14** olmalı.
- Eşzamanlı model keşif işleri çalıştığından tüm kayıt sayıları koşullu olabilir; hiçbir sahte tarih ataması yapılmamalı.
