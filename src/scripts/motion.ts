/**
 * Global motion & interaction layer.
 *
 * • Reveal-on-scroll (IntersectionObserver, staggered via --d)
 * • Animated counters ([data-counter])
 * • Header scroll state, mobile menu, back-to-top
 * • Hero orbit tilt + parallax
 *
 * Re-initialises after every Astro view transition (astro:page-load).
 * Respects prefers-reduced-motion everywhere.
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let revealObserver: IntersectionObserver | null = null;
let counterObserver: IntersectionObserver | null = null;

function getRevealObserver(): IntersectionObserver {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver!.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
  }
  return revealObserver;
}

function getCounterObserver(): IntersectionObserver {
  if (!counterObserver) {
    counterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            runCounter(entry.target as HTMLElement);
            counterObserver!.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );
  }
  return counterObserver;
}

function runCounter(el: HTMLElement): void {
  const to = parseFloat(el.dataset.counter ?? '0');
  const decimals = parseInt(el.dataset.decimals ?? '0', 10);
  const duration = parseInt(el.dataset.duration ?? '1400', 10);
  const prefix = el.dataset.prefix ?? '';
  const suffix = el.dataset.suffix ?? '';
  const compact = el.dataset.compact === 'true';

  const fmt = (v: number) => {
    const n = compact ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v) : v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return prefix + n + suffix;
  };

  if (reduced) {
    el.textContent = fmt(to);
    return;
  }

  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(2, -10 * t); // easeOutExpo
    el.textContent = fmt(to * (t === 1 ? 1 : eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initReveals(root: ParentNode = document): void {
  const els = root.querySelectorAll<HTMLElement>('[data-reveal]:not(.revealed)');
  if (reduced) {
    els.forEach((el) => el.classList.add('revealed'));
    return;
  }
  els.forEach((el) => getRevealObserver().observe(el));
}

function initCounters(root: ParentNode = document): void {
  const els = root.querySelectorAll<HTMLElement>('[data-counter]:not([data-counter-done])');
  if (reduced) {
    els.forEach((el) => {
      runCounter(el);
      el.dataset.counterDone = 'true';
    });
    return;
  }
  els.forEach((el) => getCounterObserver().observe(el));
}

function initHeader(root: ParentNode = document): void {
  const header = root.querySelector<HTMLElement>('#site-header');
  if (!header || header.dataset.headerInited === 'true') return;
  header.dataset.headerInited = 'true';

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
    const toTop = document.querySelector<HTMLElement>('#to-top');
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toTop = document.querySelector<HTMLElement>('#to-top');
  if (toTop && !toTop.dataset.toTopInited) {
    toTop.dataset.toTopInited = 'true';
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  const burger = header.querySelector<HTMLButtonElement>('#nav-toggle');
  const menu = header.querySelector<HTMLElement>('#nav-menu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.classList.toggle('is-active', open);
    });
    menu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.classList.remove('is-active');
      }),
    );
  }
}

function initOrbit(root: Document | DocumentFragment = document): void {
  const stage = root.querySelector<HTMLElement>('.orbit-stage');
  if (!stage || stage.dataset.orbitInited === 'true') return;
  stage.dataset.orbitInited = 'true';

  if (reduced || window.matchMedia('(pointer: coarse)').matches) return;

  const planet = stage.querySelector<HTMLElement>('.orbit-planet');
  if (!planet) return;

  let raf = 0;
  let tx = 0;
  let ty = 0;

  const onMove = (e: PointerEvent) => {
    const rect = stage.getBoundingClientRect();
    tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(apply);
  };

  const apply = () => {
    planet.style.transform = `rotateX(${(-ty * 7).toFixed(2)}deg) rotateY(${(tx * 10).toFixed(2)}deg)`;
    raf = 0;
  };

  const onLeave = () => {
    planet.style.transform = '';
    tx = 0;
    ty = 0;
  };

  stage.addEventListener('pointermove', onMove, { passive: true });
  stage.addEventListener('pointerleave', onLeave, { passive: true });

  // gentle parallax on scroll
  let parallax = 0;
  let lastY = window.scrollY;
  const onScroll = () => {
    const dy = window.scrollY - lastY;
    lastY = window.scrollY;
    parallax = Math.max(-46, Math.min(46, parallax + dy * 0.12));
    stage.style.setProperty('--parallax', `${parallax.toFixed(1)}px`);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initTiltables(root: ParentNode = document): void {
  // subtle lift for project covers on hover is pure CSS; nothing to do here
  void root;
}

function boot(): void {
  initReveals();
  initCounters();
  initHeader();
  initOrbit();
  initTiltables();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

// Re-run after view transitions swap in new DOM
document.addEventListener('astro:page-load', () => {
  boot();
  initReveals(document);
  initCounters(document);
  initHeader(document);
  initOrbit(document);
});
