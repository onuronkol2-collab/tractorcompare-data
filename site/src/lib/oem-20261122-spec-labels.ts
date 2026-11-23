import type { Locale } from "./locales.ts";

/**
 * Exact-display-name translations for owner-approved, manufacturer-sourced
 * additions to the published catalogue on 22 November 2026.
 *
 * These labels MUST NOT rewrite model identities, evidence, raw OEM values,
 * qualifiers (optional/unknown) or measurement units. They are not evidence
 * for an original manufacturer's test standard or configuration availability.
 */
export const OEM_20261122_SPEC_LABELS: Record<string, Partial<Record<Locale,string>>> = {
  "Braking system": {
    tr:"Fren sistemi",zh:"制动系统",hi:"ब्रेक प्रणाली", "pt-br":"Sistema de freios",fr:"Système de freinage",de:"Bremssystem",ru:"Тормозная система",ja:"ブレーキシステム",es:"Sistema de frenos"
  },
  "Front axle type": {
    tr:"Ön aks tipi",zh:"前桥类型",hi:"अगले एक्सल का प्रकार","pt-br":"Tipo de eixo dianteiro",fr:"Type d’essieu avant",de:"Vorderachstyp",ru:"Тип переднего моста",ja:"前車軸の形式",es:"Tipo de eje delantero"
  },
  "PTO speed selection": {
    tr:"PTO hız seçimi",zh:"动力输出轴转速选择",hi:"पीटीओ गति विकल्प","pt-br":"Seleção de rotações da TDP",fr:"Choix des régimes de prise de force",de:"Zapfwellendrehzahl-Auswahl",ru:"Выбор частоты вращения ВОМ",ja:"PTO回転数の選択",es:"Selección de velocidades de la TDF"
  },
  "Clutch options": {
    tr:"Debriyaj seçenekleri",zh:"离合器选项",hi:"क्लच विकल्प","pt-br":"Opções de embreagem",fr:"Options d’embrayage",de:"Kupplungsoptionen",ru:"Варианты сцепления",ja:"クラッチの選択肢",es:"Opciones de embrague"
  },
  "Manufacturer-stated service interval": {
    tr:"Üreticinin belirttiği bakım aralığı",zh:"制造商标示的保养间隔",hi:"निर्माता द्वारा बताया गया सर्विस अंतराल","pt-br":"Intervalo de manutenção informado pelo fabricante",fr:"Intervalle d’entretien annoncé par le constructeur",de:"Wartungsintervall laut Hersteller",ru:"Межсервисный интервал по данным производителя",ja:"メーカー公表の整備間隔",es:"Intervalo de mantenimiento indicado por el fabricante"
  },
  "Manufacturer-quoted PTO power": {
    tr:"Üreticinin bildirdiği PTO gücü",zh:"制造商标示的动力输出轴功率",hi:"निर्माता के अनुसार पीटीओ शक्ति","pt-br":"Potência da TDP declarada pelo fabricante",fr:"Puissance à la prise de force annoncée par le constructeur",de:"Zapfwellenleistung laut Hersteller",ru:"Мощность ВОМ по данным производителя",ja:"メーカー公表のPTO出力",es:"Potencia de la TDF declarada por el fabricante"
  },
  "Manufacturer-listed clutch feature": {
    tr:"Üreticinin belirttiği debriyaj özelliği",zh:"制造商列出的离合器配置",hi:"निर्माता द्वारा बताई गई क्लच सुविधा","pt-br":"Recurso de embreagem informado pelo fabricante",fr:"Fonction d’embrayage mentionnée par le constructeur",de:"Vom Hersteller genanntes Kupplungsmerkmal",ru:"Особенность сцепления, указанная производителем",ja:"メーカー記載のクラッチ機能",es:"Función de embrague indicada por el fabricante"
  },
  "Manufacturer-listed implement side-shift feature": {
    tr:"Üreticinin belirttiği ekipman yan kaydırma özelliği",zh:"制造商列出的农具侧移功能",hi:"निर्माता द्वारा बताई गई उपकरण की पार्श्व स्थानांतरण सुविधा","pt-br":"Deslocamento lateral do implemento conforme o fabricante",fr:"Fonction de déport latéral d’outil selon le constructeur",de:"Seitliche Geräteverschiebung laut Hersteller",ru:"Боковое смещение навесного оборудования по данным производителя",ja:"メーカー記載の作業機横移動機能",es:"Desplazamiento lateral del implemento según el fabricante"
  },
  "Wheel arrangement": {
    tr:"Tekerlek düzeni",zh:"车轮布置",hi:"पहियों की व्यवस्था","pt-br":"Configuração das rodas",fr:"Disposition des roues",de:"Radanordnung",ru:"Компоновка колёс",ja:"車輪配置",es:"Disposición de las ruedas"
  }
};
export function oem20261122SpecLabel(name:string,locale:Locale):string|null {
  const exact=name.trim();
  const qualified=OEM_20261122_SPEC_LABELS[exact];
  if(!qualified)return null;
  // Preserve the exact manufacturer qualifier in English too: generic
  // canonical-key mappings otherwise reduce it to e.g. "PTO power".
  return locale==="en"?exact:(qualified[locale]||null);
}
