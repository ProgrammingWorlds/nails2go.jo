/* ============================================================
   NAILS2GO — script.js
   ============================================================ */

/* لازم أول سطر: بفعّل أنيميشن الظهور (لو JS وقع، الصور بتظهر عادي) */
document.documentElement.classList.add('js');

/* ✏️ EDIT YOUR LINKS HERE */
const WA_NUMBER  = '962799006389';
const WA_MESSAGE = "Hello Nails2go! 💅 I'd like to book a home appointment.";
const IG_URL     = 'https://www.instagram.com/nails2go.jo/';

const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

const G     = window.gsap || null;
const ST    = window.ScrollTrigger || null;
const RM    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = window.matchMedia('(hover: none)').matches;

if (G && ST) G.registerPlugin(ST);
if (G && window.ScrollToPlugin) G.registerPlugin(window.ScrollToPlugin);

/* ---------- Upgrade WhatsApp links ---------- */
 $$('.js-wa').forEach(a => (a.href = WA_LINK));

/* ---------- Footer year ---------- */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Split text into chars ---------- */
function splitChars(el) {
  if (!el) return [];
  const chars = [];
  (function walk(node) {
    Array.from(node.childNodes).forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'char';
          s.textContent = ch === ' ' ? '\u00A0' : ch;
          frag.appendChild(s);
          chars.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  })(el);
  return chars;
}

/* ============================================================
   3D RING — المسارات الـ 16 مكتوبة هنا واضحة (Images/1.png ... 16.png)
   ============================================================ */
const RING_IMAGES = [
  'Images/1.png',  'Images/2.png',  'Images/3.png',  'Images/4.png',
  'Images/5.png',  'Images/6.png',  'Images/7.png',  'Images/8.png',
  'Images/9.png',  'Images/10.png', 'Images/11.png', 'Images/12.png',
  'Images/13.png', 'Images/14.png', 'Images/15.png', 'Images/16.png'
];

(function buildRing() {
  const spinner = $('#ringSpinner');
  if (!spinner) return;
  const STEP = 360 / RING_IMAGES.length;
  RING_IMAGES.forEach((src, i) => {
    const fig = document.createElement('figure');
    fig.className = 'ring__item';
    fig.style.transform = `rotateY(${(i * STEP).toFixed(2)}deg) translateZ(var(--ring-r))`;
    fig.innerHTML = `<img src="${src}" alt="Nails2go nail look ${i + 1}" draggable="false">`;
    spinner.appendChild(fig);
  });
})();

