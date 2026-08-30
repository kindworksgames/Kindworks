import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export async function sha256File(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

export async function compareVisualFiles({ baselineFile, candidateFile, differenceFile, policy }) {
  const baseline = sharp(baselineFile, { failOn: "error" }).ensureAlpha();
  const candidate = sharp(candidateFile, { failOn: "error" }).ensureAlpha();
  const [baselineMetadata, candidateMetadata] = await Promise.all([baseline.metadata(), candidate.metadata()]);
  if (baselineMetadata.width !== candidateMetadata.width || baselineMetadata.height !== candidateMetadata.height) {
    return {
      ok: false,
      code: "dimension-mismatch",
      message: `Expected ${baselineMetadata.width}x${baselineMetadata.height}; received ${candidateMetadata.width}x${candidateMetadata.height}.`,
      baseline: baselineMetadata,
      candidate: candidateMetadata,
    };
  }
  const [{ data: left, info }, { data: right }] = await Promise.all([
    baseline.raw().toBuffer({ resolveWithObject: true }),
    candidate.raw().toBuffer({ resolveWithObject: true }),
  ]);
  const output = Buffer.alloc(left.length);
  let changedPixels = 0;
  let absoluteTotal = 0;
  let maximumChannelDelta = 0;
  const channels = info.channels;
  for (let offset = 0; offset < left.length; offset += channels) {
    let pixelMaximum = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      const delta = Math.abs(left[offset + channel] - right[offset + channel]);
      absoluteTotal += delta;
      pixelMaximum = Math.max(pixelMaximum, delta);
    }
    if (pixelMaximum > policy.channelDeltaThreshold) changedPixels += 1;
    maximumChannelDelta = Math.max(maximumChannelDelta, pixelMaximum);
    const intensity = Math.min(255, pixelMaximum * 4);
    output[offset] = intensity;
    output[offset + 1] = pixelMaximum <= policy.channelDeltaThreshold ? intensity : 0;
    output[offset + 2] = pixelMaximum <= policy.channelDeltaThreshold ? intensity : 255 - Math.floor(intensity / 2);
    if (channels === 4) output[offset + 3] = 255;
  }
  const pixelCount = info.width * info.height;
  const metrics = {
    pixelCount,
    changedPixels,
    changedPixelRatio: changedPixels / pixelCount,
    meanAbsoluteError: absoluteTotal / left.length,
    maximumChannelDelta,
    channelDeltaThreshold: policy.channelDeltaThreshold,
  };
  if (differenceFile) {
    await mkdir(path.dirname(differenceFile), { recursive: true });
    await sharp(output, { raw: info }).png().toFile(differenceFile);
  }
  const ok = metrics.changedPixelRatio <= policy.maxChangedPixelRatio
    && metrics.meanAbsoluteError <= policy.maxMeanAbsoluteError;
  return {
    ok,
    code: ok ? "visual-match" : "visual-difference",
    message: ok
      ? "Candidate is within the approved comparison policy."
      : `Changed ${(metrics.changedPixelRatio * 100).toFixed(4)}% (limit ${(policy.maxChangedPixelRatio * 100).toFixed(4)}%); MAE ${metrics.meanAbsoluteError.toFixed(4)} (limit ${policy.maxMeanAbsoluteError}).`,
    metrics,
    policy,
  };
}

export function approvalToken(candidateSha256) {
  return candidateSha256.slice(0, 12);
}

export async function approveVisualCandidate({ root, manifest, baseline, candidateFile, reviewer, token, now = new Date().toISOString() }) {
  if (!reviewer?.trim()) throw new Error("A named reviewer is required; use --reviewer.");
  const candidateSha256 = await sha256File(candidateFile);
  const expectedToken = approvalToken(candidateSha256);
  if (token !== expectedToken) throw new Error(`Approval token mismatch. Review the candidate, then pass --token ${expectedToken}.`);
  const baselineFile = path.join(root, "docs/qa/visual-readiness/phase-01", baseline.file);
  await mkdir(path.dirname(baselineFile), { recursive: true });
  const temporaryFile = `${baselineFile}.approved-${expectedToken}`;
  await copyFile(candidateFile, temporaryFile);
  await rename(temporaryFile, baselineFile);
  baseline.sha256 = candidateSha256;
  baseline.approval = { reviewer: reviewer.trim(), approvedAt: now, candidateSha256, token: expectedToken };
  manifest.version = Math.max(2, Number(manifest.version || 1));
  manifest.lastReviewedAt = now;
  const manifestFile = path.join(root, "docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json");
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { ok: true, baselineFile, candidateSha256, approval: baseline.approval };
}
