/**
 * A small HTML templating helper.
 *
 * html`<p>${value}</p>` escapes every interpolated value by default, so
 * catalogue text can never break the markup. Nested html`` results and arrays
 * of them pass through untouched; null, undefined and booleans render nothing.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

class SafeHtml {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

/** Marks a string as already-safe markup. Only use it on trusted, hand-written HTML. */
export const raw = (value) => new SafeHtml(String(value));

function render(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    out += render(values[i]) + strings[i + 1];
  }
  return new SafeHtml(out);
}
