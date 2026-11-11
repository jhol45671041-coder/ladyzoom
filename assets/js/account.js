const SUPABASE_URL = 'https://ztlguqjriqwgcaghvypa.supabase.co';
const KEY = 'sb_publishable_6Gf1MPLjojjxN62F2zBzOw_0X30c-eJ';
const STORE = 'ladyzoom:customer-session';
const $ = (selector, root = document) => root.querySelector(selector);
const loginPanel = $('[data-account-login]');
const profilePanel = $('[data-account-profile]');
const loginStatus = $('[data-account-status]');
const profileStatus = $('[data-profile-status]');
const avatarStatus = $('[data-avatar-status]');
let session = null;
let avatarPath = null;
let avatarObjectUrl = null;

function saveSession(value) {
  session = value;
  if (value) localStorage.setItem(STORE, JSON.stringify(value));
  else localStorage.removeItem(STORE);
}

async function refreshToken() {
  if (!session?.refresh_token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: { apikey: KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) { saveSession(null); return false; }
  saveSession({ ...await response.json(), user: session.user, avatar_path: session.avatar_path });
  return true;
}

async function request(path, options = {}, retry = true) {
  const headers = { apikey: KEY, authorization: `Bearer ${session?.access_token ?? KEY}`, 'content-type': 'application/json' };
  if (options.prefer) headers.Prefer = options.prefer;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: options.method ?? 'GET', headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  if (response.status === 401 && retry && await refreshToken()) return request(path, options, false);
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message ?? `Request failed (${response.status})`);
  return result;
}

async function user() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: KEY, authorization: `Bearer ${session.access_token}` } });
  if (!response.ok) { saveSession(null); return null; }
  return response.json();
}

function showSignedIn(email) {
  loginPanel.hidden = true;
  profilePanel.hidden = false;
  $('[data-account-email]').textContent = email ?? '';
}

async function showAvatar(path) {
  avatarPath = path || null;
  const image = $('[data-avatar-image]');
  const headerImage = $('[data-header-avatar]');
  const placeholder = $('[data-avatar-placeholder]');
  if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
  avatarObjectUrl = null;
  image.hidden = true;
  placeholder.hidden = false;
  if (headerImage) headerImage.hidden = true;
  if (!avatarPath) {
    $('[data-avatar-label]').textContent = 'Add a profile photo';
    $('[data-avatar-button]').setAttribute('aria-label', 'Add a profile photo');
    return;
  }
  const objectPath = avatarPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/customer-avatars/${objectPath}`, {
    headers: { apikey: KEY, authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) throw new Error('Could not load your profile photo.');
  avatarObjectUrl = URL.createObjectURL(await response.blob());
  image.src = avatarObjectUrl;
  image.hidden = false;
  placeholder.hidden = true;
  if (headerImage) { headerImage.src = avatarObjectUrl; headerImage.hidden = false; }
  $('[data-avatar-label]').textContent = 'Change profile photo';
  $('[data-avatar-button]').setAttribute('aria-label', 'Change profile photo');
}

async function loadOrders() {
  const orders = await request(`orders?select=id,total,status,created_at&user_id=eq.${encodeURIComponent(session.user.id)}&order=created_at.desc`);
  $('[data-order-count]').textContent = orders.length;
  $('[data-order-label]').textContent = orders.length === 1 ? 'order' : 'orders';
  $('[data-orders-empty]').hidden = orders.length > 0;
  $('[data-order-list]').innerHTML = orders.map((order) => `<li><span><strong>Order #${escapeHtml(order.id.slice(0, 8))}</strong><br>${new Date(order.created_at).toLocaleDateString()} · ${escapeHtml(order.status)}</span><strong>Rs. ${Number(order.total).toLocaleString('en-PK')}</strong></li>`).join('');
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

async function loadProfile() {
  const rows = await request(`customer_profiles?select=*&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`);
  const profile = rows[0];
  if (profile) {
    for (const key of ['full_name', 'phone', 'address', 'city']) $('[name="' + key + '"]').value = profile[key] ?? '';
    session.avatar_path = profile.avatar_path ?? null;
    saveSession(session);
    await showAvatar(profile.avatar_path);
  }
  await loadOrders();
}

async function signOut() {
  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: KEY, authorization: `Bearer ${session.access_token}` } }).catch(() => {});
  }
  saveSession(null);
  if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
  avatarObjectUrl = null;
  const headerImage = $('[data-header-avatar]');
  if (headerImage) headerImage.hidden = true;
  profilePanel.hidden = true;
  loginPanel.hidden = false;
}

