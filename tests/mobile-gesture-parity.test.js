import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cardinalDirection, riverGestureAction } from "../src/input/mobileGestures.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("maps mobile swipes to all four cardinal directions", () => {
  assert.equal(cardinalDirection(40, 2), "R");
  assert.equal(cardinalDirection(-40, 2), "L");
  assert.equal(cardinalDirection(2, 40), "D");
  assert.equal(cardinalDirection(2, -40), "U");
  assert.equal(cardinalDirection(10, 2, 18), null);
});

test("preserves the original River tap, swipe, soft-drop and hard-drop contract", () => {
  assert.equal(riverGestureAction({ dx: 2, dy: 3 }), "rotate");
  assert.equal(riverGestureAction({ dx: 0, dy: -42 }), "rotate");
  assert.equal(riverGestureAction({ dx: -42, dy: 3 }), "left");
  assert.equal(riverGestureAction({ dx: 42, dy: 3 }), "right");
  assert.equal(riverGestureAction({ dx: 2, dy: 42 }), "down");
  assert.equal(riverGestureAction({ dx: 2, dy: 80 }), "drop");
  assert.equal(riverGestureAction({ dx: 42, dy: 0, movedHorizontal: true }), null);
  assert.equal(riverGestureAction({ dx: 0, dy: 42, elapsed: 1201 }), null);
});

test("wires River board gestures and disables browser scrolling on the board", async () => {
  const [scene, styles] = await Promise.all([readText("src/scenes/RiverClearoutScene.js"), readText("src/style.css")]);
  for (const event of ["pointerdown", "pointermove", "pointerup", "pointercancel", "lostpointercapture"]) assert.match(scene, new RegExp(`addEventListener\\(\\"${event}\\"`));
  assert.match(scene, /riverGestureAction/);
  assert.match(scene, /tap or swipe up to rotate/);
  assert.match(scene, /tapToRotate: true/);
  assert.match(styles, /\.river-board \{[^\n]*touch-action: none; user-select: none;/);
});

test("keeps Lawn four-way swipes and restores Beach held-swipe walking", async () => {
  const [lawn, beach] = await Promise.all([readText("src/scenes/LawnCareScene.js"), readText("src/scenes/BeachCleanupScene.js")]);
  assert.match(lawn, /this\.mow\(Math\.abs\(dx\) > Math\.abs\(dy\) \? \(dx > 0 \? \"R\" : \"L\"\) : \(dy > 0 \? \"D\" : \"U\"\)\)/);
  assert.match(beach, /cardinalDirection/);
  assert.match(beach, /addEventListener\(\"pointermove\"/);
  assert.match(beach, /delay: 140, loop: true/);
  assert.match(beach, /continuousHeldSwipe: true/);
});
