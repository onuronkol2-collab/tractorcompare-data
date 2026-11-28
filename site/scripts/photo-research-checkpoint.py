"""Public research-only checkpoint: atomic manifest with exact run binding."""
import hashlib,json,os,re,stat,sys
from pathlib import Path
NAMES={'commons-budget.json','commons-collector.json','independent-state.json'}
CAP=8*1024*1024
def digest(p):
    info=p.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_nlink!=1 or not 0<info.st_size<=CAP: raise ValueError('unsafe checkpoint file')
    return hashlib.sha256(p.read_bytes()).hexdigest()
def integer(v):
    return type(v) is int and 0<=v<=9007199254740991

def shape(name,d):
    if not isinstance(d,dict) or type(d.get('version')) is not int or d['version']!=1: raise ValueError('invalid checkpoint version')
    if name=='commons-budget.json':
        if set(d)!={'version','provider','requests','cooldownUntil'} or d['provider']!='commons' or not integer(d['cooldownUntil']) or not isinstance(d['requests'],list) or len(d['requests'])>10000 or not all(map(integer,d['requests'])): raise ValueError('invalid Commons budget')
    elif name=='commons-collector.json':
        if set(d)!={'version','cooldownUntil','files'} or not integer(d['cooldownUntil']) or not isinstance(d['files'],dict): raise ValueError('invalid collector checkpoint')
        for k,v in d['files'].items():
            if not re.fullmatch(r'[0-9a-f]{64}',k) or not isinstance(v,dict) or not integer(v.get('nextAt')) or v.get('status') not in {'metadata_review_required','source_missing','provider_cooldown','access_denied','retryable'}: raise ValueError('invalid collector record')
            expected={'status','nextAt','snapshot'} if v['status']=='metadata_review_required' else {'status','nextAt'}
            if set(v)!=expected or ('snapshot' in v and not isinstance(v['snapshot'],dict)): raise ValueError('invalid collector snapshot')
    else:
        if set(d)!={'version','jobs','cooldowns'} or not isinstance(d['jobs'],list) or not isinstance(d['cooldowns'],list): raise ValueError('invalid independent queue')
        seen=set()
        for j in d['jobs']:
            if not isinstance(j,dict) or set(j)!={'tractorId','provider','disposition','attempts','lastAt','nextAt','evidenceRef'}: raise ValueError('invalid job fields')
            if j['provider'] not in ('finna','loc') or not isinstance(j['tractorId'],str) or not re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',j['tractorId']) or j['disposition'] not in ('no_match','candidate_found','retryable','rate_limited','access_blocked','rights_rejected','identity_rejected','permission_pending') or not all(integer(j[k]) for k in ('attempts','lastAt','nextAt')) or not 1<=j['attempts']<=1000000 or j['nextAt']<j['lastAt'] or not isinstance(j['evidenceRef'],str) or not re.fullmatch(r'sha256:[0-9a-f]{64}',j['evidenceRef']): raise ValueError('invalid job record')
            key=(j['tractorId'],j['provider'])
            if key in seen: raise ValueError('duplicate job')
            seen.add(key)
        seen=set()
        for c in d['cooldowns']:
            if not isinstance(c,dict) or set(c)!={'provider','until'} or c['provider'] not in ('finna','loc') or not integer(c['until']) or c['provider'] in seen: raise ValueError('invalid provider cooldown')
            seen.add(c['provider'])
def files(root):
    if root.is_symlink() or not root.is_dir(): raise ValueError('unsafe checkpoint root')
    if any(not (root/n).is_file() for n in NAMES): raise ValueError('checkpoint member missing')
    # Explicit public-only member allowlist; accidental originals/manifests must never be sealed.
    extras={p.name for p in root.iterdir()}-NAMES-{'checkpoint.json'}
    if extras: raise ValueError('unexpected checkpoint member')
    result={}
    for name in sorted(NAMES):
        p=root/name;result[name]=digest(p);data=json.loads(p.read_bytes())
        shape(name,data)
    return result
def seal(root,run):
    obj={'version':1,'run_id':run,'files':files(root),'publicationAuthorized':False}
    t=root/'checkpoint.tmp'
    with t.open('x') as f: json.dump(obj,f,sort_keys=True);f.flush();os.fsync(f.fileno())
    t.replace(root/'checkpoint.json')
def verify(root,run):
    p=root/'checkpoint.json';digest(p);o=json.loads(p.read_bytes())
    if o!={'version':1,'run_id':run,'files':files(root),'publicationAuthorized':False}: raise ValueError('checkpoint mismatch')
if __name__=='__main__':
    action,root,run=sys.argv[1:]
    if not re.fullmatch(r'[0-9]+',run): raise ValueError('invalid run ID')
    {'seal':seal,'verify':verify}[action](Path(root),run)
