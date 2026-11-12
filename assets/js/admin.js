const SUPABASE_URL = 'https://ztlguqjriqwgcaghvypa.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6Gf1MPLjojjxN62F2zBzOw_0X30c-eJ';
const SESSION_KEY = 'ladyzoom:admin-session';
const $ = (selector, root = document) => root.querySelector(selector);
const loginPanel = $('[data-login-panel]');
const dashboard = $('[data-dashboard]');
const loginStatus = $('[data-login-status]');
const notice = $('[data-admin-notice]');
const productsBody = $('[data-products]');
const ordersBody = $('[data-orders]');
let session = null;

const price = (value) => `Rs. ${Number(value).toLocaleString('en-PK')}`;
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const saveSession = (value) => {
  session = value;
  if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  else localStorage.removeItem(SESSION_KEY);
};

function showNotice(message, kind = 'ok') {
  notice.textContent = message;
  notice.dataset.kind = kind;
  notice.hidden = false;
}

function showSignedIn(user) {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  $('[data-user-email]').textContent = user.email ?? '';
}

async function refreshToken() {
  if (!session?.refresh_token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) { saveSession(null); return false; }
  saveSession(await response.json());
  return true;
}

async function api(path, { method = 'GET', body, prefer } = {}, retry = true) {
  const headers = { apikey: SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${session?.access_token ?? SUPABASE_PUBLISHABLE_KEY}`, 'content-type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.status === 401 && retry && await refreshToken()) return api(path, { method, body, prefer }, false);
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message ?? result?.msg ?? `Request failed (${response.status})`);
  return result;
}

async function rpc(name) {
  const rows = await api(`rpc/${encodeURIComponent(name)}`, { method: 'POST', body: {} });
  return rows;
}

async function loadProducts() {
  const data = await api('products?select=*&order=category.asc,name.asc');
  $('[data-product-count]').textContent = data.length;
  productsBody.innerHTML = data.map((item) => `<tr data-id="${escape(item.id)}">
    <td><span class="product-name">${escape(item.name)}</span><span class="product-id">${escape(item.id)}</span></td>
    <td>${escape(item.category)}</td>
    <td><input aria-label="${escape(item.name)} price" name="price" type="number" min="1" step="1" value="${item.price}"></td>
    <td><input aria-label="${escape(item.name)} compare at price" name="compare_at" type="number" min="0" step="1" value="${item.compare_at ?? ''}" placeholder="—"></td>
    <td><input aria-label="${escape(item.name)} stock" name="stock" type="number" min="0" step="1" value="${item.stock}"></td>
    <td><select aria-label="${escape(item.name)} visibility" name="active"><option value="true"${item.active ? ' selected' : ''}>Live</option><option value="false"${!item.active ? ' selected' : ''}>Hidden</option></select></td>
    <td><button class="save-row" type="button" data-save-product>Save</button></td>
  </tr>`).join('');
}

async function loadOrders() {
  const data = await api('orders?select=*&order=created_at.desc&limit=100');
  $('[data-order-count]').textContent = data.length;
  $('[data-orders-empty]').hidden = data.length > 0;
  ordersBody.innerHTML = data.map((order) => {
    const count = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0;
    return `<tr data-order-id="${escape(order.id)}"><td>#${escape(order.id.slice(0, 8))}</td><td>${escape(order.customer_name)}<span class="product-id">${escape(order.city)} · ${escape(order.phone)}</span></td><td>${count} item${count === 1 ? '' : 's'}</td><td>${price(order.total)}</td><td>${new Date(order.created_at).toLocaleDateString()}</td><td><select name="status" aria-label="Order status"><option${order.status === 'new' ? ' selected' : ''}>new</option><option${order.status === 'confirmed' ? ' selected' : ''}>confirmed</option><option${order.status === 'packed' ? ' selected' : ''}>packed</option><option${order.status === 'shipped' ? ' selected' : ''}>shipped</option><option${order.status === 'complete' ? ' selected' : ''}>complete</option><option${order.status === 'cancelled' ? ' selected' : ''}>cancelled</option></select></td><td><button class="save-row" type="button" data-save-order>Update</button></td></tr>`;
  }).join('');
}

