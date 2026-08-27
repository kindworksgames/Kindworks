import {
  PARITY_ACTIVITIES,
  PARITY_SOURCE_SHA256,
  PARITY_VIEWPORTS,
  getParityCertification,
} from "./parityCertification.js";
import {
  GAME_STATE_SCHEMA_VERSION,
  LEGACY_CURRENT_VERSION,
  LEGACY_MIN_VERSION,
  LEGACY_COMPATIBLE_VERSIONS,
  LEGACY_SAVE_KEY,
  PHASER_SAVE_KEY,
} from "../state/constants.js";

export const RELEASE_CANDIDATE_VERSION = 1;
export const RELEASE_CANDIDATE_MIN_TOUCH_TARGET = 44;

export const RELEASE_CANDIDATE_JOURNEYS = Object.freeze([
  ["new-player", "New player welcome", ["name-town", "create-resident", "select-home", "starter-coins", "first-job-checklist"]],
  ["town", "Town exploration", ["walk", "touch-move", "zoom", "nearby-interaction", "modal-return"]],
  ["restoration-work", "Restoration activities", ["waste", "lawn", "river", "house-rescue", "beach", "powerwash"]],
  ["food-service", "Food-service venues", ["bakery", "cafe", "morning-mug", "riverside-kitchen", "scoops"]],
  ["fishing", "Fishing and collections", ["fishing", "magnet", "aquarium", "safe-release", "daily-limits"]],
  ["community", "Residents, animals and homes", ["stories", "animal-friends", "paws-wonders", "home-interior", "homeowner-gifts"]],
  ["economy", "Economy and town ownership", ["shop", "inventory", "equipment", "farming", "town-placement", "harbour-general"]],
  ["restoration", "Town restoration", ["eight-milestones", "reveal", "gift", "festival", "cinema"]],
  ["save-reload", "Save, exit and continue", ["verified-save", "reload", "backup", "recovery", "active-session"]],
  ["legacy-import", "Protected HTML save copy", ["inspect", "copy", "reconcile", "reload", "no-replay", "source-untouched"]],
  ["mobile", "Responsive and input", ["desktop", "mobile-landscape", "mobile-portrait", "touch-targets", "orientation", "no-overflow"]],
  ["production-safety", "Production safety", ["commerce-fail-closed", "trusted-time", "no-personalized-ads", "clean-console", "production-build"]],
].map(([id, title, checkpoints]) => Object.freeze({ id, title, checkpoints: Object.freeze(checkpoints) })));

export const RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS = Object.freeze(
  PARITY_ACTIVITIES.flatMap((activity) => activity.levels
    ? activity.representativeLevels.map((level) => Object.freeze({ activityId: activity.id, scene: activity.scene, level }))
    : [Object.freeze({ activityId: activity.id, scene: activity.scene, mode: activity.id })]),
);

export const RELEASE_CANDIDATE_VIEWPORTS = Object.freeze(
  PARITY_VIEWPORTS.map((viewport) => Object.freeze({
    ...viewport,
    minimumTouchTarget: viewport.id === "desktop" ? null : RELEASE_CANDIDATE_MIN_TOUCH_TARGET,
    allowedPageOverflow: 0,
  })),
);

export function getReleaseCandidateCertification() {
  const parity = getParityCertification();
  const issues = [...parity.issues];
  if (!parity.ok) issues.push("Milestone 43 parity certification must pass first.");
  if (GAME_STATE_SCHEMA_VERSION !== 37) issues.push(`Expected save schema 37, found ${GAME_STATE_SCHEMA_VERSION}.`);
  if (LEGACY_COMPATIBLE_VERSIONS.length !== 71 || LEGACY_COMPATIBLE_VERSIONS[0] !== 12 || LEGACY_COMPATIBLE_VERSIONS.at(-1) !== 82) {
    issues.push("Protected HTML save support must cover every version from 12 through 82.");
  }
  if (PHASER_SAVE_KEY === LEGACY_SAVE_KEY) issues.push("Phaser and protected HTML saves must use separate storage keys.");
  if (RELEASE_CANDIDATE_JOURNEYS.length !== 12) issues.push("The release-candidate journey matrix must contain 12 journeys.");
  if (RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS.length !== 35) issues.push("The activity smoke matrix must contain 35 checkpoints.");
  if (RELEASE_CANDIDATE_VIEWPORTS.length !== 3) issues.push("Desktop, mobile landscape and mobile portrait gates are required.");
  return {
    milestone: 44,
    version: RELEASE_CANDIDATE_VERSION,
    ok: issues.length === 0,
    issues,
    sourceSha256: PARITY_SOURCE_SHA256,
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    legacyVersions: { first: LEGACY_MIN_VERSION, last: LEGACY_CURRENT_VERSION, count: LEGACY_COMPATIBLE_VERSIONS.length },
    saveNamespacesSeparate: PHASER_SAVE_KEY !== LEGACY_SAVE_KEY,
    journeyCount: RELEASE_CANDIDATE_JOURNEYS.length,
    journeys: RELEASE_CANDIDATE_JOURNEYS.map((journey) => ({ ...journey, checkpoints: [...journey.checkpoints] })),
    activityCheckpointCount: RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS.length,
    activityCheckpoints: RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS.map((checkpoint) => ({ ...checkpoint })),
    viewports: RELEASE_CANDIDATE_VIEWPORTS.map((viewport) => ({ ...viewport })),
    productionRule: "Purchases and trusted-time rewards remain fail-closed until their verified native/server bridges are connected.",
  };
}
