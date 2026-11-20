// Zero-paid, public-view-only publication monitor.
// Never reads draft tractors, never writes Supabase, never uses a service role.
// A changed fingerprint updates a small site file to request a fresh Cloudflare
// Git-connected build, with no artificial commit when the dataset is unchanged.
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { appendFileSync } from "node:fs";

export const PROJECT = "aaufxtcvnzgavtlintiv";
export const REPO = "onuronkol2-collab/tractorcompare-data";
export const SNAPSHOT_PATH = "site/src/data/public-catalog-sync.json";
const CATALOG = "https://" + PROJECT + ".supabase.co/rest/v1/tractorvs_public_specs";
const PAGE = 500;
const MAX_ROWS = 15_000;
const FIELDS = [
  "tractor_id", "brand_name", "model_name", "model_year", "variant", "market",
  "horsepower", "engine", "transmission", "drivetrain", "weight_kg",
  "spec_id", "spec_name", "spec_value", "unit", "canonical_key",
  "measurement_standard", "rated_rpm", "verified_at",
  "evidence_text", "source_url", "source_type",
].join(",");

export function validateScope(repo, ref) {
  if (repo !== REPO || ref !== "refs/heads/main") {
    throw new Error("Public-catalog sync only authorized in the TractorVS main branch.");
  }
}
export function validateAnon(jwt) {
  if (!jwt || jwt.split(".").length !== 3) throw new Error("A legacy anon JWT must be configured.");
  let payload;
  try { payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8")); }
  catch { throw new Error("Invalid legacy JWT format."); }
  if (payload?.role !== "anon") throw new Error("Service-role and authenticated JWTs are forbidden.");
}
function requireOk(response, allowed, what) {
  if (!allowed.includes(response.status)) throw new Error(what + " returned HTTP " + response.status);
}
export async function fingerprintPublicView({ jwt, fetchFn = fetch, maxRows = MAX_ROWS }) {
  validateAnon(jwt);
  if (!Number.isInteger(maxRows) || maxRows < 1 || maxRows > MAX_ROWS) throw new Error("Unsafe max rows.");
  const hash = createHash("sha256");
  const models = new Set();
  let reported = null;
  let read = 0;
  for (let offset=0; offset < maxRows; offset += PAGE) {
    const url = new URL(CATALOG);
    url.searchParams.set("select", FIELDS);
    url.searchParams.set("order", "tractor_id.asc,spec_id.asc");
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("limit", String(PAGE));
    const response = await fetchFn(url.toString(),{
      headers: {
        apikey:jwt, Authorization:"Bearer "+jwt,
        Prefer:"count=exact",Accept:"application/json",
      },
      signal:AbortSignal.timeout(25_000),
    });
    requireOk(response,[200,206],"Anon-only public view");
    const range = String(response.headers.get("content-range")||"");
    const match = range.match(/^(\d+)-(\d+)\/(\d+)$/);
    if (!match) throw new Error("Missing exact PostgREST content range.");
    const start = Number(match[1]), end = Number(match[2]), total = Number(match[3]);
    if (!Number.isSafeInteger(total) || total<=0 || total>maxRows) throw new Error("Public catalogue size unexpectedly large or empty.");
    if (reported === null) reported = total;
    if (reported !== total) throw new Error("Public data changed mid-read; safe retry at next schedule.");
    if (start !== offset || end < start || end >= total) throw new Error("Unexpected page boundaries.");
    const rows=await response.json();
    if (!Array.isArray(rows) || rows.length !== end-start+1) throw new Error("Incomplete public catalogue page.");
    for (const row of rows) {
      if (typeof row?.tractor_id !== "string" || typeof row?.model_name !== "string") {
        throw new Error("Public catalogue identity missing, refuse incomplete build.");
      }
      if (row.spec_id != null && typeof row.spec_id !== "string") throw new Error("Spec ID is invalid.");
      models.add(row.tractor_id);
      hash.update(JSON.stringify(row)+"\n");
      read++;
    }
    if (read >= total) {
      if(read!==total)throw new Error("Inconsistent public-view record count.");
      return { fingerprint: hash.digest("hex"), published_models: models.size,
               public_rows: read, source: "anon_public_view", scope: PROJECT };
    }
    if(rows.length!==PAGE)throw new Error("Premature pagination end.");
  }
  throw new Error("Reached public-catalogue safety limit.");
}
export async function getRecordedSnapshot({token,fetchFn=fetch}) {
  if(!token)throw new Error("Missing GitHub token.");
  const response=await fetchFn("https://api.github.com/repos/"+REPO+"/contents/"+SNAPSHOT_PATH+"?ref=main",{
    headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json"},
    signal:AbortSignal.timeout(20_000),
  });
  if(response.status===404)return {sha:null,record:null};
  requireOk(response,[200],"GitHub snapshot fetch");
  const file=await response.json();
  if(typeof file.sha!=="string" || file.encoding!=="base64" || typeof file.content!=="string"){
    throw new Error("Untrustworthy repository snapshot response.");
  }
  const record=JSON.parse(Buffer.from(file.content.replace(/\s/g,""),"base64").toString("utf8"));
  return {sha:file.sha,record};
}
export async function runPublicationSync({repo,ref,jwt,token,fetchFn=fetch,dryRun=false,now=new Date()}) {
  validateScope(repo,ref);
  const latest=await fingerprintPublicView({jwt,fetchFn});
  const stored=await getRecordedSnapshot({token,fetchFn});
  if(stored.record?.fingerprint===latest.fingerprint) {
    return {changed:false,committed:false,reason:"public_catalogue_unchanged",...latest};
  }
  if(dryRun)return {changed:true,committed:false,reason:"dry_run_no_commit",...latest};
  const payload=JSON.stringify({...latest,generated_at:now.toISOString()},null,2)+"\n";
  const message="chore(site): sync public catalogue revision ("+latest.published_models+" models)";
  const request={message,branch:"main",content:Buffer.from(payload,"utf8").toString("base64")};
  if(stored.sha)request.sha=stored.sha;
  const response=await fetchFn("https://api.github.com/repos/"+REPO+"/contents/"+SNAPSHOT_PATH,{
    method:"PUT",
    headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","Content-Type":"application/json"},
    body:JSON.stringify(request),
    signal:AbortSignal.timeout(25_000),
  });
  requireOk(response,[200,201],"GitHub site revision write");
  const data=await response.json();
  if(typeof data?.commit?.sha!=="string")throw new Error("GitHub site revision commit missing.");
  return {changed:true,committed:true,reason:"main_site_revision_committed",...latest,commit:data.commit.sha};
}
export async function main(){
  const result=await runPublicationSync({
    repo:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,
    jwt:process.env.TRACTORVS_SUPABASE_ANON_JWT,
    token:process.env.GITHUB_TOKEN,
    dryRun:process.env.TRACTORVS_CATALOG_DRY_RUN==="true",
  });
  const line="TractorVS public-site sync: "+result.reason+"; published_models="+
    result.published_models+"; public_rows="+result.public_rows+"; committed="+result.committed;
  console.log(line);
  if(process.env.GITHUB_STEP_SUMMARY){
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,"## Public catalogue revision\n\n- "+line+
    "\n- This Git commit requests a Cloudflare Git build; it does NOT prove a production deployment or Google indexing.\n");
  }
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
