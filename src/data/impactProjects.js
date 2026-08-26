export const IMPACT_SCHEMA_VERSION = 2;
export const IMPACT_FOCUS_AREA_COUNT = 3;

export const IMPACT_CATEGORIES = Object.freeze([
  Object.freeze({ id: "all", label: "All stories", icon: "❤️" }),
  Object.freeze({ id: "river", label: "River cleaning", icon: "🌊" }),
  Object.freeze({ id: "lawn", label: "Free lawn care", icon: "🌱" }),
  Object.freeze({ id: "waste", label: "Rubbish cleaning", icon: "🧹" }),
]);

export const IMPACT_PROJECT_STATUSES = Object.freeze(["preview", "planned", "in-progress", "completed"]);
const PROJECT_CATEGORIES = new Set(IMPACT_CATEGORIES.filter(({ id }) => id !== "all").map(({ id }) => id));
const PROJECT_STATUSES = new Set(IMPACT_PROJECT_STATUSES);

export const EMBEDDED_IMPACT_DATASET = Object.freeze({
  schemaVersion: IMPACT_SCHEMA_VERSION,
  datasetId: "kindworks-impact-demo-v2",
  source: "embedded-demo",
  lastUpdated: "2026-08-09",
  projects: Object.freeze([
    Object.freeze({
      id: "demo-river-01",
      title: "A neglected waterway becomes clear again",
      category: "river",
      creator: "Future cleanup creator",
      location: "Future project",
      date: "",
      amountSponsoredGBP: null,
      thumbnailUrl: "",
      youtubeUrl: "",
      description: "A preview of how a KindWorks-sponsored river or canal cleanup story will appear once a real project is funded.",
      featured: true,
      status: "preview",
      verified: false,
      demo: true,
    }),
    Object.freeze({
      id: "demo-lawn-01",
      title: "Free garden care for someone who needs a hand",
      category: "lawn",
      creator: "Future lawn-care creator",
      location: "Future project",
      date: "",
      amountSponsoredGBP: null,
      thumbnailUrl: "",
      youtubeUrl: "",
      description: "A future lawn or garden transformation funded to help an elderly, disabled or otherwise deserving resident at no cost to them.",
      featured: true,
      status: "preview",
      verified: false,
      demo: true,
    }),
    Object.freeze({
      id: "demo-waste-01",
      title: "A rubbish-filled community space restored",
      category: "waste",
      creator: "Future cleanup creator",
      location: "Future project",
      date: "",
      amountSponsoredGBP: null,
      thumbnailUrl: "",
      youtubeUrl: "",
      description: "A preview of a community rubbish cleanup, with the full before-and-after story hosted by the creator on YouTube.",
      featured: false,
      status: "preview",
      verified: false,
      demo: true,
    }),
  ]),
});

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function youtubeVideoId(value) {
  const raw = cleanText(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";
    if (hostname === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0])) id = parts[1] || "";
      }
    }
    return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function youtubePrivacyUrls(value) {
  const id = youtubeVideoId(value);
  if (!id) return null;
  return Object.freeze({
    id,
    directUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  });
}

