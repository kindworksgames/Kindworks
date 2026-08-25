export function recipeForOrder(order, recipeIndex, recipes) {
  const id = order?.recipes?.[recipeIndex];
  return id ? recipes[id] || null : null;
}

export function expectedRecipeStep(preparation, recipe) {
  return recipe?.steps?.[preparation?.stepIndex || 0] || null;
}

export function applyRecipeStep(preparation, recipe, stepId, definitionFor) {
  const expectedStep = expectedRecipeStep(preparation, recipe);
  if (!expectedStep) return { ok: false, code: "recipe-ready", message: "This product is ready to finish and serve." };
  const definition = definitionFor(stepId);
  if (!definition) return { ok: false, code: "unknown-step", message: "Choose a valid ingredient or kitchen station.", expectedStep };
  if (stepId !== expectedStep) return { ok: false, code: "wrong-step", expectedStep, expectedDefinition: definitionFor(expectedStep) };
  preparation.completedSteps.push(stepId);
  preparation.stepIndex += 1;
  const complete = preparation.stepIndex === recipe.steps.length;
  return { ok: true, code: complete ? "recipe-complete" : "step-complete", stepId, step: definition, complete, expectedStep: expectedRecipeStep(preparation, recipe) };
}

export function undoRecipeStep(preparation) {
  if (!preparation || preparation.stepIndex < 1) return { ok: false, code: "nothing-to-undo", message: "There is nothing to undo." };
  const removed = preparation.completedSteps.pop();
  preparation.stepIndex -= 1;
  return { ok: true, code: "step-undone", removed };
}

export function resetRecipePreparation(preparation) {
  const changed = Boolean(preparation && (preparation.stepIndex > 0 || preparation.completedSteps?.length));
  if (preparation) {
    preparation.stepIndex = 0;
    preparation.completedSteps = [];
  }
  return changed;
}

export function recipeOrderScore(session) {
  const attempts = session.served + session.missed;
  const accuracy = Math.max(0, Math.min(1, session.served / Math.max(1, attempts + session.mistakes * 0.25)));
  const happiness = session.happiness.length ? session.happiness.reduce((sum, value) => sum + value, 0) / session.happiness.length : 0;
  const speed = Math.max(0, Math.min(1, session.served / session.level.target));
  const wasteScore = Math.max(0, 1 - session.waste / Math.max(3, session.level.target));
  const score = Math.round(accuracy * 50 + happiness * 25 + speed * 15 + wasteScore * 10);
  const won = session.served >= session.level.target && session.missed <= session.level.maxMisses;
  const stars = !won ? 0 : score >= 90 ? 3 : score >= 75 ? 2 : 1;
  return {
    won,
    score,
    stars,
    accuracy: Math.round(accuracy * 100),
    happiness: Math.round(happiness * 100),
    served: session.served,
    missed: session.missed,
    waste: session.waste,
    mistakes: session.mistakes,
    bestStreak: session.bestStreak,
  };
}
