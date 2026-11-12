const url = 'https://ztlguqjriqwgcaghvypa.supabase.co';
const key = 'sb_publishable_6Gf1MPLjojjxN62F2zBzOw_0X30c-eJ';
const storageKey = 'ladyzoom:customer-session';
const image = document.querySelector('[data-header-avatar]');

if (image) {
  try {
    let session = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (session?.access_token) {
      if (session.expires_at && session.expires_at * 1000 < Date.now() && session.refresh_token) {
        const refreshed = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST', headers: { apikey: key, 'content-type': 'application/json' },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        if (refreshed.ok) {
          session = { ...await refreshed.json(), user: session.user, avatar_path: session.avatar_path };
          localStorage.setItem(storageKey, JSON.stringify(session));
        }
      }
      if (session.avatar_path) {
        const path = session.avatar_path.split('/').map(encodeURIComponent).join('/');
        const response = await fetch(`${url}/storage/v1/object/authenticated/customer-avatars/${path}`, {
          headers: { apikey: key, authorization: `Bearer ${session.access_token}` },
        });
        if (response.ok) {
          image.src = URL.createObjectURL(await response.blob());
          image.hidden = false;
        }
      } else {
        // No uploaded photo: show the Google profile picture, if there is one.
        const metadata = session.user?.user_metadata ?? {};
        const googleAvatar = metadata.avatar_url ?? metadata.picture;
        if (googleAvatar) {
          image.src = googleAvatar;
          image.hidden = false;
        }
      }
    }
  } catch {
    // The icon remains the fallback when signed out, offline or without a photo.
  }
}
