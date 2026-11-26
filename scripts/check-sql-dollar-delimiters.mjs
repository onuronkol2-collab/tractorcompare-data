import {readFileSync} from "node:fs";
import assert from "node:assert/strict";

// Cheap targeted guard against JS replacement-string $$ -> $ corruption.
// PostgreSQL remains the authoritative syntax and semantic verifier.
const malformed = /\b(?:DO|AS|END)\s+\$(?![\w$])(?=\s*(?:BEGIN\b|DECLARE\b|SELECT\b|;))/i;
export function delimiterIssues(sql){
  return sql.split(/\r?\n/).flatMap((line,i)=>
    !line.trimStart().startsWith("--") && malformed.test(line)
      ? [i+1] : []);
}
const args=process.argv.slice(2);
if(args.includes("--self-test")){
  for(const value of ["DO $ BEGIN", "DO $ DECLARE", "END $;", "AS $ SELECT 1;"])
    assert.deepEqual(delimiterIssues(value),[1],value);
  for(const value of ["DO $$ BEGIN", "END $$;", "DO $fixture$ BEGIN", "END $fixture$;", "AS $$ SELECT 1 $$;", "-- DO $ BEGIN", "SELECT $1;"])
    assert.deepEqual(delimiterIssues(value),[],value);
  console.log("SQL delimiter preflight self-tests passed");
}
let failed=false;
for(const path of args.filter(x=>x!=="--self-test")){
  const bad=delimiterIssues(readFileSync(path,"utf8"));
  for(const line of bad){
    console.error(path+":"+line+": probable corrupted dollar quote; restore the complete PostgreSQL delimiter");
    failed=true;
  }
}
if(failed)process.exitCode=1;
