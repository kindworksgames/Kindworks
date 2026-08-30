import Phaser from "phaser";
import { getTownBinVisualFactory } from "../visual/renderers/TownBinVisualFactory.js";
import { resolveTownSceneDepth, TOWN_DEPTH_POLICY_IDS } from "../visual/layouts/sceneLayoutCatalog.js";

function drawTruck(scene) {
  const container = scene.add.container(0, 0).setVisible(false);
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x222238, 0.24).fillRoundedRect(-51, 13, 102, 9, 3);
  for (const x of [-31, 29]) {
    graphics.fillStyle(0x263a31, 1).fillRoundedRect(x - 8, -23, 16, 10, 3).fillRoundedRect(x - 8, 15, 16, 10, 3);
    graphics.fillStyle(0x59655f, 1).fillRect(x - 4, -21, 8, 6).fillRect(x - 4, 17, 8, 6);
  }
  graphics.fillStyle(0x294637, 1).fillRoundedRect(-49, -22, 66, 44, 5);
  graphics.fillStyle(0xe7e3cf, 1).fillRoundedRect(-45, -18, 58, 36, 4);
  graphics.fillStyle(0x8bc86f, 1).fillRect(-40, -13, 46, 5);
  graphics.fillStyle(0x4d8a62, 1).fillRoundedRect(-28, -7, 20, 18, 4);
  graphics.fillStyle(0x294637, 1).fillRoundedRect(12, -20, 38, 40, 5);
  graphics.fillStyle(0xd8b84e, 1).fillRoundedRect(16, -16, 30, 32, 3);
  graphics.fillStyle(0x8bd0df, 1).fillRect(27, -13, 16, 11);
  graphics.fillStyle(0x79a46b, 1).fillRect(20, 3, 22, 9);
  graphics.fillStyle(0x294637, 1).fillRoundedRect(31, -27, 8, 7, 2);
  graphics.fillStyle(0xffe08a, 1).fillRect(33, -25, 4, 3);
  container.add(graphics);
  return container;
}

function drawCollector(scene) {
  const container = scene.add.container(0, 0).setVisible(false);
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x222238, 0.24).fillEllipse(-11, 14, 22, 5);
  graphics.fillStyle(0x294637, 1).fillRoundedRect(-9, 3, 7, 15, 2).fillRoundedRect(3, 3, 7, 15, 2);
  graphics.fillStyle(0x294637, 1).fillRoundedRect(-13, -17, 26, 24, 4);
  graphics.fillStyle(0xe3b83e, 1).fillRoundedRect(-9, -13, 18, 17, 2);
  graphics.fillStyle(0xffe08a, 1).fillRect(-9, -7, 18, 5);
  graphics.fillStyle(0x294637, 1).fillRect(-16, -11, 6, 20).fillRect(10, -11, 6, 20);
  graphics.fillStyle(0xe3b83e, 1).fillRect(-13, -8, 3, 14).fillRect(10, -8, 3, 14);
  graphics.fillStyle(0x294637, 1).fillRoundedRect(-9, -31, 18, 15, 4);
  graphics.fillStyle(0xb77b54, 1).fillRoundedRect(-6, -28, 12, 10, 3);
  graphics.fillStyle(0x294637, 1).fillRect(-11, -35, 22, 7);
  graphics.fillStyle(0x4d8a62, 1).fillRect(-7, -38, 14, 5);
  container.add(graphics);
  return container;
}

export function createMunicipalCollectionVehicle(scene) {
  const truck = drawTruck(scene);
  const collector = drawCollector(scene);
  const activeBin = getTownBinVisualFactory(scene).createCollectionBin();
  const label = scene.add.text(0, 0, "WEEKLY COLLECTION", {
    color: "#294637",
    fontFamily: "system-ui",
    fontSize: "11px",
    fontStyle: "bold",
    backgroundColor: "rgba(255,253,241,.94)",
    padding: { x: 7, y: 4 },
    stroke: "#fffdf1",
    strokeThickness: 1,
  }).setOrigin(0.5).setVisible(false);

  return {
    apply(presentation) {
      const visible = Boolean(presentation?.active);
      truck.setVisible(visible);
      label.setVisible(visible);
      if (!visible) {
        collector.setVisible(false);
        activeBin.setVisible(false);
        return;
      }
      const heading = presentation.truck || { headingX: 1, headingY: 0, x: 0, y: 0 };
      truck.setPosition(heading.x, heading.y).setRotation(Math.atan2(heading.headingY || 0, heading.headingX || 1));
      truck.setDepth(resolveTownSceneDepth(TOWN_DEPTH_POLICY_IDS.COLLECTION_TRUCK, heading.y));
      label.setPosition(heading.x, heading.y - 52).setDepth(resolveTownSceneDepth(TOWN_DEPTH_POLICY_IDS.COLLECTION_LABEL, heading.y));
      label.setText(`WEEKLY COLLECTION ${Math.min(presentation.stopIndex + 1, presentation.totalBins)}/${presentation.totalBins}`);
      const worker = presentation.collector;
      collector.setVisible(Boolean(worker?.visible && !worker?.onTruck));
      if (worker) collector.setPosition(worker.x, worker.y).setDepth(resolveTownSceneDepth(TOWN_DEPTH_POLICY_IDS.COLLECTION_WORKER, worker.y));
      const bin = presentation.activeBin;
      activeBin.setVisible(Boolean(bin));
      if (bin) activeBin.setPosition(bin.x, bin.y).setRotation(bin.rotation || 0).setDepth(resolveTownSceneDepth(TOWN_DEPTH_POLICY_IDS.COLLECTION_BIN, bin.y));
    },
    destroy() {
      for (const object of [truck, collector, activeBin, label]) object.destroy();
    },
    objects: { truck, collector, activeBin, label },
  };
}
