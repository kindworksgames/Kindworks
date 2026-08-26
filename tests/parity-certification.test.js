import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  PARITY_ACTIVITIES,
  PARITY_EXPECTED_COUNTS,
  PARITY_SOURCE_SHA256,
  PARITY_VIEWPORTS,
  currentCampaignCounts,
  currentParityCounts,
  getParityCertification,
} from "../src/data/parityCertification.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("pins the exact protected HTML reference for every parity comparison", async () => {
  const source = await readFile(new URL("kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html", root));
  assert.equal(createHash("sha256").update(source).digest("hex"), PARITY_SOURCE_SHA256);
});

test("certifies the complete town, resident, animal, shop, farming and collection counts", () => {
  assert.deepEqual(currentParityCounts(), PARITY_EXPECTED_COUNTS);
});

test("certifies all 5,850 campaign levels and both non-level fishing activities", () => {
  const campaigns = currentCampaignCounts();
  assert.equal(Object.values(campaigns).reduce((sum, count) => sum + count, 0), 5850);
  for (const activity of PARITY_ACTIVITIES) assert.equal(campaigns[activity.id], activity.levels, activity.title);
});

test("checks early, middle and final representatives for every level campaign", () => {
  for (const activity of PARITY_ACTIVITIES.filter(({ levels }) => levels)) {
    assert.deepEqual(activity.representativeLevels, [1, Math.ceil(activity.levels / 2), activity.levels]);
    assert.ok(activity.representativeLevels.every((level) => level >= 1 && level <= activity.levels));
  }
});

test("requires landscape for every mobile activity except River Clear-Out", () => {
  const portrait = PARITY_ACTIVITIES.filter(({ mobileOrientation }) => mobileOrientation === "portrait-supported");
  assert.deepEqual(portrait.map(({ id }) => id), ["river"]);
  assert.ok(PARITY_ACTIVITIES.filter(({ id }) => id !== "river").every(({ mobileOrientation }) => mobileOrientation === "landscape"));
});

test("keeps every certified scene, HUD and orientation barrier wired into the build", async () => {
  const [main, markup, styles] = await Promise.all([readText("src/main.js"), readText("index.html"), readText("src/style.css")]);
  for (const activity of PARITY_ACTIVITIES) {
    assert.match(main, new RegExp(`\\b${activity.scene}\\b`), `${activity.scene} must be registered`);
    assert.match(markup, new RegExp(`id=["']${activity.hudId}["']`), `${activity.hudId} must exist`);
    if (activity.mobileOrientation === "landscape") {
      assert.ok(styles.includes(`body[data-game-scene="${activity.scene}"] .landscape-required`), `${activity.scene} needs a portrait rotation barrier`);
    }
  }
  assert.ok(!styles.includes('body[data-game-scene="RiverClearoutScene"] .landscape-required'));
});

test("publishes a deterministic, complete runtime certification and three viewport gates", () => {
  const first = getParityCertification();
  const second = getParityCertification();
  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.deepEqual(first.issues, []);
  assert.deepEqual(PARITY_VIEWPORTS.map(({ width, height }) => `${width}x${height}`), ["1280x720", "844x390", "390x844"]);
  assert.equal(first.source.readOnly, true);
  assert.equal(first.rule, "All activities require mobile landscape except River Clear-Out.");
});

test("provides a non-destructive in-game parity QA route", async () => {
  const main = await readText("src/main.js");
  assert.match(main, /qaMode === "parity"/);
  assert.match(main, /dataset\.parityCertified/);
  assert.match(main, /dataset\.parityCampaignLevels/);
  assert.match(main, /qaMode !== "parity"\) onboardingController\.processLogin/);
  const parityBlock = main.match(/if \(import\.meta\.env\.DEV && qaMode === "parity"\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.doesNotMatch(parityBlock, /save|update|create|grant|processLogin/i);
});
