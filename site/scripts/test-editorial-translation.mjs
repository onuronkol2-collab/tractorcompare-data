/** One short private smoke test. Runs at most ONE Gemini request. */
const jwt=process.env.TRACTORVS_SUPABASE_ANON_JWT,secret=process.env.TRACTORVS_QUEUE_SECRET;
if(!jwt||!secret)throw Error("Research queue credentials missing");
const url="https://aaufxtcvnzgavtlintiv.supabase.co/functions/v1/tractor-editorial-translate";
const records=[{id:"rated-power",english:{name:"Rated engine power",definition:"Rated power is measured at a stated engine speed. A 100 hp engine rating does not mean 100 hp reaches the rear PTO shaft.",example:"Check whether a tractor's published 100 hp is rated, maximum or boost power.",caution:"Never compare a 100 hp engine rating to a 100 hp PTO rating as if both were measured at the same point."},
 turkish:{name:"Nominal motor gücü",definition:"Nominal güç, motorun belirtilen devirdeki ölçümüdür. Motorun 100 beygir olması, PTO'da da 100 beygir verdiğini göstermez.",example:"Bir traktörün 100 HP değerinin nominal mi azami mi olduğunu öğrenin.",caution:"Motor ile kuyruk mili gücünü aynı ölçüm gibi karşılaştırmayın."}}];
async function api(payload){
 const resp=await fetch(url,{method:"POST",headers:{authorization:"Bearer "+jwt,apikey:jwt,"x-queue-secret":secret,"content-type":"application/json"},body:JSON.stringify(payload),signal:AbortSignal.timeout(45_000)});
 const data=await resp.json().catch(()=>({}));
 if(!resp.ok)throw Error("API "+resp.status+" "+JSON.stringify(data).slice(0,430));
 return data;
}
const start=await api({action:"start",target:"es",records});
if(!start.interaction_id)throw Error("Missing interaction");
for(let i=0;i<90;i++){
 await new Promise(res=>setTimeout(res,i<5?2000:3000));
 const r=await api({action:"poll",target:"es",records,interaction_id:start.interaction_id});
 if(r.complete){const f=r.records?.[0]?.fields;if(!f?.definition.includes("100"))throw Error("Numerical content lost");
 console.log("SMOKE_SUCCESS "+JSON.stringify({name:f.name,definition:f.definition,example:f.example,caution:f.caution}));process.exit(0);}
}
throw Error("Translation smoke timed out");
