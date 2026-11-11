#!/usr/bin/env node
/**
 * Builds the LadyZoom site.
 *
 *   npm run build      (or: node build.mjs)
 *
 * Reads the settings and catalogue in src/data, renders every page with the
 * templates in src/, and writes plain .html files to the repository root, so
 * the site can be hosted as-is (GitHub Pages "deploy from a branch", or any
 * static host). No dependencies are needed to build.
 *
 * The build stops with an explanation, and writes nothing, if the catalogue
 * has a mistake in it or a page links to something that does not exist.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { categories, products, sizeChart } from './src/data/catalog.mjs';
import { collections, shopNav } from './src/data/collections.mjs';
import { imageSizes } from './src/data/image-sizes.mjs';
import { site } from './src/data/site.mjs';
import { aboutPage } from './src/pages/about.mjs';
import { checkoutPage } from './src/pages/checkout.mjs';
import { collectionPage } from './src/pages/collection.mjs';
import { helpPage } from './src/pages/help.mjs';
import { homePage } from './src/pages/home.mjs';
import { notFoundPage } from './src/pages/not-found.mjs';
import { productPage } from './src/pages/product.mjs';
import { productImagePath, productUrl } from './src/templates/components.mjs';
import { GENERATED_MARKER, layout } from './src/templates/layout.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const fromRoot = (...parts) => path.join(root, ...parts);

const STORE_DATA_FILE = 'assets/js/store-data.js';
const SITEMAP_FILE = 'sitemap.xml';
/** Files whose contents decide the ?v= stamp that keeps browsers from serving stale CSS and JS. */
const VERSIONED_ASSETS = ['assets/css/styles.css', 'assets/js/site.js'];

/** Raised for mistakes in the content, as opposed to bugs in the build. */
class ContentError extends Error {}

/* ---------- Checking the content ----------------------------------------- */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isWholeNumber = (value) => Number.isInteger(value) && value >= 0;
const hasText = (value) => typeof value === 'string' && value.trim() !== '';

function missingImageFiles(dir, name, preset) {
  return preset.widths
    .map((width) => `assets/img/${dir}${name}-${width}.webp`)
    .filter((file) => !existsSync(fromRoot(file)));
}

function checkSite(problems) {
  if (site.url !== '' && !/^https?:\/\/[^\s/]+(?:\/\S*)?$/.test(site.url)) {
    problems.push(`site.url must be a full address such as "https://www.example.com" (found "${site.url}").`);
  } else if (site.url.endsWith('/')) {
    problems.push(`site.url must not end with a slash (found "${site.url}").`);
  }

  const { whatsapp } = site.contact;
  if (whatsapp !== '' && !/^[1-9]\d{7,14}$/.test(whatsapp)) {
    problems.push(
      `site.contact.whatsapp must be digits only, starting with the country code, e.g. "923001234567" (found "${whatsapp}").`,
    );
  }

  if (!isWholeNumber(site.delivery.fee)) problems.push('site.delivery.fee must be a whole number of rupees.');
  if (!isWholeNumber(site.delivery.freeOver)) problems.push('site.delivery.freeOver must be a whole number of rupees.');
  if (!isWholeNumber(site.exchange.days)) problems.push('site.exchange.days must be a whole number of days.');

  // The home page's own photographs: prepared name, shape, and the original it is made from.
  for (const [name, preset, original] of [
    ['hero-wide', imageSizes.heroWide, 'hero'],
    ['hero-tall', imageSizes.heroTall, 'hero-mobile'],
    ['story', imageSizes.story, 'story'],
    ['satin', imageSizes.satin, 'satin'],
  ]) {
    for (const file of missingImageFiles('', name, preset)) {
      problems.push(`The home page photo ${file} is missing. Add photos/${original}.jpg and run "npm run images".`);
    }
  }
}

