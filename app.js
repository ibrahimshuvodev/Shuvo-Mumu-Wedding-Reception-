/* Shuvo & Mumu · Wedding Reception
   Edit the CONFIG block below to change dates, times or venue. */

const CONFIG = {
  // Wedding day, for the calendar page
  date: { y: 2026, m: 11, d: 27 },
  // Countdown target — Friday 27 Nov 2026, 6:00 PM Bangladesh time (UTC+6)
  countdownTo: '2026-11-27T18:00:00+06:00',
  // Program start used for "Add to Calendar" — 6:00 PM Bangladesh time
  eventStart: '2026-11-27T18:00:00+06:00',
  eventHours: 3,
  eventTitle: 'Wedding Reception — Shuvo & Mumu',
  venue: 'BAFWWA Auditorium, Dhaka Cantonment, Dhaka-1206',
  // Days left at which the "days" ring is full
  ringDays: 60,
};

// always start at the envelope, even after a reload mid-page
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────  LITE MODE: trims the heavy effects automatically on weaker devices  ─────────────
   <html class="lite"> hides the drape sway, sparkles, shimmer and camera drift, freezes the parallax,
   simplifies the glows and thins the petals. It switches on when the visitor has asked to save data,
   when the device reports very little memory, or — most reliably — when the page measures its own frame
   rate and finds it under ~40 fps in two 2-second checks in a row (phones in Low Power Mode land here too).
   Address options:  ?lite=1 forces it on,  ?lite=0 forces the full effects (handy for testing). */
const lite = (() => {
  const root = document.documentElement;
  const forced = new URLSearchParams(location.search).get('lite');
  const isOn = () => root.classList.contains('lite');
  const enable = (why, remember) => {
    if (isOn()) return;
    root.classList.add('lite');
    if (remember) { try { sessionStorage.setItem('lite', '1'); } catch (_) {} }   // only a real measured slowdown is remembered
    if (window.console) console.info('[lite mode] on: ' + why);
  };

  let watching = false;
  function watch() {
    if (watching || isOn() || forced === '0') return;
    watching = true;
    let frames = 0, t0 = performance.now(), low = 0, checks = 0, hidden = false;
    const onVis = () => { if (document.hidden) hidden = true; };
    document.addEventListener('visibilitychange', onVis);
    const done = () => { watching = false; document.removeEventListener('visibilitychange', onVis); };
    (function loop(now) {
      frames++;
      if (now - t0 >= 2000) {
        const fps = frames * 1000 / (now - t0);
        if (!hidden) {                       // ignore windows where the tab was in the background
          checks++;
          low = fps < 40 ? low + 1 : 0;
          if (low >= 2) { enable('measured ' + fps.toFixed(0) + ' fps', true); return done(); }
        }
        frames = 0; t0 = now; hidden = false;
        if (checks >= 7) return done();      // 14 s of healthy frames: leave the full effects on
      }
      requestAnimationFrame(loop);
    })(performance.now());
  }

  const nav = navigator, conn = nav.connection || {};
  if (forced === '1') enable('forced by ?lite=1');
  else if (forced !== '0') {
    let remembered = false;
    try { remembered = sessionStorage.getItem('lite') === '1'; } catch (_) {}
    if (remembered) enable('remembered for this visit');
    else if (conn.saveData) enable('data saver is on');
    else if (nav.deviceMemory && nav.deviceMemory <= 2) enable('low device memory');
    else if (matchMedia('(prefers-reduced-data: reduce)').matches) enable('reduced-data preference');
  }
  return { watch, enable, get on() { return isOn(); } };
})();

/* ─────────────  MUSIC: a pre-rendered soft-piano loop through a normal <audio> element  ─────────────
   A real audio file (not live synthesis) so it plays on iPhones even with the side switch on silent,
   costs almost no CPU on slower phones, and obeys autoplay rules because play() runs inside the tap. */
