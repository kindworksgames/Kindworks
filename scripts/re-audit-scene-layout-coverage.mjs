import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import {
  PRODUCTION_SCENE_IDS,
  SCENE_LAYOUT_CATALOGUE,
} from "../src/visual/layouts/sceneLayoutCatalog.js";

const root = resolve(new URL("..", import.meta.url).pathname);
const output = process.argv[2] ? resolve(process.argv[2]) : null;

const sceneMeta = Object.freeze({
  BootScene: ["transition", "src/scenes/BootScene.js"],
  TownScene: ["world", "src/scenes/TownScene.js"],
  HouseInteriorScene: ["interior", "src/scenes/HouseInteriorScene.js"],
  VillageGrocerScene: ["shop", "src/scenes/VillageGrocerScene.js"],
  PawsWondersScene: ["shop", "src/scenes/PawsWondersScene.js"],
  HarbourGeneralScene: ["shop/business", "src/scenes/HarbourGeneralScene.js"],
  BakeryScene: ["restaurant/service", "src/scenes/BakeryScene.js"],
  CafeScene: ["restaurant/service", "src/scenes/CafeScene.js"],
  MorningMugScene: ["restaurant/service", "src/scenes/MorningMugScene.js"],
  RiversideKitchenScene: ["restaurant/service", "src/scenes/RiversideKitchenScene.js"],
  SouthShoreScoopsScene: ["restaurant/service", "src/scenes/SouthShoreScoopsScene.js"],
  RiverClearoutScene: ["cleanup-minigame", "src/scenes/RiverClearoutScene.js"],
  HouseRescueScene: ["cleanup-minigame", "src/scenes/HouseRescueScene.js"],
  WasteCollectionScene: ["cleanup-minigame", "src/scenes/WasteCollectionScene.js"],
  LawnCareScene: ["cleanup-minigame", "src/scenes/LawnCareScene.js"],
  BeachCleanupScene: ["cleanup-minigame", "src/scenes/BeachCleanupScene.js"],
  PlaygroundPowerwashScene: ["cleanup-minigame", "src/scenes/PlaygroundPowerwashScene.js"],
  FishingScene: ["action-minigame", "src/scenes/FishingScene.js"],
});

