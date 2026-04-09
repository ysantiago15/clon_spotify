// // // // // src/hooks/useSpotifyPlayer.js
// // // // import { useEffect, useRef, useState } from "react";

// // // // export function useSpotifyPlayer() {
// // // //     const [deviceId, setDeviceId] = useState(null);
// // // //     const [isReady, setIsReady]   = useState(false);
// // // //     const [state, setState]       = useState(null);

// // // //     const playerRef        = useRef(null);
// // // //     const deviceIdRef      = useRef(null);
// // // //     const initializedRef   = useRef(false);
// // // //     const onTrackEndRef    = useRef(null);
// // // //     const lastActiveStateRef = useRef(null);

// // // //     // ── Flag anti-disparo múltiple ─────────────────────────────────────────
// // // //     const trackEndFiredRef = useRef(false);   // true mientras el callback ya se disparó
// // // //     const trackEndTimerRef = useRef(null);    // timer para resetear el flag

// // // //     useEffect(() => {
// // // //         const token = localStorage.getItem("spotify_token");
// // // //         if (!token) return;
// // // //         if (initializedRef.current) return;
// // // //         initializedRef.current = true;

// // // //         if (window.Spotify) { initPlayer(token); return; }

// // // //         if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
// // // //             const script = document.createElement("script");
// // // //             script.src   = "https://sdk.scdn.co/spotify-player.js";
// // // //             script.async = true;
// // // //             document.body.appendChild(script);
// // // //         }

// // // //         window.onSpotifyWebPlaybackSDKReady = () => initPlayer(token);
// // // //     }, []);

// // // //     function initPlayer(token) {
// // // //         if (playerRef.current) return;

// // // //         const spotifyPlayer = new window.Spotify.Player({
// // // //             name: "Mi clon de Spotify",
// // // //             getOAuthToken: (cb) => cb(token),
// // // //             volume: 0.7,
// // // //         });

// // // //         spotifyPlayer.addListener("ready", ({ device_id }) => {
// // // //             console.log("✅ Dispositivo listo:", device_id);
// // // //             deviceIdRef.current = device_id;
// // // //             setDeviceId(device_id);
// // // //             setIsReady(true);
// // // //             fetch("https://api.spotify.com/v1/me/player", {
// // // //                 method:  "PUT",
// // // //                 headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
// // // //                 body:    JSON.stringify({ device_ids: [device_id], play: false }),
// // // //             }).catch(console.error);
// // // //         });

// // // //         spotifyPlayer.addListener("not_ready", () => setIsReady(false));
// // // //         spotifyPlayer.addListener("initialization_error", ({ message }) => console.error("Init error:", message));
// // // //         spotifyPlayer.addListener("authentication_error", ({ message }) => console.error("Auth error:", message));
// // // //         spotifyPlayer.addListener("account_error", () => console.error("❌ Necesitas Spotify Premium"));

// // // //         spotifyPlayer.addListener("player_state_changed", (s) => {
// // // //             if (!s) return;
// // // //             setState(s);

// // // //             const prev = lastActiveStateRef.current;

// // // //             const isTrackEnd =
// // // //                 s.paused &&
// // // //                 s.position === 0 &&
// // // //                 prev &&
// // // //                 !prev.paused &&
// // // //                 prev.track_window?.current_track?.uri === s.track_window?.current_track?.uri;

// // // //             if (isTrackEnd && !trackEndFiredRef.current) {
// // // //                 // Marcar como disparado para ignorar eventos duplicados
// // // //                 trackEndFiredRef.current = true;

// // // //                 console.log("🎵 Canción terminada, disparando onTrackEnd");
// // // //                 onTrackEndRef.current?.();

// // // //                 // Resetear el flag después de 2s (tiempo suficiente para que
// // // //                 // el siguiente track empiece y genere nuevos eventos)
// // // //                 clearTimeout(trackEndTimerRef.current);
// // // //                 trackEndTimerRef.current = setTimeout(() => {
// // // //                     trackEndFiredRef.current = false;
// // // //                 }, 2000);
// // // //             }

