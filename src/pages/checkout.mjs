import { html } from '../lib/html.mjs';
import { icon } from '../templates/icons.mjs';

/**
 * Checkout: delivery details and an order summary.
 *
 * There is no payment gateway. Placing an order opens WhatsApp with the order
 * written out as a ready-to-send message to the store's number
 * (site.contact.whatsapp). assets/js/site.js drives this page: it shows one of
 * the three states below (empty bag, the form, or the confirmation).
 */
export function checkoutPage({ site }) {
  const connected = Boolean(site.contact.whatsapp);

  const body = html`<section class="page-head page-head--compact container">
  <p class="eyebrow">Checkout</p>
  <h1 class="page-title">Complete your order</h1>
</section>

<div class="checkout container" data-checkout>
  <noscript>
    <p class="notice">Checkout needs JavaScript. Please enable it in your browser and reload this page.</p>
  </noscript>

  <div class="checkout__state" data-checkout-empty hidden>
    <p class="checkout__lede">Your bag is empty.</p>
    <a class="btn btn--primary" href="shop.html">Shop all pieces</a>
  </div>

  <div class="checkout__grid" data-checkout-main hidden>
    <form class="form" data-checkout-form>
      <h2 class="form__heading">Delivery details</h2>
      <div class="field">
        <label for="checkout-name">Full name</label>
        <input id="checkout-name" name="name" type="text" autocomplete="name" required>
      </div>
      <div class="field">
        <label for="checkout-phone">Phone number</label>
        <input id="checkout-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required aria-describedby="checkout-phone-hint">
        <p class="field__hint" id="checkout-phone-hint">We use this number to confirm your order.</p>
      </div>
      <div class="field">
        <label for="checkout-address">Delivery address</label>
        <textarea id="checkout-address" name="address" rows="3" autocomplete="street-address" required></textarea>
      </div>
      <div class="field">
        <label for="checkout-city">City</label>
        <input id="checkout-city" name="city" type="text" autocomplete="address-level2" required>
      </div>
      <div class="field">
        <label for="checkout-notes">Order notes <span class="field__optional">(optional)</span></label>
        <textarea id="checkout-notes" name="notes" rows="2"></textarea>
      </div>

      <h2 class="form__heading">Payment</h2>
      <p class="pay-method">${icon('cash', { size: 24 })}<span><strong>Cash on delivery</strong> Pay the courier when your order arrives.</span></p>

      ${connected
        ? ''
        : html`<p class="notice"><strong>Preview mode.</strong> No store WhatsApp number has been added yet, so WhatsApp will ask which chat to send the order to. Add the number in <code>src/data/site.mjs</code> to receive orders.</p>`}

      <button class="btn btn--primary btn--block" type="submit">Place order on WhatsApp</button>
      <p class="form__note">Your order opens in WhatsApp as a ready-to-send message. Send it, and we will reply to confirm your delivery.</p>
    </form>

    <aside class="summary" aria-labelledby="summary-title">
      <h2 class="form__heading" id="summary-title">Order summary</h2>
      <ul class="bag-lines" data-bag-lines></ul>
      <dl class="totals">
        <div><dt>Subtotal</dt><dd data-bag-subtotal></dd></div>
        <div><dt>Delivery</dt><dd data-bag-delivery></dd></div>
        <div class="totals__total"><dt>Total</dt><dd data-bag-total></dd></div>
      </dl>
    </aside>
  </div>

  <div class="checkout__state" data-checkout-done hidden tabindex="-1">
    <p class="eyebrow">One last step</p>
    <h2 class="section-title">Send your order in WhatsApp</h2>
    <p class="checkout__lede">Your order is written out and waiting in WhatsApp. Press send there to place it, and we will reply to confirm your delivery.</p>
    <p class="field__hint" data-order-tracking-status role="status" aria-live="polite"></p>
    <div class="checkout__actions">
      <a class="btn btn--primary" data-checkout-reopen target="_blank" rel="noopener">Open WhatsApp again</a>
      <a class="btn btn--ghost" href="shop.html">Continue shopping</a>
    </div>
  </div>
</div>`;

  return {
    file: 'checkout.html',
    id: 'checkout',
    title: `Checkout | ${site.name}`,
    description: `Complete your ${site.name} order.`,
    noindex: true,
    body,
  };
}
