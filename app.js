/* ═══════════════════════════════════════════════════════════════════════════
   FMM Tactical Mastermind — app.js
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── DATA DEFINITIONS ──────────────────────────────────────────────────── */

const ATTRS_OUTFIELD = {
  technical: ['Aerial','Crossing','Dribbling','Passing','Shooting','Tackling','Technique'],
  mental:    ['Aggression','Creativity','Decisions','Leadership','Movement','Positioning','Teamwork'],
  physical:  ['Pace','Stamina','Strength']
};

const ATTRS_GK = {
  technical: ['Aerial','Agility','Communication','Handling','Kicking','Reflexes','Technique'],
  mental:    ['Aggression','Creativity','Decisions','Leadership','Throwing','Positioning','Teamwork'],
  physical:  ['Pace','Stamina','Strength']
};

const FAM_LABELS = ['—','Awkward','Sufficient','Competent','Accomplished','Natural'];
const FAM_COLORS = ['#2c3540','#ff6600','#ffdf00','#ccff00','#008f11','#39ff14'];

/* ── Tactical grid zones (row, col based) ─────────────────────────────────
   Rows (Y %):  GK 0-15 | DEF 15-32 | DM 32-49 | CM 49-66 | AM 66-83 | ATT 83-100
   Cols (X %):  1=0-20 | 2=20-40 | 3=40-60 | 4=60-80 | 5=80-100
*/
const ZONE_ROLES = {
  GK:  { label:'GK',  roles:['Goalkeeper','Sweeper Keeper'] },
  // DEF
  DEF_W: { label:'DEF Wide', roles:['Full-Back','Defensive Full-Back','Inverted Full-Back','Wing-Back','Inverted Wing-Back'] },
  DEF_C: { label:'DEF Centre', roles:['Central Defender','Ball-Playing Defender','No-Nonsense Centre-Back','Wide Centre-Back','Sweeper','Libero'] },
  // DM
  DM_W:{ label:'DM Wide',   roles:['Wing-Back','Inverted Wing-Back'] },
  DM_C:{ label:'DM Centre', roles:['Defensive Midfielder','Deep-Lying Playmaker','Anchor','Ball-Winning Midfielder','Roaming Playmaker','Box-to-Box Midfielder'] },
  // CM
  CM_W:{ label:'CM Wide',   roles:['Wide Midfielder','Winger','Defensive Winger','Inverted Winger'] },
  CM_C:{ label:'CM Centre', roles:['Central Midfielder','Deep-Lying Playmaker','Anchor','Ball-Winning Midfielder','Box-to-Box Midfielder','Advanced Playmaker','Roaming Playmaker'] },
  // AM
  AM_W:{ label:'AM Wide',   roles:['Winger','Inside Forward','Advanced Playmaker','Inverted Winger'] },
  AM_C:{ label:'AM Centre', roles:['Attacking Midfielder','Advanced Playmaker','Trequartista','Shadow Striker'] },
  // ATT
  ATT_W:{ label:'FWD Wide',  roles:['Inside Forward','Advanced Forward','Pressing Forward'] },
  ATT_C:{ label:'FWD Centre',roles:['Poacher','Target Forward','Deep-Lying Forward','Advanced Forward','Complete Forward','Pressing Forward','Trequartista'] },
};

/* Role attribute tiers — key(1.0) | imp(0.6) | sec(0.2). All others = 0.0 */
const ROLE_ATTRS = {
  /* ── GOALKEEPERS ──────────────────────────────────────────────────────── */
  'Goalkeeper': {
    key: ['Reflexes', 'Handling', 'Aerial'],
    imp: ['Agility', 'Throwing', 'Kicking'],
    sec: ['Communication', 'Decisions', 'Positioning'],
  },
  'Sweeper Keeper': {
    key: ['Reflexes', 'Handling', 'Technique'],
    imp: ['Kicking', 'Pace', 'Aerial'],
    sec: ['Agility', 'Decisions', 'Throwing'],
  },

  /* ── CENTRAL DEFENDERS ────────────────────────────────────────────────── */
  'Central Defender': {
    key: ['Tackling', 'Positioning', 'Aerial'],
    imp: ['Strength', 'Decisions', 'Teamwork'],
    sec: ['Pace', 'Stamina', 'Passing'],
  },
  'Ball-Playing Defender': {
    key: ['Tackling', 'Passing', 'Decisions'],
    imp: ['Positioning', 'Dribbling', 'Technique'],
    sec: ['Strength', 'Aerial', 'Pace'],
  },
  'No-Nonsense Centre-Back': {
    key: ['Tackling', 'Strength', 'Aerial'],
    imp: ['Positioning', 'Decisions', 'Aggression'],
    sec: ['Teamwork', 'Stamina', 'Pace'],
  },
  'Wide Centre-Back': {
    key: ['Tackling', 'Positioning', 'Passing'],
    imp: ['Decisions', 'Pace', 'Crossing'],
    sec: ['Strength', 'Stamina', 'Aerial'],
  },
  'Sweeper': {
    key: ['Positioning', 'Tackling', 'Decisions'],
    imp: ['Pace', 'Strength', 'Aerial'],
    sec: ['Teamwork', 'Stamina', 'Passing'],
  },
  'Libero': {
    key: ['Creativity', 'Decisions', 'Movement'],
    imp: ['Shooting', 'Pace', 'Passing'],
    sec: ['Tackling', 'Positioning', 'Technique'],
  },

  /* ── FULL-BACKS & WING-BACKS ──────────────────────────────────────────── */
  'Full-Back': {
    key: ['Tackling', 'Positioning', 'Pace'],
    imp: ['Decisions', 'Passing', 'Crossing'],
    sec: ['Stamina', 'Teamwork', 'Strength'],
  },
  'Defensive Full-Back': {
    key: ['Tackling', 'Positioning', 'Decisions'],
    imp: ['Pace', 'Strength', 'Aerial'],
    sec: ['Teamwork', 'Stamina', 'Passing'],
  },
  'Inverted Full-Back': {
    key: ['Tackling', 'Positioning', 'Passing'],
    imp: ['Decisions', 'Strength', 'Pace'],
    sec: ['Teamwork', 'Aerial', 'Stamina'],
  },
  'Wing-Back': {
    key: ['Crossing', 'Pace', 'Stamina'],
    imp: ['Positioning', 'Dribbling', 'Passing'],
    sec: ['Tackling', 'Technique', 'Movement'],
  },
  'Inverted Wing-Back': {
    key: ['Positioning', 'Passing', 'Decisions'],
    imp: ['Tackling', 'Pace', 'Technique'],
    sec: ['Stamina', 'Teamwork', 'Dribbling'],
  },

  /* ── DEFENSIVE MIDFIELDERS ────────────────────────────────────────────── */
  'Defensive Midfielder': {
    key: ['Tackling', 'Positioning', 'Decisions'],
    imp: ['Strength', 'Passing', 'Teamwork'],
    sec: ['Stamina', 'Technique', 'Pace'],
  },
  'Anchor': {
    key: ['Positioning', 'Tackling', 'Strength'],
    imp: ['Decisions', 'Teamwork', 'Aggression'],
    sec: ['Passing', 'Stamina', 'Aerial'],
  },
  'Ball-Winning Midfielder': {
    key: ['Tackling', 'Strength', 'Aggression'],
    imp: ['Positioning', 'Decisions', 'Stamina'],
    sec: ['Teamwork', 'Aerial', 'Passing'],
  },
  'Deep-Lying Playmaker': {
    key: ['Passing', 'Creativity', 'Decisions'],
    imp: ['Movement', 'Technique', 'Teamwork'],
    sec: ['Stamina', 'Positioning', 'Pace'],
  },
  'Roaming Playmaker': {
    key: ['Creativity', 'Passing', 'Movement'],
    imp: ['Decisions', 'Shooting', 'Teamwork'],
    sec: ['Stamina', 'Technique', 'Pace'],
  },
  'Box-to-Box Midfielder': {
    key: ['Stamina', 'Tackling', 'Passing'],
    imp: ['Movement', 'Positioning', 'Decisions'],
    sec: ['Strength', 'Pace', 'Shooting'],
  },

  /* ── WIDE MIDFIELDERS & WINGERS ───────────────────────────────────────── */
  'Wide Midfielder': {
    key: ['Passing', 'Positioning', 'Decisions'],
    imp: ['Movement', 'Tackling', 'Teamwork'],
    sec: ['Crossing', 'Stamina', 'Pace'],
  },
  'Winger': {
    key: ['Crossing', 'Dribbling', 'Pace'],
    imp: ['Movement', 'Decisions', 'Technique'],
    sec: ['Passing', 'Stamina', 'Creativity'],
  },
  'Defensive Winger': {
    key: ['Tackling', 'Positioning', 'Crossing'],
    imp: ['Passing', 'Decisions', 'Stamina'],
    sec: ['Pace', 'Teamwork', 'Technique'],
  },
  'Inverted Winger': {
    key: ['Dribbling', 'Passing', 'Movement'],
    imp: ['Positioning', 'Decisions', 'Technique'],
    sec: ['Pace', 'Stamina', 'Creativity'],
  },

  /* ── CENTRAL MIDFIELDERS ──────────────────────────────────────────────── */
  'Central Midfielder': {
    key: ['Passing', 'Decisions', 'Teamwork'],
    imp: ['Stamina', 'Technique', 'Positioning'],
    sec: ['Creativity', 'Tackling', 'Movement'],
  },

  /* ── ATTACKING MIDFIELDERS ────────────────────────────────────────────── */
  'Attacking Midfielder': {
    key: ['Movement', 'Passing', 'Decisions'],
    imp: ['Technique', 'Creativity', 'Shooting'],
    sec: ['Dribbling', 'Pace', 'Stamina'],
  },
  'Advanced Playmaker': {
    key: ['Passing', 'Creativity', 'Decisions'],
    imp: ['Movement', 'Technique', 'Dribbling'],
    sec: ['Pace', 'Stamina', 'Teamwork'],
  },
  'Inside Forward': {
    key: ['Shooting', 'Dribbling', 'Pace'],
    imp: ['Movement', 'Decisions', 'Passing'],
    sec: ['Technique', 'Creativity', 'Stamina'],
  },
  'Trequartista': {
    key: ['Creativity', 'Decisions', 'Movement'],
    imp: ['Shooting', 'Pace', 'Technique'],
    sec: ['Strength', 'Dribbling', 'Aerial'],
  },
  'Shadow Striker': {
    key: ['Shooting', 'Movement', 'Pace'],
    imp: ['Creativity', 'Decisions', 'Technique'],
    sec: ['Passing', 'Stamina', 'Teamwork'],
  },

  /* ── FORWARDS ─────────────────────────────────────────────────────────── */
  'Poacher': {
    key: ['Shooting', 'Movement', 'Pace'],
    imp: ['Decisions', 'Technique', 'Dribbling'],
    sec: ['Strength', 'Aerial', 'Teamwork'],
  },
  'Advanced Forward': {
    key: ['Shooting', 'Movement', 'Pace'],
    imp: ['Decisions', 'Technique', 'Dribbling'],
    sec: ['Passing', 'Strength', 'Aerial'],
  },
  'Deep-Lying Forward': {
    key: ['Passing', 'Decisions', 'Creativity'],
    imp: ['Movement', 'Technique', 'Shooting'],
    sec: ['Strength', 'Dribbling', 'Teamwork'],
  },
  'Target Forward': {
    key: ['Strength', 'Aerial', 'Teamwork'],
    imp: ['Movement', 'Shooting', 'Positioning'],
    sec: ['Decisions', 'Passing', 'Stamina'],
  },
  'Complete Forward': {
    key: ['Shooting', 'Strength', 'Pace'],
    imp: ['Movement', 'Decisions', 'Creativity'],
    sec: ['Aerial', 'Technique', 'Passing'],
  },
  'Pressing Forward': {
    key: ['Tackling', 'Strength', 'Teamwork'],
    imp: ['Movement', 'Decisions', 'Stamina'],
    sec: ['Shooting', 'Aggression', 'Pace'],
  },
};

/* Preset formations — all positions snap to GRID_CELLS (ATT top, GK bottom) */
const FORMATIONS = {
  '4-4-2': [
    {x:50,y:91},
    {x:10,y:74},{x:30,y:74},{x:70,y:74},{x:90,y:74},
    {x:10,y:41},{x:30,y:41},{x:70,y:41},{x:90,y:41},
    {x:30,y:8},{x:70,y:8}
  ],
  '4-3-3': [
    {x:50,y:91},
    {x:10,y:74},{x:30,y:74},{x:70,y:74},{x:90,y:74},
    {x:30,y:41},{x:50,y:41},{x:70,y:41},
    {x:10,y:8},{x:50,y:8},{x:90,y:8}
  ],
  '4-2-3-1': [
    {x:50,y:91},
    {x:10,y:74},{x:30,y:74},{x:70,y:74},{x:90,y:74},
    {x:30,y:58},{x:70,y:58},
    {x:10,y:24},{x:50,y:24},{x:90,y:24},
    {x:50,y:8}
  ],
  '3-5-2': [
    {x:50,y:91},
    {x:30,y:74},{x:50,y:74},{x:70,y:74},
    {x:10,y:41},{x:30,y:41},{x:50,y:41},{x:70,y:41},{x:90,y:41},
    {x:30,y:8},{x:70,y:8}
  ],
  '3-4-3': [
    {x:50,y:91},
    {x:30,y:74},{x:50,y:74},{x:70,y:74},
    {x:10,y:41},{x:30,y:41},{x:70,y:41},{x:90,y:41},
    {x:10,y:8},{x:50,y:8},{x:90,y:8}
  ],
  '5-3-2': [
    {x:50,y:91},
    {x:10,y:74},{x:30,y:74},{x:50,y:74},{x:70,y:74},{x:90,y:74},
    {x:30,y:41},{x:50,y:41},{x:70,y:41},
    {x:30,y:8},{x:70,y:8}
  ],
  '4-5-1': [
    {x:50,y:91},
    {x:10,y:74},{x:30,y:74},{x:70,y:74},{x:90,y:74},
    {x:10,y:41},{x:30,y:41},{x:50,y:41},{x:70,y:41},{x:90,y:41},
    {x:50,y:8}
  ],
  '4-1-4-1': [
    {x:50,y:91},
    {x:10,y:74},{x:30,y:74},{x:70,y:74},{x:90,y:74},
    {x:50,y:58},
    {x:10,y:41},{x:30,y:41},{x:70,y:41},{x:90,y:41},
    {x:50,y:8}
  ],
};

