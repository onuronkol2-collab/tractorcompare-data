// Opt-in Astro process diagnostics. No subprocess/whole-runner claim.
export function resourceSnapshot(proc=process){
 const usage=proc.resourceUsage(),memory=proc.memoryUsage();
 return {cpuUserUs:usage.userCPUTime,cpuSystemUs:usage.systemCPUTime,
  peakRssKiB:usage.maxRSS,rssBytes:memory.rss,heapUsedBytes:memory.heapUsed};
}
export function buildResourceProfile(){
 let started=null;
 return {name:"tractorvs-build-resource-profile",hooks:{
  "astro:build:start":()=>{started={time:performance.now(),...resourceSnapshot()};},
  "astro:build:done":({pages})=>{
   if(!started)return;
   const now=resourceSnapshot(),elapsedMs=Math.round(performance.now()-started.time);
   console.log("TRACTORVS_ASTRO_RESOURCE "+JSON.stringify({
    elapsedMs,pages:Array.isArray(pages)?pages.length:null,
    cpuUserUs:now.cpuUserUs-started.cpuUserUs,cpuSystemUs:now.cpuSystemUs-started.cpuSystemUs,
    peakRssKiB:now.peakRssKiB,endRssBytes:now.rssBytes,endHeapUsedBytes:now.heapUsedBytes
   }));
   started=null;
  }
 }};
}
