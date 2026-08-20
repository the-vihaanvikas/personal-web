/**
 * Live GitHub data client.
 *
 * Strategy:
 *  - Public REST API (no token needed, works from any static host via CORS).
 *  - Optional GraphQL via PUBLIC_GITHUB_TOKEN for the contribution calendar
 *    (total contributions, streak, heatmap). Without a token the section
 *    still works — it just shows REST-derived metrics instead.
 *  - Results are cached in localStorage (20 min) to stay far under rate
 *    limits; on failure we fall back to the last cache, then to an error
 *    state with a retry button.
 */

export interface GithubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  htmlUrl: string;
  location: string | null;
  blog: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
}

export interface GithubRepo {
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  fork: boolean;
  topics: string[];
  pushedAt: string | null;
}

export interface GithubEvent {
  type: string;
  action: string | null;
  repo: string;
  repoUrl: string;
  createdAt: string;
  description: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0..4
}

export interface GithubContributions {
  total: number;
  currentStreak: number;
  longestStreak: number;
  days: ContributionDay[];
  start: string;
  end: string;
}

export interface GithubData {
  profile: GithubProfile;
  starsTotal: number;
  forksTotal: number;
  topRepos: GithubRepo[];
  languages: { name: string; count: number }[];
  events: GithubEvent[];
  lastActivity: string | null;
  totalCommits: number | null;
  contributions: GithubContributions | null;
  fetchedAt: string;
}

const API = 'https://api.github.com';
const CACHE_KEY = 'nova:github:v2';
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes

export const GITHUB_TOKEN = (import.meta.env.PUBLIC_GITHUB_TOKEN as string | undefined) ?? null;

const GH_EVENT_ICONS: Record<string, string> = {
  PushEvent: 'commit',
  PullRequestEvent: 'pr',
  PullRequestReviewEvent: 'review',
  IssuesEvent: 'issue',
  IssueCommentEvent: 'comment',
  WatchEvent: 'star',
  ForkEvent: 'fork',
  CreateEvent: 'create',
  DeleteEvent: 'delete',
  ReleaseEvent: 'release',
  GollumEvent: 'wiki',
  PublicEvent: 'unlock',
  MemberEvent: 'user',
};

export function eventIcon(type: string): string {
  return GH_EVENT_ICONS[type] ?? 'repo';
}

async function jfetch(url: string, token: string | null, accept?: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      Accept: accept ?? 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
    throw new Error('rate-limited');
  }
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}`);
  }
  return res.json();
}

function describeEvent(e: any): GithubEvent {
  const repo = e.repo?.name ?? '';
  const repoUrl = `https://github.com/${repo}`;
  const p = e.payload ?? {};
  switch (e.type) {
    case 'PushEvent':
      return {
        type: e.type,
        action: null,
        repo,
        repoUrl,
        createdAt: e.created_at,
        description: `pushed ${p.size ?? 1} commit${(p.size ?? 1) === 1 ? '' : 's'} to`,
      };
    case 'PullRequestEvent':
      return {
        type: e.type,
        action: p.action,
        repo,
        repoUrl,
        createdAt: e.created_at,
        description: `${p.action ?? 'opened'} PR #${p.number ?? ''} in`,
      };
    case 'IssuesEvent':
      return {
        type: e.type,
        action: p.action,
        repo,
        repoUrl,
        createdAt: e.created_at,
        description: `${p.action ?? 'opened'} issue #${p.number ?? ''} in`,
      };
    case 'IssueCommentEvent':
      return {
        type: e.type,
        action: p.action,
        repo,
        repoUrl,
        createdAt: e.created_at,
        description: `commented on issue #${p.issue?.number ?? ''} in`,
      };
    case 'PullRequestReviewEvent':
      return {
        type: e.type,
        action: p.action,
        repo,
        repoUrl,
        createdAt: e.created_at,
        description: `reviewed PR #${p.pull_request?.number ?? ''} in`,
      };
    case 'WatchEvent':
      return { type: e.type, action: null, repo, repoUrl, createdAt: e.created_at, description: 'starred' };
    case 'ForkEvent':
      return { type: e.type, action: null, repo, repoUrl, createdAt: e.created_at, description: 'forked' };
    case 'CreateEvent':
      return {
        type: e.type,
        action: null,
        repo,
        repoUrl,
        createdAt: e.created_at,
        description: `created ${p.ref_type ?? 'ref'}${p.ref ? ` ${p.ref}` : ''} in`,
      };
    case 'DeleteEvent':
      return {
        type: e.type,
        action: null,
        repo,
        repoUrl,
        createdAt: e.created_at,
        description: `deleted ${p.ref_type ?? 'ref'} in`,
      };
    case 'ReleaseEvent':
      return {
        type: e.type,
        action: null,
        repo,
        repoUrl,
        createdAt: e.created_at,
        description: `released ${p.release?.tag_name ?? 'a version'} of`,
      };
    case 'GollumEvent':
      return { type: e.type, action: null, repo, repoUrl, createdAt: e.created_at, description: 'updated the wiki for' };
    case 'PublicEvent':
      return { type: e.type, action: null, repo, repoUrl, createdAt: e.created_at, description: 'made' };
    default:
      return { type: e.type, action: null, repo, repoUrl, createdAt: e.created_at, description: 'activity in' };
  }
}

