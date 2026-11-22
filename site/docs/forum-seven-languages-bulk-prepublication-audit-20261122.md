# TractorVS — Yedi forum dilinin toplu yayın öncesi derin denetimi

**Tarih:** 22 Kasım 2026  
**Konu:** 2026 Traktör Bayi Memnuniyeti Sıralaması: Markalar ve Puanlar  
**Topic ID:** `713ab252-a925-4ab7-b2c8-a30ce5b86706`  
**Türkçe kaynak MD5:** `0102e8edcd864b285733fb30cad4d8f1`  
**Kapsam:** İspanyolca (`es`), Fransızca (`fr`), Hintçe (`hi`), Japonca (`ja`), Brezilya Portekizcesi (`pt-br`), Rusça (`ru`) ve Çince (`zh`). İngilizce (`en`) ve Almanca (`de`) zaten yayında, bu çalışmada değiştirilmedi.

## Gerçekleştirilen toplu inceleme

1. Canlı Supabase'den özgün yayımlanmış Türkçe konu, `translation_consent=true`, değişmemiş `title+body` MD5 ve yedi özel taslak doğrulandı.
2. **96 kaynak paragraf × 7 dil:** Her taslak tam 96 paragraf, 21 Markdown başlığı, 11 Markdown tablo satırı, 4 kaynak URL'si, aynı kaynak hash ve doğru hedef dilde. Hiçbir dilde tespit edilen URL kaybı, yanlış marka-sıra-puan çifti veya tehlikeli HTML/JS enjeksiyon kalıbı yok.
3. Türkçe metin dokuz anlamlı parçaya ayrıldı; yedi hedef dilde mevcut gerçek çevirilerin tamamı bağımsız ikinci Google Translate motoruyla `es/fr/hi/ja/pt/ru/zh → tr` çevrilerek **63/63 gerçek makine geri çevirisi** toplandı. Kaynak metin, mevcut hedef metin ve Google geri çeviri aynı özel Google Sheets belgesinde sütunlar halinde saklandı.
4. Google Sheets `DETECTLANGUAGE` ile yedi taslağın hedef dilleri de ayrı doğrulandı (**7/7 kod eşleşmesi**, `pt-br` için `pt` beklenir).
5. Yedi dilde kaynak anlamını gereğinden belirsiz anlatan giriş ifadeleri güncellendi: Swaraj'ın **Hindistan traktör** kategorisindeki liderliği ile Yanmar'ın **Kuzey Amerika traktör üreticileri** kategorisindeki birinciliği açıkça ayrıldı. Kaynak sayılar, marka adları, tarih, teknik birimler ve URL'ler değişmedi. Supabase değişiklikleri yalnız `needs_review` ve `seo_approved=false` olan kaynak-hash-eşleşen taslaklarda yapıldı.
6. Düzeltmeden sonra güncellenen yedi ilk bölüm yeniden ters çeviriye sokuldu. Toplam **63/63** hücre gerçek sonuç verdi. Kaynak/taslak kıyaslamasında **0 temel yapısal/URL/marka kaybı**. İkinci Google motorunun kendi çıktısında **7 araştırılması gereken biçim/özel isim farkı** bulundu. Google çıktıları hiçbiri otomatik hedef taslağa yazılmadı.
7. `supabase/verification/verify_forum_remaining_seven_bulk_qa.sql` sorgusu gerçek Supabase'de başarılı: `tc_forum_fact_tokens`, Fransızca/Rusça bölgesel binlik ayraçları, Çince/Japonca takvim gösterimleri, `tc_forum_language_issue`, kaynak URL dizileri, her dokuz marka-sıra-puan eşleşmesi, 96 paragraf ve anonim yayın görünürlüğü denetlendi.
8. QA notları yalnız özel taslaklarda `CROSS_ENGINE_QA_20261122` olarak kaydedildi; hiçbir dil `ready`, `seo_approved=true` veya sahte `reviewed_by_model` değeri almadı.

## Bölüm bazlı çapraz motor inceleme bulguları

