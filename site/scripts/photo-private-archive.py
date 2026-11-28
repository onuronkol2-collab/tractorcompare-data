#!/usr/bin/env python3
"""Private, immutable Supabase original archive. No provider requests/publication.
The caller must supply a current scoped authenticated user token, never a service key.
Remote RLS, private bucket and actual free capacity are separate acceptance gates.
"""
import argparse, base64, hashlib, importlib.util, json, os, re, stat, time
from pathlib import Path
from urllib.request import Request, build_opener, ProxyHandler
from urllib.error import HTTPError

spec=importlib.util.spec_from_file_location('photo_acquisition',Path(__file__).with_name('photo-original-acquisition.py'))
acq=importlib.util.module_from_spec(spec);spec.loader.exec_module(acq)
BUCKET='tc-tractor-photo-private'
ORIGIN='https://aaufxtcvnzgavtlintiv.supabase.co'
MAX_JSON=4*1024*1024
MAX_RUN_BYTES=64*1024*1024
SHA=re.compile(r'[0-9a-f]{64}')
NAME=re.compile(r'[0-9a-f]{64}\.(jpg|png|webp)')
UUID=re.compile(r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}')
MIME={'jpg':'image/jpeg','png':'image/png','webp':'image/webp'}

def digest(raw):return hashlib.sha256(raw).hexdigest()
def encode(value):return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()
def checked_token(token,uid,now):
    # Prefilter only; the storage server verifies JWT signatures and RLS.
    if not isinstance(uid,str) or not UUID.fullmatch(uid) or not isinstance(token,str) or len(token)>8192:raise ValueError('scoped archive identity required')
    try:
        parts=token.split('.')
        if len(parts)!=3:raise ValueError()
        payload=json.loads(base64.urlsafe_b64decode(parts[1]+'='*(-len(parts[1])%4)))
    except (ValueError,TypeError,UnicodeError):raise ValueError('invalid archive token') from None
    if not isinstance(payload,dict) or payload.get('role')!='authenticated' or payload.get('sub')!=uid or payload.get('is_anonymous') is not False or type(payload.get('exp')) is not int or payload['exp']<=now+120:
        raise ValueError('valid dedicated authenticated archive token required')

def key_info(key):
    if not isinstance(key,str):raise ValueError('bad archive key')
    prefix,sep,name=key.partition('/')
    if prefix=='originals' and NAME.fullmatch(name):return name.split('.')[0],acq.MAX_BYTES,MIME[name.split('.')[1]]
    if prefix=='manifests' and re.fullmatch(r'[0-9a-f]{64}\.json',name):return name.split('.')[0],MAX_JSON,'application/json'
    raise ValueError('archive key outside allowlist')

class Archive:
    def __init__(self,apikey,token,uid,quota,*,now=time.time,opener=None):
        checked_token(token,uid,now())
        if not isinstance(apikey,str) or not apikey.startswith('sb_publishable_') or len(apikey)>512:raise ValueError('publishable project key required; no privileged API key')
        if not isinstance(quota,dict) or quota.get('free_plan_verified') is not True or type(quota.get('observed_at')) is not int or not 0<=now()-quota['observed_at']<=900 or type(quota.get('available_bytes')) is not int or quota['available_bytes']<0:
            raise ValueError('fresh verified free capacity required')
        self.remaining=min(MAX_RUN_BYTES,quota['available_bytes']);self.observed=quota['observed_at'];self.now=now
        self.uid=uid;self.token=token;self.key=apikey;self.verified=set()
        self.opener=opener or build_opener(ProxyHandler({}),acq.NoRedirect())
    def request(self,method,key,raw=None):
        expected,cap,mime=key_info(key)
        checked_token(self.token,self.uid,self.now())
        prefix='/storage/v1/object/'+('authenticated/' if method=='GET' else '')
        url=ORIGIN+prefix+BUCKET+'/'+key
        headers={'apikey':self.key,'Authorization':'Bearer '+self.token,'Accept-Encoding':'identity','Accept':'application/octet-stream'}
        if method=='POST':headers.update({'Content-Type':mime,'x-upsert':'false'})
        try:
            with self.opener.open(Request(url,data=raw,headers=headers,method=method),timeout=30) as response:
                if response.geturl()!=url or response.status not in ({200} if method=='GET' else {200,201}):raise ValueError('unexpected archive response')
                if response.headers.get('Content-Encoding','identity')!='identity':raise ValueError('unexpected archive encoding')
                result=response.read((cap if method=='GET' else 4096)+1)
        except HTTPError as e:
            # No provider bypass, redirect, credential/header or response body logging.
            if method=='POST' and e.code in (400,409):return None
            raise RuntimeError('archive HTTP '+str(e.code)) from None
        if method=='GET' and (not 0<len(result)<=cap or digest(result)!=expected):raise ValueError('archive digest or length mismatch')
        if method=='POST' and len(result)>4096:raise ValueError('oversized archive response')
        return result
    def get(self,key):return self.request('GET',key)
    def put(self,key,raw):
        expected,cap,_=key_info(key)
        if not isinstance(raw,bytes) or not 0<len(raw)<=cap or digest(raw)!=expected:raise ValueError('invalid immutable content')
        if not 0<=self.now()-self.observed<=900 or len(raw)>self.remaining:raise ValueError('verified free capacity exhausted or stale')
        # Account pessimistically, even on errors or duplicates.
        self.remaining-=len(raw)
        self.request('POST',key,raw)
        if self.get(key)!=raw:raise ValueError('archive readback differs')

