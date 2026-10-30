/* FestOS UI — Ranbhoomi Control. Engine does the thinking (engine.js); this file renders + records every override. */
(() => {
const D = DATA, $ = (s, e = document) => e.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KEY = 'festos_v1', inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const USERS = {
  director: ['director123', 'Festival Director', 'tower recon people stay sched stock kitchen lab audit', 'pii med'],
  accom: ['accom123', 'Hospitality Lead', 'tower recon people stay lab', 'pii med'],
  events: ['events123', 'Events Head', 'tower sched people lab', ''],
  logistics: ['logi123', 'Logistics Head', 'tower stock lab', ''],
  vendor: ['vendor123', 'Food Coordinator', 'tower kitchen', ''],
  volunteer: ['vol123', 'Volunteer', 'tower sched stock', '']
};
const NAV = { tower: 'Control Tower', recon: 'Reconcile', people: 'Participants', stay: 'Stay', sched: 'Battle Board', stock: 'Stores', kitchen: 'Kitchen', lab: 'Disruption Lab', audit: 'Audit Trail' };
let S = Object.assign(FE.defaultState(), JSON.parse(localStorage.getItem(KEY) || '{}')), CUR, page = 'tower', day = 0, q = '';
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const can = p => S.user && USERS[S.user][2].split(' ').includes(p), perm = k => S.user && USERS[S.user][3].includes(k);
const mask = (v, k) => perm(k) ? esc(v) : '<span class="masked">●●●●●●</span>';
const log = (action, reason) => { S.audit.unshift({ t: new Date().toLocaleString('en-IN'), user: S.user, action, reason: reason || '—' }); S.audit = S.audit.slice(0, 400); };
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3800); };
const hostelMap = B => Object.fromEntries(Object.entries(B.a.res).filter(([, v]) => v.kind === 'hostel').map(([k, v]) => [k, v.room]));
const boot = () => { CUR = FE.snapshot(S); if (!Object.keys(S.sticky).length) { S.sticky = hostelMap(CUR); save(); } };

/* ---------- Export CSV Utility ---------- */
function exportCSV(filename, rows) {
  if (!rows || !rows.length) return toast('No data available to export.');
  const processCell = row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',');
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processCell).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast(`Exported ${filename}`);
}

/* ---------- embers ---------- */
(function embers() { const c = $('#embers'), x = c.getContext('2d'); let W, H, P = []; const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight; }; rs(); addEventListener('resize', rs);
  for (let i = 0; i < 70; i++) P.push({ x: Math.random() * 2000, y: Math.random() * 1200, r: Math.random() * 1.8 + .4, v: Math.random() * .5 + .15, a: Math.random() });
  (function f() { x.clearRect(0, 0, W, H); P.forEach(p => { p.y -= p.v; p.x += Math.sin(p.y / 50 + p.a * 6) * .3; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } x.fillStyle = `rgba(${200 + p.a * 40},${40 + p.a * 60},40,${.15 + p.a * .45})`; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); }); requestAnimationFrame(f); })(); })();

/* ---------- login view with Icon + Brief Highlights ---------- */
const ROLES = [
  { id: 'director', role: 'Festival Director', hue: 350, desc: 'Sees the whole fest at once and signs off every high-risk call: budget overrides, record merges and the full audit trail.' },
  { id: 'accom', role: 'Hospitality Lead', hue: 28, desc: 'Owns the beds: hostel blocks, external stays, accessibility needs and the cost-versus-cohesion trade-offs for every contingent.' },
  { id: 'events', role: 'Events Head', hue: 210, desc: 'Runs the Battle Board: venue-by-time schedule, participant clashes, volunteer cover and last-minute venue changes.' },
  { id: 'logistics', role: 'Logistics Head', hue: 160, desc: 'Tracks every mic, projector and merch unit by condition and location, and makes sure each item is issued only once.' },
  { id: 'vendor', role: 'Food Coordinator', hue: 45, desc: 'Keeps the fest fed and safe: hygiene certificates, dietary coverage, vendor hours and cover when a vendor shuts down.' },
  { id: 'volunteer', role: 'Volunteer', hue: 285, desc: 'Gets a fast desk view of the schedule and stores. Contact, medical and room data stay masked for this role.' }
];
function signIn(u) { S.user = u; page = 'tower'; log('Signed in', 'Role card'); save(); render(); }
function loginView() {
  return `<div class="login2"><div style="text-align:center"><p class="sub" style="margin:0 auto .4rem">Epinoia 2026 · Atharv Ranbhoomi · Aarohan control portal</p><h1><span class="glitch" data-t="FestOS">FestOS</span></h1><p class="sub" style="margin:.6rem auto 0">Pick your role. Every change shows its consequences before anyone has to call the director.</p></div><div id="roleCarousel"></div><p class="sub" style="text-align:center;margin:.5rem auto 0">Click any card to sign in as that role.</p></div>`;
}

