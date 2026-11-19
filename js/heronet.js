/* مَرْجِع — شبكة نقاط متصلة في خلفية الواجهة الأولى (نفس خلفية العرض التعريفي) */
(() => {
  "use strict";
  const cv = document.getElementById("heroNet");
  if (!cv || !cv.getContext) return;
  const hero = cv.parentElement;
  const g = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, LINK = 140, dots = [], raf = 0, last = 0, visible = false;
  const mp = { x: -999, y: -999 };

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth;
    H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = W * dpr;
    cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    LINK = W < 700 ? 105 : 140;
    const n = Math.round(Math.max(30, Math.min(110, (W * H) / 13000)));
    dots = Array.from({ length: n }, () => {
      const a = Math.random() * 6.283, sp = 6 + Math.random() * 12;
      return { x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, z: 0.35 + Math.random() * 0.65, p: Math.random() * 6.28 };
    });
  }

  function draw(dt) {
    g.clearRect(0, 0, W, H);
    for (const d of dots) {
      d.p += dt * 0.8;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.x < -20) d.x = W + 20; else if (d.x > W + 20) d.x = -20;
      if (d.y < -20) d.y = H + 20; else if (d.y > H + 20) d.y = -20;
    }
    // الخطوط بين النقاط القريبة
    g.lineWidth = 0.7;
    g.strokeStyle = "#5fd8e6";
    for (let i = 0; i < dots.length; i++)
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j], dx = a.x - b.x, dy = a.y - b.y, dd = dx * dx + dy * dy;
        if (dd > LINK * LINK) continue;
        g.globalAlpha = (1 - Math.sqrt(dd) / LINK) * 0.34;
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.stroke();
      }
    // خطوط تصل المؤشر بالنقاط القريبة منه
    const ML = LINK * 1.25;
    g.strokeStyle = "#62f1df";
    for (const d of dots) {
      const dx = d.x - mp.x, dy = d.y - mp.y, dd = dx * dx + dy * dy;
      if (dd > ML * ML) continue;
      g.globalAlpha = (1 - Math.sqrt(dd) / ML) * 0.45;
      g.beginPath();
      g.moveTo(d.x, d.y);
      g.lineTo(mp.x, mp.y);
      g.stroke();
    }
    // النقاط
    for (const d of dots) {
      g.globalAlpha = (0.45 + 0.35 * Math.sin(d.p)) * d.z + 0.12;
      g.fillStyle = d.z > 0.75 ? "#7ff5e6" : "#8fc8e8";
      g.beginPath();
      g.arc(d.x, d.y, 0.8 + d.z * 1.6, 0, 6.283);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  function frame(t) {
    raf = 0;
    if (!visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    draw(dt);
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };

  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible) { if (!dots.length) size(); kick(); }
  }).observe(cv);
  document.addEventListener("visibilitychange", kick);

  hero.addEventListener("pointermove", (e) => {
    const r = cv.getBoundingClientRect();
    mp.x = e.clientX - r.left;
    mp.y = e.clientY - r.top;
    if (reduce) { draw(0); }
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { mp.x = mp.y = -999; });
  hero.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") mp.x = mp.y = -999; });

  let rz = 0;
  addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => { if (cv.clientWidth !== W || Math.abs(cv.clientHeight - H) > 80) { size(); kick(); } }, 200);
  });
})();
