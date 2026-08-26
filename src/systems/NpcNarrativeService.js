import { NPC_RESIDENTS, NPC_NAVIGATION_NODES } from "../data/npcTownLife.js";
import {
  NPC_HOME_NARRATIVES,
  NPC_NARRATIVE_CONFIG,
  NPC_NARRATIVE_PROFILES,
  NPC_NARRATIVE_STAGES,
  NPC_STORY_STAGE_REQUIREMENTS,
  NPC_THOUGHT_ACTION_CATALOG,
  NPC_THOUGHT_DESTINATION_CATALOG,
  NPC_THOUGHT_JOB_CATALOG,
  NPC_THOUGHT_TIME_CATALOG,
  NPC_THOUGHT_TOWN_CATALOG,
  NPC_THOUGHT_WEATHER_CATALOG,
  npcHomeNarrative,
} from "../data/npcNarratives.js";
import { hashUnit } from "../data/livingEnvironment.js";
import { normalizeNpcNarrativeState } from "../state/npcNarrativeState.js";

const definitions = new Map(NPC_RESIDENTS.map((resident) => [resident.id, resident]));
const nodes = new Map(NPC_NAVIGATION_NODES.map((node) => [node.id, node]));
const stageTitle = (stage) => `${NPC_NARRATIVE_STAGES[stage][0].toUpperCase()}${NPC_NARRATIVE_STAGES[stage].slice(1)}`;
const cleanTrigger = (value) => String(value || "context").replace(/[^a-z0-9._:-]/gi, "-").slice(0, 48) || "context";
const townName = (state) => state.identity?.townName || "Willowmere";

function jobFamily(definition) {
  const role = definition.role;
  if (/caf[eé]|coffee|barista/i.test(role)) return "cafe";
  if (/baker|chef|restaurant|wait|pub|bar|food/i.test(role)) return "food";
  if (/grocer|market|shop/i.test(role)) return "market";
  if (/orchard|garden|florist|grow/i.test(role)) return "growing";
  if (/fish|dock|harbour|river/i.test(role)) return "river";
  if (/mill|carpenter|craft|repair/i.test(role)) return "craft";
  if (/civic|nurse|care|playgroup|park/i.test(role)) return "care";
  if (/cinema|projection|art|host/i.test(role)) return "culture";
  if (/deliver|courier|rider/i.test(role)) return "delivery";
  return "general";
}

function destinationFamily(node) {
  if (node?.kind === "home") return "home";
  if (["cafe", "shop", "bakery", "restaurant", "pub", "takeaway", "beach_cafe"].includes(node?.kind)) return "business";
  if (["market", "square"].includes(node?.kind)) return "market";
  if (["dock", "harbour", "beach", "riverbank", "fishing", "mill"].includes(node?.kind)) return "water";
  if (["garden", "orchard", "allotment"].includes(node?.kind)) return "growing";
  if (["park", "bench", "playground", "woodland", "picnic", "tree"].includes(node?.kind)) return "green";
  if (["arcade", "cinema"].includes(node?.kind)) return "culture";
  if (node?.kind === "station") return "transit";
  return "general";
}

function relevantMilestone(definition) {
  const family = jobFamily(definition);
  if (["river", "craft"].includes(family)) return "river";
  if (family === "culture") return "station";
  if (["growing", "care", "recreation"].includes(family)) return "commons";
  return "highstreet";
}

function timeBand(minutes) {
  const hour = Number(minutes || 0) / 60;
  return hour < 5 || hour >= 22 ? "night" : hour < 7 ? "dawn" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}

function townPhase(state) {
  const band = state.environment?.cleanliness?.band;
  return band === "calm" ? "restored" : band === "cared-for" ? "cared" : band === "recovering" ? "improving" : "neglected";
}

function render(template, context) {
  return String(template || "").replace(/\{(\w+)\}/g, (_match, key) => String(context[key] ?? ""))
    .replaceAll("Willowmere", context.town).replace(/\s+/g, " ").trim().slice(0, NPC_NARRATIVE_CONFIG.thoughtTextLimit);
}

