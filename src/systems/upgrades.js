export const UPGRADES = [
  {
    id: "minigun",
    tag: "SPRAY FIRE",
    title: "More lead. Less mercy.",
    name: "Minigun",
    icon: "≋",
    description:
      "50% faster main-gun fire, 15% less damage per bullet and a wider spread.",
    max: 3,
    apply: (s) => {
      s.fireRate *= 1.5;
      s.damage *= 0.85;
      s.spread += 0.035;
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
    id: "shrapnel",
    tag: "CHAIN REACTION",
    title: "Parting gifts.",
    name: "Death fragments",
    icon: "⁙",
    description: "Your kills release four damaging fragments.",
    max: 1,
    apply: (s) => {
      s.shrapnel = true;
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
];
// What each card changes, shown on the card.
const SCOPES = {
  mortar: "YOUR MORTAR",
  pulse: "YOUR SHOCKWAVE",
  reach: "YOUR BLASTS",
  shrapnel: "YOUR KILLS",
};
export class UpgradeSystem {
  constructor(rng = Math.random) {
    this.rng = rng;
    // Cards shape the current loadout; the workshop owns baseline stats.
    this.catalog = UPGRADES.map((u) => ({
      ...u,
      scope: SCOPES[u.id] || "MAIN GUN",
    }));
    this.owned = {};
  }
  choices(opening = false) {
    if (opening)
      return ["double", "explosive", "ricochet"].map((id) =>
        this.catalog.find((u) => u.id === id),
      );
    return this.catalog
      .filter((u) => (this.owned[u.id] || 0) < u.max)
      .map((u) => ({ u, n: this.rng() }))
      .sort((a, b) => a.n - b.n)
      .slice(0, 3)
      .map((x) => x.u);
  }
  take(id, stats) {
    const u = this.catalog.find((x) => x.id === id);
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
