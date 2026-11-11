import { raw } from '../lib/html.mjs';

/**
 * Line icons, drawn on a 24×24 grid and stroked in the current text colour.
 * Icons are decorative: the element around them carries the accessible name.
 */
const SHAPES = {
  bag: '<path d="M5.5 8.5h13l1 12h-15z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
  menu: '<path d="M3.5 8h17M3.5 16h17"/>',
  close: '<path d="m5.5 5.5 13 13m0-13-13 13"/>',
  arrow: '<path d="M4 12h16m-5.5-5.5L20 12l-5.5 5.5"/>',
  'arrow-left': '<path d="M20 12H4m5.5-5.5L4 12l5.5 5.5"/>',
  chevron: '<path d="m6 9.5 6 6 6-6"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  minus: '<path d="M5.5 12h13"/>',
  pause: '<path d="M8.5 5v14m7-14v14"/>',
  play: '<path d="M7.5 4.5v15L19.5 12z"/>',
  truck:
    '<path d="M2.5 6.5h11V16h-11z"/><path d="M13.5 9.5h4l3 3.5v3h-7"/><circle cx="7" cy="17.5" r="1.75"/><circle cx="17" cy="17.5" r="1.75"/>',
  cash: '<rect x="2.5" y="6.5" width="19" height="11" rx="1"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4m12-4v4"/>',
  exchange: '<path d="M4 8.5h15L15.5 5M20 15.5H5L8.5 19"/>',
  ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1"/><path d="M6.5 8v3m4-3v4m4-4v3m4-3v4"/>',
  chat: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.3A8.5 8.5 0 1 1 20.5 11.5Z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="1"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  phone:
    '<path d="M5 3.5h3.5l1.75 4.25-2.25 1.5a11.5 11.5 0 0 0 5.25 5.25l1.5-2.25L19 14v3.5a2 2 0 0 1-2 2A14 14 0 0 1 3 5.5a2 2 0 0 1 2-2Z"/>',
  instagram:
    '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="0.75" fill="currentColor" stroke="none"/>',
  facebook:
    '<path d="M14 8.5V7a1.5 1.5 0 0 1 1.5-1.5H17V3h-2a4 4 0 0 0-4 4v1.5H8.5V11H11v10h3V11h2.5l.5-2.5Z"/>',
};

export function icon(name, { size = 24, className = '' } = {}) {
  const shape = SHAPES[name];
  if (!shape) throw new Error(`Unknown icon "${name}"`);
  const classes = className ? `icon ${className}` : 'icon';
  return raw(
    `<svg class="${classes}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shape}</svg>`,
  );
}
