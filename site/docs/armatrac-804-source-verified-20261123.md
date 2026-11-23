# 23 Kasım 2026 — ArmaTrac 804 Fruit Garden teknik veri tamamlama

## Mevcut kayıtlar ve kesin varyant sınırı

Bu çalışma iki **zaten yayımlanmış** ArmaTrac modelini hedefler; yeni traktör oluşturmaz. `804 Fruit Garden Cabin` (UUID `619e4fd9-1155-4927-b488-4f55c95ee739`) ile `804.4 Fruit Garden ROPS` (UUID `362ad12b-7e89-4adf-83df-841b96b0362e`) **ayrı ürünlerdir**. Gözlenen başlangıçta her birinde yalnız **5** kaynaklı teknik özellik bulunmaktadır.

- Üretici model sayfaları: https://armatrac.com/tractor/286/804-fruit-garden-cabin ve https://armatrac.com/tractor/288/8044-fruit-garden-rops
- Kabinli modelin özgün üretici broşürü: https://armatrac.com/shared/files/804cabinfruitgarden_1760621707.pdf
- 804.4 ROPS için **yalnız sağdaki 804.4 FG sütunu**: https://armatrac.com/shared/files/80248044fg_1514187919.pdf

## Kabul edilen ölçümler

| Varyant | Eklenecek kanıtlı başlık sayısı | Özellikler |
|---|---:|---|
| 804 Fruit Garden Cabin | 10 | 4 silindir, ZF T-537 şanzıman, 16 ileri/8 geri, bağımsız PTO, 2800 kg arka askı kapasitesi, 48.5 L/dk hidrolik pompa **2400 rpm'de**, 2250 mm dingil mesafesi, 1680 mm toplam genişlik, 285 mm yerden açıklık, **kabinli ek ağırlıksız** 3100 kg |
| 804.4 Fruit Garden ROPS | 12 | Perkins 1104D-44T, 4 silindir, 4.4 L, ZF T-537, 16 ileri/8 geri, bağımsız PTO, 2800 kg arka askı kapasitesi, 48.5 L/dk **2400 rpm'de**, 2250 mm dingil mesafesi, 1680 mm genişlik, 285 mm açıklık, **ROPS ek ağırlıksız** 2850 kg |

PTO nominal hız seçenekleri, müşteri pazarına bağlı 2WD/4WD, silindir çalışma hacmi (kabinli 804), güç standardı, tork, hidrolik basınç, fotoğraf lisansı ve model yılı **bu ekleme tarafından değiştirilmez**. Broşürün ölçüm koşulları ve karşılaştırma sınırları `measurement_standard` alanında korunur. Şanzıman, PTO ve kaldırma kapasitesi verileri bağımsız test sonucu değildir; üretici beyanıdır.

### Üretici kaynak çatışmaları — açıkça korunmalı

- Kabinli `804 Fruit Garden` PDF metni motoru **3.3 L** olarak verir; aynı broşür 4 silindir, **105 mm × 127 mm** bore/stroke verdiği için geometrik silindir hacmi **yaklaşık 4.4 L** olur. Bu fark teyit edilene kadar iki hacimden biri yayımlanmaz.
- Kabin broşürü **310 Nm** iddia eder; OEM'in tam model sayfası **307 Nm** gösterir. Eski mevcut 307 Nm değerine dokunulmaz, 310 eklenmez.
- Broşürün **180 MPa** hidrolik basınç yazımı güvenilir birim teyidi olmadan alınmaz. Motor gücünde eski katalog **58 kW @2200 rpm** derken canlı ürün sayfası **80 HP** gösterir, test standardı/yıl eşlenemediğinden beygir gücü sütunu boş kalır.
- ROPS broşürü hem **802.4 FG** hem **804.4 FG** kapsar. 802.4'ün farklı dingil mesafesi ve yerden açıklığı (2220/395 mm) 804.4 kaydına taşınmaz.
- Wikimedia Commons'taki **ArmaTrac 804 Lux CRD** fotoğrafı aynı **Fruit Garden** modeline ait değildir; telifli üretici broşürü görselleri ayrıca lisans verilmeden sitede kullanılamaz.

## Uygulama ve geri alma

İşlem betiği: `supabase/maintenance/20261123_armatrac_804_22_verified_specs.sql`. Yalnız `tractor_specs` yeni satırları ve iki resmi `data_sources` kayıtları eklenebilir. Ekleme **tek transaction, 22 yeni canonical key, kaynak kimliği ve SHA'ya bağlı olmayan ama tam URL'li üretici kanıtı** ile fail-closed olup `tractors`, `status`, `horsepower`, `RLS`, diğer modeller ve görsel kataloğu değişmez. İki aynı anahtar varsa betik yeni satır yazmadan exception verir. Geri alma yalnız bu UUID + kaynak URL + kanıt öneki + canonical key kombinasyonuyla yapılmalıdır; sitedeki diğer üretici kaynaklı verileri silme.

Bu belge ve testler git ana dala alınmış olsa bile **SQL çalıştırılmamış** olabilir. Yayımlandı iddiası için Supabase post-check → public catalog fingerprint → Cloudflare yeni dağıtım → tam model HTML ve 10 dilin erişimi gerekir. SEO sıralaması/indeksleme sonucu bu adımlardan çıkarılamaz.
