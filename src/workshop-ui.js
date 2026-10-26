import { WORKSHOP_UPGRADES } from "./systems/progression.js";

export function renderWorkshop(root, game, close) {
  const p = game.progression;
  root.innerHTML = `<div class="workshop-panel">
    <div class="workshop-heading"><span class="eyebrow">BACK-ALLEY WORKSHOP / PERMANENT UPGRADES</span><button class="text-button" id="close-workshop">← BACK</button></div>
    <h2 id="modal-title">Bad day? <em>Bigger gun.</em></h2>
    <p>Stronger starting stats for every run. Spend saved scrap here; choose your weapon mods during the run.</p>
    <div class="scrap-wallet"><strong>${p.scrap}</strong><span>SCRAP TO SPEND<br><small>Kept after defeat. Spent only here.</small></span></div>
    <div class="workshop-cards">${Object.entries(WORKSHOP_UPGRADES)
      .map(([id, spec]) => {
        const cost = p.cost(id),
          level = p.levels[id],
          capped = !Number.isFinite(cost);
        return `<button class="workshop-card" data-permanent="${id}" ${capped || p.scrap < cost ? "disabled" : ""}>
        <span class="workshop-level">LEVEL ${level} / 5</span><span class="workshop-icon">${spec.icon}</span>
        <h3>${spec.name}</h3><p>${spec.description}</p><small class="workshop-bonus">${spec.bonus(level)}</small><strong>${capped ? "MAXED OUT" : `${cost} SCRAP · UPGRADE ↗`}</strong>
      </button>`;
      })
      .join("")}</div>
    <p class="workshop-foot">1 scrap per 10 kills · 8 per cleared wave · 15 / 30 per boss.<br>${p.saveError ? "Saving is unavailable. Progress is kept only in this session until saving works again." : "Saved automatically in this browser. Five levels per upgrade."}</p>
    <div class="workshop-message" role="status" aria-live="polite"></div>
  </div>`;
  root.querySelector("#close-workshop").onclick = close;
  root.querySelectorAll("[data-permanent]").forEach((button) => {
    button.onclick = () => {
      const id = button.dataset.permanent;
      if (!game.buyPermanent(id)) return;
      renderWorkshop(root, game, close);
      root.querySelector(".workshop-message").textContent =
        `${WORKSHOP_UPGRADES[id].name} upgraded. Next run starts stronger.`;
      const next = root.querySelector(`[data-permanent="${id}"]`);
      (next.disabled ? root.querySelector("#close-workshop") : next).focus();
    };
  });
}
