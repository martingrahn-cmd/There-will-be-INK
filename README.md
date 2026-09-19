# Doodle Defense — There will be INK

Tower-defense-experiment ovanpå en spelbar webbprototyp utifrån `doodle-defense-gdd-v0.1.md`. Fokus: första spelbara milstolpen i avsnitt 18, med några kombinerbara uppgraderingar och power-ups för att pröva eskaleringen.

## Aktiv prototyp: bemannat tower defense

Webbgränssnittet startar nu tower-defense-varianten. Fiender kommer från alla håll mot huvudkanonen. Hjälptorn placeras fritt på pappret. Överlev fem vågor med 35 sekunders spawning per våg, följt av utrensning. Efter femte vågen visas en segerbild.

- Starta med 100 byggenergi: välj en torntyp längst ner och klicka på pappret för att placera ditt första torn. Förhandsvisningen visar räckvidd; grönt betyder giltig plats.
- Automatkanon, bromsfält och granatkastare kostar 100 energi. Uppgraderingar kostar 80 respektive 160; max nivå 3.
- **B** öppnar byggläget och pausar striden. Välj torntyp och klicka för att bygga; klicka på ett befintligt torn för att uppgradera, sedan återuppta. Mellan vågor startar du nästa våg när du är redo.
- Alla kills ger +3 energi, även hjälptornens. Egna skicklighetsträffar ger extra: +15 för att stoppa en laddare under uppladdningen, +20 för en skytt före första skottet och +10 per fiende dödad av en spelarutlöst bläckexplosion. Varje avklarad våg ger +40 energi och +10 hälsa.
- Fokusbyten autopausar inte som standard. Inställningen AUTO-PAUSE ON FOCUS LOSS finns i pausmenyn och sparas lokalt. Esc pausar alltid manuellt.
- Behåll mus/LMB för huvudkanonen, RMB för granatkastaren och Space för chockvågen.
- Skjut powerups på banan för tillfällig hjälp, exempelvis Wingman, målsökande raketer, sköld eller Quad Damage. Första droppen kommer efter 2–4 sekunders strid; powerups och deras effekter pausas i byggläget.
- Efter våg 1–4 väljer du en av tre permanenta uppgraderingar till huvudkanonen. Första valet är trippelpipa, explosiva skott eller studsande kulor. Sedan kan du bygga vidare och själv starta nästa våg. Uppgraderingarna gäller resten av omgången. Den tidigare survival-logiken finns kvar i koden och testas separat.

Starta på porten som används i denna session: `npm run dev -- --port 5174`. Browser-testet använder 5174 som standard; ange `BASE_URL` för en annan adress.

## Kör

Kräver Node.js 22.12+.

```sh
npm install
npm run dev
```

Öppna adressen som Vite skriver ut. `npm run build` skapar `dist/`; `npm run preview` visar produktionsbygget lokalt.

## Kontroller

- Mus: sikta 360°; tornet står stilla.
- Vänster musknapp: håll inne för att skjuta.
- Höger musknapp: granatkastare mot siktet, 4,5 sekunders grundladdning.
- Mellanslag: chockvåg, 22 sekunders grundladdning.
- Esc: pausa/fortsätt. Spelet pausar också när fönstret tappar fokus.
- 1–3 eller klick: välj uppgradering mellan vågor.
- Klicka på notsymbolen för att slå av/på ljud. Valfritt rytmlager finns i pausmenyn.

Avsett för dator med mus och tangentbord. Gränssnittet anpassas till små skärmar, men mobilkontroller är inte en färdig del av prototypen.

## Tidigare survival-version

- Three.js, ortografisk arena, egenritade torn- och fiendesprites, rutat papper och beständiga bläckmärken.
- Automateld med rekyl, projektiler, träffpartiklar, knockback och syntetiserat ljud. Begränsat antal ljudröster.
- Röda explosiva bläckbehållare från våg 1: spräng dem bland fiender för kedjereaktioner och bonuspoäng. Explosionerna skadar bara fiender.
- Svärmare och laddare från våg 1; tunga fiender från våg 2; distansskyttar från våg 3; förstärkta elitfiender från våg 4.
- 45 sekunders spawning per våg, därefter utrensning innan uppgraderingsval. Oändligt survival-läge med stigande tryck.
- Tolv uppgraderingstyper och 10 HP reparation mellan vågor. Första valet garanterar Triple Trouble (tre pipor), Boomstick (explosiva skott) eller Pinball Gun (två studsar). Därefter slumpas tre val med nivåtak.
- Minigun + Piercing + Explosive Ammo ger HELLSTORM. Ricochet, fler pipor, fragment och klustergranater kan kombineras.
- Skjutbara power-ups: Wingman (automatisk hjälpkanon), Seeker Swarm (målsökande raketer), Ink Nova (360°-salvor), Quad Damage, Overdrive, Shield, Freeze, Repair och Nuke. Första droppen kommer efter 2–4 sekunder; nästa dyker vanligtvis upp strax före föregående effekt tar slut, med varierad tajming och placering. De försvinner efter 11 sekunder.
- Killstreaks och poängmultiplikator upp till ×16, död/omstart och lokalt sparat personbästa.
- Instansierad rendering, projektilpool, spatialt rutnät och fasta tak för fiender, projektiler och partiklar.

## Kvar efter första milstolpen

Hela GDD:n är en större vision. Den här versionen har ännu inte sex separata vapenfamiljer, Splitter/Shielder, The Compass-bossen, ett balanserat 20-minutersslut eller full adaptiv musik. Tiominuterskänslan och svårighetskurvan behöver bedömas av en mänsklig spelare innan nästa innehållsexpansion.

## Verifiera

```sh
npm test
npm run build
npx playwright install chromium
# Starta npm run dev -- --port 5174 i ett annat terminalfönster:
node tests/browser.mjs
```

Logiktesterna kontrollerar träffar, piercing, explosioner, vågbyten, evolution, paus, cooldowns, power-ups, poäng och omstart. Webbläsartestet provar byggande, uppgraderingar, fem vågor, seger och förlust i Chromium och sparar skärmbilder i `artifacts/`. Endast utvecklingsbygget exponerar `window.__doodle` för dessa tester.

## Kodstruktur

- `src/systems/game.js`: CombatSystem, WeaponSystem, EnemySystem, WaveSystem, PowerupSystem, ScoreSystem.
- `src/systems/upgrades.js`: uppgraderingsdata och UpgradeSystem.
- `src/systems/effects.js`, `audio.js`: effekter och ljud.
- `src/renderer.js`: Three.js-instansiering, illustrationer och siktgrafik.
- `src/main.js`, `style.css`: menyer, HUD och inmatning.

Inga externa bild- eller ljudassets krävs. Typsnitten hämtas från Google Fonts; lokala reservtypsnitt används utan nätverk.
