import { ITEM_CATALOG, placeableFootprintFor } from "../../data/items.js";
import {
  TOWN_BIN_PREFAB_IDS,
  TOWN_BIN_VARIANTS,
  townBinPrefabIdForVariant,
  townBinStateIdForVariant,
  townBinVariantForItem,
} from "../prefabs/townBinPrefabs.js";
import { PhaserPrefabRenderer } from "./PhaserPrefabRenderer.js";

const FACTORIES = new WeakMap();

function tag(target, resolved, instanceId) {
  target.setData?.("visualInstanceId", instanceId);
  target.setData?.("visualPrefabId", resolved.prefab.id);
  target.setData?.("semanticAssetId", resolved.layers.find((layer) => layer.role === "main")?.asset.id);
  target.setData?.("visualStateId", resolved.stateMap?.id || null);
  target.setData?.("visualState", resolved.stateName);
  target.setData?.("visualVariant", resolved.variant);
}

export class TownBinVisualFactory {
  constructor(scene) {
    this.scene = scene;
    this.renderer = new PhaserPrefabRenderer(scene);
  }

  preload() { this.renderer.preload(Object.values(TOWN_BIN_PREFAB_IDS)); }

  resolveVariant(variant, state = "normal") {
    return this.renderer.resolve(
      townBinPrefabIdForVariant(variant),
      townBinStateIdForVariant(variant),
      state,
    );
  }

  resolveItem(itemId, state = "normal") {
    const variant = townBinVariantForItem(itemId);
    return variant ? this.resolveVariant(variant, state) : null;
  }

