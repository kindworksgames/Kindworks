import test from "node:test";
import assert from "node:assert/strict";
import {
  EMBEDDED_IMPACT_DATASET,
  IMPACT_CATEGORIES,
  IMPACT_FOCUS_AREA_COUNT,
  IMPACT_PROJECT_STATUSES,
  IMPACT_SCHEMA_VERSION,
  cinemaAccess,
  filterAndSortImpactProjects,
  impactTotals,
  normalizeImpactDataset,
  normalizeImpactProject,
  youtubePrivacyUrls,
  youtubeVideoId,
} from "../src/data/impactProjects.js";
import { ImpactProjectService } from "../src/systems/ImpactProjectService.js";

function verifiedProject(overrides = {}) {
  return {
    id: "verified-river-01",
    title: "River restored",
    category: "river",
    creator: "Cleanup Creator",
    location: "Willow River",
    date: "2026-08-20",
    amountSponsoredGBP: 1250,
    thumbnailUrl: "https://example.test/river.jpg",
    youtubeUrl: "https://www.youtube.com/watch?v=abcDEF_1234",
    description: "A real completed restoration project.",
    featured: true,
    status: "completed",
    verified: true,
    demo: false,
    ...overrides,
  };
}

function dataset(projects, overrides = {}) {
  return { schemaVersion: 2, datasetId: "fixture-v2", source: "fixture", lastUpdated: "2026-08-20", projects, ...overrides };
}

test("Milestone 38 pins the exact embedded preview dataset, categories and statuses", () => {
  assert.equal(IMPACT_SCHEMA_VERSION, 2);
  assert.equal(IMPACT_FOCUS_AREA_COUNT, 3);
  assert.deepEqual(IMPACT_CATEGORIES, [
    { id: "all", label: "All stories", icon: "❤️" },
    { id: "river", label: "River cleaning", icon: "🌊" },
    { id: "lawn", label: "Free lawn care", icon: "🌱" },
    { id: "waste", label: "Rubbish cleaning", icon: "🧹" },
  ]);
  assert.deepEqual(IMPACT_PROJECT_STATUSES, ["preview", "planned", "in-progress", "completed"]);
  assert.equal(EMBEDDED_IMPACT_DATASET.datasetId, "kindworks-impact-demo-v2");
  assert.deepEqual(EMBEDDED_IMPACT_DATASET.projects.map(({ id }) => id), ["demo-river-01", "demo-lawn-01", "demo-waste-01"]);
  assert.ok(EMBEDDED_IMPACT_DATASET.projects.every((project) => project.demo && !project.verified && project.status === "preview"));
});

test("supported YouTube watch, short, embed, shorts and live links resolve to one privacy-safe identity", () => {
  const id = "abcDEF_1234";
  for (const url of [
    `https://youtu.be/${id}`,
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/embed/${id}`,
    `https://m.youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}`,
  ]) assert.equal(youtubeVideoId(url), id);
  assert.deepEqual(youtubePrivacyUrls(`https://youtu.be/${id}`), {
    id,
    directUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  });
});

test("unsafe, deceptive and unsupported video links are rejected", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.evil.test/watch?v=abcDEF_1234",
    "https://notyoutube.test/watch?v=abcDEF_1234",
    "https://youtube.com/channel/abcDEF_1234",
    "https://youtu.be/no",
    "not a URL",
  ]) assert.equal(youtubeVideoId(url), null);
});

test("project validation requires attribution and rejects dishonest verified claims", () => {
  const missing = normalizeImpactProject({ id: "missing", category: "river", status: "preview" });
  assert.equal(missing.ok, false);
  assert.deepEqual(missing.errors, ["title is required", "creator is required", "location is required", "description is required"]);

  const demoClaim = normalizeImpactProject(verifiedProject({ id: "demo-claim", demo: true }));
  assert.equal(demoClaim.ok, false);
  assert.equal(demoClaim.project.verified, false);
  assert.ok(demoClaim.errors.includes("demo projects cannot be verified"));

  const incomplete = normalizeImpactProject(verifiedProject({ id: "incomplete", date: "", amountSponsoredGBP: null }));
  assert.equal(incomplete.ok, false);
  assert.ok(incomplete.errors.includes("verified completed projects require a date and funded amount"));
});

test("dataset validation skips missing and duplicate ids while keeping invalid cards visibly excluded", () => {
  const result = normalizeImpactDataset(dataset([
    verifiedProject(),
    verifiedProject({ title: "Duplicate" }),
    verifiedProject({ id: "", title: "Missing id" }),
    verifiedProject({ id: "invalid-video", youtubeUrl: "https://evil.test/watch?v=abcDEF_1234" }),
  ]));
  assert.equal(result.ok, false);
  assert.equal(result.dataset.projects.length, 2);
  assert.deepEqual(result.dataset.projects.map(({ id }) => id), ["verified-river-01", "invalid-video"]);
  assert.equal(result.dataset.projects[1].valid, false);
  assert.equal(result.dataset.projects[1].youtubeUrl, "");
  assert.ok(result.errors.some((error) => error.includes("duplicate project id")));
});

