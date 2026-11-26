/**
 * Test-only catalogue page build. CI uses invented records, never unpublished
 * production data. A private operator may supply an already-reviewed
 * anonymous-view rehearsal export from outside the repository, locally only.
 * No DB writes, real credentials, deploy command, artifact upload or site/dist.
 */
import {readFileSync,writeFileSync,mkdtempSync,rmSync,realpathSync,statSync,readdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve,join,relative,isAbsolute,sep} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {spawnSync} from "node:child_process";
import {PUBLIC_LOCALES,verifyModelDiscoveryMarkup} from "./verify-published-site-inventory.mjs";
import {inspectSeoTitle} from "./verify-sitewide-seo-titles.mjs";

const file=fileURLToPath(import.meta.url);
const siteRoot=resolve(file,"../..");
const repoRoot=resolve(siteRoot,"..");
const origin="https://tractorvs-catalogue-test.invalid";
const mock="https://tractorvs-catalogue-fixture.invalid";
const fakeKey="sb_publishable_tractorvs_fixture_only_not_a_real_key";
const child="TRACTORVS_CATALOGUE_FIXTURE_CHILD";
const input="TRACTORVS_CATALOGUE_FIXTURE_FILE";
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const slugPart=v=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ö/g,"o").replace(/ü/g,"u")
  .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const pathFor=(lang,slug)=>"/"+(lang==="en"?"":lang+"/")+"tractors/"+slug+"/";

