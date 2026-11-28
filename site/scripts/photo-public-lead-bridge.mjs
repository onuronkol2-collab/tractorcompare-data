/** Metadata-only candidates from the current public discovery report. Never downloads or approves. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {planMetadataRequests} from './photo-commons-metadata-requests.mjs';
const key=(b,m)=>JSON.stringify([b,m]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const filename=source=>planMetadataRequests([{source}],1)[0]?.filename;
export function mergePublicLeads(inventory,coverage,report,ledger){
 if(!Array.isArray(inventory)||!Array.isArray(coverage?.missing_models)||!Array.isArray(report?.models)||!Array.isArray(ledger?.candidates)||!Array.isArray(ledger?.preservedRejectionsAndHolds))throw Error('invalid public inputs');
 const all=new Map(),ids=new Map(),missing=new Set();
 for(const r of inventory){if(r.status!=='published'||!uuid.test(r.tractor_id)||typeof r.brand!=='string'||typeof r.model!=='string'||!r.brand||!r.model)throw Error('nonpublic or invalid inventory');const k=key(r.brand,r.model);if(ids.has(r.tractor_id)&&ids.get(r.tractor_id)!==k)throw Error('conflicting UUID');ids.set(r.tractor_id,k);if(!all.has(k))all.set(k,new Set());all.get(k).add(r.tractor_id);}
 for(const m of coverage.missing_models){if(!Array.isArray(m.missingTractorIds))throw Error('invalid coverage');for(const id of m.missingTractorIds){if(ids.get(id)!==key(m.brand,m.model)||missing.has(id))throw Error('coverage mismatch');missing.add(id);}}
 if(missing.size!==coverage.missing||ids.size!==coverage.total)throw Error('incomplete inventory');
 // Canonical filename prevents hold bypass using percent encoding or spaces.
 const excluded=new Set([...ledger.candidates,...ledger.preservedRejectionsAndHolds].map(x=>filename(x.source)).filter(Boolean));
 const pending=new Map(),ambiguous=new Set();
 for(const m of report.models){const k=key(m.brand,m.model),matches=all.get(k);if(!matches||matches.size!==1||!Array.isArray(m.photos))continue;const id=[...matches][0];if(!missing.has(id))continue;
 for(const p of m.photos){const n=filename(p.page);if(!n||excluded.has(n)||typeof p.fileTitle!=='string'||p.fileTitle.replaceAll(' ','_')!=='File:'+n)continue;
 if(pending.has(n)&&pending.get(n).tractorIds[0]!==id){ambiguous.add(n);continue;}
 if(!pending.has(n))pending.set(n,{brand:m.brand,model:m.model,tractorIds:[id],source:p.page,status:'current_public_discovery_metadata_only; prior private holds, license, original and exact visual identity must be checked before any acquisition',publicationAuthorized:false});}}
 const generated=[...pending].filter(([n])=>!ambiguous.has(n)).map(([,p])=>p);
 return {...ledger,candidates:[...ledger.candidates,...generated],dynamicMetadataLeads:generated.length,publicationAuthorized:false};
}
async function read(path){const b=await readFile(path);if(b.length>8*1024*1024)throw Error('input cap');return JSON.parse(b);}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const a=process.argv.slice(2);if(a.length!==5)throw Error('inventory coverage report ledger output');const result=mergePublicLeads(...await Promise.all(a.slice(0,4).map(read)));await writeFile(a[4],JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({dynamicMetadataLeads:result.dynamicMetadataLeads,publicationAuthorized:false}));}
