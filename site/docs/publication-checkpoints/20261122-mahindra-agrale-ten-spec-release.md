# 22 Kasım 2026 — yayımlanmış 5 modele kaynaklı 10 ek özellik

Bu dosya, `.github/workflows/tractorvs-publication-autosync.yml` güvenli, anonim **yayınlanmış katalog veri anlık görüntüsü** denetimini main merge sonrasında başlatmak için gerçek veri değişikliği kanıtıdır. İçerik önerisi ya da özel kuyruktaki taslağın yayımlanma talebi değildir.

- Supabase public `tractor_specs`: doğrulama `2026-11-22T17:17:16Z`; 10 yeni ayrı teknik satır; kaynak/model ve `verified_at` üzerinden read-back eşleşti.
- Kayıt sayısı: 12.169 → **12.179**; yayımlanmış traktör sayısı **388**; 357 taslak ve 22 arşiv kimliği aynı kaldı.
- Kapsam: Mahindra ARJUN 555 DI (+3), Mahindra ARJUN 605 DI i (+3), Mahindra ARJUN 605 DI MS (+1), Mahindra ARJUN 605 DI MS V1 (+2), Agrale 4233 (+1).
- Üretici kanıtı, doğruluk sınırları ve ölçüm farklılığı: [aynı yayın grubunun ayrıntılı raporu](../tractor-spec-mahindra-agrale-20261122.md).
- 10 dilli kaynak koşulunu koruyan tam başlık görünümü: PR #437, merge `ff8435946efe788fdf4737606fe7b34112ac2159`. Derleme, güvenlik, bağımsız dil önizlemesi, Chromium/Firefox/WebKit ve axe başarılı.
- Fotoğraf: Bu grupta **0 yeni görüntü**; 765 özel adayın hiçbirinde eşzamanlı kimlik + lisans onayı yoktu. Gizli görselleri yayımlama.
- Başlangıç `public-catalog-sync.json` anlık görüntüsü eski `2026-11-22T09:56:35Z` olup 388 yayımlanmış model ve 8.856 görünür satır bildiriyordu. Bu, **17:17 UTC** sonrasında eklenen 10 kaydın Cloudflare HTML sayfalarına henüz yansıdığının kanıtı değildir.
- **Yayın kapısı:** Ana dalda workflow public anon görünümü yeniden sayacak; yalnız hash gerçekten değişmişse küçük commit atacak. Cloudflare deployment success ve canlı 200 HTML+gerçek teknik satırlar, kanıtlanmadıkça “canlı yayımlandı” deme.
- Google indeksleme veya lisans hakkı yayın senkronizasyonuyla otomatik kazanılmaz.

Geri dönüş: Bu tetikleyici döküman silinse dahi Supabase kanıtı korunur; hatalı kaynak bulunursa özgül 10 kayıt tek tek gözden geçirilir, toplu kaynak/özel veri silme yoktur.
