# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Julia Pilch — Physiotherapy Portfolio

## Purpose
Employer-facing credibility anchor + contact point for a physiotherapist
job-hunting in Trondheim, Norway. English-first. Not a business/marketing site.

## Commands
```sh
npm run dev        # dev server on localhost:4321
npm run build      # static build to ./dist (runs astro check via @astrojs/check)
npm run preview    # serve ./dist locally
npx astro check    # type-check .astro + TS on its own
npx astro sync     # regenerate .astro/types.d.ts after editing src/content.config.ts
```
No test runner and no linter are configured — `astro check` is the only gate.
Node >= 22.12 is required.

## Stack (do not deviate)
- Astro (latest, v6+), TypeScript strict
- Content collections via the Content Layer API: config in `src/content.config.ts`,
  `glob()`/`file()` loaders, Zod schemas. NOT the legacy `type: 'content'` API.
- `output: 'static'`. Do NOT install `@astrojs/cloudflare` — it's SSR-only and
  breaks Pages deploys. This site is fully prerendered.
- Deploy target: Cloudflare Pages, git-connected. `wrangler.jsonc` serves `./dist`
  as static assets; it is not a Worker.
- Zero runtime dependencies beyond Astro itself. No UI framework, no CSS framework.

## Architecture

**Everything is data → page → dumb component.** Pages in `src/pages/` are the only
place that touches `astro:content`. They load entries, then pass plain data down as
props. Components never call `getCollection`/`getEntry` themselves; they type their
props off the schema, e.g.
`hero: CollectionEntry<'home'>['data']['hero']`. Keep it that way — it's what makes
a CMS swap a data-layer change only.

**Two kinds of collections** (`src/content.config.ts`):
- *Singletons* via `file()` — one JSON keyed by the collection name, fetched as
  `getEntry('home', 'home')`, `getEntry('expertisePage', 'expertisePage')`. The
  JSON's top-level key must match that id. Pages throw explicitly when a singleton
  is missing rather than rendering empty.
- *Lists* via `glob()` — one JSON file per item under `src/content/<name>/`.
  Every list schema carries an `order: number`; sorting is done in the page/component,
  not by filename. Several also carry `featuredOnHome` / `pageOrder` so the same
  entry renders both in a homepage preview and on its own page with different
  copy fields (`quote` vs `longQuote`) and ordering. Adding a certificate or
  reference means dropping in a JSON file plus its asset — no code change.

**Page/preview pairing.** Each section exists twice: a `*Preview.astro` on the
homepage and a full page. `home.json` holds only the homepage section chrome
(eyebrow/heading/CTA); the items themselves come from the shared item collection.
Don't duplicate item copy into `home.json`.

**Chrome.** `settings` (nav, contact, socials, footer) is loaded by every page and
passed to `Header`/`Footer`. `BaseLayout.astro` owns `<head>`: title/description
props, canonical + OG/Twitter tags, Google Fonts. Canonical/OG URLs are gated on
`Astro.site`, which is still unset in `astro.config.mjs` — set it once the domain
is known.

**Assets** live in `public/` (`images/<page>/`, `documents/references/`) and are
referenced by root-relative string paths inside content JSON, not imported. So
they're unoptimized by design; keep files reasonably sized. Content JSON often
carries an `imagePosition` (a CSS `object-position`) alongside the path so framing
is editorial data, not CSS. Render images through `CoverImage.astro`; use
`PlaceholderImage.astro` for not-yet-supplied art.

## Styling
- Design tokens are CSS custom properties on `:root` in `src/styles/global.css`
  (`--accent`, `--accent-deep`, `--bg`, `--beige`, `--text`, `--muted`, `--border`,
  `--heading-font`). Use them; never hardcode a hex.
- All component styling is a scoped `<style>` block in the `.astro` file, with
  `jp-`-prefixed class names. `global.css` is small on purpose: tokens, resets,
  and the mobile overrides that have to reach across component boundaries.
- Source of truth for the design is `/design-reference/*.html` (exported from
  Claude Design). Extract the exact CSS custom properties and reuse them. Do not
  restyle: deep teal-green accent, cream/off-white bg, sage tints, humanist sans,
  generous whitespace, rounded/pill UI.

## Content-as-data (hard rule)
ALL copy, credentials, certificates, references, case studies live as structured
data in content collections / data files under version control. No user-facing
prose hardcoded in components. This is what makes editability and a future
private-client path additive, not a rebuild.

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
