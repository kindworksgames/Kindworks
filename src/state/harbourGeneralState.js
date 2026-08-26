import {
  HARBOUR_GENERAL_CATALOG,
  HARBOUR_GENERAL_CONFIG,
  HARBOUR_GENERAL_ITEM_IDS,
} from "../data/harbourGeneral.js";

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

export function createFreshHarbourGeneralState() {
  return {
    schemaVersion: HARBOUR_GENERAL_CONFIG.schemaVersion,
    owned: false,
    purchasedDay: 0,
    slots: Array(HARBOUR_GENERAL_CONFIG.slotCount).fill(null),
    stock: Object.fromEntries(HARBOUR_GENERAL_ITEM_IDS.map((id) => [id, 0])),
    tillCoins: 0,
    lifetimeGross: 0,
    lifetimeStockSpend: 0,
    lifetimeSales: 0,
    lostSales: 0,
    salesByItem: Object.fromEntries(HARBOUR_GENERAL_ITEM_IDS.map((id) => [id, 0])),
    recentSales: [],
  };
}

export function normalizeHarbourGeneralState(value) {
  const fresh = createFreshHarbourGeneralState();
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const seen = new Set();
  const slots = Array.from({ length: HARBOUR_GENERAL_CONFIG.slotCount }, (_, index) => {
    const id = source.slots?.[index];
    if (!HARBOUR_GENERAL_CATALOG[id] || seen.has(id)) return null;
    seen.add(id);
    return id;
  });
  const stock = {};
  const salesByItem = {};
  for (const id of HARBOUR_GENERAL_ITEM_IDS) {
    stock[id] = whole(source.stock?.[id], 0, HARBOUR_GENERAL_CONFIG.maxPerItem);
    salesByItem[id] = whole(source.salesByItem?.[id]);
  }
  const recentSales = Array.isArray(source.recentSales) ? source.recentSales.slice(0, HARBOUR_GENERAL_CONFIG.historyLimit).map((sale) => ({
    npcId: sale?.npcId ? String(sale.npcId).slice(0, 30) : null,
    npcName: String(sale?.npcName || "Villager").slice(0, 30),
    itemId: HARBOUR_GENERAL_CATALOG[sale?.itemId] ? sale.itemId : "newspaper",
    day: whole(sale?.day, 1),
    price: whole(sale?.price),
    weather: String(sale?.weather || "clear").slice(0, 20),
  })) : [];
  return {
    ...fresh,
    owned: Boolean(source.owned),
    purchasedDay: whole(source.purchasedDay),
    slots,
    stock,
    tillCoins: whole(source.tillCoins),
    lifetimeGross: whole(source.lifetimeGross),
    lifetimeStockSpend: whole(source.lifetimeStockSpend),
    lifetimeSales: whole(source.lifetimeSales),
    lostSales: whole(source.lostSales),
    salesByItem,
    recentSales,
  };
}

export function projectLegacyHarbourGeneral(legacy) {
  return normalizeHarbourGeneralState(legacy?.harbourGeneral);
}

export function validateHarbourGeneralState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Harbour General state must be an object."] };
  if (value.schemaVersion !== HARBOUR_GENERAL_CONFIG.schemaVersion) errors.push("Harbour General schema version is invalid.");
  if (typeof value.owned !== "boolean" || !Number.isInteger(value.purchasedDay) || value.purchasedDay < 0) errors.push("Harbour General ownership is invalid.");
  if (!Array.isArray(value.slots) || value.slots.length !== HARBOUR_GENERAL_CONFIG.slotCount) errors.push("Harbour General must contain six display slots.");
  else {
    const assigned = value.slots.filter(Boolean);
    if (assigned.some((id) => !HARBOUR_GENERAL_CATALOG[id])) errors.push("A Harbour General display references unknown stock.");
    if (new Set(assigned).size !== assigned.length) errors.push("A Harbour General product is assigned to more than one display.");
  }
  for (const bucket of ["stock", "salesByItem"]) {
    if (!value[bucket] || HARBOUR_GENERAL_ITEM_IDS.some((id) => !Number.isInteger(value[bucket][id]) || value[bucket][id] < 0 || (bucket === "stock" && value[bucket][id] > HARBOUR_GENERAL_CONFIG.maxPerItem))) errors.push(`Harbour General ${bucket} is invalid.`);
  }
  for (const field of ["tillCoins", "lifetimeGross", "lifetimeStockSpend", "lifetimeSales", "lostSales"]) if (!Number.isInteger(value[field]) || value[field] < 0) errors.push(`Harbour General ${field} is invalid.`);
  if (!Array.isArray(value.recentSales) || value.recentSales.length > HARBOUR_GENERAL_CONFIG.historyLimit || value.recentSales.some((sale) => !HARBOUR_GENERAL_CATALOG[sale?.itemId] || !Number.isInteger(sale?.day) || sale.day < 1 || !Number.isInteger(sale?.price) || sale.price < 0)) errors.push("Harbour General recent sales are invalid.");
  return { ok: errors.length === 0, errors };
}
