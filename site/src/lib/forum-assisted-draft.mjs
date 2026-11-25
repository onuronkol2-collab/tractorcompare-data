// Untrusted local draft data: no authentication, network or publication.
export const ASSISTED_DRAFT_MAX_BYTES = 65536;
const allowed = new Set(["version","title","body","category","locale","tractor_id"]);
const locales = new Set(["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]);
const categories = new Set(["general","questions","maintenance","reviews","news","comparison"]);
export function parseAssistedDraft(raw, maxBodyLength = 12000) {
  if(typeof raw !== "string" || new TextEncoder().encode(raw).length > ASSISTED_DRAFT_MAX_BYTES) throw Error("invalid");
  const d = JSON.parse(raw);
  if(!d || Array.isArray(d) || typeof d !== "object" || Object.keys(d).some(k=>!allowed.has(k)) || d.version !== 1) throw Error("invalid");
  if(typeof d.title !== "string" || typeof d.body !== "string") throw Error("invalid");
  const title=d.title.trim(), body=d.body.trim();
  if(title.length<12 || title.length>160 || /https?:\/\/|www\.|[\r\n]/i.test(title) || body.length<40 || body.length>Math.min(12000,maxBodyLength)) throw Error("invalid");
  if(!categories.has(d.category) || !locales.has(d.locale)) throw Error("invalid");
  const tractor_id=d.tractor_id??"";
  if(typeof tractor_id!=="string" || (tractor_id!=="" && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(tractor_id))) throw Error("invalid");
  return {title,body,category:d.category,source_locale:d.locale,tractor_id};
}
