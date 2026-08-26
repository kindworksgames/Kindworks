export const HOMEOWNER_GIFT_CONFIG = Object.freeze({
  format: 2,
  householdCooldownDays: 7,
  fullCareWindowDays: 7,
  pityAfterMisses: 15,
  processedLimit: 320,
  historyLimit: 80,
  queueLimit: 80,
  minimumLawnPercent: 80,
  odds: Object.freeze({
    normal: Object.freeze({ small: 0.05, thoughtful: 0.02, rare: 0.009, exceptional: 0.001 }),
    fullCare: Object.freeze({ small: 0.065, thoughtful: 0.025, rare: 0.009, exceptional: 0.001 }),
  }),
  priceTiers: Object.freeze({
    small: Object.freeze([1, 1800]),
    thoughtful: Object.freeze([1801, 5000]),
    rare: Object.freeze([5001, 15000]),
    exceptional: Object.freeze([15001, Number.MAX_SAFE_INTEGER]),
  }),
  excludedItemIds: Object.freeze(["record-player"]),
});

export const HOMEOWNER_GIFT_TIERS = Object.freeze(["small", "thoughtful", "rare", "exceptional"]);

export const HOMEOWNER_GIFT_TIER_LABELS = Object.freeze({
  small: "Small gift",
  thoughtful: "Thoughtful gift",
  rare: "Rare gift",
  exceptional: "Exceptional gift",
});

export const HOMEOWNER_GIFT_DIALOGUE = Object.freeze({
  lawn: Object.freeze([
    "Thank you for taking such lovely care of my lawn. Coming home to a tidy garden made my day. I saved something for you.",
    "My garden looks wonderful again. Thank you for giving it so much care — please accept this little gift from me.",
    "Thank you — you made the outside of my home feel welcoming again. That kindness means a lot to me, and I would love you to have this.",
  ]),
  "house-rescue": Object.freeze([
    "Thank you for making my home feel comfortable again. You were so kind to help, and I would love you to have this.",
    "My home feels warm and welcoming again because of you. Please accept this as my way of saying thank you.",
    "Thank you — you worked so hard to make my home sparkle. Your kindness has meant a lot to me, so I saved something for you.",
  ]),
  fullCare: Object.freeze([
    "Thank you — you have taken such wonderful care of my home, inside and out. Kindness like yours makes our town special. I saved something especially for you.",
    "Thank you for caring for both my home and garden. Every time I look around, I am reminded how kind you have been. Please take this.",
    "My whole home feels loved again. I cannot thank you enough, but I hope this gift shows how much your help meant to me.",
  ]),
  exceptional: Object.freeze([
    "Thank you. Your kindness has meant more to me than I can say. This is something very special, and I cannot think of anyone who deserves it more.",
    "Thank you for doing something truly wonderful for my home. I kept this special gift for someone exceptionally kind — and that is you.",
  ]),
});

export function hashUnit(key) {
  let hash = 2166136261;
  for (const character of String(key)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

export function seededHomeownerGiftUnit(key, salt) {
  return hashUnit(`${key}:${salt}`);
}

export function homeownerGiftTierForItem(item) {
  const price = Math.max(0, Number(item?.price) || 0);
  for (const tier of HOMEOWNER_GIFT_TIERS) {
    const [minimum, maximum] = HOMEOWNER_GIFT_CONFIG.priceTiers[tier];
    if (price >= minimum && price <= maximum) return tier;
  }
  return null;
}

export function homeownerGiftTierFromRoll(roll, fullCare = false, pity = false) {
  const value = Math.max(0, Math.min(0.999999999, Number(roll) || 0));
  const odds = fullCare ? HOMEOWNER_GIFT_CONFIG.odds.fullCare : HOMEOWNER_GIFT_CONFIG.odds.normal;
  const exceptionalEnd = odds.exceptional;
  const rareEnd = exceptionalEnd + odds.rare;
  const thoughtfulEnd = rareEnd + odds.thoughtful;
  const giftEnd = thoughtfulEnd + odds.small;
  if (value < exceptionalEnd) return "exceptional";
  if (value < rareEnd) return "rare";
  if (value < thoughtfulEnd) return "thoughtful";
  if (value < giftEnd) return "small";
  if (!pity) return null;
  const missUnit = (value - giftEnd) / Math.max(Number.EPSILON, 1 - giftEnd);
  return missUnit < 0.25 ? "thoughtful" : "small";
}

export function homeownerGiftDialogue(source, fullCare, rolledTier, eventId) {
  const list = rolledTier === "exceptional"
    ? HOMEOWNER_GIFT_DIALOGUE.exceptional
    : fullCare
      ? HOMEOWNER_GIFT_DIALOGUE.fullCare
      : HOMEOWNER_GIFT_DIALOGUE[source] || HOMEOWNER_GIFT_DIALOGUE["house-rescue"];
  const index = Math.min(list.length - 1, Math.floor(seededHomeownerGiftUnit(`${eventId}:dialogue`, list.length) * list.length));
  return list[index];
}
