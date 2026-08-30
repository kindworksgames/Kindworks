const words = (value) => String(value || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const unique = (items) => [...new Set(items.filter(Boolean))];
const frozen = (items) => Object.freeze(items);
const categoryName = (contractId, fallback = "uncategorized") => contractId?.replace(/^category\./, "") || fallback;

function multiIndex(entries, selectKeys) {
  const index = new Map();
  for (const entry of entries || []) for (const key of selectKeys(entry)) index.set(key, [...(index.get(key) || []), entry]);
  return index;
}

function validationFor(asset, productionIndex, candidate = null) {
  const placeholder = asset.status === "phase-8a-specified-placeholder" || asset.source?.owner === "Phase8AVerticalSlicePlaceholder";
  const findings = [
    ...(productionIndex?.validation?.findings || []).filter(({ assetId }) => assetId === asset.id),
    ...(candidate?.validationFindings || []),
  ];
  if (placeholder && !candidate) findings.push({
    severity: "warning", code: "placeholder-runtime-art-missing",
    message: `${asset.id} is contract-only and is displaying the development fallback until approved runtime artwork is integrated.`,
    assetId: asset.id, expected: asset.source?.expectedRuntimeFile || "approved runtime artwork", actual: "development fallback", affectedScenes: [],
  });
  const errors = findings.filter(({ severity }) => severity === "error");
  if (candidate) return {
    findings: frozen(findings),
    validationStatus: candidate.validationStatus,
    approvalStatus: candidate.approvalStatus,
  };
  return {
    findings: frozen(findings),
    validationStatus: errors.length ? "invalid" : placeholder ? "placeholder" : findings.length ? "warning" : "valid",
    approvalStatus: placeholder ? "not-generated" : asset.status === "artwork-pipeline-verified" ? "approved" : asset.status === "prefab-migrated" ? "integrated" : "registered",
  };
}

/** Builds the Lab inventory from runtime-manifest and generated production-plan data. */
export function createAssetLabCatalog(manifest, { productionIndex = null, candidateIndex = null } = {}) {
  const prefabs = manifest?.prefabs || [], states = manifest?.visualStates || [], animations = manifest?.animations || [];
  const packs = manifest?.scenePacks || [], instances = manifest?.sceneInstances || [];
  const prefabsByAsset = multiIndex(prefabs, (prefab) => (prefab.layers || []).map(({ assetId }) => assetId));
  const statesByPrefab = multiIndex(states.flatMap((stateMap) => Object.entries(stateMap.states || {}).map(([name, state]) => ({ stateMap, name, state }))), ({ state }) => [state.prefabId]);
  const animationsByAsset = multiIndex(animations, ({ assetId }) => [assetId]);
  const packsByAsset = multiIndex(packs, (pack) => pack.assetIds || []);
  const instancesByPrefab = multiIndex(instances, ({ prefabId }) => [prefabId]);
  const legacyByAsset = multiIndex(manifest?.legacyCompatibility?.textureKeys || [], ({ semanticId }) => [semanticId]);
  const contractById = new Map((productionIndex?.categoryContracts || []).map((contract) => [contract.id, contract]));

  const runtimeEntries = (manifest?.assets || []).map((registeredAsset) => {
    const candidate = candidateIndex?.assets?.[registeredAsset.id] || null;
    const candidateUsable = candidate?.validationStatus === "valid";
    const asset = candidateUsable ? Object.freeze({
      ...registeredAsset,
      kind: candidate.kind,
      status: "phase-8b-candidate-review",
      source: Object.freeze({ kind: "file", file: candidate.sourceUrl, format: candidate.technical.format, owner: "Phase8BCandidateWorkflow" }),
      technical: Object.freeze({ ...registeredAsset.technical, ...candidate.technical }),
      runtime: Object.freeze({ ...(registeredAsset.runtime || {}), textureKey: `kw.asset-lab.candidate.${registeredAsset.id}.${candidate.candidateSha256.slice(0, 12)}` }),
    }) : registeredAsset;
    const relatedPrefabs = prefabsByAsset.get(asset.id) || [], prefabIds = relatedPrefabs.map(({ id }) => id);
    const relatedStates = relatedPrefabs.flatMap((prefab) => (statesByPrefab.get(prefab.id) || []).map(({ stateMap, name, state }) => Object.freeze({ mapId: stateMap.id, name, prefabId: state.prefabId, modifier: state.modifier || null })));
    const relatedAnimations = animationsByAsset.get(asset.id) || [], relatedPacks = packsByAsset.get(asset.id) || [];
    const relatedInstances = relatedPrefabs.flatMap((prefab) => instancesByPrefab.get(prefab.id) || []);
    const assetContract = productionIndex?.assetContracts?.[asset.id] || null;
    const families = unique([assetContract?.familyId, ...relatedPrefabs.map(({ family }) => family)]);
    const variants = unique(relatedPrefabs.map(({ variant }) => variant));
    const stateNames = unique([...relatedStates.map(({ name }) => name), ...(assetContract?.output?.spriteSheet?.frameOrder || [])]);
    const directions = unique([...(asset.technical?.directions || []), ...(assetContract?.output?.spriteSheet?.directions || []), ...relatedAnimations.map(({ id }) => id.split(".").at(-1))]);
    const layers = relatedPrefabs.flatMap((prefab) => (prefab.layers || []).map((layer) => Object.freeze({ prefabId: prefab.id, id: layer.id, role: layer.role || "main", assetId: layer.assetId })));
    const sceneIds = unique([...relatedPacks.map(({ sceneId }) => sceneId), ...relatedInstances.map(({ sceneId }) => sceneId), ...(assetContract?.intendedScenes || [])]).sort();
    const filename = asset.source?.file || asset.source?.expectedRuntimeFile || "";
    const categoryContractId = assetContract?.categoryContractId || null;
    const category = categoryName(categoryContractId, asset.id.split(".")[0] || "uncategorized");
    const validation = validationFor(asset, productionIndex, candidate);
    const frameNames = asset.kind === "atlas" ? [...(asset.technical?.frameNames || [])] : [];
    const usages = {
      scenePacks: relatedPacks.map(({ id, sceneId }) => ({ id, sceneId })), prefabs: relatedPrefabs.map(({ id }) => id),
      instances: relatedInstances.map(({ id, sceneId, layoutId }) => ({ id, sceneId, layoutId: layoutId || null })),
      animations: relatedAnimations.map(({ id }) => id), legacyKeys: (legacyByAsset.get(asset.id) || []).map(({ legacyKey }) => legacyKey),
    };
    const tags = unique([...words(asset.id), ...words(filename), ...words(asset.status), ...words(asset.kind), ...words(categoryContractId),
      ...sceneIds.flatMap(words), ...families.flatMap(words), ...variants.flatMap(words), ...stateNames.flatMap(words), ...directions.flatMap(words),
      ...relatedAnimations.flatMap(({ id }) => words(id)), ...frameNames.flatMap(words), ...validation.findings.flatMap(({ code }) => words(code)), validation.validationStatus, validation.approvalStatus]);
    return Object.freeze({
      recordType: "runtime-asset", id: asset.id, asset, filename, category, categoryContractId, categoryContract: contractById.get(categoryContractId) || null,
      status: asset.status || "unspecified", kind: asset.kind, sceneIds: frozen(sceneIds), families: frozen(families.length ? families : [asset.id.split(".").slice(0, 2).join(".")]),
      variants: frozen(variants), states: frozen(relatedStates), stateNames: frozen(stateNames), directions: frozen(directions), animations: frozen(relatedAnimations),
      animationNames: frozen(relatedAnimations.map(({ id }) => id),), prefabs: frozen(relatedPrefabs), layers: frozen(layers), frameNames: frozen(frameNames), tags: frozen(tags),
      comparison: candidateUsable && (candidate.reference?.sourceUrl || registeredAsset.source?.kind === "file")
        ? Object.freeze({ previousSource: candidate.reference?.sourceUrl || registeredAsset.source.file, label: candidate.reference ? "assigned reference" : "approved/current" })
        : asset.comparison || null,
      validationStatus: validation.validationStatus, approvalStatus: validation.approvalStatus, validationFindings: validation.findings,
      assetContract, usages: Object.freeze(usages), expectedRuntimeFile: asset.source?.expectedRuntimeFile || assetContract?.expectedFilenames?.runtime || null,
      candidate: candidate ? Object.freeze(candidate) : null,
      registeredAsset,
    });
  });

  const occupiedIds = new Set(runtimeEntries.map(({ id }) => id));
  const familyEntries = (productionIndex?.familyRecords || []).filter(({ id }) => !occupiedIds.has(id)).map((family) => {
    const category = categoryName(family.categoryContractId);
    const tags = unique([...words(family.id), ...words(family.categoryContractId), ...words(family.status), ...words(family.approvalStatus), ...(family.scenes || []).flatMap(words), ...(family.strategies || []).flatMap(words)]);
    return Object.freeze({
      recordType: "production-family", id: family.id, asset: null, filename: "", category, categoryContractId: family.categoryContractId,
      categoryContract: contractById.get(family.categoryContractId) || null, status: family.status, kind: "contract-only", sceneIds: frozen(family.scenes || []),
      families: frozen([family.id]), variants: frozen([]), states: frozen([]), stateNames: frozen([]), directions: frozen([]), animations: frozen([]), animationNames: frozen([]),
      prefabs: frozen([]), layers: frozen([]), frameNames: frozen([]), tags: frozen(tags), comparison: null, validationStatus: family.validationStatus,
      approvalStatus: family.approvalStatus, validationFindings: frozen([]), assetContract: null,
      usages: Object.freeze({ scenePacks: [], prefabs: [], instances: [], animations: [], legacyKeys: [] }), expectedRuntimeFile: null, productionFamily: Object.freeze(family),
    });
  });
  const representedCategories = new Set([...runtimeEntries, ...familyEntries].map(({ category }) => category));
  const categoryEntries = (productionIndex?.categoryContracts || []).filter((contract) => !representedCategories.has(categoryName(contract.id))).map((contract) => Object.freeze({
    recordType: "category-contract", id: contract.id, asset: null, filename: "", category: categoryName(contract.id), categoryContractId: contract.id,
    categoryContract: contract, status: "contract-only", kind: "contract-only", sceneIds: frozen([]), families: frozen([]), variants: frozen([]), states: frozen([]),
    stateNames: frozen([]), directions: frozen([]), animations: frozen([]), animationNames: frozen([]), prefabs: frozen([]), layers: frozen([]), frameNames: frozen([]),
    tags: frozen(unique([...words(contract.id), ...words(contract.description), ...(contract.allowedOutputTypes || []).flatMap(words)])), comparison: null,
    validationStatus: "contract-only", approvalStatus: "not-ready", validationFindings: frozen([]), assetContract: null,
    usages: Object.freeze({ scenePacks: [], prefabs: [], instances: [], animations: [], legacyKeys: [] }), expectedRuntimeFile: null, productionFamily: null,
  }));
  return Object.freeze([...runtimeEntries, ...familyEntries, ...categoryEntries]);
}

export function filterAssetLabCatalog(catalog, filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  const matches = (wanted, actual) => !wanted || wanted === "all" || actual.includes(wanted);
  return catalog.filter((entry) => {
    const haystack = [entry.id, entry.filename, ...entry.tags].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && matches(filters.category, [entry.category]) && matches(filters.scene, entry.sceneIds)
      && matches(filters.tag, entry.tags) && matches(filters.status, [entry.status]) && matches(filters.family, entry.families)
      && matches(filters.state, entry.stateNames) && matches(filters.direction, entry.directions) && matches(filters.animation, entry.animationNames)
      && matches(filters.approval, [entry.approvalStatus]) && matches(filters.validation, [entry.validationStatus]);
  });
}

export function assetLabFacets(catalog) {
  const collect = (selector) => [...new Set(catalog.flatMap(selector).filter(Boolean))].sort();
  return Object.freeze({
    categories: Object.freeze(collect((entry) => [entry.category])), scenes: Object.freeze(collect((entry) => entry.sceneIds)), tags: Object.freeze(collect((entry) => entry.tags)),
    statuses: Object.freeze(collect((entry) => [entry.status])), families: Object.freeze(collect((entry) => entry.families)), states: Object.freeze(collect((entry) => entry.stateNames)),
    directions: Object.freeze(collect((entry) => entry.directions)), animations: Object.freeze(collect((entry) => entry.animationNames)), approvals: Object.freeze(collect((entry) => [entry.approvalStatus])),
    validations: Object.freeze(collect((entry) => [entry.validationStatus])),
  });
}

export function assetLabCoverage(catalog) {
  return Object.freeze({
    records: catalog.length, assets: catalog.filter(({ recordType }) => recordType === "runtime-asset").length,
    productionFamilies: catalog.filter(({ recordType }) => recordType === "production-family").length,
    categories: new Set(catalog.map(({ category }) => category)).size, scenes: new Set(catalog.flatMap(({ sceneIds }) => sceneIds)).size,
    states: catalog.reduce((total, entry) => total + Math.max(1, entry.states.length), 0), directions: catalog.reduce((total, entry) => total + Math.max(1, entry.directions.length), 0),
    layers: catalog.reduce((total, entry) => total + Math.max(1, entry.layers.length), 0), animations: catalog.reduce((total, entry) => total + Math.max(1, entry.animations.length), 0),
    invalid: catalog.filter(({ validationStatus }) => validationStatus === "invalid").map(({ id }) => id), placeholders: catalog.filter(({ validationStatus }) => validationStatus === "placeholder").map(({ id }) => id),
    uninspectable: catalog.filter((entry) => entry.recordType === "runtime-asset" && !entry.kind).map(({ id }) => id),
  });
}
