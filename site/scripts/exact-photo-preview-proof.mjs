// Shared read-only exact-current-PR proof, not release authorization.
import {createHash} from 'node:crypto';
import {currentPreview, verifyPreviewIdentity} from './verify-mobile-preview-assets.mjs';
import {waitForWorkersBuild} from './workers-build-readiness.mjs';
const shaPattern=/^[a-f0-9]{40}$/;
const hostPattern=/^https:\/\/[a-z0-9][a-z0-9-]*-tractorvs-site\.onuronkol2\.workers\.dev$/;
export async function proveExactPhotoPreview({items,pr,sha,token,branch,fetchFn=fetch,
  wait=waitForWorkersBuild,resolve=currentPreview,identity=verifyPreviewIdentity,log=()=>{}}={}) {
  if (!shaPattern.test(sha||'')||!/^[1-9][0-9]*$/.test(pr||'')||!token||!branch) throw Error('PREVIEW_CONFIG_INVALID');
  if (!Array.isArray(items)||![24,30].includes(items.length)||new Set(items.map(x=>x.path)).size!==items.length||items.some(x=>!/^\/images\/tractors\/[a-z0-9-]+-720\.(jpg|webp)$/.test(x.path)||x.mime!==(x.path.endsWith('.jpg')?'image/jpeg':'image/webp')||!Number.isSafeInteger(x.bytes)||x.bytes<1||!/^[a-f0-9]{64}$/.test(x.sha256))) throw Error('PREVIEW_LEDGER_INVALID');
  const pairs=new Map();
  for(const item of items){const stem=item.path.replace(/\.(jpg|webp)$/,'');const formats=pairs.get(stem)||new Set();formats.add(item.mime);pairs.set(stem,formats);}
  if(pairs.size!==items.length/2||[...pairs.values()].some(formats=>formats.size!==2))throw Error('PREVIEW_LEDGER_FORMAT_PAIRS_INVALID');
  await wait({sha,token,fetchFn,attempts:20,intervalMs:10000,log});
  const origin=await resolve({pr,sha,token,branch,fetchFn,attempts:8,log});
  if (!hostPattern.test(origin)) throw Error('PREVIEW_ORIGIN_INVALID');
  if (!(await identity(origin,sha,fetchFn)).ready) throw Error('PREVIEW_DEPLOYMENT_PENDING');
  const records=[];
  for (const item of items) {
    const res=await fetchFn(origin+item.path,{redirect:'error',signal:AbortSignal.timeout(18000),headers:{Accept:item.mime,'Cache-Control':'no-cache'}});
    if (res.status===429||res.headers.get('retry-after')) throw Error('PREVIEW_RATE_LIMITED');
    if (res.status!==200) throw Error('PREVIEW_ASSET_HTTP_'+res.status+': '+item.path);
    if ((res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!==item.mime) throw Error('PREVIEW_ASSET_MIME: '+item.path);
    const data=Buffer.from(await res.arrayBuffer());
    if (data.length!==item.bytes||createHash('sha256').update(data).digest('hex')!==item.sha256) throw Error('PREVIEW_ASSET_BYTES_SHA: '+item.path);
    records.push({path:item.path,mime:item.mime,bytes:item.bytes,sha256:item.sha256});
  }
  if (!(await identity(origin,sha,fetchFn)).ready) throw Error('PREVIEW_DEPLOYMENT_CHANGED');
  for(const record of records) log(record);
  return {origin,sha,checked:records.length,errors:0,productionDeployment:false};
}
