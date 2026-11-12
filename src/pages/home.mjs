import { heightFor, imageSizes } from '../data/image-sizes.mjs';
import { html, raw } from '../lib/html.mjs';
import {
  collectionUrl,
  imageSrcset,
  largestWidth,
  productImage,
  productRail,
  productUrl,
} from '../templates/components.mjs';
import { icon } from '../templates/icons.mjs';

/* The wording on this page is SAMPLE COPY. Rewrite it in the label's own words. */

/**
 * Whether the Bestsellers row moves along by itself while it is on screen.
 * Set to false for a row that only moves when swiped or stepped through.
 */
const BESTSELLERS_SCROLL = true;

/** The three pieces pictured in the campaign section, by product id. */
const CAMPAIGN_PIECES = ['mehr', 'shehzadi', 'mahnoor'];

/**
 * When the hero stacks the photograph above the words: on phones, and on
 * tablets held upright. Must match the ".hero" media query in styles.css.
 */
const HERO_STACKED = '(max-width: 699px), (max-width: 899px) and (orientation: portrait)';

/** The campaign photograph: a tall crop where the hero is stacked, the wide frame everywhere else. */
function heroPicture() {
  const { heroWide, heroTall } = imageSizes;
  return html`<picture>
      <source media="${HERO_STACKED}" srcset="${imageSrcset('hero-tall', heroTall)}" sizes="100vw" width="${largestWidth(heroTall)}" height="${heightFor(heroTall, largestWidth(heroTall))}">
      <img class="hero__image" src="assets/img/hero-wide-${largestWidth(heroWide)}.webp" srcset="${imageSrcset('hero-wide', heroWide)}" sizes="100vw" width="${largestWidth(heroWide)}" height="${heightFor(heroWide, largestWidth(heroWide))}" alt="A woman in a burgundy velvet kurta with gold embroidery on a terrace at night, the lit domes of a mosque behind her" fetchpriority="high" decoding="async">
    </picture>`;
}

/** A heading set on several lines, one per part. */
const stacked = (...parts) => parts.map((part) => html`<span>${part}</span> `);

/** Two digits, as in a contents list: 1 → "01". */
const numbered = (index) => String(index + 1).padStart(2, '0');

function hero({ site, categories }) {
  return html`<section class="hero">
  <div class="hero__media">
    ${heroPicture()}
  </div>
  <div class="hero__inner container">
    <div class="hero__content">
      <p class="eyebrow">${site.season}</p>
      <h1 class="hero__title">${stacked('Made', 'to be', 'remembered')}</h1>
      <p class="hero__lede">Velvets, silks and rich embroidery for the evenings that matter.</p>
      <a class="btn btn--ghost" href="new-in.html">Shop the new season ${icon('arrow', { size: 16 })}</a>
    </div>
    <nav class="hero__aside" aria-label="Collections">
      <p class="hero__note">${stacked('Three', 'collections', 'one wardrobe')}</p>
      <ol class="hero__index">
        ${categories.map(
          (category, index) => html`<li><a href="${collectionUrl(category)}">${category.name} <span aria-hidden="true">${numbered(index)}</span></a></li>`,
        )}
      </ol>
    </nav>
  </div>
</section>`;
}

