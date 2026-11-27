import {resolve} from "node:path";
import {builtHtmlDocuments} from "./built-html-documents.mjs";
import {createImageAltCollector} from "./verify-sitewide-image-alts.mjs";
import {createSeoTitleCollector} from "./verify-sitewide-seo-titles.mjs";
import {scanHeadTags,createMetaDescriptionCollector} from "./verify-sitewide-meta-descriptions.mjs";
import {createSocialMetadataCollector} from "./verify-sitewide-social-metadata.mjs";

export function auditAllBuiltHtml(directory){
 const root=resolve(directory),start=performance.now();
 const collectors={imageAlt:createImageAltCollector(root),social:createSocialMetadataCollector(root),titleAudit:createSeoTitleCollector(root),metaAudit:createMetaDescriptionCollector(root)};
 let pages=0;
 for(const {file,html} of builtHtmlDocuments(root)){
  pages++;
  // Cache only the current immutable HTML string's exact head tokens.
  // Never persist or reuse tokens across pages, builds or releases.
  const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1];
  const parsedHead=head?scanHeadTags(head):undefined;
  for(const collector of Object.values(collectors))collector.add(file,html,parsedHead);
 }
 const result=Object.fromEntries(Object.entries(collectors).map(([key,c])=>[key,c.finish()]));
 if(process.env.TRACTORVS_BUILD_PROFILE==="true")console.log("TRACTORVS_HTML_AUDIT_TIMING "+JSON.stringify({pages,elapsedMs:Math.round(performance.now()-start)}));
 return result;
}
