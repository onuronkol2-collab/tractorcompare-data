# TractorVS – HTTP/HTTPS, www ve Google canonical SEO runbook

**Amaç:** Google Search Console'da hem `http://tractorvs.com/` hem `https://tractorvs.com/` gösterimleri kaydedildi. Bu, tek başına hatanın kanıtı değildir. Kalıcı HTTP 301/308 yönlendirmesi, self-canonical, sitemap ve hreflang uyumunu ölçüp doğrulayacağız.

## Doğrulanan güncel durum (21 Kasım 2026)

- `https://tractorvs.com/` üzerinde self-canonical `https://tractorvs.com/` bulunuyor.
- `robots.txt` ve `sitemap-index.xml` erişilebilir.
- `www.tractorvs.com` DNS çözümlemesi kamuya açık taramada başarısız oldu. Eksik URL'nin 301 vermemesi, varsayılan olarak ana sitenin indekslenemediği anlamına gelmez.
- Firecrawl `http://tractorvs.com/` sayfasını son içerikle döndürdü ancak yönlendirmeleri takip ediyor olabileceği için bunun **ilk HTTP cevabının 200 olması** anlamına geldiğini varsaymıyoruz. Yeni GitHub Actions denetimi `redirect: "manual"` ile gerçek ilk HTTP cevabını raporluyor.
- Bu GitHub PR yalnız **okuma / otomatik izleme** ekler; Cloudflare DNS/SSL/redirect ayarını değiştirmez. Otomatik yönlendirme testlerini henüz dağıtımla karıştırma.

## 1. Cloudflare paneli – HTTPS

1. [Cloudflare paneli](https://dash.cloudflare.com/) → alan adı **tractorvs.com**.
2. **SSL/TLS → Edge Certificates (Uç Sertifikaları)** menüsünden aktif sertifikaları kontrol et.
3. **Always Use HTTPS (Her zaman HTTPS kullan)** açık mı bak. Zaten açıksa tekrar dokunma.
4. Kapalıysa, sertifika aktif ve SSL/TLS düzeni uygun olduktan sonra aç. Bu özellik HTTP'yi HTTPS'ye kalıcı yönlendirir.
5. Özellikle **Flexible SSL + origin HTTPS yönlendirmesi** kombinasyonunda sonsuz yönlendirme döngüsü olabilir; SSL modunu doğrulamadan değiştirme. Workers custom-domain kurulumunu koru.
6. Kontrol: `http://tractorvs.com/` → `https://tractorvs.com/` ve `http://tractorvs.com/tr/tractors/` → aynı HTTPS alt yol; **301 veya 308**, içerik HTTPS'te **200** olmalı.

Resmî kılavuz: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/

## 2. Cloudflare DNS + Redirect Rules – isteğe bağlı www takma adı

Kullanıcılar `www.tractorvs.com` yazdığında da siteye ulaşmasını istiyorsak:

1. **DNS → Records** alanında `www` kaydı var mı kontrol et. Var olan doğru kaydı silmeden önce neye hizmet ettiğini incele; başka hizmete bağlıysa değiştirme.
2. Yoksa, sadece yönlendirme amacıyla Cloudflare'ın belgelerinde belirtildiği gibi **Proxied** (turuncu bulut) bir `A` kaydı ve kayıt değeri olarak belgelemeye ayrılmış `192.0.2.1` kullanımı değerlendirilebilir. Bu IP yalnız Cloudflare üzerinden yönlendirme trafiğini yakalamak içindir, gerçek sunucu değildir; **DNS only** olarak yayımlanamaz. Alternatif CNAME yaklaşımını mevcut Worker custom-domain rotasıyla çakışma açısından incele.
3. **Rules → Redirect Rules → Single Redirects** bölümünde yeni bir `www → apex` kuralı oluştur. Koşul: `http.host eq "www.tractorvs.com"`. Hedef: `https://tractorvs.com` + özgün URL path. **301 Permanent** ve **Preserve query string** seç.
4. HTTPS sertifikasının `www.tractorvs.com` adını kapsadığını kontrol et. DNS ve yönlendirme birlikte çalışmalıdır.
5. `https://www.tractorvs.com/tr/tractors/` → **301** → `https://tractorvs.com/tr/tractors/`; sorgu parametreleri ve alt sayfalar korunmalı.
6. `www` için ikinci bir indekslenebilir site veya ayrı sitemap oluşturma.

Resmî kaynaklar:
- https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/
- https://developers.cloudflare.com/fundamentals/manage-domains/manage-subdomains/
- https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-subdomain/

## 3. Github otomatik izlemesi

Workflow: `.github/workflows/edge-canonical-monitor.yml` → günlük 06:35 UTC ve elle çalıştırılabilir.

Komut: `node site/scripts/edge-canonical-audit.mjs`.

- `EDGE_CANONICAL_PROBE`: HTTP ilk yanıt kodu, `Location` başlığı ve beklenen HTTPS URL.
- `EDGE_CANONICAL_ISSUE`: HTTP kalıcı yönlendirmesi, HTTPS canonical, robots veya yanıt hatası.
- `EDGE_CANONICAL_NOTICE`: www DNS/yönlendirme notu.
- `EDGE_CANONICAL_SUMMARY`: sonuç ve test kapsamı.

Başlangıçta `TRACTORVS_EDGE_CANONICAL_STRICT=false`: sahibin Cloudflare panelindeki ayarlar doğrulanmadan diğer PR'ları bloke etmemek için **denetim modu**. Kalıcı yönlendirmeler onaylandığında ayrı PR ile strict=true yapılabilir.

## 4. Yayın sonrası kontrol

- HTTP'de zincirleme 302 veya içerik sunumu olmamalı; HTTPS ana alan 200 ve tek self-canonical vermeli.
- 10 dilde dil karşılıkları **farklı URL'ler** ve doğru hreflang ile korunmalı; Google'a tüm HTTP ve www adreslerini sitemap'e ekleme.
- `robots.txt`, mevcut sitemap, `GA4/Clarity/Cloudflare` ortak izin mekanizması ve Supabase RLS değişmemeli.
- [Google Search Console](https://search.google.com/search-console/) içindeki **URL Denetimi** ile örnek indekslenebilir sayfaları kontrol et. Bir yönlendirmeyi düzeltmek, hemen indekslenme veya sıralama artışı garantilemez.
- Cloudflare paneli hesap ayarını değiştiremediğimiz durumda `GitHub testi eklendi` ile `yönlendirme düzeltildi` iddialarını birbirinden ayır.

## Geri alma

Yeni monitör kodunu kapatmak için yalnız bu PR'ın workflow/script/test commitlerini geri al. DNS, SSL ve yönlendirme Cloudflare hesabından değiştirildiyse Cloudflare değişiklik geçmişi/kurallarından güvenle geri al; **DNS kaydını rastgele silme**. Her değişim sonrası mobil, forum, katalog, canonicals ve 10 dilin ana sayfalarını yeniden kontrol et.
