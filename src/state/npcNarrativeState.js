import { NPC_NARRATIVE_CONFIG, NPC_NARRATIVE_STAGES } from "../data/npcNarratives.js";

const cleanIds = (items, limit) => [...new Set((Array.isArray(items) ? items : []).map((id) => String(id || "").trim()).filter(Boolean))].slice(-limit);
const whole = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));

export function createFreshNpcNarrativeState() {
  return {
    schemaVersion: NPC_NARRATIVE_CONFIG.schemaVersion,
    storyStage: 0,
    storyFlags: {},
    seenBeatIds: [],
    recentThoughtIds: [],
    selectionCount: 0,
    selectedDays: [],
    stageHistory: [],
    stageAdvancedAtDay: 0,
    stageAdvanceCount: 0,
    lastProgressReason: null,
    lastProgressTrigger: null,
    storyCompletedDay: 0,
    lastThoughtId: null,
    lastThoughtText: null,
    lastThoughtCategory: null,
    lastThoughtSource: null,
    lastThoughtContext: null,
    lastSelectedDay: 0,
  };
}

export function normalizeNpcNarrativeState(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const fresh = createFreshNpcNarrativeState();
  const storyStage = whole(source.storyStage, 0, NPC_NARRATIVE_CONFIG.storyStageCount - 1);
  const lastSelectedDay = whole(source.lastSelectedDay);
  const selectedDays = [...new Set((Array.isArray(source.selectedDays) ? source.selectedDays : [])
    .map((day) => whole(day)).filter(Boolean))].sort((a, b) => a - b).slice(-NPC_NARRATIVE_CONFIG.selectedDayLimit);
  if (!selectedDays.length && lastSelectedDay && Number(source.selectionCount) > 0) selectedDays.push(lastSelectedDay);
  const flags = {};
  for (const [key, flag] of Object.entries(source.storyFlags || {}).slice(0, NPC_NARRATIVE_CONFIG.flagLimit)) {
    if (/^[a-z0-9._:-]{1,48}$/i.test(key) && ["boolean", "number", "string"].includes(typeof flag)) flags[key] = typeof flag === "string" ? flag.slice(0, 80) : flag;
  }
  const historyByStage = new Map();
  for (const entry of Array.isArray(source.stageHistory) ? source.stageHistory : []) {
    const stage = whole(entry?.stage, 0, storyStage);
    if (!stage || historyByStage.has(stage)) continue;
    historyByStage.set(stage, {
      stage,
      stageId: NPC_NARRATIVE_STAGES[stage],
      day: whole(entry.day),
      trigger: String(entry.trigger || "migration").replace(/[^a-z0-9._:-]/gi, "-").slice(0, 48) || "migration",
      reason: String(entry.reason || "Story progress preserved.").trim().slice(0, NPC_NARRATIVE_CONFIG.progressReasonLimit),
    });
  }
  for (let stage = 1; stage <= storyStage; stage += 1) if (!historyByStage.has(stage)) historyByStage.set(stage, {
    stage, stageId: NPC_NARRATIVE_STAGES[stage], day: whole(source.stageAdvancedAtDay || lastSelectedDay), trigger: "migration", reason: "Story progress preserved from an earlier save.",
  });
  let previousDay = 0;
  const stageHistory = [...historyByStage.values()].sort((a, b) => a.stage - b.stage).slice(-NPC_NARRATIVE_CONFIG.stageHistoryLimit)
    .map((entry) => ({ ...entry, day: (previousDay = Math.max(previousDay, entry.day)) }));
  const lastThoughtId = typeof source.lastThoughtId === "string" && source.lastThoughtId.trim() ? source.lastThoughtId.trim().slice(0, 80) : null;
  return {
    ...fresh,
    storyStage,
    storyFlags: flags,
    seenBeatIds: cleanIds(source.seenBeatIds, NPC_NARRATIVE_CONFIG.seenBeatLimit),
    recentThoughtIds: cleanIds(source.recentThoughtIds, NPC_NARRATIVE_CONFIG.recentThoughtLimit),
    selectionCount: Math.max(selectedDays.length, whole(source.selectionCount)),
    selectedDays,
    stageHistory,
    stageAdvancedAtDay: whole(source.stageAdvancedAtDay || stageHistory.at(-1)?.day),
    stageAdvanceCount: storyStage,
    lastProgressReason: source.lastProgressReason ? String(source.lastProgressReason).slice(0, NPC_NARRATIVE_CONFIG.progressReasonLimit) : stageHistory.at(-1)?.reason || null,
    lastProgressTrigger: source.lastProgressTrigger ? String(source.lastProgressTrigger).slice(0, 48) : stageHistory.at(-1)?.trigger || null,
    storyCompletedDay: storyStage === NPC_NARRATIVE_CONFIG.storyStageCount - 1 ? whole(source.storyCompletedDay || source.stageAdvancedAtDay || stageHistory.at(-1)?.day) : 0,
    lastThoughtId,
    lastThoughtText: lastThoughtId && source.lastThoughtText ? String(source.lastThoughtText).trim().slice(0, NPC_NARRATIVE_CONFIG.thoughtTextLimit) : null,
    lastThoughtCategory: lastThoughtId && source.lastThoughtCategory ? String(source.lastThoughtCategory).slice(0, 32) : null,
    lastThoughtSource: lastThoughtId && source.lastThoughtSource ? String(source.lastThoughtSource).slice(0, 32) : null,
    lastThoughtContext: lastThoughtId && source.lastThoughtContext && typeof source.lastThoughtContext === "object" ? structuredClone(source.lastThoughtContext) : null,
    lastSelectedDay: Math.max(lastSelectedDay, selectedDays.at(-1) || 0),
  };
}

export function validateNpcNarrativeState(value) {
  const state = normalizeNpcNarrativeState(value);
  const errors = [];
  if (value?.schemaVersion !== NPC_NARRATIVE_CONFIG.schemaVersion) errors.push("NPC narrative schema version is invalid.");
  if (state.stageHistory.length !== state.storyStage || state.stageAdvanceCount !== state.storyStage) errors.push("NPC narrative chapter history is incomplete.");
  if (state.stageHistory.some((entry, index) => entry.stage !== index + 1)) errors.push("NPC narrative chapters are out of order.");
  if (state.selectedDays.length > NPC_NARRATIVE_CONFIG.selectedDayLimit || new Set(state.selectedDays).size !== state.selectedDays.length) errors.push("NPC narrative selection evidence is invalid.");
  if (state.recentThoughtIds.length > NPC_NARRATIVE_CONFIG.recentThoughtLimit || (state.lastThoughtId && !state.lastThoughtText)) errors.push("NPC narrative thought history is invalid.");
  if (state.storyStage === NPC_NARRATIVE_CONFIG.storyStageCount - 1 && !state.storyCompletedDay) errors.push("Completed NPC narrative has no completion day.");
  return { ok: errors.length === 0, errors };
}
