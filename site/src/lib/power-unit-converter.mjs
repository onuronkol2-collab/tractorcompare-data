/** NIST SP 811, Appendix B.9, Power: mechanical hp and metric horsepower.
 * The published conversion factors are rounded; never infer a power test type.
 */
export const POWER_UNITS = Object.freeze(["kw", "hp", "ps"]);
export const POWER_FACTOR_KW = Object.freeze({kw:1,hp:0.7456999,ps:0.7354988});
export const POWER_SOURCE = "https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9";
export function convertPower(value, from) {
  if (typeof value!=="number" || !Number.isFinite(value) || value<0 || value>1000000 || !POWER_UNITS.includes(from)) return null;
  const kw=value*POWER_FACTOR_KW[from];
  return {kw,hp:kw/POWER_FACTOR_KW.hp,ps:kw/POWER_FACTOR_KW.ps};
}
