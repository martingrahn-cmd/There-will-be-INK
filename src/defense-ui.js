import { TOWERS, ECONOMY } from "./systems/defense.js";
export function setupDefenseUI(game, view, clearInput) {
  const root = document.createElement("div");
  root.className = "defense-ui";
  root.innerHTML = `<div class="build-wallet"><span>BUILD ENERGY</span><strong id="energy-value">${ECONOMY.startingEnergy}</strong><button id="open-build">BUILD / B</button><small class="wallet-purpose">TOWERS ONLY · THIS RUN</small><small id="wave-budget"></small><small id="skill-reward">Good shots earn reinforcements.</small></div><div class="build-guide"><strong>BUILD YOUR DEFENSE</strong><span>Spend energy on coverage, control or crowd damage. Towers last for this run.</span><button id="launch-wave" class="primary">START WAVE 1 →</button></div><div class="build-options"></div>`;
  document.querySelector(".notebook").append(root);
  const arena = document.querySelector("#arena");
  arena.addEventListener("pointermove", (e) => {
    if (game.state === "building")
      game.defense.preview = view.pointer(e.clientX, e.clientY);
  });
  arena.addEventListener("pointerleave", () => {
    game.defense.preview = null;
  });
  arena.addEventListener("click", (e) => {
    if (game.state !== "building") return;
    const d = game.defense,
      p = view.pointer(e.clientX, e.clientY);
    const existing = d.slots.find((s) => Math.hypot(s.x - p.x, s.y - p.y) < 28);
    if (existing) {
      d.selected = existing.id;
      d.placing = null;
    } else if (d.placing) {
      if (!d.place(game, d.placing, p.x, p.y))
        root.querySelector(".build-guide>span").textContent =
          "Leave space around the base and other towers. Check your energy.";
    }
    renderOptions();
  });
  const options = root.querySelector(".build-options");
  function renderOptions() {
    const d = game.defense,
      slot = d.slots[d.selected];
    options.innerHTML = `<div class="build-caption">${slot && !d.placing ? `${TOWERS[slot.type].name} · LEVEL ${slot.level}` : d.placing ? "CLICK THE PAPER TO PLACE · GREEN = VALID" : "CHOOSE A TOWER · CLICK AN EXISTING TOWER TO UPGRADE"}</div>`;
    if (slot && !d.placing) {
      const b = document.createElement("button");
      b.className = "tower-choice";
      b.disabled = slot.level >= 3 || d.energy < d.cost(slot);
      b.innerHTML =
        slot.level >= 3
          ? "MAX LEVEL"
          : `<strong>UPGRADE TO LEVEL ${slot.level + 1}</strong><small>${d.cost(slot)} ENERGY</small>`;
      b.onclick = () => {
        d.build(game, slot.id, slot.type);
        renderOptions();
      };
      options.append(b);
    }
    for (const [type, spec] of Object.entries(TOWERS)) {
      const b = document.createElement("button");
      b.className = "tower-choice";
      b.classList.toggle("chosen", d.placing === type);
      b.disabled = d.energy < spec.cost;
      b.innerHTML = `<strong>${spec.icon} ${spec.name}</strong><em class="tower-role">${spec.role}</em><span>${spec.description}</span><small>${spec.cost} ENERGY</small>`;
      b.onclick = () => {
        d.placing = type;
        d.selected = -1;
        root.querySelector(".build-guide>span").textContent =
          "Check coverage, then click to place. Weapon mods affect your weapons only.";
        renderOptions();
      };
      options.append(b);
    }
  }
  root.querySelector("#open-build").onclick = () => {
    clearInput();
    game.defense.open(game);
    renderOptions();
  };
  root.querySelector("#launch-wave").onclick = () => {
    clearInput();
    if (game.defense.resumeState === "playing") game.defense.close(game);
    else game.defense.next(game);
  };
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyB" && !e.repeat) {
      clearInput();
      if (game.state === "building" && game.defense.resumeState === "playing")
        game.defense.close(game);
      else game.defense.open(game);
      renderOptions();
    }
    if (
      e.code === "Escape" &&
      game.state === "building" &&
      game.defense.resumeState === "playing"
    )
      game.defense.close(game);
  });
  let last = "";
  return () => {
    const d = game.defense,
      building = game.state === "building",
      visible = ["playing", "building", "ready"].includes(game.state);
    root.classList.toggle("hidden", !visible);
    document.querySelector(".notebook").classList.toggle("planning", building);

    root.querySelector(".build-guide").classList.toggle("hidden", !building);
    options.classList.toggle("hidden", !building);
    root.querySelector("#open-build").classList.toggle("hidden", building);
    root.querySelector("#energy-value").textContent = d.energy;
    root.querySelector("#skill-reward").textContent =
      d.rewardTime > 0
        ? d.rewardText
        : `Kills +${ECONOMY.killReward} · Skill shots +3–5`;
    const killLeft = ECONOMY.killBudget - d.waveKillEnergy;
    const skillLeft = ECONOMY.skillBudget - d.waveSkillEnergy;
    root.querySelector("#wave-budget").textContent =
      killLeft === 0 && skillLeft === 0
        ? "WAVE BUDGET EMPTY · KILLS STILL SCORE"
        : `WAVE ENERGY LEFT · Kills ${killLeft} · Skill ${skillLeft}`;
    root.querySelector("#launch-wave").textContent =
      d.resumeState === "playing"
        ? "RESUME WAVE →"
        : `START WAVE ${game.wave.number + 1} / 5 →`;
    const key = [
      game.state,
      d.selected,
      d.placing,
      d.energy,
      ...d.slots.map((s) => s.level),
    ].join("/");
    if (key !== last) {
      renderOptions();
      last = key;
    }
  };
}
