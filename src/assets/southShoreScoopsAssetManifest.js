import { SOUTH_SHORE_SCOOPS_PARTS } from "../data/southShoreScoops.js";

const SCENE = "south-shore-scoops";

function asset(assetId, label, {
  kind = "sprite",
  layer = "fixture",
  interactive = false,
  stateVariants = [],
  notes = "",
} = {}) {
  return Object.freeze({
    assetId,
    label,
    kind,
    scene: SCENE,
    layer,
    interactive,
    stateVariants: Object.freeze([...stateVariants]),
    notes,
    replacement: "sprite-ai",
  });
}

const STATIC_ASSETS = [
  asset("KW-SCOOPS-SCENE-BACKDROP", "South Shore Scoops — complete layered scene backdrop", { kind: "scene-composition", layer: "background", notes: "Composition reference only; do not bake interactive fixtures into this asset." }),
  asset("KW-SCOOPS-SHOP-WALLS", "South Shore Scoops — timber shop walls and counter surround", { kind: "background-layer", layer: "background" }),
  asset("KW-SCOOPS-AWNING", "South Shore Scoops — blue and cream striped awning", { kind: "background-layer", layer: "foreground" }),
  asset("KW-SCOOPS-TITLE-SIGN", "South Shore Scoops — timber title sign without readable text", { kind: "fixture", layer: "foreground" }),
  asset("KW-SCOOPS-TITLE-ANCHOR-LEFT", "South Shore Scoops — left title-sign anchor ornament", { kind: "decoration", layer: "foreground" }),
  asset("KW-SCOOPS-TITLE-ANCHOR-RIGHT", "South Shore Scoops — right title-sign anchor ornament", { kind: "decoration", layer: "foreground" }),
  asset("KW-SCOOPS-TITLE-STARFISH", "South Shore Scoops — title-sign starfish ornament", { kind: "decoration", layer: "foreground" }),
  asset("KW-SCOOPS-SEASIDE-SKY", "South Shore Scoops — seaside sky layer", { kind: "background-layer", layer: "background" }),
  asset("KW-SCOOPS-SEASIDE-WATER", "South Shore Scoops — sea and wave layer", { kind: "animated-background", layer: "background", stateVariants: ["calm-1", "calm-2", "calm-3"] }),
  asset("KW-SCOOPS-SEASIDE-BEACH", "South Shore Scoops — beach and shoreline layer", { kind: "background-layer", layer: "background" }),
  asset("KW-SCOOPS-SEASIDE-DISTANT-LAND", "South Shore Scoops — distant coast and lighthouse layer", { kind: "background-layer", layer: "background" }),
  asset("KW-SCOOPS-SEASIDE-SAILBOAT", "South Shore Scoops — distant sailboat", { kind: "animated-prop", layer: "background", stateVariants: ["idle", "sailing"] }),
  asset("KW-SCOOPS-CUSTOMER-WINDOW", "South Shore Scoops — customer service window frame", { kind: "fixture", layer: "midground" }),
  asset("KW-SCOOPS-SERVICE-LEDGE", "South Shore Scoops — blue customer service ledge", { kind: "fixture", layer: "midground" }),
  asset("KW-SCOOPS-MENU-BOARD", "South Shore Scoops — chalkboard menu without readable text", { kind: "decoration", layer: "foreground" }),
  asset("KW-SCOOPS-HANGING-ANCHOR-SIGN", "South Shore Scoops — hanging anchor plaque", { kind: "decoration", layer: "foreground" }),
  asset("KW-SCOOPS-PLANTER-LEFT", "South Shore Scoops — left flower planter", { kind: "decoration", layer: "foreground" }),
  asset("KW-SCOOPS-PLANTER-RIGHT", "South Shore Scoops — right flower planter", { kind: "decoration", layer: "foreground" }),
  asset("KW-SCOOPS-COUNTER-FRAME", "South Shore Scoops — timber preparation-counter frame", { kind: "fixture", layer: "midground" }),
  asset("KW-SCOOPS-CONTAINER-AREA", "South Shore Scoops — cone and container rack", { kind: "fixture", layer: "midground" }),
  asset("KW-SCOOPS-DRINK-AREA", "South Shore Scoops — cold-drink machine area", { kind: "fixture", layer: "midground" }),
  asset("KW-SCOOPS-MILKSHAKE-MACHINE", "South Shore Scoops — pink milkshake machine", { kind: "interactive-appliance", layer: "interactive", interactive: true, stateVariants: ["idle", "working", "ready"] }),
  asset("KW-SCOOPS-LEMONADE-MACHINE", "South Shore Scoops — yellow lemonade machine", { kind: "interactive-appliance", layer: "interactive", interactive: true, stateVariants: ["idle", "pouring", "ready"] }),
  asset("KW-SCOOPS-FLAVOUR-TUBS", "South Shore Scoops — six-tub ice cream cabinet", { kind: "fixture", layer: "midground" }),
  asset("KW-SCOOPS-FLAVOUR-TUB-STRAWBERRY", "South Shore Scoops — strawberry ice cream tub", { kind: "interactive-food", layer: "interactive", interactive: true, stateVariants: ["full", "scooped"] }),
  asset("KW-SCOOPS-FLAVOUR-TUB-CHOCOLATE", "South Shore Scoops — chocolate ice cream tub", { kind: "interactive-food", layer: "interactive", interactive: true, stateVariants: ["full", "scooped"] }),
  asset("KW-SCOOPS-FLAVOUR-TUB-VANILLA", "South Shore Scoops — vanilla ice cream tub", { kind: "interactive-food", layer: "interactive", interactive: true, stateVariants: ["full", "scooped"] }),
  asset("KW-SCOOPS-FLAVOUR-TUB-MINT", "South Shore Scoops — mint ice cream tub", { kind: "interactive-food", layer: "interactive", interactive: true, stateVariants: ["full", "scooped"] }),
  asset("KW-SCOOPS-FLAVOUR-TUB-GRAPE", "South Shore Scoops — grape ice cream tub", { kind: "interactive-food", layer: "interactive", interactive: true, stateVariants: ["full", "scooped"] }),
  asset("KW-SCOOPS-FLAVOUR-TUB-BLUEBERRY", "South Shore Scoops — blueberry ice cream tub", { kind: "interactive-food", layer: "interactive", interactive: true, stateVariants: ["full", "scooped"] }),
  asset("KW-SCOOPS-SAUCES-EXTRAS", "South Shore Scoops — sauce and topping counter", { kind: "fixture", layer: "midground" }),
  asset("KW-SCOOPS-SAUCE-BOTTLE-STRAWBERRY", "South Shore Scoops — strawberry sauce bottle", { kind: "interactive-food", layer: "interactive", interactive: true, stateVariants: ["idle", "squeezing"] }),
  asset("KW-SCOOPS-SAUCE-BOTTLE-CHOCOLATE", "South Shore Scoops — chocolate sauce bottle", { kind: "interactive-food", layer: "interactive", interactive: true, stateVariants: ["idle", "squeezing"] }),
  asset("KW-SCOOPS-SAUCE-BOTTLE-CARAMEL", "South Shore Scoops — caramel sauce bottle", { kind: "interactive-food", layer: "interactive", interactive: true, stateVariants: ["idle", "squeezing"] }),
  asset("KW-SCOOPS-TOPPING-BIN-SPRINKLES", "South Shore Scoops — sprinkles topping bin", { kind: "interactive-food", layer: "interactive", interactive: true }),
  asset("KW-SCOOPS-TOPPING-BIN-CHOCOLATE-BITS", "South Shore Scoops — chocolate bits topping bin", { kind: "interactive-food", layer: "interactive", interactive: true }),
  asset("KW-SCOOPS-TOPPING-BIN-WAFFLE-PIECES", "South Shore Scoops — waffle pieces topping bin", { kind: "decorative-food", layer: "fixture", notes: "Visible in the approved reference; not currently a distinct recipe part." }),
  asset("KW-SCOOPS-TOPPING-BIN-CHERRIES", "South Shore Scoops — cherry topping bin", { kind: "interactive-food", layer: "interactive", interactive: true }),
  asset("KW-SCOOPS-TOPPING-BIN-MARSHMALLOWS", "South Shore Scoops — marshmallow topping bin", { kind: "interactive-food", layer: "interactive", interactive: true }),
  asset("KW-SCOOPS-TOPPING-BIN-WAFER-STICKS", "South Shore Scoops — wafer-stick topping bin", { kind: "decorative-food", layer: "fixture", notes: "Visible in the approved reference; not currently a distinct recipe part." }),
  asset("KW-SCOOPS-ORDER-CARD", "South Shore Scoops — current-order card frame", { kind: "ui-panel", layer: "ui" }),
  asset("KW-SCOOPS-ORDER-CARD-PRODUCT", "South Shore Scoops — current-order product picture", { kind: "dynamic-product", layer: "ui", stateVariants: ["empty", "requested", "complete"] }),
  asset("KW-SCOOPS-ORDER-SLOT-1", "South Shore Scoops — order ingredient slot 1", { kind: "ui-slot", layer: "ui", stateVariants: ["empty", "filled", "complete"] }),
  asset("KW-SCOOPS-ORDER-SLOT-2", "South Shore Scoops — order ingredient slot 2", { kind: "ui-slot", layer: "ui", stateVariants: ["empty", "filled", "complete"] }),
  asset("KW-SCOOPS-ORDER-SLOT-3", "South Shore Scoops — order ingredient slot 3", { kind: "ui-slot", layer: "ui", stateVariants: ["empty", "filled", "complete"] }),
  asset("KW-SCOOPS-SERVE-BUTTON", "South Shore Scoops — Serve button", { kind: "ui-button", layer: "ui", interactive: true, stateVariants: ["normal", "pressed", "disabled"] }),
  asset("KW-SCOOPS-BUILD-MAT", "South Shore Scoops — dessert build mat", { kind: "interactive-surface", layer: "interactive", interactive: true, stateVariants: ["empty", "building"] }),
  asset("KW-SCOOPS-SERVING-TRAY", "South Shore Scoops — completed-dessert serving tray", { kind: "interactive-surface", layer: "interactive", interactive: true, stateVariants: ["empty", "one-item", "two-items", "three-items"] }),
  asset("KW-SCOOPS-BUILD-TRAY-SELECTED-PRODUCTS", "South Shore Scoops — live assembled dessert products", { kind: "dynamic-product-group", layer: "interactive", stateVariants: ["building", "on-tray", "selected-order"] }),
  asset("KW-SCOOPS-UNDO-BUTTON", "South Shore Scoops — Undo button", { kind: "ui-button", layer: "ui", interactive: true, stateVariants: ["normal", "pressed", "disabled"] }),
  asset("KW-SCOOPS-DISCARD-BUTTON", "South Shore Scoops — Discard button", { kind: "ui-button", layer: "ui", interactive: true, stateVariants: ["normal", "pressed", "disabled"] }),
  asset("KW-SCOOPS-ADD-TRAY-BUTTON", "South Shore Scoops — Add to tray button", { kind: "ui-button", layer: "ui", interactive: true, stateVariants: ["normal", "pressed", "disabled"] }),
  asset("KW-SCOOPS-COIN-COUNTER", "South Shore Scoops — coin counter", { kind: "ui-counter", layer: "ui" }),
  asset("KW-SCOOPS-LIVE-STARS", "South Shore Scoops — shift rating stars", { kind: "ui-counter", layer: "ui", stateVariants: ["zero", "one", "two", "three"] }),
  asset("KW-SCOOPS-EXIT-BUTTON", "South Shore Scoops — pause and exit control", { kind: "ui-button", layer: "ui", interactive: true, stateVariants: ["normal", "pressed"] }),
  asset("KW-SCOOPS-HUD", "South Shore Scoops — gameplay interface layer", { kind: "ui-panel", layer: "ui" }),
  asset("KW-SCOOPS-HUD-HEADER", "South Shore Scoops — compact gameplay header", { kind: "ui-panel", layer: "ui" }),
  asset("KW-SCOOPS-CUSTOMER-QUEUE", "South Shore Scoops — current and upcoming customer queue", { kind: "ui-panel", layer: "ui" }),
  asset("KW-SCOOPS-STATUS", "South Shore Scoops — contextual status message", { kind: "ui-notification", layer: "ui", stateVariants: ["neutral", "success", "error"] }),
  asset("KW-SCOOPS-PICKER-PANEL", "South Shore Scoops — development and campaign level picker", { kind: "ui-panel", layer: "ui" }),
  asset("KW-SCOOPS-LEVEL-SELECT", "South Shore Scoops — level selector", { kind: "ui-control", layer: "ui", interactive: true }),
  asset("KW-SCOOPS-START-BUTTON", "South Shore Scoops — open shift button", { kind: "ui-button", layer: "ui", interactive: true, stateVariants: ["normal", "pressed", "disabled"] }),
  asset("KW-SCOOPS-RESULT-PANEL", "South Shore Scoops — shift result panel", { kind: "ui-panel", layer: "ui", stateVariants: ["passed", "failed"] }),
  asset("KW-SCOOPS-REPLAY-BUTTON", "South Shore Scoops — replay shift button", { kind: "ui-button", layer: "ui", interactive: true }),
  asset("KW-SCOOPS-NEXT-BUTTON", "South Shore Scoops — next shift button", { kind: "ui-button", layer: "ui", interactive: true, stateVariants: ["normal", "disabled"] }),
  asset("KW-SCOOPS-RETURN-BUTTON", "South Shore Scoops — return to Willowmere button", { kind: "ui-button", layer: "ui", interactive: true }),
  asset("KW-SCOOPS-DYNAMIC-PRESENTATION", "South Shore Scoops — dynamic customer and product layer", { kind: "object-group", layer: "interactive" }),
  ...[1, 2, 3].flatMap((index) => [
    asset(`KW-SCOOPS-CUSTOMER-${index}-PIXEL`, `South Shore Scoops — customer ${index}`, { kind: "character", layer: "interactive", stateVariants: ["waiting", "happy", "leaving", "missed"] }),
    asset(`KW-SCOOPS-CUSTOMER-${index}-ORDER-BUBBLE`, `South Shore Scoops — customer ${index} order bubble`, { kind: "ui-bubble", layer: "ui", stateVariants: ["waiting", "current", "complete"] }),
    asset(`KW-SCOOPS-CUSTOMER-${index}-PRODUCT`, `South Shore Scoops — customer ${index} requested product picture`, { kind: "dynamic-product", layer: "ui" }),
  ]),
];

