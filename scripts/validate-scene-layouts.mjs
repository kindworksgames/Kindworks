import { PRODUCTION_SCENE_IDS, SCENE_LAYOUT_CATALOGUE } from "../src/visual/layouts/sceneLayoutCatalog.js";
import { validateSceneLayoutCatalogue } from "../src/visual/layouts/sceneLayoutContracts.js";

const layouts = SCENE_LAYOUT_CATALOGUE;
const failures = [];
const validation = validateSceneLayoutCatalogue(layouts, { requiredSceneIds: PRODUCTION_SCENE_IDS });
for (const finding of validation.errors) failures.push(`${finding.layoutId}: [${finding.code}] ${finding.path}: ${finding.message}`);

if (failures.length) {
  console.error(`Scene-layout validation failed (${failures.length}):`);
  for (const finding of failures) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  const instances = layouts.reduce((total, layout) => total + layout.instances.length, 0);
  const zones = layouts.reduce((total, layout) => total + layout.zones.length, 0);
  console.log(`Scene layouts valid: ${layouts.length} layouts cover ${PRODUCTION_SCENE_IDS.length} production scenes, ${instances} stable instances, ${zones} named zones.`);
}
