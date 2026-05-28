# Stato del Progetto & Masterplan

## 1. Modifiche Effettuate (Cronologia recente)

* **2026-05-27 — Fix 3 bug: Scout senza plan, loadTactic mancante renderSquadPlan, orphan plan**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:**
    1. `renderScoutTab`: se plan non configurato mostra messaggio orientativo (come Market) invece di produrre verdetti incorretti.
    2. `loadTactic`: aggiunto `cleanOrphanPlan` + `renderSquadPlan` + reset `_spSelectedNodeId` dopo import.
    3. `loadState`: aggiunto `cleanOrphanPlan` al restore da localStorage — elimina entries plan con node id non più esistenti.
  * **Implicazioni:** `cleanOrphanPlan` è una function declaration → hoisted, chiamabile da `loadState` senza spostare la definizione.

* **2026-05-27 — Fix critici post-analisi (4 issue)**
  * **File modificati:** `app.js`, `index.html`, `style.css`
  * **Cosa è stato fatto:**
    1. **saveTactic missing plan (bug):** Aggiunto `plan`, `youthAgeLimit`, `version: 2` all'export JSON. `loadTactic` ora ripristina `plan` e `youthAgeLimit`. File v1 (senza version) sono compatibili — plan viene ignorato/svuotato invece di crash.
    2. **Poacher vs Advanced Forward distinti:** Poacher: key=[Shooting, Movement, Pace], imp=[Technique, Aerial, Strength], sec=[Decisions, Dribbling, Teamwork]. Advanced Forward: key=[Shooting, Technique, Dribbling], imp=[Movement, Decisions, Pace], sec=[Passing, Strength, Teamwork]. Il Poacher pesa aereo/fisico, l'AF tecnica/dribbling.
    3. **Scout default nodo più urgente:** Aggiunta `defaultScoutNodeId(compatibleOpts)` che pre-seleziona il nodo con urgency più alta (HIGH>MED>LOW), score come tiebreaker. Usata in `renderScoutComparison` e `renderScoutAnalysisBody` al posto di `compatibleOpts[0]`.
    4. **Youth age threshold configurabile:** `state.youthAgeLimit = 23` (default). Persiste in localStorage e file export. Controllo `±` nel header del pitch Squad Plan (range 16–30). Tutti i `> 23` hardcoded sostituiti con `> state.youthAgeLimit`.
  * **Implicazioni:** `getEffectiveFamLevel` con MAX non esisteva nel codice — già corretto in precedenza. Nessuna regressione su altri tab.

* **2026-05-27 — Scout verdict dinamico relativo al benchmark di categoria**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:**
    - `computeScoutVerdict`: rimossi threshold fissi (55%/65%). Calcolati dinamicamente: `starterMin = benchmark * 0.85`, `backupMin = benchmark * 0.70`.
    - Logica verdetti aggiornata: INSUFFICIENTE se `< backupMin`, PRIORITARIO se `>= starterMin + urgency high`, CONSIGLIATO se `>= backupMin + urgency med`, UPGRADE se `urgency low + >= starterMin + delta >= 3`, SCONSIGLIATO se `>= backupMin + delta < 0`.
    - Testo diagnosi aggiornato con valori dinamici.
  * **Implicazioni:** Coerente con la logica del Market tab. Un giocatore al 26% è prioritario per una squadra con benchmark 25%, mentre è insufficiente per benchmark 75%.

* **2026-05-26 — Vista Rosa: sort, score%, benchmark rosa, rimozione Top 5 Attrs**
  * **File modificati:** `index.html`, `app.js`, `style.css`
  * **Cosa è stato fatto:**
    - Rimossa colonna "Top 5 Attributes".
    - Aggiunta colonna "Score" con `rawRoleScore(p, bestRole)` colorata (verde/cyan/grigio).
    - Header colonne sortabili (click): Name, Age, Positions, Best Role, Score. Click stesso header inverte direzione. Default: Score ▼.
    - `_squadSort` come stato modulo `{ key, dir }`.
    - Aggiunta `computeSquadBenchmark()`: media `rawRoleScore(bestRole)` di tutti i giocatori non-scout.
    - Aggiunta `renderSquadBenchmark()`: mostra "Media rosa: XX% ★★★☆☆ (N giocatori)" nel header del tab.
  * **Implicazioni:** Il benchmark della vista rosa è indipendente da quello tattico (che usa solo i titolari in campo). Le stelle del benchmark rosa usano lo stesso `state.targetBenchmark` come riferimento.

* **2026-05-26 — Pannello "Ruoli Consigliati" nel modale giocatore**
  * **File modificati:** `index.html`, `app.js`, `style.css`
  * **Cosa è stato fatto:**
    - Aggiunto `<div id="modal-role-suggestions">` in `modal-left` sotto `attrs-panel`.
    - Aggiunta `renderModalRoleSuggestions()`: legge zone mini-pitch con fam ≥ 1, raccoglie tutti i ruoli di quelle zone (o tutti i ruoli compatibili se nessuna zona selezionata), li scora con `rawRoleScore`, mostra top 8 come chips colorate (verde ≥70%, cyan ≥50%, grigio <50%).
    - Hook aggiunti: stepper +/− e input attr in `buildCol`, click celle in `cycleCell`, type toggle in `bindTypeToggle`, apertura modale in `openModal`.
    - CSS: `.modal-role-chip` con tre varianti cromatiche, header con titolo e sottotitolo zona.
  * **Implicazioni:** Il pannello si aggiorna in tempo reale ad ogni modifica. Se nessuna posizione è selezionata, mostra tutti i ruoli compatibili per tipo (GK/outfield).

