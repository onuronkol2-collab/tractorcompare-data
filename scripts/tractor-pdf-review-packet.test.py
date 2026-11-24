import copy
import importlib.util
import json
import os
import subprocess
from pathlib import Path
import re
import stat
import tempfile
import unittest

spec=importlib.util.spec_from_file_location("packet",Path(__file__).with_name("tractor-pdf-review-packet.py"))
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
SHA="a"*64

def fixture():
    targets=[{"model":model,"model_name":model,"tractor_id":f"00000000-0000-4000-8000-{i:012d}",
              "brand":"Synthetic","market":"Test","variant":None,"model_year":None}
             for i,model in enumerate(("TEST-A","TEST-B"),1)]
    fields=[{"page":1,"layout_line":i,"source_label":label,"canonical_key":key,
             "spec_name":label,"unit":unit,"comparison_class":"engine","measurement_standard":None}
            for i,label,key,unit in [(2,"Power","engine_power","kW"),(3,"Torque","engine_torque","Nm")]]
    cells=[{"model":t["model"],"page":1,"header_line":1,"layout_line":f["layout_line"],
            "column_start":20+i*14,"column_end":32+i*14,"source_label":f["source_label"],
            "source_value":str(40+i*10+j*100),"review_status":"visual_column_review_needed",
            "allowed_to_publish":False}
           for i,t in enumerate(targets) for j,f in enumerate(fields)]
    return ({"schema":1,"sha256":SHA,"pages":1,"published":0,"db_writes":0,
             "table_review":{"status":"column_review_needed","candidate_cells":cells,
                             "blocked_rows":[],"approved":0,"published":0}},
            {"schema":1,"document_sha256":SHA,"source_url":"https://manufacturer.example/catalog.pdf",
             "source_publisher":"Synthetic","observed_at":"2020-01-01","targets":targets,"fields":fields})

class PacketTests(unittest.TestCase):
    def test_exact_packet_and_private_sql(self):
        report,plan=fixture()
        rows=mod.build_packet(report,plan)
        self.assertEqual(len(rows),4)
        self.assertEqual(rows[0]["spec_value"],"40")
        self.assertIn("page 1, header line 1, layout line 2, columns 20:32",rows[0]["evidence_text"])
        sql=mod.sql_packet(rows)
        self.assertTrue(sql.endswith("ROLLBACK;\n"))
        self.assertTrue(mod.sql_packet(rows,True).endswith("COMMIT;\n"))
        self.assertIn("t.status='draft'",sql)
        self.assertIn("FOR UPDATE OF t",sql)
        self.assertIn("'needs_review'",sql)
        self.assertIn("ON CONFLICT (tractor_id,canonical_key,spec_value,source_url) DO NOTHING",sql)
        self.assertNotRegex(sql,r"(?i)(?:INSERT INTO|UPDATE|DELETE FROM)\s+public\.(?:tractors|tractor_specs|data_sources)\b")
        self.assertNotIn("manufacturer.example",sql)
        hexdata=re.search(r"decode\('([a-f0-9]+)','hex'\)",sql).group(1)
        self.assertEqual(json.loads(bytes.fromhex(hexdata)),rows)

    def test_refuses_missing_wrong_or_approved_data(self):
        for mutate in (
            lambda r,p:p.update(document_sha256="b"*64),
            lambda r,p:r["table_review"].update(approved=1),
            lambda r,p:r["table_review"]["candidate_cells"][0].update(allowed_to_publish=True),
            lambda r,p:r["table_review"]["candidate_cells"].pop(),
            lambda r,p:r["table_review"]["candidate_cells"].append(copy.deepcopy(r["table_review"]["candidate_cells"][0])),
            lambda r,p:r["table_review"]["candidate_cells"][0].update(source_label="Wrong"),
            lambda r,p:r["table_review"]["candidate_cells"][0].update(source_value="-"),
            lambda r,p:r["table_review"]["blocked_rows"].append({"page":1,"layout_line":2}),
            lambda r,p:p["targets"][0].update(model_name="Other"),
            lambda r,p:p["targets"][0].pop("variant"),
            lambda r,p:p["targets"][1].update(tractor_id=p["targets"][0]["tractor_id"]),
            lambda r,p:p["fields"][1].update(canonical_key=p["fields"][0]["canonical_key"]),
            lambda r,p:p.update(source_url="https://user:password@manufacturer.example/"),
            lambda r,p:p.update(source_url="http://manufacturer.example/"),
        ):
            r,p=fixture()
            mutate(r,p)
            with self.assertRaises(ValueError):
                mod.build_packet(r,p)

    def test_sql_payload_is_data_and_not_executable_syntax(self):
        r,p=fixture()
        r["table_review"]["candidate_cells"][0]["source_value"]="'); DROP TABLE public.tractors; --"
        sql=mod.sql_packet(mod.build_packet(r,p))
        self.assertNotIn("DROP TABLE",sql)
        self.assertIn("decode(",sql)
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/"private.sql"
            mod.write_private_sql(out,sql)
            self.assertEqual(stat.S_IMODE(out.stat().st_mode),0o600)
            with self.assertRaises(FileExistsError):
                mod.write_private_sql(out,sql)
            with self.assertRaises(ValueError):
                mod.write_private_sql(Path(__file__).parent/"must-not-exist.sql",sql)

