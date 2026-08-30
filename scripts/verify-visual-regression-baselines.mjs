import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import {
  VISUAL_CAPTURE_CASES,
  validateVisualComparisonContracts,
} from "../src/qa/visualComparisonContracts.js";
import {
  SUPPORTED_VISUAL_BASELINE_PLATFORMS,
  baselineIdentity,
} from "./lib/visual-comparison.mjs";

const root = new URL("../", import.meta.url);
const manifestUrl = new URL("docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json", root);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const requiredFamilies = new Set(["world", "interior", "shop", "restaurant", "cleanup", "special-renderer"]);
const requiredProfiles = new Set(["narrow-phone", "modern-phone", "tablet-4x3", "reference", "desktop"]);
const failures = [];

async function sourceFiles(input) {
  const url = new URL(input, root);
  const details = await stat(url);
  if (details.isFile()) return [input];
  const entries = await readdir(url, { withFileTypes: true });
  const nested = [];
  for (const entry of entries) {
    const child = `${input}/${entry.name}`;
    if (entry.isDirectory()) nested.push(...await sourceFiles(child));
    else if (/\.(?:js|css|html|json)$/.test(entry.name)) nested.push(child);
  }
  return nested;
}

const fingerprintHash = createHash("sha256");
const fingerprintFiles = [];
for (const input of manifest.sourceRoots || []) fingerprintFiles.push(...await sourceFiles(input));
for (const input of [...new Set(fingerprintFiles)].sort()) {
  fingerprintHash.update(input);
  fingerprintHash.update("\0");
  fingerprintHash.update(await readFile(new URL(input, root)));
  fingerprintHash.update("\0");
}
const sourceFingerprint = fingerprintHash.digest("hex");
if (process.argv.includes("--print-source-fingerprint")) {
  console.log(sourceFingerprint);
  process.exit(0);
}
const sourceFingerprintChanged = sourceFingerprint !== manifest.sourceFingerprint;
const contractValidation = validateVisualComparisonContracts();
if (!contractValidation.ok) failures.push(...contractValidation.errors);
if (manifest.version < 3 || manifest.captureContractVersion !== 2) failures.push("Baseline manifest does not use manifest version 3 and capture contract version 2.");
if (!manifest.approvalPolicy || !manifest.approvedBatch?.reviewer) failures.push("Baseline approval provenance or policy is missing.");
if (JSON.stringify(manifest.supportedPlatforms) !== JSON.stringify(SUPPORTED_VISUAL_BASELINE_PLATFORMS)) {
  failures.push(`Baseline manifest supportedPlatforms must be ${SUPPORTED_VISUAL_BASELINE_PLATFORMS.join(", ")}.`);
}

function imageDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature === "89504e470d0a1a0a") return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

const seenFiles = new Set();
const seenFamilies = new Set();
const seenProfiles = new Set();
const seenBaselineIdentities = new Set();
const coverageByPlatform = new Map(SUPPORTED_VISUAL_BASELINE_PLATFORMS.map((platform) => [platform, new Set()]));
for (const baseline of manifest.baselines || []) {
  if (seenFiles.has(baseline.file)) failures.push(`Duplicate baseline file: ${baseline.file}`);
  seenFiles.add(baseline.file);
  seenFamilies.add(baseline.family);
  seenProfiles.add(baseline.profile);
  if (!baseline.captureId) failures.push(`${baseline.file} has no capture contract association.`);
  if (!SUPPORTED_VISUAL_BASELINE_PLATFORMS.includes(baseline.platform)) failures.push(`${baseline.file} has unsupported platform ${baseline.platform || "(missing)"}.`);
  const identity = baselineIdentity(baseline);
  if (seenBaselineIdentities.has(identity)) failures.push(`Duplicate capture contract/platform association: ${identity}`);
  seenBaselineIdentities.add(identity);
  coverageByPlatform.get(baseline.platform)?.add(baseline.captureId);
  const captureCase = VISUAL_CAPTURE_CASES.find(({ id }) => id === baseline.captureId);
  if (!captureCase) failures.push(`${baseline.file} references unknown capture contract ${baseline.captureId}.`);
  else if (captureCase.scene !== baseline.scene || captureCase.profile !== baseline.profile || captureCase.viewport.width !== baseline.width || captureCase.viewport.height !== baseline.height) {
    failures.push(`${baseline.file} does not match capture contract ${baseline.captureId}.`);
  }
  if (baseline.overflow !== false) failures.push(`${baseline.file} was captured with page overflow.`);
  try {
    const buffer = await readFile(new URL(`docs/qa/visual-readiness/phase-01/${baseline.file}`, root));
    const hash = createHash("sha256").update(buffer).digest("hex");
    const dimensions = imageDimensions(buffer);
    if (hash !== baseline.sha256) failures.push(`${baseline.file} checksum changed.`);
    if (!dimensions || dimensions.width !== baseline.width || dimensions.height !== baseline.height) {
      failures.push(`${baseline.file} dimensions changed; expected ${baseline.width}x${baseline.height}.`);
    }
  } catch (error) {
    failures.push(`${baseline.file} could not be read: ${error.message}`);
  }
}

for (const family of requiredFamilies) if (!seenFamilies.has(family)) failures.push(`Missing scene-family baseline: ${family}`);
for (const profile of requiredProfiles) if (!seenProfiles.has(profile)) failures.push(`Missing viewport baseline: ${profile}`);
for (const platform of SUPPORTED_VISUAL_BASELINE_PLATFORMS) {
  const platformCoverage = coverageByPlatform.get(platform);
  for (const captureCase of VISUAL_CAPTURE_CASES) {
    if (!platformCoverage.has(captureCase.id)) failures.push(`Missing approved ${platform} baseline for ${captureCase.id}.`);
  }
}

if (failures.length) {
  console.error(`Visual regression baseline check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Visual regression baseline contracts verified: ${seenFiles.size} immutable images across ${SUPPORTED_VISUAL_BASELINE_PLATFORMS.length} platforms, ${seenFamilies.size} scene families, ${seenProfiles.size} landscape profiles.`);
  if (sourceFingerprintChanged) console.log(`Visual source fingerprint changed (${sourceFingerprint}); live visual:compare is required and is the authoritative regression gate.`);
}