* **2026-05-26 — Curva qualità non-lineare FM-style (convertAttributeToQuality)**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:**
    - Aggiunta `convertAttributeToQuality(val)`: mappa attr 1–20 su scala qualità 1–100% con curva esponenziale (val=10 → 30%, non 50%).
    - `rawAttrScore`: ogni attributo viene ora convertito via curva prima del weighting. `max` è `100 * w` anziché `20 * w`. Ritorna nativamente 0–100%.
    - `rawRoleScore`: stessa curva applicata. `max` è `100 * w`.
    - `scorePlayerForNode`: rimossa la divisione `(rawAttrScore / 20) * 100` — non necessaria perché `rawAttrScore` è già 0–100%.
    - `recomputeAutoTarget`: rimosso il fattore `* 5` — non necessario perché `rawAttrScore` è già 0–100%.
  * **Implicazioni:** Squadra di 6ª categoria (media attr ~10) → benchmark AUTO ~18–22% (prima: ~50%). La curva crea un gap realistico tra amatori e professionisti. Tutte le funzioni di scoring sono ora end-to-end consistenti.

* **2026-05-26 — Market urgency thresholds dinamici (relativi al benchmark di categoria)**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:**
    - `computeMarketData`: rimossi i threshold fissi (65%/55%). Calcolati dinamicamente: `starterThreshold = targetBenchmark * 0.85`, `backupThreshold = targetBenchmark * 0.70`. Passati nel return object di ogni nodo.
    - `renderMarketPriority`: testo diagnosi aggiornato con valori dinamici: "X% vs min. richiesto Y%".
  * **Implicazioni:** Una squadra di 6ª categoria con benchmark 25% avrà thresholds a ~21% (starter) e ~17% (backup). Una squadra di Serie A con benchmark 75% avrà thresholds a ~64% e ~52%. Niente più false urgenze per squadre di bassa categoria.

* **2026-05-26 — Quality benchmark in scala percentuale (0–100%)**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:**
    - `state.targetBenchmark` default: `12.0` → `60` (scala 0–100%)
    - `getStarsForPlayer`: rimossa conversione `(benchmarkScore / 20) * 100`, usa direttamente `benchmarkScore` come % 
    - `recomputeAutoTarget`: formula `Math.round((totalRaw / count) * 10) / 10` → `Math.round((totalRaw / count) * 5)` per produrre %
    - `updateBenchmarkUI`: display `toFixed(1)` → `Math.round(...) + '%'`
    - Benchmark −/+ handlers: range `5.0–20.0 step 0.5` → `25–100 step 5`
    - LocalStorage migration: valori caricati ≤20 vengono moltiplicati ×5 (backward compat)
  * **Implicazioni:** Il widget mostra ora valori come "60%" anziché "12.0". Le stelle rimangono coerenti. I valori persistiti in vecchio formato vengono automaticamente convertiti.

* **2026-05-26 — Sistema stelle dinamico (FM-style)**
  * **File modificati:** `app.js`, `style.css`
  * **Cosa è stato fatto:**
    - `getStarsForPlayer(absoluteScore, benchmarkScore)`: calcola 1.0–5.0 stelle (0.5 incrementi) in base alla differenza tra score assoluto e benchmark%. Soglie: +15→5★, +8→4.5★, +3→4★, -3→3.5★, -8→3★, -13→2.5★, -18→2★, -23→1.5★, <-23→1★
    - `renderStarsHTML(starValue)`: HTML con ★ pieni, ★ semi-trasparenti (metà), ☆ vuoti
    - `updateActiveNodeInfo`: mostra score% + stelle per il giocatore assegnato al nodo
    - `renderPositionSidebar`: stelle accanto a ogni punteggio nella lista candidati
    - `renderBench`: stelle nella riga del nome di ogni slot bench
    - `renderSquadTable`: stelle accanto al Best Tactical Role (usa rawRoleScore)
    - `refreshStarViews()`: aggiorna active node info, position sidebar e squad table quando il benchmark cambia
  * **Implicazioni:** Le stelle cambiano in tempo reale al variare del Quality widget. Ogni vista mostra stelle coerenti con la stessa scala assoluta.


* **2026-05-26 — Refactoring scala assoluta 0–100%**
  * **File modificati:** `app.js`, `style.css`
  * **Cosa è stato fatto:**
    - `scorePlayerForNode`: formula cambiata da `(raw / targetBenchmark) * 100` a `(raw / 20) * 100`, cap a 100. Il benchmark diventa indicatore passivo.
    - `renderBench`: soglie colore aggiornate (≥70 verde, ≥50 giallo, <50 arancione)
    - Position sidebar: rimosso case `above` (dead code), soglie allineate (≥70 verde, ≥50 giallo)
    - `buildStatBarsHTML`: maxScore fisso a 100, rimosso cap artificiale a 150
    - CSS: rimossa classe `.ppi-pct.above`, `.good` ora usa neon-green
  * **Implicazioni:** Tutti i punteggi sono ora stabili e non oscillano col benchmark. Le soglie market (65/55) erano già assolute. La bench bar, sidebar, market, scout usano tutti la stessa scala.


