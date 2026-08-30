import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { PHASE_8B_APPROVAL_FILE, candidateApprovalToken, readPhase8BApprovals, validatePhase8BCandidate } from "./lib/phase8bCandidateWorkflow.mjs";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const valueAfter = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
const semanticId = valueAfter("--asset");
const reviewer = valueAfter("--reviewer");
const token = valueAfter("--token");
const confirm = valueAfter("--confirm");
const asset = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find((entry) => entry.semanticId === semanticId);
if (!asset) throw new Error(`Unknown candidate asset ID: ${semanticId || "missing --asset"}`);

const approvals = await readPhase8BApprovals(root);
const result = await validatePhase8BCandidate(asset, root, { requireFile: true, approvals });
if (!result.ok) throw new Error(result.errors.map(({ code, message }) => `${code}: ${message}`).join("\n"));
const requiredToken = candidateApprovalToken(result.record.candidateSha256);
if (!reviewer || confirm !== "APPROVE" || token !== requiredToken) {
  console.log(`${asset.semanticId} is technically valid but not promoted.`);
  console.log(`After visual review in Asset Lab, rerun with --reviewer <name> --token ${requiredToken} --confirm APPROVE`);
  process.exitCode = 2;
} else {
  const bytes = await readFile(resolve(root, result.record.sourcePath));
  for (const destination of [asset.expectedFilenames.master, asset.expectedFilenames.runtime]) {
    const absolute = resolve(root, destination);
    const existing = await readFile(absolute).catch(() => null);
    if (existing && !existing.equals(bytes)) throw new Error(`Refusing to overwrite different approved artwork at ${destination}.`);
    if (!existing) {
      await mkdir(dirname(absolute), { recursive: true });
      const temporary = `${absolute}.candidate-${requiredToken}`;
      await writeFile(temporary, bytes);
      await rename(temporary, absolute);
    }
  }
  const next = {
    schemaVersion: 1,
    assets: [
      ...approvals.assets.filter((entry) => entry.semanticId !== asset.semanticId),
      {
        semanticId: asset.semanticId,
        contractVersion: asset.version,
        candidateSha256: result.record.candidateSha256,
        reviewer,
        approvedAt: new Date().toISOString(),
        masterPath: asset.expectedFilenames.master,
        runtimePath: asset.expectedFilenames.runtime,
      },
    ].sort((left, right) => left.semanticId.localeCompare(right.semanticId)),
  };
  const approvalPath = resolve(root, PHASE_8B_APPROVAL_FILE);
  await mkdir(dirname(approvalPath), { recursive: true });
  const temporaryApproval = `${approvalPath}.candidate-${requiredToken}`;
  await writeFile(temporaryApproval, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  await rename(temporaryApproval, approvalPath);
  await import(`./generate-phase8b-approved-index.mjs?approval=${requiredToken}`);
  console.log(`${asset.semanticId}: APPROVED and atomically promoted to master/runtime by ${reviewer}.`);
}
