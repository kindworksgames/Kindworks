import { ASSET_LAB_CANDIDATE_INDEX } from "../generated/assetLabCandidateIndex.js";
import { PHASE_8A_VERTICAL_SLICE_PACKAGE, phase8AGameplayGeometrySignature } from "../verticalSlice/phase8aVerticalSlicePackage.js";

const waitForLoad = (scene, configure) => new Promise((resolve, reject) => {
  const onError = (file) => { cleanup(); reject(new Error(`Candidate file failed to load: ${file?.src || file?.key || "unknown"}`)); };
  const cleanup = () => scene.load.off("loaderror", onError);
  scene.load.once("complete", () => { cleanup(); resolve(); });
  scene.load.on("loaderror", onError);
  configure(); scene.load.start();
});

export class Phase8BCandidatePreviewController {
  constructor(game, semanticId) {
    if (!import.meta.env.DEV) throw new Error("Phase 8B candidate preview is development-only.");
    this.game = game;
    this.semanticId = semanticId;
  }

  async mount() {
    const candidate = ASSET_LAB_CANDIDATE_INDEX.assets?.[this.semanticId];
    const contract = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find((asset) => asset.semanticId === this.semanticId);
    if (!candidate || !contract) throw new Error(`No prepared Phase 8B candidate for ${this.semanticId}.`);
    if (candidate.validationStatus !== "valid") throw new Error(`${this.semanticId} is blocked by candidate validation.`);
    const placement = contract.scenePlacement?.[0];
    const scene = this.game.scene.getScene(placement.sceneId);
    if (!scene?.scene?.isActive()) throw new Error(`${placement.sceneId} must be active to preview ${this.semanticId}.`);
    const key = `kw.phase8b.preview.${this.semanticId}.${candidate.candidateSha256.slice(0, 12)}`;
    if (!scene.textures.exists(key)) await waitForLoad(scene, () => {
      if (candidate.kind === "spritesheet") scene.load.spritesheet(key, candidate.sourceUrl, { frameWidth: candidate.technical.frameWidth, frameHeight: candidate.technical.frameHeight });
      else scene.load.image(key, candidate.sourceUrl);
    });
    const object = candidate.kind === "spritesheet" ? scene.add.sprite(0, 0, key, 0) : scene.add.image(0, 0, key);
    const worldOrigin = placement.worldOrigin || { x: 0, y: 0 };
    const offset = candidate.visualOffset || { x: 0, y: 0 };
    object.setPosition(worldOrigin.x + placement.position.x + offset.x, worldOrigin.y + placement.position.y + offset.y);
    object.setOrigin(contract.anchor?.normalized?.x ?? 0.5, contract.anchor?.normalized?.y ?? 0.5);
    object.setDisplaySize(contract.masterScale.logicalDisplay.width, contract.masterScale.logicalDisplay.height);
    object.setDepth(9990).disableInteractive();
    object.setData({
      developmentOnly: true,
      semanticAssetId: contract.semanticId,
      visualPrefabId: contract.prefabId,
      visualInstanceId: placement.instanceId,
      candidateContract: contract,
      candidateGeometrySignature: phase8AGameplayGeometrySignature(contract.geometry),
      gameplayGeometryLocked: true,
    });
    if (candidate.kind === "spritesheet" && contract.animations?.[0]) {
      const animation = contract.animations[0];
      const animationKey = `${key}.${animation.id}`;
      if (!scene.anims.exists(animationKey)) scene.anims.create({ key: animationKey, frames: animation.frames.map((frame) => ({ key, frame })), frameRate: animation.frameRate, repeat: animation.repeat });
      object.play(animationKey);
    }
    scene.cameras.main.centerOn(object.x, object.y);
    this.object = object;
    document.body.dataset.candidatePreviewReady = "true";
    document.body.dataset.candidatePreviewAsset = this.semanticId;
    document.body.dataset.candidatePreviewScene = placement.sceneId;
    document.body.dataset.candidatePreviewGeometry = object.getData("candidateGeometrySignature");
    document.body.dataset.candidatePreviewPlacement = JSON.stringify({ x: object.x, y: object.y, visualOffset: offset });
    document.body.dataset.candidatePreviewInput = "disabled";
    return object;
  }
}
