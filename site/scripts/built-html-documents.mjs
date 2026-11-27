import {readdirSync,readFileSync} from "node:fs";
import {join,relative,resolve} from "node:path";

// Synchronous, bounded-memory stream. Same directory traversal and file filter
// as the original independent audits; no persistent cache or symlink expansion.
export function* builtHtmlDocuments(directory){
 const root=resolve(directory);
 function* walk(current){
  for(const entry of readdirSync(current,{withFileTypes:true})){
   const path=join(current,entry.name);
   if(entry.isDirectory())yield* walk(path);
   else if(entry.isFile()&&entry.name.endsWith(".html"))
    yield {file:relative(root,path).replaceAll("\\","/"),html:readFileSync(path,"utf8")};
  }
 }
 yield* walk(root);
}
