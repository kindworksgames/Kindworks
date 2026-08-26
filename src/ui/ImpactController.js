import { IMPACT_CATEGORIES, youtubePrivacyUrls } from "../data/impactProjects.js";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function money(amount) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(amount || 0);
}

function dateLabel(value) {
  if (!value) return "Coming soon";
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export class ImpactController {
  constructor(service, { onModalChange = () => {}, openExternal = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  } } = {}) {
    this.service = service;
    this.onModalChange = onModalChange;
    this.openExternal = openExternal;
    this.panel = document.querySelector("#impact-panel");
    this.category = "all";
    this.mode = "impact";
    this.previousFocus = null;
    this.loadedPlayers = new Set();
    this.bind();
    this.unsubscribe = service.subscribe(() => this.render());
  }

  bind() {
    this.onHudClick = () => this.open({ mode: "impact" });
    this.onPanelClick = (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.id === "impact-close") return this.close();
      if (button.dataset.impactCategory) {
        this.category = button.dataset.impactCategory;
        return this.render();
      }
      if (button.dataset.impactLoadVideo) return this.loadVideo(button.dataset.impactLoadVideo);
      if (button.dataset.impactOpenVideo) return this.openVideo(button.dataset.impactOpenVideo);
    };
    this.onKeyDown = (event) => {
      if (!this.isOpen()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        this.close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...this.panel.querySelectorAll("button:not([disabled]), a[href], iframe")].filter((node) => !node.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.querySelector("#impact-button")?.addEventListener("click", this.onHudClick);
    this.panel?.addEventListener("click", this.onPanelClick);
    document.addEventListener("keydown", this.onKeyDown);
  }

  isOpen() {
    return Boolean(this.panel && !this.panel.classList.contains("hidden"));
  }

  open({ mode = "impact" } = {}) {
    if (!this.panel) return { ok: false, code: "impact-interface-unavailable" };
    this.mode = mode === "cinema" ? "cinema" : "impact";
    this.previousFocus = document.activeElement;
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    document.body.dataset.impactOpen = this.mode;
    this.onModalChange(true);
    this.render();
    const scroll = this.panel.querySelector(".impact-scroll");
    if (scroll) scroll.scrollTop = 0;
    requestAnimationFrame(() => document.querySelector("#impact-close")?.focus({ preventScroll: true }));
    return { ok: true, code: this.mode === "cinema" ? "cinema-opened" : "impact-opened" };
  }

  close() {
    if (!this.isOpen()) return false;
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    document.body.dataset.impactOpen = "false";
    this.onModalChange(false);
    this.previousFocus?.focus?.({ preventScroll: true });
    this.previousFocus = null;
    return true;
  }

  render() {
    if (!this.panel) return;
    const snapshot = this.service.getSnapshot(this.category);
    const cinema = this.mode === "cinema";
    document.querySelector("#impact-top-icon").textContent = cinema ? "🎬" : "❤️";
    document.querySelector("#impact-title").textContent = cinema ? "KindWorks Cinema" : "KindWorks Impact";
    document.querySelector("#impact-subtitle").textContent = cinema ? "Real cleanup films from the creators we support" : "Real people restoring real places";
    const dataStatus = document.querySelector("#impact-data-status");
    dataStatus.textContent = snapshot.status.message;
    dataStatus.dataset.status = snapshot.status.code;
    document.querySelector("#impact-amount").textContent = money(snapshot.totals.amountSponsoredGBP);
    document.querySelector("#impact-project-count").textContent = String(snapshot.totals.projectsSupported);

    const filters = document.querySelector("#impact-filters");
    filters.replaceChildren(...IMPACT_CATEGORIES.map((category) => {
      const button = element("button", "impact-filter", `${category.icon} ${category.label}`);
      button.type = "button";
      button.dataset.impactCategory = category.id;
      button.setAttribute("aria-pressed", String(category.id === this.category));
      return button;
    }));

    const projects = document.querySelector("#impact-projects");
    projects.replaceChildren(...snapshot.projects.map((project) => this.projectCard(project)));
    const empty = document.querySelector("#impact-empty");
    empty.classList.toggle("hidden", snapshot.projects.length > 0);
  }

  projectCard(project) {
    const card = element("article", "impact-project-card");
    card.dataset.category = project.category;
    card.dataset.status = project.status;
    card.dataset.verified = String(project.verified && !project.demo && project.valid);

    const media = element("div", "impact-project-media");
    media.dataset.impactMedia = project.id;
    const video = youtubePrivacyUrls(project.youtubeUrl);
    if (this.loadedPlayers.has(project.id) && video) {
      const iframe = document.createElement("iframe");
      iframe.title = `${project.title} — privacy-enhanced YouTube player`;
      iframe.src = video.embedUrl;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      media.append(iframe);
    } else {
      const icon = IMPACT_CATEGORIES.find(({ id }) => id === project.category)?.icon || "❤️";
      media.append(element("span", "impact-project-icon", icon));
      media.append(element("small", "impact-privacy-note", video ? "Video blocked until you choose to load it" : "Film coming after a real project is funded"));
      if (video) {
        const load = element("button", "impact-video-load", "▶ Load privacy-enhanced player");
        load.type = "button";
        load.dataset.impactLoadVideo = project.id;
        media.append(load);
      }
    }

    const body = element("div", "impact-project-body");
    const flags = element("div", "impact-project-flags");
    const category = IMPACT_CATEGORIES.find(({ id }) => id === project.category);
    flags.append(element("span", "impact-category-badge", `${category?.icon || "❤️"} ${category?.label || project.category}`));
    flags.append(element("span", project.demo ? "impact-preview-badge" : project.verified ? "impact-verified-badge" : "impact-unverified-badge", project.demo ? "PREVIEW · NOT COUNTED" : project.verified ? "VERIFIED" : "UNVERIFIED · NOT COUNTED"));
    body.append(flags, element("h4", "", project.title));
    const meta = element("p", "impact-project-meta", `${project.creator} · ${project.location} · ${dateLabel(project.date)}`);
    body.append(meta, element("p", "impact-project-description", project.description));
    const footer = element("div", "impact-project-footer");
    footer.append(element("strong", "", project.verified && !project.demo && project.status === "completed" ? `${money(project.amountSponsoredGBP)} sponsored` : "Excluded from verified totals"));
    if (video) {
      const open = element("button", "impact-video-open", "Watch on YouTube ↗");
      open.type = "button";
      open.dataset.impactOpenVideo = project.id;
      footer.append(open);
    } else footer.append(element("span", "impact-film-pending", "No external link yet"));
    body.append(footer);
    card.append(media, body);
    return card;
  }

  loadVideo(projectId) {
    const video = this.service.getVideo(projectId);
    if (!video.ok) return video;
    this.loadedPlayers.add(projectId);
    this.render();
    document.querySelector(`[data-impact-media="${CSS.escape(projectId)}"] iframe`)?.focus({ preventScroll: true });
    return { ok: true, code: "privacy-player-loaded", projectId, provider: "youtube-nocookie.com" };
  }

  openVideo(projectId) {
    const video = this.service.getVideo(projectId);
    if (!video.ok) return video;
    const opened = this.openExternal(video.directUrl);
    return { ok: opened !== null && opened !== false, code: "external-video-opened", projectId, noopener: true, noreferrer: true };
  }

  getDiagnostics() {
    return {
      open: this.isOpen(),
      mode: this.mode,
      category: this.category,
      loadedPlayers: [...this.loadedPlayers],
      privacyEnhancedEmbeds: true,
      deferredVideoLoading: true,
      keyboardDismiss: true,
      focusTrap: true,
    };
  }
}
