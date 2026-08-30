const ASSET_IDS = Object.freeze({
  lawn: "environment.lawn.slice.state-sheet",
  weeds: "prop.lawn.slice.weeds",
  mower: "tool.lawn.slice.mower",
});

function approvedUrl(registry, id) {
  const asset = registry?.getAsset?.(id);
  if (!asset || asset.status !== "approved" || asset.source?.kind !== "file") return null;
  return registry.assetUrl(id);
}

/**
 * Connects approved semantic Lawn Care artwork to the existing accessible DOM
 * board. This is presentation-only: the service-owned grid, swipe input and
 * reward state remain the sole gameplay source of truth.
 */
export function applyApprovedLawnDomVisuals(scene) {
  const hud = scene?.hud;
  const registry = scene?.registry?.get?.("visualRegistry");
  if (!hud || !registry) return () => {};

  const urls = Object.fromEntries(Object.entries(ASSET_IDS).map(([name, id]) => [name, approvedUrl(registry, id)]));
  const approved = Object.values(urls).some(Boolean);
  if (!approved) return () => {};

  hud.dataset.approvedSemanticArt = "true";
  for (const [name, url] of Object.entries(urls)) {
    if (url) hud.style.setProperty(`--kw-approved-${name}`, `url("${url}")`);
  }

  return () => {
    delete hud.dataset.approvedSemanticArt;
    for (const name of Object.keys(urls)) hud.style.removeProperty(`--kw-approved-${name}`);
  };
}