function syntheticRows(){
  const specs=[
    ["engine_cylinders","Cylinders","3",null,"engine"],
    ["transmission_gear_configuration","Gear configuration","6F / 2R",null,"transmission"],
    ["fuel_tank_capacity","Fuel tank capacity","31","L","capacities"],
    ["rear_pto_speeds","PTO speeds","540","rpm","power_take_off"],
    ["wheelbase","Wheelbase","2001","mm","dimensions_weights"],
    ["ground_clearance","Ground clearance","321","mm","dimensions_weights"],
    ["hydraulic_max_flow","Maximum hydraulic flow","41","L/min","hydraulics"],
    ["overall_width","Overall width","1601","mm","dimensions_weights"]
  ];
  // Names/values deliberately invented, not actual draft model identities.
  return ["A","B"].flatMap((letter,i)=>specs.map(([key,name,value,unit,category],j)=>({
    tractor_id:"f100000"+(i+1)+"-0000-4000-8000-000000000001",
    brand_name:i===0?"Başak Traktör":"YTO",
    model_name:"Synthetic QA "+letter+" (not a real model)",
    model_year:null,variant:"Synthetic QA configuration",market:i===0?"Türkiye":"International",
    brand_country:null,brand_website_url:null,horsepower:null,engine:null,transmission:null,drivetrain:null,weight_kg:null,
    spec_id:"f200000"+(i+1)+"-0000-4000-8000-"+String(j+1).padStart(12,"0"),
    spec_name:name,spec_value:value,unit,canonical_key:key,comparison_class:category,
    measurement_standard:"Synthetic fixture only; not actual manufacturer data",
    rated_rpm:null,verified_at:"2026-11-25T00:00:00Z",
    evidence_text:"Synthetic non-production test fixture only",source_publisher:"Synthetic fixture",
    source_url:i===0?"https://basaktraktor.com.tr/":"https://ytocorp.com/5-5-2-90-110hp-tractor-nlx-nly-series.html",
    source_type:i===0?"official_product_page":"official_product_catalog",
    source_accessed_at:"2026-11-25",spec_source_priority:100
  })));
}
function fixtureGroups(rows){
  assert(Array.isArray(rows)&&rows.length>0&&rows.length<=10000,"Invalid fixture row count");
  const groups=new Map(),specIds=new Set(),slugs=new Set();
  for(const row of rows){
    assert(row&&uuid.test(row.tractor_id)&&uuid.test(row.spec_id),"Invalid fixture identity");
    assert(typeof row.brand_name==="string"&&row.brand_name.trim()&&typeof row.model_name==="string"&&row.model_name.trim(),"Incomplete model identity");
    assert(typeof row.canonical_key==="string"&&row.canonical_key.trim()&&typeof row.spec_value==="string"&&row.spec_value.trim(),"Incomplete fixture specification");
    assert(typeof row.verified_at==="string"&&Number.isFinite(Date.parse(row.verified_at))&&typeof row.evidence_text==="string"&&row.evidence_text.trim(),"Held or unverified claim must not enter the fixture");
    assert(typeof row.measurement_standard==="string"&&row.measurement_standard.trim(),"Missing measurement scope");
    const url=new URL(row.source_url);
    assert(url.protocol==="https:"&&!url.username&&!url.password&&!url.port,"Unsafe source URL");
    assert(!specIds.has(row.spec_id),"Duplicate specification ID");specIds.add(row.spec_id);
    const identity=JSON.stringify([row.brand_name,row.model_name,row.market,row.variant,row.model_year]);
    if(!groups.has(row.tractor_id)){
      const slug=(slugPart(row.brand_name+"-"+row.model_name)||"tractor")+"-"+row.tractor_id.slice(0,8);
      assert(!slugs.has(slug),"Duplicate model slug");slugs.add(slug);
      groups.set(row.tractor_id,{slug,identity,rows:[],keys:new Set()});
    }
    const group=groups.get(row.tractor_id);
    assert(group.identity===identity,"Inconsistent fixture identity");
    assert(!group.keys.has(row.canonical_key),"Duplicate canonical concept");
    group.keys.add(row.canonical_key);group.rows.push(row);
  }
  for(const group of groups.values())assert(group.keys.size>=8,"Fewer than eight retained concepts");
  assert(new Set([...groups.values()].map(g=>g.identity)).size===groups.size,"Duplicate model identity");
  return [...groups.values()];
}
function installFetch(){
  assert(process.env.SITE_URL===origin&&process.env.SUPABASE_URL===mock&&
    process.env.SUPABASE_PUBLISHABLE_KEY===fakeKey&&!process.env.SUPABASE_ANON_KEY,
    "Fixture fetch refused outside isolated QA origin");
  const candidates=JSON.parse(readFileSync(process.env[input],"utf8"));
  fixtureGroups(candidates);
  // The unrelated editorial comparison is intentionally fail-closed in an
  // indexed build. Supply its minimal, already-published snapshot, not invented
  // editorial evidence or a production-gate exception. Audit only candidates.
  const baseline=JSON.parse(readFileSync(join(siteRoot,"tests/fixtures/nominal-preview-public-editorial-baseline.json"),"utf8"));
  assert(baseline.length===24&&new Set(baseline.map(r=>r.tractor_id)).size===2,"Public editorial fixture is incomplete");
  assert(baseline.every(r=>r.verified_at&&r.evidence_text&&r.source_type==="manufacturer_specification"),"Public editorial prerequisite invalid");
  const candidateIds=new Set(candidates.map(r=>r.tractor_id));
  assert(!baseline.some(r=>candidateIds.has(r.tractor_id)),"Candidate overlaps public editorial prerequisite");
  const rows=[...candidates,...baseline];
  // No external fetch or Supabase service credentials in this preview.
  globalThis.fetch=async (resource,options={})=>{
    const url=new URL(resource instanceof Request?resource.url:resource);
    const method=options.method||(resource instanceof Request?resource.method:"GET");
    assert(url.origin===mock&&url.pathname==="/rest/v1/tractorvs_public_specs"&&method==="GET",
      "Unexpected network request during isolated catalogue preview");
    const offset=Number(url.searchParams.get("offset")||0),limit=Number(url.searchParams.get("limit")||500);
    assert(Number.isSafeInteger(offset)&&offset>=0&&Number.isSafeInteger(limit)&&limit>0,"Invalid fixture pagination");
    const page=rows.slice(offset,offset+limit);
    return new Response(JSON.stringify(page),{status:200,headers:{
      "content-type":"application/json","content-range":page.length?offset+"-"+(offset+page.length-1)+"/"+rows.length:"*/"+rows.length
    }});
  };
}
function audit(dist,groups,indexable){
  let pages=0;
  const sitemap=indexable?readdirSync(dist).filter(n=>/^sitemap-\d+\.xml$/.test(n))
    .map(n=>readFileSync(join(dist,n),"utf8")).join("\n"):"";
  for(const lang of PUBLIC_LOCALES){
    const prefix=lang==="en"?"":lang+"/";
    const list=readFileSync(join(dist,prefix,"tractors/index.html"),"utf8");
    const links=new Set([...list.matchAll(/href="([^"]+)"/g)].map(m=>m[1]));
    const titles=new Set();
    for(const g of groups){
      const path=pathFor(lang,g.slug);
      const file=prefix+"tractors/"+g.slug+"/index.html";
      const html=readFileSync(join(dist,file),"utf8");
      const title=inspectSeoTitle(html,file);
      assert(title&&title.errors.length===0&&!titles.has(title.title),"Model title or identity check failed");
      titles.add(title.title);
      assert(links.has(path),"Missing rendered catalogue model link");
      if(indexable){
        verifyModelDiscoveryMarkup({html,catalogLinks:links,slug:g.slug,locale:lang,origin});
        assert(sitemap.includes("<loc>"+origin+path+"</loc>"),"Missing test-origin model sitemap URL");
      }else{
        assert(html.includes('name="robots" content="noindex,nofollow"'),"Non-indexable preview lost noindex");
        assert(!/<link\b[^>]*rel="canonical"/i.test(html),"Non-indexable preview emitted canonical");
      }
      for(const row of g.rows){
        assert(html.includes('data-spec-id="'+row.spec_id+'"'),"Retained fixture spec missing from generated page");
        const safe=row.source_url.replaceAll("&","&amp;");
        assert(html.includes('href="'+safe+'"'),"Verified source missing from generated page");
      }
      pages++;
    }
  }
  assert(pages===groups.length*PUBLIC_LOCALES.length,"Missing locale model pages");
  return pages;
}
function main(){
  const args=process.argv.slice(2);
  assert(args.length===0||(args.length===2&&args[0]==="--private-rows"),"Usage: node site/scripts/verify-nominal-catalogue-preview.mjs [--private-rows /private/rehearsal.json]");
  const privateInput=args.length>0;
  let rows;
  if(privateInput){
    assert(!process.env.CI&&!process.env.GITHUB_ACTIONS&&!process.env.WORKERS_CI_BRANCH,"Private data is forbidden in CI or Cloudflare");
    const path=realpathSync(args[1]),rel=relative(repoRoot,path);
    assert(rel===".."||rel.startsWith(".."+sep)||isAbsolute(rel),"Private data must be outside the repository");
    assert((statSync(path).mode&0o077)===0,"Private file permissions must exclude group/other access");
    rows=JSON.parse(readFileSync(path,"utf8"));
  }else rows=syntheticRows();
  const groups=fixtureGroups(rows);
  const scratch=mkdtempSync(join(tmpdir(),"tractorvs-catalogue-qa-"));
  try{
    const fixture=join(scratch,"rows.json");
    writeFileSync(fixture,JSON.stringify(rows),{mode:0o600});
    let tested=0;
    // Actual Astro HTML, first noindex and then indexed metadata against a
    // reserved .invalid origin. Both builds stay outside site/dist and are removed.
    for(const indexable of [false,true]){
      const dist=join(scratch,indexable?"indexable":"preview");
      const env={...process.env,SITE_URL:origin,PUBLIC_INDEXING_ENABLED:indexable?"true":"false",
        SUPABASE_URL:mock,SUPABASE_PUBLISHABLE_KEY:fakeKey,SUPABASE_ANON_KEY:"",
        ASTRO_TELEMETRY_DISABLED:"1",NODE_OPTIONS:"--import="+pathToFileURL(file).href,
        [child]:"1",[input]:fixture};
      const result=spawnSync("npm",["run","build","--","--outDir",dist],{cwd:siteRoot,env,
        stdio:privateInput?"pipe":"inherit",timeout:240000,maxBuffer:32*1024*1024});
      assert(result.status===0,"Isolated Astro build failed; no release permission");
      tested+=audit(dist,groups,indexable);
    }
    console.log(JSON.stringify({fixture:privateInput?"private-local":"synthetic",models:groups.length,specifications:rows.length,locales:PUBLIC_LOCALES.length,modelPages:tested,deploy:false}));
  }finally{rmSync(scratch,{recursive:true,force:true});}
}
if(process.env[child]==="1")installFetch();
else if(process.argv[1]&&resolve(process.argv[1])===file)main();
