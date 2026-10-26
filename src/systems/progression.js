export const PROGRESSION_KEY = "doodle-defense-workshop-v1";
export const WORKSHOP_UPGRADES = {
  fireRate: {
    name: "Loose trigger",
    icon: "≋",
    description: "+6% starting main-gun fire rate per level.",
    bonus: (n) => `CURRENT BONUS · +${n * 6}% FIRE RATE`,
    apply: (s, n) => (s.fireRate *= 1 + n * 0.06),
  },
  damage: {
    name: "Meaner ink",
    icon: "✳",
    description: "+8% starting main-gun damage per level.",
    bonus: (n) => `CURRENT BONUS · +${n * 8}% DAMAGE`,
    apply: (s, n) => (s.damage *= 1 + n * 0.08),
  },
  hull: {
    name: "Thicker skin",
    icon: "+",
    description: "+10 starting and maximum hull per level.",
    bonus: (n) => `CURRENT BONUS · +${n * 10} HULL`,
    apply: (s, n) => (s.maxHealth += n * 10),
  },
  mortar: {
    name: "Short fuse",
    icon: "✣",
    description: "5% shorter cooldown for your mortar per level.",
    bonus: (n) => `CURRENT BONUS · −${n * 5}% COOLDOWN`,
    apply: (s, n) => (s.mortarCooldown *= 1 - n * 0.05),
  },
};
const COSTS = [20, 35, 55, 80, 110];
export class ProgressionSystem {
  constructor(storage = null) {
    this.storage = storage;
    this.scrap = 0;
    this.levels = Object.fromEntries(
      Object.keys(WORKSHOP_UPGRADES).map((id) => [id, 0]),
    );
    this.saveError = false;
    try {
      const raw = storage?.getItem(PROGRESSION_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.version !== 1) throw new Error("Unknown save version");
        this.scrap =
          Number.isSafeInteger(data.scrap) && data.scrap >= 0 ? data.scrap : 0;
        for (const id in this.levels) {
          const level = data.levels?.[id];
          this.levels[id] = Number.isInteger(level)
            ? Math.max(0, Math.min(COSTS.length, level))
            : 0;
        }
      }
    } catch {
      this.saveError = true;
    }
  }
  save() {
    try {
      this.storage?.setItem(
        PROGRESSION_KEY,
        JSON.stringify({ version: 1, scrap: this.scrap, levels: this.levels }),
      );
      this.saveError = false;
    } catch {
      this.saveError = true;
    }
  }
  earn(amount) {
    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !Number.isSafeInteger(this.scrap + amount)
    )
      return false;
    this.scrap += amount;
    this.save();
    return true;
  }
  cost(id) {
    return Object.hasOwn(this.levels, id)
      ? (COSTS[this.levels[id]] ?? Infinity)
      : Infinity;
  }
  buy(id) {
    const price = this.cost(id);
    if (!Number.isFinite(price) || this.scrap < price) return false;
    this.scrap -= price;
    this.levels[id]++;
    this.save();
    return true;
  }
  apply(stats) {
    for (const [id, upgrade] of Object.entries(WORKSHOP_UPGRADES))
      upgrade.apply(stats, this.levels[id]);
  }
}
