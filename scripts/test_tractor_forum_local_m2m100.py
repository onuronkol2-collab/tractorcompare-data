import unittest
from unittest.mock import Mock
from tractor_forum_local_m2m100 import validate, LANGS, reference
from contextlib import nullcontext

class Tokens(list):
    def tolist(self): return list(self)

class Tests(unittest.TestCase):
    def data(self):
        return {"source_locale":"tr","source_hash":"a"*32,"segments":[{"id":"title","text":"Traktör 2026"},{"id":"body","text":"Üretim yeri"}]}
    def test_all_languages(self):
        self.assertEqual(len(LANGS),10)
        self.assertEqual(len(validate(self.data(),[x for x in LANGS if x!="tr"])),2)
        self.assertEqual(LANGS["pt-br"],"pt")
    def test_invalid_inputs(self):
        for locales in ([],["tr"],["xx"],["en","en"]):
            with self.assertRaises(ValueError): validate(self.data(),locales)
        d=self.data(); d["segments"].append(d["segments"][0])
        with self.assertRaises(ValueError): validate(d,["en"])
    def test_reference_only_and_truncation(self):
        tok=Mock(); tok.encode.return_value=[1,2]; tok.return_value={"input_ids":[1]}; tok.eos_token_id=2
        tok.decode.return_value="Reference"; model=Mock(); model.generate.return_value=[Tokens([1,2]),Tokens([1,2])]
        torch=Mock(); torch.inference_mode.side_effect=nullcontext
        output=reference(self.data(),["pt-br"],tok,model,torch)
        self.assertEqual(output["status"],"reference_only_not_approved")
        self.assertTrue(output["locales"]["pt-br"]["regional_review_required"])
        self.assertEqual(len(output["locales"]["pt-br"]["segments"]),2)
        tok.encode.return_value=[1]*385
        with self.assertRaises(ValueError): reference(self.data(),["en"],tok,model,torch)
    def test_missing_eos(self):
        tok=Mock(); tok.encode.return_value=[1]; tok.return_value={}; tok.eos_token_id=2
        model=Mock(); model.generate.return_value=[Tokens([1])]
        torch=Mock(); torch.inference_mode.side_effect=nullcontext
        with self.assertRaises(ValueError): reference(self.data(),["en"],tok,model,torch)

if __name__=="__main__": unittest.main()
