import type {APIRoute} from "astro";
import {getPublicCatalog} from "../lib/catalog";
import {LOCALES,localizedPath} from "../lib/locales";
import {tractorPhotos} from "../lib/tractor-photos";

export const prerender=true;
const escapeXml=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export const GET:APIRoute=async({site})=>{
  const enabled=import.meta.env.PUBLIC_INDEXING_ENABLED==="true" && Boolean(site);
  const entries:string[]=[];
  if(enabled){
    const catalog=await getPublicCatalog(); // Published models only, never drafts.
    for(const tractor of catalog.tractors){
      for(const photo of tractorPhotos(tractor)){
        for(const locale of LOCALES){
          const page=new URL(localizedPath(locale,"/tractors/"+tractor.slug+"/"),site!).toString();
          entries.push("<url><loc>"+escapeXml(page)+"</loc><image:image><image:loc>"+
            escapeXml(new URL(photo.fullUrl,site!).toString())+"</image:loc></image:image></url>");
        }
      }
    }
  }
  const body='<?xml version="1.0" encoding="UTF-8"?>\n'+
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '+
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+
    entries.join("")+"</urlset>";
  return new Response(body,{headers:{"Content-Type":"application/xml; charset=utf-8",
    "Cache-Control":"public, max-age=3600"}});
};
