
import { useEffect, useRef, useState } from "react";
import {
    FaPlay, FaPause, FaShuffle, FaBackwardStep,
    FaForwardStep, FaRepeat, FaVolumeHigh, FaVolumeLow,
    FaVolumeXmark, FaHeart, FaRegHeart
} from "react-icons/fa6";
import { BsMusicNoteList } from "react-icons/bs";
import { MdOutlineDevices } from "react-icons/md";
import { TbArrowsDiagonal } from "react-icons/tb";
import { useLikedSongs } from "../hooks/useLikedSongs";
import { getToken } from "../config/spotify";

function formatTime(ms) {
    if (!ms || isNaN(ms)) return "0:00";
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

async function fetchArtistTracks(artistName, excludeUri) {
    if (!artistName) return [];
    try {
        // Usar getToken() para renovar automáticamente si expiró
        const token = await getToken();
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=track&limit=10`;
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            console.error("❌ fetchArtistTracks:", res.status, await res.json().catch(() => ({})));
            return [];
        }
        const data = await res.json();
        return (data.tracks?.items || []).filter(t => t.uri !== excludeUri);
    } catch (e) {
        console.error("❌ fetchArtistTracks excepción:", e);
        return [];
    }
}

export default function Player({
    track,
    isReady,
    state,
    playTrack,
    togglePlay,
    seek,
    setVolume: setVolumeSDK,
    onTrackSelect,
    activeView,
    setOnTrackEnd,   // función del hook para registrar callback de fin de canción
}) {
    const { isLiked, toggleLike, likedSongs } = useLikedSongs();

    const [volume,     setVolumeState] = useState(0.7);
    const [prevVolume, setPrevVolume]  = useState(0.7);
    const [shuffle,    setShuffle]     = useState(false);
    const [repeat,     setRepeat]      = useState("off"); // "off" | "track" | "context"
    const [livePos,    setLivePos]     = useState(0);

    const historyRef           = useRef([]);
    const artistTracksRef      = useRef([]);
    const trackRef             = useRef(null);
    const volumeBarRef         = useRef(null);
    // Flag: el próximo cambio de track viene de "ir atrás" — no guardar en historial
    const comingFromHistoryRef = useRef(false);

    // Refs para que el callback de onTrackEnd siempre tenga valores frescos
    const activeViewRef   = useRef(activeView);
    const likedSongsRef   = useRef(likedSongs);
    const trackUriRef     = useRef(track?.uri);
    const repeatRef       = useRef("off");
    const shuffleRef      = useRef(false);

    useEffect(() => { activeViewRef.current = activeView; }, [activeView]);
    useEffect(() => { likedSongsRef.current = likedSongs; }, [likedSongs]);
    useEffect(() => { trackUriRef.current   = track?.uri; }, [track?.uri]);
    useEffect(() => { repeatRef.current     = repeat;    }, [repeat]);
    useEffect(() => { shuffleRef.current    = shuffle;   }, [shuffle]);

    const isPlaying = state ? !state.paused : false;
    const duration  = state?.duration || 0;
    const progress  = duration ? Math.min((livePos / duration) * 100, 100) : 0;
    const liked     = track ? isLiked(track.uri) : false;

    const VolumeIcon = volume === 0 ? FaVolumeXmark : volume < 0.5 ? FaVolumeLow : FaVolumeHigh;

    // ── Al cambiar de canción: historial + precargar canciones del artista ─────
    useEffect(() => {
        if (!track) return;

        // Guardar historial solo si NO venimos de "ir atrás"
        if (trackRef.current && trackRef.current.uri !== track.uri && !comingFromHistoryRef.current) {
            historyRef.current = [...historyRef.current, trackRef.current].slice(-50);
        }
        comingFromHistoryRef.current = false;
        trackRef.current = track;

        // Precargar canciones del artista para autoplay y botón siguiente
        // subtitle = nombre del artista, artists[0].name = fallback del SDK
        const artistName =
            track.subtitle ||
            track.artists?.[0]?.name ||
            track.artist ||
            "";

        console.log("🎤 Precargando artista:", artistName, "| track:", track);

        if (artistName) {
            fetchArtistTracks(artistName, track.uri).then(tracks => {
                artistTracksRef.current = tracks;
                console.log(`🎵 ${tracks.length} canciones precargadas del artista "${artistName}"`);
            });
        } else {
            console.warn("⚠️ No se pudo determinar el nombre del artista para precargar");
        }
    }, [track?.uri]);

    // ── Registrar el callback de "canción terminada" en el hook ───────────────
    // Se registra UNA SOLA VEZ al montar. Los valores frescos se leen via refs.
    // Refs necesarios para el callback:
    const playTrackRef    = useRef(playTrack);
    const onTrackSelectRef = useRef(onTrackSelect);
    useEffect(() => { playTrackRef.current    = playTrack;    }, [playTrack]);
    useEffect(() => { onTrackSelectRef.current = onTrackSelect; }, [onTrackSelect]);

    useEffect(() => {
        setOnTrackEnd?.(() => {
            const view     = activeViewRef.current;
            const playFn   = playTrackRef.current;
            const selectFn = onTrackSelectRef.current;
            const repeatMode = repeatRef.current;
            const shuffleOn  = shuffleRef.current;

            // ── REPEAT TRACK: misma canción en loop ──────────────────────
            if (repeatMode === "track") {
                playFn?.(trackUriRef.current);
                return;
            }

            // ── LIKED view ───────────────────────────────────────────────
            if (view === "liked") {
                const songs      = likedSongsRef.current;
                const currentUri = trackUriRef.current;
                const idx     = songs.findIndex(s => s.uri === currentUri);
                const nextIdx = idx + 1 < songs.length
                    ? idx + 1
                    : (repeatMode === "context" ? 0 : -1);
                if (nextIdx === -1) return;
                const next = songs[nextIdx];
                const obj  = { uri: next.uri, name: next.name, subtitle: next.subtitle, image: next.image, album: next.album };
                selectFn?.(obj);
                playFn?.(next.uri);

            // ── HOME view ────────────────────────────────────────────────
            } else {
                const tracks = artistTracksRef.current;
                if (!tracks.length) return;

                let next;
                // shuffle O repeat off: siempre aleatorio distinto al actual
                if (shuffleOn || repeatMode === "off") {
                    const pool = tracks.filter(t => t.uri !== trackUriRef.current);
                    next = pool.length ? pool[Math.floor(Math.random() * pool.length)] : tracks[0];
                } else {
                    // repeat context: siguiente en orden, vuelve al inicio al terminar
                    const idx     = tracks.findIndex(t => t.uri === trackUriRef.current);
                    const nextIdx = idx !== -1 && idx + 1 < tracks.length ? idx + 1 : 0;
                    next = tracks[nextIdx];
                }

                const obj = {
                    uri:      next.uri,
                    name:     next.name,
                    subtitle: next.artists?.[0]?.name,
                    image:    next.album?.images?.[0]?.url,
                    album:    next.album?.name || "",
                };
                selectFn?.(obj);
                playFn?.(next.uri);
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // [] = solo al montar, los valores frescos vienen de los refs

    // ── Barra de progreso en tiempo real ──────────────────────────────────────
    useEffect(() => {
        setLivePos(state?.position || 0);
        if (!state || state.paused) return;
        const id = setInterval(() => setLivePos(p => Math.min(p + 500, duration)), 500);
        return () => clearInterval(id);
    }, [state?.paused, state?.position, duration]);

    // ── Navegación ────────────────────────────────────────────────────────────
    const playNextArtistTrack = () => {
        const tracks = artistTracksRef.current;
        if (!tracks.length || !playTrack) return;
        const next = tracks[Math.floor(Math.random() * tracks.length)];
        const obj = {
            uri:      next.uri,
            name:     next.name,
            subtitle: next.artists?.[0]?.name,
            image:    next.album?.images?.[0]?.url,
            album:    next.album?.name || "",
        };
        onTrackSelect?.(obj);
        playTrack(next.uri);
    };

    const playNextLikedSong = () => {
        const songs = likedSongs;
        if (!songs.length || !playTrack) return;
        const idx  = songs.findIndex(s => s.uri === track?.uri);
        const next = songs[idx + 1];
        if (!next) return;
        const obj = { uri: next.uri, name: next.name, subtitle: next.subtitle, image: next.image, album: next.album };
        onTrackSelect?.(obj);
        playTrack(next.uri);
    };

    const playPrevLikedSong = () => {
        const songs = likedSongs;
        const idx  = songs.findIndex(s => s.uri === track?.uri);
        const prev = songs[idx - 1];
        if (!prev) { seek?.(0); setLivePos(0); return; }
        const obj = { uri: prev.uri, name: prev.name, subtitle: prev.subtitle, image: prev.image, album: prev.album };
        onTrackSelect?.(obj);
        playTrack?.(prev.uri);
    };

    const handleNext = () => {
        if (activeView === "liked") playNextLikedSong();
        else playNextArtistTrack();
    };

    const handlePrev = () => {
        if (livePos > 3000) { seek?.(0); setLivePos(0); return; }
        if (activeView === "liked") { playPrevLikedSong(); return; }
        const history = historyRef.current;
        if (history.length > 0 && playTrack) {
            const prev = history[history.length - 1];
            historyRef.current = history.slice(0, -1);
            // Marcar que el próximo cambio de track viene del historial
            // para que el useEffect no lo vuelva a guardar
            comingFromHistoryRef.current = true;
            onTrackSelect?.(prev);
            playTrack(prev.uri);
        } else {
            seek?.(0);
            setLivePos(0);
        }
    };

    // ── Controles ─────────────────────────────────────────────────────────────
    const handleShuffle = () => {
        setShuffle(prev => !prev);
    };

    const handleRepeat = () => {
        setRepeat(prev => {
            if (prev === "off")   return "context"; // primer click: repite lista
            if (prev === "context") return "track"; // segundo click: repite canción
            return "off";                            // tercer click: apaga
        });
    };

    const handleSeekClick = (e) => {
        if (!duration) return;
        const rect  = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const ms    = ratio * duration;
        setLivePos(ms);
        seek?.(ms);
    };

    const applyVolume = (v) => {
        setVolumeState(v);
        setVolumeSDK?.(v);
    };

    const handleVolumeClick = (e) => {
        const rect  = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        applyVolume(ratio);
    };

    const handleVolumeMouseDown = (e) => {
        e.preventDefault();
        const move = (ev) => {
            const rect = volumeBarRef.current?.getBoundingClientRect();
            if (!rect) return;
            applyVolume(Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)));
        };
        const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        handleVolumeClick(e);
    };

    const toggleMute = () => {
        if (volume > 0) { setPrevVolume(volume); applyVolume(0); }
        else applyVolume(prevVolume || 0.7);
    };

    if (!track) return null;

    const albumName = typeof track.album === "string" && track.album.trim()
        ? track.album
        : track.album?.name || "";

    return (
        <>
            {/* ══════════════════════════════════════════════
                MÓVIL: mini-player pegado encima del nav bar
                z-[105] → encima del nav (z-[100]) pero debajo del drawer (z-[200])
            ══════════════════════════════════════════════ */}
            <div
                className="md:hidden fixed left-2 right-2 z-[105] select-none"
                style={{ bottom: "calc(60px + env(safe-area-inset-bottom, 0px) + 6px)" }}
            >
                {/* Card */}
                <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
                    {/* Fila principal */}
                    <div className="px-3 py-2 flex items-center gap-3">
                        {/* Imagen */}
                        <img
                            src={track.image || track.album?.images?.[0]?.url}
                            alt={track.name}
                            className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-md"
                        />

                        {/* Nombre + artista */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate leading-tight">{track.name}</p>
                            <p className="text-[#B3B3B3] text-xs truncate leading-tight mt-0.5">
                                {track.subtitle || track.artists?.[0]?.name}
                            </p>
                        </div>

                        {/* Corazón */}
                        <button
                            onClick={() => toggleLike(track)}
                            className="flex-shrink-0 p-1.5 active:scale-90 transition-transform"
                            title={liked ? "Quitar de Me gusta" : "Agregar a Me gusta"}
                        >
                            {liked
                                ? <FaHeart className="text-[#1DB954]" size={20} />
                                : <FaRegHeart className="text-[#B3B3B3]" size={20} />
                            }
                        </button>

                        {/* Play / Pause */}
                        <button
                            onClick={togglePlay}
                            className="flex-shrink-0 p-1.5 active:scale-90 transition-transform"
                            title={isPlaying ? "Pausar" : "Reproducir"}
                        >
                            {isPlaying
                                ? <FaPause className="text-white" size={22} />
                                : <FaPlay  className="text-white ml-0.5" size={22} />
                            }
                        </button>
                    </div>

                    {/* Barra de progreso — pegada al fondo del card, interactiva */}
                    <div
                        className="relative w-full h-[3px] bg-white/20 cursor-pointer"
                        onClick={(e) => {
                            if (!duration) return;
                            const rect  = e.currentTarget.getBoundingClientRect();
                            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                            const ms    = ratio * duration;
                            setLivePos(ms);
                            seek?.(ms);
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const rect  = e.currentTarget.getBoundingClientRect();
                            const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                            setLivePos(ratio * duration);
                            seek?.(ratio * duration);
                        }}
                        onTouchMove={(e) => {
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const rect  = e.currentTarget.getBoundingClientRect();
                            const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                            setLivePos(ratio * duration);
                        }}
                        onTouchEnd={(e) => {
                            e.stopPropagation();
                            const touch = e.changedTouches[0];
                            const rect  = e.currentTarget.getBoundingClientRect();
                            const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                            seek?.(ratio * duration);
                        }}
                    >
                        <div
                            className="h-full bg-white pointer-events-none"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                DESKTOP: player completo igual que antes
            ══════════════════════════════════════════════ */}
            <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/5 px-4 py-3 items-center justify-between gap-4 select-none">

                {/* ── IZQUIERDA ── */}
                <div className="flex items-center gap-3 w-72 min-w-0">
                    <img
                        src={track.image || track.album?.images?.[0]?.url}
                        alt={track.name}
                        className="w-14 h-14 rounded-md object-cover flex-shrink-0 shadow-lg"
                    />
                    <div className="min-w-0 flex flex-col gap-0.5">
                        <p className="text-white text-sm font-semibold truncate">{track.name}</p>
                        <p className="text-[#B3B3B3] text-xs truncate">
                            {track.subtitle || track.artists?.[0]?.name}
                            {albumName && (
                                <span> &bull; <span className="hover:text-white hover:underline cursor-pointer transition-colors">{albumName}</span></span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={() => toggleLike(track)}
                        className="ml-1 flex-shrink-0 transition-transform hover:scale-110"
                        title={liked ? "Quitar de Me gusta" : "Agregar a Me gusta"}
                    >
                        {liked
                            ? <FaHeart className="text-[#1DB954]" size={16} />
                            : <FaRegHeart className="text-[#B3B3B3] hover:text-white transition-colors" size={16} />
                        }
                    </button>
                </div>

                {/* ── CENTRO ── */}
                <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
                    <div className="flex items-center gap-5">
                        <button onClick={handleShuffle} title="Aleatorio"
                            className={`transition-colors ${shuffle ? "text-[#1DB954]" : "text-[#B3B3B3] hover:text-white"}`}>
                            <FaShuffle size={16} />
                        </button>
                        <button onClick={handlePrev} title="Anterior"
                            className="text-[#B3B3B3] hover:text-white transition-colors">
                            <FaBackwardStep size={20} />
                        </button>
                        <button onClick={togglePlay} title={isPlaying ? "Pausar" : "Reproducir"}
                            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg">
                            {isPlaying
                                ? <FaPause size={16} className="text-black" />
                                : <FaPlay  size={16} className="text-black ml-0.5" />
                            }
                        </button>
                        <button onClick={handleNext} title="Siguiente"
                            className="text-[#B3B3B3] hover:text-white transition-colors">
                            <FaForwardStep size={20} />
                        </button>
                        <button
                            onClick={handleRepeat}
                            title={repeat === "off" ? "Activar repetición" : repeat === "context" ? "Repetir canción" : "Desactivar repetición"}
                            className={`transition-colors relative ${repeat !== "off" ? "text-[#1DB954]" : "text-[#B3B3B3] hover:text-white"}`}
                        >
                            <FaRepeat size={16} />
                            {repeat !== "off" && (
                                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1DB954]" />
                            )}
                            {repeat === "track" && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#1DB954] leading-none">1</span>
                            )}
                        </button>
                    </div>

                    {/* Barra de progreso */}
                    <div className="flex items-center gap-2 w-full">
                        <span className="text-[#B3B3B3] text-xs w-8 text-right tabular-nums">{formatTime(livePos)}</span>
                        <div
                            className="relative flex-1 h-1 bg-[#4D4D4D] rounded-full cursor-pointer group"
                            onClick={handleSeekClick}
                        >
                            <div
                                className="h-full bg-white group-hover:bg-[#1DB954] rounded-full transition-colors relative pointer-events-none"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                            </div>
                        </div>
                        <span className="text-[#B3B3B3] text-xs w-8 tabular-nums">{formatTime(duration)}</span>
                    </div>

                    {!isReady && (
                        <p className="text-yellow-400 text-xs">⚠️ Conectando... (requiere Spotify Premium)</p>
                    )}
                </div>

                {/* ── DERECHA ── */}
                <div className="flex items-center gap-3 w-72 justify-end">
                    <button className="text-[#B3B3B3] hover:text-white transition-colors" title="Cola">
                        <BsMusicNoteList size={16} />
                    </button>
                    <button className="text-[#B3B3B3] hover:text-white transition-colors" title="Dispositivos">
                        <MdOutlineDevices size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleMute} title={volume === 0 ? "Activar" : "Silenciar"}
                            className="text-[#B3B3B3] hover:text-white transition-colors">
                            <VolumeIcon size={16} />
                        </button>
                        <div
                            ref={volumeBarRef}
                            className="relative w-24 h-1 bg-[#4D4D4D] rounded-full cursor-pointer group"
                            onClick={handleVolumeClick}
                            onMouseDown={handleVolumeMouseDown}
                        >
                            <div
                                className="h-full bg-white group-hover:bg-[#1DB954] rounded-full transition-colors relative pointer-events-none"
                                style={{ width: `${volume * 100}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                            </div>
                        </div>
                    </div>
                    <button className="text-[#B3B3B3] hover:text-white transition-colors" title="Pantalla completa">
                        <TbArrowsDiagonal size={16} />
                    </button>
                </div>
            </div>
        </>
    );
}
