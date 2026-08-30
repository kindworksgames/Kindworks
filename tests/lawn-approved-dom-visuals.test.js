import assert from "node:assert/strict";
import test from "node:test";

import { applyApprovedLawnDomVisuals } from "../src/presentation/LawnApprovedDomVisuals.js";

function hudHarness() {
  const properties = new Map();
  return {
    dataset: {},
    style: {
      setProperty(name, value) { properties.set(name, value); },
      removeProperty(name) { properties.delete(name); },
    },
    properties,
  };
}

test("approved Lawn assets are resolved semantically and removed cleanly", () => {
  const hud = hudHarness();
  const assets = new Map([
    ["environment.lawn.slice.state-sheet", { status: "approved", source: { kind: "file" } }],
    ["prop.lawn.slice.weeds", { status: "approved", source: { kind: "file" } }],
    ["tool.lawn.slice.mower", { status: "approved", source: { kind: "file" } }],
  ]);
  const registry = { getAsset: (id) => assets.get(id), assetUrl: (id) => `/runtime/${id}.png` };
  const cleanup = applyApprovedLawnDomVisuals({ hud, registry: { get: () => registry } });
  assert.equal(hud.dataset.approvedSemanticArt, "true");
  assert.equal(hud.properties.get("--kw-approved-lawn"), 'url("/runtime/environment.lawn.slice.state-sheet.png")');
  assert.equal(hud.properties.get("--kw-approved-mower"), 'url("/runtime/tool.lawn.slice.mower.png")');
  cleanup();
  assert.equal(hud.dataset.approvedSemanticArt, undefined);
  assert.equal(hud.properties.size, 0);
});

test("unapproved candidate art never reaches the normal Lawn board", () => {
  const hud = hudHarness();
  const registry = {
    getAsset: () => ({ status: "candidate", source: { kind: "file" } }),
    assetUrl: () => { throw new Error("candidate URL must not resolve"); },
  };
  const cleanup = applyApprovedLawnDomVisuals({ hud, registry: { get: () => registry } });
  assert.equal(hud.dataset.approvedSemanticArt, undefined);
  assert.equal(hud.properties.size, 0);
  cleanup();
});
