// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	// Absolute base for canonical URLs and OG/Twitter card tags. Update to the
	// final custom domain once known — see the same note in BaseLayout.astro.
	site: 'https://julia-website.kleszcz.workers.dev',
	output: 'static',
	// Inlines Iconify SVGs at build time — no runtime JS, no network fetch.
	integrations: [icon()],
});
