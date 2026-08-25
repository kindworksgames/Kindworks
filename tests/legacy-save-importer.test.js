import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_BACKUP_KEY,
  LEGACY_RECOVERY_KEY,
  LEGACY_SAVE_KEY,
} from "../src/state/constants.js";
import { LegacySaveImporter } from "../src/state/LegacySaveImporter.js";
import { invalidSealFixture, legacyFixtures } from "./fixtures/legacy-saves.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

test("inspects a current legacy save without writing or deleting anything", () => {
  const original = JSON.stringify(legacyFixtures.currentV82);
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: original });
  const result = new LegacySaveImporter(storage).inspect();
  assert.equal(result.ok, true);
  assert.equal(result.selected.legacyVersion, 82);
  assert.equal(result.selected.integrity, "valid");
  assert.equal(storage.getItem(LEGACY_SAVE_KEY), original);
  assert.deepEqual(storage.writes, []);
  assert.deepEqual(storage.removals, []);
});

test("all anonymized progression fixtures produce successful reports", () => {
  for (const [name, fixture] of Object.entries(legacyFixtures)) {
    const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: JSON.stringify(fixture) });
    const result = new LegacySaveImporter(storage).inspect();
    assert.equal(result.ok, true, `${name} should import`);
    assert.equal(result.selected.legacyVersion, fixture.version, `${name} should keep its version`);
  }
});

test("accepts the protected v12 boundary with a precise seal warning", () => {
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: JSON.stringify(legacyFixtures.newPlayerV12) });
  const result = new LegacySaveImporter(storage).inspect();
  assert.equal(result.ok, true);
  assert.equal(result.selected.legacyVersion, 12);
  assert.match(result.selected.warnings.join(" "), /integrity seal is missing/i);
  assert.match(result.selected.warnings.join(" "), /predates the shared economy/i);
});

test("falls back to a valid backup after corrupted current JSON", () => {
  const storage = new MemoryStorage({
    [LEGACY_SAVE_KEY]: "{broken",
    [LEGACY_BACKUP_KEY]: JSON.stringify(legacyFixtures.currentV82),
  });
  const result = new LegacySaveImporter(storage).inspect();
  assert.equal(result.ok, true);
  assert.equal(result.selected.sourceKind, "backup");
  assert.match(result.reports[0].errors[0], /invalid JSON/i);
  assert.equal(storage.writes.length, 0);
});

test("loads a valid backup when the current key is missing", () => {
  const storage = new MemoryStorage({
    [LEGACY_BACKUP_KEY]: JSON.stringify(legacyFixtures.lateV75),
  });
  const result = new LegacySaveImporter(storage).inspect();
  assert.equal(result.ok, true);
  assert.equal(result.selected.sourceKind, "backup");
  assert.equal(result.selected.legacyVersion, 75);
  assert.equal(storage.writes.length, 0);
});

test("uses a valid recovery payload only after primary candidates fail", () => {
  const recovery = JSON.stringify({
    format: 1,
    capturedAt: 1767225600000,
    sourceKey: LEGACY_SAVE_KEY,
    reason: "QA recovery fixture",
    raw: JSON.stringify(legacyFixtures.midV38),
  });
  const storage = new MemoryStorage({ [LEGACY_RECOVERY_KEY]: recovery });
  const result = new LegacySaveImporter(storage).inspect();
  assert.equal(result.ok, true);
  assert.equal(result.selected.sourceKind, "recovery");
  assert.equal(result.selected.legacyVersion, 38);
});

test("rejects a tampered integrity seal", () => {
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: JSON.stringify(invalidSealFixture()) });
  const result = new LegacySaveImporter(storage).inspect();
  assert.equal(result.ok, false);
  assert.match(result.reports[0].errors.join(" "), /integrity seal does not match/i);
});

test("reports unsupported versions instead of silently importing", () => {
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: JSON.stringify({ version: 11 }) });
  const result = new LegacySaveImporter(storage).inspect();
  assert.equal(result.ok, false);
  assert.match(result.reports[0].errors.join(" "), /unsupported legacy save version 11/i);
});

test("imports partially missing optional fields with defaults and warnings", () => {
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: JSON.stringify(legacyFixtures.partialV82) });
  const importer = new LegacySaveImporter(storage);
  const inspected = importer.inspect();
  const state = importer.createImportedState(inspected.selected, { now: 0 });
  assert.equal(inspected.ok, true);
  assert.equal(state.identity.townName, "Willowmere");
  assert.match(state.source.warnings.join(" "), /player setup is missing/i);
  assert.deepEqual(state.legacySnapshot, legacyFixtures.partialV82);
});
