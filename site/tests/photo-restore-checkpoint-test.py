import json,os,shutil,subprocess,tempfile,unittest
from pathlib import Path
S=Path(__file__).resolve().parents[1]/'scripts'
class RestoreTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.cwd=self.root/'runner';self.cwd.mkdir();(self.cwd/'site/scripts').mkdir(parents=True)
        shutil.copy(S/'photo-research-checkpoint.py',self.cwd/'site/scripts');self.artifact=self.root/'artifact';self.artifact.mkdir()
        for n,d in {'commons-budget.json':{'version':1,'provider':'commons','requests':[],'cooldownUntil':0},'commons-collector.json':{'version':1,'cooldownUntil':0,'files':{}},'independent-state.json':{'version':1,'jobs':[],'cooldowns':[]}}.items():(self.artifact/n).write_text(json.dumps(d))
        subprocess.run(['python',str(S/'photo-research-checkpoint.py'),'seal',str(self.artifact),'123'],check=True)
        bin=self.root/'bin';bin.mkdir();gh=bin/'gh';gh.write_text('''#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == api && "$2" == *'/runs?'* ]]; then printf '%s' "$MOCK_PREVIOUS";
elif [[ "$1" == api && "$2" == *'/runs/'*'/artifacts?'* ]]; then printf '%s' "$MOCK_COUNT";
elif [[ "$1" == api && "$2" == *'/actions/artifacts?'* ]]; then printf '%s' "$MOCK_OLDER";
elif [[ "$1 $2 $3" == 'run download 123' ]]; then cp "$MOCK_ARTIFACT"/* research-state/;
else exit 98;fi
''');gh.chmod(0o755)
        self.env={**os.environ,'PATH':str(bin)+':'+os.environ['PATH'],'GITHUB_REF':'refs/heads/main','GITHUB_RUN_ATTEMPT':'1','GITHUB_REPOSITORY':'owner/repo','GITHUB_EVENT_NAME':'workflow_dispatch','BOOTSTRAP':'false','MOCK_PREVIOUS':'123','MOCK_COUNT':'1','MOCK_OLDER':'0','MOCK_ARTIFACT':str(self.artifact)}
    def tearDown(self):self.tmp.cleanup()
    def run_restore(self,**kw):return subprocess.run(['bash',str(S/'photo-restore-research-state.sh')],cwd=self.cwd,env={**self.env,**kw},capture_output=True,text=True)
    def test_verified_latest_restores(self):self.assertEqual(self.run_restore().returncode,0);self.assertTrue((self.cwd/'research-state/checkpoint.json').is_file())
    def test_first_bootstrap_is_paused(self):
        r=self.run_restore(BOOTSTRAP='true',MOCK_COUNT='0');self.assertEqual(r.returncode,0,r.stderr);x=json.loads((self.cwd/'research-state/commons-budget.json').read_text());self.assertGreater(x['cooldownUntil'],0);self.assertEqual(x['requests'],[])
    def test_bootstrap_cannot_replace_existing_checkpoint(self):self.assertNotEqual(self.run_restore(BOOTSTRAP='true').returncode,0)
    def test_no_implicit_reset(self):self.assertNotEqual(self.run_restore(MOCK_COUNT='0').returncode,0)
    def test_older_artifact_blocks_bootstrap(self):self.assertNotEqual(self.run_restore(MOCK_COUNT='0',MOCK_OLDER='1',BOOTSTRAP='true').returncode,0)
    def test_no_predecessor_but_older_archive_blocks_bootstrap(self):self.assertNotEqual(self.run_restore(MOCK_PREVIOUS='',MOCK_OLDER='1',BOOTSTRAP='true').returncode,0)
    def test_rerun_blocked(self):self.assertNotEqual(self.run_restore(GITHUB_RUN_ATTEMPT='2').returncode,0)
    def test_pr_branch_blocked(self):self.assertNotEqual(self.run_restore(GITHUB_REF='refs/pull/1/merge').returncode,0)
    def test_corrupt_archive_blocked(self):(self.artifact/'commons-budget.json').write_text('{"version":1,"new":true}');self.assertNotEqual(self.run_restore().returncode,0)
if __name__=='__main__':unittest.main()
