/* مَرْجِع — موسيقى هادئة مع العرض التعريفي فقط
   - تعمل أثناء تشغيل «مَرْجِع في ٤٥ ثانية» وتتوقف عند الإيقاف المؤقت أو الإغلاق
   - مستوى 8% وتدرّج 3 ثوانٍ عند البدء، وتكرار متصل بتداخل ناعم
   - زر كتم صغير بجوار «تخطَّ إلى الموقع» داخل العرض */
(() => {
  "use strict";
  const SRC = "assets/ambient.m4a";
  const VOL = 0.08, FADE_IN = 3, FADE_OUT = 1, XFADE = 2.5;
  const K_MUTE = "marji_music_muted";
  const AC = window.AudioContext || window.webkitAudioContext;
  const intro = document.getElementById("marjiIntro");
  const controls = document.getElementById("introControls");
  const pauseBtn = document.getElementById("introPause");
  const actions = intro && intro.querySelector(".intro-topactions");
  if (!AC || !intro || !controls || !pauseBtn || !actions) return;

  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  let muted = get(K_MUTE) === "1";
  let ctx = null, master = null, buf = null, raw = null, timer = 0, on = false, started = false;
  const segs = [];

  // زر الكتم بنفس شكل أزرار العرض الحالية
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "intro-chip";
  btn.hidden = true;
  actions.prepend(btn);
  function paint() {
    btn.textContent = muted ? "♪ تشغيل الموسيقى" : "♪ كتم الموسيقى";
    btn.setAttribute("aria-pressed", String(!muted));
  }
  paint();

  // تحميل مسبق للملف (دون تشغيل) عند فتح العرض
  function fetchRaw() {
    if (!raw) raw = fetch(SRC).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())).catch(() => null);
    return raw;
  }
  function ensureCtx() {
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
  }
  async function decode() {
    if (buf) return buf;
    const a = await fetchRaw();
    if (!a) return null;
    try { buf = await new Promise((ok, no) => ctx.decodeAudioData(a.slice(0), ok, no)); } catch (e) { buf = null; }
    return buf;
  }

  function schedule(when, off) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf;
    src.connect(g).connect(master);
    const len = buf.duration - off;
    g.gain.setValueAtTime(off > 0 ? 1 : 0, when);
    if (!off) g.gain.linearRampToValueAtTime(1, when + XFADE);
    g.gain.setValueAtTime(1, when + len - XFADE);
    g.gain.linearRampToValueAtTime(0, when + len);
    src.start(when, off);
    src.stop(when + len + 0.05);
    segs.push(src);
    if (segs.length > 3) segs.shift();
    const next = when + len - XFADE;
    const wait = () => {
      if (!started) return;
      if (ctx.state === "running" && next - ctx.currentTime < 4) schedule(next, 0);
      else timer = setTimeout(wait, Math.max(1000, (next - ctx.currentTime - 4) * 1000));
    };
    clearTimeout(timer);
    timer = setTimeout(wait, 1000);
  }
  function stopAll() {
    started = false;
    clearTimeout(timer);
    segs.splice(0).forEach((s) => { try { s.stop(); } catch (e) {} });
  }
  function ramp(to, t) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(to, now + t);
  }

  // الحالة: تعمل فقط والعرض مفتوح ومشاهده تُشغَّل
  let pend = 0;
  async function sync() {
    const open = document.body.classList.contains("intro-open");
    btn.hidden = !open;
    if (open) fetchRaw();
    const want = open && !controls.hidden && pauseBtn.getAttribute("aria-label") === "إيقاف مؤقت" && !muted;
    if (want === on) {
      if (!open && !on && started) setTimeout(() => !on && stopAll(), FADE_OUT * 1000 + 100);
      return;
    }
    on = want;
    const my = ++pend;
    if (!ctx) { if (!on) return; ensureCtx(); }
    if (on) {
      if (ctx.state === "suspended") ctx.resume();
      if (!(await decode()) || my !== pend || !on) return;
      if (!started) { started = true; schedule(ctx.currentTime + 0.05, 0); }
      ramp(VOL, FADE_IN);
    } else {
      ramp(0, FADE_OUT);
      setTimeout(() => {
        if (my !== pend || on) return;
        if (!document.body.classList.contains("intro-open")) stopAll(); // يبدأ من أوله في المرة القادمة
        if (ctx.state === "running") ctx.suspend();
      }, FADE_OUT * 1000 + 80);
    }
  }

  // إنشاء سياق الصوت داخل تفاعل الزائر (شرط المتصفحات للتشغيل)
  ["pointerdown", "keydown", "touchstart"].forEach((n) =>
    addEventListener(n, () => {
      if (!document.body.classList.contains("intro-open") || muted) return;
      ensureCtx();
      if (ctx.state === "suspended") ctx.resume();
    }, true),
  );
  btn.addEventListener("click", () => {
    muted = !muted;
    set(K_MUTE, muted ? "1" : "0");
    paint();
    if (!muted) ensureCtx();
    sync();
  });

  const mo = new MutationObserver(sync);
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  mo.observe(controls, { attributes: true, attributeFilter: ["hidden"] });
  mo.observe(pauseBtn, { attributes: true, attributeFilter: ["aria-label"] });
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !on) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
  sync();
})();
