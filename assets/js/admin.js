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
let productRows = [];
let orderRows = [];
const LOW_STOCK = 5;

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

function renderProducts() {
  const needle = $('[data-product-search]').value.trim().toLowerCase();
  const visible = productRows.filter((item) => `${item.name} ${item.id} ${item.category} ${item.title}`.toLowerCase().includes(needle));
  $('[data-products-empty]').hidden = visible.length > 0;
  productsBody.innerHTML = visible.map((item) => `<tr data-id="${escape(item.id)}">
    <td><span class="product-name">${escape(item.name)}</span><span class="product-id">${escape(item.title || item.id)} · ${escape(item.id)}</span></td>
    <td>${escape(item.category)}</td><td>${price(item.price)}</td>
    <td class="${item.stock <= LOW_STOCK ? 'stock-low' : ''}">${Number(item.stock)}${item.stock <= LOW_STOCK ? '<span class="product-id">Restock soon</span>' : ''}</td>
    <td><span class="state-pill ${item.active ? 'is-live' : 'is-hidden'}">${item.active ? 'Live' : 'Hidden'}</span></td>
    <td><div class="row-actions"><button class="save-row" type="button" data-edit-product>Edit</button><button class="save-row save-row--danger" type="button" data-remove-product>Delete</button></div></td>
  </tr>`).join('');
  $('[data-product-count]').textContent = productRows.length;
}

async function loadProducts() {
  productRows = await api('products?select=*&order=category.asc,name.asc&limit=1000');
  renderProducts();
}

function renderOrders() {
  const needle = $('[data-order-search]').value.trim().toLowerCase();
  const status = $('[data-order-filter]').value;
  const visible = orderRows.filter((order) => {
    const text = `${order.id} ${order.customer_name} ${order.phone} ${order.city} ${order.address}`.toLowerCase();
    return (!needle || text.includes(needle)) && (status === 'all' || order.status === status);
  });
  $('[data-orders-empty]').hidden = visible.length > 0;
  ordersBody.innerHTML = visible.map((order) => {
    const count = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0;
    return `<tr data-order-id="${escape(order.id)}"><td>#${escape(order.id.slice(0, 8))}</td><td>${escape(order.customer_name)}<span class="product-id">${escape(order.city)} · ${escape(order.phone)}</span></td><td>${count} item${count === 1 ? '' : 's'}</td><td>${price(order.total)}</td><td>${new Date(order.created_at).toLocaleDateString()}</td><td><select name="status" aria-label="Order status"><option${order.status === 'new' ? ' selected' : ''}>new</option><option${order.status === 'confirmed' ? ' selected' : ''}>confirmed</option><option${order.status === 'packed' ? ' selected' : ''}>packed</option><option${order.status === 'shipped' ? ' selected' : ''}>shipped</option><option${order.status === 'complete' ? ' selected' : ''}>complete</option><option${order.status === 'cancelled' ? ' selected' : ''}>cancelled</option></select></td><td><button class="save-row" type="button" data-save-order>Update</button></td></tr>`;
  }).join('');
  $('[data-order-count]').textContent = orderRows.length;
}

async function loadOrders() {
  orderRows = await api('orders?select=*&order=created_at.desc&limit=1000');
  renderOrders();
}

function renderOverview() {
  const open = orderRows.filter((order) => order.status === 'new').length;
  const requestValue = orderRows.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0);
  const low = productRows.filter((item) => Number(item.stock) <= LOW_STOCK && item.active);
  $('[data-metric-orders]').textContent = orderRows.length.toLocaleString();
  $('[data-metric-new]').textContent = open.toLocaleString();
  $('[data-metric-value]').textContent = price(requestValue);
  $('[data-metric-low-stock]').textContent = low.length.toLocaleString();
  $('[data-recent-empty]').hidden = orderRows.length > 0;
  $('[data-recent-orders]').innerHTML = orderRows.slice(0, 5).map((order) => `<div class="recent-row"><span><strong>#${escape(order.id.slice(0, 8))} · ${escape(order.customer_name)}</strong><small>${new Date(order.created_at).toLocaleDateString()} · ${escape(order.status)}</small></span><strong>${price(order.total)}</strong></div>`).join('');
  $('[data-low-stock-empty]').hidden = low.length > 0;
  $('[data-low-stock-list]').innerHTML = low.slice(0, 8).map((item) => `<div class="stock-row"><span>${escape(item.name)}<small>${escape(item.category)}</small></span><strong>${Number(item.stock)} left</strong></div>`).join('');
}

