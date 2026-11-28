#!/usr/bin/env python3
"""Offline handoff: reviewed proposals + current coverage + hold ledger -> private manifest.
Never downloads, publishes, or creates rights decisions. Run on trusted private input.
"""
import argparse, importlib.util, json, re
from pathlib import Path
spec=importlib.util.spec_from_file_location('bridge',Path(__file__).with_name('photo-commons-evidence-bridge.py'))
bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
UUID=re.compile(r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}')
SHA=re.compile(r'[0-9a-f]{64}')

def build(report,decisions,coverage,ledger):
    if report.get('publicationAuthorized') is not False or not isinstance(report.get('proposals'),list) or len(report['proposals'])>500:
        raise ValueError('invalid proposal report')
    if not isinstance(decisions,list) or len(decisions)>500:raise ValueError('invalid decision list')
    targets={}
    for row in coverage['missing_models']:
        for id in row['missingTractorIds']:
            if not isinstance(id,str) or not UUID.fullmatch(id) or id in targets:raise ValueError('duplicate or invalid coverage UUID')
            targets[id]={'tractor_id':id,'brand':row['brand'],'model':row['model'],'status':'published','has_approved_photo':False}
    if type(coverage['missing']) is not int or len(targets)!=coverage['missing']:raise ValueError('coverage count mismatch')
    held=set()
    for row in ledger['preservedRejectionsAndHolds']:
        if not isinstance(row.get('source'),str):raise ValueError('invalid hold source')
        source=row['source']
        if source.startswith('https://commons.wikimedia.org/wiki/File:'):held.add(bridge.filename(source))
    indexed={}
    for p in report['proposals']:
        d=p['proposal_digest']
        if not isinstance(d,str) or not SHA.fullmatch(d) or d in indexed:raise ValueError('invalid or duplicate proposal digest')
        if p.get('publishable') is not False or p['proposal'].get('acquisition_authorized') is not False or bridge.digest(p['proposal'])!=d:raise ValueError('unexpected proposal state or digest')
        indexed[d]=p
    approved=[];seen=set();bindings=set()
    for d in decisions:
        key=d['proposal_digest']
        if key in seen or key not in indexed:raise ValueError('duplicate or stale decision')
        seen.add(key);p=indexed[key];r=p['proposal'];id=r['tractor_id'];name=bridge.filename(r['source_page_url'])
        if id not in targets or name in held:raise ValueError('target no longer missing or source held')
        binding=(id,name)
        if binding in bindings:raise ValueError('duplicate source binding')
        bindings.add(binding)
        approved.append(bridge.authorize(p,d,targets[id]))
    return approved

def main():
    p=argparse.ArgumentParser();p.add_argument('proposals',type=Path);p.add_argument('decisions',type=Path);p.add_argument('coverage',type=Path);p.add_argument('holds',type=Path);p.add_argument('private_output',type=Path);a=p.parse_args()
    rows=build(*(bridge.read(v) for v in (a.proposals,a.decisions,a.coverage,a.holds)))
    # Require a preexisting private directory; never write into a public checkout.
    out=a.private_output
    if out.is_symlink() or not out.parent.is_dir() or out.parent.stat().st_mode & 0o077 or out.exists():raise ValueError('new manifest in private directory required')
    with open(out,'x',encoding='utf-8',opener=lambda path,flags: __import__('os').open(path,flags,0o600)) as f:json.dump(rows,f,ensure_ascii=False,indent=2)
    print(json.dumps({'authorized_private_rows':len(rows),'publication_authorized':False}))
if __name__=='__main__':main()
