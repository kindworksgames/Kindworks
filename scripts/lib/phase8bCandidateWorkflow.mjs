import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { inspectImageFile } from "./artworkPipelineValidation.mjs";

export const PHASE_8B_CANDIDATE_SCHEMA_VERSION = 1;
export const PHASE_8B_APPROVAL_FILE = "artwork/approvals/phase8b-approved-assets.v1.json";
export const PHASE_8B_LAYOUT_OVERRIDE_FILE = "artwork/candidates/scene-layout-overrides.v1.json";
export const PHASE_8B_REFERENCE_FILE = "artwork/candidates/reference-associations.v1.json";

const finding = (code, message, asset, expected, actual, path = asset?.expectedFilenames?.staging) => Object.freeze({
  severity: "error",
  code,
  message,
  assetId: asset?.semanticId || null,
  path: path || null,
  expected: expected ?? null,
  actual: actual ?? null,
  affectedScenes: Object.freeze([...(asset?.intendedScenes || [])]),
});

export const candidateApprovalToken = (sha256) => String(sha256 || "").slice(0, 12);

export async function readPhase8BApprovals(root) {
  try {
    const parsed = JSON.parse(await readFile(resolve(root, PHASE_8B_APPROVAL_FILE), "utf8"));
    return parsed?.schemaVersion === PHASE_8B_CANDIDATE_SCHEMA_VERSION && Array.isArray(parsed.assets)
      ? parsed
      : { schemaVersion: PHASE_8B_CANDIDATE_SCHEMA_VERSION, assets: [] };
  } catch {
    return { schemaVersion: PHASE_8B_CANDIDATE_SCHEMA_VERSION, assets: [] };
  }
}

async function readLayoutOverrides(root) {
  try {
    const parsed = JSON.parse(await readFile(resolve(root, PHASE_8B_LAYOUT_OVERRIDE_FILE), "utf8"));
    return parsed?.schemaVersion === 1 && parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {};
  } catch { return {}; }
}

async function readReferenceAssociations(root) {
  try {
    const parsed = JSON.parse(await readFile(resolve(root, PHASE_8B_REFERENCE_FILE), "utf8"));
    return parsed?.schemaVersion === 1 && parsed.references && typeof parsed.references === "object" ? parsed.references : {};
  } catch { return {}; }
}

export async function validatePhase8BCandidate(asset, root, { requireFile = true, approvals = null } = {}) {
  const errors = [];
  const relativeFile = asset?.expectedFilenames?.staging;
  const absoluteFile = relativeFile ? resolve(root, relativeFile) : null;
  if (!relativeFile || !absoluteFile) {
    errors.push(finding("missing-candidate-path", `${asset?.semanticId || "Candidate"} has no staging path.`, asset, "artwork/staging/...", relativeFile));
    return Object.freeze({ ok: false, errors: Object.freeze(errors), record: null });
  }
  try { await access(absoluteFile); }
  catch {
    if (requireFile) errors.push(finding("missing-candidate-file", `${asset.semanticId} has no staged candidate.`, asset, relativeFile, "missing"));
    return Object.freeze({ ok: !requireFile, errors: Object.freeze(errors), record: null });
  }

  let metadata;
  let bytes;
  let sha256;
  try {
    const [buffer, fileInfo, inspected] = await Promise.all([readFile(absoluteFile), stat(absoluteFile), inspectImageFile(absoluteFile)]);
    bytes = fileInfo.size;
    sha256 = createHash("sha256").update(buffer).digest("hex");
    metadata = inspected;
  } catch (error) {
    errors.push(finding("unreadable-candidate-file", `${asset.semanticId} candidate cannot be inspected.`, asset, "readable image", error.message));
    return Object.freeze({ ok: false, errors: Object.freeze(errors), record: null });
  }

  const output = asset.output || {};
  const expected = output.canvas || {};
  const actualExtension = extname(relativeFile).slice(1).toLowerCase();
  if (actualExtension !== output.format || metadata.format !== output.format) errors.push(finding("candidate-format-mismatch", `${asset.semanticId} candidate format is incorrect.`, asset, output.format, { extension: actualExtension, detected: metadata.format }));
  if (metadata.width !== expected.width || metadata.height !== expected.height) errors.push(finding("candidate-dimension-mismatch", `${asset.semanticId} candidate canvas is incorrect.`, asset, `${expected.width}x${expected.height}`, `${metadata.width}x${metadata.height}`));
  if (metadata.alpha !== output.alpha) errors.push(finding("candidate-alpha-mismatch", `${asset.semanticId} candidate alpha mode is incorrect.`, asset, output.alpha, metadata.alpha));
  if (metadata.bitDepth !== output.bitDepth || metadata.colourMode !== output.colourMode) errors.push(finding("candidate-colour-mode-mismatch", `${asset.semanticId} candidate colour mode is incorrect.`, asset, `${output.colourMode}/${output.bitDepth}-bit`, `${metadata.colourMode}/${metadata.bitDepth}-bit`));
  if (output.alpha && !metadata.opaqueBounds) errors.push(finding("candidate-empty-alpha", `${asset.semanticId} candidate contains no inspectable visible pixels.`, asset, "non-empty alpha bounds", metadata.opaqueBounds));
  if (bytes > asset.validation.maximumRuntimeBytes) errors.push(finding("candidate-texture-budget-exceeded", `${asset.semanticId} candidate exceeds its runtime-byte budget.`, asset, asset.validation.maximumRuntimeBytes, bytes));

  const sheet = output.spriteSheet;
  if (sheet) {
    const frameCount = Math.floor(metadata.width / sheet.frameWidth) * Math.floor(metadata.height / sheet.frameHeight);
    if (metadata.width % sheet.frameWidth || metadata.height % sheet.frameHeight || frameCount !== sheet.frameCount) errors.push(finding("candidate-frame-grid-mismatch", `${asset.semanticId} candidate does not match its declared frame grid.`, asset, { width: sheet.frameWidth, height: sheet.frameHeight, count: sheet.frameCount }, { width: metadata.width, height: metadata.height, count: frameCount }));
  }

  const approvalList = approvals?.assets || [];
  const approval = approvalList.find((entry) => entry.semanticId === asset.semanticId && entry.candidateSha256 === sha256) || null;
  const valid = errors.length === 0;
  const kind = output.type === "spritesheet" || output.type === "effect-sheet" ? "spritesheet" : "image";
  const record = Object.freeze({
    schemaVersion: PHASE_8B_CANDIDATE_SCHEMA_VERSION,
    semanticId: asset.semanticId,
    contractVersion: asset.version,
    contractSchemaVersion: asset.schemaVersion,
    candidateSha256: sha256,
    approvalToken: candidateApprovalToken(sha256),
    sourcePath: relativeFile,
    sourceUrl: `/__kindworks-candidate/${encodeURIComponent(asset.semanticId)}`,
    kind,
    status: valid ? (approval ? "approved" : "review") : "blocked",
    approvalStatus: approval ? "approved" : "human-review-required",
    validationStatus: valid ? "valid" : "invalid",
    validationFindings: Object.freeze(errors),
    expectedRuntimeFile: asset.expectedFilenames.runtime,
    technical: Object.freeze({
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      alpha: metadata.alpha,
      bitDepth: metadata.bitDepth,
      colourMode: metadata.colourMode,
      opaqueBounds: metadata.opaqueBounds,
      bytes,
      pixelArt: true,
      frameWidth: sheet?.frameWidth || null,
      frameHeight: sheet?.frameHeight || null,
      frameCount: sheet?.frameCount || 1,
      directions: Object.freeze([...(asset.directions || [])]),
    }),
    scenePlacements: Object.freeze([...(asset.scenePlacement || [])]),
    approval,
  });
  return Object.freeze({ ok: valid, errors: Object.freeze(errors), record });
}

