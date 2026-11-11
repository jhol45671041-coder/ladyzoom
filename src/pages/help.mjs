import { formatPrice } from '../lib/format.mjs';
import { html } from '../lib/html.mjs';
import { sizeTable } from '../templates/components.mjs';
import { contactList } from '../templates/layout.mjs';

/**
 * Customer care: delivery, payment, exchanges, sizing, garment care, contact.
 * The delivery and exchange figures come from src/data/site.mjs.
 * THE POLICY WORDING IS A SAMPLE — check it matches how the store really works.
 */
export function helpPage({ site, sizeChart }) {
  const contact = contactList(site, 'contact-list contact-list--lg');

  const sections = [
    {
      id: 'delivery',
      title: 'Delivery',
      body: html`<p>We deliver across Pakistan. Orders arrive in ${site.delivery.time} from the day we confirm them with you.</p>
      <p>Delivery is ${formatPrice(site.delivery.fee)} per order, and complimentary on orders of ${formatPrice(site.delivery.freeOver)} or more.</p>`,
    },
    {
      id: 'payment',
      title: 'Payment',
      body: html`<p>We accept cash on delivery. When you place an order it is sent to us on WhatsApp, and we confirm the details with you before anything is dispatched. You pay the courier when your order arrives.</p>`,
    },
    {
      id: 'exchanges',
      title: 'Exchanges',
      body: html`<p>If the size is not right, tell us within ${site.exchange.days} days of delivery and we will arrange an exchange.</p>
      <ul>
        <li>Pieces must be unworn and unwashed, with their tags attached.</li>
        <li>Pieces bought on sale can be exchanged for a different size only.</li>
        <li>If your order arrives damaged or incorrect, contact us straight away and we will put it right.</li>
      </ul>`,
    },
    {
      id: 'size-guide',
      title: 'Size guide',
      body: html`<p>Our sizes are based on body measurements in ${sizeChart.unit}. If you fall between two sizes, we suggest choosing the larger one.</p>
      ${sizeTable(sizeChart)}
      <h3>How to measure</h3>
      <ul>
        <li><strong>Bust:</strong> around the fullest part, keeping the tape level.</li>
        <li><strong>Waist:</strong> around the narrowest part of your waist.</li>
        <li><strong>Hip:</strong> around the fullest part, standing with your feet together.</li>
      </ul>`,
    },
    {
      id: 'care',
      title: 'Garment care',
      body: html`<p>Each piece lists its own care instructions on its page. As a general guide:</p>
      <ul>
        <li>Dry clean velvet, silk and embroidered pieces.</li>
        <li>Hand wash cottons gently in cold water and dry them in the shade.</li>
        <li>Store embroidered pieces folded flat, with tissue between the layers.</li>
      </ul>`,
    },
    {
      id: 'contact',
      title: 'Contact us',
      body: contact
        ? html`<p>We are happy to help with sizing, orders and exchanges.</p>${contact}`
        : html`<p>Our contact details will be listed here soon.</p>`,
    },
  ];

  const body = html`<section class="page-head container">
  <p class="eyebrow">Customer care</p>
  <h1 class="page-title">How can we help?</h1>
  <p class="page-intro">Delivery, payment, exchanges and sizing, all in one place.</p>
</section>

<div class="help container">
  <nav class="help__nav" aria-label="On this page">
    <ul>
      ${sections.map((section) => html`<li><a href="#${section.id}">${section.title}</a></li>`)}
    </ul>
  </nav>
  <div class="help__body">
    ${sections.map(
      (section) => html`<section class="help__section prose" id="${section.id}" aria-labelledby="${section.id}-title">
      <h2 class="section-title" id="${section.id}-title">${section.title}</h2>
      ${section.body}
    </section>`,
    )}
  </div>
</div>`;

  return {
    file: 'help.html',
    id: 'help',
    title: `Customer Care | ${site.name}`,
    shareTitle: `Customer care at ${site.name}`,
    description: `Delivery times and charges, cash on delivery, exchanges and the size guide for ${site.name}.`,
    body,
  };
}