// // // //             // Guardar el último estado activo (no pausado)
// // // //             if (!s.paused) {
// // // //                 lastActiveStateRef.current = s;
// // // //                 // Si el track cambió (nueva canción), resetear el flag de inmediato
// // // //                 if (prev?.track_window?.current_track?.uri !== s.track_window?.current_track?.uri) {
// // // //                     clearTimeout(trackEndTimerRef.current);
// // // //                     trackEndFiredRef.current = false;
// // // //                     lastActiveStateRef.current = s;
// // // //                 }
// // // //             }
// // // //         });

// // // //         spotifyPlayer.connect();
// // // //         playerRef.current = spotifyPlayer;
// // // //     }

// // // //     // ── Controles ─────────────────────────────────────────────────────────────
// // // //     const playTrack = async (uri) => {
// // // //         const token = localStorage.getItem("spotify_token");
// // // //         const id    = deviceIdRef.current;
// // // //         if (!id) { console.warn("❌ Sin device ID"); return; }
// // // //         try {
// // // //             const res = await fetch(
// // // //                 `https://api.spotify.com/v1/me/player/play?device_id=${id}`,
// // // //                 {
// // // //                     method:  "PUT",
// // // //                     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
// // // //                     body:    JSON.stringify({ uris: [uri] }),
// // // //                 }
// // // //             );
// // // //             if (res.status === 403) alert("❌ Necesitas Spotify Premium.");
// // // //             else if (res.status !== 204) console.error("Error al reproducir:", await res.json());
// // // //         } catch (e) {
// // // //             console.error("Error de red:", e);
// // // //         }
// // // //     };

// // // //     const togglePlay    = ()  => playerRef.current?.togglePlay();
// // // //     const seek          = (ms) => playerRef.current?.seek(ms);
// // // //     const setVolume     = (v)  => playerRef.current?.setVolume(v);
// // // //     const setOnTrackEnd = (fn) => { onTrackEndRef.current = fn; };

// // // //     return {
// // // //         get player() { return playerRef.current; },
// // // //         deviceId,
// // // //         isReady,
// // // //         state,
// // // //         playTrack,
// // // //         togglePlay,
// // // //         seek,
// // // //         setVolume,
// // // //         setOnTrackEnd,
// // // //     };
// // // // }

// // // // src/hooks/useSpotifyPlayer.js
// // // import { useEffect, useRef, useState } from "react";

// // // export function useSpotifyPlayer() {
// // //     const [deviceId, setDeviceId] = useState(null);
// // //     const [isReady, setIsReady]   = useState(false);
// // //     const [state, setState]       = useState(null);

// // //     const playerRef        = useRef(null);
// // //     const deviceIdRef      = useRef(null);
// // //     const initializedRef   = useRef(false);
// // //     const onTrackEndRef    = useRef(null);
// // //     const lastActiveStateRef = useRef(null);

// // //     // ── Flag anti-disparo múltiple ─────────────────────────────────────────
// // //     const trackEndFiredRef = useRef(false);   // true mientras el callback ya se disparó
// // //     const trackEndTimerRef = useRef(null);    // timer para resetear el flag

// // //     useEffect(() => {
// // //         const token = localStorage.getItem("spotify_token");
// // //         if (!token) return;
// // //         if (initializedRef.current) return;
// // //         initializedRef.current = true;

// // //         if (window.Spotify) { initPlayer(token); return; }

// // //         if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
// // //             const script = document.createElement("script");
// // //             script.src   = "https://sdk.scdn.co/spotify-player.js";
// // //             script.async = true;
// // //             document.body.appendChild(script);
// // //         }

// // //         window.onSpotifyWebPlaybackSDKReady = () => initPlayer(token);
// // //     }, []);

// // //     function initPlayer(token) {
// // //         if (playerRef.current) return;

// // //         const spotifyPlayer = new window.Spotify.Player({
// // //             name: "Mi clon de Spotify",
// // //             getOAuthToken: (cb) => cb(token),
// // //             volume: 0.7,
// // //         });

