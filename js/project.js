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
  document.querySelectorAll("video[data-src], audio[data-src]").forEach((m) => {
    fetch(m.dataset.src, { method: "HEAD" }).then((r) => {
      if (!r.ok) return;
      m.src = m.dataset.src;
      m.hidden = false;
      const fb = m.parentElement.querySelector(".pj-video-fallback");
      if (fb) fb.hidden = true;
    }, () => {});
  });
})();
