
import { useEffect, useRef, useState } from "react";
import { getToken } from "../config/spotify"; // ✅ CAMBIO: importar getToken

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
        // ✅ CAMBIO: usar getToken() para obtener un token válido/renovado
        // en vez de leer localStorage directamente (que puede estar vencido)
        async function init() {
            let token;
            try { token = await getToken(); } catch { return; }
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
        }
        init();
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
        // ✅ CAMBIO: usar getToken() para garantizar token válido
        let token;
        try { token = await getToken(); } catch { console.warn("❌ Sin token de Spotify"); return; }
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
