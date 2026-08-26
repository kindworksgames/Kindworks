import {
  EMBEDDED_IMPACT_DATASET,
  filterAndSortImpactProjects,
  impactTotals,
  normalizeImpactDataset,
  youtubePrivacyUrls,
} from "../data/impactProjects.js";

export class ImpactProjectService {
  constructor({ fetchFn = globalThis.fetch, fallbackDataset = EMBEDDED_IMPACT_DATASET } = {}) {
    this.fetchFn = fetchFn;
    this.listeners = new Set();
    const fallback = normalizeImpactDataset(fallbackDataset);
    this.fallback = fallback.dataset;
    this.dataset = fallback.dataset;
    this.status = { code: "embedded-demo", message: "Showing built-in preview stories. No network connection is required.", offlineFallback: false };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  useDataset(input, { source = "supplied" } = {}) {
    const normalized = normalizeImpactDataset(input);
    if (!normalized.ok) return { ok: false, code: "invalid-impact-dataset", errors: normalized.errors };
    this.dataset = normalized.dataset;
    this.status = { code: "validated", message: `Showing validated ${source} project data.`, offlineFallback: false };
    this.emit();
    return { ok: true, code: "impact-dataset-loaded", dataset: structuredClone(this.dataset) };
  }

  useFallback(reason = "Project data is unavailable.") {
    this.dataset = structuredClone(this.fallback);
    this.status = { code: "offline-fallback", message: `${reason} Showing built-in preview stories instead.`, offlineFallback: true };
    this.emit();
    return { ok: true, code: "impact-offline-fallback", dataset: structuredClone(this.dataset) };
  }

  async loadFromUrl(url, { timeoutMs = 5000 } = {}) {
    let parsed;
    try {
      parsed = new URL(url);
      if (parsed.protocol !== "https:") throw new Error("Impact data must use HTTPS.");
    } catch (error) {
      return this.useFallback(error.message || "The project-data address is invalid.");
    }
    if (typeof this.fetchFn !== "function") return this.useFallback("This device cannot request project data.");
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), Math.max(250, timeoutMs)) : null;
    try {
      const response = await this.fetchFn(parsed.href, { signal: controller?.signal, headers: { Accept: "application/json" } });
      if (!response?.ok) throw new Error(`Project data returned ${response?.status || "an error"}.`);
      const input = await response.json();
      const result = this.useDataset(input, { source: "remote" });
      if (!result.ok) return this.useFallback("Downloaded project data did not pass validation.");
      return result;
    } catch (error) {
      return this.useFallback(error?.name === "AbortError" ? "Project data timed out." : "Project data could not be reached.");
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  getSnapshot(category = "all") {
    return {
      datasetId: this.dataset.datasetId,
      source: this.dataset.source,
      lastUpdated: this.dataset.lastUpdated,
      category,
      projects: filterAndSortImpactProjects(this.dataset.projects, category).map((project) => structuredClone(project)),
      totals: impactTotals(this.dataset.projects),
      status: { ...this.status },
    };
  }

  getVideo(projectId) {
    const project = this.dataset.projects.find(({ id }) => id === projectId);
    const urls = project ? youtubePrivacyUrls(project.youtubeUrl) : null;
    return urls ? { ok: true, projectId, ...urls } : { ok: false, code: "video-unavailable", message: "This preview does not have a film yet." };
  }

  getDiagnostics() {
    const snapshot = this.getSnapshot();
    return {
      version: "1.0.0-milestone-38",
      schemaVersion: this.dataset.schemaVersion,
      datasetId: snapshot.datasetId,
      status: snapshot.status,
      projects: this.dataset.projects.length,
      validProjects: this.dataset.projects.filter(({ valid }) => valid).length,
      totals: snapshot.totals,
      privacyEnhancedEmbeds: true,
      deferredVideoLoading: true,
      offlineFallback: true,
    };
  }
}
