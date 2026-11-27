// Pure preflight: no package install, network or credential access.
const fail = message => { throw new Error('[TractorVS BUILD CONTRACT] '+message); };
const own = (obj, name) => Object.hasOwn(obj || {}, name);
const sameKeys = (a,b) => Object.keys(a||{}).sort().join('\n') === Object.keys(b||{}).sort().join('\n');
export function verifyDependencyContract({sitePkg,repoLock,siteLock}) {
  for (const [label,lock,entry] of [['root',repoLock,'site'],['site',siteLock,'']]) {
    const manifest=lock?.packages?.[entry];
    if (!manifest || manifest.name !== sitePkg.name) fail(label+' workspace manifest missing');
    for (const group of ['dependencies','devDependencies']) {
      const declared=sitePkg[group]||{}, locked=manifest[group]||{};
      if (!sameKeys(declared,locked)) fail(label+' '+group+' inventory drift');
      for (const [name,version] of Object.entries(declared)) {
        if (locked[name] !== version) fail(label+' manifest/lock mismatch: '+name);
        if (!/^\d+\.\d+\.\d+$/.test(version)) fail('unreviewed direct dependency pin: '+name);
        const resolved=lock.packages['node_modules/'+name];
        if (entry && own(lock.packages,'site/node_modules/'+name)) fail('nested workspace resolution: '+name);
        if (resolved?.version !== version || typeof resolved.integrity !== 'string' || !resolved.integrity.startsWith('sha512-')) fail(label+' resolution/integrity drift: '+name);
      }
    }
  }
}
export function verifyWorkerRouteContract(root,site) {
  const a=root?.assets?.run_worker_first,b=site?.assets?.run_worker_first;
  for (const [label,routes] of [['root',a],['site',b]]) {
    if (!Array.isArray(routes) || routes.some(x=>typeof x!=='string') || new Set(routes).size!==routes.length) fail(label+' invalid/duplicate Worker route');
    for (const route of ['/language/*','/api/visitor-country','/sitemap.xml','/images/tractors/*']) if(!routes.includes(route)) fail(label+' Worker misses '+route);
    if(routes.some(x=>['/','/*','*'].includes(x))) fail(label+' canonical root must remain static');
  }
  if (JSON.stringify(a)!==JSON.stringify(b)) fail('root/site Worker route parity drift');
}