* **2026-05-26 — Tab Scout & Compare**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. Aggiunto campo `Status` (In Squadra / Obiettivo Mercato) nel modal giocatore → `player.isScoutTarget`
    2. Scout targets esclusi da: roster sidebar, squad table, assign popover, position sidebar, `recomputeAutoTarget`, `computeMarketData`
    3. Nuova tab "Scout & Compare" con layout a due colonne
    4. Colonna sinistra: lista obiettivi con punteggio migliore e click per selezionare
    5. Colonna destra: confronto con analisi nodo, verdetto (5 livelli), selector giocatore rosa, barre stat
    6. `renderScoutTab()` aggiornata da `saveModal()`, `deletePlayer()` e switch tab
    7. `openModal(null, true)` pre-imposta status su "scout"
  * **Implicazioni:** `_selectedScoutId`, `_scoutNodeId`, `_scoutCompareId` come state della tab; `computeMarketData()` chiamata internamente per urgency.


* **2026-05-26 — Bench bar: familiarità, colori score, click interattivo**
  * **File modificati:** `app.js`, `style.css`
  * **Cosa è stato fatto:**
    1. Ogni chip ruolo mostra un pallino colorato con la familiarità del giocatore per quella zona (stessi colori FAM_COLORS usati sui nodi in campo)
    2. Il punteggio % è ora colorato: verde ≥70%, giallo 40–69%, arancione <40%
    3. Click su uno slot della bench apre il modal del giocatore
    4. Hover più visibile sui slot (border cyan + background leggero)
  * **Implicazioni:** `renderBench` ora usa `roleNodeMap` per mappare role→nodo e calcolare familiarità via `getPlayerFamLevel`.


* **2026-05-26 — Auto-ruolo su drag verso cella vuota**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:** Quando un nodo viene trascinato in una cella vuota di zona diversa, se il ruolo corrente non è disponibile nella nuova zona viene automaticamente assegnato il ruolo con il miglior punteggio `rawRoleScore` tra quelli validi per quella zona (filtrando per compatibilità GK/outfield). Se non c'è giocatore assegnato, viene preso il primo ruolo disponibile della zona.
  * **Implicazioni:** Nessun breaking change — logica aggiuntiva solo nel branch `else` del drag `onEnd`.


* **2026-05-26 — v1.0 Initial build**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:** Creazione completa della SPA "FMM Tactical Mastermind & Assistant" in 3 file separati.
  * **Implicazioni:** App completamente offline, dati salvati in localStorage, OCR via Tesseract.js CDN.

* **2026-05-26 — Correzioni post-review**
  * **File modificati:** `index.html`, `style.css`
  * **Cosa è stato fatto:**
    1. Rimosso il pannello "Tactical Prompt" da sidebar destra
    2. Campo allargato da 480px a 600px max-width
    3. Zone invertite: ATT in alto → GK in basso
    4. Toolbar formazione con pulsante "Apply" separato e visibile
    5. Pulsante "+" di aggiunta giocatore direttamente nella sidebar sinistra
    6. Pannello Raccomandazioni spostato nella sidebar destra (sopra i pesi)

* **2026-05-26 — Round 3 fixes**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. Pitch ridimensionato per riempire il viewport (height-driven, flex:1 container)
    2. Riga GK: solo slot centrale (col 2) — forzato in `rowColFromPercent`
    3. Max 11 giocatori in campo — check in tutti i path di assegnazione
    4. DnD fix: `dragleave` con `relatedTarget`, nodi sempre `draggable`, setTimeout per ghost
    5. Role badge cliccabile direttamente sul nodo — apre role picker inline
    6. "Overall" rimpiazzato con "Stars" (select 1-5 stelle)
    7. Font pannelli sidebar aumentato (weights: 0.82rem, context menu: 0.85rem)
    8. Raccomandazioni spostate nella sidebar destra
    9. Posizionamento libero: click ovunque sul campo crea uno slot

* **2026-05-26 — Complete rewrite (v4.0)**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:** Riscrittura completa da zero dei 3 file secondo le specifiche dettagliate fornite dall'utente. Implementati: schema 17 attributi (outfield/GK), sistema familiarità a 5 livelli (colori), griglia tattica 6×5 con zone e ruoli, drag-and-drop nodi + roster, mini-pitch interattivo nel form, cerchi piede sinistro/destro ciclabili, calcolo score ponderato per ruolo, barra Top 3 Raccomandati, OCR Tesseract.js con parser, salva/carica tattica JSON, design glassmorphism scuro fluorescente con font Outfit/Inter.
  * **Implicazioni:** App 100% offline. OCR richiede CDN Tesseract.js. Max 11 giocatori in campo.

* **2026-05-26 — Rimosso modulo OCR**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:** Rimossi tab OCR, script Tesseract.js CDN, tutti gli stili `.ocr-*` e tutte le funzioni OCR da app.js (`bindOCR`, `runOCR`, `parseOCRText`, `renderOCRPreview`, `saveOCRPlayer`, `discardOCR`). L'inserimento giocatori avviene esclusivamente via form manuale.
  * **Implicazioni:** App ora completamente offline senza dipendenze CDN esterne.

