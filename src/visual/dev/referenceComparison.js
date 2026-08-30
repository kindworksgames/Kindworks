export const REFERENCE_COMPARISON_SCHEMA_VERSION = 1;

export const REFERENCE_CONTRACTS = Object.freeze({
  "reference.fishing.reedbank": Object.freeze({
    schemaVersion: REFERENCE_COMPARISON_SCHEMA_VERSION,
    id: "reference.fishing.reedbank",
    scene: "FishingScene",
    state: "fishing-reedbank",
    canonicalSize: Object.freeze({ width: 1280, height: 720 }),
    sourceAspectRatio: 16 / 9,
    acceptedMimeTypes: Object.freeze(["image/png", "image/jpeg", "image/webp"]),
    filenamePattern: /(?:fishing|reedbank)/i,
    fit: "contain",
    alignment: "center",
  }),
});

export function validateReferenceDescriptor(contract, descriptor) {
  const errors = [];
  if (!contract) errors.push("Reference contract is missing.");
  if (!descriptor?.name) errors.push("Reference filename is required.");
  if (contract && !contract.acceptedMimeTypes.includes(descriptor?.type)) errors.push(`${descriptor?.type || "unknown format"} is not accepted by ${contract.id}.`);
  if (contract && !contract.filenamePattern.test(descriptor?.name || "")) errors.push(`${descriptor?.name || "unnamed file"} is not associated with ${contract.scene}/${contract.state}.`);
  const width = Number(descriptor?.width);
  const height = Number(descriptor?.height);
  if (!(width > 0 && height > 0)) errors.push("Reference dimensions are required.");
  else if (contract && Math.abs(width / height - contract.sourceAspectRatio) > 0.001) errors.push(`${descriptor.name} is ${width}x${height}; ${contract.id} requires a 16:9 reference.`);
  return { ok: errors.length === 0, errors };
}

export function computeRgbaDifference(left, right, { channelDeltaThreshold = 8 } = {}) {
  if (!(left instanceof Uint8ClampedArray) || !(right instanceof Uint8ClampedArray) || left.length !== right.length || left.length % 4 !== 0) {
    throw new TypeError("Difference inputs must be equally sized RGBA pixel arrays.");
  }
  const output = new Uint8ClampedArray(left.length);
  let changedPixels = 0;
  let absoluteTotal = 0;
  let maximumChannelDelta = 0;
  const pixels = left.length / 4;
  for (let offset = 0; offset < left.length; offset += 4) {
    const red = Math.abs(left[offset] - right[offset]);
    const green = Math.abs(left[offset + 1] - right[offset + 1]);
    const blue = Math.abs(left[offset + 2] - right[offset + 2]);
    const alpha = Math.abs(left[offset + 3] - right[offset + 3]);
    const maximum = Math.max(red, green, blue, alpha);
    if (maximum > channelDeltaThreshold) changedPixels += 1;
    absoluteTotal += red + green + blue + alpha;
    maximumChannelDelta = Math.max(maximumChannelDelta, maximum);
    const intensity = Math.min(255, maximum * 4);
    output[offset] = intensity;
    output[offset + 1] = maximum <= channelDeltaThreshold ? intensity : 0;
    output[offset + 2] = maximum <= channelDeltaThreshold ? intensity : 255 - Math.floor(intensity / 2);
    output[offset + 3] = 255;
  }
  return {
    pixels: output,
    metrics: {
      pixelCount: pixels,
      changedPixels,
      changedPixelRatio: changedPixels / pixels,
      meanAbsoluteError: absoluteTotal / left.length,
      maximumChannelDelta,
      channelDeltaThreshold,
    },
  };
}
