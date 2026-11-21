/**
 * A forum language hub becomes a valid hreflang alternate ONLY after at least
 * one topic in that language passes the same public SEO gate as the forum
 * sitemap. Never point an indexable hub to empty/noindex language hubs.
 */
export function approvedForumHubLocales(topics,localeOrder,isIndexable){
 const valid=new Set(topics.filter(isIndexable).map(topic=>topic.locale));
 return localeOrder.filter(locale=>valid.has(locale));
}
