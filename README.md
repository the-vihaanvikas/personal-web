# Personal Web — a portfolio framework

A modular, single-file-config personal portfolio with a **liquid-glass** aesthetic
(Apple-style translucent surfaces), a subtle **space-inspired** accent (aurora
gradients, starfield, orbital motion), smooth page transitions, live **GitHub
statistics**, and a real **astronomical life audit** — computed from actual
ephemeris data in your browser.

Built with **Astro 5** — static-first, zero-JS by default, tiny bundles.

```
7 pages · 6 kB JS on non-stats pages · ~31 kB gz on /stats (astronomy engine)
```

## Pages

| Route        | Content                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `/`          | Hero with orbital visual, marquee, featured work, teaser, quick stats, CTA |
| `/about`     | Portrait card, long bio, "currently", principles, skills                |
| `/projects`  | Filterable glass project grid                                            |
| `/experience`| Timeline, education, résumé CTA                                          |
| `/stats`     | **Live GitHub stats** + **life/astronomy stats**                        |
| `/contact`   | mailto form, socials, live local-time clock                              |
| `/404`       | On-theme lost-in-space page                                              |

## Make it yours — one file

Everything personal lives in **`src/config/site.ts`**. Replace the `[PLACEHOLDER]`
tokens and the whole site updates:

- `name`, `tagline`, `bio`, `bioLong[]`, `email`, `location`, `timezone`
- `github.username` → live GitHub stats (stars, repos, activity, languages…)
- `birth.date` → life & astronomy stats (see below)
- `projects[]`, `experience[]`, `education[]`, `skills[]`, `currently{}`, `values[]`, `marquee[]`
- `socials`, `resumeUrl`, `availability`, `stats` (numeric demo values marked ⚠️)

### Live GitHub stats

- Reads the **public GitHub REST API** from the client; results are cached in
  `localStorage` for 20 minutes and fall back to cache on rate limits.
- Shows: profile, stars/forks/followers/repos, public commit count (search API),
  top repositories, language mix, recent activity feed, last activity.
- **Optional** — contribution heatmap, total contributions and streaks: create a
  `.env` file with a read-only fine-grained token:

  ```
  PUBLIC_GITHUB_TOKEN=github_pat_xxx
  ```

  The site then uses GitHub's **GraphQL** API for the contribution calendar.
  Without a token everything else still works.
- While `github.username` is a placeholder, the section shows a setup card with a
  “load sample account” preview (uses `site.github.demoUsername`).

### Life & astronomy stats

Set `birth.date` as **ISO-8601 with a UTC offset** — the offset matters (it
decides which moon phase you were born under):

```ts
birth: { date: '1997-08-19T14:32:00+05:30' },
```

Computed in-browser with [`astronomy-engine`](https://github.com/cosinekitty/astronomy)
(the same ephemeris math used in planetarium software), then cached for 6 h:

- exact age (y/m/d) with a **live seconds counter**
- moon phase at birth, **full & new moons witnessed**, full-moon birthdays
- **solar & lunar eclipses** witnessed (worldwide), next eclipse dates
- **planetary retrograde cycles** for Mercury → Neptune, % of your life each
  planet spent in apparent retrograde, next retrograde dates
- times Venus crossed your birth sky position, seasons turned, Sun rotations
- Friday the 13ths, leap days, prime-number ages
- **live cosmic travel**: km Earth has carried you, km the Solar System has
  travelled around the Milky Way, galactic-year progress, your light cone
- **live moon card**: current phase, illumination, real distance to the Moon
  (it visibly drifts), countdown to the next full moon

While `birth.date` is a placeholder, a setup card offers a sample-date preview.

## Design system

- **Liquid glass**: `backdrop-filter: blur + saturate`, 1px borders, inner
  top-highlight sheen, soft layered shadows, specular hover sweep, fine grain
  overlay (SVG turbulence).
- **Space accent**: fixed aurora colour fields + twinkling starfield behind
  everything, orbital hero system, cosmic gradient text, shooting details —
  kept subtle, never thematic.
- **Motion**: Astro view transitions (cross-fade + slide, shared header), hero
  load choreography, IntersectionObserver reveals with stagger, animated
  counters, scroll parallax + pointer tilt on the hero planet, marquee.
- **Both themes**: light and dark, persisted toggle + system preference,
  smooth theme transition, `theme-color` meta.
- **Accessibility**: `prefers-reduced-motion` disables all decorative motion,
  skip link, focus-visible rings, semantic landmarks, aria labels, contrast
  checked in both themes.

## Performance

- Zero-JS pages by default; islands only where needed (`/stats`).
- Self-hosted subset fonts (`Inter Variable` + `Instrument Serif`), preloaded,
  `unicode-range` slicing, `font-display: swap`.
- Astronomy engine is tree-shaken by Vite into ~31 kB gz, loaded only on `/stats`.
- GitHub/life data cached in `localStorage`; all computation client-side.
- SVG/CSS-only visuals — no image payloads.

## Commands

```bash
npm install        # install
npm run dev        # dev server → http://localhost:4321
npm run build      # static build → dist/
npm run preview    # preview the build
npm run check      # astro check (TS + a11y hints)
```

## Deploy

**GitHub Pages (included):** a ready-made workflow (`.github/workflows/deploy-pages.yml`)
builds the site and deploys it to `https://the-vihaanvikas.github.io/personal-web/`.
One-time setup in the repo settings:

1. **Settings → Pages → Build and deployment → Source → “GitHub Actions”**
   (the site is currently configured for the legacy Jekyll build, which cannot
   build an Astro project).
2. Push to `main` — the workflow builds with Node 22 and deploys `dist/`.

The Astro config bakes in the GitHub Pages subpath:

```js
// astro.config.mjs
base: process.env.ASTRO_BASE ?? '/personal-web',
```

- `ASTRO_BASE='' npm run dev` — serve from the root (local dev / sandbox previews)
- `ASTRO_BASE='/blog' npm run build` — any other subpath

**Other hosts:** Netlify, Vercel, Cloudflare Pages… build command `npm run build`,
output directory `dist`, and set `ASTRO_BASE=''` (or a subpath) as needed. Update
`site` in `astro.config.mjs` to your production URL. Add `PUBLIC_GITHUB_TOKEN` as
an environment variable if you want the contribution heatmap.

---

*Crafted among the stars — Astro, zero templates.*
