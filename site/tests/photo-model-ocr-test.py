import hashlib,importlib.util,subprocess,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from PIL import Image
S=Path(__file__).resolve().parents[1]/'scripts'/'photo-model-ocr.py'
spec=importlib.util.spec_from_file_location('ocr',S);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class OCRTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.p=Path(self.tmp.name)/'photo.jpg';Image.new('RGB',(800,600)).save(self.p);self.sha=hashlib.sha256(self.p.read_bytes()).hexdigest()
    def tearDown(self):self.tmp.cleanup()
    def fake(self,*words):
        return subprocess.CompletedProcess([],0,'conf\ttext\n'+''.join(f'{conf}\t{text}\n' for conf,text in words),'')
    def call(self,result,model='X4.085'):
        with patch.object(m.shutil,'which',return_value='/mock/tesseract'),patch.object(m.subprocess,'run',return_value=result):return m.recognize(self.p,self.sha,'McCormick',model)
    def test_exact_tokens_only_never_approval(self):
        r=self.call(self.fake((90,'McCormick'),(90,'X4.085')));self.assertTrue(r['brand_token_signal']);self.assertTrue(r['model_token_signal']);self.assertFalse(r['identity_verified']);self.assertFalse(r['publishable'])
    def test_wrong_model_and_low_confidence(self):
        r=self.call(self.fake((90,'X4.095'),(20,'X4.085')));self.assertFalse(r['model_token_signal'])
    def test_suffix_not_silently_removed(self):
        r=self.call(self.fake((90,'X4.085'),(90,'TM')),model='X4.085 TF');self.assertFalse(r['model_token_signal'])
    def test_sha_mismatch_before_engine(self):
        with patch.object(m.shutil,'which') as which:
            with self.assertRaises(ValueError):m.recognize(self.p,'0'*64,'McCormick','X4.085');which.assert_not_called()
    def test_timeout_propagates(self):
        with patch.object(m.shutil,'which',return_value='/mock/tesseract'),patch.object(m.subprocess,'run',side_effect=subprocess.TimeoutExpired('tesseract',30)):
            with self.assertRaises(subprocess.TimeoutExpired):m.recognize(self.p,self.sha,'McCormick','X4.085')
if __name__=='__main__':unittest.main()
