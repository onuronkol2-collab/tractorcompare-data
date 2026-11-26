// Editorial title policy: optional brand label must never displace meaning.
// 60 is a readability target, not an indexing rule. Unknown headlines stay intact.
export function editorialSearchTitle(headline){
 const branded=headline+" | TractorVS";
 return branded.length<=60?branded:headline;
}
const reviewed={
 "pto-and-power-take-off":{tr:["Traktörde PTO (Kuyruk Mili) Nedir? 540, 540E ve 1000 Devir Rehberi","Traktörde PTO (Kuyruk Mili): 540, 540E ve 1000 Devir"]},
 "tractor-hydraulic-lift-explained":{
 tr:["Traktörde Hidrolik Kaldırma Kapasitesi Nedir? 610 mm, Debi ve Basınç","Traktör Hidrolik Kaldırma: 610 mm, Debi ve Basınç"],
 en:["Tractor Hydraulic Lift Capacity Explained: Flow, Pressure and 610 mm","Tractor Hydraulic Lift: Flow, Pressure and 610 mm"]
 }
};
export function technicalGuideSearchTitle(slug,locale,headline){
 const pair=reviewed[slug]?.[locale];
 return pair&&headline===pair[0]?pair[1]:headline;
}
