#!/usr/bin/env python3
"""Private, bounded acquisition of explicitly reviewed original URLs. No approval or publication.
Input is a trusted local editorial manifest, never raw discovery results. No redirects,
credentials, proxy overrides, arbitrary hosts or automatic re-attempts after denial.
"""
import argparse, hashlib, io, json, os, re, tempfile, time, warnings, subprocess, ssl, stat, math
from pathlib import Path
from urllib.parse import urlsplit, unquote
from urllib.request import Request, build_opener, HTTPRedirectHandler, ProxyHandler
from urllib.error import HTTPError, URLError
from http.client import IncompleteRead, RemoteDisconnected
from email.utils import parsedate_to_datetime
from PIL import Image
MAX_BYTES=35*1024*1024
MAX_PIXELS=40_000_000
Image.MAX_IMAGE_PIXELS=MAX_PIXELS
FORMATS={'image/jpeg':('JPEG','jpg'),'image/png':('PNG','png'),'image/webp':('WEBP','webp')}
LICENSES={'CC0 1.0','CC BY 2.0','CC BY 2.5','CC BY 3.0','CC BY 4.0','CC BY-SA 2.0','CC BY-SA 2.5','CC BY-SA 3.0','CC BY-SA 4.0','verified_public_domain'}
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
class Deferred(Exception):
    def __init__(self,seconds,reason): self.seconds=seconds; super().__init__(reason)

def retryable_transport(error):
    # HTTPError inherits URLError: classify explicit status first.
    if isinstance(error,HTTPError): return error.code in {408,500,502,504}
    if isinstance(error,ssl.SSLError) or isinstance(getattr(error,'reason',None),ssl.SSLError): return False
    return isinstance(error,(URLError,TimeoutError,ConnectionError,IncompleteRead,RemoteDisconnected))

def safe_url(value):
    if not isinstance(value,str) or len(value)>2048 or any(ord(c)<33 for c in value) or '\\' in value: raise ValueError('invalid URL')
    u=urlsplit(value)
    if u.scheme!='https' or not u.hostname or u.username is not None or u.password is not None or u.port is not None or u.fragment: raise ValueError('unsafe URL')
    return u

def validate(r):
    for k in ('tractor_id','brand','model','source_page_url','source_image_url','rights_evidence_ref','original_evidence_ref','photographer'):
        if not isinstance(r.get(k),str) or not r[k].strip() or len(r[k])>4096: raise ValueError('missing '+k)
    if r.get('acquisition_authorized') is not True or r.get('license') not in LICENSES or r.get('rights_conflict') is True: raise ValueError('explicit rights review needed before download')
    if r.get('previous_rejection'): raise ValueError('previous rejection held; separately reopen with evidence')
    if r.get('model_status')!='published' or r.get('has_approved_photo') is not False: raise ValueError('not a published missing-photo target')
    u=safe_url(r['source_image_url']);page=safe_url(r['source_page_url']);provider=r.get('provider')
    if u.query: raise ValueError('query parameters forbidden for original paths')
    if provider=='commons':
        # Reject thumbnail, transcode, archive and special redirect URLs. Require file-page filename and hashed storage path match.
        if page.hostname!='commons.wikimedia.org' or not page.path.startswith('/wiki/File:') or page.query: raise ValueError('not a Commons file page')
        filename=unquote(page.path[len('/wiki/File:'):]).replace(' ','_')
        if not filename or '/' in filename or '\\' in filename: raise ValueError('invalid Commons filename')
        md5=hashlib.md5(filename.encode('utf-8'),usedforsecurity=False).hexdigest()
        if u.hostname!='upload.wikimedia.org' or unquote(u.path)!=f'/wikipedia/commons/{md5[0]}/{md5[:2]}/{filename}': raise ValueError('not exact Commons original URL')
        if not re.fullmatch(r'[0-9a-f]{40}',r.get('expected_sha1','')): raise ValueError('Commons imageinfo SHA1 hex required')
    elif provider=='flickr':
        if page.hostname not in {'www.flickr.com','flickr.com'} or not re.fullmatch(r'/photos/[^/]+/\d+/?',page.path) or page.query: raise ValueError('not a Flickr photo page')
        photo_id=page.path.rstrip('/').split('/')[-1]
        if u.hostname!='live.staticflickr.com' or not re.fullmatch(r'/\d+/'+re.escape(photo_id)+r'_[a-zA-Z0-9]+_o\.(jpg|jpeg|png|webp)',u.path,re.I): raise ValueError('not reviewed Flickr original path')
        if not re.fullmatch(r'[0-9a-f]{64}',r.get('expected_sha256','')): raise ValueError('independent expected SHA256 required for Flickr')
    else: raise ValueError('provider original path not yet supported; hold for review')
    if r.get('expected_mime') not in FORMATS: raise ValueError('unsupported MIME')
    for k,cap in [('expected_bytes',MAX_BYTES),('expected_width',MAX_PIXELS),('expected_height',MAX_PIXELS)]:
        v=r.get(k)
        if type(v) is not int or not 0<v<=cap: raise ValueError('invalid '+k)
    if r['expected_width']*r['expected_height']>MAX_PIXELS: raise ValueError('pixel cap')
    if r.get('expected_sha256') is not None and not re.fullmatch(r'[0-9a-f]{64}',r['expected_sha256']): raise ValueError('invalid SHA256')
    return provider

