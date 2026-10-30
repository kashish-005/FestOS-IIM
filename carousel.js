/* Role carousel — vanilla port of the connected carousel. No dependencies. */
window.mountRoleCarousel = function (root, items, onPick, interval = 6000) {
  const n = items.length;
  let active = 0, prog = 0, last = null, raf = null, hover = false, tier = 'desktop';

  // Person icon (not a photo); hue differs per role
  const avatar = h => `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="100" height="100" fill="hsl(${h} 55% 20%)"/><circle cx="50" cy="50" r="46" fill="none" stroke="hsl(${h} 70% 45%)" stroke-width="1.5" opacity=".5"/>
    <circle cx="50" cy="38" r="16" fill="#efe6d2" opacity=".92"/><path d="M17 100c0-23 15-37 33-37s33 14 33 37z" fill="#efe6d2" opacity=".92"/></svg>`;

  root.innerHTML = `<div class="rc" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Choose a role to sign in">
    <div class="rc-stage">${items.map((it, i) => `
      <div class="rc-card" data-i="${i}" role="button" aria-label="Sign in as ${it.role}">
        <div class="rc-peek">${avatar(it.hue)}</div>
        <div class="rc-full"><div class="rc-text"><h3>${it.role}</h3><p>${it.desc}</p></div><div class="rc-pic">${avatar(it.hue)}</div></div>
      </div>`).join('')}</div>
    <div class="rc-tabs" role="tablist">${items.map((it, i) => `<button type="button" role="tab" class="rc-tab" data-t="${i}" aria-label="${it.role}"><i></i></button>`).join('')}</div></div>`;

  const rc = root.querySelector('.rc'), stage = root.querySelector('.rc-stage'), cards = [...root.querySelectorAll('.rc-card')], tabs = [...root.querySelectorAll('.rc-tab')];

  function layout() {
    const w = innerWidth; tier = w < 768 ? 'mobile' : w < 1120 ? 'tablet' : 'desktop';
    rc.classList.toggle('rc--mobile', tier === 'mobile');
    const dims = { desktop: [762, 513], tablet: [560, 440], mobile: [Math.min(340, w - 56), 490] }[tier];
    return { a: dims[0], b: dims[1] };
  }
  function variant(off, a, b) {
    const abs = Math.abs(off), s = off < 0 ? -1 : 1;
    if (!off) return { x: -a / 2, y: -b / 2, w: a, h: b, o: 1, z: 0 };
    if (tier === 'mobile') return abs === 1 ? { x: s < 0 ? -a / 2 - 76 : a / 2 + 16, y: -205, w: 60, h: 410, o: 1, z: 100 } : { x: s * (a / 2 + 220), y: -205, w: 60, h: 410, o: 0, z: 0 };
    if (tier === 'tablet') return abs === 1 ? { x: s < 0 ? -a / 2 - 118 : a / 2 + 18, y: -170, w: 100, h: 340, o: 1, z: 100 } : { x: s * (a / 2 + 240), y: -102, w: 74, h: 205, o: 0, z: 0 };
    if (abs === 1) return { x: s < 0 ? -506 : 401, y: -172, w: 105, h: 344, o: 1, z: 100 };
    if (abs === 2) return { x: s < 0 ? -596 : 522, y: -102.5, w: 74, h: 205, o: 1, z: 100 };
    return { x: s < 0 ? -720 : 646, y: -102.5, w: 74, h: 205, o: 0, z: 0 };
  }
  function place() {
    const { a, b } = layout(); stage.style.height = b + 'px';
    cards.forEach((c, i) => {
      let off = ((i - active) % n + n) % n; if (off > n / 2) off -= n;
      const v = variant(off, a, b), on = off === 0;
      Object.assign(c.style, { transform: `translate(${v.x}px,${v.y}px)`, width: v.w + 'px', height: v.h + 'px', opacity: v.o, zIndex: v.z, pointerEvents: v.o ? 'auto' : 'none' });
      c.classList.toggle('on', on);
      const f = c.querySelector('.rc-full'); f.style.width = a + 'px'; f.style.height = b + 'px';
    });
    tabs.forEach((t, i) => t.classList.toggle('on', i === active));
  }
  function go(i) { active = ((i % n) + n) % n; prog = 0; last = null; place(); }

  function step(ts) {
    if (!hover) { if (last === null) last = ts; prog += ts - last; last = ts; if (prog >= interval) { go(active + 1); } }
    else last = null;
    const fill = tabs[active].firstElementChild; if (fill) fill.style.transform = `scaleX(${Math.min(prog / interval, 1)})`;
    raf = requestAnimationFrame(step);
  }

  cards.forEach(c => c.addEventListener('click', () => onPick(items[+c.dataset.i].id)));   // click anywhere = sign in as that role
  tabs.forEach(t => t.addEventListener('click', () => go(+t.dataset.t)));
  rc.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(active - 1); else if (e.key === 'ArrowRight') go(active + 1); else if (e.key === 'Enter') onPick(items[active].id); });
  rc.addEventListener('mouseenter', () => hover = true); rc.addEventListener('mouseleave', () => hover = false);
  addEventListener('resize', place);
  place(); raf = requestAnimationFrame(step);
  return { destroy() { cancelAnimationFrame(raf); removeEventListener('resize', place); } };
};