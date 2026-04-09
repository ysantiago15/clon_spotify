// src/components/Contenido.jsx
import { FaFacebook, FaInstagram, FaPlay, FaTwitter } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import SpotifyModal from "./SpotifyModal";
import ArtistSearch from "./ArtistSearch";
import LikedSongs from "./LikedSongs";
import { getAlbumTracks } from "../config/spotify";
import { playAlbum } from "../config/spotifyPlayback";

// ── Credenciales Spotify ──────────────────────────────────────────────────────
// CLIENT_SECRET aquí es seguro para un proyecto personal: solo permite
// búsquedas de solo lectura (Client Credentials), nunca accede a datos del usuario.
const CLIENT_ID     = 'd1469fd9081a43869a64fdbfda7b80f1';
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET ?? (() => {
  // fallback: lee desde localStorage si el usuario lo guardó manualmente
  return localStorage.getItem('spotify_client_secret') || '';
})();

let publicTokenCache  = null;
let publicTokenExpiry = 0;

async function getPublicToken() {
  if (publicTokenCache && Date.now() < publicTokenExpiry) return publicTokenCache;

  if (!CLIENT_SECRET) {
    console.error(
      '[Spotify] Falta el CLIENT_SECRET.\n' +
      'Añade VITE_SPOTIFY_CLIENT_SECRET=<tu_secret> en tu archivo .env y reinicia el servidor.'
    );
    return null;
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      },
      body: "grant_type=client_credentials",
    });
    const data = await res.json();
    if (!data.access_token) return null;
    publicTokenCache  = data.access_token;
    publicTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return publicTokenCache;
  } catch (e) {
    console.error("Error obteniendo token público:", e);
    return null;
  }
}

async function getAnyToken() {
  return localStorage.getItem("spotify_token") || (await getPublicToken());
}

async function fetchPublic(url) {
  const token = await getAnyToken();
  if (!token) return null;

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error("fetchPublic error:", e);
    return null;
  }
}

// ── Helpers para obtener datos ────────────────────────────────────────────────
async function fetchTopTracks() {
  const queries = ["hits", "reggaeton", "latin pop"];
  const q = encodeURIComponent(queries[Math.floor(Math.random() * queries.length)]);
  const data = await fetchPublic(
    `https://api.spotify.com/v1/search?q=${q}&type=track&limit=10&market=CO`
  );
  return data?.tracks?.items || [];
}

async function fetchFeaturedArtists() {
  const data = await fetchPublic(
    `https://api.spotify.com/v1/search?q=pop&type=artist&limit=10&market=CO`
  );
  return data?.artists?.items || [];
}

async function fetchPopularAlbums() {
  const data = await fetchPublic(
    `https://api.spotify.com/v1/search?q=album&type=album&limit=10&market=CO`
  );
  return data?.albums?.items || [];
}

