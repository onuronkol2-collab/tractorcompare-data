import {extractAdvisorFacts} from "./advisor-evidence.ts";
import {modelEvidenceAnswers} from "./model-evidence-answers.ts";
import {advisorText} from "./advisor-i18n.ts";
import {isUnresolvedComparisonSpec} from "./manufacturer-conflicts.mjs";
import {localizedPath,type Locale} from "./locales.ts";
import type {TractorRecord} from "./catalog.ts";
export function equipmentContext(tractor:TractorRecord,lang:Locale){
 const safe={...tractor,specifications:tractor.specifications.filter(spec=>!isUnresolvedComparisonSpec(tractor,spec))};
 const facts=extractAdvisorFacts(safe).filter(f=>["pto","rearLift","hydraulicService","hydraulicMain"].includes(f.kind)).map(f=>({
  label:advisorText(lang,("fact_"+f.kind) as "fact_pto"),value:f.value+(f.unit?" "+f.unit:""),source:f.sourceUrl
 }));
 const power=modelEvidenceAnswers(safe,lang).find(item=>item.id==="pto-power");
 if(power)facts.push({label:power.question,value:power.answer,source:power.sourceUrl});
 return {id:tractor.tractor_id,slug:tractor.slug,name:[tractor.brand_name,tractor.model_name,tractor.variant,tractor.market,tractor.model_year].filter(Boolean).join(" · "),href:localizedPath(lang,"/tractors/"+tractor.slug+"/"),facts};
}
