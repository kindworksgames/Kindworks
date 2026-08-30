import { access, readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import sharp from "sharp";
import {
  ARTWORK_SPEC_SCHEMA_VERSION,
  ARTWORK_WORKFLOW_STATUSES,
  validateArtworkWorkflowHistory,
} from "../../src/visual/artwork/artworkWorkflow.js";

const SEMANTIC_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRODUCTION_STATUSES = new Set(["specified", "generation-ready", "generated", "review", "revision", "approval", "runtime-ready", "integrated", "verified"]);
const error = (errors, code, message, path, assetOrData = null) => {
  const data = typeof assetOrData === "string" ? { assetId: assetOrData } : assetOrData || {};
  errors.push(Object.freeze({
    code,
    message,
    path,
    assetId: data.assetId ?? null,
    schemaVersion: data.schemaVersion ?? ARTWORK_SPEC_SCHEMA_VERSION,
    expected: data.expected ?? null,
    actual: data.actual ?? null,
    affectedScenes: Object.freeze([...(data.affectedScenes || [])]),
    remediation: data.remediation ?? "Correct the asset contract or candidate and run the validator again.",
  }));
};

const closedKeys = (value, allowed, errors, path, asset) => {
  for (const key of Object.keys(value || {})) if (!allowed.includes(key)) error(errors, "unknown-contract-field", `${path}.${key} is not defined by artwork schema v${ARTWORK_SPEC_SCHEMA_VERSION}.`, `${path}.${key}`, {
    assetId: asset?.semanticId,
    expected: allowed,
    actual: key,
    affectedScenes: asset?.intendedScenes,
    remediation: "Remove the field or introduce it through a reviewed schema-version update.",
  });
};

const duplicateTokens = (values = []) => values.filter((value, index) => values.indexOf(value) !== index);
const validTokenList = (values, errors, path, asset, { allowEmpty = true } = {}) => {
  if (!Array.isArray(values) || (!allowEmpty && values.length === 0)) {
    error(errors, "invalid-token-list", `${path} must be ${allowEmpty ? "an" : "a non-empty"} array.`, path, { assetId: asset.semanticId, expected: "unique kebab-case tokens", actual: values, affectedScenes: asset.intendedScenes });
    return;
  }
  if (duplicateTokens(values).length) error(errors, "duplicate-contract-token", `${path} contains duplicate values.`, path, { assetId: asset.semanticId, expected: "unique tokens", actual: duplicateTokens(values), affectedScenes: asset.intendedScenes });
  for (const value of values) if (!TOKEN_PATTERN.test(String(value))) error(errors, "invalid-contract-token", `${path} contains invalid token ${value}.`, path, { assetId: asset.semanticId, expected: TOKEN_PATTERN.source, actual: value, affectedScenes: asset.intendedScenes });
};

const uint24LE = (buffer, offset) => buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);

export function inspectAudioBuffer(buffer, formatHint = "") {
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WAVE") return Object.freeze({ format: "wav" });
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "OggS") return Object.freeze({ format: "ogg" });
  if (buffer.length >= 3 && buffer.subarray(0, 3).toString("ascii") === "ID3") return Object.freeze({ format: "mp3" });
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return Object.freeze({ format: "mp3" });
  return Object.freeze({ format: "unknown", hintedFormat: String(formatHint).toLowerCase() || null });
}

export function inspectImageBuffer(buffer, formatHint = "") {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.length >= 26 && buffer.subarray(0, 8).toString("hex") === pngSignature) {
    const bitDepth = buffer[24];
    const colorType = buffer[25];
    const colourMode = ({ 0: "GRAYSCALE", 2: "RGB", 3: "INDEXED", 4: "GRAYSCALE_ALPHA", 6: "RGBA" })[colorType] || "UNKNOWN";
    const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
    let opaqueBounds = colorType === 4 || colorType === 6 ? inspectPngOpaqueBounds(buffer, { width, height, bitDepth, colorType }) : { x: 0, y: 0, width, height };
    return Object.freeze({
      format: "png",
      width,
      height,
      alpha: colorType === 4 || colorType === 6,
      bitDepth,
      colourMode,
      opaqueBounds,
    });
  }
  if (buffer.length >= 30 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    const chunk = buffer.subarray(12, 16).toString("ascii");
    if (chunk === "VP8L" && buffer[20] === 0x2f) {
      const bits = buffer.readUInt32LE(21);
      const width = (bits & 0x3fff) + 1, height = ((bits >>> 14) & 0x3fff) + 1, alpha = Boolean((bits >>> 28) & 1);
      return Object.freeze({ format: "webp", width, height, alpha, bitDepth: 8, colourMode: alpha ? "RGBA" : "RGB", opaqueBounds: alpha ? null : { x: 0, y: 0, width, height } });
    }
    if (chunk === "VP8X") {
      const width = uint24LE(buffer, 24) + 1, height = uint24LE(buffer, 27) + 1, alpha = Boolean(buffer[20] & 0x10);
      return Object.freeze({ format: "webp", width, height, alpha, bitDepth: 8, colourMode: alpha ? "RGBA" : "RGB", opaqueBounds: alpha ? null : { x: 0, y: 0, width, height } });
    }
    if (chunk === "VP8 " && buffer.subarray(23, 26).toString("hex") === "9d012a") {
      const width = buffer.readUInt16LE(26) & 0x3fff, height = buffer.readUInt16LE(28) & 0x3fff;
      return Object.freeze({ format: "webp", width, height, alpha: false, bitDepth: 8, colourMode: "RGB", opaqueBounds: { x: 0, y: 0, width, height } });
    }
  }
  return Object.freeze({ format: formatHint || "unknown", width: null, height: null, alpha: null, bitDepth: null, colourMode: null, opaqueBounds: null });
}

function inspectPngOpaqueBounds(buffer, { width, height, bitDepth, colorType }) {
  if (bitDepth !== 8 || ![4, 6].includes(colorType) || buffer[28] !== 0) return null;
  const chunks = [];
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const length = buffer.readUInt32BE(offset), type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
    if (type === "IEND") break;
  }
  try {
    const raw = inflateSync(Buffer.concat(chunks));
    const bytesPerPixel = colorType === 6 ? 4 : 2, stride = width * bytesPerPixel;
    let previous = Buffer.alloc(stride), cursor = 0, minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y += 1) {
      const filter = raw[cursor++], row = Buffer.from(raw.subarray(cursor, cursor + stride)); cursor += stride;
      for (let index = 0; index < stride; index += 1) {
        const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
        const up = previous[index] || 0;
        const upLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;
        if (filter === 1) row[index] = (row[index] + left) & 255;
        else if (filter === 2) row[index] = (row[index] + up) & 255;
        else if (filter === 3) row[index] = (row[index] + Math.floor((left + up) / 2)) & 255;
        else if (filter === 4) {
          const p = left + up - upLeft, pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
          row[index] = (row[index] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
        } else if (filter !== 0) return null;
      }
      const alphaOffset = colorType === 6 ? 3 : 1;
      for (let x = 0; x < width; x += 1) if (row[x * bytesPerPixel + alphaOffset] > 0) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
      previous = row;
    }
    return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  } catch { return null; }
}

async function inspectDecodedImageBuffer(buffer) {
  const instance = sharp(buffer, { failOn: "error", limitInputPixels: 67_108_864 });
  const metadata = await instance.metadata();
  if (!metadata.width || !metadata.height || !["png", "webp"].includes(metadata.format)) throw new Error("Decoded image is not a supported PNG or WebP.");
  const { data, info } = await instance.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) {
    if (data[(y * info.width + x) * info.channels + info.channels - 1] === 0) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const alpha = metadata.hasAlpha === true;
  const bitDepth = metadata.depth === "ushort" ? 16 : 8;
  const colourMode = alpha ? "RGBA" : metadata.space === "b-w" ? "GRAYSCALE" : "RGB";
  return Object.freeze({
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    alpha,
    bitDepth,
    colourMode,
    opaqueBounds: maxX < 0 ? null : Object.freeze({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }),
  });
}

export async function inspectImageFile(file) {
  return inspectDecodedImageBuffer(await readFile(file));
}

async function pathUsesExactCase(root, relativeFile) {
  let current = resolve(root);
  for (const segment of String(relativeFile).split("/").filter(Boolean)) {
    const entries = await readdir(current);
    if (!entries.includes(segment)) return false;
    current = resolve(current, segment);
  }
  return true;
}

