import {
  INVENTORY_BUCKETS,
  ITEM_CATALOG,
  inventoryBucketFor,
  inventoryLimitFor,
} from "../data/items.js";

export const ECONOMY_SCHEMA_VERSION = 1;
export const INVENTORY_SCHEMA_VERSION = 1;
export const STARTER_COINS = 100;
export const COIN_LEDGER_LIMIT = 500;

function safeInteger(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

export function createFreshInventoryState() {
  return {
    schemaVersion: INVENTORY_SCHEMA_VERSION,
    equipment: { "starter-mower": 1, "starter-vacuum": 1 },
    placeables: {},
    consumables: { "carrot-seeds": 1 },
    furniture: {},
    equipped: { mower: "starter-mower", vacuum: "starter-vacuum" },
    unresolvedLegacy: [],
  };
}

export function createFreshEconomyState({ now = Date.now() } = {}) {
  const occurredAt = new Date(now).toISOString();
  return {
    schemaVersion: ECONOMY_SCHEMA_VERSION,
    coins: STARTER_COINS,
    lifetimeCoinsEarned: STARTER_COINS,
    lifetimeCoinsSpent: 0,
    nextTransactionId: 2,
    ledger: [{
      id: "coin-000001",
      amount: STARTER_COINS,
      kind: "starter-grant",
      reason: "Welcome to Kindworks",
      itemId: null,
      quantity: null,
      occurredAt,
    }],
  };
}

export function projectLegacyInventory(raw) {
  const inventory = createFreshInventoryState();
  if (!raw || typeof raw !== "object") return inventory;
  for (const bucket of INVENTORY_BUCKETS) {
    const source = raw[bucket];
    if (!source || typeof source !== "object" || Array.isArray(source)) continue;
    for (const [id, value] of Object.entries(source)) {
      const quantity = safeInteger(value);
      if (quantity < 1) continue;
      const item = ITEM_CATALOG[id];
      const expectedBucket = inventoryBucketFor(item);
      if (!item || expectedBucket !== bucket) {
        inventory.unresolvedLegacy.push({ id, bucket, quantity });
        continue;
      }
      inventory[bucket][id] = Math.min(quantity, inventoryLimitFor(item));
    }
  }
  inventory.equipment["starter-mower"] = 1;
  inventory.equipment["starter-vacuum"] = 1;
  const equipped = raw.equipped && typeof raw.equipped === "object" ? raw.equipped : {};
  for (const [slot, fallback] of [["mower", "starter-mower"], ["vacuum", "starter-vacuum"]]) {
    const id = String(equipped[slot] || fallback);
    inventory.equipped[slot] = inventory.equipment[id] && ITEM_CATALOG[id]?.slot === slot ? id : fallback;
  }
  const unresolved = Array.isArray(raw.unresolvedLegacy) ? raw.unresolvedLegacy : [];
  for (const entry of unresolved) {
    const id = String(entry?.id || "");
    const bucket = String(entry?.bucket || "");
    const quantity = safeInteger(entry?.quantity);
    if (!id || !bucket || quantity < 1 || inventory.unresolvedLegacy.some((item) => item.id === id && item.bucket === bucket)) continue;
    inventory.unresolvedLegacy.push({ id, bucket, quantity });
  }
  return inventory;
}

export function projectLegacyEconomy(raw, { now = Date.now() } = {}) {
  if (!raw || typeof raw !== "object") return createFreshEconomyState({ now });
  const coins = safeInteger(raw.coins);
  const spent = safeInteger(raw.lifetimeCoinsSpent);
  const importedLedger = (Array.isArray(raw.ledger) ? raw.ledger : []).map((entry, index) => {
    if (!entry || typeof entry !== "object") return null;
    const legacyTime = Number(entry.at);
    const occurredAt = Number.isNaN(new Date(entry.occurredAt).getTime())
      ? new Date(Number.isFinite(legacyTime) ? legacyTime : now).toISOString()
      : new Date(entry.occurredAt).toISOString();
    const reserved = new Set(["id", "amount", "kind", "reason", "itemId", "quantity", "shopId", "balance", "occurredAt", "at"]);
    const metadata = Object.fromEntries(Object.entries(entry).filter(([key]) => !reserved.has(key)));
    return {
      ...metadata,
      id: `coin-${String(index + 1).padStart(6, "0")}`,
      amount: Math.trunc(Number(entry.amount) || 0),
      kind: String(entry.kind || "legacy-transaction"),
      reason: String(entry.reason || entry.kind || "Imported transaction"),
      itemId: typeof entry.itemId === "string" ? entry.itemId : null,
      quantity: Number.isSafeInteger(entry.quantity) ? entry.quantity : null,
      shopId: typeof entry.shopId === "string" ? entry.shopId : null,
      balance: Number.isSafeInteger(entry.balance) && entry.balance >= 0 ? entry.balance : null,
      occurredAt,
    };
  }).filter(Boolean).slice(-COIN_LEDGER_LIMIT).map((entry, index) => ({
    ...entry,
    id: `coin-${String(index + 1).padStart(6, "0")}`,
  }));
  const ledger = importedLedger.length ? importedLedger : [{
    id: "coin-000001",
    amount: 0,
    kind: "legacy-balance",
    reason: `Balance imported from HTML save v${safeInteger(raw.schemaVersion) || "legacy"}`,
    itemId: null,
    quantity: null,
    shopId: null,
    balance: coins,
    occurredAt: new Date(now).toISOString(),
  }];
  return {
    schemaVersion: ECONOMY_SCHEMA_VERSION,
    coins,
    lifetimeCoinsEarned: coins + spent,
    lifetimeCoinsSpent: spent,
    nextTransactionId: ledger.length + 1,
    ledger,
  };
}

export function normalizeEconomyState(raw, { now = Date.now() } = {}) {
  if (!raw || typeof raw !== "object") return createFreshEconomyState({ now });
  const coins = safeInteger(raw.coins);
  const spent = safeInteger(raw.lifetimeCoinsSpent);
  const earned = safeInteger(raw.lifetimeCoinsEarned);
  const projected = projectLegacyEconomy(raw, { now });
  projected.coins = coins;
  projected.lifetimeCoinsSpent = spent;
  projected.lifetimeCoinsEarned = earned - spent === coins ? earned : coins + spent;
  projected.nextTransactionId = Math.max(safeInteger(raw.nextTransactionId, 1), projected.ledger.length + 1);
  return projected;
}

export function normalizeInventoryState(raw) {
  return projectLegacyInventory(raw);
}

export function validateEconomyState(economy) {
  const errors = [];
  if (!economy || typeof economy !== "object") return { ok: false, errors: ["Economy state is missing."] };
  if (economy.schemaVersion !== ECONOMY_SCHEMA_VERSION) errors.push("Economy schema version is unsupported.");
  for (const field of ["coins", "lifetimeCoinsEarned", "lifetimeCoinsSpent"]) {
    if (!Number.isSafeInteger(economy[field]) || economy[field] < 0) errors.push(`${field} must be a non-negative safe integer.`);
  }
  if (economy.lifetimeCoinsEarned - economy.lifetimeCoinsSpent !== economy.coins) errors.push("Coin lifetime totals do not reconcile with the current balance.");
  if (!Number.isSafeInteger(economy.nextTransactionId) || economy.nextTransactionId < 1) errors.push("The next coin transaction id is invalid.");
  if (!Array.isArray(economy.ledger) || economy.ledger.length > COIN_LEDGER_LIMIT) errors.push("The coin ledger is invalid or exceeds its limit.");
  for (const entry of Array.isArray(economy.ledger) ? economy.ledger : []) {
    if (!entry || typeof entry.id !== "string" || !Number.isSafeInteger(entry.amount) || typeof entry.reason !== "string" || Number.isNaN(new Date(entry.occurredAt).getTime())) errors.push("The coin ledger contains an invalid entry.");
    if (entry.balance !== undefined && entry.balance !== null && (!Number.isSafeInteger(entry.balance) || entry.balance < 0)) errors.push("The coin ledger contains an invalid balance snapshot.");
  }
  return { ok: errors.length === 0, errors };
}

export function validateInventoryState(inventory) {
  const errors = [];
  if (!inventory || typeof inventory !== "object") return { ok: false, errors: ["Inventory state is missing."] };
  if (inventory.schemaVersion !== INVENTORY_SCHEMA_VERSION) errors.push("Inventory schema version is unsupported.");
  for (const bucket of INVENTORY_BUCKETS) {
    if (!inventory[bucket] || typeof inventory[bucket] !== "object" || Array.isArray(inventory[bucket])) {
      errors.push(`${bucket} inventory bucket is invalid.`);
      continue;
    }
    for (const [id, quantity] of Object.entries(inventory[bucket])) {
      const item = ITEM_CATALOG[id];
      if (!item || inventoryBucketFor(item) !== bucket) errors.push(`${id} does not belong in ${bucket}.`);
      else if (!Number.isInteger(quantity) || quantity < 1 || quantity > inventoryLimitFor(item)) errors.push(`${id} has an invalid quantity.`);
    }
  }
  for (const id of ["starter-mower", "starter-vacuum"]) if (inventory.equipment?.[id] !== 1) errors.push(`${id} must remain owned.`);
  if (!inventory.equipped || ITEM_CATALOG[inventory.equipped.mower]?.slot !== "mower" || !inventory.equipment?.[inventory.equipped.mower]) errors.push("Equipped mower is invalid.");
  if (!inventory.equipped || ITEM_CATALOG[inventory.equipped.vacuum]?.slot !== "vacuum" || !inventory.equipment?.[inventory.equipped.vacuum]) errors.push("Equipped vacuum is invalid.");
  if (!Array.isArray(inventory.unresolvedLegacy)) errors.push("Unresolved legacy inventory must be an array.");
  return { ok: errors.length === 0, errors };
}
