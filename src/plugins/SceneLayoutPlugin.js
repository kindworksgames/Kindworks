import Phaser from "phaser";
import { applyLayoutSurfaces, SceneLayoutRuntime } from "../visual/layouts/SceneLayoutRuntime.js";
import { getSceneLayout } from "../visual/layouts/sceneLayoutCatalog.js";

export class SceneLayoutPlugin extends Phaser.Plugins.ScenePlugin {
  boot() {
    this.layout = getSceneLayout(this.scene.sys.settings.key);
    this.runtime = null;
    this.startRuntime = () => {
      this.runtime?.shutdown();
      this.runtime = this.layout ? new SceneLayoutRuntime(this.scene, this.layout) : null;
      if (this.layout) applyLayoutSurfaces(this.layout);
    };
    this.shutdownRuntime = () => { this.runtime?.shutdown(); this.runtime = null; };
    this.systems.events.on(Phaser.Scenes.Events.START, this.startRuntime);
    this.systems.events.on(Phaser.Scenes.Events.SHUTDOWN, this.shutdownRuntime);
    this.systems.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.shutdownRuntime();
      this.systems.events.off(Phaser.Scenes.Events.START, this.startRuntime);
      this.systems.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdownRuntime);
    });
    this.startRuntime();
  }

  register(instanceId, object, options) {
    if (!this.runtime) throw new Error(`[missing-scene-layout-runtime] ${this.scene.sys.settings.key}: Cannot register ${instanceId}.`);
    return this.runtime.register(instanceId, object, options);
  }

  applyVisualPosition(instanceId, position) { return this.runtime?.applyVisualPosition(instanceId, position) || false; }
  registeredCount(instanceId) { return this.runtime?.registeredCount(instanceId) || 0; }
}
