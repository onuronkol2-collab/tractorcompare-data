"""DEVAM regression drafts: not executed until TEST authorization."""
import importlib.util,json,tempfile,unittest,ssl
from pathlib import Path
from urllib.error import URLError,HTTPError
from email.message import Message
spec=importlib.util.spec_from_file_location('base_fixture',Path(__file__).with_name('photo-original-acquisition-test.py'))
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
m=base.m
class TransportRetryTests(unittest.TestCase):
    def test_transient_provider_pause_and_later_recovery(self):
        r,raw=base.fixture();calls=[]
        def fail(row):
            calls.append(row);raise URLError('DNS temporarily unavailable')
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'originals';state=Path(t)/'state.json'
            result=m.acquire([r,{**r,'tractor_id':'other'}],root,state,fetcher=fail,now=lambda:100,delay=lambda _:None)
            self.assertEqual(len(calls),1)
            self.assertEqual([x['status'] for x in result['records']],['transport_retry_deferred','provider_transport_deferred'])
            self.assertEqual(json.loads(state.read_text())['held'],{})
            early=m.acquire([r,{**r,'tractor_id':'new-invocation'}],root,state,fetcher=lambda _:self.fail('premature retry'),now=lambda:101,delay=lambda _:None)
            self.assertEqual(early['attempts'],0)
            recovered=m.acquire([r],root,state,fetcher=lambda _:raw,now=lambda:3701,delay=lambda _:None)
            self.assertEqual(recovered['records'][0]['status'],'original_prepared')
            self.assertEqual(json.loads(state.read_text())['transport_retry'],{})
    def test_invalid_bytes_are_not_retryable(self):
        r,_=base.fixture()
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'originals';state=Path(t)/'state.json'
            first=m.acquire([r],root,state,fetcher=lambda _:b'wrong',now=lambda:100,delay=lambda _:None)
            self.assertEqual(first['records'][0]['status'],'held_for_review')
            second=m.acquire([r],root,state,fetcher=lambda _:self.fail('integrity hold bypass'),now=lambda:100000,delay=lambda _:None)
            self.assertEqual(second['records'][0]['status'],'held_previous_failure')
    def test_http_classes_distinct(self):
        for code in (408,500,502,504):
            self.assertTrue(m.retryable_transport(HTTPError('https://example.test',code,'fixture',Message(),None)))
        for code in (401,403,404,429,503):
            self.assertFalse(m.retryable_transport(HTTPError('https://example.test',code,'fixture',Message(),None)))
    def test_tls_error_is_not_retryable(self):
        self.assertFalse(m.retryable_transport(URLError(ssl.SSLCertVerificationError(1,'invalid certificate'))))
    def test_previous_hold_not_reset(self):
        r,_=base.fixture()
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'originals';state=Path(t)/'state.json'
            m.acquire([r],root,state,fetcher=lambda _:b'bad',now=lambda:100,delay=lambda _:None)
            old=json.loads(state.read_text());old.pop('transport_retry',None);state.write_text(json.dumps(old))
            got=m.acquire([r],root,state,fetcher=lambda _:self.fail('old hold reset'),now=lambda:99999,delay=lambda _:None)
            self.assertEqual(got['records'][0]['status'],'held_previous_failure')
    def test_corrupt_retry_ledger_fails_closed(self):
        r,_=base.fixture()
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'originals';state=Path(t)/'state.json'
            state.write_text(json.dumps(dict(version=1,paused_until={},completed={},held={},transport_retry={'bad':{}})))
            with self.assertRaises(ValueError):m.acquire([r],root,state,fetcher=lambda _:self.fail('corrupt state'),now=lambda:100,delay=lambda _:None)
if __name__=='__main__':unittest.main()
