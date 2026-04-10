
import { useEffect, useRef, useState } from "react";
import { FaPlay, FaMusic, FaCompactDisc } from "react-icons/fa";
import { getAlbumTracks } from "../config/spotify";
import { playAlbum } from "../config/spotifyPlayback";

// ─── UTILS ────────────────────────────────────────────────────────────────────
function msToMinSec(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function formatFollowers(n) {
    if (!n) return "";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M seguidores";
    if (n >= 1_000) return Math.round(n / 1_000) + "K seguidores";
    return n + " seguidores";
}

// Determina qué tipo de resultado principal mostrar
// Devuelve: { type: "artist"|"album"|"track", data }
function resolveMainResult(artists, tracks, albums, query) {
    const q = (query || "").toLowerCase().trim();

    const topArtist = artists?.[0];
    const topTrack  = tracks?.[0];
    const topAlbum  = albums?.[0];

    // Puntaje de similitud: qué tan bien coincide el nombre con el query
    function score(name = "") {
        const n = name.toLowerCase();
        if (n === q) return 3;                          // coincidencia exacta
        if (n.startsWith(q) || q.startsWith(n)) return 2; // uno contiene al otro
        if (n.includes(q) || q.includes(n)) return 1;  // substring
        return 0;
    }

    const artistScore = topArtist ? score(topArtist.name) : -1;
    const trackScore  = topTrack  ? score(topTrack.name)  : -1;
    const albumScore  = topAlbum  ? score(topAlbum.name)  : -1;

    const best = Math.max(artistScore, trackScore, albumScore);

    // Si ninguno coincide con el query, priorizamos canción > álbum > artista
    if (best === 0) {
        if (topTrack)  return { type: "track",  data: topTrack };
        if (topAlbum)  return { type: "album",  data: topAlbum };
        if (topArtist) return { type: "artist", data: topArtist };
        return null;
    }

    // Entre los que tienen el mejor puntaje, elegimos por tipo preferido
    if (trackScore  === best) return { type: "track",  data: topTrack };
    if (albumScore  === best) return { type: "album",  data: topAlbum };
    if (artistScore === best) return { type: "artist", data: topArtist };
    return null;
}

// ─── FILA DE CANCIÓN ──────────────────────────────────────────────────────────
function TrackRow({ track, index, onPlay }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onPlay(track)}
            className="flex items-center gap-4 px-3 py-2 rounded-md hover:bg-white/10 active:bg-white/20 transition-colors group cursor-pointer"
        >
            <div className="w-6 text-center shrink-0">
                {hovered ? (
                    <button onClick={() => onPlay(track)} className="text-white">
                        <FaPlay size={12} />
                    </button>
                ) : (
                    <span className="text-[#b3b3b3] text-sm">{index + 1}</span>
                )}
            </div>

            <img
                src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url}
                alt={track.name}
                className="w-10 h-10 rounded object-cover shrink-0"
            />

            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{track.name}</p>
                <div className="flex items-center gap-1.5 text-[#b3b3b3] text-xs">
                    {track.explicit && (
                        <span className="bg-[#6a6a6a] text-[#1a1a1a] text-[9px] font-bold px-1 rounded-sm leading-tight">
                            E
                        </span>
                    )}
                    <span className="truncate">
                        {track.artists?.map((a) => a.name).join(", ")}
                    </span>
                </div>
            </div>

            <span className="text-[#b3b3b3] text-sm shrink-0">
                {msToMinSec(track.duration_ms)}
            </span>
        </div>
    );
}

