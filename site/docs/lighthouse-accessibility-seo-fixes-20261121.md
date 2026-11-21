# TractorVS — Lighthouse erişilebilirlik ve taranabilir bağlantı düzeltmeleri

**Tarih:** 21 Kasım 2026 · **Kapsam:** canlı EN/TR teknik ansiklopedi, TR forum ve yayın sonrası doğrulama.

## Ölçülmüş, uydurulmamış bulgular

OpenSEO Lighthouse taraması `24cd5135-1ac3-4b0d-939a-494a3f7f6b53` (21 Kasım 2026, 10 URL × mobil+masaüstü; ilk sonuçlar kod değiştirilmeden önce alındı):

- `/guides/tractor-technical-terms/`: **mobil Lighthouse performans 100, erişilebilirlik 96, SEO 100; LCP 1318 ms, CLS 0**. İki özgün teknik sözlük etiket ailesinde renk kontrastı sorunu: `.case-study-kicker` ve `.glossary-section-kicker`; araç bunları `color-contrast` olarak raporladı. Rapor, bir alandaki 7 öğeyi grupluyor. Bu değerler sentetik ölçümdür, gerçek kullanıcı CrUX/RUM değildir.
- `/tr/forum/`: **mobil performans 100, erişilebilirlik 96, SEO 92; LCP 1257 ms, CLS 0**. Gerçek `.community-topic-meta` bilgilerinin renk kontrastı yetersiz; ayrıca `[data-forum-publication-link]` çıpası başlangıçta `href` içermiyor. JavaScript sadece canlı konu URL'sini doğruladıktan sonra href atıyordu. Lighthouse bunu erişilemeyen bağlantı olarak raporladı.
- Aynı taramadaki diğer sayfalarda birkaç model title uzunluğu **bilgi düzeyinde**; teknik model/varyant bilgileri SEO puanı için silinmedi. Tüm site taranmadı: 10/587 örnek.
- Özellikle ansiklopedi görselinde yaklaşık 166 KiB potansiyel görüntü aktarımı kazancı ve 85 KiB cache ömrü uyarısı var; fakat orijinal, lisansı onaylı görseli başka dosyayla değiştirmenin fotoğraf/lisans ve kimlik etkisi ayrı ele alınmalı. Bu PR görseli değiştirmiyor.

## Yapılan düzeltmeler

1. `TractorGlossary.astro`: açık zeminlerdeki küçük bölüm başlık etiketlerinin `#73a454` düşük kontrastlı yeşilini, WCAG AA üzerinde kalan koyu `#32633a` ile değiştirdi. Koyu arkaplanlı çağrı kutusunda açık yeşil `#c8f3a4` bilerek korundu; tüm koyu yerleri karartıp okunmaz yapma hatasına düşülmedi. Kart içindeki `.glossary-deepdives-index` de kontrastı artırılmış küçük metindir.
2. `TractorLearningCases.astro`: açık zeminli vaka başlıklarında `#477e4a` (arka planda yaklaşık 4.47:1) yerine `#32633a` kullanıldı.
3. `ForumHub.astro`: tarih/kategori gibi metaveri `#538161` (beyaz üzerinde yaklaşık 4.49:1 sınırda) yerine `#315f3d` (beyaz üzerinde 7:1'in üzerinde) yapıldı.
4. `ForumComposer.astro`: gizli yayın bağlantısına başlangıçta **var olan kendi dilindeki forum URL'si** atanıyor. Gerçek gönderiye bağlantı ancak JavaScript kendi doğrulama koşullarını tamamlayınca güncelleniyor ve görünür oluyor. Uydurma konu URL'si veya henüz yayımlanmayan kaydı arama motoruna gösterme yok.
5. Node testleri renk oranı, CSS ve güvenli anchor koşullarını doğrular. Playwright Chromium'da EN/TR ansiklopedi + TR forum için axe color-contrast ve yayın bağlantısının `hidden`/href durumu kontrol edilir.

## Yayın güvenliği

- Forum Supabase/RLS, kayıt/giriş, moderasyon, konu SEO kapsamı, analitik izinleri ve lisanslı fotoğraf sistemi değişmedi.
- Önce GitHub CI (node, Astro, Cloudflare prod bundle, Golden Rule, CodeQL, Playwright/axe); ardından canlı HTTP 200, doğrulanmış HTML/CSS, gerekirse Lighthouse yeniden tarama.
- Yeni taramanın öncekinden daha iyi çıkması gerçek kullanıcı metriği ve Google indeks artışı garantisi değildir. `INP` değeri sentetik testte null'dı, ölçülmüş gibi gösterilmez.
- Geri alma: PR squash commit'i revert; veritabanında bir işlem olmadı.
