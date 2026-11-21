# TractorVS — Kalıcı Çalışma ve Entegrasyon İlkeleri

> Bu dosya, TractorVS / TractorCompare AI projesinde çalışan yapay zekâ asistanları ve geliştiriciler için proje düzeyinde başvuru kaynağıdır. Mevcut güvenlik, yayınlama, araştırma ve SEO kurallarını tamamlar; onlarla çatışıyorsa daha güvenli ve kanıta dayalı kuralı uygula.

## ALTIN KURAL — TAM UYUM, TAM ENTEGRASYON, MAKSİMUM YARAR

Kullanıcının açık ve sürekli talebi:

**“Şimdi ve daha önce eklediğim bütün eklenti, uygulama, her türlü program, entegrasyon, API ve yapay zekâdan; TractorVS'nin doğruluğunu, güvenliğini, SEO'sunu, performansını ve kalitesini iyileştirmek için mümkün olan en yüksek seviyede, birbirleriyle tam uyumlu, maliyet ve gizlilik açısından sorumlu biçimde yararlan. Bu ilkeyi yeni sohbetlerde ve proje görevlerinde de esas al.”**

Bu ilke **her projeyle ilgili görevde** geçerlidir. Tek seferlik bir istek değildir. Yeni araçlar bağlandığında kapsam kendiliğinden genişler; yalnızca aşağıdaki örnek adlarla sınırlı değildir.

### İşlem öncesi keşif ve bağlam
1. Mevcut GitHub kodunu, açık PR ve issue'ları, Supabase şemasını/RLS'yi, veri kayıtlarını, mevcut otomasyonları ve önceki mimari kararları kontrol et. Kullanıcının zaten verdiği bilgiyi tekrar isteme.
2. Kullanılabilir tüm ilgili araç/eklenti/bağlantıları ve bunların güncel yetki/kapasite/kota durumunu keşfet; bir aracın yalnızca kurulmuş olması ile hedef hesaba erişebilir durumda olması arasındaki farkı doğrula.
3. Aracın gerçekten fayda sağlayacağı işi seç; sırf bağlı olduğu için her araçla gereksiz işlem, tekrar sorgu, ücretli çağrı veya veri aktarımı yapma.
4. Yeni veya daha iyi bir araç, izin ya da bağlantı gerçekten gerekiyorsa kullanıcıdan hangi hesap/izin gerektiğini ve somut faydasını açıkça iste. Gizli anahtarları ve parolaları sohbete yapıştırmasını isteme.

### Araçlar arası birlikte çalışma
5. Uygun oldukça resmî üretici sayfaları/PDF'ler ve lisans kanıtlarını Firecrawl veya diğer erişilebilir araştırma araçlarıyla bul; marka, model, yıl, pazar, varyant ve ölçüm standardını bağımsız olarak doğrula. Çıkarım, alıntı, kaynak URL'si, kanıt tarihi ve güven derecesini ayır. Tek bir AI yanıtını teknik kanıt sayma.
6. Supabase'i veri doğruluğu, durum ve RLS için; GitHub'ı versiyonlanmış kod, PR, otomatik test ve dağıtım kontrollleri için kullan. Kanıtlanmamış verileri taslakta tut; yayın politikasıyla uyumlu, doğrulanmış toplu işlemleri ve geri alma planını uygula.
7. Google Search Console / GA4 / Bing ve uygun olduğunda OpenSEO'dan gerçek ölçümlerle SEO fırsatlarını değerlendir. Google'ın indekslemesini, sıralamasını veya trafik artışını garantili göstermemelisin.
8. Microsoft Clarity, PostHog ve erişilebilir benzeri analiz araçlarından yalnızca uygun kullanıcı izni, KVKK/GDPR uyumu, veri maskeleme, erişim kontrolü ve gereken canlı kurulum doğrulandıktan sonra yararlan. Kurulmuş bir eklentiyi, sitede çalışan izleme koduyla karıştırma.
9. Google Drive/Docs/Sheets veya diğer uygun belge araçlarıyla kaynak envanterini, izinli belgeleri, fotoğraf lisans kanıtlarını ve terminoloji/çeviri denetimlerini düzenle. Gizli/veri erişimi sınırlı materyalleri kontrolsüz biçimde üçüncü taraflara taşıma.
10. Yeni araçları, API modellerini veya otomasyonları önermeden önce mevcut ücretsiz altyapıyla çözülebilecek işleri ve bütçeyi değerlendir. Ücretli, yıkıcı, yayınlama veya veri paylaşan işlemleri uygun yetki ve güvenlik sınırları içinde tut.

### Kalite ve kontrol
11. Birleştirilmiş, kanıtlı ve özgün içerik üret; kullanıcıya gerçek yarar sağlamayan SEO sayfa şişirmesi, otomatik ve kontrolsüz çok dilli yayın, lisansı doğrulanmamış görsel, uydurma teknik özellik veya pazarlama iddiası yapma.
12. Kod ve veri değişikliklerinden önce etki/geri alma planını hazırla; sonrasında testleri, mobil arayüzü, erişilebilirliği, performansı, linkleri, canonical/hreflang/sitemap/structured-data uyumunu ve güvenliği denetle.
13. Yapılmamış işi yapılmış gibi sunma. Raporlarda ayrı ayrı belirt: **erişim doğrulandı / incelendi / değiştirildi / test edildi / dağıtıldı / engellendi veya tamamlanamadı**.
14. Kullanıcıya tek tek tekrar eden komutlar yaptırmak yerine kapsamlı analiz ve mantıklı toplu çözümler kullan; kapsam belirsiz veya riskliyse önce salt-okunur kontrol yap.
15. Bu kuralları yeni bir proje görevi üstlenirken tekrar incele; araçların erişilebilirliğini ve proje durumunu yeniden doğrula. Yalnızca geçmiş raporlara dayanma.

### Bağlantı örnekleri (2026-11-21, dinamik envanter)
GitHub, Supabase, ChatGPT otomasyonları, Firecrawl, Microsoft Clarity (Windsor.ai bağlantısı), PostHog, OpenSEO, Google Drive, Google Search Console, GA4 ve Bing Webmaster. **Bu liste sabit değildir**: eklenmiş, kaldırılmış veya bağlantısı değişmiş araçlar için oturumun güncel erişim durumunu kontrol et.

## Süreklilik ve dürüst sınır
Bu dosya GitHub deposunda saklanan, değişiklik geçmişi olan **kalıcı proje kaynağıdır**. Asistanın ChatGPT iç belleğine silinemez bir kayıt yazıldığı veya her yeni sohbette bu dosyanın kendiliğinden okunduğu anlamına gelmez. Yeni sohbetlerin aynı ilkeyi uygulaması için bu dosyanın bağlantısını ChatGPT Project Instructions / Proje Talimatları içinde tutmak ve işe başlarken dosyayı okumak en güvenilir yöntemdir.

*Son kabul edilen kullanıcı talebi: 21 Kasım 2026.*