* **2026-05-26 — Inversione campo + snap a griglia**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:** (1) Orientamento pitch invertito: ATT in alto (y<15%), GK in basso (y>83%). Tutte le formazioni aggiornate di conseguenza. (2) Rimosso posizionamento libero: i nodi ora si agganciano sempre alla cella griglia più vicina (6×5, GRID_CELLS). GK solo colonna centrale. Mini-pitch e MINI_CELLS allineati alla stessa orientazione. Fix chiave ZONE_ROLES: ST_W/ST_C → ATT_W/ATT_C.
  * **Implicazioni:** Nessuna cella può essere occupata da due nodi contemporaneamente.

* **2026-05-26 — localStorage auto-save**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:**
    1. Aggiunto `saveState()` — serializza `squad`, `nodes`, `weights`, `nextPlayerId`, `nextNodeId` in `localStorage` (chiave `fmm_state_v1`).
    2. Aggiunto `loadState()` — deserializza al caricamento; se non ci sono dati salvati, applica la formazione 4-4-2 di default.
    3. `DOMContentLoaded` ora chiama `loadState()` prima di renderizzare; se il restore riesce, salta `applyFormation`.
    4. `saveState()` viene chiamato dopo ogni mutazione: `saveModal`, `deletePlayer`, drag nodo (onEnd), drag roster (onEnd), assegnazione giocatore al nodo, selezione ruolo, `cycleWeight`, `syncWeightsToRole`, `applyFormation`, `loadTactic`.
    5. Fix bug: `saveModal` referenziava `document.getElementById('f-club')` che non esiste nel DOM → rimosso il campo `club` dall'oggetto player.
  * **Implicazioni:** Squad, formazione e pesi sopravvivono al refresh della pagina. Nessuna dipendenza esterna aggiunta.

* **2026-05-26 — Tab Market (Calciomercato)**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. Aggiunto terzo tab "Market" nella topbar.
    2. Pannello `#tab-market` con layout 2 colonne (`.market-shell`): Priorità di Mercato (sx) + Stato di Copertura (dx).
    3. Colonne a scroll indipendente, zero overflow globale.
    4. `renderMarket()` → `renderMarketPriority()` + `renderMarketCoverage()` basate su `state.nodes` + `state.squad`.
    5. Priorità: urgency ALTA/MEDIA/BASSA in base a slot vuoti o familiarità bassa; badge neon rosso/giallo/verde; best substitute suggerito.
    6. Copertura: raggruppamento per ruolo, titolari assegnati + top-2 riserve non in campo con score %.
    7. CSS: stili market completi coerenti con glassmorphism esistente; responsive (stack verticale sotto 900px).
  * **Implicazioni:** Nessuna dipendenza esterna. `renderMarket()` chiamata al click del tab.

* **2026-05-26 — Market: algoritmo greedy + rendering completo**
  * **File modificati:** `app.js`, `style.css`
  * **Cosa è stato fatto:**
    1. `computeMarketData()` — greedy bipartite matching in 2 fasi: (1) starter esclusivi (score più alto vince il nodo, player rimosso dal pool), (2) migliore riserva non esclusiva dal pool rimanente con familiarità ≥ 2. Urgency: HIGH se starter assente o <65%, MED se riserva assente o <55%, LOW altrimenti.
    2. `renderMarketPriority(results)` — card solo per HIGH/MED, ordinate per gravità. Ogni card: zona+ruolo, badge urgenza colorato, diagnosi testuale, top-3 attributi KEY da ROLE_ATTRS come chip, chip titolare e riserva con mini progress bar.
    3. `renderMarketCoverage(results)` — tutti i ruoli con barre di avanzamento. Ordinate HIGH→MED→LOW. Pallino urgenza colorato.
    4. `maybeRenderMarket()` — helper che re-renderizza il tab Market solo se attivo. Agganciato dopo ogni `saveState()` (cycleWeight, syncWeightsToRole, applyFormation, drag nodo, drag roster, assign player, deletePlayer, saveModal, loadTactic).
    5. CSS: `.mcp-row`, `.mcp-bar`, `.cov-slot`, `.cov-bar-track/fill`, `.key-attr-chip`, `.market-card-title/zone` e relativi modificatori.
  * **Implicazioni:** Market si aggiorna in real-time su ogni mutazione tattica. `nameInitials()` aggiunta come utility. Nessuna regressione sugli altri tab.

* **2026-05-26 — Squad table: posizioni + top 5 attributi + fix filtri**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. Rimossa colonna "Roles" (ruoli tattici), aggiunte colonne "Positions" e "Top 5 Attributes".
    2. `getPlayerPositions(player)` — legge `player.positions`, mappa i key su `MINI_CELLS`, restituisce le etichette (LB, CB, CM, ST…) con livello familiarità ≥ 1, ordinate desc. Chip colorati per livello (fam-1…fam-5).
    3. `getTopAttributes(player, 5)` — top 5 attributi per valore, con colore high/mid/low.
    4. Fix filtro DEF: `derivedMainPos` restituisce 'CB' non 'CD' — corretto con `Set.has()`.
    5. Logica filtri AM: AM wide ('W') solo ATT; AM centre ('AM') sia MID che ATT.
  * **Implicazioni:** Filtri posizione ora corretti per tutti i ruoli.

