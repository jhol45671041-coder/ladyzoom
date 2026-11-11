/**
 * The catalogue: collections, products and the size chart.
 *
 * EVERYTHING HERE IS SAMPLE CONTENT — names, prices, descriptions and
 * measurements are placeholders to be replaced with the real range.
 * After editing, run `npm run build` to regenerate the pages.
 */

/**
 * Collections, in the order they appear in the menu.
 *
 * id     becomes the page name (`pret` → pret.html), so keep it lower-case
 *        with hyphens.
 * image  the product photo used for the collection's tile on the home page.
 *        The evening photographs (the second photo of each piece) suit it best.
 */
export const categories = [
  {
    id: 'pret',
    name: 'Pret',
    intro: 'Ready-to-wear for every day: clean cuts in cotton and jacquard, finished with just enough detail.',
    image: 'zoya-2',
  },
  {
    id: 'luxury-pret',
    name: 'Luxury Pret',
    intro: 'Silks and velvets for dinners, dawats and every evening that asks for a little more.',
    image: 'gulnar-2',
  },
  {
    id: 'formals',
    name: 'Formals',
    intro: 'Occasion wear, richly embroidered for weddings and festive nights.',
    image: 'zarmina-2',
  },
];

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/**
 * Products, in the order they appear on the "All" page.
 *
 * id         becomes the page name (`mehr` → product-mehr.html) and is what the
 *            shopping bag stores. Lower-case with hyphens; never reuse an id.
 * name       the piece's name, shown large.
 * title      the descriptive line shown beneath the name.
 * category   one of the collection ids above.
 * price      in rupees, no separators.
 * compareAt  optional original price. When set, the piece is shown as on sale.
 * pieces     what is included.
 * colour     shown on the product page.
 * sizes      the sizes offered. Use ['One Size'] for shawls and the like.
 * images     photo names without the size suffix or extension. `mehr-1` means
 *            assets/img/products/mehr-1-480.webp and mehr-1-960.webp, both made
 *            by `npm run images`. The first photo is the main one: the studio
 *            shot on a plain backdrop, used wherever the piece is listed. A
 *            second photo, if there is one, appears when a card is hovered and
 *            alongside the first on the product page.
 * alt        describes the main photo for screen readers and search engines.
 * isNew      lists the piece under New In and marks it "New".
 * bestseller lists the piece under Bestsellers on the home page.
 * summary    one or two sentences shown on the product page and in link previews.
 * details    bullet points for the Details panel.
 * care       care instructions.
 */
