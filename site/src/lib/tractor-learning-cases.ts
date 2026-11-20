/** Original practical scenarios written for non-technical tractor readers.
 * They are educational examples, not fault diagnosis or field-test claims.
 */
export const TRACTOR_LEARNING_CASES=[
 {
  id:"more-power-but-slipping",termId:"traction",
  title:{tr:"Traktör güçlü ama neden patinaj yapıyor?",en:"Why does a powerful tractor still slip?"},
  situation:{tr:"İki traktörün motoru aynı güçte. Birinin tekerlekleri ıslak tarlada boşa dönüyor, diğeri daha rahat ilerliyor.",
   en:"Two tractors have similar engine power. In wet soil one spins its tyres while the other keeps moving."},
  explanation:{tr:"Motorun gücü, tekerleklerin toprağa tutunabildiği kadar işe dönüşür. Lastiklerin durumu, basıncı, ağırlık dağılımı, zemin ve dört çeker düzeni birlikte önemlidir. Yalnızca yüksek beygir gücüne bakmak yanıltır.",
   en:"Engine power only helps when tyres can transfer it to the ground. Tyre condition, inflation, weight balance, soil and 4WD all matter. Higher horsepower alone does not guarantee better traction."},
  remember:{tr:"Patinaj sorununu tek başına motor arızası saymayın. Lastik ve balast ayarını modelin kılavuzuna göre değerlendirin.",
   en:"Tyre slip alone does not prove an engine fault. Follow the exact tractor and tyre guidance for ballast and tyre pressure."}
 },
 {
  id:"lift-rating-versus-implement",termId:"rear-lift",
  title:{tr:"3.000 kg kaldırma kapasitesi her üç tonluk ekipmana yeter mi?",en:"Does a 3,000 kg lift rating suit every three-tonne implement?"},
  situation:{tr:"İki traktörün kataloğunda 3.000 kg yazıyor. Ancak ağır bir ekipman bir traktörün arkasında diğerinden daha fazla denge sorunu oluşturabiliyor.",
   en:"Two brochures say 3,000 kg lift capacity. Yet the same heavy implement may affect the balance of the two tractors differently."},
  explanation:{tr:"Kaldırma ölçüsünün askı uçlarında mı yoksa 610 mm geride mi yapıldığı fark yaratır. Yük, traktörden uzağa uzandıkça kaldırma ve denge zorlaşabilir. Arka kaldırma kapasitesi, güvenli ekipman ağırlığının tek ölçüsü değildir.",
   en:"The test point matters: at the link ends or 610 mm behind them. As a load extends farther behind the tractor, leverage and stability can change. Lift rating alone does not establish safe implement weight."},
  remember:{tr:"Ekipmanın ağırlığını, ağırlık merkezini, ön denge ihtiyacını ve aks sınırlarını birlikte kontrol edin.",
   en:"Check implement mass, centre of gravity, front ballast requirements and axle limits together."}
 },
 {
  id:"economy-pto",termId:"pto-speeds",
  title:{tr:"540E neden her ekipman için doğru ayar değildir?",en:"Why isn't 540E suitable for every PTO implement?"},
  situation:{tr:"Traktörde 540 ve 540E yazıyor. İkisi de ekipmanı 540 devire çıkarabildiğine göre her zaman ekonomik olanı seçebilir miyiz?",
   en:"A tractor offers both 540 and 540E. Both can turn an implement at 540 rpm, so should you always choose the economy mode?"},
  explanation:{tr:"540E, uygun traktörlerde kuyruk milini 540 rpm döndürürken motoru daha düşük devirde çalıştırabilir. Bu hafif işlerde avantaj sağlayabilir, ancak ağır ekipmanın ihtiyaç duyduğu güç ve tork her zaman bu modda karşılanmaz.",
   en:"On compatible tractors, 540E can maintain 540 rpm at the PTO while the engine runs more slowly. This may help light-duty work, but it may not provide the response or usable output a heavily loaded implement needs."},
  remember:{tr:"Önce traktör ve ekipman kılavuzlarındaki devir, güç ve güvenlik talimatlarını okuyun. Korumasız şafta yaklaşmayın.",
   en:"Check the tractor and implement manuals for speed, power and safety limits. Keep clear of an unguarded rotating shaft."}
 },
 {
  id:"hydraulic-flow-vs-pressure",termId:"hydraulic-flow",
  title:{tr:"Kepçenin yavaş hareket etmesi basıncın düşük olduğu anlamına mı gelir?",en:"Does a slow loader mean hydraulic pressure is low?"},
  situation:{tr:"Bir traktörde kepçe yavaş kalkıyor. Katalogda yüksek hidrolik basınç yazdığı için bunun imkânsız olduğunu düşünebilirsiniz.",
   en:"A loader raises slowly even though the brochure lists high hydraulic pressure."},
  explanation:{tr:"Yağ debisi, bir dakikada hareket eden yağ miktarıdır; basınç ise silindirde oluşabilecek kuvvetle ilgilidir. Hareket hızı, kullanılabilir debiye ve silindir boyutuna bağlıdır. Basıncın yüksek olması tek başına hızlı hareket demek değildir.",
   en:"Flow describes how much oil moves per minute; pressure relates to the force a cylinder can produce. Movement speed also depends on available flow and cylinder size. High pressure alone does not guarantee quick movement."},
  remember:{tr:"Sorunu tek veriden teşhis etmeyin. Yağ kaçağı veya yüksek basınçlı hortumları elle kontrol etmeyin; güvenli servis talimatlarını izleyin.",
   en:"Do not diagnose a fault from one specification. Never test high-pressure hydraulic leaks with your hand; follow safe service instructions."}
 },
 {
  id:"hot-engine-not-just-radiator",termId:"cooling",
  title:{tr:"Motor harareti artınca sorun kesin radyatör müdür?",en:"Does a hot engine always mean the radiator is faulty?"},
  situation:{tr:"Uzun süren işte hararet göstergesi yükseliyor. İlk akla gelen parça radyatör oluyor.",
   en:"The temperature gauge rises during a long field task. You may immediately suspect the radiator."},
  explanation:{tr:"Radyatör ısıyı dışarı verir; fan, devirdaim pompası, termostat, soğutma sıvısı ve hava akışı da bu sürece katkı sağlar. Tek bir belirti, arızanın hangi parçada olduğunu kanıtlamaz.",
   en:"The radiator releases heat, but the fan, coolant pump, thermostat, coolant level and airflow also matter. A single symptom does not identify the failed component."},
  remember:{tr:"Üretici kılavuzundaki güvenli durdurma adımlarını izleyin. Sıcakken radyatör veya genleşme kabı kapağını açmayın.",
   en:"Follow the manufacturer's safe shutdown procedure. Never open a hot radiator or coolant pressure cap."}
 }
] as const;