test("verified totals count only valid, real, completed, dated and non-negative funded projects", () => {
  const inputs = [
    normalizeImpactProject(verifiedProject()).project,
    normalizeImpactProject(verifiedProject({ id: "verified-waste", category: "waste", amountSponsoredGBP: 750 })).project,
    normalizeImpactProject(verifiedProject({ id: "demo", demo: true })).project,
    normalizeImpactProject(verifiedProject({ id: "planned", status: "planned" })).project,
    normalizeImpactProject(verifiedProject({ id: "unverified", verified: false })).project,
    { ...normalizeImpactProject(verifiedProject({ id: "tampered" })).project, valid: false },
  ];
  assert.deepEqual(impactTotals(inputs), { amountSponsoredGBP: 2000, projectsSupported: 2, focusAreas: 3 });
  assert.deepEqual(impactTotals(EMBEDDED_IMPACT_DATASET.projects), { amountSponsoredGBP: 0, projectsSupported: 0, focusAreas: 3 });
});

test("filters preserve category boundaries and sort featured, newest and title in that order", () => {
  const projects = [
    verifiedProject({ id: "old-featured", title: "Zeta", date: "2025-01-01", featured: true }),
    verifiedProject({ id: "new-featured", title: "Alpha", date: "2026-01-01", featured: true }),
    verifiedProject({ id: "new-regular", title: "Beta", date: "2027-01-01", featured: false }),
    verifiedProject({ id: "lawn", title: "Garden", category: "lawn", featured: false }),
  ].map((project) => normalizeImpactProject(project).project);
  assert.deepEqual(filterAndSortImpactProjects(projects).map(({ id }) => id), ["new-featured", "old-featured", "new-regular", "lawn"]);
  assert.deepEqual(filterAndSortImpactProjects(projects, "lawn").map(({ id }) => id), ["lawn"]);
  assert.equal(filterAndSortImpactProjects(projects, "unknown").length, 4);
});

test("the service starts offline-ready, exposes no video for previews, and accepts only valid replacement data", () => {
  const service = new ImpactProjectService({ fetchFn: null });
  assert.equal(service.getSnapshot().status.code, "embedded-demo");
  assert.equal(service.getSnapshot().projects.length, 3);
  assert.equal(service.getVideo("demo-river-01").code, "video-unavailable");
  assert.equal(service.useDataset(dataset([verifiedProject()])).ok, true);
  assert.equal(service.getSnapshot().totals.amountSponsoredGBP, 1250);
  assert.equal(service.getVideo("verified-river-01").embedUrl, "https://www.youtube-nocookie.com/embed/abcDEF_1234?rel=0");
  const before = service.getSnapshot();
  assert.equal(service.useDataset(dataset([verifiedProject({ id: "broken", title: "" })])).ok, false);
  assert.deepEqual(service.getSnapshot(), before);
});

test("remote project failures, invalid payloads and insecure endpoints fall back without an empty screen", async () => {
  for (const fetchFn of [
    async () => { throw new Error("offline"); },
    async () => ({ ok: false, status: 503, json: async () => ({}) }),
    async () => ({ ok: true, json: async () => dataset([verifiedProject({ title: "" })]) }),
  ]) {
    const service = new ImpactProjectService({ fetchFn });
    const result = await service.loadFromUrl("https://impact.kindworks.test/projects.json");
    assert.equal(result.code, "impact-offline-fallback");
    assert.equal(service.getSnapshot().status.offlineFallback, true);
    assert.equal(service.getSnapshot().projects.length, 3);
  }
  const insecure = new ImpactProjectService({ fetchFn: async () => { throw new Error("must not run"); } });
  assert.equal((await insecure.loadFromUrl("http://impact.kindworks.test/projects.json")).code, "impact-offline-fallback");
});

test("a valid HTTPS project response replaces previews and notifies subscribers", async () => {
  let notifications = 0;
  const service = new ImpactProjectService({ fetchFn: async (_url, options) => {
    assert.equal(options.headers.Accept, "application/json");
    return { ok: true, json: async () => dataset([verifiedProject()]) };
  } });
  service.subscribe(() => { notifications += 1; });
  const result = await service.loadFromUrl("https://impact.kindworks.test/projects.json");
  assert.equal(result.code, "impact-dataset-loaded");
  assert.equal(notifications, 1);
  assert.equal(service.getSnapshot().projects[0].id, "verified-river-01");
  assert.equal(service.getDiagnostics().deferredVideoLoading, true);
});

test("KindWorks Cinema access is permanently tied to the Station restoration unlock", () => {
  assert.deepEqual(cinemaAccess({ unlocked: { station: false } }), {
    open: false,
    code: "cinema-restoration-required",
    message: "The cinema is still being restored. Complete the Station restoration milestone to reopen it.",
  });
  assert.deepEqual(cinemaAccess({ unlocked: { station: true } }), {
    open: true,
    code: "cinema-open",
    message: "KindWorks Cinema is open. Real restoration stories are now showing.",
  });
});
