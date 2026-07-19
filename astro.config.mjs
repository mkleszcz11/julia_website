// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	// TODO: set `site` to the final Cloudflare Pages / custom domain once known,
	// so canonical URLs and OG tags resolve to absolute paths.
	output: 'static',
	// Inlines Iconify SVGs at build time — no runtime JS, no network fetch.
	integrations: [icon()],
});