/* ---------- Gallery captions (الصور نفسها بالـ HTML) ---------- */
(function decorateGallery() {
  $$('.g-item').forEach((fig, i) => {
    const n = String(i + 1).padStart(2, '0');
    fig.insertAdjacentHTML('beforeend', `
      <figcaption class="g-item__cap">
        <span>N2G · look ${n}</span>
        <span class="g-item__plus">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </span>
      </figcaption>`);
  });
})();

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
(function cursor() {
  if (TOUCH || RM) return;
  const dot = $('.cursor'), ring = $('.cursor-ring');
  if (!dot || !ring) return;
  document.body.classList.add('has-cursor');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, s = 1, ts = 1;
  addEventListener('mousemove', e => {
    x = e.clientX; y = e.clientY;
    dot.style.opacity = ring.style.opacity = 1;
  }, { passive: true });
  const HOT = 'a, button, .g-item, .ring, [data-hover]';
  document.addEventListener('mouseover', e => { if (e.target.closest(HOT)) ts = 2; });
  document.addEventListener('mouseout',  e => { if (e.target.closest(HOT)) ts = 1; });
  (function loop() {
    rx += (x - rx) * .16; ry += (y - ry) * .16; s += (ts - s) * .14;
    dot.style.transform  = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%) scale(${s.toFixed(3)})`;
    requestAnimationFrame(loop);
  })();
})();

/* ============================================================
   NAV
   ============================================================ */
const nav = $('#nav');
addEventListener('scroll', () => nav && nav.classList.toggle('is-scrolled', scrollY > 40), { passive: true });

(function menu() {
  const burger = $('#burger');
  if (!burger) return;
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
})();

 $$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    if (G && window.ScrollToPlugin) {
      G.to(window, { scrollTo: { y: target, offsetY: 64 }, duration: 1.1, ease: 'power3.inOut' });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ============================================================
   3D RING — auto-rotate + drag with momentum
   ============================================================ */
(function ringLoop() {
  const stage = $('#ringStage'), spinner = $('#ringSpinner'), ringEl = $('#ring');
  if (!stage || !spinner || !ringEl) return;

  let target = 0, current = 0, vel = 0, dragging = false, lastX = 0;
  const auto = RM ? 0 : 0.12;

  const size = () => {
    const vw = Math.min(window.innerWidth, 1680);
    ringEl.style.setProperty('--ring-r', Math.max(115, Math.min(580, vw * 0.35)) + 'px');
  };
  size();
  addEventListener('resize', size);

  stage.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; vel = 0;
    stage.classList.add('is-dragging');
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    target += dx * 0.35;
    vel = dx * 0.35;
  });
  const stop = () => { dragging = false; stage.classList.remove('is-dragging'); };
  addEventListener('pointerup', stop);
  addEventListener('pointercancel', stop);

  (function tick() {
    if (!dragging) { target += auto + vel; vel *= 0.94; }
    current += (target - current) * 0.085;
    spinner.style.transform = `translateZ(-40px) rotateX(-8deg) rotateY(${current.toFixed(3)}deg)`;
    requestAnimationFrame(tick);
  })();
})();

/* ============================================================
   PRELOADER + HERO INTRO
   ============================================================ */
function initFloatMouse() {
  if (TOUCH || !G) return;
  $$('.float').forEach(f => {
    const depth = parseFloat(f.dataset.depth || '20');
    const xTo = G.quickTo(f, 'x', { duration: .9, ease: 'power3' });
    const yTo = G.quickTo(f, 'y', { duration: .9, ease: 'power3' });
    addEventListener('mousemove', e => {
      xTo((e.clientX / innerWidth  - .5) * depth);
      yTo((e.clientY / innerHeight - .5) * depth);
    }, { passive: true });
  });
}

function heroIntro() {
  if (!G) return;
  const tl = G.timeline({ defaults: { ease: 'power4.out' } });
  tl.to('.nav', { y: 0, opacity: 1, duration: .8 }, 0)
    .to('.hero__eyebrow', { y: 0, opacity: 1, duration: .7 }, .05)
    .to('.hero__title-main .char', { yPercent: 0, opacity: 1, duration: 1.05, stagger: .04 }, .1)
    .to('.hero__script', { y: 0, opacity: 1, duration: .8 }, .4)
    .to('.hero__sub', { y: 0, opacity: 1, duration: .8 }, .5)
    .to('.hero__actions', { y: 0, opacity: 1, duration: .8 }, .6)
    .to('.hero__stats .stat', { y: 0, opacity: 1, duration: .7, stagger: .08 }, .68)
    .to('.float', { opacity: 1, y: 0, duration: 1, stagger: .1, ease: 'power3.out' }, .45)
    .to('.hero__badge', { opacity: 1, scale: 1, duration: .9, ease: 'back.out(1.6)' }, .8)
    .to('.hero__scroll', { opacity: 1, duration: .8 }, 1)
    .add(initFloatMouse, .6);
}

(function preloader() {
  const pre = $('#preloader');
  const finish = () => {
    if (pre) pre.remove();
    document.body.classList.remove('is-loading');
  };
  if (!pre) return;
  if (!G || RM) { finish(); return; }

  G.set('.nav', { y: -24, opacity: 0 });
  G.set('.hero__eyebrow, .hero__sub, .hero__actions', { y: 30, opacity: 0 });
  G.set('.hero__script', { y: 24, opacity: 0 });
  G.set('.hero__stats .stat', { y: 24, opacity: 0 });
  G.set('.float', { opacity: 0, y: 40 });
  G.set('.hero__badge', { opacity: 0, scale: .6 });
  G.set('.hero__scroll', { opacity: 0 });

  const preChars  = splitChars($('.preloader__word'));
  const heroChars = splitChars($('.hero__title-main'));
  G.set(preChars,  { yPercent: 120, opacity: 0 });
  G.set(heroChars, { yPercent: 120, opacity: 0 });

  const num = { v: 0 };
  const count = $('.preloader__count'), bar = $('.preloader__bar span');

  G.timeline()
    .to(preChars, { yPercent: 0, opacity: 1, duration: .7, stagger: .045, ease: 'power4.out' })
    .to(num, { v: 100, duration: 1.15, ease: 'power2.inOut', onUpdate: () => {
        const n = Math.round(num.v);
        if (count) count.textContent = `${n}%`;
        if (bar) bar.style.transform = `scaleX(${n / 100})`;
      } }, '-=.4')
    .to('.preloader__inner', { yPercent: -40, opacity: 0, duration: .45, ease: 'power2.in' }, '+=.1')
    .to('.preloader__panel--main',   { yPercent: -100, duration: .85, ease: 'power4.inOut' })
    .to('.preloader__panel--accent', { yPercent: -100, duration: .85, ease: 'power4.inOut' }, '-=.62')
    .add(heroIntro, '-=.55')
    .add(finish);
})();

/* ============================================================
   SCROLL ANIMATIONS
   ============================================================ */
(function initScrollFX() {
  if (!G || !ST || RM) return;

  $$('[data-reveal]').forEach(el => {
    G.fromTo(el, { y: 46, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  G.to('.hero__ghost', {
    yPercent: 26, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  $$('.float').forEach(f => {
    const sp = parseFloat(f.dataset.speed || '20');
    G.to(f, {
      yPercent: -sp, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  });

  const mainImg = $('.about__img-main'), smallImg = $('.about__img-small');
  if (mainImg) G.fromTo(mainImg, { clipPath: 'inset(0 0 100% 0)' }, {
    clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power4.inOut',
    scrollTrigger: { trigger: '.about', start: 'top 72%' }
  });
  if (smallImg) G.fromTo(smallImg, { clipPath: 'inset(100% 0 0 0)' }, {
    clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.inOut',
    scrollTrigger: { trigger: '.about', start: 'top 72%' }, delay: .15
  });

  $$('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count);
    const dec = +(el.dataset.decimals || 0);
    const suf = el.dataset.suffix || '';
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => G.to(obj, {
        v: end, duration: 1.8, ease: 'power2.out',
        onUpdate: () => (el.textContent = obj.v.toFixed(dec) + suf)
      })
    });
  });
})();

/* ============================================================
   GALLERY REVEAL — طريقة مضمونة 100%
   (ما في إخفاء مسبق يضيع — كل صورة بتظهر لما توصل شاشة)
   ============================================================ */
(function revealGallery() {
  const items = $$('.g-item');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  items.forEach(el => io.observe(el));
})();

/* ============================================================
   IMAGE GUARD — لو صورة ناقصة بيظهر مكانها placeholder باسمها
   وبيعمل refresh للأنيميشنات
   ============================================================ */
(function imageGuard() {
  $$('img').forEach(img => {
    if (img.id === 'lightboxImg') return;
    const fail = () => {
      const fig = img.closest('figure');
      if (fig) {
        fig.classList.add('img-fail');
        fig.dataset.file = img.getAttribute('src') || '';
      }
      console.warn('⚠️ صورة مش موجودة:', img.getAttribute('src'));
      if (ST) ScrollTrigger.refresh();
    };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener('error', fail);
    if (!img.complete) {
      img.addEventListener('load', () => { if (ST) ScrollTrigger.refresh(); }, { once: true });
    }
  });
})();

/* ============================================================
   TILT + MAGNETIC
   ============================================================ */
(function initTilt() {
  if (TOUCH || !G) return;
  $$('.svc-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - .5;
      const py = (e.clientY - r.top)  / r.height - .5;
      G.to(card, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, duration: .45, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () =>
      G.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1,.45)' }));
  });
})();

(function initMagnetic() {
  if (TOUCH || !G) return;
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      G.to(el, {
        x: (e.clientX - r.left - r.width  / 2) * .28,
        y: (e.clientY - r.top  - r.height / 2) * .28,
        duration: .4, ease: 'power3.out'
      });
    });
    el.addEventListener('mouseleave', () =>
      G.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
  });
})();

/* ============================================================
   LIGHTBOX — بيقرأ المسار من الصورة نفسها بالـ HTML
   ============================================================ */
(function lightbox() {
  const lb = $('#lightbox'), img = $('#lightboxImg'),
        cap = $('#lightboxCap'), cnt = $('#lightboxCount');
  if (!lb) return;
  const items = $$('.g-item'), total = items.length;
  let idx = 0;

  const show = i => {
    idx = (i + total) % total;
    const src = items[idx].querySelector('img').getAttribute('src');
    img.src = src;
    img.alt = `Nails2go look ${idx + 1}`;
    if (cap) cap.textContent = `Nails2go · look ${String(idx + 1).padStart(2, '0')}`;
    if (cnt) cnt.textContent = `${idx + 1} / ${total}`;
    if (G) G.fromTo(img, { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .45, ease: 'power3.out' });
  };
  const open = i => {
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    show(i);
  };
  const close = () => {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };

  items.forEach((it, i) => it.addEventListener('click', () => open(i)));
  $('#lbClose')?.addEventListener('click', close);
  $('#lbPrev')?.addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
  $('#lbNext')?.addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();

/* ============================================================
   BACK TO TOP
   ============================================================ */
 $('#toTop')?.addEventListener('click', () => {
  if (G && window.ScrollToPlugin) G.to(window, { scrollTo: 0, duration: 1, ease: 'power3.inOut' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
});

addEventListener('load', () => { if (ST) ScrollTrigger.refresh(); });