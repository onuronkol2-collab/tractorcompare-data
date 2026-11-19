import type { Locale } from "./locales.ts";

/** The official Sonalika INTERNATIONAL site describes listed configurations,
 * not independent tractor dynamometer results or a warranty of country fit.
 * Store raw source wording unmodified in Supabase; localize presentation only.
 */
export const EXPORT_PRODUCT_SOURCE_PREFIX = "International/export product sheet; listed configuration.";

export const SONALIKA_EXPORT_COPY: Record<Locale, {
  heading: string;
  note: string;
  hpLabel: string;
  hpDescription: (hp: number | string) => string;
}> = {
  "en": { heading: "International manufacturer listing — equipment may vary", note: "These values describe the configuration listed on Sonalika International's official product page. Transmission, tyres, 2WD/4WD and other equipment can vary by country and option. The manufacturer's “HP Category” is a power category, not a measured PTO output or independently verified rated engine power.", hpLabel: "Manufacturer HP category", hpDescription: (hp: number | string) => `Manufacturer-listed HP category: ${hp} HP; not a verified rated engine or PTO power.` },
  "tr": { heading: "Uluslararası üretici listesi — donanım değişebilir", note: "Bu bilgiler Sonalika International'ın resmî ürün sayfasındaki yapılandırmayı açıklar. Şanzıman, lastikler, 2WD/4WD ve diğer donanımlar ülkeye ve seçeneğe göre farklı olabilir. Üreticinin “HP Category” değeri bir güç sınıfıdır; ölçülmüş PTO gücü veya bağımsız olarak doğrulanmış nominal motor gücü değildir.", hpLabel: "Üreticinin HP kategorisi", hpDescription: (hp: number | string) => `Üreticinin belirttiği HP kategorisi: ${hp} HP; doğrulanmış nominal motor veya PTO gücü değildir.` },
  "zh": { heading: "制造商国际产品资料——配置可能不同", note: "这些数据对应 Sonalika International 官方产品页面所列配置。变速箱、轮胎、两驱/四驱和其他设备可能因国家及选装配置而异。制造商的“HP Category”是功率类别，并非实测 PTO 输出或独立验证的发动机额定功率。", hpLabel: "制造商标注的马力类别", hpDescription: (hp: number | string) => `制造商标注的马力类别：${hp} HP；并非已验证的发动机额定功率或 PTO 功率。` },
  "hi": { heading: "निर्माता की अंतरराष्ट्रीय सूची — उपकरण बदल सकते हैं", note: "ये आँकड़े Sonalika International की आधिकारिक उत्पाद वेबसाइट पर सूचीबद्ध विन्यास के हैं। ट्रांसमिशन, टायर, 2WD/4WD और अन्य उपकरण देश या विकल्प के अनुसार बदल सकते हैं। निर्माता का “HP Category” एक शक्ति श्रेणी है, न कि मापा गया PTO आउटपुट या स्वतंत्र रूप से सत्यापित रेटेड इंजन पावर।", hpLabel: "निर्माता की HP श्रेणी", hpDescription: (hp: number | string) => `निर्माता द्वारा दी गई HP श्रेणी: ${hp} HP; सत्यापित रेटेड इंजन या PTO शक्ति नहीं।` },
  "pt-br": { heading: "Ficha internacional do fabricante — equipamentos podem variar", note: "Os dados descrevem a configuração publicada na página oficial da Sonalika International. Transmissão, pneus, tração 2WD/4WD e outros equipamentos podem variar conforme o país e os opcionais. A “HP Category” do fabricante é uma faixa de potência, não uma potência de TDP medida ou potência nominal do motor verificada de forma independente.", hpLabel: "Categoria de potência do fabricante", hpDescription: (hp: number | string) => `Categoria de potência informada pelo fabricante: ${hp} HP; não é potência nominal do motor ou da TDP verificada.` },
  "fr": { heading: "Fiche internationale du constructeur — équipement variable", note: "Ces données correspondent à la configuration indiquée sur la page officielle de Sonalika International. Transmission, pneus, 2RM/4RM et autres équipements peuvent varier selon les pays et les options. La « HP Category » désigne une catégorie de puissance, pas une puissance à la PDF mesurée ni une puissance moteur nominale vérifiée indépendamment.", hpLabel: "Catégorie de puissance constructeur", hpDescription: (hp: number | string) => `Catégorie de puissance annoncée par le constructeur : ${hp} HP ; ni puissance moteur nominale ni puissance PDF vérifiée.` },
  "de": { heading: "Internationale Herstellerangaben — Ausstattung kann abweichen", note: "Die Angaben beziehen sich auf die Konfiguration auf der offiziellen Produktseite von Sonalika International. Getriebe, Bereifung, 2WD/4WD und weitere Ausstattung können je nach Land und Option abweichen. Die „HP Category“ ist eine Leistungsklasse, keine gemessene Zapfwellenleistung oder unabhängig geprüfte Motornennleistung.", hpLabel: "Hersteller-Leistungsklasse", hpDescription: (hp: number | string) => `Herstellerseitige Leistungsklasse: ${hp} HP; keine überprüfte Motornenn- oder Zapfwellenleistung.` },
  "ru": { heading: "Международная спецификация производителя — комплектации различаются", note: "Данные относятся к комплектации, указанной на официальной странице Sonalika International. Трансмиссия, шины, привод 2WD/4WD и другое оборудование могут различаться по странам и опциям. «HP Category» — это класс мощности, а не измеренная мощность ВОМ или независимо подтверждённая номинальная мощность двигателя.", hpLabel: "Класс мощности производителя", hpDescription: (hp: number | string) => `Указанный производителем класс мощности: ${hp} HP; это не подтверждённая номинальная мощность двигателя или ВОМ.` },
  "ja": { heading: "メーカーの国際仕様 — 装備は異なる場合があります", note: "数値は Sonalika International の公式製品ページに掲載された仕様です。変速機、タイヤ、2WD/4WD、その他の装備は国やオプションによって異なります。メーカーの「HP Category」は出力区分であり、測定された PTO 出力や独立検証済みのエンジン定格出力ではありません。", hpLabel: "メーカー公表の出力区分", hpDescription: (hp: number | string) => `メーカー公表の出力区分：${hp} HP。検証済みのエンジン定格出力や PTO 出力ではありません。` },
  "es": { heading: "Ficha internacional del fabricante — el equipamiento puede variar", note: "Estos datos describen la configuración publicada en la página oficial de Sonalika International. La transmisión, los neumáticos, la tracción 2WD/4WD y otros equipos pueden variar por país y opción. La «HP Category» del fabricante es una categoría de potencia, no una potencia de TDF medida ni una potencia nominal del motor verificada de forma independiente.", hpLabel: "Categoría de potencia del fabricante", hpDescription: (hp: number | string) => `Categoría de potencia indicada por el fabricante: ${hp} HP; no equivale a potencia nominal del motor o de la TDF verificada.` },
};

export function hasInternationalSonalikaContext(tractor: {
  brand_name: string;
  specifications: Array<{ canonical_key?: string | null }>;
}): boolean {
  return tractor.brand_name.toLocaleLowerCase("en-US") === "sonalika" &&
    tractor.specifications.some(spec => spec.canonical_key === "engine_hp_category");
}

export function isSonalikaExportSourceNote(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(EXPORT_PRODUCT_SOURCE_PREFIX));
}
