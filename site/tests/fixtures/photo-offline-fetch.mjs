/**
 * Network-free integration fixture for TractorVS public/archived photo research.
 * Every fetch is stubbed. This file never sends a request to Wikimedia.
 */
const origin="https://tractorvs.com";
const files=[
  "File:Zetor MAJOR tractor.jpg",
  "File:Zetor PROXIMA tractor.jpg",
  "File:Kubota M5-112 tractor.jpg"
];
const xml=urls=>"<urlset>"+urls.map(u=>"<url><loc>"+u+"</loc></url>").join("")+"</urlset>";
const pages=[
  ["zetor-major","Zetor MAJOR","model-zetor-major"],
  ["zetor-proxima","Zetor PROXIMA","model-zetor-proxima"],
  ["kubota-m5","Kubota M5-112","model-kubota-m5"]
];
function response(body,type="application/json"){
  return {ok:true,status:200,headers:{get:key=>
    String(key).toLowerCase()==="content-type"?type:null},
    json:async()=>body,text:async()=>String(body)};
}
globalThis.fetch=async(input)=>{
  const url=new URL(input);
  if(url.hostname==="commons.wikimedia.org"){
    if(url.searchParams.get("list")==="search"){
      const term=url.searchParams.get("srsearch")||"";
      const brand=term.replace(/^intitle:/,"");
      return response({batchcomplete:true,query:{search:
        files.filter(title=>title.toLowerCase().includes(brand.toLowerCase()))
          .map(title=>({title}))}});
    }
    if(url.searchParams.has("titles")){
      const titles=url.searchParams.get("titles").split("|");
      return response({batchcomplete:true,query:{pages:titles.map(title=>({
        title,imageinfo:[{mime:"image/jpeg",
          url:"https://upload.wikimedia.org/"+encodeURIComponent(title)+".jpg",
          thumburl:"https://upload.wikimedia.org/thumb/"+encodeURIComponent(title)+".jpg",
          descriptionurl:"https://commons.wikimedia.org/wiki/"+title.replaceAll(" ","_"),
          width:1400,height:900,extmetadata:{
            LicenseShortName:{value:"CC BY-SA 4.0"},
            LicenseUrl:{value:"https://creativecommons.org/licenses/by-sa/4.0/"},
            Artist:{value:"Verified test photographer"}
          }}]
      }))}});
    }
    throw Error("Unexpected Wikimedia mock request: "+url);
  }
  if(url.origin!==origin)throw Error("External fetch disallowed: "+url);
  if(url.pathname==="/sitemap-index.xml")
    return response("<sitemapindex>"+["sitemap-0.xml","forum-sitemap.xml","image-sitemap.xml"]
      .map(x=>"<sitemap><loc>"+origin+"/"+x+"</loc></sitemap>").join("")+"</sitemapindex>","application/xml");
  if(url.pathname==="/sitemap-0.xml")
    return response(xml(pages.map(p=>origin+"/tractors/"+p[0]+"/")),"application/xml");
  if(url.pathname==="/forum-sitemap.xml"||url.pathname==="/image-sitemap.xml")
    return response(xml([]),"application/xml");
  const path=url.pathname.match(/^\/tractors\/([^/]+)\/$/);
  if(path){
    const p=pages.find(x=>x[0]===path[1]);
    if(!p)throw Error("Unexpected public model");
    const data={"@graph":[{"@type":"Thing",identifier:p[2],name:p[1]}]};
    return response('<html><script type="application/ld+json">'+JSON.stringify(data)+
      "</script></html>","text/html");
  }
  throw Error("Unexpected fetch "+url);
};