* **2026-05-26 — Fix familiarità: gate posizioni + moltiplicatore score**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:**
    1. Fix bug critico in `getPlayerFamLevel`: la funzione cercava `player.positions['DEF_C']` ma le posizioni sono salvate come `player.positions['DEF_C_4_1']` (formato `${key}_${r}_${c}`). Ora risolve il MINI_CELL corretto e usa il formato chiave esatto.
    2. Aggiunto `FAM_MULTIPLIER = [0, 0.60, 0.75, 0.88, 0.95, 1.0]` — fam 0 = escluso, fam 1–5 penalità decrescente.
    3. `scorePlayerForNode` ora: (a) legge la familiarity della zona del nodo, (b) restituisce 0 se fam=0, (c) moltiplica il raw score per `FAM_MULTIPLIER[famLevel]`.
    4. `renderRecommended` filtra `score > 0` — solo giocatori che possono giocare in quella zona appaiono.
    5. `openAssignPopover` idem — filtro `score > 0`.
    6. `computeMarketData` (triples): skip esplicito dei giocatori con score=0 prima del matching greedy — impossibile assegnare titolare un giocatore fuori zona.
    7. Fix CSS: `flex-shrink: 0` aggiunto a `.market-card` (era già su `.coverage-row`).
  * **Implicazioni:** Raccomandazioni e Market ora mostrano solo giocatori che hanno almeno fam≥1 per la posizione. Awkward (fam 1) appare ma con score ridotto al 60%.

* **2026-05-26 — Benchmark Ibrido Dinamico + Malus Posizionale Additivo**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. `state` espanso con `autoMode: true` e `targetBenchmark: 12.0`. Persisti in localStorage.
    2. `rawAttrScore(player, node)` — media pesata attributi su scala 0–20, nessuna penalità né normalizzazione. Usata sia per il benchmark che come base dello score.
    3. `scorePlayerForNode` riscritta: `score = clamp((rawAttrScore / targetBenchmark × 100) − FAM_PENALTY[fam], 0, 100)`. Penalità additiva per familiarità: fam0=−50, fam1=−35, fam2=−20, fam3=−10, fam4=−3, fam5=0.
    4. `recomputeAutoTarget()` — greedy leggero (raw score, fam≥1) per trovare i titolari, media dei loro raw score → aggiorna `state.targetBenchmark`. Chiamato da `maybeRenderMarket()` e al boot.
    5. `updateBenchmarkUI()` — aggiorna valore numerico e stato AUTO/MANUAL nel widget.
    6. `bindBenchmarkWidget()` — collega pulsanti Auto / − / +. Click −/+ spegne autoMode; click Auto lo riaccende e ricalcola.
    7. Widget `benchmark-bar` aggiunto in index.html sopra `.market-shell`. Layout `#tab-market` cambiato in `flex-direction: column`.
    8. CSS completo per il widget: glassmorphism ciano, pulsanti touch, indicatore luminoso AUTO.
    9. Backup pool Phase 2: rilassato filtro da `fam≥2` a `fam≥1` (la penalità già discrimina).
  * **Implicazioni:** Il benchmark auto si calcola dai titolari correnti e cambia in real-time. Override manuale con step 0.5 nel range 5–20. Score sempre 0–100%, comparabile tra tutti i nodi indipendentemente dal livello della rosa.

* **2026-05-26 — Benchmark widget spostato nella topbar + ordinamento Market per reparto**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. Widget `benchmark-bar` spostato da `#tab-market` alla `<header class="topbar">` — visibile su tutti e 3 i tab.
    2. Stili aggiornati per la topbar (dimensioni ridotte, separatori laterali, nessuna card).
    3. Rimosso `#tab-market.active { flex-direction: column }` non più necessario.
    4. `nodeGroupOrder(node)` — helper che mappa la zone key al gruppo posizionale (GK=0, DEF=1, MID=2, ATT=3).
    5. Sort in `renderMarketPriority` e `renderMarketCoverage` ora ordina prima per reparto (GK→DEF→MID→ATT), poi per urgency all'interno dello stesso reparto.
    6. Score rimosso il clamp superiore a 100 — score può essere >100% (sopra benchmark). Le barre visive usano `Math.min(score,100)` per non overflow.

* **2026-05-26 — Click su giocatore apre modal + rimozione da slot**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. **Roster sidebar**: click sull'item (non sui pulsanti ✏️/🗑️) → `openModal(player.id)`. I pulsanti icona usano `e.stopPropagation()` quindi non interferiscono.
    2. **Squad table**: riga cliccabile (`cursor:pointer`), click → `openModal`. Pulsante Del usa `stopPropagation`. Rimosso il pulsante "Edit" inline (ora ridondante).
    3. **Nodi sul campo**: aggiunto pulsante `.node-unassign` (×) visibile solo su hover del nodo. Click → `node.playerId = null`, salva stato, ri-renderizza tutto. Nodo e ruolo rimangono intatti.
    4. **Nome giocatore sul nodo**: click → apre modal. `cursor: pointer` + highlight ciano su hover.
    5. **Modal footer**: aggiunto `btn-modal-unassign` ("Remove from Pitch"). Visibile solo quando si edita un giocatore attualmente in campo. Click → disassegna da tutti i nodi e chiude modal.
    6. **CSS**: `.node-unassign` posizionato in alto a destra del nodo, mostrato su `:hover`. Stile rosso coerente con `btn-danger`.
  * **Implicazioni:** Nessun nodo o ruolo viene mai cancellato da queste azioni, solo il `playerId` viene azzerato.

