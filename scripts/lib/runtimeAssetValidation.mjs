import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { inspectImageBuffer } from "./artworkPipelineValidation.mjs";

async function resolveExactCase(root, relativePath) {
  const parts = relativePath.split("/").filter(Boolean);
  let current = root;
  const canonical = [];
  for (const part of parts) {
    let names;
    try { names = await readdir(current); } catch { return { exists: false, exactCase: false, canonicalPath: null }; }
    const exact = names.find((name) => name === part);
    const insensitive = exact || names.find((name) => name.toLowerCase() === part.toLowerCase());
    if (!insensitive) return { exists: false, exactCase: false, canonicalPath: null };
    canonical.push(insensitive);
    current = join(current, insensitive);
    if (!exact) return { exists: true, exactCase: false, canonicalPath: `/${canonical.join("/")}` };
  }
  return { exists: true, exactCase: true, canonicalPath: `/${canonical.join("/")}` };
}

export function createRuntimeAssetInspector(projectRoot) {
  const publicRoot = resolve(projectRoot, "public");
  return async (sourcePath, asset) => {
    const relativePath = String(sourcePath || "").replace(/^\//, "");
    const caseResult = await resolveExactCase(publicRoot, relativePath);
    if (!caseResult.exists) return caseResult;
    const absolute = resolve(publicRoot, relativePath);
    try {
      const [buffer, fileStat] = await Promise.all([readFile(absolute), stat(absolute)]);
      if (extname(absolute).toLowerCase() === ".json") {
        const json = JSON.parse(buffer.toString("utf8"));
        return { ...caseResult, format: "json", frames: Object.keys(json.frames || {}), bytes: fileStat.size, sha256: createHash("sha256").update(buffer).digest("hex") };
      }
      if (asset?.kind === "audio") return { ...caseResult, format: extname(absolute).slice(1).toLowerCase(), bytes: fileStat.size, sha256: createHash("sha256").update(buffer).digest("hex") };
      const image = inspectImageBuffer(buffer);
      return { ...caseResult, ...image, bytes: fileStat.size, sha256: createHash("sha256").update(buffer).digest("hex") };
    } catch {
      return { ...caseResult, exists: false };
    }
  };
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

export async function auditRuntimeAssetCoverage(projectRoot, manifest) {
  const publicRoot = resolve(projectRoot, "public");
  const files = (await walk(resolve(publicRoot, "assets"))).map((file) => `/${relative(publicRoot, file).split(sep).join("/")}`);
  const registered = new Set((manifest.assets || []).filter((asset) => asset.source?.kind === "file").flatMap((asset) => [asset.source.file, asset.source.atlasFile].filter(Boolean)));
  const excluded = new Set(manifest.nonRuntimeFiles || []);
  const orphaned = files.filter((file) => !registered.has(file) && !excluded.has(file));
  const missingDeclarations = [...registered].filter((file) => !files.includes(file));
  const hashes = new Map();
  for (const file of files.filter((path) => /\.(png|webp|json|mp3|ogg|wav)$/i.test(path))) {
    const hash = createHash("sha256").update(await readFile(resolve(publicRoot, file.replace(/^\//, "")))).digest("hex");
    hashes.set(hash, [...(hashes.get(hash) || []), file]);
  }
  const duplicateContent = [...hashes.entries()].filter(([, paths]) => paths.length > 1).map(([sha256, paths]) => ({ sha256, paths }));
  const usedIds = new Set([
    ...(manifest.scenePacks || []).flatMap((pack) => pack.assetIds || []),
    ...(manifest.prefabs || []).flatMap((prefab) => (prefab.layers || []).map((layer) => layer.assetId)),
    ...(manifest.animations || []).map((animation) => animation.assetId),
    ...Object.values(manifest.fallbacks || {}).map((fallback) => fallback.assetId),
  ]);
  const unusedEntries = (manifest.assets || []).filter((asset) => !usedIds.has(asset.id)).map((asset) => asset.id);
  return { files, registered: [...registered], orphaned, missingDeclarations, duplicateContent, unusedEntries };
}
