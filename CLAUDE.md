# Julia Pilch — Physiotherapy Portfolio

## Purpose
Employer-facing credibility anchor + contact point for a physiotherapist
job-hunting in Trondheim, Norway. English-first. Not a business/marketing site.

## Stack (do not deviate)
- Astro (latest, v6+), TypeScript strict
- Content collections via the Content Layer API: config in `src/content.config.ts`,
  `glob()`/`file()` loaders, Zod schemas. NOT the legacy `type: 'content'` API.
- `output: 'static'`. Do NOT install `@astrojs/cloudflare` — it's SSR-only and
  breaks Pages deploys. This site is fully prerendered.
- Deploy target: Cloudflare Pages, git-connected.

## Content-as-data (hard rule)
ALL copy, credentials, certificates, references, case studies live as structured
data in content collections / data files under version control. No user-facing
prose hardcoded in components. This is what makes editability and a future
private-client path additive, not a rebuild.

## Design system
Source of truth is /design-reference/*.html (exported from Claude Design).
Extract the exact CSS custom properties and reuse them. Do not restyle:
deep teal-green accent, cream/off-white bg, sage tints, humanist sans,
generous whitespace, rounded/pill UI.

## Extensibility (design in, leave dormant)
- Structure content + routes so a Sveltia CMS admin can be bolted on later
  with zero restructuring.
- Keep a latent "work with me / book" path that can be switched on for
  private cash clients later — don't build it, just don't preclude it.

## Not now
- No Norwegian hardcoding, but don't block future i18n either.
- No SSR, no serverless, no third-party CMS wired up yet.

## Every page must have
Accessible semantics, sensible meta/OG tags, fast static output, responsive.