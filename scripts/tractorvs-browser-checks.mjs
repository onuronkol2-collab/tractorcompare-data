// Exact, complete browser evidence: never accept mixed, missing or invented shards.
export const LEGACY_BROWSER_NAMES=["chromium, chromium","firefox, firefox","webkit, webkit","mobile-chromium, chromium"].map(s=>"browser-projects ("+s+")");
export const SHARDED_BROWSER_NAMES=["chromium, chromium, 1/1, chromium","firefox, firefox, 1/1, firefox","webkit, webkit, 1/2, webkit-shard-1","webkit, webkit, 2/2, webkit-shard-2","mobile-chromium, chromium, 1/1, mobile-chromium"].map(s=>"browser-projects ("+s+")");
export function browserRequiredNames(checks=[]){
 const names=checks.map(c=>c.name).filter(n=>typeof n==="string"&&n.startsWith("browser-projects ("));
 if(names.some(n=>!LEGACY_BROWSER_NAMES.includes(n)&&!SHARDED_BROWSER_NAMES.includes(n)))return null;
 const sharded=names.some(n=>SHARDED_BROWSER_NAMES.includes(n));
 if(sharded&&names.some(n=>LEGACY_BROWSER_NAMES.includes(n)))return null;
 return sharded?SHARDED_BROWSER_NAMES:LEGACY_BROWSER_NAMES;
}
