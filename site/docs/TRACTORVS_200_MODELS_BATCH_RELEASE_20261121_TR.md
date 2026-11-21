# TractorVS — 200 yayımlanmış modele ulaşan üretici kaynaklı toplu yayın
**21 Kasım 2026 / canlı Supabase transaction kaydı**

## Başlangıç ve sonuç
- Başlangıç: **195** yayımlanmış, **266** taslak, **3** arşiv; kamu teknik veri görünümü **5.626** satır.
- Üç atomik, ön kontrolü ve işlem sonrası doğrulaması yapılmış paket sonucunda: **200** yayımlanmış, **263** taslak, **5** arşiv; kamu teknik görünümünde **5.701** satır.
- **5 yeni yayına açılan model/varyant, +75 kamuya açık kanıtlı özellik.** Sitede yeni HTML/Cloudflare dağıtımı otomatik gerçekleşmiş sayılmaz.
- 50 eski satır özel `tc_backup.tractor_publication_patches` içinde korunur: DI 42 P+ 16, Mahabali RX42 18, TYM T3048 F50C 16.
- Hiçbir RLS ilkesi, anon grant, Auth, fotoğraf hakkı, forum veya zaten yayımlanmış başka bir model değiştirilmedi.

## Sonalika DI 42 P+ — Hindistan üretici 2WD model ailesi
- Kaynak: https://www.sonalika.com/tractor/di-42-power-plus
- Yayımlanan UUID `2d79ca05-3378-47dc-9d68-a368434d0dbe`; 15/15 kanıtlı.
- Model ailesi yayımlanmıştır: **Sikander, Sikander-Rx ve DLX-Rx seçenekleri**, tek sabit şanzıman/debriyaj iddiası değil.
- Üretici **45 HP Category** diyor; bunun kesin nominal ISO motor gücü olduğu iddia edilmez. `tractors.horsepower` üst alanındaki eski 45 değeri kaynaksız motor beygiri gibi yansımaması için `NULL` yapıldı, eski kayıt backup'ta.
- 2.000 kg kaldırma kapasitesinin ölçüm noktası kaynakta açıklanmıyor; 8F+2R ve 10F+5R üretici seçenekleri, tek standart değil.
- Batch `20261121_sonalika_di42p_india_v1` — 1 tractor +15 spec önceki hâli backup.

## Sonalika Mahabali RX 42 P+ — 2WD ve 4WD ayrı
- Kaynak: https://www.sonalika.com/tractor/mahabali-rx-42-pp.html
- 2WD `a0e16b7d-3b48-41c8-b4d9-5945b542b3c2`, 4WD `dd65e38b-8268-48f4-a9ac-1308e2decb86`. Her birinde **15/15** kanıtlı.
- Resmî 2WD/4WD tablo ayrı ön lastik (2WD 6.0–16; 4WD 8.0–18) ve tam trim bağıntısı gösteriyor; birleştirilmedi. Arka lastik ve 10F+5R gibi ortak bilgiler bağlamla işlendi.
- Kaynağın kesin doğrulamadığı **2.893 cm³** motor hacmi, **185,4 Nm** tork ve varyanta dağıtılamayan **37,50 km/h** hız eski taslakta bırakıldı; yayına aktarılmadı.
- 45 HP *category* ayrı teknik sınıf olarak saklandı; test standardı olmayan motor gücüne ve `tractors.horsepower` alanına yazılmadı.
- Eski karışık `4c4b5f32-9150-4ae8-ae39-2f46180f45cf` kaydı silinmeden archived yapıldı. Batch `20261121_sonalika_mahabali_rx42_verified_2wd_4wd_v1`, 18 önceki kayıt özel backup.