function strongestRelationship(resident, profile, state) {
  const nameToId = new Map(NPC_RESIDENTS.map((entry) => [entry.name, entry.id]));
  const ids = Object.keys(profile.bonds).map((name) => nameToId.get(name)).filter(Boolean);
  let result = { id: null, name: null, score: 0 };
  for (const id of ids) {
    const score = Number(resident.relationships?.[id] || 0);
    if (score > result.score) result = { id, name: definitions.get(id)?.name || id, score };
  }
  return result;
}

function businessEvidence(state, definition) {
  const work = nodes.get(definition.workNodeId)?.label || definition.role;
  const completed = {
    "shop1": state.cafe?.highestLevelCompleted,
    "shop3": state.bakery?.highestLevelCompleted,
    "biz_coffee2": state.morningMug?.highestLevelCompleted,
    "biz_restaurant1": state.riversideKitchen?.highestLevelCompleted,
    "biz_beachcafe": state.southShoreScoops?.highestLevelCompleted,
  }[definition.workNodeId] || 0;
  if (definition.workNodeId === "biz_takeaway" && state.harbourGeneral?.owned) return `${work} now belongs to the player and has made ${state.harbourGeneral?.stats?.lifetimeSales || 0} resident sales.`;
  if (["biz_news", "station1"].includes(definition.workNodeId) && state.restorationMilestones?.unlocked?.station) return `${work} has reopened after the Station restoration.`;
  return completed ? `${work} has reached level ${completed} with the player's help.` : null;
}

