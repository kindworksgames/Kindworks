import {
  APP_VERSION,
  GAME_STATE_SCHEMA_VERSION,
  PHASER_BACKUP_KEY,
  PHASER_RECOVERY_KEY,
  PHASER_SAVE_FORMAT,
  PHASER_SAVE_KEY,
  SUPPORTED_GAME_STATE_SCHEMA_VERSIONS,
} from "./constants.js";
import { checksumValue } from "./checksum.js";
import { upgradeGameState, validateGameState } from "./GameState.js";

const SUPPORTED_SCHEMAS = new Set(SUPPORTED_GAME_STATE_SCHEMA_VERSIONS);

export function createSaveEnvelope(data, { now = Date.now(), appVersion = APP_VERSION } = {}) {
  const body = {
    format: PHASER_SAVE_FORMAT,
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    writtenAt: new Date(now).toISOString(),
    appVersion,
    data: structuredClone(data),
  };
  return { ...body, checksum: checksumValue(body) };
}

export function validateSaveEnvelope(envelope) {
  const errors = [];
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) return { ok: false, errors: ["Save envelope must be an object."] };
  if (envelope.format !== PHASER_SAVE_FORMAT) errors.push("Save format is not Kindworks Phaser.");
  if (!SUPPORTED_SCHEMAS.has(envelope.schemaVersion)) errors.push("Save schema version is unsupported.");
  if (Number.isNaN(new Date(envelope.writtenAt).getTime())) errors.push("Save timestamp is invalid.");
  const body = {
    format: envelope.format,
    schemaVersion: envelope.schemaVersion,
    writtenAt: envelope.writtenAt,
    appVersion: envelope.appVersion,
    data: envelope.data,
  };
  if (envelope.checksum !== checksumValue(body)) errors.push("Save checksum does not match its contents.");
  const upgradedData = upgradeGameState(envelope.data, { now: Date.parse(envelope.writtenAt) || Date.now() });
  const stateValidation = validateGameState(upgradedData);
  errors.push(...stateValidation.errors);
  return {
    ok: errors.length === 0,
    errors,
    upgradedData: errors.length === 0 ? upgradedData : null,
    needsMigration: errors.length === 0 && (
      envelope.schemaVersion !== GAME_STATE_SCHEMA_VERSION
      || envelope.data?.schemaVersion !== GAME_STATE_SCHEMA_VERSION
    ),
  };
}

function parseEnvelope(raw) {
  if (!raw) return { ok: false, errors: ["Save is empty."] };
  try {
    const envelope = JSON.parse(raw);
    const validation = validateSaveEnvelope(envelope);
    return {
      ...validation,
      envelope: validation.ok ? envelope : null,
      state: validation.ok ? validation.upgradedData : null,
    };
  } catch {
    return { ok: false, errors: ["Save contains invalid JSON."], envelope: null };
  }
}

export class SaveRepository {
  constructor(storage) {
    this.storage = storage;
    this.lastResult = { ok: true, status: "not-started" };
  }

  safeRead(key) {
    try {
      return { ok: true, raw: this.storage?.getItem?.(key) ?? null };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  }

  writeRecovery(payload) {
    try {
      this.storage?.setItem?.(PHASER_RECOVERY_KEY, JSON.stringify({
        format: 1,
        capturedAt: new Date().toISOString(),
        ...payload,
      }));
      return true;
    } catch {
      return false;
    }
  }

  load() {
    const failures = [];
    for (const [key, kind] of [[PHASER_SAVE_KEY, "current"], [PHASER_BACKUP_KEY, "backup"]]) {
      const read = this.safeRead(key);
      if (!read.ok) {
        const result = { ok: false, status: "storage-error", reason: read.error, failures };
        this.lastResult = result;
        return result;
      }
      if (!read.raw) continue;
      const parsed = parseEnvelope(read.raw);
      if (!parsed.ok) {
        failures.push(`${key}: ${parsed.errors.join(" ")}`);
        if (kind === "current") this.writeRecovery({ sourceKey: key, reason: parsed.errors.join(" "), raw: read.raw });
        continue;
      }
      const result = {
        ok: true,
        status: kind === "current" ? "loaded" : "recovered-backup",
        sourceKey: key,
        recovered: kind === "backup",
        state: structuredClone(parsed.state),
        envelope: parsed.envelope,
        needsMigration: parsed.needsMigration,
        failures,
      };
      this.lastResult = result;
      return result;
    }
    const result = { ok: false, status: failures.length ? "invalid" : "not-found", reason: failures.length ? "No valid Phaser save could be loaded." : "No Phaser save exists yet.", failures };
    this.lastResult = result;
    return result;
  }

  save(state, options = {}) {
    const validation = validateGameState(state);
    if (!validation.ok) {
      const result = { ok: false, status: "validation-failed", errors: validation.errors };
      this.lastResult = result;
      return result;
    }

    const candidate = JSON.stringify(createSaveEnvelope(state, options));
    const previousRead = this.safeRead(PHASER_SAVE_KEY);
    if (!previousRead.ok) {
      const result = { ok: false, status: "storage-error", reason: previousRead.error };
      this.lastResult = result;
      return result;
    }

    if (previousRead.raw && previousRead.raw !== candidate) {
      const previous = parseEnvelope(previousRead.raw);
      try {
        if (previous.ok) this.storage.setItem(PHASER_BACKUP_KEY, previousRead.raw);
        else this.writeRecovery({ sourceKey: PHASER_SAVE_KEY, reason: previous.errors.join(" "), raw: previousRead.raw });
      } catch (error) {
        const result = { ok: false, status: "backup-failed", reason: String(error) };
        this.lastResult = result;
        return result;
      }
    }

    try {
      this.storage.setItem(PHASER_SAVE_KEY, candidate);
      const verificationRead = this.storage.getItem(PHASER_SAVE_KEY);
      const verification = parseEnvelope(verificationRead);
      if (!verification.ok || verificationRead !== candidate) throw new Error(verification.errors?.join(" ") || "Read-back contents changed.");
      const result = { ok: true, status: "saved", key: PHASER_SAVE_KEY, bytes: candidate.length, writtenAt: verification.envelope.writtenAt };
      this.lastResult = result;
      return result;
    } catch (error) {
      this.writeRecovery({ sourceKey: PHASER_SAVE_KEY, reason: `Phaser save verification failed: ${String(error)}`, raw: candidate, previousRaw: previousRead.raw });
      const result = { ok: false, status: "write-failed", reason: String(error), recoveryKey: PHASER_RECOVERY_KEY };
      this.lastResult = result;
      return result;
    }
  }

  getDiagnostics() {
    const current = this.safeRead(PHASER_SAVE_KEY);
    const backup = this.safeRead(PHASER_BACKUP_KEY);
    const recovery = this.safeRead(PHASER_RECOVERY_KEY);
    return {
      namespace: PHASER_SAVE_KEY,
      hasCurrent: Boolean(current.ok && current.raw),
      hasBackup: Boolean(backup.ok && backup.raw),
      hasRecovery: Boolean(recovery.ok && recovery.raw),
      lastResult: { ...this.lastResult },
    };
  }
}
