/* مَرْجِع — موسيقى خلفية هادئة
   - تبدأ بعد أول تفاعل للزائر، بمستوى 8% وتدرّج 3 ثوانٍ
   - تكرار متصل بتداخل ناعم بين نهاية المقطع وبدايته
   - تكمل من موضعها عند إعادة تحميل الصفحة أو التنقل داخلها
   - تنخفض وتتوقف مؤقتًا أثناء تشغيل الفيديو التعريفي أو أي وسائط داخل الموقع */
(() => {
  "use strict";
  const SRC = "assets/ambient.m4a";
  const VOL = 0.08, FADE_IN = 3, XFADE = 2.5, DUCK_T = 0.6;
  const K_MUTE = "marji_music_muted", K_POS = "marji_music_pos";
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  // لا يظهر الزر إلا إذا كان ملف الصوت موجودًا
  fetch(SRC, { method: "HEAD" }).then((r) => r.ok && init(), () => {});
  function init() {

  const get = (s, k) => { try { return s.getItem(k); } catch (e) { return null; } };
  const set = (s, k, v) => { try { s.setItem(k, v); } catch (e) {} };

  let muted = get(localStorage, K_MUTE) === "1";
  let ctx = null, master = null, buf = null, loading = null;
  let started = false, ducked = false, hidden = false, timer = 0;

  /* ---------- الزر ---------- */
  const css = document.createElement("style");
  css.textContent =
    ".marji-music{position:fixed;left:24px;bottom:77px;z-index:16;width:38px;height:38px;display:flex;align-items:center;justify-content:center;gap:2px;padding:0;border:1px solid #16bba9;border-radius:13px;background:#092d45;color:#62f1df;cursor:pointer;box-shadow:0 10px 22px #03253c36;transition:transform .25s,opacity .25s}" +
    ".marji-music:hover{transform:translateY(-3px)}.marji-music:focus-visible{outline:2px solid #0bc6b2;outline-offset:3px}" +
    ".marji-music i{display:block;width:3px;height:6px;border-radius:2px;background:currentColor;transform-origin:bottom;transition:height .3s}" +
    ".marji-music.is-on i{animation:marjiEq 1.1s ease-in-out infinite}.marji-music.is-on i:nth-child(2){animation-delay:-.4s}.marji-music.is-on i:nth-child(3){animation-delay:-.8s}.marji-music.is-on i:nth-child(4){animation-delay:-.2s}" +
    ".marji-music.is-off{color:#8fb3c4}.marji-music.is-off::after{content:'';position:absolute;width:24px;height:2px;border-radius:2px;background:#8fb3c4;transform:rotate(-45deg)}" +
    "@keyframes marjiEq{0%,100%{height:5px}50%{height:15px}}" +
    "@media (prefers-reduced-motion:reduce){.marji-music.is-on i{animation:none;height:11px}}" +
    "body.intro-open .marji-music{opacity:0;pointer-events:none}";
  document.head.append(css);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "marji-music";
  btn.innerHTML = "<i></i><i></i><i></i><i></i>";
  document.body.append(btn);
  function paint() {
    const on = started && !muted && !ducked;
    btn.classList.toggle("is-on", on);
    btn.classList.toggle("is-off", muted);
    const label = muted ? "تشغيل الموسيقى" : "كتم الموسيقى";
    btn.setAttribute("aria-label", label);
    btn.title = label;
    btn.setAttribute("aria-pressed", String(!muted));
  }
  paint();

  /* ---------- التحميل والتشغيل ---------- */
  function load() {
    if (loading) return loading;
    loading = fetch(SRC)
      .then((r) => r.arrayBuffer())
      .then((a) => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no)))
      .then((b) => (buf = b))
      .catch(() => (buf = null));
    return loading;
  }
  // يجدول نسخة من المقطع تبدأ عند when من الموضع off، وتتداخل مع التالية
  const segs = [];
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
    segs.push({ when, off });
    if (segs.length > 3) segs.shift();
    const next = when + len - XFADE;
    const wait = () => {
      if (ctx.state === "running" && next - ctx.currentTime < 4) schedule(next, 0);
      else timer = setTimeout(wait, Math.max(1000, (next - ctx.currentTime - 4) * 1000));
    };
    clearTimeout(timer);
    timer = setTimeout(wait, 1000);
  }
  function position() {
    if (!buf || !started) return 0;
    const now = ctx.currentTime;
    let seg = segs[0];
    segs.forEach((x) => { if (x.when <= now) seg = x; });
    return Math.max(0, Math.min(buf.duration, seg.off + now - seg.when));
  }
  function target() {
    return muted || ducked || hidden ? 0 : VOL;
  }
  function ramp(t) {
    if (!master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target(), now + t);
    if (target() > 0 && ctx.state === "suspended") ctx.resume();
    if (target() === 0) setTimeout(() => target() === 0 && ctx && ctx.state === "running" && ctx.suspend(), t * 1000 + 80);
  }
  async function start() {
    if (started || muted) return;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    await load();
    if (!buf || started || muted) return;
    started = true;
    let off = parseFloat(get(sessionStorage, K_POS)) || 0;
    if (!(off >= 0 && off < buf.duration - XFADE * 2)) off = 0;
    schedule(ctx.currentTime + 0.05, off);
    ramp(FADE_IN);
    paint();
  }

  /* ---------- أول تفاعل ---------- */
  const EVS = ["pointerdown", "keydown", "touchstart"];
  function first(e) {
    if (e.target === btn || (e.target.closest && e.target.closest(".marji-music"))) return;
    EVS.forEach((n) => removeEventListener(n, first, true));
    start();
  }
  EVS.forEach((n) => addEventListener(n, first, true));

  btn.addEventListener("click", () => {
    muted = !muted;
    set(localStorage, K_MUTE, muted ? "1" : "0");
    EVS.forEach((n) => removeEventListener(n, first, true));
    if (!muted && !started) start();
    else ramp(muted ? 0.5 : 1.2);
    paint();
  });

  /* ---------- خفض الصوت مع الفيديو والوسائط ---------- */
  const playing = new Set();
  function duck() {
    const intro = document.body.classList.contains("intro-open");
    const next = intro || playing.size > 0;
    if (next === ducked) return;
    ducked = next;
    ramp(ducked ? DUCK_T : 1.5);
    paint();
  }
  document.addEventListener("play", (e) => { if (e.target instanceof HTMLMediaElement) { playing.add(e.target); duck(); } }, true);
  ["pause", "ended", "emptied"].forEach((n) =>
    document.addEventListener(n, (e) => { if (playing.delete(e.target)) duck(); }, true),
  );
  new MutationObserver(duck).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // إيقاف مؤقت عند مغادرة التبويب، والعودة بهدوء
  document.addEventListener("visibilitychange", () => {
    hidden = document.hidden;
    if (started) ramp(hidden ? 0.3 : 1.5);
  });

  // حفظ الموضع للاستكمال بعد التنقل أو إعادة التحميل
  const save = () => started && set(sessionStorage, K_POS, position().toFixed(2));
  setInterval(save, 2000);
  addEventListener("pagehide", save);
  }
})();
