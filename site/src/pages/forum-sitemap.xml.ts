import type {APIRoute} from "astro";
import {LOCALES,localizedPath} from "../lib/locales.ts";
import {publishedForumTopics} from "../lib/forum.ts";

// Supplemental indexable-only forum sitemap. Unlike a raw sitemap of all UGC,
// this includes no pending posts, hidden tests or thin/disapproved translations.
export const prerender=true;
const escapeXml=(v:string)=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;")
 .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export const GET:APIRoute=async ({site})=>{
 const indexable=import.meta.env.PUBLIC_INDEXING_ENABLED==="true" && !!site;
 const urls:string[]=[];
 if(indexable){
  for(const locale of LOCALES){
   const visible=(await publishedForumTopics(locale)).filter(x=>
    x.seo_ready===true&&x.status==="published"&&x.title.trim().length>=12
    &&x.body.trim().length>=150);
   if(visible.length){
    urls.push('<url><loc>'+escapeXml(new URL(localizedPath(locale,"/forum/"),site).toString())+'</loc></url>');
   }
   for(const topic of visible){
    const url=new URL(localizedPath(locale,"/forum/"+topic.slug+"/"),site).toString();
    const lastmod=Date.parse(topic.updated_at);
    urls.push('<url><loc>'+escapeXml(url)+'</loc>'+
      (Number.isFinite(lastmod)?'<lastmod>'+new Date(lastmod).toISOString().slice(0,10)+'</lastmod>':"")+
      '</url>');
   }
  }
 }
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.join("")+'</urlset>';
 return new Response(xml,{headers:{"Content-Type":"application/xml; charset=utf-8",
  "Cache-Control":"public, max-age=900"}});
};
