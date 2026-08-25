export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

export function fnv1a64(text) {
  let hash = 1469598103934665603n;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= BigInt(text.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function checksumValue(value, prefix = "kwp1") {
  return `${prefix}-${fnv1a64(canonicalJson(value))}`;
}

export function legacyIntegritySeal(value) {
  const copy = structuredClone(value || {});
  delete copy.integritySeal;
  return `kw84-1-${fnv1a64(JSON.stringify(copy))}`;
}

export function verifyLegacyIntegrity(value) {
  if (!value || typeof value.integritySeal !== "string") return "missing";
  return value.integritySeal === legacyIntegritySeal(value) ? "valid" : "invalid";
}
