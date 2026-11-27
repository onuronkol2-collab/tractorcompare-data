// Read-only shadow planner for historical successful reports. No test execution.
// Whole files remain intact; serial suites and fixtures cannot be split.
export const validFile=f=>typeof f==="string"&&/^e2e\/[a-zA-Z0-9_.\/-]+\.spec\.(?:mjs|js|ts)$/.test(f)&&!f.split("/").some(p=>!p||p===".."||p===".");
const quantile=(values,p)=>{const s=[...values].sort((a,b)=>a-b);return s[Math.max(0,Math.ceil(s.length*p)-1)]};
export function planBrowserFiles({files,history,shards=2,project}){
 if(!Array.isArray(files)||!files.length||new Set(files).size!==files.length||files.some(f=>!validFile(f))||!Number.isInteger(shards)||shards<1||shards>4||shards>files.length||!["webkit","chromium","firefox","mobile-chromium"].includes(project))throw Error("Invalid inventory");
 if(!Array.isArray(history)||history.length<3||history.length>50)return {mode:"standard-sharding",reason:"insufficient-history"};
 const series=new Map(files.map(f=>[f,[]]));
 const seenRuns=new Set();
 for(const run of history){
  if(run?.project!==project||run?.successful!==true||!Array.isArray(run.files))return {mode:"standard-sharding",reason:"unverified-history"};
  if(run.runId!==undefined){
   if(!Number.isSafeInteger(run.runId)||run.runId<1||seenRuns.has(run.runId))return {mode:"standard-sharding",reason:"duplicate-or-invalid-run"};
   seenRuns.add(run.runId);
  }
  const seen=new Set();
  for(const row of run.files){
   if(!validFile(row?.file)||seen.has(row.file)||!Number.isFinite(row.ms)||row.ms<0)return {mode:"standard-sharding",reason:"invalid-history"};
   seen.add(row.file);if(series.has(row.file))series.get(row.file).push(row.ms);
  }
 }
 const known=[...series.values()].filter(v=>v.length>=3).map(v=>quantile(v,.95));
 if(!known.length)return {mode:"standard-sharding",reason:"insufficient-matched-files"};
 const fallback=Math.max(1000,quantile(known,.95));
 const ranked=[...series].map(([file,values])=>({file,weight:values.length>=3?Math.max(1,quantile(values,.95)):fallback,samples:values.length,median:values.length?quantile(values,.5):null,p95:values.length?quantile(values,.95):null,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null})).sort((a,b)=>b.weight-a.weight||a.file.localeCompare(b.file,"en"));
 const groups=Array.from({length:shards},(_,i)=>({shard:i+1,weight:0,files:[]}));
 for(const row of ranked){
  const g=groups.reduce((a,b)=>a.weight<=b.weight?a:b);
  g.files.push(row.file);g.weight+=row.weight;
 }
 const union=groups.flatMap(g=>g.files);
 if(union.length!==files.length||new Set(union).size!==files.length||files.some(f=>!union.includes(f)))throw Error("Incomplete partition");
 return {mode:"weighted-shadow",project,groups,ranked};
}
