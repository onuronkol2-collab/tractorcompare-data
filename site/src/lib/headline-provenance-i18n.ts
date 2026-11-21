import type {Locale} from "./locales.ts";

/**
 * Consistent technical provenance disclosure for published model summaries.
 * It must not turn a headline number into an independently measured result.
 * A source link appears only when the identical HP figure is unambiguous in
 * already-public, dated evidence for this exact model record.
 */
export const HEADLINE_PROVENANCE_COPY:Record<Locale,{
  matched:string;
  unconfirmed:string;
  summaryCaveat:string;
}>={
  en:{
    matched:"Matching source for this power figure",
    unconfirmed:"This summary power value is not yet matched to an equivalent, reviewed HP measurement.",
    summaryCaveat:"Overview fields do not by themselves establish the precise year, market, equipment variant or measurement standard. Review the linked technical records before making a comparison."
  },
  tr:{
    matched:"Bu güç değeriyle eşleşen kaynağı incele",
    unconfirmed:"Bu özet güç değeri, aynı ölçüm türündeki incelenmiş bir HP kaydıyla henüz eşleştirilmedi.",
    summaryCaveat:"Özet bilgiler tek başına model yılı, pazar, donanım varyantı veya ölçüm standardını doğrulamaz. Karşılaştırmadan önce kaynaklı teknik kayıtları inceleyin."
  },
  zh:{
    matched:"查看与此功率值对应的资料",
    unconfirmed:"这一概览功率值尚未与同一测量类型的已审核 HP 数据对应核实。",
    summaryCaveat:"概览参数本身无法确认准确的年份、市场、配置版本或测量标准。比较前请查阅附有来源的技术记录。"
  },
  hi:{
    matched:"इस शक्ति आँकड़े से मेल खाने वाला स्रोत देखें",
    unconfirmed:"सारांश में दिया गया यह शक्ति मान अभी समान माप प्रकार के समीक्षित HP रिकॉर्ड से मिलान नहीं किया गया है।",
    summaryCaveat:"सारांश के आँकड़े अपने आप मॉडल वर्ष, बाज़ार, उपकरण संस्करण या माप मानक की पुष्टि नहीं करते। तुलना से पहले स्रोत सहित तकनीकी रिकॉर्ड देखें।"
  },
  "pt-br":{
    matched:"Consultar a fonte correspondente a esta potência",
    unconfirmed:"Este valor resumido de potência ainda não foi associado a uma medição em HP equivalente e revisada.",
    summaryCaveat:"Os dados resumidos, por si só, não confirmam o ano, mercado, versão de equipamento ou padrão de medição. Consulte os registros técnicos com fonte antes de comparar."
  },
  fr:{
    matched:"Consulter la source correspondant à cette puissance",
    unconfirmed:"Cette puissance indiquée en résumé n’a pas encore été rapprochée d’une mesure en HP équivalente et examinée.",
    summaryCaveat:"Les données résumées ne confirment pas à elles seules l’année, le marché, la configuration ni la norme de mesure. Consultez les fiches techniques sourcées avant toute comparaison."
  },
  de:{
    matched:"Quelle für diesen Leistungswert prüfen",
    unconfirmed:"Dieser Leistungswert der Übersicht wurde noch keiner entsprechend gemessenen und geprüften HP-Angabe zugeordnet.",
    summaryCaveat:"Übersichtsdaten allein bestätigen weder Baujahr noch Markt, Ausstattung oder Messnorm. Prüfen Sie vor einem Vergleich die technischen Angaben mit Quellenbelegen."
  },
  ru:{
    matched:"Посмотреть источник этого значения мощности",
    unconfirmed:"Указанная в обзоре мощность пока не сопоставлена с проверенным значением HP, измеренным тем же способом.",
    summaryCaveat:"Обзорные сведения сами по себе не подтверждают год, рынок, комплектацию или стандарт измерения. Перед сравнением проверьте технические записи с источниками."
  },
  ja:{
    matched:"この出力値に対応する資料を確認",
    unconfirmed:"概要の出力値は、同じ測定条件で確認された HP 値との照合がまだ済んでいません。",
    summaryCaveat:"概要だけでは年式、市場、装備仕様、測定規格が一致するとは限りません。比較前に出典付きの技術仕様を確認してください。"
  },
  es:{
    matched:"Consultar la fuente que coincide con esta potencia",
    unconfirmed:"Este valor resumido de potencia aún no se ha cotejado con una medición equivalente en HP debidamente revisada.",
    summaryCaveat:"Los datos resumidos no confirman por sí solos el año, mercado, variante de equipamiento ni norma de medición. Revisa los registros técnicos con fuentes antes de comparar."
  }
};
