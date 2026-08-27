import test from "node:test";
import assert from "node:assert/strict";
import { generateHouseRescueDirt, generateHouseRescueItems } from "../src/data/houseRescue.js";
import { readFileSync } from "node:fs";
import {
  buildHouseRescueGeometry,
  constrainHouseRescueVacuum,
  houseRescueGeometryBlocked,
  houseRescueReachablePoints,
  houseRescueVacuumStart,
} from "../src/data/houseRescueGeometry.js";

test("House Rescue rubbish and grime occupy the authored reachable floor instead of a rectangular grid", () => {
  for (const houseId of ["house-1", "house-6", "house-11", "house-16"]) {
    const geometry = buildHouseRescueGeometry(houseId);
    const items = generateHouseRescueItems({ houseId, jobSerial: 3, level: 750 });
    const dirt = generateHouseRescueDirt({ houseId, jobSerial: 3, level: 750 });
    assert.ok(geometry.furniture.length >= 6);
    assert.ok(items.every((item) => !houseRescueGeometryBlocked(geometry, item.x, item.y, 2.1)));
    assert.ok(dirt.every((stain) => !houseRescueGeometryBlocked(geometry, stain.x, stain.y, 0.7)));
    assert.ok(new Set(items.map((item) => `${Math.round(item.x)}:${Math.round(item.y)}`)).size > 9);
  }
});

test("every generated stain is connected to the collision-safe vacuum start", () => {
  const geometry = buildHouseRescueGeometry("house-1");
  const start = houseRescueVacuumStart(geometry);
  const reachable = houseRescueReachablePoints(geometry, start);
  const dirt = generateHouseRescueDirt({ houseId: "house-1", jobSerial: 4, level: 750 });
  assert.equal(houseRescueGeometryBlocked(geometry, start.x, start.y), false);
  for (const stain of dirt) assert.ok(reachable.some((point) => Math.hypot(point.x - stain.x, point.y - stain.y) <= 2.3));
});

test("vacuum movement stops or slides at furniture and partitions", () => {
  const geometry = buildHouseRescueGeometry("house-6");
  const start = houseRescueVacuumStart(geometry);
  const bed = geometry.furniture.find((item) => item.kind === "bed");
  const target = { x: bed.x + bed.w / 2, y: bed.y + bed.h / 2 };
  const moved = constrainHouseRescueVacuum(geometry, start, target);
  assert.equal(houseRescueGeometryBlocked(geometry, moved.x, moved.y), false);
  assert.ok(Math.hypot(moved.x - target.x, moved.y - target.y) > 1);
});

test("the isolated fidelity route opens a real dirty cottage identity", () => {
  const source = readFileSync(new URL("../src/qa/FidelityQaHarness.js", import.meta.url), "utf8");
  assert.match(source, /"house-rescue": Object\.freeze\(\{ scene: "HouseRescueScene", houseId: "house-1" \}\)/);
  assert.doesNotMatch(source, /houseId: "house-01"/);
});