/* ─── STATE ─────────────────────────────────────────────────────────────── */
let state = {
  squad:   [],          // Array of player objects
  nodes:   [],          // [{id, x, y, role, playerId}]
  weights: {},          // { attrName: 0.0|0.2|0.6|1.0 }
  plan:    {},          // { [nodeId]: { starter: id|null, bench: [], third: [], youth: [] } }
  activeNodeId: null,
  nextPlayerId: 1,
  nextNodeId:   1,
  editingPlayerId: null,
  editingNodeId:   null,
  autoMode:        true,   // benchmark auto-computed from starters
  targetBenchmark: 60,      // squad quality threshold (0–100% scale)
};

/* ─── LOCALSTORAGE PERSISTENCE ──────────────────────────────────────────── */
const LS_KEY = 'fmm_state_v1';

function saveState() {
  const data = {
    squad:           state.squad,
    nodes:           state.nodes,
    weights:         state.weights,
    plan:            state.plan,
    nextPlayerId:    state.nextPlayerId,
    nextNodeId:      state.nextNodeId,
    autoMode:        state.autoMode,
    targetBenchmark: state.targetBenchmark,
  };
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (_) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.squad)                         state.squad            = data.squad;
    if (data.nodes)                         state.nodes            = data.nodes;
    if (data.weights)                       state.weights          = data.weights;
    if (data.plan)                          state.plan             = data.plan;
    if (data.nextPlayerId)                  state.nextPlayerId     = data.nextPlayerId;
    if (data.nextNodeId)                    state.nextNodeId       = data.nextNodeId;
    if (data.autoMode        !== undefined) state.autoMode         = data.autoMode;
    if (data.targetBenchmark !== undefined) state.targetBenchmark  = data.targetBenchmark <= 20 ? data.targetBenchmark * 5 : data.targetBenchmark;
    return true;
  } catch (_) { return false; }
}

/* ─── INIT ──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initWeights();       // populate defaults first
  buildMiniPitch();
  bindTabs();
  bindModal();
  bindFormation();
  bindSquadPage();
  bindFootCircles();
  bindTypeToggle();
  buildAttrInputs('outfield');

  bindBenchmarkWidget();
  bindSpPopover();

  const restored = loadState();
  if (!restored) {
    applyFormation('4-4-2');   // fresh start: default formation
  } else {
    buildWeightControls();     // re-render with loaded weights
    renderNodes();
  }
  recomputeAutoTarget();
  updateBenchmarkUI();
  renderSquadRoster();
  renderFormationOverview();
});

/* ─── WEIGHTS ───────────────────────────────────────────────────────────── */
const WEIGHT_CYCLE = [1.0, 0.6, 0.2, 0.0];
const WEIGHT_LABELS = { '1':'KEY', '0.6':'IMP', '0.2':'SEC', '0':'—' };

function initWeights() {
  const all = [...ATTRS_OUTFIELD.technical,...ATTRS_OUTFIELD.mental,...ATTRS_OUTFIELD.physical,
               ...ATTRS_GK.technical,...ATTRS_GK.mental];
  const unique = [...new Set(all)];
  unique.forEach(a => { state.weights[a] = 0.6; });
}

function buildWeightControls() {
  const all = [...new Set([
    ...ATTRS_OUTFIELD.technical,...ATTRS_OUTFIELD.mental,...ATTRS_OUTFIELD.physical
  ])];
  const container = document.getElementById('weight-controls');
  container.innerHTML = '';
  all.forEach(attr => {
    const w = state.weights[attr] ?? 0.6;
    const div = document.createElement('div');
    div.className = 'weight-item';
    div.innerHTML = `
      <span class="weight-attr-name">${attr}</span>
      <span class="weight-chip" data-attr="${attr}" data-w="${w}">${WEIGHT_LABELS[String(w)]}</span>`;
    const chip = div.querySelector('.weight-chip');
    chip.addEventListener('click', () => cycleWeight(chip, attr));
    container.appendChild(div);
  });
}

function cycleWeight(chip, attr) {
  const cur  = state.weights[attr] ?? 0.0;
  const idx  = WEIGHT_CYCLE.indexOf(cur);
  const next = WEIGHT_CYCLE[(idx >= 0 ? idx + 1 : 0) % WEIGHT_CYCLE.length];
  state.weights[attr] = next;
  chip.dataset.w = String(next);
  chip.textContent = WEIGHT_LABELS[String(next)];
  renderFormationOverview();
  saveState();
  maybeRenderMarket();
}

function syncWeightsToRole(role) {
  const tiers = ROLE_ATTRS[role];
  // Reset tutto a 0
  Object.keys(state.weights).forEach(a => { state.weights[a] = 0.0; });
  if (tiers) {
    tiers.key.forEach(a => { state.weights[a] = 1.0; });
    tiers.imp.forEach(a => { state.weights[a] = 0.6; });
    tiers.sec.forEach(a => { state.weights[a] = 0.2; });
  }
  buildWeightControls();
  renderFormationOverview();
  saveState();
  maybeRenderMarket();
}

/* ─── TABS ──────────────────────────────────────────────────────────────── */
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'squad')       renderSquadTable();
      if (btn.dataset.tab === 'squad-plan')  renderSquadPlan();
      if (btn.dataset.tab === 'market')      renderMarket();
      if (btn.dataset.tab === 'scout')       renderScoutTab();
    });
  });
}

/* ─── FORMATION ─────────────────────────────────────────────────────────── */
function bindFormation() {
  document.getElementById('btn-save-tactic').addEventListener('click', saveTactic);
  document.getElementById('btn-load-tactic').addEventListener('click', loadTactic);
  document.getElementById('btn-weights-default').addEventListener('click', () => {
    const role = _selectedNode?.role;
    if (role) {
      syncWeightsToRole(role);   // già chiama buildWeightControls + renderFormationOverview + saveState
    }
  });
}

function applyFormation(key) {
  const positions = FORMATIONS[key];
  if (!positions) return;
  state.nodes = positions.map((pos) => {
    const key   = getZoneKey(pos.x, pos.y);
    const roles = ZONE_ROLES[key]?.roles || [];
    return {
      id:       state.nextNodeId++,
      x:        pos.x,
      y:        pos.y,
      role:     roles[0] || null,
      playerId: null,
    };
  });
  cleanOrphanPlan(state.nodes.map(n => n.id));
  renderNodes();
  renderFormationOverview();
  saveState();
  maybeRenderMarket();
}

/* ─── ZONE DETECTION ────────────────────────────────────────────────────── */
function getZoneKey(x, y) {
  const row = y < 15 ? 'ATT'
            : y < 32 ? 'AM'
            : y < 49 ? 'CM'
            : y < 66 ? 'DM'
            : y < 83 ? 'DEF'
            : 'GK';
  const col = x < 20 ? 1
            : x < 40 ? 2
            : x < 60 ? 3
            : x < 80 ? 4 : 5;

  if (row === 'GK') return 'GK';
  const isWide = col === 1 || col === 5;
  return `${row}_${isWide ? 'W' : 'C'}`;
}

/* Grid cells: 6 rows (ATT→GK top→bottom) × 5 cols. GK row = centre only. */
const GRID_ROW_Y   = [8, 24, 41, 58, 74, 91];
const GRID_COL_X   = [10, 30, 50, 70, 90];
const GRID_ROW_KEY = ['ATT','AM','CM','DM','DEF','GK'];

const GRID_CELLS = [];
for (let r = 0; r < 6; r++) {
  for (let c = 0; c < 5; c++) {
    if (GRID_ROW_KEY[r] === 'GK' && c !== 2) continue;
    GRID_CELLS.push({ r, c, x: GRID_COL_X[c], y: GRID_ROW_Y[r] });
  }
}

function snapToGrid(dropX, dropY, excludeNodeId) {
  const occupied = new Set(
    state.nodes
      .filter(n => n.id !== excludeNodeId)
      .map(n => `${n.x}_${n.y}`)
  );
  let best = null, minDist = Infinity;
  GRID_CELLS.forEach(cell => {
    if (occupied.has(`${cell.x}_${cell.y}`)) return;
    const d = Math.hypot(cell.x - dropX, cell.y - dropY);
    if (d < minDist) { minDist = d; best = cell; }
  });
  return best;
}

function getRolesForNode(node) {
  const key = getZoneKey(node.x, node.y);
  return ZONE_ROLES[key]?.roles || [];
}

/* ─── RENDER NODES ──────────────────────────────────────────────────────── */
function renderNodes() {
  const container = document.getElementById('pitch-nodes');
  container.innerHTML = '';
  state.nodes.forEach(node => {
    const player = state.squad.find(p => p.id === node.playerId);
    const el = document.createElement('div');
    el.className = 'player-node' + (player ? '' : ' node-empty');
    el.dataset.nodeId = node.id;
    el.style.left = node.x + '%';
    el.style.top  = node.y + '%';

    let famClass = 'fam-0';
    if (player && node.role) {
      const key = getZoneKey(node.x, node.y);
      const famLevel = getPlayerFamLevel(player, key, node.x);
      famClass = 'fam-' + famLevel;
    }

    // Circle shows the tactical role abbreviation (most important info at a glance)
    const circleLabel = node.role ? shortRole(node.role) : '+';

    el.innerHTML = `
      <div class="node-circle ${famClass}">${circleLabel}</div>
      <div class="node-name-label">${player ? truncate(player.name,9) : ''}</div>
      ${player ? `<button class="node-unassign" title="Remove player from slot">&times;</button>` : ''}
    `;

    makeDraggableNode(el, node);

    if (player) {
      // × — rimuove il giocatore dallo slot, mantiene il nodo e il ruolo
      el.querySelector('.node-unassign').addEventListener('click', e => {
        e.stopPropagation();
        node.playerId = null;
        saveState(); maybeRenderMarket();
        renderNodes(); renderSquadRoster(); renderFormationOverview();
      });
      // click sul nome → apre modal giocatore
      el.querySelector('.node-name-label').addEventListener('click', e => {
        e.stopPropagation();
        openModal(player.id);
      });
    }

    // Right click → change tactical role
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openRolePopover(node, el);
    });

    container.appendChild(el);
  });
}

function truncate(str, n) { return str.length > n ? str.slice(0,n)+'…' : str; }
function shortRole(role) {
  const map = {
    'Goalkeeper':'GK','Sweeper Keeper':'SK','Full-Back':'FB','Defensive Full-Back':'DFB',
    'Inverted Full-Back':'IFB','Wing-Back':'WB','Inverted Wing-Back':'IWB',
    'Central Defender':'CD','Ball-Playing Defender':'BPD','No-Nonsense Centre-Back':'NCB',
    'Wide Centre-Back':'WCB','Sweeper':'SW','Libero':'LIB',
    'Defensive Midfielder':'DM','Deep-Lying Playmaker':'DLP','Anchor':'AN',
    'Ball-Winning Midfielder':'BWM','Roaming Playmaker':'RP','Box-to-Box Midfielder':'B2B',
    'Wide Midfielder':'WM','Winger':'W','Defensive Winger':'DW','Inverted Winger':'IW',
    'Central Midfielder':'CM','Advanced Playmaker':'AP','Attacking Midfielder':'AM',
    'Trequartista':'TQ','Shadow Striker':'SS','Inside Forward':'IF',
    'Advanced Forward':'AF','Pressing Forward':'PF','Poacher':'P',
    'Target Forward':'TF','Deep-Lying Forward':'DLF','Complete Forward':'CF',
  };
  return map[role] || role.slice(0,3).toUpperCase();
}

function getPlayerFamLevel(player, zoneKey, nodeX) {
  if (!player || !player.positions) return 0;
  // Resolve the MINI_CELL key (which includes row+col in storage format)
  let cellKey;
  if (zoneKey === 'GK' || zoneKey.endsWith('_C')) {
    cellKey = zoneKey;
  } else {
    // Wide zone: pick left or right based on x position
    const side = (nodeX !== undefined && nodeX >= 50) ? '_R' : '_L';
    // ATT wide has no dedicated cell — LW/RW (AM_W) covers both AM and ATT wide
    const resolvedZone = zoneKey === 'ATT_W' ? 'AM_W' : zoneKey;
    cellKey = resolvedZone + side;
  }
  // Find matching MINI_CELL and build the actual storage key: `${key}_${r}_${c}`
  const cell = MINI_CELLS.find(m => m.key === cellKey);
  if (!cell) return 0;
  return player.positions[`${cell.key}_${cell.r}_${cell.c}`] || 0;
}

/* Derives the set of playable roles from the player's actual familiarity cells.
   Starts from what the player CAN play (their positions), not from the target role.
   ATT_W has no dedicated mini-pitch cell — AM_W familiarity covers it too. */
function getPlayableRoles(player) {
  const roles = new Set();
  if (!player?.positions) return roles;
  MINI_CELLS.forEach(cell => {
    const posKey = `${cell.key}_${cell.r}_${cell.c}`;
    if ((player.positions[posKey] || 0) < 1) return;
    // Strip _L/_R suffix to get the base zone key (e.g. 'AM_W_L' → 'AM_W')
    const zoneKey = cell.key.replace(/_[LR]$/, '');
    (ZONE_ROLES[zoneKey]?.roles || []).forEach(r => roles.add(r));
    // AM_W familiarity also covers ATT_W (no separate ATT wide cell in mini-pitch)
    if (zoneKey === 'AM_W') {
      (ZONE_ROLES['ATT_W']?.roles || []).forEach(r => roles.add(r));
    }
  });
  return roles;
}

/* Familiarity-weighted role score (0–100%) for a specific node (side-aware).
   Returns null if the player has zero familiarity for THAT exact node side.
   e.g. a LWB with 0 RWB fam will return null for a right-side WB node. */
function squadPlanScore(player, node) {
  if (!node.role || !isCompatible(player, node.role)) return null;
  const zoneKey  = getZoneKey(node.x, node.y);
  const famLevel = getPlayerFamLevel(player, zoneKey, node.x);   // exact side
  if (famLevel < 1) return null;
  const raw = rawRoleScore(player, node.role);
  return Math.max(0, Math.round(raw - FAM_PENALTY[famLevel]));
}

/* Returns the fam level for a specific node (exact side). Convenience wrapper used
   only for display (dot colour, label) inside renderSpPanel. */
function nodeFamLevel(player, node) {
  return getPlayerFamLevel(player, getZoneKey(node.x, node.y), node.x);
}

