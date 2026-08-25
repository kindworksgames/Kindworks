import {
  CUSTOM_RESIDENT_APPEARANCE,
  CUSTOM_RESIDENT_HOBBIES,
  CUSTOM_RESIDENT_ID,
  PERSONAL_HOME_NAME,
  PERSONAL_HOME_OPTIONS,
  customResidentPalette,
} from "../data/customResident.js";
import {
  normalizeCustomResidentProfile,
  normalizeCustomResidentState,
  normalizePersonalHome,
  validateResidentName,
} from "../state/customResidentState.js";

const DIRECTIONS = new Set(["up", "down", "left", "right"]);

function choiceExists(catalogue, value) {
  return Object.prototype.hasOwnProperty.call(catalogue, value);
}

export class CustomResidentService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.listeners = new Set();
    this.control = { active: false, returnPlayer: null };
    this.runtimeLocation = { ...normalizeCustomResidentState(gameState.getSnapshot().customResident).location };
    this.locationDirty = false;
    this.lastResult = { ok: true, code: "ready" };
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A custom-resident listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  getSnapshot() {
    const state = normalizeCustomResidentState(this.gameState.getSnapshot().customResident);
    state.location = { ...this.runtimeLocation };
    return {
      ...structuredClone(state),
      created: Boolean(state.profile),
      controlling: this.control.active,
    };
  }

  getResident() {
    const state = this.getSnapshot();
    if (!state.profile) return null;
    return {
      id: CUSTOM_RESIDENT_ID,
      name: state.profile.name,
      role: "Your resident",
      x: state.location.x,
      y: state.location.y,
      facingX: state.location.facing === "left" ? -1 : state.location.facing === "right" ? 1 : 0,
      facingY: state.location.facing === "up" ? -1 : state.location.facing === "down" ? 1 : 0,
      phase: this.control.active ? "controlled" : "home",
      activity: this.control.active ? "Exploring town with you" : `At home in ${PERSONAL_HOME_NAME}`,
      visible: true,
      palette: customResidentPalette(state.profile),
      hairStyle: state.profile.hair,
      accessoryStyle: state.profile.accessory,
      bodyScale: CUSTOM_RESIDENT_APPEARANCE.bodyBuild[state.profile.bodyBuild],
      hobbies: [...state.profile.hobbies],
    };
  }

  validateDraft(raw = {}) {
    const checkedName = validateResidentName(raw.name);
    if (!checkedName.ok) return { ok: false, code: "invalid-name", field: "name", message: checkedName.reason };
    const hair = Number(raw.hair);
    const outfit = Number(raw.outfit);
    if (!choiceExists(CUSTOM_RESIDENT_APPEARANCE.skin, raw.skin)) return { ok: false, code: "invalid-appearance", field: "skin", message: "Choose a valid skin tone." };
    if (!Number.isInteger(hair) || hair < 0 || hair > 3) return { ok: false, code: "invalid-appearance", field: "hair", message: "Choose a valid hair style." };
    if (!choiceExists(CUSTOM_RESIDENT_APPEARANCE.hairColor, raw.hairColor)) return { ok: false, code: "invalid-appearance", field: "hairColor", message: "Choose a valid hair colour." };
    if (!choiceExists(CUSTOM_RESIDENT_APPEARANCE.accessory, raw.accessory)) return { ok: false, code: "invalid-appearance", field: "accessory", message: "Choose a valid accessory." };
    if (!Number.isInteger(outfit) || outfit < 0 || outfit > 5) return { ok: false, code: "invalid-appearance", field: "outfit", message: "Choose a valid outfit colour." };
    if (!choiceExists(CUSTOM_RESIDENT_APPEARANCE.bodyBuild, raw.bodyBuild)) return { ok: false, code: "invalid-appearance", field: "bodyBuild", message: "Choose a valid body build." };
    const hobbies = [...new Set(Array.isArray(raw.hobbies) ? raw.hobbies : [])];
    if (hobbies.length > 3) return { ok: false, code: "too-many-hobbies", field: "hobbies", message: "Choose up to three hobbies." };
    if (hobbies.some((id) => !choiceExists(CUSTOM_RESIDENT_HOBBIES, id))) return { ok: false, code: "invalid-hobby", field: "hobbies", message: "Choose only the available hobbies." };
    for (const field of ["wallColor", "roofStyle", "roofColor"]) {
      if (!choiceExists(PERSONAL_HOME_OPTIONS[field], raw.home?.[field])) return { ok: false, code: "invalid-home", field, message: "Choose a valid starter-home design." };
    }
    return {
      ok: true,
      profile: normalizeCustomResidentProfile({ ...raw, name: checkedName.name, hair, outfit, hobbies }),
      home: normalizePersonalHome(raw.home),
    };
  }

  commit(mutator) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const save = this.repository.save(working, { now: this.now() });
    if (!save.ok) {
      this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "Your resident was not changed because the new profile could not be saved.", save };
    }
    return { ...mutation, state: this.getSnapshot(), save };
  }

  saveProfile(raw) {
    const validation = this.validateDraft(raw);
    if (!validation.ok) return validation;
    const wasCreated = Boolean(this.gameState.getSnapshot().customResident?.profile);
    const result = this.commit((state) => {
      const current = normalizeCustomResidentState(state.customResident);
      current.profile = validation.profile;
      current.home = validation.home;
      current.location = { ...this.runtimeLocation };
      state.customResident = current;
      return { ok: true, code: wasCreated ? "profile-updated" : "resident-created" };
    });
    this.lastResult = result;
    if (result.ok) {
      this.locationDirty = false;
      this.emit();
    }
    return result;
  }

  locate() {
    const resident = this.getResident();
    if (!resident) return { ok: false, code: "resident-not-created", message: "Create your resident first." };
    return { ok: true, code: "located", resident, location: { x: resident.x, y: resident.y }, home: this.getSnapshot().home };
  }

  beginControl(player) {
    if (!this.getResident()) return { ok: false, code: "resident-not-created", message: "Create your resident first." };
    if (this.control.active) return { ok: false, code: "already-controlling", message: "You are already controlling your resident." };
    this.control = {
      active: true,
      returnPlayer: {
        x: Number(player?.x) || 0,
        y: Number(player?.y) || 0,
        facing: DIRECTIONS.has(player?.facing) ? player.facing : "down",
      },
    };
    this.emit();
    return { ok: true, code: "control-started", resident: this.getResident(), returnPlayer: { ...this.control.returnPlayer } };
  }

  setRuntimePosition({ x, y, facing }) {
    if (!this.control.active) return { ok: false, code: "not-controlling" };
    if (Number.isFinite(x)) this.runtimeLocation.x = Math.max(0, Math.min(4400, Number(x)));
    if (Number.isFinite(y)) this.runtimeLocation.y = Math.max(0, Math.min(2900, Number(y)));
    if (DIRECTIONS.has(facing)) this.runtimeLocation.facing = facing;
    this.locationDirty = true;
    return { ok: true, location: { ...this.runtimeLocation } };
  }

  persistLocation() {
    if (!this.locationDirty) return { ok: true, code: "unchanged" };
    const result = this.commit((state) => {
      const customResident = normalizeCustomResidentState(state.customResident);
      customResident.location = { ...this.runtimeLocation };
      state.customResident = customResident;
      return { ok: true, code: "location-saved" };
    });
    if (result.ok) this.locationDirty = false;
    this.lastResult = result;
    return result;
  }

  endControl() {
    if (!this.control.active) return { ok: false, code: "not-controlling", message: "Your resident is not being controlled." };
    const returnPlayer = { ...this.control.returnPlayer };
    this.control = { active: false, returnPlayer: null };
    const save = this.persistLocation();
    this.emit();
    return { ok: save.ok, code: save.ok ? "control-ended" : save.code, returnPlayer, save, resident: this.getResident() };
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    return {
      enabled: true,
      created: state.created,
      residentId: state.residentId,
      residentName: state.profile?.name || null,
      homeNodeId: state.home.nodeId,
      homeName: state.home.name,
      homeLevel: state.home.level,
      hobbyCount: state.profile?.hobbies.length || 0,
      controlling: state.controlling,
      location: { ...state.location },
      locationDirty: this.locationDirty,
      lastResult: { ...this.lastResult },
    };
  }
}
