import { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaDownload, FaClock, FaEllipsisH } from "react-icons/fa";
import { FiEdit2, FiMoreHorizontal, FiTrash2, FiSearch, FiX } from "react-icons/fi";
import { IoMusicalNotesOutline } from "react-icons/io5";
import { useUserPlaylists } from "../hooks/useUserPlaylists";
import { useAuth } from "../context/AuthContext";
import CreatePlaylistModal from "./CreatePlaylistModal";
import { MdShuffle } from "react-icons/md";

// ─── UTILS ────────────────────────────────────────────────────────────────────
const _CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const _CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
let _pubToken = null, _pubExpiry = 0;
async function _getPublicToken() {
    if (_pubToken && Date.now() < _pubExpiry) return _pubToken;
    const r = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(`${_CLIENT_ID}:${_CLIENT_SECRET}`),
        },
        body: "grant_type=client_credentials",
    });
    const d = await r.json();
    _pubToken = d.access_token;
    _pubExpiry = Date.now() + (d.expires_in - 60) * 1000;
    return _pubToken;
}

async function searchSpotify(query) {
    if (!query?.trim()) return { tracks: [], artists: [], albums: [] };
    const token = localStorage.getItem("spotify_token") || (await _getPublicToken());
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=5&market=CO`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { tracks: [], artists: [], albums: [] };
    const data = await res.json();
    return {
        tracks: data.tracks?.items || [],
        artists: data.artists?.items || [],
        albums: data.albums?.items || [],
    };
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
/**
 * Props:
 *  - playlistId: string
 *  - onTrackSelect, playTrack, currentTrack, isPlaying, togglePlay
 *  - onBack: () => void
 *  - onDeleted: () => void
 */
export default function PlaylistView({
    playlistId,
    onTrackSelect,
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
    onBack,
    onDeleted,
}) {
    const { playlists, updatePlaylist, deletePlaylist, removeSongFromPlaylist, addSongToPlaylist } = useUserPlaylists();
    const { user } = useAuth();

    const playlist = playlists.find(p => p.id === playlistId);

    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // ── Búsqueda inline (sección inferior) ──
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({ tracks: [], artists: [], albums: [] });
    const [searchLoading, setSearchLoading] = useState(false);
    const searchDebounceRef = useRef(null);
    const searchInputRef = useRef(null);

    const userName = user?.displayName || user?.email?.split("@")[0] || "Usuario";

    // Cierra menú al hacer click fuera
    const menuRef = useRef(null);
    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    // Búsqueda inline con debounce
    useEffect(() => {
        clearTimeout(searchDebounceRef.current);
        if (!searchQuery.trim()) { setSearchResults({ tracks: [], artists: [], albums: [] }); return; }
        setSearchLoading(true);
        searchDebounceRef.current = setTimeout(async () => {
            const res = await searchSpotify(searchQuery);
            setSearchResults(res);
            setSearchLoading(false);
        }, 400);
        return () => clearTimeout(searchDebounceRef.current);
    }, [searchQuery]);

    if (!playlist) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-[#b3b3b3]">
                <p className="text-lg">Playlist no encontrada</p>
                <button onClick={onBack} className="text-white underline text-sm">Volver</button>
            </div>
        );
    }

    const songs = playlist.songs || [];
    const existingUris = songs.map(s => s.uri);

    const handlePlay = (song) => {
        if (currentTrack?.uri === song.uri) {
            togglePlay?.();
        } else {
            onTrackSelect?.(song);
            playTrack?.(song.uri);
        }
    };

   const isPlayingFromList = songs.some(s => s.uri === currentTrack?.uri);

    const handlePlayAll = () => {
        if (songs.length === 0) return;
        if (isPlayingFromList) {
            togglePlay?.();
        } else {
            onTrackSelect?.(songs[0]);
            playTrack?.(songs[0].uri);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`¿Eliminar la playlist "${playlist.name}"?`)) return;
        await deletePlaylist(playlistId);
        onDeleted?.();
    };

    const handleRemoveSong = async (uri) => {
        await removeSongFromPlaylist(playlistId, uri);
    };

    const handleSaveEdit = async ({ name, description, coverColor }) => {
        await updatePlaylist(playlistId, { name, description, coverColor });
    };

    // NUEVO: añadir canción desde el modal de búsqueda
    const handleAddSong = async (track) => {
        await addSongToPlaylist(playlistId, track);
    };

    // Color base del gradiente del header
    const baseColor = playlist.coverColor || "#535353";

    return (
        <div
            className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden spotify-scroll"
            onMouseEnter={e => e.currentTarget.classList.add("scrollbar-visible")}
            onMouseLeave={e => e.currentTarget.classList.remove("scrollbar-visible")}
        >
            {/* ══════════════════════════════════════════════════════════════════
                HEADER — igual al Spotify original
                ══════════════════════════════════════════════════════════════ */}
            <div
                className="relative flex items-end gap-6 px-8 pb-6 pt-20 shrink-0"
                style={{
                    background: `linear-gradient(transparent 0, ${baseColor}bb 30%, ${baseColor}88 70%, #121212 100%)`
                }}
            >
                {/* ── Portada ── */}
                <div
                    className="w-56 h-56 flex-shrink-0 flex items-center justify-center shadow-[0_4px_60px_rgba(0,0,0,0.5)] rounded cursor-pointer hover:brightness-90 transition-all relative group"
                    style={{
                        background: `linear-gradient(135deg, ${baseColor}dd 0%, ${baseColor}66 100%)`
                    }}
                    onClick={() => setEditOpen(true)}
                    title="Editar playlist"
                >
                    {playlist.coverImage ? (
                        <img
                            src={playlist.coverImage}
                            alt=""
                            className="w-full h-full object-cover rounded opacity-95"
                        />
                    ) : songs[0]?.image ? (
                        <img
                            src={songs[0].image}
                            alt=""
                            className="w-full h-full object-cover rounded opacity-80"
                        />
                    ) : (
                        /* Ícono nota musical igual que en Spotify */
                        <IoMusicalNotesOutline className="w-24 h-24 text-[#b3b3b3]" />
                    )}
                    {/* Overlay de edición al hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex flex-col items-center gap-1">
                            <FiEdit2 size={24} className="text-white" />
                            <span className="text-white text-xs font-semibold">Editar portada</span>
                        </div>
                    </div>
                </div>

                {/* ── Info ── */}
                <div className="flex flex-col gap-2 pb-2 text-white min-w-0 flex-1">
                    {/* "Lista" en mayúsculas pequeñas — igual Spotify */}
                    <span className="text-xs font-bold uppercase tracking-widest text-white/90">Lista</span>

                    {/* Nombre de la playlist: enorme, bold, clicable */}
                    <h1
                        className="font-black leading-[1.05] tracking-tight cursor-pointer"
                        style={{ fontSize: "clamp(1.8rem, 5vw, 5rem)" }}
                        onClick={() => setEditOpen(true)}
                    >
                        {playlist.name}
                    </h1>

                    {/* Descripción opcional */}
                    {playlist.description && (
                        <p className="text-sm text-white/60 max-w-md leading-relaxed mt-1">
                            {playlist.description}
                        </p>
                    )}

                    {/* Metadata: usuario · N canciones */}
                    <div className="flex items-center gap-1 mt-2 text-sm">
                        <span className="font-bold">{userName}</span>
                        <span className="text-white/70">
                            &nbsp;• {songs.length} {songs.length === 1 ? "canción" : "canciones"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                CONTROLES (barra verde)
                ══════════════════════════════════════════════════════════════ */}
            <div
                className="px-8 py-5 flex items-center gap-6 flex-shrink-0"
                style={{ background: "linear-gradient(180deg, #12121299 0%, #121212 100%)" }}
            >
                {/* Botón Play grande verde */}
                <button
                    onClick={handlePlayAll}
                    disabled={songs.length === 0}
                    className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl
                               hover:scale-105 hover:bg-[#1ed760] active:scale-95
                               transition-all disabled:opacity-40 disabled:hover:scale-100"
                >
                    {isPlayingFromList && isPlaying
                        ? <FaPause size={22} className="text-black" />
                        : <FaPlay size={22} className="text-black ml-1" />
                    }
                </button>

                {/* Shuffle */}
                <button className="text-[#B3B3B3] hover:text-white transition-colors hover:scale-105">
                    <MdShuffle size={22} />
                </button>

                {/* Descarga */}
                <button className="text-[#B3B3B3] hover:text-white transition-colors hover:scale-105">
                    <FaDownload size={20} />
                </button>

                {/* Menú contextual ··· */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="text-[#B3B3B3] hover:text-white transition-colors hover:scale-105 p-2"
                    >
                        <FiMoreHorizontal size={24} />
                    </button>
                    {menuOpen && (
                        <div className="absolute top-11 left-0 bg-[#282828] rounded-lg shadow-2xl py-1 w-56 z-50 border border-white/5">
                            <button
                                onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                            >
                                <FiEdit2 size={16} /> Editar información
                            </button>
                            <button
                                onClick={() => { setMenuOpen(false); handleDelete(); }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors"
                            >
                                <FiTrash2 size={16} /> Eliminar playlist
                            </button>
                        </div>
                    )}
                </div>

                {/* Vista lista — derecha */}
                <div className="ml-auto flex items-center gap-1.5 text-[#B3B3B3] text-sm font-semibold cursor-pointer hover:text-white transition-colors select-none">
                    Lista <FaEllipsisH size={14} className="rotate-90" />
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                TABLA DE CANCIONES
                ══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 bg-[#121212] px-6 pb-32">

                {songs.length === 0 ? (
                    /* Estado vacío con búsqueda inline */
                    <div className="pt-8">
                        <h3 className="text-white font-bold text-xl mb-4">
                            Descubramos contenido para tu playlist
                        </h3>
                        <div className="relative max-w-sm">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" size={16} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Busca canciones o episodios"
                                className="w-full bg-[#2a2a2a] text-white placeholder-[#6a6a6a] rounded-md py-3 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-white/20"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white transition-colors">
                                    <FiX size={16} />
                                </button>
                            )}
                        </div>
                        {searchLoading && <div className="flex py-6"><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}
                        {!searchLoading && searchQuery && searchResults.tracks.length === 0 && <p className="text-[#b3b3b3] text-sm py-6">No se encontraron resultados para "{searchQuery}"</p>}
                        {!searchLoading && (() => {
                            const combined = [];
                            if (searchResults.artists[0]) combined.push({ kind: "artist", data: searchResults.artists[0] });
                            searchResults.tracks.forEach(t => combined.push({ kind: "track", data: t }));
                            searchResults.albums.slice(0, 2).forEach(a => combined.push({ kind: "album", data: a }));
                            return combined.map((item) => {
                                if (item.kind === "artist") {
                                    const a = item.data;
                                    return (
                                        <div key={"a-" + a.id} className="flex items-center gap-3 px-2 py-3 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
                                            <img src={a.images?.[2]?.url || a.images?.[0]?.url} alt={a.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                                            <div className="flex-1 min-w-0"><p className="text-white text-sm font-semibold truncate">{a.name}</p><p className="text-[#b3b3b3] text-xs">Artista</p></div>
                                            <span className="text-[#b3b3b3] text-lg">›</span>
                                        </div>
                                    );
                                }
                                if (item.kind === "album") {
                                    const a = item.data;
                                    return (
                                        <div key={"al-" + a.id} className="flex items-center gap-3 px-2 py-3 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
                                            <img src={a.images?.[2]?.url || a.images?.[0]?.url} alt={a.name} className="w-11 h-11 rounded object-cover flex-shrink-0" />
                                            <div className="flex-1 min-w-0"><p className="text-white text-sm font-semibold truncate">{a.name}</p><p className="text-[#b3b3b3] text-xs">{a.artists?.[0]?.name} · Álbum</p></div>
                                            <span className="text-[#b3b3b3] text-lg">›</span>
                                        </div>
                                    );
                                }
                                const t = item.data;
                                const alreadyAdded = existingUris.includes(t.uri);
                                return (
                                    <div key={"t-" + t.id} className={`flex items-center gap-3 px-2 py-3 rounded-md transition-colors ${alreadyAdded ? "opacity-50" : "hover:bg-white/10 cursor-pointer"}`}>
                                        <img src={t.album?.images?.[2]?.url || t.album?.images?.[0]?.url} alt={t.name} className="w-11 h-11 rounded object-cover flex-shrink-0" />
                                        <div className="flex-1 min-w-0"><p className="text-white text-sm font-semibold truncate">{t.name}</p><p className="text-[#b3b3b3] text-xs truncate">{t.artists?.map(a => a.name).join(", ")} · {t.album?.name}</p></div>
                                        <span className="text-[#b3b3b3] text-xs truncate max-w-[120px] hidden sm:block">{t.album?.name}</span>
                                        <button
                                            disabled={alreadyAdded}
                                            onClick={() => handleAddSong({ uri: t.uri, name: t.name, subtitle: t.artists?.map(a => a.name).join(", ") || "", image: t.album?.images?.[0]?.url || "", album: t.album?.name || "", duration_ms: t.duration_ms })}
                                            className={`ml-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all shrink-0 ${alreadyAdded ? "border-[#535353] text-[#535353] cursor-default" : "border-[#b3b3b3] text-white hover:border-white hover:scale-105 active:scale-95"}`}
                                        >
                                            {alreadyAdded ? "Añadida" : "Añadir"}
                                        </button>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                ) : (
                    <>
                        {/* ── Cabecera tabla DESKTOP ── */}
                        <div
                            className="hidden md:grid items-center text-[#B3B3B3] text-xs font-medium uppercase tracking-widest border-b border-white/10 pb-3 mb-2 px-4 sticky top-0 bg-[#121212] z-10"
                            style={{ gridTemplateColumns: "36px 1fr 180px 60px 44px" }}
                        >
                            <span className="text-center">#</span>
                            <span>Título</span>
                            <span>Álbum</span>
                            <span className="flex justify-end pr-1"><FaClock size={13} /></span>
                            <span></span>
                        </div>

                        {/* ── Cabecera tabla MÓVIL ── */}
                        <div
                            className="md:hidden grid items-center text-[#B3B3B3] text-xs font-medium uppercase tracking-widest border-b border-white/10 pb-3 mb-2 px-4 sticky top-0 bg-[#121212] z-10"
                            style={{ gridTemplateColumns: "32px 1fr 44px" }}
                        >
                            <span className="text-center">#</span>
                            <span>Título</span>
                            <span className="flex justify-end pr-1"><FaClock size={13} /></span>
                        </div>

                        {/* ── Filas ── */}
                        {songs.map((song, idx) => {
                            const isCurrent = currentTrack?.uri === song.uri;
                            const isRowPlaying = isCurrent && isPlaying;
                            const isHovered = hoveredIdx === idx;

                            return (
                                <div key={song.uri || idx}>
                                    {/* DESKTOP */}
                                    <div
                                        className={`hidden md:grid items-center px-4 py-2 rounded-md cursor-pointer transition-colors ${isHovered ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}
                                        style={{ gridTemplateColumns: "36px 1fr 180px 60px 44px" }}
                                        onMouseEnter={() => setHoveredIdx(idx)}
                                        onMouseLeave={() => setHoveredIdx(null)}
                                        onDoubleClick={() => handlePlay(song)}
                                    >
                                        {/* Número / play / ecualizador */}
                                        <div className="flex items-center justify-center h-9">
                                            {isRowPlaying ? (
                                                <span className="flex items-end gap-[2.5px] h-4">
                                                    {[55, 100, 70].map((h, i) => (
                                                        <span key={i} className="w-[3px] rounded-sm bg-[#1DB954]"
                                                            style={{ height: `${h}%`, animation: `barBounce 0.8s ease ${i * 0.15}s infinite alternate` }} />
                                                    ))}
                                                </span>
                                            ) : isHovered ? (
                                                <button onClick={() => handlePlay(song)} className="text-white w-full h-full flex items-center justify-center">
                                                    {isCurrent ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />}
                                                </button>
                                            ) : (
                                                <span className={`text-sm tabular-nums ${isCurrent ? "text-[#1DB954]" : "text-[#B3B3B3]"}`}>{idx + 1}</span>
                                            )}
                                        </div>

                                        {/* Portada + nombre */}
                                        <div className="flex items-center gap-3 min-w-0 pr-4">
                                            {song.image
                                                ? <img src={song.image} alt={song.name} className="w-10 h-10 rounded object-cover flex-shrink-0 shadow-md" />
                                                : <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0 text-[#555]">♪</div>
                                            }
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${isCurrent ? "text-[#1DB954]" : "text-white"}`}>{song.name}</p>
                                                <p className="text-xs text-[#B3B3B3] truncate mt-0.5">{song.subtitle}</p>
                                            </div>
                                        </div>

                                        {/* Álbum */}
                                        <span className="text-xs text-[#B3B3B3] truncate pr-6">
                                            {(typeof song.album === "object" ? song.album?.name : song.album) || "—"}
                                        </span>

                                        {/* Duración */}
                                        <div className="text-xs text-[#B3B3B3] tabular-nums">
                                            {song.duration_ms
                                                ? `${Math.floor(song.duration_ms / 60000)}:${Math.floor((song.duration_ms % 60000) / 1000).toString().padStart(2, "0")}`
                                                : "—"
                                            }
                                        </div>

                                        {/* Quitar */}
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={e => { e.stopPropagation(); handleRemoveSong(song.uri); }}
                                                className={`text-[#b3b3b3] hover:text-red-400 transition-all hover:scale-110 active:scale-95 ${isHovered ? "opacity-100" : "opacity-0"}`}
                                            >
                                                <FiTrash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* MÓVIL */}
                                    <div
                                        className={`md:hidden grid items-center px-4 py-2 rounded-md cursor-pointer transition-colors active:bg-white/[0.08] ${isCurrent ? "bg-white/[0.04]" : ""}`}
                                        style={{ gridTemplateColumns: "32px 1fr 44px" }}
                                        onClick={() => handlePlay(song)}
                                    >
                                        <div className="flex items-center justify-center h-10">
                                            {isRowPlaying ? (
                                                <span className="flex items-end gap-[2.5px] h-4">
                                                    {[55, 100, 70].map((h, i) => (
                                                        <span key={i} className="w-[3px] rounded-sm bg-[#1DB954]"
                                                            style={{ height: `${h}%`, animation: `barBounce 0.8s ease ${i * 0.15}s infinite alternate` }} />
                                                    ))}
                                                </span>
                                            ) : (
                                                <span className={`text-sm tabular-nums ${isCurrent ? "text-[#1DB954]" : "text-[#B3B3B3]"}`}>{idx + 1}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 min-w-0">
                                            {song.image
                                                ? <img src={song.image} alt={song.name} className="w-10 h-10 rounded object-cover flex-shrink-0 shadow-md" />
                                                : <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0 text-[#555]">♪</div>
                                            }
                                            <div className="min-w-0">
                                                <p className={`text-sm font-semibold truncate leading-tight ${isCurrent ? "text-[#1DB954]" : "text-white"}`}>{song.name}</p>
                                                <p className="text-xs text-[#B3B3B3] truncate mt-0.5 leading-tight">{song.subtitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <span className="text-xs text-[#B3B3B3] tabular-nums">
                                                {song.duration_ms
                                                    ? `${Math.floor(song.duration_ms / 60000)}:${Math.floor((song.duration_ms % 60000) / 1000).toString().padStart(2, "0")}`
                                                    : "—"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* ── Sección "Descubramos contenido" inline — estilo Spotify ── */}
                        <div className="mt-10 pt-8 border-t border-white/10">
                            <h3 className="text-white font-bold text-xl mb-1">
                                Descubramos contenido para tu playlist
                            </h3>

                            {/* Barra de búsqueda */}
                            <div className="relative mt-4 max-w-sm">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" size={16} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Busca canciones o episodios"
                                    className="w-full bg-[#2a2a2a] text-white placeholder-[#6a6a6a] rounded-md py-3 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-white/20"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white transition-colors"
                                    >
                                        <FiX size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Spinner */}
                            {searchLoading && (
                                <div className="flex justify-start py-6">
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Sin resultados */}
                            {!searchLoading && searchQuery && searchResults.tracks.length === 0 && searchResults.artists.length === 0 && (
                                <p className="text-[#b3b3b3] text-sm py-6">
                                    No se encontraron resultados para "{searchQuery}"
                                </p>
                            )}

                            {/* Resultados */}
                            {!searchLoading && (() => {
                                const combined = [];
                                if (searchResults.artists[0]) combined.push({ kind: "artist", data: searchResults.artists[0] });
                                searchResults.tracks.forEach(t => combined.push({ kind: "track", data: t }));
                                searchResults.albums.slice(0, 2).forEach(a => combined.push({ kind: "album", data: a }));

                                return combined.map((item) => {
                                    if (item.kind === "artist") {
                                        const a = item.data;
                                        return (
                                            <div key={"a-" + a.id} className="flex items-center gap-3 px-2 py-3 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
                                                <img src={a.images?.[2]?.url || a.images?.[0]?.url} alt={a.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-semibold truncate">{a.name}</p>
                                                    <p className="text-[#b3b3b3] text-xs">Artista</p>
                                                </div>
                                                <span className="text-[#b3b3b3] text-lg">›</span>
                                            </div>
                                        );
                                    }
                                    if (item.kind === "album") {
                                        const a = item.data;
                                        return (
                                            <div key={"al-" + a.id} className="flex items-center gap-3 px-2 py-3 rounded-md hover:bg-white/10 cursor-pointer transition-colors">
                                                <img src={a.images?.[2]?.url || a.images?.[0]?.url} alt={a.name} className="w-11 h-11 rounded object-cover flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-semibold truncate">{a.name}</p>
                                                    <p className="text-[#b3b3b3] text-xs">{a.artists?.[0]?.name} · Álbum</p>
                                                </div>
                                                <span className="text-[#b3b3b3] text-lg">›</span>
                                            </div>
                                        );
                                    }
                                    // track
                                    const t = item.data;
                                    const alreadyAdded = existingUris.includes(t.uri);
                                    return (
                                        <div key={"t-" + t.id} className={`flex items-center gap-3 px-2 py-3 rounded-md transition-colors ${alreadyAdded ? "opacity-50" : "hover:bg-white/10 cursor-pointer"}`}>
                                            <img src={t.album?.images?.[2]?.url || t.album?.images?.[0]?.url} alt={t.name} className="w-11 h-11 rounded object-cover flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold truncate">{t.name}</p>
                                                <p className="text-[#b3b3b3] text-xs truncate">{t.artists?.map(a => a.name).join(", ")} · {t.album?.name}</p>
                                            </div>
                                            <span className="text-[#b3b3b3] text-xs truncate max-w-[120px] hidden sm:block">{t.album?.name}</span>
                                            <button
                                                disabled={alreadyAdded}
                                                onClick={() => handleAddSong({
                                                    uri: t.uri,
                                                    name: t.name,
                                                    subtitle: t.artists?.map(a => a.name).join(", ") || "",
                                                    image: t.album?.images?.[0]?.url || "",
                                                    album: t.album?.name || "",
                                                    duration_ms: t.duration_ms,
                                                })}
                                                className={`ml-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all shrink-0 ${alreadyAdded
                                                    ? "border-[#535353] text-[#535353] cursor-default"
                                                    : "border-[#b3b3b3] text-white hover:border-white hover:scale-105 active:scale-95"
                                                    }`}
                                            >
                                                {alreadyAdded ? "Añadida" : "Añadir"}
                                            </button>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </>
                )}
            </div>

            {/* Modal editar playlist */}
            <CreatePlaylistModal
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                onConfirm={handleSaveEdit}
                initialData={{ name: playlist.name, description: playlist.description, coverColor: playlist.coverColor }}
                mode="edit"
            />

            {/* Animación ecualizador */}
            <style>{`
                @keyframes barBounce {
                    from { transform: scaleY(0.3); }
                    to   { transform: scaleY(1); }
                }
            `}</style>
        </div>
    );
}
