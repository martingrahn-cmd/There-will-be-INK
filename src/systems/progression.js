export const PROGRESSION_KEY = "doodle-defense-workshop-v1";
export const PROGRESSION_BACKUP_KEY = `${PROGRESSION_KEY}-unreadable`;
const SAVE_VERSION = 1;
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
    // "corrupt": unreadable save, backed up before the first overwrite.
    // "newer": save from a newer build, never overwritten by this one.
    this.loadProblem = null;
    this.unreadable = null;
    let raw;
    try {
      raw = storage?.getItem(PROGRESSION_KEY);
    } catch {
      this.saveError = true;
      return;
    }
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (Number.isInteger(data?.version) && data.version > SAVE_VERSION) {
        this.loadProblem = "newer";
        this.saveError = true;
        return;
      }
      if (data?.version !== SAVE_VERSION)
        throw new Error("Unknown save version");
      this.scrap =
        Number.isSafeInteger(data.scrap) && data.scrap >= 0 ? data.scrap : 0;
      for (const id in this.levels) {
        const level = data.levels?.[id];
        this.levels[id] = Number.isInteger(level)
          ? Math.max(0, Math.min(COSTS.length, level))
          : 0;
      }
    } catch {
      this.loadProblem = "corrupt";
      this.unreadable = raw;
    }
  }
  save() {
    if (this.loadProblem === "newer") {
      this.saveError = true;
      return;
    }
    try {
      if (this.unreadable !== null) {
        this.storage?.setItem(PROGRESSION_BACKUP_KEY, this.unreadable);
        this.unreadable = null;
      }
      this.storage?.setItem(
        PROGRESSION_KEY,
        JSON.stringify({
          version: SAVE_VERSION,
          scrap: this.scrap,
          levels: this.levels,
        }),
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
