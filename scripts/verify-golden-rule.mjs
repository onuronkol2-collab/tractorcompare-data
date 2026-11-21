#!/usr/bin/env node
// TractorVS agent-policy guard. This validates a small number of stable,
// non-secret repository invariants; it cannot measure actual AI compliance.
import { readFileSync } from "node:fs";

const checks = new Map([
  ["AGENTS.md", [
    "ALTIN KURAL", "TAM ENTEGRASYON", "GitHub", "Supabase",
    "Firecrawl", "Microsoft Clarity", "PostHog", "OpenSEO",
    "Google Drive", "Playwright", "axe-core", "CodeQL", "Dependabot",
    "Cloudflare Web Analytics", "Malware alerts", "Secret Protection", "Push protection",
    "Enable with JS Snippet installation", "Süreklilik ve dürüst sınır",
  ]],
  ["README.md", ["AGENTS.md"]],
  [".github/copilot-instructions.md", ["AGENTS.md", "Altın Entegrasyon Kuralı"]],
  ["CLAUDE.md", ["AGENTS.md", "ALTIN KURAL"]],
  ["GEMINI.md", ["AGENTS.md", "Altın Entegrasyon Kuralı"]],
  [".cursor/rules/tractorvs-golden-rule.mdc", [
    "alwaysApply: true", "AGENTS.md", "ALTIN KURAL",
  ]],
  [".github/pull_request_template.md", ["AGENTS.md", "RLS", "SEO"]],
  ["docs/CHATGPT_PROJECT_INSTRUCTIONS.md", [
    "AGENTS.md", "Proje Talimatları", "maksimum kalite",
    "Playwright", "axe-core", "CodeQL", "Dependabot", "Cloudflare Web Analytics",
  ]],
]);

const problems = [];
for (const [path, required] of checks) {
  let text;
  try {
    text = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  } catch {
    problems.push(`missing/unreadable: ${path}`);
    continue;
  }
  for (const phrase of required) {
    if (!text.includes(phrase)) problems.push(`missing in ${path}: ${phrase}`);
  }
}
if (problems.length) {
  console.error("TractorVS golden-rule integrity check FAILED:");
  for (const issue of problems) console.error("- " + issue);
  process.exitCode = 1;
} else {
  console.log("TractorVS golden-rule policy and agent adapters: verified (8 files).");
  console.log("Note: this verifies repository artifacts, not AI memory or compliance.");
}