export class NpcNarrativeService {
  constructor(gameState, repository, { npcTownLife = null, now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.npcTownLife = npcTownLife;
    this.now = now;
    this.lastResult = { ok: true, code: "ready" };
  }

  residentRecord(id, sourceState = this.gameState.getSnapshot()) {
    const definition = definitions.get(id) || NPC_RESIDENTS.find((entry) => entry.name === id);
    const resident = sourceState.npcs?.residents?.find((entry) => entry.id === definition?.id);
    if (!definition || !resident) return null;
    const profile = NPC_NARRATIVE_PROFILES[definition.name];
    return { definition, resident, profile, narrative: normalizeNpcNarrativeState(resident.narrativeState), home: npcHomeNarrative(definition.homeNodeId) };
  }

  context(record, state) {
    const { definition, resident, profile, home, narrative } = record;
    const destination = nodes.get(resident.targetNodeId) || nodes.get(resident.currentNodeId) || nodes.get(definition.homeNodeId);
    const relationship = strongestRelationship(resident, profile, state);
    const weather = state.world?.weather?.kind || state.world?.weatherKind || "clear";
    return {
      town: townName(state), home: home.name, homeArea: home.area, homeApproach: home.approach,
      workplace: nodes.get(definition.workNodeId)?.label || definition.role, job: definition.role,
      action: NPC_THOUGHT_ACTION_CATALOG[resident.actionState] ? resident.actionState : "IDLE",
      destination: destination?.label || home.name, destinationFamily: destinationFamily(destination),
      jobFamily: jobFamily(definition), timeBand: timeBand(state.world?.clockMinutes), weatherKind: NPC_THOUGHT_WEATHER_CATALOG[weather] ? weather : "clear",
      townPhase: townPhase(state), friend: relationship.name || "a neighbour", friendId: relationship.id,
      storyStage: narrative.storyStage, storyStageId: NPC_NARRATIVE_STAGES[narrative.storyStage],
    };
  }

  evidence(record, state) {
    const relationship = strongestRelationship(record.resident, record.profile, state);
    const milestoneId = relevantMilestone(record.definition);
    return {
      selectionCount: record.narrative.selectionCount,
      selectedDayCount: record.narrative.selectedDays.length,
      completedActivities: Math.floor(Number(record.resident.completedActivities) || 0),
      completedJobs: Math.floor(Number(state.progress?.completedJobCount) || 0),
      relationship,
      relevantMilestoneId: milestoneId,
      relevantMilestoneUnlocked: Boolean(state.restorationMilestones?.unlocked?.[milestoneId]),
      townRestorationUnlocked: Boolean(state.restorationMilestones?.unlocked?.green || state.restorationMilestones?.unlocked?.festival),
      daysSinceAdvance: record.narrative.stageAdvancedAtDay ? Math.max(0, state.world.day - record.narrative.stageAdvancedAtDay) : Infinity,
      worldDay: state.world.day,
    };
  }

  gate(record, targetStage, state) {
    const requirements = NPC_STORY_STAGE_REQUIREMENTS[targetStage];
    const evidence = this.evidence(record, state);
    if (!requirements) return null;
    const checks = [
      { id: "selections", label: "Meaningful conversations", value: evidence.selectionCount, target: requirements.selections },
      { id: "selected-days", label: "Different days met", value: evidence.selectedDayCount, target: requirements.selectedDays },
      { id: "activities", label: "Resident routines completed", value: evidence.completedActivities, target: requirements.activities },
    ];
    if (requirements.jobs) checks.push({ id: "jobs", label: "Town jobs completed", value: evidence.completedJobs, target: requirements.jobs });
    if (requirements.bond) checks.push({ id: "relationship", label: `Bond with ${evidence.relationship.name || "a neighbour"}`, value: evidence.relationship.score, target: requirements.bond });
    if (requirements.restoration === "relevant") checks.push({ id: "restoration", label: `${evidence.relevantMilestoneId} restoration`, value: evidence.relevantMilestoneUnlocked ? 1 : 0, target: 1 });
    if (requirements.restoration === "town") checks.push({ id: "restoration", label: "Town-wide restoration", value: evidence.townRestorationUnlocked ? 1 : 0, target: 1 });
    if (targetStage > 1) checks.push({ id: "chapter-gap", label: "Day since last chapter", value: Number.isFinite(evidence.daysSinceAdvance) ? evidence.daysSinceAdvance : 1, target: 1 });
    return { targetStage, targetStageId: NPC_NARRATIVE_STAGES[targetStage], eligible: checks.every((check) => check.value >= check.target), checks: checks.map((check) => ({ ...check, met: check.value >= check.target })), evidence };
  }

  advanceInto(record, state, trigger) {
    const before = record.narrative;
    if (before.storyStage >= NPC_NARRATIVE_CONFIG.storyStageCount - 1) return { advanced: false, complete: true, gate: null };
    const targetStage = before.storyStage + 1;
    const gate = this.gate(record, targetStage, state);
    if (!gate.eligible) return { advanced: false, complete: false, gate };
    const reason = targetStage === 1
      ? `Familiarity grew across ${gate.evidence.selectedDayCount} different days and ${gate.evidence.completedActivities} resident routines.`
      : targetStage === 2
        ? `${gate.evidence.relevantMilestoneId} restoration gave this plan room to grow alongside a stronger bond with ${gate.evidence.relationship.name || "the town"}.`
        : `${townName(state)}'s wider restoration and long-term relationships brought this story to its resolution.`;
    const entry = { stage: targetStage, stageId: NPC_NARRATIVE_STAGES[targetStage], day: state.world.day, trigger: cleanTrigger(trigger), reason };
    record.resident.narrativeState = normalizeNpcNarrativeState({ ...before, storyStage: targetStage,
      storyFlags: { ...before.storyFlags, [`stage.${entry.stageId}`]: true }, seenBeatIds: [...before.seenBeatIds, `story-unlocked-${targetStage}`],
      stageHistory: [...before.stageHistory, entry], stageAdvancedAtDay: state.world.day, stageAdvanceCount: targetStage,
      lastProgressReason: reason, lastProgressTrigger: entry.trigger, storyCompletedDay: targetStage === 3 ? state.world.day : 0 });
    record.narrative = record.resident.narrativeState;
    return { advanced: true, complete: targetStage === 3, stage: targetStage, stageId: entry.stageId, reason, gate };
  }

  candidates(record, state) {
    const context = this.context(record, state);
    const candidates = [];
    const add = (prefix, catalog, key, category, priority) => (catalog[key] || catalog.general || []).forEach((template, index) => candidates.push({ id: `${prefix}-${key}-${index + 1}`, category, priority, text: render(template, context) }));
    add("action", NPC_THOUGHT_ACTION_CATALOG, context.action, "activity", 90);
    add("destination", NPC_THOUGHT_DESTINATION_CATALOG, context.destinationFamily, "place", 72);
    add("job", NPC_THOUGHT_JOB_CATALOG, context.jobFamily, "work", 68);
    add("time", NPC_THOUGHT_TIME_CATALOG, context.timeBand, "time", 44);
    add("weather", NPC_THOUGHT_WEATHER_CATALOG, context.weatherKind, "weather", 60);
    add("town", NPC_THOUGHT_TOWN_CATALOG, context.townPhase, "town", 58);
    const ambition = record.profile.ambition.replace(/[.!?]+$/g, "");
    const storyThoughts = [`I keep thinking about how to ${ambition[0].toLowerCase()}${ambition.slice(1)}.`, record.profile.arc[context.storyStage]];
    storyThoughts.forEach((text, index) => candidates.push({ id: `story-${context.storyStage}-${index + 1}`, category: "story", priority: 84, text: render(text, context) }));
    candidates.push({ id: `home-${record.definition.homeNodeId}`, category: "home", priority: 62, text: `${record.home.description} I always notice that when I return ${record.home.approach}.` });
    if (context.friendId) candidates.push({ id: `bond-${context.friendId}`, category: "relationship", priority: 76, text: `I should catch up with ${context.friend}. ${record.profile.bonds[context.friend] || "Their perspective may help."}` });
    const business = businessEvidence(state, record.definition);
    if (business) candidates.push({ id: `business-${record.definition.workNodeId}`, category: "business", priority: 82, text: business });
    const completedJobs = Number(state.progress?.completedJobCount || 0);
    if (completedJobs) candidates.push({ id: `jobs-${Math.floor(completedJobs / 5)}`, category: "jobs", priority: 74, text: `${completedJobs} completed town jobs are leaving visible proof that neighbours can change ${context.town} together.` });
    const unlocked = Object.keys(state.restorationMilestones?.unlocked || {}).filter((id) => state.restorationMilestones.unlocked[id]);
    if (unlocked.length) candidates.push({ id: `restoration-${unlocked.at(-1)}`, category: "restoration", priority: 80, text: `The ${unlocked.at(-1)} restoration has changed what feels possible for my own plans.` });
    return { context, candidates: candidates.filter((entry) => entry.text) };
  }

  choose(record, state) {
    const { context, candidates } = this.candidates(record, state);
    const recent = new Set(record.narrative.recentThoughtIds);
    let pool = candidates.filter((entry) => !recent.has(entry.id));
    if (!pool.length) pool = candidates.filter((entry) => entry.id !== record.narrative.lastThoughtId);
    if (!pool.length) pool = candidates;
    const total = pool.reduce((sum, entry) => sum + entry.priority, 0);
    let cursor = hashUnit(`${record.definition.id}:${record.narrative.selectionCount}:${state.world.day}:${context.action}:${context.destination}:${context.storyStage}`) * total;
    return pool.find((entry) => ((cursor -= entry.priority) <= 0)) || pool.at(-1);
  }

  saveMutation(checkpoint, next, residentId, code) {
    next.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(next);
    if (!replaced.ok) return replaced;
    const saved = this.repository?.save?.(next, { now: this.now() }) || { ok: true };
    if (!saved.ok) { this.gameState.replace(checkpoint); return { ok: false, code: "persistence-failed", saved }; }
    const narrative = next.npcs.residents.find((resident) => resident.id === residentId)?.narrativeState;
    this.npcTownLife?.setNarrativeState?.(residentId, narrative);
    this.lastResult = { ok: true, code, residentId };
    return this.lastResult;
  }

  selectThought(id, { source = "conversation" } = {}) {
    const checkpoint = this.gameState.getSnapshot();
    const next = structuredClone(checkpoint);
    const record = this.residentRecord(id, next);
    if (!record) return { ok: false, code: "resident-not-found", message: "That resident could not be found." };
    record.narrative = normalizeNpcNarrativeState({ ...record.narrative, selectionCount: record.narrative.selectionCount + 1,
      selectedDays: [...record.narrative.selectedDays, next.world.day], lastSelectedDay: next.world.day });
    record.resident.narrativeState = record.narrative;
    const progression = this.advanceInto(record, next, source);
    record.narrative = normalizeNpcNarrativeState(record.resident.narrativeState);
    const thought = this.choose(record, next);
    record.resident.narrativeState = normalizeNpcNarrativeState({ ...record.narrative,
      lastThoughtId: thought.id, lastThoughtText: thought.text, lastThoughtCategory: thought.category, lastThoughtSource: cleanTrigger(source),
      lastThoughtContext: this.context(record, next), recentThoughtIds: [...record.narrative.recentThoughtIds.filter((value) => value !== thought.id), thought.id] });
    const saved = this.saveMutation(checkpoint, next, record.definition.id, "thought-selected");
    return saved.ok ? { ...saved, thought, progression, story: this.getStory(record.definition.id) } : saved;
  }

  getStory(id) {
    const state = this.gameState.getSnapshot();
    const record = this.residentRecord(id, state);
    if (!record) return null;
    const gate = record.narrative.storyStage < 3 ? this.gate(record, record.narrative.storyStage + 1, state) : null;
    return { id: record.definition.id, name: record.definition.name, role: record.definition.role, profile: structuredClone(record.profile), home: structuredClone(record.home),
      chapter: record.narrative.storyStage + 1, totalChapters: 4, stage: record.narrative.storyStage, stageId: NPC_NARRATIVE_STAGES[record.narrative.storyStage],
      stageTitle: stageTitle(record.narrative.storyStage), summary: record.profile.arc[record.narrative.storyStage], narrative: record.narrative, gate,
      thought: record.narrative.lastThoughtId ? { id: record.narrative.lastThoughtId, text: record.narrative.lastThoughtText, category: record.narrative.lastThoughtCategory } : null };
  }

  getHousehold(homeNodeId) {
    const residents = NPC_RESIDENTS.filter((entry) => entry.homeNodeId === homeNodeId).map((entry) => this.getStory(entry.id));
    return { id: homeNodeId, ...structuredClone(npcHomeNarrative(homeNodeId)), residents };
  }

  getAllStories() { return NPC_RESIDENTS.map((entry) => this.getStory(entry.id)); }

  getDiagnostics() {
    const stories = this.getAllStories();
    const profileIssues = NPC_RESIDENTS.filter((entry) => !NPC_NARRATIVE_PROFILES[entry.name] || NPC_NARRATIVE_PROFILES[entry.name].arc.length !== 4).map((entry) => entry.name);
    return { version: "3.0.0-milestone-39", enabled: true, residentCount: stories.length, profileCount: Object.keys(NPC_NARRATIVE_PROFILES).length,
      homeStoryCount: Object.keys(NPC_HOME_NARRATIVES).length, chapterCount: stories.reduce((sum, story) => sum + story.profile.arc.length, 0),
      completedStories: stories.filter((story) => story.stage === 3).length, persistentHistory: true, deterministicThoughts: true,
      recentThoughtLimit: NPC_NARRATIVE_CONFIG.recentThoughtLimit, profileIssues, valid: profileIssues.length === 0, lastResult: this.lastResult };
  }
}
