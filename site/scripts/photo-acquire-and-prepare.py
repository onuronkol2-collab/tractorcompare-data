#!/usr/bin/env python3
"""Bridge reviewed source manifest -> verified originals -> OCR and private derivatives.
No external publication, Cloudinary upload, or registry/database changes.
"""
import argparse,importlib.util,json
from pathlib import Path

def load(name,file):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(file));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
acquisition=load('acquisition','photo-original-acquisition.py')
local=load('local_batch','photo-unified-local-batch.py')

def run(rows,root,output,limit,*,state_persist=None,provider_gate=None,seed_root=None):
    output.mkdir(mode=0o700,parents=True,exist_ok=True)
    result=acquisition.acquire(rows,root,output/'acquisition-state.json',limit=limit,state_persist=state_persist,provider_gate=provider_gate,seed_root=seed_root)
    acquisition.atomic_json(output/'acquisition-report.json',result)
    verified=[r['record'] for r in result['records'] if r.get('status') in {'original_prepared','reused_verified_original'} and r.get('record',{}).get('original_bytes_verified') is True]
    prepared=local.batch(verified,root,output/'local')
    acquisition.atomic_json(output/'preparation-report.json',prepared)
    return {'publication_authorized':False,'original_attempts':result['attempts'],'verified_original_records':len(verified),'local_prepared_records':sum(r.get('status')=='local_derivatives_prepared_review_required' for r in prepared['records'])}

def main():
    p=argparse.ArgumentParser();p.add_argument('reviewed_manifest',type=Path);p.add_argument('private_original_root',type=Path);p.add_argument('private_output',type=Path);p.add_argument('--limit',type=int,default=12);p.add_argument('--seed-root',type=Path);a=p.parse_args()
    print(json.dumps(run(json.loads(a.reviewed_manifest.read_text()),a.private_original_root,a.private_output,a.limit,seed_root=a.seed_root)))
if __name__=='__main__':main()
