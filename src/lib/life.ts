/**
 * Life & astronomy statistics engine.
 *
 * Uses real celestial mechanics (astronomy-engine) to compute genuinely
 * interesting time-and-space facts since a birth date:
 *
 *  • exact age (years / months / days) and live seconds lived
 *  • moon phase at birth, full & new moons witnessed, next full moon
 *  • solar & lunar eclipses witnessed (worldwide), next eclipse
 *  • planetary retrograde cycles (Mercury … Neptune) + time spent retrograde
 *  • Venus returns to the exact sky position of your birth
 *  • solstices / equinoxes (seasons) witnessed
 *  • calendar curiosities: weekday of birth, Friday the 13ths, leap days,
 *    prime-number ages, full-moon birthdays
 *  • cosmic travel: distance Earth has carried you, distance the Solar
 *    System has travelled around the Milky Way, galactic-year progress,
 *    your light cone
 *  • live: moon illumination, distance to the moon, seconds lived
 *
 * The heavy computation runs once, in chunks (so the UI never janks), and
 * the result is cached in localStorage keyed by birth date.
 */

import {
  MakeTime,
  MoonPhase,
  Illumination,
  SearchMoonPhase,
  SearchGlobalSolarEclipse,
  SearchLunarEclipse,
  Seasons,
  GeoVector,
  Ecliptic,
  Body,
  KM_PER_AU,
} from 'astronomy-engine';

/* ---------- types ---------- */

export interface MoonInfo {
  phaseDeg: number;
  phaseName: string;
  illumination: number; // 0..1
  distanceKm: number;
}

export interface PlanetRetro {
  planet: string;
  count: number;
  fraction: number; // fraction of life in apparent retrograde
  nextRetroStart: Date | null;
}

export interface LifeStats {
  birth: Date;
  now: Date;

  // time lived
  years: number;
  months: number;
  days: number;
  seconds: number; // total, computed at `now`
  weekdayBorn: string;

  // calendar curiosities
  fridayThe13ths: number;
  leapDays: number;
  primeAges: number[];
  fullMoonBirthdays: number;

  // moon
  moonAtBirth: { phaseName: string; illumination: number; phaseDeg: number };
  fullMoons: number;
  newMoons: number;
  nextFullMoon: Date;
  lastFullMoon: Date;

  // eclipses (worldwide)
  solarEclipses: number;
  lunarEclipses: number;
  nextSolarEclipse: Date | null;
  nextLunarEclipse: Date | null;

  // sky
  seasons: number; // solstices + equinoxes witnessed
  sunRotations: number;
  venusReturns: number;
  venusBirthLongitude: number;
  retrogrades: PlanetRetro[];

  // cosmic travel (computed at `now`)
  earthOrbitKm: number;
  galaxyOrbitKm: number;
  galacticYearFraction: number;
  lightConeLightDays: number;

  // constants for live ticking
  msPerKmEarth: number; // 1 km of Earth travel per this many ms
  msPerKmGalaxy: number;
}

/* ---------- small helpers ---------- */

const DAY_MS = 86400000;
const EARTH_ORBIT_KM_PER_S = 29.78;
const GALAXY_ORBIT_KM_PER_S = 230;
const GALACTIC_YEAR_YEARS = 230_000_000;
const CARRINGTON_DAYS = 27.2753;

