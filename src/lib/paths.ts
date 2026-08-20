/**
 * Base-aware URL helpers.
 *
 * The site is deployed to GitHub Pages under the `/personal-web` subpath,
 * so every internal link and public asset must be prefixed with
 * `import.meta.env.BASE_URL` (which Astro sets from the `base` config).
 * Use these helpers instead of hardcoding hrefs like "/about".
 */

/** Internal page link, e.g. pageUrl('/about') → '/personal-web/about'. */
export function pageUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return base.replace(/\/$/, '') + path;
}

/** Public asset in /public, e.g. assetUrl('/favicon.svg'). */
export function assetUrl(path: string): string {
  return pageUrl(path);
}
