/** Metadata triage only. Never grants publication rights. IDs from Flickr's
 * current official licenses.getInfo documentation, checked 2026-11-28.
 * No request, download, scraping, secret or publication mutation. */
const candidateIds=new Set(['4','5','9','11','12']); // BY/SA legacy, CC0, BY/SA 4.0
export function triageFlickrLicenseId(value){
 const id=typeof value==='string'?value:typeof value==='number'&&Number.isSafeInteger(value)?String(value):'';
 if(id==='10')return {status:'public_domain_mark_review',publicationAuthorized:false,requires:'actual rights holder and worldwide rights evidence; prefer CC0 or written grant'};
 if(candidateIds.has(id))return {status:'license_candidate',publicationAuthorized:false,requires:'file page, exact license version, creator, provenance, identity and original bytes'};
 if(id==='7'||id==='8')return {status:'special_rights_review',publicationAuthorized:false,requires:'specific institution and applicable rights proof'};
 return {status:'held',publicationAuthorized:false,requires:'compatible rights evidence or permission'};
}
