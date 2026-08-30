export const ARTWORK_SPEC_SCHEMA_VERSION = 2;

export const ARTWORK_WORKFLOW_STATUSES = Object.freeze([
  "specified",
  "generation-ready",
  "generated",
  "review",
  "revision",
  "approval",
  "runtime-ready",
  "integrated",
  "verified",
]);

export const ARTWORK_WORKFLOW_TRANSITIONS = Object.freeze({
  specified: Object.freeze(["generation-ready"]),
  "generation-ready": Object.freeze(["generated"]),
  generated: Object.freeze(["review"]),
  review: Object.freeze(["revision", "approval"]),
  revision: Object.freeze(["generated"]),
  approval: Object.freeze(["runtime-ready"]),
  "runtime-ready": Object.freeze(["integrated"]),
  integrated: Object.freeze(["verified"]),
  verified: Object.freeze([]),
});

export function canTransitionArtworkStatus(from, to) {
  return ARTWORK_WORKFLOW_TRANSITIONS[from]?.includes(to) === true;
}

export function validateArtworkWorkflowHistory(workflow) {
  const errors = [];
  const history = workflow?.history || [];
  if (!ARTWORK_WORKFLOW_STATUSES.includes(workflow?.currentStatus)) errors.push("invalid-workflow-status");
  if (!Array.isArray(history) || history.length === 0) return Object.freeze([...errors, "missing-workflow-history"]);
  if (history[0]?.status !== "specified") errors.push("workflow-must-start-specified");
  for (let index = 1; index < history.length; index += 1) {
    const previous = history[index - 1]?.status;
    const current = history[index]?.status;
    if (!canTransitionArtworkStatus(previous, current)) errors.push(`invalid-workflow-transition:${previous}->${current}`);
  }
  if (history.at(-1)?.status !== workflow?.currentStatus) errors.push("workflow-current-status-mismatch");
  return Object.freeze(errors);
}

export function transitionArtworkStatus(workflow, to, record = {}) {
  const from = workflow?.currentStatus;
  if (!canTransitionArtworkStatus(from, to)) throw new Error(`Invalid artwork workflow transition: ${from} -> ${to}`);
  return Object.freeze({
    ...workflow,
    currentStatus: to,
    history: Object.freeze([...(workflow.history || []), Object.freeze({ status: to, ...record })]),
  });
}
