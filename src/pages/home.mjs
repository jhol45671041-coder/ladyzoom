import { heightFor, imageSizes } from '../data/image-sizes.mjs';
import { html } from '../lib/html.mjs';
import {
  collectionUrl,
  imageSrcset,
  largestWidth,
  ornament,
  productGrid,
  productImage,
  sectionHead,
} from '../templates/components.mjs';
import { icon } from '../templates/icons.mjs';

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
      <img class="hero__image" src="assets/img/hero-wide-${largestWidth(heroWide)}.webp" srcset="${imageSrcset('hero-wide', heroWide)}" sizes="100vw" width="${largestWidth(heroWide)}" height="${heightFor(heroWide, largestWidth(heroWide))}" alt="A model in profile wearing a burgundy velvet kurta with gold embroidery and a trailing organza dupatta" fetchpriority="high" decoding="async">
    </picture>`;
}

function perks(site) {
  const items = [
    { icon: 'truck', title: 'Delivery across Pakistan', text: `Arrives in ${site.delivery.time}` },
    { icon: 'cash', title: 'Cash on delivery', text: 'Pay when your order arrives' },
    { icon: 'exchange', title: 'Easy exchanges', text: `Within ${site.exchange.days} days of delivery` },
  ];
  return html`<section class="perks" aria-label="Shopping with us">
  <div class="container">
    <ul class="perks__list">
      ${items.map(
        (item) => html`<li class="perk">
        ${icon(item.icon, { size: 28 })}
        <div>
          <p class="perk__title">${item.title}</p>
          <p class="perk__text">${item.text}</p>
        </div>
      </li>`,
      )}
    </ul>
  </div>
</section>`;
}

function collectionTiles(categories) {
  return html`<section class="section container">
  ${sectionHead({ eyebrow: 'The collections', title: 'Shop by collection' })}
  <ul class="tiles">
    ${categories.map(
      (category) => html`<li class="tile" data-reveal>
      <a class="tile__link" href="${collectionUrl(category)}">
        ${productImage(category.image, { alt: '', sizes: '(min-width: 700px) 32vw, 78vw' })}
        <div class="tile__label">
          <h3 class="tile__name">${category.name}</h3>
          <span class="text-link">Discover ${icon('arrow', { size: 18 })}</span>
        </div>
      </a>
    </li>`,
    )}
  </ul>
</section>`;
}

/** How many pieces each featured row on the home page shows. */
const FEATURED_COUNT = 3;

export function homePage({ site, categories, products }) {
  const newIn = products.filter((product) => product.isNew).slice(0, FEATURED_COUNT);
  const signature = products.filter((product) => product.signature).slice(0, FEATURED_COUNT);

  const body = html`<section class="hero">
  <div class="hero__media">
    ${heroPicture()}
  </div>
  <div class="hero__content container">
    <p class="eyebrow">${site.season}</p>
    <h1 class="hero__title">Made to be <em>remembered</em></h1>
    <p class="hero__lede">Velvets, silks and rich embroidery in black, gold and burgundy. The new season from ${site.name} is here.</p>
    <div class="hero__actions">
      <a class="btn btn--gold" href="new-in.html">Shop new arrivals</a>
      <a class="btn btn--ghost" href="formals.html">Explore formals</a>
    </div>
  </div>
</section>

${perks(site)}

${collectionTiles(categories)}

${newIn.length > 0
    ? html`<section class="section container">
  ${sectionHead({
    eyebrow: site.season,
    title: 'New this season',
    link: { href: 'new-in.html', label: 'View all new arrivals' },
  })}
  ${productGrid(newIn, { layout: 'feature' })}
</section>`
    : ''}

<section class="band">
  <div class="band__inner" data-reveal>
    ${ornament()}
    <p class="eyebrow">The house colour</p>
    <h2 class="band__title">Burgundy, <em>after dark</em></h2>
    <p class="band__text">Our deepest shade, cut in velvet and raw silk and traced with royal gold. These are the pieces to reach for when the invitation says evening.</p>
    <a class="btn btn--gold" href="luxury-pret.html">Shop Luxury Pret</a>
  </div>
</section>

${signature.length > 0
    ? html`<section class="section container">
  ${sectionHead({
    eyebrow: 'The Signature Edit',
    title: 'Black, gold and burgundy',
    link: { href: 'shop.html', label: 'Shop all pieces' },
  })}
  ${productGrid(signature, { layout: 'feature' })}
</section>`
    : ''}

<section class="story container" data-reveal>
  ${ornament()}
  <p class="eyebrow">Our story</p>
  <p class="story__quote">We design for the woman who knows her own mind, and would rather be remembered than noticed.</p>
  <a class="text-link" href="about.html">Read our story ${icon('arrow', { size: 18 })}</a>
</section>`;

  return {
    file: 'index.html',
    id: 'home',
    title: `${site.name} | ${site.tagline}`,
    shareTitle: site.name,
    description: site.description,
    body,
  };
}
