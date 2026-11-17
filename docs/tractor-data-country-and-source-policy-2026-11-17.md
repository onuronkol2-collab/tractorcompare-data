# TractorVS – Teknik veri kaynağı, pazar ve yayın politikası
Tarih: 2026-11-17. Kullanıcının kalıcı ürün talimatları. Bu belge **veri eklenmiş veya yayımlanmış olduğu anlamına gelmez**.

## Kaynak kabulü
- Her zaman ilk aday, **aynı marka + model + nesil/yıl + varyant + pazar** için üretici teknik sayfası, broşürü, kullanım kılavuzu veya resmî test belgesidir.
- Üreticide o özellik bulunamıyorsa **güvenilir bağımsız kaynak** kabul edilir: ölçüm standardını ve incelenen varyantı tanımlayan bağımsız test kuruluşları; TractorData gibi yerleşik teknik kataloglar; Hindistan pazarı için Tractor Junction/Tractor Guru türü uzman veri tabanları. Güvenirlik kaynak bazında değerlendirilir, alan adı otomatik onay değildir.
- Aynı değerde çelişki varsa model, yıl, donanım, pazar, değer birimi, test standardı, rated RPM, birincil kanıt, veri tarihi ve bağımsız doğrulama karşılaştırılır. Birbiriyle uyuşmayan sayıları **ortalama alma, rastgele birini seçme, mevcut doğru veriyi silme veya bir pazarın değerini diğer pazara taşıma**.
- Orijinal URL, erişim tarihi, doğrulama tarihi, sayfa/belge, kısa kanıt, kaynak türü, gözlemlenen varyant ve belirsizlik kaydedilir.
- Motor gross/rated power ile PTO ölçümünü; HP, PS ve kW birimlerini; 2WD/4WD, eski/yeni üretim neslini ayrı tut.

## Ülke ve SEO
- Traktör spesifikasyonları modelin kendi `tractors.market` kaydından alınır: TR, IN, US, Europe, global vb. Aynı model adı farklı pazarda farklı sürüm olabilir.
- Kullanıcının giriş ülkesi yalnızca ilk seçim önerisidir; kullanıcının ülke seçimi üstün gelir. Tam eşleşen pazar önce; yalnızca `global` veri ikinci sırada. Bilinmeyen pazar modeli yabancı pazarın yerine geçmez.
- Her model/varyant için sabit, indexlenebilir URL; diller için doğru canonical ve hreflang. Coğrafi IP'ye göre zorunlu yönlendirme yok. Google'a görünmez pazar içeriği üretme.
- 10 dil çevirileri ancak kalite onayından sonra indekslenir; makine çevirisi model numaralarını, teknik birimleri ve kaynakları değiştirmez.

## Toplu çalışma disiplini
- **Önce tek kapsamlı canlı envanter/audit**, ardından farklılaşan/eksik kanıtların kaynak araştırması, kontrollü toplu INSERT, kaynak ve varyant karşılaştırması, en son kriteri geçen modellerin toplu yayını.
- Taslakların bulgularını kaynaklı olarak sakla; kaynak kimliği uyuşmayanı inceleme durumunda tut. Yalnızca güvenilir ve tutarlı model kimliğine ait doğrulanmış özellikleri `tractor_specs` içine al.
- Asla tüm modeli özellik sayısına bakarak eksiksiz ilan etme: her modelin gerçek teknik kapsamı ve üreticinin belgelendirdiği opsiyonlar farklıdır.
- Mevcut 6.304 teknik özellik (17 Kasım 2026 Adım41C kullanıcının son teyidi) yeniden ithal edilmez; `published` kayıtlar, RLS ve kaynak bağları korunur.
- Kullanıcı yayına izin vermiştir; ancak **kaynak/kimlik çatışması olan model** önceden onaylanmış `published` kaydı olmadıkça otomatik yayına çıkmaz.

## Somut kaynak uyuşmazlığı örneği (India)
Swaraj 735 FE resmi ürün sayfasında tanıtım için **2734 cm³** yer alırken aynı sayfanın ayrıntılı teknik bölümünde **2592 cm³** gösteriliyor; ayrıca `Weight of tractor - 1860 mm` birim hatası var. Tractor Junction / Tractor Guru'nun yazdığı HP, ağırlık ve PTO değerleri de aynı üretim jenerasyonu/opsiyonlar için doğrulanmadan resmî sayfanın üzerine yazılmamalı. Hindistan CFMTTI test raporu **735 FE N** için ayrı varyant kimliğini gösteriyor. Bu tür kayıtlarda kimliği netleştir, çelişkiyi incelemeye al, otomatik yayınlama.
- https://www.swarajtractors.com/swaraj-735-fe-tractor
- https://www.tractorjunction.com/swaraj-tractor/735-fe
- https://tractorguru.in/tractor/swaraj-735-fe/
- https://fmttibudni.gov.in/files/112_SWARAJ_735_FE_N.pdf

SEO kaynakları:
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- https://developers.google.com/search/docs/specialty/international/localized-versions
