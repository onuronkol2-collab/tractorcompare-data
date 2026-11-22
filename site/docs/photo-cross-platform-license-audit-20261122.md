# 22 Kasım 2026 — Açık lisanslı çok platformlu fotoğraf kaynak taraması

## Gerçek yayımlanmış envanter açığı

Güncel Supabase'de 388 yayımlanmış traktör kaydı; kodun mevcut lisanslı fotoğraf kimliklerinde 74 kayda birebir brand/model eşleşmesi; **314 fotoğrafsız kayıt** / **290 benzersiz brand+model ad çifti** (sorgu 22 Kasım 2026). Mevcut 88 lisanslı fotoğraf nesnesinden önemli kısmı yayımlanmamış/historik modelde kalır; aynı fotoğrafın farklı varyanta kopyalanması yasak.

Öncelikli açıklar: McCormick 52, Sonalika 32, TYM 28, Mahindra 25, Swaraj 21, Steyr 18, Valtra 18, Zetor 17, Antonio Carraro 14, Belarus 12, TAFE 11. Bu tablo canlı DB ve `site/src/lib/historical-licensed-photos.ts` + `tractor-photos.ts` üzerinde salt okunur eşleştirmeden çıktı; gerçek görüntü MIME denetimi bunun ardından yapılır.

## Kaynak ekosistemi; indeks sonucu tek başına lisans kanıtı değildir

- **Wikimedia Commons**: Kaynak dosyanın bireysel File sayfası, uploader'ın `Own work` beyanı, fotoğrafçı, tarih, CC0/CC BY/CC BY-SA lisansı, modelin tam başlığı ve ilgili kategori incelendi. Tek tek yüzlerce API sorgusu 429 ürettiği için marka bazlı, sınırlı arama protokolü korunur.
- **Openverse**: Commons + Flickr + Europeana ve diğer bağımsız koleksiyonları tek açık lisans indeksinde aramaya yarar, ancak Openverse sonuçları ile asıl sağlayıcının hak beyanı farklı olabilir; yeniden yayın için kaynak sayfaya dönülmeli. Anonim API kota sınırını aşan toplu otomatik kullanım açılmadı.
- **Flickr Creative Commons**: Yalnız gerçekten hak sahibi tarafından CC BY, CC BY-SA, CC0 veya ticari yeniden kullanımı açıkça izinli lisanslar değerlendirilebilir. CC BY-NC, ND, All rights reserved, filigranlı satış ilanı veya API erişimi fotoğrafı yayınlama hakkı vermez. Flickr API için ticari erişim koşulları ayrıca kontrol gerektirir.
- **Europeana / kamu koleksiyonları**: Metadata CC0 olması fotoğrafın kendisinin CC0 olduğu anlamına gelmez; veri sağlayıcının nesne hak bildirimine bakılır. Ücretsiz API anahtarı gerektiren doğrudan çekim yapılmadı.
- **Bağımsız üretici/bayi siteleri, ilan siteleri, basın fotoğrafları, Pexels/Unsplash/Pixabay, Google görsel arama**: Kaynak keşfi için kullanılabilir; net açık lisans ve model kimliği olmadan yeniden yayımlama yapılmaz. Özellikle üreticinin pazarlama görseli varsayılan olarak telifli kabul edilir.

Bu bir **bütün internetin eksiksiz tarandığı** iddiası değil; ulaşılabilen büyük açık fotoğraf indeksleri ve lisans sayfaları üzerinde kaynağı kanıtlanabilir pilot taramadır.

## Yayımlama için seçilen üç gerçek Commons dosyası