const piano = (() => {
  const audio = new Audio('assets/piano.mp3');
  audio.loop = true;
  audio.preload = 'none';
  audio.setAttribute('playsinline', '');
  const TARGET = 0.85;
  let playing = false, resumeOnShow = false, ours = false, rampTimer = 0;

  // volume ramp (iPhones keep volume fixed at 100%, which is harmless)
  function ramp(to, ms, done) {
    clearInterval(rampTimer);
    const from = audio.volume, t0 = Date.now();
    rampTimer = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / ms);
      try { audio.volume = Math.max(0, Math.min(1, from + (to - from) * k)); } catch (_) {}
      if (k >= 1) { clearInterval(rampTimer); if (done) done(); }
    }, 40);
  }

  async function start() {
    if (playing) return true;
    try { audio.volume = 0; } catch (_) {}
    try { ours = false; await audio.play(); } catch (_) { return false; }   // play() is called synchronously inside the tap
    playing = true;
    ramp(TARGET, 1800);
    return true;
  }

  function stop() {
    if (!playing) return;
    playing = false;
    ramp(0, 600, () => { if (!playing) { ours = true; audio.pause(); } });
  }

  // phone call / headphones unplugged / system pause → reflect it in the button
  audio.addEventListener('pause', () => { if (!ours && playing) { playing = false; syncUI(); } ours = false; });
  audio.addEventListener('error', () => { playing = false; syncUI(); });

  // be polite: pause when the tab is hidden, resume when it is back
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) { resumeOnShow = true; ours = true; audio.pause(); playing = false; }
    else if (!document.hidden && resumeOnShow) { resumeOnShow = false; start().then(syncUI); }
  });

  // fetch the file quietly once the page has settled, so the first note starts instantly after the tap
  addEventListener('load', () => setTimeout(() => { audio.preload = 'auto'; audio.load(); }, 1200));

  return { start, stop, audio, get playing() { return playing; } };
})();

const soundBtn = $('#sound');
const soundLabel = $('#soundLabel');
function syncUI() {
  soundBtn.setAttribute('aria-pressed', String(piano.playing));
  soundLabel.textContent = piano.playing ? 'Soft piano' : 'Music off';
}
soundBtn.addEventListener('click', async () => {
  if (piano.playing) piano.stop(); else await piano.start();
  syncUI();
});

