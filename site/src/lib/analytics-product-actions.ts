// Non-identifying product-intent analytics names shared by the opt-in tracker.
// No form fields, URLs, model identifiers, or visitor data accompany events.
export const PRODUCT_ACTION_EVENTS = Object.freeze({
  compareLaunch: "tractor_compare_launch",
  advisorCalculated: "tractor_advisor_calculated",
} as const);

// The advisor emits this local DOM event only after rendering valid results.
export const ADVISOR_CALCULATION_DONE_EVENT = "tractorvs:advisor-calculation-complete" as const;
