# 100 yeni benzersiz canlı fotoğraf — başlangıç kontrol noktası

- Başlangıç: 2026-11-25 20:41 TRT, ana dal `692fe414fc050c008f9071cb829092e98afa238c`.
- Supabase: 472 published, 325 draft, 22 archived. 126 benzersiz fileId kayıtlı; kod eşleşmesi 106/472, eksik 366 (341 ayrı marka/model). Bu DB + registry eşleşmesidir, canlı HTTP/byte kanıtı değildir.
- Yeni hedef: 0/100 gerçek canlı doğrulanmış fotoğraf, kalan 100. Eski 50 hedefi ve kanıtları ayrı korunur.
- PR #689: 6 özgün fotoğraf, 4 yeni model UUID, 18 JPEG türevi. Önceki preview hatası sonrası güncel ana dalla çakışmasız senkronize edildi: `da9e363bb67f007230fda6cf1b42d4eb0837cd96`. Yeni preview JPEG kapısı başarılı; tüm diğer gerekli kontroller ve gerçek üretim kanıtı beklenir. Henüz sayılmaz.
- PR #691 artifact 15038517127: 100 hedef UUID, 9 aday, 4 SHA1-doğrulanmış orijinal, 2 decode başarılı, 6 JPEG türevinin boyut/decode/SHA256 doğrulaması tamamlandı. EF393T için iki uzak çekimde model işareti güvenle okunamadığından yayın yok; YM351A iki orijinal decode başarısız. Bu dört kaydı tekrar aynı kaynakta araştırma; yeni kanıt olmadıkça beklet.
- Canlı site bu oturumun doğrudan DNS/web erişiminden doğrulanamadı. Mevcut GitHub üretim readiness/QA kullan; gerçek SHA ve canlı sonuç olmadan sayı artırma.

Her turda güncel ana dal, açık PR ve son araştırma raporundan devam et; başlangıçtan sonraki benzersiz kaynak URL + özgün SHA + fileId listesini üretim kanıtı ile birleştir. Önce fotoğrafsız yayımlanmış UUID, farklı dil ve kaynak ailesi, güvenli paralel toplu araştırma; uygun dosyaları tek geri alınabilir pakette değerlendir. Sağlayıcı limitlerine, lisansa, gerçek görsel kimliğe ve zorunlu CI kapılarına uy. Aynı resmin üç çözünürlüğü ve 10 dil gösterimi bir özgün fotoğraftır. Aday, decode, doğrulama, merge, üretim ve canlı sayılarını ayrı tut. Hedefe ulaşınca genel fotoğraf eksiklerini gidermeye devam et.
