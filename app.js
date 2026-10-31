/* FestOS UI — Ranbhoomi Control. Engine does the thinking (engine.js); this file renders + records every override. */
(() => {
const D = DATA, $ = (s, e = document) => e.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KEY = 'festos_v1', inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const USERS = {
  director: ['director123', 'Festival Director', 'tower recon people stay sched stock kitchen lab audit news issues', 'pii med'],
  accom: ['accom123', 'Hospitality Lead', 'tower recon people stay lab news issues', 'pii med'],
  events: ['events123', 'Events Head', 'tower sched people lab news issues', ''],
  logistics: ['logi123', 'Logistics Head', 'tower stock lab people news issues', ''],
  vendor: ['vendor123', 'Food Coordinator', 'tower kitchen news', ''],
  volunteer: ['vol123', 'Volunteer', 'tower sched stock tasks news report', '']
};
const NAV = { tower: 'Control Tower', recon: 'Reconcile', people: 'Participants', stay: 'Stay', sched: 'Battle Board', stock: 'Stores', kitchen: 'Kitchen', lab: 'Disruption Lab', audit: 'Audit Trail', tasks: 'My Tasks', news: 'Announcements', report: 'Raise an Issue', issues: 'Issue Desk' };
let S = Object.assign(FE.defaultState(), JSON.parse(localStorage.getItem(KEY) || '{}')), CUR, page = 'tower', day = 0, q = '';
let intro = !S.user;   // show intro hero only when nobody is signed in
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const can = p => S.user && USERS[S.user][2].split(' ').includes(p), perm = k => S.user && USERS[S.user][3].includes(k);
const mask = (v, k) => perm(k) ? esc(v) : '<span class="masked">●●●●●●</span>';
const log = (action, reason) => { S.audit.unshift({ t: new Date().toLocaleString('en-IN'), user: S.user, action, reason: reason || '—' }); S.audit = S.audit.slice(0, 400); };
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3800); };
const hostelMap = B => Object.fromEntries(Object.entries(B.a.res).filter(([, v]) => v.kind === 'hostel').map(([k, v]) => [k, v.room]));
const boot = () => { S.issues = S.issues || []; S.me = S.me || 'ST07'; if (!S.news) S.news = [{ id: 1, t: new Date().toLocaleString('en-IN'), by: 'Festival Director', title: 'Welcome, volunteers', body: 'Check My Tasks for your shift. Report any problem through Raise an Issue and track its status there.', urgent: false }]; CUR = FE.snapshot(S); if (!Object.keys(S.sticky).length) { S.sticky = hostelMap(CUR); save(); } };
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

