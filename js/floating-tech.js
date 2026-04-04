/**
 * Onixera — Floating Tech Icons
 * Randomly drifting tech-themed SVG icons layered behind page content.
 * Respects prefers-reduced-motion.
 */

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── Icon library (inline SVG paths, 24×24 viewBox) ─────── */
  const ICONS = [
    {
      label: 'Monitor',
      path: `<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>`,
    },
    {
      label: 'Keyboard',
      path: `<rect x="2" y="7" width="20" height="14" rx="2"/>
             <path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01M6 15h.01M18 15h.01M10 15h4"/>`,
    },
    {
      label: 'Mouse',
      path: `<rect x="7" y="2" width="10" height="18" rx="5"/>
             <path d="M12 2v6M7 11h10"/>`,
    },
    {
      label: 'CPU',
      path: `<rect x="4" y="4" width="16" height="16" rx="2"/>
             <rect x="9" y="9" width="6" height="6"/>
             <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>`,
    },
    {
      label: 'Code',
      path: `<polyline points="16 18 22 12 16 6"/>
             <polyline points="8 6 2 12 8 18"/>`,
    },
    {
      label: 'Database',
      path: `<ellipse cx="12" cy="5" rx="9" ry="3"/>
             <path d="M21 12c0 1.657-4.03 3-9 3s-9-1.343-9-3"/>
             <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5"/>`,
    },
    {
      label: 'Wifi',
      path: `<path d="M5 12.55a11 11 0 0 1 14.08 0"/>
             <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
             <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
             <circle cx="12" cy="20" r="1" fill="currentColor"/>`,
    },
    {
      label: 'Terminal',
      path: `<polyline points="4 17 10 11 4 5"/>
             <line x1="12" y1="19" x2="20" y2="19"/>`,
    },
    {
      label: 'HardDrive',
      path: `<line x1="22" y1="12" x2="2" y2="12"/>
             <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
             <line x1="6" y1="16" x2="6.01" y2="16"/>
             <line x1="10" y1="16" x2="10.01" y2="16"/>`,
    },
    {
      label: 'Headphones',
      path: `<path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
             <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>`,
    },
    {
      label: 'Smartphone',
      path: `<rect x="5" y="2" width="14" height="20" rx="2"/>
             <line x1="12" y1="18" x2="12.01" y2="18"/>`,
    },
    {
      label: 'Globe',
      path: `<circle cx="12" cy="12" r="10"/>
             <line x1="2" y1="12" x2="22" y2="12"/>
             <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,
    },
  ];

  /* ── Config ──────────────────────────────────────────────── */
  const COUNT      = 18;   // total floating icons
  const SIZE_MIN   = 22;   // px
  const SIZE_MAX   = 52;
  const SPEED_MIN  = 18;   // seconds per full drift cycle
  const SPEED_MAX  = 42;
  const OPACITY_MIN = 0.045;
  const OPACITY_MAX = 0.13;

  /* ── Container ───────────────────────────────────────────── */
  const container = document.createElement('div');
  container.id = 'floating-tech-layer';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  /* ── Helpers ─────────────────────────────────────────────── */
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));

  function buildSVG(icon, size) {
    return `<svg xmlns="http://www.w3.org/2000/svg"
                 width="${size}" height="${size}"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.4"
                 stroke-linecap="round"
                 stroke-linejoin="round"
                 aria-label="${icon.label}">
              ${icon.path}
            </svg>`;
  }

  /* ── Spawn each icon ─────────────────────────────────────── */
  for (let i = 0; i < COUNT; i++) {
    const icon    = ICONS[i % ICONS.length];
    const size    = rand(SIZE_MIN, SIZE_MAX);
    const opacity = rand(OPACITY_MIN, OPACITY_MAX);
    const dur     = rand(SPEED_MIN, SPEED_MAX);
    const delay   = rand(0, -dur);        // negative delay = pre-started

    // Random start position across full page width, spread vertically
    const startX  = rand(0, 100);         // vw %
    const startY  = rand(0, 100);         // vh %

    // Drift offsets — how far it wanders during one cycle
    const driftX  = rand(-120, 120);      // px
    const driftY  = rand(-160, 160);
    const rot     = rand(-25, 25);        // deg

    const el = document.createElement('div');
    el.className = 'ft-icon';
    el.innerHTML = buildSVG(icon, size);

    el.style.cssText = `
      left:     ${startX}vw;
      top:      ${startY}vh;
      opacity:  ${opacity};
      --dx:     ${driftX}px;
      --dy:     ${driftY}px;
      --rot:    ${rot}deg;
      --dur:    ${dur}s;
      --del:    ${delay}s;
    `;

    container.appendChild(el);
  }
})();
