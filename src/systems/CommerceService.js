import { COMMERCE_POLICY, COIN_PACKS, COIN_PACK_BY_ID, KINDLY_CLUB_TIERS, KINDLY_CLUB_TIER_BY_ID } from "../data/commerce.js";
import { verifyCommerceEnvelope } from "./CommerceReceiptVerifier.js";

function iso(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function periodKey(subscriptionId, periodStart) {
  return `${String(subscriptionId || "").trim()}::${String(periodStart || "").trim()}`;
}

function remember(list, id, limit) {
  if (list.includes(id)) return false;
  list.push(id);
  if (list.length > limit) list.splice(0, list.length - limit);
  return true;
}

function validatedWallet(payload, current, expectedCoins) {
  const wallet = payload?.wallet;
  if (!wallet || typeof wallet !== "object") return { ok: false, code: "server-wallet-required", message: "The verified server wallet is missing." };
  const values = [wallet.coins, wallet.lifetimeCoinsEarned, wallet.lifetimeCoinsSpent, wallet.version];
  if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) return { ok: false, code: "invalid-server-wallet", message: "The verified server wallet is invalid." };
  if (wallet.lifetimeCoinsEarned - wallet.lifetimeCoinsSpent !== wallet.coins) return { ok: false, code: "unreconciled-server-wallet", message: "The verified server wallet does not reconcile." };
  if (wallet.version <= current.commerce.walletVersion) return { ok: false, code: "stale-server-wallet", message: "The verified server wallet is not newer than this save." };
  if (wallet.coins !== current.economy.coins + expectedCoins || wallet.lifetimeCoinsEarned !== current.economy.lifetimeCoinsEarned + expectedCoins || wallet.lifetimeCoinsSpent !== current.economy.lifetimeCoinsSpent) {
    return { ok: false, code: "server-wallet-mismatch", message: "The server wallet does not match the verified grant. Restore purchases to reconcile this account." };
  }
  return { ok: true, wallet };
}

export class CommerceService {
  constructor(gameState, repository, {
    economy,
    billing = null,
    verifyReceipt = verifyCommerceEnvelope,
    now = () => Date.now(),
    environment = "production",
  } = {}) {
    if (!economy) throw new TypeError("Commerce requires the coin economy.");
    this.gameState = gameState;
    this.repository = repository;
    this.economy = economy;
    this.billing = billing;
    this.verifyReceipt = verifyReceipt;
    this.now = now;
    this.environment = environment;
    this.pendingProductId = null;
    this.lastResult = null;
  }

  subscribe(listener) {
    return this.gameState.subscribe(() => listener(this.getSnapshot()));
  }

  authority() {
    const bridge = this.billing;
    const serverWallet = bridge?.walletAuthority === "server";
    return {
      environment: this.environment,
      serverWallet,
      signedCoinCheckout: serverWallet && typeof bridge?.purchaseCoinPack === "function",
      signedSubscriptionCheckout: serverWallet && typeof bridge?.purchaseSubscription === "function",
      purchaseRestoration: serverWallet && typeof bridge?.restorePurchases === "function",
      subscriptionManagement: typeof bridge?.manageSubscriptions === "function",
      localizedPrices: Boolean(bridge?.localizedPrices || typeof bridge?.getCachedLocalizedPrice === "function"),
      readyForCoinPurchases: serverWallet && typeof bridge?.purchaseCoinPack === "function",
      readyForSubscriptions: serverWallet && typeof bridge?.purchaseSubscription === "function",
      realMoneyRequiresServerWallet: true,
      serverVerifiedReceiptsOnly: true,
    };
  }

  localizedPrice(id, fallback) {
    try {
      const price = this.billing?.localizedPrices?.[id] ?? this.billing?.getCachedLocalizedPrice?.(id);
      return typeof price === "string" && price.trim() ? price.trim() : fallback;
    } catch {
      return fallback;
    }
  }

