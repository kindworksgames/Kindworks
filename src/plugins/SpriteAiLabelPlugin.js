import Phaser from "phaser";
import { spriteAiInventory, spriteAiSlug } from "../assets/spriteAiLabels.js";

function phaserKind(gameObject) {
  const type = String(gameObject?.type || gameObject?.constructor?.name || "visual").toLowerCase();
  if (type.includes("sprite") || type.includes("image")) return "sprite";
  if (type.includes("text")) return "text";
  if (type.includes("graphics") || type.includes("shape") || type.includes("rectangle") || type.includes("ellipse") || type.includes("circle")) return "vector-placeholder";
  if (type.includes("container") || type.includes("layer")) return "object-group";
  return spriteAiSlug(type, "visual");
}

function semanticName(gameObject, kind) {
  if (gameObject?.spriteAiLabelHint?.label) return gameObject.spriteAiLabelHint.label;
  if (gameObject?.name && !String(gameObject.name).startsWith("phaser.")) return gameObject.name;
  if (kind === "text" && gameObject?.text) return String(gameObject.text).replace(/\s+/g, " ").slice(0, 72);
  const textureKey = gameObject?.texture?.key;
  if (textureKey && !String(textureKey).startsWith("__")) return textureKey;
  return gameObject?.type || gameObject?.constructor?.name || kind;
}

export function setSpriteAiLabelHint(gameObject, { id, label, kind = "sprite" }) {
  if (!gameObject) return gameObject;
  gameObject.spriteAiLabelHint = Object.freeze({ id, label, kind });
  return gameObject;
}

export function labelPhaserGameObject(gameObject, { sceneKey, nextIndex } = {}) {
  if (!gameObject) return null;
  if (gameObject.spriteAiAssetId) return gameObject.spriteAiAssetId;
  const scene = spriteAiSlug(sceneKey || gameObject.scene?.sys?.settings?.key || "scene");
  const kind = gameObject.spriteAiLabelHint?.kind || phaserKind(gameObject);
  const semantic = semanticName(gameObject, kind);
  const baseId = gameObject.spriteAiLabelHint?.id || `phaser.${scene}.${kind}.${spriteAiSlug(semantic, kind)}`;
  const id = gameObject.spriteAiLabelHint?.id ? baseId : nextIndex?.(baseId) || baseId;
  const label = gameObject.spriteAiLabelHint?.label || `${String(sceneKey || gameObject.scene?.sys?.settings?.key || "Scene").replace(/Scene$/, "")} — ${semantic}`;
  gameObject.spriteAiAssetId = id;
  gameObject.spriteAiAssetLabel = label;
  gameObject.spriteAiAssetKind = kind;
  if (!gameObject.name && typeof gameObject.setName === "function") gameObject.setName(id);
  spriteAiInventory.register({ id, label, kind, source: "phaser", scene, replacement: "sprite-ai" }, gameObject);
  for (const child of gameObject.list || []) labelPhaserGameObject(child, { sceneKey, nextIndex });
  return id;
}

export class SpriteAiLabelPlugin extends Phaser.Plugins.ScenePlugin {
  boot() {
    this.counts = new Map();
    this.nextIndex = (baseId) => {
      const count = (this.counts.get(baseId) || 0) + 1;
      this.counts.set(baseId, count);
      return count === 1 ? baseId : `${baseId}.${count}`;
    };
    this.onAdded = (gameObject) => labelPhaserGameObject(gameObject, {
      sceneKey: this.scene.sys.settings.key,
      nextIndex: this.nextIndex,
    });
    const labelAndPublish = (gameObject) => {
      this.onAdded(gameObject);
      this.publishCoverage();
    };
    this.systems.displayList.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, labelAndPublish);
    this.systems.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.systems.displayList.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, labelAndPublish);
    });
    for (const gameObject of this.systems.displayList.list || []) this.onAdded(gameObject);
    this.publishCoverage();
  }

  publishCoverage() {
    if (this.coverageQueued || typeof document === "undefined") return;
    this.coverageQueued = true;
    queueMicrotask(() => {
      this.coverageQueued = false;
      const audit = this.audit();
      if (!document.body || document.body.dataset.gameScene !== audit.scene) return;
      document.body.dataset.spriteAiPhaserScene = audit.scene;
      document.body.dataset.spriteAiPhaserTotal = String(audit.total);
      document.body.dataset.spriteAiPhaserLabelled = String(audit.labelled);
      document.body.dataset.spriteAiPhaserComplete = String(audit.missing.length === 0);
    });
  }

  audit() {
    const objects = [];
    const visit = (gameObject) => {
      if (!gameObject || objects.includes(gameObject)) return;
      objects.push(gameObject);
      for (const child of gameObject.list || []) visit(child);
    };
    for (const gameObject of this.systems.displayList.list || []) visit(gameObject);
    const missing = objects.filter((gameObject) => !gameObject.spriteAiAssetId);
    return Object.freeze({
      scene: this.scene.sys.settings.key,
      total: objects.length,
      labelled: objects.length - missing.length,
      missing,
    });
  }
}
