/**
 * The shapes and pixel widths every photograph is prepared in.
 *
 * Shared by tools/images.mjs (which writes the files) and the page templates
 * (which reference them), so the two can never disagree.
 */
export const imageSizes = {
  /** Home-page hero on wide screens, where the photo sits behind the headline. */
  heroWide: { ratio: 16 / 9, widths: [960, 1920] },
  /** Home-page hero on phones and upright tablets, where the photo sits above the headline. */
  heroTall: { ratio: 4 / 5, widths: [600, 1080] },
  /** The photograph beside "Our philosophy" on the home page. */
  story: { ratio: 3 / 2, widths: [720, 1440] },
  /** The strip of fabric behind the updates list, above the footer. */
  satin: { ratio: 24 / 7, widths: [960, 1920] },
  /** Product photographs. */
  product: { ratio: 4 / 5, widths: [480, 960] },
};

/** Height in pixels of an image prepared at `width` in the given preset. */
export const heightFor = (preset, width) => Math.round(width / preset.ratio);
