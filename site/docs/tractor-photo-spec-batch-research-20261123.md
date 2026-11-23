# TractorVS — toplu traktör teknik veri ve fotoğraf araştırması (23 Kasım 2026)

> **Durum:** Birinci kanıt tabanlı araştırma partisi. Bu belge eksiksiz fotoğraf kapsaması veya canlı yayın onayı değildir. Supabase inceleme kayıtları güncellendi; yeni dosyalar resim sunucusuna yüklenmedi. Önce ana dal AGENTS.md, mevcut PR'lar ve fotoğraf QA kapıları incelendi.

## Envanter ve araştırma önceliği

23 Kasım canlı Supabase sorgusunda: **43 marka**, **767 traktör (390 published, 355 draft, 22 archived)**, **12.224 teknik özellik** ve **479 veri kaynağı** görüldü. Fotoğraf aday tablosunda işlemden önce **765 research_needed** satırı bulunuyordu. `tractor_research_queue`: 401 queued, 5 retry, 28 needs_source, 4 failed ve 20 completed. Bu sayılar fotoğrafın sitede gösterildiği anlamına gelmez.

Yayımlanmış modellerde resim eşleşmelerinin yüksek öncelik taşıdığı marka grupları (repo marka/model kayıtları ile yapılan **yaklaşık** aile bazlı kontrol): McCormick, Sonalika, Mahindra, Swaraj, Valtra, Steyr, TYM, Antonio Carraro, Zetor. Bu **tam model-varyant kapsama raporu değildir**; UUID-scope ve indirilmiş doğrulanmış JPEG sayılmadan nihai yüzde verilemez.

## Toplu fotoğraf aday kayıtları — Supabase, yayımlanmadı