def retry_seconds(value,now):
    try:
        if value and value.isdigit(): return max(86400,int(value))
        if value: return max(86400,int(parsedate_to_datetime(value).timestamp()-now)+1)
    except (ValueError,TypeError,OverflowError): pass
    return 86400

def get_bytes(r,opener=None):
    validate(r); opener=opener or build_opener(ProxyHandler({}),NoRedirect())
    req=Request(r['source_image_url'],headers={'User-Agent':'TractorVS/1.0 (https://tractorvs.com/; licensed original acquisition)','Accept':r['expected_mime'],'Accept-Encoding':'identity'})
    try: response=opener.open(req,timeout=20)
    except HTTPError as e:
        if e.code in (429,503): raise Deferred(retry_seconds(e.headers.get('Retry-After'),time.time()),'provider cooldown') from None
        if e.code in (401,403): raise Deferred(7*86400,'access denied; no evasion') from None
        raise
    with response:
        if response.status!=200 or response.geturl()!=r['source_image_url']: raise ValueError('unexpected response or redirect')
        if response.headers.get_content_type()!=r['expected_mime'] or response.headers.get('Content-Encoding','identity')!='identity': raise ValueError('MIME/encoding mismatch')
        declared=response.headers.get('Content-Length')
        if declared is not None and (not declared.isdigit() or int(declared)!=r['expected_bytes']): raise ValueError('length header mismatch')
        chunks=[]; total=0; deadline=time.monotonic()+60
        while True:
            if time.monotonic()>deadline: raise TimeoutError('total download deadline')
            chunk=response.read(min(65536,r['expected_bytes']-total+1))
            if not chunk: break
            total+=len(chunk)
            if total>r['expected_bytes'] or total>MAX_BYTES: raise ValueError('response exceeds expected bytes')
            chunks.append(chunk)
        raw=b''.join(chunks)
    if len(raw)!=r['expected_bytes']: raise ValueError('truncated original')
    return raw

def verify(r,raw):
    validate(r)
    if len(raw)!=r['expected_bytes']: raise ValueError('length mismatch')
    sha1=hashlib.sha1(raw,usedforsecurity=False).hexdigest();sha256=hashlib.sha256(raw).hexdigest()
    if r.get('expected_sha1') and sha1!=r['expected_sha1']: raise ValueError('SHA1 mismatch')
    if r.get('expected_sha256') and sha256!=r['expected_sha256']: raise ValueError('SHA256 mismatch')
    fmt,ext=FORMATS[r['expected_mime']]
    with warnings.catch_warnings():
        warnings.simplefilter('error',Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(raw)) as im:
            if im.format!=fmt or im.size!=(r['expected_width'],r['expected_height']) or getattr(im,'n_frames',1)!=1: raise ValueError('format/dimension/frame mismatch')
            im.verify()
        with Image.open(io.BytesIO(raw)) as im: im.load()
    return sha256,ext

def store(root,r,raw):
    digest,ext=verify(r,raw);dest=root/f'{digest}.{ext}'
    if dest.is_symlink(): raise ValueError('unsafe existing path')
    if dest.exists():
        previous=read_cached_original(root,dest.name)
        if previous!=raw: raise ValueError('existing content mismatch')
    else:
        # Atomic no-overwrite link; temp file private and on same filesystem.
        fd,tmp=tempfile.mkstemp(prefix='.original-',dir=root)
        try:
            with os.fdopen(fd,'wb') as f: f.write(raw);f.flush();os.fsync(f.fileno())
            os.link(tmp,dest)
        finally: os.unlink(tmp)
    return {**r,'local_path':dest.name,'expected_sha256':digest,'original_bytes_verified':True,'identity_verified':False,'rights_verified':False,'publishable':False}