/* ---------- intro hero (cards orbiting in a circle, fest photos) ---------- */
// Each card tries your own photo first (assets/festN.jpg), then the stock fest photo, then a gradient.
const U = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=70`;
const HERO_PHOTOS = [
  { local: 'assets/fest1.jpg', remote: U('photo-1492684223066-81342ee5ff30') },  // party / confetti
  { local: 'assets/fest2.jpg', remote: U('photo-1514525253161-7a46d19cd819') },  // crowd at a concert
  { local: 'assets/fest3.jpg', remote: U('photo-1470229722913-7c0e2dbbafd3') },  // stage lights + crowd
  { local: 'assets/fest4.jpg', remote: U('photo-1501386761578-eac5c94b800a') },  // festival crowd
  { local: 'assets/fest5.jpg', remote: U('photo-1459749411175-04bf5292ceea') },  // live performance
  { local: 'assets/fest6.jpg', remote: U('photo-1540039155733-5bb30b53aa14') },  // concert crowd
  { local: 'assets/fest7.jpg', remote: U('photo-1429962714451-bb934ecdc4ec') },  // cheering audience
  { local: 'assets/fest8.jpg', remote: U('photo-1533174072545-7a4b6ad7a6c3') }   // festival night
];
(function injectIntroCSS() {
  const st = document.createElement('style');
  st.textContent = `
  .fo-intro{position:fixed;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;text-align:center;overflow:hidden;padding:1rem}
  .fo-intro .fo-kick{letter-spacing:.25em;text-transform:uppercase;font-size:.75rem;color:#9a8f84;margin:0 0 .6rem}
  .fo-intro h1{font-size:clamp(2.2rem,5.5vw,4.4rem);line-height:1.04;letter-spacing:-.03em;color:#efe6d2;margin:0}
  .fo-intro .fo-sub{color:#9a8f84;max-width:460px;margin:0 auto}
  .fo-stage{position:relative;width:100%;max-width:1300px;height:min(44vh,400px);perspective:1100px;overflow:hidden}
  .fo-pnl{position:absolute;left:50%;top:50%;width:300px;height:200px;margin:-100px 0 0 -150px;border-radius:18px;
    background-color:#3a0d14;background-size:cover;background-position:center;border:1px solid #ffffff2a;box-shadow:0 24px 60px #000b;will-change:transform,opacity}
  .fo-enter{padding:.8rem 2.2rem;font-size:1rem;border-radius:999px;cursor:pointer;margin-top:.4rem}`;
  document.head.appendChild(st);
})();
function introView() {
  return `<div class="fo-intro">
    <div><p class="fo-kick">Epinoia 2026 · Atharv Ranbhoomi</p><h1>FestOS Aarohan,<br>every moment in focus.</h1></div>
    <div class="fo-stage">${HERO_PHOTOS.map(p => `<div class="fo-pnl" style="background-image:url('${p.local}'),url('${p.remote}'),linear-gradient(135deg,#6e121c,#1a0508)"></div>`).join('')}</div>
    <p class="fo-sub">One control portal for stays, schedules, stores and kitchen.</p>
    <button class="fo-enter" data-act="enter">Enter FestOS →</button></div>`;
}
function startIntroAnim() {
  const root = $('.fo-intro'); if (!root) return;
  const stage = $('.fo-stage', root), pn = [...root.querySelectorAll('.fo-pnl')], n = pn.length;
  let ang = 0, last = performance.now(), paused = false;
  stage.addEventListener('mouseenter', () => paused = true);
  stage.addEventListener('mouseleave', () => paused = false);
  function frame(t) {
    const dt = Math.min(64, t - last) / 1000; last = t;
    if (!paused) ang = (ang + dt * 20) % 360;                       // 20 deg/sec = one full circle in 18s
    const Rx = Math.min(stage.clientWidth * 0.36, 460);              // horizontal radius of the circle
    pn.forEach((p, i) => {
      const th = (i * 360 / n + ang) * Math.PI / 180;
      const s = Math.sin(th), c = Math.cos(th);                      // c = 1 front, -1 back
      const depth = (c + 1) / 2;                                     // 0 back ... 1 front
      p.style.transform = `translate3d(${(s * Rx).toFixed(1)}px,${((1 - c) * -16).toFixed(1)}px,${((c - 1) * 240).toFixed(1)}px) rotateY(${(-s * 38).toFixed(1)}deg) scale(${(0.72 + 0.28 * depth).toFixed(3)})`;
      p.style.opacity = (0.25 + 0.75 * depth).toFixed(2);
      p.style.zIndex = Math.round(depth * 100);
    });
    window.__ia = requestAnimationFrame(frame);
  }
  frame(last);
}



  /* ---------- role carousel with swipe bar ---------- */
function mountRoles(host, roles, onPick) {
  if (!$('#fo-rv-css')) {
    const st = document.createElement('style'); st.id = 'fo-rv-css';
    st.textContent = `
    .fo-rv{position:relative;width:100%;max-width:1240px;margin:0 auto;padding:.5rem 0 0;overflow:hidden;outline:none;user-select:none;-webkit-user-select:none}
    .fo-rv-stage{position:relative;width:100%;touch-action:pan-y}
    .fo-rv-card{position:absolute;left:50%;top:50%;border-radius:26px;overflow:hidden;cursor:pointer;background:linear-gradient(160deg,var(--panel2),var(--panel));border:1px solid var(--blood2);box-shadow:0 10px 30px #000a,0 0 22px #b3222f22}
    .fo-rv.ready .fo-rv-card{transition:transform .7s cubic-bezier(.22,1,.36,1),width .7s cubic-bezier(.22,1,.36,1),height .7s cubic-bezier(.22,1,.36,1),opacity .4s,box-shadow .2s}
    .fo-rv-card:hover{box-shadow:0 10px 30px #000a,0 0 34px #b3222f66}
    .fo-rv-peek{position:absolute;inset:8px;border-radius:20px;overflow:hidden;transition:opacity .25s}.fo-rv-card.on .fo-rv-peek{opacity:0}
    .fo-rv-peek svg,.fo-rv-pic svg{width:100%;height:100%;display:block}
    .fo-rv-full{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:var(--cw);height:var(--ch);display:flex;gap:1.5rem;padding:1.6rem;opacity:0;pointer-events:none;transition:opacity .25s}
    .fo-rv-card.on .fo-rv-full{opacity:1;transition-delay:.2s}
    .fo-rv-txt{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:.9rem}
    .fo-rv-txt small{letter-spacing:.22em;text-transform:uppercase;font-size:.68rem;color:var(--ash)}
    .fo-rv-txt h3{font-family:'Cinzel',Georgia,serif;font-size:clamp(1.5rem,3.2vw,2.5rem);line-height:1.1;color:var(--bone)}
    .fo-rv-txt p{font-family:Georgia,serif;font-size:clamp(.95rem,1.4vw,1.15rem);line-height:1.5;color:#efe6d2d9;margin:0}
    .fo-rv-cta{color:var(--gold);font-size:.85rem}
    .fo-rv-pic{flex:0 0 40%;border-radius:20px;overflow:hidden}
    .fo-rv.mob .fo-rv-full{flex-direction:column;gap:.8rem;padding:1.1rem}.fo-rv.mob .fo-rv-pic{flex:0 0 38%;width:100%}.fo-rv.mob .fo-rv-txt{text-align:center}
    .fo-rv-bar{display:flex;flex-direction:column;align-items:center;gap:.5rem;margin-top:1.1rem}
    .fo-rv-track{position:relative;width:min(420px,86vw);height:52px;border-radius:999px;background:linear-gradient(#1a1113,#0d0809);border:1px solid var(--line);box-shadow:inset 0 2px 10px #000a}
    .fo-rv-ar{position:absolute;top:50%;transform:translateY(-50%);font-size:1.5rem;line-height:1;color:var(--ash);pointer-events:none}.fo-rv-ar.l{left:20px}.fo-rv-ar.r{right:20px}
    .fo-rv-thumb{position:absolute;top:50%;left:50%;width:76px;height:40px;margin:-20px 0 0 -38px;border-radius:999px;display:grid;place-items:center;font-size:1.1rem;color:var(--bone);cursor:grab;touch-action:none;
      background:linear-gradient(#7d1621,#4d0c14);border:1px solid var(--blood);box-shadow:0 4px 14px #000a;transition:transform .45s cubic-bezier(.22,1,.36,1),box-shadow .2s,background .2s}
    .fo-rv-thumb.drag{transition:none;cursor:grabbing}.fo-rv-thumb.go{background:linear-gradient(#d8a94a,#8a6420);box-shadow:0 0 22px #d8a94a99}
    .fo-rv-hint{color:var(--ash);font-size:.8rem}.fo-rv-hint b{color:var(--gold);font-weight:500}
    .fo-rv-dots{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:.9rem}
    .fo-rv-dot{width:10px;height:10px;padding:0;border:0;border-radius:6px;background:#4a343a;cursor:pointer;transition:width .4s cubic-bezier(.22,1,.36,1),background .3s}
    .fo-rv-dot:hover{background:#7a6068;box-shadow:none;transform:none}
    .fo-rv-dot.on,.fo-rv-dot.on:hover{width:38px;background:linear-gradient(90deg,var(--blood),var(--gold))}
    @media(prefers-reduced-motion:reduce){.fo-rv-card,.fo-rv-thumb,.fo-rv-dot{transition:none!important}}`;
    document.head.appendChild(st);
  }
  const n = roles.length; let cur = 0, swiped = false;
  const avatar = h => `<svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice"><rect width="200" height="260" fill="hsl(${h} 38% 26%)"/><circle cx="100" cy="150" r="118" fill="none" stroke="hsl(${h} 55% 50%)" stroke-width="5" opacity=".5"/><circle cx="100" cy="100" r="44" fill="#e8dfcb"/><path d="M18 260 q0-96 82-96 t82 96z" fill="#e8dfcb"/></svg>`;
  host.innerHTML = `<div class="fo-rv" tabindex="0" aria-label="Choose a role. Use arrow keys or the slider to switch."><div class="fo-rv-stage">${roles.map((r, i) =>
    `<div class="fo-rv-card" data-i="${i}"><div class="fo-rv-peek">${avatar(r.hue)}</div><div class="fo-rv-full"><div class="fo-rv-txt"><small>Sign in as</small><h3>${esc(r.role)}</h3><p>${esc(r.desc)}</p><span class="fo-rv-cta">Click this card to sign in →</span></div><div class="fo-rv-pic">${avatar(r.hue)}</div></div></div>`).join('')}</div>
    <div class="fo-rv-bar"><div class="fo-rv-track"><span class="fo-rv-ar l">‹</span><span class="fo-rv-ar r">›</span><div class="fo-rv-thumb" role="slider" aria-label="Swipe to change role">⇄</div></div><div class="fo-rv-hint">Slide the handle left or right to switch role · <b></b></div></div>
    <div class="fo-rv-dots">${roles.map((_, i) => `<button class="fo-rv-dot" data-d="${i}" aria-label="Show ${esc(roles[i].role)}"></button>`).join('')}</div></div>`;
  const root = $('.fo-rv', host), stage = $('.fo-rv-stage', host), cards = [...host.querySelectorAll('.fo-rv-card')], dots = [...host.querySelectorAll('.fo-rv-dot')], hint = $('.fo-rv-hint b', host);

  function layout() {
    const W = host.clientWidth, mob = W < 640, cw = mob ? W * 0.84 : Math.min(820, W * 0.56), ch = mob ? 400 : 380;
    root.classList.toggle('mob', mob); root.style.setProperty('--cw', cw + 'px'); root.style.setProperty('--ch', ch + 'px'); stage.style.height = ch + 40 + 'px';
    cards.forEach((c, i) => {
      let o = ((i - cur) % n + n) % n; if (o > n / 2) o -= n;
      const a = Math.abs(o), sg = Math.sign(o); let w, h, x, op = 1;
      if (a === 0) { w = cw; h = ch; x = 0; }
      else if (a === 1) { w = mob ? 44 : 120; h = mob ? 280 : 300; x = sg * (cw / 2 + (mob ? 30 : 88)); }
      else if (a === 2 && !mob) { w = 84; h = 210; x = sg * (cw / 2 + 205); }
      else { w = 40; h = 180; x = sg * (cw / 2 + 60); op = 0; }
      Object.assign(c.style, { width: w + 'px', height: h + 'px', opacity: op, zIndex: 10 - a, pointerEvents: op ? 'auto' : 'none', transform: `translate(calc(-50% + ${x}px), -50%)` });
      c.classList.toggle('on', a === 0);
    });
    dots.forEach((d, i) => d.classList.toggle('on', i === cur));
    hint.textContent = `${roles[cur].role} · ${cur + 1} / ${n}`;
  }
  const goTo = i => { cur = ((i % n) + n) % n; layout(); };
  layout(); requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));

  // swipe bar: drag the handle, release to change role, handle springs back to centre
  const thumb = $('.fo-rv-thumb', host), track = $('.fo-rv-track', host); let drag = false, sx = 0, dx = 0;
  const range = () => (track.clientWidth - thumb.offsetWidth) / 2 - 4;
  thumb.addEventListener('pointerdown', e => { drag = true; sx = e.clientX; dx = 0; thumb.setPointerCapture(e.pointerId); thumb.classList.add('drag'); });
  thumb.addEventListener('pointermove', e => { if (!drag) return; dx = Math.max(-range(), Math.min(range(), e.clientX - sx)); thumb.style.transform = `translateX(${dx}px)`; thumb.classList.toggle('go', Math.abs(dx) > range() * 0.6); });
  const endDrag = () => { if (!drag) return; drag = false; thumb.classList.remove('drag', 'go'); const hit = Math.abs(dx) > range() * 0.6, dir = dx > 0 ? 1 : -1; dx = 0; thumb.style.transform = ''; if (hit) goTo(cur + dir); };
  thumb.addEventListener('pointerup', endDrag); thumb.addEventListener('pointercancel', endDrag);

  // click: side card or dot moves there, centre card signs in
  stage.addEventListener('click', e => { if (swiped) return; const c = e.target.closest('.fo-rv-card'); if (!c) return; const i = +c.dataset.i; i === cur ? onPick(roles[i].id) : goTo(i); });
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.d)));

  // flick the cards themselves (touch or mouse)
  let px = 0, py = 0, pd = false;
  stage.addEventListener('pointerdown', e => { pd = true; px = e.clientX; py = e.clientY; });
  const up = e => { if (!pd) return; pd = false; const x = e.clientX - px, y = e.clientY - py; if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y) * 1.2) { swiped = true; goTo(cur + (x < 0 ? 1 : -1)); setTimeout(() => swiped = false, 80); } };
  window.addEventListener('pointerup', up);
  // laptop trackpad two-finger swipe
  let lock = false, tm = 0;
  host.addEventListener('wheel', e => { if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 4) return; e.preventDefault(); clearTimeout(tm); tm = setTimeout(() => lock = false, 160); if (lock) return; lock = true; goTo(cur + (e.deltaX > 0 ? 1 : -1)); }, { passive: false });
  // keyboard
  root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') goTo(cur + 1); else if (e.key === 'ArrowLeft') goTo(cur - 1); else if (e.key === 'Enter') onPick(roles[cur].id); });
  const rs = () => layout(); window.addEventListener('resize', rs);
  return { go: d => goTo(cur + d), destroy() { window.removeEventListener('pointerup', up); window.removeEventListener('resize', rs); host.innerHTML = ''; } };
}

/* ---------- login view ---------- */
const ROLES = [
  { id: 'director', role: 'Festival Director', hue: 350, desc: 'Sees the whole fest at once and signs off every high-risk call.' },
  { id: 'accom', role: 'Hospitality Lead', hue: 28, desc: 'Owns the beds: hostel blocks, external stays, accessibility needs.' },
  { id: 'events', role: 'Events Head', hue: 210, desc: 'Runs the Battle Board: schedule, clashes, volunteer cover.' },
  { id: 'logistics', role: 'Logistics Head', hue: 160, desc: 'Tracks every mic, projector and merch unit by condition.' },
  { id: 'vendor', role: 'Food Coordinator', hue: 45, desc: 'Keeps the fest fed and safe: certificates, dietary coverage.' },
  { id: 'volunteer', role: 'Volunteer', hue: 285, desc: 'Gets a fast desk view of the schedule and stores.' }
];
function signIn(u) { S.user = u; page = 'tower'; log('Signed in', 'Role card'); save(); render(); }
function loginView() {
  return `<div class="login2"><div style="text-align:center"><p class="sub" style="margin:0 auto .4rem">Epinoia 2026 · Atharv Ranbhoomi · Aarohan control portal</p><h1><span class="glitch" data-t="FestOS">FestOS</span></h1><p class="sub" style="margin:.6rem auto 0">Pick your role. Every change shows its consequences before anyone has to call the director.</p></div><div id="roleCarousel"></div><p class="sub" style="text-align:center;margin:.5rem auto 0">Slide the bar to browse roles, then click the centre card to sign in.</p></div>`;
}

/* ---------- shell ---------- */
function shell() {
  const hi = CUR.alerts.filter(a => a.sev === 'high').length;
  return `<div class="shell"><nav><div class="brand"><svg width="34" height="34" viewBox="0 0 400 400"><circle cx="200" cy="200" r="170" fill="none" stroke="#b3222f" stroke-width="22"/><line x1="200" y1="200" x2="200" y2="80" stroke="#efe6d2" stroke-width="26"/><line x1="200" y1="200" x2="280" y2="200" stroke="#d8a94a" stroke-width="26"/></svg><span class="d">FestOS</span></div>
  ${Object.keys(NAV).filter(can).map(k => `<a class="${k === page ? 'on' : ''}" data-act="nav" data-p="${k}">${NAV[k]}
    ${badge(k, hi)}
    </a>`).join('')}
  <div style="margin-top:auto;font-size:.8rem;color:var(--ash)">${esc(USERS[S.user][1])}<br><a data-act="logout" style="padding:.3rem 0">Sign out</a><a data-act="reset" style="padding:.3rem 0;color:#c66">Reset demo state</a></div></nav><main id="pg" style="overflow-y:auto; max-height:100vh; padding-bottom:3rem;">${views[page]()}</main></div>`;
}
const head = (t, s) => `<div class="top"><div><h2>${t}</h2><p class="sub">${s}</p></div><div class="who">Aarohan · 30 Oct – 1 Nov 2026<br>${CUR.q.raw} raw records · ${FE.people(S).length} active</div></div>`;
const kpi = (n, l, c = '') => `<div class="card kpi ${c}"><div class="n" data-n="${n}">${n}</div><small>${l}</small></div>`;
const tag = (s, t) => `<span class="tag ${s}">${esc(t ?? s)}</span>`;

/* ---------- Control Tower charts ---------- */
(function injectChartCSS() {
  const st = document.createElement('style');
  st.textContent = `
  .fo-charts{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:1rem;margin:1rem 0 1.6rem}
  .fo-c5{grid-column:span 5}.fo-c6{grid-column:span 6}.fo-c7{grid-column:span 7}
  @media(max-width:1100px){.fo-c5,.fo-c6,.fo-c7{grid-column:span 12}}
  .fo-ch{display:flex;flex-direction:column}
  .fo-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1rem}
  .fo-chs{color:var(--ash);font-size:.8rem;margin:.15rem 0 0}
  .fo-go{color:var(--ash);font-size:.78rem;cursor:pointer;white-space:nowrap;transition:color .2s}.fo-go:hover{color:var(--gold)}
  .fo-dn{display:flex;gap:1.6rem;align-items:center;flex-wrap:wrap}
  .fo-dn svg{width:150px;height:150px;flex:0 0 auto;overflow:visible}
  .fo-seg{fill:none;stroke-width:16;animation:fo-seg 1.1s cubic-bezier(.22,1,.36,1) backwards;transition:opacity .2s,stroke-width .2s}
  .fo-dn.hl [data-seg]:not(.on){opacity:.28}.fo-seg.on{stroke-width:21}
  @keyframes fo-seg{from{stroke-dasharray:0 var(--C)}}
  .fo-big{font:700 30px 'Cinzel',serif;fill:var(--bone)}.fo-small{font-size:10px;fill:var(--ash)}
  .fo-side{flex:1;min-width:210px}
  .fo-lg{display:grid;gap:.15rem;font-size:.84rem}
  .fo-lg div{display:flex;align-items:center;gap:.5rem;padding:.2rem .4rem;border-radius:4px;transition:background .2s,opacity .2s}
  .fo-lg div.on{background:#ffffff10}.fo-lg i{width:10px;height:10px;border-radius:3px;flex:0 0 auto}
  .fo-lg b{margin-left:auto;font-variant-numeric:tabular-nums}.fo-lg em{color:var(--ash);font-style:normal;font-size:.74rem;min-width:36px;text-align:right}
  .fo-bud{margin-top:.9rem;padding-top:.8rem;border-top:1px solid var(--line);font-size:.8rem}
  .fo-bt{display:flex;justify-content:space-between;color:var(--ash);margin-bottom:.4rem}.fo-bt b{color:var(--bone);font-weight:500}
  .fo-bn{margin-top:.4rem;color:var(--ash);font-size:.74rem}
  .fo-hr{display:grid;grid-template-columns:minmax(90px,34%) 1fr 62px;gap:.8rem;align-items:center;margin:.55rem 0;font-size:.82rem}
  .fo-hl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fo-ht{display:flex;height:10px;background:#26181c;border-radius:6px;overflow:hidden}
  .fo-ht i{display:block;height:100%;transform-origin:left;animation:fo-grow .8s cubic-bezier(.22,1,.36,1) backwards;transition:filter .2s}
  .fo-hr:hover .fo-ht i{filter:brightness(1.35)}.fo-hr:hover .fo-hl{color:var(--gold)}
  @keyframes fo-grow{from{transform:scaleX(0)}}
  .fo-hv{font-variant-numeric:tabular-nums;font-size:.78rem;text-align:right}
  .fo-key{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:auto;padding-top:.9rem;font-size:.74rem;color:var(--ash)}
  .fo-key span{display:flex;align-items:center;gap:.35rem}.fo-key i{width:9px;height:9px;border-radius:3px}
  .fo-chips{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem}
  .fo-tabs{display:flex;gap:.4rem;margin-bottom:.8rem}
  .fo-tabs button{background:transparent;border:1px solid var(--line);color:var(--ash);padding:.3rem .8rem;font-size:.8rem;border-radius:999px}
  .fo-tabs button.on{background:linear-gradient(#7d1621,#4d0c14);border-color:var(--blood);color:var(--bone)}
  .fo-more{align-self:flex-start;margin-top:.6rem;font-size:.78rem;padding:.25rem .8rem;border-radius:999px;background:transparent;border:1px solid var(--line);color:var(--ash)}
  .fo-empty{color:var(--ash);font-size:.85rem;padding:.8rem 0}`;
  document.head.appendChild(st);
})();

const CH = { ok: '#5fae7a', gold: '#d8a94a', hot: '#ff5b69', hotd: '#7d1621', blue: '#5b8def', ash: '#6d5c61' };
const FO = { tab: 'merch', all: {} };
const go = (p, t) => can(p) ? `<a class="fo-go" data-act="nav" data-p="${p}">${t} →</a>` : '';
const chCard = (cls, id, t, s, link, body) => `<div class="card fo-ch ${cls}" id="${id}"><div class="fo-hd"><div><h3>${t}</h3><p class="fo-chs">${s}</p></div>${link}</div>${body}</div>`;
const chKey = items => `<div class="fo-key">${items.map(([c, l]) => `<span><i style="background:${c}"></i>${l}</span>`).join('')}</div>`;
const chRow = (label, parts, right, rc, tip) => { const max = parts.reduce((a, p) => a + p.v, 0) || 1;
  return `<div class="fo-hr" title="${esc(tip || label)}"><span class="fo-hl">${esc(label)}</span><div class="fo-ht">${parts.filter(p => p.v > 0).map((p, i) => `<i style="width:${(p.v / max * 100).toFixed(2)}%;background:${p.c};animation-delay:${i * 90}ms"></i>`).join('')}</div><b class="fo-hv" style="color:${rc}">${esc(right)}</b></div>`; };
const pctCol = p => p >= 1 ? CH.ok : p >= .5 ? CH.gold : CH.hot;

function chStay(a) {
  const total = a.requested || 1, R = 60, C = 2 * Math.PI * R, placed = a.hostel + a.ext;
  const segs = [['In hostels', a.hostel, CH.ok], ['External stays', a.ext, CH.blue], ['Awaiting budget', a.unfunded, CH.gold], ['No bed anywhere', a.unplaced, CH.hot]];
  let cum = 0;
  const arcs = segs.map(([l, v, c], i) => { const len = Math.max(0, v / total * C - (v ? 2 : 0)), off = -cum; cum += v / total * C;
    return v ? `<circle class="fo-seg" data-seg="${i}" data-v="${v}" data-l="${l}" cx="90" cy="90" r="${R}" stroke="${c}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" style="--C:${C.toFixed(2)};animation-delay:${i * 120}ms"/>` : ''; }).join('');
  const pct = a.budget ? Math.min(1, a.spent / a.budget) : 0, bc = pct > .9 ? CH.hot : pct > .7 ? CH.gold : CH.ok;
  const ov = S.budgetOverride ? ` (incl. ${inr(S.budgetOverride.extra)} override)` : '';
  return chCard('fo-c6', 'fo-stay', 'Accommodation', `${a.requested} requests · hover a slice for detail`, go('stay', 'Open Stay'),
    `<div class="fo-dn" data-v0="${placed}" data-l0="of ${a.requested} placed"><svg viewBox="0 0 180 180"><circle cx="90" cy="90" r="${R}" fill="none" stroke="#26181c" stroke-width="16"/><g transform="rotate(-90 90 90)">${arcs}</g><text class="fo-big" x="90" y="94" text-anchor="middle">${placed}</text><text class="fo-small" x="90" y="110" text-anchor="middle">of ${a.requested} placed</text></svg>
    <div class="fo-side"><div class="fo-lg">${segs.map(([l, v, c], i) => `<div data-seg="${i}" data-v="${v}" data-l="${l}"><i style="background:${c}"></i>${l}<b>${v}</b><em>${Math.round(v / total * 100)}%</em></div>`).join('')}</div>
    <div class="fo-bud"><div class="fo-bt"><span>External budget</span><b>${inr(a.spent)} of ${inr(a.budget)}${ov}</b></div><div class="fo-ht"><i style="width:${(pct * 100).toFixed(1)}%;background:${bc}"></i></div>
    <div class="fo-bn">${a.unfunded ? a.unfunded + ' placements held until the director approves more budget' : 'Nothing waiting on budget'}</div></div></div></div>`);
}

function chConflicts(sc) {
  const by = {}; sc.conflicts.forEach(c => { const o = by[c.type] = by[c.type] || { high: 0, med: 0, n: 0 }; o[c.sev === 'high' ? 'high' : 'med']++; o.n++; });
  const rows = Object.entries(by).sort((x, y) => y[1].n - x[1].n).slice(0, 5), hi = sc.conflicts.filter(c => c.sev === 'high').length;
  return chCard('fo-c6', 'fo-conf', 'Schedule conflicts', `${sc.conflicts.length} open, grouped by type`, go('sched', 'Open Battle Board'),
    `<div class="fo-chips"><span class="tag high">${hi} high</span><span class="tag med">${sc.conflicts.length - hi} medium</span></div>` +
    (rows.length ? rows.map(([t, o]) => chRow(t, [{ v: o.high, c: CH.hot }, { v: o.med, c: CH.gold }], String(o.n), o.high ? CH.hot : CH.gold, `${t}: ${o.high} high, ${o.med} medium`)).join('') + chKey([[CH.hot, 'High'], [CH.gold, 'Medium']]) : '<div class="fo-empty">No conflicts right now.</div>'));
}

function chStores() {
  const m = CUR.m, isM = FO.tab === 'merch', open = FO.all[FO.tab], LIM = 6; let rows, key, chip;
  if (isM) {
    rows = m.rows.map(r => { const p = r.dem ? Math.min(1, r.avail / r.dem) : 1; return { l: r.item + (r.size && r.size !== 'NA' ? ' ' + r.size : ''), p, parts: [{ v: p, c: CH.ok }, { v: 1 - p, c: CH.hotd }], right: Math.round(p * 100) + '%', tip: `${r.avail} usable vs ${r.dem} needed` }; }).sort((x, y) => x.p - y.p);
    key = [[CH.ok, 'Covered'], [CH.hotd, 'Shortfall']]; chip = `${rows.filter(r => r.p < 1).length} of ${rows.length} items short`;
  } else {
    rows = m.logistics.map(l => { const t = (l.good + l.transit + l.check + l.repair) || 1, p = l.good / t; return { l: l.item, p, parts: [{ v: l.good, c: CH.ok }, { v: l.transit, c: CH.blue }, { v: l.check, c: CH.gold }, { v: l.repair, c: CH.hot }], right: `${l.good}/${t}`, tip: `${l.good} serviceable · ${l.transit} in transit · ${l.check} need check · ${l.repair} repair` }; }).sort((x, y) => x.p - y.p);
    key = [[CH.ok, 'Serviceable'], [CH.blue, 'Transit'], [CH.gold, 'Check'], [CH.hot, 'Repair']]; chip = `${rows.filter(r => r.p === 0).length} items with none serviceable`;
  }
  const show = open ? rows : rows.slice(0, LIM);
  return chCard('fo-c7', 'fo-stores', 'Stores', chip, go('stock', 'Open Stores'),
    `<div class="fo-tabs"><button class="${isM ? 'on' : ''}" data-fo="tab:merch">Merchandise</button><button class="${isM ? '' : 'on'}" data-fo="tab:equip">Equipment</button></div>` +
    show.map(r => chRow(r.l, r.parts, r.right, pctCol(r.p), r.tip)).join('') +
    (rows.length > LIM ? `<button class="fo-more" data-fo="more:">${open ? 'Show less' : 'Show all ' + rows.length}</button>` : '') + chKey(key));
}

function chDiet(v) {
  const rows = [...v.cover].sort((x, y) => ({ UNCOVERED: 0, thin: 1, unverifiable: 2, ok: 3 }[x.gap] - { UNCOVERED: 0, thin: 1, unverifiable: 2, ok: 3 }[y.gap]) || y.demand - x.demand);
  const bad = rows.filter(c => c.gap === 'UNCOVERED').length, lab = { ok: 'Covered', thin: 'Thin', UNCOVERED: 'Uncovered', unverifiable: 'Unverified' };
  return chCard('fo-c5', 'fo-diet', 'Dietary coverage', bad ? `${bad} diets have no compliant vendor` : 'All recorded diets covered', go('kitchen', 'Open Kitchen'),
    rows.map(c => { const un = c.gap === 'unverifiable', cov = c.demand ? Math.min(1, c.cap / c.demand) : 1, col = c.gap === 'ok' ? CH.ok : c.gap === 'thin' ? CH.gold : un ? CH.ash : CH.hot;
      return chRow(c.diet, un ? [{ v: 1, c: CH.ash }] : [{ v: cov, c: CH.ok }, { v: 1 - cov, c: CH.hotd }], lab[c.gap] || c.gap, col, `${c.demand} people · vendor capacity ${c.cap} · ${c.vendors} vendors`); }).join('') + chKey([[CH.ok, 'Covered'], [CH.hotd, 'Uncovered'], [CH.ash, 'Unverified']]));
}

const charts = () => `<div class="fo-charts">${chStay(CUR.a)}${chConflicts(CUR.sc)}${chStores()}${chDiet(CUR.v)}</div>`;

/* chart interactions: donut hover, store tabs, show all */
(function chartEvents() {
  const dnSet = (dn, t) => { dn.classList.toggle('hl', !!t); dn.querySelectorAll('[data-seg]').forEach(x => x.classList.toggle('on', !!t && x.dataset.seg === t.dataset.seg));
    $('.fo-big', dn).textContent = t ? t.dataset.v : dn.dataset.v0; $('.fo-small', dn).textContent = t ? t.dataset.l : dn.dataset.l0; };
  document.addEventListener('mouseover', e => { const dn = e.target.closest('.fo-dn'); if (dn) dnSet(dn, e.target.closest('[data-seg]')); });
  document.addEventListener('mouseout', e => { const dn = e.target.closest('.fo-dn'); if (dn && !(e.relatedTarget && dn.contains(e.relatedTarget) && e.relatedTarget.closest('[data-seg]'))) dnSet(dn, null); });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-fo]'); if (!t) return; const [k, v] = t.dataset.fo.split(':');
    if (k === 'tab') FO.tab = v; else if (k === 'more') FO.all[FO.tab] = !FO.all[FO.tab];
    const el = $('#fo-stores'); if (el) el.outerHTML = chStores();   // only this card re-draws
  });
})();

/* ---------- volunteer desk: tasks, announcements, issues ---------- */
const mm = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const ISS_CATS = ['Equipment', 'Venue', 'Safety / medical', 'Crowd', 'Food', 'Stay', 'Other'];
const ISS_ST = { pending: ['high', 'Pending'], progress: ['med', 'In progress'], resolved: ['ok', 'Resolved'] };
const issueTag = st => tag(ISS_ST[st][0], ISS_ST[st][1]);
const priTag = p => tag(p === 'High' ? 'high' : p === 'Medium' ? 'med' : 'low', p);
const volunteers = () => D.core_team.filter(t => t.role === 'Volunteer');
const me = () => volunteers().find(t => t.member_id === S.me) || volunteers()[0];
const volPicker = () => `<div class="row"><b>Viewing as</b><select data-chg="setMe">${volunteers().map(t => `<option value="${t.member_id}" ${t.member_id === S.me ? 'selected' : ''}>${esc(t.name)} (${t.member_id}) · shift ${t.shift}</option>`).join('')}</select></div>`;
const badge = (k, hi) => { const n = k === 'tower' ? hi : k === 'issues' ? S.issues.filter(i => i.status === 'pending').length : 0; return n > 0 ? `<span class="pill">${n}</span>` : ''; };

const views = {
tower() { const { a, sc, alerts } = CUR; return head('Control Tower', 'What needs a human right now, ranked. Nothing here is hidden inside a score.') +
  `<div class="grid">${kpi(a.hostel + a.ext, `of ${a.requested} stay requests placed`, a.unplaced ? 'bad' : 'good')}${kpi(a.unplaced + a.unfunded, 'beds missing or awaiting budget', 'bad')}${kpi(sc.conflicts.filter(c => c.sev === 'high').length, `serious schedule conflicts (${sc.conflicts.length} total)`, 'warn')}${kpi(alerts.length, 'open alerts')}</div>
    ${charts()}<h3>Needs attention</h3>
    <div style="margin-top:.6rem; max-height:48vh; overflow-y:auto; padding-right:4px;">${alerts.map((x, i) => `<div class="alert ${x.sev}" style="animation-delay:${i * 40}ms">${tag(x.sev, x.mod)}<div>${esc(x.msg)}</div><small>${esc(x.act)}</small></div>`).join('')}</div>`; },

recon() { const Q = CUR.q; return head('Reconcile the data pack', `The brief expects ~${Q.expected}; the pack holds ${Q.raw}. We keep every record, explain the gap, and never silently delete.`) +
  `<div class="grid">${kpi(Q.raw, 'raw participant records')}${kpi(Q.declared, 'sum of declared contingent strengths')}${kpi(Q.noStay, 'did not request accommodation')}${kpi(Q.dups.length, 'same name+college+age+gender+size (possible dupes)', 'warn')}</div>
  <div class="note"><b>Reading of the 436-record gap:</b> contingent declarations sum to ${Q.declared}. Declared strengths ≈ expected headcount, so the surplus is likely late registrants, duplicates and un-declared extras.</div>
  <div class="two"><div><h3>Possible duplicates</h3><div class="scroll"><table><tr><th>Name</th><th>College</th><th>IDs</th><th></th></tr>${Q.dups.slice(0, 60).map((g, i) => { const done = g.slice(1).every(p => S.merged[p.participant_id]); return `<tr><td>${esc(g[0].name)}</td><td>${esc(g[0].college)}</td><td>${g.map(p => p.participant_id).join(', ')}</td><td>${done ? tag('ok', 'merged') : can('lab') ? `<button class="ghost" data-act="merge" data-i="${i}">Merge</button>` : ''}</td></tr>`; }).join('')}</table></div></div>
  <div><h3>Contingent count mismatches</h3><div class="scroll"><table><tr><th>Contingent</th><th>Declared</th><th>In file</th><th>Δ</th></tr>${Q.mism.map(c => `<tr><td>${esc(c.college)} (${c.contingent_id})</td><td>${c.strength_declared}</td><td>${c.listed}</td><td>${tag(Math.abs(c.diff) > 3 ? 'high' : 'med', (c.diff > 0 ? '+' : '') + c.diff)}</td></tr>`).join('')}</table></div>
  </div></div>`; },

people() { const L = FE.people(S), m = q ? L.filter(p => (p.name + p.participant_id + p.college).toLowerCase().includes(q.toLowerCase())).slice(0, 12) : [];
  return head('Participant record', 'One record joining contingent, events, stay, merchandise, food and status.') + `<div class="row"><input id="q" placeholder="Search name, ID or college…" value="${esc(q)}" style="min-width:320px"><button data-act="search">Find</button></div>` + m.map(p => { const r = CUR.a.res[p.participant_id], ev = D.registrations.filter(x => x.participant_id === p.participant_id).map(x => D.events.find(e => e.event_id === x.event_id)?.event_name), iss = S.issued[p.participant_id];
    return `<div class="card" style="margin-bottom:.8rem"><h3>${esc(p.name)} <small style="color:var(--ash)">${p.participant_id} · ${esc(p.college)} (${p.contingent_id})</small></h3><div class="two" style="margin-top:.6rem"><div>Contact: ${mask(p.contact, 'pii')}<br>Gender (as given): ${p.gender_as_given ? esc(p.gender_as_given) : tag('med', 'unknown — not inferred')}<br>Accessibility: ${perm('med') ? esc(p.accessibility_needs || 'UNKNOWN (blank)') : mask('', 'med')}<br>Diet: ${perm('med') || perm('diet') ? esc(p.dietary_needs || 'UNKNOWN (blank)') : mask('', 'med')}<br>Arrives ${esc(p.arrival_datetime)} → leaves ${esc(p.departure_datetime)}</div>
    <div>Events: ${ev.map(esc).join(', ') || '—'}<br>Stay: ${!r ? 'not requested' : r.kind === 'hostel' ? `Hostel ${r.room}` : r.kind === 'ext' ? `${esc(r.prop)} (${inr(r.cost)})` : tag('high', r.kind)}${r?.flags?.length ? '<br><small style="color:var(--gold)">' + r.flags.map(esc).join('<br>') + '</small>' : ''}<br>Merch: ${iss ? iss.items.join(', ') + ' · issued' : 'nothing issued'} · size ${p.tshirt_size}${can('stock') || can('people') ? `<div class="row">${['T-shirt', 'ID card', 'lanyard', 'tote', 'special badge', 'winner medal'].map(i => `<button class="ghost" data-act="issue" data-id="${p.participant_id}" data-i="${i}">Issue ${i}</button>`).join('')}</div>` : ''}</div></div></div>`; }).join('') || (q ? '<p class="sub">No match.</p>' : ''); },

stay() { const { a } = CUR, sh = a.shortage, byC = {}; FE.people(S).filter(p => p.accommodation_requested === 'yes').forEach(p => { const c = byC[p.contingent_id] = byC[p.contingent_id] || { c: p.contingent_id, n: 0, h: 0, e: 0, x: 0, b: new Set() }, r = a.res[p.participant_id]; c.n++; r.kind === 'hostel' ? (c.h++, c.b.add(r.block)) : r.kind === 'ext' ? (c.e++, c.b.add(r.prop)) : c.x++; });
  return head('Accommodation', 'Hard needs first, cohesion second, cost last. Every relaxed rule is listed with its reason.') +
  `<div class="row" style="margin-bottom:1rem"><button data-act="exportStay">Export to CSV</button></div>
  <div class="grid">${kpi(a.hostel, `in hostels (${sh.totalBeds} beds)`, 'good')}${kpi(a.ext, `in external stays (${inr(a.spent)} of ${inr(a.budget)})`, 'warn')}${kpi(a.unfunded, 'need budget override', 'warn')}${kpi(a.unplaced, 'no bed anywhere', 'bad')}</div>
  <div class="note">Demand ${a.requested} vs supply ${sh.totalBeds} hostel + ${sh.extBeds} external = ${sh.totalBeds + sh.extBeds}. Wheelchair demand ${sh.wheelchairDemand} vs ${sh.accessibleBeds} accessible beds.</div>
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
  <div class="two"><div><h3>Merchandise</h3><table><tr><th>Item</th><th>Size</th><th>Usable</th><th>Issued</th><th>Remaining</th><th>Needed</th><th>Gap</th></tr>${rows.map(r => `<tr><td>${r.item}</td><td>${r.size || '—'}</td><td>${r.avail}</td><td>${r.used}</td><td>${r.free <= 0 ? tag('high', r.free) : r.free}</td><td>${r.dem}</td><td>${r.gap < 0 ? tag('high', 'short ' + -r.gap) : tag('ok', '+' + r.gap)}</td></tr>`).join('')}</table></div>
  <div><h3>Equipment & logistics</h3><table><tr><th>Item</th><th>Good</th><th>Transit</th><th>Check</th><th>Repair</th>${can('lab') ? '<th></th>' : ''}</tr>${logistics.map(l => `<tr><td>${l.item}</td><td>${l.good ? l.good : tag('high', 0)}</td><td>${l.transit}</td><td>${l.check}</td><td>${l.repair}</td>${can('lab') ? `<td><button class="ghost" data-act="fail" data-i="${l.item}">Fail 5</button></td>` : ''}</tr>`).join('')}</table></div></div>`; },

kitchen() { const { vs, cover } = CUR.v; return head('Kitchen', 'Who can legally feed whom — certificates, hours, dietary coverage and payment terms.') +
  `<h3>Dietary coverage (eligible vendors only)</h3><table><tr><th>Need</th><th>People</th><th>Vendors</th><th>Capacity</th><th>Status</th></tr>${cover.map(c => `<tr><td>${esc(c.diet)}</td><td>${c.demand}</td><td>${c.vendors}</td><td>${c.cap}</td><td>${tag(c.gap === 'ok' ? 'ok' : c.gap === 'thin' ? 'med' : 'high', c.gap)}</td></tr>`).join('')}</table>
  <h3>Vendors</h3><div class="scroll"><table><tr><th>Vendor</th><th>Menu</th><th>Diets</th><th>Cert</th><th>Hours</th><th>Cap</th><th>Payment</th><th></th></tr>${vs.map(v => `<tr><td>${v.vendor_name}</td><td>${v.menu}</td><td>${v.opts.join(', ')}</td><td>${tag(v.st === 'valid' ? 'ok' : v.st === 'expired' ? 'high' : 'med', v.cert + ' · ' + v.st)}</td><td>${v.hours}</td><td>${v.cap}</td><td>${esc(v.payment_terms)}</td><td>${v.dead ? tag('high', 'SHUT DOWN') : can('lab') ? `<button class="ghost" data-act="vdown" data-v="${v.vendor_id}">Shut down</button>` : ''}</td></tr>`).join('')}</table></div>`; },

lab() { const op = (a, b) => D[a].map(x => `<option value="${x[b[0]]}">${esc(x[b[1]])}</option>`).join(''); return head('Disruption Lab', 'Inject a failure. State really changes, the ripple shows who is affected, and the reason is written to the audit trail.') +
  `<div class="row"><input id="reason" placeholder="Reason for this change (required)" style="flex:1;min-width:300px"></div><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
  <div class="card"><h3>Late contingent</h3><div class="row"><input id="lc" placeholder="College name"><input id="ln" type="number" value="20" style="width:80px"></div><button data-act="late">Add contingent</button></div>
  <div class="card"><h3>Hostel closure</h3><div class="row"><select id="hb">${[...new Set(D.hostels.map(h => h.block))].map(b => `<option>${b}</option>`).join('')}</select></div><button data-act="hclose">Close block</button></div>
  <div class="card"><h3>Equipment failure</h3><div class="row"><select id="ei">${[...new Set(D.inventory_logistics.map(l => l.item))].map(i => `<option>${i}</option>`).join('')}</select><input id="en" type="number" value="10" style="width:80px"></div><button data-act="efail">Fail units</button></div>
  <div class="card"><h3>Venue change</h3><div class="row"><select id="vo">${op('venues', ['venue_id', 'venue_name'])}</select></div><button data-act="vout">Venue unavailable</button></div>
  <div class="card"><h3>Vendor shutdown</h3><div class="row"><select id="vv">${op('vendors', ['vendor_id', 'vendor_name'])}</select></div><button data-act="vdown2">Shut down</button></div>
  
  <div class="card"><h3>Capacity Override</h3><div class="row"><select id="ce">${op('events', ['event_id', 'event_name'])}</select></div><button data-act="capover">Approve Oversized Event</button></div>
  </div>`; },

  tasks() { const v = me(), [a, b] = v.shift.split('-').map(mm), inShift = m => a < b ? m >= a && m < b : m >= a || m < b;
  const L = CUR.sc.slots.filter(s => !s.unscheduled && inShift(s.start % 1440)).sort((x, y) => x.start - y.start);
  return head('My Tasks', 'Your duties, event timings and assigned locations, live from the Battle Board.') + volPicker() +
  `<div class="grid">${kpi(L.length, 'event slots during your shift')}${kpi(new Set(L.map(s => s.venue.venue_id)).size, 'venues you may be sent to')}<div class="card kpi"><div class="n" style="font-size:1.5rem">${esc(v.shift)}</div><small>${esc(v.name)} · ${esc(v.phone)}</small></div></div>
  <div class="note">Tasks are the events that start inside your shift window. Organisers have not assigned individual volunteers to events.</div>
  <div class="scroll"><table><tr><th>When</th><th>Event</th><th>Round</th><th>Venue</th><th>Volunteers needed</th><th>Heads-up</th></tr>${L.map(s => `<tr><td>${FE.fmtT(s.start)} → ${FE.fmtT(s.end).slice(-5)}</td><td>${esc(s.ev.event_name)}</td><td>${esc(s.rd)}</td><td>${esc(s.venue.venue_name)}</td><td>${s.vol}</td><td>${s.volOver > 0 ? tag('med', '~' + s.volOver + ' short on cover') : ''} ${s.eqBad && s.eqBad.length ? tag('high', 'equipment issue') : ''}</td></tr>`).join('') || '<tr><td colspan=6>No events start during your shift.</td></tr>'}</table></div>`; },

news() { return head('Announcements', 'Important updates from the organisers, newest first.') +
  (can('issues') ? `<div class="card" style="margin-bottom:1rem"><h3>Post an announcement</h3><div class="row"><input id="nt" placeholder="Title" style="flex:1;min-width:220px"><select id="np"><option value="normal">Normal</option><option value="urgent">Urgent</option></select></div><div class="row"><textarea id="nb" rows="3" placeholder="Message to all volunteers" style="flex:1;min-width:300px"></textarea></div><button data-act="postNews">Publish</button></div>` : '') +
  (S.news.map(n => `<div class="alert ${n.urgent ? 'high' : ''}">${tag(n.urgent ? 'high' : 'ok', n.urgent ? 'URGENT' : 'Update')}<div><b>${esc(n.title)}</b><br>${esc(n.body)}</div><small>${esc(n.by)} · ${esc(n.t)}</small></div>`).join('') || '<p class="sub">No announcements yet.</p>'); },

report() { const mine = S.issues.filter(i => i.user === S.user).slice().reverse();
  return head('Raise an Issue', 'Report a problem during the festival. Organisers see it straight away, and you can track it below.') + volPicker() +
  `<div class="card" style="margin-bottom:1rem"><div class="row"><select id="ic">${ISS_CATS.map(c => `<option>${c}</option>`).join('')}</select><select id="il">${D.venues.map(v => `<option>${esc(v.venue_name)}</option>`).join('')}<option>Other / not at a venue</option></select><select id="ip"><option>Low</option><option selected>Medium</option><option>High</option></select></div>
  <div class="row"><textarea id="idsc" rows="3" placeholder="What is the problem? Be specific (what, where, how many people affected)" style="flex:1;min-width:300px"></textarea></div><button data-act="raiseIssue">Submit issue</button></div>
  <h3>My issues (${mine.length})</h3><div class="scroll" style="margin-top:.6rem"><table><tr><th>ID</th><th>Raised</th><th>Category</th><th>Location</th><th>Priority</th><th>Status</th><th>Organiser note</th></tr>${mine.map(i => `<tr><td>${i.id}</td><td>${esc(i.t)}</td><td>${esc(i.cat)}</td><td>${esc(i.loc)}</td><td>${priTag(i.pri)}</td><td>${issueTag(i.status)}</td><td>${esc(i.note || '—')}</td></tr>`).join('') || '<tr><td colspan=7>You have not raised any issues.</td></tr>'}</table></div>`; },

issues() { const so = { pending: 0, progress: 1, resolved: 2 }, po = { High: 0, Medium: 1, Low: 2 }, n = s => S.issues.filter(i => i.status === s).length,
  L = S.issues.slice().sort((x, y) => so[x.status] - so[y.status] || po[x.pri] - po[y.pri] || (x.id < y.id ? 1 : -1));
  return head('Issue Desk', 'Problems reported by volunteers. Update the status and leave a note; the volunteer sees it instantly.') +
  `<div class="grid">${kpi(n('pending'), 'pending', n('pending') ? 'bad' : 'good')}${kpi(n('progress'), 'in progress', 'warn')}${kpi(n('resolved'), 'resolved', 'good')}</div>
  <div class="scroll"><table><tr><th>Issue</th><th>Raised by</th><th>What</th><th>Priority</th><th>Details</th><th>Status</th><th>Your response</th></tr>${L.map(i => `<tr><td>${i.id}<br><small style="color:var(--ash)">${esc(i.t)}</small></td><td>${esc(i.who)}</td><td>${esc(i.cat)}<br><small style="color:var(--ash)">${esc(i.loc)}</small></td><td>${priTag(i.pri)}</td><td>${esc(i.desc)}</td><td>${issueTag(i.status)}</td>
  <td><input id="n-${i.id}" placeholder="Note to volunteer" value="${esc(i.note || '')}" style="width:100%"><div class="row">${i.status === 'pending' ? `<button class="ghost" data-act="issueSet" data-id="${i.id}" data-s="progress">Start</button>` : ''}${i.status !== 'resolved' ? `<button data-act="issueSet" data-id="${i.id}" data-s="resolved">Resolve</button>` : `<button class="ghost" data-act="issueSet" data-id="${i.id}" data-s="pending">Reopen</button>`}</div></td></tr>`).join('') || '<tr><td colspan=7>No issues reported yet.</td></tr>'}</table></div>`; },

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
  logout() { S.user = null; intro = true; save(); render(); }, nav(e) { page = e.dataset.p; render(); }, day(e) { day = +e.dataset.d; render(); }, close() { $('.modal')?.remove(); },
  enter() { intro = false; render(); },
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
  
    setMe(e) { S.me = e.value; save(); render(); },
  postNews() { const t = val('nt').trim(), b = val('nb').trim(); if (!t || !b) return toast('Title and message are required.');
    S.news.unshift({ id: Date.now(), t: new Date().toLocaleString('en-IN'), by: USERS[S.user][1], title: t, body: b, urgent: val('np') === 'urgent' });
    log(`Announcement: ${t}`, b.slice(0, 80)); save(); toast('Announcement published.'); render(); },
  raiseIssue() { const d = val('idsc').trim(); if (!d) return toast('Please describe the problem.');
    const id = 'ISS-' + String(S.issues.length + 1).padStart(3, '0'), v = me();
    S.issues.push({ id, t: new Date().toLocaleString('en-IN'), user: S.user, who: `${v.name} (${v.member_id})`, cat: val('ic'), loc: val('il'), pri: val('ip'), desc: d, status: 'pending', note: '' });
    log(`Issue ${id} raised: ${val('ic')} at ${val('il')} [${val('ip')}]`, d); save(); toast(`${id} raised. Organisers can see it now.`); render(); },
  issueSet(e) { const i = S.issues.find(x => x.id === e.dataset.id); if (!i) return; const note = val('n-' + i.id).trim();
    i.status = e.dataset.s; i.note = note; log(`Issue ${i.id} set to ${ISS_ST[i.status][1]}`, note || '—'); save(); toast(`${i.id}: ${ISS_ST[i.status][1]}.`); render(); },

  // Issue 6 Fix: Capacity Override action
  capover() { const e = val('ce'); apply(`Capacity override for event ${e}`, s => s.capOverride.push(e), val('reason')); },
  
  issue(e) { 
    const id = e.dataset.id, it = e.dataset.i;
    const p = FE.people(S).find(x => x.participant_id === id);
    const sz = it === 'T-shirt' ? p.tshirt_size : null;
    
    const mData = FE.merch(S).rows.find(r => r.item === it && (!sz || r.size === sz));
    if (!mData) return toast(`Stock record not found for ${it}.`);
    if (mData.free <= 0) return toast(`Blocked: ${it} ${sz || ''} is OUT OF STOCK (0 remaining).`);

    const rec = S.issued[id] = S.issued[id] || { items: [], size: null };
    if (rec.items.includes(it)) { log(`BLOCKED duplicate claim: ${it} for ${id}`, 'Already issued'); save(); toast(`Blocked: ${id} already received ${it}.`); return render(); }
    
    rec.items.push(it); if (it === 'T-shirt') rec.size = p.tshirt_size; 
    log(`Issued ${it} to ${id}`, 'Desk issue'); 
    save(); CUR = FE.snapshot(S); 
    toast(`${it} issued to ${id}.`); 
    render(); 
  },
  budget(e, ev) { ev.preventDefault(); const x = +val('bx'), r = val('br'); if (S.user !== 'director') return toast('Only the Festival Director may override budget.'); if (!x || !r.trim()) return toast('Amount and reason are required.'); apply(`Budget override +${inr(x)}`, s => s.budgetOverride = { extra: (s.budgetOverride?.extra || 0) + x, by: s.user, reason: r }, r, true); }
};
addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t && t.tagName !== 'FORM' && A[t.dataset.act]) A[t.dataset.act](t, e); });
addEventListener('submit', e => { const t = e.target.closest('[data-act]'); if (t && A[t.dataset.act]) A[t.dataset.act](t, e); });
addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'q') A.search(); });
addEventListener('change', e => { const t = e.target.closest('[data-chg]'); if (t && A[t.dataset.chg]) A[t.dataset.chg](t, e); });

function render() {
  if (window.__rc) { window.__rc.destroy(); window.__rc = null; }
  if (window.__ia) { cancelAnimationFrame(window.__ia); window.__ia = null; }
  $('#app').innerHTML = S.user ? shell() : intro ? introView() : loginView();
  if (!S.user && intro) startIntroAnim();
 
  if (!S.user && !intro) window.__rc = mountRoles($('#roleCarousel'), ROLES, signIn);

  document.querySelectorAll('[data-n]').forEach(el => { const n = +el.dataset.n, t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); });
}
boot(); render();
})();