## TYM T3048 (F50C) — F50CN ve F50CHN ayrı
- Kaynak: https://tym.world/en/products/tractors/series-3/f50c
- **F50CN** kabinli 12F×12R: `5d1360a7-1494-44b9-9728-93de291ab082`, üreticinin `Weight with cab` = **1711 kg**.
- **F50CHN** kabinli, 3-range HST: `458be7b8-f6b8-4319-b264-dc6c7cc36ae7`, üreticinin `Weight with cab` = **1702 kg**.
- Her birinde 15/15 yayın kanıtı; aynı T3048 ailesinin zaten yayımlanmış **F50 / Series 3** kimliği ve teknik kayıtları aynen bırakıldı.
- Kaynakta 48 hp (36 kW) **Engine power** var ama ISO/SAE ya da rated/max standardı bulunmuyor. Bilgi `manufacturer_engine_power_unspecified_standard` adıyla teknik olarak korunur; kesin nominal HP başlığı üretilmez.
- 1500kg kaldırmanın ölçüm noktası belirtilmemiştir. Üreticinin bölgesel ürün/opsiyon farkları uyarısı korunmuştur.
- Kaynağı birden fazla şanzıman/ağırlıkla karıştıran eski F50C `12d51778-7e30-46ac-9428-ce672a4bf4a0` taslağı archived yapıldı.
- Batch `20261121_tym_t3048_f50c_variants_v1`, 16 özgün kayıt özel backup.

## Bloke edilen benzer riskli çalışma: Agrale 540 XT
Resmî üretici PDF'leri aynı model adıyla **farklı teknik versiyonlar**:
- Yeni, 11 Şubat 2026 üretilmiş Portekizce föy: https://pdf.agrale.com.br/2019/ficha-tecnica/pt/trator-540-xt-1/253/
  - 40 cv ISO 14396 @2400 rpm / 41,4 cv SAE J1995 @2400 rpm, hidrolik maksimum 36 L/min.
  - Nakliye ağırlığı **kabinsiz 1920**, kabinli 2230 kg; kullanım ağırlığı **kabinsiz 2270**, kabinli 2600 kg.
- Diğer, üreticinin arşiv/ayrı katalog PDF'i: https://www.agrale.com.br/en/pdf/gerar/253/tractors-agricultural-tractors-tractor-540-xt-1
  - 40 cv @2200 rpm ve 41 L/min ana debi / 32 L/min uzaktan; tekil 2250/2466 kg ağırlık gösteriyor.
- İngilizce yeni PDF'de kabinli/kabinsiz **ağırlık etiketleri ters** görünüyor; ana Portekizce kaynak ve İspanyolca karşılaştırma önemli.
- Bu alanlarda sürüm/pazar/yıl kimliği çözülmeden var olan 540 XT taslaklarına topluca `verified_at` veya `status='published'` uygulanmayacak. Web PDF screenshot hizmeti cache-miss döndürdü; PDF metni üzerinden doğrulama yapıldı, görsel PDF kanıtı ayrıca gerekebilir.

## Yüksek öncelikli takip
1. Saatlik araştırma `tractor_research_queue` 401 queued/5 retry/18 needs_source/4 failed/20 completed başlangıç bilgisi ile değil, her çalıştırmada canlı kontrolle devam etmeli. Ücretli Gemini harcama sınırları korunmalı.
2. `site/src/data/public-catalog-sync.json` bu transaction'lar öncesi **195/5626** ise yalnız yayımlanmış anon görünümünden yeni fingerprint ile yenilenmeli. Elle uydurma hash veya draft verisi koyma.
3. Cloudflare statik rebuild, 10 dilde slug/canonical/hreflang, sitemap, SEO ve canlı model sayfalarının 200 döndürmesi ayrı ölçülmeli.
4. Belgesiz yeni fotoğraf eklenmedi. Fotoğraf aday kuyruğu özel/RLS-kapalı kalır. Telif ve varyant kimliği doğrulanmadan Commons dahil görsel eklenmez.
5. Doğrudan veri yayını için tek satırlık veri denetimi: `supabase/verification/20261121_verified_200_variants_audit.sql`. Acil güvenli geri alma *ön inceleme* dosyası ayrıca mevcut; otomatik DELETE/UPDATE içermez.
