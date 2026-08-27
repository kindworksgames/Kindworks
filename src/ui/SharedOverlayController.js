export const SHARED_UI_COPY = Object.freeze({
  loading: "Loading…",
  loadError: "That area couldn’t open. Try again.",
});

function createElement(documentObject, tag, { id, className, text, attributes = {} } = {}) {
  const element = documentObject.createElement(tag);
  if (id) element.id = id;
  if (className) element.className = className;
  if (text) element.textContent = text;
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

export class SharedOverlayController {
  constructor({ documentObject = document, windowObject = window } = {}) {
    this.document = documentObject;
    this.window = windowObject;
    this.loading = null;
    this.toast = null;
    this.toastMessage = null;
    this.toastDismiss = null;
    this.toastTimer = null;
  }

  start() {
    if (this.loading || !this.document?.body) return this;
    const host = this.document.querySelector(".game-shell") || this.document.body;

    this.loading = createElement(this.document, "aside", {
      id: "kw-loading-state",
      className: "kw-loading-state hidden",
      attributes: { role: "status", "aria-live": "polite", "aria-hidden": "true" },
    });
    this.loading.append(
      createElement(this.document, "span", { className: "kw-loading-spinner", attributes: { "aria-hidden": "true" } }),
      createElement(this.document, "p", { text: SHARED_UI_COPY.loading }),
    );

    this.toast = createElement(this.document, "aside", {
      id: "kw-global-toast",
      className: "kw-global-toast hidden",
      attributes: { role: "status", "aria-live": "polite", "aria-hidden": "true", "data-tone": "neutral" },
    });
    this.toastMessage = createElement(this.document, "p", { text: "" });
    this.toastDismiss = createElement(this.document, "button", {
      className: "kw-toast-dismiss",
      text: "✕",
      attributes: { type: "button", "aria-label": "Dismiss notification" },
    });
    this.toastDismiss.addEventListener("click", () => this.hideToast());
    this.toast.append(this.toastMessage, this.toastDismiss);
    host.append(this.loading, this.toast);
    return this;
  }

  showLoading(sceneKey = "") {
    this.start();
    if (!this.loading) return false;
    this.loading.classList.remove("hidden");
    this.loading.setAttribute("aria-hidden", "false");
    this.loading.dataset.scene = sceneKey;
    this.document.body.dataset.uiLoading = "true";
    return true;
  }

  hideLoading() {
    if (!this.loading) return false;
    this.loading.classList.add("hidden");
    this.loading.setAttribute("aria-hidden", "true");
    delete this.loading.dataset.scene;
    this.document.body.dataset.uiLoading = "false";
    return true;
  }

  showToast(message, { tone = "neutral", duration = 3600, assertive = false } = {}) {
    this.start();
    const copy = String(message || "").trim();
    if (!copy || !this.toast || !this.toastMessage) return false;
    if (this.toastTimer) this.window.clearTimeout(this.toastTimer);
    this.toastMessage.textContent = copy;
    this.toast.dataset.tone = tone;
    this.toast.setAttribute("role", assertive ? "alert" : "status");
    this.toast.setAttribute("aria-live", assertive ? "assertive" : "polite");
    this.toast.setAttribute("aria-hidden", "false");
    this.toast.classList.remove("hidden");
    this.toastTimer = duration > 0 ? this.window.setTimeout(() => this.hideToast(), duration) : null;
    return true;
  }

  showLoadError() {
    return this.showToast(SHARED_UI_COPY.loadError, { tone: "error", duration: 5200, assertive: true });
  }

  hideToast() {
    if (this.toastTimer) this.window.clearTimeout(this.toastTimer);
    this.toastTimer = null;
    if (!this.toast) return false;
    this.toast.classList.add("hidden");
    this.toast.setAttribute("aria-hidden", "true");
    return true;
  }

  getDiagnostics() {
    return {
      loading: Boolean(this.loading && !this.loading.classList.contains("hidden")),
      toast: Boolean(this.toast && !this.toast.classList.contains("hidden")),
      tone: this.toast?.dataset?.tone || null,
      message: this.toastMessage?.textContent || "",
    };
  }
}
