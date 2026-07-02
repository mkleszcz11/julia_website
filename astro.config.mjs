// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// TODO: set `site` to the final Cloudflare Pages / custom domain once known,
	// so canonical URLs and OG tags resolve to absolute paths.
	output: 'static',
});
