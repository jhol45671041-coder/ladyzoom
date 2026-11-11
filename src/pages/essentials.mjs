import { formatPrice } from '../lib/format.mjs';
import { html } from '../lib/html.mjs';
import { sizeTable } from '../templates/components.mjs';
import { contactList } from '../templates/layout.mjs';

const pageHead = (eyebrow, title, intro) => html`<section class="page-head container">
  <p class="eyebrow">${eyebrow}</p>
  <h1 class="page-title">${title}</h1>
  <p class="page-intro">${intro}</p>
</section>`;

const policyPage = ({ file, id, title, eyebrow, intro, description, body, sample = false }) => ({
  file,
  id,
  title: `${title} | LadyZoom`,
  description,
  noindex: false,
  body: html`${pageHead(eyebrow, title, intro)}
    <article class="policy container prose${sample ? ' policy--sample' : ''}">
      ${sample ? html`<p class="policy__notice"><strong>Sample policy:</strong> Please review and replace this wording with the store’s final policy before accepting customer orders.</p>` : ''}
      ${body}
    </article>`,
});

export function essentialsPages({ site, sizeChart }) {
  const contacts = contactList(site, 'contact-list contact-list--lg');
  return [
    policyPage({
      file: 'contact.html', id: 'contact', title: 'Contact us', eyebrow: 'We are here to help',
      intro: 'Questions about a piece, an order or finding the right size? Get in touch.',
      description: 'Contact LadyZoom for help with sizing, orders and exchanges.',
      body: html`<section class="policy__section"><h2>Customer care</h2>
        ${contacts ? html`<p>Reach our customer-care team using the contact details below.</p>${contacts}` : html`<p>Our contact details have not been added yet. Please check back soon, or use the customer-care information provided with your order.</p><p>The store owner can add the correct details in <code>src/data/site.mjs</code>.</p>`}
        <p>For order questions, include your name and order details. Please do not send payment-card or password information.</p>
      </section><p class="policy__updated">For delivery and exchange information, see <a href="shipping.html">Shipping</a> and <a href="returns.html">Returns &amp; exchanges</a>.</p>`,
    }),
    policyPage({
      file: 'size-guide.html', id: 'size-guide', title: 'Size guide', eyebrow: 'Find your fit',
      intro: 'Use the measurements below as a starting point. If you are between sizes, we suggest choosing the larger one.',
      description: `Body measurements and measuring advice for ${site.name} clothing.`,
      body: html`<section class="policy__section"><h2>Body measurements</h2><p>Measurements are in ${sizeChart.unit}.</p>${sizeTable(sizeChart)}
        <h3>How to measure</h3><ul><li><strong>Bust:</strong> around the fullest part, keeping the tape level.</li><li><strong>Waist:</strong> around the narrowest part of your waist.</li><li><strong>Hip:</strong> around the fullest part, standing with your feet together.</li></ul>
        <p>For help choosing a size, <a href="contact.html">contact customer care</a>.</p></section>`,
    }),
    policyPage({
      file: 'shipping.html', id: 'shipping', title: 'Shipping', eyebrow: 'Delivery, with care',
      intro: 'Delivery information for LadyZoom orders within Pakistan.',
      description: `Delivery times and charges for ${site.name} orders.`,
      body: html`<section class="policy__section"><h2>Delivery across Pakistan</h2>
        <p>Our estimated delivery time is ${site.delivery.time} after we confirm your order.</p>
        <p>Delivery is ${formatPrice(site.delivery.fee)} per order, and complimentary on orders of ${formatPrice(site.delivery.freeOver)} or more.</p>
        <p>We currently accept cash on delivery. Orders are sent to the store through WhatsApp; the store will confirm your details before dispatch. Your order is not confirmed until the store replies.</p>
        <p>These are sample store settings. Delivery estimates can vary by location and during busy periods; please confirm the current estimate with customer care.</p>
      </section><p class="policy__updated">Questions? Visit <a href="contact.html">Contact us</a>.</p>`,
      sample: true,
    }),
    policyPage({
      file: 'returns.html', id: 'returns', title: 'Returns & exchanges', eyebrow: 'A considered exchange',
      intro: 'If something is not quite right, contact us and we will help with the next step.',
      description: `Exchange guidance and sample return policy for ${site.name}.`,
      body: html`<section class="policy__section"><h2>Exchange window</h2>
        <p>Please contact us within ${site.exchange.days} days of delivery to ask about an exchange. Pieces should be unworn and unwashed, with tags attached. Sale pieces may be exchanged for a different size only.</p>
        <h3>Received something damaged or incorrect?</h3><p>Contact customer care as soon as possible and include your order details and a clear description of the issue.</p>
        <h3>How to request help</h3><p>Get in touch before sending anything back. We will confirm the available options and return instructions. Please do not post an item without speaking to us first.</p>
        <p>This is sample policy wording, not a complete refund policy. Confirm the store’s actual return, exchange and refund terms before publishing.</p>
      </section><p class="policy__updated">See <a href="shipping.html">Shipping</a> or <a href="contact.html">contact customer care</a>.</p>`,
      sample: true,
    }),
    policyPage({
      file: 'faqs.html', id: 'faqs', title: 'Frequently asked questions', eyebrow: 'Good to know',
      intro: 'A few quick answers about shopping with LadyZoom.',
      description: `Frequently asked questions about ${site.name} orders, delivery, sizing and accounts.`,
      body: html`<section class="policy__section"><h2>Orders &amp; payment</h2>
        <h3>How do I place an order?</h3><p>Add pieces to your bag and continue to checkout. The order details open in WhatsApp; send the message there, then wait for the store to confirm.</p>
        <h3>How do I pay?</h3><p>The current sample checkout offers cash on delivery. Payment is made to the courier when the parcel arrives.</p>
        <h3>Can I track an order in my account?</h3><p>Sign in before checkout to keep the WhatsApp order request in your account history. Guest orders are not linked to an account. A request is not confirmed until the store replies.</p>
        <h2>Delivery &amp; exchanges</h2>
        <h3>How long does delivery take?</h3><p>The current estimate is ${site.delivery.time} after order confirmation. See <a href="shipping.html">Shipping</a> for charges.</p>
        <h3>Can I exchange a piece?</h3><p>Contact us within ${site.exchange.days} days of delivery. See the <a href="returns.html">exchange guidance</a> for the sample terms.</p>
        <h2>Products &amp; accounts</h2>
        <h3>How do I choose my size?</h3><p>Use the <a href="size-guide.html">size guide</a>, or ask customer care for help.</p>
        <h3>How do I create an account?</h3><p>Open <a href="account.html">Your account</a> and enter your email. We will send a one-time sign-in link.</p>
      </section><p class="policy__updated">Still have a question? <a href="contact.html">Contact us</a>.</p>`,
    }),
    policyPage({
      file: 'privacy.html', id: 'privacy', title: 'Privacy policy', eyebrow: 'Your information',
      intro: 'What this sample storefront stores when you create an account or place an order request.',
      description: `How ${site.name} handles customer account and order information.`,
      body: html`<section class="policy__section"><h2>Information you provide</h2>
        <p>If you create an account, the site uses your email address to send a sign-in link. You may save your name, phone number, delivery address, city and profile photo. If you submit checkout while signed in, the site records the order details and items in your account history. Guest checkout opens WhatsApp and does not create an account-linked order record.</p>
        <h2>Where it is stored</h2><p>Account profiles, private profile photos and account-linked order requests are stored in the LadyZoom Supabase project. Profile data and photos are restricted to the account that owns them; order records are visible to that account and authorized store administrators. The current project is hosted in Mumbai, India.</p>
        <h2>Browser storage &amp; third parties</h2><p>The shopping bag is saved in your browser so it remains available when you return. Checkout opens WhatsApp to send the order message; WhatsApp is a separate service with its own privacy practices. The site does not currently use an analytics service.</p>
        <h2>Your choices</h2><p>You can sign out from your account. To ask the store to correct or remove account data, contact customer care. Contact details must be added by the store owner before this request route is available.</p>
        <p>This is a draft based on the current site implementation. The store owner should review it for applicable law, retention periods, data-contact details and any future integrations before launch.</p>
      </section><p class="policy__updated">Last reviewed: 11 November 2026 · Questions? <a href="contact.html">Contact us</a>.</p>`,
      sample: true,
    }),
    policyPage({
      file: 'terms.html', id: 'terms', title: 'Terms of service', eyebrow: 'Shopping with us',
      intro: 'A short guide to placing an order through the LadyZoom storefront.',
      description: `Sample terms for shopping with ${site.name}.`,
      body: html`<section class="policy__section"><h2>Orders &amp; confirmation</h2>
        <p>Submitting checkout opens WhatsApp with your order details. The order is a request until the store confirms it with you. The store may contact you to verify availability, sizing, delivery details and the total before dispatch.</p>
        <h2>Prices &amp; payment</h2><p>Prices are shown in Pakistani rupees. The sample checkout offers cash on delivery; no online payment is taken by this website. Delivery charges and estimates are shown on the <a href="shipping.html">Shipping</a> page.</p>
        <h2>Product information</h2><p>Colours may look different across screens. Please check the product details and <a href="size-guide.html">size guide</a> before ordering. If you have a question, contact customer care.</p>
        <h2>Changes to these terms</h2><p>The store may update product information and these terms. The version shown when you place an order request is the one to review with the store before confirmation.</p>
        <p>This is a sample, not legal advice or a complete contract. The store owner should replace it with terms reviewed for the business and applicable law.</p>
      </section><p class="policy__updated">Last reviewed: 11 November 2026 · See <a href="returns.html">Returns &amp; exchanges</a>.</p>`,
      sample: true,
    }),
  ];
}
