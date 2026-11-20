/* ==========================================================================
   Despachantes Mentor — interações e animações
   GSAP 3.15 · ScrollTrigger · SplitText · DrawSVG · MotionPath · ScrollTo

   Hero com entrada discreta; em "Valores e serviços", um carro percorre a estrada
   do símbolo da marca conforme a rolagem e acende cada etapa do atendimento.
   ========================================================================== */
(() => {
  "use strict";

  window.__mentorReady = true;

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Links de WhatsApp com mensagem pronta ---------- */
  const WA_NUMBER = "5531999660016";
  const waHref = (service) => {
    let msg = "Olá! Vim pelo site da Despachantes Mentor e gostaria de um atendimento.";
    if (service === "empresa") {
      msg = "Olá! Represento uma concessionária/revenda e gostaria de conhecer o atendimento empresarial da Despachantes Mentor.";
    } else if (service) {
      msg = `Olá! Vim pelo site da Despachantes Mentor e gostaria de solicitar o serviço: ${service}.`;
    }
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  };
  $$("[data-wa]").forEach((a) => { a.href = waHref(a.dataset.wa.trim()); });
  $$("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  const header = $("[data-header]");
  const menu = $("[data-menu]");
  const toggle = $("[data-menu-toggle]");

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) {
    root.classList.remove("anim");
    basicFallback();
    return;
  }

  const fullKit = !!(window.ScrollToPlugin && window.SplitText && window.DrawSVGPlugin && window.MotionPathPlugin);
  if (fullKit) {
    gsap.registerPlugin(ScrollTrigger, window.ScrollToPlugin, window.SplitText, window.DrawSVGPlugin, window.MotionPathPlugin);
  } else {
    gsap.registerPlugin(ScrollTrigger);
  }
  const SplitText = window.SplitText;

  // "anim" só existe se o usuário não pediu movimento reduzido e o JS chegou a tempo
  const canAnimate = fullKit && root.classList.contains("anim");
  if (!canAnimate) root.classList.remove("anim");

  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  const isDesktop = () => window.matchMedia("(min-width: 960px)").matches;

  let menuOpen = false;
  let menuTl = null;

  /* ======================================================================
     Recursos que funcionam sempre (com ou sem animação)
     ====================================================================== */
  headerBehavior();
  mobileMenu();
  anchorLinks();
  faq();
  floatingButton();

  // Espera as fontes (com limite) para medir linhas e alturas corretamente
  const fontsReady = Promise.race([
    document.fonts
      ? Promise.all([document.fonts.load('600 1em "Saira"'), document.fonts.load('400 1em "Inter"')]).catch(() => {})
      : Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 900)),
  ]);

  fontsReady.then(() => {
    initRoute(canAnimate);
    ctaScene(canAnimate);

    if (canAnimate) {
      heroIntro();
      reveals();
      serviceCards();
      pillars();
      counters();
      footerMark();

      const mm = gsap.matchMedia();
      mm.add("(min-width: 960px) and (pointer: fine)", () => magneticButtons());
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());
  });

  /* ======================================================================
     Cabeçalho: fundo ao rolar, esconde ao descer, link ativo
     ====================================================================== */
  function headerBehavior() {
    // Listener nativo (e não ScrollTrigger.onUpdate): durante um refresh() o
    // ScrollTrigger pode reportar posições temporárias e "apagar" o fundo do cabeçalho.
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
      if (!menuOpen) {
        if (y > lastY + 4 && y > 520) header.classList.add("is-hidden");
        else if (y < lastY - 4 || y <= 520) header.classList.remove("is-hidden");
      }
      lastY = y;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

    $$(".main-nav a[href^='#']").forEach((link) => {
      const target = document.getElementById(link.getAttribute("href").slice(1));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: (self) => link.classList.toggle("is-active", self.isActive),
      });
    });
  }

  /* ======================================================================
     Menu mobile
     ====================================================================== */
  function mobileMenu() {
    const items = $$(".mm-link, .mm-cta", menu);
    // conteúdo atrás do menu fica inacessível (teclado e leitores de tela) enquanto ele está aberto
    const background = [$("main"), $(".site-footer"), $(".wa-float")].filter(Boolean);
    const setInert = (on) => background.forEach((el) => { el.inert = on; });

    const build = () => gsap.timeline({ paused: true })
      .fromTo(menu,
        { clipPath: "circle(0% at 100% 0%)" },
        { clipPath: "circle(150% at 100% 0%)", duration: 0.75, ease: "power3.inOut" })
      .fromTo(items,
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "power3.out" }, 0.28);

    toggle.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen) { closeMenu(); toggle.focus(); }
    });
    window.matchMedia("(min-width: 960px)").addEventListener("change", (e) => {
      if (e.matches) closeMenu(true);
    });

    function openMenu() {
      if (menuOpen) return;
      menuOpen = true;
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Fechar menu");
      header.classList.remove("is-hidden");
      header.classList.add("menu-is-open");
      document.body.classList.add("no-scroll");
      setInert(true);
      if (canAnimate) {
        menuTl = menuTl || build();
        menuTl.timeScale(1).play(0);
      }
    }

    function closeMenu(immediate) {
      if (!menuOpen) return;
      menuOpen = false;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
      header.classList.remove("menu-is-open");
      document.body.classList.remove("no-scroll");
      setInert(false);
      const done = () => { if (!menuOpen) menu.hidden = true; };
      if (canAnimate && menuTl && !immediate) {
        menuTl.eventCallback("onReverseComplete", done);
        menuTl.timeScale(1.7).reverse();
      } else {
        if (menuTl) menuTl.progress(0).pause();
        done();
      }
    }

    mobileMenu.close = closeMenu;
  }

  /* ======================================================================
     Rolagem suave para as âncoras
     ====================================================================== */
  function anchorLinks() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href").slice(1);
        const target = id && document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        if (menuOpen && mobileMenu.close) mobileMenu.close();

        const toTop = id === "inicio";
        if (window.ScrollToPlugin) {
          gsap.to(window, {
            duration: canAnimate ? 1.2 : 0,
            ease: "power3.inOut",
            overwrite: true,
            scrollTo: { y: toTop ? 0 : target, autoKill: true },
          });
        } else {
          target.scrollIntoView();
        }
        if (history.replaceState) history.replaceState(null, "", `#${id}`);
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ======================================================================
     Dúvidas: <details> com abertura suave
     ====================================================================== */
  function faq() {
    const list = $("[data-faq]");
    if (!list) return;
    list.classList.add("is-enhanced");

    $$(".faq-item", list).forEach((item) => {
      const summary = $("summary", item);
      const panel = $(".faq-panel", item);
      if (item.open) item.classList.add("is-open");

      summary.addEventListener("click", (e) => {
        e.preventDefault();
        const opening = !item.classList.contains("is-open");
        gsap.killTweensOf(panel);

        if (opening) {
          item.open = true;
          item.classList.add("is-open");
          gsap.fromTo(panel, { height: 0, opacity: 0 }, {
            height: "auto",
            opacity: 1,
            duration: canAnimate ? 0.55 : 0,
            ease: "power3.out",
            onComplete: () => { gsap.set(panel, { clearProps: "height,opacity" }); ScrollTrigger.refresh(); },
          });
        } else {
          item.classList.remove("is-open");
          gsap.to(panel, {
            height: 0,
            opacity: 0,
            duration: canAnimate ? 0.4 : 0,
            ease: "power2.inOut",
            onComplete: () => {
              item.open = false;
              gsap.set(panel, { clearProps: "height,opacity" });
              ScrollTrigger.refresh();
            },
          });
        }
      });
    });
  }

  /* ======================================================================
     Botão flutuante do WhatsApp (aparece depois do topo)
     ====================================================================== */
  function floatingButton() {
    const btn = $(".wa-float");
    if (!btn) return;
    ScrollTrigger.create({
      trigger: ".hero",
      start: "bottom 75%",
      onEnter: () => btn.classList.add("is-visible"),
      onLeaveBack: () => btn.classList.remove("is-visible"),
    });
  }

  /* ======================================================================
     HERO — entrada discreta (título por linhas, textos e cartão de atendimento)
     ====================================================================== */
  function heroIntro() {
    const title = $(".hero-title");
    const items = $$("[data-hero-item]");
    const card = $(".hero-card");
    const cardParts = card ? $$(".hero-card-head, .hero-option, .hero-card-phone", card) : [];

    let first = true;
    SplitText.create(title, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit(self) {
        gsap.set(title, { opacity: 1 });
        const tween = gsap.fromTo(self.lines, { yPercent: 110 }, {
          yPercent: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.09,
          delay: first ? 0.1 : 0,
        });
        first = false;
        return tween;
      },
    });

    gsap.timeline({ defaults: { ease: "power3.out" } })
      .fromTo(".header-inner", { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0)
      .fromTo(items, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.3)
      .fromTo(card, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.25)
      .fromTo(cardParts, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 }, 0.55);
  }

  function magneticButtons() {
    const offs = $$("[data-magnetic]").map((btn) => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.6, ease: "power3" });
      const move = (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
      };
      const leave = () => { xTo(0); yTo(0); };
      btn.addEventListener("pointermove", move);
      btn.addEventListener("pointerleave", leave);
      return () => {
        btn.removeEventListener("pointermove", move);
        btn.removeEventListener("pointerleave", leave);
        gsap.set(btn, { x: 0, y: 0 });
      };
    });
    return () => offs.forEach((off) => off());
  }

  /* ======================================================================
     Revelações genéricas: títulos por linha + blocos em fade
     ====================================================================== */
  function reveals() {
    $$("[data-split]").forEach((el) => {
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { opacity: 1 });
          return gsap.fromTo(self.lines, { yPercent: 120 }, {
            yPercent: 0,
            duration: 1.15,
            ease: "power4.out",
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: "top 86%", once: true },
          });
        },
      });
    });

    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (els) => gsap.fromTo(els, { y: 36, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.09,
        overwrite: true,
      }),
    });
  }

  /* ======================================================================
     Serviços: ícones se desenham quando o card aparece
     ====================================================================== */
  function serviceCards() {
    $$(".svc-card").forEach((card) => {
      const shapes = $$(".svc-icon > *", card);
      if (!shapes.length) return;
      gsap.set(shapes, { drawSVG: "0%" });
      ScrollTrigger.create({
        trigger: card,
        start: "top 88%",
        once: true,
        onEnter: () => gsap.to(shapes, { drawSVG: "100%", duration: 1, ease: "power2.inOut", stagger: 0.08, delay: 0.25 }),
      });
    });
  }

  /* ======================================================================
     VALORES E SERVIÇOS — o carro percorre a estrada com a rolagem
     ====================================================================== */
  function initRoute(animated) {
    const route = $("[data-route]");
    if (!route) return;
    const svg = $(".route-svg", route);
    const paths = $$(".route-path", svg);
    const progress = $(".route-progress", svg);
    const glow = $(".route-glow", svg);
    const car = $(".route-car", route);
    const steps = $$(".step", route);
    const nodes = steps.map((s) => $(".step-node", s));

    const SAMPLES = 320;
    const ys = new Float64Array(SAMPLES + 1);
    let stepFracs = [];

    // Curva suave (Catmull-Rom → Bézier) passando pelos pontos
    const smoothPath = (pts) => {
      let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
      }
      return d;
    };

    function geometry() {
      const w = route.offsetWidth;
      const h = route.offsetHeight;
      if (!w || !h) return;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("width", w);
      svg.setAttribute("height", h);

      const rb = route.getBoundingClientRect();
      const pts = nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.left - rb.left + r.width / 2, y: r.top - rb.top + r.height / 2 };
      });
      const cx = pts[0].x;
      const amp = isDesktop() ? Math.min(96, w * 0.08) : 6;

      const way = [{ x: cx, y: 0 }];
      pts.forEach((p, i) => {
        way.push(p);
        const next = pts[i + 1];
        if (next) way.push({ x: (p.x + next.x) / 2 + (i % 2 === 0 ? amp : -amp), y: (p.y + next.y) / 2 });
      });
      way.push({ x: cx, y: h });

      const d = smoothPath(way);
      paths.forEach((p) => p.setAttribute("d", d));

      // Tabela "altura → comprimento" para o carro ficar alinhado à rolagem
      const total = progress.getTotalLength();
      let maxY = 0;
      for (let i = 0; i <= SAMPLES; i++) {
        const pt = progress.getPointAtLength((total * i) / SAMPLES);
        maxY = Math.max(maxY, pt.y);
        ys[i] = maxY / h;
      }
      ys[0] = 0;
      ys[SAMPLES] = 1;
      stepFracs = pts.map((p) => p.y / h);
    }

    // Converte progresso vertical (rolagem) em progresso ao longo da estrada
    const roadEase = (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      let lo = 0;
      let hi = SAMPLES;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] < t) lo = mid; else hi = mid;
      }
      const span = ys[hi] - ys[lo];
      const f = span > 0 ? (t - ys[lo]) / span : 0;
      return (lo + f) / SAMPLES;
    };

    geometry();
    route.classList.add("is-ready");
    ScrollTrigger.addEventListener("refreshInit", geometry);

    if (!animated) {
      steps.forEach((s) => s.classList.add("is-active"));
      return;
    }

    route.classList.add("is-animated");
    gsap.set(car, { xPercent: -50, yPercent: -50, opacity: 0 });

    let activeCount = -1;
    const setActive = (t) => {
      let count = 0;
      for (let i = 0; i < stepFracs.length; i++) if (t >= stepFracs[i] - 0.003) count = i + 1;
      if (count === activeCount) return;
      activeCount = count;
      steps.forEach((s, i) => s.classList.toggle("is-active", i < count));
    };

    const tl = gsap.timeline({
      scrollTrigger: { trigger: route, start: "top 60%", end: "bottom 60%", scrub: 0.8, invalidateOnRefresh: true },
      onUpdate: () => setActive(tl.progress()),
    });
    tl.to(car, { motionPath: { path: progress, autoRotate: true }, ease: roadEase, duration: 1 }, 0)
      .fromTo([progress, glow], { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", ease: roadEase, duration: 1 }, 0)
      .to(car, { opacity: 1, duration: 0.03, ease: "none" }, 0)
      .to(car, { opacity: 0, duration: 0.03, ease: "none" }, 0.97);

    // Cartões das etapas entram pela lateral
    steps.forEach((step, i) => {
      const card = $(".step-card", step);
      const fromX = isDesktop() ? (i % 2 === 0 ? -48 : 48) : 28;
      gsap.fromTo(card, { x: fromX, opacity: 0 }, {
        x: 0,
        opacity: 1,
        duration: 1,
        scrollTrigger: { trigger: step, start: "top 82%", once: true },
      });
    });
  }

  /* ======================================================================
     Por que a Mentor: palavras do lema preenchidas pela rolagem
     ====================================================================== */
  function pillars() {
    $$(".pillar").forEach((pillar) => {
      gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: pillar, start: "top 85%", end: "top 40%", scrub: 0.6 },
      })
        .fromTo($(".pillar-fill", pillar), { clipPath: "inset(-25% 100% -35% 0%)" }, { clipPath: "inset(-25% 0% -35% 0%)", duration: 1 }, 0)
        // o contorno some quando a palavra termina de ser preenchida
        .to($(".pillar-outline", pillar), { opacity: 0, duration: 0.25 }, 0.75);
    });
  }

  function counters() {
    $$("[data-count]").forEach((el) => {
      const end = Number(el.dataset.count);
      const state = { v: 0 };
      el.textContent = "0";
      gsap.to(state, {
        v: end,
        duration: end > 10 ? 1.8 : 1.1,
        ease: "power2.out",
        onUpdate: () => { el.textContent = String(Math.round(state.v)); },
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });
  }

  /* ======================================================================
     Chamada final: o M da logo com volume e a estrada da logo em versão
     realista — perspectiva, faixas, marcas de pneu e faróis de um carro
     ====================================================================== */
  function ctaScene(animated) {
    const svg = $(".cta-road");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const make = (parent, tag, attrs = {}) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      parent.appendChild(el);
      return el;
    };
    const fmt = (n) => n.toFixed(2);
    const smooth = (a, b, x) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };

    // Bordas da estrada da logo (Bézier cúbicas), do primeiro plano (t = 0) ao horizonte (t = 1)
    const bez = (a, b, c, d, t) => {
      const u = 1 - t;
      return [
        u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
        u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
      ];
    };
    const edgeL = (t) => bez([912.823, 259.6], [925.611, 231.746], [944.484, 219.151], [979.8, 207], t);
    const edgeR = (t) => bez([975.084, 259.6], [952.946, 243.585], [950.882, 225.4], [979.8, 207], t);
    // ponto a uma fração k da largura da pista (0 = borda esquerda, 1 = direita)
    const at = (t, k) => {
      const a = edgeL(t), b = edgeR(t);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    };
    const roadWidth = (t) => {
      const a = edgeL(t), b = edgeR(t);
      return Math.hypot(b[0] - a[0], b[1] - a[1]);
    };
    // perspectiva: distância real d (0 = perto, 1 = horizonte) → posição t na curva
    const depth = (d) => (1 - 1 / (1 + 3 * d)) / 0.75;
    const laneAt = (t) => 0.28 + 0.22 * t; // faixa central na mesma posição da logo

    // Faixas contínuas que afinam com a distância (laterais, sombras das bordas e marcas de pneu)
    const strip = (k1, k2) => {
      const a = [];
      const b = [];
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        a.push(at(t, k1));
        b.push(at(t, k2));
      }
      return "M" + a.concat(b.reverse()).map((p) => `${fmt(p[0])},${fmt(p[1])}`).join("L") + "Z";
    };
    const tracks = $(".cr-tracks", svg);
    const edges = $(".cr-edges", svg);
    const fogs = $(".cr-fogs", svg);
    [[0.1, 0.17], [0.56, 0.63], [0.78, 0.85]].forEach(([a, b]) => make(tracks, "path", { d: strip(a, b) }));
    [[0, 0.025], [0.975, 1]].forEach(([a, b]) => make(edges, "path", { d: strip(a, b) }));
    [[0.04, 0.07], [0.93, 0.96]].forEach(([a, b]) => make(fogs, "path", { d: strip(a, b) }));

    // Faixa tracejada com perspectiva (substitui os traços fixos da versão sem JS)
    const dashLayer = $(".cr-dashes", svg);
    const fixed = $(".cr-static", svg);
    if (fixed) fixed.remove();
    const COUNT = 16;
    const HALF = 0.55 / COUNT / 2;
    const dashes = Array.from({ length: COUNT }, () => make(dashLayer, "line", { "stroke-linecap": "butt" }));
    const drawDashes = (phase) => {
      dashes.forEach((el, i) => {
        const d = ((((i - phase) / COUNT) % 1) + 1) % 1;
        const t1 = depth(d - HALF);
        const t2 = depth(Math.min(1, d + HALF));
        const p1 = at(t1, laneAt(t1));
        const p2 = at(t2, laneAt(t2));
        el.setAttribute("x1", fmt(p1[0]));
        el.setAttribute("y1", fmt(p1[1]));
        el.setAttribute("x2", fmt(p2[0]));
        el.setAttribute("y2", fmt(p2[1]));
        el.setAttribute("stroke-width", fmt(roadWidth(depth(d)) * 0.045));
        el.setAttribute("opacity", fmt(1 - smooth(0.72, 1, d)));
      });
    };
    drawDashes(0.35);

    // Faróis de um carro que vem do horizonte, iluminando o asfalto à frente
    const lights = $(".cr-lights", svg);
    const pool = make(lights, "ellipse", { fill: "url(#crPool)" });
    const glows = [0, 1].map(() => make(lights, "circle", { fill: "url(#crGlow)" }));
    const cores = [0, 1].map(() => make(lights, "circle", { fill: "#FFFFFF" }));
    const car = { d: 1.1 };
    const drawCar = () => {
      const t = depth(car.d);
      const w = roadWidth(t);
      [0.63, 0.8].forEach((k, i) => {
        const p = at(t, k);
        [cores[i], glows[i]].forEach((el) => { el.setAttribute("cx", fmt(p[0])); el.setAttribute("cy", fmt(p[1])); });
        cores[i].setAttribute("r", fmt(w * 0.03));
        glows[i].setAttribute("r", fmt(w * 0.16));
      });
      const tp = depth(car.d - 0.08);
      const c = at(tp, 0.71);
      const a = edgeL(tp);
      const b = edgeR(tp);
      const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
      pool.setAttribute("cx", fmt(c[0]));
      pool.setAttribute("cy", fmt(c[1]));
      pool.setAttribute("rx", fmt(roadWidth(tp) * 0.3));
      pool.setAttribute("ry", fmt(roadWidth(tp) * 0.13));
      pool.setAttribute("transform", `rotate(${fmt(angle)} ${fmt(c[0])} ${fmt(c[1])})`);
      lights.setAttribute("opacity", fmt(smooth(1.1, 0.85, car.d)));
    };
    drawCar();

    if (!animated) return; // movimento reduzido: cena estática, sem faróis

    const mark = $(".cr-m", svg);
    const road = $(".cr-road", svg);
    const pave = $(".cr-pave", svg);
    const sheen = $(".cr-m-sheen", svg);

    gsap.set(mark, { opacity: 0, y: 10 });
    gsap.set(pave, { drawSVG: "0%" });
    gsap.set([tracks, fogs, dashLayer], { opacity: 0 });

    const state = { phase: 0.35 };
    const loops = [
      gsap.to(state, { phase: 1.35, duration: 0.6, ease: "none", repeat: -1, paused: true, onUpdate: () => drawDashes(state.phase) }),
      gsap.timeline({ repeat: -1, repeatDelay: 2.4, paused: true })
        .fromTo(car, { d: 1.1 }, { d: -0.3, duration: 4.8, ease: "none", onUpdate: drawCar }),
      gsap.fromTo(sheen, { x: 0 }, { x: 175, duration: 2.4, ease: "power2.inOut", repeat: -1, repeatDelay: 4.5, paused: true }),
    ];

    // Loops só rodam com a seção na tela (economiza CPU/bateria)
    let started = false;
    let visible = false;
    const sync = () => loops.forEach((l) => (started && visible ? l.play() : l.pause()));
    const viewport = ScrollTrigger.create({
      trigger: ".cta",
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => { visible = self.isActive; sync(); },
    });
    visible = viewport.isActive;

    // Entrada: o M surge e a estrada é pavimentada do primeiro plano até o horizonte
    gsap.timeline({ scrollTrigger: { trigger: ".cta", start: "top 70%", once: true } })
      .set(road, { opacity: 1 })
      .to(mark, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }, 0)
      .to(pave, { drawSVG: "100%", duration: 1.6, ease: "power2.inOut" }, 0.2)
      .to([tracks, fogs], { opacity: 1, duration: 0.8 }, 1.1)
      .to(dashLayer, { opacity: 1, duration: 0.6 }, 1.3)
      .add(() => { started = true; sync(); }, 1.4);

    // Leve profundidade na rolagem (o corte reto da estrada da logo fica sempre abaixo da seção)
    gsap.fromTo(".cta-symbol", { yPercent: 6 }, {
      yPercent: 0,
      ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
    });
  }

  /* ======================================================================
     Rodapé: —MENTOR— se desenha letra por letra
     ====================================================================== */
  function footerMark() {
    const letters = $$(".fm-letter");
    const rules = $$(".fm-rule");
    if (!letters.length) return;
    gsap.set(letters, { drawSVG: "0%", fillOpacity: 0 });
    gsap.set(rules, { scaleX: 0, transformOrigin: (i) => (i === 0 ? "100% 50%" : "0% 50%") });
    ScrollTrigger.create({
      trigger: ".footer-mark",
      start: "top 98%",
      once: true,
      onEnter: () => {
        gsap.timeline()
          .to(letters, { drawSVG: "100%", duration: 1.6, ease: "power2.inOut", stagger: 0.12 })
          .to(letters, { fillOpacity: 1, duration: 1.2, stagger: 0.12 }, 0.7)
          .to(rules, { scaleX: 1, duration: 1.2, ease: "power3.out" }, 0.3)
          .to(letters, { strokeOpacity: 0.35, duration: 1.2 }, 1.9);
      },
    });
  }

  /* ======================================================================
     Sem GSAP (fallback mínimo)
     ====================================================================== */
  function basicFallback() {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const setMenu = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      menu.hidden = !open;
      document.body.classList.toggle("no-scroll", open);
    };
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  }
})();
