export const COIN_PACKS = Object.freeze([
  Object.freeze({ id: "coins-1000", coins: 1_000, displayPrice: "£0.99", priceGBP: 0.99, type: "consumable" }),
  Object.freeze({ id: "coins-3000", coins: 3_000, displayPrice: "£2.49", priceGBP: 2.49, type: "consumable" }),
  Object.freeze({ id: "coins-6000", coins: 6_000, displayPrice: "£4.79", priceGBP: 4.79, type: "consumable" }),
  Object.freeze({ id: "coins-13000", coins: 13_000, displayPrice: "£9.99", priceGBP: 9.99, type: "consumable" }),
  Object.freeze({ id: "coins-27500", coins: 27_500, displayPrice: "£19.99", priceGBP: 19.99, type: "consumable" }),
  Object.freeze({ id: "coins-80000", coins: 80_000, displayPrice: "£49.99", priceGBP: 49.99, type: "consumable" }),
]);

export const KINDLY_CLUB_TIERS = Object.freeze([
  Object.freeze({
    id: "kindlyclub", name: "KindlyClub", icon: "❤️", displayPrice: "£4.99 / month", priceGBP: 4.99,
    monthlyCoins: 2_000, monthlyGiftItem: null, tag: "Supporter",
    description: "Support KindWorks and help fund real-world restoration projects.",
    benefits: Object.freeze(["2,000 KindlyCoins each verified month", "KindlyClub supporter status", "Supports the KindWorks mission"]),
  }),
  Object.freeze({
    id: "kindlyclub-creator", name: "KindlyClub Creator", icon: "🌟", displayPrice: "£9.99 / month", priceGBP: 9.99,
    monthlyCoins: 5_000, monthlyGiftItem: "record-player", tag: "Creative supporter",
    description: "Support the mission as a KindWorks creative supporter.",
    benefits: Object.freeze(["5,000 KindlyCoins each verified month", "One Record Player each verified month", "Creator supporter status"]),
  }),
  Object.freeze({
    id: "kindlyclub-champion", name: "KindlyClub Champion", icon: "💚", displayPrice: "£19.99 / month", priceGBP: 19.99,
    monthlyCoins: 10_000, monthlyGiftItem: "kindly-heart-planter", tag: "Top supporter",
    description: "Support KindWorks at the highest membership tier.",
    benefits: Object.freeze(["10,000 KindlyCoins each verified month", "One Kindly Heart Planter each verified month", "Champion supporter status"]),
  }),
]);

export const COIN_PACK_BY_ID = Object.freeze(Object.fromEntries(COIN_PACKS.map((pack) => [pack.id, pack])));
export const KINDLY_CLUB_TIER_BY_ID = Object.freeze(Object.fromEntries(KINDLY_CLUB_TIERS.map((tier) => [tier.id, tier])));

export const COMMERCE_POLICY = Object.freeze({
  realMoneyRequiresServerWallet: true,
  serverVerifiedReceiptsOnly: true,
  purchaseConfirmationEveryCheckout: true,
  collectsDateOfBirth: false,
  personalizedAdvertising: false,
  processedTransactionLimit: 5_000,
  processedPeriodLimit: 240,
});