const finite = (value) => Number.isFinite(value);
function validateGeometryShape(shape, errors, path, asset) {
  if (shape == null) return;
  if (shape.kind === "rectangle") {
    if (![shape.x, shape.y, shape.width, shape.height].every(finite) || shape.width <= 0 || shape.height <= 0) error(errors, "invalid-geometry-shape", `${asset.semanticId} rectangle geometry requires finite x/y and positive width/height.`, path, asset.semanticId);
    return;
  }
  if (shape.kind === "circle") {
    if (![shape.x, shape.y, shape.radius].every(finite) || shape.radius <= 0) error(errors, "invalid-geometry-shape", `${asset.semanticId} circle geometry requires finite x/y and a positive radius.`, path, asset.semanticId);
    return;
  }
  error(errors, "invalid-geometry-shape", `${asset.semanticId} uses unsupported geometry kind ${shape.kind}.`, path, { assetId: asset.semanticId, expected: ["rectangle", "circle"], actual: shape.kind, affectedScenes: asset.intendedScenes });
}

function validateGeometry(asset, errors, path) {
  const geometry = asset.geometry;
  for (const key of ["visual", "collision", "navigation", "interaction", "touch"]) {
    if (!Object.prototype.hasOwnProperty.call(geometry || {}, key)) error(errors, "missing-geometry-channel", `${asset.semanticId} must explicitly declare ${key} geometry.`, `${path}.geometry.${key}`, asset.semanticId);
  }
  if (!(geometry?.visual?.width > 0) || !(geometry?.visual?.height > 0)) error(errors, "invalid-visual-geometry", `${asset.semanticId} requires positive logical visual bounds.`, `${path}.geometry.visual`, asset.semanticId);
  for (const key of ["visual", "collision", "navigation", "interaction", "touch"]) validateGeometryShape(geometry?.[key], errors, `${path}.geometry.${key}`, asset);
  const gameplayGeometry = Object.fromEntries(["collision", "navigation", "interaction", "touch"].map((key) => [key, geometry?.[key] ?? null]));
  const digest = createHash("sha256").update(JSON.stringify(gameplayGeometry)).digest("hex");
  if (asset.validation?.gameplayGeometrySha256 !== digest) error(errors, "gameplay-geometry-digest-mismatch", `${asset.semanticId} gameplay geometry differs from its protected digest.`, `${path}.validation.gameplayGeometrySha256`, {
    assetId: asset.semanticId, expected: digest, actual: asset.validation?.gameplayGeometrySha256, affectedScenes: asset.intendedScenes,
    remediation: "Restore the protected gameplay geometry. Artwork-only replacement must not alter collision, navigation, interaction, or touch geometry.",
  });
}

function validateSpriteSheet(asset, errors, path) {
  const output = asset.output || {};
  if (!["spritesheet", "effect-sheet"].includes(output.type)) {
    if (output.spriteSheet != null) error(errors, "unexpected-frame-grid", `${asset.semanticId} is not a spritesheet but declares a frame grid.`, `${path}.output.spriteSheet`, asset.semanticId);
    return;
  }
  const sheet = output.spriteSheet;
  if (!sheet) {
    error(errors, "missing-frame-grid", `${asset.semanticId} requires sprite-sheet metadata.`, `${path}.output.spriteSheet`, asset.semanticId);
    return;
  }
  const expectedFrames = Number(sheet.rows) * Number(sheet.columns);
  const padding = Number(sheet.padding || 0), spacing = Number(sheet.spacing || 0);
  if (![sheet.rows, sheet.columns, sheet.frameWidth, sheet.frameHeight].every((value) => Number.isInteger(value) && value > 0) || !Number.isInteger(padding) || padding < 0 || !Number.isInteger(spacing) || spacing < 0) error(errors, "invalid-frame-grid-metadata", `${asset.semanticId} requires positive integer frame geometry and non-negative padding/spacing.`, `${path}.output.spriteSheet`, asset.semanticId);
  const gridWidth = padding * 2 + sheet.frameWidth * sheet.columns + spacing * Math.max(0, sheet.columns - 1);
  const gridHeight = padding * 2 + sheet.frameHeight * sheet.rows + spacing * Math.max(0, sheet.rows - 1);
  if (gridWidth !== output.canvas?.width || gridHeight !== output.canvas?.height) error(errors, "frame-grid-mismatch", `${asset.semanticId} frame grid does not fill its declared canvas.`, `${path}.output.spriteSheet`, { assetId: asset.semanticId, expected: `${output.canvas?.width}x${output.canvas?.height}`, actual: `${gridWidth}x${gridHeight}`, affectedScenes: asset.intendedScenes });
  if (!Array.isArray(sheet.frameOrder) || sheet.frameOrder.length !== expectedFrames) error(errors, "frame-count-mismatch", `${asset.semanticId} declares ${expectedFrames} cells but ${sheet.frameOrder?.length || 0} frame-order entries.`, `${path}.output.spriteSheet.frameOrder`, asset.semanticId);
  if (new Set(sheet.frameOrder || []).size !== (sheet.frameOrder || []).length) error(errors, "duplicate-frame-name", `${asset.semanticId} frame order contains duplicate names.`, `${path}.output.spriteSheet.frameOrder`, asset.semanticId);
  validTokenList(sheet.actions, errors, `${path}.output.spriteSheet.actions`, asset, { allowEmpty: false });
  validTokenList(sheet.directions, errors, `${path}.output.spriteSheet.directions`, asset);
  for (const frame of sheet.frameOrder || []) {
    const [action, direction] = String(frame).split(".");
    if (!sheet.actions?.includes(action)) error(errors, "unknown-frame-action", `${asset.semanticId} frame ${frame} uses undeclared action ${action}.`, `${path}.output.spriteSheet.frameOrder`, asset.semanticId);
    if (direction && !sheet.directions?.includes(direction)) error(errors, "unknown-frame-direction", `${asset.semanticId} frame ${frame} uses undeclared direction ${direction}.`, `${path}.output.spriteSheet.frameOrder`, asset.semanticId);
  }
  if (output.atlas) {
    if (output.atlas.frames !== expectedFrames) error(errors, "atlas-frame-mismatch", `${asset.semanticId} atlas frame count disagrees with the sheet grid.`, `${path}.output.atlas`, asset.semanticId);
    if (!Array.isArray(output.atlas.frameNames) || new Set(output.atlas.frameNames).size !== output.atlas.frameNames.length) error(errors, "invalid-atlas-frame-names", `${asset.semanticId} atlas frame names must be unique.`, `${path}.output.atlas.frameNames`, asset.semanticId);
    for (const frame of sheet.frameOrder || []) if (!output.atlas.frameNames?.includes(frame)) error(errors, "missing-atlas-frame", `${asset.semanticId} atlas omits ${frame}.`, `${path}.output.atlas.frameNames`, { assetId: asset.semanticId, expected: frame, actual: output.atlas.frameNames, affectedScenes: asset.intendedScenes });
    if (output.atlas.allowTrim !== false || output.atlas.allowRotation !== false) error(errors, "unsafe-atlas-transform", `${asset.semanticId} atlas must forbid trimming and rotation.`, `${path}.output.atlas`, asset.semanticId);
  }
}

