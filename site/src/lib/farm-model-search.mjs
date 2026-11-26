/** Locale-aware literal token search, no regex interpolation or network. */
export function normalizeModelSearch(value){
 return typeof value==="string"?value.normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase().replace(/ı/g,"i").trim().replace(/\s+/g," "):"";
}
export function matchingModelIndexes(names,query){
 if(!Array.isArray(names)||typeof query!=="string"||query.length>120)return [];
 const tokens=normalizeModelSearch(query).split(" ").filter(Boolean);
 return names.flatMap((name,index)=>tokens.every(token=>normalizeModelSearch(name).includes(token))?[index]:[]);
}
