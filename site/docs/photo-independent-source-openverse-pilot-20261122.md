# 22 Kasım 2026 — Commons dışındaki bağımsız CC fotoğraf kaynakları

## Gerekçe ve kapsama durumu

Canlı Supabase: 388 published model kaydı, GitHub'daki lisanslı görüntü listesiyle *birebir marka+model* eşleşen 74 ve fotoğrafı olmayan **314 kayıt (290 benzersiz marka-model çifti)**. Fotoğraf arşivinin 88 kayıtlı görseli, yayımlanmamış/historik veya farklı varyantlardaki fotoğrafları da kapsar; tümü 388 modelin görseli değildir. En çok açık McCormick 52, Sonalika 32, TYM 28, Mahindra 25, Swaraj 21, Steyr 18, Valtra 18 ve Zetor 17.

GitHub Actions / Commons toplu fotoğraf araştırması zaten var; ancak **Wikimedia 429 kota sınırına** ulaşıldı. İzin dışı bölgesel, proxy, alternatif hesap veya aşırı tekrar ile sınır aşılmayacak. Commons kaynağının kaybı lisanslı aday bulunamadığı anlamına gelmez.

## Yeni bağımsız kaynak dizini

`site/scripts/photo-openverse-independent-batch.mjs`, Openverse'in herkese açık /v1/images/ dizinini kullanarak özellikle **Flickr** ve **Europeana** kaynaklarında ticari yeniden kullanıma aday `CC BY`, `CC BY-SA`, `CC0` etiketli fotoğrafları arar. Openverse arama sonucu **hukuki izin belgesi değildir**: nihai yükleyici, orijinal fotoğrafçı, gerçek lisansın sürümü, üçüncü taraf hakları ve fotoğraftaki kesin model/varyant ayrıca doğrulanır.

- Arama kapsamı: Yalnız **yayındaki** `published-model-inventory.json` (güncel canlı site-sitemap'ten alınan kimlik ve URL'ler); draft veya özel SQL envanterleri API'ye gönderilmez.
- Tekrar kayıt: önce onaylı fotoğrafa sahip marka/model çiftlerini kaldır, kalan 290 farklı kimliği önem sırasına göre seç.
- Bütçe: günde **en fazla 12** Openverse sorgusu, her sorguda en fazla **7 sonuç**; her 24 saatte dönen küçük seçki. `429` anında durur; `5xx` veya bozuk JSON partial yazılır. Birden fazla kimlik için sonsuz arama yok.
- Kaynak: açık lisans metadata arayıcıdır, belirli hak sahibinin ayrıca incelemesi gerekir; `CC BY-NC`, `CC BY-ND`, URL ile lisans türü uyuşmayan adaylar elenir.
- Çıktı: **yalnız `photo-discovery-report/openverse-independent-provider-review.json` rapor adayı**. `allowed_to_publish=false`, `original_author_rights_verified=false`, `exact_visual_model_identity_verified=false` alanları zorunlu.
- Workflow: ana `.github/workflows/batch-photo-research.yml` günlük araştırmasından sonra, mevcut aynı fotoğraf araştırma artefaktına ekler. Commons raporu ve kalite kapılarını atlamaz veya değiştirmez; bağımsız API başarısızlığı kendi raporunda görünür. GitHub workflow değişikliği birleştirildiğinde mevcut güvenli main-push tetikleyicisi bu yeni dizini bir kez çalıştırabilir.

## Nihai yayın kapısı

İzinli adaylar dahi **asıl Flickr/Europeana sayfası kaynaklı lisans + fotoğrafçı + görsel model kanıtı**, doğru telif atfı, **gerçek yerel JPEG SHA/MIME/ölçüler** ve 10 dil ImageObject, fotoğraf sitemap, canonical, Worker 200, Playwright/axe, CodeQL denetimlerinden geçmeden yayımlanmaz. Mevcut yerel JPEG bütünlük kapısı `site/tests/tractor-photos.test.mjs` korunur; başarısız test çıkarılmaz/atlatılmaz.

### Bu görevde bloke olan doğrulanmış üç görsel

[PR #445](https://github.com/onuronkol2-collab/tractorcompare-data/pull/445) **taslak**; Steyr 6240 Absolut CVT (Blonder1984 CC BY 4.0), Zetor Proxima (JJ7777 ve Raf24~commonswiki CC BY-SA 4.0) için File sayfası ve kaynak kanıtları var. Ancak GitHub ortamı Wikimedia JPEG URL'sinden HTTP **429**, dolayısıyla 480px yerel JPEG kaynaklarının SHA kanıtı/varlığı yok ve CI doğru olarak başarısız. **Üç fotoğraf canlı yayımlanmadı.** Kaynakların hak/modele ilişkin özel notları `tractorvs_image_candidates` tablosunda 4 yayınlanmış model kimliğine yalnız araştırma aşamasında eklendi; image_asset_url, rights_verified_at, identity_verified_at alanları NULL bırakıldı.

Bu doküman bugüne kadarki kanıtlı, sınırlı bir arama ve ileriye dönük düşük maliyetli kapsama genişletme anlatır; **internetteki bütün platformların taranması** veya yeni 314 görselin bulunması garantisi değildir.