/* ─────────────  GATE + REVEALS  ───────────── */
const gate = $('#gate');
function observeReveals() {
  const els = $$('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  // Curtains, valances etc. start translated off-screen, so they can never "intersect" on their own:
  // watch their .stage wrapper instead and reveal the whole group when it comes into view.
  const groups = new Map();
  els.forEach(e => {
    const host = e.closest('.stage') || e;
    if (!groups.has(host)) groups.set(host, []);
    groups.get(host).push(e);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      groups.get(en.target).forEach(e => e.classList.add('in'));
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  groups.forEach((_, host) => io.observe(host));
}

// Envelope sequence: seal pops → flap lifts → card rises → camera zooms into the card → hero unfolds
$('#open').addEventListener('click', () => {
  if (gate.classList.contains('open')) return;
  gate.classList.add('open');
  piano.start().then(syncUI);
  const k = reduceMotion ? 0 : 1;
  setTimeout(() => gate.classList.add('zoom'), 3700 * k);
  setTimeout(() => {
    document.body.classList.remove('locked');
    document.body.classList.add('opened');
    window.scrollTo(0, 0);
    observeReveals();
  }, 4000 * k);
  setTimeout(() => gate.classList.add('gone'), 5700 * k);
  if (!reduceMotion) setTimeout(() => lite.watch(), 6400);
});

/* ─────────────  CALENDAR PAGE (built from CONFIG.date)  ───────────── */
(() => {
  const grid = $('#calGrid');
  const { y, m, d } = CONFIG.date;
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const heart = '<svg class="heart" viewBox="0 0 32 30" aria-hidden="true"><path pathLength="1" d="M16 28C5 19 2 12.5 2 9a7 7 0 0 1 14-1.5A7 7 0 0 1 30 9c0 3.500-3 10-14 19z"/></svg>';
  let html = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => `<div class="wk">${w}</div>`).join('');
  html += '<div class="d"></div>'.repeat(first);
  for (let i = 1; i <= days; i++) html += i === d ? `<div class="d wed">${i}${heart}</div>` : `<div class="d">${i}</div>`;
  grid.innerHTML = html;
})();

/* ─────────────  COUNTDOWN  ───────────── */
(() => {
  const target = new Date(CONFIG.countdownTo).getTime();
  const els = {
    days: $('#d-days'), hours: $('#d-hours'), minutes: $('#d-minutes'), seconds: $('#d-seconds'),
  };
  const rings = {};
  $$('.dial').forEach(d => { rings[d.dataset.unit] = $('.prog', d); });
  const prev = {};
  const pad = n => String(n).padStart(2, '0');

  function setRing(unit, frac) {
    rings[unit].style.strokeDashoffset = String(100 - Math.max(0, Math.min(1, frac)) * 100);
  }
  function setNum(unit, text) {
    if (prev[unit] === text) return;
    prev[unit] = text;
    const el = els[unit];
    el.textContent = text;
    if (!reduceMotion && el.animate) {
      el.animate([{ transform: 'translateY(-7px)', opacity: 0.15 }, { transform: 'none', opacity: 1 }],
        { duration: 420, easing: 'cubic-bezier(.22,.8,.24,1)' });
    }
  }

  function tick() {
    let diff = target - Date.now();
    if (diff <= 0) {
      ['days', 'hours', 'minutes', 'seconds'].forEach(u => { setNum(u, '00'); setRing(u, 0); });
      $('#cdEyebrow').textContent = 'With full hearts';
      $('#cdTitle').textContent = 'The day has arrived';
      $('#cdNote').innerHTML = 'Thank you for celebrating with us.<br><span>27 November 2026 · Dhaka</span>';
      return false;
    }
    const s = Math.floor(diff / 1000);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    setNum('days', pad(days)); setNum('hours', pad(hours)); setNum('minutes', pad(minutes)); setNum('seconds', pad(seconds));
    setRing('days', days / CONFIG.ringDays);
    setRing('hours', hours / 24);
    setRing('minutes', minutes / 60);
    setRing('seconds', seconds / 60);
    $('#dials').setAttribute('aria-label', `${days} days, ${hours} hours and ${minutes} minutes until the wedding`);
    return true;
  }
  if (tick()) {
    const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
  }
})();

/* ─────────────  ADD TO CALENDAR (.ics)  ───────────── */
$('#calBtn').addEventListener('click', () => {
  const start = new Date(CONFIG.eventStart);
  const end = new Date(start.getTime() + CONFIG.eventHours * 3600 * 1000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = s => s.replace(/([,;])/g, '\\$1');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Shuvo and Mumu//Reception//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:reception-${fmt(start)}@shuvo-mumu`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(CONFIG.eventTitle)}`,
    `LOCATION:${esc(CONFIG.venue)}`,
    'DESCRIPTION:Program begins 6:00 PM\\, reception 7:00 PM. Come\\, enjoy\\, eat and bless us as we begin our forever together!',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'Shuvo-and-Mumu-Reception.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});

/* ─────────────  FLOATING PETALS + GOLD DUST  ───────────── */
(() => {
  if (reduceMotion) return;
  const c = $('#dust');
  const g = c.getContext('2d');
  let w, h, dpr, items = [], raf, t0 = performance.now();
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const PETAL_COLORS = ['236,150,170', '244,184,196', '244,184,196', '222,120,145', '214,176,96', '255,246,238'];

  function spawn(initial) {
    if (Math.random() < 0.36) {
      return {
        k: 'petal', x: rand(0, w), y: initial ? rand(-60, h) : rand(-50, -10),
        s: rand(6, 12), vy: rand(0.22, 0.5), sw: rand(18, 46), sf: rand(0.25, 0.6),
        ph: rand(0, 6.28), r: rand(0, 6.28), vr: rand(-0.012, 0.012), col: pick(PETAL_COLORS), a: rand(0.32, 0.66),
      };
    }
    return {
      k: 'mote', x: rand(0, w), y: initial ? rand(0, h) : h + 10,
      r: rand(0.7, 2), vy: -rand(0.1, 0.34), sw: rand(6, 16), sf: rand(0.2, 0.5), ph: rand(0, 6.28), a: rand(0.35, 0.85),
    };
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(52, Math.max(24, (w * h) / 26000)));
    items = Array.from({ length: n }, () => spawn(true));
  }
  function petal(p, t) {
    const flutter = 0.35 + 0.65 * Math.abs(Math.cos(t * 0.9 + p.ph));
    g.save();
    g.translate(p.x, p.y); g.rotate(p.r); g.scale(flutter, 1);
    g.beginPath();
    g.moveTo(0, -p.s);
    g.bezierCurveTo(p.s * 0.95, -p.s * 0.45, p.s * 0.7, p.s * 0.75, 0, p.s);
    g.bezierCurveTo(-p.s * 0.7, p.s * 0.75, -p.s * 0.95, -p.s * 0.45, 0, -p.s);
    g.fillStyle = `rgba(${p.col},${p.a})`;
    g.fill();
    g.restore();
  }
  function mote(p, t) {
    const a = p.a * (0.55 + 0.45 * Math.sin(t * 1.6 + p.ph));
    g.beginPath(); g.arc(p.x, p.y, p.r * 3.6, 0, 6.283);
    g.fillStyle = `rgba(222,178,86,${a * 0.18})`; g.fill();
    g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283);
    g.fillStyle = `rgba(226,176,70,${a})`; g.fill();
  }
  let skip = 0;
  function frame(now) {
    if (lite.on) {                                   // lite: fewer petals, drawn at half rate
      if (items.length > 14) items.length = 14;
      if (++skip % 2) { raf = requestAnimationFrame(frame); return; }
    }
    const t = (now - t0) / 1000;
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      p.y += p.vy;
      p.x += Math.sin(t * p.sf + p.ph) * 0.35 * (p.sw / 30);
      if (p.k === 'petal') { p.r += p.vr; petal(p, t); } else mote(p, t);
      if (p.y > h + 30 || p.y < -30) items[i] = spawn(false);
    }
    raf = requestAnimationFrame(frame);
  }
  resize();
  addEventListener('resize', () => { resize(); });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  });
  raf = requestAnimationFrame(frame);
})();