// // //         spotifyPlayer.addListener("ready", ({ device_id }) => {
// // //             console.log("✅ Dispositivo listo:", device_id);
// // //             deviceIdRef.current = device_id;
// // //             setDeviceId(device_id);
// // //             setIsReady(true);
// // //             fetch("https://api.spotify.com/v1/me/player", {
// // //                 method:  "PUT",
// // //                 headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
// // //                 body:    JSON.stringify({ device_ids: [device_id], play: false }),
// // //             }).catch(console.error);
// // //         });

// // //         spotifyPlayer.addListener("not_ready", () => setIsReady(false));
// // //         spotifyPlayer.addListener("initialization_error", ({ message }) => console.error("Init error:", message));
// // //         spotifyPlayer.addListener("authentication_error", ({ message }) => console.error("Auth error:", message));
// // //         spotifyPlayer.addListener("account_error", () => console.error("❌ Necesitas Spotify Premium"));

// // //         spotifyPlayer.addListener("player_state_changed", (s) => {
// // //             if (!s) return;
// // //             setState(s);

// // //             const prev = lastActiveStateRef.current;

// // //             // Resetear el flag cada vez que el track está activamente sonando
// // //             // Esto cubre tanto tracks nuevos como el mismo track en repeat
// // //             if (!s.paused && s.position > 0) {
// // //                 clearTimeout(trackEndTimerRef.current);
// // //                 trackEndFiredRef.current = false;
// // //                 lastActiveStateRef.current = s;
// // //                 return;
// // //             }

// // //             // También actualizar lastActiveState si el track cambia aunque esté en position 0
// // //             if (!s.paused) {
// // //                 lastActiveStateRef.current = s;
// // //                 return;
// // //             }

// // //             // Detectar fin de canción: pausado en position 0 viniendo de un estado activo
// // //             const isTrackEnd =
// // //                 s.paused &&
// // //                 s.position === 0 &&
// // //                 prev &&
// // //                 !prev.paused &&
// // //                 prev.track_window?.current_track?.uri === s.track_window?.current_track?.uri;

// // //             if (isTrackEnd && !trackEndFiredRef.current) {
// // //                 trackEndFiredRef.current = true;
// // //                 console.log("🎵 Canción terminada, disparando onTrackEnd");
// // //                 onTrackEndRef.current?.();
// // //             }
// // //         });

// // //         spotifyPlayer.connect();
// // //         playerRef.current = spotifyPlayer;
// // //     }

// // //     // ── Controles ─────────────────────────────────────────────────────────────
// // //     const playTrack = async (uri) => {
// // //         const token = localStorage.getItem("spotify_token");
// // //         const id    = deviceIdRef.current;
// // //         if (!id) { console.warn("❌ Sin device ID"); return; }
// // //         try {
// // //             const res = await fetch(
// // //                 `https://api.spotify.com/v1/me/player/play?device_id=${id}`,
// // //                 {
// // //                     method:  "PUT",
// // //                     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
// // //                     body:    JSON.stringify({ uris: [uri] }),
// // //                 }
// // //             );
// // //             if (res.status === 403) alert("❌ Necesitas Spotify Premium.");
// // //             else if (res.status !== 204) console.error("Error al reproducir:", await res.json());
// // //         } catch (e) {
// // //             console.error("Error de red:", e);
// // //         }
// // //     };

// // //     const togglePlay    = ()  => playerRef.current?.togglePlay();
// // //     const seek          = (ms) => playerRef.current?.seek(ms);
// // //     const setVolume     = (v)  => playerRef.current?.setVolume(v);
// // //     const setOnTrackEnd = (fn) => { onTrackEndRef.current = fn; };

// // //     return {
// // //         get player() { return playerRef.current; },
// // //         deviceId,
// // //         isReady,
// // //         state,
// // //         playTrack,
// // //         togglePlay,
// // //         seek,
// // //         setVolume,
// // //         setOnTrackEnd,
// // //     };
// // // }

