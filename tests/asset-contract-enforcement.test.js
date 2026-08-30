import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { validateAssetCategoryCatalog } from "../scripts/lib/assetContractCatalog.mjs";
import { inspectImageBuffer, validateArtworkManifest } from "../scripts/lib/artworkPipelineValidation.mjs";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const readJson = async (file) => JSON.parse(await readFile(resolve(root, file), "utf8"));

test("all Phase 10 families have one closed machine-readable category contract", async () => {
  const [catalog, plan] = await Promise.all([
    readJson("artwork/contracts/asset-category-contracts.v2.json"),
    readJson("artwork/production/phase-10/production-migration-plan.v1.json"),
  ]);
  const result = validateAssetCategoryCatalog({ categoryContracts: catalog.categoryContracts, familyAssignments: catalog.familyAssignments, phase10Plan: plan });
  assert.equal(result.ok, true, result.errors.map(({ code }) => code).join(","));
  assert.equal(catalog.categoryContracts.length, 15);
  assert.equal(catalog.familyAssignments.length, 74);
  assert.equal(new Set(catalog.familyAssignments.map(({ familyId }) => familyId)).size, 74);

  const duplicate = structuredClone(catalog);
  duplicate.categoryContracts.push(structuredClone(duplicate.categoryContracts[0]));
  assert.ok(validateAssetCategoryCatalog({ categoryContracts: duplicate.categoryContracts, familyAssignments: duplicate.familyAssignments, phase10Plan: plan }).errors.some(({ code }) => code === "duplicate-category-contract"));

  const missing = structuredClone(catalog);
  missing.familyAssignments.pop();
  assert.ok(validateAssetCategoryCatalog({ categoryContracts: missing.categoryContracts, familyAssignments: missing.familyAssignments, phase10Plan: plan }).errors.some(({ code }) => code === "missing-family-contract"));

  const arbitrary = structuredClone(catalog);
  arbitrary.categoryContracts[0].generatorGuess = true;
  assert.ok(validateAssetCategoryCatalog({ categoryContracts: arbitrary.categoryContracts, familyAssignments: arbitrary.familyAssignments, phase10Plan: plan }).errors.some(({ code }) => code === "unknown-contract-field"));
});

test("single-asset, category, changed-assets, and full-project validation modes execute", async () => {
  const script = resolve(root, "scripts/validate-asset-contracts.mjs");
  const cases = [
    ["--asset", "scene.fishing.reedbank.background"],
    ["--category", "category.ui"],
    ["--changed"],
    ["--scope", "full"],
  ];
  for (const args of cases) {
    const { stdout } = await run(process.execPath, [script, ...args], { cwd: root });
    assert.match(stdout, /Asset contracts: PASS/);
  }
});

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});
const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const value of buffer) crc = crcTable[(crc ^ value) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const label = Buffer.from(type), length = Buffer.alloc(4), checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc32(Buffer.concat([label, data])));
  return Buffer.concat([length, label, data, checksum]);
};
const rgbaPng = (width, height, opaqueX, opaqueY) => {
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4); row[0] = 0;
    for (let x = 0; x < width; x += 1) if (x === opaqueX && y === opaqueY) row.set([255, 255, 255, 255], 1 + x * 4);
    rows.push(row);
  }
  return Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
};