$('[data-account-login-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('button[type="submit"]', event.currentTarget);
  button.disabled = true;
  loginStatus.textContent = 'Sending a secure sign-in link…';
  const email = new FormData(event.currentTarget).get('email').trim().toLowerCase();
  try {
    const redirect = encodeURIComponent(window.location.href.split('#')[0]);
    const response = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${redirect}`, {
      method: 'POST', headers: { apikey: KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ email, create_user: true, gotrue_meta_security: {} }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg ?? result.message ?? `Request failed (${response.status})`);
    loginStatus.textContent = 'If this email can sign in, a one-time link is on its way. Check your inbox.';
  } catch (error) { loginStatus.textContent = `Could not send the link: ${error.message}`; }
  finally { button.disabled = false; }
});

$('[data-account-signout]').addEventListener('click', signOut);
$('[data-avatar-button]').addEventListener('click', () => $('[data-avatar-file]').click());
$('[data-avatar-file]').addEventListener('change', async (event) => {
  const file = event.currentTarget.files[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) {
    avatarStatus.textContent = 'Choose a JPG, PNG or WebP image under 3 MB.';
    event.currentTarget.value = '';
    return;
  }
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
  const path = `${session.user.id}/avatar.${extension}`;
  const button = $('[data-avatar-button]');
  button.disabled = true;
  avatarStatus.textContent = 'Uploading your photo…';
  try {
    let response = await fetch(`${SUPABASE_URL}/storage/v1/object/customer-avatars/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST', headers: { apikey: KEY, authorization: `Bearer ${session.access_token}`, 'content-type': file.type, 'x-upsert': 'true' }, body: file,
    });
    if (response.status === 401 && await refreshToken()) {
      response = await fetch(`${SUPABASE_URL}/storage/v1/object/customer-avatars/${path.split('/').map(encodeURIComponent).join('/')}`, {
        method: 'POST', headers: { apikey: KEY, authorization: `Bearer ${session.access_token}`, 'content-type': file.type, 'x-upsert': 'true' }, body: file,
      });
    }
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new Error(problem.message ?? 'The photo could not be uploaded.');
    }
    await request('customer_profiles?on_conflict=user_id', {
      method: 'POST', body: { user_id: session.user.id, avatar_path: path },
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    session.avatar_path = path;
    saveSession(session);
    await showAvatar(path);
    avatarStatus.textContent = 'Your profile photo is saved. Only you can see it.';
  } catch (error) { avatarStatus.textContent = error.message; }
  finally { button.disabled = false; event.currentTarget.value = ''; }
});
$('[data-profile-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('button[type="submit"]', event.currentTarget);
  button.disabled = true;
  profileStatus.textContent = 'Saving…';
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const profile = { user_id: session.user.id, full_name: values.full_name.trim(), phone: values.phone.trim(), address: values.address.trim(), city: values.city.trim(), avatar_path: avatarPath, updated_at: new Date().toISOString() };
  try {
    await request('customer_profiles?on_conflict=user_id', { method: 'POST', body: profile, prefer: 'resolution=merge-duplicates,return=minimal' });
    profileStatus.textContent = 'Your details are saved securely.';
  } catch (error) { profileStatus.textContent = `Could not save your details: ${error.message}`; }
  finally { button.disabled = false; }
});

const fragment = new URLSearchParams(window.location.hash.slice(1));
if (fragment.get('access_token') && fragment.get('refresh_token')) {
  saveSession({ access_token: fragment.get('access_token'), refresh_token: fragment.get('refresh_token'), expires_at: Number(fragment.get('expires_at')) });
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}
if (localStorage.getItem(STORE)) session = JSON.parse(localStorage.getItem(STORE));
if (session?.expires_at && session.expires_at * 1000 < Date.now()) await refreshToken();
if (session) {
  const currentUser = await user();
  if (currentUser) {
    session.user = currentUser;
    saveSession(session);
    showSignedIn(currentUser.email);
    try { await loadProfile(); } catch (error) { profileStatus.textContent = `Could not load saved details: ${error.message}`; }
  }
}