  createPlacedObject(object, { preview = false, valid = true, onSelect = null } = {}) {
    const item = ITEM_CATALOG[object.itemId];
    const resolved = this.resolveItem(object.itemId);
    if (!item || !resolved) return null;
    const footprint = placeableFootprintFor(item);
    const container = this.scene.add.container(object.x, object.y);
    const replacement = this.renderer.createImageLayer(resolved);
    container.add(replacement || this.#drawPlaced(resolved));
    if (preview) {
      const outline = this.scene.add.graphics();
      outline.lineStyle(5, valid ? 0x2f7d48 : 0xb44f45, 0.95).strokeCircle(0, 0, footprint);
      outline.lineStyle(2, 0xffffff, 0.8).strokeCircle(0, 0, Math.max(8, footprint - 6));
      container.addAt(outline, 0);
      container.setAlpha(0.7);
    }
    container.setRotation(Number(object.rotation) || 0);
    container.setDepth(this.renderer.depthFor(resolved, preview ? "preview" : "placed", object.y));
    container.setSize(footprint * 2, footprint * 2);
    if (!preview && typeof onSelect === "function") {
      container.setInteractive();
      container.input.cursor = "pointer";
      container.on("pointerdown", (pointer) => {
        pointer.event?.stopPropagation?.();
        onSelect(object.id);
      });
    }
    container.setData("placedObjectId", object.id || "preview");
    container.setData("itemId", item.id);
    container.setData("footprint", footprint);
    tag(container, resolved, `instance.town-bin.placed.${object.id || "preview"}`);
    return container;
  }

  createPublicBin(bin) {
    const state = bin.tipped ? "tipped" : bin.fill >= bin.capacity ? "full" : "normal";
    const resolved = this.resolveVariant(TOWN_BIN_VARIANTS.PUBLIC, state);
    const recipe = resolved.prefab.proceduralRecipe.public;
    const container = this.scene.add.container(bin.x, bin.y).setDepth(this.renderer.depthFor(resolved, "public", bin.y));
    container.setData("collectionIdentity", `public:${bin.id}`);
    const replacement = this.renderer.createImageLayer(resolved);
    if (replacement) container.add(replacement);
    else {
      const shadow = this.scene.add.ellipse(recipe.shadow.x, recipe.shadow.y, recipe.shadow.width, recipe.shadow.height, recipe.shadow.color, recipe.shadow.alpha);
      const body = this.scene.add.rectangle(bin.tipped ? recipe.body.tippedX : recipe.body.x, bin.tipped ? recipe.body.tippedY : recipe.body.y, recipe.body.width, recipe.body.height, bin.tipped ? recipe.body.tippedColor : recipe.body.color).setStrokeStyle(recipe.body.strokeWidth, recipe.body.strokeColor, 0.9);
      if (bin.tipped) body.setRotation(recipe.tippedRotation);
      const lid = this.scene.add.rectangle(bin.tipped ? recipe.lid.tippedX : recipe.lid.x, bin.tipped ? recipe.lid.tippedY : recipe.lid.y, recipe.lid.width, recipe.lid.height, recipe.lid.color);
      if (bin.tipped) lid.setRotation(recipe.tippedRotation);
      container.add([shadow, body, lid]);
    }
    const fill = this.scene.add.text(recipe.fillLabel.x, recipe.fillLabel.y, `${bin.fill}/${bin.capacity}`, {
      color: recipe.fillLabel.color,
      fontFamily: recipe.fillLabel.fontFamily,
      fontSize: recipe.fillLabel.fontSize,
      fontStyle: recipe.fillLabel.fontStyle,
      backgroundColor: recipe.fillLabel.backgroundColor,
      padding: recipe.fillLabel.padding,
    }).setOrigin(0.5);
    const warningText = bin.tipped ? recipe.warning.tippedText : bin.fill >= bin.capacity ? recipe.warning.fullText : "";
    const warning = this.scene.add.text(recipe.warning.x, recipe.warning.y, warningText, { fontSize: recipe.warning.fontSize }).setOrigin(0.5);
    container.add([fill, warning]);
    tag(container, resolved, `instance.town-bin.public.${bin.id}`);
    return container;
  }

  createCollectionBin() {
    const resolved = this.resolveVariant(TOWN_BIN_VARIANTS.PUBLIC, "carried");
    const recipe = resolved.prefab.proceduralRecipe.collection;
    const container = this.scene.add.container(0, 0).setVisible(false);
    const replacement = this.renderer.createImageLayer(resolved);
    if (replacement) container.add(replacement);
    else {
      const graphic = this.scene.add.graphics();
      graphic.fillStyle(recipe.shadow.color, recipe.shadow.alpha).fillEllipse(recipe.shadow.x, recipe.shadow.y, recipe.shadow.width, recipe.shadow.height);
      graphic.fillStyle(recipe.lid.color, 1).fillRoundedRect(recipe.lid.x, recipe.lid.y, recipe.lid.width, recipe.lid.height, recipe.lid.radius);
      graphic.fillStyle(recipe.body.color, 1).fillRoundedRect(recipe.body.x, recipe.body.y, recipe.body.width, recipe.body.height, recipe.body.radius);
      graphic.fillStyle(recipe.mark.color, recipe.mark.alpha).fillCircle(recipe.mark.x, recipe.mark.y, recipe.mark.radius);
      container.add(graphic);
    }
    tag(container, resolved, "instance.town-bin.collection.active");
    return container;
  }

  #drawPlaced(resolved) {
    const recipe = resolved.prefab.proceduralRecipe.placed;
    const graphic = this.scene.add.graphics();
    graphic.fillStyle(recipe.shadow.color, recipe.shadow.alpha).fillEllipse(recipe.shadow.x, recipe.shadow.y, recipe.shadow.width, recipe.shadow.height);
    graphic.fillStyle(recipe.lid.color, 1).fillRoundedRect(recipe.lid.x, recipe.lid.y, recipe.lid.width, recipe.lid.height, recipe.lid.radius);
    graphic.fillStyle(recipe.body.color, 1).fillRoundedRect(recipe.body.x, recipe.body.y, recipe.body.width, recipe.body.height, recipe.body.radius);
    if (recipe.recyclingMark) graphic.lineStyle(recipe.recyclingMark.width, recipe.recyclingMark.color, 1).strokeCircle(recipe.recyclingMark.x, recipe.recyclingMark.y, recipe.recyclingMark.radius);
    return graphic;
  }
}

export function getTownBinVisualFactory(scene) {
  if (!FACTORIES.has(scene)) FACTORIES.set(scene, new TownBinVisualFactory(scene));
  return FACTORIES.get(scene);
}

export function resolveTownBinVisualContract(registry, itemId, state = "normal") {
  const variant = townBinVariantForItem(itemId);
  if (!variant) return null;
  return new PhaserPrefabRenderer(null, registry).resolve(
    townBinPrefabIdForVariant(variant),
    townBinStateIdForVariant(variant),
    state,
  );
}