const layoutByScene = new Map(SCENE_LAYOUT_CATALOGUE.map((layout) => [layout.sceneId, layout]));
const placementPattern = /(?:\b(?:this|scene)\.add\.(?:image|sprite|text|rectangle|ellipse|circle|container|zone|tileSprite)\s*\(|\.(?:setPosition|setOrigin|setScale|setDisplaySize|setSize|setDepth|setAngle|setRotation)\s*\(|\.(?:fillRect|fillRoundedRect|fillCircle|fillEllipse|fillTriangle|strokeRect|strokeRoundedRect|strokeCircle|strokeEllipse|lineBetween|moveTo|lineTo)\s*\()/g;
const numberPattern = /(?:^|[^A-Za-z_$])[-+]?\d+(?:\.\d+)?/;

async function placementEvidence(file) {
  const source = await readFile(resolve(root, file), "utf8");
  const lines = source.split(/\r?\n/);
  const records = [];
  for (const [index, line] of lines.entries()) {
    placementPattern.lastIndex = 0;
    const occurrences = [...line.matchAll(placementPattern)].length;
    if (!occurrences || !numberPattern.test(line)) continue;
    records.push({ line: index + 1, occurrences, snippet: line.trim().slice(0, 300) });
  }
  return {
    file,
    sourceUsesSceneLayout: /sceneLayouts|visual\/layouts\/|resolveTownSceneDepth/.test(source),
    sourceRegistersInstances: /sceneLayouts\?*\.register|registerLayoutVisual/.test(source),
    literalPlacementLines: records.length,
    literalPlacementOccurrences: records.reduce((sum, record) => sum + record.occurrences, 0),
    examples: records.slice(0, 8),
  };
}

const sharedRestaurant = await placementEvidence("src/ui/RestaurantPresentation.js");
const scenes = [];
for (const sceneId of PRODUCTION_SCENE_IDS) {
  const [category, file] = sceneMeta[sceneId];
  const layout = layoutByScene.get(sceneId);
  const source = await placementEvidence(file);
  const usesRestaurantPresentation = category === "restaurant/service";
  const inheritedPlacementOccurrences = usesRestaurantPresentation ? sharedRestaurant.literalPlacementOccurrences : 0;
  const important = sceneId !== "BootScene";
  const objectLevelDataDriven = Boolean(layout?.instances?.length && source.sourceRegistersInstances);
  scenes.push({
    sceneId,
    category,
    file,
    layoutId: layout?.id || null,
    layoutKind: layout?.layoutKind || "object-layout",
    objectLevelInstances: layout?.instances?.length || 0,
    stableSurfaces: layout?.surfaces?.length || 0,
    depthPolicies: layout?.depthPolicies?.length || 0,
    sourceUsesSceneLayout: source.sourceUsesSceneLayout,
    sourceRegistersInstances: source.sourceRegistersInstances,
    directLiteralPlacementLines: source.literalPlacementLines,
    directLiteralPlacementOccurrences: source.literalPlacementOccurrences,
    inheritedSharedPlacementOccurrences: inheritedPlacementOccurrences,
    important,
    objectLevelDataDriven,
    coverageStatus: !important ? "TRANSITION-BOUNDARY" : objectLevelDataDriven ? "PARTIAL-PILOT" : "SURFACE-ONLY/UNDOCUMENTED-PLACEMENT",
    examples: source.examples,
  });
}

const globalLayout = layoutByScene.get("GlobalUiSurfaces");
const style = await readFile(resolve(root, "src/style.css"), "utf8");
const cssPlacementLines = style.split(/\r?\n/).filter((line) => /\b(?:top|right|bottom|left|width|height|transform|translate|grid-template|gap|padding|margin)\s*:/.test(line) && numberPattern.test(line));

const evidence = {
  generatedAt: new Date().toISOString(),
  repository: root,
  method: "Fresh source scan; catalogue names are not treated as object-placement coverage.",
  totals: {
    productionScenes: PRODUCTION_SCENE_IDS.length,
    importantPlayerVisibleScenes: scenes.filter(({ important }) => important).length,
    catalogueSceneEntries: scenes.filter(({ layoutId }) => layoutId).length,
    objectLevelDataDrivenScenes: scenes.filter(({ important, objectLevelDataDriven }) => important && objectLevelDataDriven).length,
    surfaceOnlyImportantScenes: scenes.filter(({ important, objectLevelDataDriven }) => important && !objectLevelDataDriven).length,
    objectLevelCoveragePercent: Number((100 * scenes.filter(({ important, objectLevelDataDriven }) => important && objectLevelDataDriven).length / scenes.filter(({ important }) => important).length).toFixed(1)),
    directSceneLiteralPlacementOccurrences: scenes.reduce((sum, scene) => sum + scene.directLiteralPlacementOccurrences, 0),
    sharedRestaurantLiteralPlacementOccurrences: sharedRestaurant.literalPlacementOccurrences,
    globalUiSurfaces: globalLayout?.surfaces?.length || 0,
    globalCssPlacementLines: cssPlacementLines.length,
  },
  scenes,
  sharedRenderers: { restaurantPresentation: sharedRestaurant },
  globalUi: {
    layoutId: globalLayout?.id || null,
    stableSurfaces: globalLayout?.surfaces?.length || 0,
    objectLevelInstances: globalLayout?.instances?.length || 0,
    cssPlacementLines: cssPlacementLines.length,
    examples: cssPlacementLines.slice(0, 12),
  },
};

if (output) {
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
}

console.log(JSON.stringify(evidence.totals, null, 2));

