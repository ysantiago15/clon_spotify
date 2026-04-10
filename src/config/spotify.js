// const CLIENT_ID    = 'd1469fd9081a43869a64fdbfda7b80f1';
// const REDIRECT_URI = 'http://127.0.0.1:5173/callback';

// // ⚠️ Si cambias scopes, cambia también SCOPES_VERSION para forzar re-auth
// const SCOPES = [
//   'streaming',
//   'user-read-email',
//   'user-read-private',
//   'user-read-playback-state',
//   'user-modify-playback-state',
//   'user-library-read',        // ← álbumes guardados, canciones
//   'playlist-read-private',    // ← playlists privadas
//   'playlist-read-collaborative',
//   'user-follow-read',         // ← artistas seguidos
// ].join(' ');

// const SCOPES_VERSION = 'v3'; // incrementa esto si cambias los scopes

// // ===============================
// // 🔑 PKCE
// // ===============================
// async function generatePKCE() {
//   const verifier =
//     crypto.randomUUID().replace(/-/g, '') +
//     crypto.randomUUID().replace(/-/g, '');
//   const encoder = new TextEncoder();
//   const digest  = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
//   const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
//     .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
//   return { verifier, challenge };
// }

// // ===============================
// // 🔐 LOGIN
// // ===============================
// export async function loginWithSpotify() {
//   const { verifier, challenge } = await generatePKCE();
//   sessionStorage.setItem('pkce_verifier', verifier);
//   localStorage.setItem('spotify_scopes_version', SCOPES_VERSION);

//   const params = new URLSearchParams({
//     client_id:             CLIENT_ID,
//     response_type:         'code',
//     redirect_uri:          REDIRECT_URI,
//     scope:                 SCOPES,
//     code_challenge_method: 'S256',
//     code_challenge:        challenge,
//   });

//   window.location.href = `https://accounts.spotify.com/authorize?${params}`;
// }

// // ===============================
// // 🔁 INTERCAMBIO DE CÓDIGO → TOKEN
// // ===============================
// export async function exchangeCode(code) {
//   const verifier = sessionStorage.getItem('pkce_verifier');

//   const res = await fetch('https://accounts.spotify.com/api/token', {
//     method:  'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body:    new URLSearchParams({
//       grant_type:    'authorization_code',
//       code,
//       redirect_uri:  REDIRECT_URI,
//       client_id:     CLIENT_ID,
//       code_verifier: verifier,
//     }),
//   });

//   const data = await res.json();

//   if (data.access_token) {
//     localStorage.setItem('spotify_token',         data.access_token);
//     localStorage.setItem('spotify_token_expiry',  Date.now() + data.expires_in * 1000);
//     localStorage.setItem('spotify_scopes_version', SCOPES_VERSION);
//     if (data.refresh_token) {
//       localStorage.setItem('spotify_refresh_token', data.refresh_token);
//     }
//   }

//   return data.access_token;
// }

// // ===============================
// // 🔄 REFRESH TOKEN
// // ===============================
// async function refreshAccessToken() {
//   const refreshToken = localStorage.getItem('spotify_refresh_token');
//   if (!refreshToken) return null;

//   const res = await fetch('https://accounts.spotify.com/api/token', {
//     method:  'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body:    new URLSearchParams({
//       grant_type:    'refresh_token',
//       refresh_token: refreshToken,
//       client_id:     CLIENT_ID,
//     }),
//   });

//   const data = await res.json();

//   if (data.access_token) {
//     localStorage.setItem('spotify_token',        data.access_token);
//     localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000);
//     if (data.refresh_token) {
//       localStorage.setItem('spotify_refresh_token', data.refresh_token);
//     }
//     return data.access_token;
//   }

//   return null;
// }

// // ===============================
// // 🔑 getToken — válido + renovación automática
// // ===============================
// export async function getToken() {
//   const token  = localStorage.getItem('spotify_token');
//   const expiry = parseInt(localStorage.getItem('spotify_token_expiry') || '0', 10);

//   if (!token) throw new Error('NO_TOKEN');

//   // Renueva si expira en menos de 2 minutos
//   if (Date.now() > expiry - 120_000) {
//     const refreshed = await refreshAccessToken();
//     if (refreshed) return refreshed;
//   }

//   return token;
// }

// // ===============================
// // ✅ needsReauth — detecta si el token tiene scopes desactualizados
// // ===============================
// export function needsReauth() {
//   const token         = localStorage.getItem('spotify_token');
//   const savedVersion  = localStorage.getItem('spotify_scopes_version');
//   return !token || savedVersion !== SCOPES_VERSION;
// }

// // ===============================
// // 🗑️ LIMPIAR CACHES
// // ===============================
// export function clearSpotifyCache() {
//   cache             = null;
//   artistsCache      = null;
//   albumsCache       = null;
//   isFetching        = false;
//   isFetchingArtists = false;
//   isFetchingAlbums  = false;
// }

