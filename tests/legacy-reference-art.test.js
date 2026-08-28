import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const expected = Object.freeze({
  "harbour-general.webp": "34caade00f417c2495589d4e370b8fbeffa60797fef44e5535c4760bb51c48ed",
  "fishing.webp": "ade1c03c8ae32dad0b98ded9c1d6e485cf9422560777f5d8f3a41c6189b8c5bb",
  "magnet-fishing.webp": "43a7a50e5f32b6c4946283f9225ffc6581c308299ad37223fb556034afb2cce9",
});

test("ships the exact protected Harbour, Fishing and Magnet Fishing artwork", async () => {
  for (const [filename, digest] of Object.entries(expected)) {
    const data = await readFile(new URL(`public/assets/legacy-reference/${filename}`, root));
    assert.equal(data.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(data.subarray(8, 12).toString("ascii"), "WEBP");
    assert.equal(createHash("sha256").update(data).digest("hex"), digest);
  }
});

test("uses recovered art only where live gameplay can be layered faithfully", async () => {
  const harbour = await readFile(new URL("src/scenes/HarbourGeneralScene.js", root), "utf8");
  const fishing = await readFile(new URL("src/scenes/FishingScene.js", root), "utf8");
  assert.match(harbour, /legacy-harbour-general/);
  assert.match(harbour, /legacy-reference\.harbour-general\.complete-interior/);
  assert.match(fishing, /legacy-fishing/);
  assert.match(fishing, /legacy-reference\.fishing\.environment/);
  assert.match(fishing, /const recoveredReference = !magnet && reedbank/);
  assert.doesNotMatch(fishing, /legacy-magnet-fishing/);
  assert.match(fishing, /minigame\.magnet-fishing\.live-environment/);
});