/** The collections as four photographs on cream, led by New In when there is something new. */
function edit({ categories, products }) {
  const newest = products.find((product) => product.isNew);
  const tiles = categories.map((category) => ({ href: collectionUrl(category), name: category.name, image: category.image }));
  if (newest) tiles.push({ href: 'new-in.html', name: 'New In', image: newest.images[1] ?? newest.images[0] });

  return html`<section class="edit on-cream">
  <div class="edit__inner container">
    <div class="edit__intro" data-reveal>
      <h2 class="edit__title">${stacked('The', 'Festive', 'Edit')}</h2>
      <p class="edit__text">From everyday pret to richly embroidered formals, pieces designed for the season’s most memorable evenings.</p>
      <a class="text-link" href="shop.html">Explore the collection ${icon('arrow', { size: 16 })}</a>
    </div>
    <ul class="edit__tiles${tiles.length === 4 ? '' : ' edit__tiles--three'}">
      ${tiles.map(
        (tile) => html`<li class="edit-tile" data-reveal>
        <a href="${tile.href}">
          <div class="edit-tile__media">
            ${productImage(tile.image, { alt: '', sizes: '(min-width: 1320px) 235px, (min-width: 900px) 18vw, (min-width: 640px) 23vw, 46vw' })}
          </div>
          <h3 class="edit-tile__name">${tile.name}</h3>
        </a>
      </li>`,
      )}
    </ul>
  </div>
</section>`;
}

/** The pieces marked `bestseller` in the catalogue, in a row that scrolls sideways. */
function bestsellers(pieces) {
  if (pieces.length === 0) return '';
  return html`<section class="best">
  <div class="container">
    <div class="best__head" data-reveal>
      <div>
        <p class="eyebrow">Most loved</p>
        <h2 class="best__title">Bestsellers</h2>
      </div>
      <div class="best__aside">
        <p class="best__text">The pieces chosen again and again, season after season.</p>
        <a class="text-link" href="shop.html">View all ${icon('arrow', { size: 16 })}</a>
        <div class="rail-controls" data-rail-controls="bestsellers" hidden>
          <button class="rail-btn" type="button" data-rail-prev aria-controls="bestsellers" aria-label="Previous pieces">${icon('arrow-left', { size: 18 })}</button>
          <button class="rail-btn" type="button" data-rail-next aria-controls="bestsellers" aria-label="More pieces">${icon('arrow', { size: 18 })}</button>
        </div>
      </div>
    </div>
    ${productRail(pieces, { id: 'bestsellers', label: 'Bestsellers', scroll: BESTSELLERS_SCROLL })}
  </div>
</section>`;
}

/**
 * A row of arches receding into the light: the pale picture at the edge of
 * the philosophy panel. Drawn here rather than photographed, so it is always
 * in the panel's own colours.
 */
function arches() {
  /** One pointed arch: its two feet, the height its curve springs from, and its tip. */
  const arch = (left, right, foot, spring, tip) => {
    const middle = (left + right) / 2;
    const width = right - left;
    const rise = spring - tip;
    const shoulder = spring - rise * 0.62;
    const neck = tip + rise * 0.1;
    return `M${left} ${foot}V${spring}C${left} ${shoulder} ${middle - width * 0.2} ${neck} ${middle} ${tip}C${middle + width * 0.2} ${neck} ${right} ${shoulder} ${right} ${spring}V${foot}Z`;
  };
  // From the nearest arch to the furthest. Each runs off the foot of the picture.
  const shapes = [
    { path: arch(36, 364, 540, 236, 40), fill: '#f1e9df' },
    { path: arch(92, 308, 540, 262, 116), fill: '#e2d5c6' },
    { path: arch(134, 266, 540, 286, 180), fill: '#efe6da' },
    { path: arch(164, 236, 540, 306, 236), fill: '#fbf7f1' },
  ];
  return raw(`<svg class="philosophy__arches" viewBox="0 0 400 520" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
      <rect width="400" height="520" fill="#e6dacc"/>
      ${shapes.map((shape) => `<path d="${shape.path}" fill="${shape.fill}" stroke="#cdbba6" stroke-width="1"/>`).join('\n      ')}
    </svg>`);
}

