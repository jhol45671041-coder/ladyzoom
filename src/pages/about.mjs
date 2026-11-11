import { heightFor, imageSizes } from '../data/image-sizes.mjs';
import { html } from '../lib/html.mjs';
import { imageSrcset, largestWidth, ornament } from '../templates/components.mjs';

/** Brand copy. PLACEHOLDER TEXT — rewrite it in the label's own words. */
const VALUES = [
  {
    title: 'Fabric first',
    text: 'Every piece begins with the cloth. We choose fabrics for how they fall, how they feel against the skin and how they wear over time.',
  },
  {
    title: 'Detail that earns its place',
    text: 'Embroidery, trims and finishing are there to complete a design, not to crowd it. If a detail does not make the piece better, it does not stay.',
  },
  {
    title: 'A fit for you',
    text: 'Our pret and formals run from XS to XL, and if the size is not right we will exchange it.',
  },
];

export function aboutPage({ site }) {
  const { heroWide } = imageSizes;
  const width = largestWidth(heroWide);

  const body = html`<section class="page-head container">
  <p class="eyebrow">Our story</p>
  <h1 class="page-title">Dressed with intention</h1>
  <p class="page-intro">${site.name} makes clothes for the moments a woman wants to feel most like herself, whether that is an ordinary Tuesday or the wedding of the year.</p>
</section>

<figure class="banner container" data-reveal>
  <img src="assets/img/hero-wide-${width}.webp" srcset="${imageSrcset('hero-wide', heroWide)}" sizes="(min-width: 1320px) 1320px, 100vw" width="${width}" height="${heightFor(heroWide, width)}" alt="A model in profile wearing a burgundy velvet kurta with gold embroidery" loading="lazy" decoding="async">
</figure>

<section class="belief on-cream">
  <div class="container">
    <div class="split">
      <h2 class="section-title" data-reveal>What we believe</h2>
      <div class="prose" data-reveal>
        <p>Getting dressed should feel like an occasion. Not a performance, and never a compromise: simply the quiet pleasure of putting on something that fits, falls well and was made with care.</p>
        <p>That idea shapes everything we design. We start with the cloth, because fabric decides how a piece moves and how long it lasts. We keep our cuts clean so the detail can speak. And we return, season after season, to the three colours that define us: matte black, royal gold and burgundy.</p>
        <p>The result is a wardrobe that works together. Cottons and jacquards for the day, silks and velvets for the evening, and richly embroidered formals for the nights that are talked about afterwards.</p>
      </div>
    </div>

    <ol class="values__list" aria-label="What we care about">
      ${VALUES.map(
        (value, index) => html`<li class="value" data-reveal>
        <span class="value__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <h3 class="value__title">${value.title}</h3>
        <p>${value.text}</p>
      </li>`,
      )}
    </ol>
  </div>
</section>

<section class="story container" data-reveal>
  ${ornament()}
  <p class="eyebrow">The collection</p>
  <p class="story__quote">Three colours. One wardrobe.</p>
  <a class="btn btn--primary" href="shop.html">Shop all pieces</a>
</section>`;

  return {
    file: 'about.html',
    id: 'about',
    title: `Our Story | ${site.name}`,
    shareTitle: `The ${site.name} story`,
    description: `${site.name} designs pret, luxury pret and formals for women in matte black, royal gold and burgundy. Read what we believe and how we work.`,
    body,
  };
}
