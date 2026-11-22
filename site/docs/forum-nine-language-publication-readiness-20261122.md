# TractorVS forum — 9 dilde yayın öncesi kapsamlı kalite raporu

**Denetim tarihi:** 22 Kasım 2026  
**Konu:** 2026 Traktör Bayi Memnuniyeti Sıralaması: Markalar ve Puanlar  
**Topic ID:** `713ab252-a925-4ab7-b2c8-a30ce5b86706`  
**Kaynak hash:** `0102e8edcd864b285733fb30cad4d8f1`  
**Dil kapsamı:** en, de, fr, es, pt-br, ru, zh, ja, hi.

## Sonuç — teknik yayın hazırlığı

1. Türkçe kaynak, `published` ve `translation_consent=true`; hash kaynağın tamamıyla eşleşiyor.
2. Dokuz dilde **tam başlık ve gövde**, aynı dokuz marka, aynı dokuz tablo satırı ve kaynakla aynı marka-rank-puan eşleşmeleri bulundu.
3. Dört araştırma kaynak URL'si bütün dillerde tam olarak eşleşiyor. Bölüm başlığı, madde listesi ve tablo biçimiyle ilgili önceki testler geçmiş.
4. 2026 araştırmalarının temel verileri yeniden kamuya açık 2026 kaynaklarıyla doğrulandı:
   - [CLIMMAR duyurusu (10 Kasım 2026)](https://www.climmar.com/news/climmar-presents-dealer-satisfaction-index-at-eima) ve [Mechaman (18 Kasım 2026)](https://www.mechaman.nl/artikel/20261118/trekkerdealers-minder-tevreden-over-fabrikanten-john-deere-enige-stijger/): 13,7 / 13,2 / 13,1 gibi Avrupa marka puanları; 10 katılımcı ülke ile sekiz ülke/561 yanıt açıklamaları ayrı tutuluyor.
   - [Rushlane FADA DSS 2026](https://www.rushlane.com/indias-largest-auto-brands-arent-no-1-in-dealer-satisfaction-fada-study-12554950.html): Swaraj 788 puan; 2.045 geçerli yanıt **tüm araç segmentlerinden**, sadece traktörlerden değil.
   - [NAEDA 2026 ödül duyurusu](https://www.equipmentdealermagazine.com/naeda-announces-2026-dealers-choice-and-gold-level-award-winners/): Yanmar `Dealer's Choice`, TYM `Gold Level`; ödüller gerçek traktör mekanik arıza istatistikleri anlamına gelmiyor.
5. `public.tc_forum_contextual_facts_equal` Fransızca `1er` ve Çince/Japonca `年/月/日` yerelleştirmelerini tarih bağlamına göre kontrol ediyor. Sadece `source_locale=tr` ve `fr/zh/ja` için çalışıyor; diğer diller eski sıkı kontrolde.
6. Negatif testlerde değiştirilmiş gün/ay/yıl, tarih aralığı, araştırma puanı ve fiziksel birim reddediliyor. Yeni `scripts/tractor-forum-manual-translation-qa.mjs` marka-rank-puanı birlikte doğruluyor. Aynı sayıların iki markaya yanlış atanması artık hata.
7. Supabase'de `seo_approved=false`, `state=needs_review`, `reviewed_by_model=NULL` olan dokuz çeviri **gizli**. Anonim ziyaretçiler yalnız Türkçe konuyu görüyor. Edge v21 sadece kontrol modu, otomatik ücretli çeviri sağlayıcısı yok.
8. Site `tc_forum_localized_topics` görünümünde tüm on dil için aynı kaynak slug'ı kullanıyor. `ForumTopic` bileşeni canonical, hreflang, özgün kaynak bağlantısı ve SEO dışı bırakma durumlarını `SiteLayout` üzerinden işliyor. `forum-sitemap.xml` sadece `seo_ready` konuları içeriyor. Yeni sayfalar ancak daha sonraki **onaylı public snapshot + statik build** ile oluşturulabilir.
9. Hintçe taslaktaki `इसे Same से सीधे नहीं तुलना की जा सकती` ifadesi doğal dilbilgisiyle `इसकी तुलना Same से सीधे नहीं की जा सकती` olarak düzeltildi; marka, tarih, sayı, URL değişmedi.

## Yayın için kalan gerçek kapı

**Bağımsız tam metin editoryal/dil uzmanı incelemesi yapıldı mı? Hayır.** ChatGPT'nin aynı metni kendi başına ikinci defa okuması, bağımsız dilsel inceleme sayılmaz. Yapısal/sayısal testler ve internette kaynak taraması **dilsel akıcılığın, her cümlenin anlamının ve kültürel uygunluğun sıfır hatayla korunduğunun kanıtı değildir**.

Bu nedenle dokuz çeviri **yayına teknik olarak hazırlanmış özel taslaklar** olarak kalır. Gerçek olmayan bir `reviewed_by_model` değeri veya sahte editör imzası girilmez; `state=ready` ya da `seo_approved=true` yapılmaz.

### Gerçek bağımsız editoryal inceleme listesi

- [ ] İngilizce: Tüm cümlelerin Türkçe kaynakla anlam ve üslup eşleşmesi; bayi memnuniyeti vs. teknik arıza ayrımı.
- [ ] Almanca: Traktorhändler / Hersteller / Händlerbeziehung ayrımları; kategori 8,4 gibi alt skorlar.
- [ ] Fransızca: Concessionnaire / constructeur ilişkisi, `1er septembre` doğru takvim karşılığı.
- [ ] İspanyolca: Concesionario / fabricante / fiabilidad mecánica farkı ve doğal dil.
- [ ] Brezilya Portekizcesi: `trator`, `concessionário` ve `revendedor` terimlerinin Brezilya kullanımına uygunluğu.
- [ ] Rusça: İlgili araştırma ve kaynakla anlamsal bağ, çeviri akıcılığı ve teknik güvenilirlik ayrımı.
- [ ] Çince: 经销商满意度 ile 机械故障率 ayrımı; araştırma tarihleri `年/月/日` ve puan anlamı.
- [ ] Japonca: 販売店満足度 ile 機械的故障率 ayrımı; araştırma takvimi ve akademik terim seçimi.
- [ ] Hintçe: डीलर संतुष्टि / यांत्रिक खराबी ayrımı, dilbilgisi, yerel sayı ayraçları.

**Bu işaretler ancak gerçekten bağımsız incelenip kaydedildiğinde tamamlanır.** Kullanıcı son editoryal onayı verse dahi doğrulanmamış olgular otomatik geçmez.

## Yayın işlemi öncesi otomatik kontrol

Canlı Supabase SQL Editor'da şu **salt okunur** dosyayı çalıştır:

`supabase/verification/verify_nine_locale_forum_prepublication.sql`

Başarılı sonuç, dokuz markanın skorlarını satır satır ve dört URL'yi doğrular; gizli taslakların yetkisiz kullanıcıya görünmediğini kanıtlar. Gerçek dilsel onayın yerine geçmez.

**Yayın sürecinde:** editör incelemesi → inceleme izi / imza → Supabase kaynak hash / RLS / QA trigger → `ready` + `seo_approved=true` → onaylı toplu statik yeniden derleme → 10 dil URL'sini kontrol et → canonical / reciprocal hreflang / sitemap / schema / 200 / mobil render denetimi. Anlaşılmayan ya da yayına uygun olmayan dil bekletilir, diğer diller etkilenmez.

## Maliyet ve geri dönüş

Hiçbir ücretli Azure / Cloudflare M2M100 / Gemini / DeepL çeviri isteği başlatılmadı. Supabase ve statik site için mevcut maliyet güvenliği korunuyor. Gizli `needs_review` satırları, kaynak metin ve mevcut `published` Türkçe içerik değiştirilmeden kalır. Site yayını için herhangi bir manuel yeni PR bu kontrolleri tekrar çalıştırmalıdır.