function validateStatesAndLayers(asset, errors, path) {
  const states = asset.states || [];
  const layers = asset.layers || [];
  validTokenList(states, errors, `${path}.states`, asset, { allowEmpty: false });
  validTokenList(asset.variants, errors, `${path}.variants`, asset, { allowEmpty: false });
  validTokenList(asset.directions, errors, `${path}.directions`, asset);
  const requiredStates = asset.validation?.requireStateNames || [], requiredDirections = asset.validation?.requireDirections || [];
  for (const state of requiredStates) if (!states.includes(state)) error(errors, "missing-required-state", `${asset.semanticId} omits required state ${state}.`, `${path}.states`, { assetId: asset.semanticId, expected: requiredStates, actual: states, affectedScenes: asset.intendedScenes });
  for (const direction of requiredDirections) if (!(asset.directions || []).includes(direction)) error(errors, "missing-required-direction", `${asset.semanticId} omits required direction ${direction}.`, `${path}.directions`, { assetId: asset.semanticId, expected: requiredDirections, actual: asset.directions, affectedScenes: asset.intendedScenes });
  const layerIds = new Set();
  const layerOrders = new Set();
  for (const [index, layer] of layers.entries()) {
    if (!layer.id || layerIds.has(layer.id)) error(errors, "duplicate-layer-id", `${asset.semanticId} contains a duplicate or missing layer id.`, `${path}.layers[${index}]`, asset.semanticId);
    layerIds.add(layer.id);
    if (!Number.isInteger(layer.order) || layerOrders.has(layer.order)) error(errors, "duplicate-layer-order", `${asset.semanticId} layers require unique integer orders.`, `${path}.layers[${index}].order`, asset.semanticId);
    layerOrders.add(layer.order);
    if (layer.canvasAlignment !== "full-canvas" && layer.canvasAlignment !== "frame-grid") error(errors, "invalid-layer-alignment", `${asset.semanticId}.${layer.id} has unsupported canvas alignment.`, `${path}.layers[${index}].canvasAlignment`, asset.semanticId);
    if (!["transparent-canvas", "opaque-canvas"].includes(layer.alphaAlignment)) error(errors, "invalid-layer-alpha-alignment", `${asset.semanticId}.${layer.id} has unsupported alpha alignment.`, `${path}.layers[${index}].alphaAlignment`, asset.semanticId);
    for (const state of layer.states || []) if (!states.includes(state)) error(errors, "unknown-layer-state", `${asset.semanticId}.${layer.id} references undeclared state ${state}.`, `${path}.layers[${index}].states`, asset.semanticId);
  }
  for (const state of states) if (!layers.some((layer) => layer.states?.includes(state))) error(errors, "missing-layer-state", `${asset.semanticId} state ${state} has no canvas-aligned layer.`, `${path}.states`, asset.semanticId);
}

function validateAnchorSocketsAndAnimations(asset, errors, path) {
  const normalized = asset.anchor?.normalized;
  if (!Number.isFinite(normalized?.x) || !Number.isFinite(normalized?.y) || normalized.x < 0 || normalized.x > 1 || normalized.y < 0 || normalized.y > 1) error(errors, "invalid-anchor", `${asset.semanticId} requires a normalized anchor inside its canvas.`, `${path}.anchor.normalized`, asset.semanticId);
  const ground = asset.anchor?.groundContact;
  const canvas = asset.output?.canvas;
  if (ground != null && (!finite(ground.x) || !finite(ground.y) || ground.x < 0 || ground.y < 0 || ground.x > canvas.width || ground.y > canvas.height)) error(errors, "invalid-ground-anchor", `${asset.semanticId} ground contact must be inside its declared canvas.`, `${path}.anchor.groundContact`, { assetId: asset.semanticId, expected: canvas, actual: ground, affectedScenes: asset.intendedScenes });
  for (const [index, socket] of (asset.sockets || []).entries()) {
    if (!/^[A-Za-z][A-Za-z0-9.-]*$/.test(String(socket.id || ""))) error(errors, "invalid-socket-id", `${asset.semanticId} socket ${socket.id || index} requires a stable token ID.`, `${path}.sockets[${index}].id`, asset.semanticId);
    if (!finite(socket.logical?.x) || !finite(socket.logical?.y)) error(errors, "invalid-socket", `${asset.semanticId}.${socket.id || index} socket requires finite logical coordinates.`, `${path}.sockets[${index}]`, asset.semanticId);
  }
  const sheet = asset.output?.spriteSheet;
  const animationIds = new Set();
  for (const [index, animation] of (asset.animations || []).entries()) {
    if (!animation.id || !animation.action) error(errors, "invalid-animation", `${asset.semanticId} animation requires stable id and action.`, `${path}.animations[${index}]`, asset.semanticId);
    if (animationIds.has(animation.id)) error(errors, "duplicate-animation-id", `${asset.semanticId} contains duplicate animation ${animation.id}.`, `${path}.animations[${index}].id`, asset.semanticId);
    animationIds.add(animation.id);
    if (!Number.isFinite(animation.frameRate) || animation.frameRate <= 0 || animation.frameRate > 60) error(errors, "invalid-frame-rate", `${asset.semanticId}.${animation.id} frame rate must be within 1..60.`, `${path}.animations[${index}].frameRate`, { assetId: asset.semanticId, expected: "1..60", actual: animation.frameRate, affectedScenes: asset.intendedScenes });
    if (!Number.isInteger(animation.repeat) || animation.repeat < -1) error(errors, "invalid-loop-policy", `${asset.semanticId}.${animation.id} repeat must be -1 or a non-negative integer.`, `${path}.animations[${index}].repeat`, { assetId: asset.semanticId, expected: "integer >= -1", actual: animation.repeat, affectedScenes: asset.intendedScenes });
    if (!Array.isArray(animation.frames) || animation.frames.length === 0) error(errors, "empty-animation", `${asset.semanticId}.${animation.id} requires at least one frame.`, `${path}.animations[${index}].frames`, asset.semanticId);
    if (sheet && !sheet.actions?.includes(animation.action)) error(errors, "invalid-animation-action", `${asset.semanticId}.${animation.id} references undeclared action ${animation.action}.`, `${path}.animations[${index}]`, asset.semanticId);
    if (animation.direction && sheet && !sheet.directions?.includes(animation.direction)) error(errors, "invalid-animation-direction", `${asset.semanticId}.${animation.id} references undeclared direction ${animation.direction}.`, `${path}.animations[${index}]`, asset.semanticId);
    for (const frame of animation.frames || []) if (sheet && !sheet.frameOrder?.includes(frame)) error(errors, "invalid-animation-frame", `${asset.semanticId}.${animation.id} references missing frame ${frame}.`, `${path}.animations[${index}]`, asset.semanticId);
    for (const frame of animation.frames || []) if (asset.output?.atlas && !asset.output.atlas.frameNames?.includes(frame)) error(errors, "missing-atlas-frame", `${asset.semanticId}.${animation.id} references atlas frame ${frame} that is not declared.`, `${path}.animations[${index}].frames`, { assetId: asset.semanticId, expected: asset.output.atlas.frameNames, actual: frame, affectedScenes: asset.intendedScenes });
  }
}

