/**
 * Read-only Search Console copyright candidate audit.
 * One Commons API batch for 23 remaining UNIQUE images; no ownership inferred.
 */
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {fetchCommonsJson} from "./photo-commons-http.mjs";

export const GOOGLE_REMAINING_IMAGE_IDS=[
 "tafe-7515-d8c32d69","valtra-n175-e4277f5d",
 "antonio-carraro-tony-8700-v-3a40790b","tafe-7515-cab-37863e86",
 "versatile-nemesis-255-be32337e","zetor-forterra-110-536b7625",
 "tafe-6028-m-826b548b","zetor-forterra-140-346bcbde",
 "tafe-240-s-c45f9eaf","valtra-t255-622d182c",
 "versatile-nemesis-175-e95b1863","valtra-q265-65863feb",
 "fendt-724-vario-01a39bcb","valtra-g135-9d4a4ea3",
 "swaraj-735-fe-0269bdfd","valtra-q245-2d50312e",
 "belarus-132n-picture30-2011","valtra-n135-beef7a3c",
 "valtra-t215-88d0ab88","valtra-a105-cd63351d",
 "valtra-f105-80828837","valtra-a85-af39c01a",
 "valtra-a75-f99b4394"
];
const normTitle=s=>String(s||"").replaceAll("_"," ").normalize("NFC").trim().toLowerCase();
const normAuthor=s=>String(s||"").replaceAll("_"," ").normalize("NFC").trim().toLowerCase();
export function inspectCommonsCandidate(wikitext,photo){
 const body=String(wikitext||"");
 const source=(body.match(/(?:^|\n)\s*\|\s*source\s*=\s*([^\r\n]{0,450})/i)||[])[1]||"";
 const author=(body.match(/(?:^|\n)\s*\|\s*author\s*=\s*([^\r\n]{0,650})/i)||[])[1]||"";
 const ownWork=/\{\{\s*own(?:\s*[|}])/i.test(source)||/\bown work\b/i.test(source);
 const expected=normAuthor(photo.photographer);
 const authorMatch=expected.length>2&&normAuthor(author).includes(expected);
 const licenseCode=String(photo.licenseName||"").toLowerCase().replaceAll(" ","-");
 const selfDeclarations=body.match(/\{\{\s*self\s*\|[^\r\n}]{0,350}/gi)||[];
 const selfLicense=licenseCode!=="cc0"&&selfDeclarations.some(x=>x.toLowerCase().includes(licenseCode));
 const cc0=photo.licenseName==="CC0";
 return {fileId:photo.fileId,brand:photo.brand,model:photo.model,
   photographer:photo.photographer,license:photo.licenseName,
   ownWork,authorMatch,selfLicense,cc0,
   likelySelfDeclaredRights:ownWork&&authorMatch&&selfLicense&&!cc0,
   sourcePage:photo.sourcePage};
}
export async function auditSearchConsoleCandidates({fetchJson=fetchCommonsJson}={}){
 const ids=GOOGLE_REMAINING_IMAGE_IDS;
 if(new Set(ids).size!==23)throw Error("Search Console inventory count changed");
 const photos=ids.map(id=>{
   const p=APPROVED_TRACTOR_PHOTOS.find(x=>x.fileId===id);
   if(!p)throw Error("Search Console photo absent: "+id);
   return p;
 });
 const titles=photos.map(p=>decodeURIComponent(p.sourcePage.split("/wiki/")[1]).replaceAll("_"," "));
 const url=new URL("https://commons.wikimedia.org/w/api.php");
 for(const [key,value] of Object.entries({action:"query",prop:"revisions",rvprop:"content",
   rvslots:"main",format:"json",formatversion:"2",maxlag:"5",titles:titles.join("|")}))
   url.searchParams.set(key,value);
 const json=await fetchJson(url.toString());
 if(!Array.isArray(json?.query?.pages))throw Error("Commons API returned no pages");
 const rows=photos.map((p,i)=>{
   const page=json.query.pages.find(x=>normTitle(x.title)===normTitle(titles[i]));
   if(!page||page.missing)throw Error("Commons file absent "+p.fileId);
   const wikitext=page.revisions?.[0]?.slots?.main?.content??
     page.revisions?.[0]?.slots?.main?.["*"]??page.revisions?.[0]?.["*"];
   if(typeof wikitext!=="string")throw Error("Commons file wikitext absent "+p.fileId);
   const review=inspectCommonsCandidate(wikitext,p);
   if(["belarus-132n-picture30-2011","swaraj-735-fe-0269bdfd"].includes(p.fileId)){
     const licenseTemplates=[...wikitext.matchAll(/\{\{[^\r\n}]{0,180}\}\}/g)]
       .map(x=>x[0]).filter(x=>/cc-by|gfdl|self|copyright|license|flickr/i.test(x)).slice(0,15);
     const firstDescription=String(wikitext).slice(0,1200);
     console.log("TRACTOR_COPYRIGHT_HARD_CASE "+JSON.stringify({
        fileId:p.fileId,licenseTemplates,description:firstDescription
     }));
   }
   return review;
 });
 for(const row of rows)console.log("TRACTOR_COPYRIGHT_RESEARCH "+JSON.stringify(row));
 console.log("TRACTOR_COPYRIGHT_RESEARCH_SUMMARY "+JSON.stringify({
   requested:23,reviewable:rows.filter(r=>r.likelySelfDeclaredRights).length,
   needsReview:rows.filter(r=>!r.likelySelfDeclaredRights&&!r.cc0).length,
   cc0:rows.filter(r=>r.cc0).length
 }));
 return rows;
}
if(import.meta.url===new URL("file://"+process.argv[1]).href){
 try{await auditSearchConsoleCandidates();}
 catch(e){console.error("TRACTOR_COPYRIGHT_RESEARCH_FAILED "+String(e));process.exitCode=1;}
}
