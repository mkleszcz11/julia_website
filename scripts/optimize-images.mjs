// Build-time image pipeline.
//
//   originals/<page>/<name>.<ext>   masters, git-ignored, never shipped
//        │
//        ▼  npm run images
//   public/images/<page>/<name>-<w>.{avif,webp}   generated, committed
//   src/lib/image-manifest.json                   generated, committed
//
// Content JSON keeps writing plain paths like "/images/home/clinic-photo.png".
// The manifest is keyed on the *extension-less* path, so a master can be
// swapped .png <-> .jpg without touching content, and `getImage()` in
// src/lib/images.ts turns one path into a full <picture> srcset.
//
// Outputs are committed, so a clone without `originals/` still builds — you
// only need the masters when the photos themselves change.

import { cpus } from 'node:os';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, sep } from 'node:path';
import sharp from 'sharp';

const SRC_DIR = 'originals';
const OUT_DIR = 'public/images';
const MANIFEST = 'src/lib/image-manifest.json';
const OG_SOURCE = 'originals/home/profile-picture.png';
const OG_OUT = 'public/og-image.jpg';
const OG_SIZE = { width: 1200, height: 630 }; // what every scraper expects
/** Vertical focus, mirroring the hero's `imagePosition` so the card is framed like the page. */
const OG_FOCUS = 0.18;

// Widest rendered slot is the hero photo at ~510 CSS px, so 1600 covers it at
// 3x and gives the certificate lightbox room to be legible. Anything above
// that is bytes nobody's screen can use.
const WIDTHS = [400, 800, 1200, 1600];

// Quality is deliberately on the generous side of the usual web defaults —
// these are a physiotherapist's credentials and portfolio photos, and scanned
// certificates punish aggressive quantisation around text.
const ENCODERS = {
	// effort above the default 4 measured no smaller on this photo set, only slower.
	avif: (img) => img.avif({ quality: 62, effort: 4, chromaSubsampling: '4:4:4' }),
	webp: (img) => img.webp({ quality: 84, effort: 6, smartSubsample: true }),
};

const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff']);
const OUTPUT_EXT = new Set(Object.keys(ENCODERS).map((format) => `.${format}`));

/** Everything under `originals/raw/` is untouched camera output kept for archive only. */
const IGNORED_DIRS = new Set(['raw']);

/** `skipDirs` applies only to the top level — recursion drops it. */
async function* walk(dir, extensions, skipDirs = new Set()) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (skipDirs.has(entry.name)) continue;
			yield* walk(path, extensions);
		} else if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) {
			yield path;
		}
	}
}

function formatBytes(n) {
	return `${(n / 1024 ** 2).toFixed(2)} MB`;
}

// AVIF is slow enough that a full pass runs in tens of minutes, so a variant
// already newer than its master is left alone: adding one photo re-encodes one
// photo. `--force` re-encodes everything, for when the ladder or the quality
// settings above change.
const force = process.argv.includes('--force');

await mkdir(OUT_DIR, { recursive: true });

const manifest = {};
/** Every path this run is responsible for; anything else under OUT_DIR is stale. */
const expected = new Set();
/** Variants that actually need encoding, gathered up front so they can run in parallel. */
const queue = [];
let sourceBytes = 0;
let outputBytes = 0;
let reused = 0;

