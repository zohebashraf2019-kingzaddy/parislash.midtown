/* Paris Lash Midtown — interactions (no dependencies) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Preloader (once per session) ---------- */
  const loader = $(".loader");
  if (loader) {
    let seen = false;
    try { seen = sessionStorage.getItem("pl-seen") === "1"; sessionStorage.setItem("pl-seen", "1"); } catch (e) {}
    const finish = () => { loader.classList.add("done"); document.body.classList.add("loaded"); setTimeout(() => loader.remove(), 1200); };
    if (seen || reduce) { loader.remove(); document.body.classList.add("loaded"); }
    else if (document.readyState === "complete") setTimeout(finish, 900);
    else { window.addEventListener("load", () => setTimeout(finish, 700)); setTimeout(finish, 3000); }
  } else document.body.classList.add("loaded");

  /* ---------- Page transition curtain ---------- */
  const curtain = $(".curtain");
  $$("a[href]").forEach(a => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("sms:") || href.startsWith("mailto:") || a.target === "_blank" || /^https?:/.test(href)) return;
    a.addEventListener("click", e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || reduce || !curtain) return;
      e.preventDefault();
      curtain.classList.add("in");
      setTimeout(() => { location.href = href; }, 520);
    });
  });
  window.addEventListener("pageshow", () => curtain && curtain.classList.remove("in"));

  /* ---------- Header: scrolled / hide on scroll down ---------- */
  const header = $(".header"), progress = $(".progress"), fab = $(".fab");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header && header.classList.toggle("scrolled", y > 40);
    if (header && !document.body.classList.contains("menu-open")) header.classList.toggle("hide", y > lastY && y > 400);
    lastY = y;
    if (progress) {
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    }
    fab && fab.classList.toggle("show", y > 500);
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $(".burger");
  burger && burger.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
    header.classList.remove("hide");
  });
  $$(".mobile-menu a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  addEventListener("keydown", e => { if (e.key === "Escape") document.body.classList.remove("menu-open"); });

  /* ---------- Split text into words ---------- */
  $$(".split").forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const i = document.createElement("span"); i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) {
          if (n.tagName === "BR") return;
          // wrap element as a single word to keep styling intact
          const w = document.createElement("span"); w.className = "w";
          const i = document.createElement("span");
          n.replaceWith(w); i.appendChild(n); w.appendChild(i);
        }
      });
    };
    walk(el);
    $$(".w > span", el).forEach((s, i) => s.style.transitionDelay = `${i * 0.06}s`);
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .reveal-img, .split").forEach(el => io.observe(el));

  /* ---------- Count up ---------- */
  const cio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, to = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
      const t0 = performance.now(), dur = 1600;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
        el.textContent = (to * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      reduce ? el.textContent = to.toFixed(dec) : requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: .6 });
  $$("[data-count]").forEach(el => cio.observe(el));

  /* ---------- Videos: play only when visible, sound toggle ---------- */
  const vids = $$("video[data-auto]");
  const vio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      const v = en.target;
      if (en.isIntersecting) { const p = v.play(); p && p.catch(() => {}); }
      else v.pause();
    });
  }, { threshold: 0.2 });
  vids.forEach(v => { v.muted = true; vio.observe(v); });
  $$(".sound").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.closest(".reel, .phone, .page-hero__img").querySelector("video");
      const turnOn = v.muted;
      // only one video with sound at a time
      $$("video").forEach(o => { o.muted = true; });
      $$(".sound").forEach(b => { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
      if (turnOn) { v.muted = false; v.play(); btn.classList.add("on"); btn.setAttribute("aria-pressed", "true"); }
    });
  });

  /* ---------- Custom cursor ---------- */
  if (fine && !reduce) {
    const c = document.createElement("div"), d = document.createElement("div");
    c.className = "cursor"; d.className = "cursor-dot";
    document.body.append(c, d);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("mousemove", e => { x = e.clientX; y = e.clientY; d.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`; });
    const loop = () => { cx += (x - cx) * .16; cy += (y - cy) * .16; c.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); };
    loop();
    $$("a, button, .chip span, .lash-card, .svc").forEach(el => {
      el.addEventListener("mouseenter", () => c.classList.add("hover"));
      el.addEventListener("mouseleave", () => c.classList.remove("hover"));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduce) $$(".btn, .socials a, .sound").forEach(b => {
    b.addEventListener("mousemove", e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    b.addEventListener("mouseleave", () => b.style.transform = "");
  });

  /* ---------- 3D tilt + spotlight ---------- */
  if (fine && !reduce) $$("[data-tilt]").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(1000px) rotateX(${(py - .5) * -6}deg) rotateY(${(px - .5) * 8}deg)`;
      el.style.setProperty("--mx", px * 100 + "%"); el.style.setProperty("--my", py * 100 + "%");
    });
    el.addEventListener("mouseleave", () => el.style.transform = "");
  });

  /* ---------- Hero phones parallax ---------- */
  const phones = $(".phones");
  if (phones && fine && !reduce) {
    const ps = $$(".phone", phones), base = ["", "rotate(-8deg)", "rotate(8deg)"], depth = [18, 34, 30];
    addEventListener("mousemove", e => {
      const dx = e.clientX / innerWidth - .5, dy = e.clientY / innerHeight - .5;
      ps.forEach((p, i) => p.style.transform = `translate(${dx * depth[i]}px, ${dy * depth[i]}px) ${base[i]}`);
    });
  }

  /* ---------- Sparkles canvas ---------- */
  const cv = $("#sparkles");
  if (cv && !reduce) {
    const ctx = cv.getContext("2d"); let W, H, parts = [];
    const size = () => { W = cv.width = cv.offsetWidth * devicePixelRatio; H = cv.height = cv.offsetHeight * devicePixelRatio; };
    size(); addEventListener("resize", size);
    const N = innerWidth < 700 ? 28 : 60;
    for (let i = 0; i < N; i++) parts.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + .4, s: Math.random() * .0006 + .0002, p: Math.random() * Math.PI * 2 });
    const draw = t => {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(pt => {
        pt.y -= pt.s; if (pt.y < -0.02) { pt.y = 1.02; pt.x = Math.random(); }
        const a = (Math.sin(t / 600 + pt.p) + 1) / 2;
        const x = pt.x * W, y = pt.y * H, r = pt.r * devicePixelRatio;
        ctx.globalAlpha = a * .9;
        ctx.fillStyle = pt.r > 1.4 ? "#ff4fb0" : "#ffffff";
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (pt.r > 1.5) { ctx.globalAlpha = a * .5; ctx.fillRect(x - r * 4, y - .5, r * 8, 1); ctx.fillRect(x - .5, y - r * 4, 1, r * 8); }
      });
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* ---------- Price nav active state ---------- */
  const pnav = $$(".price-nav a");
  if (pnav.length) {
    const sio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) pnav.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    pnav.forEach(a => { const t = $(a.getAttribute("href")); t && sio.observe(t); });
  }

  /* ---------- Hours: highlight today + open now (Reno time) ---------- */
  const hoursTbl = $(".hours");
  if (hoursTbl) {
    let day, hr;
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      day = parts.find(p => p.type === "weekday").value;
      hr = parseInt(parts.find(p => p.type === "hour").value, 10) + parseInt(parts.find(p => p.type === "minute").value, 10) / 60;
    } catch (e) { const d = new Date(); day = d.toLocaleDateString("en-US", { weekday: "short" }); hr = d.getHours(); }
    const row = $(`tr[data-day="${day}"]`, hoursTbl);
    row && row.classList.add("today");
    const badge = $(".open-now");
    if (badge) {
      const open = day !== "Sun" && hr >= 9 && hr < 19;
      badge.textContent = open ? "Open now · until 7 PM" : "Closed now · opens 9 AM " + (day === "Sat" && hr >= 19 ? "Monday" : day === "Sun" ? "Monday" : hr >= 19 ? "tomorrow" : "today");
      badge.classList.toggle("closed", !open);
    }
  }

  /* ---------- Contact form ---------- */
  const form = $("#contact-form");
  if (form) {
    const status = $(".form-status", form), btn = $("button[type=submit]", form);
    // Preselect service from ?service=
    const q = new URLSearchParams(location.search).get("service");
    if (q) { const opt = $(`select[name=service] option[value="${CSS.escape(q)}"]`, form); opt && (opt.selected = true); }

    const show = (cls, html) => { status.className = "form-status show " + cls; status.innerHTML = html; };
    form.addEventListener("submit", async e => {
      e.preventDefault();
      let ok = true;
      $$("[required]", form).forEach(f => {
        const bad = !f.value.trim() || (f.type === "email" && f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        f.closest(".field").classList.toggle("invalid", bad); if (bad) ok = false;
      });
      const phone = form.phone.value.trim(), email = form.email.value.trim();
      if (!phone && !email) { ok = false; form.phone.closest(".field").classList.add("invalid"); }
      if (!ok) { show("err", "Please add your name and a phone number or email so we can reach you."); return; }

      const data = Object.fromEntries(new FormData(form).entries());
      data.times = $$("input[name=times]:checked", form).map(i => i.value).join(", ");
      btn.disabled = true; btn.querySelector(".label").textContent = "Sending…";
      const smsBody = encodeURIComponent(`Hi Paris Lash! This is ${data.name}. I'm interested in: ${data.service}. ${data.message || ""}`.trim());
      try {
        const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error("bad");
        form.reset();
        show("ok", `<strong>Thank you, ${escapeHtml(data.name.split(" ")[0])}! 💗</strong> Your message is on its way. We'll reach out soon to confirm. Need it sooner? Call <a href="tel:+17756578399">775-657-8399</a>.`);
        burst(btn);
      } catch (err) {
        show("err", `We couldn't send that right now. Please <a href="sms:+17756578399?&body=${smsBody}">text us</a> or call <a href="tel:+17756578399">775-657-8399</a> and we'll get you booked.`);
      } finally {
        btn.disabled = false; btn.querySelector(".label").textContent = "Send Request";
      }
    });
    $$("input, select, textarea", form).forEach(f => f.addEventListener("input", () => f.closest(".field") && f.closest(".field").classList.remove("invalid")));
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function burst(el) {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span"); s.className = "success-burst"; s.textContent = i % 3 ? "✦" : "♥";
      s.style.left = r.left + r.width / 2 + "px"; s.style.top = r.top + "px"; document.body.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
      s.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d - 40}px) scale(.4)`, opacity: 0 }], { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.22,1,.36,1)" }).onfinish = () => s.remove();
    }
  }

  /* year */
  $$("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
})();