// ─── TARJETA DE ARTISTA RELACIONADO ──────────────────────────────────────────
// function ArtistCard({ artist }) {
//     const [hovered, setHovered] = useState(false);
//     return (
//         <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className="flex flex-col gap-3 p-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group w-44">
//             <div className="relative w-full aspect-square">
//                 <img src={artist.images?.[0]?.url} alt={artist.name} className="w-full h-full rounded-full object-cover"/>
//                 {hovered && (
//                     <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
//                         <div className="w-10 h-10 bg-[#1ED760] rounded-full flex items-center justify-center shadow-lg">
//                             <FaPlay size={14} className="text-black ml-0.5" />
//                         </div>
//                     </div>
//                 )}
//             </div>
//             <div>
//                 <p className="text-white text-sm font-bold truncate">{artist.name}</p>
//                 <p className="text-[#b3b3b3] text-xs capitalize mt-0.5">{artist.type}</p>
//             </div>
//         </div>
//     );
// }
function ArtistCard({ artist, isLoggedIn, onOpenModal, onArtistPlay }) {
    const [hovered, setHovered] = useState(false);

    const handlePlay = (e) => {
        e.stopPropagation();
        if (!isLoggedIn) {
            onOpenModal?.({ image: artist.images?.[0]?.url, name: artist.name });
            return;
        }
        onArtistPlay?.(artist);
    };

    return (
        <div 
            onMouseEnter={() => setHovered(true)} 
            onMouseLeave={() => setHovered(false)} 
            onClick={handlePlay}
            className="flex flex-col gap-4 p-4 rounded-lg hover:bg-[#282828] active:bg-[#383838] transition-all duration-300 cursor-pointer group w-50 shrink-0"
        >
            <div className="relative w-full aspect-square mb-1">
                <img 
                    src={artist.images?.[0]?.url} 
                    alt={artist.name} 
                    className="w-full h-full rounded-full object-cover shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                />
                {/* Botón de Play flotante (estilo Spotify) */}
                <div
                    onClick={handlePlay}
                    className={`absolute bottom-2 right-2 translate-y-2 opacity-0 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : ''}`}
                >
                    <div className="w-12 h-12 bg-[#1ED760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                        <FaPlay size={16} className="text-black ml-1" />
                    </div>
                </div>
            </div>
            <div className="min-h-15.5">
                <p className="text-white text-base font-bold truncate mb-1">
                    {artist.name}
                </p>
                <p className="text-[#b3b3b3] text-sm font-medium">
                    Artista
                </p>
            </div>
        </div>
    );
}

// ─── TARJETA DE ÁLBUM ─────────────────────────────────────────────────────────
function AlbumCard({ album, isLoggedIn, onOpenModal, onAlbumPlay }) {
    const [hovered, setHovered] = useState(false);
    const year = album.release_date ? album.release_date.split("-")[0] : "";
    const typeLabel = album.album_type === "single" ? "Sencillo" : album.album_type === "ep" ? "EP" : "Álbum";

    const handlePlay = (e) => {
        e.stopPropagation();
        if (!isLoggedIn) {
            onOpenModal?.({ image: album.images?.[0]?.url, name: album.name });
            return;
        }
        onAlbumPlay?.(album);
    };

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handlePlay}
            className="group p-3 flex flex-col gap-1.5 w-48.75 hover:bg-[#191919] active:bg-[#282828] rounded-lg transition-all duration-300 cursor-pointer shrink-0"
        >
            <div className="w-42.75 h-42.75 relative">
                <img
                    src={album.images?.[0]?.url}
                    alt={album.name}
                    className="w-full rounded-lg"
                />
                {/* Botón de Play flotante (estilo Spotify) */}
                <div
                    onClick={handlePlay}
                    className="w-12 h-12 bg-[#1ED760] rounded-full flex justify-center items-center shadow-xl/30 absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out hover:bg-[#1fdf64] hover:scale-105"
                >
                    <FaPlay size={18} className="text-black" />
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-base font-normal text-white truncate">{album.name}</span>
                <span className="text-sm text-[#B3B3B3] font-normal">
                    {year && <span>{year} • </span>}
                    <span className="capitalize">{typeLabel}</span>
                </span>
            </div>
        </div>
    );
}

