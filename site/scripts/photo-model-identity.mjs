/** Candidate-title matching only. Positive results are NOT photo or license approval. */
const BRAND_NAMES={
  "Başak Traktör":["Başak","Basak","Başak Traktör","Basak Traktor"],
  "LS Tractor":["LS Tractor","LS"],
  "Deutz-Fahr":["Deutz-Fahr","Deutz Fahr"],
  "Tümosan":["Tümosan","Tumosan"],
  "Lamborghini Trattori":["Lamborghini","Lamborghini Trattori"]
};
const fold=value=>String(value??"").normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").replace(/\u0131/g,"i").toLowerCase();
function escapeRegex(value){return value.replace(/[\\^$.*+?()[\]{}|]/g,"\\$&");}
function tokenPattern(text){
  const tokens=fold(text).split(/[^a-z0-9]+/).filter(Boolean);
  if(!tokens.length)return null;
  return new RegExp("(?<![a-z0-9])"+tokens.map(escapeRegex).join("[^a-z0-9]*")+"(?![a-z0-9])","i");
}
export function matchesPhotoFileModel(brand,model,fileTitle){
  const title=fold(String(fileTitle??"").replace(/^File:/i,"").replace(/_/g," "));
  const brandNames=BRAND_NAMES[brand]||[brand];
  if(!brandNames.some(name=>tokenPattern(name)?.test(title)))return false;
  const variants=String(model??"").split(/\s*\|\s*/).filter(Boolean);
  if(!variants.length)return false;
  return variants.some(name=>{
    const p=tokenPattern(name);
    if(!p)return false;
    const match=p.exec(title);
    if(!match)return false;
    const before=title.slice(0,match.index);
    const after=title.slice(match.index+match[0].length);
    const following=after.match(/^[^a-z0-9]+([a-z0-9]+)/i)?.[1];
    // Subseries/engine designators are not the series itself:
    // X4 is not X4.085, 5090 D is not 5090.D5, and 5-110 is not 5-110 HC.
    if(/^[.\-][0-9]/i.test(after))return false;
    if(["hc","tm","tc"].includes(following||"")&&!new RegExp("\\b"+following+"\\b","i").test(name))return false;
    const isNumericLessSeries=!/[0-9]/.test(name);
    const isShortAlphaNumericSeries=/^[a-z]{1,3}[0-9]{1,2}$/i.test(name.trim());
    if((isNumericLessSeries||isShortAlphaNumericSeries) && /^\s+[0-9]/.test(after))return false;
    if(isNumericLessSeries && /[0-9]{2,5}\s*$/.test(before))return false;
    return true;
  });
}
