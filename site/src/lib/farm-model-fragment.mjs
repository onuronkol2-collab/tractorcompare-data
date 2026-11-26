export function equipmentModelFragment(slug){return typeof slug==="string"&&/^[a-z0-9-]{1,160}$/.test(slug)?"#farm-equipment--"+slug:"#farm-equipment";}
export function equipmentModelSlug(fragment){const match=typeof fragment==="string"?/^#farm-equipment--([a-z0-9-]{1,160})$/.exec(fragment):null;return match?.[1]??null;}
