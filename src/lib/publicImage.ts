import { existsSync } from 'node:fs';

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Resolve a root-relative `public/` image path tolerantly: if the exact file
 * is missing, fall back to the same basename under another common extension.
 * Lets an asset be swapped .png <-> .jpg without editing content JSON.
 */
export function resolvePublicImage(path: string): string {
	if (existsSync(`public${path}`)) return path;

	const base = path.replace(/\.[^./]+$/, '');
	for (const ext of EXTENSIONS) {
		if (existsSync(`public${base}${ext}`)) return `${base}${ext}`;
	}

	return path;
}
