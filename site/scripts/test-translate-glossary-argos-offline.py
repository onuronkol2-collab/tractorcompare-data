"""Contract tests only; no model downloads or fake claims of translation accuracy."""
import importlib.util
import pathlib
import unittest

path = pathlib.Path(__file__).with_name("translate-glossary-argos-offline.py")
spec = importlib.util.spec_from_file_location("adapter", path)
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)

def packet(locale="pt-br"):
    core = {"schema": 1, "sourceBlobSha": "abc", "jobs": [
        {"locale": locale, "entries": [{"id": "pto", "requestedFields": list(adapter.FIELDS),
         "source": {"definition": "Power shaft.", "example": "Mower.", "caution": "Use guards."}}]}]}
    return {**core, "packetSha256": adapter.digest(core), "state": "draft-needs-independent-editorial-review",
            "notForPublication": True}

class Contract(unittest.TestCase):
    def test_draft_return(self):
        got = adapter.generate(packet(), lambda lang: lambda value: "TEST " + value)
        self.assertEqual(adapter.PAIRS["pt-br"], ("pb", "1.9"))
        self.assertEqual(got["jobs"][0]["locale"], "pt-br")
        self.assertEqual(set(got["jobs"][0]["entries"][0]), {"id", *adapter.FIELDS})
        self.assertFalse(got["reviewed"])
        self.assertTrue(got["notForPublication"])
    def test_reject_tamper(self):
        p = packet()
        p["jobs"][0]["entries"][0]["source"]["example"] = "Changed"
        with self.assertRaises(ValueError):
            adapter.generate(p, lambda lang: self.fail("Translator must not be called"))
    def test_reject_unknown_locale(self):
        with self.assertRaises(ValueError):
            adapter.generate(packet("xx"))
    def test_reject_english(self):
        with self.assertRaises(ValueError):
            adapter.generate(packet(), lambda lang: lambda value: value)
    def test_reject_empty(self):
        with self.assertRaises(ValueError):
            adapter.generate(packet(), lambda lang: lambda value: " ")

if __name__ == "__main__":
    unittest.main()
