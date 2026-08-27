export const SPRITE_AI_LABEL_ATTRIBUTE = "data-sprite-ai-label";

export const SPRITE_AI_DOM_SELECTOR = [
  "button",
  "[role='button']",
  "a[href]",
  "input",
  "select",
  "textarea",
  "canvas",
  "img",
  "svg",
  "[class*='icon']",
  "[class*='portrait']",
  "[class*='avatar']",
  "[class*='sprite']",
  "[class*='panel']",
  "[class*='card']",
  "[class*='hud']",
  "[class*='banner']",
  "[class*='toast']",
  "[class*='controls']",
  "[class*='stage']",
  "[class*='floor']",
  "[class*='counter']",
  "[class*='fixture']",
].join(",");

const IGNORED_DATA_ATTRIBUTES = new Set([
  "data-sprite-ai-label",
  "data-sprite-ai-kind",
]);

export function spriteAiSlug(value, fallback = "visual") {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return slug || fallback;
}

function readable(value, fallback = "Visual") {
  const text = String(value ?? "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function classText(element) {
  if (typeof element?.className === "string") return element.className;
  return element?.getAttribute?.("class") || "";
}

function dataIdentity(element) {
  const attributes = [...(element?.attributes || [])]
    .filter(({ name, value }) => name.startsWith("data-") && !IGNORED_DATA_ATTRIBUTES.has(name) && value)
    .sort((left, right) => left.name.localeCompare(right.name));
  if (!attributes.length) return null;
  const attribute = attributes[0];
  return `${attribute.name.slice(5)}-${attribute.value}`;
}

function parentIdentity(element) {
  const parent = element?.closest?.("[id], [aria-label], [class]");
  if (!parent || parent === element) return "interface";
  return parent.id || parent.getAttribute?.("aria-label") || classText(parent).split(/\s+/)[0] || "interface";
}

export function spriteAiDomKind(element) {
  const tag = String(element?.tagName || "").toLowerCase();
  const classes = classText(element).toLowerCase();
  if (tag === "button" || tag === "a" || element?.getAttribute?.("role") === "button") return "button";
  if (["input", "select", "textarea"].includes(tag)) return "control";
  if (tag === "canvas") return "game-canvas";
  if (["img", "svg"].includes(tag)) return "image";
  if (classes.includes("icon")) return "icon";
  if (classes.includes("portrait") || classes.includes("avatar")) return "portrait";
  if (classes.includes("panel") || classes.includes("card")) return "panel";
  if (classes.includes("hud")) return "hud";
  if (classes.includes("banner") || classes.includes("toast")) return "notification";
  if (classes.includes("controls")) return "control-group";
  return "visual";
}

export function describeSpriteAiDomElement(element) {
  const kind = spriteAiDomKind(element);
  const id = element?.id;
  const dataId = dataIdentity(element);
  const aria = element?.getAttribute?.("aria-label");
  const name = element?.getAttribute?.("name");
  const text = String(element?.textContent || element?.getAttribute?.("title") || "").replace(/\s+/g, " ").trim();
  const classes = classText(element).split(/\s+/).filter(Boolean)[0];
  const identity = id || dataId || name || aria || `${parentIdentity(element)}-${text || classes || element?.tagName || kind}`;
  const labelSource = aria || text || id || dataId || name || classes || kind;
  return Object.freeze({
    id: `ui.${kind}.${spriteAiSlug(identity, kind)}`,
    label: readable(labelSource, readable(kind)),
    kind,
    source: "dom",
    replacement: kind === "control" ? "interface-control" : "sprite-ai",
  });
}

function cloneRecord(record) {
  return {
    id: record.id,
    label: record.label,
    kind: record.kind,
    source: record.source,
    scene: record.scene || null,
    replacement: record.replacement || "sprite-ai",
    instances: record.instances || 1,
  };
}

export class SpriteAiInventory {
  constructor() {
    this.records = new Map();
    this.seenTargets = new WeakSet();
    this.observer = null;
  }

  register(record, target = null) {
    if (!record?.id || !record?.label || !record?.kind) throw new TypeError("Sprite AI records require id, label and kind.");
    if (target && this.seenTargets.has(target)) return this.records.get(record.id);
    if (target) this.seenTargets.add(target);
    const current = this.records.get(record.id);
    if (current) current.instances += 1;
    else this.records.set(record.id, cloneRecord(record));
    return this.records.get(record.id);
  }

  labelDomElement(element) {
    if (!element?.setAttribute) return null;
    const existing = element.getAttribute(SPRITE_AI_LABEL_ATTRIBUTE);
    const record = existing
      ? {
          id: existing,
          label: element.getAttribute("aria-label") || String(element.textContent || existing).trim() || existing,
          kind: element.getAttribute("data-sprite-ai-kind") || spriteAiDomKind(element),
          source: "dom",
          replacement: "sprite-ai",
        }
      : describeSpriteAiDomElement(element);
    element.setAttribute(SPRITE_AI_LABEL_ATTRIBUTE, record.id);
    element.setAttribute("data-sprite-ai-kind", record.kind);
    this.register(record, element);
    return record;
  }

  labelDomTree(root) {
    if (!root) return 0;
    const elements = [];
    if (root.matches?.(SPRITE_AI_DOM_SELECTOR)) elements.push(root);
    elements.push(...(root.querySelectorAll?.(SPRITE_AI_DOM_SELECTOR) || []));
    for (const element of elements) this.labelDomElement(element);
    this.publishDomCoverage(root.ownerDocument || root);
    return elements.length;
  }

  observeDocument(documentRef) {
    this.disconnect();
    this.labelDomTree(documentRef);
    const MutationObserverClass = documentRef?.defaultView?.MutationObserver;
    if (MutationObserverClass && documentRef?.documentElement) {
      this.observer = new MutationObserverClass((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes || []) {
            if (node?.nodeType === 1) this.labelDomTree(node);
          }
        }
      });
      this.observer.observe(documentRef.documentElement, { childList: true, subtree: true });
    }
    return () => this.disconnect();
  }

  auditDocument(documentRef) {
    const candidates = [...(documentRef?.querySelectorAll?.(SPRITE_AI_DOM_SELECTOR) || [])];
    const missing = candidates.filter((element) => !element.getAttribute(SPRITE_AI_LABEL_ATTRIBUTE));
    return Object.freeze({ total: candidates.length, labelled: candidates.length - missing.length, missing });
  }

  publishDomCoverage(documentRef) {
    const document = documentRef?.body ? documentRef : documentRef?.ownerDocument;
    if (!document?.body) return;
    const audit = this.auditDocument(document);
    document.body.dataset.spriteAiDomTotal = String(audit.total);
    document.body.dataset.spriteAiDomLabelled = String(audit.labelled);
    document.body.dataset.spriteAiDomComplete = String(audit.missing.length === 0);
  }

  snapshot() {
    const assets = [...this.records.values()].map(cloneRecord).sort((left, right) => left.id.localeCompare(right.id));
    const byKind = assets.reduce((counts, asset) => {
      counts[asset.kind] = (counts[asset.kind] || 0) + 1;
      return counts;
    }, {});
    return Object.freeze({ version: 1, generatedAt: new Date().toISOString(), assetCount: assets.length, byKind, assets });
  }

  disconnect() {
    this.observer?.disconnect?.();
    this.observer = null;
  }
}