| İlişkilendirilen yayımlanmış model | Dosya ve kesin fotoğrafçı | Hak ve kaynak kanıtı | Teknik sınır |
|---|---|---|---|
| Steyr **6240 ABSOLUT CVT** (`9c78e100-738d-4611-b67e-ed27b9cab404`) | [Steyr Absolut 6240.jpg](https://commons.wikimedia.org/wiki/File:Steyr_Absolut_6240.jpg) — **Blonder1984**, 18.09.2022, 4608×3456 | `Own work`, `{{pd-self}}` hak sahibi beyanı ve aynı File sayfasında ayrıca açık **CC BY 4.0** seçeneği. Lisans kullanımı CC BY 4.0, fotoğrafçı ve kaynak bağlantısıyla | Genel 6240 Absolut model görüntüsü; fotoğraftan emisyon/yıl/ekipman standardı türetilmez |
| Zetor **PROXIMA** (aynı model adıyla üç yayımlanmış varyant kaydı) | [ZETOR PROXIMA.jpg](https://commons.wikimedia.org/wiki/File:ZETOR_PROXIMA.jpg) — **JJ7777**, 13.05.2021, 2048×1154 | File sayfası `Own work`, **CC BY-SA 4.0** | Genel Proxima aile görseli; exact configuration=false |
| Zetor **PROXIMA** | [Zetor Proxima, WAW.jpg](https://commons.wikimedia.org/wiki/File:Zetor_Proxima%2C_WAW.jpg) — **Raf24~commonswiki**, 14.10.2019, 4096×3072 | File sayfası `Own work`, **CC BY-SA 4.0** | Aynı modelin ayrı fotoğrafçıya ait ikinci genel görseli; exact configuration=false |

**Önemli açıklama — önceki Steyr reddi çözüldü:** `site/docs/steyr-photo-source-audit-20261121.json` `Steyr Absolut 6240.jpg` dosyasını önceki otomatik kontrolün birincil `Public domain` etiketini tanımaması nedeniyle reddetmişti. Güncel doğrudan Commons File sayfasında `Source=Own work`, fotoğrafçı **Blonder1984**, kendi hak sahipliğiyle açık **CC BY 4.0** alternatifi de bulunuyor. Bu yeni kaynak kanıtı 21 Kasım eski raporunu geriye dönük değiştirmez; farklı gerekçeyle izinli yeniden değerlendirmedir.

**Özellikle reddedilen örnekler:**

- Commons `File:Mahindra Arjun 605 DI tractor with trailer.JPG`: açık lisanslı kendi fotoğrafı olsa bile mevcut 605 DI i, 605 DI MS veya MS V1 varyantlarından hangisini gösterdiği kanıtlanmadı. Başka varyantın model sayfasına bağlanmadı.
- Commons `File:Swaraj-855-FE1669626848.png`: Commons'ta CC etiketiyle bulunsa da dosya açıklamasında ticari KhetiGaadi kökeni ve uploader'ın hak sahipliği belirsiz. **Hak zinciri teyitsiz; yayımlanmadı.**
- Satıcı/üretici stok fotoğrafları, arama motoru küçük görselleri: `All rights reserved` veya izni açık değilse **yayımlanmadı**.
- Tam marka-model eşleşmesi olmayan Belarus 1025 / 1025.2, Steyr eski 6240 CVT / 6240 Absolut, Zetor Proxima HS 120 / genel PROXIMA görselleri birbirinin yerine aktarılmadı.

## Değişiklik, SEO ve doğrulama

Yeni fotoğraf yalnız mevcut `HISTORICAL_LICENSED_PHOTOS` katalog nesnelerine eklendi; özel DB adaylarının `rights_verified_at` veya `image_asset_url` alanları değiştirilmedi. Yayın görünürlüğü yalnız yayımlanmış Supabase modeli ve model adı eşleşmesine bağlı. Mevcut 10 dil alt metni, lisans/creator/acquireLicensePage `ImageObject`, tam ekran, görsel sitemap ve birinci taraf worker URL'si korunur. Yeni Commons küçük resim kaynakları yalnız desteklenen 500 ve 960 piksel genişliklerdedir; keyfî 720/800px kaynak URL üretilmez.

PR test kapıları: yeni exact model/lisans/kimlik testleri; 6 gerçek origin JPEG (3 kaynak × 500/960) boyut ve MIME denetimi; uygulama build, Golden Rule, CodeQL, gerekirse tarayıcı/axe. Bu kontroller geçmeden birleştirme; canlı üretim build ve JPEG 200/XML sitemap/10 dil image SEO ayrı doğrulanır. Hiçbir kaynak başarılı görünmezse durumu başarıya çevirme.

**Geri alma:** Yalnız bu üç `fileId` nesnesini ve ilgili yeni denetim betiği/iş akışını revert et. Eski kütüphaneye, teknik spec/Supabase verisine, forum ve RLS'ye dokunma. İleride DMCA/hak sahibi itirazı olursa aynı tekil kaydı hızla yayından çıkar; Commons kendi lisans bilgisi hukuken sıfır risk garantisi değildir.


## 22 Kasım ikinci kontrol — gerçek GitHub Actions sonuçları ve güvenli yeniden deneme

- **Başarılı araştırma:** [Actions #45053407036](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45053407036) taraması tamamlandı. Rapor: 388 tekil yayımlanmış traktör kimliği, 462 sitemap satırı, 361 marka+model çifti; Wikimedia marka bazlı aday araştırmasında hata 0. Başlık düzeyinde aday eşleşmeleri fotoğraf yayın onayı değildir.
- **Bağımsız kaynaklar:** Openverse ile Flickr/Europeana için 12 salt-okunur sorgu yapıldı; 290 fotoğrafsız benzersiz marka+model çiftinden bu örneklemde 0 uygun ön aday döndü. Bütün Flickr/Europeana arşivleri tarandı sonucu çıkarılamaz. Yeni sorgular yalnız günlük rotasyon ve gerçek kaynak kontrolüyle yapılır.
- **Engellenen PR #445:** Kaynak QA işi HTTP 429 aldı; üç kimlik için 480/960/1920 birinci taraf JPEG'leri ana dal veya PR üzerinde bulunmadığından site testi de başarısızdır. Bu durum hiçbir fotoğrafın otomatik onaylanması için gerekçe olamaz.
- **Düzeltilen CodeQL sorunu:** Commons alan adı regexindeki kaçırılmamış nokta karakterleri düzeltildi. Bu düzeltme kaynak indirme engelini aşmaz; CodeQL'in yeni commit sonucuyla ayrıca teyit edilir.
- **Yeni güvenli edinim protokolü:** PR CI, dokuz JPEG dosyasından biri bile yoksa hiçbir Wikimedia isteği yapmadan **başarısız** olur. Böylece her PR commitinde tekrarlanan 429 isteği üretilmez. [ayrı, dağıtım yapmayan #450 hazırlama PR'ındaki](https://github.com/onuronkol2-collab/tractorcompare-data/pull/450) `.github/workflows/tractorvs-reviewed-commons-media-staging.yml` iş akışı **ana dalda yayımlandıktan sonra** manuel `workflow_dispatch` çalıştırıldığında yalnız ilgili üç Commons File sayfasının resmî 1920px türevini birer kez çeker; Pillow ile 480/960/1920 boyutlarında dokuz yerel JPEG ve doğrulanan SHA-256 listesi üretir. Artifakt adı `tractorvs-steyr-zetor-licensed-jpegs-review-only` olup **yayımlama izni vermez**. 429/503, bozuk MIME/JPEG, boyut, eksik SHA veya yanlış model hatasında tamamlandı yazılmaz.
- **Sonraki kapı:** Ana daldaki bağımsız manuel görev gerçekten başarılı olur, artefaktın dosya/hash ve fotoğraf kimliği bağımsız denetlenir, doğru dosyalar PR dalına açıkça kaydedilir, PR test/CodeQL/site build sorunsuz geçerse ancak o zaman PR taslaktan çıkarılarak güvenli birleştirme düşünülebilir. Birleştirmeden sonra canlı JPEG HTTP/MIME ve 10 dilde sayfa-sitemap doğrulaması zorunludur. İlgili çalışan fotoğraf ve site özellikleri değiştirilmez.
