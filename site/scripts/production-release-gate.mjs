/**
 * Fail-closed production release gate for TractorVS Cloudflare Workers Builds.
 * No credentials are printed or written; only build-time environment values
 * are inspected. CI/preview builds keep using "npm run build" normally.
 *
 * Cloudflare Workers Builds:
 * root directory: site
 * build command: npm run build:production
 * deploy command: npm run deploy:verified
 */
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {resolve,basename,join} from "node:path";
import {fileURLToPath} from "node:url";
import {verifyPublishedSiteInventory} from "./verify-published-site-inventory.mjs";
import {verifyUnifiedSitemapIndex} from "./verify-unified-sitemap-index.mjs";
import {auditBuiltImageAlts} from "./verify-sitewide-image-alts.mjs";
import {auditBuiltSeoTitles} from "./verify-sitewide-seo-titles.mjs";
import {auditBuiltMetaDescriptions} from "./verify-sitewide-meta-descriptions.mjs";
import {auditBuiltSocialMetadata} from "./verify-sitewide-social-metadata.mjs";
import {auditBuiltAstroAssets} from "./verify-static-assets-version-compat.mjs";
import {auditBuiltModelImageRights} from "./verify-built-model-image-rights.mjs";

const projectRoot=resolve(fileURLToPath(new URL("..",import.meta.url)));
const expectedOrigin="https://tractorvs.com";

function insist(ok,reason){
 if(!ok)throw new Error("[TractorVS RELEASE BLOCKED] "+reason);
}

function readJSON(filename){
 return JSON.parse(readFileSync(filename,"utf8"));
}
function validPublicKey(key){
 if(typeof key!=="string"||!key.trim())return false;
 const clean=key.trim();
 if(clean.startsWith("sb_secret_"))return false;
 if(clean.startsWith("sb_publishable_"))return clean.length>25;
 if(clean.split(".").length!==3)return false;
 try {
  const data=JSON.parse(Buffer.from(clean.split(".")[1],"base64url").toString("utf8"));
  return data.role==="anon";
 } catch{return false;}
}
export function verifyProductionConfiguration(env=process.env,dir=process.cwd()){
 const root=resolve(dir);
 insist(root===projectRoot,"Set Cloudflare Settings > Build > Root directory to site. Build/deploy must run inside site/, not repository root.");
 const pkg=readJSON(join(root,"package.json"));
 const wrangler=readJSON(join(root,"wrangler.jsonc"));
 insist(pkg.name==="tractorvs-site","Wrong package.json: expected site/package.json.");
 insist(typeof pkg.dependencies?.astro==="string"&&typeof pkg.devDependencies?.wrangler==="string",
   "Astro or Wrangler is missing from site/package.json.");
 insist(wrangler.name==="tractorvs-site","Worker name must be tractorvs-site.");
 insist(wrangler.main==="./worker/index.js"&&wrangler.assets?.directory==="./dist"&&wrangler.assets?.binding==="ASSETS",
   "Worker entrypoint/static-assets directory differs from reviewed configuration.");
 for(const route of ["/language/*","/api/visitor-country","/images/tractors/*"])
  insist(wrangler.assets?.run_worker_first?.includes(route),"Missing Worker route for "+route);
 // Root is a generated index.html; route it to Cloudflare Static Assets directly.
 insist(!wrangler.assets?.run_worker_first?.includes("/") &&
   !wrangler.assets?.run_worker_first?.includes("/*") &&
   !wrangler.assets?.run_worker_first?.includes("*"),
   "Canonical root must use static asset-first routing, not an unconditional Worker.");
 if(env.WORKERS_CI_BRANCH)
  insist(env.WORKERS_CI_BRANCH==="main","Production deploy is allowed only from main; not "+env.WORKERS_CI_BRANCH);
 insist(env.PUBLIC_INDEXING_ENABLED==="true",
   "PUBLIC_INDEXING_ENABLED=true is required in Cloudflare BUILD variables (not just runtime secrets).");
 insist(env.SITE_URL===expectedOrigin,
   "SITE_URL must equal https://tractorvs.com in Cloudflare BUILD variables.");
 let supabase;
 try{supabase=new URL(env.SUPABASE_URL||"");}catch{
  throw new Error("[TractorVS RELEASE BLOCKED] SUPABASE_URL is missing or invalid in Cloudflare BUILD variables.");
 }
 insist(supabase.protocol==="https:"&&!supabase.username&&!supabase.password&&!supabase.search&&!supabase.hash,
   "SUPABASE_URL must be an HTTPS project URL without credentials or query values.");
 const key=(env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY||"").trim();
 insist(validPublicKey(key),
   "Set ONLY a Supabase publishable (sb_publishable_) or legacy anon key in Cloudflare BUILD variables. Never use service-role/secret keys.");
 return {origin:expectedOrigin,worker:wrangler.name};
}