export const spriteAiInventory = new SpriteAiInventory();

export function installSpriteAiDomLabels(documentRef = document, windowRef = window) {
  const disconnect = spriteAiInventory.observeDocument(documentRef);
  const api = Object.freeze({
    audit() {
      const dom = spriteAiInventory.auditDocument(documentRef);
      const scenes = (windowRef.__KINDWORKS_PHASER_GAME__?.scene?.getScenes?.(false) || [])
        .map((scene) => scene.spriteAiLabels?.audit?.())
        .filter(Boolean);
      const phaser = scenes.reduce((summary, scene) => ({
        total: summary.total + scene.total,
        labelled: summary.labelled + scene.labelled,
        missing: [...summary.missing, ...scene.missing],
      }), { total: 0, labelled: 0, missing: [] });
      return Object.freeze({ dom, phaser, complete: dom.missing.length === 0 && phaser.missing.length === 0 });
    },
    inventory: () => spriteAiInventory.snapshot(),
    toJSON: () => JSON.stringify(spriteAiInventory.snapshot(), null, 2),
    download() {
      const blob = new windowRef.Blob([this.toJSON()], { type: "application/json" });
      const url = windowRef.URL.createObjectURL(blob);
      const link = documentRef.createElement("a");
      link.href = url;
      link.download = "kindworks-sprite-ai-inventory.json";
      link.click();
      windowRef.URL.revokeObjectURL(url);
    },
  });
  windowRef.KindWorksSpriteAI = api;
  documentRef.body.dataset.spriteAiLabels = "ready";
  return disconnect;
}
