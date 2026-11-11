const URL = 'https://ztlguqjriqwgcaghvypa.supabase.co';
const KEY = 'sb_publishable_6Gf1MPLjojjxN62F2zBzOw_0X30c-eJ';
const STORE = 'ladyzoom:customer-session';
const $ = (selector, root = document) => root.querySelector(selector);
const loginPanel = $('[data-account-login]');
const profilePanel = $('[data-account-profile]');
const loginStatus = $('[data-account-status]');
const profileStatus = $('[data-profile-status]');
let session = null;

function saveSession(value) {
  session = value;
  if (value) localStorage.setItem(STORE, JSON.stringify(value));
  else localStorage.removeItem(STORE);
}

async function refreshToken() {
  if (!session?.refresh_token) return false;
  const response = await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: { apikey: KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) { saveSession(null); return false; }
  saveSession(await response.json());
  return true;
}

async function request(path, options = {}, retry = true) {
  const headers = { apikey: KEY, authorization: `Bearer ${session?.access_token ?? KEY}`, 'content-type': 'application/json' };
  if (options.prefer) headers.Prefer = options.prefer;
  const response = await fetch(`${URL}/rest/v1/${path}`, { method: options.method ?? 'GET', headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  if (response.status === 401 && retry && await refreshToken()) return request(path, options, false);
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message ?? `Request failed (${response.status})`);
  return result;
}

async function user() {
  const response = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: KEY, authorization: `Bearer ${session.access_token}` } });
  if (!response.ok) { saveSession(null); return null; }
  return response.json();
}

function showSignedIn(email) {
  loginPanel.hidden = true;
  profilePanel.hidden = false;
  $('[data-account-email]').textContent = email ?? '';
}

async function loadProfile() {
  const rows = await request(`customer_profiles?select=*&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`);
  const profile = rows[0];
  if (!profile) return;
  for (const key of ['full_name', 'phone', 'address', 'city']) $('[name="' + key + '"]').value = profile[key] ?? '';
}

async function signOut() {
  if (session?.access_token) {
    await fetch(`${URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: KEY, authorization: `Bearer ${session.access_token}` } }).catch(() => {});
  }
  saveSession(null);
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
    const response = await fetch(`${URL}/auth/v1/otp?redirect_to=${redirect}`, {
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
$('[data-profile-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('button[type="submit"]', event.currentTarget);
  button.disabled = true;
  profileStatus.textContent = 'Saving…';
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const profile = { user_id: session.user.id, full_name: values.full_name.trim(), phone: values.phone.trim(), address: values.address.trim(), city: values.city.trim(), updated_at: new Date().toISOString() };
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