// // // src/hooks/useSpotifyPlayer.js
// // import { useEffect, useRef, useState } from "react";

// // export function useSpotifyPlayer() {
// //     const [deviceId, setDeviceId] = useState(null);
// //     const [isReady, setIsReady]   = useState(false);
// //     const [state, setState]       = useState(null);

// //     const playerRef        = useRef(null);
// //     const deviceIdRef      = useRef(null);
// //     const initializedRef   = useRef(false);
// //     const onTrackEndRef    = useRef(null);
// //     const lastActiveStateRef = useRef(null);

// //     // ── Flag anti-disparo múltiple ─────────────────────────────────────────
// //     const trackEndFiredRef = useRef(false);   // true mientras el callback ya se disparó
// //     const trackEndTimerRef = useRef(null);    // timer para resetear el flag

// //     useEffect(() => {
// //         const token = localStorage.getItem("spotify_token");
// //         if (!token) return;
// //         if (initializedRef.current) return;
// //         initializedRef.current = true;

// //         if (window.Spotify) { initPlayer(token); return; }

// //         if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
// //             const script = document.createElement("script");
// //             script.src   = "https://sdk.scdn.co/spotify-player.js";
// //             script.async = true;
// //             document.body.appendChild(script);
// //         }

// //         window.onSpotifyWebPlaybackSDKReady = () => initPlayer(token);
// //     }, []);

// //     function initPlayer(token) {
// //         if (playerRef.current) return;

// //         const spotifyPlayer = new window.Spotify.Player({
// //             name: "Mi clon de Spotify",
// //             getOAuthToken: (cb) => cb(token),
// //             volume: 0.7,
// //         });

// //         spotifyPlayer.addListener("ready", ({ device_id }) => {
// //             console.log("✅ Dispositivo listo:", device_id);
// //             deviceIdRef.current = device_id;
// //             setDeviceId(device_id);
// //             setIsReady(true);
// //             fetch("https://api.spotify.com/v1/me/player", {
// //                 method:  "PUT",
// //                 headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
// //                 body:    JSON.stringify({ device_ids: [device_id], play: false }),
// //             }).catch(console.error);
// //         });

// //         spotifyPlayer.addListener("not_ready", () => setIsReady(false));
// //         spotifyPlayer.addListener("initialization_error", ({ message }) => console.error("Init error:", message));
// //         spotifyPlayer.addListener("authentication_error", ({ message }) => console.error("Auth error:", message));
// //         spotifyPlayer.addListener("account_error", () => console.error("❌ Necesitas Spotify Premium"));

// //         spotifyPlayer.addListener("player_state_changed", (s) => {
// //             if (!s) return;
// //             setState(s);

// //             const prev = lastActiveStateRef.current;
// //             const currentUri = s.track_window?.current_track?.uri;
// //             const prevUri    = prev?.track_window?.current_track?.uri;

// //             // ── Track cambió (nuevo track sonando) → resetear flag siempre ──
// //             if (currentUri && currentUri !== prevUri) {
// //                 clearTimeout(trackEndTimerRef.current);
// //                 trackEndFiredRef.current = false;
// //             }

// //             // ── Guardar último estado activo ──
// //             if (!s.paused) {
// //                 lastActiveStateRef.current = s;
// //                 return;
// //             }

// //             // ── Detectar fin de canción ──
// //             // Condiciones: pausado, position=0, mismo URI que antes, y venía sonando
// //             const isTrackEnd =
// //                 s.position === 0 &&
// //                 prev &&
// //                 !prev.paused &&
// //                 currentUri === prevUri;

// //             if (isTrackEnd && !trackEndFiredRef.current) {
// //                 trackEndFiredRef.current = true;
// //                 console.log("🎵 Canción terminada:", currentUri);
// //                 onTrackEndRef.current?.();
// //             }
// //         });

// //         spotifyPlayer.connect();
// //         playerRef.current = spotifyPlayer;
// //     }

