import { runMinigameParityAudit } from "./minigame-parity-lib.mjs";

const report = await runMinigameParityAudit();
console.log(`Minigame parity: ${report.ok ? "PASS" : "FAIL"}`);
console.log(`Protected source: ${report.source} (${report.sourceSha256})`);
console.log(`Games checked: ${report.games.length}; comparisons: ${report.checks.length}; level instances: ${report.comparedLevelInstances}`);
for (const check of report.checks) console.log(`${check.ok ? "PASS" : "FAIL"} ${check.game} / ${check.subject} (${check.count})`);
if (!report.ok) {
  for (const failure of report.failures) console.error(JSON.stringify(failure));
  process.exitCode = 1;
}

