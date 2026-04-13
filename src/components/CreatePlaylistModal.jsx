import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { BsMusicNote } from "react-icons/bs";
import { MdEdit } from "react-icons/md";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebaseConfig";
import { IoMusicalNotesOutline } from "react-icons/io5";

const COLORS = [
    "#e91429", "#e8400e", "#e8740e", "#e8c90e",
    "#1ed760", "#1db954", "#0d72ea", "#503dc0",
    "#9933cc", "#e61e8c", "#535353", "#7c7c7c",
];

export default function CreatePlaylistModal({
    isOpen,
    onClose,
    onConfirm,
    initialData = null,
    mode = "create",
    playlistId = null,
    userId = null,
}) {
    const [name,         setName]         = useState("");
    const [description,  setDescription]  = useState("");
    const [coverColor,   setCoverColor]   = useState(COLORS[4]);
    const [coverImage,   setCoverImage]   = useState(null);
    const [localPreview, setLocalPreview] = useState(null);
    const [uploading,    setUploading]    = useState(false);
    const [nameFocused,  setNameFocused]  = useState(false);
    const [descFocused,  setDescFocused]  = useState(false);
    const [error,        setError]        = useState("");
    const nameRef      = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name             || "");
                setDescription(initialData.description || "");
                setCoverColor(initialData.coverColor   || COLORS[4]);
                setCoverImage(initialData.coverImage   || null);
            } else {
                setName("");
                setDescription("");
                setCoverColor(COLORS[4]);
                setCoverImage(null);
            }
            setLocalPreview(null);
            setError("");
            setTimeout(() => nameRef.current?.focus(), 80);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        return () => { if (localPreview) URL.revokeObjectURL(localPreview); };
    }, [localPreview]);

    const handleImageClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const blobUrl = URL.createObjectURL(file);
        setLocalPreview(blobUrl);
        setUploading(true);
        try {
            const storageId  = playlistId || `temp_${Date.now()}`;
            const uid        = userId     || "anonymous";
            const storageRef = ref(storage, `users/${uid}/playlists/${storageId}/cover.jpg`);
            await uploadBytes(storageRef, file, { contentType: file.type });
            const downloadUrl = await getDownloadURL(storageRef);
            setCoverImage(downloadUrl);
        } catch (err) {
            console.error("Error subiendo imagen:", err);
            setError("No se pudo subir la imagen. Inténtalo de nuevo.");
            setLocalPreview(null);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleConfirm = () => {
        const trimmed = name.trim();
        if (!trimmed) { setError("El nombre no puede estar vacío."); return; }
        onConfirm({ name: trimmed, description: description.trim(), coverColor, coverImage: coverImage || null });
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleConfirm();
        if (e.key === "Escape") onClose();
    };

    if (!isOpen) return null;

    const displayImage = localPreview || coverImage;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Tarjeta */}
            <div className="relative bg-[#282828] rounded-lg shadow-2xl w-full max-w-[524px] mx-4 p-6 flex flex-col gap-4">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-white text-[22px] font-bold leading-none">
                        {mode === "edit" ? "Editar datos" : "Crear playlist"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-white/70 transition-colors"
                    >
                        <FiX size={22} />
                    </button>
                </div>

                {/* ── Cuerpo: portada + campos ── */}
                <div className="flex gap-4 items-start">

                    {/* Portada */}
                    <div
                        onClick={handleImageClick}
                        className="relative flex-shrink-0 w-[170px] h-[170px] flex-1 rounded-sm cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,.6)] overflow-hidden"
                        style={
                            !displayImage
                                ? { background: `linear-gradient(160deg, ${coverColor}77 0%, #1a1a1a 100%)` }
                                : undefined
                        }
                    >
                        {displayImage ? (
                            <img src={displayImage} alt="Portada" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#3e3e3e]">
                                <IoMusicalNotesOutline size={48} className="text-[#7c7c7c]" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                            {uploading
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <>
                                    <MdEdit size={28} className="text-white" />
                                    <span className="text-white text-xs font-semibold mt-1">Elegir foto</span>
                                  </>
                            }
                        </div>
                    </div>

                    {/* Campos */}
                    <div className="flex-1 flex flex-col gap-4">

                        {/* ── Nombre: label cortando el borde superior del input ── */}
                        <div className="relative ">
                            <label
                                htmlFor="playlist-name"
                                className={[
                                    "absolute -top-1.5 left-3 px-1 text-[12px] font-bold bg-[#282828] leading-none transition-all duration-150 text-[#a7a7a7]",
                                    nameFocused ? "opacity-100" : "opacity-0",
                                ].join(" ")}
                            >
                                Nombre
                            </label>
                            <input
                                id="playlist-name"
                                ref={nameRef}
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setError(""); }}
                                onFocus={() => setNameFocused(true)}
                                onBlur={() => setNameFocused(false)}
                                onKeyDown={handleKeyDown}
                                maxLength={100}
                                className={[
                                    "w-[280px] bg-transparent text-white text-sm rounded",
                                    "px-3 pt-2 pb-2 outline-none border transition-colors duration-150",
                                    nameFocused
                                        ? "border-white"
                                        : "border-[#7c7c7c] hover:border-[#b3b3b3]",
                                ].join(" ")}
                            />
                            {error && <span className="text-[#f15e6c] text-[11px] mt-0.5 block">{error}</span>}
                        </div>

                        {/* ── Descripción: label cortando el borde superior ── */}
                        <div className="relative ">
                            <label
                                htmlFor="playlist-desc"
                                className={[
                                    "absolute -top-2 left-3 px-1 text-[13px] font-bold bg-[#282828] leading-none transition-all duration-150 text-[#a7a7a7]",
                                    descFocused ? "opacity-100" : "opacity-0",
                                ].join(" ")}
                            >
                                Descripción
                            </label>
                            <textarea
                                id="playlist-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onFocus={() => setDescFocused(true)}
                                onBlur={() => setDescFocused(false)}
                                placeholder="Agrega una descripción opcional"
                                maxLength={300}
                                rows={5}
                                className={[
                                    "w-full bg-transparent text-white text-sm rounded",
                                    "px-3 py-2 outline-none border transition-colors duration-150",
                                    "placeholder:text-[#6a6a6a] resize-none font-[inherit]",
                                    descFocused
                                        ? "border-white"
                                        : "border-[#7c7c7c] hover:border-[#b3b3b3]",
                                ].join(" ")}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Color de portada ── */}
                <div className="flex flex-col gap-2">
                    <span className="text-[#a7a7a7] text-[11px] font-bold tracking-[0.1em] uppercase">
                        Color de portada
                    </span>
                    <div className="flex flex-wrap gap-[6px]">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setCoverColor(c)}
                                className="w-[26px] h-[26px] rounded-full border-none cursor-pointer transition-transform duration-100 hover:scale-110 active:scale-95 flex-shrink-0"
                                style={{
                                    backgroundColor: c,
                                    outline: coverColor === c ? "2px solid #fff" : "2px solid transparent",
                                    outlineOffset: "2px",
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Texto legal ── */}
                <p className="text-white text-[13px] font-bold leading-snug">
                    Al continuar, aceptas darle acceso a Spotify a la imagen que decidas subir.
                    Asegúrate de tener los derechos para subir la imagen.
                </p>

                {/* ── Botón Guardar ── */}
                <div className="flex justify-end">
                    <button
                        onClick={handleConfirm}
                        disabled={uploading}
                        className="
                            px-8 py-[13px] rounded-full
                            text-[15px] font-bold text-black bg-white
                            transition-transform duration-100
                            hover:scale-[1.04] active:scale-[0.97]
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    >
                        {mode === "edit" ? "Guardar" : "Crear"}
                    </button>
                </div>
            </div>
        </div>
    );
}
