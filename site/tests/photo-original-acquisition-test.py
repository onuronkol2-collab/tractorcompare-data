import hashlib,importlib.util,io,tempfile,unittest
from pathlib import Path
from PIL import Image
S=Path(__file__).resolve().parents[1]/'scripts'/'photo-original-acquisition.py'
spec=importlib.util.spec_from_file_location('acq',S);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def fixture():
    b=io.BytesIO();Image.new('RGB',(800,600)).save(b,'JPEG');raw=b.getvalue();name='Fixture.jpg';h=hashlib.md5(name.encode(),usedforsecurity=False).hexdigest()
    r=dict(tractor_id='fixture-id',brand='Example',model='123',provider='commons',source_page_url='https://commons.wikimedia.org/wiki/File:'+name,source_image_url=f'https://upload.wikimedia.org/wikipedia/commons/{h[0]}/{h[:2]}/{name}',rights_evidence_ref='fixture',original_evidence_ref='fixture',photographer='fixture',license='CC BY-SA 4.0',acquisition_authorized=True,model_status='published',has_approved_photo=False,expected_sha1=hashlib.sha1(raw,usedforsecurity=False).hexdigest(),expected_bytes=len(raw),expected_mime='image/jpeg',expected_width=800,expected_height=600)
    return r,raw
class AcquisitionTest(unittest.TestCase):
    def test_verified_original_never_approved(self):
        r,raw=fixture()
        with tempfile.TemporaryDirectory() as t:
            got=m.store(Path(t),r,raw);self.assertTrue(got['original_bytes_verified']);self.assertFalse(got['publishable']);self.assertFalse(got['rights_verified']);self.assertEqual((Path(t)/got['local_path']).read_bytes(),raw)
    def test_thumb_rejected(self):
        r,_=fixture();r['source_image_url']=r['source_image_url'].replace('/commons/','/commons/thumb/')+'/480px-Fixture.jpg'
        with self.assertRaises(ValueError):m.validate(r)
    def test_unknown_host_and_credentials_rejected(self):
        r,_=fixture()
        for u in ['https://localhost/file.jpg','https://upload.wikimedia.org@localhost/file.jpg','https://upload.wikimedia.org:443/file.jpg']:
            with self.subTest(u=u),self.assertRaises(ValueError):m.validate({**r,'source_image_url':u})
    def test_checksum_mismatch(self):
        r,raw=fixture();r['expected_sha1']='0'*40
        with self.assertRaises(ValueError):m.verify(r,raw)
    def test_wrong_dimensions(self):
        r,raw=fixture();r['expected_width']=801
        with self.assertRaises(ValueError):m.verify(r,raw)
    def test_pdm_and_previous_reject_hold(self):
        r,_=fixture()
        for x in [{'license':'PDM'},{'previous_rejection':True},{'acquisition_authorized':False}]:
            with self.subTest(x=x),self.assertRaises(ValueError):m.validate({**r,**x})
    def test_provider_pause_and_reuse(self):
        r,raw=fixture();calls=[]
        def fetch(x):calls.append(x);raise m.Deferred(86400,'test cooldown')
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/'originals';state=Path(t)/'state.json'
            a=m.acquire([r,{**r,'tractor_id':'another'}],root,state,fetcher=fetch,now=lambda:100,delay=lambda _:None);self.assertEqual(len(calls),1);self.assertEqual(a['records'][1]['status'],'provider_paused')
            b=m.acquire([r],root,state,fetcher=lambda _:raw,now=lambda:90000,delay=lambda _:None);self.assertEqual(b['records'][0]['status'],'original_prepared')
            c=m.acquire([r],root,state,fetcher=lambda _:self.fail('reused should not fetch'),now=lambda:90001,delay=lambda _:None);self.assertEqual(c['records'][0]['status'],'reused_verified_original')
    def test_flickr_original_requires_digest(self):
        r,_=fixture();r.update(provider='flickr',source_page_url='https://www.flickr.com/photos/fixture/1234/',source_image_url='https://live.staticflickr.com/123/1234_abcd_o.jpg')
        with self.assertRaises(ValueError):m.validate(r)
if __name__=='__main__':unittest.main()
