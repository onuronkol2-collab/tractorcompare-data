/** Manufacturer-confirmed alternate sales names used for candidate discovery only.
 * These aliases never modify published records and never authorize a photo.
 */
const TYM_ALIAS = Object.freeze({
  T1025:"T255",
  T3047:"T475",
  T4057:"T575",
});

export function manufacturerPhotoAlias(brand, model) {
  if (brand !== "TYM") return null;
  return TYM_ALIAS[model] || null;
}

/** Require a complete alias token, e.g. T475 is NOT T475C. */
export function matchesManufacturerPhotoAlias(brand, model, fileTitle) {
  const alias = manufacturerPhotoAlias(brand, model);
  if (!alias) return false;
  const title = String(fileTitle || "").replace(/^File:/i, "").replace(/_/g, " ");
  if (!/(?:^|[^a-z0-9])TYM(?:$|[^a-z0-9])/i.test(title)) return false;
  return new RegExp("(?:^|[^a-z0-9])" + alias + "(?![a-z0-9])", "i").test(title);
}