export function normalizeImpactProject(input) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const errors = [];
  const id = cleanText(source.id);
  const title = cleanText(source.title);
  const creator = cleanText(source.creator);
  const location = cleanText(source.location);
  const description = cleanText(source.description);
  if (!id) errors.push("id is required");
  if (!title) errors.push("title is required");
  if (!creator) errors.push("creator is required");
  if (!location) errors.push("location is required");
  if (!description) errors.push("description is required");

  const category = PROJECT_CATEGORIES.has(source.category) ? source.category : "waste";
  if (!PROJECT_CATEGORIES.has(source.category)) errors.push("category is invalid");
  const status = PROJECT_STATUSES.has(source.status) ? source.status : "preview";
  if (!PROJECT_STATUSES.has(source.status)) errors.push("status is invalid");

  const amount = source.amountSponsoredGBP === undefined || source.amountSponsoredGBP === null || source.amountSponsoredGBP === ""
    ? null
    : Number(source.amountSponsoredGBP);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) errors.push("amountSponsoredGBP must be null or non-negative");

  const youtubeUrl = cleanText(source.youtubeUrl);
  if (youtubeUrl && !youtubeVideoId(youtubeUrl)) errors.push("youtubeUrl is not a supported YouTube link");
  const thumbnailUrl = cleanText(source.thumbnailUrl);
  if (thumbnailUrl) {
    try {
      if (new URL(thumbnailUrl).protocol !== "https:") errors.push("thumbnailUrl must use HTTPS");
    } catch {
      errors.push("thumbnailUrl is invalid");
    }
  }

  const demo = Boolean(source.demo);
  let verified = Boolean(source.verified);
  if (demo && verified) {
    errors.push("demo projects cannot be verified");
    verified = false;
  }
  const date = cleanText(source.date);
  if (verified && status === "completed" && (amount === null || !date)) errors.push("verified completed projects require a date and funded amount");

  return {
    ok: errors.length === 0,
    errors,
    project: {
      id,
      title,
      category,
      creator,
      location,
      date,
      amountSponsoredGBP: amount !== null && Number.isFinite(amount) && amount >= 0 ? amount : null,
      thumbnailUrl,
      youtubeUrl: youtubeVideoId(youtubeUrl) ? youtubeUrl : "",
      description,
      featured: Boolean(source.featured),
      status,
      verified,
      demo,
      valid: errors.length === 0,
    },
  };
}

export function normalizeImpactDataset(input) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const errors = [];
  if (Number(source.schemaVersion) !== IMPACT_SCHEMA_VERSION) errors.push(`schemaVersion must be ${IMPACT_SCHEMA_VERSION}`);
  if (!Array.isArray(source.projects)) errors.push("projects must be an array");
  const ids = new Set();
  const projects = [];
  for (const inputProject of Array.isArray(source.projects) ? source.projects : []) {
    const normalized = normalizeImpactProject(inputProject);
    const id = normalized.project.id;
    if (!id) {
      errors.push("project without an id was skipped");
      continue;
    }
    if (ids.has(id)) {
      errors.push(`duplicate project id: ${id}`);
      continue;
    }
    ids.add(id);
    if (!normalized.ok) errors.push(...normalized.errors.map((message) => `${id}: ${message}`));
    projects.push(normalized.project);
  }
  return {
    ok: errors.length === 0,
    errors,
    dataset: {
      schemaVersion: IMPACT_SCHEMA_VERSION,
      datasetId: cleanText(source.datasetId) || "unnamed-impact-dataset",
      source: cleanText(source.source) || "unknown",
      lastUpdated: cleanText(source.lastUpdated),
      projects,
    },
  };
}

export function impactTotals(projects) {
  const verified = (Array.isArray(projects) ? projects : []).filter((project) => (
    project?.valid !== false
    && project?.verified === true
    && project?.demo !== true
    && project?.status === "completed"
    && Number.isFinite(project?.amountSponsoredGBP)
    && project.amountSponsoredGBP >= 0
    && Boolean(cleanText(project?.date))
  ));
  return Object.freeze({
    amountSponsoredGBP: verified.reduce((total, project) => total + project.amountSponsoredGBP, 0),
    projectsSupported: verified.length,
    focusAreas: IMPACT_FOCUS_AREA_COUNT,
  });
}

export function filterAndSortImpactProjects(projects, category = "all") {
  const safeCategory = IMPACT_CATEGORIES.some(({ id }) => id === category) ? category : "all";
  return [...(Array.isArray(projects) ? projects : [])]
    .filter((project) => safeCategory === "all" || project.category === safeCategory)
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))
      || cleanText(b.date).localeCompare(cleanText(a.date))
      || cleanText(a.title).localeCompare(cleanText(b.title)));
}

export function cinemaAccess(restorationSnapshot) {
  const open = Boolean(restorationSnapshot?.unlocked?.station);
  return Object.freeze({
    open,
    code: open ? "cinema-open" : "cinema-restoration-required",
    message: open
      ? "KindWorks Cinema is open. Real restoration stories are now showing."
      : "The cinema is still being restored. Complete the Station restoration milestone to reopen it.",
  });
}
