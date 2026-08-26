import { ALLOTMENT_CONFIG, FARMING_CROPS, LAWN_CONFIG, LAWN_PLOTS, ORCHARD_CONFIG, lawnNeedsCare } from "../data/farming.js";

function percentage(value, total) {
  return Math.max(0, Math.min(100, Math.round((Number(value) || 0) / total * 100)));
}

export class FarmingController {
  constructor(farming, { onModalChange = () => {}, onStartLawnJob = () => ({ ok: false }), onStartLawnCampaign = () => ({ ok: false }), onOpenSeedShop = () => ({ ok: false }), onPlaceSapling = () => ({ ok: false }) } = {}) {
    this.farming = farming;
    this.onModalChange = onModalChange;
    this.onStartLawnJob = onStartLawnJob;
    this.onStartLawnCampaign = onStartLawnCampaign;
    this.onOpenSeedShop = onOpenSeedShop;
    this.onPlaceSapling = onPlaceSapling;
    this.selectedCropId = "carrot";
    this.selectedTab = "allotment";
    this.selectedLawnId = LAWN_PLOTS[0].id;
    this.selectedTreeId = "apple-tree-1";
    this.panel = document.querySelector("#farming-panel");
    this.status = document.querySelector("#farming-status");
    this.bind();
    this.unsubscribe = farming.subscribe(() => this.render());
  }

