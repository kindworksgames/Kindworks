import { createFreshGameState, GameStateService } from "./GameState.js";
import { LegacySaveImporter } from "./LegacySaveImporter.js";
import { SaveRepository } from "./SaveRepository.js";

export function bootstrapState(storage, options = {}) {
  const repository = new SaveRepository(storage);
  let loaded = repository.load();
  if (loaded.ok && (loaded.needsMigration || loaded.recovered)) {
    const migrationSave = repository.save(loaded.state, options);
    loaded = { ...loaded, migrated: loaded.needsMigration ? migrationSave.ok : false, recoveredPersisted: loaded.recovered ? migrationSave.ok : false, migrationSave };
  }
  const legacyImporter = new LegacySaveImporter(storage);
  const legacyInspection = legacyImporter.inspect();
  const initialState = loaded.ok ? loaded.state : createFreshGameState(options);
  const gameState = new GameStateService(initialState);
  return { repository, loaded, legacyImporter, legacyInspection, gameState };
}
