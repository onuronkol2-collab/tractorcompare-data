// Deterministic, dependency-free HTML checks applied to EVERY publicly
// indexable sitemap page by production-seo-audit.mjs. These checks are not
// Lighthouse scores and intentionally do not run any tracking JavaScript.
export function inspectVisibleMainImages(html){
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if(main===undefined)return {foundMain:false,imagesChecked:0,missingAlt:[]};
  const imageTags=[...main.matchAll(/<img\b[^>]*>/gi)].map(match=>match[0]);
  const missingAlt=[];
  for(const [i,tag] of imageTags.entries()){
    // alt="" is correct for decorative images, but a missing alt attribute
    // is not. Support HTML's single and double-quoted attribute forms.
    if(!/\balt\s*=\s*(["'])[^"']*\1/i.test(tag))
      missingAlt.push(i+1);
  }
  return {foundMain:true,imagesChecked:imageTags.length,missingAlt};
}
