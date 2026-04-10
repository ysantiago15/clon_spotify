import { getToken } from './spotify';

// ===============================
// 💿 REPRODUCIR ÁLBUM COMPLETO (en orden)
// ===============================
export async function playAlbum(deviceId, trackUris) {
    // ✅ CAMBIO: usa getToken() para obtener siempre un token válido y renovado
    let token;
    try { token = await getToken(); } catch { console.error("Sin token"); return; }
    if (!trackUris?.length) { console.error("Sin URIs de tracks"); return; }

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
                method: "PUT",
                headers: {
                    Authorization:  `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                // uris[] reproduce la lista en orden exacto desde la primera canción
                body: JSON.stringify({ uris: trackUris, offset: { position: 0 } }),
            }
        );

        if (response.status === 204) {
            console.log("✅ Reproduciendo álbum:", trackUris.length, "tracks");
        } else {
            const err = await response.json().catch(() => ({}));
            console.error("❌ Error Spotify (playAlbum):", err);
        }
    } catch (error) {
        console.error("❌ Error en playAlbum:", error);
    }
}

export async function playTrack(deviceId, trackUri) {
    // ✅ CAMBIO: usa getToken() para obtener siempre un token válido y renovado
    let token;
    try { token = await getToken(); } catch { console.error("Sin token"); return; }

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
                method: "PUT",
                headers: {
                    Authorization:  `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ uris: [trackUri] }),
            }
        );

        if (response.status === 204) {
            console.log("✅ Reproduciendo:", trackUri);
        } else {
            const err = await response.json().catch(() => ({}));
            console.error("❌ Error Spotify:", err);
        }
    } catch (error) {
        console.error("❌ Error en playTrack:", error);
    }
}
