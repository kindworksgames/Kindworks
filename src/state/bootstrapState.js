import { createFreshGameState, GameStateService } from "./GameState.js";
import { LegacySaveImporter } from "./LegacySaveImporter.js";
import { SaveRepository } from "./SaveRepository.js";

export function bootstrapState(storage, options = {}) {
  const repository = new SaveRepository(storage);
  const loaded = repository.load();
  const legacyImporter = new LegacySaveImporter(storage);
  const legacyInspection = legacyImporter.inspect();
  const initialState = loaded.ok ? loaded.state : createFreshGameState(options);
  const gameState = new GameStateService(initialState);
  return { repository, loaded, legacyImporter, legacyInspection, gameState };
}