export const products = [
  {
    id: 'mehr',
    name: 'Mehr',
    title: 'Burgundy Velvet Kurta Set',
    category: 'luxury-pret',
    price: 18950,
    pieces: '3-piece: kurta, trousers and dupatta',
    colour: 'Burgundy',
    sizes: STANDARD_SIZES,
    images: ['mehr-1', 'mehr-2'],
    alt: 'Model wearing the Mehr burgundy velvet kurta with gold embroidery and a sheer burgundy dupatta',
    bestseller: true,
    summary:
      'Deep burgundy velvet traced with antique-gold tilla at the neckline, cuffs and hem, finished with a sheer organza dupatta. The look from this season’s campaign.',
    details: [
      'Straight-cut velvet kurta with full sleeves',
      'Antique-gold tilla embroidery at the neckline, cuffs and hem',
      'Matching straight trousers',
      'Organza dupatta with a gold border',
    ],
    care: 'Dry clean only. Store folded, with tissue between the embroidery.',
  },
  {
    id: 'noor-jahan',
    name: 'Noor Jahan',
    title: 'Ivory & Gold Peshwas',
    category: 'formals',
    price: 46500,
    pieces: '2-piece: peshwas and dupatta',
    colour: 'Ivory',
    sizes: STANDARD_SIZES,
    images: ['noor-jahan-1', 'noor-jahan-2'],
    alt: 'Model wearing the Noor Jahan floor-length ivory peshwas with gold embroidery and a matching dupatta',
    isNew: true,
    summary:
      'A floor-length ivory organza peshwas with a fitted bodice and a full, sweeping skirt, embroidered throughout in gold.',
    details: [
      'Floor-length peshwas with a fitted, full-sleeve bodice',
      'All-over gold zari and pearl embroidery',
      'Organza dupatta with an embroidered gold border',
      'Fully lined',
    ],
    care: 'Dry clean only. Hang in a garment bag away from direct light.',
  },
  {
    id: 'sehar',
    name: 'Sehar',
    title: 'Emerald Jacquard Kurta Set',
    category: 'pret',
    price: 7250,
    pieces: '2-piece: kurta and trousers',
    colour: 'Emerald',
    sizes: STANDARD_SIZES,
    images: ['sehar-1', 'sehar-2'],
    alt: 'Model wearing the Sehar emerald green jacquard kurta with matching trousers',
    isNew: true,
    summary:
      'Emerald jacquard with a tone-on-tone paisley weave, a notched neckline and gold tassels at the cuffs.',
    details: [
      'Knee-length jacquard kurta with a notched neckline',
      'Gold tassel detail at the cuffs',
      'Matching straight trousers',
    ],
    care: 'Dry clean recommended. Iron on the reverse at a low heat.',
  },
  {
    id: 'shehzadi',
    name: 'Shehzadi',
    title: 'Burgundy Zardozi Sharara Set',
    category: 'formals',
    price: 38500,
    pieces: '3-piece: shirt, sharara and dupatta',
    colour: 'Burgundy',
    sizes: STANDARD_SIZES,
    images: ['shehzadi-1', 'shehzadi-2'],
    alt: 'Model wearing the Shehzadi burgundy formal shirt and sharara with heavy gold embroidery and a scalloped dupatta',
    bestseller: true,
    summary:
      'A burgundy formal densely worked in antique gold, paired with an embroidered sharara and a scalloped net dupatta.',
    details: [
      'Long shirt with all-over zardozi and sequin embroidery',
      'Flared sharara with an embroidered border',
      'Net dupatta with a scalloped gold edge',
      'Fully lined',
    ],
    care: 'Dry clean only. Store flat, with tissue between the embroidery.',
  },
  {
    id: 'zoya',
    name: 'Zoya',
    title: 'Ivory Chikankari Kurta Set',
    category: 'pret',
    price: 6450,
    compareAt: 7950,
    pieces: '2-piece: kurta and trousers',
    colour: 'Ivory',
    sizes: STANDARD_SIZES,
    images: ['zoya-1', 'zoya-2'],
    alt: 'Model wearing the Zoya ivory cotton kurta with tone-on-tone embroidery and matching trousers',
    bestseller: true,
    summary:
      'A straight ivory kurta in soft cotton with tone-on-tone chikankari embroidery and covered buttons. The easiest piece in the wardrobe.',
    details: [
      'Straight-cut cotton kurta with full sleeves',
      'Tone-on-tone chikankari embroidery',
      'Matching straight trousers',
    ],
    care: 'Gentle hand wash in cold water. Dry in the shade.',
  },
  {
    id: 'zarmina',
    name: 'Zarmina',
    title: 'Black & Gold Gharara Set',
    category: 'formals',
    price: 34500,
    pieces: '3-piece: kurti, gharara and dupatta',
    colour: 'Black',
    sizes: STANDARD_SIZES,
    images: ['zarmina-1', 'zarmina-2'],
    alt: 'Model wearing the Zarmina black embroidered kurti and gharara with gold borders and a net dupatta',
    bestseller: true,
    summary:
      'A black embroidered kurti over a full gharara edged in gold, with a net dupatta to match. Made for mehndis and late evenings.',
    details: [
      'Kurti with gold tilla embroidery',
      'Full gharara with a wide gold border',
      'Net dupatta with an embroidered edge',
      'Fully lined',
    ],
    care: 'Dry clean only. Store flat, with tissue between the embroidery.',
  },
  {
    id: 'mahnoor',
    name: 'Mahnoor',
    title: 'Burgundy Silk Co-ord',
    category: 'luxury-pret',
    price: 9950,
    pieces: '2-piece: shirt and trousers',
    colour: 'Burgundy',
    sizes: STANDARD_SIZES,
    images: ['mahnoor-1', 'mahnoor-2'],
    alt: 'Model wearing the Mahnoor burgundy silk shirt with matching wide-leg trousers',
    isNew: true,
    summary:
      'A relaxed band-collar shirt and wide-leg trousers in burgundy raw silk. Polished enough for dinner, easy enough for the whole day.',
    details: [
      'Relaxed raw-silk shirt with a band collar and gold buttons',
      'Matching wide-leg trousers with a pressed crease',
      'Side pockets',
    ],
    care: 'Dry clean only.',
  },
  {
    id: 'gulnar',
    name: 'Gulnar',
    title: 'Antique Rose Raw Silk Set',
    category: 'luxury-pret',
    price: 16500,
    pieces: '3-piece: kurta, trousers and dupatta',
    colour: 'Antique rose',
    sizes: STANDARD_SIZES,
    images: ['gulnar-1', 'gulnar-2'],
    alt: 'Model wearing the Gulnar antique rose silk kurta with gold detailing and a matching dupatta',
    bestseller: true,
    summary:
      'Antique-rose raw silk with gold gota work at the neckline, cuffs and hem, and a soft organza dupatta.',
    details: [
      'Long raw-silk kurta with full sleeves',
      'Gold gota work at the neckline, cuffs and hem',
      'Matching straight trousers',
      'Organza dupatta with a gold edge',
    ],
    care: 'Dry clean only.',
  },
  {
    id: 'anaya',
    name: 'Anaya',
    title: 'Black Gold-Print Kurta Set',
    category: 'pret',
    price: 5950,
    pieces: '2-piece: kurta and trousers',
    colour: 'Black',
    sizes: STANDARD_SIZES,
    images: ['anaya-1', 'anaya-2'],
    alt: 'Model wearing the Anaya black A-line kurta with a gold printed border and black trousers',
    bestseller: true,
    summary:
      'An A-line black kurta with a gold block-printed border at the hem and cuffs, and a printed neckline to match.',
    details: [
      'A-line cotton kurta with full sleeves',
      'Gold block print at the neckline, cuffs and hem',
      'Matching straight trousers',
    ],
    care: 'Gentle hand wash in cold water, inside out. Dry in the shade.',
  },
];

/**
 * Body measurements in inches. SAMPLE VALUES — replace with the real chart
 * before customers rely on it.
 */
export const sizeChart = {
  unit: 'inches',
  columns: ['Size', 'Bust', 'Waist', 'Hip'],
  rows: [
    ['XS', '32', '26', '35'],
    ['S', '34', '28', '37'],
    ['M', '36', '30', '39'],
    ['L', '39', '33', '42'],
    ['XL', '42', '36', '45'],
  ],
};