function validateClosedSchema(asset, errors, path) {
  closedKeys(asset, ["schemaVersion", "semanticId", "version", "familyId", "category", "categoryContractId", "categoryMetadata", "gameplayPurpose", "intendedScenes", "output", "camera", "masterScale", "anchor", "sockets", "geometry", "states", "variants", "directions", "layers", "animations", "artRules", "expectedFilenames", "filenameStem", "forbiddenOutput", "validation", "accessibility", "productionStatus", "workflow", "provenance", "dependencies", "scenePackId"], errors, path, asset);
  closedKeys(asset.categoryMetadata, ["fallbackPolicy", "tileGrid", "seamPolicy", "growthStates", "shadowPolicy", "blendPolicy", "lifetime", "stateMapping", "stateAlignment", "doorSockets", "rig", "habitatPresentation", "frameOrder", "intendedDisplaySize", "safeContentInsets", "roomGrid", "minigameId", "playfieldScale"], errors, `${path}.categoryMetadata`, asset);
  closedKeys(asset.output, ["type", "format", "canvas", "alpha", "colourMode", "bitDepth", "pixelArt", "textureFiltering", "smoothing", "trimFrames", "spriteSheet", "atlas", "audio", "tileset", "layerSet", "nineSlice", "effect"], errors, `${path}.output`, asset);
  closedKeys(asset.output?.canvas, ["width", "height"], errors, `${path}.output.canvas`, asset);
  if (asset.output?.spriteSheet) closedKeys(asset.output.spriteSheet, ["frameWidth", "frameHeight", "columns", "rows", "padding", "spacing", "actions", "directions", "frameOrder"], errors, `${path}.output.spriteSheet`, asset);
  if (asset.output?.atlas) closedKeys(asset.output.atlas, ["dataFilename", "frames", "frameNames", "allowTrim", "allowRotation"], errors, `${path}.output.atlas`, asset);
  if (asset.output?.audio) closedKeys(asset.output.audio, ["channels", "sampleRate", "durationMs", "loopPolicy", "loudnessTargetLufs"], errors, `${path}.output.audio`, asset);
  if (asset.output?.tileset) closedKeys(asset.output.tileset, ["tileWidth", "tileHeight", "columns", "rows", "seamPolicy"], errors, `${path}.output.tileset`, asset);
  if (asset.output?.layerSet) closedKeys(asset.output.layerSet, ["layerIds", "stateMapping"], errors, `${path}.output.layerSet`, asset);
  if (asset.output?.nineSlice) closedKeys(asset.output.nineSlice, ["left", "right", "top", "bottom", "safeCenter"], errors, `${path}.output.nineSlice`, asset);
  if (asset.output?.nineSlice?.safeCenter) closedKeys(asset.output.nineSlice.safeCenter, ["x", "y", "width", "height"], errors, `${path}.output.nineSlice.safeCenter`, asset);
  if (asset.output?.effect) closedKeys(asset.output.effect, ["blendPolicy", "lifetimeMs", "stateMapping"], errors, `${path}.output.effect`, asset);
  closedKeys(asset.camera, ["projection", "perspective", "viewDirection", "cameraMotion"], errors, `${path}.camera`, asset);
  closedKeys(asset.masterScale, ["nativePixelsPerLogicalUnit", "logicalDisplay", "scalePolicy"], errors, `${path}.masterScale`, asset);
  closedKeys(asset.masterScale?.logicalDisplay, ["width", "height"], errors, `${path}.masterScale.logicalDisplay`, asset);
  closedKeys(asset.anchor, ["name", "normalized", "groundContact"], errors, `${path}.anchor`, asset);
  closedKeys(asset.anchor?.normalized, ["x", "y"], errors, `${path}.anchor.normalized`, asset);
  if (asset.anchor?.groundContact) closedKeys(asset.anchor.groundContact, ["x", "y"], errors, `${path}.anchor.groundContact`, asset);
  closedKeys(asset.geometry, ["visual", "collision", "navigation", "interaction", "touch"], errors, `${path}.geometry`, asset);
  for (const [index, socket] of (asset.sockets || []).entries()) {
    closedKeys(socket, ["id", "logical"], errors, `${path}.sockets[${index}]`, asset);
    closedKeys(socket.logical, ["x", "y"], errors, `${path}.sockets[${index}].logical`, asset);
  }
  for (const [index, layer] of (asset.layers || []).entries()) closedKeys(layer, ["id", "order", "states", "canvasAlignment", "alphaAlignment"], errors, `${path}.layers[${index}]`, asset);
  for (const [index, animation] of (asset.animations || []).entries()) closedKeys(animation, ["id", "action", "direction", "frames", "frameRate", "repeat"], errors, `${path}.animations[${index}]`, asset);
  closedKeys(asset.artRules, ["artBibleVersion", "palette", "outline", "lighting", "shadow", "texture"], errors, `${path}.artRules`, asset);
  closedKeys(asset.expectedFilenames, ["staging", "master", "runtime", "atlas"], errors, `${path}.expectedFilenames`, asset);
  closedKeys(asset.validation, ["requireFiles", "requireExactDimensions", "requireAlpha", "requireUntrimmedFrames", "requireNearestNeighbour", "requireStateNames", "requireDirections", "maximumRuntimeBytes", "maximumTransparentPadding", "maximumVisibleBounds", "gameplayGeometrySha256", "fallbackSemanticId"], errors, `${path}.validation`, asset);
  closedKeys(asset.validation?.maximumTransparentPadding, ["top", "right", "bottom", "left"], errors, `${path}.validation.maximumTransparentPadding`, asset);
  closedKeys(asset.validation?.maximumVisibleBounds, ["x", "y", "width", "height"], errors, `${path}.validation.maximumVisibleBounds`, asset);
  if (asset.accessibility) {
    closedKeys(asset.accessibility, ["labelKey", "minimumRenderedSize", "minimumContrastRatio", "safeContentInsets", "localizationExpansionPercent"], errors, `${path}.accessibility`, asset);
    closedKeys(asset.accessibility.minimumRenderedSize, ["width", "height"], errors, `${path}.accessibility.minimumRenderedSize`, asset);
    closedKeys(asset.accessibility.safeContentInsets, ["top", "right", "bottom", "left"], errors, `${path}.accessibility.safeContentInsets`, asset);
  }
  closedKeys(asset.workflow, ["currentStatus", "history"], errors, `${path}.workflow`, asset);
  for (const [index, entry] of (asset.workflow?.history || []).entries()) closedKeys(entry, ["status", "version", "evidence", "at", "by", "note"], errors, `${path}.workflow.history[${index}]`, asset);
  closedKeys(asset.provenance, ["originType", "provider", "sourceSemanticId", "sourceSha256", "specificationVersion", "assetVersion", "licenseReview", "reviewedAt"], errors, `${path}.provenance`, asset);
}

function validateOutputSpecificMetadata(asset, errors, path) {
  const { output = {} } = asset;
  if (output.type === "tileset") {
    const value = output.tileset;
    if (![value?.tileWidth, value?.tileHeight, value?.columns, value?.rows].every((entry) => Number.isInteger(entry) && entry > 0) || !["seamless", "edge-matched", "non-repeating"].includes(value?.seamPolicy)) error(errors, "missing-tileset-metadata", `${asset.semanticId} tileset requires a positive tile grid and seam policy.`, `${path}.output.tileset`, asset.semanticId);
    else if (value.tileWidth * value.columns !== output.canvas.width || value.tileHeight * value.rows !== output.canvas.height) error(errors, "invalid-tileset-grid", `${asset.semanticId} tileset grid must fill the declared canvas.`, `${path}.output.tileset`, asset.semanticId);
  }
  if (output.type === "layer-set") {
    const value = output.layerSet;
    if (!Array.isArray(value?.layerIds) || !value.layerIds.length || new Set(value.layerIds).size !== value.layerIds.length || !value?.stateMapping || typeof value.stateMapping !== "object") error(errors, "missing-layer-set-metadata", `${asset.semanticId} layer set requires unique layer IDs and state mapping.`, `${path}.output.layerSet`, asset.semanticId);
  }
  if (output.type === "nine-slice") {
    const value = output.nineSlice;
    if (![value?.left, value?.right, value?.top, value?.bottom].every((entry) => Number.isInteger(entry) && entry >= 0) || !value?.safeCenter || value.left + value.right >= output.canvas.width || value.top + value.bottom >= output.canvas.height) error(errors, "missing-nine-slice-metadata", `${asset.semanticId} nine-slice requires valid margins and a safe centre.`, `${path}.output.nineSlice`, asset.semanticId);
  }
  if (output.type === "effect-sheet") {
    const value = output.effect;
    if (!value?.blendPolicy || !(value?.lifetimeMs > 0) || !value?.stateMapping || typeof value.stateMapping !== "object") error(errors, "missing-effect-metadata", `${asset.semanticId} effect requires blend, lifetime, and state mapping metadata.`, `${path}.output.effect`, asset.semanticId);
  }
}

const REQUIRED_METADATA_PATHS = Object.freeze({
  masterScale: ["masterScale"], anchor: ["anchor"], sockets: ["sockets"], geometry: ["geometry"], directions: ["directions"], accessibility: ["accessibility"],
  perspective: ["camera", "perspective"], scale: ["masterScale"], groundContact: ["anchor", "groundContact"],
  channels: ["output", "audio", "channels"], sampleRate: ["output", "audio", "sampleRate"], duration: ["output", "audio", "durationMs"], loopPolicy: ["output", "audio", "loopPolicy"], loudnessTarget: ["output", "audio", "loudnessTargetLufs"],
});
function metadataValue(asset, name) {
  const path = REQUIRED_METADATA_PATHS[name];
  if (!path) return asset.categoryMetadata?.[name];
  return path.reduce((value, key) => value?.[key], asset);
}
function validateCategoryRequiredMetadata(asset, categoryContract, errors, path) {
  if (!categoryContract) return;
  const missing = (categoryContract.requiredMetadata || []).filter((name) => metadataValue(asset, name) == null);
  if (missing.length) error(errors, "missing-category-required-metadata", `${asset.semanticId} is missing executable metadata required by ${categoryContract.id}: ${missing.join(", ")}.`, `${path}.categoryMetadata`, { assetId: asset.semanticId, expected: categoryContract.requiredMetadata, actual: missing, affectedScenes: asset.intendedScenes });
}

