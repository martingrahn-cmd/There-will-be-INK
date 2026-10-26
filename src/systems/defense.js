export const ECONOMY = {
  startingEnergy: 150,
  killReward: 1,
  killBudget: 80,
  skillBudget: 20,
  chargeReward: 4,
  silenceReward: 5,
  chainReward: 3,
  waveReward: 120,
  upgradeCosts: [120, 200],
};
export const TOWERS = {
  gun: {
    name: "AUTO CANNON",
    role: "FOCUS FIRE",
    icon: "Ⅱ",
    description: "Steady single-target fire. Covers gaps near your base.",
    cost: 120,
    range: 185,
  },
  slow: {
    name: "SLOW FIELD",
    role: "CONTROL",
    icon: "◎",
    description:
      "Buys time inside its radius. Deals no damage; pair it with a gun.",
    cost: 140,
    range: 155,
  },
  mortar: {
    name: "MORTAR",
    role: "CROWD CLEAR",
    icon: "✣",
    description:
      "Targets the densest group in range. Slow shots, wide explosions.",
    cost: 150,
    range: 245,
  },
};
export class DefenseSystem {
  constructor() {
    this.energy = ECONOMY.startingEnergy;
    this.earned = 0;
    this.skillEnergy = 0;
    this.waveKillEnergy = 0;
    this.waveSkillEnergy = 0;
    this.selected = -1;
    this.placing = "gun";
    this.preview = null;
    this.resumeState = "ready";
    this.slots = [];
    this.shells = [];
    this.rewardText = "BUILD YOUR FIRST TOWER";
    this.rewardTime = 0;
  }
  layout(bounds) {
    this.bounds = bounds;
  }
  validPosition(x, y) {
    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Math.abs(x) < this.bounds.x - 30 &&
      Math.abs(y) < this.bounds.y - 30 &&
      Math.hypot(x, y) >= 80 &&
      !this.slots.some((s) => Math.hypot(s.x - x, s.y - y) < 55)
    );
  }
  place(g, type, x, y) {
    if (
      g.state !== "building" ||
      !TOWERS[type] ||
      this.energy < TOWERS[type].cost ||
      !this.validPosition(x, y)
    )
      return false;
    this.energy -= TOWERS[type].cost;
    const slot = {
      id: this.slots.length,
      type,
      x,
      y,
      level: 1,
      cooldown: 0,
      angle: 0,
    };
    this.slots.push(slot);
    this.selected = slot.id;
    this.placing = null;
    this.preview = null;
    g.emit("build", { name: TOWERS[type].name });
    return true;
  }
  reward(amount, reason, skill = false) {
    if (skill) {
      amount = Math.min(amount, ECONOMY.skillBudget - this.waveSkillEnergy);
      this.waveSkillEnergy += amount;
    } else if (reason === "KILL") {
      amount = Math.min(amount, ECONOMY.killBudget - this.waveKillEnergy);
      this.waveKillEnergy += amount;
    }
    if (amount <= 0) return;
    this.energy += amount;
    this.earned += amount;
    if (skill) {
      this.skillEnergy += amount;
      this.rewardText = `+${amount} ENERGY · ${reason}`;
      this.rewardTime = 2.5;
    }
  }
  cost(slot) {
    return ECONOMY.upgradeCosts[slot.level - 1] ?? Infinity;
  }
  build(g, id, type) {
    const slot = this.slots[id];
    if (
      g.state !== "building" ||
      !slot ||
      slot.level >= 3 ||
      (!slot.type && !TOWERS[type])
    )
      return false;
    const cost = this.cost(slot);
    if (this.energy < cost) return false;
    this.energy -= cost;
    slot.type ||= type;
    slot.level++;
    slot.cooldown = 0;
    g.emit("build", { name: TOWERS[slot.type].name });
    return true;
  }
  open(g) {
    if (g.state !== "playing" && g.state !== "ready") return;
    this.resumeState = g.state;
    g.state = "building";
  }
  close(g) {
    if (g.state === "building") g.state = this.resumeState;
  }
  next(g) {
    if (
      g.state !== "ready" &&
      !(g.state === "building" && this.resumeState === "ready")
    )
      return false;
    g.weapons.bullets = [];
    g.enemyBullets = [];
    g.weapons.shells = [];
    this.shells = [];
    this.waveKillEnergy = 0;
    this.waveSkillEnergy = 0;
    this.rewardTime = 0;
    g.wave.next();
    g.state = "playing";
    g.emit("wave", { number: g.wave.number });
    return true;
  }
  update(dt, g) {
    this.rewardTime = Math.max(0, this.rewardTime - dt);
    for (const e of g.enemies.items) e.slow = 1;
    for (const slot of this.slots) {
      if (!slot.type) continue;
      const spec = TOWERS[slot.type],
        range = spec.range + (slot.level - 1) * 15;
      const targets = g.enemies.items.filter(
        (e) => e.health > 0 && Math.hypot(e.x - slot.x, e.y - slot.y) < range,
      );
      if (slot.type === "slow") {
        for (const e of targets)
          e.slow = Math.min(e.slow, 0.58 - (slot.level - 1) * 0.1);
        continue;
      }
      slot.cooldown = Math.max(0, slot.cooldown - dt);
      let target = targets.sort(
        (a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y),
      )[0];
      if (!target) continue;
      if (slot.type === "mortar" && slot.cooldown <= 0) {
        const radius = 85 + (slot.level - 1) * 10;
        let bestCount = 0;
        for (const candidate of targets) {
          const count = targets.filter(
            (e) =>
              (e.x - candidate.x) ** 2 + (e.y - candidate.y) ** 2 <
              (radius + e.radius) ** 2,
          ).length;
          if (count > bestCount) {
            target = candidate;
            bestCount = count;
          }
        }
      }
      slot.angle = Math.atan2(target.y - slot.y, target.x - slot.x);
      if (slot.cooldown > 0) continue;
      if (slot.type === "gun") {
        slot.cooldown = 0.23;
        const a = slot.angle;
        g.weapons.bullet({
          x: slot.x + Math.cos(a) * 20,
          y: slot.y + Math.sin(a) * 20,
          vx: Math.cos(a) * 730,
          vy: Math.sin(a) * 730,
          damage: 16 * slot.level,
          support: true,
        });
        g.emit("supportShot", { x: slot.x, y: slot.y });
      } else {
        slot.cooldown = 2;
        this.shells.push({
          x: target.x,
          y: target.y,
          life: 0.55,
          damage: 65 * slot.level,
          radius: 85 + (slot.level - 1) * 10,
        });
        g.emit("mortar");
      }
    }
    for (const shell of this.shells) {
      shell.life -= dt;
      if (shell.life <= 0)
        g.explode(
          shell.x,
          shell.y,
          shell.radius,
          shell.damage,
          "tower",
          0,
          false,
        );
    }
    this.shells = this.shells.filter((s) => s.life > 0);
  }
}