  getSnapshot() {
    const state = this.gameState.getSnapshot();
    const club = structuredClone(state.commerce.kindlyClub);
    const active = club.status === "active" && Boolean(KINDLY_CLUB_TIER_BY_ID[club.tierId]) && Boolean(club.verifiedBy) && Number.isFinite(Date.parse(club.currentPeriodEnd)) && Date.parse(club.currentPeriodEnd) > this.now();
    return {
      schemaVersion: state.commerce.schemaVersion,
      walletVersion: state.commerce.walletVersion,
      processedTransactions: state.commerce.processedTransactions.length,
      processedPeriods: state.commerce.processedPeriods.length,
      lastRestoreAt: state.commerce.lastRestoreAt,
      kindlyClub: { ...club, active, tier: active ? structuredClone(KINDLY_CLUB_TIER_BY_ID[club.tierId]) : null },
      coinPacks: COIN_PACKS.map((pack) => ({ ...pack, displayPrice: this.localizedPrice(pack.id, pack.displayPrice) })),
      kindlyClubTiers: KINDLY_CLUB_TIERS.map((tier) => ({ ...tier, benefits: [...tier.benefits], displayPrice: this.localizedPrice(tier.id, tier.displayPrice) })),
      authority: this.authority(),
      policy: COMMERCE_POLICY,
      pendingProductId: this.pendingProductId,
      balance: state.economy.coins,
    };
  }

  refuseWithoutAdultConfirmation(adultConfirmed) {
    return adultConfirmed === true ? null : { ok: false, code: "adult-confirmation-required", message: "An adult must confirm before opening a real-money checkout." };
  }

  async verifiedPayload(envelope, kind, productId) {
    const verified = await this.verifyReceipt(envelope, { kind, productId });
    if (!verified?.ok || !verified.payload) return verified?.ok === false ? verified : { ok: false, code: "unverified-receipt", message: "The receipt could not be verified by the KindWorks server." };
    return { ok: true, payload: verified.payload };
  }

  applyCoinPayload(packId, payload) {
    const pack = COIN_PACK_BY_ID[packId];
    const transactionId = String(payload?.transactionId || "").trim().slice(0, 240);
    if (!pack || !transactionId || Number(payload.coins) !== pack.coins) return { ok: false, code: "coin-receipt-mismatch", message: "The verified receipt does not match this coin pack." };
    const snapshot = this.gameState.getSnapshot();
    if (snapshot.commerce.processedTransactions.includes(transactionId)) return { ok: true, code: "purchase-already-credited", duplicate: true, coins: 0, balance: snapshot.economy.coins, transactionId };
    const checked = validatedWallet(payload, snapshot, pack.coins);
    if (!checked.ok) return checked;
    return this.economy.commit((state) => {
      if (state.commerce.processedTransactions.includes(transactionId)) return { ok: true, code: "purchase-already-credited", duplicate: true, coins: 0, balance: state.economy.coins, transactionId };
      const walletCheck = validatedWallet(payload, state, pack.coins);
      if (!walletCheck.ok) return walletCheck;
      state.economy.coins = checked.wallet.coins;
      state.economy.lifetimeCoinsEarned = checked.wallet.lifetimeCoinsEarned;
      state.economy.lifetimeCoinsSpent = checked.wallet.lifetimeCoinsSpent;
      state.commerce.walletVersion = checked.wallet.version;
      remember(state.commerce.processedTransactions, transactionId, COMMERCE_POLICY.processedTransactionLimit);
      const ledger = this.economy.appendLedger(state, {
        amount: pack.coins, kind: "coin-purchase", reason: `${pack.coins.toLocaleString()} KindlyCoin pack`,
        packId, transactionId, verifiedBy: "server", walletAuthority: "server", displayPrice: this.localizedPrice(pack.id, pack.displayPrice),
      });
      return { ok: true, code: "coin-pack-credited", coins: pack.coins, balance: state.economy.coins, transactionId, ledger };
    });
  }

