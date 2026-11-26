// The comparison JSON is a public rendering resource, not a search landing page.
// Do not block the fetch in robots.txt: crawlers must be able to see noindex.
import {readOpeningTagAttribute as attr,indexBlockingResponseHeader} from "./seo-html-attributes.mjs";
export function comparisonSampleId(html){
 const select=/<select\b(?:[^"'<>]|"[^"]*"|'[^']*')*\bid="tc-left"[^>]*>([\s\S]*?)<\/select>/i.exec(html)?.[1]??"";
 const first=/<option\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/i.exec(select)?.[0]??"";
 const id=attr(first,"value")??"";
 return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)?id:null;
}
export function comparisonDataProblems(response,body){
 const errors=[];
 if(response.status!==200)errors.push("http-"+response.status);
 if(!/^application\/json(?:;|$)/i.test(response.headers.get("content-type")??""))errors.push("wrong-mime");
 if(!indexBlockingResponseHeader(response.headers.get("x-robots-tag")))errors.push("missing-noindex");
 try{if(!Array.isArray(JSON.parse(body)))errors.push("invalid-shape");}catch{errors.push("invalid-json");}
 return errors;
}
