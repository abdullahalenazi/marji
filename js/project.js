/* مَرْجِع — صفحة ملف المشروع: القائمة على الجوال، وإظهار الفيديو والبودكاست عند توفّر ملفيهما */
(() => {
  "use strict";
  const menu = document.getElementById("menu"), links = document.getElementById("links");
  if (menu && links) {
    menu.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) { links.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); }
    });
  }
  // يظهر المشغّل فقط إذا كان الملف مرفوعًا، وإلا يبقى الوصف النصي
  // data-src قد يحمل أكثر من مسار مفصولة بـ | ويُستخدم أول ملف متاح منها
  document.querySelectorAll("video[data-src], audio[data-src]").forEach((m) => {
    const list = m.dataset.src.split("|");
    const tryNext = (i) => {
      if (i >= list.length) return;
      fetch(list[i], { method: "HEAD" }).then((r) => {
        if (!r.ok) return tryNext(i + 1);
        m.src = list[i];
        m.hidden = false;
        const fb = m.parentElement.querySelector(".pj-video-fallback");
        if (fb) fb.hidden = true;
      }, () => tryNext(i + 1));
    };
    tryNext(0);
  });
})();
