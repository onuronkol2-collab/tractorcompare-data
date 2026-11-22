import type {APIRoute} from "astro";
import {getPublicCatalog} from "../lib/catalog";
import {LOCALES,localizedPath} from "../lib/locales";
import {tractorPhotos} from "../lib/tractor-photos";
import {allPublicForumTopics,allPublicForumReplies,allPublicForumMedia,forumMediaImageUrl,isIndexableForumTopic} from "../lib/forum";

import {editorialImagePages} from "../lib/editorial-photos.ts";

export const prerender=true;
const escapeXml=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export const GET:APIRoute=async({site})=>{
  const enabled=import.meta.env.PUBLIC_INDEXING_ENABLED==="true" && Boolean(site);
  const entries:string[]=[];
  if(enabled){
    const catalog=await getPublicCatalog(); // Published models only, never drafts.
    for(const tractor of catalog.tractors){
      const photos=tractorPhotos(tractor);
      if(!photos.length)continue;
      const photoXml=photos.map(photo=>"<image:image><image:loc>"+
        escapeXml(new URL(photo.fullUrl,site!).toString())+
        "</image:loc></image:image>").join("");
      for(const locale of LOCALES){
        const page=new URL(localizedPath(locale,"/tractors/"+tractor.slug+"/"),site!).toString();
        entries.push("<url><loc>"+escapeXml(page)+"</loc>"+photoXml+"</url>");
      }
    }
    for(const [path,photos] of editorialImagePages){
      const images=photos.map(photo=>"<image:image><image:loc>"+
        escapeXml(new URL(photo.fullUrl,site!).href)+"</image:loc></image:image>").join("");
      entries.push("<url><loc>"+escapeXml(new URL(path,site!).href)+"</loc>"+images+"</url>");
    }
    // Include ONLY approved private-bucket-gateway photos attached to fully
    // moderated, genuinely indexable forum pages. Drafts, rejected images,
    // unauthorized uploads and thin/untranslated UGC are never added.
    const [forumTopics,forumReplies,forumPhotos]=await Promise.all([
      allPublicForumTopics(),allPublicForumReplies(),allPublicForumMedia()
    ]);
    const replyTopicIds=new Map(forumReplies.filter(row=>!row.machine_translated)
      .map(row=>[row.id,row.topic_id]));
    for(const topic of forumTopics){
      if(!isIndexableForumTopic(topic))continue;
      const media=forumPhotos.filter(photo=>
        photo.topic_id===topic.topic_id ||
        (photo.reply_id!==null&&replyTopicIds.get(photo.reply_id)===topic.topic_id));
      if(!media.length)continue;
      const page=new URL(localizedPath(topic.locale,"/forum/"+topic.slug+"/"),site!).toString();
      const photos=media.map(photo=>"<image:image><image:loc>"+
        escapeXml(forumMediaImageUrl(photo.id))+"</image:loc></image:image>").join("");
      entries.push("<url><loc>"+escapeXml(page)+"</loc>"+photos+"</url>");
    }
  }
  const body='<?xml version="1.0" encoding="UTF-8"?>\n'+
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '+
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+
    entries.join("")+"</urlset>";
  return new Response(body,{headers:{"Content-Type":"application/xml; charset=utf-8",
    "Cache-Control":"public, max-age=3600"}});
};