// //     // ── Controles ─────────────────────────────────────────────────────────────
// //     const playTrack = async (uri) => {
// //         const token = localStorage.getItem("spotify_token");
// //         const id    = deviceIdRef.current;
// //         if (!id) { console.warn("❌ Sin device ID"); return; }
// //         try {
// //             const res = await fetch(
// //                 `https://api.spotify.com/v1/me/player/play?device_id=${id}`,
// //                 {
// //                     method:  "PUT",
// //                     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
// //                     body:    JSON.stringify({ uris: [uri] }),
// //                 }
// //             );
// //             if (res.status === 403) alert("❌ Necesitas Spotify Premium.");
// //             else if (res.status !== 204) console.error("Error al reproducir:", await res.json());
// //         } catch (e) {
// //             console.error("Error de red:", e);
// //         }
// //     };

// //     const togglePlay    = ()  => playerRef.current?.togglePlay();
// //     const seek          = (ms) => playerRef.current?.seek(ms);
// //     const setVolume     = (v)  => playerRef.current?.setVolume(v);
// //     const setOnTrackEnd = (fn) => { onTrackEndRef.current = fn; };

// //     return {
// //         get player() { return playerRef.current; },
// //         deviceId,
// //         isReady,
// //         state,
// //         playTrack,
// //         togglePlay,
// //         seek,
// //         setVolume,
// //         setOnTrackEnd,
// //     };
// // }

// // src/hooks/useSpotifyPlayer.js
// import { useEffect, useRef, useState } from "react";

// export function useSpotifyPlayer() {
//     const [deviceId, setDeviceId] = useState(null);
//     const [isReady, setIsReady]   = useState(false);
//     const [state, setState]       = useState(null);

//     const playerRef        = useRef(null);
//     const deviceIdRef      = useRef(null);
//     const initializedRef   = useRef(false);
//     const onTrackEndRef    = useRef(null);
//     const lastActiveStateRef = useRef(null);

//     // ── Flag anti-disparo múltiple ─────────────────────────────────────────
//     const trackEndFiredRef = useRef(false);   // true mientras el callback ya se disparó
//     const trackEndTimerRef = useRef(null);    // timer para resetear el flag

//     useEffect(() => {
//         const token = localStorage.getItem("spotify_token");
//         if (!token) return;
//         if (initializedRef.current) return;
//         initializedRef.current = true;

//         if (window.Spotify) { initPlayer(token); return; }

//         if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
//             const script = document.createElement("script");
//             script.src   = "https://sdk.scdn.co/spotify-player.js";
//             script.async = true;
//             document.body.appendChild(script);
//         }

//         window.onSpotifyWebPlaybackSDKReady = () => initPlayer(token);
//     }, []);

//     function initPlayer(token) {
//         if (playerRef.current) return;

//         const spotifyPlayer = new window.Spotify.Player({
//             name: "Mi clon de Spotify",
//             getOAuthToken: (cb) => cb(token),
//             volume: 0.7,
//         });

//         spotifyPlayer.addListener("ready", ({ device_id }) => {
//             console.log("✅ Dispositivo listo:", device_id);
//             deviceIdRef.current = device_id;
//             setDeviceId(device_id);
//             setIsReady(true);
//             fetch("https://api.spotify.com/v1/me/player", {
//                 method:  "PUT",
//                 headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//                 body:    JSON.stringify({ device_ids: [device_id], play: false }),
//             }).catch(console.error);
//         });

//         spotifyPlayer.addListener("not_ready", () => setIsReady(false));
//         spotifyPlayer.addListener("initialization_error", ({ message }) => console.error("Init error:", message));
//         spotifyPlayer.addListener("authentication_error", ({ message }) => console.error("Auth error:", message));
//         spotifyPlayer.addListener("account_error", () => console.error("❌ Necesitas Spotify Premium"));

//         spotifyPlayer.addListener("player_state_changed", (s) => {
//             if (!s) return;
//             setState(s);

//             const prev       = lastActiveStateRef.current;
//             const currentUri = s.track_window?.current_track?.uri;
//             const prevUri    = prev?.track_window?.current_track?.uri;

