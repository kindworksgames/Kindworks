import { runDifferentialParityAudit } from "./parity-audit-lib.mjs";

const audit = await runDifferentialParityAudit();

if (!audit.ok) {
  console.error("Milestone 46 differential parity audit failed:");
  for (const issue of audit.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log("Milestone 46 differential parity audit passed.");
  console.log(`Protected HTML: ${audit.source.sha256}`);
  console.log(`Legacy source inventory: ${audit.inventory.uniqueNamedFunctions} named functions, ${audit.inventory.publicApiKeys} public API entries, ${audit.inventory.validators} validators.`);
  console.log(`Coverage: ${audit.coverage.activities} activities / ${audit.coverage.campaignLevels} levels / ${audit.coverage.sharedDomains} shared domains.`);
  console.log(`Exact rules compared: ${audit.coverage.scalarRulesCompared} across ${audit.coverage.ruleProbes} source constants.`);
}
