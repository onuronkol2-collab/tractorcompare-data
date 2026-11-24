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

class PdfColumnTests(unittest.TestCase):
    @staticmethod
    def layout():
        # Explicit fixed-width, two model columns. Tests are invented data,
        # never evidence for actual Hattat or other production tractor specs.
        row = lambda label, a, b: f"{label:<20}{a:<12}  {b:<12}"
        page = "\n".join([
            row("Model", "TEST-A", "TEST-B"),
            row("Power [kW]", "40", "55"),
            row("Torque [Nm]", "200", "280"),
            row("Mass [kg]", "-", "3200"),
            row("Fuel [L]", "70", ""),
            row("PTO [rpm]", "540/540E", "540/750"),
        ])
        manifest = {"schema":1, "sha256":"fake-fixture-hash", "tables":[
            {"page":1, "header_line":1, "header_label":"Model",
             "columns":[{"model":"TEST-A","start":20,"end":32},
                        {"model":"TEST-B","start":34,"end":46}],
             "rows":[{"line":2,"label":"Power [kW]"},
                     {"line":3,"label":"Torque [Nm]"},
                     {"line":4,"label":"Mass [kg]"},
                     {"line":5,"label":"Fuel [L]"},
                     {"line":6,"label":"PTO [rpm]"}]}]}
        return page,manifest

    def setUp(self):
        import runpy
        self.extract = runpy.run_path(str(SCRIPT.with_name("tractor-pdf-columns.py")))["extract_candidates"]

    def extract_fixture(self, page, manifest):
        return self.extract([page], ["TEST-A","TEST-B"], "fake-fixture-hash", manifest)

    def test_exact_column_candidates_and_missing_cell_rejection(self):
        page, manifest = self.layout()
        report = self.extract_fixture(page, manifest)
        self.assertEqual(report["status"], "partial_column_review")
        cells = report["candidate_cells"]
        self.assertEqual(len(cells), 6)
        self.assertEqual([(x["model"], x["source_value"]) for x in cells[:2]],
                         [("TEST-A","40"),("TEST-B","55")])
        self.assertEqual([x["source_value"] for x in cells[-2:]], ["540/540E","540/750"])
        self.assertEqual([x["layout_line"] for x in report["blocked_rows"]], [4,5])
        self.assertTrue(all(not x["allowed_to_publish"] for x in cells))
        self.assertEqual(report["approved"], 0)
        self.assertEqual(report["published"], 0)

    def test_wrong_hash_header_model_order_or_overlap_rejected(self):
        for mutate in (
            lambda m: m.update(sha256="other"),
            lambda m: m["tables"][0]["columns"].reverse(),
            lambda m: m["tables"][0]["columns"][1].update(start=25),
            lambda m: m["tables"][0]["columns"][1].update(model="TEST-A"),
            lambda m: m["tables"][0]["columns"][1].update(model="NOT-REQUESTED"),
            lambda m: m["tables"][0].update(header_label="Other"),
            lambda m: m["tables"][0]["rows"].append({"line":2,"label":"Power [kW]"}),
        ):
            page, manifest = self.layout()
            mutate(manifest)
            with self.assertRaises(ValueError):
                self.extract_fixture(page, manifest)
        page, manifest = self.layout()
        with self.assertRaises(ValueError):
            self.extract_fixture(page.replace("TEST-A","TEST-Z"), manifest)

    def test_boundary_drift_and_unmapped_content_block_row(self):
        page,manifest = self.layout()
        lines = page.splitlines()
        lines[1] = "Power [kW]".ljust(20) + "12345678901234567890"
        lines[2] += "UNMAPPED"
        report = self.extract_fixture("\n".join(lines), manifest)
        self.assertEqual([r["layout_line"] for r in report["blocked_rows"]], [2,3,4,5])
        self.assertEqual(len(report["candidate_cells"]), 2)

    def test_private_manifest_bound_to_real_pdf_hash(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pdf = root / "test.pdf"
            make_pdf(pdf)
            manifest = root / "manifest.json"
            manifest.write_text(json.dumps({"schema":1,"sha256":"wrong","tables":[]}))
            with self.assertRaises(ValueError):
                mod.review_pdf(pdf, ["B3055","B3065"], mod.read_table_manifest(manifest))
            manifest.write_bytes(b" " * (mod.MAX_MANIFEST_BYTES+1))
            with self.assertRaises(ValueError):
                mod.read_table_manifest(manifest)


if __name__ == "__main__":
    unittest.main()