function checkCatalogue(problems) {
  const categoryIds = new Set();
  for (const category of categories) {
    const label = `Collection "${category.id}"`;
    if (!SLUG.test(String(category.id))) problems.push(`${label}: id must be lower-case letters, numbers and hyphens.`);
    if (categoryIds.has(category.id)) problems.push(`${label}: this id is used more than once.`);
    categoryIds.add(category.id);
    if (!hasText(category.name)) problems.push(`${label}: name is missing.`);
    if (!hasText(category.intro)) problems.push(`${label}: intro is missing.`);
    if (!hasText(category.image)) {
      problems.push(`${label}: image is missing.`);
    } else {
      for (const file of missingImageFiles('products/', category.image, imageSizes.product)) {
        problems.push(`${label}: tile photo ${file} is missing.`);
      }
    }
  }

  const productIds = new Set();
  for (const product of products) {
    const label = `Product "${product.id}"`;
    if (!SLUG.test(String(product.id))) problems.push(`${label}: id must be lower-case letters, numbers and hyphens.`);
    if (productIds.has(product.id)) problems.push(`${label}: this id is used more than once.`);
    productIds.add(product.id);

    for (const field of ['name', 'title', 'pieces', 'colour', 'alt', 'summary', 'care']) {
      if (!hasText(product[field])) problems.push(`${label}: ${field} is missing.`);
    }
    if (!categoryIds.has(product.category)) {
      problems.push(`${label}: category "${product.category}" is not one of the collections (${[...categoryIds].join(', ')}).`);
    }
    if (!isWholeNumber(product.price) || product.price === 0) {
      problems.push(`${label}: price must be a whole number of rupees, without separators.`);
    }
    if (product.compareAt !== undefined && !(isWholeNumber(product.compareAt) && product.compareAt > product.price)) {
      problems.push(`${label}: compareAt is the original price, so it must be higher than price.`);
    }
    if (!Array.isArray(product.sizes) || product.sizes.length === 0 || !product.sizes.every(hasText)) {
      problems.push(`${label}: sizes must list at least one size.`);
    } else if (new Set(product.sizes).size !== product.sizes.length) {
      problems.push(`${label}: sizes lists the same size twice.`);
    }
    if (!Array.isArray(product.details) || product.details.length === 0 || !product.details.every(hasText)) {
      problems.push(`${label}: details must list at least one point.`);
    }
    if (!Array.isArray(product.images) || product.images.length === 0) {
      problems.push(`${label}: images must list at least one photo.`);
    } else {
      for (const name of product.images) {
        for (const file of missingImageFiles('products/', name, imageSizes.product)) {
          problems.push(`${label}: photo ${file} is missing. Add photos/products/${name}.jpg and run "npm run images".`);
        }
      }
    }
  }
}

function checkUniquePages(pages, problems) {
  const seen = new Set();
  for (const page of pages) {
    if (seen.has(page.file)) {
      problems.push(`Two pages would both be written to ${page.file}. Rename the collection or product that shares this name.`);
    }
    seen.add(page.file);
  }
}

/**
 * Checks every link, script, stylesheet and image a page refers to.
 * Catches a renamed collection, a deleted product or a missing photo before
 * a customer can.
 */
function checkReferences(rendered, problems) {
  const idsByFile = new Map(
    rendered.map(({ file, markup }) => [file, new Set([...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]))]),
  );
  // Written by this build, so it may not be on disk yet.
  const aboutToExist = new Set([STORE_DATA_FILE]);

  for (const { file, markup } of rendered) {
    // Buttons that open a dialog name it by id.
    for (const match of markup.matchAll(/\sdata-open="([^"]+)"/g)) {
      if (!idsByFile.get(file).has(match[1])) {
        problems.push(`${file} has a button that opens "${match[1]}", but the page has no dialog with that id.`);
      }
    }

    const references = new Set();
    for (const match of markup.matchAll(/\s(?:href|src)="([^"]*)"/g)) references.add(match[1]);
    for (const match of markup.matchAll(/\s(?:srcset|imagesrcset)="([^"]*)"/g)) {
      for (const candidate of match[1].split(',')) references.add(candidate.trim().split(/\s+/)[0]);
    }

    for (const reference of references) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) continue; // another site, mailto:, tel:
      const [beforeHash, fragment] = reference.split('#');
      const target = beforeHash.split('?')[0] || file;

      const targetIds = idsByFile.get(target);
      if (!targetIds && !aboutToExist.has(target) && !existsSync(fromRoot(target))) {
        problems.push(`${file} refers to "${reference}", which does not exist.`);
      } else if (fragment && targetIds && !targetIds.has(fragment)) {
        problems.push(`${file} links to "${reference}", but ${target} has no section with that id.`);
      }
    }
  }
}