/* ─── DRAG & DROP (nodes on pitch) ─────────────────────────────────────── */
function makeDraggableNode(el, node) {
  let startX, startY, startLeft, startTop, isDragging = false;
  const pitch = document.getElementById('pitch');
  const ghost = document.getElementById('drop-ghost');

  el.addEventListener('mousedown', onStart);
  el.addEventListener('touchstart', onStart, {passive:false});

  function onStart(e) {
    if (e.target.closest('.node-role-label,.node-name-label,.node-unassign')) return;
    e.preventDefault();
    isDragging = false;
    const clientPos = e.touches ? e.touches[0] : e;
    startX = clientPos.clientX;
    startY = clientPos.clientY;
    startLeft = node.x;
    startTop  = node.y;
    el.classList.add('dragging');

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove',  onMove, {passive:false});
    document.addEventListener('mouseup',   onEnd);
    document.addEventListener('touchend',  onEnd);
  }

  function onMove(e) {
    e.preventDefault();
    const clientPos = e.touches ? e.touches[0] : e;
    const dx = clientPos.clientX - startX;
    const dy = clientPos.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging = true;
    if (!isDragging) return;

    const rect = pitch.getBoundingClientRect();
    const px = ((clientPos.clientX - rect.left) / rect.width)  * 100;
    const py = ((clientPos.clientY - rect.top)  / rect.height) * 100;
    const cx = Math.max(4, Math.min(96, px));
    const cy = Math.max(4, Math.min(96, py));

    ghost.style.left = cx + '%';
    ghost.style.top  = cy + '%';
    ghost.classList.remove('hidden');
  }

  function onEnd(e) {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove',  onMove);
    document.removeEventListener('mouseup',   onEnd);
    document.removeEventListener('touchend',  onEnd);
    el.classList.remove('dragging');
    ghost.classList.add('hidden');

    if (!isDragging) { selectNode(node); return; }

    const clientPos = e.changedTouches ? e.changedTouches[0] : e;
    const rect = pitch.getBoundingClientRect();
    const px = ((clientPos.clientX - rect.left) / rect.width)  * 100;
    const py = ((clientPos.clientY - rect.top)  / rect.height) * 100;

    // Find nearest grid cell (occupied or not) to determine drop target
    let best = null, minDist = Infinity;
    GRID_CELLS.forEach(cell => {
      const d = Math.hypot(cell.x - px, cell.y - py);
      if (d < minDist) { minDist = d; best = cell; }
    });
    if (!best) return;

    const swapNode = state.nodes.find(n => n.id !== node.id && n.x === best.x && n.y === best.y);

    if (swapNode) {
      // Occupied → occupied: swap player assignments only.
      // Positions and roles are NOT touched — each node keeps its own slot.
      const tmp = node.playerId;
      node.playerId = swapNode.playerId;
      swapNode.playerId = tmp;
    } else {
      // Occupied → empty cell: move the entire node (position + role + player).
      node.x = best.x; node.y = best.y;

      // If the current role is not valid for the new zone, auto-assign the best fit.
      if (node.role) {
        const zoneRoles = getRolesForNode(node);
        if (!zoneRoles.includes(node.role)) {
          const player = state.squad.find(p => p.id === node.playerId);
          const candidates = player
            ? zoneRoles.filter(r => isCompatible(player, r))
            : zoneRoles;
          if (candidates.length > 0) {
            node.role = player
              ? candidates.reduce((best, r) =>
                  rawRoleScore(player, r) >= rawRoleScore(player, best) ? r : best
                , candidates[0])
              : candidates[0];
          } else {
            node.role = zoneRoles[0] || null;
          }
        }
      }
    }

    renderNodes();
    renderFormationOverview();
    saveState();
    maybeRenderMarket();
  }
}

/* ─── DRAG FROM ROSTER ──────────────────────────────────────────────────── */
function makeRosterDraggable(el, player) {
  let startX, startY, isDragging = false;
  let ghost = null;

  el.addEventListener('mousedown', onStart);
  el.addEventListener('touchstart', onStart, {passive:false});

  function onStart(e) {
    e.preventDefault();
    isDragging = false;
    const clientPos = e.touches ? e.touches[0] : e;
    startX = clientPos.clientX;
    startY = clientPos.clientY;

    ghost = document.createElement('div');
    ghost.textContent = truncate(player.name, 10);
    Object.assign(ghost.style, {
      position:'fixed', pointerEvents:'none', zIndex:9999,
      background:'rgba(0,242,254,0.15)', color:'#00f2fe',
      border:'1px solid #00f2fe', borderRadius:'6px',
      padding:'4px 10px', fontSize:'12px', fontWeight:'700',
      left: clientPos.clientX + 12 + 'px',
      top:  clientPos.clientY + 12 + 'px',
      display:'none',
    });
    document.body.appendChild(ghost);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove',  onMove, {passive:false});
    document.addEventListener('mouseup',   onEnd);
    document.addEventListener('touchend',  onEnd);
  }

  function onMove(e) {
    e.preventDefault();
    const clientPos = e.touches ? e.touches[0] : e;
    const dx = clientPos.clientX - startX;
    const dy = clientPos.clientY - startY;
    if (Math.abs(dx)>4 || Math.abs(dy)>4) { isDragging = true; ghost.style.display='block'; }
    if (!isDragging) return;
    ghost.style.left = clientPos.clientX + 12 + 'px';
    ghost.style.top  = clientPos.clientY + 12 + 'px';
  }

  function onEnd(e) {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove',  onMove);
    document.removeEventListener('mouseup',   onEnd);
    document.removeEventListener('touchend',  onEnd);
    ghost?.remove();

    if (!isDragging) return;

    const clientPos = e.changedTouches ? e.changedTouches[0] : e;
    const pitch = document.getElementById('pitch');
    const rect = pitch.getBoundingClientRect();

    if (clientPos.clientX >= rect.left && clientPos.clientX <= rect.right &&
        clientPos.clientY >= rect.top  && clientPos.clientY <= rect.bottom) {
      const px = ((clientPos.clientX - rect.left) / rect.width)  * 100;
      const py = ((clientPos.clientY - rect.top)  / rect.height) * 100;

      // Find the nearest existing node (not an empty cell — roster drag assigns to nodes)
      let nearest = null, minDist = Infinity;
      state.nodes.forEach(n => {
        const d = Math.hypot(n.x - px, n.y - py);
        if (d < minDist) { minDist = d; nearest = n; }
      });

      if (nearest) {
        state.nodes.forEach(n => { if (n.playerId === player.id) n.playerId = null; });
        nearest.playerId = player.id;
        saveState();
        maybeRenderMarket();
        renderNodes();
        renderFormationOverview();
      }
    }
  }
}

/* ─── SQUAD TABLE SORT STATE ─────────────────────────────────────────────── */
let _squadSort = { key: 'score', dir: -1 }; // default: score descending

/* ─── NODE SELECTION ────────────────────────────────────────────────────── */
let _selectedNode = null;

function selectNode(node) {
  _selectedNode = node;
  if (node.role) syncWeightsToRole(node.role);
  renderPositionSidebar(node);
  updateActiveNodeInfo(node);
  renderFormationOverview();
  // highlight selected node
  document.querySelectorAll('.player-node').forEach(el => {
    el.classList.toggle('node-selected', parseInt(el.dataset.nodeId) === node.id);
  });
}

function deselectNode() {
  _selectedNode = null;
  document.querySelectorAll('.player-node').forEach(el => el.classList.remove('node-selected'));
  document.getElementById('sidebar-position-panel').classList.add('hidden');
  document.getElementById('sidebar-roster-panel').classList.remove('hidden');
  renderFormationOverview();
}

function renderPositionSidebar(node) {
  document.getElementById('sidebar-roster-panel').classList.add('hidden');
  const panel = document.getElementById('sidebar-position-panel');
  panel.classList.remove('hidden');

  const zoneLabel = ZONE_ROLES[getZoneKey(node.x, node.y)]?.label || '—';
  document.getElementById('sidebar-pos-zone').textContent = zoneLabel;
  document.getElementById('sidebar-pos-role').textContent = node.role || 'No role set';

  const list = document.getElementById('position-player-list');
  list.innerHTML = '';

  if (!node.role) {
    list.innerHTML = '<p class="muted" style="padding:10px 4px">Right-click the node to set a role first.</p>';
    return;
  }

  const scored = state.squad
    .filter(p => !p.isScoutTarget)
    .map(p => ({ player: p, score: scorePlayerForNode(p, node) }))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    list.innerHTML = '<p class="muted" style="padding:10px 4px">No players in squad yet.</p>';
    return;
  }

  scored.forEach(({ player, score }) => {
    const isAssigned = node.playerId === player.id;
    const zoneKey    = getZoneKey(node.x, node.y);
    const famLevel   = getPlayerFamLevel(player, zoneKey, node.x);
    const famLabel   = FAM_LABELS[famLevel];

    const div = document.createElement('div');
    div.className = 'pos-player-item' + (isAssigned ? ' assigned' : '') + (score <= 0 ? ' incompatible' : '');

    const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const stars    = score > 0 ? getStarsForPlayer(score, state.targetBenchmark) : null;
    div.innerHTML = `
      <div class="ppi-avatar fam-${famLevel}">${initials}</div>
      <div class="ppi-info">
        <div class="ppi-name">${player.name}</div>
        <div class="ppi-meta">${player.type === 'goalkeeper' ? 'GK' : (player.mainPos || '—')} · ${player.age || '?'} · <span class="fam-text fam-${famLevel}">${famLabel}</span></div>
      </div>
      <div class="ppi-score">
        <span class="ppi-pct ${score >= 70 ? 'good' : score >= 50 ? 'warn' : 'bad'}">${score > 0 ? score + '%' : '—'}</span>
        ${stars !== null ? renderStarsHTML(stars) : ''}
        <div class="ppi-bar"><div class="ppi-bar-fill" style="width:${Math.min(Math.max(score,0),100)}%"></div></div>
      </div>`;

    if (score > 0) {
      div.addEventListener('click', () => {
        state.nodes.forEach(n => { if (n.playerId === player.id) n.playerId = null; });
        node.playerId = isAssigned ? null : player.id;
        saveState(); maybeRenderMarket();
        renderNodes(); renderFormationOverview();
        renderPositionSidebar(node); // refresh in place
      });
    }

    list.appendChild(div);
  });
}

/* ─── ROLE POPOVER ──────────────────────────────────────────────────────── */
let _activePopoverNode = null;

function openRolePopover(node, nodeEl) {
  _activePopoverNode = node;
  _selectedNode = node;   // keep in sync for weights Default button
  const pop = document.getElementById('role-popover');
  const title = document.getElementById('role-popover-title');
  const list  = document.getElementById('role-popover-list');

  const roles = getRolesForNode(node);
  title.textContent = ZONE_ROLES[getZoneKey(node.x, node.y)]?.label || 'Select Role';
  list.innerHTML = '';
  // Mostra subito i pesi del ruolo attuale
  if (node.role) syncWeightsToRole(node.role);
  roles.forEach(r => {
    const div = document.createElement('div');
    div.className = 'role-option' + (node.role === r ? ' selected' : '');
    div.textContent = r;
    div.addEventListener('click', () => {
      node.role = r;
      syncWeightsToRole(r);   // already calls saveState internally
      renderNodes();
      renderFormationOverview();
      updateActiveNodeInfo(node);
      if (_selectedNode?.id === node.id) renderPositionSidebar(node);
      closeRolePop();
    });
    list.appendChild(div);
  });

  // Position near the node element
  const rect = nodeEl.getBoundingClientRect();
  pop.style.left = Math.min(rect.right + 6, window.innerWidth - 256) + 'px';
  pop.style.top  = Math.max(4, Math.min(rect.top, window.innerHeight - 360)) + 'px';
  pop.classList.remove('hidden');
  updateActiveNodeInfo(node);
}

function closeRolePop() {
  document.getElementById('role-popover').classList.add('hidden');
  document.getElementById('assign-popover').classList.add('hidden');
}

document.getElementById('role-popover-close').addEventListener('click', closeRolePop);
document.getElementById('assign-popover-close').addEventListener('click', closeRolePop);


document.getElementById('btn-assign-player').addEventListener('click', () => {
  if (!_activePopoverNode) return;
  openAssignPopover(_activePopoverNode);
});

function openAssignPopover(node) {
  const pop  = document.getElementById('assign-popover');
  const list = document.getElementById('assign-player-list');
  list.innerHTML = '';

  const zoneKey = getZoneKey(node.x, node.y);
  const scored = state.squad
    .filter(p => !p.isScoutTarget
      && isCompatible(p, node.role)
      && getPlayerFamLevel(p, zoneKey, node.x) >= 1)
    .map(p => ({ player:p, score: scorePlayerForNode(p, node) }))
    .filter(({score}) => score > 0)
    .sort((a,b) => b.score - a.score);

  if (scored.length === 0) {
    list.innerHTML = '<p class="muted" style="padding:10px">No compatible players for this position.</p>';
  }

  scored.forEach(({player, score}) => {
    const div = document.createElement('div');
    div.className = 'assign-player-item';
    div.innerHTML = `
      <div>
        <div class="pi-name">${player.name}</div>
        <div class="pi-pos">${player.type === 'goalkeeper' ? 'GK' : player.mainPos || '—'}</div>
      </div>
      <span class="assign-score">${score}%</span>`;
    div.addEventListener('click', () => {
      // Unassign from any other node
      state.nodes.forEach(n => { if (n.playerId === player.id) n.playerId = null; });
      node.playerId = player.id;
      closeRolePop();
      renderNodes();
      renderFormationOverview();
      saveState();
      maybeRenderMarket();
    });
    list.appendChild(div);
  });

  const rolePop = document.getElementById('role-popover');
  const rect = rolePop.getBoundingClientRect();
  pop.style.left = Math.min(rect.right + 4, window.innerWidth - 256) + 'px';
  pop.style.top  = rect.top + 'px';
  pop.classList.remove('hidden');
}

function updateActiveNodeInfo(node) {
  const panel  = document.getElementById('active-node-info');
  const player = state.squad.find(p => p.id === node.playerId);
  const score  = (player && node.role) ? scorePlayerForNode(player, node) : null;
  const stars  = score !== null ? getStarsForPlayer(score, state.targetBenchmark) : null;
  panel.innerHTML = `
    <div class="node-name">${player ? player.name : 'Empty Slot'}</div>
    <div class="node-role">${node.role || 'No role set'}</div>
    ${score !== null ? `
      <div class="ani-score-row">
        <span class="ani-score">${score}%</span>
        ${renderStarsHTML(stars)}
      </div>` : ''}
    ${player ? `<div class="ani-meta">Age ${player.age || '—'} · ${player.nationality || '—'}</div>` : ''}
  `;
}

document.getElementById('btn-deselect-node').addEventListener('click', deselectNode);

document.addEventListener('click', (e) => {
  if (!e.target.closest('#role-popover,#assign-popover,.player-node')) closeRolePop();
});

// Click on pitch background deselects node
document.getElementById('pitch').addEventListener('click', (e) => {
  if (!e.target.closest('.player-node')) deselectNode();
});

/* ─── SCORE CALCULATION ─────────────────────────────────────────────────── */

