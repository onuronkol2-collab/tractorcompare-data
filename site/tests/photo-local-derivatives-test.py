"""Draft regression suite; run only under explicit TEST authorization."""
import hashlib, importlib.util, tempfile, unittest
from pathlib import Path
from PIL import Image
spec=importlib.util.spec_from_file_location('derivatives',Path(__file__).resolve().parents[1]/'scripts'/'photo-local-derivatives.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.source=self.root/'original.jpg'
        Image.new('RGB',(1000,700),'green').save(self.source);self.digest=hashlib.sha256(self.source.read_bytes()).hexdigest()
    def tearDown(self): self.tmp.cleanup()
    def test_never_upscale_and_never_approve(self):
        report=m.prepare(self.source,self.digest,self.root/'out')
        self.assertFalse(report['publishable']);self.assertFalse(report['rights_verified']);self.assertFalse(report['identity_verified'])
        self.assertEqual({x['width'] for x in report['derivatives']},{480,960});self.assertEqual(len(report['derivatives']),4)
        self.assertEqual(m.sha(self.source.read_bytes()),self.digest)
    def test_wrong_hash(self):
        with self.assertRaises(ValueError):m.prepare(self.source,'0'*64,self.root/'out')
    def test_no_overwrite(self):
        m.prepare(self.source,self.digest,self.root/'out')
        with self.assertRaises(FileExistsError):m.prepare(self.source,self.digest,self.root/'out')
    def test_tiny_image_not_upscaled(self):
        Image.new('RGB',(300,200)).save(self.source)
        with self.assertRaises(ValueError):m.prepare(self.source,m.sha(self.source.read_bytes()),self.root/'out')
    def test_bad_file(self):
        self.source.write_bytes(b'not an image')
        with self.assertRaises(Exception):m.prepare(self.source,m.sha(self.source.read_bytes()),self.root/'out')
if __name__=='__main__':unittest.main()
