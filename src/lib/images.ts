import manifestData from './image-manifest.json';

/**
 * Read side of the image pipeline in `scripts/optimize-images.mjs`.
 *
 * Content JSON keeps storing a single plain path (`/images/home/clinic-photo.png`);
 * this turns it into the responsive `<picture>` payload for that photo. Lookup
 * ignores the extension, so replacing a master .png with a .jpg needs no content
 * edit. Unknown paths return `null` and callers fall back to the raw `src`, which
 * keeps a freshly dropped-in photo rendering (unoptimised) before `npm run images`.
 */

interface ManifestEntry {
	/** Intrinsic size of the master, before the ladder is applied. */
	width: number;
	height: number;
	/** Generated widths, ascending. */
	widths: number[];
	formats: string[];
}

const manifest = manifestData as Record<string, ManifestEntry>;

const MIME: Record<string, string> = {
	avif: 'image/avif',
	webp: 'image/webp',
};

export interface ResolvedImage {
	/** Widest webp variant — the `<img>` fallback for browsers that ignore srcset. */
	src: string;
	/** `<source>` entries, best format first. */
	sources: { type: string; srcset: string }[];
	/** Intrinsic size of `src`, so the browser can reserve the box before it loads. */
	width: number;
	height: number;
}

function keyFor(path: string): string {
	return path.replace(/\.[^./]+$/, '');
}

export function getImage(path: string): ResolvedImage | null {
	const key = keyFor(path);
	const entry = manifest[key];
	if (!entry) return null;

	const widest = entry.widths[entry.widths.length - 1]!;

	return {
		src: `${key}-${widest}.webp`,
		sources: entry.formats.map((format) => ({
			type: MIME[format] ?? `image/${format}`,
			srcset: entry.widths.map((w) => `${key}-${w}.${format} ${w}w`).join(', '),
		})),
		width: widest,
		height: Math.round((widest * entry.height) / entry.width),
	};
}

export interface ImageVariant {
	src: string;
	/** 0 when the path is unknown to the pipeline — callers should omit the attrs. */
	width: number;
	height: number;
}

/**
 * A single variant, for consumers that cannot use a `<picture>` — currently the
 * lightbox, which swaps `img.src` from a data attribute. Picks the narrowest
 * generated width that still covers `minWidth`, falling back to the widest. The
 * dimensions come along so the lightbox can reserve the box before the swap
 * lands, instead of collapsing and re-jumping once the new photo decodes.
 */
export function getImageVariant(path: string, minWidth: number, format = 'webp'): ImageVariant {
	const key = keyFor(path);
	const entry = manifest[key];
	if (!entry) return { src: path, width: 0, height: 0 };

	const width = entry.widths.find((w) => w >= minWidth) ?? entry.widths[entry.widths.length - 1]!;
	return {
		src: `${key}-${width}.${format}`,
		width,
		height: Math.round((width * entry.height) / entry.width),
	};
}
