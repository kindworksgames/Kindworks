import {
  LEGACY_CANDIDATES,
  LEGACY_COMPATIBLE_VERSIONS,
  LEGACY_RECOVERY_KEY,
} from "./constants.js";
import { createGameStateFromLegacy } from "./GameState.js";
import { verifyLegacyIntegrity } from "./checksum.js";

const COMPATIBLE = new Set(LEGACY_COMPATIBLE_VERSIONS);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateLegacyShape(data) {
  const errors = [];
  const warnings = [];
  const version = Number(data?.version);
  if (!isObject(data)) return { ok: false, errors: ["Save root must be an object."], warnings };
  if (!Number.isInteger(version) || !COMPATIBLE.has(version)) errors.push(`Unsupported legacy save version ${data.version ?? "unknown"}.`);
  if (data.worldDay != null && (!Number.isFinite(Number(data.worldDay)) || Number(data.worldDay) < 1)) errors.push("worldDay is invalid.");
  if (data.worldClockMinutes != null && !Number.isFinite(Number(data.worldClockMinutes))) errors.push("worldClockMinutes is invalid.");
  if (data.completedJobCount != null && (!Number.isFinite(Number(data.completedJobCount)) || Number(data.completedJobCount) < 0)) errors.push("completedJobCount is invalid.");
  if (version >= 23 && data.economy != null && !isObject(data.economy)) errors.push("Economy state must be an object.");
  if (isObject(data.economy)) {
    for (const field of ["coins", "lifetimeCoinsEarned", "lifetimeCoinsSpent"]) {
      if (data.economy[field] != null && (!Number.isInteger(Number(data.economy[field])) || Number(data.economy[field]) < 0)) errors.push(`economy.${field} is invalid.`);
    }
    if (data.economy.inventory != null && !isObject(data.economy.inventory)) errors.push("economy.inventory must be an object.");
  }
  if (data.npcs != null && !Array.isArray(data.npcs)) errors.push("NPC state must be an array.");
  if (data.animals != null && !isObject(data.animals)) errors.push("Animal state must be an object.");
  if (data.playerSetup != null && !isObject(data.playerSetup)) errors.push("Player setup state must be an object.");
  if (version < 23 && data.economy == null) warnings.push("This save predates the shared economy schema; later migration will apply legacy defaults.");
  if (data.playerSetup == null) warnings.push("Player setup is missing and will use Willowmere defaults.");
  return { ok: errors.length === 0, errors, warnings };
}

export class LegacySaveImporter {
  constructor(storage) {
    this.storage = storage;
  }

  read(key) {
    try {
      return { ok: true, raw: this.storage?.getItem?.(key) ?? null };
    } catch (error) {
      return { ok: false, error: `Storage read failed for ${key}: ${String(error)}` };
    }
  }

  validateRaw(raw, { sourceKey, sourceKind }) {
    if (!raw) return { ok: false, sourceKey, sourceKind, errors: ["Save is empty."], warnings: [] };
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, sourceKey, sourceKind, errors: ["Save contains invalid JSON."], warnings: [] };
    }
    const shape = validateLegacyShape(data);
    const integrity = verifyLegacyIntegrity(data);
    const errors = [...shape.errors];
    const warnings = [...shape.warnings];
    if (integrity === "invalid") errors.push("Legacy integrity seal does not match the save contents.");
    if (integrity === "missing") warnings.push("Legacy integrity seal is missing; the compatible payload was inspected without modifying it.");
    return {
      ok: errors.length === 0,
      sourceKey,
      sourceKind,
      legacyVersion: Number(data?.version),
      integrity,
      errors,
      warnings,
      data: errors.length === 0 ? data : null,
    };
  }

  inspect() {
    const reports = [];
    for (const candidate of LEGACY_CANDIDATES) {
      const result = this.read(candidate.key);
      if (!result.ok) {
        reports.push({ ok: false, sourceKey: candidate.key, sourceKind: candidate.kind, errors: [result.error], warnings: [] });
        continue;
      }
      if (!result.raw) continue;
      reports.push(this.validateRaw(result.raw, { sourceKey: candidate.key, sourceKind: candidate.kind }));
    }

    const recoveryRead = this.read(LEGACY_RECOVERY_KEY);
    if (recoveryRead.ok && recoveryRead.raw) {
      try {
        const recovery = JSON.parse(recoveryRead.raw);
        if (typeof recovery?.raw === "string") {
          reports.push(this.validateRaw(recovery.raw, {
            sourceKey: LEGACY_RECOVERY_KEY,
            sourceKind: "recovery",
          }));
        } else {
          reports.push({ ok: false, sourceKey: LEGACY_RECOVERY_KEY, sourceKind: "recovery", errors: ["Recovery envelope has no raw save payload."], warnings: [] });
        }
      } catch {
        reports.push({ ok: false, sourceKey: LEGACY_RECOVERY_KEY, sourceKind: "recovery", errors: ["Recovery envelope contains invalid JSON."], warnings: [] });
      }
    }

    const selected = reports.find((report) => report.ok) || null;
    return {
      ok: Boolean(selected),
      found: reports.length > 0,
      selected,
      reports,
      reason: selected ? null : reports.length ? "No compatible valid legacy save was found." : "No legacy save was found.",
    };
  }

  createImportedState(report, options) {
    if (!report?.ok || !report.data) throw new TypeError("A successful legacy report is required.");
    return createGameStateFromLegacy(report.data, report, options);
  }
}
