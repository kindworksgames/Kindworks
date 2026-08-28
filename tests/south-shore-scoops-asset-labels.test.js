import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SOUTH_SHORE_SCOOPS_ASSET_MANIFEST,
  southShoreScoopsAsset,
} from "../src/assets/southShoreScoopsAssetManifest.js";
import { SOUTH_SHORE_SCOOPS_PARTS } from "../src/data/southShoreScoops.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("South Shore Scoops exposes a unique backend label for every production asset", () => {
  const ids = SOUTH_SHORE_SCOOPS_ASSET_MANIFEST.map((entry) => entry.assetId);
  assert.equal(new Set(ids).size, ids.length, "asset IDs must be unique");
  assert.ok(ids.length >= 85, `expected a comprehensive manifest, found ${ids.length}`);
  for (const entry of SOUTH_SHORE_SCOOPS_ASSET_MANIFEST) {
    assert.match(entry.assetId, /^KW-SCOOPS-[A-Za-z0-9-]+$/);
    assert.match(entry.label, /^South Shore Scoops — /);
    assert.ok(entry.kind);
    assert.ok(entry.layer);
    assert.equal(entry.scene, "south-shore-scoops");
    assert.equal(southShoreScoopsAsset(entry.assetId), entry);
  }
});

test("every playable Scoops recipe part carries its stable Sprite AI identity", () => {
  for (const [partId, part] of Object.entries(SOUTH_SHORE_SCOOPS_PARTS)) {
    const assetId = `KW-SCOOPS-PART-${partId}`;
    const manifestEntry = southShoreScoopsAsset(assetId);
    assert.ok(manifestEntry, `${partId} missing from the asset manifest`);
    assert.equal(manifestEntry.kind, "interactive-food-part");
    assert.match(manifestEntry.label, new RegExp(`${part.name}$`));
    assert.equal(manifestEntry.interactive, true);
  }
});

test("the approved reference fixtures and UI controls all have explicit labels", async () => {
  const required = [
    "AWNING", "TITLE-SIGN", "SEASIDE-SKY", "SEASIDE-WATER", "SEASIDE-BEACH",
    "CUSTOMER-WINDOW", "SERVICE-LEDGE", "MENU-BOARD", "HANGING-ANCHOR-SIGN",
    "PLANTER-LEFT", "PLANTER-RIGHT", "MILKSHAKE-MACHINE", "LEMONADE-MACHINE",
    "FLAVOUR-TUB-STRAWBERRY", "FLAVOUR-TUB-CHOCOLATE", "FLAVOUR-TUB-VANILLA",
    "FLAVOUR-TUB-MINT", "FLAVOUR-TUB-GRAPE", "FLAVOUR-TUB-BLUEBERRY",
    "SAUCE-BOTTLE-STRAWBERRY", "SAUCE-BOTTLE-CHOCOLATE", "SAUCE-BOTTLE-CARAMEL",
    "TOPPING-BIN-SPRINKLES", "TOPPING-BIN-CHOCOLATE-BITS", "TOPPING-BIN-WAFFLE-PIECES",
    "TOPPING-BIN-CHERRIES", "TOPPING-BIN-MARSHMALLOWS", "TOPPING-BIN-WAFER-STICKS",
    "ORDER-CARD", "ORDER-SLOT-1", "ORDER-SLOT-2", "ORDER-SLOT-3",
    "BUILD-MAT", "SERVING-TRAY", "SERVE-BUTTON", "UNDO-BUTTON", "DISCARD-BUTTON",
  ];
  for (const suffix of required) assert.ok(southShoreScoopsAsset(`KW-SCOOPS-${suffix}`), suffix);

  const [presentation, scene, markup] = await Promise.all([
    readText("src/ui/RestaurantPresentation.js"),
    readText("src/scenes/SouthShoreScoopsScene.js"),
    readText("index.html"),
  ]);
  for (const suffix of required.filter((suffix) => !["SERVE-BUTTON", "UNDO-BUTTON", "DISCARD-BUTTON"].includes(suffix))) {
    assert.ok(presentation.includes(`\"${suffix}\"`) || presentation.includes(`KW-SCOOPS-${suffix}`), `${suffix} is not mapped to a Phaser object or semantic zone`);
  }
  for (const id of ["KW-SCOOPS-SERVE-BUTTON", "KW-SCOOPS-UNDO-BUTTON", "KW-SCOOPS-DISCARD-BUTTON", "KW-SCOOPS-COIN-COUNTER", "KW-SCOOPS-EXIT-BUTTON"]) {
    assert.ok(markup.includes(`data-sprite-ai-label=\"${id}\"`), `${id} is not bound to its DOM control`);
  }
  assert.match(scene, /data-sprite-ai-label="\$\{assetId\}"/);
  assert.match(presentation, /registerSouthShoreScoopsAssetManifest\(spriteAiInventory\)/);
});
