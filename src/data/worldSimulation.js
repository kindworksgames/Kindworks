export const WORLD_TIME_CONFIG = Object.freeze({
  startMinute: 7 * 60,
  gameMinutesPerRealSecond: 1,
  minutesPerDay: 1440,
  maxOfflineGameMinutes: 3 * 1440,
  saveEveryGameMinutes: 5,
});

export const WEATHER_CONFIG = Object.freeze({
  schemaVersion: 1,
  seasonLengthDays: 28,
  historyLimit: 32,
  seasons: Object.freeze(["spring", "summer", "autumn", "winter"]),
  weights: Object.freeze({
    spring: Object.freeze({ clear: 0.43, rain: 0.32, windy: 0.20, snow: 0.05 }),
    summer: Object.freeze({ clear: 0.62, rain: 0.23, windy: 0.15, snow: 0 }),
    autumn: Object.freeze({ clear: 0.34, rain: 0.29, windy: 0.32, snow: 0.05 }),
    winter: Object.freeze({ clear: 0.28, rain: 0.18, windy: 0.24, snow: 0.30 }),
  }),
});

export const WEATHER_KINDS = Object.freeze({
  clear: Object.freeze({ kind: "clear", label: "Clear", icon: "☀️", rain: 0, snow: 0, cloudiness: 0.08, windStrength: 0.18, evaporation: 1, growth: 0.88, weeds: 0.82, temperatureBase: 16 }),
  rain: Object.freeze({ kind: "rain", label: "Rain", icon: "🌧️", rain: 1, snow: 0, cloudiness: 0.86, windStrength: 0.42, evaporation: 0.18, growth: 1.22, weeds: 1.18, temperatureBase: 10 }),
  snow: Object.freeze({ kind: "snow", label: "Snow", icon: "❄️", rain: 0.34, snow: 1, cloudiness: 0.72, windStrength: 0.32, evaporation: 0.12, growth: 0.46, weeds: 0.52, temperatureBase: -2 }),
  windy: Object.freeze({ kind: "windy", label: "Very windy", icon: "🌬️", rain: 0, snow: 0, cloudiness: 0.34, windStrength: 1, evaporation: 1.35, growth: 0.82, weeds: 0.85, temperatureBase: 12 }),
});

export const LIGHTING_CONFIG = Object.freeze({
  dawnStart: 5,
  dawnEnd: 7,
  duskStart: 18,
  duskEnd: 20,
  maxOverlayAlpha: 0.36,
  overlayRgb: Object.freeze([15, 27, 58]),
});

function hashUnit(text) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function seededUnit(key, number) {
  return hashUnit(`${key}:${number}`);
}

export function getSeasonForDay(value) {
  const day = Math.max(1, Math.floor(Number(value) || 1));
  const index = Math.floor((day - 1) / WEATHER_CONFIG.seasonLengthDays) % WEATHER_CONFIG.seasons.length;
  return Object.freeze({
    id: WEATHER_CONFIG.seasons[index],
    index,
    dayInSeason: ((day - 1) % WEATHER_CONFIG.seasonLengthDays) + 1,
  });
}

export function getWeatherForDay(value) {
  const day = Math.max(1, Math.floor(Number(value) || 1));
  const season = getSeasonForDay(day);
  const weights = WEATHER_CONFIG.weights[season.id];
  const roll = seededUnit(`town-weather-${day}`, 174);
  let cursor = 0;
  let kind = "clear";
  for (const candidate of ["clear", "rain", "windy", "snow"]) {
    cursor += Number(weights[candidate]) || 0;
    if (roll < cursor) {
      kind = candidate;
      break;
    }
  }
  const base = WEATHER_KINDS[kind];
  const seasonTemperature = { spring: 4, summer: 9, autumn: 1, winter: -5 }[season.id] || 0;
  const temperatureC = Math.round(base.temperatureBase + seasonTemperature + (seededUnit(`weather-temperature-${day}`, 174) - 0.5) * 5);
  const windAngle = -Math.PI + seededUnit(`weather-wind-angle-${day}`, 174) * Math.PI * 2;
  return Object.freeze({ ...base, day, season: season.id, seasonDay: season.dayInSeason, temperatureC, windAngle });
}

function smoothstep01(value) {
  const amount = Math.max(0, Math.min(1, Number(value) || 0));
  return amount * amount * (3 - 2 * amount);
}

export function getLightingForMinutes(value) {
  const minutes = ((Number(value) % WORLD_TIME_CONFIG.minutesPerDay) + WORLD_TIME_CONFIG.minutesPerDay) % WORLD_TIME_CONFIG.minutesPerDay;
  const hour = minutes / 60;
  const config = LIGHTING_CONFIG;
  let nightLevel = 0;
  if (hour >= config.duskEnd || hour < config.dawnStart) nightLevel = 1;
  else if (hour >= config.duskStart) nightLevel = smoothstep01((hour - config.duskStart) / (config.duskEnd - config.duskStart));
  else if (hour < config.dawnEnd) nightLevel = 1 - smoothstep01((hour - config.dawnStart) / (config.dawnEnd - config.dawnStart));
  const phase = nightLevel <= 0.02
    ? "day"
    : hour >= config.duskStart && hour < config.duskEnd
      ? "dusk"
      : hour >= config.dawnStart && hour < config.dawnEnd
        ? "dawn"
        : "night";
  return Object.freeze({ hour, nightLevel, overlayAlpha: nightLevel * config.maxOverlayAlpha, phase });
}

export function formatWorldClock(value) {
  const minutes = ((Math.floor(Number(value) || 0) % WORLD_TIME_CONFIG.minutesPerDay) + WORLD_TIME_CONFIG.minutesPerDay) % WORLD_TIME_CONFIG.minutesPerDay;
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
