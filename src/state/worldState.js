import {
  WEATHER_CONFIG,
  WEATHER_KINDS,
  WORLD_TIME_CONFIG,
  getWeatherForDay,
} from "../data/worldSimulation.js";

function isoTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeInteger(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

function weatherHistoryForDay(day, previous = []) {
  const history = Array.isArray(previous)
    ? previous
      .filter((entry) => Number.isInteger(entry?.day) && entry.day > 0 && WEATHER_KINDS[entry.kind])
      .map((entry) => ({ day: entry.day, kind: entry.kind, season: getWeatherForDay(entry.day).season }))
    : [];
  const weather = getWeatherForDay(day);
  const existing = history.find((entry) => entry.day === day);
  if (existing) Object.assign(existing, { kind: weather.kind, season: weather.season });
  else history.push({ day, kind: weather.kind, season: weather.season });
  history.sort((a, b) => a.day - b.day);
  return history.slice(-WEATHER_CONFIG.historyLimit);
}

export function createFreshWorldState({ now = Date.now() } = {}) {
  const timestamp = isoTime(now) || new Date(0).toISOString();
  const day = 1;
  return {
    day,
    clockMinutes: WORLD_TIME_CONFIG.startMinute,
    weather: {
      schemaVersion: WEATHER_CONFIG.schemaVersion,
      current: { ...getWeatherForDay(day) },
      history: weatherHistoryForDay(day),
    },
    simulation: {
      gameMinutesPerRealSecond: WORLD_TIME_CONFIG.gameMinutesPerRealSecond,
      lastResolvedAt: timestamp,
      maxOfflineGameMinutes: WORLD_TIME_CONFIG.maxOfflineGameMinutes,
      totalOfflineGameMinutes: 0,
      lastOfflineGameMinutes: 0,
      lastOfflineWasCapped: false,
    },
  };
}

export function normalizeWorldState(value, { now = Date.now() } = {}) {
  const source = value && typeof value === "object" ? value : {};
  const day = safeInteger(source.day, 1);
  const clockMinutes = safeInteger(source.clockMinutes, 0, WORLD_TIME_CONFIG.minutesPerDay - 1);
  const fresh = createFreshWorldState({ now });
  const lastResolvedAt = isoTime(source.simulation?.lastResolvedAt) || fresh.simulation.lastResolvedAt;
  const current = getWeatherForDay(day);
  return {
    day,
    clockMinutes,
    weather: {
      schemaVersion: WEATHER_CONFIG.schemaVersion,
      current: { ...current },
      history: weatherHistoryForDay(day, source.weather?.history),
    },
    simulation: {
      gameMinutesPerRealSecond: WORLD_TIME_CONFIG.gameMinutesPerRealSecond,
      lastResolvedAt,
      maxOfflineGameMinutes: WORLD_TIME_CONFIG.maxOfflineGameMinutes,
      totalOfflineGameMinutes: safeInteger(source.simulation?.totalOfflineGameMinutes, 0),
      lastOfflineGameMinutes: safeInteger(source.simulation?.lastOfflineGameMinutes, 0, WORLD_TIME_CONFIG.maxOfflineGameMinutes),
      lastOfflineWasCapped: Boolean(source.simulation?.lastOfflineWasCapped),
    },
  };
}

export function advanceWorldState(value, gameMinutes, { now = Date.now(), offline = false } = {}) {
  const world = normalizeWorldState(value, { now });
  const requested = Math.max(0, Math.floor(Number(gameMinutes) || 0));
  const advanced = offline ? Math.min(requested, WORLD_TIME_CONFIG.maxOfflineGameMinutes) : requested;
  const absolute = (world.day - 1) * WORLD_TIME_CONFIG.minutesPerDay + world.clockMinutes + advanced;
  const nextDay = Math.floor(absolute / WORLD_TIME_CONFIG.minutesPerDay) + 1;
  const nextMinutes = absolute % WORLD_TIME_CONFIG.minutesPerDay;
  for (let day = world.day + 1; day <= nextDay; day += 1) {
    world.weather.history = weatherHistoryForDay(day, world.weather.history);
  }
  world.day = nextDay;
  world.clockMinutes = nextMinutes;
  world.weather.current = { ...getWeatherForDay(nextDay) };
  world.weather.history = weatherHistoryForDay(nextDay, world.weather.history);
  world.simulation.lastResolvedAt = isoTime(now) || world.simulation.lastResolvedAt;
  world.simulation.lastOfflineGameMinutes = offline ? advanced : 0;
  world.simulation.lastOfflineWasCapped = offline && requested > advanced;
  if (offline) world.simulation.totalOfflineGameMinutes += advanced;
  return {
    world,
    requestedGameMinutes: requested,
    advancedGameMinutes: advanced,
    crossedDays: nextDay - (Math.floor(((absolute - advanced) / WORLD_TIME_CONFIG.minutesPerDay)) + 1),
    capped: offline && requested > advanced,
  };
}

export function validateWorldState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["World state must be an object."] };
  if (!Number.isInteger(value.day) || value.day < 1) errors.push("World day must be a positive integer.");
  if (!Number.isInteger(value.clockMinutes) || value.clockMinutes < 0 || value.clockMinutes >= WORLD_TIME_CONFIG.minutesPerDay) errors.push("World clock must be between 0 and 1439 minutes.");
  if (value.weather?.schemaVersion !== WEATHER_CONFIG.schemaVersion) errors.push("Weather schema version is invalid.");
  if (!WEATHER_KINDS[value.weather?.current?.kind]) errors.push("Current weather kind is invalid.");
  if (value.weather?.current?.day !== value.day) errors.push("Current weather day does not match the world day.");
  if (!Array.isArray(value.weather?.history) || value.weather.history.length < 1 || value.weather.history.length > WEATHER_CONFIG.historyLimit) errors.push("Weather history is invalid.");
  if (value.simulation?.gameMinutesPerRealSecond !== WORLD_TIME_CONFIG.gameMinutesPerRealSecond) errors.push("World clock rate is invalid.");
  if (!isoTime(value.simulation?.lastResolvedAt)) errors.push("World simulation timestamp is invalid.");
  if (value.simulation?.maxOfflineGameMinutes !== WORLD_TIME_CONFIG.maxOfflineGameMinutes) errors.push("Offline progression cap is invalid.");
  if (!Number.isInteger(value.simulation?.totalOfflineGameMinutes) || value.simulation.totalOfflineGameMinutes < 0) errors.push("Offline progression total is invalid.");
  if (!Number.isInteger(value.simulation?.lastOfflineGameMinutes) || value.simulation.lastOfflineGameMinutes < 0 || value.simulation.lastOfflineGameMinutes > WORLD_TIME_CONFIG.maxOfflineGameMinutes) errors.push("Last offline progression amount is invalid.");
  if (typeof value.simulation?.lastOfflineWasCapped !== "boolean") errors.push("Offline cap marker is invalid.");
  return { ok: errors.length === 0, errors };
}
