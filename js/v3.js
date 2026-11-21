/* مَرْجِع — إضافات تحديث 17 نوفمبر: الحالة الموثقة، المراجعات السريعة قبل النشر، وقياس أثر التعلّم (قبلي/بعدي) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const AR = (n) => String(n).replace(/\d/g, (d) => "0123456789"[d]);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const store = {
    get(k, f) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? f : JSON.parse(v);
      } catch (e) {
        return f;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
  };

  /* ---------- 1) الحالة الموثقة: تُقرأ داخل الموقع فقط ---------- */
  const caseDlg = $("#caseDialog");
  $$("[data-open-case]").forEach((b) => b.addEventListener("click", () => caseDlg && caseDlg.showModal()));
  $$("[data-case-to-check]").forEach((b) =>
    b.addEventListener("click", () => {
      if (caseDlg) caseDlg.close();
      showCheck(0);
      const t = $("#quickChecks");
      if (t) t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    })
  );

  /* ---------- 2) ست مراجعات سريعة قبل النشر ---------- */
  const CHECKS = [
    {
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
      group: "حقوق الصور والملكية الفكرية",
      heading: "هل تملك حق نشر الصورة؟",
      risk: "استخدام صورة من موقع آخر أو تعديلها دون التأكد من حق إعادة استخدامها.",
      action: "تحقق من مالك الحقوق ونوع الترخيص ونطاقه، واحصل على إذن عند الحاجة أو استخدم صورة مرخصة بصورة صحيحة.",
      check: "هل عندي ترخيص أو إذن أو أساس نظامي واضح للاستخدام؟ وهل ألتزم بشروطه؟",
      source: "مرجع الاختصاص: الهيئة السعودية للملكية الفكرية، وأحكام حقوق المؤلف المطبقة على الحالة.",
    },
    {
      icon: '<path d="M3 21h18"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="m12 3 9 5H3z"/>',
      group: "النقل الدقيق",
      heading: "هل القرار صدر بالفعل؟",
      risk: "التعامل مع مسودة أو صورة شاشة أو خبر متداول بوصفه قرارًا رسميًا نافذًا.",
      action: "ارجع إلى الإعلان الصادر من الجهة المختصة، وراجع نصّه وتاريخه ونطاق تطبيقه قبل صياغة العنوان والخبر.",
      check: "هل أستطيع إسناد كل معلومة مهمة إلى بيان رسمي صحيح ومحدّث؟",
      source: "إرشاد تحريري عام؛ ويُرجع إلى المصادر الرسمية للقرارات وأحكام النشر ذات الصلة.",
    },
    {
      icon: '<path d="M3 11v3a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/>',
      group: "الإعلانات والمحتوى التجاري",
      heading: "هل يعرف المتلقي أن هذا إعلان؟",
      risk: "تقديم محتوى ترويجي أو علاقة تجارية بصورة توحي بأنه محتوى تحريري مستقل.",
      action: "بيّن طبيعة المحتوى التجاري بوضوح، وراجع المتطلبات الترخيصية والإعلانية الخاصة بالنشاط والقناة.",
      check: "هل طبيعة الإعلان واضحة؟ وهل تمت مراجعة المتطلبات المعمول بها؟",
      source: "مرجع الاختصاص: الهيئة العامة لتنظيم الإعلام وغيرها من الجهات المختصة حسب نوع الإعلان.",
    },
    {
      icon: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 14 2 2 4-4"/>',
      group: "التراخيص والممارسة",
      heading: "هل نشاطك الجديد يتطلب ترخيصًا؟",
      risk: "بدء نشاط إعلامي خاضع لتنظيم معين دون التأكد من متطلبات الممارسة والترخيص اللازمة.",
      action: "حدد وصف النشاط أولًا، ثم تحقق من شروطه وموافقاته في اللوائح والخدمات الرسمية قبل إطلاقه.",
      check: "هل حددت النشاط بدقة وراجعت متطلبات الترخيص والتسجيل ذات الصلة؟",
      source: "مرجع الاختصاص: نظام الإعلام المرئي والمسموع ولائحته التنفيذية وغيرها من الأنظمة بحسب النشاط.",
    },
    {
      icon: '<path d="M4 5h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v10a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5M8 17h3"/>',
      group: "الأمانة وحقوق المحتوى",
      heading: "هل نقلت المحتوى مع احترام حقوق صاحبه؟",
      risk: "إعادة نشر مقال أو تحقيق أو مادة أصلية ونسبها إلى محرر آخر أو تجاهل حقوق صاحب المحتوى.",
      action: "ميّز بين الحقائق المجردة والتعبير الإبداعي المحمي، وراجع الإذن والاستخدامات المسموحة، وانسب المساهمة لمصدرها بدقة.",
      check: "هل هذا مجرد معلومة عامة أم مادة محمية؟ وهل استخدامي لها مصرح أو مستثنى نظامًا؟",
      source: "مرجع الاختصاص: أحكام حقوق المؤلف والمبادئ المهنية للأمانة الصحفية.",
    },
    {
      icon: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>',
      group: "التصحيح والمسؤولية المهنية",
      heading: "اكتشفت خطأ بعد النشر: ماذا تفعل؟",
      risk: "ترك خبر يحتوي خطأ مؤثرًا دون تصحيح واضح، أو إجراء تعديل يطمس طبيعة الخطأ.",
      action: "تحقق من الوقائع، وصحح الخطأ دون تأخير، ووضح التصحيح للجمهور بالطريقة المناسبة لطبيعة النشر.",
      check: "هل أصلحت المعلومة وقدمت تصحيحًا واضحًا يتناسب مع أثر الخطأ؟",
      source: "مبدأ مهني يرتبط بالدقة وتصحيح الأخطاء، وليس كل إخلال به مخالفة نظامية تلقائيًا.",
    },
  ];
  const qcTabs = $$("[data-qc]");
  function showCheck(i) {
    const d = CHECKS[i];
    if (!d || !$("#qcHeading")) return;
    qcTabs.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.qc) === i)));
    $("#qcIcon").innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d.icon + "</svg>";
    $("#qcGroup").textContent = d.group;
    $("#qcHeading").textContent = d.heading;
    $("#qcRisk").textContent = d.risk;
    $("#qcAction").textContent = d.action;
    $("#qcCheck").textContent = d.check;
    $("#qcSource").textContent = d.source;
    $("#qcCount").textContent = AR(i + 1) + " / " + AR(CHECKS.length);
  }
  qcTabs.forEach((b) => b.addEventListener("click", () => showCheck(Number(b.dataset.qc))));
  showCheck(0);

  /* ---------- 3) قياس أثر التعلّم: 5 مواقف قبل الشرح، ثم 5 مواقف مختلفة بعده ---------- */
  const PRE = [
    { q: "وصلتك صورة لخبر من شخص تعرفه، ولا تعرف شروط إعادة نشرها. ماذا تفعل؟", a: ["أنشرها لأنه أرسلها لي", "أتحقق من إذن الاستخدام وشروطه قبل النشر", "أكتب «صورة متداولة» وأكتفي"], c: 1 },
    { q: "انتشرت صورة شاشة تقول إن قرارًا رسميًا صدر اليوم. ما الإجراء؟", a: ["أتحقق من أصل البيان وتاريخه لدى الجهة المختصة", "أعتمدها لأن حسابًا مشهورًا نشرها", "أعيد نشرها مع عبارة «أنباء»"], c: 0 },
    { q: "تريد إطلاق نشاط لإنتاج ونشر مادة مرئية ضمن مشروع جديد. ما البداية الصحيحة؟", a: ["أطلقه ثم أراجع المتطلبات إذا جاء اعتراض", "أكتفي بوصف الحساب بأنه شخصي", "أحدد نوع النشاط وأراجع المتطلبات الرسمية ذات الصلة"], c: 2 },
    { q: "وجدت فقرة مكتوبة بأسلوب مميز في تحقيق صحفي. ما الإجراء المهني؟", a: ["أنسخها وأغيّر اسم الكاتب", "أراجع حقوق الاستخدام وأضع النسبة والإذن عند الحاجة", "أنقلها بلا مصدر إذا اختصرتها"], c: 1 },
    { q: "تبين وجود معلومة جوهرية غير صحيحة في خبر منشور. ماذا تفعل؟", a: ["أتحقق وأصحح بوضوح بحسب طبيعة الخطأ", "أتركه لأن الناس قرأته بالفعل", "أزيله دون مراجعة أو توضيح دائمًا"], c: 0 },
  ];
  const POST = [
    { q: "وجدت صورة احترافية في نتائج البحث لتصميم تقرير مرئي. ماذا تختار؟", a: ["أستخدمها لأنها منشورة للعموم", "أستخدمها إذا وضعت اسم المصور فقط", "أتحقق من مالك الحقوق والترخيص أو الإذن قبل الاستخدام"], c: 2 },
    { q: "وصل إعلان قرار عبر رسالة في مجموعة عمل، ولا يوجد بيان على القناة الرسمية. ما الأنسب؟", a: ["أنشره بوصفه مؤكدًا", "أتحقق من مصدر القرار وصدوره ونصه وسريانه", "أضع علامة استفهام ثم أنشره"], c: 1 },
    { q: "تخطط لإطلاق خدمة بث أو إنتاج إعلامي منظمة. كيف تبدأ؟", a: ["تراجع تصنيف الخدمة ومتطلباتها لدى الجهة المختصة", "تبدأ أولًا ثم تطلب الترخيص عند ظهور إشكال", "تتجاهل المتطلبات لأن المحتوى على الإنترنت"], c: 0 },
    { q: "تريد إعادة استخدام رسوم وتصميم من مادة صحفية منشورة. ما الأفضل؟", a: ["تعدل الألوان فتزول الحقوق", "تضع اسمك لأنك نشرتها على منصتك", "تراجع حقوق التصميم وشروط الاستعمال وتذكر المصدر عند اللزوم"], c: 2 },
    { q: "وجد فريقك خطأ مؤثرًا في رقم ظهر ضمن رسم بياني منشور. ما القرار الأفضل؟", a: ["تؤخر التصحيح حتى يختفي الموضوع", "تراجع الرقم وتصححه بوضوح وتوثق التصحيح", "تمسح تعليقات القراء وتتجاهل الخطأ"], c: 1 },
  ];
  const LEARN = [
    "حقوق الصور والتصاميم: وصول الملف إليك أو نشره على الإنترنت لا يعني تلقائيًا امتلاك حق إعادة استعماله.",
    "القرارات الرسمية: تحقّق من جهة الإصدار والنص والتاريخ والسياق قبل تحويل المعلومة إلى خبر.",
    "الأنشطة الإعلامية: شروط التراخيص والتسجيل تختلف بحسب نوع النشاط؛ لا تفترض أنها واحدة للجميع.",
    "الاقتباس وإعادة النشر: احترم حقوق التعبير الإبداعي، وميّز بين الوقائع العامة والمصنفات المحمية.",
    "تصحيح الأخطاء: الدقة مسؤولية مستمرة حتى بعد النشر، والتصحيح الواضح جزء من الأمانة المهنية.",
  ];
  const body = $("#asBody"),
    next = $("#asNext"),
    reset = $("#asReset"),
    stage = $("#asStage"),
    counter = $("#asCounter"),
    steps = $$(".as-step");
  if (!body) return;
  const KEY = "marji_assessment_v3";
  let phase = "start",
    i = 0,
    pre = 0,
    post = 0,
    pick = null;

  function mark(n) {
    steps.forEach((s, k) => {
      s.classList.toggle("is-on", k === n);
      s.classList.toggle("is-done", k < n);
    });
  }
  function render() {
    if (phase === "pre" || phase === "post") {
      const set = phase === "pre" ? PRE : POST,
        it = set[i];
      pick = null;
      mark(phase === "pre" ? 0 : 2);
      stage.textContent = phase === "pre" ? "قبل التعلّم" : "بعد التعلّم";
      counter.textContent = AR(i + 1) + " / " + AR(set.length);
      body.innerHTML =
        "<h3>" +
        esc(it.q) +
        '</h3><div class="as-answers" role="radiogroup" aria-label="اختر قرارك">' +
        it.a.map((a, k) => '<label><input type="radio" name="asChoice" value="' + k + '"><span>' + esc(a) + "</span></label>").join("") +
        "</div>";
      next.textContent = i === set.length - 1 ? "إنهاء هذه المرحلة" : "الموقف التالي ←";
      next.disabled = true;
      $$('input[name="asChoice"]', body).forEach((r) =>
        r.addEventListener("change", () => {
          pick = Number(r.value);
          next.disabled = false;
        })
      );
      return;
    }
    if (phase === "learn") {
      mark(1);
      stage.textContent = "خطوة التعلّم";
      counter.textContent = "خلاصة قصيرة";
      body.innerHTML =
        "<h3>راجع القواعد العملية الخمس</h3><ol class=\"as-learn\">" +
        LEARN.map((s) => "<li>" + esc(s) + "</li>").join("") +
        "</ol>";
      next.textContent = "انتقل إلى الاختبار البعدي ←";
      next.disabled = false;
      return;
    }
    if (phase === "done") {
      mark(3);
      const d = post - pre;
      stage.textContent = "نتيجتك";
      counter.textContent = "المقارنة مكتملة";
      body.innerHTML =
        '<h3>النتيجتان داخل تجربتك</h3><div class="as-scores"><div><strong>' +
        AR(pre) +
        "/5</strong><span>قبل التعلّم</span></div><div><strong>" +
        AR(post) +
        '/5</strong><span>بعد التعلّم</span></div></div><p class="as-verdict">' +
        (d > 0 ? "تحسّن أداؤك بمقدار " + AR(d) + " إجابة صحيحة." : d === 0 ? "بقي عدد الإجابات الصحيحة ثابتًا؛ راجع الموضوعات التي تحتاج تدريبًا." : "انخفضت النتيجة بمقدار " + AR(-d) + "؛ أعد مراجعة الأمثلة.") +
        "</p>";
      next.hidden = true;
      reset.hidden = false;
      store.set(KEY, { pre, post, at: Date.now() });
    }
  }
  function start() {
    phase = "start";
    i = pre = post = 0;
    pick = null;
    mark(-1);
    stage.textContent = "تدريب قصير";
    counter.textContent = "جاهز للبدء";
    body.innerHTML = "<h3>ابدأ بقرارك الأول</h3><p>اختر التصرف المهني الأقرب لما ستفعله في كل موقف، من دون أن تطّلع على الشرح أولًا. لن تظهر الإجابة الصحيحة حتى نهاية التجربة.</p>";
    const last = store.get(KEY, null);
    if (last && typeof last.pre === "number") body.innerHTML += '<p class="as-small">آخر نتيجة في هذا المتصفح: ' + AR(last.pre) + "/5 قبل، و" + AR(last.post) + "/5 بعد.</p>";
    next.hidden = false;
    next.disabled = false;
    next.textContent = "ابدأ الاختبار القبلي ←";
    reset.hidden = true;
  }
  next.addEventListener("click", () => {
    if (phase === "start") {
      phase = "pre";
      i = 0;
      return render();
    }
    if (phase === "pre" || phase === "post") {
      if (pick === null) return;
      const it = (phase === "pre" ? PRE : POST)[i];
      if (pick === it.c) phase === "pre" ? pre++ : post++;
      i++;
      if (i === 5) phase = phase === "pre" ? "learn" : "done";
      return render();
    }
    if (phase === "learn") {
      phase = "post";
      i = 0;
      render();
    }
  });
  reset.addEventListener("click", start);
  start();
})();
