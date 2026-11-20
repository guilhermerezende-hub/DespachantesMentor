/* ==========================================================================
   Despachantes Mentor — interações e animações
   GSAP 3.15 · ScrollTrigger · SplitText · DrawSVG · MotionPath · ScrambleText · ScrollTo

   Conceito: a estrada do símbolo da marca é o fio condutor. No topo, a logo se
   desenha e a estrada é "pavimentada"; em "Como funciona", um carro percorre a
   estrada conforme a rolagem e acende cada etapa do atendimento.
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
    const msg = service
      ? `Olá! Vim pelo site da Despachantes Mentor e gostaria de solicitar: ${service}.`
      : "Olá! Vim pelo site da Despachantes Mentor e gostaria de um atendimento.";
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

  const fullKit = !!(window.ScrollToPlugin && window.SplitText && window.DrawSVGPlugin && window.MotionPathPlugin && window.ScrambleTextPlugin);
  if (fullKit) {
    gsap.registerPlugin(ScrollTrigger, window.ScrollToPlugin, window.SplitText, window.DrawSVGPlugin, window.MotionPathPlugin, window.ScrambleTextPlugin);
  } else {
    gsap.registerPlugin(ScrollTrigger);
  }
  const SplitText = window.SplitText;

  // "anim" só existe se o usuário não pediu movimento reduzido e o JS chegou a tempo
  const canAnimate = fullKit && root.classList.contains("anim");
  if (!canAnimate) root.classList.remove("anim");

  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  const finePointer = window.matchMedia("(pointer: fine)").matches;
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

    if (canAnimate) {
      heroIntro();
      heroScroll();
      marquee();
      reveals();
      serviceCards();
      pillars();
      counters();
      ctaSection();
      footerMark();

      const mm = gsap.matchMedia();
      mm.add("(min-width: 960px) and (pointer: fine)", () => {
        const cleanups = [heroTilt(), magneticButtons()];
        return () => cleanups.forEach((fn) => fn && fn());
      });
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
     HERO — a logo se desenha e a estrada é pavimentada
     ====================================================================== */
  function heroIntro() {
    const title = $(".hero-title");
    const items = $$("[data-hero-item]");
    const symbol = $(".hero-symbol");
    const mFill = $(".hs-m-fill");
    const mStroke = $(".hs-m-stroke");
    const roadMask = $(".hs-road-mask");
    const dashes = $$(".hs-dash");
    const stage = $$(".stage-core, .stage-ring, .stage-ticks");
    const floats = $$(".float-inner");
    const sweepLines = $$(".hero-sweep .sweep-line");
    const lane = $(".hero-sweep .sweep-lane");

    gsap.set([symbol, ".hero-sweep"], { opacity: 1 });
    gsap.set(mFill, { opacity: 0 });
    gsap.set(dashes, { opacity: 0 });
    gsap.set(lane, { opacity: 0 });

    // Título: palavras sobem de dentro de máscaras de linha
    let firstSplit = true;
    let idleStarted = false;
    SplitText.create(title, {
      type: "lines, words",
      mask: "lines",
      linesClass: "split-line",
      wordsClass: "split-word",
      autoSplit: true,
      onSplit(self) {
        title.classList.add("is-split");
        gsap.set(title, { opacity: 1 });
        const tween = gsap.fromTo(self.words, { yPercent: 120 }, {
          yPercent: 0,
          duration: 1.15,
          ease: "power4.out",
          stagger: 0.045,
          delay: firstSplit ? 0.3 : 0,
        });
        firstSplit = false;
        if (idleStarted) titleSheen();
        return tween;
      },
    });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.05 });
    tl.fromTo(".header-inner", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0)
      .fromTo(sweepLines, { drawSVG: "0%" }, { drawSVG: "100%", duration: 2.4, ease: "power2.inOut", stagger: 0.2 }, 0)
      .to(lane, { opacity: 1, duration: 1.2 }, 1)
      .fromTo(stage, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, stagger: 0.12, ease: "expo.out" }, 0.1)
      .fromTo(mStroke, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.6, ease: "power2.inOut" }, 0.25)
      .fromTo(roadMask, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.3, ease: "power2.inOut" }, 0.85)
      .to(mFill, { opacity: 1, duration: 1 }, 1.3)
      .to(mStroke, { opacity: 0, duration: 0.9 }, 1.6)
      .to(dashes, { opacity: 1, duration: 0.3, stagger: 0.1, ease: "none" }, 1.45)
      .fromTo(items, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1 }, 0.55)
      .fromTo(floats, { y: 34, scale: 0.82, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 1, stagger: 0.14, ease: "back.out(1.6)" }, 1.5)
      .fromTo(".marquee", { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, ease: "expo.out" }, 1.1)
      .add(scramblePlate, 1.6)
      .add(() => { idleStarted = true; heroIdle(dashes); });

    const plate = $("[data-plate]");
    if (plate && finePointer) plate.addEventListener("pointerenter", scramblePlate);
  }

  function scramblePlate() {
    const code = $("[data-plate-code]");
    if (!code || gsap.isTweening(code)) return;
    gsap.to(code, {
      duration: 1.5,
      ease: "none",
      scrambleText: { text: "MNT0R26", chars: "ABCDEFGHJKLMNPRSTUVWXYZ0123456789", revealDelay: 0.35, speed: 0.55 },
    });
  }

  let sheenTween = null;
  function titleSheen() {
    if (sheenTween) sheenTween.kill();
    const words = $$(".hero-title .text-metal .split-word");
    if (!words.length) return;
    sheenTween = gsap.to(words, {
      backgroundPosition: "100% 0%",
      duration: 2.4,
      ease: "sine.inOut",
      stagger: 0.08,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2.5,
    });
  }

  function heroIdle(dashes) {
    const loops = [
      gsap.to(".float-inner--plate", { y: -10, rotation: -2, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 }),
      gsap.to(".float-inner--a", { y: -12, duration: 2.9, ease: "sine.inOut", yoyo: true, repeat: -1 }),
      gsap.to(".float-inner--b", { y: 11, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 }),
      gsap.to(".stage-ticks", { rotation: 360, duration: 160, ease: "none", repeat: -1 }),
      gsap.to(".sweep-lane", { strokeDashoffset: -84, duration: 2.6, ease: "none", repeat: -1 }),
      // faixas da estrada "piscando" para frente, como faróis em movimento
      gsap.timeline({ repeat: -1, repeatDelay: 1.4 })
        .to(dashes, { opacity: 0.25, duration: 0.22, stagger: 0.11, ease: "power1.in" })
        .to(dashes, { opacity: 1, duration: 0.45, stagger: 0.11, ease: "power1.out" }, 0.22),
    ];
    titleSheen();
    playWhileVisible(".hero", () => loops.concat(sheenTween || []));
  }

  // Pausa animações contínuas quando a seção sai da tela (economiza CPU/bateria)
  function playWhileVisible(trigger, getAnims) {
    const set = (active) => getAnims().forEach((a) => a.paused(!active));
    const st = ScrollTrigger.create({
      trigger,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => set(self.isActive),
    });
    set(st.isActive);
  }

  function heroScroll() {
    const st = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    gsap.to(".hero-visual", { yPercent: 14, ease: "none", scrollTrigger: st });
    gsap.to(".hero-glow", { yPercent: 16, ease: "none", scrollTrigger: { ...st } });
  }

  function heroTilt() {
    const hero = $(".hero");
    const wrap = $(".hero-symbol-wrap");
    if (!hero || !wrap) return null;
    gsap.set(wrap, { transformPerspective: 900 });
    const rx = gsap.quickTo(wrap, "rotationX", { duration: 1, ease: "power3" });
    const ry = gsap.quickTo(wrap, "rotationY", { duration: 1, ease: "power3" });
    const layers = $$(".float").map((el) => ({
      x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3" }),
      y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3" }),
      depth: Number(el.dataset.depth) || 20,
    }));

    const move = (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * 18);
      rx(-ny * 14);
      layers.forEach((l) => { l.x(nx * l.depth); l.y(ny * l.depth); });
    };
    const leave = () => {
      rx(0); ry(0);
      layers.forEach((l) => { l.x(0); l.y(0); });
    };
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", leave);
    return () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
    };
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
     Faixa de serviços: acelera e muda de sentido com a rolagem
     ====================================================================== */
  function marquee() {
    const track = $(".marquee-track");
    if (!track) return;
    const loop = gsap.to(track, { xPercent: -50, duration: 46, ease: "none", repeat: -1 });
    loop.totalTime(loop.duration() * 200); // permite rodar "para trás" sem chegar ao início

    let dir = 1;
    ScrollTrigger.create({
      trigger: ".marquee",
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => loop.paused(!self.isActive),
      onUpdate(self) {
        const v = self.getVelocity();
        if (Math.abs(v) < 10) return;
        dir = v < 0 ? -1 : 1;
        gsap.to(loop, {
          timeScale: dir * gsap.utils.clamp(1, 7, Math.abs(v) / 220),
          duration: 0.25,
          overwrite: true,
          onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.4, ease: "power2.out", overwrite: true }),
        });
      },
    });
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
     Serviços: ícones se desenham, checklist do destaque
     ====================================================================== */
  function serviceCards() {
    $$(".svc-card").forEach((card) => {
      const shapes = $$(".svc-icon > *", card);
      if (!shapes.length) return;
      gsap.set(shapes, { drawSVG: "0%" });
      ScrollTrigger.create({
        trigger: card,
        start: "top 85%",
        once: true,
        onEnter: () => gsap.to(shapes, { drawSVG: "100%", duration: 1.2, ease: "power2.inOut", stagger: 0.1, delay: 0.35 }),
      });
      if (finePointer) {
        card.addEventListener("pointerenter", () => {
          gsap.fromTo(shapes, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.9, ease: "power2.inOut", stagger: 0.07, overwrite: true });
        });
      }
    });

    const checks = $$(".feat-list .check path");
    if (checks.length) {
      gsap.set(checks, { drawSVG: "0%" });
      ScrollTrigger.create({
        trigger: ".feat-list",
        start: "top 88%",
        once: true,
        onEnter: () => gsap.to(checks, { drawSVG: "100%", duration: 0.6, ease: "power2.out", stagger: 0.28, delay: 0.45 }),
      });
    }

    gsap.fromTo(".feat-deco", { yPercent: 12 }, {
      yPercent: -8,
      ease: "none",
      scrollTrigger: { trigger: ".svc-card--featured", start: "top bottom", end: "bottom top", scrub: true },
    });
  }

  /* ======================================================================
     COMO FUNCIONA — o carro percorre a estrada com a rolagem
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
     Chamada final: símbolo gigante desenhado pela rolagem
     ====================================================================== */
  function ctaSection() {
    gsap.fromTo(".cta-line", { drawSVG: "0%" }, {
      drawSVG: "100%",
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: ".cta", start: "top 80%", end: "center 45%", scrub: 0.8 },
    });
    gsap.fromTo(".cta-fill", { opacity: 0 }, {
      opacity: 1,
      ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top 45%", end: "center 30%", scrub: true },
    });
    gsap.fromTo(".cta-symbol", { yPercent: 10 }, {
      yPercent: -6,
      ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
    });
    const lane = gsap.to(".cta-lane", { strokeDashoffset: -44, duration: 1.6, ease: "none", repeat: -1 });
    playWhileVisible(".cta", () => [lane]);
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
