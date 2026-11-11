/**
 * Store-wide settings.
 *
 * Everything a customer can act on (prices aside) lives in this one file, so
 * there is a single place to update when the business details change.
 * After editing, run `npm run build` to regenerate the pages.
 */
export const site = {
  name: 'LadyZoom',
  tagline: 'Pret, luxury pret and formals for women',
  description:
    'LadyZoom designs pret, luxury pret and occasion wear for women in matte black, royal gold and burgundy. Delivered across Pakistan with cash on delivery.',

  /** Shown above the hero headline and on the collection pages. */
  season: 'Winter Festive ’26',

  /**
   * The public address of the live site, without a trailing slash — for example
   * 'https://jhol45671041-coder.github.io/ladyzoom' or 'https://www.yourdomain.com'.
   *
   * Leave it empty until the site is live. Once set, the build adds canonical
   * links, images for link previews (WhatsApp, Facebook, …) and sitemap.xml.
   */
  url: '',

  currency: { code: 'PKR', symbol: 'Rs.' },

  /** SAMPLE TERMS — replace with the real delivery charges and policy. */
  delivery: {
    fee: 250, // flat charge per order
    freeOver: 10000, // orders at or above this amount ship free
    time: '3–5 working days',
  },
  exchange: {
    days: 7,
  },

  /**
   * Contact details. Anything left empty is simply not shown on the site, so
   * no placeholder number or address can ever reach a customer.
   */
  contact: {
    /**
     * WhatsApp number that receives orders: digits only, with the country
     * code and no leading zero or plus sign — e.g. '923001234567'.
     * While this is empty the checkout runs in preview mode.
     */
    whatsapp: '',
    email: '',
    phone: '', // as it should be displayed, e.g. '+92 300 1234567'
    instagram: '', // full link, e.g. 'https://www.instagram.com/yourhandle'
    facebook: '', // full link
  },
};