/* ---------- shell ---------- */
function shell() {
  const hi = CUR.alerts.filter(a => a.sev === 'high').length;
  return `<div class="shell"><nav><div class="brand"><svg width="34" height="34" viewBox="0 0 400 400"><circle cx="200" cy="200" r="170" fill="none" stroke="#b3222f" stroke-width="22"/><line x1="200" y1="200" x2="200" y2="80" stroke="#efe6d2" stroke-width="26"/><line x1="200" y1="200" x2="280" y2="200" stroke="#d8a94a" stroke-width="26"/></svg><span class="d">FestOS</span></div>
  ${Object.keys(NAV).filter(can).map(k => `<a class="${k === page ? 'on' : ''}" data-act="nav" data-p="${k}">${NAV[k]}${k === 'tower' && hi ? `<span class="pill">${hi}</span>` : ''}</a>`).join('')}
  <div style="margin-top:auto;font-size:.8rem;color:var(--ash)">${esc(USERS[S.user][1])}<br><a data-act="logout" style="padding:.3rem 0">Sign out</a><a data-act="reset" style="padding:.3rem 0;color:#c66">Reset demo state</a></div></nav><main id="pg" style="overflow-y:auto; max-height:100vh; padding-bottom:3rem;">${views[page]()}</main></div>`;
}
const head = (t, s) => `<div class="top"><div><h2>${t}</h2><p class="sub">${s}</p></div><div class="who">Aarohan · 30 Oct – 1 Nov 2026<br>${CUR.q.raw} raw records · ${FE.people(S).length} active</div></div>`;
const kpi = (n, l, c = '') => `<div class="card kpi ${c}"><div class="n" data-n="${n}">${n}</div><small>${l}</small></div>`;
const tag = (s, t) => `<span class="tag ${s}">${esc(t ?? s)}</span>`;