function parseContributions(data: any): GithubContributions | null {
  const cal = data?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal?.weeks) return null;
  const days: ContributionDay[] = [];
  for (const week of cal.weeks) {
    for (const d of week.contributionDays ?? []) {
      const levelMap: Record<string, number> = {
        NONE: 0,
        FIRST_QUARTILE: 1,
        SECOND_QUARTILE: 2,
        THIRD_QUARTILE: 3,
        FOURTH_QUARTILE: 4,
      };
      days.push({
        date: d.date,
        count: d.contributionCount ?? 0,
        level: levelMap[d.level] ?? 0,
      });
    }
  }
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
      currentStreak = run;
    } else {
      run = 0;
    }
  }
  return {
    total: cal.totalContributions ?? 0,
    currentStreak,
    longestStreak,
    days,
    start: days[0]?.date ?? '',
    end: days[days.length - 1]?.date ?? '',
  };
}

async function fetchContributions(token: string, username: string): Promise<GithubContributions | null> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                level
              }
            }
          }
        }
      }
    }`;
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  if (!res.ok) return null;
  return parseContributions(await res.json());
}

export interface GithubResult {
  data: GithubData | null;
  stale: boolean;
  error: string | null;
  fromCache: boolean;
}

export async function fetchGitHubData(username: string, token: string | null = GITHUB_TOKEN): Promise<GithubResult> {
  // Try cache first.
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { data: GithubData; ts: number };
      if (cached.data.profile.login === username && Date.now() - cached.ts < CACHE_TTL) {
        return { data: cached.data, stale: false, error: null, fromCache: true };
      }
    }
  } catch {
    /* ignore cache errors */
  }

  try {
    const [user, repos, events, commits] = await Promise.all([
      jfetch(`${API}/users/${encodeURIComponent(username)}`, token),
      jfetch(`${API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, token),
      jfetch(`${API}/users/${encodeURIComponent(username)}/events/public?per_page=30`, token),
      jfetch(
        `${API}/search/commits?q=author:${encodeURIComponent(username)}&per_page=1`,
        token,
        'application/vnd.github+json',
      ).catch(() => null),
    ]);

    const profile: GithubProfile = {
      login: user.login,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      htmlUrl: user.html_url,
      location: user.location,
      blog: user.blog,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      createdAt: user.created_at,
    };

    const own = (repos as any[]).filter((r) => !r.fork);
    const starsTotal = own.reduce((s, r) => s + r.stargazers_count, 0);
    const forksTotal = own.reduce((s, r) => s + r.forks_count, 0);

    const topRepos: GithubRepo[] = own
      .slice()
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        fullName: r.full_name,
        htmlUrl: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        fork: r.fork,
        topics: r.topics ?? [],
        pushedAt: r.pushed_at,
      }));

    const langCount = new Map<string, number>();
    for (const r of own) {
      if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
    }
    const languages = [...langCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const eventsList: GithubEvent[] = (events as any[]).slice(0, 12).map(describeEvent);
    const lastActivity = eventsList[0]?.createdAt ?? null;

    const contributions = token ? await fetchContributions(token, username) : null;

    const data: GithubData = {
      profile,
      starsTotal,
      forksTotal,
      topRepos,
      languages,
      events: eventsList,
      lastActivity,
      totalCommits: commits?.total_count ?? null,
      contributions,
      fetchedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      /* storage full — ignore */
    }

    return { data, stale: false, error: null, fromCache: false };
  } catch (err) {
    // Fall back to stale cache, then report the error.
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as { data: GithubData; ts: number };
        if (cached.data.profile.login === username) {
          return { data: cached.data, stale: true, error: null, fromCache: true };
        }
      }
    } catch {
      /* ignore */
    }
    return {
      data: null,
      stale: false,
      error: err instanceof Error ? err.message : 'unknown error',
      fromCache: false,
    };
  }
}

/** GitHub language → color (common subset; others fall back to a neutral). */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Java: '#b07219',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  PHP: '#4F5D95',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Zig: '#ec915c',
  Haskell: '#5e5086',
  Lua: '#000080',
  Elixir: '#6e4a7e',
  'Jupyter Notebook': '#DA5B0B',
};

export function languageColor(lang: string | null): string {
  return (lang && LANGUAGE_COLORS[lang]) || '#8b949e';
}