async function validateFiles(asset, root, errors, path) {
  const files = asset.expectedFilenames || {};
  const required = asset.validation?.requireFiles || [];
  const roles = ["staging", "master", "runtime"];
  const metadata = {};
  for (const role of roles) {
    const relativeFile = files[role];
    if (!relativeFile) {
      if (required.includes(role)) error(errors, "missing-required-file-path", `${asset.semanticId} has no ${role} filename.`, `${path}.expectedFilenames.${role}`, asset.semanticId);
      continue;
    }
    const expectedRoot = role === "runtime" ? "public/assets/runtime/" : `artwork/${role === "master" ? "masters" : "staging"}/`;
    if (!relativeFile.startsWith(expectedRoot)) error(errors, "unsafe-output-location", `${asset.semanticId} ${role} file is outside ${expectedRoot}.`, `${path}.expectedFilenames.${role}`, asset.semanticId);
    if (extname(relativeFile).slice(1).toLowerCase() !== asset.output?.format) error(errors, "filename-format-mismatch", `${asset.semanticId} ${role} filename does not match ${asset.output?.format}.`, `${path}.expectedFilenames.${role}`, asset.semanticId);
    const basename = relativeFile.split("/").at(-1) || "";
    if (!basename.startsWith(`${asset.filenameStem}.`)) error(errors, "filename-contract-mismatch", `${asset.semanticId} ${role} filename must begin with ${asset.filenameStem}.`, `${path}.expectedFilenames.${role}`, { assetId: asset.semanticId, expected: `${asset.filenameStem}.*.${asset.output?.format}`, actual: basename, affectedScenes: asset.intendedScenes });
    const absolute = resolve(root, relativeFile);
    try {
      if (!(await pathUsesExactCase(root, relativeFile))) error(errors, "filename-case-mismatch", `${asset.semanticId} ${role} path case does not exactly match the filesystem.`, relativeFile, { assetId: asset.semanticId, expected: relativeFile, actual: "case-insensitive match or missing exact entry", affectedScenes: asset.intendedScenes });
      await access(absolute);
      const [fileStat, bytes] = await Promise.all([stat(absolute), readFile(absolute)]);
      if (asset.output?.type === "audio") {
        const audio = inspectAudioBuffer(bytes, asset.output?.format);
        metadata[role] = Object.freeze({ ...audio, bytes: fileStat.size, sha256: createHash("sha256").update(bytes).digest("hex") });
        if (audio.format !== asset.output?.format) error(errors, "file-format-mismatch", `${asset.semanticId} ${role} bytes are ${audio.format}, expected ${asset.output?.format}.`, relativeFile, { assetId: asset.semanticId, expected: asset.output?.format, actual: audio.format, affectedScenes: asset.intendedScenes });
        if (role === "runtime" && fileStat.size > asset.validation?.maximumRuntimeBytes) error(errors, "audio-budget-exceeded", `${asset.semanticId} runtime audio is ${fileStat.size} bytes; budget is ${asset.validation?.maximumRuntimeBytes}.`, relativeFile, asset.semanticId);
        continue;
      }
      let image;
      try { image = await inspectDecodedImageBuffer(bytes); }
      catch (cause) {
        error(errors, "corrupt-or-unsupported-image", `${asset.semanticId} ${role} is not a decodable supported image.`, relativeFile, { assetId: asset.semanticId, expected: asset.output?.format, actual: cause?.message, affectedScenes: asset.intendedScenes });
        continue;
      }
      metadata[role] = Object.freeze({ ...image, bytes: fileStat.size, sha256: createHash("sha256").update(bytes).digest("hex") });
      if (image.width == null || image.height == null) error(errors, "corrupt-or-unsupported-image", `${asset.semanticId} ${role} is not a readable supported image.`, relativeFile, { assetId: asset.semanticId, expected: asset.output?.format, actual: image.format, affectedScenes: asset.intendedScenes });
      if (image.format !== asset.output?.format) error(errors, "file-format-mismatch", `${asset.semanticId} ${role} bytes are ${image.format}, expected ${asset.output?.format}.`, relativeFile, asset.semanticId);
      if (image.width !== asset.output?.canvas?.width || image.height !== asset.output?.canvas?.height) error(errors, "dimension-mismatch", `${asset.semanticId} ${role} is ${image.width}×${image.height}; expected ${asset.output?.canvas?.width}×${asset.output?.canvas?.height}.`, relativeFile, asset.semanticId);
      if (image.alpha !== asset.output?.alpha) error(errors, "alpha-mismatch", `${asset.semanticId} ${role} alpha=${image.alpha}; expected ${asset.output?.alpha}.`, relativeFile, asset.semanticId);
      if (image.colourMode && image.colourMode !== asset.output?.colourMode) error(errors, "colour-mode-mismatch", `${asset.semanticId} ${role} colour mode is ${image.colourMode}; expected ${asset.output?.colourMode}.`, relativeFile, { assetId: asset.semanticId, expected: asset.output?.colourMode, actual: image.colourMode, affectedScenes: asset.intendedScenes });
      if (image.bitDepth && image.bitDepth !== asset.output?.bitDepth) error(errors, "bit-depth-mismatch", `${asset.semanticId} ${role} bit depth is ${image.bitDepth}; expected ${asset.output?.bitDepth}.`, relativeFile, { assetId: asset.semanticId, expected: asset.output?.bitDepth, actual: image.bitDepth, affectedScenes: asset.intendedScenes });
      if (asset.output?.alpha && image.opaqueBounds === null) error(errors, "empty-or-uninspectable-alpha", `${asset.semanticId} ${role} has no opaque pixels.`, relativeFile, asset.semanticId);
      if (image.opaqueBounds) {
        const bounds = image.opaqueBounds, maximum = asset.validation?.maximumVisibleBounds;
        if (maximum && (bounds.x < maximum.x || bounds.y < maximum.y || bounds.x + bounds.width > maximum.x + maximum.width || bounds.y + bounds.height > maximum.y + maximum.height)) error(errors, "visible-bounds-exceeded", `${asset.semanticId} ${role} visible pixels exceed the approved bounds.`, relativeFile, { assetId: asset.semanticId, expected: maximum, actual: bounds, affectedScenes: asset.intendedScenes });
        const padding = { top: bounds.y, left: bounds.x, right: image.width - bounds.x - bounds.width, bottom: image.height - bounds.y - bounds.height };
        const maximumPadding = asset.validation?.maximumTransparentPadding;
        if (maximumPadding && Object.keys(padding).some((edge) => padding[edge] > maximumPadding[edge])) error(errors, "transparent-padding-exceeded", `${asset.semanticId} ${role} transparent padding exceeds its contract.`, relativeFile, { assetId: asset.semanticId, expected: maximumPadding, actual: padding, affectedScenes: asset.intendedScenes });
      }
      if (role === "runtime" && fileStat.size > asset.validation?.maximumRuntimeBytes) error(errors, "texture-budget-exceeded", `${asset.semanticId} runtime export is ${fileStat.size} bytes; budget is ${asset.validation?.maximumRuntimeBytes}.`, relativeFile, asset.semanticId);
    } catch (cause) {
      const missing = cause?.code === "ENOENT";
      error(errors, missing ? "missing-artwork-file" : "unreadable-artwork-file", `${asset.semanticId} ${missing ? "is missing" : "cannot read"} required ${role} file ${relativeFile}.`, relativeFile, { assetId: asset.semanticId, actual: cause?.message, affectedScenes: asset.intendedScenes });
    }
  }
  if (asset.output?.type === "atlas") {
    const relativeAtlas = files.atlas;
    if (!relativeAtlas) error(errors, "missing-atlas-data-path", `${asset.semanticId} atlas has no JSON data filename.`, `${path}.expectedFilenames.atlas`, asset.semanticId);
    else {
      if (!relativeAtlas.startsWith("artwork/masters/") && !relativeAtlas.startsWith("public/assets/runtime/")) error(errors, "unsafe-atlas-location", `${asset.semanticId} atlas JSON must live in masters or runtime assets.`, `${path}.expectedFilenames.atlas`, { assetId: asset.semanticId, expected: "artwork/masters/ or public/assets/runtime/", actual: relativeAtlas, affectedScenes: asset.intendedScenes });
      if (extname(relativeAtlas).toLowerCase() !== ".json" || relativeAtlas.split("/").at(-1) !== asset.output?.atlas?.dataFilename) error(errors, "atlas-filename-mismatch", `${asset.semanticId} atlas filename disagrees with output.atlas.dataFilename.`, `${path}.expectedFilenames.atlas`, { assetId: asset.semanticId, expected: asset.output?.atlas?.dataFilename, actual: relativeAtlas.split("/").at(-1), affectedScenes: asset.intendedScenes });
      const absoluteAtlas = resolve(root, relativeAtlas);
      try {
        const atlas = JSON.parse(await readFile(absoluteAtlas, "utf8"));
        const rawFrames = atlas?.frames;
        const entries = Array.isArray(rawFrames)
          ? rawFrames.map((entry) => [entry.filename, entry])
          : Object.entries(rawFrames || {});
        const actualNames = entries.map(([name]) => name);
        const expectedNames = asset.output?.atlas?.frameNames || [];
        if (entries.length !== asset.output?.atlas?.frames) error(errors, "atlas-file-frame-count-mismatch", `${asset.semanticId} atlas JSON contains ${entries.length} frames.`, relativeAtlas, { assetId: asset.semanticId, expected: asset.output?.atlas?.frames, actual: entries.length, affectedScenes: asset.intendedScenes });
        for (const name of expectedNames) if (!actualNames.includes(name)) error(errors, "missing-atlas-file-frame", `${asset.semanticId} atlas JSON omits ${name}.`, relativeAtlas, { assetId: asset.semanticId, expected: name, actual: actualNames, affectedScenes: asset.intendedScenes });
        for (const [name, entry] of entries) {
          const frame = entry?.frame;
          if (![frame?.x, frame?.y, frame?.w, frame?.h].every((value) => Number.isInteger(value)) || frame.x < 0 || frame.y < 0 || frame.w <= 0 || frame.h <= 0 || frame.x + frame.w > asset.output.canvas.width || frame.y + frame.h > asset.output.canvas.height) error(errors, "invalid-atlas-frame-rectangle", `${asset.semanticId} atlas frame ${name} is outside the texture canvas.`, relativeAtlas, { assetId: asset.semanticId, expected: asset.output.canvas, actual: frame, affectedScenes: asset.intendedScenes });
          if (entry?.trimmed === true || entry?.rotated === true) error(errors, "unsafe-atlas-file-transform", `${asset.semanticId} atlas frame ${name} is trimmed or rotated.`, relativeAtlas, { assetId: asset.semanticId, expected: "trimmed=false, rotated=false", actual: { trimmed: entry?.trimmed, rotated: entry?.rotated }, affectedScenes: asset.intendedScenes });
        }
        metadata.atlas = Object.freeze({ frames: entries.length, sha256: createHash("sha256").update(JSON.stringify(atlas)).digest("hex") });
      } catch (cause) {
        const missing = cause?.code === "ENOENT";
        error(errors, missing ? "missing-atlas-file" : "invalid-atlas-file", `${asset.semanticId} ${missing ? "is missing" : "has invalid"} atlas JSON ${relativeAtlas}.`, relativeAtlas, { assetId: asset.semanticId, actual: cause?.message, affectedScenes: asset.intendedScenes });
      }
    }
  }
  if (metadata.staging && metadata.master && metadata.staging.width !== metadata.master.width) error(errors, "stage-master-alignment-mismatch", `${asset.semanticId} staging/master canvases disagree.`, path, asset.semanticId);
  if (metadata.master && metadata.runtime && (metadata.master.width !== metadata.runtime.width || metadata.master.height !== metadata.runtime.height)) error(errors, "master-runtime-alignment-mismatch", `${asset.semanticId} master/runtime canvases disagree.`, path, asset.semanticId);
  return Object.freeze(metadata);
}

