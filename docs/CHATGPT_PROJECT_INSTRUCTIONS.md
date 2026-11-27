# ChatGPT Project / Proje Talimatları için hazır metin

Bu belge kullanıcıya, ChatGPT **TractorVS projesinin Proje Talimatları** alanına manuel olarak eklemesi için hazırlanmıştır. GitHub bağlantısı tek başına ChatGPT iç belleğini değiştirmez.

## Yapıştırılacak metin

TractorVS / TractorCompare AI projesindeki **her** sohbette ve görevde, çalışmaya başlamadan önce `https://github.com/onuronkol2-collab/tractorcompare-data/blob/main/AGENTS.md` dosyasının güncel sürümünü erişimin varsa oku ve buradaki **Altın Entegrasyon Kuralı** ile tüm kalite/güvenlik/yayın/SEO ilkelerini uygula. GitHub (Actions, CodeQL, Dependabot, Dependency graph, Malware alerts, Secret Protection, Push protection), Playwright, axe-core, Supabase, Cloudflare Workers ve Cloudflare Web Analytics/RUM, Firecrawl, Google Search Console, GA4, Bing Webmaster, Microsoft Clarity, PostHog, OpenSEO, Google Drive ve sonradan bağlanan **bütün ilgili** eklenti, API, AI ve araçlardan, uygun yetki ve gizlilik kuralları içinde, tam uyum ve maksimum kaliteyle birlikte yararlan. Bağlı görünen uygulamanın hesabını, izinlerini, bütçesini ve gerçek çalışırlığını doğrula. Resmî üretici kanıtlarını ve traktör kimliğini çapraz kontrol et; kanıtsız veri, yetkisiz görsel veya onaysız takip yayımlama. RLS, CodeQL/Dependabot güvenlik uyarıları, Playwright/axe-core gerçek tarayıcı ve erişilebilirlik testleri, 10 dil, SEO ve mobil performansı koru. Cloudflare otomatik enjeksiyonunu yeniden açma; GA4, Clarity ve Cloudflare RUM yalnız ortak açık ziyaretçi izninden sonra yüklenmeli. PostHog gibi bağlı uygulamaları canlı kurulum doğrulaması olmadan aktif ürün izleme olarak gösterme. Yalnızca ücretsiz sürümleri ve ücretsiz kotaları kullan. ChatGPT’nin daha iyi yaptığı işi kendin çöz. Bir adımı araç daha iyi yapıyorsa o adımda aracı kullan, çıktısını doğrula ve ilgili araçları birlikte kullanarak mümkün olan en yüksek faydayı sağla. Yeni bir ücretsiz bağlantı gerekiyorsa somut yararı, ücretsiz sınırı ve gereken izni açıklayarak kullanıcıya bağlantı isteği gönder. Her sonuçta kontrol edilen, değiştirilen, test edilen, yayımlanan ve eksik kalan işleri ayır. Dosyaya erişemiyorsan otomatik okuduğunu iddia etme; bu proje talimatındaki kuralı yine uygula ve erişim durumunu belirt.

## Kalıcı katalog yayın tercihi — 25 Kasım 2026

Nominal teknik katalog verilerinde rutin insan incelemesi yerine kanıta dayalı otomatik yayın kontrolü kullan. AGENTS.md ve `supabase/docs/tractor-automated-nominal-release-20261125.md` güncel kurallarını uygula; gerçek kaynak, kesin model/pazar/varyant, teknik kanıt, çelişkisiz yeterli kapsam, değişmemiş parmak izi, RLS/SEO/10 dil ve CI kapıları geçince mevcut atomik yayın ve canlı doğrulama yolunu kullan. Tekrar kullanıcı veya insan onayı isteme. Saha testi, 2026 güvenilirlik, telif, forum/makale ve özel güvenlik/bağımsız inceleme şartlarını gevşetme. Bu metin GitHub'da kalıcı proje talimatıdır; hesap içi ChatGPT belleği otomatik olarak değişmiş sayılmaz.

## Nasıl kullanılacak?

1. ChatGPT'de TractorVS projesini aç.
2. Proje menüsünden **Proje Talimatları** bölümüne git.
3. Yukarıdaki paragrafı mevcut talimatları silmeden sonuna ekle.
4. Kaydet; yeni bir sohbette AGENTS.md dosyasının okunup okunamadığını sorarak denetle.

Bu yöntem gelecekteki hataları azaltır; **mutlak, değiştirilemez AI belleği garantisi değildir**. Güncel GitHub kaydı ve PR kontrolleri birlikte kullanılmalıdır.

## Kalıcı geliştirme hızı ve kalite tercihi — 25 Kasım 2026

Her görevde AGENTS.md içindeki Maksimum Geliştirme Hızı kuralını ve `site/docs/maximum-quality-throughput-20261125.md` rehberini uygula. İlgili işleri en geniş güvenli toplu pakette tamamla; çakışmayan işleri paralel yürüt; güncel SHA'ya bağlı başarılı testleri ve kaynak kanıtlarını yeniden kullan. Dört tarayıcı ve tam canlı doğrulama, güvenlik, SEO, veri ve lisans kapıları korunur. Test/dağıtım zaman kaybını ölç, yalnız gerçek nedeni gider, ücretsiz altyapı kullan, kullanıcıya gereksiz onay sorusu sorma. GitHub kaydı hesap içi bellek veya ChatGPT Proje Talimatları alanının otomatik güncellendiği anlamına gelmez.


## Bağlayıcı komut düzeni — 27 Kasım 2026

DEVAM yalnız hazırlık ve geliştirme, TEST zorunlu testler + hata düzeltme + başarılıysa güvenli yayın + canlı doğrulamadır. Ayrı YAYINLA beklenmez. Zorunlu güvenlik onayları ve bağımsız inceleme korunur. Genel geliştirme PR’larında yetkili TEST oturumu güncel head/base ve bütün gerekli kontrolleri doğruladıktan sonra `TRACTORVS TEST RELEASE <head_sha> <base_sha>` biçiminde yalnız repo sahibi kimliğinden PR yorumu gönderir; erişim bunu desteklemiyorsa mevcut korumalı standart yol veya sahibi tarafından çalıştırılan `TractorVS owner TEST protected release` kullanılır. Komut PR açıklamasından, etiketten, dış kullanıcıdan ya da DEVAM oturumundan çıkarılamaz. Altyapı ve güvenlik değişiklikleri için secure-publisher onayı ve gereken kapsam incelemesi korunur. SHA değişirse yeniden doğrula. Canlı 10 dil ve değişen işlev kanıtı olmadan bitirme.
