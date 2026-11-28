#!/usr/bin/env python3
"""Transform collected private metadata packets into individually held proposals.
Never authorizes acquisition. Source/identity decisions stay separate."""
import argparse,importlib.util,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('bridge',Path(__file__).with_name('photo-commons-evidence-bridge.py'));bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
def prepare(report):
    if report.get('publicationAuthorized') is not False or not isinstance(report.get('packets'),list) or len(report['packets'])>500:raise ValueError('invalid collector report')
    proposals=[];held=[];seen=set()
    for packet in report['packets']:
        target=packet.get('target',{});lead=packet.get('lead',{});key=(target.get('tractor_id'),lead.get('source'))
        if key in seen:continue
        seen.add(key)
        try:
            if packet.get('publicationAuthorized') is not False:raise ValueError('unexpected publication flag')
            proposals.append(bridge.propose(lead,packet['snapshot'],target))
        except (ValueError,KeyError,TypeError,AttributeError) as e:held.append({'tractor_id':key[0],'source':key[1],'reason':str(e)[:250],'publishable':False})
    return {'publicationAuthorized':False,'proposals':proposals,'held':held}
def main():
    p=argparse.ArgumentParser();p.add_argument('report',type=Path);p.add_argument('output',type=Path);a=p.parse_args();data=bridge.read(a.report);a.output.parent.mkdir(parents=True,exist_ok=True,mode=0o700);bridge.acq.atomic_json(a.output,prepare(data))
if __name__=='__main__':main()