* **2026-05-26 — Click sx/dx sui nodi + sidebar posizione**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. **Click sinistro** sul nodo → `selectNode(node)`: seleziona il nodo, mostra la sidebar "position mode" con tutti i giocatori della rosa ordinati per score per quella posizione.
    2. **Click destro** sul nodo → `openRolePopover(node, el)`: cambia ruolo tattico (comportamento precedente del click sinistro).
    3. **Sidebar destra dual-mode**: `#sidebar-position-panel` (nodo selezionato) e `#sidebar-roster-panel` (default); si escludono a vicenda via `.hidden`.
    4. `renderPositionSidebar(node)`: lista completa giocatori con avatar colorato per familiarità, nome, pos/età, livello fam testuale, score % colorato (above/good/warn/bad), barra mini. Click assegna o disassegna il giocatore dal nodo.
    5. Pulsante ✕ (`btn-deselect-node`) e click su sfondo pitch → `deselectNode()`.
    6. Nodo selezionato mostra ring ciano (`node-selected`).
    7. Variabile `_selectedNode` unifica la selezione; `_activePopoverNode` mantenuto per compatibilità interna role popover.
    8. Dopo cambio ruolo via popover, `renderPositionSidebar` si aggiorna se il nodo è ancora selezionato.
  * **Implicazioni:** Il drag dalla sidebar roster funziona ancora. Il drag da roster assegna al nodo più vicino.

* **2026-05-26 — Formation overview bar: layout pitch-mirror (basso→alto, sx→dx)**
  * **File modificati:** `app.js`, `style.css`
  * **Cosa è stato fatto:** Rimosso lo scroll orizzontale dalla barra. I nodi sono ora raggruppati per reparto (GK/DEF/MID/ATT) in righe separate, ordinate dal basso verso l'alto come sul campo tattico: riga GK in fondo, riga ATT in cima. Dentro ogni riga i card sono ordinati da sinistra a destra per coordinata X del nodo. I card usano `flex:1` e si allargano per riempire la larghezza disponibile. Rimossa la sezione "alt" (miglior alternativo) per compattezza verticale. CSS: rimosso `overflow-x:auto`, aggiunte classi `.overview-row` e `.overview-slots { flex-direction: column }`.

* **2026-05-26 — Fix drag swap + overview bar ordinamento**
  * **File modificati:** `app.js`, `style.css`
  * **Cosa è stato fatto:**
    1. **Bug drag swap**: rimossi i blocchi `fixRole()` dalla logica di drag. Dopo uno swap o uno spostamento su cella vuota, il ruolo del nodo rimane invariato. L'utente ha impostato il ruolo esplicitamente — non deve essere mai sovrascritto dal drag.
    2. **Formation overview bar**: tornata a riga singola orizzontale senza scroll. Ordinamento: `y DESC` (GK in basso sul campo → primo a sinistra nella barra) poi `x ASC` (sinistra→destra dentro ogni livello del campo). CSS: rimosso `flex-direction:column` e la classe `.overview-row`, ripristinato layout a riga singola con `flex:1` sui card.

* **2026-05-26 — Fix drag: ripristino node-swap senza fixRole + ruolo nel cerchio**
  * **File modificati:** `app.js`, `style.css`
  * **Cosa è stato fatto:**
    1. **Fix drag**: il drag sposta l'intero nodo (posizione + ruolo + giocatore). Quando si trascina su un nodo occupato le posizioni si scambiano; su cella vuota il nodo si sposta. Il ruolo viaggia col nodo e non viene mai resettato (`fixRole` rimosso definitivamente). Il bug originale era esclusivamente `fixRole` che sovrascriveva il ruolo con il default della zona.
    2. **Cerchio nodo**: mostra l'abbreviazione del ruolo tattico (es. `CM`, `BPD`, `WB`) invece delle iniziali del giocatore. Il nome rimane nell'etichetta sotto. Rimossa la `.node-role-label` ridondante dall'innerHTML. Per nodi senza ruolo il cerchio mostra `+`. CSS: rimosso `::after { content:'+' }` per i nodi vuoti (ora gestito dal JS).

* **2026-05-26 — Bench bar + fix drag definitivo**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. **Drag fix definitivo**: distinto tra due casi — (a) nodo→nodo occupato: scambia solo `playerId`, posizione e ruolo invariati; (b) nodo→cella vuota: sposta l'intero nodo (posizione + ruolo + giocatore).
    2. **Bench bar**: aggiunta riga sotto `formation-overview` con i top-11 giocatori non in campo. Per ogni giocatore: nome + i 2 migliori ruoli tra quelli usati in formazione con score % puro (senza benchmark né familiarità — `rawRoleScore`). Ordinata per score decrescente del ruolo migliore. Si aggiorna sempre insieme alla formation overview (chiamata in coda a `renderFormationOverview`).
    3. **`rawRoleScore(player, role)`**: helper che calcola la % di fit attributi per un ruolo (0–100%) usando i pesi di ROLE_ATTRS, senza benchmark né penalità fam. Usata solo per il bench.