export default function Contenido({
  searchQuery,
  activeView = "home",
  isLoggedIn = false,
  onTrackSelect,
  playTrack,
  togglePlay,
  isReady,
  deviceId,
  currentTrack,
  isPlaying,
}) {
  const [topTracks, setTopTracks] = useState([]);
  const [artists,   setArtists]   = useState([]);
  const [albums,    setAlbums]    = useState([]);
  const [btnPlay,   setBtnPlay]   = useState(false);
  const [modalData,    setModalData]    = useState(null);
  const [isModalOpen,  setIsModalOpen]  = useState(false);

  const hasFetched = useRef(false);

  const handleOpenModal  = (data) => { setModalData(data); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setModalData(null); };

  // Al hacer click en play de una canción
  const handleTrackPlay = (track) => {
    if (!isLoggedIn) {
      handleOpenModal({
        image: track.album?.images?.[0]?.url || track.image,
        name:  track.name,
      });
      return;
    }
    const trackData = {
      uri:      track.uri,
      name:     track.name,
      subtitle: track.artists?.[0]?.name,
      image:    track.album?.images?.[0]?.url,
    };
    onTrackSelect?.(trackData);
    if (isReady) playTrack(track.uri);
  };

  // Al hacer click en play de un álbum → reproduce en orden si está logueado
  const handleAlbumPlay = async (album) => {
    if (!isLoggedIn) {
      handleOpenModal({
        image:    album.images?.[0]?.url,
        name:     album.name,
        subtitle: album.artists?.[0]?.name,
      });
      return;
    }

    if (!isReady || !deviceId) {
      console.warn("Player no listo todavía");
      return;
    }

    // Obtener canciones del álbum en orden
    const tracks = await getAlbumTracks(album.id);
    if (!tracks.length) return;

    const uris = tracks.map(t => t.uri);

    // Actualizar info de la primera canción en el reproductor de la UI
    onTrackSelect?.({
      uri:      tracks[0].uri,
      name:     tracks[0].name,
      subtitle: tracks[0].artists?.[0]?.name,
      image:    album.images?.[0]?.url,
    });

    // Reproducir todas las canciones en orden desde la primera
    await playAlbum(deviceId, uris);
  };

  // Al hacer click en play de un artista sin login → modal
  const handleItemPlay = (image, name, subtitle) => {
    if (!isLoggedIn) {
      handleOpenModal({ image, name, subtitle });
      return;
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchTopTracks().then(setTopTracks).catch(console.error);
    fetchFeaturedArtists().then(setArtists).catch(console.error);
    fetchPopularAlbums().then(setAlbums).catch(console.error);
  }, []);

  // ── Vista "Canciones que te gustan" ──────────────────────────────────────────
  if (activeView === "liked") {
    return (
      <div className="bg-[#121212] w-full h-136 rounded-lg overflow-hidden">
        <LikedSongs
          onTrackSelect={(track) => { onTrackSelect?.(track); }}
          playTrack={playTrack}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
        />
      </div>
    );
  }

  return (
    <div
      className="px-0 md:px-10 pt-2 md:pt-6 bg-[#121212] w-full h-full md:h-136 flex flex-col gap-8 pb-24 md:pb-12 overflow-y-auto overflow-x-hidden spotify-scroll md:rounded-lg"
      onMouseEnter={(e) => e.currentTarget.classList.add("scrollbar-visible")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("scrollbar-visible")}
    >
      {searchQuery ? (
        <ArtistSearch
          query={searchQuery}
          deviceId={deviceId}
          isLoggedIn={isLoggedIn}
          onTrackSelect={(track) => { onTrackSelect?.(track); }}
          onPlay={(uri) => { if (isReady) playTrack(uri); }}
          onOpenModal={handleOpenModal}
        />
      ) : (
        <>
          {/* ── Canciones del momento ──────────────────────────────────── */}
          <div className="w-full">
            <div className="flex justify-between px-3 mb-2">
              <p className="text-2xl text-white font-semibold cursor-pointer">Canciones del momento</p>
              <span className="text-sm font-bold text-[#B3B3B3] cursor-pointer">Mostrar todo</span>
            </div>

            {topTracks.length === 0 ? (
              /* Skeleton mientras carga */
              <div className="flex gap-4 px-1 pb-2 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col gap-2 w-48 shrink-0">
                    <div className="w-full h-40 bg-white/10 rounded-lg" />
                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                    <div className="h-2.5 w-1/2 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative group/carousel w-full">
                <button
                  onClick={() => document.getElementById("carrusel-canciones").scrollBy({ left: -800, behavior: "smooth" })}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 -translate-x-2"
                >{"<"}</button>

                <div id="carrusel-canciones" className="flex overflow-x-auto scroll-smooth px-1 pb-2" style={{ scrollbarWidth: "none" }}>
                  {topTracks.map(track => (
                    <div
                      key={track.id}
                      className="group p-3 flex flex-col gap-1.5 w-48.75 hover:bg-[#191919] rounded-lg transition-all duration-300 cursor-pointer shrink-0"
                      onMouseEnter={() => setBtnPlay(true)}
                      onMouseLeave={() => setBtnPlay(false)}
                    >
                      <div className="w-42.75 h-42.75 relative">
                        <img
                          src={track.album?.images?.[0]?.url}
                          alt={track.name}
                          className="w-full rounded-lg"
                        />
                        {btnPlay && (
                          <div
                            className="w-12 h-12 bg-[#1ED760] rounded-full flex justify-center items-center shadow-xl/30 absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out hover:bg-[#1fdf64] hover:scale-105"
                            onClick={() => handleTrackPlay(track)}
                          >
                            <FaPlay size={18} className="text-black" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-base font-normal text-white truncate">{track.name}</span>
                        <span className="text-sm text-[#B3B3B3] font-normal">{track.artists?.[0]?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => document.getElementById("carrusel-canciones").scrollBy({ left: 800, behavior: "smooth" })}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 translate-x-2"
                >{">"}</button>
              </div>
            )}
          </div>

          {/* ── Artistas populares ─────────────────────────────────────── */}
          <div className="w-full">
            <div className="flex justify-between px-3 mb-4">
              <p className="text-2xl text-white font-semibold cursor-pointer">Artistas populares</p>
              <span className="text-sm font-bold text-[#B3B3B3] cursor-pointer">Mostrar todo</span>
            </div>

            {artists.length === 0 ? (
              <div className="flex gap-4 px-1 pb-2 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col gap-2 w-48 shrink-0">
                    <div className="w-full aspect-square bg-white/10 rounded-full" />
                    <div className="h-3 w-3/4 bg-white/10 rounded mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative group/carousel2 w-full">
                <button
                  onClick={() => document.getElementById("carrusel-artistas").scrollBy({ left: -800, behavior: "smooth" })}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel2:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 -translate-x-2"
                >{"<"}</button>

                <div id="carrusel-artistas" className="flex overflow-x-auto scroll-smooth px-1 pb-2" style={{ scrollbarWidth: "none" }}>
                  {artists.map(artist => (
                    <div
                      key={artist.id}
                      className="group p-3 flex flex-col gap-1.5 w-48.75 hover:bg-[#191919] rounded-lg transition-all duration-300 cursor-pointer shrink-0"
                      onMouseEnter={() => setBtnPlay(true)}
                      onMouseLeave={() => setBtnPlay(false)}
                    >
                      <div className="w-42.75 h-42.75 relative">
                        <img src={artist.images?.[0]?.url} alt={artist.name} className="w-full h-full rounded-full" />
                        {btnPlay && (
                          <div
                            className="w-12 h-12 bg-[#1ED760] rounded-full flex justify-center items-center shadow-xl/30 absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out hover:bg-[#1fdf64] hover:scale-105"
                            onClick={() => handleItemPlay(artist.images?.[0]?.url, artist.name)}
                          >
                            <FaPlay size={18} className="text-black" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-base font-normal text-white">{artist.name}</span>
                        <span className="text-sm text-[#B3B3B3] font-normal cursor-default">Artista</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => document.getElementById("carrusel-artistas").scrollBy({ left: 800, behavior: "smooth" })}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel2:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 translate-x-2"
                >{">"}</button>
              </div>
            )}
          </div>

          {/* ── Álbumes y sencillos ────────────────────────────────────── */}
          <div className="w-full">
            <div className="flex justify-between px-3 mb-3">
              <p className="text-2xl text-white font-semibold cursor-pointer">Álbumes y sencillos populares</p>
              <span className="text-sm font-bold text-[#B3B3B3] cursor-pointer">Mostrar todo</span>
            </div>

            {albums.length === 0 ? (
              <div className="flex gap-4 px-1 pb-2 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col gap-2 w-48 shrink-0">
                    <div className="w-full h-40 bg-white/10 rounded-lg" />
                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                    <div className="h-2.5 w-1/2 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative group/carousel3 w-full">
                <button
                  onClick={() => document.getElementById("carrusel-albums").scrollBy({ left: -800, behavior: "smooth" })}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel3:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 -translate-x-2"
                >{"<"}</button>

                <div id="carrusel-albums" className="flex overflow-x-auto scroll-smooth px-1 pb-2" style={{ scrollbarWidth: "none" }}>
                  {albums.map(album => (
                    <div
                      key={album.id}
                      className="group p-3 flex flex-col gap-1.5 w-48.75 hover:bg-[#191919] rounded-lg transition-all duration-300 cursor-pointer shrink-0"
                      onMouseEnter={() => setBtnPlay(true)}
                      onMouseLeave={() => setBtnPlay(false)}
                    >
                      <div className="w-42.75 h-42.75 relative">
                        <img src={album.images?.[0]?.url} alt={album.name} className="w-full rounded-lg" />
                        {btnPlay && (
                          <div
                            className="w-12 h-12 bg-[#1ED760] rounded-full flex justify-center items-center shadow-xl/30 absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out hover:bg-[#1fdf64] hover:scale-105"
                            onClick={() => handleAlbumPlay(album)}
                          >
                            <FaPlay size={18} className="text-black" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-base font-normal text-white truncate">{album.name}</span>
                        <span className="text-sm text-[#B3B3B3] font-normal">{album.artists?.[0]?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => document.getElementById("carrusel-albums").scrollBy({ left: 800, behavior: "smooth" })}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white opacity-0 group-hover/carousel3:opacity-100 transition-opacity duration-200 hover:bg-[#3a3a3a] hover:scale-105 translate-x-2"
                >{">"}</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <hr className="text-[#808080] text-[0.8px] mx-4 md:mx-0" />

      {/* Móvil: columna apilada — Desktop: fila horizontal */}
      <div className="pb-10 mt-8 px-4 md:px-0 flex flex-col md:flex-row md:justify-between gap-8 md:gap-0">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <ul className="flex flex-col text-[#B3B3B3] text-base gap-2 font-normal">
            <span className="text-white font-semibold">Compañía</span>
            <a href="">Acerca de</a><a href="">Empleo</a><a href="">For the Record</a>
          </ul>
          <ul className="flex flex-col text-[#B3B3B3] text-base gap-2 font-normal">
            <span className="text-white font-semibold">Comunidades</span>
            <a href="">Para artistas</a><a href="">Desarrolladores</a>
            <a href="">Publicidad</a><a href="">Inversionistas</a><a href="">Proveedores</a>
          </ul>
          <ul className="flex flex-col text-[#B3B3B3] text-base gap-2 font-normal">
            <span className="text-white font-semibold">Enlaces útiles</span>
            <a href="">Ayuda</a><a href="">App móvil gratis</a>
            <a href="">Contenido popular por país</a><a href="">Importar tu música</a>
          </ul>
          <ul className="flex flex-col text-[#B3B3B3] text-base gap-2 font-normal">
            <span className="text-white font-semibold">Planes de Spotify</span>
            <a href="">Premium Individual</a><a href="">Premium Duo</a>
            <a href="">Premium Familiar</a><a href="">Premium para Estudiantes</a>
            <a href="">Versión gratuita</a>
          </ul>
        </div>
        {/* Redes sociales */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-[#292929] flex items-center justify-center text-white"><FaInstagram size={18} /></div>
          <div className="w-10 h-10 rounded-full bg-[#292929] flex items-center justify-center text-white"><FaTwitter size={18} /></div>
          <div className="w-10 h-10 rounded-full bg-[#292929] flex items-center justify-center text-white"><FaFacebook size={18} /></div>
        </div>
      </div>

      <hr className="text-[#808080] text-[0.8px] mx-4 md:mx-0" />
      <div className="py-3 px-4 md:px-0">
        <span className="text-[#7C7C7C] text-sm font-semibold">© 2026 Spotify AB</span>
      </div>

      <SpotifyModal isOpen={isModalOpen} onClose={handleCloseModal} data={modalData} />
    </div>
  );
}