| Marka/model (veritabanı UUID eşleşmesi) | Bağımsız fotoğraf dayanağı | Çözülmemiş kapı |
|---|---|---|
| Zetor FORTERRA 140 **HD** (`0a900d97-3df4-444b-a25d-2c9885683b99`) | [Wikimedia File:Zetor Forterra 140 HD.jpg](https://commons.wikimedia.org/wiki/File:Zetor_Forterra_140_HD.jpg), Maindistorsion, own-work CC BY-SA 4.0, 1296×1122 | Orijinal JPEG HTTP/sha doğrulaması ve zaman/varyant tutarlılığı; durum `license_review` |
| Steyr 6200 IMPULS (`15383bd8-8678-489f-b752-67070dc9756d`) | [Wikimedia: 6200 Impuls CVT DSC08459](https://commons.wikimedia.org/wiki/File:Steyr_6200_Impuls_CVT_Agritechnica_2025_(DSC08459).jpg), MarcelX42, own-work CC BY-SA 4.0, 6017×4513 | Veritabanı şanzıman varyantı CVT olarak kesinleşmemiş; kaynak JPEG HTTP/sha doğrulaması; durum `identity_review` |
| Sonalika DI 30 Baagban (`ad248a3c-d9af-45f9-9aff-93c54d2f45e8`) | [Wikimedia: DI-30Rx 09555](https://commons.wikimedia.org/wiki/File:Sonalika_Baagban_DI-30Rx_Tractor_Left_Front_Coorg_Feb24_A7C_09555.jpg), Timothy A. Gonsalves, own-work CC BY-SA 4.0, 3820×3820 | **DI-30Rx, genel DI 30 Baagban'ın kesin varyantı olarak gösterilemez.** Yazarın ticari kullanım öncesi iletişim notu ayrıca değerlendirilecek; durum `identity_review` |
| Valtra Q225 (`96623863-6825-429e-88b0-805923de69b8`) | [Wikimedia File:Valtra Q225.jpg](https://commons.wikimedia.org/wiki/File:Valtra_Q225.jpg); [Valtra Q Series kategori listesi](https://commons.wikimedia.org/wiki/Category:Valtra_Q_Series), 4650×3100 | İlgili tekil dosya sayfasının yetki/atfı ve görüntü doğrulaması henüz yapılmadı; durum `license_review` |

**Yayınlama kuralı:** Kaynak görüntü URL'sinin yalnız metadata'da bulunması yayına uygunluk anlamına gelmez. Wikimedia Commons kaynak sayfası + model/yıl/pazar/varyant + lisans + atıf + orijinal JPEG HTTP/MIME/byte/SHA + 480/960/1920 türev ve Worker/Cloudflare testi birlikte doğrulanmalıdır. `rights_verified_at`, `identity_verified_at` ve `image_asset_url` bilinçli şekilde doldurulmadı; `approved` durumu verilmedi.

## Bağımsız standardize performans kanıtı — incelemeye eklendi

[DLG TestService'in bağımsız traktör test açıklamasına](https://www.dlg.org/detail/dlg-testservice-traktoren-unabhaengig-und-sicher-pruefen) göre:
- **Steyr 6200 Impuls CVT:** DLG PowerMix tarla çalışması özgül yakıt tüketimi **257 g/kWh**.
- **Steyr 6200 Impuls S-Control 8:** ayrı şanzıman konfigürasyonunda **243 g/kWh**.

İki değer aynı traktörün birbirine rakip verileri değildir: test edilen **iki farklı şanzıman varyantını** anlatır. `tractorvs_spec_review_candidates` tablosuna **iki ayrı `needs_review` kaydı** eklendi; `tractor_specs` tablosuna eklenmedi. Mevcut `6200 IMPULS` kaydı motor/şanzıman alanlarında kesin varyant göstermediği için otomatik yayın bloke. DLG'nin [test metodolojisi](https://www.dlg.org/en/tests/agricultural-technology-and-farm-inputs/dlg-powermix) ve ilgili PDF tabloları orijinal ölçüm koşulunu açıklıyor; PDF'nin bu oturumda görsel sayfa doğrulaması başarısız olduğundan kesin koşul yalnız resmî DLG HTML'nin doğruladığı düzeyde raporlandı.

### İkinci bağımsız test: Zetor FORTERRA 140 HSX

[Irish Farmers Journal'ın 16 Temmuz 2014 tarihli Forterra 140 HSX test özeti](https://www.farmersjournal.ie/zetor-twin-test-part-1-the-forterra-161081) Nicholas Gainford Ltd dinamometresinde nominal PTO devrinde **113 hp** kaydedildiğini bildiriyor. Bu **ayrı bir `needs_review`** kaydı olarak HSX UUID'sine (`aabda943-446b-4543-a019-c73b743652eb`) eklendi. Makale ücretli/erişimi kısıtlı olduğundan oturumda tamamı doğrulanamadı; 2014 test traktörünü daha yeni UK pazar konfigürasyonuyla kesin eşleştirmedik. **İnternetteki [profi Forterra HD testinde](https://www.profi.co.uk/test-centre/zetor-forterra-hd/) belirtilen 93,6 kW PTO ölçümü `Forterra 150 HD` modeline aittir; `Forterra 140 HD` verisine taşınmamalıdır.** Bu, toplu model-varyant karışmasını önleme örneğidir.

## Gerçek kod değişikliği — yalnız PR dalı

`site/src/lib/historical-licensed-photos.ts` içinde uzun süredir bulunan `Zetor_Forterra_140_HSX.jpg` (Bene Riobó, CC BY-SA 4.0) model düzeyinde tanımlanmıştı; aynı marka/model adıyla kaydedilmiş **CL** ve **HD** varyantlarına da yanlışlıkla yayılabilirdi. Bu fotoğraf sadece doğrulanmış `FORTERRA 140 HSX` UUID'sine (`aabda943-446b-4543-a019-c73b743652eb`) bağlandı. `site/tests/tractor-photos.test.mjs` içine CL/HD/HSX ayrım regresyon testi eklendi. Yeni medya/binary eklenmedi; fotoğraf sayısı sabit.

## İkinci araştırma partisi — üretici ve bağımsız test kaynakları

23 Kasım ikinci görev geçişinde resmî Sonalika WT 110 HTML'si, Agrale'nin resmî 4233 ürün sayfası, KIOTI CX2510 üretici teknik sayfası, Hindistan devlet test raporu ve birden fazla Wikimedia Commons File sayfası ile kaynaklar çapraz denetlendi.

### Teknik kanıt: 25 yeni inceleme satırı, 0 yayımlanan satır

| Model / güven seviyesi | İncelemeye giren veri | Yayın engeli |
|---|---|---|
| Sonalika **110 WT**, International (`d76351cf-7497-47ce-aed1-372bae4e07ce`) | Üretici teknik tablosundan **19 eksik alan** (4WD, çift debriyaj, fren, hidrolik direksiyon, ön/arka lastik, uzunluk-genişlik-ROPS yüksekliği, yerden yükseklik, iz genişliği, yağ/batarya/alternatör kapasiteleri, hız, PTO devreye alma, askı sınıfı). | `needs_review`; on dil teknik terimler ve birim formatı/opsiyonel donanım kontrolünden sonra yayın. Kaynak: [Sonalika 110 WT resmî](https://international.sonalika.com/product/sonalika-110-wt/). OEM sayfasında `Displacement (ltr) = 4127` yazdığı halde birimin ne olduğu **şüpheli**; bu değer **eklenmedi**. |
| Agrale **4233**, Brazil (`e3ed3f24-a207-44cf-8b96-b33e5e92723e`) | Mevcut **30 cv**/69 Nm/2250 rpm karşısında resmî ürün HTML'si **25 cv**/65 Nm/**2550** rpm veriyor: **3 çelişki adayı**. | `needs_review`; üretim yılı, motor revizyonu ve rating standardı çözülmeden katalog verisi değiştirilmedi. [Agrale resmî ürün sayfası](https://www.agrale.com.br/pt/detalhes/tratores/tratores-agricolas/trator-4233) / [resmî PDF](https://pdf.agrale.com.br/2019/ficha-tecnica/pt/trator-4233-1/184/). PDF metninde ayrıca 24,5 cv / 6,9 daNm a 2550 rpm bildiriliyor; bu oturumda PDF **görüntü ekranı alınamadı**, kesin uzlaşma ilan edilmedi. |
| Swaraj **855 FE 4WD** yayın kaydı (`44e7f340-ebd3-4e72-843a-303312a96c07`) | Hindistan [CFM&TI 2025 855 FE 4x4 **N3** raporu](https://fmttibudni.gov.in/files/12_SWARAJ_855_FE_4x4_N3.pdf) PDF metin tablosunda **33,0 kW** 2 saatlik maksimum PTO, **200,6 Nm** eşdeğer krank torku ve **257 g/kWh** maksimum PTO'da özgül tüketim bildiriyor: **3 bağımsız test adayı**. | `needs_review`: N3 konfigürasyonu genel 855 FE 4WD ile eşleşmiş değil; web üzerinden PDF sayfa görüntüsü iki denemede zaman aşımına girdi. Bunlar OEM nominal değer değil bağımsız test; hiçbir değer canlı spec tablosuna eklenmedi. |

**Süreklilik:** KIOTI CX2510 ve CX2510H üretici tabloları katalogdaki 34+ alanla karşılaştırıldı; var olan teknik alanlar gereksiz tekrar yazılmadı. Mahindra 605 DI MS ürün sayfasındaki güç/konfigürasyon ifadeleri kendi içinde birden çok ölçüm tanımı içerdiğinden yeni **güç** değeri varsayılmadı.

### Ek fotoğraf kanıtı

| Model | Kaynak sonucu | Kayıt |
|---|---|---|
| Valtra **Q225** | [Commons dosya sayfası](https://commons.wikimedia.org/wiki/File:Valtra_Q225.jpg): Bene Riobó, kendi çekimi, CC BY-SA 4.0, 4650×3100 JPEG; özgün dosya `6/6e/Valtra_Q225.jpg` | Önceki `license_review` → `identity_review`; lisans ve özgün dosya yolu kaydedildi. 2024 İsveç fotoğrafı ile Europe/UK katalog konfigürasyonu incelemede. |
| Steyr **6200 Impuls CVT** | [Commons fotoğraf](https://commons.wikimedia.org/wiki/File:Steyr_6200_Impuls_CVT_Agritechnica_2025_(DSC08459).jpg): MarcelX42, kendi çekimi, CC BY-SA 4.0, 6017×4513 JPEG | Kaynak bağlantısı/atfı tamamlandı; kayıt şanzıman varyantı kesin olmadığından `identity_review` kaldı. |
| Massey Ferguson **4708 Standard Platform** (South Africa) | [Commons 4708 Fransa fotoğrafı](https://commons.wikimedia.org/wiki/File:Lanouaille_Massey_Ferguson_4708.jpg): Père Igor, kendi çekimi, CC BY-SA 4.0, 2996×2247 JPEG | **Yeni** aday `identity_review`: Fransız 4708 ile Güney Afrika 4708 Standard Platform ekipmanı doğrulanmadan yayın yok. |
| Swaraj **855 FE** | [Commons 855 FE PNG](https://commons.wikimedia.org/wiki/File:Swaraj-855-FE1669626848.png) 500×350, harici KhetiGaadi kaynaklı | Sadece özel `reviewed_notes` alanına dışlama nedeni kaydedildi; üçüncü taraf görsel hakları ve piksel kalitesi belirsiz, `research_needed` kaldı, **yayın yok**. |

Bu partide bütün kamuya açık fotoğraf yolları için ikili JPEG indirme, SHA-256, 480/960/1920 türev ve canlı Worker doğrulaması eksik. **Onay/otomatik yayın bilinçli şekilde yapılmadı.** Doğrulanan Creative Commons sayfa metni JPEG byte doğrulamasının yerine geçmez.

### Gerçek JPEG ikili indirme denemesi ve sınır (23 Kasım, ikinci parti)

[GitHub Actions #45245136017](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45245136017) ayrı PR dalında, Valtra Q225 ve Zetor FORTERRA 140 HD için CC BY-SA 4.0 kaynak sayfalarından fotoğraf çekip MIME/JPEG, gerçek piksel genişliği ve SHA-256 doğrulamasıyla **yalnız dal üzerine** altı JPG kaydetmek için güvenlik kontrollü tek seferlik denemeydi. Wikimedia, **ilk ikili fotoğraf isteğini HTTP 429** ile reddetti. Dolayısıyla **0 JPEG indirildi; 0 hash ve 0 yeni yayına alınmış görsel** var. Hata gizlenmedi, aynı kaynağa tekrar istek atılmadı. Tek seferlik yazma iznine sahip geçici workflow dosyası depodan kaldırıldı. Ana daldaki fotoğraf ve workflow sistemi değişmedi. Bu dosya indirilemeden fotoğrafın sitede çalıştığı veya eksiksiz araştırmanın bittiği iddia edilemez.

### Üçüncü parti — EIMA 2026 kaynaklı yeni modeller (taslak)

Üreticinin [McCormick EIMA 2026 haberindeki X serisi duyurusu](https://mccormick-tractors.com/gb/en/news/McCormick-at-EIMA-2026--the--X--generation-raises-the-bar-for-power-and-technology.html) eski katalogla karşılaştırıldı. `X6.415` ve `X7.624 VT-Drive` gibi önceden mevcut kayıtlar ikinci kez eklenmedi. **Mevcut envanterde bulunmayan üç model** yalnız `status=draft` olarak oluşturuldu. EIMA sergi duyurusundan kesin **model yılı** çıkarılmadı (`model_year=NULL`).

| Yeni taslak | UUID | Kaynaklı teknik özellik | Kritik kimlik notu |
|---|---|---:|---|
| McCormick X6.416 P6-Drive | `eceef744-c59f-4824-ac8c-592397889d6c` | **17** | 144 hp normal maksimum, 155 hp EPM; 600/630 Nm normal/EPM tork ayrı, 24F/24R standart / 40F/40R creeper |
| McCormick X7.627 VT-Drive | `703c2999-1128-41a1-9e4f-212c293ddbc5` | **11** | 271 hp, FPT N67 6,7 L, 212 L/min CCLS, 60 km/h yalnız izinli pazarda |
| McCormick X8.634 VT-Drive | `04b31c97-5073-4757-ab02-34568b940ea6` | **10** | 340 hp, Stage V FPT N67, 212 L/min, 60 km/h yalnız izinli pazarda |

**38 teknik özellik** `tractor_specs` tablosuna *yalnız bu üç taslak traktör* için, `data_sources.id=9155d120-e4b5-4b3b-a26a-8e030c32b13e` kaynak bağlantısıyla ve model/konfigürasyon/ağırlık yaklaşık/opsiyon sınırlamaları `evidence_text` ve `measurement_standard` alanlarında korunarak yazıldı. Halihazırda yayımlanmış hiçbir traktörün teknik özelliği değiştirilmedi. Yeni markalar uydurulmadı: mevcut McCormick markası kullanıldı. Taslaklar 10 dil, SEO, resim, QA ve güvenli yayın eşiğini geçmeden üretim kataloğuna veya sitemap'e alınamaz.

**Aynı seri için tespit edilen dört ayrı kaynağa bağlı uyuşmazlık:** Halihazırda yayımlanmış `McCormick X6.415 P6-Drive` kaydında üreticinin **2025 katalog PDF** kaynağından 106 kW normal maksimum, 114 kW EPM ve 600 Nm motor torku kayıtlı. 2026 EIMA yazısı ise X6.415 için **135 hp normal maksimum, 146 hp EPM, 551 Nm normal ve 610 Nm EPM** bildiriyor. Bu farklılığın yıl/revizyon, pazar veya güç standardından kaynaklanıp kaynaklanmadığı teyit edilmedi. Güncel katalog değeri değiştirilmeden `tractorvs_spec_review_candidates` tablosuna **4 farklı `needs_review` kayıt** eklendi; EPM/normal ayrı anahtarlar kullanıldı. 2025 broşürünün değerlerini otomatik yanlış ilan etme ve 2026 ölçülerini gözü kapalı birleştirme yok. Kaynaklar: [EIMA 2026](https://mccormick-tractors.com/gb/en/news/McCormick-at-EIMA-2026--the--X--generation-raises-the-bar-for-power-and-technology.html), [McCormick 2025 üretici kataloğu](https://www.mccormick.it/wp-content/uploads/2025/02/MC_TractorRange2025_Brochure_88p_6737433A2_Web_EN.pdf). Bu oturumda PDF sayfa görüntüsüyle yeniden karşılaştırma yapılmadığı için nihai veri uzlaştırması bekliyor.

**İndirme/risk:** Üreticinin haber sayfasında fotoğraf olması TractorVS için yeniden kullanım lisansı vermez. Bu üç taslak için herhangi bir telifli resim kaydedilmedi veya yayımlanmadı. Açık lisanslı ve birebir model kimliği doğrulanmış görseller ayrıca araştırılmalıdır.

## Sonraki toplu kontrol kapıları

1. Güncel yayımlanmış sitemap ile Supabase yayımlanmış UUID envanteri tek tek karşılaştırılmalı (RLS ve taslaklar korunarak).
2. Lisansı belirsiz adaylar bağımsız Flickr/Europeana/Openverse ve üretici/OECD/DLG kaynaklarından, kota aşmadan tamamlanmalı.
3. Üretici broşürü, bağımsız teknik test, pazar ve ölçüm standardı uyuşmayan teknik değerler `needs_review` olarak kalmalı.
4. GitHub fotoğraf testleri, QA, üretim derlemesi, 10 dil/meta/alt ve çalışan diğer özelliklerin regresyonları geçmeden PR birleştirilmemeli; gerçek site dağıtımı ayrı ölçülmeli.
5. Mevcut `.github/workflows/batch-photo-research.yml` ve ilgili saatlik spec araştırmaları tekrar kurulmayacak, yetkisiz otomatik onay veya API sınırını aşma eklenmeyecek.

**Araç sınırlamaları:** Firecrawl kredi kotası dolu olduğu için yeni sayfa taraması bu araçta çalışmadı. Wikimedia orijinal JPEG indirme/doğrulama oturumda tamamlanamadı. Bu kısıtlar güvenlik/lisans kapısını geçersiz kılmaz.

## Dördüncü araştırma dalgası — 23 Kasım 2026, ikinci devam oturumu

### Tam fotoğraf eşleşmesi: gerçek katalog boşlukları

Bu kontrol, önceki tahmini tek marka-model aile oranından farklıdır: **canlı Supabase'in 390 yayımlanmış traktör UUID kaydı**, repo `site/src/lib/historical-licensed-photos.ts` ve `site/src/lib/tractor-photos.ts` dosyalarındaki **103 onaylı/kurallı fotoğraf kaydı** ve `photoMatchesTractor`'ın marka/model + `tractorId` + açık `illustrativeOn` korumasıyla eşleştirildi.

- **390 yayımlanmış traktör kaydının 86'sında** en az 1 eşleşen lisanslı fotoğraf kaydı var; **304'ünde henüz yok**. Bu **canlı HTTP/Google indeksleme sonucu değildir**; onaylı kaynak kodu ve yayımlanmış envanter arasındaki model kimliği kapsama ölçümüdür.
- **103 onaylı fotoğrafın 12'si** yalnız taslak model envanterinde eşleşiyor. Bunları yayımlanmış görsel diye saymak yanlıştır. Örn. Fendt 516 Vario, CLAAS Arion 660, CLAAS Axion 870, Kubota M5-112/M6-141, John Deere 5075E/6R 150, Deutz-Fahr 6165 ve Case IH Puma 150. Bu model taslaklarını sadece fotoğraf bulundu diye otomatik yayımlamak yasaktır; kaynak/veri/variant/SEO/10 dil kapıları tamamlanmalı.
- Yayımlanmış/fotoğrafsız en yüksek öncelik marka-kayıt sayıları: McCormick **49**, Sonalika **32**, Mahindra **25**, TYM **22**, Swaraj **21**, Valtra **18**, Steyr **17**, Zetor **16**, Antonio Carraro **14**, Belarus **12**, TAFE **11**, Agrale **9**, Kioti **8**, Deutz-Fahr **7**. Marka/model sayısı zamanla değişebilir; bunlar 23 Kasım anlık kontrolüdür.
- **Zaten onaylı kayıtları tekrar satın alma/çekme yok:** Valtra Q225, `valtra-q225-a6c1308e`; Steyr 6200 IMPULS, `steyr-6200-impuls-2025`. Yeni bulunan Commons dosyaları aynı model için alternatif açıdır, mevcut onaylı fotoğrafın varlığını silmez. Özellikle Steyr için ikinci kaynağın **CVT** şanzıman varyantı onaylanmadan genel `6200 IMPULS` fotoğrafı diye otomatik kullanılmaz.
- Zetor Forterra 140 HSX'nin CL/HD'ye taşmasını engelleyen kod düzeltmesi **[PR #540](https://github.com/onuronkol2-collab/tractorcompare-data/pull/540)** ile GitHub ana dalına alındı; 8/8 CI onayından sonra. Canlı deploy sürümü ayrıca ölçülmeli.

**Kanıtların kapsamı:** `tractorvs_image_candidates` satır sayısı yayımlanmış modellerin fotoğrafsızlık sayısı değildir; orada draft/arşiv kaynaklı adaylar da bulunur. Onaylı bir fotoğrafın yalnız kodda bulunması yetmez: JPEG bytes/MIME, SHA, URL HTTP 200, sayfa `img` ve Google Images durumları ayrı ölçülür. Bu rapor tüm gelecekteki görsellerin telifini garanti etmez.

### 92 yeni teknik aday — beş mevcut Sonalika modelinde toplu eksik tamamlama

Supabase `tractorvs_spec_review_candidates` tablosuna **idempotent WHERE NOT EXISTS korumasıyla** aşağıdaki kaynakların birebir üretici teknik tablosundan 92 yeni aday `needs_review` olarak eklendi. Teknik değerler kamuya açık `tractor_specs` tablosuna aktarılmadı, yayımlanmış modellerin `status` alanları değiştirilmedi:

| Mevcut model | Ek aday | Birincil üretici belge/URL | Varyant kontrolü |
|---|---:|---|---|
| Sonalika 125 | 17 | [International Sonalika 125](https://international.sonalika.com/product/sonalika-125/) | 4WD ve farklı debriyaj/hidrolik/lastik opsiyonları model yılına göre değişebilir |
| Sonalika 45 | 19 | [International Sonalika 45](https://international.sonalika.com/product/sonalika-45/) | Kaynak açık 2WD, katalog kayıt varyantı belirtilmemiş; hızlar 2000 rpm'de verilmiştir |
| Sonalika 55 | 21 | [International Sonalika 55](https://international.sonalika.com/product/sonalika-55/) | Üretici aynı sayfada **2WD ve 4WD** ağırlık/ön lastik/aks aralığı yayımlıyor; ayrı `weight_2wd/4wd`, `wheelbase_2wd/4wd`, `front_tyre_size_2wd/4wd` anahtarları kullanıldı |
| Sonalika 75 N | 18 | [International Sonalika 75 N](https://international.sonalika.com/product/sonalika-75-n/) | 4WD, bağ/bahçe dar traktör; 2200 rpm hız koşulu ve opsiyonel tekerlek boyları korunmalı |
| Sonalika 90 N | 17 | [International Sonalika 90 N](https://international.sonalika.com/product/sonalika-90-n/) | 4WD, 2000 rpm hız koşulu; orijinal sayfada yerden yükseklik birimi etiketsiz olduğundan **ground_clearance adayı eklenmedi** |

**Ölçüm dürüstlüğü:** Katalogda yer alan eski teknik değerler (motor gücü, PTO, kaldırma) körlemesine tekrar yazılmadı. Yeni `spec_name`, `canonical_key`, `unit`, üretici URL, kaynak tablo ifadesi ve veri doğrulama notları birlikte saklandı. Tüm 92 özellik yayımlanmadan önce sözlük/yerelleştirme, birim tutarlılığı, model-pazar-varyant uyumu, opsiyonel/donanım farkları ve otomatik karşılaştırma testleri geçirilmeli.

### Altı yeni üretici duyurusu model taslağı, 44 kaynaklı özellik

**Yeni Holland 10 Kasım 2026 [T2S resmî basın duyurusu](https://agriculture.newholland.com/en-gb/europe/new-holland-world/news/2026/new-t2s-compact-tractor-lineup):** `T2.35S`, `T2.40S`, `T2.45S`, `T2.50S`, `T2.55S`. Beşi de `draft` olarak oluşturuldu ve her biri için **6** seri geneli üretici özelliği eklendi (1,9 L, üç silindir, 12×12 senkronize shuttle **veya** üç kademeli HST, Category II ile 950 kg / Category III ile 1315 kg kaldırma seçenekleri, FieldOps için **opsiyonel CM1X modem** ile bağlantı hazır oluş). **35–57 hp seri aralığı tekil modellere tahmin dağıtılmadı.** Sipariş için üretici açıklaması **2027 başı**; traktör `model_year` alanı varsayımla doldurulmadı.

**Valtra [6. nesil T Serisi üretici duyurusu](https://www.valtra.com/int/en/stories/news/6th-generation-valtra-t-series-delivers-strong-performance-and-user-experience.html):** `T236` taslağına **14** kaynaklı bilgi eklendi (AGCO Power CORE75, 7,5 L, altı silindir, **245 hp maksimum**, **1.184 Nm maksimum**, CVT/powershift seçeneği, 2.950 mm dingil mesafesi ve 575 mm'ye kadar yerden yükseklik gibi seri koşullu değerler). Üreticinin **%5 düşük best-point SFC** ifadesi **laboratuvar ve yalnız belli nokta** beyanıdır; **bağımsız tarla tüketimi olarak kaydedilmedi**. `57 km/h` yerel trafik kurallarına bağlıdır; tüm varyantlara kesin azami hız değildir.

Yeni kaynaklar `data_sources` içinde orijinal üretici basın bültenlerine bağlandı. **Toplam 6 yeni taslak ve 44 teknik spec kaydı; sıfır yeni yayımlanmış model.** Üretici haber fotoğrafları açık yeniden kullanım lisansı teşkil etmediği için henüz onaylı traktör fotoğrafı olarak kullanılmadı.

### Kaynak çeşitliliği ve fotoğraf izinleri

Wikimedia Commons marka kategorileri (Sonalika, Mahindra, Kioti, Agrale ve SAME) ve üretici kaynakları gözden geçirildi. Commons'ta pek çok fotoğrafın modeli katalogda bulunan **başka** traktöre, eski sürüme veya bilinmeyen versiyona ait; kategori adına dayanarak otomatik resim eklenmedi. `Swaraj 855 FE` için bulunan 500×350 haricî kaynaklı PNG hakkındaki şüphe değişmedi. GitHub üzerinden orijinal Wikimedia JPEG erişiminde önceki **HTTP 429** gerçekleşmiş olduğundan yeni izin aşma/yoğun tekrar indirme uygulanmadı.

**Sonraki kalite kapısı:** Önce kaynak/ekipman eşleşmesi; sonra geçerli yeniden kullanım izni ve yazar; sonra orijinal medya MIME/piksel/hash ve first-party JPG türevler; sonra 10 dilde `ImageObject`/alt metin, sitemap, OpenGraph/Discover, responsive LCP ve Cloudflare canlı doğrulaması. Bu bağımsız doğrulamalar tamamlanmadan eksik fotoğraf uydurulmaz.
