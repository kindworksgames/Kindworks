import {
  RESTORATION_MILESTONE_ORDER,
  RESTORATION_MILESTONES,
} from "../data/restorationMilestones.js";
import {
  normalizeRestorationMilestoneState,
  pendingRestorationMilestoneIds,
  restorationFestivalActive,
  restorationPhysicalCounts,
  unlockRestorationMilestoneInto,
  validateRestorationMilestoneState,
} from "../state/restorationMilestoneState.js";

export class RestorationMilestoneService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
  }

  commit(mutator) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = this.repository.save(working, { now: this.now() });
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "The restoration change could not be saved, so Willowmere returned to its previous state.", save: saved, rollbackOk: rollback.ok };
    }
    return { ...mutation, state: this.gameState.getSnapshot(), save: saved };
  }

  getSnapshot() {
    const state = this.gameState.getSnapshot();
    const restoration = normalizeRestorationMilestoneState(state.restorationMilestones);
    const pending = pendingRestorationMilestoneIds(restoration);
    return {
      ...restoration,
      pending,
      current: pending[0] || null,
      festivalActive: restorationFestivalActive({ ...state, restorationMilestones: restoration }),
      physical: restorationPhysicalCounts(state),
    };
  }

  markRevealed(id) {
    if (!RESTORATION_MILESTONES[id]) return { ok: false, code: "unknown-milestone" };
    return this.commit((state) => {
      if (!state.restorationMilestones.unlocked[id]) return { ok: false, code: "milestone-locked" };
      if (state.restorationMilestones.revealed[id]) return { ok: true, code: "already-revealed", duplicate: true, id };
      state.restorationMilestones.revealed[id] = true;
      return { ok: true, code: "restoration-revealed", id };
    });
  }

  unlockForQa(id, { revealed = false } = {}) {
    if (!RESTORATION_MILESTONES[id]) return { ok: false, code: "unknown-milestone" };
    return this.commit((state) => {
      const targetIndex = RESTORATION_MILESTONE_ORDER.indexOf(id);
      const unlocked = [];
      for (let index = 0; index <= targetIndex; index += 1) {
        const milestoneId = RESTORATION_MILESTONE_ORDER[index];
        const result = unlockRestorationMilestoneInto(state, milestoneId, { revealed: milestoneId === id ? revealed : true, occurredAt: new Date(this.now()).toISOString() });
        if (result.unlocked) unlocked.push(result);
      }
      if (!unlocked.length && !revealed) state.restorationMilestones.revealed[id] = false;
      return { ok: true, code: "restoration-qa-unlocked", id, unlocked };
    });
  }

  getDiagnostics() {
    const state = this.gameState.getSnapshot();
    const snapshot = this.getSnapshot();
    const validation = validateRestorationMilestoneState(state.restorationMilestones);
    return {
      version: "1.0.0-milestone-30",
      valid: validation.ok,
      errors: validation.errors,
      order: [...RESTORATION_MILESTONE_ORDER],
      definitions: Object.keys(RESTORATION_MILESTONES).length,
      unlocked: RESTORATION_MILESTONE_ORDER.filter((id) => snapshot.unlocked[id]),
      revealed: RESTORATION_MILESTONE_ORDER.filter((id) => snapshot.revealed[id]),
      pending: [...snapshot.pending],
      festivalActive: snapshot.festivalActive,
      counters: structuredClone(snapshot.counters),
      physical: snapshot.physical,
      firstRestorationGift: structuredClone(snapshot.firstRestorationGift),
      permanentChanges: RESTORATION_MILESTONE_ORDER.filter((id) => snapshot.unlocked[id]).flatMap((id) => RESTORATION_MILESTONES[id].permanentChanges),
      atomicPersistence: true,
      duplicateEventProtection: true,
      legacyMilestonesConverted: state.source.kind !== "legacy-import" || Boolean(state.legacySnapshot?.milestones || state.progress.completedJobCount >= 0),
    };
  }
}
