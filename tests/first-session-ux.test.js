import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { firstSessionStep } from "../src/ui/OnboardingController.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

function state(overrides = {}) {
  return {
    complete: true,
    tried: { lawn: false, waste: false, river: false },
    journey: { moved: false, metResident: false, completed: { lawn: false, waste: false, river: false }, freePlay: false },
    ...overrides,
  };
}

test("presents one saved first-session action at a time", () => {
  assert.equal(firstSessionStep(state()).id, "move");
  assert.equal(firstSessionStep(state({ journey: { ...state().journey, moved: true } })).id, "resident");
  assert.equal(firstSessionStep(state({ journey: { ...state().journey, moved: true, metResident: true } })).id, "lawn");
  assert.equal(firstSessionStep(state({ journey: { ...state().journey, moved: true, metResident: true, completed: { lawn: true, waste: false, river: false } } })).id, "waste");
  assert.equal(firstSessionStep(state({ journey: { ...state().journey, moved: true, metResident: true, completed: { lawn: true, waste: true, river: true } } })).id, "free-play");
  assert.equal(firstSessionStep(state({ journey: { ...state().journey, freePlay: true } })), null);
});

test("ships a compact progressive welcome and replaces the old three-job checklist", async () => {
  const [markup, styles, main, town, npc, lawn, waste, river] = await Promise.all([
    readText("index.html"), readText("src/style.css"), readText("src/main.js"), readText("src/scenes/TownScene.js"),
    readText("src/ui/NpcNarrativeController.js"), readText("src/scenes/LawnCareScene.js"), readText("src/scenes/WasteCollectionScene.js"), readText("src/scenes/RiverClearoutScene.js"),
  ]);
  assert.match(markup, /id="onboarding-setup-progress"/);
  assert.match(markup, /<details class="onboarding-rewards">/);
  assert.doesNotMatch(markup, /id="first-session-items"/);
  assert.match(markup, /id="first-session-detail"/);
  assert.match(styles, /min-height: var\(--kw-touch-min\)/);
  assert.match(main, /startOnboardingJob/);
  assert.match(main, /recordJourneyStep\("metResident"\)/);
  assert.match(town, /journeyDistance >= 32/);
  assert.match(npc, /this\.onConversation\(result\)/);
  for (const source of [lawn, waste, river]) assert.match(source, /recordJobCompleted/);
});
