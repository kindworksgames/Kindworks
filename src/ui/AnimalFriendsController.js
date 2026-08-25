import { ANIMAL_BY_ID, ANIMAL_DEFINITIONS, COMPANION_CARE_CONFIG, SOUTH_MEADOW, adoptionChance, speciesFor } from "../data/animals.js";
import { ITEM_CATALOG } from "../data/items.js";

function locationLabel(entry) {
  if (entry.location === "following") return "Following you";
  if (entry.location === SOUTH_MEADOW.id) return SOUTH_MEADOW.label;
  return entry.visible ? `Exploring ${speciesFor(entry.definition).habitat}` : "Exploring elsewhere";
}

export class AnimalFriendsController {
  constructor(animals, { onModalChange = () => {} } = {}) {
    this.animals = animals;
    this.onModalChange = onModalChange;
    this.panel = document.querySelector("#animal-friends-panel");
    this.status = document.querySelector("#animal-friends-status");
    this.selectedAnimalId = ANIMAL_DEFINITIONS[0].id;
    this.qaGuaranteed = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "animals";
    this.bind();
    this.unsubscribe = animals.subscribe(() => this.render());
  }

  bind() {
    this.onClick = (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.id === "animal-friends-close") return this.close();
      if (button.dataset.animalId) {
        this.selectedAnimalId = button.dataset.animalId;
        return this.render();
      }
      if (button.id === "animal-greet") return this.report(this.animals.greet(this.selectedAnimalId));
      if (button.dataset.animalFood) return this.report(this.animals.feed(this.selectedAnimalId, button.dataset.animalFood));
      if (button.id === "animal-adopt") return this.report(this.animals.requestAdoption(this.selectedAnimalId, this.qaGuaranteed ? { roll: 0 } : {}));
      if (button.id === "animal-follow") return this.report(this.animals.setActive(this.selectedAnimalId));
      if (button.id === "animal-roam") return this.report(this.animals.clearActive());
    };
    this.onKeyDown = (event) => { if (event.key === "Escape" && this.isOpen()) this.close(); };
    this.onHudClick = () => this.open();
    this.panel?.addEventListener("click", this.onClick);
    document.querySelector("#animal-friends-button")?.addEventListener("click", this.onHudClick);
    document.addEventListener("keydown", this.onKeyDown);
  }

  isOpen() {
    return Boolean(this.panel && !this.panel.classList.contains("hidden"));
  }

  open(animalId = null) {
    if (animalId && ANIMAL_BY_ID[animalId]) this.selectedAnimalId = animalId;
    this.animals.refresh({ persist: true });
    this.panel?.classList.remove("hidden");
    this.panel?.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    this.render();
    document.querySelector("#animal-friends-close")?.focus({ preventScroll: true });
    return { ok: true, animalId: this.selectedAnimalId };
  }

  close() {
    if (!this.isOpen()) return false;
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    return true;
  }

  report(result) {
    const messages = {
      "animal-greeted": `A gentle hello added ${result.gainedTrust || 0} trust.`,
      "animal-fed": `${result.favorite ? "Favourite treat! " : ""}${result.gainedTrust || 0} trust added and one item used.`,
      "adoption-not-yet": "Not quite ready yet—but your patient invitation built more trust.",
      "animal-adopted": `${this.animals.getSnapshot().residents[result.animalId].name} joined your animal family!`,
      "companion-following": "Your chosen companion is now following you.",
      "companion-roaming": `Your companion is roaming safely in ${SOUTH_MEADOW.label}.`,
    };
    if (this.status) {
      this.status.textContent = result.ok ? messages[result.code] || "Animal friendship updated." : result.message || "That is not available yet.";
      this.status.dataset.status = result.ok ? "success" : "error";
    }
    this.render();
    return result;
  }

  render() {
    if (!this.panel) return;
    const game = this.animals.gameState.getSnapshot();
    const presentations = this.animals.getWorldPresentations();
    const byId = Object.fromEntries(presentations.map((entry) => [entry.definition.id, entry]));
    const list = document.querySelector("#animal-friends-list");
    if (list) list.innerHTML = ANIMAL_DEFINITIONS.map((definition) => {
      const entry = byId[definition.id];
      const species = speciesFor(definition);
      const current = definition.id === this.selectedAnimalId;
      return `<button type="button" data-animal-id="${definition.id}" class="animal-list-card ${current ? "selected" : ""}" aria-pressed="${current}"><span>${species.icon}</span><div><strong>${entry.state.name}</strong><small>${definition.personality} ${species.label} · ${entry.state.trust}% trust</small></div><em>${entry.state.active ? "Following" : entry.state.adopted ? "Adopted" : entry.visible ? "Nearby" : "Away"}</em></button>`;
    }).join("");

    const entry = byId[this.selectedAnimalId] || presentations[0];
    const resident = entry.state;
    const species = speciesFor(entry.definition);
    document.querySelector("#animal-detail-icon").textContent = species.icon;
    document.querySelector("#animal-detail-name").textContent = resident.name;
    document.querySelector("#animal-detail-kind").textContent = `${entry.definition.personality} ${species.label} · ${locationLabel(entry)}`;
    const progress = document.querySelector("#animal-trust-progress");
    progress.value = resident.trust;
    progress.textContent = `${resident.trust}%`;
    document.querySelector("#animal-trust-label").textContent = `${resident.trust}% trust${resident.adopted && resident.trust <= COMPANION_CARE_CONFIG.warningThreshold ? " · needs care soon" : ""}`;
    document.querySelector("#animal-habitat").textContent = `Habitat: ${species.habitat}. ${species.rare ? "Rare visitor." : "Wildlife routes rotate through the day."}`;

    const greet = document.querySelector("#animal-greet");
    greet.disabled = !entry.visible;
    const foods = document.querySelector("#animal-foods");
    if (foods) foods.innerHTML = species.accepted.map((itemId) => {
      const item = ITEM_CATALOG[itemId];
      const owned = this.animals.inventory.quantity(game.inventory, itemId);
      const favorite = species.favorites.includes(itemId);
      return `<button type="button" data-animal-food="${itemId}" ${owned < 1 || resident.lastTreatDay === game.world.day || !entry.visible ? "disabled" : ""}><span>${item.icon}</span><strong>${item.name}</strong><small>${owned} owned${favorite ? " · favourite" : ""}</small></button>`;
    }).join("");
    const adopt = document.querySelector("#animal-adopt");
    const follow = document.querySelector("#animal-follow");
    const roam = document.querySelector("#animal-roam");
    adopt.hidden = resident.adopted;
    adopt.disabled = !entry.visible || resident.lastRequestDay === game.world.day;
    adopt.textContent = game.customResident.profile ? `Invite to join · ${Math.round(adoptionChance(resident, entry.definition) * 100)}% chance` : "Create your resident before adopting";
    follow.hidden = !resident.adopted || resident.active;
    roam.hidden = !resident.active;
    document.querySelector("#animal-meadow-summary").textContent = `${Object.values(game.animals.residents).filter((animal) => animal.adopted && !animal.active).length} adopted companion${Object.values(game.animals.residents).filter((animal) => animal.adopted && !animal.active).length === 1 ? "" : "s"} roaming safely there.`;
    document.querySelector("#animal-family-count").textContent = `${Object.values(game.animals.residents).filter((animal) => animal.adopted).length} adopted · no family limit`;
  }

  getDiagnostics() {
    return { open: this.isOpen(), selectedAnimalId: this.selectedAnimalId, qaGuaranteed: this.qaGuaranteed };
  }
}
