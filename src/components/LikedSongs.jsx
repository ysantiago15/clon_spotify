
import { useState } from "react";
import { FaPlay, FaPause, FaShuffle, FaDownload, FaHeart, FaClock } from "react-icons/fa6";
import { useLikedSongs } from "../hooks/useLikedSongs";
import { useAuth } from "../context/AuthContext";

// ─── UTILS ────────────────────────────────────────────────────────────────────
function formatDateAdded(likedAt) {
    // Firestore serverTimestamp llega como objeto Timestamp {seconds, nanoseconds}
    if (!likedAt) return "";
    const seconds = likedAt?.seconds ?? likedAt?._seconds;
    if (!seconds) return "";
    const date     = new Date(seconds * 1000);
    const now      = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0)  return "Hoy";
    if (diffDays === 1)  return "Ayer";
    if (diffDays < 7)   return `Hace ${diffDays} días`;
    if (diffDays < 14)  return "Hace 1 semana";
    if (diffDays < 30)  return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 60)  return "Hace 1 mes";
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? "s" : ""}`;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function LikedSongs({ onTrackSelect, playTrack, currentTrack, isPlaying, togglePlay }) {
    const { likedSongs, toggleLike } = useLikedSongs();
    const { user } = useAuth();
    const [hoveredIdx, setHoveredIdx] = useState(null);

    const userName = user?.displayName || user?.email?.split("@")[0] || "Usuario";
    const photoURL = user?.photoURL;

    const handlePlay = (song) => {
        if (currentTrack?.uri === song.uri) {
            togglePlay?.();
        } else {
            onTrackSelect?.(song);
            playTrack?.(song.uri);
        }
    };

    const handlePlayAll = () => {
        if (likedSongs.length === 0) return;
        onTrackSelect?.(likedSongs[0]);
        playTrack?.(likedSongs[0].uri);
    };

    return (
        <div
            className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden spotify-scroll"
            onMouseEnter={e => e.currentTarget.classList.add("scrollbar-visible")}
            onMouseLeave={e => e.currentTarget.classList.remove("scrollbar-visible")}
        >
            {/* ── HEADER ─────────────────────────────────────────────────────── */}
            <div
                className="relative flex items-end gap-6 px-8 pb-8 pt-16 shrink-0"
                style={{ background: "linear-gradient(180deg, #5038a0 0%, #3b2080 50%, #1e1060 100%)" }}
            >
                {/* Portada */}
                <div
                    className="w-56 h-56 flex-shrink-0 flex items-center justify-center shadow-2xl rounded-md"
                    style={{ background: "linear-gradient(135deg, #450af5 0%, #8e8ee5 50%, #c4efd9 100%)" }}
                >
                    <FaHeart size={80} className="text-white drop-shadow-xl" />
                </div>

                {/* Info */}
                <div className="flex flex-col gap-3 pb-2 text-white min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                        Lista
                    </span>
                    <h1
                        className="font-black leading-none tracking-tight"
                        style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
                    >
                        Tus me gusta
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        {photoURL ? (
                            <img src={photoURL} alt={userName} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-[#1DB954] flex items-center justify-center text-black text-xs font-black">
                                {userName[0]?.toUpperCase()}
                            </div>
                        )}
                        <span className="text-sm font-semibold">{userName}</span>
                        <span className="text-sm text-white/70">
                            • {likedSongs.length} {likedSongs.length === 1 ? "canción" : "canciones"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── CONTROLES ──────────────────────────────────────────────────── */}
            <div
                className="px-8 py-6 flex items-center gap-5 flex-shrink-0"
                style={{ background: "linear-gradient(180deg, #1e1060 0%, #121212 80%)" }}
            >
                <button
                    onClick={handlePlayAll}
                    disabled={likedSongs.length === 0}
                    className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all disabled:opacity-40 disabled:hover:scale-100"
                >
                    <FaPlay size={22} className="text-black ml-1" />
                </button>
                <button className="text-[#B3B3B3] hover:text-white transition-colors hover:scale-105">
                    <FaShuffle size={22} />
                </button>
                <button className="text-[#B3B3B3] hover:text-white transition-colors hover:scale-105">
                    <FaDownload size={20} />
                </button>
                <div className="ml-auto flex items-center gap-1 text-[#B3B3B3] text-sm font-semibold cursor-pointer hover:text-white transition-colors">
                    Lista <span className="text-lg">≡</span>
                </div>
            </div>

            {/* ── TABLA ──────────────────────────────────────────────────────── */}
            <div className="flex-1 bg-[#121212] px-6 pb-24">

                {likedSongs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                        <FaHeart size={56} className="text-white/10" />
                        <p className="text-white text-lg font-bold">Canciones que te gustan</p>
                        <p className="text-[#B3B3B3] text-sm max-w-xs leading-relaxed">
                            Guarda canciones tocando el corazón en el reproductor.
                            Las canciones guardadas aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Cabecera tabla — DESKTOP ── */}
                        <div
                            className="hidden md:grid items-center text-[#B3B3B3] text-xs font-medium uppercase tracking-widest border-b border-white/10 pb-3 mb-2 px-4 sticky top-0 bg-[#121212] z-10"
                            style={{ gridTemplateColumns: "36px 1fr 180px 150px 60px" }}
                        >
                            <span className="text-center">#</span>
                            <span>Título</span>
                            <span>Álbum</span>
                            <span>Fecha en que se añadió</span>
                            <span className="flex justify-end pr-1"><FaClock size={13} /></span>
                        </div>

                        {/* ── Cabecera tabla — MÓVIL ── */}
                        <div
                            className="md:hidden grid items-center text-[#B3B3B3] text-xs font-medium uppercase tracking-widest border-b border-white/10 pb-3 mb-2 px-4 sticky top-0 bg-[#121212] z-10"
                            style={{ gridTemplateColumns: "32px 1fr 44px" }}
                        >
                            <span className="text-center">#</span>
                            <span>Título</span>
                            <span className="flex justify-end pr-1"><FaClock size={13} /></span>
                        </div>

                        {/* Filas */}
                        {likedSongs.map((song, idx) => {
                            const isCurrent    = currentTrack?.uri === song.uri;
                            const isRowPlaying = isCurrent && isPlaying;
                            const isHovered    = hoveredIdx === idx;

                            return (
                                <div key={song.uri || idx}>

                                    {/* ── Fila DESKTOP ── */}
                                    <div
                                        className={`hidden md:grid items-center px-4 py-2 rounded-md cursor-pointer transition-colors ${isHovered ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}
                                        style={{ gridTemplateColumns: "36px 1fr 180px 150px 60px" }}
                                        onMouseEnter={() => setHoveredIdx(idx)}
                                        onMouseLeave={() => setHoveredIdx(null)}
                                        onDoubleClick={() => handlePlay(song)}
                                    >
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
                                        <div className="flex items-center gap-3 min-w-0 pr-4">
                                            {song.image
                                                ? <img src={song.image} alt={song.name} className="w-10 h-10 rounded object-cover flex-shrink-0 shadow-md" />
                                                : <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0"><FaHeart size={14} className="text-[#555]" /></div>
                                            }
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${isCurrent ? "text-[#1DB954]" : "text-white"}`}>{song.name}</p>
                                                <p className="text-xs text-[#B3B3B3] truncate mt-0.5 hover:text-white hover:underline cursor-pointer transition-colors">{song.subtitle}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-[#B3B3B3] truncate pr-6 hover:text-white hover:underline cursor-pointer transition-colors">{song.album || "—"}</span>
                                        <span className="text-xs text-[#B3B3B3]">{formatDateAdded(song.likedAt)}</span>
                                        <div className="flex items-center justify-end pr-1">
                                            <button onClick={e => { e.stopPropagation(); toggleLike(song); }}
                                                className={`transition-all hover:scale-110 active:scale-95 ${isHovered || isCurrent ? "opacity-100" : "opacity-0"}`}>
                                                <FaHeart size={15} className="text-[#1DB954]" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── Fila MÓVIL ── */}
                                    <div
                                        className={`md:hidden grid items-center px-4 py-2 rounded-md cursor-pointer transition-colors active:bg-white/[0.08] ${isCurrent ? "bg-white/[0.04]" : ""}`}
                                        style={{ gridTemplateColumns: "32px 1fr 44px" }}
                                        onClick={() => handlePlay(song)}
                                    >
                                        {/* Índice / barras animadas */}
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

                                        {/* Imagen + Nombre + Artista */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            {song.image
                                                ? <img src={song.image} alt={song.name} className="w-10 h-10 rounded object-cover flex-shrink-0 shadow-md" />
                                                : <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0"><FaHeart size={14} className="text-[#555]" /></div>
                                            }
                                            <div className="min-w-0">
                                                <p className={`text-sm font-semibold truncate leading-tight ${isCurrent ? "text-[#1DB954]" : "text-white"}`}>{song.name}</p>
                                                <p className="text-xs text-[#B3B3B3] truncate mt-0.5 leading-tight">{song.subtitle}</p>
                                            </div>
                                        </div>

                                        {/* Duración */}
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
                    </>
                )}
            </div>

            <style>{`
                @keyframes barBounce {
                    from { transform: scaleY(0.3); }
                    to   { transform: scaleY(1); }
                }
            `}</style>
        </div>
    );
}
