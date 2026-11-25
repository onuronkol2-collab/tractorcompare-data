// Offline diagnostic policy: never authorizes merging or calls GitHub APIs.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function classifyCodeql(checks = [], logs = {}) {
  const required = ['actions', 'javascript-typescript', 'python'];
  const states = required.map(language => {
    const c = checks.find(x => x.name === `Analyze (${language})`);
    if (!c || c.status !== 'completed') return { language, state: 'PENDING_OR_MISSING' };
    if (c.conclusion === 'success') return { language, state: 'PASS' };
    const log = String(logs[language] ?? '');
    const exported = /Exported results to SARIF/i.test(log);
    const upload = /Uploading code scanning results|Uploading results/i.test(log);
    const actualErrors = log.split(/\r?\n/).filter(l => /##\[error\]|\bHttpError:|\bHTTP\s+[45]\d\d\b|\bstatus(?: code)?[=: ]+\s*[45]\d\d\b/i.test(l)).join('\n');
    let state = 'UNRESOLVED_FAILURE';
    if (c.conclusion !== 'failure') state = 'NON_SUCCESS';
    else if (/\b(401|403)\b|default setup is enabled|Code Security.*(?:must be enabled|disabled)/i.test(actualErrors)) state = 'CONFIGURATION_REVIEW';
    else if (/\b429\b/i.test(actualErrors)) state = 'RATE_LIMIT';
    else if (exported && upload) state = 'UPLOAD_FAILURE';
    else if (actualErrors) state = 'ANALYSIS_FAILURE';
    return { language, state };
  });
  return states;
}
export function recoveryDecision({ checks = [], logs = {}, sameIncidentRetries = 0, peerRecoveryVerified = false, configurationCorrected = false } = {}) {
  const states = classifyCodeql(checks, logs);
  const classes = states.map(x => x.state);
  const allPassed = classes.every(x => x === 'PASS');
  let next = 'INVESTIGATE';
  if (allPassed) next = 'CHECK_OTHER_REQUIRED_GATES';
  else if (classes.includes('PENDING_OR_MISSING')) next = 'OBSERVE_CURRENT_RUN';
  else if (classes.includes('RATE_LIMIT')) next = 'RESPECT_COOLDOWN';
  else if (classes.includes('CONFIGURATION_REVIEW') && !configurationCorrected) next = 'OWNER_CONFIGURATION_REVIEW';
  else if (classes.includes('ANALYSIS_FAILURE') || classes.includes('NON_SUCCESS') || classes.includes('UNRESOLVED_FAILURE')) next = 'INVESTIGATE';
  else if (classes.includes('UPLOAD_FAILURE') || classes.includes('CONFIGURATION_REVIEW')) {
    next = (peerRecoveryVerified || configurationCorrected) && sameIncidentRetries === 0 ? 'ONE_COORDINATED_RETRY' : 'HOLD_AND_ESCALATE';
  }
  return { states, next, allCodeqlPassed: allPassed, allowedToMerge: false };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(recoveryDecision(JSON.parse(readFileSync(process.argv[2], 'utf8'))), null, 2)); }
  catch (e) { console.error('Invalid diagnostic input:', e.message); process.exitCode = 1; }
}
