import { site } from '../data/site.mjs';

/** Adds thousands separators: 18950 → "18,950". */
export const groupDigits = (amount) => String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Formats an amount as a price: 18950 → "Rs. 18,950".
 * The space is non-breaking so a price never wraps in two.
 * assets/js/site.js formats prices the same way in the browser.
 */
export const formatPrice = (amount) => `${site.currency.symbol}\u00A0${groupDigits(amount)}`;
