// src/hooks/useLikedSongs.js
// ─────────────────────────────────────────────────────────────────────────────
// Maneja los "Me gusta" del usuario en Firestore.
// Colección: users/{uid}/likedSongs/{trackId}
//
// Uso:
//   const { likedSongs, isLiked, toggleLike } = useLikedSongs();
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { useAuth } from "../context/AuthContext";

export function useLikedSongs() {
    const { user } = useAuth();
    const [likedSongs, setLikedSongs] = useState([]); // array de objetos track

    // Escucha en tiempo real las canciones guardadas del usuario
    useEffect(() => {
        if (!user) {
            setLikedSongs([]);
            return;
        }

        const colRef = collection(db, "users", user.uid, "likedSongs");

        const unsub = onSnapshot(colRef, (snap) => {
            const songs = snap.docs.map(d => d.data());
            // Ordenar por fecha de like (más reciente primero)
            songs.sort((a, b) => (b.likedAt?.seconds || 0) - (a.likedAt?.seconds || 0));
            setLikedSongs(songs);
        });

        return () => unsub();
    }, [user]);

    // Saber si una canción ya está en me gusta (por URI)
    const isLiked = (uri) => likedSongs.some(s => s.uri === uri);

    // Agregar o quitar de me gusta
    const toggleLike = async (track) => {
        if (!user || !track?.uri) return;

        // Usamos el ID de Spotify como ID del documento (extraído del URI)
        // URI formato: "spotify:track:XXXXXXXX"
        const trackId = track.uri.split(":").pop();
        const docRef  = doc(db, "users", user.uid, "likedSongs", trackId);

        if (isLiked(track.uri)) {
            await deleteDoc(docRef);
        } else {
            await setDoc(docRef, {
                uri:      track.uri,
                name:     track.name,
                subtitle: track.subtitle || track.artists?.map(a => a.name).join(", ") || "",
                image:    track.image    || track.album?.images?.[0]?.url || "",
                album:    track.album    || track.albumName || "",
                likedAt:  serverTimestamp(),
            });
        }
    };

    return { likedSongs, isLiked, toggleLike };
}
