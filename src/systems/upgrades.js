export const UPGRADES = [
  {
    id: "minigun",
    tag: "FEED SYSTEM",
    title: "More lead. Less mercy.",
    name: "Minigun",
    icon: "≋",
    description: "Fire 30% faster. A little less accuracy. A lot more ink.",
    max: 3,
    apply: (s) => {
      s.fireRate *= 1.3;
      s.spread += 0.015;
    },
  },
  {
    id: "piercing",
    tag: "BALLISTICS",
    title: "Go right through.",
    name: "Piercing rounds",
    icon: "↗",
    description: "Every round punches through one additional enemy.",
    max: 3,
    apply: (s) => {
      s.pierce++;
    },
  },
  {
    id: "explosive",
    tag: "VOLATILE INK",
    title: "Make an impression.",
    name: "Boomstick",
    icon: "✳",
    description:
      "Every bullet detonates in a wide blast. Shred tightly packed enemies.",
    max: 2,
    apply: (s) => {
      s.explosive += 1;
    },
  },
  {
    id: "ricochet",
    tag: "TRICK SHOT",
    title: "Not done yet.",
    name: "Pinball gun",
    icon: "↝",
    description:
      "Bullets seek out two more enemies after impact. Turn a crowd into a pinball table.",
    max: 2,
    apply: (s) => {
      s.ricochet += 2;
    },
  },
  {
    id: "double",
    tag: "BARREL MOD",
    title: "A second opinion.",
    name: "Triple trouble",
    icon: "Ⅱ",
    description:
      "Three barrels fire at once. Triple the bullets, triple the mess.",
    max: 1,
    apply: (s) => {
      s.barrels += 2;
    },
  },
  {
    id: "damage",
    tag: "HEAVY CALIBER",
    title: "Leave a bigger mark.",
    name: "Heavy rounds",
    icon: "●",
    description: "35% more bullet damage and much stronger knockback.",
    max: Infinity,
    apply: (s) => {
      s.damage *= 1.35;
      s.knockback += 5;
    },
  },
  {
    id: "shrapnel",
    tag: "CHAIN REACTION",
    title: "Parting gifts.",
    name: "Death fragments",
    icon: "⁙",
    description: "Destroyed enemies release four damaging fragments.",
    max: 1,
    apply: (s) => {
      s.shrapnel = true;
    },
  },
  {
    id: "repair",
    tag: "FIELD REPAIR",
    title: "Tape fixes everything.",
    name: "Reinforced hull",
    icon: "+",
    description: "Repair 40 health and increase maximum health by 25.",
    max: Infinity,
    apply: (s) => {
      s.maxHealth += 25;
    },
  },
  {
    id: "pulse",
    tag: "CAPACITOR",
    title: "Personal space.",
    name: "Pulse capacitor",
    icon: "◎",
    description: "Shockwave recharges 25% faster and hits 40% harder.",
    max: 3,
    apply: (s) => {
      s.pulseCooldown *= 0.75;
      s.pulseDamage *= 1.4;
    },
  },
  {
    id: "mortar",
    tag: "SECONDARY",
    title: "Special delivery.",
    name: "Cluster mortar",
    icon: "✣",
    description: "Mortar explosions scatter three additional blasts.",
    max: 1,
    apply: (s) => {
      s.cluster = true;
    },
  },
  {
    id: "reach",
    tag: "EXPLOSIVES",
    title: "Think bigger.",
    name: "Blast radius",
    icon: "◌",
    description: "Explosions and shockwaves cover 30% more ground.",
    max: 2,
    apply: (s) => {
      s.blastRadius *= 1.3;
    },
  },
  {
    id: "cooling",
    tag: "SUPPORT SYSTEM",
    title: "Keep it coming.",
    name: "Quick loader",
    icon: "↻",
    description: "Mortar reloads 30% faster. Repair 15 health.",
    max: Infinity,
    apply: (s) => {
      s.mortarCooldown *= 0.7;
    },
  },
];
export class UpgradeSystem {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.owned = {};
  }
  choices(opening = false) {
    if (opening)
      return ["double", "explosive", "ricochet"].map((id) =>
        UPGRADES.find((u) => u.id === id),
      );
    return UPGRADES.filter((u) => (this.owned[u.id] || 0) < u.max)
      .map((u) => ({ u, n: this.rng() }))
      .sort((a, b) => a.n - b.n)
      .slice(0, 3)
      .map((x) => x.u);
  }
  take(id, stats) {
    const u = UPGRADES.find((x) => x.id === id);
    if (!u || (this.owned[id] || 0) >= u.max) return false;
    this.owned[id] = (this.owned[id] || 0) + 1;
    u.apply(stats);
    return true;
  }
  get evolved() {
    return !!(
      this.owned.minigun &&
      this.owned.piercing &&
      this.owned.explosive
    );
  }
}