//             console.log("📻 state_changed →", {
//                 paused: s.paused,
//                 position: s.position,
//                 uri: currentUri?.slice(-22),
//                 prevUri: prevUri?.slice(-22),
//                 fired: trackEndFiredRef.current,
//             });

//             // ── Track cambió → resetear flag ──
//             if (currentUri && currentUri !== prevUri) {
//                 clearTimeout(trackEndTimerRef.current);
//                 trackEndFiredRef.current = false;
//                 console.log("🔄 Nuevo track detectado, flag reseteado");
//             }

//             // ── Guardar estado activo ──
//             if (!s.paused) {
//                 lastActiveStateRef.current = s;
//                 return;
//             }

//             // ── Fin de canción ──
//             const isTrackEnd =
//                 s.position === 0 &&
//                 prev &&
//                 !prev.paused &&
//                 currentUri === prevUri;

//             console.log("🔍 isTrackEnd:", isTrackEnd, "| fired:", trackEndFiredRef.current);

//             if (isTrackEnd && !trackEndFiredRef.current) {
//                 trackEndFiredRef.current = true;
//                 console.log("🎵 Disparando onTrackEnd para:", currentUri?.slice(-22));
//                 onTrackEndRef.current?.();
//             }
//         });

//         spotifyPlayer.connect();
//         playerRef.current = spotifyPlayer;
//     }

//     // ── Controles ─────────────────────────────────────────────────────────────
//     const playTrack = async (uri) => {
//         const token = localStorage.getItem("spotify_token");
//         const id    = deviceIdRef.current;
//         if (!id) { console.warn("❌ Sin device ID"); return; }
//         try {
//             const res = await fetch(
//                 `https://api.spotify.com/v1/me/player/play?device_id=${id}`,
//                 {
//                     method:  "PUT",
//                     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//                     body:    JSON.stringify({ uris: [uri] }),
//                 }
//             );
//             if (res.status === 403) alert("❌ Necesitas Spotify Premium.");
//             else if (res.status !== 204) console.error("Error al reproducir:", await res.json());
//         } catch (e) {
//             console.error("Error de red:", e);
//         }
//     };

//     const togglePlay    = ()  => playerRef.current?.togglePlay();
//     const seek          = (ms) => playerRef.current?.seek(ms);
//     const setVolume     = (v)  => playerRef.current?.setVolume(v);
//     const setOnTrackEnd = (fn) => { onTrackEndRef.current = fn; };

//     return {
//         get player() { return playerRef.current; },
//         deviceId,
//         isReady,
//         state,
//         playTrack,
//         togglePlay,
//         seek,
//         setVolume,
//         setOnTrackEnd,
//     };
// }

// src/hooks/useSpotifyPlayer.js
import { useEffect, useRef, useState } from "react";

