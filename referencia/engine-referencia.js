/* ===== Motor de turnos ===== */
const HRS = { M: 6, T: 6, N: 12, MT: 12, L: 0, V: 0, I: 0, P: 0 };
const WORK = ['M', 'T', 'N'];
const OFF = ['V', 'I', 'P'];
function daysIn(y, m) { return new Date(y, m + 1, 0).getDate(); }
function dow(y, m, d) { return new Date(y, m, d).getDay(); } // 0=dom
function isWeekend(y, m, d) { const w = dow(y, m, d); return w === 0 || w === 6; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const isSup = (p, rules) => rules.support === 'need' && p.kind === 'apoyo';
const NEXT = { M: 'T', T: 'N', N: 'L', L: 'M', '': 'M' };

/* grid: {personId: Array(n)} ; locked: {personId: {dayIndex: code}} */
function generate(cfg) {
  const { year, month, staff, cov, rules, locked, seed } = cfg;
  const n = daysIn(year, month), rand = rng(seed || 1);
  const grid = {}, st = {};
  staff.forEach(p => {
    grid[p.id] = Array(n).fill('');
    let avail = 0;
    for (let i = 0; i < n; i++) { const c = (locked[p.id] || {})[i]; if (!c || !OFF.includes(c)) avail++; }
    const pv = (cfg.prev || {})[p.id] || []; let lc = pv.length ? pv[pv.length - 1] : '', cs = 0;
    for (let k = pv.length - 1; k >= 0 && (WORK.includes(pv[k]) || pv[k] === 'MT'); k--) cs++;
    st[p.id] = { last: lc === 'MT' ? 'T' : (OFF.includes(lc) ? 'L' : lc), consec: cs, h: 0, nights: 0, wk: 0, w: Math.max(avail, 1) / n };
  });
  const jit = {}; staff.forEach(p => jit[p.id] = rand() * 6);
  for (let d = 0; d < n; d++) {
    const wkend = isWeekend(year, month, d + 1), taken = new Set();
    // 1) celdas fijadas por el usuario
    staff.forEach(p => { const c = (locked[p.id] || {})[d]; if (c) { grid[p.id][d] = c; taken.add(p.id); } });
    const need = { N: cov.N, T: cov.T, M: cov.M };
    taken.forEach(id => { const c = grid[id][d]; if (need[c] != null) need[c] = Math.max(0, need[c] - 1); if (c === 'MT') { need.M = Math.max(0, need.M - 1); need.T = Math.max(0, need.T - 1); } });
    for (const sh of ['N', 'T', 'M']) {
      for (let k = 0; k < need[sh]; k++) {
        let best = null;
        for (const pass of [0, 1]) {
          let bs = Infinity;
          for (const p of staff) {
            if (taken.has(p.id)) continue;
            if ((pass === 0) === isSup(p, rules)) continue;
            const s = st[p.id];
            if (rules.restAfterN && s.last === 'N') continue;
            if (rules.seq && s.last === 'T' && sh === 'M') continue;
            if (s.consec >= rules.maxConsec) continue;
            let sc = (s.h / s.w) * 2 + s.consec * 4 + jit[p.id];
            if (rules.seq) {
              if (NEXT[s.last] === sh) sc -= 45;
              else if ((s.last === 'L' || s.last === '') && sh === 'M') sc -= 25;
              else sc += 30;
            }
            if (wkend && rules.weekends) sc += s.wk * 14;
            if (sh === 'N') sc += s.nights * 6;
            if (sc < bs) { bs = sc; best = p; }
          }
          if (best) break;
        }
        if (best) { grid[best.id][d] = sh; taken.add(best.id); }
      }
    }
    staff.forEach(p => {
      const s = st[p.id]; let c = grid[p.id][d];
      if (!c) { c = 'L'; grid[p.id][d] = 'L'; }
      s.h += HRS[c] || 0;
      if (WORK.includes(c) || c === 'MT') { s.consec++; if (wkend) s.wk++; if (c === 'N') s.nights++; } else s.consec = 0;
      s.last = c === 'MT' ? 'T' : c;
    });
  }
  if (rules.balance) balance(cfg, grid, n, rand);
  return grid;
}

/* Ajuste fino: intercambia turnos entre dos terapeutas el mismo día si reduce la diferencia de horas y no rompe reglas */
function balance(cfg, grid, n, rand) {
  const { staff, rules, locked } = cfg;
  const hours = id => grid[id].reduce((a, c) => a + (HRS[c] || 0), 0);
  const tgt = targets(cfg, grid, n);
  const dev = id => hours(id) - tgt[id];
  const lock = (id, i) => (locked[id] || {})[i];
  const cost = () => { let s = 0; staff.forEach(p => { if (tgt[p.id] != null) s += Math.abs(dev(p.id)) ** 2; }); return s + 400 * validate(cfg, grid).filter(v => v.sev === 'err').length; };
  let cur = cost();
  for (let it = 0; it < 8000; it++) {
    const a = staff[(rand() * staff.length) | 0], b = staff[(rand() * staff.length) | 0];
    if (a.id === b.id || isSup(a, rules) !== isSup(b, rules)) continue;
    const i = (rand() * n) | 0;
    if (lock(a.id, i) || lock(b.id, i)) continue;
    const ca = grid[a.id][i], cb = grid[b.id][i];
    if (ca === cb) continue;
    grid[a.id][i] = cb; grid[b.id][i] = ca;
    const c2 = cost();
    if (c2 < cur) cur = c2; else { grid[a.id][i] = ca; grid[b.id][i] = cb; }
  }
}

function targets(cfg, grid, n) {
  const { staff, cov, rules } = cfg;
  const perDay = cov.M * 6 + cov.T * 6 + cov.N * 12;
  let total = perDay * n, wsum = 0; const w = {}, t = {};
  staff.forEach(p => {
    if (isSup(p, rules)) { total -= grid[p.id].reduce((a, c) => a + (HRS[c] || 0), 0); return; }
    let a = 0; for (let i = 0; i < n; i++) if (!OFF.includes(grid[p.id][i])) a++; w[p.id] = a; wsum += a;
  });
  staff.forEach(p => { t[p.id] = isSup(p, rules) ? null : (wsum ? Math.max(total, 0) * w[p.id] / wsum : 0); });
  return t;
}

/* Validación: devuelve [{id, day, sev:'err'|'warn', msg}] ; day -1 = fila completa ; pid null = cobertura */
function validate(cfg, grid) {
  const { year, month, staff, cov, rules } = cfg, n = daysIn(year, month), out = [];
  staff.forEach(p => {
    const g = grid[p.id]; let run = 0;
    for (let i = 0; i < n; i++) {
      const c = g[i], nx = g[i + 1];
      const w = WORK.includes(c) || c === 'MT';
      run = w ? run + 1 : 0;
      if (rules.restAfterN && c === 'N' && nx && nx !== 'L' && !OFF.includes(nx)) out.push({ id: p.id, day: i + 1, sev: 'err', msg: `${p.name}: trabaja el ${i + 2} después de noche (falta descanso)` });
      if (rules.seq && c === 'T' && nx === 'M') out.push({ id: p.id, day: i + 1, sev: 'warn', msg: `${p.name}: tarde y mañana consecutivas (${i + 1}→${i + 2}), solo 12 h de descanso` });
      if (run > rules.maxConsec) out.push({ id: p.id, day: i + 1, sev: 'err', msg: `${p.name}: ${run} días seguidos de trabajo (máx. ${rules.maxConsec})` });
    }
  });
  for (let i = 0; i < n; i++) {
    for (const sh of ['M', 'T', 'N']) {
      let c = 0;
      staff.forEach(p => { const x = grid[p.id][i]; if (x === sh || (x === 'MT' && sh !== 'N')) c++; });
      if (c < cov[sh]) out.push({ id: null, day: i + 1, sev: 'err', sh, msg: `Día ${i + 1}: falta cubrir turno ${sh} (${c}/${cov[sh]})` });
      else if (c > cov[sh]) out.push({ id: null, day: i + 1, sev: 'warn', sh, msg: `Día ${i + 1}: sobran terapeutas en turno ${sh} (${c}/${cov[sh]})` });
    }
  }
  return out;
}
if (typeof module !== 'undefined') module.exports = { generate, validate, targets, HRS, daysIn };
