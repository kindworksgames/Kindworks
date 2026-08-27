import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import {
  DIFFERENTIAL_ACTIVITY_CONTRACTS,
  DIFFERENTIAL_RULE_PROBES,
  DIFFERENTIAL_SHARED_DOMAINS,
  legacyApiDomain,
} from "../src/data/differentialParityAudit.js";
import { PARITY_SOURCE_SHA256 } from "../src/data/parityCertification.js";

const thisDirectory = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(thisDirectory, "..");
export const protectedSourcePath = resolve(projectRoot, "kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html");

const apiArrayNames = Object.freeze([
  "KINDWORKS_PRODUCTION_API_KEYS",
  "KINDWORKS_PHASE56_API_KEYS",
  "KINDWORKS_PHASE78_API_KEYS",
  "KINDWORKS_OBJECT_FARMING_API_KEYS",
  "KINDWORKS_NARRATIVE_API_KEYS",
  "KINDWORKS_GARBAGE_API_KEYS",
  "KINDWORKS_PLAYGROUND_API_KEYS",
  "KINDWORKS_WEATHER_API_KEYS",
  "KINDWORKS_HARBOUR_API_KEYS",
  "KINDWORKS_PET_SHOP_API_KEYS",
]);

const lateApiKeys = Object.freeze([
  "getMorningMugState", "openMorningMug", "closeMorningMug", "startMugLevel", "validateMorningMug",
  "getRiversideKitchenState", "openRiversideKitchen", "closeRiversideKitchen", "startRiversideLevel", "validateRiversideKitchen",
  "validateHouseRescue", "validateHouseRescuePhase6", "getHouseRescuePhase6State", "openHouseRescue", "selectHouseRescueLevel", "qaSortHouseRescueItem",
]);

function extractJsonArray(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*Object\\.freeze\\((\\[[\\s\\S]*?\\])\\)\\s*;`));
  if (!match) throw new Error(`Protected source is missing ${name}.`);
  return JSON.parse(match[1]);
}

function uniqueMatches(source, pattern, group = 0) {
  return [...new Set([...source.matchAll(pattern)].map((match) => match[group]))].sort();
}

export function extractLegacySourceInventory(source) {
  const apiGroups = Object.fromEntries(apiArrayNames.map((name) => [name, extractJsonArray(source, name)]));
  const publicApiKeys = [...new Set([...Object.values(apiGroups).flat(), ...lateApiKeys])].sort();
  const namedFunctions = uniqueMatches(source, /\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)/g, 1);
  const validators = uniqueMatches(source, /\bvalidate[A-Za-z0-9_]*/g);
  const getters = uniqueMatches(source, /\bget[A-Z][A-Za-z0-9_]*/g);
  const configConstants = uniqueMatches(source, /\bconst\s+([A-Z][A-Z0-9_]+_(?:CONFIG|RULES|SPEC|SCHEMA_VERSION|BUILD_VERSION|VERSION))\b/g, 1);
  const apiDomains = Object.fromEntries(publicApiKeys.map((key) => [key, legacyApiDomain(key)]));
  return {
    sha256: createHash("sha256").update(source).digest("hex"),
    bytes: Buffer.byteLength(source),
    lines: source.split("\n").length,
    namedFunctionOccurrences: [...source.matchAll(/\bfunction\s+[A-Za-z_$][A-Za-z0-9_$]*/g)].length,
    namedFunctions,
    validators,
    getters,
    configConstants,
    apiGroups,
    publicApiKeys,
    apiDomains,
    unmappedApiKeys: publicApiKeys.filter((key) => !apiDomains[key]),
  };
}

function extractObjectFreezeBody(source, constantName) {
  const marker = new RegExp(`\\b(?:const|let)\\s+${constantName}\\s*=\\s*Object\\.freeze\\(`, "g");
  const match = marker.exec(source);
  if (!match) throw new Error(`Protected source is missing ${constantName}.`);
  const start = match.index + match[0].length;
  let depth = 1;
  let quote = null;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (["\"", "'", "`"].includes(character)) { quote = character; continue; }
    if (character === "(") depth += 1;
    else if (character === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index);
    }
  }
  throw new Error(`Protected source has an unterminated ${constantName}.`);
}

function scalarProperty(body, property) {
  const match = body.match(new RegExp(`(?:^|[,{])\\s*${property}\\s*:\\s*(true|false|-?(?:\\d+\\.?\\d*|\\.\\d+)|\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*')(?=\\s*[,}])`));
  if (!match) throw new Error(`Protected ${property} scalar was not found.`);
  const raw = match[1];
  if (raw === "true" || raw === "false") return raw === "true";
  if (raw.startsWith("\"") || raw.startsWith("'")) return raw.slice(1, -1);
  return Number(raw);
}