// Pass 1 — read every master's dimensions, decide its ladder, and work out which
// variants are missing or older than it.
for await (const file of walk(SRC_DIR, SOURCE_EXT, IGNORED_DIRS)) {
	// "originals/home/clinic-photo.png" -> "/images/home/clinic-photo"
	const rel = relative(SRC_DIR, file).split(sep).join('/');
	const key = `/images/${rel.replace(/\.[^./]+$/, '')}`;
	const outBase = join(OUT_DIR, rel.replace(/\.[^./]+$/, ''));

	const meta = await sharp(file).metadata();
	if (!meta.width || !meta.height) throw new Error(`Cannot read dimensions of ${file}`);

	// EXIF orientations 5-8 rotate by 90/270 degrees, so the upright dimensions
	// are the transpose of what the file header reports.
	const transposed = (meta.orientation ?? 1) >= 5;
	const srcWidth = transposed ? meta.height : meta.width;
	const srcHeight = transposed ? meta.width : meta.height;

	// Only ladder rungs the source can actually fill, plus its own width when it
	// falls between two rungs — never upscale, never repeat the top rung.
	const widths = WIDTHS.filter((w) => w < srcWidth);
	const top = Math.min(srcWidth, WIDTHS[WIDTHS.length - 1]);
	if (widths[widths.length - 1] !== top) widths.push(top);

	await mkdir(dirname(outBase), { recursive: true });

	const masterStat = await stat(file);
	const variants = widths.flatMap((width) =>
		Object.keys(ENCODERS).map((format) => ({ width, format, out: `${outBase}-${width}.${format}` })),
	);
	for (const { out } of variants) expected.add(out);

	let stale = 0;
	for (const variant of variants) {
		const existing = force ? null : await stat(variant.out).catch(() => null);
		if (existing && existing.mtimeMs >= masterStat.mtimeMs) {
			outputBytes += existing.size;
			reused++;
		} else {
			queue.push({ ...variant, file });
			stale++;
		}
	}

	sourceBytes += masterStat.size;
	manifest[key] = {
		width: srcWidth,
		height: srcHeight,
		widths,
		formats: Object.keys(ENCODERS),
	};

	console.log(`${key}  ${srcWidth}x${srcHeight} -> ${widths.join(', ')}${stale === 0 ? ' (cached)' : ''}`);
}

// Pass 2 — encode. libaom saturates one core per call, so the parallelism has to
// come from running several variants at once; without it a full pass is an
// order of magnitude slower on a many-core machine. Cap libvips' own thread pool
// so the two layers don't oversubscribe each other.
const workers = Math.max(1, Math.min(queue.length, cpus().length - 2));
sharp.concurrency(2);

if (queue.length > 0) console.log(`\nencoding ${queue.length} variants across ${workers} workers...`);

let next = 0;
await Promise.all(
	Array.from({ length: workers }, async () => {
		while (next < queue.length) {
			const { file, width, format, out } = queue[next++];
			// Each variant re-reads the file rather than sharing one decoded buffer: a
			// sharp pipeline is single-use, and re-reading lets libjpeg shrink-on-load
			// unpack a 12 MP master straight to roughly the target size. Decoding once
			// into raw pixels forfeits that and measures slower, not faster.
			await ENCODERS[format](
				sharp(file, { failOn: 'error' })
					.rotate() // honour EXIF orientation
					.resize({ width, withoutEnlargement: true, fit: 'inside', kernel: 'lanczos3' }),
			).toFile(out);
			// Resolve the size before touching the accumulator: `x += await y` reads x
			// on the near side of the await, so concurrent workers would lose updates.
			const { size } = await stat(out);
			outputBytes += size;
		}
	}),
);

// A renamed or deleted master must not leave its variants behind to be deployed.
for await (const file of walk(OUT_DIR, OUTPUT_EXT)) {
	if (expected.has(file)) continue;
	await rm(file);
	console.log(`pruned ${file}`);
}

// The social-card image. Deliberately a plain JPEG — LinkedIn and friends are not
// the place to be clever about formats. A plain `cover` crop of the portrait master
// cuts the chin off, so take the band the hero's own framing points at.
const ogKey = `/images/${relative(SRC_DIR, OG_SOURCE).split(sep).join('/').replace(/\.[^./]+$/, '')}`;
const ogMaster = manifest[ogKey];
if (!ogMaster) throw new Error(`OG source ${OG_SOURCE} is not one of the masters`);

const band = Math.round((ogMaster.width * OG_SIZE.height) / OG_SIZE.width);
await sharp(OG_SOURCE)
	.rotate()
	.extract({
		left: 0,
		top: Math.round((ogMaster.height - band) * OG_FOCUS),
		width: ogMaster.width,
		height: band,
	})
	.resize(OG_SIZE.width, OG_SIZE.height)
	.jpeg({ quality: 82, mozjpeg: true })
	.toFile(OG_OUT);
console.log(`\n${OG_OUT}  ${OG_SIZE.width}x${OG_SIZE.height}`);

const ordered = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(MANIFEST, `${JSON.stringify(ordered, null, '\t')}\n`);

console.log(
	`\n${Object.keys(manifest).length} images: ${formatBytes(sourceBytes)} of masters -> ` +
		`${formatBytes(outputBytes)} across ${expected.size} variants ` +
		`(${queue.length} encoded, ${reused} already current)`,
);
