// Motion, modelled on valmont.com: Lenis smooth scrolling, GSAP ScrollTrigger reveals,
// SplitType line and word reveals, image parallax and a header that hides while scrolling down.
// Everything is progressive: if the libraries fail to load or the viewer prefers reduced motion,
// the page stays fully visible and works as before.
(function () {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) { root.classList.remove('anim'); return; }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'expo.out', duration: 0.5 });
  ScrollTrigger.config({ ignoreMobileResize: true });

  const mobile = () => innerWidth < 768;
  const headH = () => parseFloat(getComputedStyle(document.getElementById('siteHeader')).height) || 110;

  // ---------- smooth wheel scrolling (touch stays native, so phones scroll as before) ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: mobile() ? 0.12 : 0.085, smoothWheel: true, syncTouch: false, wheelMultiplier: 1 });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // inner scrollers (quote card, lists, dialogs, menu) keep their own native scrolling
    const keepNative = () => document.querySelectorAll('.wz-panel > .card-body, .done-panel, textarea, .parsed, dialog, .mnav, .pk-body, .sent-body')
      .forEach(el => el.setAttribute('data-lenis-prevent', ''));
    keepNative();

    // pause page scrolling while the menu or a dialog is open
    const sync = () => {
      const locked = !document.getElementById('mnav').hidden || !!document.querySelector('dialog[open]');
      locked ? lenis.stop() : lenis.start();
    };
    new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden', 'open'] });

    // a finger on the screen cancels any glide in progress, so touch never fights the animation
    addEventListener('touchstart', () => { if (lenis.isScrolling === 'smooth') lenis.scrollTo(scrollY, { immediate: true }); }, { passive: true });

    // in-page links glide with Lenis, offset for the fixed header
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || a.hasAttribute('data-picker')) return;
      const id = a.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.start();
      lenis.scrollTo(target, { offset: id === '#top' ? 0 : -(headH() + 12), duration: 1.2 });
      history.pushState(null, '', id);
    });
  }

  // ---------- header: hide on scroll down, reveal on scroll up ----------
  const header = document.getElementById('siteHeader');
  let lastY = scrollY, upTravel = 0;
  const onScroll = () => {
    const y = scrollY;
    if (y < lastY) upTravel += lastY - y; else upTravel = 0;
    const menuOpen = !document.getElementById('mnav').hidden;
    if (y < 200 || menuOpen) header.classList.remove('is-hidden');
    else if (y > lastY) header.classList.add('is-hidden');
    else if (upTravel > 40) header.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  // focusing something in the header always brings it back
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  // ---------- hero on load: image unblurs and settles, then the lines rise in ----------
  const heroImg = document.querySelector('.hero > img');
  const heroLines = document.querySelectorAll('.hero-in');
  const playHero = () => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.to(heroImg, { filter: 'blur(0px)', scale: 1, duration: 0.9, clearProps: 'filter' })
      .fromTo(heroLines, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.09 }, '-=0.55')
      .add(() => root.classList.remove('anim'));
  };
  // On a slow connection don't hold the headline back for the photo: wait at most 1.2s.
  // If the page already gave up on the intro (libraries arrived late), leave the hero as it is.
  if (root.classList.contains('anim')) {
    const ready = heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();
    let played = false;
    const go = () => { if (!played) { played = true; requestAnimationFrame(playHero); } };
    ready.then(go); setTimeout(go, 1200);
  }

  // hero photo drifts slower than the page
  if (heroImg) gsap.to(heroImg, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.2 } });

  // ---------- scroll-scrubbed text reveals (valmont split.js settings) ----------
  let triggers = [], splits = [];
  const scrub = () => (mobile() ? 0.32 : 0.46);
  const span = () => Math.max(180, Math.round(innerHeight * (mobile() ? 0.27 : 0.39)));
  const hold = () => (mobile() ? 0.52 : 0.78);
  const start = 'top 98%';
  const reveal = (el, targets, from, dur, stagger) => {
    gsap.set(targets, from);
    const to = { duration: dur, stagger };
    Object.keys(from).forEach(k => { to[k] = k === 'yPercent' || k === 'y' ? 0 : 1; });
    const tl = gsap.timeline({ defaults: { ease: 'none' } }).to(targets, to).to({}, { duration: hold() });
    triggers.push(ScrollTrigger.create({ trigger: el, start, end: () => '+=' + span(), scrub: scrub(), animation: tl, invalidateOnRefresh: true }));
  };

  function buildText() {
    triggers.forEach(t => t.kill()); triggers = [];
    splits.forEach(s => s.revert()); splits = [];
    if (!window.SplitType) return;
    const m = mobile();

    // section titles: lines slide up
    document.querySelectorAll('main section:not(.hero) h2').forEach(h => {
      const st = new SplitType(h, { types: 'lines', tagName: 'span' }); splits.push(st);
      reveal(h, st.lines, { yPercent: 100, opacity: 0 }, m ? 0.85 : 1.1, m ? 0.055 : 0.1);
    });
    // small labels: letters fade in
    document.querySelectorAll('main .eyebrow').forEach(e => {
      const st = new SplitType(e, { types: 'chars', tagName: 'span' }); splits.push(st);
      reveal(e, st.chars, { opacity: 0 }, m ? 0.55 : 0.9, { amount: m ? 0.32 : 0.55 });
    });
    // intro paragraphs: words fade in
    document.querySelectorAll('main .head > p').forEach(p => {
      const st = new SplitType(p, { types: 'words', tagName: 'span' }); splits.push(st);
      reveal(p, st.words, { opacity: 0 }, m ? 0.55 : 0.95, { amount: m ? 0.45 : 0.85 });
    });
  }

  // ---------- images ----------
  function buildImages() {
    // large photos: parallax inside a clipped frame
    document.querySelectorAll('.px').forEach(frame => {
      const img = frame.querySelector('img');
      gsap.set(img, { scale: 1.12 });
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.2 } });
    });
    // step and buyer thumbnails fade in as they arrive (valmont listings1.js)
    document.querySelectorAll('.step img, .buyer img').forEach(img => {
      gsap.set(img, { opacity: 0 });
      const tl = gsap.timeline({ defaults: { ease: 'none' } }).to(img, { opacity: 1, duration: mobile() ? 0.65 : 0.95 }).to({}, { duration: hold() });
      ScrollTrigger.create({ trigger: img, start, end: () => '+=' + span(), scrub: scrub(), animation: tl });
    });
  }

  const init = () => { buildText(); buildImages(); ScrollTrigger.refresh(); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(init);
  addEventListener('load', () => ScrollTrigger.refresh());

  // re-split when the width changes (line breaks move)
  let w = innerWidth, rt = 0;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (innerWidth === w) return; w = innerWidth; buildText(); ScrollTrigger.refresh(); }, 200);
  });
})();
