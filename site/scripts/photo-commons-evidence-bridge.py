#!/usr/bin/env python3
"""Convert exact Commons imageinfo snapshots into non-authorized acquisition proposals.
No network or publication. Raw API snapshots must be collected by the trusted
Commons client; human/visual evidence and the current missing-UUID list are separate.
"""
import argparse, hashlib, json, re, importlib.util
from pathlib import Path
from urllib.parse import unquote, urlsplit, quote

S=importlib.util.spec_from_file_location('acquisition',Path(__file__).with_name('photo-original-acquisition.py'))
acq=importlib.util.module_from_spec(S);S.loader.exec_module(acq)
MAX_JSON=4*1024*1024
LICENSE_URLS={'CC0 1.0':'https://creativecommons.org/publicdomain/zero/1.0/'}
for family in ('BY','BY-SA'):
    for version in ('2.0','2.5','3.0','4.0'):
        LICENSE_URLS[f'CC {family} {version}']=f'https://creativecommons.org/licenses/{family.lower()}/{version}/'

def digest(data):return hashlib.sha256(json.dumps(data,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def filename(url):
    u=acq.safe_url(url)
    if u.hostname!='commons.wikimedia.org' or u.query or not u.path.startswith('/wiki/File:'):raise ValueError('not exact Commons file page')
    n=unquote(u.path[len('/wiki/File:'):] ).replace(' ','_')
    if not n or '/' in n or '\\' in n:raise ValueError('invalid filename')
    return n

def metadata_value(meta,key):
    v=meta.get(key,{}).get('value')
    if not isinstance(v,str) or not v.strip() or len(v)>12000:raise ValueError('missing/invalid '+key)
    return v

def sha1_hex(raw):
    if not isinstance(raw,str):raise ValueError('missing SHA1')
    if re.fullmatch(r'[a-f0-9]{40}',raw):return raw
    # MediaWiki storage may encode SHA1 in base36; never silently truncate.
    if re.fullmatch(r'[a-z0-9]{31}',raw):
        n=int(raw,36)
        if n<2**160:return f'{n:040x}'
    raise ValueError('unsupported SHA1 encoding')

def propose(lead,snapshot,target):
    if target.get('status')!='published' or target.get('has_approved_photo') is not False:raise ValueError('not a current missing target')
    if target.get('tractor_id') not in lead.get('tractorIds',[]) or (lead.get('brand'),lead.get('model'))!=(target.get('brand'),target.get('model')):raise ValueError('target mismatch')
    if lead.get('previous_rejection') or target.get('previous_rejection'):raise ValueError('prior hold')
    n=filename(lead['source']);pages=snapshot.get('query',{}).get('pages')
    if snapshot.get('error') or not isinstance(pages,list) or len(pages)!=1:raise ValueError('ambiguous API snapshot')
    p=pages[0];info=p.get('imageinfo')
    if p.get('missing') or p.get('title','').replace(' ','_')!='File:'+n or not isinstance(info,list) or len(info)!=1:raise ValueError('file identity mismatch')
    i=info[0];meta=i.get('extmetadata',{});license=metadata_value(meta,'LicenseShortName')
    license_url=metadata_value(meta,'LicenseUrl').replace('http://creativecommons.org/','https://creativecommons.org/',1).rstrip('/')+'/'
    if LICENSE_URLS.get(license)!=license_url:raise ValueError('license mismatch or unsupported license')
    artist=metadata_value(meta,'Artist');credit=metadata_value(meta,'Credit')
    restrictions=meta.get('Restrictions',{}).get('value','')
    if restrictions:raise ValueError('nonempty restrictions; manual source review required')
    # Preserve raw attribution metadata only in private evidence; never render HTML.
    row={'tractor_id':target['tractor_id'],'brand':target['brand'],'model':target['model'],'provider':'commons','source_page_url':lead['source'],'source_image_url':i.get('url'),'rights_evidence_ref':'sha256:'+digest(snapshot),'original_evidence_ref':'sha256:'+digest(snapshot),'photographer':artist,'credit_raw':credit,'license':license,'license_url':license_url,'expected_sha1':sha1_hex(i.get('sha1')),'expected_bytes':i.get('size'),'expected_width':i.get('width'),'expected_height':i.get('height'),'expected_mime':i.get('mime'),'model_status':'published','has_approved_photo':False,'acquisition_authorized':False,'rights_verified':False,'identity_verified':False,'publishable':False}
    # Validate structural requirements only; this ephemeral flag is NOT persisted.
    acq.validate({**row,'acquisition_authorized':True})
    return {'proposal':row,'credit_raw':credit,'artist_raw':artist,'snapshot_digest':digest(snapshot),'proposal_digest':digest(row),'status':'rights_review_required','publishable':False}

def authorize(proposal,decision,current_target):
    r=proposal['proposal'];d=digest(r)
    if r.get('rights_evidence_ref')!='sha256:'+str(proposal.get('snapshot_digest')) or r.get('original_evidence_ref')!=r.get('rights_evidence_ref') or proposal.get('credit_raw')!=r.get('credit_raw') or proposal.get('artist_raw')!=r.get('photographer'):raise ValueError('review metadata mismatch')
    if proposal.get('proposal_digest')!=d or decision.get('proposal_digest')!=d or decision.get('snapshot_digest')!=proposal.get('snapshot_digest'):raise ValueError('stale review evidence')
    if decision.get('rights_review_passed') is not True or decision.get('previous_hold_checked') is not True or decision.get('attribution_reviewed') is not True:raise ValueError('explicit source rights and previous hold review required')
    if not isinstance(decision.get('review_evidence_ref'),str) or not decision['review_evidence_ref'].strip():raise ValueError('missing review reference')
    if (current_target.get('tractor_id'),current_target.get('brand'),current_target.get('model'),current_target.get('status'),current_target.get('has_approved_photo'))!=(r['tractor_id'],r['brand'],r['model'],'published',False) or current_target.get('previous_rejection'):raise ValueError('inventory changed or held')
    # Private acquisition only; no publication or visual identity decision.
    result={**r,'acquisition_authorized':True,'rights_review_evidence_ref':decision['review_evidence_ref']};acq.validate(result);return result

def read(path):
    with path.open('rb') as f: raw=f.read(MAX_JSON+1)
    if len(raw)>MAX_JSON:raise ValueError('input cap')
    return json.loads(raw)

def main():
    p=argparse.ArgumentParser();p.add_argument('mode',choices=['propose','authorize']);p.add_argument('first',type=Path);p.add_argument('second',type=Path);p.add_argument('target',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
    result=(propose if a.mode=='propose' else authorize)(read(a.first),read(a.second),read(a.target))
    a.output.parent.mkdir(mode=0o700,parents=True,exist_ok=True);acq.atomic_json(a.output,result)
if __name__=='__main__':main()
