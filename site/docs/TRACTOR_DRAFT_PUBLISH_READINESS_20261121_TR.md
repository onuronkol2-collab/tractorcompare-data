# TractorVS — 285 taslağın tek sorguda yayın öncesi öncelik haritası
**Kaynak:** Supabase `tc_backup.tc_publication_readiness_v1` (21 Kasım 2026)

Bu sorgu, yayına hazır model olduğunu *varsaymaz*. Üretici belgesi, model/varyant/yıl/pazar eşleşmesi, rakam kanıtı ve teknik çelişkiyi ayrı ele alarak saatlik araştırmayı yönlendiren **salt okunur** bir yardımcıdır. `tc_backup` şemasında bulunur; `anon` ve `authenticated` rollerinin SELECT hakkı yoktur, `security_invoker=true`. Hiçbir taslağın status alanını değiştirmez.

## Gerçek veritabanı bulguları
- **175 published** ve **285 draft**.
- 285 taslağın **275'inde**, kaynak URL + alıntı/kanıt + `verified_at` üçlüsü birlikte bulunan **hiç teknik satır yok**.
- 7 taslakta bir miktar kanıt var fakat 8'e ulaşmıyor (`INSUFFICIENT_EVIDENCE`).
- 3 taslakta aynı canonical_key + birim için farklı ölçüm kayıtları bulunduğundan `CONFLICT_REVIEW` gerekli.
- Bugünkü sonuçta **hiçbir taslak otomatik yayın için uygun ilan edilmedi**. `HUMAN_RELEASE_REVIEW` bile sadece manuel karşılaştırma aşaması; asla otomatik yayın onayı değil.

## İlk model ailesi görevleri
1. **Deutz-Fahr 5090 D:** 22 kaynaklı satır olmasına rağmen farklı nesil/emisyon/seri belgeleri aynı kayıtta; piyasaya/yıla göre kimlik ayrımı olmadan yayımlanmaz.
2. **Mahindra OJA 2121:** 6 kaynaklı satır. Resmî sayfa başlığı 2WD, aynı tabloda 4WD; kesin varyant karışıklığı çözülmeli.
3. **Kubota M7040:** 7 kaynaklı satır; üretici ülke sayfasındaki depo değeri ile ROPS PDF'sindeki değer farklı. Kesin pazar/varyant olmadan güç/depo yazılmaz.
4. **John Deere 6R 150 / 6M 125:** Kaynaklı alan sayısı 5/4; model yılı, nesil, pazar ve eksik kaynak satırları ayrılmalı.
5. **Başak 2075 BK 2WD:** 4 kaynaklı alan; motor/ölçü ve 2WD pazar kimliği teyit edilmeli.
6. **Diğer 275 taslak:** Resmî ürün kataloğundan başlanarak üretici/model/yıl/pazar ayrımı kanıtlanmalı; yakın farklı modellerin rakamları kopyalanmamalı.

## Tek bir sorguyla en hızlı denetim
```sql
SELECT brand,model_name,model_year,variant,market,
       evidenced_rows,evidenced_concepts,manufacturer_documents,
       potentially_conflicting_fields,readiness,priority_score
FROM tc_backup.tc_publication_readiness_v1
ORDER BY priority_score DESC,brand,model_name
LIMIT 100;
```

**Sınırlama:** Bu sadece mevcut kayıtların kalitesini özetler; source_url'nin canlı olup olmadığını, resmî bir PDF içindeki satırın *gerçekten* aynı varyanta ait olup olmadığını tek başına kanıtlamaz. Kontrol sonrası geri alma ve GitHub/Cloudflare/Google dizin süreçleri ayrı kalmalıdır.

## Ayrı işler, birlikte yürütülen akış
- Başarılı: Mahindra OJA 2124/2127/2130 India 4WD teknik kayıtları kaynaklı yayımlandı (Supabase 175 yayın; 5313 görünür spec).
- Başarılı: Foruma moderasyon ve gizlilik izinleri, 10 dil, güvenli e-posta giriş iskeleti, gerçek onaylanan sayfaların statik güncellenmesi (PR #132).
- Bekleyen: eğitim ansiklopedisinin diğer sekiz dilde birebir ve yerel anlamı koruyan çevirileri; özel Gemini sağlayıcı iki modelde 503 yoğunluk verdi, PR #127 onaysız bırakıldı.
- İşletim: saatlik kaynak doğrulama + fotoğraf eksikliği görevleri faal; mevcut doğrulanmış modelleri gereksiz yeniden üretme.
