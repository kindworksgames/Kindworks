import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { FISHING_SCENE_LAYOUT } from "../src/visual/layouts/fishingSceneLayout.js";
import { PRODUCTION_SCENE_IDS, SCENE_LAYOUT_CATALOGUE } from "../src/visual/layouts/sceneLayoutCatalog.js";
import {
  createSceneLayout,
  moveSceneLayoutInstance,
  validateSceneLayout,
} from "../src/visual/layouts/sceneLayoutContracts.js";
import {
  resolveDisplayMetrics,
  resolveGroundDepth,
  DEPTH_LAYER_IDS,
} from "../src/visual/scale/scaleSystem.js";

const projectRoot = resolve(new URL("..", import.meta.url).pathname);
const outputPath = process.argv[2] ? resolve(process.argv[2]) : null;
const clone = (value) => structuredClone(value);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

const sourceFiles = (await walk(join(projectRoot, "src")))
  .filter((file) => [".js", ".css"].includes(extname(file)))
  .concat(join(projectRoot, "index.html"));

const transformPatterns = Object.freeze([
  ["position", /(?:\.add\.(?:image|sprite|text|rectangle|ellipse|circle|container|zone|tileSprite)\s*\(|\.setPosition\s*\(|\b(?:x|y)\s*:\s*)/g],
  ["origin", /\.setOrigin\s*\(|\borigin(?:X|Y)?\s*:/g],
  ["scale-or-size", /\.(?:setScale|setDisplaySize|setSize)\s*\(|\b(?:scale|scaleX|scaleY|width|height)\s*:/g],
  ["rotation-or-flip", /\.(?:setAngle|setRotation|setFlip|setFlipX|setFlipY)\s*\(|\b(?:angle|rotation|flipX|flipY)\s*:/g],
  ["depth", /\.setDepth\s*\(|\bdepth\s*:/g],
  ["appearance-state", /\.(?:setVisible|setAlpha|setTint|clearTint|play)\s*\(|\b(?:visible|alpha|tint|animation|variant|state)\s*:/g],
  ["graphics-geometry", /\.(?:fillRect|fillRoundedRect|fillCircle|fillEllipse|fillTriangle|strokeRect|strokeRoundedRect|strokeCircle|strokeEllipse|lineBetween|arc|moveTo|lineTo)\s*\(/g],
  ["interaction-geometry", /\.(?:setInteractive|setHitArea)\s*\(|\b(?:hitArea|interactionRadius|collision|navigation|touch)\s*:/g],
]);

const cssPatterns = Object.freeze([
  ["responsive-breakpoint", /@media\s*\([^)]*(?:width|height|aspect-ratio|orientation|pointer)[^)]*\)/g],
  ["css-placement", /\b(?:inset|top|right|bottom|left|width|height|min-width|max-width|min-height|max-height|transform|translate|grid-template-columns|grid-template-rows|gap|padding|margin)\s*:/g],
]);

const inventory = [];
const perFile = {};
for (const absolute of sourceFiles) {
  const file = relative(projectRoot, absolute);
  const text = await readFile(absolute, "utf8");
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const patterns = extname(absolute) === ".css" ? cssPatterns : transformPatterns;
    for (const [category, pattern] of patterns) {
      pattern.lastIndex = 0;
      const matches = [...line.matchAll(pattern)];
      if (!matches.length) continue;
      const record = {
        file,
        line: index + 1,
        category,
        occurrences: matches.length,
        scope: file.includes("/dev/") || file.includes("ScaleCalibrationScene") ? "development" : "production",
        migrationClass: category === "responsive-breakpoint"
          ? "responsive-contract-candidate"
          : category === "interaction-geometry"
            ? "gameplay-geometry-review-required"
            : "scene-layout-or-prefab-candidate",
        snippet: line.trim().slice(0, 360),
      };
      inventory.push(record);
      perFile[file] ||= { total: 0, categories: {} };
      perFile[file].total += matches.length;
      perFile[file].categories[category] = (perFile[file].categories[category] || 0) + matches.length;
    }
  }
}

const probe = (id, expected, mutate) => {
  const layout = clone(FISHING_SCENE_LAYOUT);
  mutate(layout);
  const result = validateSceneLayout(layout);
  return {
    id,
    expected,
    accepted: result.ok,
    errorCodes: result.errors.map(({ code }) => code),
    verdict: expected === "accept" ? (result.ok ? "PASS" : "FAIL") : (!result.ok ? "PASS" : "FAIL"),
  };
};

const probes = [
  probe("baseline-valid", "accept", () => {}),
  probe("duplicate-instance-id", "reject", (layout) => layout.instances.push(clone(layout.instances[0]))),
  probe("missing-prefab-reference", "reject", (layout) => { layout.instances[0].prefabId = "prefab.missing"; }),
  probe("unknown-visual-field", "reject", (layout) => { layout.instances[0].visual.uncontractedProperty = 1; }),
  probe("origin-outside-normalized-range", "reject", (layout) => { layout.instances[0].visual.origin.x = 8; }),
  probe("negative-scale", "reject", (layout) => { layout.instances[0].visual.scale = -4; }),
  probe("alpha-outside-range", "reject", (layout) => { layout.instances[0].visual.alpha = 5; }),
  probe("missing-parent-reference", "reject", (layout) => { layout.instances[0].parentId = "instance.missing"; }),
  probe("invalid-safe-area-edge", "reject", (layout) => { layout.instances[0].responsiveAnchor = { mode: "safe-area", edge: "banana" }; }),
  probe("mutated-locked-gameplay-zone", "reject", (layout) => {
    layout.zones.find(({ id }) => id === "zone.fishing.water").geometry.x += 100;
  }),
  probe("oversized-visible-bounds", "reject", (layout) => {
    layout.instances.find(({ id }) => id === "instance.fishing.location.title").visual.bounds = { width: 999999, height: 999999 };
  }),
  probe("nondeterministic-function-condition", "reject", (layout) => {
    layout.instances[0].activeWhen = () => Math.random() > 0.5;
  }),
];

const visualMove = moveSceneLayoutInstance(
  FISHING_SCENE_LAYOUT,
  FISHING_SCENE_LAYOUT.instances[0].id,
  { x: 649, y: 367 },
  { gridSize: 8 },
);
const geometryDigest = (layout) => JSON.stringify({
  zones: layout.zones,
  sockets: layout.sockets,
  collisions: layout.collisionReferences,
  navigation: layout.navigationReferences,
  interactions: layout.interactionReferences,
});

const mutableDefinition = clone(FISHING_SCENE_LAYOUT);
const shallowFrozenLayout = createSceneLayout(mutableDefinition);
const beforeNestedMutation = shallowFrozenLayout.instances[0].visual.position.x;
let nestedMutationAccepted = false;
try {
  shallowFrozenLayout.instances[0].visual.position.x += 1;
  nestedMutationAccepted = shallowFrozenLayout.instances[0].visual.position.x === beforeNestedMutation + 1;
} catch {
  nestedMutationAccepted = false;
}

const baseMetrics = resolveDisplayMetrics({
  logicalBounds: { x: -27, y: -54, width: 54, height: 54 },
  scalePolicy: { x: 1, y: 1 },
  technical: { width: 54, height: 54, nativePixelsPerLogicalUnit: 1 },
});
const oversizedCanvasMetrics = resolveDisplayMetrics({
  logicalBounds: { x: -27, y: -54, width: 54, height: 54 },
  scalePolicy: { x: 1, y: 1 },
  technical: { width: 432, height: 432, nativePixelsPerLogicalUnit: 8 },
});

const sourceTexts = await Promise.all(sourceFiles.map(async (file) => [relative(projectRoot, file), await readFile(file, "utf8")]));
const sceneFiles = sourceTexts
  .filter(([file, text]) => file.startsWith("src/scenes/") && /extends Phaser\.Scene/.test(text))
  .map(([file, text]) => ({
    file,
    sceneId: text.match(/super\((?:\{\s*key:\s*)?["']([^"']+)/)?.[1] || file.split("/").pop().replace(/\.js$/, ""),
    importsSceneLayout: /visual\/layouts\//.test(text),
    hardCodedTransformOccurrences: perFile[file]?.total || 0,
    domBacked: /document\.(?:querySelector|getElementById)/.test(text),
    proceduralPhaser: /this\.add\.(?:graphics|rectangle|ellipse|circle|text)/.test(text),
  }))
  .sort((a, b) => a.sceneId.localeCompare(b.sceneId));

const totalsByCategory = {};
for (const record of inventory) totalsByCategory[record.category] = (totalsByCategory[record.category] || 0) + record.occurrences;

const evidence = {
  generatedAt: new Date().toISOString(),
  repository: projectRoot,
  sceneLayoutCoverage: {
    runtimeAndDevelopmentSceneClasses: sceneFiles.length,
    layoutDefinitionsValidatedByBuild: SCENE_LAYOUT_CATALOGUE.length,
    productionScenesCoveredByRuntimeCatalogue: PRODUCTION_SCENE_IDS.length,
    layoutConsumers: PRODUCTION_SCENE_IDS,
    sceneFiles,
  },
  hardCodedInventory: {
    records: inventory.length,
    occurrences: inventory.reduce((sum, entry) => sum + entry.occurrences, 0),
    productionOccurrences: inventory.filter(({ scope }) => scope === "production").reduce((sum, entry) => sum + entry.occurrences, 0),
    totalsByCategory,
    perFile,
    recordsDetail: inventory,
  },
  contractProbes: probes,
  separationProbes: {
    visualMoveAccepted: visualMove.ok,
    visualMoveSnappedPosition: visualMove.position,
    visualMovePreservedGameplayGeometry: visualMove.ok && geometryDigest(visualMove.layout) === geometryDigest(FISHING_SCENE_LAYOUT),
    rootFrozen: Object.isFrozen(shallowFrozenLayout),
    nestedInstanceFrozen: Object.isFrozen(shallowFrozenLayout.instances[0]),
    nestedVisualFrozen: Object.isFrozen(shallowFrozenLayout.instances[0].visual),
    nestedMutationAccepted,
    oversizedSourceCanvasPreservesLogicalDisplay: baseMetrics.width === oversizedCanvasMetrics.width && baseMetrics.height === oversizedCanvasMetrics.height,
    baseMetrics,
    oversizedCanvasMetrics,
    ySort: {
      behind: resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, 100) < resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, 200),
      y100: resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, 100),
      y200: resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, 200),
    },
  },
};

const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
if (outputPath) {
  await mkdir(resolve(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, serialized);
  console.log(`Scene-layout audit evidence written to ${outputPath}`);
}
console.log(JSON.stringify({
  scenes: evidence.sceneLayoutCoverage.runtimeAndDevelopmentSceneClasses,
  layouts: evidence.sceneLayoutCoverage.layoutDefinitionsValidatedByBuild,
  layoutConsumers: evidence.sceneLayoutCoverage.layoutConsumers,
  hardCodedRecords: evidence.hardCodedInventory.records,
  hardCodedOccurrences: evidence.hardCodedInventory.occurrences,
  failedContractProbes: probes.filter(({ verdict }) => verdict === "FAIL").map(({ id }) => id),
  separationProbes: evidence.separationProbes,
}, null, 2));