@unittest.skipUnless(os.environ.get("TRACTORVS_PACKET_POSTGRES_TEST")=="1",
                     "isolated PostgreSQL integration test enabled in CI")
class SqlTransactionTests(unittest.TestCase):
    def test_disposable_database_transaction_guards(self):
        # A new ephemeral Unix-socket-only cluster, never the project's
        # Supabase database. Do not inherit PGHOST/PASSWORD or credentials.
        env={"PATH":os.defpath,"LC_ALL":"C.UTF-8"}
        bindir=Path(subprocess.check_output(["pg_config","--bindir"],env=env,text=True).strip())
        with tempfile.TemporaryDirectory(prefix="tractor-packet-pg-") as tmp:
            root=Path(tmp)
            data=root/"cluster"
            def run(name,*args,**kwargs):
                return subprocess.run([str(bindir/name),*args],env=env,text=True,
                                      capture_output=True,timeout=40,**kwargs)
            run("initdb","-D",str(data),"-A","trust","--no-locale","-E","UTF8",check=True)
            run("pg_ctl","-D",str(data),"-l",str(root/"postgres.log"),
                "-o",f"-h '' -k {root}","-w","start",check=True)
            try:
                def sql(query,ok=True):
                    p=run("psql","-X","-h",str(root),"-d","postgres","-v","ON_ERROR_STOP=1",
                          "-At","-c",query)
                    self.assertEqual(p.returncode==0,ok,p.stderr)
                    return p.stdout.strip()
                sql("""
                CREATE ROLE anon; CREATE ROLE authenticated;
                CREATE TABLE public.brands(id integer primary key,name text);
                CREATE TABLE public.tractors(id uuid primary key,brand_id integer references public.brands,
                  status text,model_name text,market text,variant text,model_year integer);
                CREATE TABLE public.data_sources(id integer primary key,source_url text,publisher text);
                CREATE TABLE public.tractor_specs(tractor_id uuid references public.tractors,source_id integer references public.data_sources);
                CREATE TABLE public.tractorvs_spec_review_candidates(
                   tractor_id uuid references public.tractors,canonical_key text,spec_name text,spec_value text,
                   unit text,comparison_class text,measurement_standard text,source_url text,source_publisher text,
                   source_tier text,evidence_text text,observed_at date,review_status text,review_note text,
                   UNIQUE(tractor_id,canonical_key,spec_value,source_url));
                ALTER TABLE public.tractorvs_spec_review_candidates ENABLE ROW LEVEL SECURITY;
                INSERT INTO public.brands VALUES (1,'Synthetic');
                INSERT INTO public.tractors VALUES
                  ('00000000-0000-4000-8000-000000000001',1,'draft','TEST-A','Test',NULL,NULL),
                  ('00000000-0000-4000-8000-000000000002',1,'draft','TEST-B','Test',NULL,NULL);
                INSERT INTO public.data_sources VALUES(1,'https://manufacturer.example/catalog.pdf','Synthetic');
                INSERT INTO public.tractor_specs SELECT id,1 FROM public.tractors;
                """)
                r,p=fixture()
                rows=mod.build_packet(r,p)
                count="SELECT count(*) FROM public.tractorvs_spec_review_candidates"
                sql(mod.sql_packet(rows))
                self.assertEqual(sql(count),"0")
                sql(mod.sql_packet(rows,True))
                self.assertEqual(sql(count+" WHERE review_status='needs_review'"),"4")
                sql(mod.sql_packet(rows,True))
                self.assertEqual(sql(count),"4")
                # A new candidate is inserted before the conflicting existing
                # scope is detected; the whole failed transaction must roll back.
                altered=copy.deepcopy(rows)
                altered[0]["unit"]="hp"
                altered[1]["spec_value"]="999"
                sql(mod.sql_packet(altered,True),False)
                self.assertEqual(sql(count),"4")
                sql("UPDATE public.tractors SET status='published' WHERE model_name='TEST-B'")
                sql(mod.sql_packet(rows,True),False)
                sql("UPDATE public.tractors SET status='draft' WHERE model_name='TEST-B'")
                sql("GRANT SELECT ON public.tractorvs_spec_review_candidates TO anon")
                sql(mod.sql_packet(rows,True),False)
                self.assertEqual(sql(count),"4")
                sql("REVOKE SELECT ON public.tractorvs_spec_review_candidates FROM anon")
                sql("DELETE FROM public.tractor_specs WHERE tractor_id='00000000-0000-4000-8000-000000000002'")
                sql(mod.sql_packet(rows,True),False)
                self.assertEqual(sql(count),"4")
            finally:
                run("pg_ctl","-D",str(data),"-m","immediate","-w","stop",check=True)

if __name__=="__main__":
    unittest.main()
