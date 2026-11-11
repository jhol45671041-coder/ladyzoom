import { formatPrice } from '../lib/format.mjs';
import { html } from '../lib/html.mjs';
import {
  collectionUrl,
  price,
  productGrid,
  productImage,
  productImageLarge,
  sectionHead,
  sizeTable,
} from '../templates/components.mjs';
import { icon } from '../templates/icons.mjs';

const RELATED_COUNT = 4;

/** Other pieces to suggest: the same collection first, then the rest of the catalogue. */
function relatedProducts(product, products) {
  const others = products.filter((candidate) => candidate.id !== product.id);
  const sameCollection = others.filter((candidate) => candidate.category === product.category);
  const rest = others.filter((candidate) => candidate.category !== product.category);
  return [...sameCollection, ...rest].slice(0, RELATED_COUNT);
}

function sizePicker(product) {
  const onlyOne = product.sizes.length === 1;
  return html`<div class="sizes">
        <div class="sizes__head">
          <span class="sizes__label" id="size-label">Size</span>
          <button class="link-btn" type="button" data-open="size-guide">${icon('ruler', { size: 18 })} Size guide</button>
        </div>
        <div class="sizes__options" role="radiogroup" aria-labelledby="size-label">
          ${product.sizes.map(
            (size, index) => html`<span class="size">
            <input class="visually-hidden" type="radio" name="size" id="size-${index}" value="${size}"${onlyOne ? html` checked` : ''}>
            <label for="size-${index}">${size}</label>
          </span>`,
          )}
        </div>
        <p class="form-error" data-buy-error hidden>Please choose a size.</p>
      </div>`;
}

function sizeGuideDialog(sizeChart) {
  return html`<dialog class="modal" id="size-guide" aria-labelledby="size-guide-title">
  <div class="modal__head">
    <h2 class="modal__title" id="size-guide-title">Size guide</h2>
    <button class="icon-btn" type="button" data-close aria-label="Close size guide">${icon('close')}</button>
  </div>
  <div class="modal__body">
    <p>Body measurements in ${sizeChart.unit}. Between two sizes? We suggest the larger one.</p>
    ${sizeTable(sizeChart)}
    <a class="text-link" href="help.html#size-guide">How to measure ${icon('arrow', { size: 18 })}</a>
  </div>
</dialog>`;
}

export function productPage(product, { site, categories, products, sizeChart }) {
  const category = categories.find((candidate) => candidate.id === product.category);
  const related = relatedProducts(product, products);
  const manyPhotos = product.images.length > 1;

  const body = html`<div class="container">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol>
      <li><a href="index.html">Home</a></li>
      <li><a href="${collectionUrl(category)}">${category.name}</a></li>
      <li aria-current="page">${product.name}</li>
    </ol>
  </nav>

  <article class="product">
    <div class="product__gallery${manyPhotos ? ' product__gallery--many' : ''}">
      ${product.images.map(
        (name, index) => html`<div class="product__shot">
        ${productImage(name, {
          alt: index === 0 ? product.alt : `${product.alt}, view ${index + 1}`,
          sizes: '(min-width: 760px) 52vw, 100vw',
          eager: index === 0,
        })}
      </div>`,
      )}
    </div>

    <div class="product__info">
      <p class="eyebrow"><a href="${collectionUrl(category)}">${category.name}</a></p>
      <h1 class="product__name">${product.name}</h1>
      <p class="product__title">${product.title}</p>
      ${price(product)}
      <p class="product__summary">${product.summary}</p>

      <form class="buy" data-buy="${product.id}">
      ${sizePicker(product)}
        <button class="btn btn--gold btn--block" type="submit">Add to bag</button>
      </form>

      <ul class="assurances">
        <li>${icon('truck', { size: 22 })}<span>Delivery across Pakistan in ${site.delivery.time}</span></li>
        <li>${icon('cash', { size: 22 })}<span>Cash on delivery</span></li>
        <li>${icon('exchange', { size: 22 })}<span>Exchange within ${site.exchange.days} days</span></li>
      </ul>

      <div class="accordion">
        <details open>
          <summary>Details ${icon('chevron', { size: 18 })}</summary>
          <div class="accordion__panel">
            <p>${product.pieces}</p>
            <ul>
              ${product.details.map((detail) => html`<li>${detail}</li>`)}
              <li>Colour: ${product.colour}</li>
            </ul>
          </div>
        </details>
        <details>
          <summary>Care ${icon('chevron', { size: 18 })}</summary>
          <div class="accordion__panel">
            <p>${product.care}</p>
          </div>
        </details>
        <details>
          <summary>Delivery and exchanges ${icon('chevron', { size: 18 })}</summary>
          <div class="accordion__panel">
            <p>Delivery is ${formatPrice(site.delivery.fee)} per order and complimentary on orders of ${formatPrice(site.delivery.freeOver)} or more. Orders arrive in ${site.delivery.time}.</p>
            <p>If the size is not right, we will exchange it within ${site.exchange.days} days of delivery. <a href="help.html#exchanges">Read the exchange policy</a>.</p>
          </div>
        </details>
      </div>
    </div>
  </article>
</div>

${related.length > 0
    ? html`<section class="section container">
  ${sectionHead({ eyebrow: 'You may also like', title: 'More from the collection' })}
  ${productGrid(related, { layout: 'four' })}
</section>`
    : ''}`;

  return {
    file: `product-${product.id}.html`,
    id: `product-${product.id}`,
    title: `${product.name}, ${product.title} | ${site.name}`,
    shareTitle: `${product.name}, ${product.title}`,
    description: product.summary,
    ogType: 'product',
    image: productImageLarge(product.images[0]),
    body,
    dialogs: sizeGuideDialog(sizeChart),
  };
}
