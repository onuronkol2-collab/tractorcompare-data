/** Literal user-interface copy for the eight future localized tractor education pages.
 * Translate exact fields; never copy English UI into another language's indexable page.
 */
export const EDUCATION_UI_SOURCE = [
 {id:"navigation",en:{
  breadcrumb:"Tractor learning centre",home:"Home",catalog:"Tractor catalogue",compare:"Compare tractors",
  searchLabel:"Search tractor parts and technical terms",
  searchPlaceholder:"Search: PTO, torque, hydraulics, piston...",
  },tr:{
  breadcrumb:"Traktör bilgi merkezi",home:"Ana sayfa",catalog:"Traktör kataloğu",compare:"Traktör karşılaştır",
  searchLabel:"Traktör parçalarında ve teknik terimlerde ara",
  searchPlaceholder:"Ara: PTO, tork, hidrolik, piston...",
  }},
 {id:"hero",en:{
  title:"Tractor parts and technical terms explained",
  lead:"Learn what tractor parts do, where they are, and what technical measurements mean in everyday farm work.",
  sections:"Practical learning topics",
  parts:"Physical parts",
  terms:"Technical terms",
  methods:"How we verify technical information"
  },tr:{
  title:"Traktörün parçaları ve teknik terimleri",
  lead:"Traktör parçalarının görevini, nerede bulunduğunu ve teknik ölçülerin tarlada ne anlama geldiğini sade örneklerle öğrenin.",
  sections:"Öğretici konu başlıkları",
  parts:"Gerçek parçalar",
  terms:"Teknik terimler",
  methods:"Teknik bilgileri nasıl doğruluyoruz?"
  }},
 {id:"parts",en:{
  heading:"What do tractor parts actually do?",
  intro:"Find each component's job, where it is and an everyday example. Exact layouts vary by model.",
  purpose:"What does it do?",location:"Where can you find it?",
  example:"An everyday example",caution:"Safety or comparison note"
 },tr:{
  heading:"Traktörün parçaları ne işe yarar?",
  intro:"Her parçanın görevini, yerini ve günlük bir örneğini öğrenin. Kesin yerleşim modele göre değişir.",
  purpose:"Ne işe yarar?",location:"Neresinde?",
  example:"Günlük örnek",caution:"Güvenlik veya karşılaştırma notu"
 }},
 {id:"terms",en:{
  heading:"What do the specifications mean?",
  intro:"Learn what each measurement describes before comparing the numbers on two tractors.",
  definition:"In simple words",example:"Example from farm work",
  caution:"Before you compare",readPart:"See the physical part"
 },tr:{
  heading:"Teknik özellikler ne anlama gelir?",
  intro:"İki traktörün katalog rakamlarını karşılaştırmadan önce her ölçünün neyi anlattığını öğrenin.",
  definition:"Kısaca ne demek?",example:"Tarladan örnek",
  caution:"Karşılaştırmadan önce",readPart:"İlgili gerçek parçayı gör"
 }},
 {id:"cases",en:{
  heading:"Five real-world questions worth understanding",
  intro:"These simplified examples are for learning, not a diagnosis of a particular tractor.",
  situation:"What you may notice",explanation:"Why can this happen?",
  remember:"Safe takeaway",related:"Read the related technical term"
 },tr:{
  heading:"Tarlada karşılaşabileceğiniz beş önemli soru",
  intro:"Bu sade örnekler öğrenmek içindir; belirli bir traktörde arıza teşhisi değildir.",
  situation:"Ne fark edebilirsiniz?",explanation:"Neden böyle olabilir?",
  remember:"Güvenli yaklaşım",related:"İlgili teknik terimi öğren"
 }},
 {id:"articles",en:{
  guide:"In-depth technical guide",toc:"On this page",
  meaning:"The fair-comparison rule",related:"Related technical definitions",
  sources:"Source verification and limitations",other:"Continue learning",
  read:"Read the guide"
 },tr:{
  guide:"Kapsamlı teknik rehber",toc:"Bu yazıda",
  meaning:"Adil karşılaştırmanın kuralı",related:"İlgili teknik terimler",
  sources:"Kaynak doğrulama ve sınırlar",other:"Öğrenmeye devam",
  read:"Rehberi oku"
 }},
 {id:"source",en:{
  heading:"Sources and photographs",
  intro:"Content is based on technical explanations and published documentation; it is not a claim of personal field testing.",
  photo:"Illustrative licensed tractor photo, not an internal cutaway.",
  safe:"Follow the exact tractor and implement manuals for servicing, connection and safety instructions.",
  empty:"No matching part or term was found.",
  openPhoto:"Open the licensed photograph at full size."
 },tr:{
  heading:"Kaynaklar ve fotoğraflar",
  intro:"İçerik teknik açıklamalara ve yayımlanmış belgelere dayanır; kişisel saha testi yapıldığını iddia etmez.",
  photo:"Lisanslı temsilî traktör fotoğrafı; iç parçaların kesit görüntüsü değildir.",
  safe:"Bakım, bağlantı ve güvenlik için traktörün ve ekipmanın kendi kılavuzunu izleyin.",
  empty:"Aradığınız parça veya terim bulunamadı.",
  openPhoto:"Lisanslı fotoğrafı tam boy aç."
 }}
] as const;