const views = {
tower() { const { a, sc, alerts } = CUR; return head('Control Tower', 'What needs a human right now, ranked. Nothing here is hidden inside a score.') +
  `<div class="grid">${kpi(a.hostel + a.ext, `of ${a.requested} stay requests placed`, a.unplaced ? 'bad' : 'good')}${kpi(a.unplaced + a.unfunded, 'beds missing or awaiting budget', 'bad')}${kpi(sc.conflicts.filter(c => c.sev === 'high').length, `serious schedule conflicts (${sc.conflicts.length} total)`, 'warn')}${kpi(alerts.length, 'open alerts')}</div>
  <h3>Needs attention</h3><div style="margin-top:.6rem; max-height:48vh; overflow-y:auto; padding-right:4px;">${alerts.map((x, i) => `<div class="alert ${x.sev}" style="animation-delay:${i * 40}ms">${tag(x.sev, x.mod)}<div>${esc(x.msg)}</div><small>${esc(x.act)}</small></div>`).join('')}</div>`; },

recon() { const Q = CUR.q; return head('Reconcile the data pack', `The brief expects ~${Q.expected}; the pack holds ${Q.raw}. We keep every record, explain the gap, and never silently delete.`) +
  `<div class="grid">${kpi(Q.raw, 'raw participant records')}${kpi(Q.declared, 'sum of declared contingent strengths')}${kpi(Q.noStay, 'did not request accommodation')}${kpi(Q.dups.length, 'same name+college+age+gender+size (possible dupes)', 'warn')}</div>
  <div class="note"><b>Reading of the 436-record gap:</b> the pack has 2,836 people, all with ≥1 registration; contingent declarations sum to ${Q.declared}. Declared strengths ≈ expected headcount, so the surplus is likely late registrants, duplicates and un-declared extras. Records stay <i>unconfirmed</i> until a human merges or confirms them. Blanks (${Q.blankGender} gender, ${Q.blankDiet} diet) are treated as <b>unknown</b>, never as consent, eligibility or "no need".</div>
  <div class="two"><div><h3>Possible duplicates</h3><div class="scroll"><table><tr><th>Name</th><th>College</th><th>IDs</th><th></th></tr>${Q.dups.slice(0, 60).map((g, i) => { const done = g.slice(1).every(p => S.merged[p.participant_id]); return `<tr><td>${esc(g[0].name)}</td><td>${esc(g[0].college)}</td><td>${g.map(p => p.participant_id).join(', ')}</td><td>${done ? tag('ok', 'merged') : can('lab') ? `<button class="ghost" data-act="merge" data-i="${i}">Merge</button>` : ''}</td></tr>`; }).join('')}</table></div></div>
  <div><h3>Contingent count mismatches</h3><div class="scroll"><table><tr><th>Contingent</th><th>Declared</th><th>In file</th><th>Δ</th></tr>${Q.mism.map(c => `<tr><td>${esc(c.college)} (${c.contingent_id})</td><td>${c.strength_declared}</td><td>${c.listed}</td><td>${tag(Math.abs(c.diff) > 3 ? 'high' : 'med', (c.diff > 0 ? '+' : '') + c.diff)}</td></tr>`).join('')}</table></div>
  <h3 style="margin-top:1rem">Timing anomalies</h3><p class="sub">${Q.badDates.length} depart before arriving: ${Q.badDates.map(p => p.participant_id).join(', ')} (nights assumed 1). ${Q.early} arrive before 30 Oct.</p></div></div>
  <h3>Assumptions we state</h3><div class="note">Leaders/escorts are not in participants.csv, so their beds are not modelled. “Ground floor”, “near washroom” and “visual assistance” all map to ground-floor rooms (no washroom data). External properties have no accessibility data → shown as unverified. Check-in 12:00, check-out 10:00, 30 min venue teardown, 15 min travel buffer.</div>`; },

people() { const L = FE.people(S), m = q ? L.filter(p => (p.name + p.participant_id + p.college).toLowerCase().includes(q.toLowerCase())).slice(0, 12) : [];
  return head('Participant record', 'One record joining contingent, events, stay, merchandise, food and status.') + `<div class="row"><input id="q" placeholder="Search name, ID or college…" value="${esc(q)}" style="min-width:320px"><button data-act="search">Find</button></div>` + m.map(p => { const r = CUR.a.res[p.participant_id], ev = D.registrations.filter(x => x.participant_id === p.participant_id).map(x => D.events.find(e => e.event_id === x.event_id)?.event_name), iss = S.issued[p.participant_id];
    return `<div class="card" style="margin-bottom:.8rem"><h3>${esc(p.name)} <small style="color:var(--ash)">${p.participant_id} · ${esc(p.college)} (${p.contingent_id})</small></h3><div class="two" style="margin-top:.6rem"><div>Contact: ${mask(p.contact, 'pii')}<br>Gender (as given): ${p.gender_as_given ? esc(p.gender_as_given) : tag('med', 'unknown — not inferred')}<br>Accessibility: ${perm('med') ? esc(p.accessibility_needs || 'UNKNOWN (blank)') : mask('', 'med')}<br>Diet: ${perm('med') || perm('diet') ? esc(p.dietary_needs || 'UNKNOWN (blank)') : mask('', 'med')}<br>Arrives ${esc(p.arrival_datetime)} → leaves ${esc(p.departure_datetime)}</div>
    <div>Events: ${ev.map(esc).join(', ') || '—'}<br>Stay: ${!r ? 'not requested' : r.kind === 'hostel' ? `Hostel ${r.room}` : r.kind === 'ext' ? `${esc(r.prop)} (${inr(r.cost)})` : tag('high', r.kind)}${r?.flags?.length ? '<br><small style="color:var(--gold)">' + r.flags.map(esc).join('<br>') + '</small>' : ''}<br>Merch: ${iss ? iss.items.join(', ') + ' · issued' : 'nothing issued'} · size ${p.tshirt_size}${can('stock') || can('people') ? `<div class="row">${['T-shirt', 'ID card', 'lanyard', 'tote'].map(i => `<button class="ghost" data-act="issue" data-id="${p.participant_id}" data-i="${i}">Issue ${i}</button>`).join('')}</div>` : ''}</div></div></div>`; }).join('') || (q ? '<p class="sub">No match.</p>' : ''); },

stay() { const { a } = CUR, sh = a.shortage, byC = {}; FE.people(S).filter(p => p.accommodation_requested === 'yes').forEach(p => { const c = byC[p.contingent_id] = byC[p.contingent_id] || { c: p.contingent_id, n: 0, h: 0, e: 0, x: 0, b: new Set() }, r = a.res[p.participant_id]; c.n++; r.kind === 'hostel' ? (c.h++, c.b.add(r.block)) : r.kind === 'ext' ? (c.e++, c.b.add(r.prop)) : c.x++; });
  return head('Accommodation', 'Hard needs first, cohesion second, cost last. Every relaxed rule is listed with its reason.') +
  `<div class="row" style="margin-bottom:1rem"><button data-act="exportStay">Export to CSV</button></div>
  <div class="grid">${kpi(a.hostel, `in hostels (${sh.totalBeds} beds)`, 'good')}${kpi(a.ext, `in external stays (${inr(a.spent)} of ${inr(a.budget)})`, 'warn')}${kpi(a.unfunded, 'need budget override', 'warn')}${kpi(a.unplaced, 'no bed anywhere', 'bad')}</div>
  <div class="note">Demand ${a.requested} vs supply ${sh.totalBeds} hostel + ${sh.extBeds} external = ${sh.totalBeds + sh.extBeds}. Wheelchair demand ${sh.wheelchairDemand} vs ${sh.accessibleBeds} accessible beds. Medical safety flags are strictly held on-campus.</div>
  ${can('lab') ? `<form class="row card" data-act="budget"><b>Budget</b> ${inr(a.budget)} ${S.budgetOverride ? tag('high', `override +${inr(S.budgetOverride.extra)} by ${S.budgetOverride.by}: ${S.budgetOverride.reason}`) : ''}<input id="bx" type="number" placeholder="extra ₹" style="width:120px"><input id="br" placeholder="reason (required)" style="flex:1"><button>${S.user === 'director' ? 'Authorize override' : 'Request (director only)'}</button></form>` : ''}
  <div class="two"><div><h3>Contingents — cohesion</h3><div class="scroll"><table><tr><th>ID</th><th>Need</th><th>Hostel</th><th>Ext</th><th>None</th><th>Split across</th></tr>${Object.values(byC).sort((x, y) => y.n - x.n).map(c => `<tr><td>${c.c}</td><td>${c.n}</td><td>${c.h}</td><td>${c.e}</td><td>${c.x ? tag('high', c.x) : 0}</td><td>${c.b.size > 1 ? tag(c.b.size > 3 ? 'high' : 'med', c.b.size + ' places') : tag('ok', 'together')}</td></tr>`).join('')}</table></div></div>
  <div><h3>Allotments</h3><div class="scroll"><table><tr><th>Participant ID</th><th>Type</th><th>Location</th><th>Notes</th></tr>${Object.entries(a.res).slice(0, 150).map(([id, v]) => `<tr><td>${id}</td><td>${v.kind}</td><td>${v.kind === 'hostel' ? 'Room ' + v.room : v.prop || '—'}</td><td>${(v.flags || []).map(esc).join('; ')}</td></tr>`).join('')}</table></div></div></div>`; },

sched() { const { slots, conflicts } = CUR.sc, base = day * 1440 + 480, W = 14 * 60, on = slots.filter(s => !s.unscheduled && Math.floor(s.start / 1440) === day);
  return head('Battle Board', 'Venue × time. Gold = 6+ shared participants, hatched = relaxed rule. Hover for detail.') + 
  `<div class="row" style="margin-bottom:1rem">${['Oct 30', 'Oct 31', 'Nov 1'].map((d, i) => `<button class="${i === day ? '' : 'ghost'}" data-act="day" data-d="${i}">${d}</button>`).join('')}<button data-act="exportSched" style="margin-left:auto">Export to CSV</button></div>
  <div class="tl"><div class="hrs"><span></span>${[...Array(14)].map((_, i) => `<span>${String(8 + i).padStart(2, '0')}:00</span>`).join('')}</div>${D.venues.map(v => `<div class="ln"><div class="vn">${v.venue_name}<br><small style="color:var(--ash)">cap ${v.capacity}</small></div><div class="lane">${S.venueOut.includes(v.venue_id) ? '<div class="blk x" style="left:0;right:0">CLOSED</div>' : on.filter(s => s.venue.venue_id === v.venue_id).map(s => `<div class="blk ${s.relaxed ? 'x' : s.clash > 5 ? 'c' : ''}" style="left:${(s.start - base) / W * 100}%;width:${(s.end - s.start) / W * 100}%" title="${esc(s.ev.event_name)} · ${s.rd} · ${FE.fmtT(s.start)} · ${s.size} registered · ${s.clash} clashes · ${s.vol} volunteers">${esc(s.ev.event_name)} <i>${s.rd[0]}</i></div>`).join('')}</div></div>`).join('')}</div>
  <h3 style="margin-top:1.4rem">Conflicts (${conflicts.length})</h3><div class="scroll"><table><tr><th>Severity</th><th>Type</th><th>Detail</th></tr>${conflicts.sort((x, y) => (x.sev < y.sev ? 1 : -1)).slice(0, 120).map(c => `<tr><td>${tag(c.sev)}</td><td>${c.type}</td><td>${esc(c.msg)}</td></tr>`).join('')}</table></div>`; },

stock() { const { rows, logistics } = CUR.m; return head('Stores', 'Merchandise issued once, to the right person. Equipment counted only when serviceable.') +
  `<div class="row" style="margin-bottom:1rem"><button data-act="exportStock">Export to CSV</button></div>
  <div class="two"><div><h3>Merchandise</h3><table><tr><th>Item</th><th>Size</th><th>Usable</th><th>Issued</th><th>Needed</th><th></th></tr>${rows.map(r => `<tr><td>${r.item}</td><td>${r.size || '—'}</td><td>${r.avail}</td><td>${r.used}</td><td>${r.dem}</td><td>${r.gap < 0 ? tag('high', 'short ' + -r.gap) : tag('ok', '+' + r.gap)}</td></tr>`).join('')}</table></div>
  <div><h3>Equipment & logistics</h3><table><tr><th>Item</th><th>Good</th><th>Check</th><th>Repair</th>${can('lab') ? '<th></th>' : ''}</tr>${logistics.map(l => `<tr><td>${l.item}</td><td>${l.good ? l.good : tag('high', 0)}</td><td>${l.check}</td><td>${l.repair}</td>${can('lab') ? `<td><button class="ghost" data-act="fail" data-i="${l.item}">Fail 5</button></td>` : ''}</tr>`).join('')}</table></div></div>`; },

kitchen() { const { vs, cover } = CUR.v; return head('Kitchen', 'Who can legally feed whom — certificates, hours, dietary coverage and payment terms.') +
  `<h3>Dietary coverage (eligible vendors only)</h3><table><tr><th>Need</th><th>People</th><th>Vendors</th><th>Capacity</th><th>Status</th></tr>${cover.map(c => `<tr><td>${esc(c.diet)}</td><td>${c.demand}</td><td>${c.vendors}</td><td>${c.cap}</td><td>${tag(c.gap === 'ok' ? 'ok' : c.gap === 'thin' ? 'med' : 'high', c.gap)}</td></tr>`).join('')}</table>
  <div class="note">“Nut allergy” can’t be served safely: no vendor declares nut-free handling. Blank diet is unverifiable, never “eat anything”.</div>
  <h3>Vendors</h3><div class="scroll"><table><tr><th>Vendor</th><th>Menu</th><th>Diets</th><th>Cert</th><th>Hours</th><th>Cap</th><th>Payment</th><th></th></tr>${vs.map(v => `<tr><td>${v.vendor_name}</td><td>${v.menu}</td><td>${v.opts.join(', ')}</td><td>${tag(v.st === 'valid' ? 'ok' : v.st === 'expired' ? 'high' : 'med', v.cert + ' · ' + v.st)}</td><td>${v.hours}</td><td>${v.cap}</td><td>${esc(v.payment_terms)}</td><td>${v.dead ? tag('high', 'SHUT DOWN') : can('lab') ? `<button class="ghost" data-act="vdown" data-v="${v.vendor_id}">Shut down</button>` : ''}</td></tr>`).join('')}</table></div>`; },

lab() { const op = (a, b) => D[a].map(x => `<option value="${x[b[0]]}">${esc(x[b[1]])}</option>`).join(''); return head('Disruption Lab', 'Inject a failure. State really changes, the ripple shows who is affected, and the reason is written to the audit trail.') +
  `<div class="row"><input id="reason" placeholder="Reason for this change (required)" style="flex:1;min-width:300px"></div><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
  <div class="card"><h3>Late contingent</h3><div class="row"><input id="lc" placeholder="College name"><input id="ln" type="number" value="20" style="width:80px"></div><button data-act="late">Add contingent</button></div>
  <div class="card"><h3>Hostel closure</h3><div class="row"><select id="hb">${[...new Set(D.hostels.map(h => h.block))].map(b => `<option>${b}</option>`).join('')}</select></div><button data-act="hclose">Close block</button></div>
  <div class="card"><h3>Equipment failure</h3><div class="row"><select id="ei">${[...new Set(D.inventory_logistics.map(l => l.item))].map(i => `<option>${i}</option>`).join('')}</select><input id="en" type="number" value="10" style="width:80px"></div><button data-act="efail">Fail units</button></div>
  <div class="card"><h3>Venue change</h3><div class="row"><select id="vo">${op('venues', ['venue_id', 'venue_name'])}</select></div><button data-act="vout">Venue unavailable</button></div>
  <div class="card"><h3>Vendor shutdown</h3><div class="row"><select id="vv">${op('vendors', ['vendor_id', 'vendor_name'])}</select></div><button data-act="vdown2">Shut down</button></div>
  <div class="card"><h3>Duplicate merch claim</h3><div class="row"><input id="mp" placeholder="Participant ID e.g. P0001"></div><button data-act="dclaim">Claim T-shirt twice</button></div></div>`; },

audit() { return head('Audit Trail', 'Every override, who made it and why.') + `<div class="scroll"><table><tr><th>When</th><th>Who</th><th>Action</th><th>Reason</th></tr>${S.audit.map(l => `<tr><td>${l.t}</td><td>${l.user}</td><td>${esc(l.action)}</td><td>${esc(l.reason)}</td></tr>`).join('') || '<tr><td colspan=4>No changes yet.</td></tr>'}</table></div>`; }
};

