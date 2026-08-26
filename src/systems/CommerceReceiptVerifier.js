const TRUSTED_COMMERCE_PUBLIC_KEY_JWK = Object.freeze({
  kty: "EC",
  x: "M510ryF29HK06CqZNTL-wOEA2G1k2fnaz5yPR0xal2E",
  y: "vfsSaNcs0ciYPHhzq_bVCvdb04IMqONf-48oC6jhwIw",
  crv: "P-256",
});

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function base64UrlBytes(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  if (typeof atob === "function") return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return Uint8Array.from(Buffer.from(padded, "base64"));
}

let trustedKeyPromise = null;

async function trustedKey() {
  if (!globalThis.crypto?.subtle) return null;
  if (!trustedKeyPromise) trustedKeyPromise = globalThis.crypto.subtle.importKey("jwk", TRUSTED_COMMERCE_PUBLIC_KEY_JWK, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]).catch(() => null);
  return trustedKeyPromise;
}

export async function verifyCommerceEnvelope(envelope, { kind, productId } = {}) {
  const payload = envelope?.payload;
  const signature = String(envelope?.signature || "");
  if (!payload || typeof payload !== "object" || !signature) return { ok: false, code: "signed-receipt-required", message: "A signed server receipt is required." };
  if (payload.kind !== kind) return { ok: false, code: "receipt-kind-mismatch", message: "The receipt type does not match this purchase." };
  if (productId && String(payload.productId || payload.packId || payload.tierId || "") !== String(productId)) return { ok: false, code: "receipt-product-mismatch", message: "The receipt does not match the selected product." };
  const key = await trustedKey();
  if (!key) return { ok: false, code: "receipt-verification-unavailable", message: "Secure receipt verification is unavailable on this device." };
  let valid = false;
  try {
    valid = await globalThis.crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, base64UrlBytes(signature), new TextEncoder().encode(canonicalJson(payload)));
  } catch {
    valid = false;
  }
  return valid ? { ok: true, payload: structuredClone(payload) } : { ok: false, code: "invalid-receipt-signature", message: "The store/server signature could not be verified." };
}

export { canonicalJson };