export async function validateArtworkManifest(manifest, { root, validateFiles = true, selectedAssetIds = null, categoryContracts = [], familyAssignments = [] } = {}) {
  const errors = [];
  const metadata = new Map();
  closedKeys(manifest, ["schemaVersion", "id", "revision", "artBibleVersion", "workflowStatuses", "runtimeFallbackSemanticIds", "contractPolicy", "assets"], errors, "manifest", null);
  if (manifest?.schemaVersion !== ARTWORK_SPEC_SCHEMA_VERSION) error(errors, "invalid-artwork-schema", `Expected artwork schema ${ARTWORK_SPEC_SCHEMA_VERSION}.`, "schemaVersion");
  if (JSON.stringify(manifest?.workflowStatuses) !== JSON.stringify(ARTWORK_WORKFLOW_STATUSES)) error(errors, "workflow-status-contract-mismatch", "Manifest workflow status order does not match the executable contract.", "workflowStatuses");
  const policy = manifest?.contractPolicy;
  closedKeys(policy, ["schemaVersion", "catalogId", "scope", "requiredSemanticIds", "allowUncontractedAssets", "generationBlockedUntilArtBibleLocked"], errors, "contractPolicy", null);
  if (policy?.schemaVersion !== ARTWORK_SPEC_SCHEMA_VERSION || !policy?.catalogId || !Array.isArray(policy?.requiredSemanticIds) || policy.requiredSemanticIds.length === 0 || policy.allowUncontractedAssets !== false) error(errors, "invalid-contract-policy", "Artwork manifest requires a closed, non-empty schema-v2 contract policy.", "contractPolicy", { expected: "schema v2, catalog ID, non-empty required IDs, allowUncontractedAssets=false", actual: policy });
  const ids = new Set();
  const fileOwners = new Map();
  const assets = manifest?.assets || [];
  const categoryById = new Map(categoryContracts.map((entry) => [entry.id, entry]));
  const familyById = new Map(familyAssignments.map((entry) => [entry.familyId, entry]));
  for (const [index, asset] of assets.entries()) {
    const path = `assets[${index}]`;
    validateClosedSchema(asset, errors, path);
    if (asset.schemaVersion !== ARTWORK_SPEC_SCHEMA_VERSION) error(errors, "invalid-asset-contract-version", `${asset.semanticId || path} must use artwork schema v${ARTWORK_SPEC_SCHEMA_VERSION}.`, `${path}.schemaVersion`, { assetId: asset.semanticId, expected: ARTWORK_SPEC_SCHEMA_VERSION, actual: asset.schemaVersion, affectedScenes: asset.intendedScenes });
    if (!SEMANTIC_ID_PATTERN.test(asset?.semanticId || "")) error(errors, "invalid-semantic-id", `${asset?.semanticId || "<missing>"} is not a stable generator-neutral semantic id.`, `${path}.semanticId`, asset?.semanticId || null);
    if (ids.has(asset?.semanticId)) error(errors, "duplicate-semantic-id", `Duplicate artwork semantic id ${asset.semanticId}.`, `${path}.semanticId`, asset.semanticId);
    ids.add(asset?.semanticId);
    const isAudio = asset.output?.type === "audio";
    const requiredFields = isAudio
      ? ["familyId", "category", "categoryContractId", "gameplayPurpose", "output", "states", "variants", "directions", "animations", "expectedFilenames", "filenameStem", "forbiddenOutput", "validation", "productionStatus", "workflow", "provenance", "dependencies", "scenePackId"]
      : ["familyId", "category", "categoryContractId", "gameplayPurpose", "output", "camera", "masterScale", "anchor", "sockets", "geometry", "states", "variants", "directions", "layers", "animations", "artRules", "expectedFilenames", "filenameStem", "forbiddenOutput", "validation", "productionStatus", "workflow", "provenance", "dependencies", "scenePackId"];
    for (const field of requiredFields) {
      if (asset?.[field] == null) error(errors, "missing-spec-field", `${asset?.semanticId || path} is missing ${field}.`, `${path}.${field}`, asset?.semanticId || null);
    }
    if (!Array.isArray(asset.intendedScenes) || asset.intendedScenes.length === 0) error(errors, "orphaned-artwork-entry", `${asset.semanticId} is not assigned to a scene.`, `${path}.intendedScenes`, asset.semanticId);
    if (!PRODUCTION_STATUSES.has(asset.productionStatus)) error(errors, "invalid-production-status", `${asset.semanticId} has invalid production status ${asset.productionStatus}.`, `${path}.productionStatus`, asset.semanticId);
    for (const workflowError of validateArtworkWorkflowHistory(asset.workflow)) error(errors, workflowError.split(":")[0], `${asset.semanticId} workflow: ${workflowError}.`, `${path}.workflow`, asset.semanticId);
    if (!isAudio && asset.output?.smoothing !== false) error(errors, "smoothing-forbidden", `${asset.semanticId} must disable smoothing.`, `${path}.output.smoothing`, asset.semanticId);
    if (!isAudio && asset.output?.trimFrames !== false) error(errors, "frame-trimming-forbidden", `${asset.semanticId} must preserve untrimmed frame canvases.`, `${path}.output.trimFrames`, asset.semanticId);
    if (!isAudio && (asset.output?.textureFiltering !== "nearest" || asset.validation?.requireNearestNeighbour !== true)) error(errors, "invalid-texture-filtering", `${asset.semanticId} must require nearest-neighbour filtering.`, `${path}.output.textureFiltering`, { assetId: asset.semanticId, expected: "nearest", actual: asset.output?.textureFiltering, affectedScenes: asset.intendedScenes });
    if (!isAudio && asset.validation?.requireExactDimensions !== true) error(errors, "invalid-require-exact-dimensions", `${asset.semanticId} must require exact canvas dimensions.`, `${path}.validation.requireExactDimensions`, asset.semanticId);
    if (!isAudio && asset.validation?.requireUntrimmedFrames !== true) error(errors, "invalid-require-untrimmed", `${asset.semanticId} must require untrimmed frames.`, `${path}.validation.requireUntrimmedFrames`, asset.semanticId);
    if (!isAudio && asset.validation?.requireAlpha !== asset.output?.alpha) error(errors, "invalid-require-alpha", `${asset.semanticId} alpha validation must match the output alpha contract.`, `${path}.validation.requireAlpha`, { assetId: asset.semanticId, expected: asset.output?.alpha, actual: asset.validation?.requireAlpha, affectedScenes: asset.intendedScenes });
    if (!Number.isInteger(asset.validation?.maximumRuntimeBytes) || asset.validation.maximumRuntimeBytes <= 0) error(errors, "invalid-runtime-budget", `${asset.semanticId} requires a positive integer runtime-byte budget.`, `${path}.validation.maximumRuntimeBytes`, asset.semanticId);
    if (!TOKEN_PATTERN.test(String(asset.filenameStem || ""))) error(errors, "invalid-filename-stem", `${asset.semanticId} filename stem must be a stable kebab-case token.`, `${path}.filenameStem`, { assetId: asset.semanticId, expected: TOKEN_PATTERN.source, actual: asset.filenameStem, affectedScenes: asset.intendedScenes });
    if (!["single-image", "tileset", "spritesheet", "layer-set", "atlas", "nine-slice", "effect-sheet", "audio"].includes(asset.output?.type)) error(errors, "invalid-output-type", `${asset.semanticId} has unsupported output type ${asset.output?.type}.`, `${path}.output.type`, asset.semanticId);
    if (isAudio) {
      if (!["mp3", "ogg", "wav"].includes(asset.output?.format)) error(errors, "invalid-output-format", `${asset.semanticId} has unsupported audio format ${asset.output?.format}.`, `${path}.output.format`, asset.semanticId);
      const audio = asset.output?.audio;
      if (![1, 2].includes(audio?.channels) || !Number.isInteger(audio?.sampleRate) || audio.sampleRate < 8000 || audio.sampleRate > 192000 || !(audio.durationMs > 0) || !["once", "loop", "seamless-loop"].includes(audio.loopPolicy) || !Number.isFinite(audio.loudnessTargetLufs)) error(errors, "invalid-audio-contract", `${asset.semanticId} has incomplete audio technical metadata.`, `${path}.output.audio`, { assetId: asset.semanticId, expected: "1/2 channels, sampleRate 8000..192000, positive durationMs, loop policy, LUFS target", actual: audio, affectedScenes: asset.intendedScenes });
      const visualFields = ["canvas", "alpha", "colourMode", "bitDepth", "pixelArt", "textureFiltering", "smoothing", "trimFrames", "spriteSheet", "atlas"].filter((field) => asset.output?.[field] != null);
      if (visualFields.length) error(errors, "audio-visual-metadata-forbidden", `${asset.semanticId} audio contract contains visual-only output fields.`, `${path}.output`, { assetId: asset.semanticId, expected: "format plus audio metadata only", actual: visualFields, affectedScenes: asset.intendedScenes });
    } else {
      if (!["png", "webp"].includes(asset.output?.format)) error(errors, "invalid-output-format", `${asset.semanticId} has unsupported runtime format ${asset.output?.format}.`, `${path}.output.format`, asset.semanticId);
      if (!(asset.output?.canvas?.width > 0) || !(asset.output?.canvas?.height > 0)) error(errors, "invalid-canvas-size", `${asset.semanticId} requires positive exact canvas dimensions.`, `${path}.output.canvas`, asset.semanticId);
      if (!["RGB", "RGBA"].includes(asset.output?.colourMode) || asset.output?.bitDepth !== 8 || asset.output.alpha !== (asset.output.colourMode === "RGBA")) error(errors, "invalid-colour-contract", `${asset.semanticId} requires a consistent RGB/RGBA 8-bit colour contract.`, `${path}.output`, { assetId: asset.semanticId, expected: "RGB alpha=false or RGBA alpha=true, bitDepth=8", actual: { colourMode: asset.output?.colourMode, alpha: asset.output?.alpha, bitDepth: asset.output?.bitDepth }, affectedScenes: asset.intendedScenes });
      if (!(asset.masterScale?.nativePixelsPerLogicalUnit > 0) || !(asset.masterScale?.logicalDisplay?.width > 0) || !(asset.masterScale?.logicalDisplay?.height > 0) || !asset.masterScale?.scalePolicy) error(errors, "invalid-scale-contract", `${asset.semanticId} has incomplete scaling metadata.`, `${path}.masterScale`, asset.semanticId);
      validateOutputSpecificMetadata(asset, errors, path);
    }
    const maximumPadding = asset.validation?.maximumTransparentPadding;
    if (!isAudio && (!maximumPadding || ["top", "right", "bottom", "left"].some((edge) => !Number.isInteger(maximumPadding[edge]) || maximumPadding[edge] < 0))) error(errors, "invalid-padding-contract", `${asset.semanticId} requires non-negative integer transparent-padding limits.`, `${path}.validation.maximumTransparentPadding`, { assetId: asset.semanticId, expected: "non-negative top/right/bottom/left", actual: maximumPadding, affectedScenes: asset.intendedScenes });
    const maximumBounds = asset.validation?.maximumVisibleBounds;
    if (!isAudio && (!maximumBounds || !["x", "y", "width", "height"].every((key) => Number.isInteger(maximumBounds[key])) || maximumBounds.width <= 0 || maximumBounds.height <= 0 || maximumBounds.x < 0 || maximumBounds.y < 0 || maximumBounds.x + maximumBounds.width > asset.output?.canvas?.width || maximumBounds.y + maximumBounds.height > asset.output?.canvas?.height)) error(errors, "invalid-visible-bounds-contract", `${asset.semanticId} maximum visible bounds must fit inside its canvas.`, `${path}.validation.maximumVisibleBounds`, { assetId: asset.semanticId, expected: asset.output?.canvas, actual: maximumBounds, affectedScenes: asset.intendedScenes });
    const categoryContract = categoryById.get(asset.categoryContractId);
    const familyAssignment = familyById.get(asset.familyId);
    if (familyAssignments.length && !familyAssignment) error(errors, "unknown-family-contract", `${asset.semanticId} references unknown Phase 10 family ${asset.familyId}.`, `${path}.familyId`, { assetId: asset.semanticId, expected: [...familyById.keys()], actual: asset.familyId, affectedScenes: asset.intendedScenes });
    if (familyAssignment && familyAssignment.categoryContractId !== asset.categoryContractId) error(errors, "family-category-contract-mismatch", `${asset.semanticId} category disagrees with its registered family.`, `${path}.categoryContractId`, { assetId: asset.semanticId, expected: familyAssignment.categoryContractId, actual: asset.categoryContractId, affectedScenes: asset.intendedScenes });
    if (categoryContracts.length && !categoryContract) error(errors, "unknown-category-contract", `${asset.semanticId} references unknown category contract ${asset.categoryContractId}.`, `${path}.categoryContractId`, { assetId: asset.semanticId, expected: [...categoryById.keys()], actual: asset.categoryContractId, affectedScenes: asset.intendedScenes });
    if (categoryContract && !categoryContract.allowedOutputTypes.includes(asset.output?.type)) error(errors, "category-output-mismatch", `${asset.semanticId} output type is not allowed by ${categoryContract.id}.`, `${path}.output.type`, { assetId: asset.semanticId, expected: categoryContract.allowedOutputTypes, actual: asset.output?.type, affectedScenes: asset.intendedScenes });
    if (categoryContract && !categoryContract.allowedFormats.includes(asset.output?.format)) error(errors, "category-format-mismatch", `${asset.semanticId} format is not allowed by ${categoryContract.id}.`, `${path}.output.format`, { assetId: asset.semanticId, expected: categoryContract.allowedFormats, actual: asset.output?.format, affectedScenes: asset.intendedScenes });
    if (categoryContract?.requiresStates && (!Array.isArray(asset.states) || asset.states.length === 0)) error(errors, "category-states-required", `${asset.semanticId} requires at least one state for ${categoryContract.id}.`, `${path}.states`, asset.semanticId);
    if (categoryContract?.requiresVariants && (!Array.isArray(asset.variants) || asset.variants.length === 0)) error(errors, "category-variants-required", `${asset.semanticId} requires at least one variant for ${categoryContract.id}.`, `${path}.variants`, asset.semanticId);
    if (categoryContract?.requiresDirections && (!Array.isArray(asset.directions) || asset.directions.length === 0)) error(errors, "category-directions-required", `${asset.semanticId} requires directional metadata for ${categoryContract.id}.`, `${path}.directions`, asset.semanticId);
    if (categoryContract?.requiresAnimationContract && (!Array.isArray(asset.animations) || asset.animations.length === 0)) error(errors, "category-animations-required", `${asset.semanticId} requires animation definitions for ${categoryContract.id}.`, `${path}.animations`, asset.semanticId);
    if (categoryContract?.requiresAccessibilityMetadata && (!asset.accessibility?.labelKey || !(asset.accessibility?.minimumRenderedSize?.width > 0) || !(asset.accessibility?.minimumRenderedSize?.height > 0) || !(asset.accessibility?.minimumContrastRatio >= 3))) error(errors, "missing-accessibility-contract", `${asset.semanticId} requires UI readability/accessibility metadata.`, `${path}.accessibility`, asset.semanticId);
    validateCategoryRequiredMetadata(asset, categoryContract, errors, path);
    if (!isAudio && (!asset.artRules?.artBibleVersion || !asset.artRules?.palette || !asset.artRules?.outline || !asset.artRules?.lighting || !asset.artRules?.shadow)) error(errors, "incomplete-art-rules", `${asset.semanticId} has incomplete art-bible rules.`, `${path}.artRules`, asset.semanticId);
    if (!isAudio && asset.artRules?.artBibleVersion !== manifest.artBibleVersion) error(errors, "art-bible-version-mismatch", `${asset.semanticId} does not use manifest art bible ${manifest.artBibleVersion}.`, `${path}.artRules.artBibleVersion`, asset.semanticId);
    if (!asset.provenance?.originType || !asset.provenance?.specificationVersion || !asset.provenance?.assetVersion) error(errors, "incomplete-provenance", `${asset.semanticId} has incomplete provenance/version metadata.`, `${path}.provenance`, asset.semanticId);
    if (!manifest.runtimeFallbackSemanticIds?.includes(asset.validation?.fallbackSemanticId)) error(errors, "missing-fallback", `${asset.semanticId} references an unregistered production fallback.`, `${path}.validation.fallbackSemanticId`, asset.semanticId);
    const socketIds = new Set();
    for (const socket of asset.sockets || []) {
      if (!socket.id || socketIds.has(socket.id)) error(errors, "duplicate-socket-id", `${asset.semanticId} contains a duplicate or missing socket id.`, `${path}.sockets`, asset.semanticId);
      socketIds.add(socket.id);
    }
    if (!isAudio) validateGeometry(asset, errors, path);
    if (!isAudio) {
      validateSpriteSheet(asset, errors, path);
      validateStatesAndLayers(asset, errors, path);
      validateAnchorSocketsAndAnimations(asset, errors, path);
    } else {
      validTokenList(asset.states, errors, `${path}.states`, asset);
      validTokenList(asset.variants, errors, `${path}.variants`, asset);
      validTokenList(asset.directions, errors, `${path}.directions`, asset);
      if ((asset.animations || []).length) error(errors, "audio-animation-forbidden", `${asset.semanticId} audio contract cannot declare visual animations.`, `${path}.animations`, asset.semanticId);
    }
    if (!asset.scenePackId || !String(asset.scenePackId).startsWith("pack.scene.")) error(errors, "orphaned-scene-pack", `${asset.semanticId} is not assigned to a valid scene pack.`, `${path}.scenePackId`, asset.semanticId);
    else {
      const expectedScenePacks = (asset.intendedScenes || []).map((sceneId) => `pack.scene.${String(sceneId).replace(/Scene$/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`);
      if (!expectedScenePacks.includes(asset.scenePackId)) error(errors, "unknown-scene-pack", `${asset.semanticId} scene pack is not derived from any intended scene.`, `${path}.scenePackId`, { assetId: asset.semanticId, expected: expectedScenePacks, actual: asset.scenePackId, affectedScenes: asset.intendedScenes });
    }
    for (const [role, file] of Object.entries(asset.expectedFilenames || {})) {
      const owner = fileOwners.get(file);
      if (owner) error(errors, "duplicate-output-filename", `${asset.semanticId} ${role} reuses ${file}, already owned by ${owner}.`, `${path}.expectedFilenames.${role}`, asset.semanticId);
      else fileOwners.set(file, asset.semanticId);
    }
    if (validateFiles && root && (!selectedAssetIds || selectedAssetIds.has(asset.semanticId))) metadata.set(asset.semanticId, await validateFilesForAsset(asset, root, errors, path));
  }
  for (const requiredId of policy?.requiredSemanticIds || []) if (!ids.has(requiredId)) error(errors, "missing-required-contract", `Required artwork contract ${requiredId} is absent.`, "contractPolicy.requiredSemanticIds", { expected: requiredId, actual: "missing" });
  for (const id of ids) if (policy?.allowUncontractedAssets === false && !(policy.requiredSemanticIds || []).includes(id)) error(errors, "unapproved-contract", `${id} is not listed by the manifest contract policy.`, "contractPolicy.requiredSemanticIds", { assetId: id, expected: policy.requiredSemanticIds, actual: id });
  const dependenciesById = new Map(assets.map((asset) => [asset.semanticId, asset.dependencies || []]));
  for (const [index, asset] of assets.entries()) {
    const dependencies = asset.dependencies || [];
    if (new Set(dependencies).size !== dependencies.length) error(errors, "duplicate-dependency", `${asset.semanticId} declares a dependency more than once.`, `assets[${index}].dependencies`, asset.semanticId);
    for (const dependency of dependencies) if (!ids.has(dependency)) error(errors, "missing-dependency", `${asset.semanticId} depends on unknown artwork ${dependency}.`, `assets[${index}].dependencies`, asset.semanticId);
  }
  const visiting = new Set(), visited = new Set();
  const visit = (id, trail = []) => {
    if (visiting.has(id)) {
      error(errors, "dependency-cycle", `Artwork dependency cycle detected: ${[...trail, id].join(" -> ")}.`, `assets.${id}.dependencies`, id);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of dependenciesById.get(id) || []) if (dependenciesById.has(dependency)) visit(dependency, [...trail, id]);
    visiting.delete(id); visited.add(id);
  };
  for (const id of dependenciesById.keys()) visit(id);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), metadata });
}

async function validateFilesForAsset(asset, root, errors, path) {
  return validateFiles(asset, root, errors, path);
}

export function applyArtworkFixtureMutation(manifest, fixture) {
  const clone = structuredClone(manifest);
  const asset = clone.assets.find(({ semanticId }) => semanticId === fixture.assetId);
  if (!asset) throw new Error(`Fixture target is missing: ${fixture.assetId}`);
  const apply = (mutation) => {
    if (mutation.operation === "duplicate-asset") clone.assets.push(structuredClone(asset));
    else if (mutation.operation === "remove-asset") clone.assets = clone.assets.filter(({ semanticId }) => semanticId !== fixture.assetId);
    else {
      const segments = mutation.path.split(".");
      let owner = asset;
      for (const segment of segments.slice(0, -1)) owner = owner[segment];
      const key = segments.at(-1);
      if (mutation.operation === "delete") delete owner[key];
      else owner[key] = mutation.operation === "merge" ? { ...owner[key], ...mutation.value } : mutation.value;
    }
  };
  apply(fixture);
  for (const mutation of fixture.postMutations || []) apply(mutation);
  return clone;
}