const GK_ROLES = new Set(ZONE_ROLES.GK.roles); // {'Goalkeeper','Sweeper Keeper'}

/** Hard gate: GK players can only play GK roles, outfield players only outfield roles. */
function isCompatible(player, role) {
  const roleIsGK   = GK_ROLES.has(role);
  const playerIsGK = player.type === 'goalkeeper';
  return roleIsGK === playerIsGK;
}

function roleWeightFor(role, attr) {
  const tiers = ROLE_ATTRS[role];
  if (!tiers) return 0.0;
  if (tiers.key.includes(attr)) return 1.0;
  if (tiers.imp.includes(attr)) return 0.6;
  if (tiers.sec.includes(attr)) return 0.2;
  return 0.0;
}

// Positional familiarity penalty (percentage points subtracted from final score)
// Index = fam level: 0=None, 1=Awkward, 2=Sufficient, 3=Competent, 4=Accomplished, 5=Natural
const FAM_PENALTY = [50, 35, 20, 10, 3, 0];

/* Non-linear quality curve: maps raw FM attribute (1–20) to realistic quality % (1–100).
   Low attributes drop off sharply — a player averaging 10/20 scores ~30%, not 50%. */
function convertAttributeToQuality(val) {
  if (val <= 0)   return 0;
  if (val === 1)  return 1;
  if (val === 2)  return 2;
  if (val === 3)  return 3;
  if (val === 4)  return 4;
  if (val === 5)  return 5;
  if (val === 6)  return 8;
  if (val === 7)  return 11;
  if (val === 8)  return 14;
  if (val === 9)  return 17;
  if (val === 10) return 20;
  if (val === 11) return 25;
  if (val === 12) return 30;
  if (val === 13) return 40;
  if (val === 14) return 50;
  if (val === 15) return 60;
  if (val === 16) return 70;
  if (val === 17) return 80;
  if (val === 18) return 90;
  if (val === 19) return 95;
  return 100;
}

/* Returns the weighted quality score on the 0–100% absolute scale (no fam, no benchmark).
   Each raw attribute is converted via the non-linear quality curve before weighting. */
function rawAttrScore(player, node) {
  if (!player || !node.role) return 0;
  const attrSource = GK_ROLES.has(node.role) ? ATTRS_GK : ATTRS_OUTFIELD;
  const allAttrs = [...attrSource.technical, ...attrSource.mental, ...attrSource.physical];
  let total = 0, max = 0;
  allAttrs.forEach(attr => {
    const rw = roleWeightFor(node.role, attr);
    const gw = state.weights[attr] ?? 0.6;
    const w  = rw > 0 ? Math.max(rw, gw === 0.6 ? 0 : gw) : 0;
    if (w === 0) return;
    const qualityVal = convertAttributeToQuality(player.attrs?.[attr] || 0);
    total += qualityVal * w;
    max   += 100 * w;  // max quality contribution is 100
  });
  return max > 0 ? (total / max) * 100 : 0;
}

/* ─── STAR RATING ───────────────────────────────────────────────────────── */

/* Returns a star value 1.0–5.0 (0.5 increments) relative to the benchmark. */
function getStarsForPlayer(absoluteScore, benchmarkScore) {
  const diff = absoluteScore - benchmarkScore;
  if (diff >= 15)  return 5.0;
  if (diff >= 8)   return 4.5;
  if (diff >= 3)   return 4.0;
  if (diff >= -3)  return 3.5;
  if (diff >= -8)  return 3.0;
  if (diff >= -13) return 2.5;
  if (diff >= -18) return 2.0;
  if (diff >= -23) return 1.5;
  return 1.0;
}

/* Returns an HTML string of 5 stars (full ★ / half ★ dim / empty ☆). */
function renderStarsHTML(starValue) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (starValue >= i)            html += '<span class="star-f">★</span>';
    else if (starValue >= i - 0.5) html += '<span class="star-h">★</span>';
    else                           html += '<span class="star-e">☆</span>';
  }
  return `<span class="star-rating">${html}</span>`;
}

/* Absolute suitability score 0–100%.
   rawAttrScore already returns 0–100% via the non-linear quality curve.
   Formula: rawAttrScore(player, node) − famPenalty, clamped [0, 100].
   The benchmark widget is a passive reference and does NOT enter this formula. */
function scorePlayerForNode(player, node) {
  if (!player || !node.role) return 0;
  if (!isCompatible(player, node.role)) return 0;   // hard GK/outfield gate

  const zoneKey  = getZoneKey(node.x, node.y);
  const famLevel = getPlayerFamLevel(player, zoneKey, node.x);

  const rawPct = rawAttrScore(player, node);              // already 0–100%
  const final  = rawPct - FAM_PENALTY[famLevel];
  return Math.max(0, Math.min(100, Math.round(final)));
}

/* ── Auto-benchmark: mean raw attr score of Phase-1 starters ──────────────
   Runs a lightweight greedy pass (raw scores, fam≥1 required) to find the
   best player per position, then sets state.targetBenchmark to their average. */
function recomputeAutoTarget() {
  if (!state.autoMode) return;
  const nodes = state.nodes.filter(n => n.role);
  if (nodes.length === 0 || state.squad.length === 0) return;

  // Prefer plan starters as source of truth when plan is configured
  if (isPlanConfigured()) {
    const scores = nodes.map(node => {
      const starterId = state.plan[node.id]?.starter;
      if (!starterId) return null;
      const player = state.squad.find(p => p.id === starterId);
      if (!player) return null;
      return scorePlayerForNode(player, node);
    }).filter(s => s !== null);
    if (scores.length > 0) {
      state.targetBenchmark = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      updateBenchmarkUI();
      return;
    }
  }

  // Fallback: greedy matching from squad when plan has no starters
  const triples = [];
  nodes.forEach((node, ni) => {
    const zoneKey = getZoneKey(node.x, node.y);
    state.squad.forEach(player => {
      if (player.isScoutTarget) return;
      if (!isCompatible(player, node.role)) return;
      if (getPlayerFamLevel(player, zoneKey, node.x) === 0) return;
      triples.push({ ni, playerId: player.id, raw: rawAttrScore(player, node) });
    });
  });
  triples.sort((a, b) => b.raw - a.raw);

  const usedNodes   = new Set();
  const usedPlayers = new Set();
  let totalRaw = 0, count = 0;
  for (const { ni, playerId, raw } of triples) {
    if (usedNodes.has(ni) || usedPlayers.has(playerId)) continue;
    usedNodes.add(ni);
    usedPlayers.add(playerId);
    totalRaw += raw;
    count++;
  }
  if (count > 0) {
    state.targetBenchmark = Math.round(totalRaw / count);
    updateBenchmarkUI();
  }
}

/* ─── FORMATION OVERVIEW (removed — redirects to bench) ─────────────────── */
function renderFormationOverview() {
  renderBench();
}

/* ─── BENCH BAR ─────────────────────────────────────────────────────────── */

/* Raw attr score for a specific role, expressed as 0–100%.
   No benchmark, no familiarity — pure attribute fit for the role weights. */
function rawRoleScore(player, role) {
  const tiers = ROLE_ATTRS[role];
  if (!tiers) return 0;
  const isGK = GK_ROLES.has(role);
  const src  = isGK ? ATTRS_GK : ATTRS_OUTFIELD;
  const all  = [...src.technical, ...src.mental, ...src.physical];
  let total = 0, max = 0;
  all.forEach(attr => {
    const w = tiers.key.includes(attr) ? 1.0
            : tiers.imp.includes(attr) ? 0.6
            : tiers.sec.includes(attr) ? 0.2 : 0;
    if (w === 0) return;
    const qualityVal = convertAttributeToQuality(player.attrs?.[attr] || 0);
    total += qualityVal * w;
    max   += 100 * w;  // max quality contribution is 100
  });
  return max > 0 ? Math.round((total / max) * 100) : 0;
}

