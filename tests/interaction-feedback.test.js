import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CONTROL_STATES, resolveControlState } from "../src/ui/InteractionFeedbackController.js";

function control({ disabled = false, attributes = {}, classes = [] } = {}) {
  return {
    disabled,
    getAttribute: (name) => attributes[name] ?? null,
    classList: { contains: (name) => classes.includes(name) },
  };
}

test("resolves disabled, pressed, selected and normal controls in safe priority order", () => {
  assert.equal(resolveControlState(control({ disabled: true }), { pressed: true }), CONTROL_STATES.disabled);
  assert.equal(resolveControlState(control(), { pressed: true }), CONTROL_STATES.pressed);
  assert.equal(resolveControlState(control({ attributes: { "aria-selected": "true" } })), CONTROL_STATES.selected);
  assert.equal(resolveControlState(control({ attributes: { "aria-pressed": "true" } })), CONTROL_STATES.selected);
  assert.equal(resolveControlState(control({ classes: ["active"] })), CONTROL_STATES.selected);
  assert.equal(resolveControlState(control()), CONTROL_STATES.normal);
});

test("wires one shared interaction controller and the protected KindWorks tokens", async () => {
  const root = new URL("../", import.meta.url);
  const [main, styles] = await Promise.all([
    readFile(new URL("src/main.js", root), "utf8"),
    readFile(new URL("src/style.css", root), "utf8"),
  ]);
  assert.match(main, /new InteractionFeedbackController\(\)\.start\(\)/);
  for (const token of ["--kw-ink", "--kw-cloud", "--kw-cream", "--kw-sunflower", "--kw-willow", "--kw-terracotta", "--kw-touch-min"]) {
    assert.ok(styles.includes(token), token);
  }
  for (const state of Object.values(CONTROL_STATES)) assert.ok(styles.includes(`data-ui-state="${state}"`) || state === "normal", state);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
