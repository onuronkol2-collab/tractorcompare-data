# TractorVS — Çok yönlü site denetimi ve düzeltme kaydı (22 Kasım 2026)

## Kapsam ve karar
Kullanıcı talebi: tüm önemli sayfalarda mobil okunabilirlik, yazı boyutu, SEO/GEO, kalite, özgünlük, erişilebilirlik, güvenlik ve performans. Kanıt yoksa başarı/yayın iddiası yoktur. İlk faz mevcut tasarım kimliğini ve 10 dili koruyan hedefli CSS düzeltmesidir; tam site yenilemesi değildir.

## Gözlemlenen kanıtlar
- Canlı Türkçe ana sayfa, katalog, karşılaştırma, forum, makale arşivi; İngilizce ana sayfa ve robots/sitemap erişilebilir. Canlı sayfalarda kendine işaret eden canonical ve index/follow mevcut.
- Genel sitemap-index üzerinde forum, görsel ve genel sitemap bulundu. Bu sonuç Google indeksi veya trafik artışı değildir.
- Katalog 388 yayımlanmış modeli SSR üzerinden listeliyor. Açık Issue #218 eski ölçümde yaklaşık 790 KB HTML ve mobil performans için kanıta dayalı sayfalama öneriyor. Aynı modelin 10 dildeki kalıcı URL ve aranabilirliği korunmadan otomatik sayfalama uygulanamaz.
- 21 Kasım 2026 tarihli OpenSEO 50 sayfalık raporunda 41 uzun title, 2 kısa açıklama, 1 uzun açıklama ve crawl page-limit uyarısı var. Title 60 karakter mutlak SEO kuralı değildir; model yılı, varyant, pazar ve ölçüm koşulları silinmemeli.
- Search Console 23 Ekim-19 Kasım 2026 döneminde 7 URL, toplam 16 gösterim ve 1 tıklama döndürdü. Yeni sayfalar henüz rapora düşmemiş olabilir. GSC geçmiş dönem verisi güncel üretim performansı değildir.
- Supabase security advisors 15 RLS açık/politika yok bilgi uyarısı ve leaked password protection uyarısı döndürüyor. Özel araştırma tablolarını herkese açmak çözüm değildir; forumun mevcut passwordless stratejisini bozmamak gerekir. Kullanılmayan indeks istatistikleri tek başına indeks silme gerekçesi değildir.
- Lisanslı fotoğraf PR #457/#459/#460, forum performansı PR #458, forum mobil/üye kartı #434/#436 başka iş akışlarında yürürlükte. Çakışan dosyalar editlenmemeli.

## Bu PR içinde yapılanlar
- Bilgilendirici ana metinler, model teknik kartı ölçüm koşulu ve kaynak bağlantıları, katalog yan filtre etiketleri ve karşılaştırma koşul uyarıları için tipografi/taşma düzeltmeleri.
- Sadece CSS ve ona özel birim/tarayıcı testleri eklendi. Forum bileşenleri, analitik izinleri, RLS, lisanslar, model teknik içeriği, schema.org, canonical, hreflang ve sitemap değişmedi.
- Ziyaretçiye okuma kolaylığı hedeflenir; SEO puanı veya WCAG tam uygunluğu otomatik garantili değildir.

## Tamamlama kapıları ve devam sırası
1. PR kalite kontrolleri: site testleri, prod build, Golden Rule, Playwright çoklu tarayıcı+mobil, axe-core ve CodeQL; ardından yalnız güvenli birleşim.
2. Ana dal birleştirmesinden sonra Cloudflare gerçek dağıtım ve computed CSS değerleri ayrıca doğrulansın.
3. #218 katalog ilk HTML byte, INP/LCP/CLS ve 10 dilin model-link kimliğini koruyan sayfalama prototipi.
4. #451 kaynaklı lastmod geçmişi, #404 Search Console indeks kapsamı ve yeni forum kayıt/oturum davranışı ayrı doğrulansın.
5. #196 önceki OpenSEO bulguları için yalnız gerçek sorunlara yönelik başlık/açıklama iyileştirmesi; her tür slug ve kaynak kimliği korunmalı.

## Kaynaklar
Google Search Central: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
Google faceted navigation: https://developers.google.com/crawling/docs/faceted-navigation
WCAG 2.2 text resize: https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html
OpenSEO proje raporları: https://app.openseo.so/p/8d001303-71fa-4e67-b066-18145dbd303d
