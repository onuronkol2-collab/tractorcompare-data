# TractorVS — Cloudflare Workers: güvenli derleme, yayın ve geri alma

Bu dosya, *tractorvs-site* için Cloudflare Workers Builds üretim kontrol listesidir. Siteyi bozabilecek eksik Supabase bağlantısı, yanlış çalışma dizini, robots.txt noindex hatası ve eksilen model sayfaları artık **yayından önce** yakalanır.

## Doğrulanmış önceki hata (15 Kasım 2026)

Cloudflare ekran görüntüsünde `npm run build` çalışırken `/opt/buildhome/repo/package.json` bulunamadığı ve ENOENT alındığı görülüyor. Söz konusu derleme **beş gün önceki** bir denemeye aittir. GitHub'da kök `package.json` da vardır ve daha yeni GitHub Actions derlemeleri başarılıdır. Dolayısıyla eski logu mevcut kodun bugün de hatalı olduğuna kanıt olarak kabul etmiyoruz.

## Cloudflare'da yalnızca bir kez yapılacak yapılandırma

ÖNCE **Workers & Pages → tractorvs-site → Settings → Build** ekranını açın. **Production** ayarlarında:

| Alan | Doğru değer |
| --- | --- |
| Git repository | `onuronkol2-collab/tractorcompare-data` |
| Production branch | `main` |
| Root directory | `site` (başına / koymayın) |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run deploy:verified` |
| Preview command | `npx wrangler preview` |
| Node version | `site/.node-version` üzerinden `22.23.4` |
| npm version | `site/package.json` üzerinden `npm@10.9.2` |

Cloudflare, Build komutunu belirtilen root directory içinde çalıştırır. `site/` içinde `package.json`, `wrangler.jsonc` ve `worker/index.js` bulunur. Kök dizinde farklı bir Wrangler yapılandırması mevcut; dağıtım için güvenilir ve tek açık hedef `site/wrangler.jsonc` dosyasıdır. GitHub CI iki yapılandırmanın riskli rota çelişkilerini de kontrol eder.

**Settings → Build → Build variables and secrets** altında:

| Adı | Değer / güvenlik |
| --- | --- |
| `SITE_URL` | `https://tractorvs.com` |
| `PUBLIC_INDEXING_ENABLED` | `true` — yalnızca üretim build'i kapı denetiminden geçiyorsa |
| `SUPABASE_URL` | Sizin Supabase projenizin `https://...` proje URL'si |
| `SUPABASE_PUBLISHABLE_KEY` | Sadece `sb_publishable_...` public anahtar veya eski `anon` anahtarı |
| `MIN_PUBLIC_TRACTOR_PAGES` | `100` (emniyet tabanı, ihtiyaç halinde kasıtlı ve kontrollü güncellenebilir) |

**Supabase service_role, sb_secret, Gemini key, Cloudflare token gibi sırları asla GitHub'a veya site HTML'sine yazmayın.** Anahtar veya jetonun ekran görüntüsünü paylaşmayın. Build variables, Worker'ın **runtime** Variables & Secrets bölümünden farklıdır. Runtime'a bir değer eklemek build sırasında Astro tarafından otomatik kullanılacağı anlamına gelmez. Cloudflare'daki önceki ekranda `Build variables: None` görünmesi, eski denemenin eksik kurulmuş olabileceğini gösterir; bugünkü güncel değerleri yeni build üzerinden yeniden kontrol edin.

## Neden iki derleme modu var?

`npm run build:cloudflare`:
- `main` dalında: yayın kapısı önce gerekli değişkenleri ve Worker yapılandırmasını denetler, sonra Astro derler, sonra `dist` çıktısını ikinci kez inceler. Bir adım başarısızsa **deploy başlamaz**.
- Diğer dallarda: siteyi `PUBLIC_INDEXING_ENABLED=false` ve boş `SITE_URL` ile **noindex** önizleme olarak derler.
- `npm run deploy:verified`, üretim HTML'sini tekrar denetleyip *ancak bundan sonra* `wrangler deploy` yapar; yanlışlıkla güvenlik kontrolünü atlayan build de üretime çıkamaz.

