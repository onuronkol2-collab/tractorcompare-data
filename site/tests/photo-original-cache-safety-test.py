"""Offline draft; execute only under TEST authorization."""
import importlib.util,json,tempfile,unittest,os,hashlib
from pathlib import Path
spec=importlib.util.spec_from_file_location('base',Path(__file__).with_name('photo-original-acquisition-test.py'))
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
m=base.m
class CacheSafetyTests(unittest.TestCase):
    def test_bad_pause_fails_before_network(self):
        r,_=base.fixture()
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'originals'; state=Path(t)/'state.json'
            state.write_text(json.dumps({'version':1,'paused_until':{'commons':float('nan')},'completed':{},'held':{}}))
            with self.assertRaises(ValueError):m.acquire([r],root,state,fetcher=lambda _:self.fail('network'))
    def test_conflicting_hold_and_completed(self):
        k='a'*64
        with self.assertRaises(ValueError):m.validate_ledger({'version':1,'paused_until':{},'completed':{k:{'local_path':k+'.jpg'}},'held':{k:'ValueError'}})
    def test_corrupt_cache_never_redownloaded(self):
        r,raw=base.fixture()
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'originals'; state=Path(t)/'state.json'
            first=m.acquire([r],root,state,fetcher=lambda _:raw,delay=lambda _:None)
            path=root/first['records'][0]['record']['local_path'];path.write_bytes(b'corrupt')
            second=m.acquire([r],root,state,fetcher=lambda _:self.fail('network'))
            self.assertEqual(second['records'][0]['status'],'held')
    def test_fifo_and_hardlink_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);name='a'*64+'.jpg';path=root/name;os.mkfifo(path)
            with self.assertRaises(ValueError):m.read_cached_original(root,name)
            path.unlink();other=root/'other';other.write_bytes(b'x');os.link(other,path)
            with self.assertRaises(ValueError):m.read_cached_original(root,name)
    def test_path_escape_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(ValueError):m.read_cached_original(Path(t),'../private.jpg')
    def test_reviewed_seed_reused_without_provider_budget(self):
        r,raw=base.fixture();r['expected_sha256']=hashlib.sha256(raw).hexdigest()
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'originals';seed=Path(t)/'seed';seed.mkdir(mode=0o700)
            (seed/(r['expected_sha256']+'.jpg')).write_bytes(raw)
            state=Path(t)/'state.json'
            state.write_text(json.dumps({'version':1,'paused_until':{'commons':999999},'completed':{},'held':{}}))
            persisted=[]
            result=m.acquire([r],root,state,seed_root=seed,fetcher=lambda _:self.fail('network'),shared_budget=lambda *a:self.fail('reservation'),provider_gate=lambda *a:self.fail('provider gate'),now=lambda:100,state_persist=lambda s:persisted.append(json.loads(json.dumps(s))))
            self.assertEqual(result['attempts'],0);self.assertEqual(result['records'][0]['status'],'reused_verified_original')
            self.assertFalse(result['records'][0]['record']['publishable']);self.assertEqual(len(persisted),1)
    def test_corrupt_seed_is_not_replaced_by_network(self):
        r,raw=base.fixture();r['expected_sha256']=hashlib.sha256(raw).hexdigest()
        with tempfile.TemporaryDirectory() as t:
            seed=Path(t)/'seed';seed.mkdir(mode=0o700);(seed/(r['expected_sha256']+'.jpg')).write_bytes(b'wrong')
            result=m.acquire([r],Path(t)/'originals',Path(t)/'state.json',seed_root=seed,fetcher=lambda _:self.fail('network'))
            self.assertEqual(result['records'][0]['status'],'held');self.assertEqual(result['attempts'],0)
    def test_seed_cannot_bypass_legacy_hold(self):
        r,raw=base.fixture();r['expected_sha256']=hashlib.sha256(raw).hexdigest()
        with tempfile.TemporaryDirectory() as t:
            seed=Path(t)/'seed';seed.mkdir(mode=0o700);(seed/(r['expected_sha256']+'.jpg')).write_bytes(raw)
            old=hashlib.sha256(json.dumps([r['provider'],r['source_image_url'],r['expected_sha1'],None,r['tractor_id']],ensure_ascii=False).encode()).hexdigest()
            state=Path(t)/'state.json';state.write_text(json.dumps({'version':1,'paused_until':{},'completed':{},'held':{old:'prior review'}}))
            result=m.acquire([r],Path(t)/'originals',state,seed_root=seed,fetcher=lambda _:self.fail('network'))
            self.assertEqual(result['records'][0]['status'],'held_previous_failure')
    def test_seed_requires_current_review(self):
        r,raw=base.fixture();r['expected_sha256']=hashlib.sha256(raw).hexdigest();r['previous_rejection']=True
        with tempfile.TemporaryDirectory() as t:
            seed=Path(t)/'seed';seed.mkdir(mode=0o700);(seed/(r['expected_sha256']+'.jpg')).write_bytes(raw)
            result=m.acquire([r],Path(t)/'originals',Path(t)/'state.json',seed_root=seed,fetcher=lambda _:self.fail('network'))
            self.assertEqual(result['records'][0]['status'],'held');self.assertEqual(result['attempts'],0)
if __name__=='__main__':unittest.main()
