"""Draft regression cases. Run only during TEST."""
import importlib.util, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('policy',Path(__file__).parents[1]/'scripts/photo-private-archive-policy.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class PolicyDraftTests(unittest.TestCase):
    def test_requires_exact_uuid(self):
        for v in ('','abc',"a' OR true--",None,'12345678-1234-1234-1234-123456789abC'):
            with self.assertRaises(ValueError):m.policy_sql(v)
    def test_no_update_or_delete_grant(self):
        sql=m.policy_sql('12345678-1234-1234-1234-123456789abc')
        self.assertEqual(sql.count('AS PERMISSIVE'),2)
        self.assertEqual(sql.count('AS RESTRICTIVE'),4)
        self.assertIn("FOR UPDATE TO anon, authenticated USING (bucket_id <> 'tc-tractor-photo-private')",sql)
        self.assertIn("FOR DELETE TO anon, authenticated USING (bucket_id <> 'tc-tractor-photo-private')",sql)
    def test_identity_and_path_boundaries(self):
        sql=m.policy_sql('12345678-1234-1234-1234-123456789abc')
        self.assertIn("(select auth.uid()) = '12345678-1234-1234-1234-123456789abc'::uuid",sql)
        self.assertIn("is_anonymous",sql)
        self.assertIn('originals/[0-9a-f]{64}',sql)
        self.assertIn('manifests/[0-9a-f]{64}',sql)
        self.assertNotIn('user_metadata',sql)
        self.assertNotIn('service_role',sql)
        self.assertNotIn('DROP POLICY',sql)

if __name__=='__main__':unittest.main()
