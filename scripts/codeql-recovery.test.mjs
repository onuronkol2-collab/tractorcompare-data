import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryDecision } from './codeql-recovery.mjs';
const languages = ['actions','javascript-typescript','python'];
const checks = conclusion => languages.map(l => ({ name: `Analyze (${l})`, status: 'completed', conclusion }));
const logs = Object.fromEntries(languages.map(l => [l, 'Exported results to SARIF\nUploading code scanning results\nUploading results\nPost job cleanup']));
test('shared upload failure blocks repeat attempts without recovery evidence', () => {
  const d = recoveryDecision({ checks: checks('failure'), logs });
  assert.equal(d.next, 'HOLD_AND_ESCALATE');
  assert.equal(d.allowedToMerge, false);
  assert.ok(d.states.every(s => s.state === 'UPLOAD_FAILURE'));
});
test('one coordinated retry only after recovery and never after repeat', () => {
  assert.equal(recoveryDecision({ checks: checks('failure'), logs, peerRecoveryVerified: true }).next, 'ONE_COORDINATED_RETRY');
  assert.equal(recoveryDecision({ checks: checks('failure'), logs, peerRecoveryVerified: true, sameIncidentRetries: 1 }).next, 'HOLD_AND_ESCALATE');
});
test('401/403 requires configuration review; 429 requires cooldown', () => {
  assert.equal(recoveryDecision({ checks: checks('failure'), logs: { ...logs, actions: '##[error] HTTP 403' } }).next, 'OWNER_CONFIGURATION_REVIEW');
  assert.equal(recoveryDecision({ checks: checks('failure'), logs: { ...logs, python: '##[error] HTTP 429' }, peerRecoveryVerified: true }).next, 'RESPECT_COOLDOWN');
});
test('missing or pending check is not success', () => {
  assert.equal(recoveryDecision({ checks: checks('success').slice(0,2) }).next, 'OBSERVE_CURRENT_RUN');
  assert.equal(recoveryDecision({ checks: checks('success').slice(0,2) }).allCodeqlPassed, false);
});
test('a green CodeQL report never authorizes merge by itself', () => {
  const d = recoveryDecision({ checks: checks('success') });
  assert.equal(d.allCodeqlPassed, true);
  assert.equal(d.next, 'CHECK_OTHER_REQUIRED_GATES');
  assert.equal(d.allowedToMerge, false);
});
test('warning/query name and unreported failures are not an HTTP error', () => {
  assert.equal(recoveryDecision({ checks: checks('failure'), logs: { ...logs, actions: 'Interpreted problem query "Missing rate limiting" (429)' } }).next, 'INVESTIGATE');
});
test('cancelled and skipped checks fail closed', () => {
  assert.equal(recoveryDecision({ checks: checks('cancelled'), logs }).next, 'INVESTIGATE');
  assert.equal(recoveryDecision({ checks: checks('skipped'), logs }).allCodeqlPassed, false);
});
