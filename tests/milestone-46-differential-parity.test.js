import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DIFFERENTIAL_ACTIVITY_CONTRACTS,
  DIFFERENTIAL_MANUAL_GATES,
  DIFFERENTIAL_SHARED_DOMAINS,
  getDifferentialParityCertification,
} from "../src/data/differentialParityAudit.js";
import { runDifferentialParityAudit } from "../scripts/parity-audit-lib.mjs";

const root = new URL("../", import.meta.url);

test("pins the complete protected-source inventory used by the Milestone 46 audit", async () => {
  const audit = await runDifferentialParityAudit();
  assert.equal(audit.source.sha256, "0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5");
  assert.equal(audit.source.bytes, 17_324_288);
  assert.equal(audit.source.lines, 13_382);
  assert.deepEqual(audit.inventory, {
    namedFunctionOccurrences: 1716,
    uniqueNamedFunctions: 1704,
    validators: 80,
    getters: 161,
    configConstants: 65,
    publicApiKeys: 218,
    unmappedApiKeys: [],
  });
});

test("maps all 13 activities, 5,850 levels and every protected public API entry to an owner", async () => {
  const audit = await runDifferentialParityAudit();
  assert.equal(audit.ok, true, audit.issues.join("\n"));
  assert.deepEqual(audit.issues, []);
  assert.deepEqual(audit.coverage, {
    activities: 13,
    campaignLevels: 5850,
    sharedDomains: 19,
    ruleProbes: 12,
    scalarRulesCompared: 85,
    ownershipChecks: 192,
  });
  assert.equal(Object.keys(audit.apiDomains).length, 218);
  assert.ok(Object.values(audit.apiDomains).every(Boolean));
  assert.ok(audit.ownership.every(({ exists }) => exists));
});

test("compares all 85 protected scalar rules exactly against the Phaser modules", async () => {
  const audit = await runDifferentialParityAudit();
  assert.equal(audit.ruleProbes.length, 12);
  for (const probe of audit.ruleProbes) {
    assert.equal(probe.ok, true, `${probe.sourceConstant} must match ${probe.exportName}`);
    for (const [property, values] of Object.entries(probe.values)) assert.equal(values.equal, true, `${probe.sourceConstant}.${property}`);
  }
});

test("publishes a deterministic and honest differential certification", () => {
  const first = getDifferentialParityCertification();
  const second = getDifferentialParityCertification();
  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.equal(first.source.readOnly, true);
  assert.deepEqual(first.scope, { activities: 13, campaignLevels: 5850, sharedDomains: 19, exactRuleProbes: 12 });
  assert.equal(DIFFERENTIAL_ACTIVITY_CONTRACTS.length, 13);
  assert.equal(DIFFERENTIAL_SHARED_DOMAINS.length, 19);
  assert.equal(DIFFERENTIAL_MANUAL_GATES.length, 4);
  assert.match(first.claim, /Behavioral, content, progression and save parity/);
  assert.match(first.manualGates.join(" "), /Sprite AI/);
});

test("provides a read-only in-game differential-parity QA route", async () => {
  const main = await readFile(new URL("src/main.js", root), "utf8");
  assert.match(main, /qaMode === "differential-parity"/);
  assert.match(main, /dataset\.differentialParityReady/);
  assert.match(main, /dataset\.differentialParityActivities/);
  assert.match(main, /dataset\.differentialParitySharedDomains/);
  assert.match(main, /dataset\.differentialParityRuleProbes/);
  assert.match(main, /\["parity", "differential-parity", "release-candidate", "fidelity"\]\.includes\(qaMode\)/);
  const qaBlock = main.match(/if \(import\.meta\.env\.DEV && qaMode === "differential-parity"\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.doesNotMatch(qaBlock, /save|update|create|grant|processLogin/i);
});