export async function buildPhase8BCandidateIndex(packageDefinition, root, { selectedAssetIds = null, requireSelected = false } = {}) {
  const approvals = await readPhase8BApprovals(root);
  const overrides = await readLayoutOverrides(root);
  const references = await readReferenceAssociations(root);
  const wanted = selectedAssetIds ? new Set(selectedAssetIds) : null;
  const assets = {};
  const findings = [];
  for (const asset of packageDefinition.assets || []) {
    const selected = !wanted || wanted.has(asset.semanticId);
    const result = await validatePhase8BCandidate(asset, root, { requireFile: Boolean(requireSelected && selected), approvals });
    if (result.record) {
      let reference = null;
      const referencePath = references[asset.semanticId]?.file;
      if (referencePath) {
        const absoluteReference = resolve(root, referencePath);
        const referenceRoot = resolve(root, "artwork/references") + "/";
        if (!absoluteReference.startsWith(referenceRoot)) findings.push(finding("candidate-reference-outside-approved-root", `${asset.semanticId} reference is outside artwork/references.`, asset, "artwork/references/...", referencePath, referencePath));
        else try {
          const metadata = await inspectImageFile(absoluteReference);
          if (metadata.width !== asset.output.canvas.width || metadata.height !== asset.output.canvas.height) findings.push(finding("candidate-reference-dimension-mismatch", `${asset.semanticId} reference canvas does not match its contract.`, asset, asset.output.canvas, { width: metadata.width, height: metadata.height }, referencePath));
          else reference = Object.freeze({ file: referencePath, sourceUrl: `/__kindworks-candidate-reference/${encodeURIComponent(asset.semanticId)}`, status: "assigned" });
        } catch (error) { findings.push(finding("candidate-reference-unreadable", `${asset.semanticId} reference cannot be read.`, asset, "readable reference image", error.message, referencePath)); }
      }
      assets[asset.semanticId] = Object.freeze({
        ...result.record,
        visualOffset: Object.freeze({ x: Number(overrides[asset.semanticId]?.x || 0), y: Number(overrides[asset.semanticId]?.y || 0) }),
        reference,
        referenceStatus: reference ? "assigned" : "not-assigned",
      });
    }
    if (selected) findings.push(...result.errors);
  }
  return Object.freeze({
    schemaVersion: PHASE_8B_CANDIDATE_SCHEMA_VERSION,
    packageId: packageDefinition.id,
    packageRevision: packageDefinition.revision,
    assets: Object.freeze(assets),
    validation: Object.freeze({ ok: findings.length === 0, findings: Object.freeze(findings) }),
  });
}

export function renderPhase8BCandidateIndex(index) {
  return `// Generated by scripts/prepare-asset-lab-candidate.mjs. Do not hand-edit.\nexport const ASSET_LAB_CANDIDATE_INDEX = Object.freeze(${JSON.stringify(index, null, 2)});\n`;
}
