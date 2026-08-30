export const VISUAL_REGISTRY_SCHEMA_VERSION = 1;
export const VISUAL_DEFINITION_SCHEMA_VERSION = 1;

export const VISUAL_RENDER_TARGETS = Object.freeze({
  PHASER: "phaser",
  DOM: "dom",
  CANVAS: "canvas",
});

export const VISUAL_ASSET_KINDS = Object.freeze({
  IMAGE: "image",
  SPRITESHEET: "spritesheet",
  ATLAS: "atlas",
  AUDIO: "audio",
  GENERATED_TEXTURE_FAMILY: "generated-texture-family",
  GENERATED_FALLBACK: "generated-fallback",
  PROCEDURAL: "procedural",
});

export const VISUAL_ASSET_REQUIREDNESS = Object.freeze({
  REQUIRED: "required",
  OPTIONAL: "optional",
  GAMEPLAY_CRITICAL: "gameplay-critical",
});

export const VISUAL_CACHE_SCOPES = Object.freeze({
  SHARED: "shared",
  SCENE: "scene",
});

export const VISUAL_MAX_TEXTURE_DIMENSION = 4096;

export const VISUAL_GEOMETRY_KINDS = Object.freeze({
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
  POLYGON: "polygon",
});

export const VISUAL_FALLBACK_MODES = Object.freeze({
  DEVELOPMENT: "development-visible",
  PRODUCTION: "production-safe",
});

export function createRectGeometry(x, y, width, height) {
  return Object.freeze({
    schemaVersion: VISUAL_DEFINITION_SCHEMA_VERSION,
    kind: VISUAL_GEOMETRY_KINDS.RECTANGLE,
    x,
    y,
    width,
    height,
  });
}

export function createCircleGeometry(x, y, radius) {
  return Object.freeze({
    schemaVersion: VISUAL_DEFINITION_SCHEMA_VERSION,
    kind: VISUAL_GEOMETRY_KINDS.CIRCLE,
    x,
    y,
    radius,
  });
}

export function createVisualGeometry({ visual, collision = null, navigation = null, interaction = null, touch = null }) {
  return Object.freeze({
    schemaVersion: VISUAL_DEFINITION_SCHEMA_VERSION,
    visual,
    collision,
    navigation,
    interaction,
    touch,
  });
}
