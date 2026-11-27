import {localizedPath,LOCALE_TAGS,type Locale} from "./locales.ts";

type ToolPath="/guides/farm-cost-calculator/"|"/farm-advisor/";

/** Describes a genuine public tool page. No ratings, product offers,
 * fictional authors, app-store listing or rich-result eligibility claims.
 * The breadcrumb labels and links also appear in the rendered page. */
export function farmToolPageData(lang:Locale,path:ToolPath,base:URL,name:string,description:string){
 const url=new URL(localizedPath(lang,path),base).toString();
 const home=new URL(localizedPath(lang,"/"),base).toString();
 const breadcrumb=url+"#breadcrumb";
 return {
  "@context":"https://schema.org",
  "@graph":[
   {"@type":"WebPage","@id":url+"#webpage",url,name,description,inLanguage:LOCALE_TAGS[lang],
    breadcrumb:{"@id":breadcrumb}},
   {"@type":"BreadcrumbList","@id":breadcrumb,itemListElement:[
    {"@type":"ListItem",position:1,name:"TractorVS",item:home},
    {"@type":"ListItem",position:2,name,item:url}
   ]}
  ]
 };
}
