// Shared read-only inspection of real head tags, not inert markup.
import {scanHeadTags} from "./verify-sitewide-meta-descriptions.mjs";
import {readOpeningTagAttribute as attr,googleIndexingBlockedByMeta} from "./seo-html-attributes.mjs";
export function readIndexingHead(html){
 const head=/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html)?.[1];
 const {links,metas}=scanHeadTags(head??"");
 return {
  hasHead:head!==undefined,
  canonical:links.filter(tag=>(attr(tag,"rel")||"").trim().toLowerCase().split(/\s+/).includes("canonical")).map(tag=>attr(tag,"href")),
  noindex:googleIndexingBlockedByMeta(metas),
  refresh:metas.some(tag=>(attr(tag,"http-equiv")||"").trim().toLowerCase()==="refresh")
 };
}
