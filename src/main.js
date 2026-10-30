import { ProgressionSystem } from "./systems/progression.js";
import { renderWorkshop } from "./workshop-ui.js";
import { ECONOMY } from "./systems/defense.js";
import { setupDefenseUI } from "./defense-ui.js";
import { POWERUPS } from "./systems/powerup-types.js";
import "./style.css";
import { CombatSystem } from "./systems/game.js";
import { AudioSystem } from "./systems/audio.js";
import { GameRenderer } from "./renderer.js";

const turretArt = `<svg viewBox="0 0 500 410" class="hero-art" aria-hidden="true"><defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 0V7" stroke="#244457" stroke-width="1" opacity=".25"/></pattern></defs><g fill="none" stroke="#708981"><circle cx="247" cy="205" r="148" stroke-dasharray="3 10"/><circle cx="247" cy="205" r="113" opacity=".4"/><path d="M247 33V65 M247 348V378 M73 205H106 M389 205H421"/><path d="M130 105Q178 64 218 72" stroke-width="2"/><path d="M210 64L220 71 212 81" stroke-width="2"/></g><g transform="translate(247 205) rotate(-32)" stroke="#294555" stroke-width="3.3" stroke-linejoin="round"><path d="M-67-52L54-54 72-35 73 39 48 57-51 57-72 36-73-33Z" fill="#ced3ba"/><path d="M-67-52L54-54 72-35 73 39 48 57-51 57-72 36-73-33Z" fill="url(#hatch)"/><rect x="-69" y="-46" width="27" height="94" rx="5" fill="#91a399"/><rect x="41" y="-46" width="27" height="94" rx="5" fill="#91a399"/><path d="M-68-29H-43 M-68-13H-43 M-68 3H-43 M-68 19H-43 M-68 35H-43 M42-29H67 M42-13H67 M42 3H67 M42 19H67 M42 35H67"/><circle r="42" fill="#dedecd"/><path d="M-16-34L87-34 98-27 98-10 88-4-16-4" fill="#728e87"/><path d="M60-37H77V-1H60Z" fill="#d2d6c0"/><path d="M-35-30L7-29 30-9 28 25 7 39-34 30-43 0Z" fill="#88a99a"/><path d="M-35-30L7-29 30-9 28 25 7 39-34 30-43 0Z" fill="url(#hatch)"/><circle cx="-8" cy="3" r="16" fill="#bfd0b7"/><path d="M-28-16L-13-20 M-15 3H0 M-8-4V10"/><path d="M108-25L125-30 M108-15L132-13 M104-5L119 3" stroke="#bd643e"/></g><g transform="translate(389 78) rotate(18)" stroke="#294555" stroke-width="2.5" fill="#d5dcca"><path d="M-18-14L6-22 23-8 20 14-3 22-24 8Z"/><path d="M-19-9L-32-21 M-20 8L-35 17 M20-8L33-21 M20 9L35 20" fill="none"/><path d="M-9-1H-3 M5-1H11 M-5 10H7"/></g><g transform="translate(103 288) rotate(-18)" stroke="#294555" stroke-width="2.5" fill="#e8c78c"><path d="M-22-17L8-21 30 0 7 21-23 17-12 0Z"/><path d="M-31-12L-42-16 M-33 0H-47 M-30 12L-42 18" stroke="#b45b40"/><path d="M-5-3H1 M9-3H15"/></g><g fill="#41594d" font-family="Georgia,serif" font-style="italic" font-size="16"><text x="293" y="337" transform="rotate(-8 293 337)">your last line of defense.</text><text x="47" y="76" transform="rotate(-8 47 76)">360° of bad decisions</text></g><path d="M326 310Q318 280 294 268 M294 268L308 271 M294 268L299 280" fill="none" stroke="#41594d" stroke-width="1.7"/></svg>`;
const app = document.querySelector("#app");
app.innerHTML = `
<div class="notebook">
  <div class="binding" aria-hidden="true">${"<i></i>".repeat(9)}</div>
  <header class="topbar">
    <a class="brand" href="#" aria-label="Doodle Defense home"><span class="brand-mark">✳</span><span>DOODLE<br>DEFENSE<span class="edition">FIELD TEST / 001</span></span></a>
    <div class="run-hud hidden" id="run-hud"><div class="health-block"><div class="hud-label"><span>HULL INTEGRITY</span><strong id="health-text">100 / 100</strong></div><div class="health-track"><div id="health-bar"></div></div></div><div class="wave-block"><span class="hud-label">CURRENT WAVE</span><strong id="wave-text">01 <small>/ 5 WAVES</small></strong></div><div class="score-block"><span class="hud-label">SCORE · RECORD ONLY</span><strong id="score-text">000000</strong></div><div class="scrap-block"><span class="hud-label">SCRAP · KEPT</span><strong id="scrap-text">0</strong><small>SPEND BETWEEN RUNS</small></div></div>
    <div class="top-actions"><button id="sound" class="icon-button" aria-label="Mute sound" title="Sound on">♪</button><button id="pause" class="icon-button hidden" aria-label="Pause game" title="Pause (Esc)">Ⅱ</button><span class="version">PROTOTYPE v0.1</span></div>
  </header>
  <main id="arena" aria-label="Doodle Defense game arena"></main>
  <div id="combat-ui" class="hidden"><div class="wave-progress"><div id="wave-progress-fill"></div></div><div class="arena-heading"><span id="wave-status">HOLD THE LINE</span><div class="wave-countdown" role="timer" aria-label="Seconds remaining in wave"><strong id="wave-clock">45</strong><span id="wave-clock-label">SECONDS LEFT</span></div></div><div id="combo"><strong>×1</strong><span>SCORE MULTIPLIER</span><div><i></i></div></div><div id="buffs" aria-label="Temporary powerups"></div><div id="announcement" aria-live="polite"></div><div class="paper-note">RED CANISTERS?<br>POP THEM IN A CROWD. <span>↗</span></div><div class="arena-corner">FIG. 01 — A PERFECTLY NORMAL NOTEBOOK</div><div id="damage-vignette"></div></div>
  <div id="boss-hud" class="boss-hud hidden"><div><span id="boss-name"></span><strong id="boss-health"></strong></div><div class="boss-health-track"><i id="boss-health-fill"></i></div><p id="boss-instruction"></p></div>
  <section id="menu" class="menu">
    <div class="menu-copy"><div class="eyebrow"><span></span> A NOTEBOOK. A TURRET. A VERY BAD IDEA.</div><h1>BUILD. SHOOT.<br>SPILL <span class="ink-word">INK<svg viewBox="0 0 220 16"><path d="M3 8Q68 1 215 7M10 13Q128 6 197 12"/></svg></span><span class="period">.</span></h1><p class="intro">All directions. Your defense.<br>A defense built by your best shots.</p><p class="description">Man the main gun. Earn build energy.<br>Place towers where you need backup.</p><button id="start" class="primary">BUILD A DEFENSE <span>↗</span></button><button id="open-workshop" class="secondary">WORKSHOP · <span id="menu-scrap">0</span> SCRAP ↗</button><div class="start-note">Die trying. Keep the scrap. Come back meaner.</div></div>
    <div class="menu-drawing">${turretArt}<span class="drawing-label">STANDARD ISSUE / DEFINITELY NOT ENOUGH</span></div>
    <div class="field-notes"><span class="eyebrow">THREE WAYS TO GET MEANER</span><div class="note-grid"><div><span class="note-number">01</span><h3>Build your defense.</h3><p>Spend energy on tower placement.<br>Your strategy for this run.</p></div><div><span class="note-number">02</span><h3>Shape your weapon.</h3><p>Pick a free weapon mod after each wave.<br>New firing tricks for this run.</p></div><div><span class="note-number">03</span><h3>Come back stronger.</h3><p>Spend saved scrap in the workshop.<br>Better starting stats. Every run.</p></div></div></div>
  </section>
  <section id="modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title"></section>
  <footer class="bottom-bar"><div id="menu-controls" class="controls"><span><kbd>MOUSE</kbd> AIM</span><span><kbd>LMB</kbd> FIRE</span><span><kbd>RMB</kbd> MORTAR</span><span><kbd>SPACE</kbd> SHOCKWAVE</span><span><kbd>B</kbd> BUILD</span><span><kbd>ESC</kbd> PAUSE</span></div><div id="loadout" class="loadout hidden"><div class="weapon-slot"><div class="weapon-icon">≋</div><div><span class="hud-label">LMB / YOUR WEAPON</span><strong id="weapon-name">MACHINE GUN</strong><span id="build-label">NO WEAPON MODS YET</span></div></div><button id="mortar-button" class="ability"><kbd>RMB</kbd><div><strong>MORTAR</strong><small id="mortar-status">READY</small></div><span>✣</span></button><button id="pulse-button" class="ability"><kbd>SPACE</kbd><div><strong>SHOCKWAVE</strong><small id="pulse-status">READY</small></div><span>◎</span></button><div class="loadout-hint">Press B to build.<br><span>Good shots earn more backup.</span></div></div><span class="footer-note">Made to be messy. <span>↙</span></span></footer>
</div>`;
const $ = (s) => document.querySelector(s);
const progression = new ProgressionSystem({
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
});
const game = new CombatSystem({ mode: "defense", progression }),
  audio = new AudioSystem();
