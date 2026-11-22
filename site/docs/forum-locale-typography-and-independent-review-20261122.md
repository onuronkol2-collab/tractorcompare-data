# TractorVS — Dokuz dilli forum yayın hazırlığında bağımsız dil ve tipografi incelemesi

Tarih: 22 Kasım 2026. Konu ID: `713ab252-a925-4ab7-b2c8-a30ce5b86706`. Kaynak hash: `0102e8edcd864b285733fb30cad4d8f1`.

## Uygulanan yeni düzeltmeler

- Yayımlanmamış dokuz taslağın tamamında yerel yüzde yazımı düzeltildi: Türkçe `%10` biçimi, İngilizce `10%`, Fransızca `10 %`, Rusça `10 %`, Çince `10%`, Japonca `10%`, Hintçe `10%`, Almanca/İspanyolca `10 %`, Brezilya Portekizcesi `10%` oldu. `%2,6` ve `%2.6` gösterimleri de anlam korunarak hedef dilde uygun sıraya alındı.
- Fransızca ve Rusça binlik ayraçlarının nokta yerine bölgeye uygun boşlukla (`2 045` / `2 045`, `1 745`, `1 000`) yazılması için güvenlik kısıtlamalı normalleştirme yöntemi hazırlandı.
- `tc_forum_locale_grouping_facts_equal` yardımcı fonksiyonu yalnız `fr` ve `ru` hedef dillerinde gruplanmış sayıları karşılaştırıyor; kaynakta `2.045` olup hedefte `2 046` yazıldığında, puan değeri değiştiğinde, tarih veya teknik birim farklılaştığında **FALSE** dönüyor. `anon` / `authenticated` doğrudan `EXECUTE` hakkı yok.
- Yeni `scripts/tractor-forum-manual-translation-qa.test.mjs` testleri ve salt okunur `supabase/verification/verify_forum_locale_grouping_facts.sql` dosyası yanlış sayıların kabul edilmediğini denetler.
- Genel `tc_forum_fact_tokens` ve sitenin başka RLS / teknik forum / ücretli API sistemi **değiştirilmiyor**.

## Bağımsız kaynak kontrolü

- [CLIMMAR 2026](https://www.climmar.com/news/climmar-presents-dealer-satisfaction-index-at-eima): Avrupa bayi memnuniyeti 12,5/20 ortalama; markalar arasındaki aralık 2,6 puan.
- [Mechaman, 18 Kasım 2026](https://www.mechaman.nl/artikel/20261118/trekkerdealers-minder-tevreden-over-fabrikanten-john-deere-enige-stijger/): Same, Deutz-Fahr ve CLAAS sıralaması ve alt veriler.
- [Rushlane, FADA DSS 2026](https://www.rushlane.com/indias-largest-auto-brands-arent-no-1-in-dealer-satisfaction-fada-study-12554950.html): Swaraj 788 / 1.000.
- [NAEDA, 30 Eylül 2026](https://www.equipmentdealermagazine.com/naeda-announces-2026-dealers-choice-and-gold-level-award-winners/): Yanmar Dealer’s Choice; TYM Gold Level. Farklı kaynaklarda TYM'nin “Overall Satisfaction” alt ölçütünde birinci olduğuna ilişkin haber de bulunuyor; bunu aynı ödül gibi göstermek yanlıştır.
- Karşılaştırmalarda **bayi memnuniyeti**, mekanik arıza sıklığı veya traktör güvenilirlik yüzdesi gibi sunulmaz; farklı kıtalardaki üç anket tek dünya sıralaması değildir.

## Diğer editoryal araçların yetenekleri ve doğrulama sınırı

LanguageTool'un ücretsiz dilbilgisi denetleyicisi İngilizce, Almanca, Fransızca, İspanyolca, Brezilya Portekizcesi ve Rusça gibi dilleri destekler; Çince/Japoncada yazım kontrolü zayıf, Hintçe listelenmemektedir. [Resmî destek listesi](https://help.languagetool.org/hc/en-us/articles/39254526141463-What-languages-does-LanguageTool-support).

Ücretsiz web denetimini başlatmak amacıyla bağlı tarayıcı aracı denenmiştir; aracın finansal erişim sınırı nedeniyle işlem **başlamamıştır**. Hesap bakiyesi artırılmamış, satın alma yapılmamış ve LanguageTool tarafından tarandığı **iddia edilmemiştir**.

**Ayrı bir dil editörü veya gerçek bağımsız dokuz dilli son okuma henüz tamamlanmış değildir.** Bu yüzden aynı yapay zekânın dil düzeltmesi ve yapısal kontrolleri bağımsız editoryal onay olarak kaydedilmemelidir.

## Yayın kapısı ve güvenlik

- Yayımlanan Türkçe kaynak ve kaynak hash değişmez.
- Dokuz çeviri `state=needs_review`, `seo_approved=false`, `reviewed_by_model=NULL` olmalı.
- Harici sağlayıcıdan ücretli çeviri yapma veya GitHub kuyruk `ONAY` / `TEST` yolunu yeniden açma.
- Ancak bağımsız son okuma ve imza tamamlandıktan sonra hedef diller tek tek `ready` / `seo_approved=true` olabilir.
- Sonraki aşamada public anonim görünüm, karşılıklı hreflang, canonical, sitemap, schema, Cloudflare statik yayın ve mobil render ayrı denetlenmelidir.

Bu rapor bir **teknik yayın hazırlığı** belgesidir; kendisi bağımsız dil editörü raporu veya Google indeksleme garantisi değildir.