  bind() {
    this.onClick = (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.id === "farming-close") return this.close();
      if (button.dataset.farmingTab) {
        this.selectedTab = button.dataset.farmingTab;
        return this.render();
      }
      if (button.dataset.cropId) {
        this.selectedCropId = button.dataset.cropId;
        return this.render();
      }
      if (button.dataset.buySeed) {
        const crop = FARMING_CROPS[button.dataset.buySeed];
        this.close();
        return this.onOpenSeedShop(crop?.seedId);
      }
      if (button.dataset.plantBed) return this.report(this.farming.plant(button.dataset.plantBed, this.selectedCropId));
      if (button.dataset.harvestBed) return this.report(this.farming.harvest(button.dataset.harvestBed));
      if (button.dataset.unlockBed) return this.report(this.farming.unlockBed(button.dataset.unlockBed));
      if (button.dataset.harvestTree) return this.report(this.farming.harvestApple(button.dataset.harvestTree));
      if (button.id === "farming-buy-sapling") {
        this.close();
        return this.onOpenSeedShop("orchard-apple-sapling");
      }
      if (button.id === "farming-place-sapling") {
        const result = this.onPlaceSapling();
        if (result?.ok || this.farming.getPlacementSnapshot?.().active) {
          this.close();
          return result;
        }
        return this.report(result || { ok: false, message: "Apple-tree placement is not ready." });
      }
      if (button.dataset.lawnId) {
        this.selectedLawnId = button.dataset.lawnId;
        return this.render();
      }
      if (button.id === "farming-complete-lawn") {
        const result = this.onStartLawnJob(this.selectedLawnId);
        if (result?.ok) this.close();
        return result?.ok ? result : this.report(result || { ok: false, message: "Lawn Care is not ready." });
      }
      if (button.id === "farming-lawn-campaign") {
        const result = this.onStartLawnCampaign();
        if (result?.ok) this.close();
        return result?.ok ? result : this.report(result || { ok: false, message: "The Lawn Care campaign is not ready." });
      }
    };
    this.onKeyDown = (event) => {
      if (event.key === "Escape" && this.isOpen()) this.close();
    };
    this.panel?.addEventListener("click", this.onClick);
    document.addEventListener("keydown", this.onKeyDown);
  }

  isOpen() {
    return Boolean(this.panel && !this.panel.classList.contains("hidden"));
  }

  open(tab = "allotment", targetId = null) {
    this.selectedTab = ["allotment", "orchard", "lawns"].includes(tab) ? tab : "allotment";
    if (targetId && LAWN_PLOTS.some((plot) => plot.id === targetId)) this.selectedLawnId = targetId;
    if (targetId && this.farming.getSnapshot().orchard.trees.some((tree) => tree.id === targetId)) this.selectedTreeId = targetId;
    this.farming.refresh({ persist: true });
    this.panel?.classList.remove("hidden");
    this.panel?.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    this.render();
    document.querySelector("#farming-close")?.focus({ preventScroll: true });
    return { ok: true, tab: this.selectedTab };
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
      "seed-purchased": "Seed packet bought and placed safely in your inventory.",
      "crop-planted": "Crop planted. Weather and game time now control its growth.",
      "crop-harvested": `Harvest collected: ${result.quantity || 0} added to inventory.`,
      "bed-unlocked": "A new allotment bed is ready to use.",
      "apple-harvested": "One apple collected. The tree has started producing again.",
      "sapling-purchased": "Apple sapling bought. Return to the orchard panel to place it in town.",
      "sapling-planted": "Apple sapling planted. Weather and game time now control its growth.",
      "lawn-completed": `Lawn restored and 🪙 ${result.rewardCoins || 0} paid exactly once.`,
    };
    this.status.textContent = result.ok ? messages[result.code] || "Farming state updated." : result.message || result.reason || "That action is not available yet.";
    this.status.dataset.status = result.ok ? "success" : "error";
    this.render();
    return result;
  }

  render() {
    if (!this.panel) return;
    this.farming.refresh({ persist: false });
    const game = this.farming.gameState.getSnapshot();
    const state = game.farming;
    this.panel.dataset.tab = this.selectedTab;
    document.querySelectorAll("[data-farming-tab]").forEach((button) => {
      const active = button.dataset.farmingTab === this.selectedTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-farming-pane]").forEach((pane) => { pane.hidden = pane.dataset.farmingPane !== this.selectedTab; });
    const balance = document.querySelector("#farming-balance");
    if (balance) balance.textContent = `🪙 ${game.economy.coins.toLocaleString()}`;

    const cropChoices = document.querySelector("#farming-crop-choices");
    if (cropChoices) cropChoices.innerHTML = Object.values(FARMING_CROPS).map((crop) => {
      const owned = this.farming.inventory.quantity(game.inventory, crop.seedId);
      return `<button type="button" data-crop-id="${crop.id}" class="${crop.id === this.selectedCropId ? "selected" : ""}" aria-pressed="${crop.id === this.selectedCropId}"><span>${crop.icon}</span><strong>${crop.label}</strong><small>${owned} packet${owned === 1 ? "" : "s"} · yields ${crop.harvestYield}</small></button>`;
    }).join("");
    const selectedCrop = FARMING_CROPS[this.selectedCropId];
    const buy = document.querySelector("#farming-buy-seed");
    if (buy) {
      buy.dataset.buySeed = selectedCrop.id;
      buy.textContent = `Shop for ${selectedCrop.seedLabel} · Village Grocer`;
      buy.disabled = false;
    }
    const beds = document.querySelector("#farming-beds");
    if (beds) beds.innerHTML = state.allotment.beds.map((bed, index) => {
      if (!bed.unlocked) {
        const cost = ALLOTMENT_CONFIG.bedUnlockCosts[index];
        return `<article class="farm-card locked"><span class="farm-icon">🔒</span><div><strong>Bed ${index + 1}</strong><small>Unlock for 🪙 ${cost.toLocaleString()}</small></div><button type="button" data-unlock-bed="${bed.id}" ${game.economy.coins < cost ? "disabled" : ""}>Unlock</button></article>`;
      }
      if (bed.status === "empty") return `<article class="farm-card"><span class="farm-icon">🟫</span><div><strong>Bed ${index + 1}</strong><small>Empty and ready</small></div><button type="button" data-plant-bed="${bed.id}" ${this.farming.inventory.quantity(game.inventory, selectedCrop.seedId) < 1 ? "disabled" : ""}>Plant ${selectedCrop.icon}</button></article>`;
      const crop = FARMING_CROPS[bed.cropId];
      const progress = percentage(bed.growthMinutes, crop.growMinutes);
      return `<article class="farm-card ${bed.status}"><span class="farm-icon">${crop.icon}</span><div><strong>Bed ${index + 1} · ${crop.label}</strong><small>${bed.status === "ready" ? `Ready · collect ${crop.harvestYield}` : `Growing · ${progress}%`}</small><progress max="100" value="${progress}">${progress}%</progress></div><button type="button" data-harvest-bed="${bed.id}" ${bed.status !== "ready" ? "disabled" : ""}>Harvest</button></article>`;
    }).join("");

    const readyTrees = state.orchard.trees.filter((tree) => tree.availableFruit > 0).length;
    const growingTrees = state.orchard.trees.filter((tree) => tree.status === "growing").length;
    const orchardState = document.querySelector("#farming-orchard-state");
    if (orchardState) orchardState.innerHTML = `<span class="orchard-tree">${readyTrees ? "🌳🍎" : growingTrees ? "🌱" : "🌳"}</span><div><strong>${state.orchard.trees.length} / ${ORCHARD_CONFIG.maxTrees} apple trees · ${readyTrees} ready</strong><small>${growingTrees} growing · ${state.orchard.purchasedSaplings} purchased sapling${state.orchard.purchasedSaplings === 1 ? "" : "s"} waiting to be placed</small><progress max="${ORCHARD_CONFIG.maxTrees}" value="${state.orchard.trees.length}">${state.orchard.trees.length}</progress></div>`;
    const treeGrid = document.querySelector("#farming-orchard-trees");
    if (treeGrid) treeGrid.innerHTML = state.orchard.trees.map((tree, index) => {
      const progress = tree.status === "growing"
        ? percentage(tree.growthMinutes, ORCHARD_CONFIG.maturityMinutes)
        : percentage(tree.fruitProgressMinutes, ORCHARD_CONFIG.productionMinutes);
      const detail = tree.status === "growing" ? `Sapling growing · ${progress}%` : tree.availableFruit ? "One ripe apple ready" : `Producing next apple · ${progress}%`;
      return `<article class="farm-card orchard-tree-card ${tree.availableFruit ? "ready" : tree.status}"><span class="farm-icon">${tree.status === "growing" ? "🌱" : tree.availableFruit ? "🍎" : "🌳"}</span><div><strong>Tree ${index + 1}</strong><small>${detail} · ${Math.round(tree.x)}, ${Math.round(tree.y)}</small><progress max="100" value="${progress}">${progress}%</progress></div><button type="button" data-harvest-tree="${tree.id}" ${tree.availableFruit < 1 ? "disabled" : ""}>Harvest</button></article>`;
    }).join("");
    const buySapling = document.querySelector("#farming-buy-sapling");
    if (buySapling) buySapling.disabled = state.orchard.trees.length + state.orchard.purchasedSaplings >= ORCHARD_CONFIG.maxTrees;
    const placeSapling = document.querySelector("#farming-place-sapling");
    if (placeSapling) {
      placeSapling.disabled = state.orchard.purchasedSaplings < 1 || state.orchard.trees.length >= ORCHARD_CONFIG.maxTrees;
      placeSapling.textContent = state.orchard.purchasedSaplings > 0 ? `Place owned sapling · ${state.orchard.purchasedSaplings}` : "Place owned sapling";
    }
    const appleCount = document.querySelector("#farming-apple-count");
    if (appleCount) appleCount.textContent = `${this.farming.inventory.quantity(game.inventory, "orchard-apple")} in inventory`;

    const lawns = document.querySelector("#farming-lawns");
    if (lawns) lawns.innerHTML = LAWN_PLOTS.map((plot) => {
      const lawn = state.lawns[plot.id];
      const needsCare = lawnNeedsCare(lawn);
      return `<button type="button" data-lawn-id="${plot.id}" class="lawn-card ${plot.id === this.selectedLawnId ? "selected" : ""}" aria-pressed="${plot.id === this.selectedLawnId}"><span>${needsCare ? "🌾" : "🌱"}</span><strong>${plot.title}</strong><small>Grass ${Math.round(lawn.grassHeight)}% · weeds ${Math.round(lawn.weedPressure)}%</small><em>${needsCare ? "Job available" : "Looking tidy"}</em></button>`;
    }).join("");
    const selectedLawn = state.lawns[this.selectedLawnId];
    const selectedPlot = LAWN_PLOTS.find((plot) => plot.id === this.selectedLawnId);
    const lawnButton = document.querySelector("#farming-complete-lawn");
    if (lawnButton) {
      lawnButton.disabled = !lawnNeedsCare(selectedLawn);
      lawnButton.textContent = lawnNeedsCare(selectedLawn) ? "Start this Lawn Care job" : "No lawn job needed";
    }
    const lawnSummary = document.querySelector("#farming-lawn-summary");
    if (lawnSummary) lawnSummary.textContent = `${selectedPlot?.title || "Lawn"} · completed ${selectedLawn?.completedJobs || 0} time${selectedLawn?.completedJobs === 1 ? "" : "s"}`;
  }

  getDiagnostics() {
    return { open: this.isOpen(), selectedTab: this.selectedTab, selectedCropId: this.selectedCropId, selectedLawnId: this.selectedLawnId, selectedTreeId: this.selectedTreeId };
  }
}