async function refreshData() {
  try {
    await Promise.all([loadProducts(), loadOrders()]);
    renderOverview();
  } catch (error) {
    showNotice(`Could not load the dashboard: ${error.message}`, 'error');
  }
}

async function refresh() {
  try {
    const isAdmin = await rpc('is_ladyzoom_admin');
    if (!isAdmin) {
      await signOut();
      loginStatus.textContent = 'This email is not on the LadyZoom administrator list. Ask the store owner to grant access.';
      return;
    }
    await refreshData();
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
  if (tab.dataset.tab === 'orders') renderOrders();
  if (tab.dataset.tab === 'products') renderProducts();
  if (tab.dataset.tab === 'overview') renderOverview();
}));

function switchTab(name) {
  $(`[data-tab="${name}"]`).click();
}

$('[data-go-orders]').addEventListener('click', () => switchTab('orders'));
$('[data-go-products]').addEventListener('click', () => switchTab('products'));
$('[data-refresh]').addEventListener('click', () => refreshData());
$('[data-refresh-orders]').addEventListener('click', () => refreshData());
$('[data-product-search]').addEventListener('input', renderProducts);
$('[data-order-search]').addEventListener('input', renderOrders);
$('[data-order-filter]').addEventListener('change', renderOrders);

const productDialog = $('[data-product-dialog]');
const productForm = $('[data-product-form]');
function openProduct(item = null) {
  productForm.reset();
  productForm.dataset.editId = item?.id ?? '';
  $('[data-dialog-title]').textContent = item ? `Edit ${item.name}` : 'Add product';
  productForm.elements.id.readOnly = Boolean(item);
  productForm.elements.id.value = item?.id ?? '';
  productForm.elements.name.value = item?.name ?? '';
  productForm.elements.category.value = item?.category ?? 'Pret';
  productForm.elements.title.value = item?.title ?? '';
  productForm.elements.summary.value = item?.summary ?? '';
  productForm.elements.price.value = item?.price ?? '';
  productForm.elements.compare_at.value = item?.compare_at ?? '';
  productForm.elements.stock.value = item?.stock ?? 0;
  productForm.elements.sizes.value = (item?.sizes ?? ['XS', 'S', 'M', 'L', 'XL']).join(', ');
  productForm.elements.image_url.value = item?.image_url ?? '';
  productForm.elements.active.checked = item?.active ?? true;
  $('[data-delete-product]').hidden = !item;
  productDialog.showModal();
}

$('[data-add-product]').addEventListener('click', () => openProduct());
$('[data-close-product]').addEventListener('click', () => productDialog.close());
productDialog.addEventListener('click', (event) => { if (event.target === productDialog) productDialog.close(); });

