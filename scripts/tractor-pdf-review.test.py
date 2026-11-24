import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("tractor-pdf-review.py")
spec = importlib.util.spec_from_file_location("pdf_review", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def make_pdf(path):
    # Small real two-page PDF with synthetic text; no third-party source or
    # license dependence. Use a standard built-in PDF font.
    streams = [
        b"BT /F1 12 Tf 50 700 Td (Model B3055 B3065 B3085) Tj ET",
        b"BT /F1 12 Tf 50 700 Td (Model B3095 B3105) Tj ET",
    ]
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Count 2 /Kids [3 0 R 4 0 R] >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    objects += [b"<< /Length " + str(len(s)).encode() + b" >>\nstream\n" + s + b"\nendstream" for s in streams]
    data = b"%PDF-1.4\n"
    offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(data))
        data += str(i).encode() + b" 0 obj\n" + obj + b"\nendobj\n"
    xref = len(data)
    data += b"xref\n0 " + str(len(offsets)).encode() + b"\n0000000000 65535 f \n"
    for offset in offsets[1:]:
        data += f"{offset:010d} 00000 n \n".encode()
    data += b"trailer\n<< /Size " + str(len(offsets)).encode() + b" /Root 1 0 R >>\nstartxref\n" + str(xref).encode() + b"\n%%EOF\n"
    path.write_bytes(data)

class PdfReviewTests(unittest.TestCase):
    def test_exact_model_and_page_locations(self):
        rows = mod.index_pages(["B30550\nB3055 B3065", "B3105"], ["B3055","B3065","B3105","B3095"])
        self.assertEqual(rows[0]["locations"], [{"page":1,"layout_line":2}])
        self.assertEqual(rows[2]["locations"], [{"page":2,"layout_line":1}])
        self.assertEqual(rows[3]["review_status"], "not_located")
        self.assertTrue(all(not row["allowed_to_publish"] for row in rows))

    def test_punctuation_case_and_caps(self):
        rows = mod.index_pages(["x5.0850\nX5.085"] + ["X5.085\n"*30], ["x5.085"])
        self.assertEqual(rows[0]["locations"][0], {"page":1,"layout_line":2})
        self.assertEqual(len(rows[0]["locations"]), mod.MAX_HITS_PER_MODEL)
        self.assertTrue(rows[0]["locations_capped"])
        with self.assertRaises(ValueError):
            mod.index_pages(["x"], ["A","a"])
        with self.assertRaises(ValueError):
            mod.index_pages(["x"]*(mod.MAX_PAGES+1), ["A"])
        with self.assertRaises(ValueError):
            mod.index_pages(["x"], [""])

    def test_real_pdf_and_private_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pdf = root / "PRIVATE-source.pdf"
            make_pdf(pdf)
            report = mod.review_pdf(pdf, ["B3055","B3095","B9999"])
            self.assertEqual(report["pages"], 2)
            self.assertEqual(report["models"][0]["locations"][0]["page"], 1)
            self.assertEqual(report["models"][1]["locations"][0]["page"], 2)
            self.assertEqual(report["models"][2]["locations"], [])
            self.assertEqual(report["published"], 0)
            self.assertEqual(report["db_writes"], 0)
            self.assertEqual(len(report["sha256"]), 64)
            self.assertNotIn("PRIVATE-source", json.dumps(report))
            out = root / "private.json"
            mod.write_private(report, out)
            self.assertEqual(stat.S_IMODE(out.stat().st_mode), 0o600)
            with self.assertRaises(FileExistsError):
                mod.write_private(report, out)
            with self.assertRaises(ValueError):
                mod.write_private(report, SCRIPT.parent / "must-not-write.json")
            link = root / "checkout"
            link.symlink_to(SCRIPT.parent, target_is_directory=True)
            with self.assertRaises(ValueError):
                mod.write_private(report, link / "must-not-write.json")

    def test_cli_and_non_pdf_rejection(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pdf = root / "PRIVATE.pdf"
            make_pdf(pdf)
            cmd = [sys.executable, str(SCRIPT), "--pdf", str(pdf), "--model", "B3055",
                   "--output", str(root / "private.json")]
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            self.assertNotIn("B3055", result.stdout)
            self.assertNotIn("PRIVATE", result.stdout)
            self.assertEqual(json.loads(result.stdout)["models_located"], 1)
            bad = root / "bad.pdf"
            bad.write_bytes(b"not a pdf")
            with self.assertRaises(ValueError):
                mod.review_pdf(bad, ["B3055"])

if __name__ == "__main__":
    unittest.main()
