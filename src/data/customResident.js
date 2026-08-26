export const CUSTOM_RESIDENT_ID = "npc-kindly-member";
export const PERSONAL_HOME_NODE_ID = "home20";
export const PERSONAL_HOME_HOUSE_ID = "house-20";
// Milestone 31 resolves the earlier temporary house-19 render alias. The town still
// contains 19 physical cottages, but the final South Shore record now carries the
// original house-20/home20 identity while house-19 remains reserved and unauthored.
export const PERSONAL_HOME_RENDER_HOUSE_ID = PERSONAL_HOME_HOUSE_ID;
export const PERSONAL_HOME_NAME = "Meadowlight House";

export const PERSONAL_HOME_LEVELS = Object.freeze([
  Object.freeze({ level: 1, name: "Small Starter Cottage", scale: 0.68, cost: 0, capacity: 1 }),
  Object.freeze({ level: 2, name: "Family Cottage", scale: 0.86, cost: 15_000, capacity: 2 }),
  Object.freeze({ level: 3, name: "Spacious Home", scale: 1.04, cost: 40_000, capacity: 3 }),
  Object.freeze({ level: 4, name: "Grand Home", scale: 1.22, cost: 90_000, capacity: 5 }),
]);

export const PERSONAL_HOME_REDESIGN_BASE_COSTS = Object.freeze({
  wallColor: 600,
  roofColor: 900,
  roofStyle: 2_200,
});

export const PERSONAL_HOME_REDESIGN_LEVEL_MULTIPLIERS = Object.freeze([1, 1.35, 1.75, 2.25]);
export const PERSONAL_HOME_REDESIGN_LABELS = Object.freeze({
  wallColor: "Wall paint",
  roofColor: "Roof paint",
  roofStyle: "Roof renovation",
});

export const CUSTOM_RESIDENT_APPEARANCE = Object.freeze({
  skin: Object.freeze({
    light: Object.freeze({ label: "Light", color: 0xf2c9a8 }),
    warm: Object.freeze({ label: "Warm", color: 0xe6b88b }),
    tan: Object.freeze({ label: "Tan", color: 0xc98e67 }),
    brown: Object.freeze({ label: "Brown", color: 0xa96f4f }),
    deep: Object.freeze({ label: "Deep", color: 0x70442f }),
  }),
  hairStyle: Object.freeze([
    Object.freeze({ id: 0, label: "Classic" }),
    Object.freeze({ id: 1, label: "Side bun" }),
    Object.freeze({ id: 2, label: "Swept" }),
    Object.freeze({ id: 3, label: "Curly" }),
  ]),
  hairColor: Object.freeze({
    black: Object.freeze({ label: "Black", color: 0x24201f }),
    "dark-brown": Object.freeze({ label: "Dark brown", color: 0x3f2c24 }),
    brown: Object.freeze({ label: "Brown", color: 0x6b452b }),
    auburn: Object.freeze({ label: "Auburn", color: 0x8b4933 }),
    blonde: Object.freeze({ label: "Blonde", color: 0xb99558 }),
    grey: Object.freeze({ label: "Grey", color: 0x77736f }),
  }),
  accessory: Object.freeze({
    none: "None",
    glasses: "Glasses",
    cap: "Cap",
    sunhat: "Sun hat",
    satchel: "Satchel",
    badge: "Helper badge",
  }),
  outfit: Object.freeze([
    Object.freeze({ id: 0, label: "Kindly red", shirt: 0xd65f56, pants: 0x4d6c86 }),
    Object.freeze({ id: 1, label: "Garden green", shirt: 0x638f5f, pants: 0x5a5978 }),
    Object.freeze({ id: 2, label: "Warm amber", shirt: 0xd28a4f, pants: 0x475f6c }),
    Object.freeze({ id: 3, label: "River blue", shirt: 0x6a82b5, pants: 0x5c544d }),
    Object.freeze({ id: 4, label: "Soft plum", shirt: 0xa96c9c, pants: 0x546e61 }),
    Object.freeze({ id: 5, label: "Teal", shirt: 0x4f9297, pants: 0x625578 }),
  ]),
  bodyBuild: Object.freeze({ slim: 0.86, average: 1, broad: 1.1, stocky: 1.18, larger: 1.27 }),
});