| Dil | Geri çeviri | Mevcut taslakta otomatik saptanan yapısal hata | Yalnız Google geri çevirisinde not |
|---|---:|---:|---|
| İspanyolca (es) | 9/9 | 0 | Bölüm 2: Markdown tablo satır biçimi |
| Fransızca (fr) | 9/9 | 0 | 0 |
| Hintçe (hi) | 9/9 | 0 | Bölüm 1, 2, 5: CLAAS özel ismi; bölüm 6: Same özel ismi |
| Japonca (ja) | 9/9 | 0 | Bölüm 8: Markdown başlık biçimi |
| Brezilya Portekizcesi (pt-br) | 9/9 | 0 | 0 |
| Rusça (ru) | 9/9 | 0 | 0 |
| Çince (zh) | 9/9 | 0 | Bölüm 6: Same özel ismi |

**Yorum:** İkinci makine motorundaki bu biçimsel sapmalar, kaynak metni doğru gösteren mevcut ChatGPT taslağında otomatik olarak aynı kusurun bulunduğunu kanıtlamaz. Buna karşılık bütün Google karşılaştırmalarının geçmesi, hedef dilde her cümlenin doğal ve kusursuz yazıldığını veya insan editör onayı alındığını da **kanıtlamaz**.

## 2026 kaynak ve terminoloji çapraz kontrolleri

- [CLIMMAR 2026 EIMA DSI](https://www.climmar.com/news/climmar-presents-dealer-satisfaction-index-at-eima): 10 Kasım 2026, Avrupa genel ortalama 12,5 / 20; 10 ülke; 15 alan ve 73 soru.
- [Mechaman, 18 Kasım 2026](https://www.mechaman.nl/artikel/20261118/trekkerdealers-minder-tevreden-over-fabrikanten-john-deere-enige-stijger/): Same 13,7; Deutz-Fahr 13,2; CLAAS 13,1; 8 ülke / 561 bayi yanıtı. CLIMMAR ile farklı kapsam anlatımları birbirine karıştırılmıyor.
- [FADA 2026 araştırması, Rushlane 3 Eylül 2026](https://www.rushlane.com/indias-largest-auto-brands-arent-no-1-in-dealer-satisfaction-fada-study-12554950.html): Swaraj 788 / 1.000; 2.045 geçerli yanıt yalnız traktör değil, kapsamdaki araç kategorilerinin toplamı.
- [NAEDA 2026 resmî ödül haberi](https://www.equipmentdealermagazine.com/naeda-announces-2026-dealers-choice-and-gold-level-award-winners/): Yanmar *Dealer's Choice*, TYM *Gold Level*; 1.745 yanıt sadece traktörlerden değil, farklı ekipman sınıflarından.
- 2,6 **puanlık** Avrupa aralığı, traktör arıza olasılığında **%2,6 fark** değildir. İkinci makinenin bazen marka isimlerini veya fiziksel birimleri çevirmesi, gerçek bilgi olarak kabul edilmez.

## Yayın kararı, gizlilik ve sonraki kalite kapısı

**Toplu teknik + olgusal QA: Geçti (7/7).**  
**Bağımsız insan editörünün tam dilsel onayı: Henüz yok (0/7).**  
**Canlı yayın: Hayır, bu çalışma hiçbir yeni dili yayımlamadı.**

Bu verilerle otomatik toplu yayın doğru değildir. Her dilin resmî terimler, üslup, kültürel uygunluk ve Türkçe kaynak anlamı için bağımsız son okuması belgelenmeli; bu yapıldığında yalnız ilgili dil için GitHub/DB yayın kapısı, anonim RLS, public snapshot, Cloudflare HTTP 200, canonical, reciprocal hreflang, XML sitemap, Schema.org ve mobil görünüm kontrolleri ayrı ayrı geçmelidir. Onaylanmayan diğer diller taslakta kalır.

**Maliyet:** Ücretli Azure, Cloudflare çeviri API'si, Gemini ya da DeepL çağrısı yapılmadı; mevcut site barındırma ve güvenliği değişmedi.

**İzleme:** Özel Google Sheets'te `7 Dil Ters Çeviri 2026` (63 kaynak/hedef/Google karşılaştırma satırı) ve `7 Dil Yayın Kararı` (7 dil, durum ve otomatik tespit) sekmeleri bulunmaktadır. Kullanıcıya ait bu özel dosyanın bağlantısı herkese açık GitHub dokümanına bilerek konmadı.
