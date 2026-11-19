/* مَرْجِع — الشعار وكلمة «مَرْجِع» من نقاط (الواجهة الأولى وبداية العرض التعريفي)
   تتجمّع النقاط لتكوّن الشعار والكلمة، وتتفرّق بهدوء حول المؤشر ثم تعود لمكانها،
   مع ومضة ضوء تعبر الشعار كل بضع ثوانٍ. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MARK = "assets/mark.png", WORD = "assets/logo.webp";
  // حدود كلمة «مَرْجِع» داخل ملف الشعار الكامل (دون السطر الصغير تحتها)
  const WX = 7, WY = 9, WW = 409, WH = 165;
  document.querySelectorAll("#markDots, #introDots").forEach(setup);

  function setup(cv) {
  if (!cv.getContext) return;
  const g = cv.getContext("2d");
  // replay: تُعاد الحركة كلما ظهر العنصر من جديد (بداية العرض التعريفي)
  const replay = cv.hasAttribute("data-replay");

  let W = 0, H = 0, dpr = 1, pts = [], born = 0, raf = 0, visible = false, started = false;
  const ptr = { x: -9999, y: -9999, on: false };

  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth;
    H = cv.clientHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // تحويل الشعار والكلمة إلى نقاط بألوان الهوية
  function build(mark, word) {
    const step = W < 340 ? 2.7 : 3.4;
    const cw = Math.round(W / step), ch = Math.round(H / step);
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const x = c.getContext("2d");
    // تكوين عمودي: الشعار فوق والكلمة تحته
    const mh = ch * 0.44, mw = mh * (mark.width / mark.height);
    const ww = cw * 0.66, wh = ww * (WH / WW);
    const gap = ch * 0.05, top = (ch - (mh + gap + wh)) / 2;
    x.drawImage(mark, (cw - mw) / 2, top, mw, mh);
    x.drawImage(word, WX, WY, WW, WH, (cw - ww) / 2, top + mh + gap, ww, wh);
    const d = x.getImageData(0, 0, cw, ch).data;
    const out = [];
    for (let j = 0; j < ch; j++)
      for (let i = 0; i < cw; i++) {
        const o = (j * cw + i) * 4, a = d[o + 3];
        if (a < 110) continue;
        const r = d[o], gg = d[o + 1], b = d[o + 2];
        const lum = (0.3 * r + 0.59 * gg + 0.11 * b) / 255;
        // الأجزاء الكحلية تُضاء بالأزرق، والفيروزية تبقى فيروزية
        let col;
        if (lum < 0.28) col = [96, 182, 250];
        else if (gg > r + 40) col = lum > 0.55 ? [143, 249, 228] : [24, 214, 196];
        else col = [120, 200, 255];
        const hx = (i + 0.5) * step, hy = (j + 0.5) * step;
        const ang = Math.random() * Math.PI * 2, rad = Math.max(W, H) * (0.45 + Math.random() * 0.4);
        out.push({
          hx, hy,
          x: W / 2 + Math.cos(ang) * rad, y: H / 2 + Math.sin(ang) * rad,
          vx: 0, vy: 0,
          col, s: 1.15 + Math.random() * 0.8,
          ph: Math.random() * 6.28, dl: Math.random() * 0.9 + (Math.hypot(hx - W / 2, hy - H / 2) / W) * 0.6,
        });
      }
    // نقاط متناثرة حول الشعار
    for (let q = 0, nq = Math.round(W / 10); q < nq; q++) {
      const ang = Math.random() * 6.28, rad = Math.min(W, H) * (0.36 + Math.random() * 0.14);
      const hx = W / 2 + Math.cos(ang) * rad, hy = H / 2 + Math.sin(ang) * rad;
      out.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, col: [200, 245, 255], s: 0.8 + Math.random(), ph: Math.random() * 6.28, dl: 0.4, free: true });
    }
    return out;
  }

  function frame(t) {
    raf = 0;
    if (!visible || document.hidden) return;
    const el = (t - born) / 1000;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";
    // ومضة ضوء قطرية تعبر الشعار كل 7 ثوانٍ
    const sweep = ((el % 7) / 1.6) * (W + H) - H;
    const R = Math.min(78, W * 0.2);
    for (const p of pts) {
      const a = reduce ? 1 : Math.min(1, Math.max(0, (el - p.dl) / 1.1));
      const e = 1 - Math.pow(1 - a, 3);
      let tx = p.hx, ty = p.hy;
      if (p.free) {
        tx += Math.cos(el * 0.3 + p.ph) * 6;
        ty += Math.sin(el * 0.25 + p.ph) * 6;
      } else if (!reduce) {
        tx += Math.sin(el * 1.1 + p.ph) * 0.5;
        ty += Math.cos(el * 0.9 + p.ph) * 0.5;
      }
      if (e < 1) {
        p.x += (tx - p.x) * (0.05 + e * 0.12);
        p.y += (ty - p.y) * (0.05 + e * 0.12);
      } else {
        let fx = (tx - p.x) * 0.06, fy = (ty - p.y) * 0.06;
        if (ptr.on) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, dd = dx * dx + dy * dy;
          if (dd < R * R && dd > 0.01) {
            const dist = Math.sqrt(dd), f = (1 - dist / R) * 2.4;
            fx += (dx / dist) * f;
            fy += (dy / dist) * f;
          }
        }
        p.vx = (p.vx + fx) * 0.82;
        p.vy = (p.vy + fy) * 0.82;
        p.x += p.vx;
        p.y += p.vy;
      }
      const sw = reduce ? 0 : Math.max(0, 1 - Math.abs(p.x + p.y * 0.6 - sweep) / 46);
      const tw = 0.62 + 0.38 * Math.sin(el * 2 + p.ph);
      const al = (p.free ? 0.35 : 0.55 + 0.45 * tw) * (0.25 + 0.75 * e);
      const [r, gg, b] = p.col;
      g.fillStyle = `rgba(${r},${gg},${b},${Math.min(1, al + sw * 0.6)})`;
      const s = p.s * (1 + sw * 0.8);
      g.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    g.globalCompositeOperation = "source-over";
    if (!reduce || el < 3) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };

  function start() {
    if (started) return;
    started = true;
    size();
    const load = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
    Promise.all([load(MARK), load(WORD)]).then(([m, w]) => {
      pts = build(m, w);
      born = performance.now();
      kick();
    }, () => {});
  }

  function scatter() {
    for (const p of pts) {
      if (p.free) continue;
      const ang = Math.random() * 6.28, rad = Math.max(W, H) * (0.45 + Math.random() * 0.4);
      p.x = W / 2 + Math.cos(ang) * rad;
      p.y = H / 2 + Math.sin(ang) * rad;
      p.vx = p.vy = 0;
    }
    born = performance.now();
  }
  new IntersectionObserver((es) => {
    const was = visible;
    visible = es[0].isIntersecting;
    if (visible && !was && replay && pts.length && !reduce) scatter();
    if (visible) { start(); kick(); }
  }, { threshold: 0.05 }).observe(cv);
  document.addEventListener("visibilitychange", kick);

  const move = (cx, cy) => {
    const r = cv.getBoundingClientRect();
    ptr.x = ((cx - r.left) * W) / (r.width || 1);
    ptr.y = ((cy - r.top) * H) / (r.height || 1);
    ptr.on = true;
  };
  cv.parentElement.addEventListener("pointermove", (e) => move(e.clientX, e.clientY), { passive: true });
  cv.parentElement.addEventListener("pointerleave", () => (ptr.on = false));
  cv.parentElement.addEventListener("touchend", () => (ptr.on = false), { passive: true });

  let rz = 0;
  addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (!started || !pts.length || !cv.clientWidth) return;
      const ow = W, oh = H;
      size();
      const sx = W / ow, sy = H / oh;
      pts.forEach((p) => { p.hx *= sx; p.hy *= sy; p.x *= sx; p.y *= sy; });
      kick();
    }, 150);
  });
  }
})();
