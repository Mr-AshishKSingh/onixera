/**
 * Onixera — Scroll Interactions & Page Animations
 * Runs independently, zero conflict with main.js
 */

/* ─────────────────────────────────────────────────────────
   1. Scroll Progress Bar
   ───────────────────────────────────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-bar');
  if (!bar) return;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    bar.style.transform = `scaleX(${window.scrollY / max})`;
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ─────────────────────────────────────────────────────────
   2. Animated Number Counters
   ───────────────────────────────────────────────────────── */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;

  const ob = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      ob.unobserve(entry.target);
      runCounter(entry.target);
    });
  }, { threshold: 0.6 });

  els.forEach(el => ob.observe(el));
}

function runCounter(el) {
  const target  = parseFloat(el.dataset.count);
  const suffix  = el.dataset.suffix || '';
  const dur     = 1800;
  const start   = performance.now();
  const parent  = el.closest('.stat-card');

  const tick = (now) => {
    const t      = Math.min((now - start) / dur, 1);
    const eased  = 1 - Math.pow(1 - t, 3);      // ease-out cubic
    const value  = t < 1 ? Math.floor(eased * target) : target;
    el.textContent = value + suffix;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // pop animation when number lands
      if (parent) {
        parent.classList.add('counted');
        setTimeout(() => parent.classList.remove('counted'), 500);
      }
    }
  };
  requestAnimationFrame(tick);
}

/* ─────────────────────────────────────────────────────────
   3. Cursor Spotlight on Cards
   ───────────────────────────────────────────────────────── */
function initCursorSpotlight() {
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch

  const cards = document.querySelectorAll(
    '.service-card, .announcement-card, .value-item'
  );

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--mx', '-200px');
      card.style.setProperty('--my', '-200px');
    });
  });
}

/* ─────────────────────────────────────────────────────────
   4. Hero Parallax — content drifts slower than scroll
   ───────────────────────────────────────────────────────── */
function initParallax() {
  const hero = document.querySelector('.hero-minimal');
  if (!hero) return;

  // Delay until section-reveal animation completes (700ms)
  setTimeout(() => {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const heroH    = hero.offsetHeight;
      if (scrolled > heroH * 1.2) return;

      // Fade hero slightly as it leaves viewport
      const progress = Math.min(scrolled / heroH, 1);
      hero.style.opacity = String(1 - progress * 0.35);
    }, { passive: true });
  }, 800);
}

/* ─────────────────────────────────────────────────────────
   5. Floating Particles (canvas) in Hero
   ───────────────────────────────────────────────────────── */
function initParticles() {
  const hero = document.querySelector('.hero-minimal');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'hero-particles-canvas';
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], rafId;

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x     = Math.random() * W;
      this.y     = initial ? Math.random() * H : H + 8;
      this.vx    = (Math.random() - 0.5) * 0.25;
      this.vy    = -(Math.random() * 0.35 + 0.08);
      this.r     = Math.random() * 1.4 + 0.4;
      this.alpha = Math.random() * 0.45 + 0.08;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -8) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
      ctx.fill();
    }
  }

  resize();
  for (let i = 0; i < 55; i++) particles.push(new Particle());
  window.addEventListener('resize', resize, { passive: true });

  function frame() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    rafId = requestAnimationFrame(frame);
  }
  frame();

  // Stop animating when hero is far out of view (perf)
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      cancelAnimationFrame(rafId);
    } else {
      frame();
    }
  }, { rootMargin: '200px' }).observe(hero);
}

/* ─────────────────────────────────────────────────────────
   6. Section Heading Underline Draw-in
   ───────────────────────────────────────────────────────── */
function initSectionUnderlines() {
  const headings = document.querySelectorAll(
    '.section-header h2, .section-head h2, .featured-content h2'
  );
  if (!headings.length) return;

  const ob = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      ob.unobserve(entry.target);
      entry.target.classList.add('heading-revealed');
    });
  }, { threshold: 0.5 });

  headings.forEach(h => ob.observe(h));
}

/* ─────────────────────────────────────────────────────────
   7. Active Nav Link on Scroll
   ───────────────────────────────────────────────────────── */
function initActiveNav() {
  const sections  = document.querySelectorAll('main [id]');
  const navLinks  = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const ob = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('nav-active', link.getAttribute('href') === id);
      });
    });
  }, { rootMargin: '-25% 0px -65% 0px' });

  sections.forEach(s => ob.observe(s));
}

/* ─────────────────────────────────────────────────────────
   8. Back-to-Top Button
   ───────────────────────────────────────────────────────── */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('btt-visible', window.scrollY > 480);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ─────────────────────────────────────────────────────────
   9. Tilt-on-hover for service & stat cards (subtle 3-D)
   ───────────────────────────────────────────────────────── */
function initCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.service-card, .stat-card');
  const MAX   = 6; // max degrees

  cards.forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange     = 'transform';

    card.addEventListener('mousemove', (e) => {
      const r  = card.getBoundingClientRect();
      const x  = ((e.clientX - r.left)  / r.width  - 0.5) * MAX * 2;
      const y  = ((e.clientY - r.top)   / r.height - 0.5) * MAX * 2;
      card.style.transform = `perspective(600px) rotateX(${-y}deg) rotateY(${x}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─────────────────────────────────────────────────────────
   10. Smooth anchor scroll offset (clear of sticky header)
   ───────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 90; // header height + breathing room
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────────────────
   11. Typewriter reveal for hero headline words
   ───────────────────────────────────────────────────────── */
function initHeroTextReveal() {
  const subtitle = document.querySelector('.hero-subtitle');
  if (!subtitle) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const words = subtitle.textContent.split(' ');
  subtitle.innerHTML = words
    .map((w, i) =>
      `<span class="hero-word" style="--wi:${i}">${w}</span>`
    )
    .join(' ');
}

/* ─────────────────────────────────────────────────────────
   Init all
   ───────────────────────────────────────────────────────── */
function init() {
  initScrollProgress();
  initCounters();
  initCursorSpotlight();
  initParallax();
  initParticles();
  initSectionUnderlines();
  initActiveNav();
  initBackToTop();
  initCardTilt();
  initSmoothScroll();
  initHeroTextReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
