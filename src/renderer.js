import { TOWERS } from "./systems/defense.js";
import { POWERUPS } from "./systems/powerup-types.js";
import * as THREE from "three";
import { EffectsSystem } from "./systems/effects.js";
const INK = "#263f54",
  RED = "#b84f3e";
function texture(draw, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / 128, size / 128);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function path(c, pts, fill, stroke = INK, width = 3) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  c.strokeStyle = stroke;
  c.lineWidth = width;
  c.stroke();
}
function enemyTexture(type) {
  return texture((c) => {
    c.strokeStyle = INK;
    c.lineWidth = 4;
    if (type === "swarmer") {
      path(
        c,
        [
          [-27, -16],
          [-7, -30],
          [22, -20],
          [30, 4],
          [13, 27],
          [-19, 24],
          [-31, 3],
        ],
        "#d5ddd2",
      );
      for (let i = -1; i <= 1; i += 2) {
        c.beginPath();
        c.moveTo(i * 24, -9);
        c.lineTo(i * 44, -23);
        c.moveTo(i * 27, 9);
        c.lineTo(i * 44, 23);
        c.stroke();
      }
    }
    if (type === "brute") {
      path(
        c,
        [
          [-36, -35],
          [26, -39],
          [39, -19],
          [35, 35],
          [-30, 39],
          [-42, 18],
        ],
        "#b5c3c1",
      );
      for (let i = -24; i < 30; i += 10) {
        c.beginPath();
        c.moveTo(i, -29);
        c.lineTo(i + 7, -15);
        c.stroke();
      }
      path(
        c,
        [
          [-28, 19],
          [26, 19],
          [25, 29],
          [-23, 30],
        ],
        null,
        INK,
        2,
      );
    }
    if (type === "charger") {
      path(
        c,
        [
          [-34, -25],
          [12, -30],
          [43, 0],
          [10, 31],
          [-35, 25],
          [-17, 0],
        ],
        "#efc77e",
      );
      c.strokeStyle = RED;
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(-37, -37);
      c.lineTo(-20, -30);
      c.moveTo(-42, 0);
      c.lineTo(-27, 0);
      c.moveTo(-37, 38);
      c.lineTo(-21, 30);
      c.stroke();
    }
    if (type === "shooter") {
      path(
        c,
        [
          [0, -40],
          [36, -18],
          [35, 24],
          [0, 41],
          [-34, 20],
          [-35, -18],
        ],
        "#d9b9b0",
      );
      c.beginPath();
      c.arc(0, 0, 22, 0, Math.PI * 2);
      c.stroke();
      path(
        c,
        [
          [12, -8],
          [48, -7],
          [48, 8],
          [12, 9],
        ],
        "#eeeadd",
      );
    }
    if (type === "exploder") {
      path(
        c,
        [
          [-22, -33],
          [20, -33],
          [29, -20],
          [27, 28],
          [17, 37],
          [-22, 34],
          [-29, 18],
          [-29, -20],
        ],
        "#cd7057",
      );
      path(
        c,
        [
          [-13, -43],
          [12, -43],
          [13, -32],
          [-14, -32],
        ],
        "#ecd7ac",
      );
      path(
        c,
        [
          [-18, -16],
          [18, -16],
          [18, 18],
          [-18, 18],
        ],
        "#eee2bc",
      );
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(-10, -9);
      c.lineTo(10, 11);
      c.moveTo(10, -9);
      c.lineTo(-10, 11);
      c.stroke();
    }
    if (type !== "shooter" && type !== "exploder") {
      c.fillStyle = INK;
      c.fillRect(-12, -5, 7, 9);
      c.fillRect(10, -5, 7, 9);
      c.beginPath();
      c.moveTo(-8, 14);
      c.lineTo(13, 11);
      c.lineWidth = 3;
      c.stroke();
    }
  });
}
export class GameRenderer {
  constructor(container) {
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.container = container;
    this.effects = new EffectsSystem();
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-640, 640, 360, -360, 0.1, 100);
    this.camera.position.z = 50;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0xffffff, 0);
    container.appendChild(this.renderer.domElement);
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.groups = {};
    for (const type of ["swarmer", "brute", "charger", "shooter", "exploder"])
      this.groups[type] = this.instances(enemyTexture(type), 450, 3);
    this.bullets = this.instances(
      texture((c) => {
        c.fillStyle = "#e39b39";
        c.fillRect(-54, -9, 108, 18);
        c.fillStyle = INK;
        c.fillRect(-49, -5, 70, 10);
      }),
      900,
      4,
    );
    this.hostile = this.instances(
      texture((c) => {
        c.fillStyle = RED;
        c.beginPath();
        c.arc(0, 0, 35, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#742e22";
        c.lineWidth = 8;
        c.stroke();
      }),
      250,
      4,
    );
    this.particleMesh = this.instances(
      texture((c) => {
        c.fillStyle = "white";
        c.fillRect(-40, -20, 80, 40);
      }),
      750,
      5,
    );
    this.ringTex = texture((c) => {
      c.strokeStyle = "white";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 57, 0, Math.PI * 2);
      c.stroke();
    }, 256);
    this.rings = this.instances(this.ringTex, 100, 5);
    this.base = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture((c) => {
          c.strokeStyle = "#6e837d";
          c.lineWidth = 2;
          c.setLineDash([6, 5]);
          c.beginPath();
          c.arc(0, 0, 59, 0, Math.PI * 2);
          c.stroke();
          c.setLineDash([]);
          path(
            c,
            [
              [-33, -34],
              [31, -34],
              [39, -22],
              [39, 24],
              [25, 36],
              [-28, 36],
              [-39, 23],
              [-39, -21],
            ],
            "#d0d6c5",
          );
          for (const x of [-30, 30]) {
            path(
              c,
              [
                [x - 8, -24],
                [x + 8, -24],
                [x + 8, 26],
                [x - 8, 26],
              ],
              "#70847f",
            );
            for (let y = -18; y < 26; y += 8) {
              c.beginPath();
              c.moveTo(x - 7, y);
              c.lineTo(x + 7, y);
              c.strokeStyle = INK;
              c.stroke();
            }
          }
          c.fillStyle = "#e2e3d5";
          c.beginPath();
          c.arc(0, 0, 26, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = INK;
          c.lineWidth = 3;
          c.stroke();
        }),
        transparent: true,
      }),
    );
    this.base.scale.set(112, 112, 1);
    this.base.position.z = 2;
    this.scene.add(this.base);
    this.turret = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture((c) => {
          path(
            c,
            [
              [0, -12],
              [48, -11],
              [53, -7],
              [53, 8],
              [48, 12],
              [0, 11],
            ],
            "#6c8583",
          );
          path(
            c,
            [
              [30, -13],
              [40, -13],
              [40, 14],
              [30, 14],
            ],
            "#cbd5c4",
          );
          path(
            c,
            [
              [-20, -22],
              [10, -20],
              [20, -9],
              [20, 13],
              [8, 22],
              [-22, 19],
              [-29, 0],
            ],
            "#8daba0",
          );
          c.beginPath();
          c.arc(-4, 0, 10, 0, Math.PI * 2);
          c.strokeStyle = INK;
          c.lineWidth = 3;
          c.stroke();
          c.beginPath();
          c.moveTo(-17, -13);
          c.lineTo(-7, -16);
          c.stroke();
        }),
        transparent: true,
      }),
    );
    this.turret.scale.set(102, 102, 1);
    this.turret.position.z = 4;
    this.scene.add(this.turret);
    this.scarsCanvas = document.createElement("canvas");
    this.scarsCanvas.width = 1536;
    this.scarsCanvas.height = 1024;
    this.scarsCtx = this.scarsCanvas.getContext("2d");
    this.scarsTexture = new THREE.CanvasTexture(this.scarsCanvas);
    this.scars = new THREE.Mesh(
      new THREE.PlaneGeometry(1536, 1024),
      new THREE.MeshBasicMaterial({
        map: this.scarsTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    this.scars.position.z = 0;
    this.scene.add(this.scars);
    this.overlay = document.createElement("canvas");
    this.overlay.className = "arena-overlay";
    container.appendChild(this.overlay);
    this.ctx = this.overlay.getContext("2d");
    this.resize();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.recoil = 0;
  }
  instances(map, count, z) {
    const mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        depthWrite: false,
      }),
      count,
    );
    mesh.count = 0;
    mesh.position.z = z;
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    return mesh;
  }
  put(mesh, i, x, y, sx, sy, angle = 0, color = "#ffffff") {
    this.dummy.position.set(x, y, 0);
    this.dummy.scale.set(sx, sy, 1);
    this.dummy.rotation.z = angle;
    this.dummy.updateMatrix();
    mesh.setMatrixAt(i, this.dummy.matrix);
    mesh.setColorAt(i, this.color.set(color));
  }
  finish(mesh, count) {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    this.width = width;
    this.height = height;
    this.worldHeight = 720;
    this.worldWidth = (720 * width) / Math.max(1, height);
    this.camera.left = -this.worldWidth / 2;
    this.camera.right = this.worldWidth / 2;
    this.camera.top = 360;
    this.camera.bottom = -360;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.overlay.width = width * devicePixelRatio;
    this.overlay.height = height * devicePixelRatio;
    this.overlay.style.width = `${width}px`;
    this.overlay.style.height = `${height}px`;
  }
  pointer(clientX, clientY) {
    const r = this.container.getBoundingClientRect();
    return {
      x: ((clientX - r.left - r.width / 2) / r.width) * this.worldWidth,
      y: (-(clientY - r.top - r.height / 2) / r.height) * 720,
    };
  }
  reset() {
    this.effects.reset();
    this.scarsCtx.clearRect(0, 0, 1536, 1024);
    this.scarsTexture.needsUpdate = true;
  }
  event(e) {
    this.effects.event(e);
    if (e.type === "shot") this.recoil = 4;
    if (e.type === "death" || e.type === "explosion") {
      const c = this.scarsCtx;
      c.fillStyle =
        e.type === "death" ? "rgba(35,60,79,.13)" : "rgba(94,65,44,.07)";
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * 6.28,
          r = Math.random() * (e.radius || 15) * 0.65;
        c.beginPath();
        c.ellipse(
          768 + e.x + Math.cos(a) * r,
          512 - e.y + Math.sin(a) * r,
          2 + Math.random() * 7,
          1 + Math.random() * 5,
          a,
          0,
          6.28,
        );
        c.fill();
      }
      this.scarsTexture.needsUpdate = true;
    }
  }
  render(g, dt) {
    this.effects.update(dt);
    if (g.state !== "playing") this.effects.shake = 0;
    this.recoil = Math.max(0, this.recoil - dt * 45);
    g.bounds = { x: Math.max(220, this.worldWidth / 2 - 25), y: 345 };
    if (g.defense) g.defense.layout(g.bounds);
    for (const type in this.groups) {
      let i = 0;
      for (const e of g.enemies.items)
        if (e.type === type && e.health > 0) {
          this.put(
            this.groups[type],
            i++,
            e.x,
            e.y,
            e.radius * 3,
            e.radius * 3,
            Math.atan2(-e.y, -e.x),
            e.hit > 0
              ? "#f1c393"
              : g.buffs.freeze > 0
                ? "#86cdd5"
                : e.elite
                  ? "#e7b995"
                  : "#ffffff",
          );
        }
      this.finish(this.groups[type], i);
    }
    let i = 0;
    for (const b of g.weapons.bullets)
      this.put(
        this.bullets,
        i++,
        b.x,
        b.y,
        b.homing ? 28 : b.fragment ? 11 : 23,
        b.homing
          ? 10
          : b.fragment
            ? 4
            : g.stats.explosive && !b.support
              ? 10
              : 6,
        Math.atan2(b.vy, b.vx),
        b.support
          ? "#89c9a9"
          : g.stats.explosive
            ? "#ff9254"
            : g.stats.ricochet
              ? "#92d5e7"
              : "#ffffff",
      );
    this.finish(this.bullets, i);
    i = 0;
    for (const b of g.enemyBullets.slice(0, 250))
      this.put(this.hostile, i++, b.x, b.y, 13, 13);
    this.finish(this.hostile, i);
    i = 0;
    for (const p of this.effects.particles)
      this.put(
        this.particleMesh,
        i++,
        p.x,
        p.y,
        p.size * 2,
        p.size,
        Math.atan2(p.vy, p.vx),
        p.color,
      );
    this.finish(this.particleMesh, i);
    i = 0;
    for (const r of this.effects.rings.slice(-100)) {
      const progress = 1 - r.life / r.max;
      this.put(
        this.rings,
        i++,
        r.x,
        r.y,
        r.r * 2 * progress,
        r.r * 2 * progress,
        0,
        r.color,
      );
    }
    this.finish(this.rings, i);
    const a = Math.atan2(g.aim.y, g.aim.x);
    this.turret.material.rotation = a;
    this.turret.position.x = -Math.cos(a) * this.recoil;
    this.turret.position.y = -Math.sin(a) * this.recoil;
    this.camera.position.x =
      (Math.random() - 0.5) * (this.reducedMotion ? 0 : this.effects.shake);
    this.camera.position.y =
      (Math.random() - 0.5) * (this.reducedMotion ? 0 : this.effects.shake);
    this.renderer.render(this.scene, this.camera);
    this.drawOverlay(g);
  }
  drawOverlay(g) {
    const c = this.ctx,
      dpr = devicePixelRatio;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, this.width, this.height);
    c.translate(this.width / 2, this.height / 2);
    const scale = this.height / 720;
    c.scale(scale, -scale);
    c.lineWidth = 1.2;
    if (g.defense) {
      const d = g.defense;
      if (g.state === "building" && d.placing && d.preview) {
        const p = d.preview,
          valid =
            d.validPosition(p.x, p.y) && d.energy >= TOWERS[d.placing].cost;
        c.strokeStyle = valid ? "#59876a" : "#b95538";
        c.fillStyle = valid ? "rgba(89,135,106,.1)" : "rgba(185,85,56,.1)";
        c.lineWidth = 2;
        c.setLineDash([5, 7]);
        c.beginPath();
        c.arc(p.x, p.y, TOWERS[d.placing].range, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.setLineDash([]);
        c.fillRect(p.x - 18, p.y - 18, 36, 36);
        c.strokeRect(p.x - 18, p.y - 18, 36, 36);
      }
      for (const slot of d.slots) {
        const selected = g.state === "building" && slot.id === d.selected;
        if (selected || slot.type === "slow") {
          const radius = slot.type
            ? TOWERS[slot.type].range + (slot.level - 1) * 15
            : 185;
          c.strokeStyle = selected ? "#718c75aa" : "#739cab55";
          c.fillStyle = "rgba(107,147,163,.045)";
          c.lineWidth = 1;
          c.setLineDash([4, 7]);
          c.beginPath();
          c.arc(slot.x, slot.y, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.setLineDash([]);
        }
        if (!slot.type) {
          c.strokeStyle = "#70836b66";
          c.lineWidth = 1;
          c.strokeRect(slot.x - 16, slot.y - 16, 32, 32);
          continue;
        }
        c.save();
        c.translate(slot.x, slot.y);
        c.rotate(slot.angle);
        c.strokeStyle = INK;
        c.lineWidth = 2;
        c.fillStyle =
          slot.type === "slow"
            ? "#a7c5c8"
            : slot.type === "mortar"
              ? "#c5b192"
              : "#9caf99";
        c.fillRect(-19, -18, 38, 36);
        c.strokeRect(-19, -18, 38, 36);
        c.beginPath();
        c.arc(0, 0, 12, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (slot.type === "slow") {
          for (const r of [7, 15, 23]) {
            c.beginPath();
            c.arc(0, 0, r, 0, Math.PI * 2);
            c.stroke();
          }
        } else {
          c.fillRect(4, -5, slot.type === "gun" ? 27 : 20, 10);
          c.strokeRect(4, -5, slot.type === "gun" ? 27 : 20, 10);
        }
        c.restore();
        c.save();
        c.translate(slot.x, slot.y - 32);
        c.scale(1, -1);
        c.fillStyle = INK;
        c.textAlign = "center";
        c.font = "bold 9px monospace";
        c.fillText(`${TOWERS[slot.type].name} ${slot.level}`, 0, 0);
        c.restore();
      }
      for (const shell of d.shells) {
        c.strokeStyle = "#987952";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(shell.x, shell.y, shell.radius, 0, Math.PI * 2);
        c.stroke();
      }
    }
    // Range guides stay faint, so charging enemies and hostile shots remain readable.
    c.strokeStyle = "rgba(52,75,85,.10)";
    c.setLineDash([3, 9]);
    for (const r of [150, 270]) {
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.stroke();
    }
    c.setLineDash([]);
    if (g.state === "playing") {
      const a = Math.atan2(g.aim.y, g.aim.x);
      c.strokeStyle = "rgba(41,70,82,.19)";
      c.setLineDash([4, 7]);
      c.beginPath();
      c.moveTo(Math.cos(a) * 58, Math.sin(a) * 58);
      c.lineTo(g.aim.x, g.aim.y);
      c.stroke();
      c.setLineDash([]);
    }
    if (g.stats.barrels > 1) {
      c.save();
      c.rotate(Math.atan2(g.aim.y, g.aim.x));
      c.lineWidth = 2;
      c.strokeStyle = INK;
      c.fillStyle = "#91ada0";
      for (const offset of [-12, 12]) {
        c.fillRect(12, offset - 3, 33, 6);
        c.strokeRect(12, offset - 3, 33, 6);
      }
      c.restore();
    }
    for (const blast of g.pendingBlasts) {
      c.strokeStyle = "#b95538";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(blast.x, blast.y, 24, 0, Math.PI * 2);
      c.stroke();
    }
    for (const e of g.enemies.items) {
      if (
        e.type === "exploder" &&
        Math.hypot(e.x - g.aim.x, e.y - g.aim.y) < 40
      ) {
        c.strokeStyle = "rgba(185,85,56,.35)";
        c.lineWidth = 1.5;
        c.setLineDash([5, 7]);
        c.beginPath();
        c.arc(e.x, e.y, 115, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
      }
      if (
        e.type === "shooter" &&
        Math.hypot(e.x, e.y) < 300 &&
        e.timer <= 0.8 &&
        g.buffs.freeze <= 0
      ) {
        c.strokeStyle = "rgba(184,65,43,.55)";
        c.lineWidth = 1.5;
        c.setLineDash([3, 9]);
        c.beginPath();
        c.moveTo(e.x, e.y);
        c.lineTo(0, 0);
        c.stroke();
        c.setLineDash([]);
        c.beginPath();
        c.arc(e.x, e.y, e.radius + 7, 0, Math.PI * 2);
        c.stroke();
      }
      if (e.phase === "tell") {
        c.strokeStyle = `rgba(184,65,43,${0.4 + Math.sin(e.age * 30) * 0.3})`;
        c.setLineDash([8, 6]);
        c.beginPath();
        c.moveTo(e.x, e.y);
        c.lineTo(0, 0);
        c.stroke();
        c.setLineDash([]);
        c.beginPath();
        c.arc(e.x, e.y, 27, 0, Math.PI * 2);
        c.stroke();
      }
      if (e.type === "brute" || e.elite) {
        c.fillStyle = "#c4c3b7";
        c.fillRect(e.x - 20, e.y + e.radius + 10, 40, 3);
        c.fillStyle = e.elite ? "#bd6343" : INK;
        c.fillRect(
          e.x - 20,
          e.y + e.radius + 10,
          40 * Math.max(0, e.health / e.maxHealth),
          3,
        );
      }
    }
    if (g.buffs.shield > 0) {
      c.strokeStyle = "#5c9c88";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 0, 62, 0, Math.PI * 2);
      c.stroke();
    }
    for (const s of g.weapons.shells) {
      c.strokeStyle = RED;
      c.lineWidth = 2;
      c.setLineDash([5, 4]);
      c.beginPath();
      c.arc(s.x, s.y, 105 * g.stats.blastRadius, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.beginPath();
      c.arc(s.x, s.y, 12 + (60 * s.life) / s.total, 0, Math.PI * 2);
      c.stroke();
    }
    if (g.buffs.sentry > 0) {
      const turret = g.weapons.sentry;
      c.save();
      c.strokeStyle = "#739d84";
      c.lineWidth = 1;
      c.setLineDash([3, 8]);
      c.beginPath();
      c.arc(0, 0, 85, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.translate(turret.x, turret.y);
      c.rotate(turret.angle);
      c.fillStyle = "#93bda4";
      c.strokeStyle = INK;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 17, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillRect(-9, -12, 20, 24);
      c.strokeRect(-9, -12, 20, 24);
      c.fillStyle = "#e8e7ce";
      c.fillRect(4, -5, 24, 10);
      c.strokeRect(4, -5, 24, 10);
      c.restore();
    }
    for (const p of g.powerups.items) {
      c.save();
      c.translate(p.x, p.y);
      c.scale(1, -1);
      c.rotate(-0.08);
      c.fillStyle = "#ede3a6";
      c.strokeStyle = "#7d7950";
      c.lineWidth = 2;
      c.fillRect(-20, -20, 40, 40);
      c.strokeRect(-20, -20, 40, 40);
      c.beginPath();
      c.arc(0, 0, 29, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * p.life) / 11);
      c.stroke();
      c.fillStyle = INK;
      c.textAlign = "center";
      c.font = "bold 23px monospace";
      c.fillText(POWERUPS[p.type].icon, 0, 8);
      c.font = "bold 9px monospace";
      c.fillText(POWERUPS[p.type].name, 0, 43);
      c.restore();
    }
    if (g.state === "playing") {
      c.strokeStyle = INK;
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(g.aim.x, g.aim.y, 10, 0, Math.PI * 2);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        c.moveTo(g.aim.x + dx * 15, g.aim.y + dy * 15);
        c.lineTo(g.aim.x + dx * 21, g.aim.y + dy * 21);
      }
      c.stroke();
      c.fillStyle = RED;
      c.beginPath();
      c.arc(g.aim.x, g.aim.y, 2, 0, 6.28);
      c.fill();
    }
    if (this.effects.flash > 0) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = `rgba(255,250,225,${this.effects.flash * 3})`;
      c.fillRect(0, 0, this.width, this.height);
    }
  }
}