/* ---------- ripple ---------- */
function ripple(title, items) { const cx = 300, cy = 230, nodes = items.map((it, i) => { const a = i / items.length * 6.283 - 1.57, r = 170; return { ...it, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), s: Math.min(46, 16 + Math.sqrt(it.n) * 2.4) }; });
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="sheet"><h3>Ripple · ${esc(title)}</h3><svg class="rip" viewBox="0 0 600 460" style="width:100%;max-height:52vh"><circle class="w" cx="${cx}" cy="${cy}"/><circle class="w" cx="${cx}" cy="${cy}"/><circle class="w" cx="${cx}" cy="${cy}"/>
  ${nodes.map(n => `<line x1="${cx}" y1="${cy}" x2="${n.x}" y2="${n.y}" stroke="${n.n ? '#b3222f' : '#33242a'}" stroke-width="2"/>`).join('')}<circle cx="${cx}" cy="${cy}" r="30" fill="#6e121c" stroke="#d8a94a" stroke-width="2"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#efe6d2" font-size="11">CHANGE</text>
  ${nodes.map((n, i) => `<g class="nd" style="animation-delay:${300 + i * 150}ms"><circle cx="${n.x}" cy="${n.y}" r="${n.s}" fill="${n.n ? '#7d1621' : '#1a1113'}" stroke="${n.n ? '#ff5b69' : '#33242a'}" stroke-width="2"/><text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="#efe6d2" font-weight="700">${n.n}</text><text x="${n.x}" y="${n.y + n.s + 15}" text-anchor="middle" fill="#9a8f84" font-size="12">${n.mod}</text></g>`).join('')}</svg>
  <table>${items.map(i => `<tr><td>${tag(i.n ? 'high' : 'ok', i.mod)}</td><td>${esc(i.txt)}</td></tr>`).join('')}</table><div class="row"><button data-act="close">Close</button></div></div>`; document.body.appendChild(m); }

/* ---------- actions ---------- */
function apply(title, mut, reason, need = true) { if (need && !reason.trim()) return toast('A reason is required for this change.'); const A = CUR; mut(S); const B = FE.snapshot(S); S.sticky = hostelMap(B); log(title, reason); save(); CUR = B; render(); ripple(title, FE.ripple(A, B)); }
const val = id => $('#' + id)?.value || '';
const A = {
  login(e) { const u = e.dataset.u; $('#lu') && ($('#lu').value = u), $('#lp') && ($('#lp').value = USERS[u][0]); },
  loginf(e, ev) { ev.preventDefault(); const u = val('lu').trim(), p = val('lp'); if (USERS[u] && USERS[u][0] === p) { S.user = u; page = 'tower'; log('Signed in', ''); save(); render(); } else toast('Wrong username or password.'); },
  logout() { S.user = null; save(); render(); }, nav(e) { page = e.dataset.p; render(); }, day(e) { day = +e.dataset.d; render(); }, close() { $('.modal')?.remove(); },
  reset() { if (confirm('Reset all overrides and audit history?')) { const u = S.user; S = FE.defaultState(); S.user = u; localStorage.removeItem(KEY); boot(); render(); } },
  search() { q = val('q'); render(); $('#q')?.focus(); },
  exportStay() {
    const rows = [['Participant ID', 'Kind', 'Room / Property', 'Flags']];
    Object.entries(CUR.a.res).forEach(([id, v]) => rows.push([id, v.kind, v.kind === 'hostel' ? v.room : v.prop || '', (v.flags || []).join('; ')]));
    exportCSV('FestOS_Accommodation_Report.csv', rows);
  },
  exportSched() {
    const rows = [['Event ID', 'Event Name', 'Round', 'Venue', 'Start Time', 'End Time', 'Registered', 'Clashes']];
    CUR.sc.slots.forEach(s => rows.push([s.ev.event_id, s.ev.event_name, s.rd, s.venue ? s.venue.venue_name : 'Unscheduled', FE.fmtT(s.start), FE.fmtT(s.end), s.size, s.clash]));
    exportCSV('FestOS_BattleBoard_Schedule.csv', rows);
  },
  exportStock() {
    const rows = [['Item', 'Size', 'Usable', 'Issued', 'Needed', 'Gap']];
    CUR.m.rows.forEach(r => rows.push([r.item, r.size || 'N/A', r.avail, r.used, r.dem, r.gap]));
    exportCSV('FestOS_Inventory_Stores.csv', rows);
  },
  merge(e) { const g = CUR.q.dups[+e.dataset.i], r = val('reason') || prompt('Reason for merging these records (required):'); if (!r) return toast('Reason required.'); apply(`Merged duplicates ${g.map(p => p.participant_id).join('+')}`, s => g.slice(1).forEach(p => s.merged[p.participant_id] = g[0].participant_id), r, true); },
  late() { const n = Math.max(1, +val('ln')), c = val('lc') || 'Late College', id = 'LATE' + (S.late.length ? S.late[S.late.length - 1].contingent_id.slice(4) * 1 + 1 : 1); apply(`Late contingent ${c} (${n})`, s => { for (let i = 0; i < n; i++) s.late.push({ participant_id: `${id}-${i + 1}`, name: `${c} delegate ${i + 1}`, college: c, contingent_id: id, gender_as_given: '', age: '', contact: '', accessibility_needs: '', dietary_needs: '', arrival_datetime: '2026-10-31 12:00', departure_datetime: '2026-11-02 10:00', accommodation_requested: 'yes', tshirt_size: 'L' }); }, val('reason')); },
  hclose() { const b = val('hb'); apply(`Hostel block ${b} closed`, s => s.closedBlocks.push(b), val('reason')); },
  efail() { const i = val('ei'), n = +val('en'); apply(`Equipment failure: ${n} × ${i}`, s => s.broken[i] = (s.broken[i] || 0) + n, val('reason')); },
  fail(e) { apply(`Equipment failure: 5 × ${e.dataset.i}`, s => s.broken[e.dataset.i] = (s.broken[e.dataset.i] || 0) + 5, val('reason') || prompt('Reason (required):') || ''); },
  vout() { const v = val('vo'); apply(`Venue ${v} unavailable`, s => s.venueOut.push(v), val('reason')); },
  vdown2() { const v = val('vv'); apply(`Vendor ${v} shut down`, s => s.deadVendors.push(v), val('reason')); },
  vdown(e) { apply(`Vendor ${e.dataset.v} shut down`, s => s.deadVendors.push(e.dataset.v), prompt('Reason (required):') || ''); },
  dclaim() { const id = val('mp').trim(); if (!FE.people(S).find(p => p.participant_id === id)) return toast('Unknown participant ID.'); A.issue({ dataset: { id, i: 'T-shirt' } }); A.issue({ dataset: { id, i: 'T-shirt' } }); },
  issue(e) { const id = e.dataset.id, it = e.dataset.i, p = FE.people(S).find(x => x.participant_id === id), rec = S.issued[id] = S.issued[id] || { items: [], size: null };
    if (rec.items.includes(it)) { log(`BLOCKED duplicate claim: ${it} for ${id}`, 'Already issued'); save(); toast(`Blocked: ${id} already received ${it}.`); return render(); }
    rec.items.push(it); if (it === 'T-shirt') rec.size = p.tshirt_size; log(`Issued ${it} to ${id}`, 'Desk issue'); save(); CUR = FE.snapshot(S); toast(`${it} issued to ${id}.`); render(); },
  budget(e, ev) { ev.preventDefault(); const x = +val('bx'), r = val('br'); if (S.user !== 'director') return toast('Only the Festival Director may override budget.'); if (!x || !r.trim()) return toast('Amount and reason are required.'); apply(`Budget override +${inr(x)}`, s => s.budgetOverride = { extra: (s.budgetOverride?.extra || 0) + x, by: s.user, reason: r }, r, true); }
};
addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t && t.tagName !== 'FORM' && A[t.dataset.act]) A[t.dataset.act](t, e); });
addEventListener('submit', e => { const t = e.target.closest('[data-act]'); if (t && A[t.dataset.act]) A[t.dataset.act](t, e); });
addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'q') A.search(); });

function render() {
  if (window.__rc) { window.__rc.destroy(); window.__rc = null; }
  $('#app').innerHTML = S.user ? shell() : loginView();
  if (!S.user) window.__rc = mountRoleCarousel($('#roleCarousel'), ROLES, signIn);
  document.querySelectorAll('[data-n]').forEach(el => { const n = +el.dataset.n, t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); });
}
boot(); render();
})();