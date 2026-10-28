/* Envelope artwork: embossed baroque scrollwork, drawn as lines so highlight/shadow copies can emboss it.
   Seeded, so it looks identical on every load. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, parent) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const rng = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

/* ── embossed baroque scrollwork for the envelope (300×360 space) ── */
  function emboss(g) {
    const rand = rng(2026);
    const S = { fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    const path = (d, w) => el('path', { d, 'stroke-width': w, ...S }, g);
    const f1 = n => n.toFixed(1);

    function leaf(x, y, len, ang) {
      const w = len * .3, c = Math.cos(ang), s = Math.sin(ang);
      const P = (px, py) => `${f1(x + px * c - py * s)} ${f1(y + px * s + py * c)}`;
      path(`M${P(0, 0)}Q${P(len * .5, -w * 1.7)} ${P(len, 0)}Q${P(len * .5, w * 1.7)} ${P(0, 0)}Z`, 1.15);
      path(`M${P(len * .14, 0)}L${P(len * .78, 0)}`, .8);
    }

    function flower(cx, cy, r, petals = 8) {
      for (let k = 0; k < petals; k++) leaf(cx + Math.cos(k * 2 * Math.PI / petals) * r * .18, cy + Math.sin(k * 2 * Math.PI / petals) * r * .18, r, k * 2 * Math.PI / petals);
      el('circle', { cx, cy, r: r * .2, 'stroke-width': 1.2, ...S }, g);
      el('circle', { cx, cy, r: r * .07, fill: 'currentColor', stroke: 'none' }, g);
    }

    function scroll(cx, cy, R, rot, dir, w = 2) {
      const turns = 1.3 + rand() * .25;
      const pt = t => {
        const a = rot + dir * t * turns * Math.PI * 2 * (t < 0 ? .45 : 1);
        const r = t < 0 ? R * (1 - t * 1.25) : R * Math.pow(1 - t, 1.12);
        return [cx + r * Math.cos(a), cy + r * Math.sin(a), a];
      };
      let d = '';
      for (let i = 0; i <= 80; i++) {
        const t = -.5 + 1.5 * i / 80, [x, y] = pt(t);
        d += (i ? 'L' : 'M') + f1(x) + ' ' + f1(y);
      }
      path(d, w);
      [-.34, -.12, .1, .3, .5].forEach((t, i) => {
        const [x, y, a] = pt(t);
        leaf(x, y, R * (.46 - Math.max(t, 0) * .2), a + dir * .55);
        if (i % 2) leaf(x, y, R * .26, a + dir * .55 + Math.PI * (dir > 0 ? -.62 : .62));
      });
      el('circle', { cx, cy, r: R * .075, 'stroke-width': 1.2, ...S }, g);
      el('circle', { cx, cy, r: R * .03, fill: 'currentColor', stroke: 'none' }, g);
    }
    const pair = (x, y, R, rot, dir, w) => { scroll(x, y, R, rot, dir, w); scroll(300 - x, y, R, Math.PI - rot, -dir, w); };

    // flap
    pair(72, 58, 50, 3.3, 1);
    pair(30, 128, 28, 1.6, -1);
    pair(108, 104, 22, 4.6, 1, 1.6);
    flower(150, 44, 24);
    flower(150, 112, 15, 6);
    // pocket
    pair(60, 300, 52, 5.5, -1);
    pair(26, 236, 26, 1.1, 1);
    pair(104, 336, 24, 4.1, -1, 1.6);
    pair(78, 246, 20, 2.6, -1, 1.6);
    flower(150, 318, 18);
    flower(150, 252, 11, 6);
    for (let i = 0; i < 40; i++) el('circle', { cx: f1(rand() * 300), cy: f1(rand() * 360), r: (.7 + rand() * .7).toFixed(1), fill: 'currentColor', stroke: 'none' }, g);
  }

  const embG = document.querySelector('[data-emboss]');
  if (embG) emboss(embG);

})();
