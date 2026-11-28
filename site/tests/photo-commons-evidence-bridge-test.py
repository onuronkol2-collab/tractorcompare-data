import hashlib,importlib.util,unittest
from pathlib import Path
s=importlib.util.spec_from_file_location('bridge',Path(__file__).resolve().parents[1]/'scripts'/'photo-commons-evidence-bridge.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
def data():
    n='Fixture.jpg';h=hashlib.md5(n.encode(),usedforsecurity=False).hexdigest();lead={'tractorIds':['id'],'brand':'Example','model':'123','source':'https://commons.wikimedia.org/wiki/File:'+n};target={'tractor_id':'id','brand':'Example','model':'123','status':'published','has_approved_photo':False};i={'url':f'https://upload.wikimedia.org/wikipedia/commons/{h[0]}/{h[:2]}/{n}','sha1':'a'*40,'size':1000,'width':800,'height':600,'mime':'image/jpeg','extmetadata':{k:{'value':v} for k,v in {'Artist':'Example','Credit':'Own work','LicenseShortName':'CC BY-SA 4.0','LicenseUrl':'https://creativecommons.org/licenses/by-sa/4.0/'}.items()}};return lead,{'query':{'pages':[{'title':'File:'+n,'imageinfo':[i]}]}},target
class BridgeTest(unittest.TestCase):
    def test_candidate_not_authorized(self):
        p=m.propose(*data());self.assertFalse(p['proposal']['acquisition_authorized']);self.assertFalse(p['publishable'])
    def test_license_mismatch(self):
        l,s,t=data();s['query']['pages'][0]['imageinfo'][0]['extmetadata']['LicenseUrl']['value']='https://creativecommons.org/licenses/by-nc/4.0/'
        with self.assertRaises(ValueError):m.propose(l,s,t)
    def test_missing_target(self):
        l,s,t=data();t['has_approved_photo']=True
        with self.assertRaises(ValueError):m.propose(l,s,t)
    def test_stale_review(self):
        l,s,t=data();p=m.propose(l,s,t)
        with self.assertRaises(ValueError):m.authorize(p,{'proposal_digest':'bad'},t)
    def test_explicit_review_only(self):
        l,s,t=data();p=m.propose(l,s,t);d={'proposal_digest':p['proposal_digest'],'snapshot_digest':p['snapshot_digest'],'rights_review_passed':True,'previous_hold_checked':True,'attribution_reviewed':True,'review_evidence_ref':'fixture'};r=m.authorize(p,d,t);self.assertTrue(r['acquisition_authorized']);self.assertFalse(r['publishable']);self.assertFalse(r['identity_verified'])
    def test_ambiguous_snapshot(self):
        l,s,t=data();s['query']['pages']*=2
        with self.assertRaises(ValueError):m.propose(l,s,t)
    def test_base36_overflow(self):
        self.assertEqual(m.sha1_hex('0'*30+'1'),'0'*39+'1')
        with self.assertRaises(ValueError):m.sha1_hex('z'*31)
if __name__=='__main__':unittest.main()