* **2026-05-26 — Rimossa formation overview bar**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:** Rimosso il div `formation-overview` dall'HTML. `renderFormationOverview()` ora è uno stub che chiama solo `renderBench()` — tutti i call site esistenti continuano a funzionare senza modifiche. CSS `.formation-overview`, `.overview-slots`, `.overview-slot`, `.ov-*` rimossi.

* **2026-05-27 — Nuova tab Squad Plan + refactor Market/Scout su fonte dati esplicita**
  * **File modificati:** `app.js`, `index.html`, `style.css`
  * **Cosa è stato fatto:**
    - Nuovo `state.plan = {}` — `{ [nodeId]: { starter: id|null, bench: [], third: [], youth: [] } }`.
    - Persistito in localStorage e incluso in export/import.
    - Nuova tab "Squad Plan": griglia di card, una per nodo della formazione, ordinate GK→DEF→DM→CM→AM→ATT.
    - Ogni card ha 4 fasce: Titolare (max 1, esclusivo globale), Panchina, Terza Fascia, Giovani (multi-nodo liberi).
    - Popover di assegnazione: giocatori ordinati per `rawRoleScore`, ineligibili visibili ma disabilitati con motivo.
    - Guard regole: Titolare esclusivo globalmente (non assegnabile altrove), una sola fascia per nodo per giocatore.
    - `computeMarketData()` riscritta: usa `state.plan` invece del greedy bipartite matching.
    - `recomputeAutoTarget()`: usa i titolari del plan quando configurato; fallback greedy se plan vuoto.
    - `renderMarket()`: mostra messaggio "configura Squad Plan" se plan non configurato.
    - `applyFormation()`: chiama `cleanOrphanPlan()` per eliminare entries di nodi rimossi.
  * **Implicazioni:** Market e Scout ora riflettono le scelte tattiche esplicite dell'utente invece di un calcolo automatico. Il benchmark AUTO usa i titolari del plan. Se il plan è vuoto, Market mostra un messaggio orientativo.

* **2026-05-27 — Fix bug scout verdict: target più debole di starter+backup segnalato come PRIORITARIO**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:**
    - `computeScoutVerdict` riscritta con logica a 4 gate mutuamente esclusivi che confronta `targetScore` sia con `starterScore` che con `backupScore` (entrambi già presenti in `nodeMarket`).
    - Gate 1: `targetScore < backupMin` → INSUFFICIENTE (invariato).
    - Gate 2: `targetScore <= starterScore && targetScore <= backupScore` → SCONSIGLIATO (ridondante) — fix del bug: un target più debole di entrambi non può mai essere consigliato.
    - Gate 3: `targetScore <= starterScore && targetScore > backupScore` → CONSIGLIATO (profondità) se urgency=high/med, altrimenti SCONSIGLIATO.
    - Gate 4: `targetScore > starterScore` → PRIORITARIO se urgency=high, altrimenti UPGRADE.
  * **Implicazioni:** Caso concreto del bug: target 22%, starter 28%, backup 23% → ora correttamente SCONSIGLIATO invece di PRIORITARIO. La logica è ora deterministica e non può produrre verdetti positivi per giocatori più deboli di quelli già in rosa.

* **2026-05-27 — Fix convertAttributeToQuality(0) + analisi incoerenze ROLE_ATTRS**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:**
    - Aggiunto guard `if (val <= 0) return 0;` come primo check in `convertAttributeToQuality`. Prima, un attributo non impostato (valore undefined → 0) restituiva 1% invece di 0%, contribuendo silenziosamente al punteggio.
    - Analisi completa incoerenze: tutti i 35 ruoli in ROLE_ATTRS hanno attributi validi e corrispondenti alle pool ATTRS_GK/ATTRS_OUTFIELD. Nessun typo, nessun mismatch.
    - `Leadership` confermato come attributo deliberatamente tracciato ma non assegnato a nessun ruolo (scelta intenzionale).
    - Poacher vs Advanced Forward: KEY+IMP identici, solo SEC diversi — comportamento atteso da database FM Mobile.
  * **Implicazioni:** Giocatori con attributi non compilati ora scorano correttamente 0 su quegli attributi invece di 1.

