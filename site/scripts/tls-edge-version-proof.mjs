/**
 * Independent live TLS edge downgrade audit for TractorVS.
 *
 * A successful TLS 1.2/1.3 fetch alone does not prove TLS 1.0/1.1 are
 * rejected. For legacy TLS versions use an explicitly lowered client-side
 * OpenSSL cipher security level, then require the *remote peer* to report
 * a protocol-version alert. A local client error or timeout is INCONCLUSIVE,
 * not proof of a secure Cloudflare edge.
 *
 * Read-only public handshake: no Cloudflare credentials or changes.
 */
import tls from "node:tls";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

export const HOSTS=["tractorvs.com","www.tractorvs.com"];
export const VERSIONS=["TLSv1","TLSv1.1","TLSv1.2","TLSv1.3"];

export function classifyHandshake(version,{connected=false,protocol=null,authorized=null,error=null}={}){
  const legacy=version==="TLSv1"||version==="TLSv1.1";
  if(connected){
    if(legacy)return {status:"FAIL",reason:"legacy-handshake-accepted",protocol};
    if(protocol===version && authorized===true)return {status:"PASS",reason:"modern-handshake-valid",protocol};
    return {status:"FAIL",reason:"modern-version-or-cert-invalid",protocol};
  }
  const message=String(error?.message||"");
  const code=String(error?.code||"");
  // An explicit TLS protocol-version alert from the peer proves rejection
  // happened remotely; a local OpenSSL failure does not.
  const remoteProtocolAlert=/alert protocol version|tlsv1_alert_protocol_version|SSL_AD_PROTOCOL_VERSION/i
    .test(message+" "+code);
  if(legacy&&remoteProtocolAlert)
    return {status:"PASS",reason:"remote-protocol-version-alert",protocol:null};
  if(legacy)return {status:"INCONCLUSIVE",reason:"no-confirmed-peer-alert",protocol:null};
  return {status:"FAIL",reason:"modern-handshake-failed",protocol:null};
}

export async function probeVersion(host,version,connector=tls.connect){
  return await new Promise(resolveProbe=>{
    let socket;
    let settled=false;
    const finish=details=>{
      if(settled)return;
      settled=true;
      const assessment=classifyHandshake(version,details);
      try{socket?.destroy()}catch{}
      resolveProbe({host,version,...assessment,errorCode:details.error?.code??null});
    };
    try{
      socket=connector({
        host,port:443,servername:host,
        minVersion:version,maxVersion:version,
        ciphers:version==="TLSv1"||version==="TLSv1.1"?"DEFAULT:@SECLEVEL=0":"DEFAULT",
        rejectUnauthorized:true,
        timeout:9000,
      },()=>finish({connected:true,protocol:socket.getProtocol(),authorized:socket.authorized}));
      socket.once("error",error=>finish({error}));
      socket.once("timeout",()=>finish({error:new Error("network timeout")}));
    }catch(error){finish({error})}
  });
}

export async function checkTlsVersionFloor(probe=probeVersion){
  const results=[];
  for(const host of HOSTS){
    for(const version of VERSIONS){
      results.push(await probe(host,version));
    }
  }
  return {results,passed:results.every(x=>x.status==="PASS"),
    inconclusive:results.filter(x=>x.status==="INCONCLUSIVE").length,
    failures:results.filter(x=>x.status==="FAIL").length};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=await checkTlsVersionFloor();
  for(const result of report.results)
    console.log("TRACTORVS_TLS_VERSION_PROBE "+JSON.stringify(result));
  console.log("TRACTORVS_TLS_VERSION_SUMMARY "+JSON.stringify({
    tested:report.results.length,passed:report.passed,
    failures:report.failures,inconclusive:report.inconclusive
  }));
  if(!report.passed)process.exitCode=1;
}
