import { ITEM_CATALOG } from "../data/items.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { InventoryService } from "./InventoryService.js";

function positiveAmount(value) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export class EconomyService {
  constructor(gameState, repository, { now = () => Date.now(), catalog = ITEM_CATALOG } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.catalog = catalog;
    this.inventory = new InventoryService(catalog);
  }

  appendLedger(state, { amount, kind, reason, itemId = null, quantity = null }) {
    const serial = state.economy.nextTransactionId;
    const entry = {
      id: `coin-${String(serial).padStart(6, "0")}`,
      amount,
      kind,
      reason: String(reason || kind),
      itemId,
      quantity,
      occurredAt: new Date(this.now()).toISOString(),
    };
    state.economy.nextTransactionId += 1;
    state.economy.ledger.push(entry);
    state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
    return entry;
  }

  commit(mutator) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = this.repository.save(working, { now: this.now() });
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return {
        ok: false,
        code: "persistence-failed",
        message: "The transaction could not be saved, so no balance or inventory change was kept.",
        save: saved,
        rollbackOk: rollback.ok,
      };
    }
    return { ...mutation, state: this.gameState.getSnapshot(), save: saved };
  }

  credit(amountValue, { kind = "reward", reason = "Kindworks reward", itemId = null, quantity = null } = {}) {
    const amount = positiveAmount(amountValue);
    if (!amount) return { ok: false, code: "invalid-amount", message: "Coin amount must be a positive whole number." };
    return this.commit((state) => {
      if (state.economy.coins + amount > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
      const before = state.economy.coins;
      state.economy.coins += amount;
      state.economy.lifetimeCoinsEarned += amount;
      const ledger = this.appendLedger(state, { amount, kind, reason, itemId, quantity });
      return { ok: true, code: "credited", amount, before, after: state.economy.coins, ledger };
    });
  }

  debit(amountValue, { kind = "spend", reason = "Kindworks purchase", itemId = null, quantity = null } = {}) {
    const amount = positiveAmount(amountValue);
    if (!amount) return { ok: false, code: "invalid-amount", message: "Coin amount must be a positive whole number." };
    return this.commit((state) => {
      const before = state.economy.coins;
      if (before < amount) return { ok: false, code: "insufficient-funds", message: "Not enough KindlyCoins.", required: amount, available: before };
      state.economy.coins -= amount;
      state.economy.lifetimeCoinsSpent += amount;
      const ledger = this.appendLedger(state, { amount: -amount, kind, reason, itemId, quantity });
      return { ok: true, code: "debited", amount, before, after: state.economy.coins, ledger };
    });
  }

  purchase(itemId, requestedQuantity = 1) {
    const item = this.catalog[itemId];
    const quantity = Number(requestedQuantity);
    if (!item) return { ok: false, code: "unknown-item", message: `Unknown item: ${itemId}` };
    if (!Number.isSafeInteger(quantity) || quantity < 1) return { ok: false, code: "invalid-quantity", message: "Quantity must be a positive whole number." };
    if (item.qaOnly || item.fishingOnly || item.subscriptionOnly || item.price < 1) return { ok: false, code: "not-purchasable", message: `${item.name} cannot be bought through the coin economy.` };
    const cost = item.price * quantity;
    if (!Number.isSafeInteger(cost)) return { ok: false, code: "cost-overflow", message: "Purchase total is too large." };
    return this.commit((state) => {
      if (state.economy.coins < cost) return { ok: false, code: "insufficient-funds", message: "Not enough KindlyCoins.", required: cost, available: state.economy.coins };
      const inventoryResult = this.inventory.add(state.inventory, itemId, quantity);
      if (!inventoryResult.ok) return inventoryResult;
      const before = state.economy.coins;
      state.economy.coins -= cost;
      state.economy.lifetimeCoinsSpent += cost;
      const ledger = this.appendLedger(state, { amount: -cost, kind: "purchase", reason: `Bought ${item.name}`, itemId, quantity });
      return { ok: true, code: "purchased", itemId, quantity, cost, before, after: state.economy.coins, inventory: inventoryResult, ledger };
    });
  }

  grantItem(itemId, quantity = 1, { reason = "Item reward" } = {}) {
    return this.commit((state) => {
      const result = this.inventory.add(state.inventory, itemId, quantity);
      return result.ok ? { ...result, code: "item-granted", reason } : result;
    });
  }

  consumeItem(itemId, quantity = 1, { reason = "Item used" } = {}) {
    return this.commit((state) => {
      const result = this.inventory.remove(state.inventory, itemId, quantity);
      return result.ok ? { ...result, code: "item-consumed", reason } : result;
    });
  }
}