def atomic_json(path,obj):
    fd,tmp=tempfile.mkstemp(prefix='.state-',dir=path.parent)
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as f: json.dump(obj,f,ensure_ascii=False,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)

def shared_commons_command(action,seconds=None):
    if not os.environ.get('TRACTORVS_COMMONS_BUDGET_FILE') or os.environ.get('TRACTORVS_SHARED_COMMONS_LANE')!='1':
        raise ValueError('existing shared Commons budget and serialized trusted lane required')
    args=['node',str(Path(__file__).with_name('photo-shared-commons-budget-cli.mjs')),action]
    if seconds is not None: args.append(str(seconds))
    run=subprocess.run(args,check=True,capture_output=True,text=True,timeout=15)
    result=json.loads(run.stdout)
    if action=='reserve':
        if not isinstance(result,dict) or type(result.get('allowed')) is not bool: raise ValueError('bad shared budget response')
        if not result['allowed']:
            ms=result.get('retryMs')
            if type(ms) is not int or ms<=0: raise ValueError('bad shared cooldown')
    elif result!={'paused':True}: raise ValueError('shared pause not persisted')
    return result

def read_cached_original(root, name):
    if not isinstance(name,str) or not re.fullmatch(r'[0-9a-f]{64}\.(jpg|png|webp)',name):
        raise ValueError('invalid content-addressed cache path')
    path=root/name
    fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
    with os.fdopen(fd,'rb') as f:
        info=os.fstat(f.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_nlink!=1 or not 0<info.st_size<=MAX_BYTES:
            raise ValueError('unsafe cached original')
        raw=f.read(MAX_BYTES+1)
    if len(raw)!=info.st_size or hashlib.sha256(raw).hexdigest()!=name.split('.')[0]:
        raise ValueError('cached original digest mismatch')
    return raw

def validate_ledger(state):
    if not isinstance(state,dict) or type(state.get('version')) is not int or state['version']!=1 or any(not isinstance(state.get(k),dict) for k in ('paused_until','completed','held')):
        raise ValueError('invalid state; recover manually')
    for provider,until in state['paused_until'].items():
        if provider not in {'commons','flickr'} or type(until) not in (int,float) or not math.isfinite(until) or not 0<=until<1e12:
            raise ValueError('invalid provider pause; recover manually')
    for key,record in state['completed'].items():
        if not re.fullmatch(r'[0-9a-f]{64}',key) or not isinstance(record,dict) or not isinstance(record.get('local_path'),str) or not re.fullmatch(r'[0-9a-f]{64}\.(jpg|png|webp)',record['local_path']):
            raise ValueError('invalid completed record; recover manually')
    for key,reason in state['held'].items():
        if not re.fullmatch(r'[0-9a-f]{64}',key) or not isinstance(reason,str) or not reason or len(reason)>200:
            raise ValueError('invalid hold record; recover manually')
    if set(state['held']) & set(state['completed']):
        raise ValueError('conflicting completed and held records; recover manually')

def acquire(rows,root,state_path,*,limit=12,fetcher=get_bytes,now=time.time,delay=time.sleep,shared_budget=None):
    if not isinstance(rows,list) or type(limit) is not int or not 1<=limit<=50: raise ValueError('invalid manifest or request budget')
    root.mkdir(mode=0o700,parents=True,exist_ok=True);root=root.resolve();state_path=state_path.resolve();state_path.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
    lock=state_path.with_suffix(state_path.suffix+'.lock');fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    try:
        state=json.loads(state_path.read_text()) if state_path.exists() else {'version':1,'paused_until':{},'completed':{},'held':{}}
        validate_ledger(state)
        # Existing v1 ledgers remain readable. Never reset old rejection/hold records.
        retry=state.setdefault('transport_retry',{})
        if not isinstance(retry,dict): raise ValueError('invalid retry ledger; recover manually')
        for k,v in retry.items():
            if not re.fullmatch(r'[0-9a-f]{64}',k) or not isinstance(v,dict) or type(v.get('attempts')) is not int or not 1<=v['attempts']<=1000000 or type(v.get('next_at')) not in (int,float) or not 0<=v['next_at']<1e12: raise ValueError('invalid retry record; recover manually')
        results=[];attempts=0;transport_paused=set()
        # Real Commons HTTP never runs without a shared reservation. Test fixtures can inject a mock.
        budget=shared_budget if shared_budget is not None else (shared_commons_command if fetcher is get_bytes or os.environ.get('TRACTORVS_COMMONS_BUDGET_FILE') or os.environ.get('TRACTORVS_REQUIRE_SHARED_COMMONS_BUDGET')=='1' else None)
        commons_state_failed=False
        for r in rows:
            report={'tractor_id':r.get('tractor_id') if isinstance(r,dict) else None,'publishable':False}
            try:
                p=validate(r)
                key=hashlib.sha256(json.dumps([p,r['source_image_url'],r.get('expected_sha1'),r.get('expected_sha256'),r['tractor_id']],ensure_ascii=False).encode()).hexdigest()
                if key in state['completed']:
                    previous=state['completed'][key]
                    raw=read_cached_original(root,previous['local_path'])
                    report.update(status='reused_verified_original',record=store(root,r,raw))
                elif key in state['held']: report.update(status='held_previous_failure',reason=state['held'][key])
                elif p in transport_paused: report.update(status='provider_transport_deferred')
                elif state['paused_until'].get(p,0)>now(): report.update(status='provider_paused')
                elif retry.get(key,{}).get('next_at',0)>now(): report.update(status='transport_retry_deferred',next_at=retry[key]['next_at'])
                elif attempts>=limit: report.update(status='request_budget_deferred')
                elif p=='commons' and commons_state_failed: report.update(status='shared_budget_unavailable')
                else:
                    if p=='commons' and budget is not None:
                        try:
                            reservation=budget('reserve')
                            if not reservation['allowed']:
                                report.update(status='provider_paused',reason='shared Commons budget',retry_ms=reservation['retryMs'])
                                results.append(report);continue
                        except Exception:
                            commons_state_failed=True
                            report.update(status='shared_budget_unavailable');results.append(report);continue
                    attempts+=1
                    try:
                        raw=fetcher(r); rec=store(root,r,raw);state['completed'][key]={'local_path':rec['local_path']};retry.pop(key,None);report.update(status='original_prepared',record=rec)
                    except Deferred as e:
                        state['paused_until'][p]=max(state['paused_until'].get(p,0),now()+e.seconds);report.update(status='provider_paused',reason=str(e))
                        if p=='commons' and budget is not None:
                            try: budget('pause',e.seconds)
                            except Exception:
                                commons_state_failed=True
                                report.update(status='shared_budget_unavailable',reason='shared cooldown persistence failed')
                                atomic_json(state_path,state)
                                # A lost global cooldown is unsafe for subsequent metadata stages.
                                # Raise before sealing any trusted shared checkpoint.
                                raise RuntimeError('shared Commons cooldown persistence failed')
                    except Exception as e:
                        if retryable_transport(e):
                            n=min(1000000,retry.get(key,{}).get('attempts',0)+1)
                            next_at=now()+min(86400,3600*2**min(5,n-1))
                            retry[key]={'attempts':n,'next_at':next_at}
                            transport_paused.add(p)
                            state['paused_until'][p]=max(state['paused_until'].get(p,0),next_at)
                            report.update(status='transport_retry_deferred',reason=type(e).__name__,next_at=next_at)
                        else:
                            # Identity, integrity, permissions and other unknown errors remain held.
                            state['held'][key]=type(e).__name__;retry.pop(key,None);report.update(status='held_for_review',reason=type(e).__name__)
                    atomic_json(state_path,state)
                    if attempts<limit: delay(2)
            except Exception as e:
                if commons_state_failed and isinstance(e,RuntimeError): raise
                report.update(status='held',reason=str(e)[:180])
            results.append(report)
        return {'publication_authorized':False,'attempts':attempts,'records':results}
    finally: os.close(fd);lock.unlink()

def main():
    p=argparse.ArgumentParser();p.add_argument('manifest',type=Path);p.add_argument('private_original_root',type=Path);p.add_argument('state',type=Path);p.add_argument('report',type=Path);a=p.parse_args()
    result=acquire(json.loads(a.manifest.read_text()),a.private_original_root,a.state);atomic_json(a.report,result)
if __name__=='__main__':main()
