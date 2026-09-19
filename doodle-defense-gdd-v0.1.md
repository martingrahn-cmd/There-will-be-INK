# DOODLE DEFENSE

## Game Design Document v0.1

**Status:** Initial concept / gameplay-first prototype\
**Genre:** 360° fixed-turret arena shooter / roguelite arcade action\
**Perspective:** Top-down\
**Target:** PC / Web prototype\
**Core principle:** Simple mechanics. Grotesque amounts of action.

------------------------------------------------------------------------

## 1. High Concept

DOODLE DEFENSE is a stationary 360° arena shooter viewed from above.

The player controls a heavy turret positioned in the center of a
notebook page. Enemies attack from every direction. The player cannot
move; survival depends entirely on aiming, target prioritization, weapon
choice, upgrades and special abilities.

The game begins readable and relatively controlled, then escalates into
spectacular mechanical and visual chaos.

**Reference DNA:** R.I.P.-style fixed-turret shooting, modern roguelite
build progression, immediate arcade action.

The desired feeling after surviving a difficult wave is:

> "How the hell did I survive that?"

------------------------------------------------------------------------

## 2. Design Pillars

### 2.1 Over the Top

When choosing between reasonable and excessive, choose excessive.

-   100 enemies can become 300.
-   One explosion can trigger three more.
-   A minigun can evolve into something absurd.
-   Missiles can split into more missiles.
-   Enemies can explode and kill other enemies.
-   Late-game builds should feel almost broken in the player's favor.

Chaos must never destroy readability. The player should understand major
threats and why damage was taken.

### 2.2 Satisfying Gunplay

Shooting must feel good before progression or polished art exists.

Weapons should combine:

**Recoil → muzzle flash → tracer/projectile → impact → knockback →
debris → sound → screen shake**

Every weapon needs a distinct personality.

### 2.3 Build the Monster

The player starts with a relatively ordinary turret.

After 15--20 minutes, it should be possible to create an absurd weapons
platform.

Upgrades should favor behavioral changes over small numerical bonuses.

Example:

**Piercing bullets → enemies hit by piercing rounds explode → explosions
create fragments → fragments can ricochet.**

Systems should combine into emergent builds.

### 2.4 Gameplay Before Art

No asset, Blender model, shader or visual effect may block gameplay
development.

**Placeholder → validate gameplay → replace with production asset.**

------------------------------------------------------------------------

## 3. Core Gameplay

The arena is viewed from above. The turret remains permanently in the
center.

### Initial Controls

-   **Mouse:** Aim freely through 360°
-   **LMB:** Primary weapon
-   **RMB:** Secondary weapon / ability
-   **Space:** Special ability
-   **Esc:** Pause

Gamepad support may be added later.

There is no player movement. All attention is placed on aiming, firing
and threat prioritization.

------------------------------------------------------------------------

## 4. Core Loop

A run consists of escalating waves.

### Combat Wave

Approximately **60--90 seconds**.

Enemies continuously enter from the edges of the arena.

### Wave Complete

Short breathing period.

### Upgrade Selection

The player chooses **one of three randomized permanent upgrades**.

### Next Wave

Enemy count, combinations and intensity increase.

### Escalation

Regular waves are interrupted by elite encounters and bosses.

Initial target for a complete run: **approximately 20 minutes**.

------------------------------------------------------------------------

## 5. Enemy Philosophy

The game does not need dozens of enemy types. A small number of strongly
differentiated behaviors should combine to create interesting
situations.

### Swarmer

Small, fast and weak. Appears in enormous groups.

### Brute

Slow with high health. Absorbs fire while other enemies advance.

### Charger

Telegraphs briefly, then rushes toward the turret.

### Shooter

Stops at range and fires toward the player, forcing long-range threat
prioritization.

### Splitter

Divides into several smaller enemies when destroyed.

### Shielder

Protects nearby enemies and becomes a priority target.

### Elite Modifiers

Standard enemies can appear with modifiers such as:

-   Armored
-   Fast
-   Explosive
-   Regenerating
-   Shielded
-   Giant

------------------------------------------------------------------------

## 6. Weapons

The first substantial version should target approximately six base
weapon families.

### Machine Gun

Reliable all-round weapon.

Potential paths: - Minigun - Piercing - Ricochet - Explosive rounds

### Shotgun

Extreme close-range stopping power.

Potential paths: - More pellets - Wider spread - Double shot -
Incendiary ammunition

### Plasma Cannon

Slower projectiles with splash damage.

Potential path: - Chain reactions

### Rocket Launcher

Slow rate of fire with large explosions.

Potential path: - Cluster rockets

### Laser

Continuous beam weapon.

Potential path: - Multiple beams

### Tesla

Electric weapon that chains between enemies.

Potential path: - Larger and more aggressive chain networks

------------------------------------------------------------------------

## 7. Synergy and Evolution System

Certain upgrade combinations create named weapon evolutions.

### HELLSTORM

**Minigun + Explosive Ammo + Piercing**

Rounds penetrate enemies and trigger explosions during penetration.

### THUNDERGOD

**Tesla + Chain + Overcharge**

Electricity propagates through large sections of a swarm.

### APOCALYPSE

**Rocket + Cluster + Incendiary**

Missile → explosion → cluster missiles → secondary explosions → burning
area.

The player should be encouraged to discover powerful combinations rather
than simply maximize damage statistics.

------------------------------------------------------------------------

## 8. Arena Power-Ups

Temporary combat power-ups are separate from permanent between-wave
upgrades.

Possible drops:

