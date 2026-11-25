#!/usr/bin/env node
// TractorVS agent-policy guard. This validates a small number of stable,
// non-secret repository invariants; it cannot measure actual AI compliance.
import { readFileSync } from "node:fs";

const checks = new Map([
  ["AGENTS.md", [
    "ALTIN KURAL", "TAM ENTEGRASYON", "GitHub", "Supabase",
    "### Katalog verisini toplu doğrulama ve canlıya aktarma",
    "Kanıta dayalı otomatik katalog yayın kontrolü", "automated_evidence_review",
    "(supabase/docs/tractor-automated-nominal-release-20261125.md)",
    "### Ücretsiz araçlardan maksimum fayda", "ChatGPT’nin daha iyi yaptığı",
    "Yalnızca ücretsiz sürümleri", "kullanıcıya bağlantı isteği gönder",
    "Firecrawl", "Microsoft Clarity", "PostHog", "OpenSEO",
    "Google Drive", "Playwright", "axe-core", "CodeQL", "Dependabot",
    "Cloudflare Web Analytics", "Malware alerts", "Secret Protection", "Push protection",
    "Enable with JS Snippet installation", "Süreklilik ve dürüst sınır",
    "(site/docs/GEO_AI_SEARCH_QUALITY_TR.md)", "(site/docs/seo-launch-gate.md)",
    "(site/docs/GEO_AI_SEARCH_QUALITY_TR.md#arama-sonucu)",
    "Kalıcı QA yürütme kanıtı", "TRACTORVS_RESEARCH_QA_EVIDENCE",
    "(site/docs/research-qa-execution-evidence-20261124.md)",
    "### Maksimum Geliştirme Hızı", "(site/docs/maximum-quality-throughput-20261125.md)", "Üretim skip/flaky/eksik/iptal",
  ]],
  ["site/docs/GEO_AI_SEARCH_QUALITY_TR.md", ["(../../AGENTS.md#seo-ve-geo)", "(seo-launch-gate.md)", "## Arama sonucu\n"]],
  ["site/docs/seo-launch-gate.md", ["PUBLIC_INDEXING_ENABLED", "SITE_URL"]],
  ["site/docs/research-qa-execution-evidence-20261124.md", ["45341843641", "TRACTORVS_RESEARCH_QA_EVIDENCE", "predeployment", "skipped"]],
  ["site/scripts/verify-research-qa-report.mjs", ["verifyResearchReport", "stats.skipped !== 0", "stats.flaky !== 0"]],
  [".github/workflows/tractorvs-nonforum-research-qa.yml", ["Test execution evidence gate (offline)", "Require actual passing evidence for every language and browser", "site/playwright-research-evidence.json"]],
  ["README.md", ["AGENTS.md"]],
  [".github/copilot-instructions.md", ["AGENTS.md", "Altın Entegrasyon Kuralı"]],
  ["CLAUDE.md", ["AGENTS.md", "ALTIN KURAL"]],
  ["GEMINI.md", ["AGENTS.md", "Altın Entegrasyon Kuralı"]],
  [".cursor/rules/tractorvs-golden-rule.mdc", [
    "alwaysApply: true", "AGENTS.md", "ALTIN KURAL",
  ]],
  ["site/docs/maximum-quality-throughput-20261125.md", ["692fe414", "DEPLOYMENT_PENDING", "max-parallel: 2", "Geri alma"]],
  [".github/pull_request_template.md", ["AGENTS.md#seo-ve-geo", "RLS", "SEO", "Maksimum Geliştirme Hızı"]],
  ["docs/CHATGPT_PROJECT_INSTRUCTIONS.md", [
    "AGENTS.md", "Proje Talimatları", "maksimum kalite",
    "Yalnızca ücretsiz sürümleri", "kullanıcıya bağlantı isteği gönder",
    "Playwright", "axe-core", "CodeQL", "Dependabot", "Cloudflare Web Analytics", "Maksimum Geliştirme Hızı",
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
  if (path === "AGENTS.md") {
    const section = text.split(/^#{1,3} /m).find(part => /^SEO ve GEO\r?\n/.test(part));
    const order = Array.from((section ?? "").matchAll(/^(\d+)\.\s+\S/gm), item => item[1]);
    if (order.join(",") !== "1,2,3,4,5,6,7,8,9,10") {
      problems.push("AGENTS.md#seo-ve-geo must contain the ten project priorities in order");
    }
  }
}
if (problems.length) {
  console.error("TractorVS golden-rule integrity check FAILED:");
  for (const issue of problems) console.error("- " + issue);
  process.exitCode = 1;
} else {
  console.log(`TractorVS golden-rule policy and agent adapters: verified (${checks.size} files).`);
  console.log("Note: this verifies repository artifacts, not AI memory or compliance.");
}
