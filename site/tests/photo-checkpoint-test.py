import importlib.util,json,os,subprocess,tempfile,unittest
from pathlib import Path
S=Path(__file__).resolve().parents[1]/'scripts'
spec=importlib.util.spec_from_file_location('checkpoint',S/'photo-research-checkpoint.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class CheckpointTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)
        for n,d in {'commons-budget.json':{'version':1,'provider':'commons','requests':[],'cooldownUntil':0},'commons-collector.json':{'version':1,'cooldownUntil':0,'files':{}},'independent-state.json':{'version':1,'jobs':[],'cooldowns':[]}}.items():(self.root/n).write_text(json.dumps(d))
    def tearDown(self):self.tmp.cleanup()
    def test_roundtrip_run_bound(self):m.seal(self.root,'123');m.verify(self.root,'123');self.assertRaises(ValueError,m.verify,self.root,'124')
    def test_tampered_file(self):m.seal(self.root,'123');(self.root/'commons-budget.json').write_text('{"version":1,"other":true}');self.assertRaises(ValueError,m.verify,self.root,'123')
    def test_private_extra_refused(self):(self.root/'original.jpg').write_bytes(b'private');self.assertRaises(ValueError,m.seal,self.root,'123')
    def test_missing_member(self):(self.root/'independent-state.json').unlink();self.assertRaises(ValueError,m.seal,self.root,'123')
    def test_bad_json(self):(self.root/'commons-budget.json').write_text('bad');self.assertRaises(ValueError,m.seal,self.root,'123')
    def test_symlink_refused(self):p=self.root/'commons-budget.json';p.unlink();p.symlink_to(self.root/'commons-collector.json');self.assertRaises(ValueError,m.seal,self.root,'123')
    def test_empty_budget_shape_refused(self):
        (self.root/'commons-budget.json').write_text('{"version":1}')
        self.assertRaises(ValueError,m.seal,self.root,'123')
    def test_invalid_cooldown_refused(self):
        p=self.root/'commons-budget.json';d=json.loads(p.read_text());d['cooldownUntil']=True;p.write_text(json.dumps(d))
        self.assertRaises(ValueError,m.seal,self.root,'123')
    def test_extra_field_refused(self):
        p=self.root/'independent-state.json';d=json.loads(p.read_text());d['privateNotes']='fixture';p.write_text(json.dumps(d))
        self.assertRaises(ValueError,m.seal,self.root,'123')
    def test_hardlink_refused(self):
        with tempfile.TemporaryDirectory() as other:
            target=Path(other)/'linked';target.hardlink_to(self.root/'commons-budget.json')
            self.assertRaises(ValueError,m.seal,self.root,'123')
    def test_duplicate_provider_refused(self):
        p=self.root/'independent-state.json';d=json.loads(p.read_text());d['cooldowns']=[{'provider':'loc','until':1}]*2;p.write_text(json.dumps(d))
        self.assertRaises(ValueError,m.seal,self.root,'123')
if __name__=='__main__':unittest.main()