async function refresh() {
  try {
    const isAdmin = await rpc('is_ladyzoom_admin');
    if (!isAdmin) {
      await signOut();
      loginStatus.textContent = 'This email is not on the LadyZoom administrator list. Ask the store owner to grant access.';
      return;
    }
    await Promise.all([loadProducts(), loadOrders()]);
  } catch (error) {
    showNotice(`Could not load the dashboard: ${error.message}`, 'error');
  }
}

async function getUser() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${session.access_token}` } });
  if (!response.ok) { saveSession(null); return null; }
  return response.json();
}

async function signOut() {
  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${session.access_token}` } }).catch(() => {});
  }
  saveSession(null);
  dashboard.hidden = true;
  loginPanel.hidden = false;
}

$('[data-login-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('button[type="submit"]', event.currentTarget);
  button.disabled = true;
  loginStatus.textContent = 'Sending your sign-in link…';
  const email = new FormData(event.currentTarget).get('email').trim().toLowerCase();
  try {
    const redirectTo = encodeURIComponent(window.location.href.split('#')[0]);
    const response = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${redirectTo}`, {
      method: 'POST', headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ email, create_user: true, gotrue_meta_security: {} }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg ?? result.message ?? `Request failed (${response.status})`);
    loginStatus.textContent = 'If this email is eligible, a one-time sign-in link is on its way. Check your inbox.';
  } catch (error) {
    loginStatus.textContent = `Could not send the link: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});

const passwordResetPanel = $('[data-password-reset-panel]');
const passwordForm = $('[data-password-form]');
const emailValue = () => $('[name="email"]', $('[data-login-form]')).value.trim().toLowerCase();

async function authRequest(path, body) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST', headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.msg ?? result.message ?? `Request failed (${response.status})`);
  return result;
}

async function startPasswordSession() {
  const result = await authRequest('token?grant_type=password', { email: emailValue(), password: $('[name="password"]', passwordForm).value });
  saveSession({ ...result, user: result.user });
  showSignedIn(result.user);
  await refresh();
}

$('[data-password-login]').addEventListener('click', async () => {
  if (!emailValue()) { loginStatus.textContent = 'Enter your approved admin email first.'; $('[name="email"]').focus(); return; }
  const button = $('[data-password-login]');
  button.disabled = true;
  loginStatus.textContent = 'Signing in…';
  try { await startPasswordSession(); }
  catch (error) { loginStatus.textContent = `Could not sign in: ${error.message}`; }
  finally { button.disabled = false; }
});

$('[data-create-account]').addEventListener('click', async () => {
  if (!emailValue()) { loginStatus.textContent = 'Enter your approved admin email first.'; $('[name="email"]').focus(); return; }
  const password = $('[name="password"]', passwordForm).value;
  if (password.length < 10) { loginStatus.textContent = 'Choose a password with at least 10 characters.'; $('[name="password"]').focus(); return; }
  const button = $('[data-create-account]');
  button.disabled = true;
  loginStatus.textContent = 'Creating your account…';
  try {
    await authRequest(`signup?redirect_to=${encodeURIComponent(window.location.href.split('#')[0])}`, { email: emailValue(), password });
    loginStatus.textContent = 'If this is an eligible admin email, check your inbox to confirm the account, then sign in with your password.';
  } catch (error) {
    loginStatus.textContent = `${error.message} If this email already has an account, use “Forgot password?” to set a password.`;
  } finally { button.disabled = false; }
});

$('[data-reset-password]').addEventListener('click', async () => {
  if (!emailValue()) { loginStatus.textContent = 'Enter your admin email first.'; $('[name="email"]').focus(); return; }
  const button = $('[data-reset-password]');
  button.disabled = true;
  try {
    await authRequest(`recover?redirect_to=${encodeURIComponent(window.location.href.split('#')[0])}`, { email: emailValue() });
    loginStatus.textContent = 'If that email has an account, a password-reset link is on its way.';
  } catch (error) { loginStatus.textContent = `Could not send a reset link: ${error.message}`; }
  finally { button.disabled = false; }
});