/* Bench: top-11 players NOT on pitch, each showing their best 2 formation roles. */
function renderBench() {
  const container = document.getElementById('bench-slots');
  if (!container) return;
  container.innerHTML = '';

  // Distinct roles currently used in the formation
  const formRoles = [...new Set(state.nodes.filter(n => n.role).map(n => n.role))];
  const onPitchIds = new Set(state.nodes.map(n => n.playerId).filter(Boolean));

  const available = state.squad.filter(p => !onPitchIds.has(p.id));

  if (available.length === 0 || formRoles.length === 0) return;

  // role → first node with that role (for zone/familiarity lookup)
  const roleNodeMap = {};
  state.nodes.filter(n => n.role).forEach(n => {
    if (!roleNodeMap[n.role]) roleNodeMap[n.role] = n;
  });

  const scored = available.map(player => {
    const top = formRoles
      .filter(role => isCompatible(player, role))
      .map(role => {
        const nd       = roleNodeMap[role];
        if (!nd) return null;
        const famLevel = getPlayerFamLevel(player, getZoneKey(nd.x, nd.y), nd.x);
        if (famLevel === 0) return null;                     // can't play here
        const score = scorePlayerForNode(player, nd);        // absolute 0–100%
        return { role, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    return { player, top };
  })
  .filter(({ top }) => top.length > 0)
  .sort((a, b) => (b.top[0]?.score || 0) - (a.top[0]?.score || 0))
  .slice(0, 11);

  scored.forEach(({ player, top }) => {
    const slot = document.createElement('div');
    slot.className = 'bench-slot';
    slot.title = `${player.name} — click to view`;

    const rolesHTML = top.map(({ role, score }) => {
      const pctClass = score >= 70 ? 'pct-good' : score >= 50 ? 'pct-ok' : 'pct-low';
      return `<span class="bench-role-chip">
        <span class="bench-role-abbr">${shortRole(role)}</span>
        <span class="bench-role-pct ${pctClass}">${score}%</span>
      </span>`;
    }).join('');

    const bestScore = top[0]?.score ?? null;
    const benchStars = bestScore !== null ? getStarsForPlayer(bestScore, state.targetBenchmark) : null;
    slot.innerHTML = `
      <span class="bench-name">${player.name}</span>
      ${benchStars !== null ? `<div class="bench-stars">${renderStarsHTML(benchStars)}</div>` : ''}
      <div class="bench-roles">${rolesHTML || '<span class="muted">—</span>'}</div>`;

    slot.addEventListener('click', () => openModal(player.id));

    container.appendChild(slot);
  });
}

/* ─── SQUAD ROSTER (sidebar) ────────────────────────────────────────────── */
function renderSquadRoster() {
  const filter = document.getElementById('squad-search').value.toLowerCase();
  const container = document.getElementById('squad-roster');
  container.innerHTML = '';

  const filtered = state.squad
    .filter(p => !p.isScoutTarget && p.name.toLowerCase().includes(filter));
  if (filtered.length === 0) {
    container.innerHTML = '<p class="muted" style="padding:10px 4px">No players yet.<br>Add one below!</p>';
    return;
  }

  filtered.forEach(player => {
    const isOnPitch = state.nodes.some(n => n.playerId === player.id);
    const div = document.createElement('div');
    div.className = 'squad-item' + (isOnPitch ? ' on-pitch' : '');
    div.dataset.playerId = player.id;

    const initials = player.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    div.innerHTML = `
      <div class="squad-item-avatar">${initials}</div>
      <div class="squad-item-info">
        <div class="squad-item-name">${player.name}</div>
        <div class="squad-item-pos">${player.type === 'goalkeeper' ? 'GK' : (player.mainPos||'—')} · ${player.age||'?'} yrs</div>
      </div>
      <div class="squad-item-actions">
        <button class="icon-btn" data-action="edit" data-id="${player.id}" title="Edit">✏️</button>
        <button class="icon-btn" data-action="del"  data-id="${player.id}" title="Remove">🗑️</button>
      </div>`;

    div.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation(); openModal(player.id);
    });
    div.querySelector('[data-action="del"]').addEventListener('click', (e) => {
      e.stopPropagation(); deletePlayer(player.id);
    });

    // Click sull'item (non sui pulsanti) → apre modal giocatore
    div.addEventListener('click', () => openModal(player.id));

    makeRosterDraggable(div, player);
    container.appendChild(div);
  });
}

document.getElementById('squad-search').addEventListener('input', renderSquadRoster);
document.getElementById('btn-add-player-pitch').addEventListener('click', () => openModal(null));

/* ─── SQUAD TABLE (squad page) ──────────────────────────────────────────── */

function computeSquadBenchmark() {
  const players = state.squad.filter(p => !p.isScoutTarget);
  if (players.length === 0) return null;
  const scores = players.map(p => {
    const best = getBestTacticalRole(p);
    return best ? rawRoleScore(p, best) : 0;
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function renderSquadBenchmark() {
  const val   = document.getElementById('squad-bench-val');
  const stars = document.getElementById('squad-bench-stars');
  const count = document.getElementById('squad-bench-count');
  if (!val) return;
  const bench   = computeSquadBenchmark();
  const players = state.squad.filter(p => !p.isScoutTarget);
  if (bench === null) {
    val.textContent = '—';
    stars.innerHTML = '';
    count.textContent = '';
    return;
  }
  val.textContent = bench + '%';
  stars.innerHTML = renderStarsHTML(getStarsForPlayer(bench, state.targetBenchmark));
  count.textContent = `(${players.length} players)`;
}

function renderSquadTable() {
  renderSquadBenchmark();

  const nameFilter = document.getElementById('squad-filter-name').value.toLowerCase();
  const posFilter  = document.getElementById('squad-filter-pos').value;
  const tbody = document.getElementById('squad-tbody');
  tbody.innerHTML = '';

  const DEF_TAGS      = new Set(['FB','CB','WB']);
  const ATT_TAGS      = new Set(['ST','IF','W','AM']);
  const PURE_ATT_TAGS = new Set(['ST','IF','W']);

  // Filter
  const filtered = state.squad.filter(p => {
    if (p.isScoutTarget) return false;
    const nm = p.name.toLowerCase().includes(nameFilter);
    if (!posFilter) return nm;
    const t = p.mainPos || '';
    if (posFilter === 'GK')  return nm && p.type === 'goalkeeper';
    if (posFilter === 'DEF') return nm && DEF_TAGS.has(t);
    if (posFilter === 'ATT') return nm && ATT_TAGS.has(t);
    if (posFilter === 'MID') return nm && p.type !== 'goalkeeper' && !DEF_TAGS.has(t) && !PURE_ATT_TAGS.has(t);
    return nm;
  }).map(p => {
    const bestRole  = getBestTacticalRole(p);
    const roleScore = bestRole ? rawRoleScore(p, bestRole) : 0;
    return { p, bestRole, roleScore };
  });

  // Sort
  const { key, dir } = _squadSort;
  filtered.sort((a, b) => {
    let v = 0;
    if (key === 'name')  v = a.p.name.localeCompare(b.p.name);
    else if (key === 'age')   v = (a.p.age || 99) - (b.p.age || 99);
    else if (key === 'pos')   v = playerGroupOrder(a.p) - playerGroupOrder(b.p);
    else if (key === 'role')  v = roleZoneOrder(a.bestRole) - roleZoneOrder(b.bestRole) || b.roleScore - a.roleScore;
    else if (key === 'score') v = a.roleScore - b.roleScore;
    else v = playerGroupOrder(a.p) - playerGroupOrder(b.p); // default group
    return v * dir;
  });

  // Update sort indicators in headers
  document.querySelectorAll('.th-sort').forEach(th => {
    const ind = th.querySelector('.sort-ind');
    if (th.dataset.sort === key) {
      ind.textContent = dir === 1 ? ' ▲' : ' ▼';
      th.classList.add('th-sort-active');
    } else {
      ind.textContent = '';
      th.classList.remove('th-sort-active');
    }
  });

  filtered.forEach(({ p, bestRole, roleScore }) => {
    const positions = getPlayerPositions(p);
    const posHTML   = positions.length
      ? positions.map(({ label, level }) =>
          `<span class="pos-chip fam-${level}" title="${FAM_LABELS[level]}">${label}</span>`).join('')
      : '<span class="muted">—</span>';

    const roleStars = roleScore > 0 ? getStarsForPlayer(roleScore, state.targetBenchmark) : null;
    const scoreCls  = roleScore >= 70 ? 'squad-score-good' : roleScore >= 50 ? 'squad-score-ok' : 'squad-score-low';

    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td><strong>${p.name}</strong></td>
      <td>${p.age || '—'}</td>
      <td class="td-chips">${posHTML}</td>
      <td class="td-role-stars">
        <span class="best-role-chip">${bestRole || '—'}</span>
        ${roleStars !== null ? renderStarsHTML(roleStars) : ''}
      </td>
      <td class="td-score-cell">
        <span class="squad-score-pct ${scoreCls}">${roleScore > 0 ? roleScore + '%' : '—'}</span>
      </td>
      <td style="white-space:nowrap">
        <button class="btn-danger btn-sm" data-del="${p.id}">Del</button>
      </td>`;
    tr.querySelector('[data-del]').addEventListener('click', e => {
      e.stopPropagation(); deletePlayer(p.id);
    });
    tr.addEventListener('click', () => openModal(p.id));
    tbody.appendChild(tr);
  });

  // Bind sort headers (once per render — safe since thead is static)
  document.querySelectorAll('.th-sort').forEach(th => {
    th.onclick = () => {
      const k = th.dataset.sort;
      if (_squadSort.key === k) _squadSort.dir *= -1;
      else { _squadSort.key = k; _squadSort.dir = k === 'score' ? -1 : 1; }
      renderSquadTable();
    };
  });
}

/* Positions a player can cover (familiarity ≥ 1), sorted by level desc.
   Uses MINI_CELLS labels (LB, CB, RB, CM, DM, ST, GK…). */
function getPlayerPositions(player) {
  if (!player.positions) return [];
  const result = [];
  MINI_CELLS.forEach(cell => {
    const key   = `${cell.key}_${cell.r}_${cell.c}`;
    const level = player.positions[key] || 0;
    if (level >= 1) result.push({ label: cell.label, level });
  });
  return result.sort((a, b) => b.level - a.level);
}

/* Top N attributes by value, descending. */
function getTopAttributes(player, n = 5) {
  const attrs = player.attrs || {};
  return Object.entries(attrs)
    .filter(([, v]) => v != null && !isNaN(Number(v)))
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, n)
    .map(([attr, value]) => ({ attr, value: Number(value) }));
}

/* Best tactical role for a player.
   Only considers zones the player knows (fam ≥ 1).
   Primary sort: rawRoleScore (attribute fit). Tiebreaker: max famLevel for that role.
   Returns null if no positions are set. */
function getBestTacticalRole(player) {
  if (!player.positions) return null;

  // role → max famLevel across all known zones that contain it
  const roleMaxFam = new Map();
  MINI_CELLS.forEach(cell => {
    const posKey   = `${cell.key}_${cell.r}_${cell.c}`;
    const famLevel = player.positions[posKey] || 0;
    if (famLevel === 0) return;
    (ZONE_ROLES[cell.key]?.roles || []).forEach(role => {
      if (!isCompatible(player, role)) return;
      const cur = roleMaxFam.get(role) ?? 0;
      if (famLevel > cur) roleMaxFam.set(role, famLevel);
    });
  });

  if (roleMaxFam.size === 0) return null;

  let bestRole = null, bestScore = -1;
  roleMaxFam.forEach((famLevel, role) => {
    // famLevel (1–5) adds up to 10 points as tiebreaker, never overrides attribute gap
    const combined = rawRoleScore(player, role) + famLevel * 2;
    if (combined > bestScore) { bestScore = combined; bestRole = role; }
  });
  return bestRole;
}

/* Sort order for squad table: GK=0, DEF=1, MID=2, ATT=3 */
function playerGroupOrder(player) {
  if (player.type === 'goalkeeper') return 0;
  const pos = player.mainPos || '';
  if (['CB', 'FB', 'WB'].includes(pos)) return 1;
  if (['DM', 'CM', 'WM', 'AM'].includes(pos)) return 2;
  return 3; // ST, W, IF
}

/* Tactical zone order for a role: GK=0, DEF=1, DM=2, CM=3, AM=4, ATT=5, unknown=6 */
function roleZoneOrder(role) {
  if (!role) return 6;
  for (const [key, { roles }] of Object.entries(ZONE_ROLES)) {
    if (roles.includes(role)) {
      if (key === 'GK')    return 0;
      if (key.startsWith('DEF')) return 1;
      if (key.startsWith('DM'))  return 2;
      if (key.startsWith('CM'))  return 3;
      if (key.startsWith('AM'))  return 4;
      if (key.startsWith('ATT')) return 5;
    }
  }
  return 6;
}

function attrPill(val) {
  if (val == null) return '<span class="attr-pill">—</span>';
  const cls = val >= 15 ? 'high' : val >= 10 ? 'mid' : 'low';
  return `<span class="attr-pill ${cls}">${val}</span>`;
}

document.getElementById('squad-filter-name').addEventListener('input', renderSquadTable);
document.getElementById('squad-filter-pos').addEventListener('change', renderSquadTable);
document.getElementById('btn-add-player-squad').addEventListener('click', () => openModal(null));
document.getElementById('btn-add-scout-target').addEventListener('click', () => openModal(null, true));

function deletePlayer(id) {
  state.squad = state.squad.filter(p => p.id !== id);
  state.nodes.forEach(n => { if (n.playerId === id) n.playerId = null; });
  if (_selectedScoutId === id) { _selectedScoutId = null; _scoutNodeId = null; _scoutCompareId = null; }
  saveState();
  maybeRenderMarket();
  renderNodes();
  renderSquadRoster();
  renderSquadTable();
  renderFormationOverview();
  renderScoutTab();
}

/* ─── MINI PITCH ────────────────────────────────────────────────────────── */
/* Mini-pitch: 3 cols (L, C, R) × 6 rows (ATT top → GK bottom) */
const MINI_CELLS = [
  // Row 0: ATT — LF/RF removed: LW covers ATT wide left, RW covers ATT wide right
  {r:0,c:1,key:'ATT_C',label:'ST'},
  // Row 1: AM
  {r:1,c:0,key:'AM_W_L', label:'LW'}, {r:1,c:1,key:'AM_C', label:'AM'}, {r:1,c:2,key:'AM_W_R', label:'RW'},
  // Row 2: CM
  {r:2,c:0,key:'CM_W_L', label:'LM'}, {r:2,c:1,key:'CM_C', label:'CM'}, {r:2,c:2,key:'CM_W_R', label:'RM'},
  // Row 3: DM
  {r:3,c:0,key:'DM_W_L', label:'LWB'},{r:3,c:1,key:'DM_C', label:'DM'}, {r:3,c:2,key:'DM_W_R', label:'RWB'},
  // Row 4: DEF
  {r:4,c:0,key:'DEF_W_L',label:'LB'}, {r:4,c:1,key:'DEF_C',label:'CB'}, {r:4,c:2,key:'DEF_W_R',label:'RB'},
  // Row 5: GK — solo centro
  {r:5,c:1,key:'GK',label:'GK'},
];

function buildMiniPitch() {
  const grid = document.getElementById('mini-pitch');
  grid.innerHTML = '';
  // 6 rows × 3 cols (L, C, R)
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 3; c++) {
      const cellDef = MINI_CELLS.find(m => m.r === r && m.c === c);
      const cell = document.createElement('div');

      if ((r === 5 && c !== 1) || !cellDef) {
        // GK side cells and cells with no definition (e.g. ATT wide — merged into LW/RW)
        cell.style.visibility = 'hidden';
      } else {
        cell.className = 'mini-cell';
        cell.dataset.level = '0';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.dataset.key = cellDef?.key || '';
        cell.textContent = cellDef?.label || '';
        cell.addEventListener('click', () => cycleCell(cell, 1));
        cell.addEventListener('contextmenu', e => { e.preventDefault(); cycleCell(cell, -1); });
      }
      grid.appendChild(cell);
    }
  }
}

function cycleCell(cell, dir = 1) {
  const cur = parseInt(cell.dataset.level) || 0;
  const next = (cur + dir + 6) % 6;
  cell.dataset.level = next;
  renderModalRoleSuggestions();
}

function getMiniPitchData() {
  const data = {};
  document.querySelectorAll('.mini-cell').forEach(cell => {
    if (cell.style.visibility === 'hidden') return;
    const key = cell.dataset.key;
    const r = cell.dataset.r;
    const c = cell.dataset.c;
    const k = `${key}_${r}_${c}`;
    data[k] = parseInt(cell.dataset.level) || 0;
  });
  return data;
}

function setMiniPitchData(data) {
  document.querySelectorAll('.mini-cell').forEach(cell => {
    if (cell.style.visibility === 'hidden') return;
    const key = cell.dataset.key;
    const r = cell.dataset.r;
    const c = cell.dataset.c;
    const k = `${key}_${r}_${c}`;
    cell.dataset.level = data?.[k] || 0;
  });
}

function resetMiniPitch() {
  document.querySelectorAll('.mini-cell').forEach(cell => { cell.dataset.level = 0; });
}

/* ─── TYPE TOGGLE ───────────────────────────────────────────────────────── */
function bindTypeToggle() {
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildAttrInputs(btn.dataset.type);
      renderModalRoleSuggestions();
    });
  });
}

function getActiveType() {
  return document.querySelector('.type-btn.active')?.dataset.type || 'outfield';
}

function buildAttrInputs(type) {
  const schema = type === 'goalkeeper' ? ATTRS_GK : ATTRS_OUTFIELD;
  document.getElementById('attrs-col1-title').textContent = type === 'goalkeeper' ? 'Goalkeeper' : 'Technical';

  buildCol('attrs-col1', schema.technical);
  buildCol('attrs-col2', schema.mental);
  buildCol('attrs-col3', schema.physical);
}

function buildCol(containerId, attrs) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  attrs.forEach(attr => {
    const row = document.createElement('div');
    row.className = 'attr-row';
    row.innerHTML = `
      <label>${attr}</label>
      <div class="attr-stepper">
        <button class="stepper-btn" tabindex="-1">−</button>
        <input type="number" min="1" max="20" placeholder="—" data-attr="${attr}" class="attr-input"/>
        <button class="stepper-btn" tabindex="-1">+</button>
      </div>`;
    const inp = row.querySelector('input');
    const [btnDec, btnInc] = row.querySelectorAll('.stepper-btn');
    const step = (dir) => {
      const cur = parseInt(inp.value) || 0;
      const next = Math.max(1, Math.min(20, cur + dir));
      inp.value = next;
      colourAttrInput(inp);
    };
    btnDec.addEventListener('click', () => { step(-1); renderModalRoleSuggestions(); });
    btnInc.addEventListener('click', () => { step(+1); renderModalRoleSuggestions(); });
    inp.addEventListener('input', () => { colourAttrInput(inp); renderModalRoleSuggestions(); });
    el.appendChild(row);
  });
}

function colourAttrInput(inp) {
  const v = parseInt(inp.value);
  inp.classList.remove('attr-val-high','attr-val-mid','attr-val-low');
  if (isNaN(v)) return;
  if (v >= 15) inp.classList.add('attr-val-high');
  else if (v >= 10) inp.classList.add('attr-val-mid');
  else inp.classList.add('attr-val-low');
}

function getAttrValues() {
  const result = {};
  document.querySelectorAll('.attr-input').forEach(inp => {
    const v = parseInt(inp.value);
    if (!isNaN(v)) result[inp.dataset.attr] = v;
  });
  return result;
}

function setAttrValues(attrs) {
  document.querySelectorAll('.attr-input').forEach(inp => {
    const v = attrs?.[inp.dataset.attr];
    inp.value = v != null ? v : '';
    colourAttrInput(inp);
  });
}

/* ─── FEET ──────────────────────────────────────────────────────────────── */
function bindFootCircles() {
  ['L','R'].forEach(foot => {
    const circle = document.getElementById('foot-' + foot);
    const cycleFoot = (dir) => {
      const cur  = parseInt(circle.dataset.level) || 0;
      const next = (cur + dir + 6) % 6;
      circle.dataset.level = next;
      document.getElementById('foot-' + foot + '-label').textContent = FAM_LABELS[next];
    };
    circle.addEventListener('click',       ()  => cycleFoot(1));
    circle.addEventListener('contextmenu', (e) => { e.preventDefault(); cycleFoot(-1); });
  });
}

function getFeetData() {
  return {
    L: parseInt(document.getElementById('foot-L').dataset.level) || 0,
    R: parseInt(document.getElementById('foot-R').dataset.level) || 0,
  };
}

function setFeetData(data) {
  ['L','R'].forEach(foot => {
    const lv = data?.[foot] || 0;
    const circle = document.getElementById('foot-' + foot);
    circle.dataset.level = lv;
    document.getElementById('foot-' + foot + '-label').textContent = FAM_LABELS[lv];
  });
}

/* ─── STARS ─────────────────────────────────────────────────────────────── */
let _starValue = 0;

function bindStarPicker() {
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      _starValue = parseInt(star.dataset.v);
      updateStars();
    });
    star.addEventListener('mouseover', () => {
      document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.v) <= parseInt(star.dataset.v));
      });
    });
  });
  document.getElementById('star-picker').addEventListener('mouseleave', updateStars);
}

function updateStars() {
  document.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.v) <= _starValue);
  });
}

function getStarValue() { return _starValue; }
function setStarValue(v) { _starValue = v||0; updateStars(); }

/* ─── MODAL ─────────────────────────────────────────────────────────────── */
function bindModal() {
  document.getElementById('modal-close').addEventListener('click',   closeModal);
  document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-modal-save').addEventListener('click',   saveModal);
  document.getElementById('btn-modal-unassign').addEventListener('click', () => {
    if (state.editingPlayerId === null) return;
    state.nodes.forEach(n => { if (n.playerId === state.editingPlayerId) n.playerId = null; });
    saveState(); maybeRenderMarket();
    renderNodes(); renderSquadRoster(); renderFormationOverview();
    closeModal();
  });
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
}

/* ─── MODAL ROLE SUGGESTIONS ─────────────────────────────────────────────── */
function renderModalRoleSuggestions() {
  const panel = document.getElementById('modal-role-suggestions');
  if (!panel) return;

  const type      = getActiveType();
  const tmpPlayer = { type, attrs: getAttrValues() };

  // Zones where player has any familiarity (level ≥ 1) in the mini-pitch
  const selectedKeys = new Set();
  document.querySelectorAll('.mini-cell').forEach(cell => {
    if (cell.style.visibility === 'hidden') return;
    if (parseInt(cell.dataset.level) >= 1) selectedKeys.add(cell.dataset.key);
  });

  // Roles to score: from selected zones, or all zones if none picked
  const keysToCheck = selectedKeys.size > 0 ? [...selectedKeys] : Object.keys(ZONE_ROLES);
  const roleSet = new Set();
  keysToCheck.forEach(key => (ZONE_ROLES[key]?.roles || []).forEach(r => roleSet.add(r)));

  const scored = [...roleSet]
    .filter(role => isCompatible(tmpPlayer, role))
    .map(role => ({ role, score: rawRoleScore(tmpPlayer, role) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (scored.length === 0) {
    panel.innerHTML = '<p class="modal-roles-empty">Enter attributes to see recommended roles.</p>';
    return;
  }

  const subtitle = selectedKeys.size > 0
    ? `${selectedKeys.size} zone${selectedKeys.size > 1 ? 's' : ''} selected`
    : 'all compatible roles';

  const chips = scored.map(({ role, score }) => {
    const cls = score >= 70 ? 'role-chip-good' : score >= 50 ? 'role-chip-ok' : 'role-chip-low';
    return `<div class="modal-role-chip ${cls}">
      <span class="role-chip-name">${role}</span>
      <span class="role-chip-score">${score}%</span>
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="modal-roles-header">
      <span class="modal-roles-title">Recommended Roles</span>
      <span class="modal-roles-sub">${subtitle}</span>
    </div>
    <div class="modal-roles-list">${chips}</div>`;
}

function openModal(playerId, presetScout = false) {
  state.editingPlayerId = playerId;
  const overlay     = document.getElementById('modal-overlay');
  const title       = document.getElementById('modal-title');
  const unassignBtn = document.getElementById('btn-modal-unassign');

  if (playerId !== null) {
    const player = state.squad.find(p => p.id === playerId);
    title.textContent = 'Edit Player';
    populateForm(player);
    const onPitch = state.nodes.some(n => n.playerId === playerId);
    unassignBtn.classList.toggle('hidden', !onPitch || !!player.isScoutTarget);
  } else {
    title.textContent = 'Add Player';
    clearForm();
    if (presetScout) document.getElementById('f-status').value = 'scout';
    unassignBtn.classList.add('hidden');
  }
  overlay.classList.remove('hidden');
  renderModalRoleSuggestions();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  state.editingPlayerId = null;
}

function clearForm() {
  document.getElementById('f-name').value = '';
  document.getElementById('f-age').value = '';
  document.getElementById('f-nationality').value = '';
  document.getElementById('f-value').value = '';
  document.getElementById('f-wage').value = '';
  document.getElementById('f-status').value = 'squad';
  // type toggle
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.type-btn[data-type="outfield"]').classList.add('active');
  buildAttrInputs('outfield');
  setAttrValues({});
  setFeetData({L:0,R:0});
  resetMiniPitch();
}

function populateForm(player) {
  document.getElementById('f-name').value = player.name || '';
  document.getElementById('f-age').value  = player.age  || '';
  document.getElementById('f-nationality').value = player.nationality || '';
  document.getElementById('f-value').value = player.value || '';
  document.getElementById('f-wage').value  = player.wage  || '';
  document.getElementById('f-status').value = player.isScoutTarget ? 'scout' : 'squad';
  const type = player.type || 'outfield';
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.type-btn[data-type="${type}"]`).classList.add('active');
  buildAttrInputs(type);
  setAttrValues(player.attrs || {});
  setFeetData(player.feet || {L:0,R:0});
  setMiniPitchData(player.positions || {});
}

function saveModal() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { alert('Please enter a player name.'); return; }

  const type = getActiveType();
  const positions = getMiniPitchData();
  const isScoutTarget = document.getElementById('f-status').value === 'scout';
  const player = {
    id:            state.editingPlayerId ?? state.nextPlayerId++,
    name,
    age:           parseInt(document.getElementById('f-age').value) || null,
    nationality:   document.getElementById('f-nationality').value.trim(),
    value:         document.getElementById('f-value').value.trim(),
    wage:          document.getElementById('f-wage').value.trim(),
    type,
    attrs:         getAttrValues(),
    feet:          getFeetData(),
    positions,
    mainPos:       derivedMainPos(type, positions),
    isScoutTarget,
  };
  // Scout targets can't occupy pitch nodes
  if (isScoutTarget) {
    state.nodes.forEach(n => { if (n.playerId === player.id) n.playerId = null; });
  }

  if (state.editingPlayerId !== null) {
    const idx = state.squad.findIndex(p => p.id === state.editingPlayerId);
    if (idx >= 0) state.squad[idx] = player;
  } else {
    state.squad.push(player);
  }

  saveState();
  maybeRenderMarket();
  closeModal();
  renderSquadRoster();
  renderNodes();
  renderFormationOverview();
  renderSquadTable();
  renderScoutTab();
}

function derivedMainPos(type, positions) {
  if (type === 'goalkeeper') return 'GK';
  let best = null, bestLv = -1;
  Object.entries(positions).forEach(([k,v]) => { if (v > bestLv) { bestLv=v; best=k; } });
  if (!best) return '—';
  if (best.startsWith('DEF_C'))   return 'CB';
  if (best.startsWith('DEF_W'))   return 'FB';
  if (best.startsWith('DM_C'))    return 'DM';
  if (best.startsWith('DM_W'))    return 'WB';
  if (best.startsWith('CM_C'))    return 'CM';
  if (best.startsWith('CM_W'))    return 'WM';
  if (best.startsWith('AM_C'))    return 'AM';
  if (best.startsWith('AM_W'))    return 'W';
  if (best.startsWith('ATT_C'))   return 'ST';
  if (best.startsWith('ATT_W'))   return 'IF';
  return '—';
}

/* ─── SAVE / LOAD TACTIC ────────────────────────────────────────────────── */
function saveTactic() {
  const data = JSON.stringify({
    squad:           state.squad,
    nodes:           state.nodes,
    weights:         state.weights,
    autoMode:        state.autoMode,
    targetBenchmark: state.targetBenchmark,
    nextPlayerId:    state.nextPlayerId,
    nextNodeId:      state.nextNodeId,
  });
  const blob = new Blob([data], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'fmm-tactic.json'; a.click();
  URL.revokeObjectURL(url);
}

function loadTactic() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json';
  inp.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.squad)  state.squad  = data.squad;
        if (data.nodes)  state.nodes  = data.nodes;
        if (data.weights) state.weights = data.weights;
        if (data.autoMode        !== undefined) state.autoMode        = data.autoMode;
        if (data.targetBenchmark !== undefined) state.targetBenchmark = data.targetBenchmark <= 20 ? data.targetBenchmark * 5 : data.targetBenchmark;
        state.nextPlayerId = Math.max(...state.squad.map(p => p.id), 0) + 1;
        state.nextNodeId   = Math.max(...state.nodes.map(n => n.id), 0) + 1;
        saveState();
        buildWeightControls();
        recomputeAutoTarget();
        updateBenchmarkUI();
        renderNodes();
        renderSquadRoster();
        renderSquadTable();
        renderScoutTab();
        maybeRenderMarket();
        renderFormationOverview();
      } catch { alert('Invalid tactic file.'); }
    };
    reader.readAsText(file);
  };
  inp.click();
}