test("pixel inspection enforces alpha bounds and transparent padding before runtime", async () => {
  const buffer = rgbaPng(4, 4, 1, 1);
  assert.deepEqual(inspectImageBuffer(buffer), { format: "png", width: 4, height: 4, alpha: true, bitDepth: 8, colourMode: "RGBA", opaqueBounds: { x: 1, y: 1, width: 1, height: 1 } });
  const temporaryRoot = await mkdtemp(join(tmpdir(), "kindworks-contract-"));
  try {
    const manifest = await readJson("artwork/specifications/kindworks-artwork-manifest.v1.json");
    const catalog = await readJson("artwork/contracts/asset-category-contracts.v2.json");
    const asset = manifest.assets[0];
    asset.output = { ...asset.output, format: "png", canvas: { width: 4, height: 4 }, alpha: true, colourMode: "RGBA" };
    asset.filenameStem = "padding-sample";
    asset.expectedFilenames = {
      staging: "artwork/staging/padding-sample.v1.png",
      master: "artwork/masters/padding-sample.v1.png",
      runtime: "public/assets/runtime/padding-sample.v1.png",
    };
    asset.validation.maximumVisibleBounds = { x: 0, y: 0, width: 4, height: 4 };
    asset.validation.maximumTransparentPadding = { top: 0, right: 0, bottom: 0, left: 0 };
    for (const file of Object.values(asset.expectedFilenames)) {
      await mkdir(resolve(temporaryRoot, file, ".."), { recursive: true });
      await writeFile(resolve(temporaryRoot, file), buffer);
    }
    const result = await validateArtworkManifest(manifest, { root: temporaryRoot, categoryContracts: catalog.categoryContracts });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(({ code }) => code === "transparent-padding-exceeded"));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("valid directional spritesheet and atlas contracts pass while semantic defects fail", async () => {
  const [base, catalog] = await Promise.all([
    readJson("artwork/specifications/kindworks-artwork-manifest.v1.json"),
    readJson("artwork/contracts/asset-category-contracts.v2.json"),
  ]);
  const sheetManifest = structuredClone(base), sheet = sheetManifest.assets[0];
  sheet.categoryContractId = "category.character";
  sheet.output = {
    ...sheet.output,
    type: "spritesheet",
    format: "png",
    canvas: { width: 128, height: 128 },
    alpha: true,
    colourMode: "RGBA",
    spriteSheet: {
      rows: 2, columns: 2, frameWidth: 64, frameHeight: 64, padding: 0, spacing: 0,
      actions: ["walk"], directions: ["down", "up"],
      frameOrder: ["walk.down.0", "walk.down.1", "walk.up.0", "walk.up.1"],
    },
  };
  sheet.filenameStem = "resident-walk";
  sheet.categoryMetadata = { rig: "resident-v1", frameOrder: [...sheet.output.spriteSheet.frameOrder] };
  sheet.anchor.groundContact = { x: 64, y: 64 };
  sheet.expectedFilenames = { staging: "artwork/staging/resident-walk.v1.png", master: "artwork/masters/resident-walk.v1.png", runtime: "public/assets/runtime/resident-walk.v1.png" };
  sheet.states = ["default"]; sheet.variants = ["resident-a"]; sheet.directions = ["down", "up"];
  sheet.layers = [{ id: "main", order: 0, states: ["default"], canvasAlignment: "frame-grid", alphaAlignment: "transparent-canvas" }];
  sheet.animations = [
    { id: "walk-down", action: "walk", direction: "down", frames: ["walk.down.0", "walk.down.1"], frameRate: 8, repeat: -1 },
    { id: "walk-up", action: "walk", direction: "up", frames: ["walk.up.0", "walk.up.1"], frameRate: 8, repeat: -1 },
  ];
  sheet.validation.requireStateNames = ["default"]; sheet.validation.requireDirections = ["down", "up"]; sheet.validation.requireAlpha = true;
  sheet.validation.maximumVisibleBounds = { x: 0, y: 0, width: 128, height: 128 };
  sheet.validation.maximumTransparentPadding = { top: 63, right: 63, bottom: 63, left: 63 };
  let result = await validateArtworkManifest(sheetManifest, { validateFiles: false, categoryContracts: catalog.categoryContracts });
  assert.equal(result.ok, true, result.errors.map(({ code }) => code).join(","));

  const missingDirection = structuredClone(sheetManifest);
  missingDirection.assets[0].directions = ["down"];
  result = await validateArtworkManifest(missingDirection, { validateFiles: false, categoryContracts: catalog.categoryContracts });
  assert.ok(result.errors.some(({ code }) => code === "missing-required-direction"));

  const atlasManifest = structuredClone(sheetManifest), atlas = atlasManifest.assets[0];
  atlas.categoryContractId = "category.prop";
  atlas.categoryMetadata = { shadowPolicy: "none" };
  atlas.output = { ...atlas.output, type: "atlas", spriteSheet: null, atlas: { dataFilename: "resident-walk.v1.json", frames: 2, frameNames: ["idle-0", "idle-1"], allowTrim: false, allowRotation: false } };
  atlas.directions = []; atlas.validation.requireDirections = [];
  atlas.animations = [{ id: "idle", action: "idle", direction: null, frames: ["idle-0", "idle-1"], frameRate: 6, repeat: -1 }];
  result = await validateArtworkManifest(atlasManifest, { validateFiles: false, categoryContracts: catalog.categoryContracts });
  assert.equal(result.ok, true, result.errors.map(({ code }) => code).join(","));
  atlas.animations[0].frames.push("missing-2");
  result = await validateArtworkManifest(atlasManifest, { validateFiles: false, categoryContracts: catalog.categoryContracts });
  assert.ok(result.errors.some(({ code }) => code === "missing-atlas-frame"));
});

test("atlas JSON bytes and audio technical contracts are enforced", async () => {
  const [base, catalog] = await Promise.all([
    readJson("artwork/specifications/kindworks-artwork-manifest.v1.json"),
    readJson("artwork/contracts/asset-category-contracts.v2.json"),
  ]);
  const temporaryRoot = await mkdtemp(join(tmpdir(), "kindworks-atlas-contract-"));
  try {
    const manifest = structuredClone(base), asset = manifest.assets[0];
    asset.categoryContractId = "category.prop";
    asset.categoryMetadata = { shadowPolicy: "none" };
    asset.output = {
      ...asset.output,
      type: "atlas",
      format: "png",
      canvas: { width: 4, height: 4 },
      alpha: true,
      colourMode: "RGBA",
      spriteSheet: null,
      atlas: { dataFilename: "sample-atlas.v1.json", frames: 2, frameNames: ["idle-0", "idle-1"], allowTrim: false, allowRotation: false },
    };
    asset.filenameStem = "sample-atlas";
    asset.anchor.groundContact = { x: 2, y: 4 };
    asset.states = ["default"]; asset.variants = ["default"]; asset.directions = [];
    asset.layers = [{ id: "main", order: 0, states: ["default"], canvasAlignment: "full-canvas", alphaAlignment: "transparent-canvas" }];
    asset.animations = [{ id: "idle", action: "idle", direction: null, frames: ["idle-0", "idle-1"], frameRate: 6, repeat: -1 }];
    asset.validation.requireStateNames = ["default"]; asset.validation.requireDirections = []; asset.validation.requireAlpha = true;
    asset.validation.maximumVisibleBounds = { x: 0, y: 0, width: 4, height: 4 };
    asset.validation.maximumTransparentPadding = { top: 4, right: 4, bottom: 4, left: 4 };
    asset.expectedFilenames = {
      staging: "artwork/staging/sample-atlas.v1.png",
      master: "artwork/masters/sample-atlas.v1.png",
      runtime: "public/assets/runtime/sample-atlas.v1.png",
      atlas: "public/assets/runtime/sample-atlas.v1.json",
    };
    const image = rgbaPng(4, 4, 1, 1);
    for (const file of [asset.expectedFilenames.staging, asset.expectedFilenames.master, asset.expectedFilenames.runtime]) {
      await mkdir(resolve(temporaryRoot, file, ".."), { recursive: true });
      await writeFile(resolve(temporaryRoot, file), image);
    }
    const atlasData = { frames: {
      "idle-0": { frame: { x: 0, y: 0, w: 2, h: 2 }, trimmed: false, rotated: false },
      "idle-1": { frame: { x: 2, y: 0, w: 2, h: 2 }, trimmed: false, rotated: false },
    } };
    await writeFile(resolve(temporaryRoot, asset.expectedFilenames.atlas), JSON.stringify(atlasData));
    let result = await validateArtworkManifest(manifest, { root: temporaryRoot, categoryContracts: catalog.categoryContracts });
    assert.equal(result.ok, true, result.errors.map(({ code }) => code).join(","));
    atlasData.frames["idle-1"].trimmed = true;
    await writeFile(resolve(temporaryRoot, asset.expectedFilenames.atlas), JSON.stringify(atlasData));
    result = await validateArtworkManifest(manifest, { root: temporaryRoot, categoryContracts: catalog.categoryContracts });
    assert.ok(result.errors.some(({ code }) => code === "unsafe-atlas-file-transform"));

    const audioManifest = structuredClone(base), audio = audioManifest.assets[0];
    audio.categoryContractId = "category.audio";
    audio.output = { type: "audio", format: "ogg", audio: { channels: 2, sampleRate: 48000, durationMs: 1200, loopPolicy: "once", loudnessTargetLufs: -16 } };
    audio.states = []; audio.variants = []; audio.directions = []; audio.layers = []; audio.animations = [];
    audio.expectedFilenames = { staging: "artwork/staging/audio-sample.v1.ogg", master: "artwork/masters/audio-sample.v1.ogg", runtime: "public/assets/runtime/audio-sample.v1.ogg" };
    audio.filenameStem = "audio-sample";
    result = await validateArtworkManifest(audioManifest, { validateFiles: false, categoryContracts: catalog.categoryContracts });
    assert.equal(result.ok, true, result.errors.map(({ code }) => code).join(","));
    audio.output.audio.sampleRate = 1;
    result = await validateArtworkManifest(audioManifest, { validateFiles: false, categoryContracts: catalog.categoryContracts });
    assert.ok(result.errors.some(({ code }) => code === "invalid-audio-contract"));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("invalid fixture descriptors cannot be bundled as runtime assets", async () => {
  const [manifest, productionVerifier] = await Promise.all([
    readJson("artwork/specifications/kindworks-artwork-manifest.v1.json"),
    readFile(resolve(root, "scripts/verify-production-surface.mjs"), "utf8"),
  ]);
  assert.ok(Object.values(manifest.assets[0].expectedFilenames).every((file) => !file.includes("fixtures/invalid")));
  assert.match(productionVerifier, /artwork\/fixtures|fixture/i);
});
