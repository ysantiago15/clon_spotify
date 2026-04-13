
import { useEffect, useState } from "react";
import Biblioteca from "../components/Biblioteca";
import BarraFooter from "../components/BarraFooter";
import SpotifyLibrary from "../components/SpotifyLibrary";
import Contenido from "../components/Contenido";
import Menu from "../components/Menu";
import Player from "../components/Player";
import LikedSongs from "../components/LikedSongs";
import { loginWithSpotify, getToken, needsReauth } from "../config/spotify"; // ✅ CAMBIO: añadir getToken y needsReauth
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const { user } = useAuth();

    // ✅ CAMBIO: verificar y renovar el token de Spotify al montar y cuando cambia el usuario
    // Antes leía localStorage directamente (podía estar vencido → 401 silencioso)
    const [token, setToken] = useState(null);
    useEffect(() => {
        async function initSpotifyToken() {
            if (!user) { setToken(null); return; }
            if (needsReauth()) { setToken(null); return; }
            try {
                const validToken = await getToken(); // renueva si está por vencer
                setToken(validToken);
            } catch {
                // Token expirado y no se pudo renovar → limpiar
                setToken(null);
            }
        }
        initSpotifyToken();
    }, [user]);

    const [searchQuery,  setSearchQuery]  = useState("");
    const [activeView,   setActiveView]   = useState("home");
    const [activePlaylistId, setActivePlaylistId] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [mobileView,   setMobileView]   = useState("home"); // "home" | "search" | "library" | "liked"

    const {
        isReady,
        state,
        deviceId,
        playTrack,
        togglePlay,
        seek,
        setVolume,
        setOnTrackEnd,
    } = useSpotifyPlayer();

    const isPlaying = state ? !state.paused : false;

    // Sin token no redirigimos automáticamente; el usuario puede navegar sin login
    // useEffect(() => {
    //     if (!token) loginWithSpotify();
    // }, []);

    const handleSearch = (q) => {
        setSearchQuery(q);
        if (q) { setActiveView("home"); setMobileView("home"); }
    };

    const handleViewChange = (view, playlistId = null) => {
        // En móvil, "liked" abre la vista de pantalla completa
        if (view === "liked" && window.innerWidth < 768) {
            setMobileView("liked");
            return;
        }
        setActiveView(view);
        setActivePlaylistId(playlistId);
        setSearchQuery("");
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-black">
            <Menu onSearch={handleSearch} mobileView={mobileView} setMobileView={setMobileView} />

            <div className={`flex flex-1 p-2 gap-2 overflow-hidden ${token && currentTrack ? "pb-[130px]" : ""} md:pb-0`}>
                {token
                    ? <div className="hidden md:flex">
                          <SpotifyLibrary
                              deviceId={deviceId}
                              isReady={isReady}
                              onTrackSelect={setCurrentTrack}
                              onViewChange={handleViewChange}
                              activeView={activeView}
                              activePlaylistId={activePlaylistId}
                          />
                      </div>
                    : <div className="hidden md:block"><Biblioteca /></div>
                }

                {/* Móvil: biblioteca a pantalla completa */}
                {mobileView === "library" && token && (
                    <div className="md:hidden flex flex-col flex-1 overflow-hidden">
                        <SpotifyLibrary
                            deviceId={deviceId}
                            isReady={isReady}
                            onTrackSelect={(t) => { setCurrentTrack(t); setMobileView("home"); }}
                            onViewChange={(v, id) => { handleViewChange(v, id); }}
                            activeView={activeView}
                            activePlaylistId={activePlaylistId}
                        />
                    </div>
                )}

                {/* Móvil: LikedSongs a pantalla completa */}
                {mobileView === "liked" && token && (
                    <div className="md:hidden flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0">
                            <button
                                onClick={() => setMobileView("library")}
                                className="text-white p-1 hover:text-[#B3B3B3] transition-colors"
                            >
                                ←
                            </button>
                        </div>
                        <LikedSongs
                            onTrackSelect={(t) => { setCurrentTrack(t); }}
                            playTrack={playTrack}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            togglePlay={togglePlay}
                        />
                    </div>
                )}

                {/* Contenido principal — oculto en móvil cuando hay otra vista activa */}
                <div className={`flex-1 overflow-hidden ${mobileView !== "home" ? "hidden md:flex" : "flex"} flex-col`}>
                <Contenido
                    searchQuery={searchQuery}
                    activeView={activeView}
                    activePlaylistId={activePlaylistId}
                    isLoggedIn={!!token}
                    onTrackSelect={setCurrentTrack}
                    playTrack={playTrack}
                    togglePlay={togglePlay}
                    isReady={isReady}
                    deviceId={deviceId}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                />
                </div>
            </div>

            {/* BarraFooter solo cuando NO hay sesión */}
            {!token && <div className="hidden md:block"><BarraFooter /></div>}

            {/* Player solo cuando HAY sesión y canción seleccionada */}
            {token && currentTrack && (
                <Player
                    track={currentTrack}
                    isReady={isReady}
                    state={state}
                    playTrack={playTrack}
                    togglePlay={togglePlay}
                    seek={seek}
                    setVolume={setVolume}
                    onTrackSelect={setCurrentTrack}
                    activeView={activeView}
                    setOnTrackEnd={setOnTrackEnd}
                />
            )}
        </div>
    );
}
