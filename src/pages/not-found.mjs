import { html, raw } from '../lib/html.mjs';
import { ornament } from '../templates/components.mjs';

/**
 * A missing page can be requested from any folder depth (/a/b/c), where this
 * page's relative links to the stylesheet and the shop would point at the
 * wrong place. If that has happened, reload it from its own address at the
 * top of the site: "/<repository>/404.html" on a GitHub Pages project site,
 * "/404.html" everywhere else. Runs before anything else loads.
 */
const ROOT_FIX = raw(`<script>
(function () {
  var path = location.pathname;
  var firstFolder = path.split('/')[1];
  var onGitHubPages = /\\.github\\.io$/.test(location.hostname);
  var root = onGitHubPages && firstFolder ? '/' + firstFolder + '/' : '/';
  var nested = path.indexOf(root) !== 0 || path.indexOf('/', root.length) !== -1;
  if (nested) location.replace(root + '404.html');
})();
</script>`);

export function notFoundPage({ site }) {
  const body = html`<section class="story story--page container">
  ${ornament()}
  <p class="eyebrow">Page not found</p>
  <h1 class="story__quote">This page has slipped away</h1>
  <p class="story__text">The link may be out of date, or the piece may no longer be in the collection.</p>
  <a class="btn btn--gold" href="shop.html">Shop all pieces</a>
</section>`;

  return {
    file: '404.html',
    id: 'not-found',
    title: `Page not found | ${site.name}`,
    description: `This page could not be found on ${site.name}.`,
    noindex: true,
    headStart: ROOT_FIX,
    body,
  };
}
