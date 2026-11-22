/**
 * Public Supabase Auth configuration read: no users, emails, passwords, secrets
 * or login attempts. Provider "enabled" does NOT prove working OAuth flow.
 */
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export function assessAuthPublicSettings(settings){
  if(!settings||typeof settings!=="object"||!settings.external||
    typeof settings.external!=="object"||typeof settings.disable_signup!=="boolean")
    return {passed:false,reason:"incomplete-auth-settings"};
  const email=settings.external.email===true;
  const disabled=settings.disable_signup;
  const providers={
    email,
    google:settings.external.google===true,
    github:settings.external.github===true
  };
  return {passed:email&&!disabled,reason:email&&!disabled?"signup-config-present":"email-signup-disabled",
    disableSignup:disabled,providers};
}

export async function checkAuthSettings({origin="https://aaufxtcvnzgavtlintiv.supabase.co",anonKey,fetchFn=fetch}={}){
  if(typeof anonKey!=="string"||!anonKey.trim())throw Error("Public anon key unavailable");
  const base=new URL(origin);
  if(base.protocol!=="https:"||base.pathname!=="/"||base.username||base.password||base.search||base.hash)
    throw Error("Invalid Supabase origin");
  const res=await fetchFn(new URL("/auth/v1/settings",base),{
    headers:{apikey:anonKey,Accept:"application/json"},
    redirect:"error",cache:"no-store",signal:AbortSignal.timeout(10000)
  });
  if(res.status!==200)return {passed:false,httpStatus:res.status,reason:"settings-unavailable"};
  const settings=await res.json();
  return {httpStatus:res.status,...assessAuthPublicSettings(settings)};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const result=await checkAuthSettings({anonKey:process.env.TRACTORVS_SUPABASE_ANON_JWT});
    console.log("TRACTORVS_FORUM_AUTH_SETTINGS "+JSON.stringify(result));
    if(!result.passed)process.exitCode=1;
  }catch(error){
    console.error("TRACTORVS_FORUM_AUTH_SETTINGS_ERROR "+String(error?.message||error));
    process.exitCode=1;
  }
}