-   **QUAD DAMAGE** --- massive temporary damage boost
-   **OVERDRIVE** --- extreme rate of fire
-   **SHIELD** --- temporary protection
-   **FREEZE** --- freezes enemies across the arena
-   **REPAIR** --- restores turret health
-   **NUKE** --- arena-wide destruction

Power-ups should create dramatic moments rather than minor statistical
changes.

### NUKE Presentation

A nuke should not simply delete enemies.

**Flash → shockwave → screen shake → mass enemy destruction → chain
explosions → debris across the arena.**

------------------------------------------------------------------------

## 9. Power-Up Risk / Reward

Some power-ups can appear physically in the arena and require the player
to shoot them to activate them.

They disappear after a short period.

This creates decisions without player movement:

**Shoot the Charger approaching the turret, or divert fire toward the
temporary Quad Damage pickup?**

------------------------------------------------------------------------

## 10. Combo and Score System

Rapid kills build a score multiplier.

Example progression:

**x1 → x2 → x4 → x8 → x16**

Large multikills can trigger arcade-style announcements such as:

-   DOUBLE KILL
-   MASSACRE
-   ANNIHILATION

The tone should be energetic and unapologetically arcade-like.

------------------------------------------------------------------------

## 11. Boss Philosophy

Bosses should not merely be large enemies with enormous health bars.
They should alter how the arena works.

### Prototype Boss: THE COMPASS

A gigantic hostile drawing compass.

One leg anchors into the paper while the other rotates around the arena,
drawing circles that become hazardous zones.

Boss design should embrace the notebook theme and allow deliberately
ridiculous ideas.

------------------------------------------------------------------------

## 12. Visual Identity

The visual direction is a **hand-drawn notebook / college-block
aesthetic**.

It should look intentionally illustrated rather than childish.

Possible visual materials:

-   Pencil
-   Ballpoint pen
-   Marker
-   Highlighter
-   Notebook/grid paper
-   Eraser marks
-   Ink splatter
-   Torn paper
-   Scribbles

The underlying game may still use 3D geometry. Models can use toon/ink
rendering and outlines to preserve correct rotation and animation while
maintaining a hand-drawn appearance.

Visual polish is secondary until the gameplay loop has been validated.

------------------------------------------------------------------------

## 13. Destruction

Destruction should receive disproportionate attention once the core loop
works.

Enemies should not simply disappear.

Potential effects:

-   Components break off
-   Pencil/ink fragments scatter
-   Ink splatters
-   Large enemies lose parts before death
-   Explosions leave persistent marks on the paper
-   The arena becomes progressively dirtier and more damaged

After an intense wave, the notebook page should look like it has been
abused for twenty minutes.

------------------------------------------------------------------------

## 14. Sound

Sound is critical to game feel.

Weapons need distinct identities:

-   Aggressive machine-gun rhythm
-   Heavy shotgun impact
-   Deep explosions
-   Electrical Tesla crackle
-   Strong enemy death feedback

The audio system must limit and vary simultaneous sounds so mass enemy
deaths remain powerful rather than becoming noise.

------------------------------------------------------------------------

## 15. Music

Music should react to combat intensity.

Possible layers:

-   Wave start: restrained
-   Large swarm: additional layers
-   Elite encounter: increased aggression
-   Boss: maximum intensity

------------------------------------------------------------------------

## 16. Technical Philosophy

Initial recommended stack:

**Three.js + Vite**

Gameplay primarily occurs on a 2D logical plane while presentation can
remain fully 3D.

Major systems should remain modular:

-   `CombatSystem`
-   `WeaponSystem`
-   `EnemySystem`
-   `WaveSystem`
-   `UpgradeSystem`
-   `PowerupSystem`
-   `EffectsSystem`
-   `AudioSystem`
-   `ScoreSystem`

Large enemy and projectile counts must be considered from the beginning.

Use techniques such as:

-   Instancing
-   Object pooling
-   Efficient spatial queries
-   Controlled particle budgets
-   Performance profiling

The architecture must support escalation without destroying
responsiveness.

------------------------------------------------------------------------

## 17. Blender Integration

Blender is a tool, not a dependency.

The development agent should be able to use Blender/MCP when doing so
materially improves the result.

Potential Blender uses:

-   Turret models
-   Bosses
-   Special enemies
-   Props
-   Animations

No gameplay feature may be blocked because a Blender asset does not yet
exist.

**Placeholder → gameplay → asset replacement.**

------------------------------------------------------------------------

## 18. First Playable Milestone --- 24 Hours

Within the first development day, the prototype should contain:

-   1 turret
-   360° mouse aiming
-   1 weapon
-   3 enemy behaviors
-   Wave system
-   Turret health
-   Enemy death
-   Basic particles
-   Basic sound
-   Score
-   Simple three-choice upgrade selection

### Milestone Test

**Is the prototype fun to play for ten minutes using placeholders?**

If no:

-   Do not build advanced Blender assets.
-   Do not spend time on sophisticated graphics.
-   Do not add a large weapon catalog.
-   Improve the gameplay loop.

If yes:

Begin expanding content, presentation and escalation.

------------------------------------------------------------------------

## 19. Global Design Rule

> **Every system must support escalation. The game should begin readable
> and controlled and gradually become gloriously ridiculous without
> losing responsiveness or player comprehension.**

------------------------------------------------------------------------

## 20. Scope for v0.2

The next GDD revision should define the systems that determine whether a
full run remains fun:

-   Exact 20-minute run structure
-   Wave escalation
-   Weapon progression trees
-   Upgrade pool
-   Synergies/evolutions
-   Power-up balance
-   Elite rules
-   Boss cadence
-   Difficulty curve
-   Death/restart flow
-   Meta-progression decision: include or exclude
