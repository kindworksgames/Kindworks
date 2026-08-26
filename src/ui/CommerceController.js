function formatCoins(value) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

export class CommerceController {
  constructor(commerce) {
    this.commerce = commerce;
    this.root = document.querySelector("#commerce-view");
    this.status = document.querySelector("#commerce-status");
    this.authority = document.querySelector("#commerce-authority");
    this.confirmation = document.querySelector("#commerce-adult-confirmation");
    this.packGrid = document.querySelector("#coin-pack-grid");
    this.clubGrid = document.querySelector("#kindly-club-grid");
    this.clubStatus = document.querySelector("#kindly-club-status");
    this.restoreButton = document.querySelector("#commerce-restore");
    this.manageButton = document.querySelector("#commerce-manage");
    this.onClick = (event) => this.handleClick(event);
    this.onConfirmation = () => this.render();
    this.root?.addEventListener("click", this.onClick);
    this.confirmation?.addEventListener("change", this.onConfirmation);
    this.unsubscribe = commerce.subscribe(() => this.render());
    this.render();
  }

  adultConfirmed() {
    return this.confirmation?.checked === true;
  }

  setStatus(message, type = "neutral") {
    if (!this.status) return;
    this.status.textContent = message;
    this.status.dataset.status = type;
  }

  render() {
    const snapshot = this.commerce.getSnapshot();
    const authority = snapshot.authority;
    const confirmed = this.adultConfirmed();
    if (this.authority) {
      this.authority.dataset.ready = String(authority.readyForCoinPurchases && authority.readyForSubscriptions);
      this.authority.textContent = authority.environment === "development-sandbox"
        ? "Development sandbox · no real charge"
        : authority.serverWallet
          ? "Apple/Google billing · server wallet connected"
          : "Real purchases unavailable in this web build";
    }
    if (this.packGrid) {
      this.packGrid.replaceChildren(...snapshot.coinPacks.map((pack) => {
        const article = document.createElement("article");
        article.className = "coin-pack-card";
        article.innerHTML = `<span aria-hidden="true">🪙</span><strong>${formatCoins(pack.coins)}</strong><small>KindlyCoins</small><button type="button" data-coin-pack="${escapeHtml(pack.id)}">${snapshot.pendingProductId === pack.id ? "Connecting…" : escapeHtml(pack.displayPrice)}</button>`;
        const button = article.querySelector("button");
        button.disabled = !confirmed || !authority.readyForCoinPurchases || Boolean(snapshot.pendingProductId);
        return article;
      }));
    }
    const membership = snapshot.kindlyClub;
    if (this.clubStatus) this.clubStatus.textContent = membership.active
      ? `${membership.tier.icon} ${membership.tier.name} active until ${new Date(membership.currentPeriodEnd).toLocaleDateString("en-GB")}`
      : membership.status === "expired" || (membership.status === "active" && !membership.active)
        ? "Membership period ended · restore or renew through Apple/Google"
        : "No active KindlyClub membership";
    if (this.clubGrid) {
      this.clubGrid.replaceChildren(...snapshot.kindlyClubTiers.map((tier) => {
        const active = membership.active && membership.tierId === tier.id;
        const article = document.createElement("article");
        article.className = `kindly-club-card${active ? " active" : ""}`;
        const benefits = tier.benefits.map((benefit) => `<li>${benefit}</li>`).join("");
        article.innerHTML = `<header><span aria-hidden="true">${tier.icon}</span><div><strong>${tier.name}</strong><small>${active ? "Active" : tier.tag}</small></div></header><p>${tier.description}</p><ul>${benefits}</ul><button type="button" data-kindly-tier="${escapeHtml(tier.id)}">${snapshot.pendingProductId === tier.id ? "Connecting…" : active ? "Active plan" : escapeHtml(tier.displayPrice)}</button>`;
        const button = article.querySelector("button");
        button.disabled = active || !confirmed || !authority.readyForSubscriptions || Boolean(snapshot.pendingProductId);
        return article;
      }));
    }
    if (this.restoreButton) this.restoreButton.disabled = !confirmed || !authority.purchaseRestoration || Boolean(snapshot.pendingProductId);
    if (this.manageButton) this.manageButton.disabled = !authority.subscriptionManagement;
  }

  async handleClick(event) {
    const packButton = event.target.closest?.("[data-coin-pack]");
    const tierButton = event.target.closest?.("[data-kindly-tier]");
    let promise = null;
    if (packButton) promise = this.commerce.purchaseCoinPack(packButton.dataset.coinPack, { adultConfirmed: this.adultConfirmed() });
    else if (tierButton) promise = this.commerce.purchaseSubscription(tierButton.dataset.kindlyTier, { adultConfirmed: this.adultConfirmed() });
    else if (event.target.closest?.("#commerce-restore")) promise = this.commerce.restorePurchases({ adultConfirmed: this.adultConfirmed() });
    else if (event.target.closest?.("#commerce-manage")) promise = this.commerce.manageSubscription();
    if (!promise) return null;
    this.setStatus("Connecting securely…");
    this.render();
    const result = await promise;
    const success = result?.ok;
    const message = result?.code === "coin-pack-credited"
      ? `${formatCoins(result.coins)} KindlyCoins added and saved.`
      : result?.code === "membership-benefits-granted"
        ? `Membership active · ${formatCoins(result.coins)} coins${result.gift ? " and monthly gift" : ""} saved.`
        : result?.code === "purchases-restored"
          ? `${result.restored} purchase grant${result.restored === 1 ? "" : "s"} restored · ${result.duplicates} already safe.`
          : result?.message || (success ? "Store action completed." : "The store action could not be completed.");
    this.setStatus(message, success ? "success" : "error");
    this.render();
    return result;
  }

  destroy() {
    this.root?.removeEventListener("click", this.onClick);
    this.confirmation?.removeEventListener("change", this.onConfirmation);
    this.unsubscribe?.();
  }
}
