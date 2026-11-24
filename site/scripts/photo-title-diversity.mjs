import {matchesPhotoFileModel} from "./photo-model-identity.mjs";
import {matchesManufacturerPhotoAlias} from "./photo-model-aliases.mjs";
// Round-robin by model rather than the first N matching search results.
// Existing per-brand metadata budget and API request count stay bounded.
export function selectDiversePhotoTitles(brand,models,fileTitles,limit=90){
 const match=(m,t)=>matchesPhotoFileModel(brand,m.model,t)||matchesManufacturerPhotoAlias(brand,m.model,t);
 const titles=[...new Set(fileTitles)];
 const groups=models.map(m=>titles.filter(t=>match(m,t))).filter(g=>g.length);
 const selected=new Set();
 for(let i=0;groups.some(g=>i<g.length)&&selected.size<limit;i++){
  for(const g of groups){if(g[i])selected.add(g[i]);if(selected.size>=limit)break;}
 }
 return [...selected];
}
