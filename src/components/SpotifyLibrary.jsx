
import { useEffect, useRef, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { BsCircleFill } from "react-icons/bs";
import { FiFolder, FiGlobe, FiPlus } from "react-icons/fi";
import { IoMusicalNotesOutline } from "react-icons/io5";
import { FaPlay, FaHeart } from "react-icons/fa";
import { MdOutlineLibraryMusic } from "react-icons/md";
import { useLikedSongs } from "../hooks/useLikedSongs";
import { useUserPlaylists } from "../hooks/useUserPlaylists";
import CreatePlaylistModal from "./CreatePlaylistModal";
import PlaylistContextMenu from "./PlaylistContextMenu";   // ← NUEVO
import { useAuth } from "../context/AuthContext";

async function fetchWithAuth(url, retries = 3) {
    const token = localStorage.getItem("spotify_token");
    const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (res.status === 429) {
        const wait = ((res.headers.get("Retry-After") ?? 2)) * 1000;
        console.warn(`429 → esperando ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        if (retries > 0) return fetchWithAuth(url, retries - 1);
        throw new Error("429: demasiados intentos");
    }
    if (res.status === 403) {
        console.warn(`403 en ${url}`);
        return null;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

const FILTERS = ["Playlists", "Por Spotify", "Por ti", "Me gusta"];

export default function SpotifyLibrary({ deviceId, isReady, onTrackSelect, onViewChange, activeView }) {
    const token = localStorage.getItem("spotify_token");
    if (!token) return null;
    return <LibraryContent deviceId={deviceId} isReady={isReady} onTrackSelect={onTrackSelect} onViewChange={onViewChange} activeView={activeView} />;
}

function LibraryContent({ deviceId, isReady, onTrackSelect, onViewChange, activeView }) {
    const [activeFilter, setActiveFilter] = useState(null);
    const [hoveredId, setHoveredId]       = useState(null);
    const [playingId, setPlayingId]       = useState(null);
    const [menuCrear, setMenuCrear]       = useState(false);
    const [menuPos,   setMenuPos]         = useState({ top: 0, left: 0 });
    const [tooltip, setTooltip]           = useState("");
    const btnCrearRef = useRef(null);
    const [needsReauth, setNeedsReauth]   = useState(false);
    const [loading, setLoading]           = useState(true);

    // ── Modal crear / editar playlist ───────────────────────────────────────────
    const [createModalOpen,   setCreateModalOpen]   = useState(false);
    const [editModalOpen,     setEditModalOpen]     = useState(false);
    const [editingPlaylist,   setEditingPlaylist]   = useState(null);

    // ── Menú contextual (click derecho) ─────────────────────────────────────────
    const [ctxMenu, setCtxMenu] = useState({
        isOpen:   false,
        position: { x: 0, y: 0 },
        playlist: null,
    });

    const [playlists, setPlaylists]             = useState([]);
    const [savedAlbums, setSavedAlbums]         = useState([]);
    const [followedArtists, setFollowedArtists] = useState([]);

    const { likedSongs } = useLikedSongs();
    const { playlists: userPlaylists, createPlaylist, updatePlaylist, deletePlaylist } = useUserPlaylists();

    const { user } = useAuth();
    const userName = user?.displayName?.split(" ")?.[0] || "Tú";

    const menuRef    = useRef(null);
    const libraryRef = useRef(null); // ref al contenedor raíz de la biblioteca
    const fetched    = useRef(false);

    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;

        async function loadLibrary() {
            setLoading(true);
            try {
                const [playlistsRes, albumsRes, artistsRes] = await Promise.allSettled([
                    fetchWithAuth("https://api.spotify.com/v1/me/playlists?limit=50"),
                    fetchWithAuth("https://api.spotify.com/v1/me/albums?limit=50"),
                    fetchWithAuth("https://api.spotify.com/v1/me/following?type=artist&limit=50"),
                ]);

                const has403 = [playlistsRes, albumsRes, artistsRes].some(
                    r => r.status === "fulfilled" && r.value === null
                );
                if (has403) setNeedsReauth(true);

                if (playlistsRes.status === "fulfilled" && playlistsRes.value)
                    setPlaylists(playlistsRes.value.items || []);
                if (albumsRes.status === "fulfilled" && albumsRes.value)
                    setSavedAlbums(albumsRes.value.items?.map(i => i.album) || []);
                if (artistsRes.status === "fulfilled" && artistsRes.value)
                    setFollowedArtists(artistsRes.value.artists?.items || []);
            } catch (e) {
                console.error("Error cargando biblioteca:", e);
            } finally {
                setLoading(false);
            }
        }
        loadLibrary();
    }, []);

    useEffect(() => {
        function handler(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuCrear(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Crear playlist directo sin modal ────────────────────────────────────────
    const handleCreatePlaylist = async () => {
        const autoName = `Mi playlist n.° ${userPlaylists.length + 1}`;
        const newId = await createPlaylist({ name: autoName, description: "", coverColor: "#535353" });
        if (newId) {
            onViewChange?.("playlist", newId);
        }
    };

    // ── Editar playlist desde el modal ──────────────────────────────────────────
    const handleEditConfirm = async ({ name, description, coverColor, coverImage }) => {
        if (!editingPlaylist) return;
        await updatePlaylist(editingPlaylist.firestoreId, { name, description, coverColor, coverImage });
    };

    // ── Eliminar playlist ───────────────────────────────────────────────────────
    const handleDeletePlaylist = async (playlist) => {
        if (!playlist?.firestoreId) return;
        await deletePlaylist(playlist.firestoreId);
    };

    // ── Abrir menú contextual ───────────────────────────────────────────────────
    const handleContextMenu = (e, item) => {
        // Solo para playlists propias del usuario
        if (item.type !== "userPlaylist") return;
        e.preventDefault();
        e.stopPropagation();

        // Limitar el menú dentro del contenedor de la biblioteca
        const MENU_W = 210;
        const MENU_H = 160;
        const lib = libraryRef.current?.getBoundingClientRect() ?? {
            left: 0, right: window.innerWidth,
            top: 0,  bottom: window.innerHeight,
        };
        const x = Math.max(lib.left + 4, Math.min(e.clientX, lib.right  - MENU_W - 4));
        const y = Math.max(lib.top  + 4, Math.min(e.clientY, lib.bottom - MENU_H - 4));

        setCtxMenu({ isOpen: true, position: { x, y }, playlist: item });
    };

    const closeCtxMenu = () => setCtxMenu(prev => ({ ...prev, isOpen: false }));

    // ── Items de la lista ────────────────────────────────────────────────────────
    const likedItem = {
        id: "__liked__",
        type: "liked",
        name: "Canciones que te gustan",
        subtitle: `Playlist • ${likedSongs.length} canciones`,
        isLiked: true,
    };

    const userPlaylistItems = userPlaylists.map(p => ({
        id:          `__user__${p.id}`,
        firestoreId: p.id,
        type:        "userPlaylist",
        name:        p.name,
        subtitle:    `Playlist • ${(p.songs || []).length} canciones`,
        coverColor:  p.coverColor || "#535353",
        coverImage:  p.coverImage || null,
        description: p.description || "",
        img:         p.coverImage || p.songs?.[0]?.image || null,
    }));

    const playlistItems = playlists.map(p => ({
        id: p.id, type: "playlist",
        name: p.name,
        subtitle: `Playlist • ${p.owner?.display_name || ""}`,
        img: p.images?.[0]?.url,
        uri: p.uri,
    }));

    const albumItems = savedAlbums.map(a => ({
        id: a.id, type: "album",
        name: a.name,
        subtitle: `Álbum • ${a.artists?.[0]?.name || ""}`,
        img: a.images?.[0]?.url,
        uri: a.uri,
    }));

    const artistItems = followedArtists.map(a => ({
        id: a.id, type: "artist",
        name: a.name,
        subtitle: "Artista",
        img: a.images?.[0]?.url,
        uri: a.uri,
    }));

    const likedTrackItems = likedSongs.map(s => ({
        id:       s.uri,
        type:     "likedTrack",
        name:     s.name,
        subtitle: s.subtitle,
        img:      s.image,
        uri:      s.uri,
    }));

    const allItems = [likedItem, ...userPlaylistItems];

    const filtered = activeFilter
        ? activeFilter === "Me gusta"
            ? likedTrackItems
            : allItems.filter(item => {
                  if (activeFilter === "Playlists")   return item.type === "playlist" || item.type === "liked" || item.type === "userPlaylist";
                  if (activeFilter === "Por ti")      return item.type === "userPlaylist" || item.type === "liked";
                  if (activeFilter === "Por Spotify") return item.type === "playlist";
                  return true;
              })
        : allItems;

    const handlePlay = (item) => {
        if (item.type === "liked") {
            onViewChange?.("liked");
            return;
        }
        if (item.type === "userPlaylist") {
            onViewChange?.("playlist", item.firestoreId);
            return;
        }
        if (!item.uri) return;
        onViewChange?.("home");
        setPlayingId(item.id);
        onTrackSelect?.({
            uri:      item.uri,
            name:     item.name,
            subtitle: item.subtitle,
            image:    item.img,
        });
    };

    const displayItems = window.innerWidth < 768 ? [likedItem] : filtered;

    return (
        <div ref={libraryRef} className="bg-[#121212] w-full md:w-98.5 h-full md:h-136 rounded-lg flex flex-col overflow-hidden">
            {/* ── Header ── */}
            <header className="flex items-center justify-between px-4 pt-4 pb-1 h-18 flex-shrink-0">
                <button className="flex items-center gap-3 text-[#b3b3b3] hover:text-white transition-colors">
                    <MdOutlineLibraryMusic size={24} />
                    <p className="text-base font-bold text-white">Tu biblioteca</p>
                </button>
                <div ref={menuRef} className="relative">
                    <button
                        ref={btnCrearRef}
                        onMouseEnter={() => setTooltip("Crear")}
                        onMouseLeave={() => setTooltip("")}
                        onClick={() => {
                            if (!menuCrear) {
                                const rect = btnCrearRef.current.getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 8, left: rect.left });
                            }
                            setMenuCrear(!menuCrear);
                        }}
                        className="flex group items-center gap-2 text-white text-sm font-bold bg-[#1F1F1F] py-2 px-4 hover:bg-[#2b2b2b] rounded-3xl transition-colors duration-300"
                    >
                        <FiPlus className={`text-2xl text-gray-300 group-hover:text-white transition-all duration-150 ${menuCrear ? "rotate-45" : "rotate-0"}`} />
                        Crear
                    </button>
                    {tooltip === "Crear" && (() => {
                        const rect = btnCrearRef.current?.getBoundingClientRect();
                        if (!rect) return null;
                        const tipTop  = rect.top - 36;
                        const tipLeft = rect.left + rect.width / 2;
                        return (
                            <span
                                className="fixed bg-[#3b3b3b] text-white font-bold text-sm px-2 py-1 rounded whitespace-nowrap z-[9999] -translate-x-1/2 pointer-events-none"
                                style={{ top: tipTop, left: tipLeft }}
                            >
                                Crea una playlist, carpeta o jam.
                            </span>
                        );
                    })()}

                    {menuCrear && (
                        <div
                            className="fixed bg-[#282828] p-0.5 rounded-lg w-117 z-[9999] shadow-2xl"
                            style={{ top: menuPos.top, left: menuPos.left }}
                        >
                            <div
                                className="group p-2 hover:bg-[#3D3D3D] hover:rounded-lg flex items-center gap-3 transition-all duration-200 cursor-pointer"
                                onClick={() => { setMenuCrear(false); handleCreatePlaylist(); }}
                            >
                                <div className="relative h-12 w-12 bg-[#505050] rounded-full flex items-center justify-center text-white">
                                    <IoMusicalNotesOutline size={26} className="group-hover:text-[#1FD460] transition-all duration-200" />
                                    <AiOutlinePlus className="absolute bg-[#505050] rounded-full top-2.75 left-3 text-[13px] font-black group-hover:text-[#1FD460]" />
                                </div>
                                <div>
                                    <span className="text-base font-bold text-white">Playlist</span>
                                    <p className="text-[#B3B3B3] text-sm">Crea una playlist con canciones o episodios</p>
                                </div>
                            </div>
                            <div className="group p-2 hover:bg-[#3D3D3D] hover:rounded-lg flex items-center gap-3 transition-all duration-200 cursor-default">
                                <div className="relative h-12 w-12 bg-[#505050] rounded-full flex items-center justify-center text-white">
                                    <BsCircleFill className="opacity-60 text-[17.5px] absolute top-3 right-3 group-hover:text-[#1FD460]" />
                                    <BsCircleFill className="absolute left-3 top-5 opacity-60 text-[17.5px] group-hover:text-[#1FD460]" />
                                </div>
                                <div>
                                    <span className="text-base font-bold text-white">Fusión</span>
                                    <p className="text-[#B3B3B3] text-sm">Combina los gustos de tus personas favoritas</p>
                                </div>
                            </div>
                            <div className="px-6 py-2"><div className="w-full h-[0.1px] bg-[#B3B3B3]" /></div>
                            <div className="group p-2 hover:bg-[#3D3D3D] hover:rounded-lg flex items-center gap-3 transition-all duration-200 cursor-default">
                                <div className="relative h-12 w-12 bg-[#505050] rounded-full flex items-center justify-center text-white">
                                    <FiFolder size={26} className="group-hover:text-[#1FD460] transition-all duration-200" />
                                </div>
                                <div>
                                    <span className="text-base font-bold text-white">Carpeta</span>
                                    <p className="text-[#B3B3B3] text-sm">Organiza tus playlists</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {needsReauth && (
                <div className="mx-4 mb-2 px-3 py-2 bg-[#1a1a1a] border border-yellow-500/40 rounded-lg">
                    <p className="text-yellow-400 text-xs font-medium">
                        Tu sesión de Spotify necesita permisos adicionales.{" "}
                        <button
                            onClick={() => { localStorage.removeItem("spotify_token"); window.location.href = "/"; }}
                            className="underline hover:text-yellow-300 transition-colors"
                        >
                            Vuelve a conectar Spotify
                        </button>
                    </p>
                </div>
            )}

            {/* ── Filtros ── */}
            <div className="hidden md:flex gap-2 px-4 pt-2 pb-3 flex-wrap flex-shrink-0 items-center">
                {activeFilter && (
                    <button
                        onClick={() => setActiveFilter(null)}
                        className="w-7 h-7 rounded-full bg-[#2a2a2a] text-white flex items-center justify-center hover:bg-[#3a3a3a] transition-colors text-sm font-bold flex-shrink-0"
                    >
                        ✕
                    </button>
                )}
                {FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(activeFilter === f ? null : f)}
                        className={`px-[14px] py-[6px] rounded-full text-[13px] font-semibold transition-all flex items-center gap-1.5 ${
                            activeFilter === f ? "bg-white text-black" : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="hidden md:flex items-center px-4 pb-2 flex-shrink-0">
                <span className="text-[#b3b3b3] text-base">🔍</span>
                <button className="ml-auto flex items-center gap-1 text-[#b3b3b3] text-[13px] hover:text-white transition-colors">
                    Recientes <span className="text-lg">≡</span>
                </button>
            </div>

            {/* ── Lista ── */}
            <div
                className="px-2 overflow-y-auto flex-1 spotify-scroll"
                onMouseEnter={e => e.currentTarget.classList.add("scrollbar-visible")}
                onMouseLeave={e => e.currentTarget.classList.remove("scrollbar-visible")}
            >
                {loading && activeFilter !== "Me gusta" ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
                            <div className="w-12 h-12 rounded bg-white/10 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-32 bg-white/10 rounded" />
                                <div className="h-2.5 w-24 bg-white/10 rounded" />
                            </div>
                        </div>
                    ))
                ) : displayItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                        {activeFilter === "Me gusta"
                            ? <>
                                <FaHeart className="text-[#B3B3B3]" size={32} />
                                <p className="text-[#b3b3b3] text-sm text-center">Aún no tienes canciones guardadas</p>
                                <p className="text-[#6a6a6a] text-xs text-center">Dale al corazón en el reproductor para guardar canciones</p>
                              </>
                            : <p className="text-[#b3b3b3] text-sm text-center">No hay contenido en esta categoría</p>
                        }
                    </div>
                ) : (
                    displayItems.map(item => {
                        const isHovered = hoveredId === item.id;
                        const isPlaying = playingId === item.id;
                        return (
                            <div
                                key={item.id}
                                className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${(isHovered || (item.type === "liked" && activeView === "liked")) ? "bg-white/[0.07]" : "bg-transparent"}`}
                                onMouseEnter={() => setHoveredId(item.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => handlePlay(item)}
                                /* ── Click derecho: solo en playlists propias ── */
                                onContextMenu={(e) => handleContextMenu(e, item)}
                            >
                                {/* Thumbnail */}
                                {item.isLiked ? (
                                    <div className="w-12 h-12 rounded flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#450af5] to-[#c4efd9] shadow-lg">
                                        <FaHeart className="text-white" size={20} />
                                    </div>
                                ) : item.type === "userPlaylist" ? (
                                    <div className="relative w-12 h-12 rounded-sm flex-shrink-0 flex items-center justify-center bg-[#282828] shadow overflow-hidden">
                                        {item.img
                                            ? <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                            : <IoMusicalNotesOutline className="text-[#b3b3b3] w-6 h-6" />
                                        }
                                        {isHovered && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                                    <FaPlay size={10} className="text-black ml-0.5" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={`relative w-12 h-12 flex-shrink-0 shadow-lg overflow-hidden ${item.type === "artist" ? "rounded-full" : "rounded"}`}>
                                        {item.img
                                            ? <img src={item.img} alt={item.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
                                            : <div className="w-full h-full bg-[#333] flex items-center justify-center text-[#b3b3b3] text-xl">♪</div>
                                        }
                                        {(isHovered || isPlaying) && item.type !== "liked" && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                                    <FaPlay size={10} className="text-black ml-0.5" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isPlaying ? "text-[#1DB954]" : "text-white"}`}>
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-[#b3b3b3] mt-0.5 truncate">{item.subtitle}</p>
                                </div>
                            </div>
                        );
                    })
                )}

                {!loading && (
                    <div className="px-4 mt-4">
                        <div className="my-6 flex flex-col gap-4">
                            <div className="text-[11px] text-gray-400 flex gap-4 flex-wrap">
                                {["Legal", "Seguridad y Centro de Privacidad", "Política de Privacidad", "Cookies", "Sobre los anuncios", "Accesibilidad"].map(label => (
                                    <span key={label} className="cursor-pointer hover:underline">{label}</span>
                                ))}
                            </div>
                        </div>
                        <div className="mb-6">
                            <button className="flex gap-2 text-white text-sm items-center font-normal py-1 px-3 border border-white rounded-full transition-transform duration-300 hover:scale-103 hover:border-2">
                                <FiGlobe className="text-base" />
                                Español de Latinoamérica
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal CREAR playlist ── */}
            <CreatePlaylistModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onConfirm={async ({ name, description, coverColor, coverImage }) => {
                    const newId = await createPlaylist({ name, description, coverColor, coverImage });
                    if (newId) onViewChange?.("playlist", newId);
                }}
                mode="create"
                userId={user?.uid}
            />

            {/* ── Modal EDITAR playlist ── */}
            <CreatePlaylistModal
                isOpen={editModalOpen}
                onClose={() => { setEditModalOpen(false); setEditingPlaylist(null); }}
                onConfirm={handleEditConfirm}
                initialData={editingPlaylist ? {
                    name:        editingPlaylist.name,
                    description: editingPlaylist.description,
                    coverColor:  editingPlaylist.coverColor,
                    coverImage:  editingPlaylist.coverImage,
                } : null}
                mode="edit"
                playlistId={editingPlaylist?.firestoreId}
                userId={user?.uid}
            />

            {/* ── Menú contextual (click derecho sobre playlist propia) ── */}
            <PlaylistContextMenu
                isOpen={ctxMenu.isOpen}
                position={ctxMenu.position}
                playlist={ctxMenu.playlist}
                onClose={closeCtxMenu}
                onEdit={(playlist) => {
                    setEditingPlaylist(playlist);
                    setEditModalOpen(true);
                }}
                onDelete={handleDeletePlaylist}
                onCreate={handleCreatePlaylist}
            />
        </div>
    );
}
