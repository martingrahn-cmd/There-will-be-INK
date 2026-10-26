# Systemroller — There will be INK

Den här sidan beskriver den aktiva tower-defense-versionen. Använd den som utgångspunkt när vi ändrar spelet, så att nya funktioner inte får samma uppgift som de gamla.

## Tre sätt att bli starkare

| System | Frågan spelaren besvarar | Betalning | Varaktighet |
| --- | --- | --- | --- |
| Torn | Var behöver jag täckning, broms eller gruppskada? | Byggenergi | Omgången |
| Vapenmoddar | Hur vill jag att mina egna vapen ska fungera? | Ett gratis val efter våg 1–4 | Omgången |
| Verkstad | Vilket grundvärde hjälper mig i nästa försök? | Sparat skrot | Alla kommande omgångar |

### Torn: försvarsstrategi

- **Automatkanon / Focus fire:** jämn skada mot ett mål; prioriterar hotet närmast basen inom sin räckvidd.
- **Bromsfält / Control:** ger mer tid, utan egen skada. Placeringen ska hjälpa huvudvapnet och andra torn.
- **Granatkastare / Crowd clear:** väljer den tätaste gruppen inom räckvidden och skjuter långsamma områdessalvor.
- Tornen har egna skador, räckvidder och uppgraderingsnivåer. Huvudvapnets explosiva skott, knockback och dödsfragment överförs inte till dem.
- Byggenergi används bara till torn och tornuppgraderingar. Den och tornen återställs när en ny omgång börjar.

### Vapenmoddar: omgångens spelstil

- Gratis val mellan vågor; gäller spelarens huvudkanon, granatkastare eller chockvåg.
- Trippelpipa, studs, piercing, explosiva skott, dödsfragment och klustergranater ger nya sätt att träffa fiender. Räckvidds- och chockvågsmoddar stärker spelarens områdeskontroll.
- **Minigun:** 50 % högre eldhastighet, 15 % mindre skada per kula och större spridning per nivå. Det är ett val av eldtyp, inte en ren gratis grundbonus.
- Rena skadekort, skrovkort och kortet Quick loader ingår inte i tower-defense-poolen. Grundförbättringarna hör till verkstaden; reparation finns som pickup och mellanvågsbelöning.
- Minigun + Piercing + Boomstick ger HELLSTORM som kombinationsbelöning, inom samma system.
- Moddarna försvinner vid omstart. De ändrar inte byggda torn eller automatiska powerup-vapens egenskaper.

### Verkstad: långsiktig hjälp

- Eldhastighet och skada förbättrar huvudvapnets startvärden. Skrov förbättrar basens start-/maxhälsa. Short fuse minskar spelarens granatkastarladdning.
- Moddarna under omgången bygger vidare på dessa startvärden.
- Köpen ersätter inte ett vapenval, låser inte upp större vågor och gör inte torn automatiskt starkare.
- Befintliga köpta nivåer och skrot behålls. Sparandet finns lokalt i webbläsaren.

## Övriga system ska stödja dessa roller

| System | Roll |
| --- | --- |
| Aktivt skytte | Spelarens omedelbara beslut: välj mål, avbryt laddare, spräng behållare och tajma granatkastare/chockvåg. |
| Powerups | Tillfälliga krafttoppar eller räddningar. Wingman, Seeker Swarm och Nova har egna fasta vapenvärden; huvudvapnets moddar och verkstadsbonusar överförs inte. Quad och Overdrive förstärker huvudkanonen. |
| Skicklighetsbonusar | Bra manuella ingripanden ger lite extra byggenergi, inom vågens bonustak. Automatiska stödkills ger vanlig killenergi men inte spelarens skicklighetsbonusar. |
| Fiender och bossar | Ger olika målprioriteringar och pressar försvarsplaceringen. Bossarnas omladdning är en chans att fokusera skada; chockvågen kan rensa deras skott. |
| Vågor | Ger växling mellan strid, gratis vapenval och planering av torn. |
| Poäng och kombos | Mäter prestation och personbästa. Multiplikatorn ändrar poängen, inte valutabelöningarna. |

## Tre räknare, tre användningar

| Räknare | Tjänas genom | Används till |
| --- | --- | --- |
| Byggenergi | Kills, skicklighetsbonusar och avklarade vågor | Torn under aktuell omgång |
| Skrot / Scrap | Killmilstolpar, avklarade vågor och besegrade bossar | Verkstaden mellan omgångar; behålls vid förlust |
| Poäng / Score | Kills, kedjereaktioner och kombomultiplikator | Personbästa; kan inte spenderas |

Aktuella priser, belöningstak och bossvärden finns i README och respektive systemfil. Den här kartan beskriver ansvar och gränser, så att balansvärden kan justeras utan att rollerna ändras.

## Gräns för nästa ändring

Ange först vilket av systemen ändringen hör till, vilket beslut den ska skapa och hur länge effekten varar. Ett nytt system behövs först när en viktig spelupplevelse inte ryms i de befintliga rollerna.

Den äldre survival-logiken behåller sina ursprungliga kort och vapeninteraktioner. Den ingår inte i den här rollfördelningen.
