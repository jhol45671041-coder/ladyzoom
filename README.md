# LadyZoom

A storefront for LadyZoom, a women's clothing label: pret, luxury pret and formals,
presented in matte black (`#0B0B0B`), royal gold (`#D4AF37`) and burgundy (`#800020`).

It is a static site. There is no server, database or account system: customers fill a
bag, and checkout hands the order to the store on WhatsApp for cash on delivery.

> **The content is sample content.** Product names, prices, descriptions, the size
> chart, the delivery and exchange terms and the brand story are placeholders, and
> the photographs are AI-generated stand-ins. Replace them before taking orders
> (see [Before going live](#before-going-live)).

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| Listings: all pieces, New In, and one per collection | `shop.html`, `new-in.html`, `pret.html`, `luxury-pret.html`, `formals.html` |
| One page per product | `product-<id>.html` |
| Our Story | `about.html` |
| Customer care: delivery, payment, exchanges, size guide, garment care, contact | `help.html` |
| Checkout | `checkout.html` |
| Not found | `404.html` |

## Run it locally

Node 18 or newer is needed to build. The build has no dependencies, so there is
nothing to install first.

```sh
npm run build      # regenerate the pages from src/
npm run preview    # serve the site at http://localhost:3000 (uses python3)
```

Any static file server pointed at this folder works in place of `npm run preview`.

## Before going live

1. **WhatsApp number.** Set `contact.whatsapp` in `src/data/site.mjs`. Until it is
   set, checkout runs in preview mode: it shows a notice saying so, and WhatsApp
   asks the customer which chat to send the order to.
2. **Catalogue.** Replace the sample products, prices and size chart in
   `src/data/catalog.mjs`.
3. **Photographs.** Replace the placeholder photos (see [Photographs](#photographs)).
4. **Terms.** Set the delivery charge, free-delivery threshold, delivery time and
   exchange period in `src/data/site.mjs`, then read through `src/pages/help.mjs`
   so the wording matches your actual policy.
5. **Contact details.** Fill in the email, phone and social links in
   `src/data/site.mjs`. Anything left empty is not shown.
6. **Brand story.** Rewrite `src/pages/about.mjs` in your own words.
7. **Site address.** Once the site is published, set `url` in `src/data/site.mjs`
   and rebuild. This adds canonical links, link-preview images and `sitemap.xml`.

Run `npm run build` after any of these and commit the result.

## Editing the site

The HTML files in this folder are generated. Edit the sources below, then run
`npm run build`; changes made directly to the HTML are overwritten.

| To change | Edit |
| --- | --- |
| Store name, season line, delivery terms, contact details, site address | `src/data/site.mjs` |
| Collections, products, prices, size chart | `src/data/catalog.mjs` |
| Home page sections and wording | `src/pages/home.mjs` |
| Our Story | `src/pages/about.mjs` |
| Customer care wording | `src/pages/help.mjs` |
| Header, footer, menus, bag drawer | `src/templates/layout.mjs` |
| Colours, type and layout | `assets/css/styles.css` (the colours are the variables at the top) |
| Bag, sorting and checkout behaviour | `assets/js/site.js` |

The build checks the content before writing anything: duplicate or malformed ids,
missing prices or sizes, photos that do not exist, and every link on every page.
If it finds a mistake it lists what is wrong and leaves the site untouched.

### Add a product

1. Save its photo as `photos/products/<id>-1.jpg` and run `npm run images`
   (see below).
2. Add an entry to `products` in `src/data/catalog.mjs`. The comment above the
   list explains each field.
3. Run `npm run build`.

To put a piece on sale, set `compareAt` to its original price. To mark it new, set
`isNew: true`. Stock is not tracked, so when a size sells out, remove it from the
product's `sizes`.

### Photographs

Originals go in `photos/`, which is not committed. `npm run images` crops them to
shape and writes web-sized WebP files to `assets/img/`, which is committed.

| Original | Shape | Used for |
| --- | --- | --- |
| `photos/hero.jpg` | landscape, 16:9 | Home page on wide screens. The headline sits over the left half, so keep the subject on the right. |
| `photos/hero-mobile.jpg` | portrait, 4:5 | Home page on phones and upright tablets. |
| `photos/products/<name>.jpg` | portrait, 4:5 | Product photos. `<name>` is what a product lists under `images`, for example `mehr-1`. |

JPG, PNG, WebP, AVIF and TIFF all work. A photo in another shape is cropped from
the centre.

```sh
npm install        # once: installs sharp, the image library
npm run images
```

The browser icons are `assets/img/favicon.svg`, `favicon.png` (48 × 48) and
`apple-touch-icon.png` (180 × 180). Replace them with files of the same names.

## How ordering works

- The bag is kept in the customer's own browser, so it is still there when they
  come back on the same device.
- At checkout the customer enters a name, phone number and address. The site
  writes the order out as a WhatsApp message addressed to the store, and the
  customer presses send.
- The store replies to confirm, then dispatches. Payment is cash on delivery.
- Orders are not recorded anywhere else. The WhatsApp chat is the record.

## Publishing

The folder is the website: there is no build step for a host to run, because the
generated pages are committed. Links are relative, so the site works at a domain
root and in a subfolder alike.

- **GitHub Pages:** in the repository's Settings → Pages, choose "Deploy from a
  branch" and select the root of `main`. The site appears at
  `https://<username>.github.io/ladyzoom/`.
- **Netlify, Vercel, Cloudflare Pages and similar:** no build command; the output
  directory is the repository root.

If the host applies a Content Security Policy: every script and stylesheet is a
file on the site, with one exception. `404.html` has a short inline script that
reloads the page from the top of the site when a missing address is inside a
subfolder, so that its links and styling resolve. Under `script-src 'self'` that
script is blocked and such addresses show an unstyled page; allow it by hash to
avoid that. The only outside address the site uses is `https://wa.me`, opened at
checkout.

## Layout of the project

```
index.html, shop.html, …    generated pages
assets/
  css/styles.css            all styling
  js/site.js                bag, menus, sorting, checkout
  js/store-data.js          generated: the catalogue, for the browser
  img/                      prepared photographs and icons
  fonts/                    typefaces, with their licences
src/
  data/                     store settings, catalogue, listing pages, image sizes
  pages/                    one file per kind of page
  templates/                shared layout, components and icons
  lib/                      small helpers
build.mjs                   turns src/ into the pages
tools/images.mjs            prepares photographs
photos/                     original photographs (not committed)
```

## Credits

Typefaces: Cormorant Garamond and Jost, both under the SIL Open Font License 1.1.
They are served from `assets/fonts/`, where the licence texts are kept, so the
site makes no requests to a font service.
