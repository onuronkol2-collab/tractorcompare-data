# 100 yeni benzersiz canlı fotoğraf — başlangıç kontrol noktası

- Başlangıç: 2026-11-25 20:41 TRT, ana dal `692fe414fc050c008f9071cb829092e98afa238c`.
- Supabase: 472 published, 325 draft, 22 archived. 126 benzersiz fileId kayıtlı; kod eşleşmesi 106/472, eksik 366 (341 ayrı marka/model). Bu DB + registry eşleşmesidir, canlı HTTP/byte kanıtı değildir.
- Yeni hedef: 0/100 gerçek canlı doğrulanmış fotoğraf, kalan 100. Eski 50 hedefi ve kanıtları ayrı korunur.
- PR #689: 6 özgün fotoğraf, 4 yeni model UUID, 18 JPEG türevi. Önceki preview hatası sonrası güncel ana dalla çakışmasız senkronize edildi: `da9e363bb67f007230fda6cf1b42d4eb0837cd96`. Yeni preview JPEG kapısı başarılı; tüm diğer gerekli kontroller ve gerçek üretim kanıtı beklenir. Henüz sayılmaz.
- PR #691 artifact 15038517127: 100 hedef UUID, 9 aday, 4 SHA1-doğrulanmış orijinal, 2 decode başarılı, 6 JPEG türevinin boyut/decode/SHA256 doğrulaması tamamlandı. EF393T için iki uzak çekimde model işareti güvenle okunamadığından yayın yok; YM351A iki orijinal decode başarısız. Bu dört kaydı tekrar aynı kaynakta araştırma; yeni kanıt olmadıkça beklet.
- Canlı site bu oturumun doğrudan DNS/web erişiminden doğrulanamadı. Mevcut GitHub üretim readiness/QA kullan; gerçek SHA ve canlı sonuç olmadan sayı artırma.

Her turda güncel ana dal, açık PR ve son araştırma raporundan devam et; başlangıçtan sonraki benzersiz kaynak URL + özgün SHA + fileId listesini üretim kanıtı ile birleştir. Önce fotoğrafsız yayımlanmış UUID, farklı dil ve kaynak ailesi, güvenli paralel toplu araştırma; uygun dosyaları tek geri alınabilir pakette değerlendir. Sağlayıcı limitlerine, lisansa, gerçek görsel kimliğe ve zorunlu CI kapılarına uy. Aynı resmin üç çözünürlüğü ve 10 dil gösterimi bir özgün fotoğraftır. Aday, decode, doğrulama, merge, üretim ve canlı sayılarını ayrı tut. Hedefe ulaşınca genel fotoğraf eksiklerini gidermeye devam et.

## 25 Kasım 2026, 21:36 TRT doğrulanmış ilerleme
- İlk eşik 100, genişletilmiş hedef en az 300 yeni özgün canlı fotoğraf (#711). Başlangıç ölçütü değişmedi.
- #689 ana dal 1944ecef773fb30aad6ca25c4241b69ed8fc0d2b: 4 yeni özgün fotoğraf (Başak 2055, 3026, Bobcat CT2540, CT4058), üç arka çekim çıkarıldı. #713 gerçek üretim doğrulaması run 45675829389/job 139422988181: aynı release SHA, 61/61 (40 dil-model HTML/atıf, 12 JPEG byte/hash, 9 eski arka JPEG HTTP yokluğu), newUniquePhotos=4. Kampanya kanıtlı 4/100 ve 4/300, 96/296 kalan; eski veya türevleri sayma.
- #714: artifact 15052415930 kaynaklı 35 yeni orijinal ve 105 JPEG, 23 UUID; transfer run 45676463353 başarılı. Bu UUID'lerin tamamında önceki fotoğraf vardı (0 ilk kez fotoğraf kazanan UUID), galeri zenginleştirmesi olarak ayrı ölç. Zorunlu CI ve gerçek üretim doğrulanmadan 35'i hedefe ekleme. #710 yeni doğrudan kaynak adayları yalnız fotoğrafsız Belarus/Steyr UUID'leri için, araştırma/transfer taslağı birleştirilmez. Güncel 300 hedefli saatlik otomasyon ve #711 devam noktasıdır.