// // ===============================
// // 🔥 FETCH CON RETRY (anti-429)
// // ===============================
// async function fetchWithRetry(url, options = {}, retries = 5) {
//   const res = await fetch(url, options);

//   if (res.status === 429) {
//     const wait = ((res.headers.get("Retry-After") ?? 2)) * 1000;
//     console.warn(`429 → esperando ${wait}ms`);
//     await new Promise(r => setTimeout(r, wait));
//     if (retries > 0) return fetchWithRetry(url, options, retries - 1);
//     throw new Error("Demasiados intentos (429)");
//   }

//   return res.json();
// }

// // ===============================
// // 🎧 TOP TRACKS
// // ===============================
// let cache      = null;
// let isFetching = false;

// export async function getTopTracks() {
//   if (cache) return cache;
//   if (isFetching) return [];
//   let token;
//   try { token = await getToken(); } catch { return []; }
//   isFetching = true;
//   try {
//     const data = await fetchWithRetry(
//       'https://api.spotify.com/v1/search?q=hits&type=track&limit=10',
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     cache = data.tracks?.items || [];
//     return cache;
//   } catch (e) {
//     console.error("Error Spotify (tracks):", e);
//     return [];
//   } finally {
//     isFetching = false;
//   }
// }

// // ===============================
// // 🎤 FEATURED ARTISTS
// // ===============================
// let artistsCache      = null;
// let isFetchingArtists = false;

// export async function getFeaturedArtists() {
//   if (artistsCache) return artistsCache;
//   if (isFetchingArtists) return [];
//   let token;
//   try { token = await getToken(); } catch { return []; }
//   isFetchingArtists = true;
//   try {
//     const data = await fetchWithRetry(
//       'https://api.spotify.com/v1/search?q=genre:pop&type=artist&limit=10',
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     artistsCache = data.artists?.items || [];
//     return artistsCache;
//   } catch (e) {
//     console.error("Error Spotify (artists):", e);
//     return [];
//   } finally {
//     isFetchingArtists = false;
//   }
// }

// // ===============================
// // 💿 POPULAR ALBUMS
// // ===============================
// let albumsCache      = null;
// let isFetchingAlbums = false;

// export async function getPopularAlbums() {
//   if (albumsCache) return albumsCache;
//   if (isFetchingAlbums) return [];
//   let token;
//   try { token = await getToken(); } catch { return []; }
//   isFetchingAlbums = true;
//   try {
//     const data = await fetchWithRetry(
//       'https://api.spotify.com/v1/search?q=popular&type=album&limit=10&include_external=audio',
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     albumsCache = data.albums?.items || [];
//     return albumsCache;
//   } catch (e) {
//     console.error("Error Spotify (albums):", e);
//     return [];
//   } finally {
//     isFetchingAlbums = false;
//   }
// }

// // ===============================
// // 🔎 SEARCH CON DEBOUNCE
// // ===============================
// let timeout;

// export function searchTracks(query, callback) {
//   clearTimeout(timeout);
//   timeout = setTimeout(async () => {
//     let token;
//     try { token = await getToken(); } catch { callback([]); return; }
//     try {
//       const data = await fetchWithRetry(
//         `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       callback(data.tracks?.items || []);
//     } catch (e) {
//       console.error(e);
//       callback([]);
//     }
//   }, 500);
// }

// ✅ CAMBIO: quitado hardcodeo, ahora usa variables de entorno
// const CLIENT_ID    = 'd1469fd9081a43869a64fdbfda7b80f1';  // ❌ antes
// const REDIRECT_URI = 'http://127.0.0.1:5173/callback';     // ❌ antes

const CLIENT_ID     = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI  = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

// ⚠️ Si cambias scopes, cambia también SCOPES_VERSION para forzar re-auth
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-library-read',        // ← álbumes guardados, canciones
  'playlist-read-private',    // ← playlists privadas
  'playlist-read-collaborative',
  'user-follow-read',         // ← artistas seguidos
].join(' ');

const SCOPES_VERSION = 'v3'; // incrementa esto si cambias los scopes

// ===============================
// 🔑 PKCE
// ===============================
async function generatePKCE() {
  const verifier =
    crypto.randomUUID().replace(/-/g, '') +
    crypto.randomUUID().replace(/-/g, '');
  const encoder = new TextEncoder();
  const digest  = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return { verifier, challenge };
}

// ===============================
// 🔐 LOGIN
// ===============================
export async function loginWithSpotify() {
  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem('pkce_verifier', verifier);
  localStorage.setItem('spotify_scopes_version', SCOPES_VERSION);

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          REDIRECT_URI,
    scope:                 SCOPES,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

// ===============================
// 🔁 INTERCAMBIO DE CÓDIGO → TOKEN
// ===============================
export async function exchangeCode(code) {
  const verifier = sessionStorage.getItem('pkce_verifier');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  REDIRECT_URI,
      client_id:     CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  const data = await res.json();

  if (data.access_token) {
    localStorage.setItem('spotify_token',         data.access_token);
    localStorage.setItem('spotify_token_expiry',  Date.now() + data.expires_in * 1000);
    localStorage.setItem('spotify_scopes_version', SCOPES_VERSION);
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
    }
  }

  return data.access_token;
}

