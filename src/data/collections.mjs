import { categories, products } from './catalog.mjs';

/**
 * The shop's listing pages, in menu order: everything, New In, then one page
 * per collection in catalog.mjs. Each becomes <id>.html.
 */
export const collections = [
  {
    id: 'shop',
    name: 'All',
    menuLabel: 'All pieces',
    heading: 'The Collection',
    intro: 'Every piece of the season, from everyday pret to occasion wear.',
    products,
    inHeader: false,
  },
  {
    id: 'new-in',
    name: 'New In',
    menuLabel: 'New In',
    heading: 'New In',
    intro: 'The latest arrivals, just added to the collection.',
    products: products.filter((product) => product.isNew),
    inHeader: true,
  },
  ...categories.map((category) => ({
    id: category.id,
    name: category.name,
    menuLabel: category.name,
    heading: category.name,
    intro: category.intro,
    products: products.filter((product) => product.category === category.id),
    inHeader: true,
  })),
];

/** Shop links for the header, mobile menu and footer: New In and the collections first, "All pieces" last. */
export const shopNav = [...collections.slice(1), collections[0]].map((collection) => ({
  id: collection.id,
  href: `${collection.id}.html`,
  label: collection.menuLabel,
  inHeader: collection.inHeader,
}));
