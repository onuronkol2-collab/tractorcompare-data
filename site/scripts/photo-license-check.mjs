/**
 * Conservative discovery-time license gate for a potentially commercial
 * site that resizes and crops licensed photos. This is NOT publication approval:
 * exact visual identity, file page provenance, restrictions and attribution still
 * require human verification. A label and URL must describe the SAME license.
 */
function licenseFromName(value) {
  const name=String(value||"").trim().toLowerCase().replace(/[_\s]+/g," ");
  if(!name || /(?:non.?commercial|no.?derivatives|\b(?:nc|nd)\b)/i.test(name))return null;
  if(/^cc0(?:\s|$)/.test(name))return "cc0";
  if(/^cc\s*by-sa(?:\s|$)/.test(name))return "by-sa";
  if(/^cc\s*by(?:\s|$)/.test(name))return "by";
  if(/^public domain(?:\s|$)/.test(name))return "pd";
  return null;
}
function licenseFromUrl(value) {
  let url;
  try {url=new URL(String(value||""));}catch{return null;}
  if(!["https:","http:"].includes(url.protocol)||url.hostname!=="creativecommons.org"&&url.hostname!=="www.creativecommons.org"||
    url.username||url.password||url.port)return null;
  const path=url.pathname.toLowerCase().replace(/\/+$/,"");
  if(/^\/publicdomain\/zero\/[0-9]+(?:\.[0-9]+)?(?:\/deed(?:\.[a-z-]+)?)?$/.test(path))return "cc0";
  if(/^\/publicdomain\/mark\/[0-9]+(?:\.[0-9]+)?(?:\/deed(?:\.[a-z-]+)?)?$/.test(path))return "pd";
  const matched=path.match(/^\/licenses\/(by-sa|by)\/([0-9]+(?:\.[0-9]+)?)(?:\/deed(?:\.[a-z-]+)?)?$/);
  return matched?.[1]||null;
}
export function allowedPhotoReuseLicense(label,url) {
  const fromName=licenseFromName(label);
  const fromUrl=licenseFromUrl(url);
  return Boolean(fromName && fromUrl && fromName===fromUrl);
}
