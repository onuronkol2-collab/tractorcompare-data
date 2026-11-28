"""Regression drafts. Run only in authorized TEST."""
import importlib.util,tempfile,unittest
from pathlib import Path
p=Path(__file__).with_name('photo-original-acquisition-test.py')
s=importlib.util.spec_from_file_location('original_fixture',p);fixture_module=importlib.util.module_from_spec(s);s.loader.exec_module(fixture_module)
m=fixture_module.m;fixture=fixture_module.fixture
class SharedOriginalBudget(unittest.TestCase):
    def run_rows(self,rows,fetch,budget):
        with tempfile.TemporaryDirectory() as tmp:
            return m.acquire(rows,Path(tmp)/'originals',Path(tmp)/'state.json',fetcher=fetch,shared_budget=budget,now=lambda:100,delay=lambda _:None)
    def test_global_pause_no_download(self):
        r,_=fixture();res=self.run_rows([r],lambda _:self.fail('network forbidden'),lambda _:dict(allowed=False,retryMs=123))
        self.assertEqual(res['attempts'],0);self.assertEqual(res['records'][0]['status'],'provider_paused')
    def test_global_reservation_before_download(self):
        r,raw=fixture();events=[]
        def budget(action):events.append(action);return {'allowed':True}
        def fetch(_):events.append('fetch');return raw
        res=self.run_rows([r],fetch,budget);self.assertEqual(events,['reserve','fetch']);self.assertEqual(res['records'][0]['status'],'original_prepared')
    def test_rate_limit_persists_globally(self):
        r,_=fixture();events=[]
        def budget(*a):events.append(a);return {'allowed':True}
        def fetch(_):raise m.Deferred(86400,'429')
        res=self.run_rows([r,{**r,'tractor_id':'other'}],fetch,budget);self.assertEqual(events,[('reserve',),('pause',86400)]);self.assertEqual(res['attempts'],1)
    def test_broken_shared_state_no_download(self):
        r,_=fixture()
        def broken(*_):raise OSError('state missing')
        res=self.run_rows([r,{**r,'tractor_id':'other'}],lambda _:self.fail('network forbidden'),broken);self.assertEqual(res['attempts'],0)
        self.assertTrue(all(x['status']=='shared_budget_unavailable' for x in res['records']))
    def test_failed_global_pause_fails_batch(self):
        r,_=fixture()
        def budget(action,*_):
            if action=='pause':raise OSError('disk full')
            return {'allowed':True}
        def fetch(_):raise m.Deferred(86400,'429')
        with self.assertRaises(RuntimeError):self.run_rows([r],fetch,budget)

if __name__ == "__main__": unittest.main()
