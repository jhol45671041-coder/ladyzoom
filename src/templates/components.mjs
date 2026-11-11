import { heightFor, imageSizes } from '../data/image-sizes.mjs';
import { formatPrice } from '../lib/format.mjs';
import { html } from '../lib/html.mjs';
import { icon } from './icons.mjs';

/* ---------- Addresses ---------------------------------------------------- */

/** The address of a product's page. */
export const productUrl = (product) => `product-${product.id}.html`;

/** The address of a collection's page. */
export const collectionUrl = (category) => `${category.id}.html`;

/* ---------- Photographs -------------------------------------------------- */

/** The largest width a preset is prepared in. */
export const largestWidth = (preset) => preset.widths[preset.widths.length - 1];

/** srcset for a photo in assets/img, e.g. imageSrcset('hero-wide', imageSizes.heroWide). */
export const imageSrcset = (name, preset) =>
  preset.widths.map((width) => `assets/img/${name}-${width}.webp ${width}w`).join(', ');

/** The file path of a product photo at a given width. */
export const productImagePath = (name, width) => `assets/img/products/${name}-${width}.webp`;

/** The file path of a product photo at its largest size. */
export const productImageLarge = (name) => productImagePath(name, largestWidth(imageSizes.product));

/**
 * A responsive product photograph.
 * `sizes` tells the browser how wide the photo is drawn, so it can pick the
 * smallest file that still looks sharp. Pass `eager` for a photo that is
 * visible as soon as the page opens.
 */
export function productImage(name, { alt, sizes, eager = false }) {
  const preset = imageSizes.product;
  const largest = largestWidth(preset);
  return html`<img src="${productImagePath(name, largest)}" srcset="${imageSrcset(`products/${name}`, preset)}" sizes="${sizes}" width="${largest}" height="${heightFor(preset, largest)}" alt="${alt}"${eager ? html` fetchpriority="high"` : html` loading="lazy"`} decoding="async">`;
}

/* ---------- Products ----------------------------------------------------- */

/** Price, with the original price struck through when the piece is on sale. */
export function price(product) {
  if (!product.compareAt) {
    return html`<p class="price"><span class="price__now">${formatPrice(product.price)}</span></p>`;
  }
  return html`<p class="price price--sale">
    <span class="price__now"><span class="visually-hidden">Now </span>${formatPrice(product.price)}</span>
    <s class="price__was"><span class="visually-hidden">Was </span>${formatPrice(product.compareAt)}</s>
  </p>`;
}

/** "Sale" or "New" marker, or nothing. */
export function badge(product) {
  if (product.compareAt) return html`<span class="badge badge--sale">Sale</span>`;
  if (product.isNew) return html`<span class="badge">New</span>`;
  return '';
}

/**
 * How wide a card's photo is drawn in each grid layout (see ".grid" in
 * styles.css), so the browser can pick the smallest file that looks sharp.
 */
const CARD_SIZES = {
  // Two columns on phones, three from 560px.
  standard: '(min-width: 1320px) 410px, (min-width: 560px) 31vw, 46vw',
  // The first card of a "feature" grid runs the full width on phones.
  lead: '(min-width: 1320px) 410px, (min-width: 560px) 31vw, 92vw',
  // Two columns up to 800px, then four.
  four: '(min-width: 1320px) 306px, (min-width: 800px) 23vw, 46vw',
};

/**
 * A product as it appears in a grid.
 * data-price and data-index let the sort control on listing pages reorder cards.
 */
export function productCard(product, index, sizes = CARD_SIZES.standard) {
  return html`<li class="card" data-reveal data-price="${product.price}" data-index="${index}">
    <a class="card__link" href="${productUrl(product)}">
      <div class="card__media">
        ${productImage(product.images[0], { alt: product.alt, sizes })}
        ${badge(product)}
      </div>
      <div class="card__body">
        <h3 class="card__name">${product.name}</h3>
        <p class="card__title">${product.title}</p>
        ${price(product)}
      </div>
    </a>
  </li>`;
}

/**
 * A grid of product cards.
 *
 * layout  'standard'  two columns on phones, three on larger screens.
 *         'feature'   for a row of three: on phones the first card runs the
 *                     full width with the other two beneath it.
 *         'four'      for a row of four: two by two on phones.
 */
export function productGrid(products, { sortable = false, layout = 'standard' } = {}) {
  const sizesFor = (index) => {
    if (layout === 'four') return CARD_SIZES.four;
    if (layout === 'feature' && index === 0) return CARD_SIZES.lead;
    return CARD_SIZES.standard;
  };
  return html`<ul class="grid${layout === 'standard' ? '' : ` grid--${layout}`}"${sortable ? html` data-sort-grid` : ''}>
    ${products.map((product, index) => productCard(product, index, sizesFor(index)))}
  </ul>`;
}

/** The size chart as a table. */
export function sizeTable(sizeChart) {
  return html`<div class="table-wrap">
    <table class="size-table">
      <caption class="visually-hidden">Body measurements in ${sizeChart.unit}</caption>
      <thead>
        <tr>${sizeChart.columns.map((column) => html`<th scope="col">${column}</th>`)}</tr>
      </thead>
      <tbody>
        ${sizeChart.rows.map(
          (row) => html`<tr>${row.map((cell, index) => (index === 0 ? html`<th scope="row">${cell}</th>` : html`<td>${cell}</td>`))}</tr>`,
        )}
      </tbody>
    </table>
  </div>`;
}

/* ---------- Page furniture ----------------------------------------------- */

/** Heading block that opens a section, with an optional "view all" link. */
export function sectionHead({ eyebrow, title, link }) {
  return html`<div class="section-head" data-reveal>
    <div>
      <p class="eyebrow">${eyebrow}</p>
      <h2 class="section-title">${title}</h2>
    </div>
    ${link ? html`<a class="text-link" href="${link.href}">${link.label} ${icon('arrow', { size: 18 })}</a>` : ''}
  </div>`;
}

/** The small gold diamond-and-rule divider. */
export const ornament = () => html`<span class="ornament" aria-hidden="true"></span>`;
