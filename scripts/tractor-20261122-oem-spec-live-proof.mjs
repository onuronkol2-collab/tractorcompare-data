/**
 * Read-only, credential-free live proof of the 2026-11-22 OEM-source batch.
 * Both a successful Supabase write and a green Cloudflare build are insufficient:
 * every expected measurement MUST appear in actual production HTML.
 */
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {oem20261122SpecLabel} from "../site/src/lib/oem-20261122-spec-labels.ts";
const origin="https://tractorvs.com";
export const models=Object.freeze([
 {slug:"mahindra-arjun-555-di-2c1a6638",brand:"Mahindra",values:["Multi-disc oil-immersed","Bow-type","MSPTO; four speed settings (RPM not specified)"]},
 {slug:"mahindra-arjun-605-di-i-bee5e88f",brand:"Mahindra",values:["Single dry or dual dry","400","36.4"]},
 {slug:"mahindra-arjun-605-di-ms-739db984",brand:"Mahindra",values:["MSPTO; four speed settings (RPM not specified)"]},
 {slug:"mahindra-arjun-605-di-ms-v1-163dbb9b",brand:"Mahindra",values:["Dual clutch / SLIPTO","Side shift; fitting unspecified"]},
 {slug:"agrale-4233-e3ed3f24",brand:"Agrale",values:["Isodiametric (equal-size front/rear wheels)"]}
]);
export const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const u=(locale,slug)=>origin+(locale==="en"?"":"/"+locale)+"/tractors/"+slug+"/";
function linkTag(html,rel){
 return [...html.matchAll(/<link\b[^>]*>/gi)].filter(x=>new RegExp("\\brel=[\"']"+rel+"[\"']","i").test(x[0])).map(x=>x[0]);
}
function attr(tag,name){const m=tag.match(new RegExp("\\b"+name+"\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')","i"));return m?.[1]||m?.[2]||null;}
export async function proveLiveManufacturerSpecs({fetchFn=fetch}={}){
 const cases=[
  ...models.map(m=>({model:m,locale:"en"})),
  ...locales.filter(l=>l!=="en").map(locale=>({model:models[1],locale}))
 ];
 const errors=[];
 // Stay small enough for a free CI validation and do not hammer the site.
 for(let i=0;i<cases.length;i+=4){
  await Promise.all(cases.slice(i,i+4).map(async({model,locale})=>{
   const url=u(locale,model.slug);
   try{
    const response=await fetchFn(url,{redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(20000),headers:{"User-Agent":"TractorVS-OEM-live-spec-proof/1.0","Accept":"text/html"}});
    if(response.status!==200){errors.push(locale+"/"+model.slug+": HTTP "+response.status);return;}
    if(!/text\/html/i.test(response.headers.get("content-type")||"")){errors.push(locale+"/"+model.slug+": not HTML");return;}
    const html=(await response.text()).slice(0,4000000);
    const canonical=linkTag(html,"canonical");
    if(canonical.length!==1||attr(canonical[0],"href")!==url) errors.push(locale+"/"+model.slug+": wrong canonical");
    const rootLang=html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1];
    if(rootLang!==(locale==="pt-br"?"pt-BR":locale))errors.push(locale+"/"+model.slug+": wrong lang");
    if(!/<h1\b[^>]*>/i.test(html))errors.push(locale+"/"+model.slug+": H1 absent");
    if(/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html))errors.push(locale+"/"+model.slug+": noindex");
    for(const value of model.values)if(!html.includes(value))errors.push(locale+"/"+model.slug+": missing value "+value);
    if(model===models[1]){
      const label=locale==="en"?"Manufacturer-quoted PTO power":oem20261122SpecLabel("Manufacturer-quoted PTO power",locale);
      if(!label||!html.includes(label))errors.push(locale+"/"+model.slug+": missing manufacturer-quoted PTO label");
    }
   }catch(e){errors.push(locale+"/"+model.slug+": "+String(e?.message||e).slice(0,150));}
  }));
 }
 return {ok:errors.length===0,origin,pages:cases.length,models:models.length,checked_locales:locales.length,errors};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=await proveLiveManufacturerSpecs();
 console.log("TRACTORVS_OEM_SPECS_LIVE_PROOF "+JSON.stringify(result));
 if(!result.ok)process.exitCode=1;
}
