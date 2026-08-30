import {
  CANONICAL_LANDSCAPE,
  SUPPORTED_LANDSCAPE_VIEWPORTS,
  validateScaleSystem,
} from "../src/visual/scale/scaleSystem.js";
import {
  SCALE_CALIBRATION_OBJECTS,
  validateCalibrationFixtures,
} from "../src/visual/scale/calibrationFixtures.js";
import { FISHING_SCENE_LAYOUT } from "../src/visual/layouts/fishingSceneLayout.js";

const scaleValidation = validateScaleSystem();
const scaleIssues = scaleValidation.errors;
const fixtureValidation = validateCalibrationFixtures(SCALE_CALIBRATION_OBJECTS);
const fixtureIssues = fixtureValidation.errors;
const layoutIssues = [];

if (FISHING_SCENE_LAYOUT.canonicalSize.width !== CANONICAL_LANDSCAPE.width
  || FISHING_SCENE_LAYOUT.canonicalSize.height !== CANONICAL_LANDSCAPE.height) {
  layoutIssues.push("Fishing canonical viewport does not match the scale system.");
}

if (FISHING_SCENE_LAYOUT.scaleSystem?.profileId !== CANONICAL_LANDSCAPE.id) {
  layoutIssues.push("Fishing layout does not reference the canonical scale profile.");
}

const issues = [...scaleIssues, ...fixtureIssues, ...layoutIssues];
if (issues.length > 0) {
  console.error("Scale-system validation failed:");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(
    `Scale-system validation passed: ${CANONICAL_LANDSCAPE.width}x${CANONICAL_LANDSCAPE.height}, `
      + `${SUPPORTED_LANDSCAPE_VIEWPORTS.length} supported profiles, `
      + `${Object.keys(SCALE_CALIBRATION_OBJECTS).length} calibration specimens.`,
  );
}