/* ─── SQUAD PAGE SECONDARY BINDINGS ────────────────────────────────────── */
function bindSquadPage() {
  // rendered via renderSquadTable on tab switch
}

/* ─── KEYBOARD SHORTCUTS ────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeRolePop();
  }
});

/* ─── EXPOSE FOR INLINE ONCLICK ─────────────────────────────────────────── */
window.openModal  = openModal;
window.deletePlayer = deletePlayer;

/* ─── MARKET TAB ────────────────────────────────────────────────────────── */

function isMarketActive() {
  return document.getElementById('tab-market').classList.contains('active');
}
function maybeRenderMarket() {
  recomputeAutoTarget();   // always keep benchmark in sync
  if (isMarketActive()) renderMarket();
}

/* Update the benchmark widget DOM to reflect current state */
function updateBenchmarkUI() {
  const valEl  = document.getElementById('benchmark-value');
  const autoBtn = document.getElementById('btn-benchmark-auto');
  if (!valEl || !autoBtn) return;
  valEl.textContent = Math.round(state.targetBenchmark) + '%';
  autoBtn.classList.toggle('auto-on',  state.autoMode);
  autoBtn.classList.toggle('auto-off', !state.autoMode);
}

/* Bind the benchmark widget controls */
function bindBenchmarkWidget() {
  document.getElementById('btn-benchmark-auto').addEventListener('click', () => {
    state.autoMode = true;
    recomputeAutoTarget();
    saveState();
    renderBench();
    refreshStarViews();
    maybeRenderMarket();
  });
  document.getElementById('btn-benchmark-dec').addEventListener('click', () => {
    state.autoMode = false;
    state.targetBenchmark = Math.max(0, state.targetBenchmark - 1);
    updateBenchmarkUI();
    saveState();
    renderBench();
    refreshStarViews();
    maybeRenderMarket();
  });
  document.getElementById('btn-benchmark-inc').addEventListener('click', () => {
    state.autoMode = false;
    state.targetBenchmark = Math.min(100, state.targetBenchmark + 1);
    updateBenchmarkUI();
    saveState();
    renderBench();
    refreshStarViews();
    maybeRenderMarket();
  });
}

/* Re-render star-bearing panels when the benchmark changes */
function refreshStarViews() {
  if (_selectedNode) {
    updateActiveNodeInfo(_selectedNode);
    renderPositionSidebar(_selectedNode);
  }
  if (document.getElementById('tab-squad').classList.contains('active')) renderSquadTable();
}

function renderMarket() {
  updateBenchmarkUI();
  if (!isPlanConfigured()) {
    renderMarketNoPlan();
    return;
  }
  const results = computeMarketData();
  renderMarketPriority(results);
  renderMarketCoverage(results);
}

function renderMarketNoPlan() {
  const msg = `<div class="market-noplan-msg">
    <div class="market-noplan-icon">📋</div>
    <p><strong>Squad Plan not configured</strong></p>
    <p class="muted">Go to the <strong>Squad Plan</strong> tab and assign starters and backups for each position on the pitch.<br>
    Only then will Market be able to accurately calculate signing priorities.</p>
  </div>`;
  document.getElementById('market-priority-list').innerHTML  = msg;
  document.getElementById('market-coverage-list').innerHTML  = msg;
  document.getElementById('market-priority-count').textContent = '—';
  document.getElementById('market-coverage-count').textContent = '—';
}

/* ── Market data from Squad Plan (source of truth) ───────────────────────── */
function computeMarketData() {
  const nodes = state.nodes.filter(n => n.role);
  if (nodes.length === 0 || state.squad.length === 0) return [];

  const starterThreshold = Math.round(state.targetBenchmark * 0.85);
  const backupThreshold  = Math.round(state.targetBenchmark * 0.70);

  return nodes.map((node, ni) => {
    const plan = getNodePlan(node.id);

    // Starter from plan
    const starterPlayer = plan.starter
      ? state.squad.find(p => p.id === plan.starter && !p.isScoutTarget)
      : null;
    const starter = starterPlayer
      ? { player: starterPlayer, score: scorePlayerForNode(starterPlayer, node) }
      : null;

    // Best backup: highest fam-weighted score among bench + third + youth
    const backupIds = [...(plan.bench || []), ...(plan.third || []), ...(plan.youth || [])];
    const backup = backupIds
      .map(id => state.squad.find(p => p.id === id && !p.isScoutTarget))
      .filter(Boolean)
      .map(p => ({ player: p, score: scorePlayerForNode(p, node) }))
      .sort((a, b) => b.score - a.score)[0] || null;

    const isHighUrgency = !starter || starter.score < starterThreshold;
    const isMedUrgency  = !backup  || backup.score  < backupThreshold;
    const urgency = isHighUrgency ? 'high' : isMedUrgency ? 'med' : 'low';

    return { node, ni, starter, backup, urgency, starterThreshold, backupThreshold };
  });
}

/* Position group sort order: GK=0, DEF=1, MID=2, ATT=3 */
function nodeGroupOrder(node) {
  const key = getZoneKey(node.x, node.y);
  if (key === 'GK')                             return 0;
  if (key.startsWith('DEF'))                    return 1;
  if (key.startsWith('DM') || key.startsWith('CM') || key.startsWith('AM')) return 2;
  return 3; // ATT
}