const PART_ASSETS = Object.entries(SOUTH_SHORE_SCOOPS_PARTS).map(([partId, part]) => asset(
  `KW-SCOOPS-PART-${partId}`,
  `South Shore Scoops — ${part.name}`,
  {
    kind: "interactive-food-part",
    layer: "interactive",
    interactive: true,
    stateVariants: ["available", "selected", "assembled"],
    notes: `Recipe part '${partId}' in the ${part.category} family.`,
  },
));

export const SOUTH_SHORE_SCOOPS_ASSET_MANIFEST = Object.freeze([...STATIC_ASSETS, ...PART_ASSETS]);

const BY_ID = new Map(SOUTH_SHORE_SCOOPS_ASSET_MANIFEST.map((entry) => [entry.assetId, entry]));
const REGISTERED_INVENTORIES = new WeakSet();

export function southShoreScoopsAsset(assetId) {
  return BY_ID.get(assetId) || null;
}

export function registerSouthShoreScoopsAssetManifest(inventory) {
  if (!inventory?.register) return 0;
  if (REGISTERED_INVENTORIES.has(inventory)) return SOUTH_SHORE_SCOOPS_ASSET_MANIFEST.length;
  REGISTERED_INVENTORIES.add(inventory);
  for (const entry of SOUTH_SHORE_SCOOPS_ASSET_MANIFEST) {
    inventory.register({
      id: entry.assetId,
      label: entry.label,
      kind: entry.kind,
      source: "scene-asset-manifest",
      scene: entry.scene,
      replacement: entry.replacement,
    });
  }
  return SOUTH_SHORE_SCOOPS_ASSET_MANIFEST.length;
}
