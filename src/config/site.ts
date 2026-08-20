/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PERSONAL SITE — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything personal lives in this one file. Replace every `[PLACEHOLDER]`
 *  with your real details and the whole site updates — no other file needs
 *  touching for content.
 *
 *  Quick start:
 *    1. name / tagline / bio / email / location
 *    2. github.username  → live GitHub stats on /stats
 *    3. birth.date       → life & astronomy stats on /stats
 *    4. projects[]       → shown on Home + /projects
 *    5. experience[]     → shown on /experience
 *
 *  Notes:
 *    • `birth.date` must be ISO-8601 WITH a UTC offset, e.g.
 *      "1996-04-12T09:30:00+05:30" — the offset matters for moon phases.
 *    • Numbers marked ⚠️ are demo placeholders; replace them with your own.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const site = {
  /* ── Identity ──────────────────────────────────────────────────────────── */
  name: '[NAME]', // e.g. 'Vihaan Vikas'
  initials: '[INITIALS]', // e.g. 'VV' — used in the avatar monogram
  tagline: '[TAGLINE]', // one line, e.g. 'Design-minded software engineer'
  bio: '[BIO]', // short hero paragraph
  bioLong: [
    // 2–4 paragraphs for /about
    '[BIO_PARAGRAPH_1]',
    '[BIO_PARAGRAPH_2]',
    '[BIO_PARAGRAPH_3]',
  ],
  email: '[EMAIL]',
  location: '[LOCATION]', // e.g. 'New Delhi, India'
  timezone: '[TIMEZONE]', // IANA name, e.g. 'Asia/Kolkata' (used for the live clock)
  availability: true, // shows the "available" pill in the hero
  availabilityNote: '[AVAILABILITY_NOTE]', // e.g. 'Open to freelance & full-time'

  /* ── Links & socials ───────────────────────────────────────────────────── */
  resumeUrl: '[RESUME_URL]', // link to your résumé / CV
  socials: {
    github: 'https://github.com/[GITHUB_USERNAME]',
    twitter: '[TWITTER_URL]', // or X
    linkedin: '[LINKEDIN_URL]',
    mastodon: '[MASTODON_URL]',
  },

  /* ── GitHub (drives the live stats on /stats) ──────────────────────────── */
  github: {
    username: '[GITHUB_USERNAME]', // e.g. 'vihaanvikas'
    // Used by the "preview with sample data" button in the UI.
    demoUsername: 'sindresorhus',
  },

  /* ── Life & astronomy (drives the life stats on /stats) ────────────────── */
  birth: {
    // ISO-8601 with UTC offset. Example: '1997-08-19T14:32:00+05:30'
    date: '[BIRTH_DATE]',
    // Used by the "preview with sample data" button in the UI.
    sampleDate: '1997-08-19T14:32:00+05:30',
  },

  /* ── Home hero quick stats (⚠️ numeric placeholders — replace) ─────────── */
  stats: {
    yearsExperience: 5, // ⚠️ e.g. years of professional experience
    technologies: 12, // ⚠️ e.g. number of technologies you work with
    cupsOfTeaPerDay: 4, // ⚠️ optional lighthearted stat — change or delete
    projectsBuilt: 0, // auto-filled from projects.length below — leave 0
  },

  /* ── "Currently" section on /about (⚠️ placeholders) ───────────────────── */
  currently: {
    building: '[CURRENTLY_BUILDING]',
    learning: '[CURRENTLY_LEARNING]',
    reading: '[CURRENTLY_READING]',
    listening: '[CURRENTLY_LISTENING]',
  },

  /* ── Values / principles shown on /about (⚠️ placeholders) ─────────────── */
  values: [
    { title: '[VALUE_1_TITLE]', description: '[VALUE_1_DESCRIPTION]', glyph: '✦' },
    { title: '[VALUE_2_TITLE]', description: '[VALUE_2_DESCRIPTION]', glyph: '◐' },
    { title: '[VALUE_3_TITLE]', description: '[VALUE_3_DESCRIPTION]', glyph: '∞' },
  ],

  /* ── Skills with proficiency (0–100, ⚠️ placeholders) ───────────────────── */
  skills: [
    { name: 'TypeScript', level: 90 },
    { name: 'React / Next.js', level: 85 },
    { name: 'Node.js', level: 80 },
    { name: 'UI design', level: 75 },
    { name: 'Rust', level: 60 },
  ],

  /* ── Tools & interests marquee (⚠️ placeholders) ───────────────────────── */
  marquee: [
    'TypeScript',
    'React',
    'Astro',
    'Node.js',
    'Rust',
    'Design systems',
    'Typography',
    'Space',
    'Open source',
    'Coffee',
  ],

  /* ── Projects (⚠️ placeholder entries — replace the whole array) ───────── */
  projects: [
    {
      title: '[PROJECT 1 — TITLE]',
      description: '[PROJECT_1_SHORT_DESCRIPTION]',
      year: '2026',
      status: 'Featured', // Featured | Open source | In progress | Archived
      tags: ['[TAG]', '[TAG]', '[TAG]'],
      glyph: '✦', // decorative glyph shown on the card cover
      accent: ['#6366f1', '#22d3ee'], // two colors for the card gradient
      liveUrl: '[LIVE_URL]',
      repoUrl: '[REPO_URL]',
      highlights: ['[HIGHLIGHT_1]', '[HIGHLIGHT_2]'],
    },
    {
      title: '[PROJECT 2 — TITLE]',
      description: '[PROJECT_2_SHORT_DESCRIPTION]',
      year: '2025',
      status: 'Open source',
      tags: ['[TAG]', '[TAG]'],
      glyph: '◐',
      accent: ['#a855f7', '#6366f1'],
      liveUrl: '[LIVE_URL]',
      repoUrl: '[REPO_URL]',
      highlights: ['[HIGHLIGHT_1]'],
    },
    {
      title: '[PROJECT 3 — TITLE]',
      description: '[PROJECT_3_SHORT_DESCRIPTION]',
      year: '2025',
      status: 'In progress',
      tags: ['[TAG]', '[TAG]'],
      glyph: '∞',
      accent: ['#f59e0b', '#ef4444'],
      liveUrl: '[LIVE_URL]',
      repoUrl: '[REPO_URL]',
      highlights: ['[HIGHLIGHT_1]'],
    },
    {
      title: '[PROJECT 4 — TITLE]',
      description: '[PROJECT_4_SHORT_DESCRIPTION]',
      year: '2024',
      status: 'Archived',
      tags: ['[TAG]', '[TAG]'],
      glyph: '♢',
      accent: ['#10b981', '#22d3ee'],
      liveUrl: '[LIVE_URL]',
      repoUrl: '[REPO_URL]',
      highlights: ['[HIGHLIGHT_1]'],
    },
  ],

  /* ── Experience (⚠️ placeholder entries — replace the whole array) ─────── */
  experience: [
    {
      role: '[ROLE]',
      company: '[COMPANY]',
      period: '[PERIOD]', // e.g. '2023 — Present'
      current: true,
      location: '[LOCATION]',
      summary: '[EXPERIENCE_SUMMARY]',
      bullets: ['[BULLET_1]', '[BULLET_2]', '[BULLET_3]'],
      tags: ['[TAG]', '[TAG]', '[TAG]'],
    },
    {
      role: '[ROLE]',
      company: '[COMPANY]',
      period: '[PERIOD]',
      current: false,
      location: '[LOCATION]',
      summary: '[EXPERIENCE_SUMMARY]',
      bullets: ['[BULLET_1]', '[BULLET_2]'],
      tags: ['[TAG]', '[TAG]'],
    },
    {
      role: '[ROLE]',
      company: '[COMPANY]',
      period: '[PERIOD]',
      current: false,
      location: '[LOCATION]',
      summary: '[EXPERIENCE_SUMMARY]',
      bullets: ['[BULLET_1]', '[BULLET_2]', '[BULLET_3]'],
      tags: ['[TAG]', '[TAG]'],
    },
  ],

  /* ── Education (⚠️ placeholder entries) ─────────────────────────────────── */
  education: [
    {
      school: '[SCHOOL / UNIVERSITY]',
      degree: '[DEGREE]',
      period: '[PERIOD]',
      note: '[NOTE_OR_HONORS]',
    },
  ],
};

export type SiteConfig = typeof site;

/** True while any personal placeholder is still unfilled. */
export const isPlaceholder = (value: string | null | undefined): boolean =>
  !value || /^\[[A-Z0-9_ ]+\]$/.test(value.trim());

/** True if a link still contains an unfilled placeholder token. */
export const isPlaceholderLink = (href: string | null | undefined): boolean =>
  !href || href.includes('[');

export const hasGithubUsername = !isPlaceholder(site.github.username);
export const hasBirthDate = !isPlaceholder(site.birth.date);

/** Social links that are safe to render (placeholders filtered out). */
export const socialLinks = Object.entries(site.socials)
  .map(([label, href]) => ({ label, href }))
  .filter((s) => !isPlaceholderLink(s.href));
