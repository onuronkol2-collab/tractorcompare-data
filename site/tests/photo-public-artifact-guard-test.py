"""Unrun local regression drafts for the public artifact boundary."""
import importlib.util
import tempfile
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('guard', Path(__file__).resolve().parents[1]/'scripts'/'photo-public-artifact-guard.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
class PublicArtifactGuard(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)/'reports'; self.root.mkdir()
        (self.root/'report.json').write_text('{}')
    def test_permitted_report(self):
        self.assertEqual(m.guard(self.root),1)
    def test_private_manifest(self):
        (self.root/'private-review.json').write_text('{}')
        with self.assertRaises(ValueError): m.guard(self.root)
    def test_original_bytes(self):
        (self.root/'original.jpg').write_bytes(b'fixture')
        with self.assertRaises(ValueError): m.guard(self.root)
    def test_nested_directory(self):
        (self.root/'originals').mkdir()
        with self.assertRaises(ValueError): m.guard(self.root)
    def test_symlink(self):
        (self.root/'coverage.json').symlink_to(self.root/'report.json')
        with self.assertRaises(ValueError): m.guard(self.root)
    def test_hardlink(self):
        (self.root/'coverage.json').hardlink_to(self.root/'report.json')
        with self.assertRaises(ValueError): m.guard(self.root)
    def test_invalid_json(self):
        (self.root/'coverage.json').write_text('not json')
        with self.assertRaises(ValueError): m.guard(self.root)
if __name__=='__main__': unittest.main()