function readText(path){
 insist(existsSync(path),"Expected generated file is missing: "+path.replace(projectRoot,"site"));
 return readFileSync(path,"utf8");
}

export function verifyProductionArtifacts({dir=projectRoot,origin=expectedOrigin,minTractors=100}={}){
 const dist=join(dir,"dist");
 const html=readText(join(dist,"index.html"));
 const tr=readText(join(dist,"tr/index.html"));
 const robots=readText(join(dist,"robots.txt"));
 const sitemap=readText(join(dist,"sitemap-index.xml"));
 insist(!/noindex,nofollow|content="noindex/i.test(html),"English homepage is marked noindex.");
 insist(!/noindex,nofollow|content="noindex/i.test(tr),"Turkish homepage is marked noindex.");
 insist(html.includes('rel="canonical"')&&html.includes(origin),"English canonical is missing or wrong.");
 insist(tr.includes('rel="canonical"')&&tr.includes(origin+"/tr/"),"Turkish canonical is missing or wrong.");
 insist(robots.includes("Allow: /")&&!/Disallow:\s*\//.test(robots),"robots.txt blocks search engines.");
 insist(robots.includes(origin+"/sitemap-index.xml"),"robots.txt does not reference production sitemap.");
 insist(sitemap.includes("sitemap-"),"Sitemap index is empty.");
 // Deployment is blocked if independently generated forum/image maps are not
 // in the master index. GSC/Bing need only receive the root index in future.
 verifyUnifiedSitemapIndex({dist,origin});
 // Fail the production build if any published model image loses its actual
 // license, source, verified owner notice or safe no-notice status.
 const imageRights=auditBuiltModelImageRights({dist,origin});
 insist(imageRights.modelPagesWithPhotos>0,"No approved image metadata on generated tractor pages.");
 // The visible homepage must expose real, language-matched article discovery links.
 // Keep this after the original homepage/robots checks to catch broken localized builds.
 for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
  const prefix=locale==="en"?"":"/"+locale;
  const route=locale==="en"?"index.html":locale+"/index.html";
  const home=readText(join(dist,route));
  insist(home.includes('class="home-editorial"'),
    "Homepage missing contextual source-backed article section: "+locale);
  for(const suffix of ["/articles/","/guides/choosing-a-tractor/","/reviews/basak-2075-bk/"]){
   insist(home.includes('href="'+prefix+suffix+'"'),
     "Homepage missing an existing, localized editorial destination: "+locale+" "+suffix);
  }
 }
 // Evidence-based editorial archive must not silently disappear during deploy.
 const editorialSitemaps=readdirSync(dist)
  .filter(name=>name.startsWith("sitemap-")&&name.endsWith(".xml")&&name!=="sitemap-index.xml")
  .map(name=>readText(join(dist,name))).join("\n");
 for(const [route,locale] of [
  ["articles","en"],["tr/articles","tr"],["zh/articles","zh-Hans"],
  ["hi/articles","hi"],["pt-br/articles","pt-BR"],["fr/articles","fr"],
  ["de/articles","de"],["ru/articles","ru"],["ja/articles","ja"],
  ["es/articles","es"]
 ]){
  const article=readText(join(dist,route,"index.html"));
  const publicUrl=origin+"/"+route+"/";
  insist(!/noindex,nofollow|content="noindex/i.test(article),
    "Editorial hub cannot be noindex: "+route);
  insist(article.includes('rel="canonical" href="'+publicUrl+'"'),
    "Editorial hub has wrong canonical: "+route);
  insist(article.includes('lang="'+locale+'"'),
    "Editorial hub has wrong language: "+route);
  insist(article.includes('"CollectionPage"')&&article.includes('"ItemList"'),
    "Editorial hub missing structured collection data: "+route);
  insist((article.match(/class="editorial-card"/g)||[]).length>=6,
    "Editorial hub missing reviewed article links: "+route);
  insist(editorialSitemaps.includes("<loc>"+publicUrl+"</loc>"),
    "Editorial hub not included in generated sitemap: "+route);
 }
 for(const route of ["guides/tractor-technical-terms","tr/guides/tractor-technical-terms",
   "guides/pto-and-power-take-off","tr/guides/pto-and-power-take-off",
   "guides/tractor-hydraulic-lift-explained","tr/guides/tractor-hydraulic-lift-explained",
   "guides/tractor-engine-power-and-torque","tr/guides/tractor-engine-power-and-torque"]){
  const page=readText(join(dist,route,"index.html"));
  insist(!/noindex,nofollow/.test(page),"Guide unexpectedly has noindex: "+route);
  insist(editorialSitemaps.includes("<loc>"+origin+"/"+route+"/</loc>"),
    "Published evidence-based guide missing in generated sitemap: "+route);
  const relatedHub=route.startsWith("tr/")?"/tr/articles/":"/articles/";
  insist(page.includes('href="'+relatedHub+'"'),
    "Published guide missing the contextual editorial hub link: "+route);
  insist(page.includes('"BreadcrumbList"'),
    "Published guide has no factual BreadcrumbList: "+route);
 }
 const englishGlossary=readText(join(dist,"guides/tractor-technical-terms/index.html"));
 const turkishGlossary=readText(join(dist,"tr/guides/tractor-technical-terms/index.html"));
 for(const [locale,page] of [["en",englishGlossary],["tr",turkishGlossary]]){
  const terms=(page.match(/class="glossary-card"/g)||[]).length;
  const parts=(page.match(/class="part-card"/g)||[]).length;
  insist(terms>=96&&parts>=57,locale+" guide unexpectedly lost terms/parts ("+terms+"/"+parts+").");
 }
 const tractorDir=join(dist,"tractors");
 insist(existsSync(tractorDir),"Published model pages directory missing.");
 const tractors=readdirSync(tractorDir,{withFileTypes:true})
  .filter(entry=>entry.isDirectory()&&existsSync(join(tractorDir,entry.name,"index.html"))).length;
 const floor=Number(minTractors);
 insist(Number.isSafeInteger(floor)&&floor>=1,"MIN_PUBLIC_TRACTOR_PAGES must be a positive integer.");
 insist(tractors>=floor,
   "Only "+tractors+" English tractor pages generated, below safety floor "+floor+". Check Supabase public catalogue and build variables.");
 const turkishTractors=join(dist,"tr/tractors");
 const trCount=existsSync(turkishTractors)
  ?readdirSync(turkishTractors,{withFileTypes:true})
   .filter(entry=>entry.isDirectory()&&existsSync(join(turkishTractors,entry.name,"index.html"))).length : 0;
 insist(trCount===tractors,"TR/EN model-page counts differ ("+trCount+"/"+tractors+").");
 // Check ALL built HTML: also noindex forum pages, header/footer images, and
 // dormant lightboxes outside <main>. A missing alt blocks release, but a
 // deliberate alt="" is valid and must not be replaced with SEO filler.
 const imageAlt=auditBuiltImageAlts(dist);
 insist(imageAlt.missingAlt.length===0,
   "Missing image alt attributes on "+imageAlt.missingAlt.length+" built images: "+
   JSON.stringify(imageAlt.missingAlt.slice(0,8)));
 insist(imageAlt.undocumentedEmptyAlt.length===0,
   "Blank image alt without decorative context or dynamic-photo explanation: "+
   JSON.stringify(imageAlt.undocumentedEmptyAlt.slice(0,8)));
 // Full-build title integrity catches a new locale/model accidentally losing
 // its real identity even when the sitemap and generic title test still pass.
 // 60 characters is advisory, NOT a hard Google limit: report it, never
 // arbitrarily delete true model, market, variant or year details.
 const social=auditBuiltSocialMetadata(dist);
 insist(social.errors.length===0,
   "Incomplete or inconsistent social metadata: "+JSON.stringify(social.errors.slice(0,12)));
 insist(social.brandFallbackPages>0,
   "No branded fallback share previews detected; expected on pages without a verified photo.");
 const sharePng=readFileSync(join(dist,"images/tractorvs-share-card.png"));
 insist(sharePng.subarray(0,8).toString("hex")==="89504e470d0a1a0a" &&
   sharePng.readUInt32BE(16)===1200 && sharePng.readUInt32BE(20)===630,
   "Branded OG image is missing or malformed.");
 console.log("TRACTORVS_PRODUCTION_SOCIAL_METADATA "+JSON.stringify({
   indexablePages:social.indexablePages,brandedPreviews:social.brandFallbackPages,errors:social.errors.length
 }));
 const titleAudit=auditBuiltSeoTitles(dist);
 insist(titleAudit.errors.length===0,
   "Missing/multiple title or wrong model identity on "+titleAudit.errors.length+
   " generated pages: "+JSON.stringify(titleAudit.errors.slice(0,8)));
 insist(titleAudit.duplicates.length===0,
   "Different published model/variant URLs share an identical localized title: "+
   JSON.stringify(titleAudit.duplicates.slice(0,8)));
 // Every canonical, indexable HTML page must have exactly one nonblank meta
 // description. Long descriptions are editorial advisories, not ranking errors.
 // Noindex previews / ownership pages are intentionally outside this check.
 const metaAudit=auditBuiltMetaDescriptions(dist);
 insist(metaAudit.errors.length===0,
   "Missing, empty or duplicate descriptions on "+metaAudit.errors.length+
   " indexable pages: "+JSON.stringify(metaAudit.errors.slice(0,8)));
 console.log("TRACTORVS_PRODUCTION_META_AUDIT "+JSON.stringify({
   htmlDocuments:metaAudit.htmlDocuments,indexablePages:metaAudit.indexablePages,
   over160:metaAudit.over160,structuralErrors:metaAudit.errors.length,
   byLocale:metaAudit.byLocale
 }));
 // The 2026-11-22 production audit reached zero real model titles that
 // leak manufacturer brochure/source-table notes. Future source-note variants
 // require explicit editorial verification, not silent keyword truncation.
 insist(titleAudit.bibliographyTitles===0,
   "Unreviewed manufacturer bibliography text leaked into model SEO titles: "+
   JSON.stringify(titleAudit.bibliographyExamples.slice(0,8)));
 console.log("TRACTORVS_PRODUCTION_TITLE_AUDIT "+JSON.stringify({
   htmlDocuments:titleAudit.htmlDocuments,modelPages:titleAudit.modelPages,
   over60:titleAudit.over60,over105:titleAudit.over105,over160:titleAudit.over160,
   modelTitleDuplicates:titleAudit.duplicates.length,byLocale:titleAudit.byLocale
 }));
 if(titleAudit.duplicates.length)
   console.warn("TRACTORVS_MODEL_TITLE_DUPLICATES "+
     JSON.stringify(titleAudit.duplicates.slice(0,12)));
 // Catch broken first-party Astro script/style/font references before Cloudflare
 // receives a new asset manifest. This validates one built version; it cannot
 // prove that old tabs or rollout traffic will use a compatible Worker version.
 const assetGraph=auditBuiltAstroAssets(dist);
 insist(assetGraph.htmlDocuments>=10&&assetGraph.assetFiles>0&&assetGraph.referenceCount>0,
   "Astro asset integrity audit found no usable HTML or generated asset references.");
 insist(assetGraph.missingReferences.length===0,
   "Dangling Astro JS/CSS/font references: "+JSON.stringify(assetGraph.missingReferences.slice(0,10)));
 console.log("TRACTORVS_RELEASE_ASSET_GRAPH "+JSON.stringify({
   htmlPages:assetGraph.htmlDocuments,assetFiles:assetGraph.assetFiles,
   assetReferences:assetGraph.referenceCount,broken:assetGraph.missingReferences.length
 }));
 return {models:tractors,translatedModels:trCount,terms:96,parts:57,origin,
   imageAltPages:imageAlt.htmlPages,imageAltImages:imageAlt.images,
   decorativeOrPendingImageAlts:imageAlt.emptyAlt,
   titlePages:titleAudit.htmlDocuments,titleOver60:titleAudit.over60,
   titleOver105:titleAudit.over105,duplicateModelTitles:titleAudit.duplicates.length,
   bibliographyTitleCandidates:titleAudit.bibliographyTitles,
   metaIndexablePages:metaAudit.indexablePages,metaOver160:metaAudit.over160};
}

export function preflight(env=process.env){
 return verifyProductionConfiguration(env,projectRoot);
}
export function postflight(env=process.env){
 const config=preflight(env);
 const floor=env.MIN_PUBLIC_TRACTOR_PAGES?Number(env.MIN_PUBLIC_TRACTOR_PAGES):100;
 const basic=verifyProductionArtifacts({origin:config.origin,minTractors:floor});
 const protectedInventory=verifyPublishedSiteInventory({
  origin:config.origin,configuredMinimum:floor
 });
 return {...basic,...protectedInventory};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try {
  const mode=process.argv[2];
  insist(mode==="preflight"||mode==="postflight","Use preflight or postflight.");
  const result=mode==="preflight"?preflight():postflight();
  console.log("[TractorVS] Production "+mode+" OK: "+JSON.stringify(result));
 }catch(error){
  console.error(error instanceof Error?error.message:"Unknown release gate error");
  process.exitCode=1;
 }
}
