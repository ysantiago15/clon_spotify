// src/pages/Home.jsx
import { useEffect, useState } from "react";
import Biblioteca from "../components/Biblioteca";
import BarraFooter from "../components/BarraFooter";
import SpotifyLibrary from "../components/SpotifyLibrary";
import Contenido from "../components/Contenido";
import Menu from "../components/Menu";
import Player from "../components/Player";
import { loginWithSpotify } from "../config/spotify";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const { user } = useAuth();
    const token = user ? localStorage.getItem("spotify_token") : null;

    const [searchQuery,  setSearchQuery]  = useState("");
    const [activeView,   setActiveView]   = useState("home");
    const [currentTrack, setCurrentTrack] = useState(null);

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
        if (q) setActiveView("home");
    };

    const handleViewChange = (view) => {
        setActiveView(view);
        setSearchQuery("");
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-black">
            <Menu onSearch={handleSearch} />

            <div className="flex flex-1 p-2 gap-2 overflow-hidden">
                {token
                    ? <SpotifyLibrary
                          deviceId={deviceId}
                          isReady={isReady}
                          onTrackSelect={setCurrentTrack}
                          onViewChange={handleViewChange}
                          activeView={activeView}
                      />
                    : <Biblioteca />
                }

                <Contenido
                    searchQuery={searchQuery}
                    activeView={activeView}
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

            {/* BarraFooter solo cuando NO hay sesión */}
            {!token && <BarraFooter />}

            {/* Player solo cuando HAY sesión */}
            {token && (
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
