# TractorVS — 2020–2027 forum konusunun DeepL destekli yayın QA kaydı

**Tarih:** 23 Kasım 2026  
**Konu kimliği:** `9f82b9f3-7aab-41ee-8588-a0a383f80694`  
**Kaynak:** yayımlanmış ve çeviri izni açık Türkçe forum konusu  
**Kaynak özeti:** `4934067b89daab231249bbe7e4e8fbf3`  
**Telif / kişisel veri:** kaynak yalnız kamuya açık, çeviri izni verilmiş konudur; başka kullanıcıya ait özel kayıt aktarılmamıştır.

## Süreç ve bağımsız incelemenin niteliği

1. Dokuz hedef dil `en,de,fr,es,pt-br,ru,zh,ja,hi` için ChatGPT (GPT-6) ile daha önce hazırlanan tam metinleri Supabase'den salt-okunur biçimde karşılaştırmaya aldık.
2. Bağımsız **DeepL Free** çevirmeniyle Türkçe kaynağın **93 paragrafının tamamı**, her hedef dil için yeniden çevrildi: **9 × 93 = 837 bağımsız referans paragrafı**. DeepL Free'ın 5.000 karakterlik çağrı sınırı nedeniyle yaklaşık 2.900 karakterlik bölümler hâlinde, dil başına bir hedefle çalışıldı. İlk büyük toplu istekte hız sınırı görüldü; işlem güvenli daha küçük isteklerle tamamlandı.
3. GPT-6, mevcut çeviri ile DeepL referansını **paragraf konumunda** karşılaştırdı; düşük benzerlik taşıyan bölümleri model kodu, güvenlik ve anlam yönünden ayrıca değerlendirdi. Bağımsız referans çeviri *mutlak otorite kabul edilmedi*; DeepL'nin marka adlarını gereksiz çevirdiği veya Japonca powershift terimini hatalı yazdığı örneklerde orijinaldeki doğru ifadeler korundu.
4. DeepL Write ile `EN-US,DE,FR,ES,PT-BR,JA,ZH-HANS` dillerinde ek dilbilgisi kontrolü gerçekleştirildi. `RU` ve `HI` DeepL Write tarafından desteklenmiyor; bu iki dilde de **93/93 bağımsız çeviri referansı** ve manuel/anlamsal karşılaştırma tamamlandı.
5. DeepL Write bazen Markdown `##`, `**`, kaynak URL'si veya `C` vites aralığı gibi teknik ayrıntıları bozduğu için **hiçbir DeepL çıktısı otomatik olarak yayımlanmadı**.
6. Somut iki düzeltme Supabase'deki yayımlanmamış taslaklara uygulanıp yeniden sınandı: Japonca tekerlek ayrılması/paragraf 77 dilbilgisi hatası düzeltildi; Fransızca 8. bölümde bağımsız servis gözleminin gereğinden kesin sunulması giderildi.

**Şeffaflık:** Bu kayıt DeepL'nin bağımsız makine çevirisi ile GPT-6'nın karşılaştırmalı editoryal kontrolüdür; *insan anadil editörü onayı alındığı iddia edilmemektedir*. Yayın öncesi karar, kullanıcının açık 23 Kasım talebi ve mevcut bağımsız kontrol kanıtıyla verildi. Kaynakta belirsiz veya istatistik dışı gözlemler istatistik gibi sunulmadı.

## Supabase yapısal ve olgusal kontroller

| Denetim | Sonuç |
|---|---:|
| Güncel `source_hash` ile eşleşen dil | 9/9 |
| Tam paragraf sırası ve sayısı | 9/9 × 93 |
| Markdown başlık seviyesi/sırası | 9/9 × 22 |
| Markdown tablo satırı ve kolon şekli | 9/9 × 10 |
| Birebir dış kaynak URL'si | 9/9 × 9 |
| Sayı, tarih, model kodu ve başlık olguları | 9/9 |
| `tc_forum_language_issue` denetimi | 9/9 geçiş |
| Markdown `**` vurgu sayısı ve biçimi | 9/9 geçiş |
| Tekil URL/marka/model kimliği; 2027 henüz gelmedi uyarısı | korundu |

Kritik kaynak ayrımları: John Deere/Kubota/Deutz-Fahr resmî geri çağırma bildirimi = kayda geçmiş güvenlik sorunu; Farmers Weekly Fendt/CLAAS/CNH bağımsız tamir gözlemleri = arıza sıklığı verisi **değildir**. `147.900` ABD'de geri çağırılan traktör sayısıdır, arızalanan traktör sayısı değildir. 2027 henüz yaşanmadı; kaynaklar 22 Kasım 2026 itibarıyla sınırlandırıldı.

## Yayın ve dağıtım ayrımı

- **Veritabanı onayı:** 23 Kasımda 9/9 satır `ready, seo_approved=true`; `reviewed_by_model` alanında denetimin gerçek yöntemi belirtildi. İçerik `tc_forum_localized_topics` anonim görünümünde kaynak dahil 10/10 dil için `published, seo_ready=true` olarak doğrulandı.
- **Git ve Cloudflare:** Bu raporu `main` dalına güvenli PR ile birleştirmek Cloudflare Workers Builds üretim çalışmasını tetiklemek içindir. Site derlemesi ve **canlı HTTP 200, canonical, hreflang, forum sitemap, robots/indexability** kontrolleri ayrıca yapılmadan `canlı yayında` sonucu verilmemelidir.
- **Güvenlik:** GitHub/Supabase otomatik ücretli forum çeviri API işleyicileri yeniden etkinleştirilmedi. Anon RLS gizli taslakları koruyan kuralları değiştirilmedi; yalnız onaylı yayın görünümünde görünür hâle geldi.
- **İlgili issue:** [#479 — dokuz dilde bağımsız kalite kontrol ve yayın](https://github.com/onuronkol2-collab/tractorcompare-data/issues/479), [#471 — forum 12.000 karakter sınırı](https://github.com/onuronkol2-collab/tractorcompare-data/issues/471).

Bu rapor bir üretim dağıtım veya indeksleme başarısı belgesi **değildir**. Google indeksleme ayrıca takip edilmelidir.
