import {readOpeningTagAttribute} from "./seo-html-attributes.mjs";

// The caller supplies real <link> elements from the public page head. Keep a
// reference count per document so a single missing shared file is reported once.
export function localStylesheets(links,page) {
  const document = new URL(page);
  const files = new Set();
  for (const tag of links) {
    const rel = readOpeningTagAttribute(tag,"rel") || "";
    if (!rel.toLowerCase().split(/\s+/).includes("stylesheet")) continue;
    const href = readOpeningTagAttribute(tag,"href");
    if (!href?.trim()) throw Error("Stylesheet link has an empty href");
    const url = new URL(href.replaceAll("&amp;","&"),document);
    if (url.origin !== document.origin || url.username || url.password) continue;
    url.hash = "";
    files.add(url.href);
  }
  return files;
}

export function stylesheetProblem(response,body) {
  if (response.status !== 200) return "HTTP "+response.status;
  const mime = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (mime !== "text/css") return "Unexpected Content-Type "+(mime || "(empty)");
  if (!body.trim() || /^\s*</.test(body)) return "Empty stylesheet or markup in CSS response";
  return null;
}