export function moonPhaseName(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  const names = [
    'New moon',
    'Waxing crescent',
    'First quarter',
    'Waxing gibbous',
    'Full moon',
    'Waning gibbous',
    'Last quarter',
    'Waning crescent',
  ];
  return names[Math.round(d / 45) % 8];
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

/** Precise calendar age split into years / months / days. */
function ageParts(birth: Date, now: Date) {
  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth() - birth.getMonth();
  let d = now.getDate() - birth.getDate();
  if (d < 0) {
    m -= 1;
    d += daysInMonth(now.getFullYear(), now.getMonth() - 1);
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { years: y, months: m, days: d };
}

/** Normalized angular difference to [-180, 180]. */
function angleDiff(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

async function yieldToUI(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

/* ---------- main computation ---------- */

export async function computeLifeStats(birthDate: Date, now = new Date()): Promise<LifeStats> {
  const birth = new Date(birthDate.getTime());
  const totalDays = (now.getTime() - birth.getTime()) / DAY_MS;
  const totalSeconds = (now.getTime() - birth.getTime()) / 1000;
  const { years, months, days } = ageParts(birth, now);

  const weekdayBorn = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(birth);

  /* calendar curiosities */
  let fridayThe13ths = 0;
  let leapDays = 0;
  for (let y = birth.getFullYear(); y <= now.getFullYear(); y++) {
    for (let mo = 0; mo < 12; mo++) {
      const d = new Date(y, mo, 13);
      if (d < birth || d > now) continue;
      if (d.getDay() === 5) fridayThe13ths++;
    }
  }
  for (let y = birth.getFullYear(); y <= now.getFullYear(); y++) {
    const d = new Date(Date.UTC(y, 1, 29));
    if (d.getUTCMonth() === 1 && d >= birth && d <= now) leapDays++;
  }
  const primeAges: number[] = [];
  for (let a = 0; a <= years; a++) if (isPrime(a)) primeAges.push(a);

  await yieldToUI();

  /* moon at birth */
  const birthPhaseDeg = MoonPhase(birth);
  const birthIllum = illuminationOf(birth);
  const moonAtBirth = {
    phaseName: moonPhaseName(birthPhaseDeg),
    illumination: birthIllum,
    phaseDeg: birthPhaseDeg,
  };

  /* full & new moons witnessed, next / last full moon */
  let fullMoons = 0;
  let newMoons = 0;
  let lastFullMoon: Date | null = null;
  {
    let t = MakeTime(new Date(birth.getTime() - 10 * DAY_MS));
    let guard = 0;
    while (guard++ < 2000) {
      const f = SearchMoonPhase(180, t, 40);
      if (!f || f.date > now) break;
      lastFullMoon = f.date;
      fullMoons++;
      t = MakeTime(new Date(f.date.getTime() + DAY_MS));
    }
  }
  {
    let t = MakeTime(new Date(birth.getTime() - 10 * DAY_MS));
    let guard = 0;
    while (guard++ < 2000) {
      const n = SearchMoonPhase(0, t, 40);
      if (!n || n.date > now) break;
      newMoons++;
      t = MakeTime(new Date(n.date.getTime() + DAY_MS));
    }
  }
  const nextFullMoon =
    SearchMoonPhase(180, MakeTime(new Date((lastFullMoon ?? birth).getTime() + DAY_MS)), 40)?.date ?? now;

  /* full-moon birthdays (within ±1 day of the exact phase) */
  let fullMoonBirthdays = 0;
  for (let y = birth.getFullYear(); y <= now.getFullYear(); y++) {
    const bday = new Date(birth);
    bday.setFullYear(y);
    if (bday < birth || bday > now) continue;
    const deg = MoonPhase(bday);
    if (Math.abs(angleDiff(deg, 180)) <= 22.5) fullMoonBirthdays++;
  }

  await yieldToUI();

  /* eclipses (worldwide) since birth + next ones */
  let solarEclipses = 0;
  let lunarEclipses = 0;
  let nextSolar: Date | null = null;
  let nextLunar: Date | null = null;
  {
    let t = MakeTime(birth);
    let guard = 0;
    while (guard++ < 400) {
      const e = SearchGlobalSolarEclipse(t);
      if (!e || e.peak.date > now) {
        nextSolar = e?.peak.date ?? null;
        break;
      }
      solarEclipses++;
      t = MakeTime(new Date(e.peak.date.getTime() + DAY_MS));
    }
  }
  {
    let t = MakeTime(birth);
    let guard = 0;
    while (guard++ < 400) {
      const e = SearchLunarEclipse(t);
      if (!e || e.peak.date > now) {
        nextLunar = e?.peak.date ?? null;
        break;
      }
      lunarEclipses++;
      t = MakeTime(new Date(e.peak.date.getTime() + DAY_MS));
    }
  }

  await yieldToUI();

  /* seasons witnessed */
  let seasons = 0;
  for (let y = birth.getFullYear(); y <= now.getFullYear(); y++) {
    const s = Seasons(y);
    for (const key of ['mar_equinox', 'jun_solstice', 'sep_equinox', 'dec_solstice'] as const) {
      const t = s[key];
      if (t.date >= birth && t.date <= now) seasons++;
    }
  }

  /* planetary retrogrades — daily ecliptic-longitude sampling */
  const planets: { body: Body; name: string }[] = [
    { body: Body.Mercury, name: 'Mercury' },
    { body: Body.Venus, name: 'Venus' },
    { body: Body.Mars, name: 'Mars' },
    { body: Body.Jupiter, name: 'Jupiter' },
    { body: Body.Saturn, name: 'Saturn' },
    { body: Body.Uranus, name: 'Uranus' },
    { body: Body.Neptune, name: 'Neptune' },
  ];

  const sampleDays = Math.max(1, Math.floor(totalDays));
  const lonSeries = new Map<string, Float64Array>();
  const birthLonSeries = new Map<string, number>();

  const firstSample = new Date(birth.getTime());
  for (let i = 0; i < sampleDays; i++) {
    const d = new Date(firstSample.getTime() + i * DAY_MS);
    const tm = MakeTime(d);
    for (const p of planets) {
      const lon = Ecliptic(GeoVector(p.body, tm, true)).elon;
      let arr = lonSeries.get(p.name);
      if (!arr) {
        arr = new Float64Array(sampleDays);
        lonSeries.set(p.name, arr);
      }
      arr[i] = lon;
      if (i === 0) birthLonSeries.set(p.name, lon);
    }
    if (i % 1200 === 0) await yieldToUI();
  }

  const retrogrades: PlanetRetro[] = [];
  for (const p of planets) {
    const arr = lonSeries.get(p.name)!;
    let retroDays = 0;
    let count = 0;
    let prev = angleDiff(arr[1] - arr[0], 0) > 0; // prograde at sample 1?
    for (let i = 2; i < sampleDays; i++) {
      const delta = angleDiff(arr[i] - arr[i - 1], 0);
      const nowPrograde = delta > 0;
      if (!nowPrograde) retroDays++;
      if (!prev && nowPrograde) count++; // retrograde ended
      prev = nowPrograde;
    }
    // Next retrograde: keep sampling forward day by day.
    let nextRetro: Date | null = null;
    let prevLon = arr[sampleDays - 1];
    let guard = 0;
    while (guard++ < 420) {
      const d = new Date(firstSample.getTime() + (sampleDays - 1 + guard) * DAY_MS);
      const lon = Ecliptic(GeoVector(p.body, MakeTime(d), true)).elon;
      const nowPrograde = angleDiff(lon - prevLon, 0) > 0;
      if (prev && !nowPrograde) {
        nextRetro = d; // entered retrograde
        break;
      }
      prev = nowPrograde;
      prevLon = lon;
    }
    retrogrades.push({
      planet: p.name,
      count,
      fraction: sampleDays > 0 ? retroDays / sampleDays : 0,
      nextRetroStart: nextRetro,
    });
  }

  await yieldToUI();

  /* Venus returns to its birth longitude */
  const venusArr = lonSeries.get('Venus')!;
  const venusBirthLon = birthLonSeries.get('Venus')!;
  let venusReturns = 0;
  for (let i = 1; i < sampleDays; i++) {
    const prev = angleDiff(venusArr[i - 1], venusBirthLon);
    const curr = angleDiff(venusArr[i], venusBirthLon);
    if (prev <= 0 && curr > 0) venusReturns++;
  }

  /* sun rotations on its own axis (Carrington) */
  const sunRotations = totalDays / CARRINGTON_DAYS;

  /* cosmic travel */
  const earthOrbitKm = totalSeconds * EARTH_ORBIT_KM_PER_S;
  const galaxyOrbitKm = totalSeconds * GALAXY_ORBIT_KM_PER_S;
  const galacticYearFraction = totalSeconds / (GALACTIC_YEAR_YEARS * 365.25 * 86400);

  return {
    birth,
    now,
    years,
    months,
    days,
    seconds: totalSeconds,
    weekdayBorn,

    fridayThe13ths,
    leapDays,
    primeAges,
    fullMoonBirthdays,

    moonAtBirth,
    fullMoons,
    newMoons,
    nextFullMoon,
    lastFullMoon: lastFullMoon ?? birth,

    solarEclipses,
    lunarEclipses,
    nextSolarEclipse: nextSolar,
    nextLunarEclipse: nextLunar,

    seasons,
    sunRotations,
    venusReturns,
    venusBirthLongitude: venusBirthLon,
    retrogrades,

    earthOrbitKm,
    galaxyOrbitKm,
    galacticYearFraction,
    lightConeLightDays: totalDays,

    msPerKmEarth: 1000 / EARTH_ORBIT_KM_PER_S,
    msPerKmGalaxy: 1000 / GALAXY_ORBIT_KM_PER_S,
  };
}

function illuminationOf(date: Date): number {
  // Illumination(body, date) → illuminated fraction of the Moon's disc
  return Illumination(Body.Moon, date).phase_fraction;
}

/* ---------- live (cheap) values ---------- */

export interface LiveCelestial {
  secondsLived: number;
  earthOrbitKm: number;
  galaxyOrbitKm: number;
  moonIllumination: number; // 0..1
  moonDistanceKm: number;
  moonPhaseName: string;
  moonPhaseDeg: number;
  nextFullMoonInMs: number;
}

export function liveCelestial(birth: Date, nextFullMoon: Date, now = new Date()): LiveCelestial {
  const secondsLived = (now.getTime() - birth.getTime()) / 1000;
  const phaseDeg = MoonPhase(now);
  return {
    secondsLived,
    earthOrbitKm: secondsLived * EARTH_ORBIT_KM_PER_S,
    galaxyOrbitKm: secondsLived * GALAXY_ORBIT_KM_PER_S,
    moonIllumination: illuminationOf(now),
    moonDistanceKm: GeoVector(Body.Moon, MakeTime(now), false).Length() * KM_PER_AU,
    moonPhaseName: moonPhaseName(phaseDeg),
    moonPhaseDeg: phaseDeg,
    nextFullMoonInMs: Math.max(0, nextFullMoon.getTime() - now.getTime()),
  };
}

/* ---------- cache ---------- */

const LIFE_CACHE_KEY = 'nova:life:v1';
const LIFE_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours (counts barely change)

export function loadCachedLife(birthKey: string): LifeStats | null {
  try {
    const raw = localStorage.getItem(LIFE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { birthKey: string; ts: number; stats: LifeStats };
    if (parsed.birthKey !== birthKey) return null;
    if (Date.now() - parsed.ts > LIFE_CACHE_TTL) return null;
    parsed.stats.birth = new Date(parsed.stats.birth);
    parsed.stats.now = new Date(parsed.stats.now);
    parsed.stats.nextFullMoon = new Date(parsed.stats.nextFullMoon);
    parsed.stats.lastFullMoon = new Date(parsed.stats.lastFullMoon);
    for (const r of parsed.stats.retrogrades) {
      if (r.nextRetroStart) r.nextRetroStart = new Date(r.nextRetroStart);
    }
    if (parsed.stats.nextSolarEclipse) parsed.stats.nextSolarEclipse = new Date(parsed.stats.nextSolarEclipse);
    if (parsed.stats.nextLunarEclipse) parsed.stats.nextLunarEclipse = new Date(parsed.stats.nextLunarEclipse);
    return parsed.stats;
  } catch {
    return null;
  }
}

export function saveCachedLife(birthKey: string, stats: LifeStats): void {
  try {
    localStorage.setItem(LIFE_CACHE_KEY, JSON.stringify({ birthKey, ts: Date.now(), stats }));
  } catch {
    /* storage unavailable */
  }
}

export function birthKey(date: Date): string {
  return date.toISOString();
}
