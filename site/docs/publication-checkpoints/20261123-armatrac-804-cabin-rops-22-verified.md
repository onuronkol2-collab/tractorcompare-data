# ArmaTrac 804 / 804.4 — veritabanı doğrulama kontrol noktası, 23 Kasım 2026

**Kaynak PR:** https://github.com/onuronkol2-collab/tractorcompare-data/pull/484

**Supabase projesi:** `aaufxtcvnzgavtlintiv`

Bu dosya, `site/docs/armatrac-804-source-verified-20261123.md` ve `supabase/maintenance/20261123_armatrac_804_22_verified_specs.sql` için **SQL sonrası** kanıta dayalı checkpoint'tir. Kodun ana dala alınması tek başına DB yazımı sayılmamış, üretim veritabanında ayrıca doğrulanmıştır.

| Model | UUID | Önce | Ekleme | Doğrulanan toplam | Kaynaksız |
|---|---|---:|---:|---:|---:|
| 804 Fruit Garden Cabin | `619e4fd9-1155-4927-b488-4f55c95ee739` | 5 | 10 | 15 | 0 |
| 804.4 Fruit Garden ROPS | `362ad12b-7e89-4adf-83df-841b96b0362e` | 5 | 12 | 17 | 0 |

Her iki model `published` kalmıştır. İki tam üretici broşürü `data_sources` üzerinden ilişkilendirilmiştir; yeni değerler `source_id`, `verified_at`, `measurement_standard` ve `evidence_text LIKE 'ArmaTrac 804 source-check 2026-11-23;%'` işaretine sahiptir. Varyant/yıl, mevcut güç/torque, RLS, fotoğraf, forum veya önceki teknik özellikler değiştirilmemiştir.

Bu belgenin ana dala alınması mevcut ücretsiz `tractorvs-publication-autosync.yml` akışının **yayınlanmış anonim veri fingerprint değişikliği** kontrolünü başlatmalıdır. Ana dal güncellemesi sonrasında statik Astro/Cloudflare canlı dağıtımı ve her iki ürünün Türkçe/İngilizce URL'lerinde **15/17 görünür teknik özellik** ayrıca doğrulanacaktır. Otomasyon başarısız olursa yayın gerçekleşmiş gibi rapor etmeyin; manuel ve güvenli çözüm arayın. Bu checkpoint Google indekslemesinin kanıtı değildir.

Fotoğraf kaydı bu turda **0** eklenmiştir: ArmaTrac 804 Lux CRD / OEM fotoğrafı Fruit Garden'a eşlenmemiştir.