function philosophy({ site }) {
  const { story } = imageSizes;
  const width = largestWidth(story);
  return html`<section class="philosophy on-cream">
  <div class="philosophy__photo">
    <img src="assets/img/story-${width}.webp" srcset="${imageSrcset('story', story)}" sizes="(min-width: 900px) 40vw, 100vw" width="${width}" height="${heightFor(story, width)}" alt="A model in profile in an embroidered velvet kurta, photographed in black and white" loading="lazy" decoding="async">
  </div>
  <div class="philosophy__panel">
    ${arches()}
    <div class="philosophy__body" data-reveal>
      <p class="eyebrow">Our philosophy</p>
      <h2 class="philosophy__title">${stacked('Dressed with', 'intention')}</h2>
      <p class="philosophy__text">At ${site.name} we design for the moments a woman wants to feel most like herself. We begin with the cloth, keep our cuts clean so the detail can speak, and return each season to matte black, royal gold and burgundy.</p>
      <a class="text-link" href="about.html">Our story ${icon('arrow', { size: 16 })}</a>
    </div>
    <div class="philosophy__aside">
      <p>${stacked('Fabric', 'Detail', 'Fit')}</p>
      <p>${stacked('Black', 'Gold', 'Burgundy')}</p>
    </div>
  </div>
</section>`;
}

/** Three evening photographs beside a few words about the season's story. */
function campaign(pieces) {
  if (pieces.length === 0) return '';
  return html`<section class="campaign">
  <div class="campaign__inner container">
    <div class="campaign__intro" data-reveal>
      <p class="eyebrow">The campaign</p>
      <h2 class="campaign__title">${stacked('Burgundy,', 'after dark')}</h2>
      <p class="campaign__text">Our deepest shade, cut in velvet and silk and traced with royal gold. The pieces to reach for when the invitation says evening.</p>
      <a class="text-link" href="shop.html">Discover the pieces ${icon('arrow', { size: 16 })}</a>
    </div>
    <ul class="campaign__shots">
      ${pieces.map(
        (product) => html`<li data-reveal>
        <a class="campaign__shot" href="${productUrl(product)}">
          ${productImage(product.images[1] ?? product.images[0], {
            alt: `${product.name}, ${product.title}`,
            sizes: '(min-width: 1320px) 350px, (min-width: 900px) 26vw, 34vw',
          })}
        </a>
      </li>`,
      )}
    </ul>
  </div>
</section>`;
}

/**
 * An invitation to hear about new collections. Like checkout, it works
 * through WhatsApp: the form opens a chat with the store, with the request
 * already written. assets/js/site.js adds the customer's name to the message.
 */
function join({ site }) {
  return html`<section class="join" aria-labelledby="join-title">
  <div class="join__inner container" data-reveal>
    <p class="eyebrow">Exclusive updates</p>
    <h2 class="join__title" id="join-title">Be the first to know</h2>
    <p class="join__text">New collections and private previews, sent to you on WhatsApp.</p>
    <form class="join__form" action="https://wa.me/${site.contact.whatsapp}" method="get" target="_blank" rel="noopener" data-join>
      <input type="hidden" name="text" value="Hello ${site.name}, please add me to your updates list.">
      <label class="visually-hidden" for="join-name">Your name</label>
      <input class="join__field" id="join-name" type="text" autocomplete="name" placeholder="Your name" maxlength="60" required data-join-name>
      <button class="btn btn--ink" type="submit">Join the list ${icon('arrow', { size: 16 })}</button>
    </form>
    <p class="join__status" data-join-status hidden></p>
  </div>
</section>`;
}

export function homePage(context) {
  const { site, products } = context;
  const bestselling = products.filter((product) => product.bestseller);
  const campaignPieces = CAMPAIGN_PIECES.map((id) => products.find((product) => product.id === id)).filter(Boolean);

  const body = html`${hero(context)}

${edit(context)}

${bestsellers(bestselling)}

${philosophy(context)}

${campaign(campaignPieces)}

${join(context)}`;

  return {
    file: 'index.html',
    id: 'home',
    title: `${site.name} | ${site.tagline}`,
    shareTitle: site.name,
    description: site.description,
    bodyClass: 'is-home',
    body,
  };
}