  applySubscriptionPayload(tierId, payload) {
    const tier = KINDLY_CLUB_TIER_BY_ID[tierId];
    const subscriptionId = String(payload?.subscriptionId || "").trim().slice(0, 240);
    const start = iso(payload?.currentPeriodStart);
    const end = iso(payload?.currentPeriodEnd);
    if (!tier || !subscriptionId || !start || !end || Date.parse(end) <= Date.parse(start) || Date.parse(end) <= this.now()) return { ok: false, code: "subscription-receipt-mismatch", message: "The verified membership period is incomplete or expired." };
    if (Number(payload.coins) !== tier.monthlyCoins || (payload.giftItemId || null) !== tier.monthlyGiftItem) return { ok: false, code: "subscription-entitlement-mismatch", message: "The verified membership benefits do not match this tier." };
    const key = periodKey(subscriptionId, start);
    const snapshot = this.gameState.getSnapshot();
    const duplicate = snapshot.commerce.processedPeriods.includes(key);
    if (!duplicate) {
      const checked = validatedWallet(payload, snapshot, tier.monthlyCoins);
      if (!checked.ok) return checked;
    }
    return this.economy.commit((state) => {
      const alreadyGranted = state.commerce.processedPeriods.includes(key);
      let gift = null;
      let ledger = null;
      if (!alreadyGranted) {
        const checked = validatedWallet(payload, state, tier.monthlyCoins);
        if (!checked.ok) return checked;
        if (tier.monthlyGiftItem) {
          const itemResult = this.economy.inventory.add(state.inventory, tier.monthlyGiftItem, 1);
          if (!itemResult.ok) return { ...itemResult, code: "membership-gift-capacity", message: "The monthly gift cannot fit in inventory, so no membership benefits were applied." };
          gift = tier.monthlyGiftItem;
        }
        state.economy.coins = checked.wallet.coins;
        state.economy.lifetimeCoinsEarned = checked.wallet.lifetimeCoinsEarned;
        state.economy.lifetimeCoinsSpent = checked.wallet.lifetimeCoinsSpent;
        state.commerce.walletVersion = checked.wallet.version;
        remember(state.commerce.processedPeriods, key, COMMERCE_POLICY.processedPeriodLimit);
        ledger = this.economy.appendLedger(state, {
          amount: tier.monthlyCoins, kind: "kindlyclub-monthly", reason: `${tier.name} monthly benefits`,
          tierId, subscriptionId, periodStart: start, giftItemId: gift, verifiedBy: "server", walletAuthority: "server",
        });
      }
      state.commerce.kindlyClub = {
        tierId, status: "active", subscriptionId, currentPeriodStart: start, currentPeriodEnd: end,
        lastVerifiedAt: iso(payload.verifiedAt) || new Date(this.now()).toISOString(), verifiedBy: "server",
      };
      return { ok: true, code: alreadyGranted ? "membership-verified" : "membership-benefits-granted", duplicate: alreadyGranted, coins: alreadyGranted ? 0 : tier.monthlyCoins, gift, periodKey: key, ledger };
    });
  }

  async purchaseCoinPack(packId, { adultConfirmed = false } = {}) {
    const confirmation = this.refuseWithoutAdultConfirmation(adultConfirmed);
    if (confirmation) return confirmation;
    const pack = COIN_PACK_BY_ID[packId];
    if (!pack) return { ok: false, code: "unknown-coin-pack", message: "That coin pack is not available." };
    if (this.pendingProductId) return { ok: false, code: "checkout-pending", message: "Another checkout is already in progress." };
    if (!this.authority().readyForCoinPurchases) return { ok: false, code: "billing-not-connected", requiresBilling: true, message: "Coin checkout is unavailable until Apple/Google billing and the KindWorks server wallet are connected." };
    this.pendingProductId = packId;
    try {
      const envelope = await this.billing.purchaseCoinPack(structuredClone(pack));
      const verified = await this.verifiedPayload(envelope, "coin-pack", packId);
      this.lastResult = verified.ok ? this.applyCoinPayload(packId, verified.payload) : verified;
      return this.lastResult;
    } catch (error) {
      return { ok: false, code: "checkout-failed", message: String(error) };
    } finally {
      this.pendingProductId = null;
    }
  }

