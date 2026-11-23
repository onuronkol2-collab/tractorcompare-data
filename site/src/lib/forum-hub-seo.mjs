// Only HTML metadata is extended. The visible forum introduction stays the
// existing localized text; no invented posts, ratings or user activity.
export const FORUM_HUB_META_OVERRIDES=Object.freeze({
 ja:"TractorVSのトラクターフォーラムでは、機種ごとの整備、故障、使用経験や仕様比較について情報交換できます。公開済みの投稿を閲覧でき、会員は質問や体験談を投稿できます。文章の投稿と写真の公開には別々の審査基準があります。",
 zh:"在TractorVS拖拉机论坛中，阅读已公开的机型讨论，交流使用经验、维护保养、已记录的故障及机型比较。登录会员可以发布问题和文字回复；图片须经过单独审核才能展示。讨论不代表所有生产年份和配置都存在同样问题。"
});
export function forumHubSeoDescription(lang,existingIntro){
 return FORUM_HUB_META_OVERRIDES[lang]??existingIntro;
}
