# Doodle Defense — There will be INK

Tower-defense-experiment ovanpå en spelbar webbprototyp utifrån `doodle-defense-gdd-v0.1.md`. Fokus: första spelbara milstolpen i avsnitt 18, med några kombinerbara uppgraderingar och power-ups för att pröva eskaleringen.

Rollfördelningen för systemen finns i [Systemkartan](docs/SYSTEMS.md): **torn = strategi, vapenmoddar = omgångens spelstil, verkstad = bättre startvärden, powerups = tillfällig hjälp, poäng = prestation**.

## Aktiv prototyp: bemannat tower defense

Webbgränssnittet startar nu tower-defense-varianten. Fiender kommer från alla håll mot huvudkanonen. Hjälptorn placeras fritt på pappret. Överlev fem vågor med 35 sekunders spawning per våg, följt av utrensning. Efter femte vågen visas en segerbild.

Vågorna har cirka 142, 195, 256, 323 och 398 fiender för att möta spelarens uppgraderingar under omgången, med 35 % högre spawn-takt under de sista tio sekunderna. Fiendernas hälsa och fart ökar varje våg; elitfiender börjar dyka upp i våg 3 och blir vanligare mot finalen.

Våg 4–5 har en tyngre fiendemix: 28/34 % brutes, 14/18 % skyttar (högst 6/8 samtidigt) och 26/28 % laddare. När skyttetaket är nått kommer laddare i deras ställe. Utöver den vanliga skalningen får fienderna 45/110 % mer hälsa och 12/24 % högre gångfart; elitchansen är 20/30 %. Våg 1–2 behåller sin tidigare grundbalans. Antalet vanliga fiender och energibudgeten är oförändrade, så slutvågorna kräver mer aktivt försvar utan att finansiera fler torn.

- Starta med 150 byggenergi: välj en torntyp längst ner och klicka på pappret för att placera ditt första torn. Förhandsvisningen visar räckvidd; grönt betyder giltig plats.
- Automatkanon kostar 120, bromsfält 140 och granatkastare 150 energi. Uppgraderingar kostar 120 respektive 200; max nivå 3.
- **B** öppnar byggläget och pausar striden. Välj torntyp och klicka för att bygga; klicka på ett befintligt torn för att uppgradera, sedan återuppta. Mellan vågor startar du nästa våg när du är redo.
- Kills ger +1 energi, även hjälptornens, upp till 80 energi per våg. Egna skicklighetsträffar ger +4 för att stoppa en laddare under uppladdningen, +5 för en skytt före första skottet och +3 per fiende dödad av en spelarutlöst bläckexplosion, med ett gemensamt bonustak på 20 energi per våg. Kills fortsätter ge poäng när energibudgeten är slut. Varje avklarad våg ger +120 energi och +10 hälsa. Budgetarna återställs först när nästa våg startas; sparad energi och torn följer med. Maximal total byggbudget inför våg 5 är 1 030 energi. Automatkanoner täcker enskilda hot; granatkastartorn prioriterar den tätaste gruppen inom räckvidden. Återstående kill- och bonusbudget visas vid energimätaren.
- Fokusbyten autopausar inte som standard. Inställningen AUTO-PAUSE ON FOCUS LOSS finns i pausmenyn och sparas lokalt. Esc pausar alltid manuellt.
- Behåll mus/LMB för huvudkanonen, RMB för granatkastaren och Space för chockvågen.
- Skjut powerups på banan för tillfällig hjälp, exempelvis Wingman, målsökande raketer, sköld eller Quad Damage. Första droppen kommer efter 2–4 sekunders strid; powerups och deras effekter pausas i byggläget.
- Efter varje våg visas en två sekunder lång ”Level clear”-animation med vågens belöning. Efter våg 1–4 väljer du sedan en av tre gratis vapenmoddar för den aktuella omgången. Första valet är trippelpipa, explosiva skott eller studsande kulor. Sedan kan du bygga vidare och själv starta nästa våg. Moddarna gäller dina egna vapen resten av omgången. Torn och automatiska powerup-vapen har egna värden; de ärver inte huvudvapnets moddar. Rena skadekort, skrovkort och Quick loader finns endast i den äldre survival-poolen. Minigun ger i tower defense +50 % eldhastighet, −15 % skada per kula och större spridning. Efter våg 5 visas segerbilden. Kameraskakning stoppas i byggläget och övriga pauser, medan visuella effekter klingar av.

## Bossar och roguelite-verkstad

- **THE RED PEN** anländer 14 sekunder in i våg 3 (1 800 HP). **THE EDITOR** anländer 10 sekunder in i våg 5 (5 200 HP). De förvarnas tre sekunder före ankomst och måste besegras för att klara vågen.
- Bossarna stannar på skjutavstånd och varnar före salvor på 3 respektive 5 skott. Vid halva hälsan blir salvorna två skott längre och pauserna kortare. Under omladdningen tar bossen 50 % extra skada. Space rensar fientliga skott inom chockvågens räckvidd. Freeze och Shield fungerar; Nuke skadar bossar men raderar dem inte direkt. Bossar kan inte knuffas bort av kulor.
- **Scrap** är en separat valuta: 1 per 10 kills, 8 per avklarad våg och 15/30 för miniboss/slutboss. Den sparas direkt och behålls vid förlust och omstart. Byggenergi återställs fortfarande mellan omgångar.
- **WORKSHOP** finns på startsidan och efter vinst/förlust. Köp förbättringar till nästa omgång: +6 % grundeldhastighet, +8 % grundskada, +10 max-/starthälsa eller 5 % kortare grundladdning för granatkastaren per nivå. Fem nivåer, med priserna 20, 35, 55, 80 och 110 scrap. Procentbonusarna adderas från grundvärdet; vanliga uppgraderingar under omgången läggs ovanpå.
- Sparas lokalt i samma webbläsare under `doodle-defense-workshop-v1`; ingen kontosynk. Om lagring blockeras fungerar spel och köp under sessionen, och verkstaden visar att sparandet inte fungerar. De permanenta bonusarna gäller endast tower-defense-läget.

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
BASE_URL=http://localhost:5174 node tests/roguelite-browser.mjs
```

Logiktesterna kontrollerar träffar, piercing, explosioner, vågbyten, evolution, paus, cooldowns, power-ups, poäng och omstart. Webbläsartestet provar byggande, uppgraderingar, fem vågor, seger och förlust i Chromium och sparar skärmbilder i `artifacts/`. Endast utvecklingsbygget exponerar `window.__doodle` för dessa tester.

## Kodstruktur

- `src/systems/bosses.js`: bossankomster, attackfaser och raseri.
- `src/systems/progression.js`, `src/workshop-ui.js`: sparad scrap, permanenta uppgraderingar och verkstaden.
- `src/systems/game.js`: CombatSystem, WeaponSystem, EnemySystem, WaveSystem, PowerupSystem, ScoreSystem.
- `src/systems/upgrades.js`: uppgraderingsdata och UpgradeSystem.
- `src/systems/effects.js`, `audio.js`: effekter och ljud.
- `src/renderer.js`: Three.js-instansiering, illustrationer och siktgrafik.
- `src/main.js`, `style.css`: menyer, HUD och inmatning.

Inga externa bild- eller ljudassets krävs. Typsnitten hämtas från Google Fonts; lokala reservtypsnitt används utan nätverk.