// ─── RESULTADO PRINCIPAL: ARTISTA ─────────────────────────────────────────────
function MainResultArtist({ artist, isLoggedIn, onOpenModal, onArtistPlay }) {
    const handleClick = () => {
        if (!isLoggedIn) { onOpenModal?.({ image: artist.images?.[0]?.url, name: artist.name }); return; }
        onArtistPlay?.(artist);
    };
    return (
        <div onClick={handleClick} className="relative rounded-xl bg-[#1a1a1a] hover:bg-[#242424] active:bg-[#303030] transition-colors p-5 cursor-pointer group overflow-hidden h-55 ">
            <img src={artist.images?.[0]?.url} alt={artist.name} className="w-23 h-23 rounded-full object-cover shadow-2xl mb-3"/>
                <h3 className="text-white text-[32px] font-extrabold leading-tight">{artist.name}</h3>
                <p className="text-[#b3b3b3] text-sm capitalize mt-0.5">{artist.type}</p>
            
            {artist.followers?.total > 0 && (
                <p className="text-[#6a6a6a] text-xs mt-1">{formatFollowers(artist.followers.total)}</p>
            )}
            <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                <div className="w-12 h-12 bg-[#1ED760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64] transition-all">
                    <FaPlay size={18} className="text-black ml-0.5" />
                </div>
            </div>
        </div>
    );
}

// ─── RESULTADO PRINCIPAL: ÁLBUM ───────────────────────────────────────────────
function MainResultAlbum({ album, isLoggedIn, onOpenModal, onAlbumPlay }) {
    // const year = album.release_date ? album.release_date.split("-")[0] : "";
    const typeLabel = album.album_type === "single" ? "Sencillo" : album.album_type === "ep" ? "EP" : "Álbum";
    const artistNames = album.artists?.map((a) => a.name).join(", ") || "";

    const handlePlay = (e) => {
        e.stopPropagation();
        if (!isLoggedIn) {
            onOpenModal?.({ image: album.images?.[0]?.url, name: album.name });
            return;
        }
        onAlbumPlay?.(album);
    };

    return (
        <div className="relative rounded-xl bg-[#1a1a1a] hover:bg-[#242424] transition-colors p-5 cursor-pointer group overflow-hidden h-55">
            {/* Portada */}
            
            <img src={album.images?.[0]?.url} alt={album.name} className="w-23 h-23 rounded-xl object-cover shadow-2xl mb-3"/>
            {/* Info */}
                <h3 className="text-white text-[32px] font-extrabold leading-tight">{album.name}</h3>
                <p className="text-[#b3b3b3] text-sm capitalize mt-0.5">{typeLabel}•<span className="text-white">{artistNames}</span></p>
            
            {/* Botón play */}
            <div
                onClick={handlePlay}
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-200">
                <div className="w-12 h-12 bg-[#1ED760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64] transition-all">
                    <FaPlay size={18} className="text-black ml-0.5" />
                </div>
            </div>
        </div>
    );
}

// ─── RESULTADO PRINCIPAL: CANCIÓN ─────────────────────────────────────────────
function MainResultTrack({ track, onPlay }) {
    const artistNames = track.artists?.map((a) => a.name).join(", ") || "";
    // const albumName = track.album?.name || "";
    // const year = track.album?.release_date ? track.album.release_date.split("-")[0] : "";

    return (
        <div onClick={() => onPlay(track)} className="relative rounded-xl bg-[#1a1a1a] hover:bg-[#242424] active:bg-[#303030] transition-colors p-5 cursor-pointer group overflow-hidden h-55">
            {/* Portada */}
            
            <img src={track.album?.images?.[0]?.url} alt={track.name} className="w-23 h-23 rounded-xl object-cover shadow-2xl mb-3"/>
            {/* Info */}
                <h3 className="text-white text-[16px] font-extrabold leading-tight">{track.name}</h3>
                <p className="text-[#b3b3b3] text-sm capitalize mt-0.5">Canción •<span className="text-white">{artistNames}</span></p>
            
            {/* Botón play */}
            <div
                className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200"
                onClick={() => onPlay(track)}
            >
                <div className="w-12 h-12 bg-[#1ED760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64] transition-all">
                    <FaPlay size={18} className="text-black ml-0.5" />
                </div>
            </div>
        </div>
    );
}

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────
function Skeleton() {
    return (
        <div className="animate-pulse px-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <div className="h-6 w-40 bg-white/10 rounded mb-4" />
                    <div className="rounded-xl bg-white/5 p-5 h-52 flex gap-4 items-end">
                        <div className="w-36 h-36 rounded-lg bg-white/10 shrink-0" />
                        <div className="flex flex-col gap-2 mb-1">
                            <div className="h-3 w-16 bg-white/10 rounded" />
                            <div className="h-5 w-36 bg-white/10 rounded" />
                            <div className="h-3 w-24 bg-white/10 rounded" />
                        </div>
                    </div>
                </div>
                <div>
                    <div className="h-6 w-28 bg-white/10 rounded mb-4" />
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-3 py-2 mb-1">
                            <div className="w-6 h-4 bg-white/10 rounded" />
                            <div className="w-10 h-10 rounded bg-white/10" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 w-36 bg-white/10 rounded" />
                                <div className="h-2.5 w-24 bg-white/10 rounded" />
                            </div>
                            <div className="h-3 w-8 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

// ─── TOKEN PÚBLICO ────────────────────────────────────────────────────────────
const _CLIENT_ID     = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const _CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
let _pubToken = null, _pubExpiry = 0;
async function _getPublicToken() {
    if (_pubToken && Date.now() < _pubExpiry) return _pubToken;
    const r = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + btoa(`${_CLIENT_ID}:${_CLIENT_SECRET}`) },
        body: "grant_type=client_credentials",
    });
    const d = await r.json();
    _pubToken = d.access_token;
    _pubExpiry = Date.now() + (d.expires_in - 60) * 1000;
    return _pubToken;
}

