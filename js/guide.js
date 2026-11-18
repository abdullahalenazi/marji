/* مَرْجِع — شرح اللائحة · دليل تجنّب المخالفة · الأخلاقيات · نقاط الدخول (التخصص، الأسئلة السريعة، الشريط الجانبي) */
(() => {
  "use strict";
  const { $, $$, reduce, el, AR, shuffled } = window.MARJI_UTIL;
  const G = window.MARJI_GUIDE;
  const SMALL = matchMedia("(max-width: 650px)").matches; // على الجوال نعرض بطاقات أقل أولًا
  const scrollTo = (node) => node && node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

  /* ============================================================
   * مكوّن مشترك: بحث + تصنيف + تخصص + بطاقات + نافذة بأربع خطوات
   * يُستخدم مرتين: شرح اللائحة، ودليل تجنّب المخالفة.
   * ============================================================ */
  function explorer(cfg) {
    const cards = $(cfg.cards),
      dialog = $(cfg.dialog),
      query = $(cfg.query),
      audience = $(cfg.audience),
      more = $(cfg.more),
      empty = $(cfg.empty),
      count = $(cfg.count);
    let category = "الكل",
      role = "الكل",
      expanded = false;
    const norm = (t) =>
      String(t)
        .toLowerCase()
        .replace(/[ً-ْـ]/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه");

    function filtered() {
      const term = norm(query.value.trim());
      return cfg.items.filter((x) => (category === "الكل" || x.group === category) && (role === "الكل" || x.aud.includes(role)) && (!term || norm(cfg.haystack(x)).includes(term)));
    }
    function render() {
      const arr = filtered();
      const narrowed = query.value.trim() || category !== "الكل" || role !== "الكل";
      const visible = narrowed || expanded ? arr : arr.slice(0, cfg.first);
      cards.replaceChildren(
        ...visible.map((x) => {
          const b = el("button", "mr-reg-card" + (cfg.cardClass ? " " + cfg.cardClass : ""));
          b.type = "button";
          b.setAttribute("aria-label", cfg.cardLabel(x));
          const top = el("span", "mr-reg-card-top");
          top.append(el("span", "mr-reg-card-num", cfg.num(x)), el("span", "mr-reg-tag", x.group));
          b.append(top, el("h3", null, x.title), el("p", null, cfg.cardText(x)), el("span", "mr-reg-card-cta", cfg.cta));
          b.addEventListener("click", () => open(x));
          return b;
        }),
      );
      empty.hidden = arr.length > 0;
      more.hidden = !!narrowed || arr.length <= cfg.first;
      more.textContent = expanded ? cfg.lessText : cfg.moreText;
      count.textContent = AR(arr.length) + " " + cfg.unit;
    }
    const tabs = $$("[" + cfg.tabAttr + "]", dialog);
    const tabKey = cfg.tabAttr.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const nextKey = cfg.nextAttr.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const order = tabs.map((t) => t.dataset[tabKey]);
    function tab(t) {
      order.forEach((k) => ($(cfg.panel(k)).hidden = k !== t));
      tabs.forEach((b) => {
        const on = b.dataset[tabKey] === t;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", String(on));
      });
      $(cfg.stepLabel).textContent = "الخطوة " + AR(order.indexOf(t) + 1) + " من " + AR(order.length);
      $(".mr-reg-dialog-body", dialog).scrollTop = 0;
    }
    function quiz(optionsBox, feedback, options, right, why) {
      feedback.hidden = true;
      optionsBox.replaceChildren(
        ...shuffled(options.length).map((n) => {
          const b = el("button", null, options[n]);
          b.type = "button";
          b.addEventListener("click", () => {
            $$("button", optionsBox).forEach((x) => (x.disabled = true));
            optionsBox.querySelector('[data-right="1"]').classList.add("correct");
            if (n !== right) b.classList.add("wrong");
            feedback.hidden = false;
            feedback.textContent = (n === right ? "✓ اختيار مناسب. " : "هذا القرار يحتاج مراجعة. ") + why;
          });
          if (n === right) b.dataset.right = "1";
          return b;
        }),
      );
    }
    function open(x, startTab) {
      cfg.fill(x, quiz);
      tab(startTab || order[0]);
      if (!dialog.open) dialog.showModal();
    }
    query.addEventListener("input", render);
    audience.addEventListener("change", () => {
      role = audience.value;
      render();
    });
    const chipBox = $(cfg.chips);
    chipBox.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      category = b.dataset.cat;
      $$("button", chipBox).forEach((c) => {
        const on = c === b;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", String(on));
      });
      render();
    });
    more.addEventListener("click", () => {
      expanded = !expanded;
      render();
    });
    tabs.forEach((b) => b.addEventListener("click", () => tab(b.dataset[tabKey])));
    $$("[" + cfg.nextAttr + "]", dialog).forEach((b) => b.addEventListener("click", () => tab(b.dataset[nextKey])));
    cfg.closers.forEach((s) => $(s).addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
    render();
    return {
      open,
      setRole(r) {
        audience.value = r;
        role = r;
        render();
      },
      find: (pred) => cfg.items.find(pred),
    };
  }

  /* ---------- شرح اللائحة ---------- */
  // أزرار التصنيف موجودة في الصفحة بخاصية data-mr-category؛ نوحّدها مع المكوّن
  $$("[data-mr-category]").forEach((b) => (b.dataset.cat = b.dataset.mrCategory));
  $(".mr-reg-chips").id = "mrRegChips";
  const lessons = explorer({
    items: G.lessons,
    cards: "#mrRegCards",
    dialog: "#mrRegDialog",
    query: "#mrRegQuery",
    audience: "#mrRegAudience",
    more: "#mrRegMore",
    empty: "#mrRegEmpty",
    count: "#mrRegCount",
    chips: "#mrRegChips",
    first: SMALL ? 4 : 6,
    unit: "موضوعًا",
    moreText: "عرض بقية الموضوعات ↓",
    lessText: "عرض موضوعات أقل ↑",
    cta: "افهم الموضوع وجرّب قرارك ←",
    num: (x) => x.n,
    cardText: (x) => x.desc,
    cardLabel: (x) => "افتح الشرح: " + x.title,
    haystack: (x) => [x.title, x.desc, x.meaning, x.article, x.group, x.story, ...x.steps].join(" "),
    tabAttr: "data-mr-tab",
    nextAttr: "data-mr-next",
    panel: (k) => "#mrRegPanel" + k[0].toUpperCase() + k.slice(1),
    stepLabel: "#mrRegStepLabel",
    closers: ["#mrRegClose", "#mrRegFooterClose"],
    fill(x, quiz) {
      $("#mrRegDialogTitle").textContent = x.title;
      $("#mrRegDialogScope").textContent = x.group + "  ·  " + x.chapter;
      $("#mrRegMeaning").textContent = x.meaning;
      $("#mrRegStory").textContent = x.story;
      $("#mrRegQuestion").textContent = x.question;
      $("#mrRegArticle").textContent = x.article;
      $("#mrRegChapter").textContent = x.chapter;
      $("#mrRegPage").textContent = "صفحة " + x.page + " من ملف اللائحة";
      $("#mrRegScopeNote").textContent = x.scope;
      $("#mrRegSteps").replaceChildren(...x.steps.map((t) => el("li", null, t)));
      quiz($("#mrRegOptions"), $("#mrRegFeedback"), x.options, x.right, x.why);
    },
  });

  /* ---------- دليل تجنّب المخالفة ---------- */
  const groups = ["الكل", ...new Set(G.prevention.map((p) => p.group))];
  $("#pvChips").replaceChildren(
    ...groups.map((g, i) => {
      const b = el("button", i === 0 ? "is-on" : null, g);
      b.type = "button";
      b.dataset.cat = g;
      b.setAttribute("aria-pressed", String(i === 0));
      return b;
    }),
  );
  $("#pvCats").replaceChildren(
    ...G.categories.map((c) => {
      const box = el("div", "pv-cat");
      const ul = el("ul");
      c.items.forEach((t) => ul.append(el("li", null, t)));
      box.append(el("b", null, c.name), ul);
      return box;
    }),
  );
  const fineCell = (v) => v || "—";
  const prevention = explorer({
    items: G.prevention,
    cards: "#pvCards",
    dialog: "#pvDialog",
    query: "#pvQuery",
    audience: "#pvAudience",
    more: "#pvMore",
    empty: "#pvEmpty",
    count: "#pvCount",
    chips: "#pvChips",
    first: SMALL ? 5 : 9,
    unit: "بندًا",
    moreText: "عرض بقية البنود ↓",
    lessText: "عرض بنود أقل ↑",
    cta: "اعرف كيف تتجنبها ←",
    cardClass: "pv-card",
    num: (x) => "البند " + AR(x.n),
    cardText: (x) => x.avoid,
    cardLabel: (x) => "افتح بند الوقاية " + x.n + ": " + x.title,
    haystack: (x) => [x.title, x.text, x.who, x.avoid, x.group, x.ex, ...x.steps].join(" "),
    tabAttr: "data-pv-tab",
    nextAttr: "data-pv-next",
    panel: (k) => "#pvPanel" + k[0].toUpperCase() + k.slice(1),
    stepLabel: "#pvStepLabel",
    closers: ["#pvClose", "#pvFooterClose"],
    fill(x, quiz) {
      $("#pvDialogTitle").textContent = x.title;
      $("#pvScope").textContent = x.group + "  ·  البند (" + AR(x.n) + ") من جدول المخالفات";
      $("#pvAvoid").textContent = x.avoid;
      $("#pvWho").textContent = x.who;
      $("#pvSteps").replaceChildren(...x.steps.map((t) => el("li", null, t)));
      $("#pvRef").textContent = "الملحق (ب): جدول المخالفات — البند (" + AR(x.n) + ")";
      $("#pvPage").textContent = "صفحة " + AR(x.ap) + " من الملحق · صفحة " + AR(x.pp) + " من ملف اللائحة";
      $("#pvText").textContent = "«" + x.text + "»";
      const link = $("#pvLink");
      link.replaceChildren();
      if (x.link) link.append(el("b", null, "مادة مرتبطة في اللائحة: "), document.createTextNode(x.link));
      else link.append(el("b", null, "السند: "), document.createTextNode("نص البند في جدول المخالفات (الملحق ب)."));
      $("#pvF1").textContent = fineCell(x.fine[0]);
      $("#pvF2").textContent = fineCell(x.fine[1]);
      $("#pvF3").textContent = fineCell(x.fine[2]);
      $("#pvAction").textContent = x.action ? "عمود الجزاءات: " + x.action : "عمود الجزاءات: فارغ في الجدول لهذا البند.";
      $("#pvOfficial").href = G.source.bylawUrl;
      $(".pv-penalty").open = false;
    },
  });

  /* ---------- الأخلاقيات المهنية ---------- */
  const ethics = (() => {
    const ITEMS = G.ethics;
    const list = $("#ethTopics"),
      box = $("#ethChoices"),
      fb = $("#ethFeedback");
    let current = 0;
    ITEMS.forEach((item, index) => {
      const b = el("button", "eth-topic");
      b.type = "button";
      b.dataset.index = index;
      const ic = el("span", "eth-topic-icon", item.icon);
      ic.setAttribute("aria-hidden", "true");
      b.append(ic, el("span", null, item.title));
      b.addEventListener("click", () => show(index));
      list.append(b);
    });
    function show(index) {
      current = index;
      const d = ITEMS[index];
      $("#ethProgress").textContent = AR(index + 1) + " / " + AR(ITEMS.length);
      $("#ethTag").textContent = d.tag;
      $("#ethTitle").textContent = d.title;
      $("#ethDesc").textContent = d.desc;
      $("#ethExample").textContent = d.example;
      $("#ethQuestion").textContent = d.question;
      $("#ethSource").textContent = d.source;
      fb.hidden = true;
      fb.textContent = "";
      fb.className = "eth-feedback";
      box.replaceChildren(
        ...shuffled(d.choices.length).map((n) => {
          const b = el("button", "eth-choice", d.choices[n]);
          b.type = "button";
          b.addEventListener("click", () => {
            const right = n === d.correct;
            $$("button", box).forEach((x) => x.classList.remove("selected-good", "selected-review"));
            b.classList.add(right ? "selected-good" : "selected-review");
            fb.hidden = false;
            fb.className = "eth-feedback " + (right ? "good" : "review");
            fb.textContent = (right ? "✓ اختيار مهني مناسب. " : "هذا الخيار يحتاج مراجعة. ") + d.explain;
          });
          return b;
        }),
      );
      $$("button", list).forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.index) === index)));
      $("#ethNext").textContent = index === ITEMS.length - 1 ? "ارجع إلى أول مبدأ ↺" : "المبدأ التالي ←";
    }
    $("#ethNext").addEventListener("click", () => {
      show((current + 1) % ITEMS.length);
      if (innerWidth < 800) $("#ethTitle").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
    show(0);
    return { show: (id) => show(Math.max(0, ITEMS.findIndex((x) => x.id === id))) };
  })();

  /* ---------- نقاط الدخول: كل زر يفتح وجهته هو، لا مثالًا افتراضيًا واحدًا ---------- */
  $$("[data-go-lesson]").forEach((b) =>
    b.addEventListener("click", () => {
      const x = lessons.find((l) => l.id === b.dataset.goLesson);
      if (x) lessons.open(x);
    }),
  );
  $$("[data-go-prevent]").forEach((b) =>
    b.addEventListener("click", () => {
      const x = prevention.find((p) => p.n === Number(b.dataset.goPrevent));
      if (x) prevention.open(x);
    }),
  );
  $$("[data-go-ethics]").forEach((b) =>
    b.addEventListener("click", () => {
      ethics.show(b.dataset.goEthics);
      scrollTo($("#ethics"));
    }),
  );
  // اختيار التخصص يرتّب القسمين معًا ثم ينقلك إلى شرح اللائحة
  $$("[data-marji-role]").forEach((b) =>
    b.addEventListener("click", () => {
      $$("[data-marji-role]").forEach((x) => x.classList.toggle("is-picked", x === b));
      lessons.setRole(b.dataset.marjiRole);
      prevention.setRole(b.dataset.marjiRole);
      scrollTo($("#regulations"));
    }),
  );

  /* ---------- الشريط الجانبي وزر العودة للأعلى ---------- */
  const rail = $$("[data-rail]"),
    topbtn = $(".marji-backtop");
  const ids = rail.map((a) => a.dataset.rail);
  let tracking = false;
  function onScroll() {
    const y = scrollY + innerHeight * 0.3;
    let active = ids[0];
    for (const id of ids) {
      const s = document.getElementById(id);
      if (s && s.getBoundingClientRect().top + scrollY < y) active = id;
    }
    rail.forEach((a) => {
      const on = a.dataset.rail === active;
      a.classList.toggle("is-current", on);
      if (on) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    topbtn.classList.toggle("visible", scrollY > 600);
    tracking = false;
  }
  addEventListener(
    "scroll",
    () => {
      if (!tracking) {
        tracking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();
  topbtn.addEventListener("click", () => scrollTo(document.body));
})();