export async function compareRuleProbes(source) {
  const results = [];
  for (const probe of DIFFERENTIAL_RULE_PROBES) {
    const body = extractObjectFreezeBody(source, probe.sourceConstant);
    const module = await import(pathToFileURL(resolve(projectRoot, probe.modulePath)));
    const target = module[probe.exportName];
    if (!target) throw new Error(`${probe.modulePath} does not export ${probe.exportName}.`);
    const values = {};
    for (const property of probe.properties) {
      const legacy = scalarProperty(body, property);
      const phaser = target[property];
      values[property] = { legacy, phaser, equal: Object.is(legacy, phaser) };
    }
    results.push({
      sourceConstant: probe.sourceConstant,
      exportName: probe.exportName,
      modulePath: probe.modulePath,
      ok: Object.values(values).every(({ equal }) => equal),
      values,
    });
  }
  return results;
}

export async function auditOwnedFiles(source) {
  const checks = [];
  for (const activity of DIFFERENTIAL_ACTIVITY_CONTRACTS) {
    const files = [...Object.values(activity.owners), activity.testOwner];
    for (const file of files) {
      let exists = true;
      try { await access(resolve(projectRoot, file)); } catch { exists = false; }
      checks.push({ domain: activity.id, kind: "activity", file, exists });
    }
    checks.push({ domain: activity.id, kind: "source-anchor", marker: activity.sourceAnchor, exists: source.includes(activity.sourceAnchor) });
    const phaserEvidence = await Promise.all(files.map((file) => readFile(resolve(projectRoot, file), "utf8")));
    for (const marker of activity.sourceMarkers) {
      checks.push({ domain: activity.id, kind: "Phaser-marker", marker, exists: phaserEvidence.some((text) => text.includes(marker)) });
    }
  }
  for (const domain of DIFFERENTIAL_SHARED_DOMAINS) {
    for (const file of [...domain.owners, ...domain.tests]) {
      let exists = true;
      try { await access(resolve(projectRoot, file)); } catch { exists = false; }
      checks.push({ domain: domain.id, kind: "shared", file, exists });
    }
  }
  return checks;
}

export async function runDifferentialParityAudit() {
  const source = await readFile(protectedSourcePath, "utf8");
  const inventory = extractLegacySourceInventory(source);
  const ruleProbes = await compareRuleProbes(source);
  const ownership = await auditOwnedFiles(source);
  const issues = [];
  if (inventory.sha256 !== PARITY_SOURCE_SHA256) issues.push(`Protected source checksum changed: ${inventory.sha256}.`);
  if (inventory.unmappedApiKeys.length) issues.push(`Unmapped protected API keys: ${inventory.unmappedApiKeys.join(", ")}.`);
  for (const result of ruleProbes.filter(({ ok }) => !ok)) issues.push(`${result.sourceConstant} differs from ${result.exportName}.`);
  for (const check of ownership.filter(({ exists }) => !exists)) issues.push(`${check.domain} is missing ${check.file || check.marker}.`);
  return {
    ok: issues.length === 0,
    issues,
    source: { path: protectedSourcePath, sha256: inventory.sha256, bytes: inventory.bytes, lines: inventory.lines },
    inventory: {
      namedFunctionOccurrences: inventory.namedFunctionOccurrences,
      uniqueNamedFunctions: inventory.namedFunctions.length,
      validators: inventory.validators.length,
      getters: inventory.getters.length,
      configConstants: inventory.configConstants.length,
      publicApiKeys: inventory.publicApiKeys.length,
      unmappedApiKeys: inventory.unmappedApiKeys,
    },
    coverage: {
      activities: DIFFERENTIAL_ACTIVITY_CONTRACTS.length,
      campaignLevels: DIFFERENTIAL_ACTIVITY_CONTRACTS.reduce((sum, activity) => sum + activity.levels, 0),
      sharedDomains: DIFFERENTIAL_SHARED_DOMAINS.length,
      ruleProbes: ruleProbes.length,
      scalarRulesCompared: ruleProbes.reduce((sum, probe) => sum + Object.keys(probe.values).length, 0),
      ownershipChecks: ownership.length,
    },
    apiDomains: inventory.apiDomains,
    ruleProbes,
    ownership,
  };
}
