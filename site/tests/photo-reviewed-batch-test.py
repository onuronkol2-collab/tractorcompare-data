"""Draft regressions, do not execute until TEST."""
import importlib.util, unittest
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def load(name,p):
    s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
m=load('batch',root/'scripts/photo-authorize-reviewed-batch.py');base=load('base',Path(__file__).with_name('photo-commons-evidence-bridge-test.py'))
def fixture():
    l,s,t=base.data();id='12345678-1234-1234-1234-123456789abc';t['tractor_id']=id;l['tractorIds']=[id];p=m.bridge.propose(l,s,t);d={'proposal_digest':p['proposal_digest'],'snapshot_digest':p['snapshot_digest'],'rights_review_passed':True,'previous_hold_checked':True,'attribution_reviewed':True,'review_evidence_ref':'fixture'};return {'publicationAuthorized':False,'proposals':[p]},[d],{'missing':1,'missing_models':[{'brand':t['brand'],'model':t['model'],'missingTractorIds':[id]}]},{'preservedRejectionsAndHolds':[]}
class ReviewedBatch(unittest.TestCase):
    def test_explicit_review_only(self):
        r,d,c,h=fixture();self.assertEqual(m.build(r,[],c,h),[]);out=m.build(r,d,c,h);self.assertTrue(out[0]['acquisition_authorized']);self.assertFalse(out[0]['publishable'])
    def test_stale_coverage(self):
        r,d,c,h=fixture();c={'missing':0,'missing_models':[]}
        with self.assertRaises(ValueError):m.build(r,d,c,h)
    def test_hold_preserved(self):
        r,d,c,h=fixture();h['preservedRejectionsAndHolds']=[{'source':r['proposals'][0]['proposal']['source_page_url']}]
        with self.assertRaises(ValueError):m.build(r,d,c,h)
    def test_duplicate_decision(self):
        r,d,c,h=fixture()
        with self.assertRaises(ValueError):m.build(r,d+d,c,h)
    def test_tampered_proposal(self):
        r,d,c,h=fixture();r['proposals'][0]['proposal']['photographer']='changed'
        with self.assertRaises(ValueError):m.build(r,d,c,h)
if __name__=='__main__':unittest.main()
