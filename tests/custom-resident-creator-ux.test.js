import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("restores the protected staged resident, hobbies and home creator", async () => {
  const [markup, controller, styles] = await Promise.all([
    readText("index.html"),
    readText("src/ui/CustomResidentController.js"),
    readText("src/style.css"),
  ]);
  assert.equal((markup.match(/data-resident-step="[012]"/g) || []).length, 3);
  assert.match(markup, /Step 1 of 3 · Appearance/);
  assert.match(markup, /id="custom-resident-next"[^>]*>Next: Hobbies</);
  assert.match(markup, /id="custom-resident-save"[^>]*hidden>Create resident &amp; home</);
  assert.match(controller, /const labels = \["Appearance", "Hobbies", "Your house"\]/);
  assert.match(controller, /this\.step < 2/);
  assert.match(controller, /this\.setStep\(0\)/);
  assert.match(styles, /\.resident-step\[hidden\] \{ display: none; \}/);
  assert.match(styles, /data-resident-step="2"[^\n]*#custom-resident-preview/);
});

test("keeps all legacy creator choices in the staged flow", async () => {
  const markup = await readText("index.html");
  for (const field of ["name", "skin", "hair", "hairColor", "accessory", "outfit", "bodyBuild", "wallColor", "roofStyle", "roofColor"]) {
    assert.match(markup, new RegExp(`name="${field}"`));
  }
  assert.equal((markup.match(/name="hobby"/g) || []).length, 12);
});