export const CUSTOM_RESIDENT_HOBBIES = Object.freeze({
  fishing: Object.freeze({ label: "Fishing", icon: "🎣" }),
  gardening: Object.freeze({ label: "Gardening", icon: "🌱" }),
  pub: Object.freeze({ label: "Pub regular", icon: "🍺" }),
  coffee: Object.freeze({ label: "Coffee", icon: "☕" }),
  reading: Object.freeze({ label: "Reading", icon: "📚" }),
  shopping: Object.freeze({ label: "Shopping", icon: "🛍️" }),
  nature: Object.freeze({ label: "Nature", icon: "🐦" }),
  walking: Object.freeze({ label: "Walking", icon: "🚶" }),
  bakery: Object.freeze({ label: "Bakery lover", icon: "🥐" }),
  music: Object.freeze({ label: "Animal lover", icon: "🐾" }),
  helping: Object.freeze({ label: "Community helper", icon: "🧹" }),
  riverside: Object.freeze({ label: "Riverside walks", icon: "🌊" }),
});

export const PERSONAL_HOME_OPTIONS = Object.freeze({
  wallColor: Object.freeze({ cream: "Warm cream", sage: "Garden sage", sky: "Soft sky", rose: "Dusty rose", yellow: "Sunny yellow", lavender: "Lavender" }),
  wallPalette: Object.freeze({ cream: 0xf3dfb7, sage: 0xc5d7b8, sky: 0xbed8e4, rose: 0xdfb9b6, yellow: 0xeadb91, lavender: 0xd4c1dd }),
  roofStyle: Object.freeze({ gable: "Classic gable", hip: "Hipped roof", gambrel: "Cottage gambrel" }),
  roofColor: Object.freeze({ terracotta: "Terracotta", slate: "Slate grey", forest: "Forest green", navy: "Deep navy", plum: "Soft plum", gold: "Harvest gold" }),
  roofPalette: Object.freeze({ terracotta: 0xb65f48, slate: 0x667481, forest: 0x52735b, navy: 0x4b627d, plum: 0x856987, gold: 0xb58a45 }),
});

export function personalHomeLevel(value) {
  const level = Math.max(1, Math.min(PERSONAL_HOME_LEVELS.length, Math.floor(Number(value) || 1)));
  return PERSONAL_HOME_LEVELS[level - 1];
}

export function personalHomeCapacity(value) {
  return personalHomeLevel(value).capacity;
}

export function personalHomeRedesignQuote(fromHome, toHome, balance = 0) {
  const level = personalHomeLevel(fromHome?.level).level;
  const multiplier = PERSONAL_HOME_REDESIGN_LEVEL_MULTIPLIERS[level - 1] || 1;
  const changes = [];
  for (const key of ["wallColor", "roofColor", "roofStyle"]) {
    if (fromHome?.[key] === toHome?.[key]) continue;
    const baseCost = PERSONAL_HOME_REDESIGN_BASE_COSTS[key];
    const cost = Math.round((baseCost * multiplier) / 50) * 50;
    changes.push(Object.freeze({
      key,
      label: PERSONAL_HOME_REDESIGN_LABELS[key],
      from: fromHome?.[key],
      to: toHome?.[key],
      baseCost,
      cost,
    }));
  }
  const cost = changes.reduce((sum, change) => sum + change.cost, 0);
  const available = Math.max(0, Math.floor(Number(balance) || 0));
  return Object.freeze({
    level,
    multiplier,
    cost,
    changes: Object.freeze(changes),
    balance: available,
    affordable: available >= cost,
    shortfall: Math.max(0, cost - available),
  });
}

export function customResidentPalette(profile) {
  const outfit = CUSTOM_RESIDENT_APPEARANCE.outfit[profile?.outfit] || CUSTOM_RESIDENT_APPEARANCE.outfit[0];
  return {
    shirt: outfit.shirt,
    pants: outfit.pants,
    hair: CUSTOM_RESIDENT_APPEARANCE.hairColor[profile?.hairColor]?.color || CUSTOM_RESIDENT_APPEARANCE.hairColor["dark-brown"].color,
    skin: CUSTOM_RESIDENT_APPEARANCE.skin[profile?.skin]?.color || CUSTOM_RESIDENT_APPEARANCE.skin.warm.color,
  };
}
