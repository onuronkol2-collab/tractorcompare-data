/** Private input rows must never become public research artifact entries. */
export function normalizePrivatePhotoResearchRows(input) {
  if (!Array.isArray(input)) throw TypeError("Private inventory must be a JSON array");
  return input.filter(row=>row?.brand&&row?.model).map(row=>{
    // Page identifiers and status from external private inventory are not
    // authority for public visibility; only the live sitemap can prove that.
    const {pageUrl,publicPages,...rest}=row;
    return {...rest,status:"draft",pageUrl:null};
  });
}
