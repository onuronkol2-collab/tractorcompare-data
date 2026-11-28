"""Offline draft; execute only under TEST authorization."""
import importlib.util,json,tempfile,unittest,os
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
if __name__=='__main__':unittest.main()