  async purchaseSubscription(tierId, { adultConfirmed = false } = {}) {
    const confirmation = this.refuseWithoutAdultConfirmation(adultConfirmed);
    if (confirmation) return confirmation;
    const tier = KINDLY_CLUB_TIER_BY_ID[tierId];
    if (!tier) return { ok: false, code: "unknown-membership-tier", message: "That membership tier is not available." };
    if (this.pendingProductId) return { ok: false, code: "checkout-pending", message: "Another checkout is already in progress." };
    if (!this.authority().readyForSubscriptions) return { ok: false, code: "billing-not-connected", requiresBilling: true, message: "Membership checkout is unavailable until Apple/Google billing and server verification are connected." };
    this.pendingProductId = tierId;
    try {
      const envelope = await this.billing.purchaseSubscription(structuredClone(tier));
      const verified = await this.verifiedPayload(envelope, "subscription", tierId);
      this.lastResult = verified.ok ? this.applySubscriptionPayload(tierId, verified.payload) : verified;
      return this.lastResult;
    } catch (error) {
      return { ok: false, code: "checkout-failed", message: String(error) };
    } finally {
      this.pendingProductId = null;
    }
  }

  async restorePurchases({ adultConfirmed = false } = {}) {
    const confirmation = this.refuseWithoutAdultConfirmation(adultConfirmed);
    if (confirmation) return confirmation;
    if (!this.authority().purchaseRestoration) return { ok: false, code: "restore-not-connected", requiresBilling: true, message: "Purchase restoration is available in the packaged Apple/Google app once the server wallet is connected." };
    if (this.pendingProductId) return { ok: false, code: "checkout-pending", message: "Another checkout is already in progress." };
    this.pendingProductId = "restore";
    const results = [];
    try {
      const response = await this.billing.restorePurchases();
      for (const envelope of Array.isArray(response?.receipts) ? response.receipts : []) {
        const kind = envelope?.payload?.kind;
        const productId = envelope?.payload?.productId || envelope?.payload?.packId || envelope?.payload?.tierId;
        const verified = await this.verifiedPayload(envelope, kind, productId);
        if (!verified.ok) results.push(verified);
        else if (kind === "coin-pack") results.push(this.applyCoinPayload(productId, verified.payload));
        else if (kind === "subscription") results.push(this.applySubscriptionPayload(productId, verified.payload));
        else results.push({ ok: false, code: "unsupported-restored-receipt", message: "An unsupported restored receipt was ignored." });
      }
      const saved = this.economy.commit((state) => {
        state.commerce.lastRestoreAt = new Date(this.now()).toISOString();
        return { ok: true, code: "restore-recorded" };
      });
      this.lastResult = { ok: Boolean(saved?.ok) && results.every((result) => result.ok), code: saved?.ok ? "purchases-restored" : "restore-save-failed", restored: results.filter((result) => result.ok && !result.duplicate).length, duplicates: results.filter((result) => result.duplicate).length, results, save: saved };
      return this.lastResult;
    } catch (error) {
      return { ok: false, code: "restore-failed", message: String(error) };
    } finally {
      this.pendingProductId = null;
    }
  }

  async manageSubscription() {
    if (!this.authority().subscriptionManagement) return { ok: false, code: "management-not-connected", message: "Subscription management opens through Apple or Google in the packaged app." };
    try {
      return await this.billing.manageSubscriptions();
    } catch (error) {
      return { ok: false, code: "management-failed", message: String(error) };
    }
  }

  getDiagnostics() {
    const snapshot = this.getSnapshot();
    return {
      schemaVersion: snapshot.schemaVersion,
      coinPackCount: snapshot.coinPacks.length,
      tierCount: snapshot.kindlyClubTiers.length,
      processedTransactions: snapshot.processedTransactions,
      processedPeriods: snapshot.processedPeriods,
      membershipActive: snapshot.kindlyClub.active,
      membershipTierId: snapshot.kindlyClub.tierId,
      authority: snapshot.authority,
      policy: snapshot.policy,
      pendingProductId: snapshot.pendingProductId,
      lastResult: this.lastResult,
    };
  }
}