export function useSpotifyPlayer() {
    const [deviceId, setDeviceId] = useState(null);
    const [isReady, setIsReady]   = useState(false);
    const [state, setState]       = useState(null);

    const playerRef        = useRef(null);
    const deviceIdRef      = useRef(null);
    const initializedRef   = useRef(false);
    const onTrackEndRef    = useRef(null);
    const lastActiveStateRef = useRef(null);

    // ── Flag anti-disparo múltiple ─────────────────────────────────────────
    const trackEndFiredRef = useRef(false);   // true mientras el callback ya se disparó
    const trackEndTimerRef = useRef(null);    // timer para resetear el flag

    useEffect(() => {
        const token = localStorage.getItem("spotify_token");
        if (!token) return;
        if (initializedRef.current) return;
        initializedRef.current = true;

        if (window.Spotify) { initPlayer(token); return; }

        if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
            const script = document.createElement("script");
            script.src   = "https://sdk.scdn.co/spotify-player.js";
            script.async = true;
            document.body.appendChild(script);
        }

        window.onSpotifyWebPlaybackSDKReady = () => initPlayer(token);
    }, []);

    function initPlayer(token) {
        if (playerRef.current) return;

        const spotifyPlayer = new window.Spotify.Player({
            name: "Mi clon de Spotify",
            getOAuthToken: (cb) => cb(token),
            volume: 0.7,
        });

        spotifyPlayer.addListener("ready", ({ device_id }) => {
            console.log("✅ Dispositivo listo:", device_id);
            deviceIdRef.current = device_id;
            setDeviceId(device_id);
            setIsReady(true);
            fetch("https://api.spotify.com/v1/me/player", {
                method:  "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body:    JSON.stringify({ device_ids: [device_id], play: false }),
            }).catch(console.error);
        });

        spotifyPlayer.addListener("not_ready", () => setIsReady(false));
        spotifyPlayer.addListener("initialization_error", ({ message }) => console.error("Init error:", message));
        spotifyPlayer.addListener("authentication_error", ({ message }) => console.error("Auth error:", message));
        spotifyPlayer.addListener("account_error", () => console.error("❌ Necesitas Spotify Premium"));

        spotifyPlayer.addListener("player_state_changed", (s) => {
            if (!s) return;
            setState(s);

            const prev       = lastActiveStateRef.current;
            const currentUri = s.track_window?.current_track?.uri;
            const prevUri    = prev?.track_window?.current_track?.uri;

            // ── Track cambió → resetear flag ──
            if (currentUri && currentUri !== prevUri) {
                clearTimeout(trackEndTimerRef.current);
                trackEndFiredRef.current = false;
            }

            // ── Fin de canción ──
            // El SDK emite paused:false, position:0 cuando la canción termina
            // (luego vuelve a empezar sola si no lo interceptamos)
            // Detectamos: position:0 + mismo URI + el estado anterior tenía position > 0
            const prevPosition = prev?.position ?? -1;
            const isTrackEnd =
                s.position === 0 &&
                currentUri === prevUri &&
                prevPosition > 1000; // asegura que venía sonando, no que acaba de empezar

            if (isTrackEnd && !trackEndFiredRef.current) {
                trackEndFiredRef.current = true;
                console.log("🎵 Canción terminada, disparando onTrackEnd");
                onTrackEndRef.current?.();
                // Resetear flag después de 3s para la siguiente canción
                clearTimeout(trackEndTimerRef.current);
                trackEndTimerRef.current = setTimeout(() => {
                    trackEndFiredRef.current = false;
                }, 3000);
                return;
            }

            // ── Guardar estado activo (solo cuando hay posición real) ──
            if (s.position > 0) {
                lastActiveStateRef.current = s;
            } else if (!prev || currentUri !== prevUri) {
                // Nuevo track comenzando en position 0
                lastActiveStateRef.current = s;
            }
        });

        spotifyPlayer.connect();
        playerRef.current = spotifyPlayer;
    }

    // ── Controles ─────────────────────────────────────────────────────────────
    const playTrack = async (uri) => {
        const token = localStorage.getItem("spotify_token");
        const id    = deviceIdRef.current;
        if (!id) { console.warn("❌ Sin device ID"); return; }
        try {
            const res = await fetch(
                `https://api.spotify.com/v1/me/player/play?device_id=${id}`,
                {
                    method:  "PUT",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body:    JSON.stringify({ uris: [uri] }),
                }
            );
            if (res.status === 403) alert("❌ Necesitas Spotify Premium.");
            else if (res.status !== 204) console.error("Error al reproducir:", await res.json());
        } catch (e) {
            console.error("Error de red:", e);
        }
    };

    const togglePlay    = ()  => playerRef.current?.togglePlay();
    const seek          = (ms) => playerRef.current?.seek(ms);
    const setVolume     = (v)  => playerRef.current?.setVolume(v);
    const setOnTrackEnd = (fn) => { onTrackEndRef.current = fn; };

    return {
        get player() { return playerRef.current; },
        deviceId,
        isReady,
        state,
        playTrack,
        togglePlay,
        seek,
        setVolume,
        setOnTrackEnd,
    };
}
