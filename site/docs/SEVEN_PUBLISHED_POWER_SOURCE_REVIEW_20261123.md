# TractorVS — 7 yayımlanmış traktörün güç kaynağı incelemesi

**23 Kasım 2026 | Bulgular: Salt-okunur | Yayın: Değişmedi | Kod: Yalnız koruyucu gösterim kontrolü**

Bu çalışma, [100 modellik denetimin](PUBLISHED_100_MODEL_EVIDENCE_PILOT_20261123.md) aynı UUID örneklemindeki yedi modelden devam eder. [Tekrar çalıştırılabilir SQL](../../supabase/verification/20261123_seven_published_power_scope_review.sql) sadece yayımlanmış modelleri okur. Örneklem tüm modeller için sonuç değildir; kayıt veya yayın durumları değiştiğinde üyeliği de değişebilir.

## Üretici gücü: dört Swaraj modelinde doğrulanan şey **güç kategorisi aralığı**

| Model | Resmî üretici ürün sayfası | Resmî sınıf | Sonuç |
|---|---|---|---|
| Swaraj 735 XT | https://www.swarajtractors.com/swaraj-735-xt-tractor | 29.82–33.09 kW / 41–45 HP | Kesin tek HP değeri çıkarılamaz |
| Swaraj 742 XT | https://www.swarajtractors.com/swaraj-742-xt-tractor | 29.82–33.09 kW / 41–45 HP | Kesin tek HP değeri çıkarılamaz |
| Swaraj 744 XT | https://www.swarajtractors.com/swaraj-744-xt | 33.56–37.28 kW / 46–50 HP | Kesin tek HP değeri çıkarılamaz |
| Swaraj 855 FE | https://www.swarajtractors.com/swaraj-855-fe-tractor | 33.56–37.28 kW / 46–50 HP | Kesin tek HP değeri çıkarılamaz |

**Kanıt sınırı:** Üretici sayfaları bu aralıkları "Power Category" veya "Engine HP" başlığı altında gösterebilir. Bu, **not a single measured engine rating**: tek, varyantı/standardı/rpm'si belirtilmiş bir nominal motor gücü olduğunun kanıtı değil. Aralığın üst ucu, alt ucu veya orta noktası `tractors.horsepower` alanına sessizce yazılmamalı; PTO gücü sanılmamalı. Özellikle Swaraj 735 XT ve ayrı 735 XT 4WD sayfaları arasındaki ekipman/aktarma bilgileri model-varyant gözden geçirmesi olmadan birleştirilmemeli.

## Belarus: üç modelde kaynak eşleştirme hâlâ açık

| Model | Yayımdaki varyant/pazar | Mevcut kaynak | İnceleme durumu |
|---|---|---|---|
| BELARUS 922.4 | MTW 922 / Stage IIIa, global | https://kocyigit.com.tr/wp-content/uploads/2024/06/Katalog_Belarus_Traktor.pdf | Tam motor varyantı ve ölçüm sayfası henüz bağımsızca doğrulanmadı |
| BELARUS 923.3 | MTW 923 / Stage II, global | Aynı Türkiye distribütör kataloğu | Resmî kullanım kılavuzu modeli içeriyor, ancak tam motor gücü tablo eşleştirmesi tamamlanmadı |
| BELARUS 952.4 | MTW 952 / D-245.5S3A, global | Aynı Türkiye distribütör kataloğu | Resmî kılavuz dizini MMZ / DEUTZ / MERCER seçeneklerini ayrı listeliyor; eşleşmeyen motorun rakamı kullanılmaz |

Üreticinin belge dizini: https://www.mtz.ru/rukovodst (BELARUS 923.3/923.4 ve 920.4/952.4 için farklı motor kılavuzlarını listeler). Belge bağlantılarının bazıları araştırma sırasında erişim hatası verdi. Bu yüzden 922.4, 923.3 ve 952.4 için kesin güç **doğrulandı** iddiası yoktur. Resmî kılavuzdaki tam model/sürüm ve motor tablo satırı doğrulanana kadar bekletilmeli; komşu 923.4 veya 952.3 modelinden değer taşınmamalı.

## Uygulanan dar gösterim güvenliği

Mevcut `site/src/lib/catalog.ts` fonksiyonu `sourceBackedHorsepower`, katalog ve tarım danışmanında yalnızca kaynağı/kanıtı belirtilmiş tek HP rakamını gösterme yaklaşımını kullanıyordu. Yeni savunma, daha önce yanlışlıkla `engine_power=45` olarak girilmiş olabilen **Power Category 41–45 HP** kanıtını, sayı alanına **tam güç olarak yükseltmeyi engeller**. Yalnızca açık kategori/range kanıtları için konservatif durur; bağımsız tablo/variant doğrulaması gerekliliğini kaldırmaz.

İlgili offline regresyon testleri resmî üreticinin dört aralığını, doğru tekil gücü, çelişen sayıları, yanlış PTO türünü, kaynak yokluğunu ve kaynaktaki kötü niyetli talimat metnini ayrı senaryolar olarak denetler. Bu testler kendi başına bütün AI sisteminin güvenlik onayı değildir.

## Yapılmayan ve hâlâ gereken işler

- **No production change was manually deployed:** Supabase şeması, canlı teknik değerler, RLS, forum, SEO URL'leri, kaynak/atıf ve model durumları değiştirilmedi. Kod değişikliğinin GitHub'a birleştirilmesi, Cloudflare canlı dağıtımı ve Google indeksleme ayrı doğrulanmalı.
- Kaynağı bulunan dört Swaraj güç **kategorisini** doğru türde bir özellik olarak kamuya sunma işi ayrı ve kaynaklı kayıt/şablon doğrulaması gerektirir; bu PR bunu yapmaz.
- Belarus için kılavuz PDF sayfası ve tam motor varyantı/doğrulama tarihi bulunmadan `horsepower` doldurulmaz.
- Fotoğrafların lisansı, kullanıcı deneyimi ve saha güvenilirliği bu incelemenin kapsamı dışında kalmıştır.
- Değişiklikten sonra yeni bir gerçek kullanıcı testi veya canlı üretim ölçümü yapıldığı iddia edilmemelidir.

## Geri alma ve kalite kapısı

Kod değişikliği beklenmedik biçimde gerçek, tekil üretici gücünü gizlerse yalnız bu regex koruması ilgili commit üzerinden geri alınabilir. Önce `site/tests/engine-power-category-evidence-20261123.test.mjs`, mevcut `headline-power-provenance`, 10 dil, üretim derlemesi ve Golden Rule CI'leri doğrulanmalı. Hiçbir kullanıcı veya gizli taslak bilgisi repoya aktarılmadı.