İzleme ilkeleri: `dist/robots.txt` taramaya izin veriyor mu, ana sayfalar indexable mı, canonical `tractorvs.com` mu, sitemap var mı, Türkçe/İngilizce ana ve rehber sayfaları var mı, 96 terim ve 57 parça kayıtları yerinde mi, İngilizce ve Türkçe model sayfa sayıları aynı mı, en az 100 gerçek yayımlanmış model sayfası var mı? Bu tabanın altına düşerse eski çalışan sürümü korumak için dağıtım **bloklanır**.

## Son kontrol ve ilk güvenli üretim dağıtımı

1. Önce GitHub **Actions → Site build validation** sonucunda güncel `main` commit'inin **yeşil** olduğunu doğrulayın.
2. Cloudflare **Settings → Build** alanlarını yukarıdaki gibi kaydedin. Yeni en güncel `main` sürümü için **Deployments → View Build History** üzerinden build tetikleyin veya bağlantılı yeni commit derlemesini izleyin. Beş günlük eski build'i aynı kod sanıp tekrar denemeyin.
**Yeni ayarlar için doğrulama notu (20 Kasım 2026):** Cloudflare'ın eski Build kayıtları eski komutları göstermeye devam eder. Yeni komutların devreye girdiği, yalnızca yeni ayarlar kaydedildikten sonra **yeni main commit'i için oluşturulan** derlemenin Build settings bölümünde `npm run build:cloudflare` / `npm run deploy:verified` göründüğünde kanıtlanır. Eski başarılı build'i yeniden denemek bu doğrulamayı yapmaz.

3. Build logunda `[TractorVS] Production bundle has passed all release checks` ve `Production postflight OK` arayın. Hata varsa hangi kontrolün yayınlamayı durdurduğunu log bildirir.
4. **Production Active Deployment** sürümünün yeni sürüm olduğundan emin olun. Yalnızca `Build successful` yazması yetmez.
5. Canlı olarak `https://tractorvs.com/`, `/tr/`, `/tractors/`, `/tr/tractors/`, `/tr/guides/tractor-technical-terms/`, `/tr/guides/pto-and-power-take-off/`, `/robots.txt`, `/sitemap-index.xml`, `/image-sitemap.xml` ve en az iki gerçek model sayfasını açın. Fotoğraf proxy URL'lerinin döndüğünü kontrol edin.
6. Search Console üzerinden **URL Denetimi** ve sitemap durumunu takip edin. Derleme doğru olması Google'da indekslendiği anlamına gelmez.

## Sorun çıkarsa geri alma

- Başarısız **Build**, çalışan sürümü otomatik olarak değiştirmemeli. Cloudflare **Active Deployment** ve build logunu karşılaştırın.
- Başarılı bir dağıtımdan sonra canlıda sorun oluşursa **Deployments → Version History** üzerinden önceki bilinen iyi sürüme geri dönün. Bunun yeni içerikleri geçici olarak geri alacağını unutmayın.
- `PUBLIC_INDEXING_ENABLED` değerini gelişigüzel `false` yapıp yeniden yayınlamayın: bu, canlı siteyi `noindex` hâle getirir. Önce sorunun kök nedenini giderin.
- Supabase erişim engeli/yanlış anahtar, model kaynak kaybı veya SSR/HTML eksikliği varsa siteyi yayınlamak yerine kontrol kapısını durdurun.

## Sınırlar

Bu korumalar **kod ve build çıktısının** tehlikeli şekilde eksik yayınlanmasını azaltır; Cloudflare servis kesintisi, domain/DNS değişiklikleri, görüntülerin asıl barındırıldığı yerdeki kesintiler veya Google indeksleme kararlarını sıfır riskle engelleyemez. Çalışan alan adını doğrulamak, gözlem/uyarı almak ve geri alma planını denemek ayrı önlemlerdir.