$('[data-password-reset-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = new FormData(event.currentTarget).get('password');
  if (password.length < 10) { loginStatus.textContent = 'Choose a password with at least 10 characters.'; return; }
  const button = $('button[type="submit"]', event.currentTarget);
  button.disabled = true;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'PATCH', headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${session?.access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg ?? result.message ?? 'Password update failed.');
    await signOut();
    passwordResetPanel.hidden = true;
    loginStatus.textContent = 'Password saved. Sign in with your new password.';
  } catch (error) { loginStatus.textContent = `Could not save the password: ${error.message}`; }
  finally { button.disabled = false; }
});

$('[data-sign-out]').addEventListener('click', signOut);
document.querySelectorAll('[data-tab]').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('is-active', item === tab));
  document.querySelectorAll('[data-section]').forEach((section) => { section.hidden = section.dataset.section !== tab.dataset.tab; });
  if (tab.dataset.tab === 'orders') loadOrders().catch((error) => showNotice(error.message, 'error'));
}));

productsBody.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-save-product]');
  if (!button) return;
  const row = button.closest('tr');
  const number = (name) => Number(row.querySelector(`[name="${name}"]`).value);
  const compare = row.querySelector('[name="compare_at"]').value;
  const patch = { price: number('price'), compare_at: compare === '' ? null : Number(compare), stock: number('stock'), active: row.querySelector('[name="active"]').value === 'true', updated_at: new Date().toISOString() };
  if (!Number.isInteger(patch.price) || patch.price < 1 || (patch.compare_at !== null && (!Number.isInteger(patch.compare_at) || patch.compare_at <= patch.price)) || !Number.isInteger(patch.stock) || patch.stock < 0) {
    showNotice('Check the price, compare-at price and stock values. Compare-at must be higher than the current price.', 'error');
    return;
  }
  button.disabled = true;
  try {
    await api(`products?id=eq.${encodeURIComponent(row.dataset.id)}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
    showNotice(`${row.querySelector('.product-name').textContent} saved.`);
  } catch (error) { showNotice(`Product could not be saved: ${error.message}`, 'error'); }
  finally { button.disabled = false; }
});

ordersBody.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-save-order]');
  if (!button) return;
  const row = button.closest('tr');
  button.disabled = true;
  try {
    await api(`orders?id=eq.${encodeURIComponent(row.dataset.orderId)}`, { method: 'PATCH', body: { status: row.querySelector('[name="status"]').value }, prefer: 'return=minimal' });
    showNotice(`Order #${row.dataset.orderId.slice(0, 8)} updated.`);
  } catch (error) { showNotice(`Order could not be updated: ${error.message}`, 'error'); }
  finally { button.disabled = false; }
});

$('[data-refresh-orders]').addEventListener('click', () => loadOrders().then(() => showNotice('Orders refreshed.')).catch((error) => showNotice(error.message, 'error')));

// Supabase returns one-time-link tokens in the URL fragment. Store them, then
// remove the fragment so the credentials are not left in browser history.
const fragment = new URLSearchParams(window.location.hash.slice(1));
const passwordRecovery = fragment.get('type') === 'recovery';
if (fragment.get('access_token') && fragment.get('refresh_token')) {
  saveSession({ access_token: fragment.get('access_token'), refresh_token: fragment.get('refresh_token'), expires_at: Number(fragment.get('expires_at')) });
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}
if (passwordRecovery) {
  loginPanel.hidden = true;
  passwordResetPanel.hidden = false;
} else {
  if (localStorage.getItem(SESSION_KEY)) session = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (session?.expires_at && session.expires_at * 1000 < Date.now()) await refreshToken();
  if (session) {
    const user = await getUser();
    if (user) {
      showSignedIn(user);
      await refresh();
    }
  }
}
