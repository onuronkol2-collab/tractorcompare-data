// Non-identifying GA4 product-goal labels. Paths only; never send search terms,
// tractor IDs, location, form values or user content as custom parameters.
export type AnalyticsGoal =
  | "tractor_advisor_view"
  | "tractor_compare_view"
  | "tractor_comparison_read"
  | "tractor_model_view";

const LOCALE_PREFIX = /^\/(?:tr|zh|hi|pt-br|fr|de|ru|ja|es)(?=\/)/;

export function analyticsGoalForPath(pathname: string): AnalyticsGoal | null {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) return null;
  const path = pathname.replace(LOCALE_PREFIX, "");
  if (path === "/farm-advisor/") return "tractor_advisor_view";
  if (path === "/compare/") return "tractor_compare_view";
  if (/^\/compare\/[a-z0-9-]+\/$/.test(path)) return "tractor_comparison_read";
  if (/^\/tractors\/[a-z0-9-]+\/$/.test(path)) return "tractor_model_view";
  return null;
}
