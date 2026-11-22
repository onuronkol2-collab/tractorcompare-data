/**
 * Wikimedia Commons may return HTTP 200 with a JSON API "error".
 * Such responses must not silently look like a valid zero-candidate result.
 */
export function requireCommonsQueryResponse(body) {
  if(!body||typeof body!=="object"||Array.isArray(body))
    throw Error("Commons API returned invalid JSON response shape");
  if(body.error){
    const code=typeof body.error.code==="string"?body.error.code:"unknown";
    throw Error("Commons API reported an error: "+code.slice(0,80));
  }
  return body;
}
