#!/usr/bin/env python3
"""Batch orchestration of prior local drafts. No network, upload or publication."""
import argparse,hashlib,importlib.util,json,os,re,tempfile
from pathlib import Path

def load(name,filename):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(filename));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
preflight=load('preflight','photo-preflight-draft.py')
ocr=load('ocr','photo-model-ocr.py')
derivatives=load('derivatives','photo-local-derivatives.py')

def reuse_derivatives(directory,digest):
    if directory.is_symlink():raise ValueError('unsafe derivative directory')
    manifest=directory/'manifest.json'
    if manifest.is_symlink() or not manifest.is_file() or manifest.stat().st_size>128*1024:raise ValueError('incomplete existing derivatives; quarantine')
    data=json.loads(manifest.read_text())
    if data.get('original_sha256')!=digest or data.get('publishable') is not False or data.get('rights_verified') is not False or data.get('identity_verified') is not False:raise ValueError('unexpected staged manifest')
    rows=data.get('derivatives')
    if not isinstance(rows,list) or not 1<=len(rows)<=6:raise ValueError('invalid derivative count')
    names=set()
    for row in rows:
        name=row.get('file','')
        if not re.fullmatch(r'[0-9]+-[0-9]+\.(jpg|webp)',name) or name in names:raise ValueError('invalid derivative path')
        names.add(name);p=directory/name
        if p.is_symlink() or not p.is_file() or p.stat().st_size>derivatives.MAX_CLOUD_BYTES:raise ValueError('invalid staged derivative')
        raw=p.read_bytes()
        if len(raw)!=row.get('bytes') or hashlib.sha256(raw).hexdigest()!=row.get('sha256'):raise ValueError('staged derivative mismatch')
    return data

def batch(records,root,out):
    if not isinstance(records,list):raise ValueError('expected candidate list')
    root=root.resolve(strict=True);out=out.resolve();out.mkdir(parents=True,exist_ok=True)
    reports=[];seen=set()
    for row in records:
        report={'tractor_id':row.get('tractor_id'),'publishable':False}
        try:
            report['preflight']=preflight.assess(row,root)
            m=report['preflight']['metrics'];digest=m.get('sha256')
            if not digest or digest!=row.get('expected_sha256'):raise ValueError('missing or mismatched expected original digest')
            # OCR may help resolve identity/angle; it cannot resolve rights or a prior rejection.
            flags=report['preflight']['flags']
            if any(f in {'missing_tractor_id','missing_source_page_url','missing_source_image_url','missing_rights_evidence_ref','rights_conflict','prior_rejection_preserved'} for f in flags):raise ValueError('held by rights or source evidence flags')
            src=(root/row['local_path']).resolve(strict=True)
            if not src.is_relative_to(root):raise ValueError('path outside image root')
            try:report['ocr']=ocr.recognize(src,digest,row['brand'],row['model'])
            except Exception as e:report['ocr']={'status':'unavailable_or_failed','error_type':type(e).__name__,'publishable':False}
            if any(f.startswith('missing_') or f in {'angle_unconfirmed_or_excluded','watermark_absent_not_confirmed'} for f in flags):raise ValueError('visual evidence still required; OCR is not approval')
            if digest in seen:raise ValueError('duplicate original; review target bindings separately')
            existing=out/'derivatives'/digest
            if existing.exists() or existing.is_symlink():report['derivatives']=reuse_derivatives(existing,digest);report['derivatives_reused']=True
            else:report['derivatives']=derivatives.prepare(src,digest,out/'derivatives')
            seen.add(digest);report['status']='local_derivatives_prepared_review_required'
        except Exception as e:report.update(status='held',error_type=type(e).__name__,reason=str(e)[:160])
        reports.append(report)
    return {'publication_authorized':False,'records':reports}

def main():
    p=argparse.ArgumentParser();p.add_argument('manifest',type=Path);p.add_argument('image_root',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
    result=batch(json.loads(a.manifest.read_text()),a.image_root,a.output)
    fd,path=tempfile.mkstemp(prefix='.batch-',dir=a.output);os.close(fd)
    Path(path).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');os.replace(path,a.output/'batch-report.json')
if __name__=='__main__':main()
