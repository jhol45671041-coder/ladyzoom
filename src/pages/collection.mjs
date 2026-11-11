import { html } from '../lib/html.mjs';
import { productGrid } from '../templates/components.mjs';
import { icon } from '../templates/icons.mjs';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

/** A listing page: the collection tabs, a sort control and the product grid. */
export function collectionPage(collection, { site, collections }) {
  const count = collection.products.length;

  const body = html`<section class="page-head container">
  <p class="eyebrow">${site.season}</p>
  <h1 class="page-title">${collection.heading}</h1>
  <p class="page-intro">${collection.intro}</p>
</section>

<section class="listing container">
  <div class="toolbar">
    <nav class="tabs" aria-label="Collections">
      <ul>
        ${collections.map(
          (item) => html`<li><a href="${item.id}.html"${item.id === collection.id ? html` aria-current="page"` : ''}>${item.name}</a></li>`,
        )}
      </ul>
    </nav>
    <div class="toolbar__end">
      <p class="toolbar__count">${count} ${count === 1 ? 'piece' : 'pieces'}</p>
      <label class="sort" data-sort-control hidden>
        <span class="sort__label">Sort by</span>
        <span class="sort__field">
          <select data-sort>
            ${SORT_OPTIONS.map((option) => html`<option value="${option.value}">${option.label}</option>`)}
          </select>
          ${icon('chevron', { size: 16 })}
        </span>
      </label>
    </div>
  </div>
  ${count > 0
    ? productGrid(collection.products, { sortable: true })
    : html`<p class="listing__empty">New pieces are on their way. <a class="text-link" href="shop.html">See the full collection ${icon('arrow', { size: 18 })}</a></p>`}
</section>`;

  return {
    file: `${collection.id}.html`,
    id: collection.id,
    title: `${collection.heading} | ${site.name}`,
    shareTitle: `${collection.heading} at ${site.name}`,
    description: collection.intro,
    body,
  };
}
