import test from "node:test";
import assert from "node:assert/strict";
import { InteractionSystem } from "../src/systems/InteractionSystem.js";

test("selects the closest eligible interaction inside its radius", () => {
  const system = new InteractionSystem({
    interactables: [
      { id: "wide", kind: "door", x: 50, y: 0, radius: 100 },
      { id: "near", kind: "door", x: 10, y: 0, radius: 30 },
    ],
  });
  assert.equal(system.update(0, 0).id, "near");
});

test("clears interactions outside the available radius", () => {
  const changes = [];
  const system = new InteractionSystem({
    interactables: [{ id: "door", x: 20, y: 20, radius: 30 }],
    onChange: (value) => changes.push(value?.id || null),
  });
  system.update(20, 20);
  assert.equal(system.getState().id, "door");
  system.update(200, 200);
  assert.equal(system.getState(), null);
  assert.deepEqual(changes, ["door", null]);
});

test("activates the selected interaction and respects the enabled state", () => {
  let activations = 0;
  const system = new InteractionSystem({
    interactables: [{
      id: "bakery",
      x: 0,
      y: 0,
      radius: 50,
      onActivate: () => ({ ok: true, count: ++activations }),
    }],
  });
  system.update(0, 0);
  assert.deepEqual(system.activateCurrent(), { ok: true, count: 1 });
  system.setEnabled(false);
  assert.equal(system.activateCurrent().ok, false);
  assert.equal(activations, 1);
});
