"""Private archive fixtures only. Run after explicit TEST."""
import base64, importlib.util, json, tempfile, unittest, os
from pathlib import Path
from unittest.mock import patch

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
m=load('private_archive',Path(__file__).parents[1]/'scripts/photo-private-archive.py')
base=load('fixture',Path(__file__).with_name('photo-original-acquisition-test.py'))
class Fake:
    def __init__(self):self.objects={};self.verified=set();self.puts=0
    def get(self,key):
        if key not in self.objects:raise RuntimeError('archive HTTP 404')
        data=self.objects[key]
        if m.digest(data)!=m.key_info(key)[0]:raise ValueError('digest mismatch')
        return data
    def put(self,key,raw):
        self.puts+=1
        if key in self.objects and self.objects[key]!=raw:raise ValueError('immutable')
        self.objects[key]=raw
        if self.get(key)!=raw:raise ValueError('readback')
class PrivateArchiveTests(unittest.TestCase):
    def test_roundtrip_and_no_repeated_original_upload(self):
        row,raw=base.fixture();f=Fake()
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'src';root.mkdir(mode=0o700);name=m.digest(raw)+'.jpg'
            (root/name).write_bytes(raw)
            state={'version':1,'paused_until':{},'held':{},'completed':{'a'*64:{'local_path':name}}}
            d=m.persist(f,root,state);d2=m.persist(f,root,state,d)
            self.assertEqual(f.puts,3)
            dst=Path(t)/'dst';dst.mkdir(mode=0o700);out=Path(t)/'state.json'
            self.assertEqual(m.restore(f,d2,dst,out),state);self.assertEqual((dst/name).read_bytes(),raw)
    def test_bad_digest_or_existing_destination_blocks_restore(self):
        f=Fake();state={'version':1,'paused_until':{},'held':{},'completed':{}}
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);d=m.persist(f,root,state);path=root/'state.json';path.write_text('{}')
            with self.assertRaises(ValueError):m.restore(f,d,root,path)
            path.unlink();f.objects['manifests/'+d+'.json']=b'corrupt'
            with self.assertRaises(ValueError):m.restore(f,d,root,path)
            self.assertFalse(path.exists())
    def test_key_scope(self):
        for k in ('../secret','originals/../foo','manifests/a.json','originals/'+'a'*64+'.exe'):
            with self.assertRaises(ValueError):m.key_info(k)
    def test_reject_service_or_expired_token_and_stale_quota(self):
        uid='12345678-1234-1234-1234-123456789abc'
        def tok(role,exp):return 'header.'+base64.urlsafe_b64encode(json.dumps({'role':role,'sub':uid,'exp':exp,'is_anonymous':False}).encode()).decode().rstrip('=')+'.signature'
        for token in (tok('service_role',1000),tok('authenticated',120)):
            with self.assertRaises(ValueError):m.checked_token(token,uid,0)
        with self.assertRaises(ValueError):m.Archive('sb_publishable_test',tok('authenticated',5000),uid,{'free_plan_verified':True,'observed_at':0,'available_bytes':5},now=lambda:1000)
    def test_archive_failure_stops_next_provider_request(self):
        row,raw=base.fixture();calls=[]
        def fetch(r):calls.append(r);return raw
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'originals';state=Path(t)/'state.json'
            def fail(_):raise OSError('offline archive')
            with self.assertRaises(m.acq.StatePersistenceError):m.acq.acquire([row,row],root,state,fetcher=fetch,delay=lambda _:None,state_persist=fail)
            self.assertEqual(len(calls),1);self.assertTrue(state.exists())
    def test_local_ledger_failure_stops_requests(self):
        row,raw=base.fixture();calls=[]
        with tempfile.TemporaryDirectory() as t:
            with patch.object(m.acq,'atomic_json',side_effect=OSError('disk full')):
                with self.assertRaises(m.acq.StatePersistenceError):m.acq.acquire([row,row],Path(t)/'originals',Path(t)/'state.json',fetcher=lambda r:(calls.append(r),raw)[1],delay=lambda _:None)
            self.assertEqual(len(calls),1)
class PrivateRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.batch=load('private_batch_fixture',Path(__file__).parents[1]/'scripts/photo-private-archive-batch.py')
    def make_pending(self,root,out,remote,*,write_remote=True):
        state={'version':1,'paused_until':{},'held':{},'completed':{}}
        parent=m.persist(remote,root,state)
        state['paused_until']['flickr']=1234
        m.acq.atomic_json(out/'acquisition-state.json',state)
        m.acq.atomic_json(out/'archive-checkpoint.json',{'checkpoint':parent})
        raw=m.encode({'version':1,'previous':parent,'state':state,'originals':[]})
        d=m.digest(raw)
        m.acq.atomic_json(out/'archive-pending.json',{'checkpoint':d,'previous':parent})
        if write_remote:remote.put('manifests/'+d+'.json',raw)
        return d
    def test_recover_remote_seal_before_pointer(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'root';out=Path(t)/'out';root.mkdir(mode=0o700);out.mkdir(mode=0o700);remote=Fake()
            d=self.make_pending(root,out,remote)
            self.assertEqual(self.batch.recover(remote,root,out)['checkpoint'],d)
            self.assertEqual(json.loads((out/'archive-checkpoint.json').read_text())['checkpoint'],d)
            self.assertFalse((out/'archive-pending.json').exists())
    def test_recover_unwritten_manifest_only_with_exact_evidence(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'root';out=Path(t)/'out';root.mkdir(mode=0o700);out.mkdir(mode=0o700);remote=Fake()
            d=self.make_pending(root,out,remote,write_remote=False)
            self.assertEqual(self.batch.recover(remote,root,out)['checkpoint'],d)
            self.assertIn('manifests/'+d+'.json',remote.objects)
    def test_changed_local_ledger_never_resealed(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'root';out=Path(t)/'out';root.mkdir(mode=0o700);out.mkdir(mode=0o700);remote=Fake()
            self.make_pending(root,out,remote)
            m.acq.atomic_json(out/'acquisition-state.json',{'version':1,'paused_until':{},'held':{},'completed':{}})
            with self.assertRaises(ValueError):self.batch.recover(remote,root,out)
            self.assertTrue((out/'archive-pending.json').exists())
    def test_gate_commons_and_stale_capacity(self):
        from types import SimpleNamespace
        quota=SimpleNamespace(now=lambda:1000,observed=0,remaining=m.MAX_RUN_BYTES)
        self.assertTrue(self.batch.provider_gate(quota,{'provider':'commons'},{}))
        self.assertTrue(self.batch.provider_gate(quota,{'provider':'flickr','expected_bytes':10},{}))
        quota.observed=999;quota.remaining=m.MAX_JSON+9
        self.assertTrue(self.batch.provider_gate(quota,{'provider':'flickr','expected_bytes':10},{}))
        quota.remaining=m.MAX_JSON+10
        self.assertIsNone(self.batch.provider_gate(quota,{'provider':'flickr','expected_bytes':10},{}))
    def test_deferred_provider_does_not_fetch_or_mark_held(self):
        row,raw=base.fixture();calls=[]
        with tempfile.TemporaryDirectory() as t:
            result=m.acq.acquire([row],Path(t)/'originals',Path(t)/'state.json',fetcher=lambda r:calls.append(r),delay=lambda _:None,provider_gate=lambda r,s:'deferred')
            self.assertEqual(result['attempts'],0);self.assertFalse(calls)
            self.assertEqual(result['records'][0]['status'],'private_acquisition_deferred')
    def test_journal_precedes_first_original_upload(self):
        row,raw=base.fixture();remote=Fake()
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);name=m.digest(raw)+'.jpg';(root/name).write_bytes(raw)
            state={'version':1,'paused_until':{},'held':{},'completed':{'a'*64:{'local_path':name}}}
            events=[]
            def journal(d,parent):
                self.assertEqual(remote.puts,0);events.append(d)
            d=m.persist(remote,root,state,before_manifest=journal)
            self.assertEqual(events,[d]);self.assertEqual(remote.puts,2)
    def test_recovery_uploads_missing_local_verified_original(self):
        row,raw=base.fixture();remote=Fake()
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'root';out=Path(t)/'out';root.mkdir(mode=0o700);out.mkdir(mode=0o700)
            parent=m.persist(remote,root,{'version':1,'paused_until':{},'held':{},'completed':{}})
            name=m.digest(raw)+'.jpg';(root/name).write_bytes(raw)
            state={'version':1,'paused_until':{},'held':{},'completed':{'a'*64:{'local_path':name}}}
            m.acq.atomic_json(out/'acquisition-state.json',state)
            m.acq.atomic_json(out/'archive-checkpoint.json',{'checkpoint':parent})
            d=m.digest(m.encode({'version':1,'previous':parent,'state':state,'originals':[name]}))
            m.acq.atomic_json(out/'archive-pending.json',{'checkpoint':d,'previous':parent})
            self.assertEqual(self.batch.recover(remote,root,out)['checkpoint'],d)
            self.assertEqual(remote.get('originals/'+name),raw)
    def test_workspace_lock_rejects_second_writer(self):
        with tempfile.TemporaryDirectory() as t:
            out=Path(t)
            with self.batch.workspace_lock(out):
                with self.assertRaises(BlockingIOError):
                    with self.batch.workspace_lock(out):self.fail('second writer')
    def test_corrupt_parent_blocks_recovery_before_writes(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'root';out=Path(t)/'out';root.mkdir(mode=0o700);out.mkdir(mode=0o700);remote=Fake()
            self.make_pending(root,out,remote,write_remote=False)
            parent=json.loads((out/'archive-checkpoint.json').read_text())['checkpoint']
            remote.objects['manifests/'+parent+'.json']=b'broken'
            before=remote.puts
            with self.assertRaises(ValueError):self.batch.recover(remote,root,out)
            self.assertEqual(remote.puts,before);self.assertTrue((out/'archive-pending.json').exists())
if __name__=='__main__':unittest.main()
