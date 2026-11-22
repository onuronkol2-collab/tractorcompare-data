# 22 Kasım 2026 — Mahindra / Agrale kaynaklı özellik tamamlama

## Canlı veri işlemi ve üretim kanıt sınırı

Supabase `aaufxtcvnzgavtlintiv`: 22.11.2026 17:17:16 UTC'de 5 halihazırda yayımlanmış kesin model kimliğine 10 yeni `tractor_specs` satırı **atomik, duplicate-protected** transaction kapsamında eklendi; doğrudan SQL SELECT ile tamamı doğrulandı. `tractor.status`, model ID, motor gücü, yıl, varyant, existing spec, RLS ve görsel ilişkileri değişmedi. 12.169 başlangıç özellik kaydı, bu işlem için +10. Diğer otomasyonlar eşzamanlı çalışabileceğinden son toplam ayrı doğrulanmalıdır.

| Marka/model | Yeni teknik veri başlıkları | Resmî kaynak |
|---|---|---|
| Mahindra ARJUN 555 DI | brake_type (multi-disc oil-immersed), front_axle_type (bow-type), pto_type (MSPTO four modes, RPM unspecified) | https://www.mahindratractor.com/tractor/arjun-555-di |
| Mahindra ARJUN 605 DI i | clutch_type (single/dual dry options), service_interval_hours (400 hours manufacturer-stated), pto_power_kw (36.4 kW manufacturer-quoted) | https://www.mahindratractor.com/tractors/arjun-605-di-i |
| Mahindra ARJUN 605 DI MS | pto_type (MSPTO four modes; RPM unspecified) | https://www.mahindratractor.com/tractors/arjun-605-di-ms |
| Mahindra ARJUN 605 DI MS V1 | clutch_type (dual/SLIPTO); implement_side_shift (side shift; standard/optional fitment unspecified) | https://www.mahindratractor.com/tractors/mahindra-arjun-605-di-ms-v1 |
| Agrale 4233 | wheel_layout (isodiametric wheels), **not** drive configuration or wheel size | https://www.agrale.com.br/en/detalhes/tratores/tratores-agricolas/trator-4233 |

Her kayıt `source_id`, `evidence_text`, `measurement_standard` ve 95 öncelikli, mevcut resmî üretici kaynağına bağlı. Mahindra PTO **36.4kW**, bilinmeyen test standardı nedeniyle standart test edilmiş PTO performansına eşdeğer sunulmaz. Diğer farklı varyantlara hiçbir değer kopyalanmaz. Test standardı belirsizliği, otomatik çıkarımdaki olası hatalar ve üretici değişiklikleri sonraki doğrulamalarda izlenmeli.

**Agrale 4233 motor çelişkisi — çözülmedi:** Güncel resmî ürün metnindeki 30 cv @3000rpm / 69 Nm @2250rpm ile üreticinin farklı PDF sürümünde yer alan 25 cv / 6.9 daNm @2550rpm veri düzeni uyuşmuyor. Bilinmeyen pazar/yıl/varyantın güç veya torkunu mevcut canlı kayda taşımayın; resmî kaynak sürümünü eşleştirmeden çelişkiyi sessizce düzeltmeyin.

## Dil, görüntü ve yayın güvenliği

Bu PR yalnız eklenen dokuz farklı başlık için TR, ZH, HI, PT-BR, FR, DE, RU, JA, ES kesin eşleştirmeyi sağlar; EN kaynak başlığı, ham sayılar, opsiyon/koşullar, birimler, kaynak URL'leri ve doğrulama notları korunur. Derleme/sync geçişi bir **canlı HTML kanıtı değildir**; Cloudflare asıl dağıtımında ayrıca kontrol edilmeli.

**Fotoğraf:** `tractorvs_image_candidates` tablosunda 765 `research_needed`, 0 ortak lisans+kimlik onayı, 0 varlık URL'si (kontrol anı). Satıcı veya OEM sayfasında görüntü bulunması ticari yeniden yayın izni vermez. Bu işlemde 0 yeni fotoğraf yayımlandı; eski telifli/CC fotoğraflar korunmuştur.

## Test ve geri alma

`node --experimental-strip-types --test site/tests/oem-20261122-spec-labels.test.mjs` ve site build / Golden Rule / CodeQL kontrolleri PR kapısıdır. Kod kısmını geri almak için bu PR'ın squash commit'i revert edilebilir. Veritabanında sadece bu 10 satıra ait geri alma için model-ID + canonical_key + kaynak URL + 17:17:16 UTC doğrulama damgası ile hassas seçim gerekir; toplu `DELETE WHERE managed_by_ai` yapılmamalıdır. Yeni teknik veri başlıklarını kaldırmak ilgili yayımlanmış bilgiyi de kaldırır; kaldırma yalnız kanıta dayalı olmalıdır.