productsBody.addEventListener('click', async (event) => {
  const row = event.target.closest('tr[data-id]');
  if (!row) return;
  const product = productRows.find((item) => item.id === row.dataset.id);
  if (event.target.closest('[data-edit-product]')) openProduct(product);
  if (event.target.closest('[data-remove-product]')) {
    if (!window.confirm(`Delete ${product.name} from the admin catalogue? This cannot be undone.`)) return;
    try {
      await api(`products?id=eq.${encodeURIComponent(product.id)}`, { method: 'DELETE' });
      showNotice(`${product.name} deleted from the admin catalogue.`);
      await refreshData();
    } catch (error) { showNotice(`Product could not be deleted: ${error.message}`, 'error'); }
  }
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(productForm));
  const editId = productForm.dataset.editId;
  const id = values.id.trim().toLowerCase();
  const priceValue = Number(values.price);
  const compare = values.compare_at === '' ? null : Number(values.compare_at);
  const stock = Number(values.stock);
  const sizes = values.sizes.split(',').map((size) => size.trim()).filter(Boolean);
  const imageUrl = values.image_url.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) { showNotice('Use a lowercase product ID with letters, numbers and hyphens.', 'error'); return; }
  if (!Number.isInteger(priceValue) || priceValue < 1 || (compare !== null && (!Number.isInteger(compare) || compare <= priceValue)) || !Number.isInteger(stock) || stock < 0 || sizes.length === 0) {
    showNotice('Check the price, higher compare-at price, non-negative stock and comma-separated sizes.', 'error'); return;
  }
  if (imageUrl && !imageUrl.startsWith('assets/') && !/^https:\/\//i.test(imageUrl)) {
    showNotice('Photo paths must start with assets/ or use a secure HTTPS URL.', 'error'); return;
  }
  const product = { id, name: values.name.trim(), category: values.category, title: values.title.trim(), summary: values.summary.trim(), price: priceValue, compare_at: compare, stock, sizes, image_url: imageUrl, active: productForm.elements.active.checked, updated_at: new Date().toISOString() };
  if (!product.name || !product.title || !product.summary) { showNotice('Name, title and description are required.', 'error'); return; }
  const submit = $('button[type="submit"]', productForm);
  submit.disabled = true;
  try {
    if (editId) {
      const { id: _id, ...patch } = product;
      await api(`products?id=eq.${encodeURIComponent(editId)}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
    } else {
      await api('products', { method: 'POST', body: product, prefer: 'return=minimal' });
    }
    productDialog.close();
    showNotice(`${product.name} ${editId ? 'updated' : 'added'} in the admin catalogue.`);
    await refreshData();
  } catch (error) { showNotice(`Product could not be saved: ${error.message}`, 'error'); }
  finally { submit.disabled = false; }
});

$('[data-delete-product]').addEventListener('click', async () => {
  const id = productForm.dataset.editId;
  const product = productRows.find((item) => item.id === id);
  if (!id || !window.confirm(`Delete ${product?.name ?? id} from the admin catalogue? This cannot be undone.`)) return;
  try {
    await api(`products?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    productDialog.close();
    showNotice('Product deleted from the admin catalogue.');
    await refreshData();
  } catch (error) { showNotice(`Product could not be deleted: ${error.message}`, 'error'); }
});

ordersBody.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-save-order]');
  if (!button) return;
  const row = button.closest('tr');
  const status = row.querySelector('[name="status"]').value;
  button.disabled = true;
  try {
    await api(`orders?id=eq.${encodeURIComponent(row.dataset.orderId)}`, { method: 'PATCH', body: { status }, prefer: 'return=minimal' });
    const order = orderRows.find((item) => item.id === row.dataset.orderId);
    if (order) order.status = status;
    showNotice(`Order #${row.dataset.orderId.slice(0, 8)} updated.`);
    renderOrders();
    renderOverview();
  } catch (error) { showNotice(`Order could not be updated: ${error.message}`, 'error'); }
  finally { button.disabled = false; }
});

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
$('[data-export-orders]').addEventListener('click', () => {
  const filtered = orderRows.filter((order) => {
    const needle = $('[data-order-search]').value.trim().toLowerCase();
    const status = $('[data-order-filter]').value;
    return (!needle || `${order.id} ${order.customer_name} ${order.phone} ${order.city} ${order.address}`.toLowerCase().includes(needle)) && (status === 'all' || order.status === status);
  });
  const columns = ['Order ID', 'Customer', 'Phone', 'Address', 'City', 'Items', 'Subtotal', 'Delivery', 'Total', 'Status', 'Created'];
  const rows = filtered.map((order) => [order.id, order.customer_name, order.phone, order.address, order.city, (order.items ?? []).map((item) => `${item.id} ${item.size} x${item.quantity}`).join('; '), order.subtotal, order.delivery, order.total, order.status, order.created_at]);
  const blob = new Blob([[columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ladyzoom-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

$('[data-google-login]').addEventListener('click', () => {
  // GoTrue's browser redirect needs the public API key in the authorize URL;
  // the user's browser navigation cannot attach the apikey request header.
  const authorize = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authorize.searchParams.set('provider', 'google');
  authorize.searchParams.set('redirect_to', `${window.location.origin}${window.location.pathname}${window.location.search}`);
  authorize.searchParams.set('apikey', SUPABASE_PUBLISHABLE_KEY);
  window.location.assign(authorize);
});

// Show OAuth failures returned by Supabase instead of silently returning to
// the login form. This also makes provider/setup errors actionable.
const authQuery = new URLSearchParams(window.location.search);
const authError = authQuery.get('error_description') || authQuery.get('error');
if (authError) {
  const message = authError.replaceAll('+', ' ');
  loginStatus.textContent = `Google sign-in could not complete: ${message}. Check that Google is enabled in Supabase Auth and that the site URL is allow-listed.`;
  history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
}

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
