import { html } from '../lib/html.mjs';
import { googleIcon, icon } from '../templates/icons.mjs';

export function accountPage({ site }) {
  const body = html`<section class="page-head page-head--compact container">
  <p class="eyebrow">Your account</p>
  <h1 class="page-title">A little closer.</h1>
  <p class="page-lede">Sign in to keep your delivery details together.</p>
</section>

<section class="account container" data-account>
  <div class="account__card" data-account-login>
    <h2 class="section-title">Welcome back</h2>
    <p class="account__copy">Continue with Google, or enter your email and we’ll send you a secure, one-time sign-in link. New here? You can create an account the same way.</p>
    <div class="account__google">
      <button class="btn btn--google btn--block" type="button" data-google-signin>${googleIcon()}<span>Continue with Google</span></button>
      <p class="field__hint" data-google-status role="status" aria-live="polite"></p>
    </div>
    <div class="account__divider" aria-hidden="true"><span>or</span></div>
    <form class="form account__form" data-account-login-form>
      <div class="field"><label for="account-email">Email address</label><input id="account-email" name="email" type="email" autocomplete="email" required></div>
      <button class="btn btn--primary" type="submit">Email me a sign-in link</button>
      <p class="field__hint" data-account-status role="status" aria-live="polite"></p>
    </form>
  </div>

  <div class="account__card" data-account-profile hidden>
    <div class="account__profile-head"><div><p class="eyebrow">Your details</p><h2 class="section-title">Delivery profile</h2><p class="account__copy">Signed in as <span data-account-email></span></p></div><button class="btn btn--ghost" type="button" data-account-signout>Sign out</button></div>
    <div class="account__avatar">
      <button class="account__avatar-button" type="button" data-avatar-button aria-label="Add a profile photo">
        <img data-avatar-image alt="Your profile photo" hidden>
        <span class="account__avatar-placeholder" data-avatar-placeholder>${icon('user', { size: 32 })}</span>
        <span data-avatar-label>Add a profile photo</span>
      </button>
      <input data-avatar-file type="file" accept="image/jpeg,image/png,image/webp" hidden>
      <p class="field__hint" data-avatar-status role="status" aria-live="polite">JPG, PNG or WebP, up to 3 MB. Only you can see it.</p>
    </div>
    <form class="form account__form" data-profile-form>
      <div class="field"><label for="profile-name">Full name</label><input id="profile-name" name="full_name" type="text" autocomplete="name" maxlength="120"></div>
      <div class="field"><label for="profile-phone">Phone number</label><input id="profile-phone" name="phone" type="tel" autocomplete="tel" maxlength="40"></div>
      <div class="field"><label for="profile-address">Delivery address</label><textarea id="profile-address" name="address" rows="3" autocomplete="street-address" maxlength="500"></textarea></div>
      <div class="field"><label for="profile-city">City</label><input id="profile-city" name="city" type="text" autocomplete="address-level2" maxlength="100"></div>
      <button class="btn btn--primary" type="submit">Save my details</button>
      <p class="field__hint" data-profile-status role="status" aria-live="polite"></p>
    </form>
    <div class="account__orders"><div class="account__orders-head"><h3>Order history</h3><p><strong data-order-count>0</strong> <span data-order-label>orders</span></p></div><p data-orders-empty>Your orders placed while signed in will appear here. Requests are not confirmed until the store replies.</p><ol class="account__order-list" data-order-list></ol></div>
  </div>
</section>`;

  return {
    file: 'account.html',
    id: 'account',
    title: `Your account | ${site.name}`,
    description: `Sign in to your ${site.name} customer account.`,
    noindex: true,
    headStart: html`<script type="module" src="assets/js/account.js"></script>`,
    body,
  };
}
