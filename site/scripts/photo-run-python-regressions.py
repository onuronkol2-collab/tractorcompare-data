"""Run hyphenated photo test modules, fail on zero discovered tests."""
import importlib.util
import pathlib
import sys
import unittest
root=pathlib.Path(__file__).resolve().parents[1]/'tests'
required = {
    'photo-checkpoint-test.py',
    'photo-commons-evidence-bridge-test.py',
    'photo-local-derivatives-test.py',
    'photo-model-ocr-test.py',
    'photo-original-acquisition-test.py',
    'photo-original-cache-safety-test.py',
    'photo-original-transport-retry-test.py',
    'photo-restore-checkpoint-test.py',
    'photo-shared-original-budget-test.py',
    'photo-public-artifact-guard-test.py',
    'photo-reviewed-batch-test.py',
}
paths = sorted(root.glob('photo-*-test.py'))
missing = required - {p.name for p in paths}
if missing:
    raise SystemExit('Missing required photo regression modules: ' + ', '.join(sorted(missing)))
suite=unittest.TestSuite()
for i,p in enumerate(paths):
    name=f'photo_regression_{i}'
    spec=importlib.util.spec_from_file_location(name,p)
    mod=importlib.util.module_from_spec(spec)
    sys.modules[name]=mod
    spec.loader.exec_module(mod)
    tests=unittest.defaultTestLoader.loadTestsFromModule(mod)
    if not tests.countTestCases(): raise SystemExit(f'No tests in {p.name}')
    suite.addTests(tests)
if not suite.countTestCases(): raise SystemExit('No photo regressions discovered')
result=unittest.TextTestRunner(verbosity=2).run(suite)
if result.skipped or result.expectedFailures or result.unexpectedSuccesses:
    print('Photo regression suite contains skipped or expected-failure cases', file=sys.stderr)
    raise SystemExit(1)
raise SystemExit(0 if result.wasSuccessful() else 1)
