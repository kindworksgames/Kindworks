export function createDevelopmentBillingBridge(gameState, { now = () => Date.now() } = {}) {
  const receipts = [];

  function walletWithGrant(coins) {
    const state = gameState.getSnapshot();
    return {
      coins: state.economy.coins + coins,
      lifetimeCoinsEarned: state.economy.lifetimeCoinsEarned + coins,
      lifetimeCoinsSpent: state.economy.lifetimeCoinsSpent,
      version: state.commerce.walletVersion + 1,
    };
  }

  function envelope(payload) {
    const value = { developmentVerified: true, payload };
    receipts.push(structuredClone(value));
    return value;
  }

  return {
    walletAuthority: "server",
    environment: "development-sandbox",
    localizedPrices: {},
    async purchaseCoinPack(pack) {
      const serial = receipts.length + 1;
      return envelope({
        kind: "coin-pack", productId: pack.id, packId: pack.id, transactionId: `sandbox-coin-${serial}`,
        coins: pack.coins, wallet: walletWithGrant(pack.coins), verifiedAt: new Date(now()).toISOString(),
      });
    },
    async purchaseSubscription(tier) {
      const serial = receipts.length + 1;
      const start = new Date(now());
      const end = new Date(start.getTime() + 30 * 86_400_000);
      return envelope({
        kind: "subscription", productId: tier.id, tierId: tier.id, subscriptionId: "sandbox-kindlyclub",
        currentPeriodStart: start.toISOString(), currentPeriodEnd: end.toISOString(), coins: tier.monthlyCoins,
        giftItemId: tier.monthlyGiftItem, wallet: walletWithGrant(tier.monthlyCoins), verifiedAt: start.toISOString(), serial,
      });
    },
    async restorePurchases() {
      return { receipts: receipts.map((receipt) => structuredClone(receipt)) };
    },
    async manageSubscriptions() {
      return { ok: true, code: "sandbox-management-opened" };
    },
  };
}

export async function verifyDevelopmentReceipt(envelope, { kind, productId } = {}) {
  const payload = envelope?.payload;
  const receiptProduct = payload?.productId || payload?.packId || payload?.tierId;
  if (envelope?.developmentVerified !== true || !payload || payload.kind !== kind || String(receiptProduct || "") !== String(productId || "")) return { ok: false, code: "invalid-sandbox-receipt", message: "The development receipt is invalid." };
  return { ok: true, payload: structuredClone(payload) };
}