/* ── Priority cards — left column ────────────────────────────────────────── */
function renderMarketPriority(results) {
  const list  = document.getElementById('market-priority-list');
  const badge = document.getElementById('market-priority-count');
  list.innerHTML = '';

  if (results.length === 0) {
    badge.textContent = '0';
    list.innerHTML = '<p class="market-empty muted">No data available.<br>Add players and assign roles on the pitch.</p>';
    return;
  }

  const urgencyOrder = { high: 0, med: 1 };
  const urgent = results
    .filter(r => r.urgency === 'high' || r.urgency === 'med')
    .sort((a, b) =>
      nodeGroupOrder(a.node) - nodeGroupOrder(b.node) ||
      urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    );

  badge.textContent = urgent.length;

  if (urgent.length === 0) {
    list.innerHTML = '<p class="market-empty muted">✅ Squad covered!<br>All positions have adequate starters and backups.</p>';
    return;
  }

  const playerChip = (player, score, tag) => `
    <div class="mcp-row">
      <div class="mcp-avatar${tag === 'Backup' ? ' reserve' : ''}">${nameInitials(player.name)}</div>
      <div class="mcp-info">
        <span class="mcp-name">${truncate(player.name, 16)}</span>
        <span class="mcp-tag">${tag}</span>
      </div>
      <div class="mcp-right">
        <span class="mcp-pct">${score}%</span>
        <div class="mcp-bar"><div class="mcp-bar-fill${tag === 'Backup' ? ' reserve' : ''}" style="width:${Math.min(score,100)}%"></div></div>
      </div>
    </div>`;

  urgent.forEach(({ node, starter, backup, urgency, starterThreshold, backupThreshold }) => {
    const tiers     = ROLE_ATTRS[node.role] || { key: [], imp: [], sec: [] };
    const keyAttrs  = tiers.key.slice(0, 3);
    const zoneLabel = ZONE_ROLES[getZoneKey(node.x, node.y)]?.label || '';
    const labelMap  = { high: 'HIGH', med: 'MED' };

    const diagnosis = urgency === 'high'
      ? (!starter
          ? 'No adequate starter available in the squad.'
          : `Starter fitness is below category standard (${starter.score}% vs min. required ${starterThreshold}%).`)
      : (!backup
          ? 'No backup with sufficient familiarity (min. Competent).'
          : `Backup fitness is below category standard (${backup.score}% vs min. required ${backupThreshold}%).`);

    const card = document.createElement('div');
    card.className = `market-card urgency-${urgency}`;
    card.innerHTML = `
      <div class="market-card-top">
        <span class="urgency-badge ${urgency}">${labelMap[urgency]}</span>
        <div class="market-card-title">
          <span class="market-card-zone">${zoneLabel}</span>
          <span class="market-card-role">${node.role}</span>
        </div>
      </div>
      <p class="market-card-note">${diagnosis}</p>
      ${keyAttrs.length ? `<div class="market-key-attrs">${keyAttrs.map(a => `<span class="key-attr-chip">${a}</span>`).join('')}</div>` : ''}
      ${starter ? playerChip(starter.player, starter.score, 'Starter') : ''}
      ${backup  ? playerChip(backup.player,  backup.score,  'Backup')  : ''}
    `;
    list.appendChild(card);
  });
}

/* ── Coverage rows — right column ────────────────────────────────────────── */
function renderMarketCoverage(results) {
  const list  = document.getElementById('market-coverage-list');
  const badge = document.getElementById('market-coverage-count');
  list.innerHTML = '';
  badge.textContent = results.length;

  if (results.length === 0) {
    list.innerHTML = '<p class="market-empty muted">No roles configured on the pitch.</p>';
    return;
  }

  const urgencyRank = { high: 0, med: 1, low: 2 };
  const dotColor    = u => u === 'high' ? '#ff3c3c' : u === 'med' ? '#ffbf00' : '#39ff14';

  const slot = (tag, player, score, cls) => `
    <div class="cov-slot ${cls}">
      <span class="cov-slot-tag ${cls}">${tag}</span>
      <span class="cov-slot-name${!player ? ' empty' : ''}">${player ? truncate(player.name, 14) : '— assente'}</span>
      <div class="cov-bar-track"><div class="cov-bar-fill ${cls}" style="width:${Math.min(score,100)}%"></div></div>
      <span class="cov-slot-pct">${player ? score + '%' : '—'}</span>
    </div>`;

  [...results]
    .sort((a, b) =>
      nodeGroupOrder(a.node) - nodeGroupOrder(b.node) ||
      urgencyRank[a.urgency] - urgencyRank[b.urgency]
    )
    .forEach(({ node, starter, backup, urgency }) => {
      const row = document.createElement('div');
      row.className = 'coverage-row';
      row.innerHTML = `
        <div class="coverage-row-header">
          <span class="coverage-role-badge">${shortRole(node.role)}</span>
          <span class="coverage-role-name">${node.role}</span>
          <span class="cov-urgency-dot" style="background:${dotColor(urgency)}"></span>
        </div>
        <div class="coverage-slots">
          ${slot('Starter', starter?.player ?? null, starter?.score ?? 0, 'starter')}
          ${slot('Backup',  backup?.player  ?? null, backup?.score  ?? 0, 'reserve')}
        </div>`;
      list.appendChild(row);
    });
}

/* Utility */
function nameInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ─── SCOUT & COMPARE TAB ───────────────────────────────────────────────── */

let _selectedScoutId = null;   // currently selected scout target id
let _scoutNodeId     = null;   // selected node id for comparison
let _scoutCompareId  = null;   // selected squad player id for comparison

function renderScoutTab() {
  const list  = document.getElementById('scout-target-list');
  const badge = document.getElementById('scout-target-count');
  if (!list) return;

  const targets = state.squad.filter(p => p.isScoutTarget);
  badge.textContent = targets.length;
  list.innerHTML = '';

  if (targets.length === 0) {
    list.innerHTML = '<p class="muted scout-empty">No scouting targets.<br>Add a player with status "Scouting Target".</p>';
    _selectedScoutId = null;
    showScoutPlaceholder();
    return;
  }

  // Validate selection is still present
  if (_selectedScoutId !== null && !targets.find(p => p.id === _selectedScoutId)) {
    _selectedScoutId = null; _scoutNodeId = null; _scoutCompareId = null;
  }

  targets.forEach(target => {
    const bestScore = getBestScoutScore(target);
    const card = document.createElement('div');
    card.className = 'scout-target-card' + (_selectedScoutId === target.id ? ' selected' : '');
    card.innerHTML = `
      <div class="scout-target-avatar">${nameInitials(target.name)}</div>
      <div class="scout-target-info">
        <div class="scout-target-name">${target.name}</div>
        <div class="scout-target-meta">${[target.age ? target.age + ' yrs' : null, target.nationality, target.value].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="scout-target-score ${bestScore === null ? 'muted' : ''}">${bestScore !== null ? bestScore + '%' : '—'}</div>
      <button class="scout-card-del" title="Remove target">&times;</button>`;
    card.querySelector('.scout-card-del').addEventListener('click', e => {
      e.stopPropagation();
      deletePlayer(target.id);
    });
    card.addEventListener('click', () => {
      _selectedScoutId = target.id;
      _scoutNodeId = null; _scoutCompareId = null;
      renderScoutTab();
    });
    // Edit on double-click
    card.addEventListener('dblclick', () => openModal(target.id));
    list.appendChild(card);
  });

  if (_selectedScoutId !== null) {
    const target = targets.find(p => p.id === _selectedScoutId);
    if (target) renderScoutComparison(target);
    else        showScoutPlaceholder();
  } else {
    showScoutPlaceholder();
  }
}

function showScoutPlaceholder() {
  document.getElementById('scout-placeholder')?.classList.remove('hidden');
  document.getElementById('scout-comparison-content')?.classList.add('hidden');
}

/* Best score of the target across all compatible active nodes */
function getBestScoutScore(target) {
  let best = null;
  state.nodes.filter(n => n.role && isCompatible(target, n.role)).forEach(n => {
    const fam = getPlayerFamLevel(target, getZoneKey(n.x, n.y), n.x);
    if (fam === 0) return;
    const s = scorePlayerForNode(target, n);
    if (best === null || s > best) best = s;
  });
  return best;
}

function renderScoutComparison(target) {
  const placeholder = document.getElementById('scout-placeholder');
  const content     = document.getElementById('scout-comparison-content');
  placeholder.classList.add('hidden');
  content.classList.remove('hidden');
  content.innerHTML = '';

  // Compatible nodes (isCompatible + familiarity > 0)
  const compatibleOpts = state.nodes
    .filter(n => n.role && isCompatible(target, n.role))
    .map(n => {
      const zoneKey  = getZoneKey(n.x, n.y);
      const famLevel = getPlayerFamLevel(target, zoneKey, n.x);
      return { node: n, famLevel, score: famLevel > 0 ? scorePlayerForNode(target, n) : 0 };
    })
    .filter(o => o.famLevel > 0)
    .sort((a, b) => b.score - a.score);

  // Header
  const topScore = compatibleOpts[0]?.score ?? null;
  const scoreHTML = topScore !== null
    ? `<div class="scout-comp-score-wrap">
         <div class="scout-comp-score">${topScore}%</div>
         <div class="scout-comp-score-label">Tactical score</div>
       </div>` : '';

  // Node selector
  const selectedNodeId = (_scoutNodeId !== null && compatibleOpts.find(o => o.node.id === _scoutNodeId))
    ? _scoutNodeId : (compatibleOpts[0]?.node.id ?? null);

  let nodeSelectorHTML = '';
  if (compatibleOpts.length > 1) {
    const opts = compatibleOpts.map(o => {
      const zone = ZONE_ROLES[getZoneKey(o.node.x, o.node.y)]?.label || o.node.role;
      return `<option value="${o.node.id}" ${o.node.id === selectedNodeId ? 'selected' : ''}>${o.node.role} (${zone}) — ${o.score}%</option>`;
    }).join('');
    nodeSelectorHTML = `
      <div class="scout-section">
        <span class="scout-section-label">Analyzed role</span>
        <select id="scout-node-select" class="fmm-select">${opts}</select>
      </div>`;
  } else if (compatibleOpts.length === 1) {
    const o = compatibleOpts[0];
    const zone = ZONE_ROLES[getZoneKey(o.node.x, o.node.y)]?.label || o.node.role;
    nodeSelectorHTML = `
      <div class="scout-section">
        <span class="scout-section-label">Analyzed role</span>
        <div class="fmm-input" style="opacity:0.7">${o.node.role} (${zone}) — ${o.score}%</div>
      </div>`;
  }

  content.innerHTML = `
    <div class="scout-comp">
      <div class="scout-comp-header">
        <div class="scout-comp-avatar">${nameInitials(target.name)}</div>
        <div class="scout-comp-info">
          <div class="scout-comp-name">${target.name}</div>
          <div class="scout-comp-meta">${[target.age ? target.age + ' yrs' : null, target.nationality, target.value, target.wage].filter(Boolean).join(' · ')}</div>
        </div>
        ${scoreHTML}
      </div>
      ${nodeSelectorHTML}
      <div id="scout-analysis-body"></div>
    </div>`;

  // Wire node selector
  content.querySelector('#scout-node-select')?.addEventListener('change', e => {
    _scoutNodeId    = parseInt(e.target.value);
    _scoutCompareId = null;
    renderScoutAnalysisBody(target, compatibleOpts);
  });

  if (compatibleOpts.length === 0) {
    document.getElementById('scout-analysis-body').innerHTML =
      '<div class="scout-incompat">⚠️ Incompatible with the active formation — no zones covered by this player.</div>';
  } else {
    renderScoutAnalysisBody(target, compatibleOpts);
  }
}