// ─── CACHÉ EN MEMORIA ─────────────────────────────────────────────────────────
const _searchCache = new Map(); // key: "search:{query}" | "albums:{artistId}"

// Guard StrictMode: evita doble-fetch en desarrollo
let _inflightKey = null;

// ─── FETCH BASE ───────────────────────────────────────────────────────────────
async function fetchSpotify(url, signal) {
    const token = localStorage.getItem("spotify_token") || (await _getPublicToken());
    const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal });
    if (res.status === 429) throw Object.assign(new Error("429"), { status: 429 });
    return res;
}

// ─── ÁLBUMES VÍA SEARCH (sin usar /artists/{id}/albums) ──────────────────────
// Reutiliza el endpoint /search con type=album, que tiene mejor rate limit
// que /artists/{id}/albums, y aplica caché por artistId.
async function fetchAlbumsViaSearch(artistName, artistId, signal) {
    const cacheKey = `albums:${artistId}`;
    if (_searchCache.has(cacheKey)) return _searchCache.get(cacheKey);

    const token = localStorage.getItem("spotify_token") || (await _getPublicToken());
    const url   = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=album&limit=10`;
    const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal });
    if (!res.ok) return [];

    const data = await res.json();
    const seen = new Set();
    const filtered = (data.albums?.items || [])
        .filter((a) => a.artists?.some((ar) => ar.id === artistId))
        .filter((a) => {
            const key = a.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 8);

    _searchCache.set(cacheKey, filtered);
    return filtered;
}

export default function ArtistSearch({ query, deviceId, onTrackSelect, onPlay, isLoggedIn, onOpenModal }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mainResult, setMainResult] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [relatedArtists, setRelatedArtists] = useState([]);
    const [artistAlbums, setArtistAlbums] = useState([]);
    const [activeFilter, setActiveFilter] = useState("Todo");
    const debounceRef = useRef(null);
    const abortRef    = useRef(null);

    const filters = ["Todo", "Canciones", "Artistas", "Álbumes"];

    // ── Reproducir primera canción del artista ───────────────────────────────
    const handleArtistPlay = async (artist) => {
        if (!isLoggedIn) return;
        try {
            const token = localStorage.getItem("spotify_token") || (await _getPublicToken());
            const res = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist.name)}&type=track&limit=1`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            const track = data.tracks?.items?.[0];
            if (!track) return;
            onTrackSelect?.({
                uri:      track.uri,
                name:     track.name,
                subtitle: track.artists?.[0]?.name,
                image:    track.album?.images?.[0]?.url,
                album:    track.album?.name || "",
            });
            onPlay?.(track.uri);
        } catch (e) {
            console.error("handleArtistPlay error:", e);
        }
    };

    // ── Reproducir álbum completo en orden ────────────────────────────────────
    const handleAlbumPlay = async (album) => {
        if (!isLoggedIn || !deviceId) return;
        const tracksData = await getAlbumTracks(album.id);
        if (!tracksData.length) return;
        const uris = tracksData.map(t => t.uri);
        onTrackSelect?.({
            uri:      tracksData[0].uri,
            name:     tracksData[0].name,
            subtitle: tracksData[0].artists?.[0]?.name,
            image:    album.images?.[0]?.url,
        });
        await playAlbum(deviceId, uris);
    };

    useEffect(() => {
        if (!query?.trim()) {
            setMainResult(null);
            setTracks([]);
            setRelatedArtists([]);
            setArtistAlbums([]);
            return;
        }

        clearTimeout(debounceRef.current);
        abortRef.current?.abort();

        debounceRef.current = setTimeout(async () => {
            const controller = new AbortController();
            abortRef.current = controller;
            const { signal } = controller;

            // Guard StrictMode: si esta key ya está en vuelo, salir
            const runKey = `search:${query.trim().toLowerCase()}`;
            if (_inflightKey === runKey) return;
            _inflightKey = runKey;

            setLoading(true);
            setError(null);
            try {
                let artists, tracksData, albums;

                if (_searchCache.has(runKey)) {
                    ({ artists, tracksData, albums } = _searchCache.get(runKey));
                } else {
                    const searchRes = await fetchSpotify(
                        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,track,album&limit=6`,
                        signal
                    );
                    if (searchRes.status === 401) {
                        setError("Sesión expirada. Por favor inicia sesión de nuevo.");
                        return;
                    }
                    const data = await searchRes.json();
                    artists    = data.artists?.items || [];
                    tracksData = data.tracks?.items?.slice(0, 4) || [];
                    albums     = data.albums?.items || [];
                    _searchCache.set(runKey, { artists, tracksData, albums });
                }

                if (signal.aborted) return;

                const resolved = resolveMainResult(artists, tracksData, albums, query);
                setMainResult(resolved);
                setTracks(tracksData);
                setRelatedArtists(artists.slice(1, 6));

                // Álbumes: usar /search?type=album en lugar de /artists/{id}/albums
                // para evitar el endpoint que tiene peor rate limit
                const topArtist = artists?.[0];
                if (topArtist) {
                    fetchAlbumsViaSearch(topArtist.name, topArtist.id, signal)
                        .then((albs) => { if (!signal.aborted) setArtistAlbums(albs); })
                        .catch(() => {});
                } else {
                    setArtistAlbums([]);
                }
            } catch (e) {
                if (e.name === "AbortError") return;
                if (e.status === 429) {
                    setError("Demasiadas búsquedas seguidas. Espera un momento e intenta de nuevo.");
                } else {
                    setError("Error al conectar con Spotify.");
                }
            } finally {
                _inflightKey = null;
                if (!signal.aborted) setLoading(false);
            }
        }, 800);

        return () => {
            clearTimeout(debounceRef.current);
            abortRef.current?.abort();
            _inflightKey = null;
        };
    }, [query]);

    const handlePlay = async (track) => {
        const trackData = {
            uri: track.uri,
            name: track.name,
            subtitle: track.artists?.[0]?.name,
            image: track.album?.images?.[0]?.url,
        };
        // Sin login → abrir modal de registro
        if (!isLoggedIn) {
            onOpenModal?.({ image: trackData.image, name: trackData.name });
            return;
        }
        // Con login → reproducir normalmente
        if (onTrackSelect) onTrackSelect(trackData);
        if (onPlay) onPlay(track.uri);
    };

    if (!query?.trim()) return null;

    const hasResults = mainResult || tracks.length > 0;

    return (
        <div className="w-full">
            {/* Filtros */}
            <div className="px-6 pt-4 pb-2 flex gap-2 flex-wrap">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                            activeFilter === f
                                ? "bg-white text-black border-white"
                                : "bg-transparent text-[#b3b3b3] border-[#3a3a3a] hover:border-white hover:text-white"
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && <Skeleton />}

            {/* Error */}
            {!loading && error && (
                <div className="mx-6 mt-6 p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* Sin resultados */}
            {!loading && !error && !hasResults && query && (
                <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                    <p className="text-white text-lg font-semibold">No se encontraron resultados para</p>
                    <p className="text-[#b3b3b3] text-sm mt-1">"{query}"</p>
                    <p className="text-[#6a6a6a] text-xs mt-3">Intenta buscar con otro nombre o revisa la ortografía.</p>
                </div>
            )}

            {/* Resultados */}
            {!loading && !error && hasResults && (
                <div className="px-6 mt-2 pb-8">

                    {/* Grid: resultado principal + canciones */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* ── Resultado principal ── */}
                        {(activeFilter === "Todo" || activeFilter === "Artistas" || activeFilter === "Álbumes" || activeFilter === "Canciones") && mainResult && (
                            <section>
                                <h2 className="text-white font-bold text-xl mb-4">Resultado principal</h2>
                                {mainResult.type === "artist" && (
                                    <MainResultArtist artist={mainResult.data} />
                                )}
                                {mainResult.type === "album" && (
                                    <MainResultAlbum album={mainResult.data} isLoggedIn={isLoggedIn} onOpenModal={onOpenModal} onAlbumPlay={handleAlbumPlay} />
                                )}
                                {mainResult.type === "track" && (
                                    <MainResultTrack track={mainResult.data} onPlay={handlePlay} />
                                )}
                            </section>
                        )}

                        {/* ── Canciones ── */}
                        {(activeFilter === "Todo" || activeFilter === "Canciones") && tracks.length > 0 && (
                            <section>
                                <h2 className="text-white font-bold text-xl mb-4">Canciones</h2>
                                <div className="space-y-1">
                                    {tracks.map((track, i) => (
                                        <TrackRow key={track.id} track={track} index={i} onPlay={handlePlay} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ── Álbumes del artista ── */}
                    {(activeFilter === "Todo" || activeFilter === "Álbumes") && artistAlbums.length > 0 && (
                        <section className="mt-8">
                            <h2 className="text-white font-bold text-xl mb-4">
                                Álbumes
                            </h2>
                            <div className="relative group/carousel w-full">
                                <button onClick={() => document.getElementById('carrusel-album').scrollBy({ left: -800, behavior: 'smooth' })}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 -translate-x-2">
                                    {'<'}
                                </button>

                                <div id="carrusel-album" className="flex overflow-x-auto scroll-smooth px-1 pb-2" style={{ scrollbarWidth: 'none' }}>
                                    {artistAlbums.map((album) => (
                                        <AlbumCard key={album.id} album={album} isLoggedIn={isLoggedIn} onOpenModal={onOpenModal} onAlbumPlay={handleAlbumPlay} />
                                    ))}
                                </div>

                                <button onClick={() => document.getElementById('carrusel-album').scrollBy({ left: 800, behavior: 'smooth' })}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 translate-x-2">
                                    {'>'}
                                </button>
                            </div>
                        </section>
                    )}

                    {/* ── Artistas relacionados ── */}
                    {(activeFilter === "Todo" || activeFilter === "Artistas") && relatedArtists.length > 0 && (
                        <section className="mt-8">
                            <h2 className="text-white font-bold text-xl mb-4">Artistas relacionados</h2>
                            <div className="relative group/carousel2 w-full">
                                <button onClick={() => document.getElementById('carrusel-artista').scrollBy({ left: -800, behavior: 'smooth' })}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel2:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 -translate-x-2">
                                    {'<'}
                                </button>

                                <div id="carrusel-artista" className="flex overflow-x-hidden scroll-smooth gap-2 pb-4" style={{ scrollbarWidth: 'none' }}>
                                    {relatedArtists.map((artist) => (
                                        <ArtistCard key={artist.id} artist={artist} isLoggedIn={isLoggedIn} onOpenModal={onOpenModal} onArtistPlay={handleArtistPlay} />
                                    ))}
                                </div>

                                <button onClick={() => document.getElementById('carrusel-artista').scrollBy({ left: 800, behavior: 'smooth' })}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel2:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 translate-x-2">
                                    {'>'}
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

