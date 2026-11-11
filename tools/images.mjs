#!/usr/bin/env node
/**
 * Prepares photographs for the site.
 *
 * Reads the originals in ./photos and writes web-sized WebP files to
 * ./assets/img. The originals stay out of git (see .gitignore); only the
 * prepared files are committed.
 *
 *   photos/hero.jpg               landscape 16:9  → assets/img/hero-wide-*.webp
 *   photos/hero-mobile.jpg        portrait 4:5    → assets/img/hero-tall-*.webp
 *   photos/story.jpg              landscape 3:2   → assets/img/story-*.webp
 *   photos/satin.jpg              a wide strip    → assets/img/satin-*.webp
 *   photos/products/<name>.jpg    portrait 4:5    → assets/img/products/<name>-*.webp
 *
 * JPG, PNG, WebP, AVIF and TIFF originals all work. A photo in another shape
 * is centre-cropped to fit, so frame the subject in the middle.
 *
 * Usage:
 *   npm install       once, to install sharp
 *   npm run images
 */
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { heightFor, imageSizes } from '../src/data/image-sizes.mjs';

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.error('The image tool needs sharp. Run `npm install` first.');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const photosDir = path.join(root, 'photos');
const outDir = path.join(root, 'assets', 'img');
const IMAGE_FILE = /\.(jpe?g|png|webp|avif|tiff?)$/i;

/** Lists the image files in a folder, or nothing if the folder is missing. */
async function listImages(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isFile() && IMAGE_FILE.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

/** Writes one WebP per width in the preset: <outBase>-<width>.webp */
async function prepare(source, outBase, preset) {
  await mkdir(path.dirname(outBase), { recursive: true });
  for (const width of preset.widths) {
    await sharp(source)
      .rotate() // honour the camera's orientation tag
      .resize(width, heightFor(preset, width), { fit: 'cover', position: 'centre' })
      .webp({ quality: 82, effort: 6, smartSubsample: true })
      .toFile(`${outBase}-${width}.webp`);
  }
  console.log(`  ${path.relative(root, source)} → ${path.relative(root, outBase)}-{${preset.widths.join(',')}}.webp`);
}

const baseName = (file) => file.replace(IMAGE_FILE, '');

const topLevel = await listImages(photosDir);
const productPhotos = await listImages(path.join(photosDir, 'products'));

/** The photographs that are not products: original name, output name, shape. */
const features = [
  { name: 'hero', out: 'hero-wide', preset: imageSizes.heroWide },
  { name: 'hero-mobile', out: 'hero-tall', preset: imageSizes.heroTall },
  { name: 'story', out: 'story', preset: imageSizes.story },
  { name: 'satin', out: 'satin', preset: imageSizes.satin },
];

let prepared = 0;

for (const feature of features) {
  const file = topLevel.find((candidate) => baseName(candidate) === feature.name);
  if (!file) continue;
  await prepare(path.join(photosDir, file), path.join(outDir, feature.out), feature.preset);
  prepared += 1;
}

for (const file of productPhotos) {
  await prepare(
    path.join(photosDir, 'products', file),
    path.join(outDir, 'products', baseName(file)),
    imageSizes.product,
  );
  prepared += 1;
}

if (prepared === 0) {
  console.error('No photos found. Add originals to ./photos (see the notes at the top of this file).');
  process.exit(1);
}

console.log(`Prepared ${prepared} photo${prepared === 1 ? '' : 's'}. Run \`npm run build\` to check the pages.`);
