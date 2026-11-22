/**
 * Pure, dependency-free inspection of rendered photo licensing JSON-LD.
 * Google image metadata associates the real image with contentUrl and the
 * specific Commons File page with acquireLicensePage.
 */
export function imageLicenseMetadataIssues(html, {
  siteOrigin = "https://tractorvs.com",
  expectedCopyrightOwner = null,
  prohibitCopyrightNotice = false
} = {}) {
  const issues = [];
  const photoObjects = [];
  const scripts = [...String(html).matchAll(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts) {
    try {
      const json = JSON.parse(script[1]);
      const objects = Array.isArray(json["@graph"]) ? json["@graph"] : [json];
      photoObjects.push(...objects.filter(obj => obj && obj["@type"] === "ImageObject"));
    } catch { issues.push("Invalid JSON-LD block"); }
  }
  if (photoObjects.length !== 1) {
    issues.push("Expected exactly one licensed hero ImageObject, found " + photoObjects.length);
    return { count: photoObjects.length, issues };
  }
  const photo = photoObjects[0];
  const safe = (value, host, pathnamePattern) => {
    if (typeof value !== "string") return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === host
        && !url.username && !url.password && pathnamePattern.test(url.pathname);
    } catch { return false; }
  };
  if (!safe(photo.contentUrl, new URL(siteOrigin).hostname, /^\/images\/tractors\/[a-z0-9-]+-1920\.jpg$/))
    issues.push("Unrecognised public first-party ImageObject.contentUrl");
  if (!safe(photo.license, "creativecommons.org", /^\/(?:licenses\/by(?:-sa)?\/(?:2|3|4)\.0\/|publicdomain\/zero\/1\.0\/)$/))
    issues.push("Missing or unapproved Creative Commons ImageObject.license");
  if (!safe(photo.acquireLicensePage, "commons.wikimedia.org", /^\/wiki\/File:.+/))
    issues.push("ImageObject.acquireLicensePage must link to the image-specific Commons File page");
  if (typeof photo.creditText !== "string" || !photo.creditText.trim())
    issues.push("Photographer and license attribution not available");
  if (photo.copyrightNotice !== undefined) {
    // A Google recommendation is not permission to invent image ownership.
    // Model-specific proof is enforced separately by the Commons online gate.
    const holder=photo.copyrightNotice;
    if (typeof holder!=="string" || !holder.trim() ||
        /©|(?:tractorvs(?:\.com)?)/i.test(holder) ||
        photo.creator?.name!==holder ||
        !String(photo.creditText||"").includes(holder) ||
        String(photo.license||"").includes("/publicdomain/zero/"))
      issues.push("Unverified ownership statement reintroduced");
  }
  if (expectedCopyrightOwner!==null && photo.copyrightNotice!==expectedCopyrightOwner)
    issues.push("Verified copyrightNotice missing or incorrect for source photograph");
  if (prohibitCopyrightNotice && photo.copyrightNotice!==undefined)
    issues.push("Unverified or CC0 photograph must not carry a copyrightNotice");
  if (typeof photo.url === "string" && photo.url.startsWith("https://commons.wikimedia.org/wiki/File:"))
    issues.push("Commons description page incorrectly declared as ImageObject.url instead of acquireLicensePage");
  return {
    count: photoObjects.length,
    issues,
    contentUrl: photo.contentUrl ?? null,
    license: photo.license ?? null,
    acquireLicensePage: photo.acquireLicensePage ?? null,
    copyrightNotice: photo.copyrightNotice ?? null,
  };
}