// ===============================
// 🔄 REFRESH TOKEN
// ===============================
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  if (!refreshToken) return null;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     CLIENT_ID,
    }),
  });

  const data = await res.json();

  if (data.access_token) {
    localStorage.setItem('spotify_token',        data.access_token);
    localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000);
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
    }
    return data.access_token;
  }

  return null;
}

// ===============================
// 🔑 getToken — válido + renovación automática
// ===============================
export async function getToken() {
  const token  = localStorage.getItem('spotify_token');
  const expiry = parseInt(localStorage.getItem('spotify_token_expiry') || '0', 10);

  if (!token) throw new Error('NO_TOKEN');

  // Renueva si expira en menos de 2 minutos
  if (Date.now() > expiry - 120_000) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return refreshed;
  }

  return token;
}

// ===============================
// ✅ needsReauth — detecta si el token tiene scopes desactualizados
// ===============================
export function needsReauth() {
  const token         = localStorage.getItem('spotify_token');
  const savedVersion  = localStorage.getItem('spotify_scopes_version');
  return !token || savedVersion !== SCOPES_VERSION;
}

// ===============================
// 🗑️ LIMPIAR CACHES
// ===============================
export function clearSpotifyCache() {
  cache             = null;
  artistsCache      = null;
  albumsCache       = null;
  isFetching        = false;
  isFetchingArtists = false;
  isFetchingAlbums  = false;
}

// ===============================
// 🔥 FETCH CON RETRY (anti-429)
// ===============================
async function fetchWithRetry(url, options = {}, retries = 5) {
  const res = await fetch(url, options);

  if (res.status === 429) {
    const wait = ((res.headers.get("Retry-After") ?? 2)) * 1000;
    console.warn(`429 → esperando ${wait}ms`);
    await new Promise(r => setTimeout(r, wait));
    if (retries > 0) return fetchWithRetry(url, options, retries - 1);
    throw new Error("Demasiados intentos (429)");
  }

  return res.json();
}

// ===============================
// 🎧 TOP TRACKS
// ===============================
let cache      = null;
let isFetching = false;

export async function getTopTracks() {
  if (cache) return cache;
  if (isFetching) return [];
  let token;
  try { token = await getToken(); } catch { return []; }
  isFetching = true;
  try {
    const data = await fetchWithRetry(
      'https://api.spotify.com/v1/search?q=hits&type=track&limit=10',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    cache = data.tracks?.items || [];
    return cache;
  } catch (e) {
    console.error("Error Spotify (tracks):", e);
    return [];
  } finally {
    isFetching = false;
  }
}

// ===============================
// 🎤 FEATURED ARTISTS
// ===============================
let artistsCache      = null;
let isFetchingArtists = false;

export async function getFeaturedArtists() {
  if (artistsCache) return artistsCache;
  if (isFetchingArtists) return [];
  let token;
  try { token = await getToken(); } catch { return []; }
  isFetchingArtists = true;
  try {
    const data = await fetchWithRetry(
      'https://api.spotify.com/v1/search?q=genre:pop&type=artist&limit=10',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    artistsCache = data.artists?.items || [];
    return artistsCache;
  } catch (e) {
    console.error("Error Spotify (artists):", e);
    return [];
  } finally {
    isFetchingArtists = false;
  }
}

// ===============================
// 💿 POPULAR ALBUMS
// ===============================
let albumsCache      = null;
let isFetchingAlbums = false;

export async function getPopularAlbums() {
  if (albumsCache) return albumsCache;
  if (isFetchingAlbums) return [];
  let token;
  try { token = await getToken(); } catch { return []; }
  isFetchingAlbums = true;
  try {
    const data = await fetchWithRetry(
      'https://api.spotify.com/v1/search?q=popular&type=album&limit=10&include_external=audio',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    albumsCache = data.albums?.items || [];
    return albumsCache;
  } catch (e) {
    console.error("Error Spotify (albums):", e);
    return [];
  } finally {
    isFetchingAlbums = false;
  }
}

// ===============================
// 💿 TRACKS DE UN ÁLBUM (en orden)
// ===============================
export async function getAlbumTracks(albumId) {
  let token;
  try { token = await getToken(); } catch { return []; }

  try {
    const data = await fetchWithRetry(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50&market=CO`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.items || [];
  } catch (e) {
    console.error("Error obteniendo tracks del álbum:", e);
    return [];
  }
}

// ===============================
// 🔎 SEARCH CON DEBOUNCE
// ===============================
let timeout;

export function searchTracks(query, callback) {
  clearTimeout(timeout);
  timeout = setTimeout(async () => {
    let token;
    try { token = await getToken(); } catch { callback([]); return; }
    try {
      const data = await fetchWithRetry(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      callback(data.tracks?.items || []);
    } catch (e) {
      console.error(e);
      callback([]);
    }
  }, 500);
}
