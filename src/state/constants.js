export const GAME_STATE_SCHEMA_VERSION = 20;
export const SUPPORTED_GAME_STATE_SCHEMA_VERSIONS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
export const PHASER_SAVE_FORMAT = "kindworks-phaser";
export const PHASER_SAVE_KEY = "kindworks_phaser_v1";
export const PHASER_BACKUP_KEY = "kindworks_phaser_v1_backup";
export const PHASER_RECOVERY_KEY = "kindworks_phaser_v1_recovery";
export const APP_VERSION = "0.1.0";

export const LEGACY_CURRENT_VERSION = 82;
export const LEGACY_MIN_VERSION = 12;
export const LEGACY_SAVE_KEY = "kindworks_living_town_v38";
export const LEGACY_BACKUP_KEY = "kindworks_living_town_v38_backup";
export const LEGACY_RECOVERY_KEY = "kindworks_living_town_v38_recovery";
export const LEGACY_SAVE_KEYS = Object.freeze(
  Array.from(
    { length: 37 - LEGACY_MIN_VERSION + 1 },
    (_, index) => `kindworks_living_town_v${37 - index}`,
  ),
);
export const LEGACY_COMPATIBLE_VERSIONS = Object.freeze(
  Array.from(
    { length: LEGACY_CURRENT_VERSION - LEGACY_MIN_VERSION + 1 },
    (_, index) => LEGACY_MIN_VERSION + index,
  ),
);

export const LEGACY_CANDIDATES = Object.freeze([
  { key: LEGACY_SAVE_KEY, kind: "current" },
  { key: LEGACY_BACKUP_KEY, kind: "backup" },
  ...LEGACY_SAVE_KEYS.map((key) => ({ key, kind: "legacy" })),
]);
