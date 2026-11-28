#!/usr/bin/env python3
"""Trusted private runner only. Restore verified checkpoint, acquire explicitly
reviewed rows, persist each ledger change remotely, prepare local derivatives.
No public workflow, no unattended credentials, no publication authorization.
"""
import argparse, importlib.util, json, os, fcntl
from contextlib import contextmanager
from pathlib import Path

def load(name,file):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(file));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
store=load('private_archive','photo-private-archive.py')
prepare=load('prepare','photo-acquire-and-prepare.py')

@contextmanager
def workspace_lock(out):
    # Same-workspace exclusion on POSIX, NOT a cross-host lease or remote head CAS.
    out=store.private_dir(out)
    fd=os.open(out,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
    try:
        fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB)
        yield out
    finally:os.close(fd)

def sync_dir(path):
    fd=os.open(path,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
    try:os.fsync(fd)
    finally:os.close(fd)

def run(archive,rows,root,out,checkpoint,limit,*,seed_root=None):
    with workspace_lock(out) as locked:
        return _run(archive,rows,root,locked,checkpoint,limit,seed_root=seed_root)

def _run(archive,rows,root,out,checkpoint,limit,*,seed_root=None):
    root=store.private_dir(root)
    # Fail rather than unknowingly retry a partially persisted batch.
    if any(out.iterdir()) or any(root.iterdir()):raise ValueError('empty private workspace required; recover interrupted work explicitly')
    if not isinstance(rows,list) or not rows:raise ValueError('nonempty rights-reviewed manifest required')
    for row in rows:prepare.acquisition.validate(row)
    state_path=out/'acquisition-state.json'
    store.restore(archive,checkpoint,root,state_path)
    # The explicit trusted digest must be updated after every successful remote seal.
    # Do not start another provider request after a failed local pointer update.
    pointer=out/'archive-checkpoint.json'
    latest=checkpoint
    prepare.acquisition.atomic_json(pointer,{'checkpoint':latest})
    sync_dir(out)
    pending=out/'archive-pending.json'
    def journal(d,parent):
        if pending.exists() or pending.is_symlink():raise ValueError('unresolved archive journal')
        prepare.acquisition.atomic_json(pending,{'checkpoint':d,'previous':parent})
        sync_dir(out)
    def save(state):
        nonlocal latest
        latest=store.persist(archive,root,state,latest,before_manifest=journal)
        prepare.acquisition.atomic_json(pointer,{'checkpoint':latest})
        sync_dir(out)
        pending.unlink()
        sync_dir(out)
    result=prepare.run(rows,root,out,limit,state_persist=save,provider_gate=lambda row,state: provider_gate(archive,row,state),seed_root=seed_root)
    return {**result,'checkpoint':latest}

def provider_gate(archive,row,state):
    # A local env flag is NOT proof of serialization against the scheduled public Commons lane.
    # Permit cached originals, but defer fresh Commons requests until one authoritative lease exists.
    if row['provider']=='commons':return 'shared Commons cross-runner coordination not enabled'
    if not 0<=archive.now()-archive.observed<=900:return 'fresh free capacity proof required'
    if archive.remaining<row['expected_bytes']+store.MAX_JSON:return 'insufficient conservative archive capacity'
    return None

def recover(archive,root,out):
    with workspace_lock(out) as locked:
        return _recover(archive,root,locked)

def _recover(archive,root,out):
    """No network provider calls. Recover an interrupted manifest-pointer update only.
    An absent remote manifest may be sealed from exactly matching local evidence;
    do not roll back to an older checkpoint or discard the local ledger.
    """
    root=store.private_dir(root);out=store.private_dir(out)
    pending=out/'archive-pending.json';pointer=out/'archive-checkpoint.json'
    journal=json.loads(store.read_private(pending));head=json.loads(store.read_private(pointer))
    if set(journal)!={'checkpoint','previous'} or set(head)!={'checkpoint'}:raise ValueError('invalid recovery journal')
    d,parent=journal['checkpoint'],journal['previous']
    if not all(isinstance(x,str) and store.SHA.fullmatch(x) for x in (d,parent,head['checkpoint'])) or head['checkpoint'] not in (d,parent):raise ValueError('checkpoint journal conflicts with head')
    state=json.loads(store.read_private(out/'acquisition-state.json'))
    names=store.state_names(state)
    expected=store.encode({'version':1,'previous':parent,'state':state,'originals':names})
    if store.digest(expected)!=d:raise ValueError('local ledger changed since pending seal')
    # Validate all local bytes and the parent manifest before any remote write.
    parent_raw=archive.get('manifests/'+parent+'.json')
    parent_manifest=json.loads(parent_raw)
    if not isinstance(parent_manifest,dict) or parent_manifest.get('version')!=1 or parent_manifest.get('originals')!=store.state_names(parent_manifest.get('state')):raise ValueError('invalid parent checkpoint')
    for name in names:store.acq.read_cached_original(root,name)
    for name in names:
        key='originals/'+name
        local=store.acq.read_cached_original(root,name)
        try:actual=archive.get(key)
        except RuntimeError as e:
            if str(e) not in ('archive HTTP 400','archive HTTP 404'):raise
            archive.put(key,local)
            actual=archive.get(key)
        if actual!=local:raise ValueError('original differs from pending checkpoint')
    try:actual=archive.get('manifests/'+d+'.json')
    except RuntimeError as e:
        if str(e) not in ('archive HTTP 400','archive HTTP 404'):raise
        archive.put('manifests/'+d+'.json',expected)
        actual=archive.get('manifests/'+d+'.json')
    if actual!=expected:raise ValueError('pending manifest mismatch')
    prepare.acquisition.atomic_json(pointer,{'checkpoint':d})
    sync_dir(out)
    pending.unlink()
    sync_dir(out)
    return {'checkpoint':d,'publication_authorized':False,'recovered':True}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('reviewed_manifest',type=Path);p.add_argument('private_original_root',type=Path);p.add_argument('private_output',type=Path);p.add_argument('quota',type=Path);p.add_argument('checkpoint');p.add_argument('--limit',type=int,default=12);p.add_argument('--recover',action='store_true');p.add_argument('--seed-root',type=Path);a=p.parse_args()
    quota=json.loads(store.read_private(a.quota));archive=store.from_env(quota)
    if a.recover:print(json.dumps(recover(archive,a.private_original_root,a.private_output)))
    else:
        rows=json.loads(store.read_private(a.reviewed_manifest))
        print(json.dumps(run(archive,rows,a.private_original_root,a.private_output,a.checkpoint,a.limit,seed_root=a.seed_root)))