function stopIfProblems(problems) {
  if (problems.length === 0) return;
  throw new ContentError(
    `The site was not built. Please fix ${problems.length === 1 ? 'this' : 'these'} first:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`,
  );
}

/* ---------- Generated files ---------------------------------------------- */

/** Catalogue and settings for the browser: the bag and checkout read these. */
function storeDataScript() {
  const data = {
    name: site.name,
    currencySymbol: site.currency.symbol,
    delivery: { fee: site.delivery.fee, freeOver: site.delivery.freeOver },
    whatsapp: site.contact.whatsapp,
    products: Object.fromEntries(
      products.map((product) => [
        product.id,
        {
          name: product.name,
          title: product.title,
          price: product.price,
          sizes: product.sizes,
          image: productImagePath(product.images[0], imageSizes.product.widths[0]),
          url: productUrl(product),
        },
      ]),
    ),
  };
  return `/* ${GENERATED_MARKER} from src/data. Do not edit by hand. */\nwindow.LZ_STORE = ${JSON.stringify(data, null, 2)};\n`;
}

function sitemap(pages) {
  const urls = pages
    .filter((page) => !page.noindex)
    .map((page) => `  <url><loc>${site.url}/${page.file === 'index.html' ? '' : page.file}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${GENERATED_MARKER} -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

async function isGenerated(file) {
  const start = (await readFile(fromRoot(file), 'utf8')).slice(0, 300);
  return start.includes(GENERATED_MARKER);
}

/** Deletes pages from an earlier build that no longer exist, e.g. a product that was removed. */
async function removeStalePages(currentFiles) {
  const removed = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html') || currentFiles.has(entry.name)) continue;
    if (await isGenerated(entry.name)) {
      await rm(fromRoot(entry.name));
      removed.push(entry.name);
    }
  }
  return removed;
}

async function assetVersion(storeData) {
  const hash = createHash('sha256').update(storeData);
  for (const file of VERSIONED_ASSETS) hash.update(await readFile(fromRoot(file)));
  return hash.digest('hex').slice(0, 10);
}

/* ---------- Build -------------------------------------------------------- */

async function build() {
  const problems = [];
  checkSite(problems);
  checkCatalogue(problems);
  stopIfProblems(problems);

  const storeData = storeDataScript();
  const context = {
    site,
    categories,
    products,
    sizeChart,
    collections,
    shopNav,
    assetVersion: await assetVersion(storeData),
    year: new Date().getFullYear(),
  };

  const pages = [
    homePage(context),
    ...collections.map((collection) => collectionPage(collection, context)),
    ...products.map((product) => productPage(product, context)),
    aboutPage(context),
    helpPage(context),
    checkoutPage(context),
    notFoundPage(context),
  ];
  checkUniquePages(pages, problems);
  stopIfProblems(problems);

  const rendered = pages.map((page) => ({ file: page.file, markup: layout(page, context) }));
  checkReferences(rendered, problems);
  stopIfProblems(problems);

  await writeFile(fromRoot(STORE_DATA_FILE), storeData);
  for (const { file, markup } of rendered) await writeFile(fromRoot(file), markup);

  const removed = await removeStalePages(new Set(pages.map((page) => page.file)));

  if (site.url) {
    await writeFile(fromRoot(SITEMAP_FILE), sitemap(pages));
  } else if (existsSync(fromRoot(SITEMAP_FILE)) && (await isGenerated(SITEMAP_FILE))) {
    await rm(fromRoot(SITEMAP_FILE));
  }

  console.log(`Built ${pages.length} pages: ${products.length} products in ${categories.length} collections.`);
  if (removed.length > 0) console.log(`Removed pages that are no longer in the catalogue: ${removed.join(', ')}`);
  if (!site.contact.whatsapp) console.log('Note: no WhatsApp number is set in src/data/site.mjs, so checkout runs in preview mode.');
  if (!site.url) console.log('Note: site.url is empty, so canonical links, link-preview images and sitemap.xml are left out.');
}

try {
  await build();
} catch (error) {
  if (!(error instanceof ContentError)) throw error;
  console.error(error.message);
  process.exitCode = 1;
}
