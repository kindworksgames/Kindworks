import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("moves all eight secondary town destinations behind one menu without removing them", async () => {
  const markup = await readText("index.html");
  const panel = markup.match(/<section id="town-menu-panel"([\s\S]*?)<\/section>/)?.[1] || "";
  assert.match(markup, /id="town-menu-button"/);
  for (const id of ["shop-button", "inventory-button", "custom-resident-button", "animal-friends-button", "onboarding-button", "impact-button", "npc-stories-button", "save-status-button"]) {
    assert.equal((markup.match(new RegExp(`id="${id}"`, "g")) || []).length, 1, id);
    assert.ok(panel.includes(`id="${id}"`), `${id} must live in the town menu`);
  }
});

test("wires the town menu as a real pause reason and keeps mini-game HUDs separate", async () => {
  const [main, styles, saveStatus, onboarding, menuController] = await Promise.all([
    readText("src/main.js"),
    readText("src/style.css"),
    readText("src/ui/SaveStatusController.js"),
    readText("src/ui/OnboardingController.js"),
    readText("src/ui/TownMenuController.js"),
  ]);
  assert.match(main, /new TownMenuController/);
  assert.match(main, /setModalOpen\("town-menu", open\)/);
  assert.match(styles, /body:not\(\[data-game-scene="TownScene"\]\) \.first-session-checklist/);
  assert.match(styles, /--kw-touch-min/);
  assert.match(styles, /\.town-menu-actions/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /min-width: 721px\) and \(max-width: 900px/);
  assert.match(styles, /\.interaction-prompt #interaction-detail/);
  assert.match(saveStatus, /"✓ Saved"/);
  assert.match(onboarding, /"🎁 Welcome"/);
  assert.match(menuController, /event\.key === "Tab"/);
});