* **2026-05-27 — Squad Plan: lista candidati inline + scoring con familiarità**
  * **File modificati:** `app.js`, `style.css`
  * **Cosa è stato fatto:**
    - Aggiunta `getEffectiveFamLevel(player, node)`: per zone wide prende il MAX tra lato sinistro e destro (un LW può coprire anche il nodo RW e viceversa).
    - Aggiunta `squadPlanScore(player, node)`: score fam-weighted (rawRoleScore − FAM_PENALTY[effectiveFam]), ritorna null se il giocatore non ha familiarità nella zona (fam=0 → non eleggibile).
    - `renderSpPanel` completamente riscritta: non usa più tier chips + popover. Mostra una lista inline di tutti i candidati eleggibili ordinata per score decrescente. Ogni riga: dot colorato familiarity, nome, età, livello fam testuale, score %, pulsanti T/P/3/G per assegnare (o badge tier + × se già assegnato, o 🔒 se titolare altrove).
    - `openSpPopover`/`closeSpPopover`/`bindSpPopover` ridotti a no-op (popover deprecato).
    - `computeMarketData`: starter e backup ora usano `scorePlayerForNode` (fam-weighted) invece di `rawRoleScore` (solo attributi).
    - `recomputeAutoTarget` (branch plan): usa `scorePlayerForNode(player, node)` invece di `rawRoleScore` per il benchmark da starters.
    - CSS: aggiunte classi `.sp-candidates-list`, `.sp-candidate-row`, `.sp-cand--*` (varianti colore per tier), `.sp-cand-fam`, `.sp-cand-info/name/meta/score/actions`, `.sp-tier-btns`, `.sp-tier-btn`, `.sp-assigned-badge`, `.sp-candidate-remove`, `.sp-candidate-blocked`.
  * **Implicazioni:** La familiarità ora influenza tutti i calcoli (Squad Plan, Market urgency, benchmark). Un giocatore Awkward in un ruolo mostrerà uno score molto ridotto rispetto a Natural, in tutte le viste.

* **2026-05-27 — Squad Plan UX polish + full English pass (automated prompt batch)**
  * **File modificati:** `app.js`, `style.css`, `index.html`
  * **Cosa è stato fatto:**
    - `SP_TIERS`: label `'3rd Tier'` → `'Third Choice'`
    - `renderSpPanel`: tooltip Youth disabled → `'not eligible (over 23 years old)'`
    - `renderScoutComparison`: `'Role analysed'` → `'Analyzed role'` (2 occorrenze)
    - `openAssignPopover`: aggiunto filtro `getPlayerFamLevel(p, zoneKey, node.x) >= 1` per escludere giocatori senza familiarità (1C)
    - `canAssignToTier`: messaggi rewording in inglese
    - CSS 2A: `.sp-cand-actions` → `justify-content: flex-end; width: 132px` (rimosso flex-shrink)
    - CSS 2B: `.sp-tier-btns` width 122px→132px; `.sp-tier-btn` padding 4px 6px→3px 4px, height 26px→24px, font-size 10px→9.5px
    - CSS 2C: `.sp-legend-chip` da pill a dot indicator con `::before` pseudo-element (8px cerchio colorato)
    - HTML 3A: pitch header `'Formazione'`→`'Formation'`, hint tradotto in inglese
  * **Implicazioni:** Tutti i calcoli usano familiarity lato-specifica. UI completamente in inglese. Legend chip più leggibile.

## 2. In Corso / Da Fare Immediatamente

* [ ] Test funzionale end-to-end
* **Dipendenze/Rischi:** Nessuna dipendenza esterna.

* **2026-05-28 — Fix: deletePlayer non puliva state.plan**
  * **File modificati:** `app.js`
  * **Cosa è stato fatto:** Aggiunta pulizia di `state.plan` in `deletePlayer`: `starter` azzerato se coincide con l'id eliminato, filtro su `bench`/`third`/`youth`. Aggiunta chiamata `renderSquadPlan()` tra i re-render post-delete.
  * **Implicazioni:** Eliminando un giocatore, il suo slot nel Squad Plan viene liberato correttamente e il pannello si aggiorna immediatamente.

* **2026-05-26 — Formation Overview Bar + Squad table refactor**
  * **File modificati:** `index.html`, `style.css`, `app.js`
  * **Cosa è stato fatto:**
    1. **Formation Overview Bar**: sostituita la `recommended-bar` ("Top Picks per Position") con una nuova barra full-width a scorrimento orizzontale (`formation-overview`). Ogni card rappresenta un nodo della formazione, ordinata GK→DEF→MID→ATT. Ogni card mostra: badge ruolo abbreviato, etichetta zona, giocatore assegnato (verde + barra neon) con score%, oppure miglior candidato se non assegnato; se assegnato, mostra anche il miglior alternativo sotto. Click su card → seleziona nodo (stessa logica click su pitch). Card selezionata evidenziata con bordo ciano.
    2. **`renderFormationOverview()`**: sostituisce integralmente `renderRecommended()`. Tutti i 15+ call site aggiornati con replace_all.
    3. **`getBestTacticalRole(player)`**: calcola il ruolo tattico ottimale per un giocatore su puro score attributi (no fam, no benchmark) iterando tutti i `ROLE_ATTRS` compatibili col tipo (GK/outfield).
    4. **`playerGroupOrder(player)`**: mappa il giocatore al gruppo posizionale (0=GK, 1=DEF, 2=MID, 3=ATT) basandosi su `player.mainPos`.
    5. **Squad table**: rimossa colonna "Type" (GK/OUT) e "Best Pos." (mainPos), aggiunta colonna "Best Tactical Role" con chip `.best-role-chip` ciano. Squad ordinata GK→DEF→MID→ATT prima del rendering.
  * **Implicazioni:** `renderRecommended` eliminata completamente. Stili `.recommended-bar`, `.rec-*` rimossi dal CSS e sostituiti con `.formation-overview`, `.overview-slot`, `.ov-*`.

## 3. Backlog / Modifiche Future Pianificate

* [ ] Da definire con l'utente dopo il primo test funzionale