/* ─────────────  SPARKLES over the photos (chandelier crystals, fairy lights, gold filigree)  ───────────── */
(() => {
  $$('.sparkles').forEach(box => {
    const zones = box.dataset.zones.split(';').map(z => z.split(',').map(Number));
    let s = +box.dataset.seed || 1;
    const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const n = +box.dataset.count || 20;
    for (let i = 0; i < n; i++) {
      const z = zones[i % zones.length];
      const dot = document.createElement('i');
      dot.style.left = ((z[0] + rnd() * (z[2] - z[0])) * 100).toFixed(2) + '%';
      dot.style.top = ((z[1] + rnd() * (z[3] - z[1])) * 100).toFixed(2) + '%';
      dot.style.setProperty('--z', (2 + rnd() * 3).toFixed(1) + 'px');
      dot.style.setProperty('--s', (2.4 + rnd() * 3).toFixed(1) + 's');
      dot.style.setProperty('--d', (-rnd() * 5).toFixed(1) + 's');
      box.appendChild(dot);
    }
  });
})();

/* ─────────────  SCENES ONLY ANIMATE WHILE VISIBLE  ─────────────
   Adds .live to a backdrop / arch while it is on screen so its CSS animations (sway, glow, sparkle,
   drift, shimmer) pause the rest of the time — big saving on phones and laptops. */
(() => {
  const scenes = $$('.backdrop, .archpanel');
  if (!('IntersectionObserver' in window)) { scenes.forEach(s => s.classList.add('live')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.isIntersecting)), { rootMargin: '120px 0px' });
  scenes.forEach(s => io.observe(s));
})();

/* ─────────────  SCROLL + CURSOR PARALLAX for the photo backdrops  ─────────────
   Light on purpose: geometry is measured once (not every frame), the transform is written straight to
   the one moving layer (no CSS-variable inheritance, so no section-wide style recalculation), one rAF
   per frame, only for sections on screen. Skipped entirely for "reduce motion". */
(() => {
  if (reduceMotion) return;
  const items = $$('.hero, .events').map(sec => ({ bd: $('.bd-par', sec), sec, top: 0, h: 0 }));
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let vh = innerHeight, raf = 0, dirty = true;
  let tx = 0, ty = 0, mx = 0, my = 0;

  function measure() {
    vh = innerHeight;
    const y = scrollY;
    items.forEach(it => { const r = it.sec.getBoundingClientRect(); it.top = r.top + y; it.h = r.height; });
    dirty = true; kick();
  }
  function frame() {
    raf = 0;
    if (lite.on) { items.forEach(it => { it.bd.style.transform = ''; }); return; }   // lite: leave the photo still
    const y = scrollY;
    mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
    for (const it of items) {
      const top = it.top - y;
      if (top + it.h < -200 || top > vh + 200) continue;
      const p = Math.min(1, Math.max(0, (vh - top) / (it.h + vh)));
      it.bd.style.transform =
        `translate3d(${(-mx * 1.2).toFixed(2)}%, ${((p - 0.5) * 9 - my * 0.8).toFixed(2)}%, 0) scale(${(1.02 + p * 0.11).toFixed(4)})`;
    }
    if (dirty || Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002) { dirty = false; raf = requestAnimationFrame(frame); }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  addEventListener('scroll', () => { dirty = true; kick(); }, { passive: true });
  addEventListener('resize', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);   // fonts/images changing heights
  if (fine) addEventListener('pointermove', e => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; kick(); }, { passive: true });
  measure();
})();
