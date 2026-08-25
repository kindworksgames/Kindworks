import { LIGHTING_CONFIG, formatWorldClock, getLightingForMinutes } from "../data/worldSimulation.js";

export class WorldHudController {
  constructor(gameState) {
    this.gameState = gameState;
    this.clock = document.querySelector("#world-clock-status");
    this.weather = document.querySelector("#weather-status");
    this.lighting = document.querySelector("#world-lighting-overlay");
    this.effects = document.querySelector("#weather-effects");
    this.unsubscribe = this.gameState.subscribe((state) => this.render(state.world));
    this.render(this.gameState.getSnapshot().world);
  }

  render(world) {
    const weather = world.weather.current;
    const lighting = getLightingForMinutes(world.clockMinutes);
    const time = formatWorldClock(world.clockMinutes);
    if (this.clock) {
      this.clock.textContent = `Day ${world.day} · ${time}`;
      this.clock.setAttribute("aria-label", `Day ${world.day}, ${time}`);
    }
    if (this.weather) {
      this.weather.dataset.weather = weather.kind;
      this.weather.innerHTML = `<span aria-hidden="true">${weather.icon}</span> ${weather.label} <small>${weather.temperatureC}°C</small>`;
      this.weather.setAttribute("aria-label", `${weather.label} weather, ${weather.temperatureC} degrees Celsius, ${weather.season}, day ${weather.seasonDay}`);
      this.weather.title = `${weather.label} · ${weather.temperatureC}°C · ${weather.season}`;
    }
    if (this.lighting) {
      const [red, green, blue] = LIGHTING_CONFIG.overlayRgb;
      this.lighting.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, ${lighting.overlayAlpha.toFixed(3)})`;
      this.lighting.dataset.phase = lighting.phase;
      this.lighting.dataset.nightLevel = lighting.nightLevel.toFixed(3);
    }
    if (this.effects) {
      this.effects.dataset.weather = weather.kind;
      this.effects.style.setProperty("--weather-wind-angle", `${weather.windAngle}rad`);
    }
    document.body.dataset.weather = weather.kind;
    document.body.dataset.lightingPhase = lighting.phase;
  }

  getDiagnostics() {
    const world = this.gameState.getSnapshot().world;
    const lighting = getLightingForMinutes(world.clockMinutes);
    return {
      timeLabel: `Day ${world.day} · ${formatWorldClock(world.clockMinutes)}`,
      weatherLabel: world.weather.current.label,
      lightingPhase: lighting.phase,
      lightingAlpha: Number(lighting.overlayAlpha.toFixed(3)),
    };
  }

  destroy() {
    this.unsubscribe?.();
  }
}
