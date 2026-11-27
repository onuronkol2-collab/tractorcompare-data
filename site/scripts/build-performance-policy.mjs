// Default remains the established serial renderer until a measured TEST pilot.
export function buildConcurrency(value){
  if(value===undefined||value==="")return 1;
  if(!/^[1-4]$/.test(value))throw Error("TRACTORVS_ASTRO_CONCURRENCY must be 1–4");
  return Number(value);
}