function renderScoutAnalysisBody(target, compatibleOpts) {
  const body = document.getElementById('scout-analysis-body');
  if (!body || compatibleOpts.length === 0) return;

  const selNodeId = (_scoutNodeId !== null && compatibleOpts.find(o => o.node.id === _scoutNodeId))
    ? _scoutNodeId : compatibleOpts[0].node.id;
  const selOpt   = compatibleOpts.find(o => o.node.id === selNodeId) || compatibleOpts[0];
  const selNode  = selOpt.node;
  const tScore   = selOpt.score;

  // Market data for this node
  const marketData = computeMarketData();
  const nodeMarket = marketData.find(d => d.node.id === selNode.id);

  const verdict = computeScoutVerdict(tScore, nodeMarket);

  // Squad players compatible with this node
  const candidates = state.squad
    .filter(p => !p.isScoutTarget && isCompatible(p, selNode.role))
    .map(p => ({ player: p, score: scorePlayerForNode(p, selNode) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const defaultCmpId = nodeMarket?.starter?.player?.id ?? candidates[0]?.player?.id ?? null;
  const cmpId        = (_scoutCompareId !== null && candidates.find(c => c.player.id === _scoutCompareId))
    ? _scoutCompareId : defaultCmpId;
  const cmpPlayer    = cmpId ? state.squad.find(p => p.id === cmpId) : null;

  const cmpOpts = candidates.map(({ player, score }) =>
    `<option value="${player.id}" ${player.id === cmpId ? 'selected' : ''}>${truncate(player.name, 18)} — ${score}%</option>`
  ).join('');

  const cmpSelectHTML = candidates.length > 0
    ? `<div class="scout-section">
         <span class="scout-section-label">Compare with</span>
         <select id="scout-compare-select" class="fmm-select">
           <option value="">— No comparison —</option>
           ${cmpOpts}
         </select>
       </div>`
    : `<div class="scout-section"><span class="scout-section-label muted">No compatible squad players</span></div>`;

  body.innerHTML = `
    <div class="scout-verdict-box ${verdict.cls}">
      <div class="scout-verdict-label">${verdict.label}</div>
      <div class="scout-verdict-desc">${verdict.desc}</div>
    </div>
    ${cmpSelectHTML}
    ${cmpPlayer ? buildStatBarsHTML(target, cmpPlayer, selNode) : ''}`;

  body.querySelector('#scout-compare-select')?.addEventListener('change', e => {
    _scoutCompareId = e.target.value ? parseInt(e.target.value) : null;
    renderScoutAnalysisBody(target, compatibleOpts);
  });
}

function computeScoutVerdict(targetScore, nodeMarket) {
  const urgency      = nodeMarket?.urgency;
  const starterScore = nodeMarket?.starter?.score ?? 0;
  const backupScore  = nodeMarket?.backup?.score  ?? 0;

  // Dynamic thresholds relative to current category benchmark
  const benchmark  = state.targetBenchmark;
  const starterMin = Math.round(benchmark * 0.85);
  const backupMin  = Math.round(benchmark * 0.70);

  // 1. Below the minimum standard for this category — always disqualified
  if (targetScore < backupMin) return {
    label: 'INSUFFICIENT QUALITY', cls: 'verdict-insufficient',
    desc:  `Player does not meet the minimum category standard (${targetScore}% vs min. ${backupMin}%). Not suitable for the squad.`,
  };

  // 2. Weaker than BOTH starter and backup already in squad — redundant regardless of urgency
  if (targetScore <= starterScore && targetScore <= backupScore) return {
    label: 'NOT RECOMMENDED', cls: 'verdict-redundant',
    desc:  `The squad already covers this role with stronger players: starter ${starterScore}%, backup ${backupScore}%. Signing (${targetScore}%) would be redundant.`,
  };

  // 3. Better than backup but not starter — viable depth signing if need exists
  if (targetScore <= starterScore && targetScore > backupScore) {
    if (urgency === 'high' || urgency === 'med') return {
      label: 'RECOMMENDED SIGNING', cls: 'verdict-recommended',
      desc:  `Player (${targetScore}%) improves depth: beats current backup (${backupScore}%) but remains below starter (${starterScore}%).`,
    };
    return {
      label: 'NOT RECOMMENDED', cls: 'verdict-redundant',
      desc:  `Starter (${starterScore}%) already covers this role adequately and backup need is not urgent. Signing (${targetScore}%) is not a priority.`,
    };
  }

  // 4. Clear upgrade over the current starter
  if (urgency === 'high') return {
    label: 'PRIORITY SIGNING', cls: 'verdict-priority',
    desc:  `Position is uncovered and the player (${targetScore}%) exceeds the required standard (threshold ${starterMin}%). High-priority signing.`,
  };
  return {
    label: 'QUALITY UPGRADE', cls: 'verdict-upgrade',
    desc:  `Player (${targetScore}%) beats the current starter (${starterScore}%) by ${targetScore - starterScore} points. Upgrade recommended.`,
  };
}

function buildStatBarsHTML(target, cmpPlayer, node) {
  const tScore   = scorePlayerForNode(target, node);     // already capped 0–100
  const cScore   = scorePlayerForNode(cmpPlayer, node);
  const maxScore = 100;

  const tTech = attrGroupAvg(target,    'technical');
  const cTech = attrGroupAvg(cmpPlayer, 'technical');
  const tMent = attrGroupAvg(target,    'mental');
  const cMent = attrGroupAvg(cmpPlayer, 'mental');
  const tPhys = attrGroupAvg(target,    'physical');
  const cPhys = attrGroupAvg(cmpPlayer, 'physical');

  const bar = (val, max, cls) =>
    `<div class="scout-bar-track"><div class="scout-bar-fill ${cls}" style="width:${Math.round((val / max) * 100)}%"></div></div>`;

  const row = (label, tVal, cVal, max, fmt) => `
    <div class="scout-stat-row">
      <div class="scout-stat-label">${label}</div>
      <div class="scout-stat-pair">
        <div class="scout-bar-row">
          <span class="scout-bar-player">${truncate(target.name, 12)}</span>
          ${bar(tVal, max, 'target')}
          <span class="scout-bar-val">${fmt(tVal)}</span>
        </div>
        <div class="scout-bar-row">
          <span class="scout-bar-player">${truncate(cmpPlayer.name, 12)}</span>
          ${bar(cVal, max, 'compare')}
          <span class="scout-bar-val">${fmt(cVal)}</span>
        </div>
      </div>
    </div>`;

  return `<div class="scout-stats">
    ${row('Tactical Score', tScore, cScore, maxScore, v => v + '%')}
    ${row('Technical Avg',  tTech,  cTech,  20,       v => v.toFixed(1))}
    ${row('Mental Avg',     tMent,  cMent,  20,       v => v.toFixed(1))}
    ${row('Physical Avg',   tPhys,  cPhys,  20,       v => v.toFixed(1))}
  </div>`;
}

function attrGroupAvg(player, group) {
  const src   = player.type === 'goalkeeper' ? ATTRS_GK : ATTRS_OUTFIELD;
  const attrs = src[group] || [];
  if (!attrs.length) return 0;
  return attrs.reduce((sum, a) => sum + (player.attrs?.[a] || 0), 0) / attrs.length;
}

/* ─── SQUAD PLAN ─────────────────────────────────────────────────────────── */

const SP_TIERS = [
  { key: 'starter', label: 'Starter',  max: 1,    color: '#39ff14' },
  { key: 'bench',   label: 'Bench',    max: null, color: '#00e5ff' },
  { key: 'third',   label: 'Third Choice', max: null, color: '#ffdf00' },
  { key: 'youth',   label: 'Youth',    max: null, color: '#ff9500' },
];

const SP_ZONE_ORDER = ['GK','DEF_C','DEF_W','DM_C','DM_W','CM_C','CM_W','AM_C','AM_W','ATT_C','ATT_W'];

let _spPopoverState = null; // { nodeId, tier }

/* ── Plan helpers ─────────────────────────────────────────────────────────── */

function getNodePlan(nodeId) {
  if (!state.plan[nodeId]) {
    state.plan[nodeId] = { starter: null, bench: [], third: [], youth: [] };
  }
  return state.plan[nodeId];
}

function isPlanConfigured() {
  return Object.values(state.plan).some(p => p && p.starter !== null);
}

function findPlayerAsStarter(playerId) {
  for (const [nid, plan] of Object.entries(state.plan)) {
    if (plan && plan.starter === playerId) return parseInt(nid);
  }
  return null;
}

function playerTierOnNode(nodeId, playerId) {
  const plan = state.plan[nodeId];
  if (!plan) return null;
  if (plan.starter === playerId)          return 'starter';
  if (plan.bench?.includes(playerId))     return 'bench';
  if (plan.third?.includes(playerId))     return 'third';
  if (plan.youth?.includes(playerId))     return 'youth';
  return null;
}

function cleanOrphanPlan(validNodeIds) {
  const validSet = new Set(validNodeIds.map(Number));
  Object.keys(state.plan).forEach(nid => {
    if (!validSet.has(parseInt(nid))) delete state.plan[nid];
  });
}

// Returns null if assignment is allowed, or an error string if blocked
function canAssignToTier(nodeId, tier, playerId) {
  // Already in this exact slot
  if (playerTierOnNode(nodeId, playerId) === tier) return 'Player already in this tier.';
  // Already in another tier of this same node
  if (playerTierOnNode(nodeId, playerId) !== null)  return 'Already assigned in another tier of this role.';
  // Starter anywhere → locked to that node only
  const starterNode = findPlayerAsStarter(playerId);
  if (starterNode !== null) {
    const node = state.nodes.find(n => n.id === starterNode);
    return `Starter of ${node?.role || 'another role'}. Remove them first.`;
  }
  // Youth tier age gate: U23 only (soft block — visible but not clickable)
  if (tier === 'youth') {
    const player = state.squad.find(p => p.id === playerId);
    if (player?.age && player.age > 23) {
      return 'Over 23 years old (Not eligible for Youth).';
    }
  }
  // Trying to add as starter but player is already bench/third/youth elsewhere — allowed
  // (only starter→other-node is blocked, bench can multi-assign freely)
  return null;
}

function assignToPlan(nodeId, tier, playerId) {
  const plan = getNodePlan(nodeId);
  if (tier === 'starter') {
    plan.starter = playerId;
  } else {
    if (!plan[tier]) plan[tier] = [];
    if (!plan[tier].includes(playerId)) plan[tier].push(playerId);
  }
}

function removeFromPlanTier(nodeId, tier, playerId) {
  const plan = state.plan[nodeId];
  if (!plan) return;
  if (tier === 'starter') {
    if (plan.starter === playerId) plan.starter = null;
  } else {
    if (plan[tier]) plan[tier] = plan[tier].filter(id => id !== playerId);
  }
}

/* ── Squad Plan render ────────────────────────────────────────────────────── */

let _spSelectedNodeId = null;

function renderSquadPlan() {
  renderSpPitch();
  const node = _spSelectedNodeId != null
    ? state.nodes.find(n => n.id === _spSelectedNodeId)
    : null;
  if (node) renderSpPanel(node);
  else      showSpPlaceholder();
}

function renderSpPitch() {
  const container = document.getElementById('sp-pitch-nodes');
  if (!container) return;

  const nodes = state.nodes.filter(n => n.role);
  container.innerHTML = nodes.map(node => {
    const plan = getNodePlan(node.id);
    const hasStarter = plan.starter != null;
    const hasAny    = hasStarter
      || (plan.bench  || []).length > 0
      || (plan.third  || []).length > 0
      || (plan.youth  || []).length > 0;
    const statusCls  = hasStarter ? 'sp-node--starter'
                     : hasAny    ? 'sp-node--partial'
                     :             '';
    const selectedCls = node.id === _spSelectedNodeId ? 'sp-node--selected' : '';
    return `<div class="sp-pitch-node ${statusCls} ${selectedCls}"
                 style="left:${node.x}%;top:${node.y}%"
                 data-node-id="${node.id}">
      ${shortRole(node.role)}
    </div>`;
  }).join('');

  container.querySelectorAll('.sp-pitch-node').forEach(el => {
    el.addEventListener('click', () => {
      _spSelectedNodeId = parseInt(el.dataset.nodeId);
      renderSquadPlan();
    });
  });
}

function showSpPlaceholder() {
  document.getElementById('sp-panel-placeholder')?.classList.remove('hidden');
  document.getElementById('sp-panel-content')?.classList.add('hidden');
}

/* Short label for each tier button */
const SP_TIER_BTN_LABEL = { starter: 'Start.', bench: 'Bench', third: '3rd T.', youth: 'Youth' };

function renderSpPanel(node) {
  document.getElementById('sp-panel-placeholder')?.classList.add('hidden');
  const content = document.getElementById('sp-panel-content');
  if (!content) return;
  content.classList.remove('hidden');

  const plan      = getNodePlan(node.id);
  const zoneKey   = getZoneKey(node.x, node.y);
  const zoneLabel = ZONE_ROLES[zoneKey]?.label || zoneKey;

  // Eligible candidates: fam ≥ 1 on the EXACT side of this node
  const candidates = state.squad
    .filter(p => !p.isScoutTarget)
    .map(p => {
      const score = squadPlanScore(p, node);         // null if ineligible
      if (score === null) return null;
      const famLevel = nodeFamLevel(p, node);        // exact-side fam for display
      const tier     = playerTierOnNode(node.id, p.id);
      return { player: p, score, famLevel, tier };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  // Legend chips
  const legendHTML = SP_TIERS.map(t =>
    `<span class="sp-legend-chip" style="--tier-color:${t.color}">${t.label}</span>`
  ).join('');

  content.innerHTML = `
    <div class="sp-panel-header">
      <span class="sp-role-badge">${shortRole(node.role)}</span>
      <div class="sp-card-info">
        <span class="sp-role-name">${node.role}</span>
        <span class="sp-zone-label">${zoneLabel}</span>
      </div>
    </div>
    <div class="sp-legend">${legendHTML}</div>
    <div class="sp-candidates-list" id="sp-candidates-list"></div>
  `;

  const listEl = content.querySelector('#sp-candidates-list');

  if (candidates.length === 0) {
    listEl.innerHTML = '<p class="muted" style="padding:16px 12px;font-size:13px">No compatible players for this role.</p>';
    return;
  }

  // Split: assigned first, then unassigned
  const assigned   = candidates.filter(c => c.tier !== null);
  const unassigned = candidates.filter(c => c.tier === null);

  const buildRow = ({ player, score, famLevel, tier }) => {
    const scoreColor     = score >= 70 ? '#39ff14' : score >= 50 ? '#00e5ff' : '#aaa';
    const famColor       = FAM_COLORS[famLevel];
    const starterNodeId  = findPlayerAsStarter(player.id);
    const isStarterElsewhere = !tier && starterNodeId !== null && starterNodeId !== node.id;
    const starterSlotFull    = !tier && plan.starter !== null;

    let actionHTML;
    if (tier) {
      const tierMeta = SP_TIERS.find(t => t.key === tier);
      actionHTML = `
        <div class="sp-cand-assigned">
          <span class="sp-assigned-badge" style="--tier-color:${tierMeta.color}">${tierMeta.label}</span>
          <button class="sp-candidate-remove" data-pid="${player.id}" data-tier="${tier}" title="Remove from tier">×</button>
        </div>`;
    } else if (isStarterElsewhere) {
      const sNode = state.nodes.find(n => n.id === starterNodeId);
      actionHTML = `<span class="sp-candidate-blocked" title="Starter for ${sNode?.role || 'another role'}">🔒</span>`;
    } else {
      const overAgeForYouth = t => t.key === 'youth' && player.age && player.age > 23;
      const tierBtns = SP_TIERS.map(t => {
        let disabled = false, disabledReason = '';
        if (t.key === 'starter' && starterSlotFull) {
          disabled = true; disabledReason = 'Starter slot full';
        } else if (overAgeForYouth(t)) {
          disabled = true; disabledReason = 'not eligible (over 23 years old)';
        }
        return `<button class="sp-tier-btn${disabled ? ' sp-tier-btn--disabled' : ''}"
          data-tier="${t.key}" data-pid="${player.id}"
          title="${t.label}${disabled ? ` — ${disabledReason}` : ''}"
          style="--tier-color:${t.color}"
          ${disabled ? 'disabled' : ''}>${SP_TIER_BTN_LABEL[t.key]}</button>`;
      }).join('');
      actionHTML = `<div class="sp-tier-btns">${tierBtns}</div>`;
    }

    const row = document.createElement('div');
    row.className = 'sp-candidate-row' + (tier ? ` sp-cand--${tier}` : '');
    row.innerHTML = `
      <div class="sp-cand-fam" style="background:${famColor}" title="${FAM_LABELS[famLevel]}"></div>
      <div class="sp-cand-info">
        <span class="sp-cand-name">${player.name}</span>
        <span class="sp-cand-meta">${player.age || '?'} · <span style="color:${famColor}">${FAM_LABELS[famLevel]}</span></span>
      </div>
      <span class="sp-cand-score" style="color:${scoreColor}">${score}%</span>
      <div class="sp-cand-actions">${actionHTML}</div>
    `;

    row.querySelectorAll('.sp-tier-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid     = parseInt(btn.dataset.pid);
        const tierKey = btn.dataset.tier;
        const err     = canAssignToTier(node.id, tierKey, pid);
        if (err) return;
        assignToPlan(node.id, tierKey, pid);
        saveState();
        maybeRenderMarket();
        renderSquadPlan();
      });
    });

    row.querySelector('.sp-candidate-remove')?.addEventListener('click', e => {
      e.stopPropagation();
      const btn = e.currentTarget;
      removeFromPlanTier(node.id, btn.dataset.tier, parseInt(btn.dataset.pid));
      saveState();
      maybeRenderMarket();
      renderSquadPlan();
    });

    return row;
  };

  if (assigned.length > 0) {
    const hdr = document.createElement('div');
    hdr.className = 'sp-section-hdr';
    hdr.textContent = 'Assigned';
    listEl.appendChild(hdr);
    assigned.forEach(c => listEl.appendChild(buildRow(c)));
  }

  if (unassigned.length > 0) {
    if (assigned.length > 0) {
      const hdr = document.createElement('div');
      hdr.className = 'sp-section-hdr sp-section-hdr--candidates';
      hdr.textContent = 'Available candidates';
      listEl.appendChild(hdr);
    }
    unassigned.forEach(c => listEl.appendChild(buildRow(c)));
  }
}

/* ── Squad Plan popover — replaced by inline candidate list ──────────────── */

function openSpPopover()  { /* deprecated */ }
function closeSpPopover() { }
function bindSpPopover()  { }

/* ─── MASTERPLAN UPDATE ─────────────────────────────────────────────────── */
// App fully initialised — no external calls, all data stays in browser RAM.
