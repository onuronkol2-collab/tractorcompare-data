import {forumSeoDescription} from "./forum-format.mjs";

// Author-reviewed, source-grounded excerpts for one independently QA-checked
// multilingual forum study. Other topics retain the generic safe excerpt.
export const FORUM_RELIABILITY_TOPIC_ID = "9f82b9f3-7aab-41ee-8588-a0a383f80694";
export const FORUM_RELIABILITY_META_DESCRIPTIONS = Object.freeze({
 tr:"John Deere, Kubota, New Holland, Deutz-Fahr, Fendt ve CLAAS: 2020–2026 resmî geri çağırmalarını ve bağımsız servis bulgularını karşılaştırın.",
 en:"John Deere, Kubota, New Holland, Deutz-Fahr, Fendt and CLAAS tractor faults: official recalls versus independent workshop findings, 2020–2026.",
 de:"John Deere, Kubota, New Holland, Deutz-Fahr, Fendt und CLAAS: amtliche Rückrufe und unabhängige Werkstattbefunde von 2020 bis 2026.",
 fr:"John Deere, Kubota, New Holland, Deutz-Fahr, Fendt et CLAAS : rappels officiels et observations d’ateliers indépendants, 2020–2026.",
 es:"Averías documentadas en tractores John Deere, Kubota, New Holland, Deutz-Fahr, Fendt y CLAAS: retiradas oficiales y análisis de talleres, 2020–2026.",
 "pt-br":"Falhas documentadas em tratores John Deere, Kubota, New Holland, Deutz-Fahr, Fendt e CLAAS: recalls oficiais e análises de oficinas, 2020–2026.",
 ru:"John Deere, Kubota, New Holland, Deutz-Fahr, Fendt и CLAAS: официальные отзывные кампании и независимые сервисные обзоры за 2020–2026 годы.",
 ja:"John Deere、Kubota、New Holland、Deutz-Fahr、Fendt、CLAASのトラクター問題。2020～2026年の公式リコールと独立整備工場の分析を比較。",
 zh:"比较2020至2026年John Deere、Kubota、New Holland、Deutz-Fahr、Fendt和CLAAS拖拉机的官方召回与独立维修报告，区分安全缺陷与维修观察。",
 hi:"John Deere, Kubota, New Holland, Deutz-Fahr, Fendt और CLAAS ट्रैक्टर: 2020–2026 के आधिकारिक रिकॉल और स्वतंत्र सर्विस विश्लेषण की तुलना।"
});

// Guard against stale marketing claims when the source post is revised:
// descriptions are used only while every referenced brand and year still
// occurs in the actual rendered body. The article has no separate SEO field.
const ARTICLE_BRANDS=["John Deere","Kubota","New Holland","Deutz-Fahr","Fendt","CLAAS"];
export function sourceAwareForumSeoDescription(topicId,locale,body){
 const current=String(body??"");
 if(topicId!==FORUM_RELIABILITY_TOPIC_ID||!current.includes("2027")||
    ARTICLE_BRANDS.some(brand=>!current.includes(brand)))
  return forumSeoDescription(current);
 return FORUM_RELIABILITY_META_DESCRIPTIONS[locale]??forumSeoDescription(current);
}
