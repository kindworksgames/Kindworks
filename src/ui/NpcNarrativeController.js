function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

export class NpcNarrativeController {
  constructor(service, { onModalChange = () => {}, onConversation = () => {} } = {}) {
    this.service = service;
    this.onModalChange = onModalChange;
    this.onConversation = onConversation;
    this.panel = document.querySelector("#npc-story-panel");
    this.selectedId = service.getAllStories()[0]?.id || null;
    this.bind();
  }

  bind() {
    this.onClick = (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.id === "npc-story-close") return this.close();
      if (button.dataset.npcStoryId) { this.selectedId = button.dataset.npcStoryId; return this.render(); }
      if (button.id === "npc-story-thought") return this.selectThought();
    };
    this.onKeyDown = (event) => { if (event.key === "Escape" && this.isOpen()) this.close(); };
    this.onHudClick = () => this.open();
    this.panel?.addEventListener("click", this.onClick);
    document.querySelector("#npc-stories-button")?.addEventListener("click", this.onHudClick);
    document.addEventListener("keydown", this.onKeyDown);
  }

  isOpen() { return Boolean(this.panel && !this.panel.classList.contains("hidden")); }

  open(id = null, { selectThought = false } = {}) {
    if (id && this.service.getStory(id)) this.selectedId = this.service.getStory(id).id;
    this.panel?.classList.remove("hidden");
    this.panel?.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    if (selectThought) {
      const result = this.service.selectThought(this.selectedId, { source: "town-conversation" });
      this.onConversation(result);
    }
    this.render();
    document.querySelector("#npc-story-close")?.focus({ preventScroll: true });
    return { ok: true, residentId: this.selectedId };
  }

  close() {
    if (!this.isOpen()) return false;
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    return true;
  }

  selectThought() {
    const result = this.service.selectThought(this.selectedId, { source: "story-panel" });
    this.onConversation(result);
    const status = document.querySelector("#npc-story-status");
    if (status) {
      status.textContent = result.ok
        ? result.progression?.advanced ? `A new chapter opened: ${result.story.stageTitle}. Saved safely.` : "A new thought was shared and saved safely."
        : result.message || "The conversation could not be saved.";
      status.dataset.status = result.ok ? "success" : "error";
    }
    this.render();
    return result;
  }

  render() {
    if (!this.panel) return;
    const stories = this.service.getAllStories();
    if (!stories.some((story) => story.id === this.selectedId)) this.selectedId = stories[0]?.id;
    const story = this.service.getStory(this.selectedId);
    const list = document.querySelector("#npc-story-list");
    if (list) list.innerHTML = stories.map((entry) => `<button type="button" class="npc-story-list-card ${entry.id === story.id ? "selected" : ""}" data-npc-story-id="${entry.id}" aria-pressed="${entry.id === story.id}"><span>${entry.stage === 3 ? "📕" : "📖"}</span><div><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.role)} · ${escapeHtml(entry.home.name)}</small></div><em>${entry.chapter}/4</em></button>`).join("");
    document.querySelector("#npc-story-portrait").textContent = story.stage === 3 ? "📕" : "📖";
    document.querySelector("#npc-story-name").textContent = story.name;
    document.querySelector("#npc-story-identity").textContent = `${story.role} · ${story.home.name}, ${story.home.area}`;
    document.querySelector("#npc-story-stage").textContent = `CHAPTER ${story.chapter} OF 4 · ${story.stageTitle.toUpperCase()}`;
    document.querySelector("#npc-story-summary").textContent = story.summary;
    document.querySelector("#npc-story-traits").textContent = story.profile.traits.join(" · ");
    document.querySelector("#npc-story-ambition").textContent = story.profile.ambition;
    document.querySelector("#npc-story-concern").textContent = story.profile.concern;
    document.querySelector("#npc-story-thought-text").textContent = story.thought?.text || "Spend time with this resident to hear what is on their mind.";
    document.querySelector("#npc-story-thought-kind").textContent = story.thought ? `${story.thought.category} thought · saved` : "No thought shared yet";
    document.querySelector("#npc-story-home-name").textContent = `${story.home.name} · ${story.home.area}`;
    document.querySelector("#npc-story-home-description").textContent = `${story.home.description} The approach is ${story.home.approach}.`;
    const bonds = document.querySelector("#npc-story-bonds");
    if (bonds) bonds.innerHTML = Object.entries(story.profile.bonds).map(([name, note]) => `<li><strong>${escapeHtml(name)}</strong><span>${escapeHtml(note)}</span></li>`).join("");
    const history = document.querySelector("#npc-story-history");
    if (history) history.innerHTML = story.profile.arc.map((chapter, index) => `<li class="${index <= story.stage ? "unlocked" : "locked"}"><strong>${index < story.stage ? "✓" : index === story.stage ? "●" : "○"} Chapter ${index + 1} · ${escapeHtml(["Introduction", "Opening", "Growth", "Resolution"][index])}</strong><span>${index <= story.stage ? escapeHtml(chapter) : "Continue building trust and caring for Willowmere to reveal this chapter."}</span></li>`).join("");
    const progress = document.querySelector("#npc-story-progress");
    if (progress) progress.innerHTML = story.gate
      ? story.gate.checks.map((check) => `<li class="${check.met ? "met" : "pending"}"><span>${check.met ? "✓" : "○"} ${escapeHtml(check.label)}</span><strong>${Math.floor(check.value)} / ${check.target}</strong></li>`).join("")
      : "<li class=\"met\"><span>✓ Personal story complete</span><strong>4 / 4</strong></li>";
    document.querySelector("#npc-story-thought").textContent = story.thought ? "Hear another thought" : "Talk with this resident";
    this.panel.dataset.npcStory = story.id;
    this.panel.dataset.npcChapter = String(story.chapter);
  }

  getDiagnostics() { return { open: this.isOpen(), selectedId: this.selectedId, keyboardDismiss: true, residentCount: this.service.getAllStories().length }; }
}
