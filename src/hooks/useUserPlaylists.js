import { useEffect, useState } from "react";
import {
    collection,
    doc,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    deleteField,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    getDoc,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { useAuth } from "../context/AuthContext";

export function useUserPlaylists() {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState([]);

    // Escucha en tiempo real las playlists del usuario
    useEffect(() => {
        if (!user) { setPlaylists([]); return; }

        const colRef = collection(db, "users", user.uid, "userPlaylists");

        const unsub = onSnapshot(colRef, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setPlaylists(list);
        });

        return () => unsub();
    }, [user]);

    // Crear playlist nueva (devuelve el id del doc creado)
    const createPlaylist = async ({ name = "Mi playlist", description = "", coverColor = "#535353", coverImage = null } = {}) => {
        if (!user) return null;
        const colRef = collection(db, "users", user.uid, "userPlaylists");
        const ref = await addDoc(colRef, {
            name,
            description,
            coverColor,
            coverImage,   // ← NUEVO: URL de imagen o null
            songs: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return ref.id;
    };

    // Editar nombre / descripción / color / imagen
    const updatePlaylist = async (playlistId, updates) => {
        if (!user || !playlistId) return;
        const ref = doc(db, "users", user.uid, "userPlaylists", playlistId);
        await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    };

    // Eliminar playlist
    const deletePlaylist = async (playlistId) => {
        if (!user || !playlistId) return;
        const ref = doc(db, "users", user.uid, "userPlaylists", playlistId);
        await deleteDoc(ref);
    };

    // Agregar canción a playlist (evita duplicados por URI)
    const addSongToPlaylist = async (playlistId, track) => {
        if (!user || !playlistId || !track?.uri) return;
        const ref = doc(db, "users", user.uid, "userPlaylists", playlistId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const songs = snap.data().songs || [];
        if (songs.some(s => s.uri === track.uri)) return; // ya existe
        const song = {
            uri:      track.uri,
            name:     track.name,
            subtitle: track.subtitle || track.artists?.map(a => a.name).join(", ") || "",
            image:    track.image    || track.album?.images?.[0]?.url || "",
            album:    track.album    || track.albumName || "",
            duration_ms: track.duration_ms || 0,
            addedAt:  Date.now(),
        };
        await updateDoc(ref, { songs: arrayUnion(song), updatedAt: serverTimestamp() });
    };

    // Quitar canción de playlist por URI
    const removeSongFromPlaylist = async (playlistId, trackUri) => {
        if (!user || !playlistId || !trackUri) return;
        const ref = doc(db, "users", user.uid, "userPlaylists", playlistId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const songs = (snap.data().songs || []).filter(s => s.uri !== trackUri);
        await updateDoc(ref, { songs, updatedAt: serverTimestamp() });
    };

    // Obtener una playlist por id (lectura local sin red)
    const getPlaylist = (playlistId) => playlists.find(p => p.id === playlistId) || null;

    return {
        playlists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        getPlaylist,
    };
}