def read_private(path,cap=MAX_JSON):
    fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
    with os.fdopen(fd,'rb') as f:
        s=os.fstat(f.fileno())
        if not stat.S_ISREG(s.st_mode) or s.st_nlink!=1 or s.st_mode&0o077 or not 0<s.st_size<=cap:raise ValueError('unsafe private input')
        raw=f.read(cap+1)
    if len(raw)!=s.st_size:raise ValueError('private input changed')
    return raw

def private_dir(path):
    if path.is_symlink() or not path.is_dir() or path.stat().st_mode&0o077:raise ValueError('preexisting private directory required')
    return path.resolve()

def state_names(state):
    acq.validate_ledger(state)
    names=sorted({r['local_path'] for r in state['completed'].values()})
    if len(names)>10000:raise ValueError('archive manifest cap')
    return names

def persist(archive,root,state,parent=None,*,before_manifest=None):
    root=private_dir(root)
    if parent is not None and not SHA.fullmatch(parent):raise ValueError('invalid previous checkpoint digest')
    names=state_names(state)
    raw_manifest=encode({'version':1,'previous':parent,'state':state,'originals':names})
    if len(raw_manifest)>MAX_JSON:raise ValueError('manifest cap')
    d=digest(raw_manifest)
    # Validate every local original before writing the durable journal or touching remote storage.
    for name in names:acq.read_cached_original(root,name)
    if before_manifest is not None:before_manifest(d,parent)
    # Reuse remotely verified originals without consuming write quota; upload only new content.
    for name in names:
        raw=acq.read_cached_original(root,name)
        key='originals/'+name
        if key in archive.verified:continue
        try:previous=archive.get(key)
        except RuntimeError as e:
            # Private Storage may mask not-found as 400. A denied read is never proof of absence.
            # A scoped no-upsert write plus exact authenticated readback remains mandatory.
            if str(e) not in ('archive HTTP 400','archive HTTP 404'):raise
            archive.put(key,raw)
        else:
            if previous!=raw:raise ValueError('existing immutable original differs')
        archive.verified.add(key)
    archive.put('manifests/'+d+'.json',raw_manifest);return d

def restore(archive,d,root,state_path):
    if not isinstance(d,str) or not SHA.fullmatch(d):raise ValueError('trusted checkpoint digest required')
    root=private_dir(root);private_dir(state_path.parent)
    if state_path.exists() or state_path.is_symlink() or any(root.iterdir()):raise ValueError('restore requires empty private workspace; no overwrite')
    raw=archive.get('manifests/'+d+'.json');manifest=json.loads(raw)
    if set(manifest)!={'version','previous','state','originals'} or type(manifest['version']) is not int or manifest['version']!=1 or (manifest['previous'] is not None and not SHA.fullmatch(manifest['previous'])):raise ValueError('invalid private checkpoint')
    state=manifest['state'];names=state_names(state)
    if manifest['originals']!=names:raise ValueError('checkpoint original inventory mismatch')
    # State is committed last. A partial workspace must be discarded, never treated as restored.
    for name in names:
        data=archive.get('originals/'+name)
        path=root/name
        with open(path,'xb',opener=lambda p,f:os.open(p,f,0o600)) as f:f.write(data);f.flush();os.fsync(f.fileno())
        acq.read_cached_original(root,name)
        archive.verified.add('originals/'+name)
    acq.atomic_json(state_path,state)
    return state

def from_env(quota):
    return Archive(os.environ['TRACTORVS_ARCHIVE_PUBLISHABLE_KEY'],os.environ['TRACTORVS_ARCHIVE_ACCESS_TOKEN'],os.environ['TRACTORVS_ARCHIVE_UID'],quota)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('mode',choices=['persist','restore']);p.add_argument('root',type=Path);p.add_argument('state',type=Path);p.add_argument('quota',type=Path);p.add_argument('--checkpoint');a=p.parse_args()
    archive=from_env(json.loads(read_private(a.quota)))
    if a.mode=='persist':print(json.dumps({'checkpoint':persist(archive,a.root,json.loads(read_private(a.state)),a.checkpoint),'publication_authorized':False}))
    else:restore(archive,a.checkpoint,a.root,a.state);print(json.dumps({'restored':True,'publication_authorized':False}))