let view;
try {
  view = new GameRenderer($("#arena"));
} catch (error) {
  $("#menu").innerHTML =
    '<div class="error-card"><h1>Graphics unavailable.</h1><p>This game needs WebGL. Enable hardware acceleration in your browser and reload.</p></div>';
  throw error;
}
const input = { fire: false, secondary: false, pulse: false };
const updateDefenseUI = setupDefenseUI(game, view, clearInput);
let pauseOnBlur = false;
try {
  pauseOnBlur = localStorage.getItem("doodle-pause-on-blur") === "true";
} catch {}
let workshopReturn = "menu";
let previousState = "menu",
  last = performance.now(),
  announcementTimer = 0,
  announcementPriority = 0,
  hudTimer = 0,
  record = 0;
try {
  record = Number(localStorage.getItem("doodle-defense-td-best")) || 0;
} catch {}
function clearInput() {
  input.fire = input.secondary = input.pulse = false;
}
function start() {
  audio.unlock();
  game.start();
  announcementTimer = 0;
  $("#announcement").classList.remove("visible");
  $("#announcement").innerHTML = "";
  view.reset();
  clearInput();
  syncState();
}
function announce(title, subtitle = "", priority = 0) {
  if (announcementTimer > 0 && priority < announcementPriority) return;
  announcementPriority = priority;
  const el = $("#announcement");
  el.classList.toggle("boss-announcement", priority > 0);
  el.innerHTML = `<strong>${title}</strong><span>${subtitle}</span>`;
  el.classList.add("visible");
  announcementTimer = 2.7;
}
function formatTime(t) {
  return `${Math.floor(t / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}`;
}
function syncState() {
  const s = game.state;
  const menuLike = s === "menu" || s === "workshop";
  if (s === previousState) return;
  previousState = s;
  clearInput();
  $("#menu").classList.toggle("hidden", !menuLike);
  $("#run-hud").classList.toggle("hidden", menuLike);
  $("#combat-ui").classList.toggle("hidden", menuLike);
  $("#pause").classList.toggle("hidden", menuLike);
  $("#menu-controls").classList.toggle("hidden", !menuLike);
  $("#loadout").classList.toggle("hidden", menuLike);
  $(".footer-note").classList.toggle("hidden", !menuLike);
  $("#arena").classList.toggle("active", !menuLike);
  $(".notebook").classList.toggle("in-game", !menuLike);
  $("#menu-scrap").textContent = progression.scrap;
  const modal = $("#modal");
  modal.classList.toggle("workshop-modal", s === "workshop");
  modal.classList.toggle(
    "hidden",
    ![
      "paused",
      "clearing",
      "upgrade",
      "gameover",
      "victory",
      "workshop",
    ].includes(s),
  );
  if (s === "workshop")
    renderWorkshop(modal, game, () => {
      game.state = workshopReturn;
      syncState();
    });
  if (s === "clearing") {
    $("#announcement").classList.remove("visible");
    modal.innerHTML = `<div class="level-clear-panel" role="status"><span class="eyebrow">WAVE ${String(game.wave.number).padStart(2, "0")} / 05</span><div class="level-clear-stamp">✓</div><h2 id="modal-title">LEVEL <em>CLEAR</em></h2><p>${game.wave.number === 5 ? "The last doodle falls. The page is safe." : "Choose a weapon mod. Then plan your towers."}</p><div class="level-clear-reward">+${ECONOMY.waveReward} BUILD ENERGY <span>+10 HULL REPAIR · +8 SCRAP BANKED</span></div><div class="level-clear-progress"><i></i></div></div>`;
  }
  if (s === "upgrade") {
    modal.innerHTML = `<div class="upgrade-panel"><span class="eyebrow">PAGE ${String(game.wave.number).padStart(2, "0")} / WEAPON MOD · THIS RUN</span><h2 id="modal-title">A little more <em>unreasonable.</em></h2><p>One free mod for your weapons. Towers keep their own firepower. Mods reset next run.</p><div class="upgrade-cards">${game.choices.map((u, i) => `<button class="upgrade-card" data-upgrade="${u.id}"><div class="card-top"><span>${u.scope || u.tag}</span><kbd>${i + 1}</kbd></div><div class="upgrade-icon">${u.icon}</div><h3>${u.name}</h3><em>${u.title}</em><p>${u.description}</p><div class="card-bottom">${game.upgrades.owned[u.id] ? `LEVEL ${game.upgrades.owned[u.id] + 1}` : "NEW ADDITION"}<span>FREE MOD ↗</span></div></button>`).join("")}</div><div class="upgrade-foot">WEAPON MODS · THIS RUN ONLY<span>ENERGY BUILDS TOWERS. SCRAP IMPROVES NEXT RUN.</span></div></div>`;
    modal.querySelectorAll("[data-upgrade]").forEach(
      (b) =>
        (b.onclick = () => {
          game.choose(b.dataset.upgrade);
          syncState();
        }),
    );
  }
  if (s === "paused") {
    modal.innerHTML = `<div class="pause-panel"><span class="eyebrow">PENCILS DOWN.</span><h2 id="modal-title">Take a breath.</h2><p>The mess will still be here.</p><button class="primary" id="resume">BACK TO THE MESS <span>↗</span></button><button class="secondary" id="music">RHYTHM LAYER: ${audio.music ? "ON" : "OFF"}</button><button class="secondary" id="focus-pause">AUTO-PAUSE ON FOCUS LOSS: ${pauseOnBlur ? "ON" : "OFF"}</button><button class="text-button" id="restart">RESTART RUN</button><div class="pause-controls">MOUSE · AIM &nbsp; LMB · FIRE<br>RMB · MORTAR &nbsp; SPACE · SHOCKWAVE<br>ESC · RESUME</div></div>`;
    $("#resume").onclick = () => {
      game.pause();
      syncState();
    };
    $("#restart").onclick = start;
    $("#focus-pause").onclick = () => {
      pauseOnBlur = !pauseOnBlur;
      try {
        localStorage.setItem("doodle-pause-on-blur", String(pauseOnBlur));
      } catch {}
      $("#focus-pause").textContent =
        `AUTO-PAUSE ON FOCUS LOSS: ${pauseOnBlur ? "ON" : "OFF"}`;
    };
    $("#music").onclick = () => {
      audio.music = !audio.music;
      $("#music").textContent = `RHYTHM LAYER: ${audio.music ? "ON" : "OFF"}`;
    };
  }
  if (s === "gameover" || s === "victory") {
    record = Math.max(record, game.score.value);
    try {
      localStorage.setItem("doodle-defense-td-best", String(record));
    } catch {}
    modal.innerHTML = `<div class="end-panel"><span class="eyebrow">WELL, THAT ESCALATED.</span><h2 id="modal-title">${s === "victory" ? "The page is safe." : "Out of ink."}</h2><p>${s === "victory" ? "Five waves. Two bosses. Editorial control is yours." : "The page is toast. Your scrap isn’t. Go build something meaner."}</p><div class="result-score">${game.score.value.toLocaleString()}<span>SCORE · PERSONAL BEST ONLY</span></div><div class="run-results"><div><strong>${game.wave.number}</strong><span>WAVE REACHED</span></div><div><strong>${game.score.kills}</strong><span>DOODLES ERASED</span></div><div><strong>${formatTime(game.time)}</strong><span>TIME SURVIVED</span></div><div><strong>×${game.score.best}</strong><span>BEST COMBO</span></div></div><div class="end-scrap">+${game.runScrap} SCRAP BANKED THIS RUN · ${progression.scrap} AVAILABLE</div><button id="end-workshop" class="secondary">SPEND SCRAP · WORKSHOP ↗</button><button id="again" class="primary">ONE MORE PAGE <span>↗</span></button><div class="best-score">PERSONAL BEST: ${record.toLocaleString()}</div></div>`;
    $("#again").onclick = start;
    $("#end-workshop").onclick = openWorkshop;
  }
  if (!modal.classList.contains("hidden"))
    modal.querySelector("button")?.focus();
}
function openWorkshop() {
  workshopReturn = game.state;
  game.state = "workshop";
  syncState();
}
$("#menu-scrap").textContent = progression.scrap;
$("#open-workshop").onclick = openWorkshop;
$("#start").onclick = start;
$("#sound").onclick = () => {
  audio.muted = !audio.muted;
  $("#sound").textContent = audio.muted ? "♩̸" : "♪";
  $("#sound").setAttribute(
    "aria-label",
    audio.muted ? "Unmute sound" : "Mute sound",
  );
  $("#sound").title = audio.muted ? "Sound off" : "Sound on";
};
$("#pause").onclick = () => {
  game.pause();
  syncState();
};
$(".brand").onclick = (e) => {
  e.preventDefault();
  if (game.state === "playing") {
    game.pause();
    syncState();
  }
};
$("#mortar-button").onclick = () => {
  if (game.state === "playing") game.weapons.mortar(game);
};
$("#pulse-button").onclick = () => {
  if (game.state === "playing") game.weapons.pulse(game);
};
$("#arena").addEventListener("pointermove", (e) => {
  game.aim = view.pointer(e.clientX, e.clientY);
});
// Mouse events report every button press, including RMB while LMB is held.
$("#arena").addEventListener("mousedown", (e) => {
  if (game.state !== "playing") return;
  audio.unlock();
  game.aim = view.pointer(e.clientX, e.clientY);
  if (e.button === 0) {
    input.fire = true;
    if (game.weapons.timer <= 0) {
      game.weapons.fire(game);
      game.weapons.timer =
        1 / (game.stats.fireRate * (game.buffs.overdrive > 0 ? 2 : 1));
    }
  }
  if (e.button === 2) {
    input.secondary = true;
    game.weapons.mortar(game);
  }
  e.preventDefault();
});
window.addEventListener("mouseup", (e) => {
  if (e.button === 0) input.fire = false;
  if (e.button === 2) input.secondary = false;
});
$("#arena").addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (game.state === "playing") {
      input.pulse = true;
      game.weapons.pulse(game);
    }
  }
  if (e.code === "Escape" && !e.repeat) {
    if (game.state === "workshop") game.state = workshopReturn;
    else game.escape();
    syncState();
  }
  if (
    game.state === "upgrade" &&
    ["Digit1", "Digit2", "Digit3"].includes(e.code)
  ) {
    const u = game.choices[Number(e.code.at(-1)) - 1];
    if (u) {
      game.choose(u.id);
      syncState();
    }
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "Space") input.pulse = false;
});
function autoPause() {
  clearInput();
  if (pauseOnBlur && game.state === "playing") {
    game.pause();
    syncState();
  }
}
window.addEventListener("blur", autoPause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) autoPause();
});
function updateHUD() {
  const s = game.stats;
  const boss = game.enemies.items.find((e) => e.boss && e.health > 0);
  $("#boss-hud").classList.toggle("hidden", !boss || game.state !== "playing");
  if (boss) {
    $("#boss-name").textContent =
      `${boss.name}${boss.enraged ? " · ENRAGED" : ""}`;
    $("#boss-health").textContent =
      `${Math.ceil(boss.health)} / ${boss.maxHealth}`;
    $("#boss-health-fill").style.width =
      `${(100 * boss.health) / boss.maxHealth}%`;
    $("#boss-hud").classList.toggle("vulnerable", boss.phase === "recovery");
    $("#boss-instruction").textContent =
      boss.phase === "recovery"
        ? "RELOADING. MAKE IT HURT. · +50% DAMAGE"
        : boss.phase === "windup"
          ? `INCOMING SALVO · ${boss.timer.toFixed(1)}s · SPACE CLEARS NEARBY SHOTS`
          : boss.phase === "volley"
            ? "HEADS DOWN. SALVO INCOMING."
            : "BIG MOUTH. BIG TARGET.";
  }
  $("#health-text").textContent = `${Math.ceil(game.health)} / ${s.maxHealth}`;
  $("#health-bar").style.width = `${(100 * game.health) / s.maxHealth}%`;
  $("#health-bar").classList.toggle("critical", game.health < 30);
  $("#wave-text").innerHTML =
    `${String(Math.max(1, game.wave.number)).padStart(2, "0")} <small>/ 5 WAVES</small>`;
  $("#score-text").textContent = String(game.score.value).padStart(6, "0");
  $("#scrap-text").textContent = game.progression.scrap;
  const remaining = Math.max(
    0,
    Math.ceil(game.wave.duration - game.wave.elapsed),
  );
  $("#wave-clock").textContent = String(remaining).padStart(2, "0");
  $("#wave-clock-label").textContent = game.wave.spawning
    ? "SECONDS LEFT"
    : "CLEAR REMAINING";
  $(".wave-countdown").classList.toggle(
    "urgent",
    remaining > 0 && remaining <= 10,
  );
  $("#wave-status").textContent =
    game.state === "building"
      ? "PLAN YOUR DEFENSE · COMBAT PAUSED"
      : game.wave.spawning
        ? "HOLD THE LINE"
        : `CLEAN UP · ${game.enemies.items.filter((e) => e.health > 0).length} LEFT`;
  $("#wave-progress-fill").style.width =
    `${Math.min(100, (game.wave.elapsed / game.wave.duration) * 100)}%`;
  $("#combo strong").textContent = `×${game.score.multiplier}`;
  $("#combo").classList.toggle("hot", game.score.multiplier >= 4);
  $("#combo i").style.width = `${(Math.max(0, game.score.timer) / 2.8) * 100}%`;
  $("#buffs").innerHTML = Object.entries(game.buffs)
    .filter(([, v]) => v > 0)
    .map(
      ([k, v]) =>
        `<span><small>TEMP</small> ${POWERUPS[k].name} <strong>${Math.ceil(v)}s</strong></span>`,
    )
    .join("");
  for (const [id, timer, total] of [
    ["mortar", game.weapons.mortarTimer, s.mortarCooldown],
    ["pulse", game.weapons.pulseTimer, s.pulseCooldown],
  ]) {
    $(`#${id}-status`).textContent =
      timer > 0 ? `${timer.toFixed(1)}s` : "READY";
    $(`#${id}-button`).style.setProperty(
      "--charge",
      `${(1 - timer / total) * 100}%`,
    );
    $(`#${id}-button`).classList.toggle("charging", timer > 0);
  }
  $("#weapon-name").textContent = game.upgrades.evolved
    ? "HELLSTORM"
    : s.barrels > 1
      ? "TRIPLE TROUBLE"
      : game.upgrades.owned.minigun
        ? "MINIGUN"
        : s.explosive
          ? "BOOMSTICK"
          : s.ricochet
            ? "PINBALL GUN"
            : "MACHINE GUN";
  $("#build-label").textContent =
    Object.entries(game.upgrades.owned)
      .map(
        ([k, v]) =>
          `${game.upgrades.catalog.find((u) => u.id === k)?.name || k} ${v > 1 ? v : ""}`,
      )
      .join(" · ") || "NO WEAPON MODS YET";
}
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.0334);
  last = now;
  game.update(dt, input);
  for (const event of game.events) {
    view.event(event);
    audio.play(event);
    if (event.type === "bossIncoming" || event.type === "bossArrived")
      announce(
        event.name,
        event.type === "bossIncoming"
          ? "BOSS INCOMING · " + event.taunt
          : event.taunt,
        1,
      );
    if (event.type === "bossRage")
      announce("NOW YOU’VE ANNOYED IT.", "LONGER SALVOS. SHORTER FUSE.", 1);
    if (event.type === "bossDefeated")
      announce("REDLINED.", `${event.name} ERASED · +${event.reward} SCRAP`, 1);
    if (event.type === "wave")
      announce(
        `WAVE ${String(event.number).padStart(2, "0")}`,
        event.number === 1
          ? "HOLD THE CENTER. LEAVE A MARK."
          : "NEW PAGE. SAME BAD ATTITUDE.",
      );
    if (event.type === "chain")
      announce(
        `CHAIN REACTION ×${event.depth}`,
        `+${event.bonus} BONUS · NICE SHOT`,
      );
    if (event.type === "build")
      announce(event.name, "BACKUP ONLINE. MAKE IT COUNT.");
    if (event.type === "combo")
      announce(event.name, `×${game.score.multiplier} · KEEP IT GOING`);
    if (event.type === "pickup") announce(event.name, event.description);
    if (event.type === "evolution")
      announce(
        "HELLSTORM",
        "EVOLUTION DISCOVERED · PIERCING EXPLOSIVE MINIGUN",
      );
  }
  game.events.length = 0;
  syncState();
  updateDefenseUI();
  if (game.state !== "menu") view.render(game, dt);
  audio.update(dt, game.enemies.items.length, game.state === "playing");
  announcementTimer -= dt;
  if (announcementTimer <= 0) $("#announcement").classList.remove("visible");
  $("#damage-vignette").style.opacity = game.damageFlash * 2;
  hudTimer += dt;
  if (hudTimer > 0.08) {
    updateHUD();
    hudTimer = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Only expose deterministic inspection helpers during local development.
if (import.meta.env.DEV)
  window.__doodle = { game, view, input, start, syncState };
