/** Static CI guard: Cloudflare settings are external, but repo commands/config must not drift. */
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"../../");
const load=(p)=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
const fail=(msg)=>{throw new Error("[TractorVS BUILD CONTRACT] "+msg);};
const repoPkg=load("package.json"),sitePkg=load("site/package.json");
const rootWrangler=load("wrangler.jsonc"),siteWrangler=load("site/wrangler.jsonc");
for(const [label,pkg] of [["root",repoPkg],["site",sitePkg]]){
 if(pkg.packageManager!=="npm@10.9.2")fail(label+" package manager is not pinned");
 if(!pkg.scripts["build:production"]||!pkg.scripts["deploy:verified"]||!pkg.scripts["build:cloudflare"])
  fail(label+" is missing release scripts");
 if(!pkg.scripts.deploy?.includes("deploy:verified"))fail(label+" legacy deploy script bypasses production safety gate");
}
for(const [label,cfg,expected] of [["root",rootWrangler,{main:"./site/worker/index.js",dir:"./site/dist"}],
  ["site",siteWrangler,{main:"./worker/index.js",dir:"./dist"}]]){
 if(cfg.name!=="tractorvs-site"||cfg.assets?.directory!==expected.dir||
   cfg.main!==expected.main||cfg.assets?.binding!=="ASSETS")
   fail(label+" Wrangler entrypoint/assets mismatch");
 const required=["/","/language/*","/api/visitor-country","/images/tractors/*"];
 for(const path of required)if(!cfg.assets?.run_worker_first?.includes(path))
  fail(label+" Worker misses "+path);
}
for(const file of [".node-version","site/.node-version"]){
 if(!existsSync(resolve(root,file))||readFileSync(resolve(root,file),"utf8").trim()!=="22.23.4")
  fail("Node version pin is missing: "+file);
}
if(!existsSync(resolve(root,"site/scripts/production-release-gate.mjs")))
 fail("Missing production release gate.");
console.log("[TractorVS] CI Cloudflare build contract: both configs match, pinned Node/npm, safe release commands present");
