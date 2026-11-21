# TractorVS — Yayımlanan HP özetlerinde kaynak şartı (21 Kasım 2026)

## Canlı salt-okunur veri kontrolü
- Traktör: 462 toplam; 191 published, 269 draft, 2 archived.
- 191 yayımlanmış modelden 157'sinde **ana tablo** `tractors.horsepower` dolu.
- 68 kayıt için ana HP alanıyla aynı kapsamda standart anahtar/HP birimi üzerinden doğrulanmış teknik kanıt eşleşmesi bulunamadı. Bu sayım bir veri hatası kesin hükmü değildir; *özet HP'nin kaynaklı olduğunu kanıtlayamadığımız* model sayısını gösterir.
- Versatile Nemesis 175/195/235/255 ana tablo HP alanları sırasıyla 175/195/235/255, ilgili doğrulanmış HP teknik özellikleri 170/190/230/250 idi. Fark pazarlama/model adı, nominal/boost gücü veya teknik kapsamdan kaynaklanabilir; otomatik eşit sayılmaz.
- 91 modelde ilgili standart güç alanlarında kaynaklı HP değeri bulundu. Bazı kayıtlarda farklı adlandırılan kaynaklı değerler ayrıca araştırma gerektirebilir.

## Düzeltme
Site `loadPublicCatalog()`, **yalnızca gösterim sırasında** `publishedHorsepower()` kullanır. Bu fonksiyon `sourceBackedHorsepower()` üzerinden yayımlanmaya uygun kanıtlı teknik satırları inceler:
1. Uygun engine rated/gross/power kanonik anahtarı ve HP/BHP birimi olmalı.
2. Rakam açık sayısal olmalı, kaynak URL, kanıt metni ve doğrulama tarihi bulunmalı.
3. Birden fazla uyumsuz değer bulunursa sonuç `null` olur. Boost/PTO/kW ve yalnız model numarasından güç türetilmez.
4. `tractors.horsepower` korunur. Gösterim için uygunsuz kayıtlar katalog/karşılaştırma/danışman/SEO metninde kesin HP diye sunulmaz.

Bu değişiklik şema, SQL, RLS, traktör status'u, source, fotoğraf, onay kuyruğu veya diğer verileri değiştirmez. `site/tests/source-backed-power.test.mjs` içine 6 yeni senaryo ve uyumsuz/kanıtsız kayıtların reddi eklendi. Tüm 10 dilin statik Astro site build, i18n ve production safety testleri CI'da doğrulanmalıdır.

## Yayın ve geri dönüş
- PR üzerinde `npm run test --workspace=tractorvs-site`, `npm run build`, production bundle safety kontrolü çalışmalı.
- Bu PR merge edilmeden canlı sitede değişiklik iddia edilmez; merge sonrası Cloudflare ayrı doğrulanmalı.
- Geri alma: bu PR'yi GitHub üzerinden revert edip yeniden CI ve Cloudflare production deploy çalıştır. Veritabanında geri alma gerekmez.
- Bir HP değeri kaybolursa kaynağa/varyanta uygun gerçek kanıt ekle; `horsepower` başlığını kaynaksız mutlak gerçek olarak geri açma.
