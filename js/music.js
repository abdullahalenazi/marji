/*
 * مَرْجِع — موسيقى العرض التعريفي التفاعلية (مولّدة بالكود، بلا ملفات صوت)
 * - لكل مشهد تآلف مختلف ينتقل إليه الصوت بنعومة.
 * - حركة المؤشر أو الإصبع تفتح نبرة الصوت وتعزف نغمات خفيفة.
 * - المرور على بطاقات حلقة الأقسام يعزف نغمة لكل بطاقة، واختيار بطاقة يعزف نغمتين.
 * engine(ctx) يقبل أي AudioContext (ومنه OfflineAudioContext للاختبار).
 */
window.MARJI_MUSIC = (() => {
  "use strict";
  const N = { D3: 146.83, E3: 164.81, G2: 98.0, A2: 110.0, B2: 123.47, D4: 293.66, E4: 329.63, Fs3: 185.0, Fs4: 369.99, A3: 220.0, A4: 440.0, B3: 246.94, B4: 493.88, Cs4: 277.18, D5: 587.33, G3: 196.0 };
  // تآلف كل مشهد: [أساس، وسط، علوي]
  const CHORDS = [
    [N.D3, N.A3, N.E4], // ١ الأنظمة متاحة: هادئ ومفتوح
    [N.B2, N.Fs3, N.D4], // ٢ الفجوة: أغمق قليلًا
    [N.G2, N.D3, N.B3], // ٣ مَرْجِع يبسّط: دافئ
    [N.A2, N.E3, N.Cs4], // ٤ اختر قسمك: منتظر
    [N.D3, N.A3, N.Fs4], // ٥ الختام: استقرار
  ];
  const SCALE = [N.D4, N.E4, N.Fs4, N.A4, N.B4, N.D5]; // خماسي: أي نغمتين منه متوافقتان

  function engine(ctx) {
    const t0 = () => ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);

    // صدى خفيف يعطي اتساعًا
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const wet = ctx.createBiquadFilter();
    wet.type = "lowpass";
    wet.frequency.value = 1800;
    delay.connect(wet).connect(fb).connect(delay);
    wet.connect(master);

    // الوسادة: ثلاثة أصوات ناعمة عبر مرشّح تفتحه حركة المؤشر
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 700;
    padFilter.Q.value = 0.4;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.5;
    padFilter.connect(padGain).connect(master);
    const voices = CHORDS[0].map((f, i) => {
      const o = ctx.createOscillator(),
        o2 = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = "sine";
      o2.type = "triangle";
      o.frequency.value = f;
      o2.frequency.value = f;
      o2.detune.value = 5 + i * 2; // ازدواج خفيف يعطي دفئًا بلا طنين
      const g2 = ctx.createGain();
      g2.gain.value = 0.18;
      g.gain.value = [0.3, 0.22, 0.16][i];
      o.connect(g);
      o2.connect(g2).connect(g);
      g.connect(padFilter);
      o.start();
      o2.start();
      return { o, o2 };
    });

    function note(freq, vol = 0.1, when = 0) {
      const t = t0() + when;
      const o = ctx.createOscillator(),
        h = ctx.createOscillator(),
        hg = ctx.createGain(),
        g = ctx.createGain();
      o.type = "sine";
      h.type = "sine";
      o.frequency.value = freq;
      h.frequency.value = freq * 2;
      hg.gain.value = 0.2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      o.connect(g);
      h.connect(hg).connect(g);
      g.connect(master);
      g.connect(delay);
      o.start(t);
      h.start(t);
      o.stop(t + 1.4);
      h.stop(t + 1.4);
    }

    let level = 0.5,
      lastMove = 0;
    return {
      setLevel(v, time = 0.8) {
        level = v;
        master.gain.setTargetAtTime(v, t0(), time / 3);
      },
      duck(on) {
        master.gain.setTargetAtTime(on ? level * 0.3 : level, t0(), 0.25);
      },
      scene(i) {
        const ch = CHORDS[Math.max(0, Math.min(CHORDS.length - 1, i))];
        voices.forEach((v, k) => {
          v.o.frequency.setTargetAtTime(ch[k], t0(), 0.35);
          v.o2.frequency.setTargetAtTime(ch[k], t0(), 0.35);
        });
        note(ch[2] * 2, 0.07, 0.15); // نغمة ترحيب بالمشهد
      },
      // x,y من 0 إلى 1، speed بالبكسل/ثانية
      pointer(x, y, speed) {
        padFilter.frequency.setTargetAtTime(520 + x * 1700, t0(), 0.18);
        padGain.gain.setTargetAtTime(0.38 + (1 - y) * 0.24, t0(), 0.25);
        const now = t0();
        if (speed > 420 && now - lastMove > 0.42) {
          lastMove = now;
          note(SCALE[Math.min(SCALE.length - 1, Math.floor(x * SCALE.length))], 0.055);
        }
      },
      card(i) {
        note(SCALE[i % SCALE.length], 0.09);
      },
      choose(i) {
        note(SCALE[i % SCALE.length], 0.1);
        note(SCALE[(i + 2) % SCALE.length] * (i + 2 >= SCALE.length ? 2 : 1), 0.09, 0.14);
      },
    };
  }
  return { engine };
})();
