/* FestOS decision engine — pure functions, no DOM. state S in -> decisions out. */
(function (g) {
const D = g.DATA || require('./data.js');
const DAY0 = Date.parse('2026-10-30T00:00:00');
const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const dayIdx = s => Math.round((Date.parse(s.slice(0, 10) + 'T00:00:00') - DAY0) / 864e5);
const fmtT = m => { const d = Math.floor(m / 1440), x = m % 1440; return ['Oct 30', 'Oct 31', 'Nov 1', 'Nov 2'][d] + ' ' + String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
const gk = x => /^female$/i.test(x) ? 'F' : /^male$/i.test(x) ? 'M' : 'U'; 
const FEST_START = '2026-10-30', FEST_END = '2026-11-01';
const FEST_DATES = ['2026-10-30', '2026-10-31', '2026-11-01'];

const defaultState = () => ({ user: null, closedBlocks: [], roomOut: [], deadVendors: [], broken: {}, venueOut: [], late: [], merged: {}, issued: {}, budget: 2000000, budgetOverride: null, sticky: {}, audit: [], notes: {}, capOverride: [] });

const people = S => D.participants.filter(p => !S.merged[p.participant_id]).concat(S.late || []);
const nights = p => { const a = dayIdx(p.arrival_datetime), d = dayIdx(p.departure_datetime); return Math.max(1, d - a); };

/* ---------- 1. Data reconciliation ---------- */
function quality(S) {
  const P = D.participants, reg = new Set(D.registrations.map(r => r.participant_id));
  const byKey = {}; P.forEach(p => { const k = [p.name, p.college, p.age, p.gender_as_given, p.tshirt_size].join('|').toLowerCase(); (byKey[k] = byKey[k] || []).push(p); });
  const dups = Object.values(byKey).filter(a => a.length > 1);
  const cs = {}; P.forEach(p => cs[p.contingent_id] = (cs[p.contingent_id] || 0) + 1);
  const mism = D.contingents.map(c => ({ ...c, listed: cs[c.contingent_id] || 0, diff: (cs[c.contingent_id] || 0) - (+c.strength_declared) })).filter(c => c.diff);
  const bad = P.filter(p => p.departure_datetime < p.arrival_datetime);
  const noReg = P.filter(p => !reg.has(p.participant_id));
  return {
    raw: P.length, expected: 2400, declared: D.contingents.reduce((a, c) => a + +c.strength_declared, 0), withReg: reg.size, noReg, dups, mism, badDates: bad,
    blankGender: P.filter(p => gk(p.gender_as_given) === 'U').length, blankDiet: P.filter(p => !p.dietary_needs).length,
    noStay: P.filter(p => p.accommodation_requested !== 'yes').length, merged: Object.keys(S.merged).length,
    early: P.filter(p => p.arrival_datetime < '2026-10-30').length
  };
}

/* ---------- 2. Accommodation ---------- */
function allocate(S) {
  const closed = new Set(S.closedBlocks), out = new Set(S.roomOut);
  const rooms = D.hostels.filter(r => r.status === 'available' && !closed.has(r.block) && !out.has(r.room_id)).map(r => ({ ...r, cap: +r.capacity, occ: [] }))
    .sort((a, b) => a.block.localeCompare(b.block) || a.floor - b.floor || a.room_id.localeCompare(b.room_id));
  const csize = {}; D.contingents.forEach(c => csize[c.contingent_id] = +c.strength_declared);
  const P = people(S).filter(p => p.accommodation_requested === 'yes').sort((a, b) => (csize[b.contingent_id] || 0) - (csize[a.contingent_id] || 0) || a.contingent_id.localeCompare(b.contingent_id));
  const res = {}, left = [];
  const pool = p => gk(p.gender_as_given) === 'F' ? 'girls' : gk(p.gender_as_given) === 'M' ? 'boys' : null;
  const put = (p, r, note) => { r.occ.push(p); res[p.participant_id] = { kind: 'hostel', room: r.room_id, block: r.block, flags: note ? [note] : [] }; };
  const pick = (p, f) => { const c = rooms.filter(r => r.gender === pool(p) && r.occ.length < r.cap && f(r)); return c.find(r => r.occ.some(o => o.contingent_id === p.contingent_id)) || c.find(r => !r.occ.length) || c[0]; };
  const need = p => p.accessibility_needs || ''; 
  const isMedicalSafety = p => /medical|safety|emergency/i.test(need(p));

  const todo = [];
  for (const p of P) { 
    if (!pool(p)) { 
      left.push({ p, why: 'Gender not declared as Male/Female (' + (p.gender_as_given || 'blank') + '). Not forced into a gendered hostel; needs a private/inclusive placement confirmed by a person.' }); 
      continue; 
    } 
    todo.push(p); 
  }

  const byRoom = {}; rooms.forEach(r => byRoom[r.room_id] = r); const kept = new Set();
  for (const p of todo) { 
    const r = byRoom[(S.sticky || {})[p.participant_id]]; 
    if (r && r.occ.length < r.cap && r.gender === pool(p) && (need(p) !== 'Wheelchair access' || r.accessibility === 'yes')) { 
      put(p, r); 
      kept.add(p.participant_id); 
    } 
  }
  todo.splice(0, todo.length, ...todo.filter(p => !kept.has(p.participant_id)));

  const med = todo.filter(p => isMedicalSafety(p));
  const wc = todo.filter(p => !med.includes(p) && need(p) === 'Wheelchair access');
  const gr = todo.filter(p => !med.includes(p) && ['Ground floor / no stairs', 'Near washroom', 'Visual assistance'].includes(need(p)));
  const rest = todo.filter(p => !med.includes(p) && !wc.includes(p) && !gr.includes(p));

  med.forEach(p => {
    const r = pick(p, r => need(p) !== 'Wheelchair access' || r.accessibility === 'yes');
    if (r) {
      put(p, r, 'CRITICAL HARD CONSTRAINT: Prioritized for internal hostel due to Medical Safety requirements');
    } else {
      left.push({ p, why: 'STRICT HARD CONSTRAINT CRITICAL: Medical Safety participant cannot be assigned to internal hostel (hostels full) and is PROHIBITED from external property assignment.' });
    }
  });

  wc.forEach(p => { 
    const r = pick(p, r => r.accessibility === 'yes'); 
    r ? put(p, r) : left.push({ p, why: 'HARD: wheelchair access needs an accessible room; none left in hostels (' + rooms.filter(r => r.accessibility === 'yes').length + ' accessible rooms total).' }); 
  });
  
  gr.forEach(p => { 
    const r = pick(p, r => r.floor === '0' && r.accessibility !== 'yes') || pick(p, r => r.floor === '0'); 
    r ? put(p, r, need(p) === 'Ground floor / no stairs' ? '' : 'Assumed ground floor ≈ nearest washroom (no washroom data in hostels.csv)') : left.push({ p, why: 'HARD: ' + need(p) + ' — no ground-floor space left.' }); 
  });
  
  rest.forEach(p => { 
    const r = pick(p, r => true); 
    r ? put(p, r) : left.push({ p, why: 'Hostel beds exhausted for ' + pool(p) + '.' }); 
  });

  const props = D.external_stays.map(e => ({ ...e, beds: +e.beds, cost: +e.cost_per_bed_per_night, used: 0 })).sort((a, b) => a.cost - b.cost);
  const budget = S.budget + (S.budgetOverride ? S.budgetOverride.extra : 0);
  let spent = 0; const unfunded = [], unplaced = [];
  left.sort((a, b) => a.p.contingent_id.localeCompare(b.p.contingent_id));

  for (const { p, why } of left) {
    if (!pool(p)) {
      unplaced.push({ p, why: why + ' STRICT POLICY: Cannot auto-assign undisclosed gender.' });
      res[p.participant_id] = { kind: 'none', flags: ['MANUAL REVIEW REQUIRED: Gender not explicitly Male/Female. Requires human-confirmed inclusive placement.'] };
      continue;
    }
    if (isMedicalSafety(p)) {
      unplaced.push({ p, why: why + ' STRICT POLICY: Barred from external stays for medical safety.' });
      res[p.participant_id] = { kind: 'none', flags: ['STRICT HARD CONSTRAINT: External property assignment BLOCKED due to Medical Safety requirement.'] };
      continue;
    }
    if (need(p) === 'Wheelchair access') {
      unplaced.push({ p, why: why + ' Accessible hostel full. Needs manual review.' });
      res[p.participant_id] = { kind: 'none', flags: ['MANUAL REVIEW REQUIRED: Accessible hostel full. Verify external property accessibility manually before placement.'] };
      continue;
    }
    const pr = props.find(x => x.used < x.beds); 
    if (!pr) { 
      unplaced.push({ p, why: why + ' External beds exhausted too.' }); 
      res[p.participant_id] = { kind: 'none', flags: [why] }; 
      continue; 
    }
    const cost = pr.cost * nights(p), flags = [why.startsWith('HARD') ? 'Hard need could not be met in hostel: ' + why : why];
    if (need(p) !== 'None') flags.push('External accessibility unverified (not in external_stays.csv) — call property before confirming');
    const h = +p.arrival_datetime.slice(11, 13); 
    if (h >= 22 || h < 6) flags.push('Night arrival: needs transport + safety escort (' + p.arrival_datetime.slice(11) + ')');
    if (pr.transport_availability !== 'yes') flags.push('Limited transport to ' + pr.property_name);
    if (p.departure_datetime < p.arrival_datetime) flags.push('Departure before arrival in source data — nights assumed 1');
    if (spent + cost > budget) { 
      pr.used++; 
      unfunded.push(p); 
      res[p.participant_id] = { kind: 'unfunded', prop: pr.property_name, cost, flags: flags.concat('Over budget — needs authorized override') }; 
      continue; 
    }
    pr.used++; spent += cost; res[p.participant_id] = { kind: 'ext', prop: pr.property_name, cost, km: pr.distance_km, flags };
  }

  const split = {}; P.forEach(p => { const a = res[p.participant_id]; (split[p.contingent_id] = split[p.contingent_id] || new Set()).add(a.kind === 'hostel' ? a.block : a.kind === 'ext' ? a.prop : 'none'); });
  const cnt = k => Object.values(res).filter(a => a.kind === k).length;
  const accBeds = rooms.filter(r => r.accessibility === 'yes').reduce((a, r) => a + r.cap, 0);
  return {
    res, rooms, props, spent, budget, requested: P.length, hostel: cnt('hostel'), ext: cnt('ext'), unfunded: cnt('unfunded'), unplaced: cnt('none'), manual: left.filter(x => !pool(x.p)).length,
    split: Object.entries(split).map(([c, s]) => ({ c, places: [...s] })).filter(x => x.places.length > 1),
    shortage: { wheelchairDemand: P.filter(p => need(p) === 'Wheelchair access').length, accessibleBeds: accBeds, totalBeds: rooms.reduce((a, r) => a + r.cap, 0), extBeds: props.reduce((a, r) => a + r.beds, 0) }
  };
}

/* ---------- 3. Scheduling & Inventory Availability ---------- */
const EQ = { barricades: 'barricade', projector: 'projector', camera: 'camera', 'extension cords': 'extension cord', mic: 'mic', speaker: 'speaker' };
const goodQty = (S, item) => Math.max(0, D.inventory_logistics.filter(l => l.item === item && l.condition === 'good' && !l.location.toLowerCase().includes('transit')).reduce((a, l) => a + +l.quantity, 0) - (S.broken[item] || 0));

function shiftCover(m) { return D.core_team.filter(t => { const [a, b] = t.shift.split('-').map(mins); return a < b ? m >= a && m < b : m >= a || m < b; }).length; }
function venueFor(ev) {
  const r = ev.venue_requirements, ids = r.includes('open ground') ? ['V04', 'V05', 'V06'] : r.includes('stage') ? ['V01', 'V04'] : r.includes('quiet') ? ['V07', 'V09'] : r.includes('audio') ? ['V01', 'V02', 'V03', 'V04'] : r.includes('projector') ? ['V02', 'V03', 'V07', 'V09'] : D.venues.map(v => v.venue_id);
  return ids;
}

function schedule(S) {
  const regs = {}; D.registrations.forEach(r => { const id = S.merged[r.participant_id] || r.participant_id; (regs[r.event_id] = regs[r.event_id] || new Set()).add(id); });
  const win = {}; D.venues.forEach(v => win[v.venue_id] = v.availability_windows.split(';').map(w => { const [d, t] = w.trim().split(' '), [a, b] = t.split('-'); return [dayIdx(d) * 1440 + mins(a), dayIdx(d) * 1440 + mins(b)]; }));
  const evs = [...D.events].sort((a, b) => (regs[b.event_id]?.size || 0) - (regs[a.event_id]?.size || 0));
  const slots = [], vbusy = {};
  const overlap = (a, b, buf) => a.start < b.end + buf && b.start < a.end + buf;
  
  for (const ev of evs) {
    const set = regs[ev.event_id] || new Set(), dur = +ev.duration_minutes, rounds = ev.rounds.split('|'); let prevEnd = 0;
    
    const eqBad = [];
    if (ev.equipment_needs) {
      ev.equipment_needs.split(';').forEach(req => {
        const str = req.trim();
        if (!str || str.toLowerCase() === 'none') return;
        const match = str.match(/^(\d+)?\s*(.*)$/);
        const reqQty = match[1] ? parseInt(match[1], 10) : 1;
        const rawName = match[2].toLowerCase();
        const itemKey = EQ[rawName] || rawName;
        if (goodQty(S, itemKey) < reqQty) eqBad.push(`${reqQty} ${itemKey} (have ${goodQty(S, itemKey)})`);
      });
    }

    for (const [ri, rd] of rounds.entries()) {
      let best = null, relaxed = false;
      for (const tier of [venueFor(ev), D.venues.map(v => v.venue_id)]) { 
        if (best) break; relaxed = tier.length > venueFor(ev).length || (tier !== venueFor(ev) && relaxed);
        for (const vid of tier) {
          if (S.venueOut.includes(vid)) continue; const v = D.venues.find(x => x.venue_id === vid);
          for (const [ws, we] of win[vid]) for (let t = Math.max(ws, prevEnd); t + dur <= we && t + dur + (rounds.length - ri - 1) * (dur + 120) <= 4080; t += 30) {
            const c = { start: t, end: t + dur }; if ((vbusy[vid] || []).some(b => overlap(c, b, 30))) continue;
            let clash = 0, vol = 0; for (const o of slots) if (overlap(c, o, 15)) { vol += o.vol; for (const p of set) if (o.set.has(p)) clash++; }
            
            // ISSUE 6 FIX: Prevent venue assignment if capacity exceeded, UNLESS explicitly overridden
            const capOver = Math.max(0, set.size - +v.capacity);
            if (capOver > 0 && !S.capOverride.includes(ev.event_id)) continue; 

            const volOver = Math.max(0, vol + +ev.volunteers_needed - shiftCover(t % 1440) * 1.5);
            const sc = clash * 100 + volOver * 4 + capOver * 8 + (t % 1440 < 540 ? 20 : 0) + Math.floor(t / 1440) * 3 + (t % 1440 > 1140 ? 15 : 0);
            if (!best || sc < best.sc) best = { sc, vid, v, start: t, end: t + dur, clash, volOver, capOver };
          }
        } 
      }
      
      // ISSUE 6 FIX: Flag specifically if dropped due to capacity
      if (!best) { 
        const maxCap = Math.max(...D.venues.map(v => +v.capacity));
        const isCap = set.size > maxCap && !S.capOverride.includes(ev.event_id);
        slots.push({ ev, rd, unscheduled: true, set, vol: 0, start: 0, end: 0, isCap, size: set.size }); 
        continue; 
      }
      
      const s = { ev, rd, venue: best.v, start: best.start, end: best.end, set, vol: +ev.volunteers_needed, clash: best.clash, volOver: Math.round(best.volOver), capOver: best.capOver, eqBad, size: set.size, relaxed: relaxed && !venueFor(ev).includes(best.vid) };
      slots.push(s); (vbusy[best.vid] = vbusy[best.vid] || []).push({ start: s.start, end: s.end }); prevEnd = best.end + 90;
    }
  }
  
  const conflicts = [];
  slots.forEach((a, i) => { 
    if (a.unscheduled) { 
        const msg = a.isCap ? `Expected attendance (${a.size}) exceeds all venue capacities. Needs manual approval override.` : `No venue/time left (venue closures or windows).`;
        conflicts.push({ sev: 'high', type: a.isCap ? 'Capacity Violation' : 'Unscheduled', msg: `${a.ev.event_name} ${a.rd}: ${msg}`, ev: a.ev.event_id }); 
        return; 
    }
    slots.slice(i + 1).forEach(b => { if (b.unscheduled || !overlap(a, b, 15)) return; const shared = [...a.set].filter(p => b.set.has(p)); if (shared.length) conflicts.push({ sev: shared.length > 5 ? 'high' : 'med', type: 'Participant clash', msg: `${shared.length} participants in both ${a.ev.event_name} (${a.rd}) and ${b.ev.event_name} (${b.rd}) — ${fmtT(a.start)}`, ev: a.ev.event_id, ids: shared.slice(0, 5) }); });
    if (a.capOver > 0 && S.capOverride.includes(a.ev.event_id)) conflicts.push({ sev: 'med', type: 'Capacity Override', msg: `${a.ev.event_name}: ${a.size} registered vs ${a.venue.venue_name} capacity ${a.venue.capacity} — manually approved.`, ev: a.ev.event_id });
    if (a.volOver > 0) conflicts.push({ sev: 'med', type: 'Volunteer shortfall', msg: `${a.ev.event_name} ${a.rd} at ${fmtT(a.start)}: ~${a.volOver} volunteers short of on-shift cover.`, ev: a.ev.event_id });
    if (a.relaxed) conflicts.push({ sev: 'med', type: 'Relaxed venue rule', msg: `${a.ev.event_name} ${a.rd}: needs "${a.ev.venue_requirements}" but placed in ${a.venue.venue_name}.`, ev: a.ev.event_id });
    if (a.eqBad.length) conflicts.push({ sev: 'high', type: 'Equipment', msg: `${a.ev.event_name} lacks usable inventory: ${a.eqBad.join(', ')}.`, ev: a.ev.event_id }); 
  });
  const seen = new Set(); const uniq = conflicts.filter(c => { const k = c.type + c.msg; if (seen.has(k)) return false; seen.add(k); return true; });
  return { slots, conflicts: uniq, regs };
}

/* ---------- 4. Merchandise & logistics ---------- */
function merch(S) {
  const P = people(S), sizes = {}; P.forEach(p => sizes[p.tshirt_size] = (sizes[p.tshirt_size] || 0) + 1);
  const issued = {}; Object.values(S.issued).forEach(i => { if (i.size) issued[i.size] = (issued[i.size] || 0) + 1; });
  const rows = D.inventory_merch.map(m => { const avail = +m.quantity - +m.reserved_quantity, dem = m.item === 'T-shirt' ? sizes[m.size] || 0 : P.length, used = m.item === 'T-shirt' ? issued[m.size] || 0 : Object.values(S.issued).filter(i => i.items.includes(m.item)).length; const free = avail - used; return { ...m, avail, dem, used, free, gap: avail - dem }; });
  const lg = {}; D.inventory_logistics.forEach(l => { const k = l.item; lg[k] = lg[k] || { item: k, good: 0, check: 0, repair: 0, transit: 0, locs: {} }; const q = +l.quantity, loc = l.location.toLowerCase();
    if (loc.includes('transit') || loc.includes('pending')) lg[k].transit += q; else if (l.condition === 'good') { lg[k].good += q; lg[k].locs[l.location] = (lg[k].locs[l.location] || 0) + q; } else if (l.condition === 'needs check') lg[k].check += q; else lg[k].repair += q; });
  Object.values(lg).forEach(x => { const b = Math.min(S.broken[x.item] || 0, x.good); x.good -= b; x.repair += b; });
  return { rows, logistics: Object.values(lg) };
}

/* ---------- 5. Vendors ---------- */
const DIETS = { Vegetarian: 'vegetarian', 'Non-vegetarian': 'non-vegetarian', Halal: 'halal', Jain: 'jain', 'Gluten-free': 'gluten-free', 'Nut allergy': 'nut-free' };
function vendors(S) {
  const P = people(S), dem = {}; P.forEach(p => { const k = p.dietary_needs || '(blank — unverified)'; dem[k] = (dem[k] || 0) + 1; });
  const vs = D.vendors.map(v => { const cert = v.hygiene_certificate_expiry, st = cert < FEST_DATES[0] ? 'expired' : cert < FEST_DATES[2] ? 'expires during fest' : 'valid', dead = S.deadVendors.includes(v.vendor_id); return { ...v, cert, st, dead, ok: !dead && st !== 'expired', opts: v.dietary_options.split(';').map(x => x.trim()), cap: +v.capacity, limited: v.hours.startsWith('10') }; });
  const cover = Object.keys(dem).map(d => { const key = DIETS[d]; if (!key) return { diet: d, demand: dem[d], vendors: 0, cap: 0, gap: 'unverifiable' }; const ven = vs.filter(v => !v.dead && v.opts.includes(key)); let minCap = Infinity, activeVenCount = 0;
    for (const date of FEST_DATES) { const activeForDay = ven.filter(v => v.cert >= date); const dayCap = activeForDay.reduce((a, v) => a + v.cap, 0); if (dayCap < minCap) { minCap = dayCap; activeVenCount = activeForDay.length; } }
    if (minCap === Infinity) minCap = 0; const gap = activeVenCount === 0 ? 'UNCOVERED' : minCap < dem[d] ? 'thin' : 'ok'; return { diet: d, demand: dem[d], vendors: activeVenCount, cap: minCap, gap }; });
  return { vs, cover };
}

/* ---------- 6. Control tower ---------- */
function snapshot(S) {
  const a = allocate(S), sc = schedule(S), m = merch(S), v = vendors(S), q = quality(S);
  const alerts = []; const add = (sev, mod, msg, act) => alerts.push({ sev, mod, msg, act });
  if (a.unplaced) add('high', 'Accommodation', `${a.unplaced} participants have no bed anywhere (hostel + external exhausted).`, 'Seek more capacity or cut requests');
  if (a.unfunded) add('high', 'Accommodation', `${a.unfunded} placements wait on budget approval (₹${Math.round(a.spent).toLocaleString('en-IN')} spent of ₹${a.budget.toLocaleString('en-IN')}).`, 'Authorized override needed');
  if (a.manual) add('med', 'Accommodation', `${a.manual} people with blank/non-binary/undisclosed gender are in a manual queue — never guessed.`, 'Confirm preference with them');
  if (a.shortage.wheelchairDemand > 0) add(a.shortage.wheelchairDemand > a.shortage.accessibleBeds ? 'high' : 'low', 'Accommodation', `Wheelchair-access demand ${a.shortage.wheelchairDemand} vs ${a.shortage.accessibleBeds} accessible hostel beds.`, 'Arrange accessible external rooms');
  sc.conflicts.filter(c => c.sev === 'high').slice(0, 6).forEach(c => add('high', 'Events', c.msg, 'Open schedule'));
  v.cover.filter(c => c.gap === 'UNCOVERED').forEach(c => add('high', 'Food', `${c.demand} participants need ${c.diet} — no compliant vendor available on at least one day.`, 'Source vendor'));
  v.vs.filter(x => x.st === 'expired').forEach(x => add('high', 'Food', `${x.vendor_name}: hygiene certificate expired ${x.cert} — completely excluded.`, 'Get renewed certificate'));
  v.vs.filter(x => x.st === 'expires during fest').forEach(x => add('med', 'Food', `${x.vendor_name}: certificate expires ${x.cert} — cannot operate on subsequent days.`, 'Get renewed certificate'));
  v.vs.filter(x => x.dead).forEach(x => add('high', 'Food', `${x.vendor_name} shut down.`, 'Redistribute'));
  m.rows.filter(r => r.free < r.dem && r.item === 'T-shirt').forEach(r => add('med', 'Merch', `T-shirt ${r.size}: ${r.avail} usable vs ${r.dem} needed (gap ${r.dem - r.avail}).`, 'Reorder / swap sizes'));
  m.logistics.filter(l => l.good === 0).forEach(l => add('high', 'Logistics', `${l.item}: zero serviceable units at venue (${l.transit} in transit, ${l.repair} under repair).`, 'Expedite transit or repair'));
  if (q.raw !== q.expected) add('low', 'Data', `Pack has ${q.raw} records vs ~${q.expected} expected.`, 'Reconcile');
  if (q.badDates.length) add('low', 'Data', `${q.badDates.length} participants depart before they arrive.`, 'Verify dates');
  return { a, sc, m, v, q, alerts: alerts.sort((x, y) => ({ high: 0, med: 1, low: 2 }[x.sev] - { high: 0, med: 1, low: 2 }[y.sev])) };
}

/* ---------- 7. Ripple: what changed downstream ---------- */
function ripple(A, B) {
  const r = [], moved = Object.keys(B.a.res).filter(k => JSON.stringify(A.a.res[k] && [A.a.res[k].kind, A.a.res[k].room, A.a.res[k].prop]) !== JSON.stringify(B.a.res[k] && [B.a.res[k].kind, B.a.res[k].room, B.a.res[k].prop]));
  const key = s => s.slots.map(x => x.unscheduled ? x.ev.event_id + x.rd + 'X' : x.ev.event_id + x.rd + x.venue.venue_id + x.start);
  const sa = new Set(key(A.sc)), movedEv = [...new Set(key(B.sc).filter(k => !sa.has(k)).map(k => k.slice(0, 3)))];
  r.push({ mod: 'Accommodation', n: moved.length, txt: `${moved.length} participants changed bed; hostel ${A.a.hostel}→${B.a.hostel}, external ${A.a.ext}→${B.a.ext}, unplaced ${A.a.unplaced}→${B.a.unplaced}, spend ₹${Math.round(A.a.spent).toLocaleString('en-IN')}→₹${Math.round(B.a.spent).toLocaleString('en-IN')}` });
  r.push({ mod: 'Events', n: movedEv.length, txt: `${movedEv.length} events re-timed or moved: ${movedEv.slice(0, 8).join(', ') || 'none'}; conflicts ${A.sc.conflicts.length}→${B.sc.conflicts.length}` });
  const newGap = B.v.cover.filter(c => c.gap === 'UNCOVERED' && !A.v.cover.find(x => x.diet === c.diet && x.gap === 'UNCOVERED'));
  r.push({ mod: 'Food', n: newGap.length + (A.v.vs.filter(x => x.ok).length - B.v.vs.filter(x => x.ok).length), txt: `Eligible vendors ${A.v.vs.filter(x => x.ok).length}→${B.v.vs.filter(x => x.ok).length}${newGap.length ? '; newly uncovered: ' + newGap.map(c => c.diet).join(', ') : ''}` });
  const mg = B.m.rows.reduce((s, x) => s + Math.max(0, x.dem - x.free), 0) - A.m.rows.reduce((s, x) => s + Math.max(0, x.dem - x.free), 0);
  r.push({ mod: 'Merch', n: Math.abs(mg), txt: `Merch shortfall ${mg >= 0 ? '+' : ''}${mg} units` });
  r.push({ mod: 'Logistics', n: Math.abs(A.m.logistics.reduce((s, l) => s + l.good, 0) - B.m.logistics.reduce((s, l) => s + l.good, 0)), txt: `Serviceable equipment ${A.m.logistics.reduce((s, l) => s + l.good, 0)}→${B.m.logistics.reduce((s, l) => s + l.good, 0)}` });
  r.push({ mod: 'Staff', n: movedEv.length ? 1 : 0, txt: movedEv.length ? 'Volunteer rota must be re-issued for moved events' : 'No staffing change' });
  return r;
}
g.FE = { defaultState, quality, allocate, schedule, merch, vendors, snapshot, ripple, people, fmtT, gk, nights };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.FE;