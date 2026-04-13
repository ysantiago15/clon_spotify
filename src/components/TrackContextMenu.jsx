import { useEffect, useRef, useState } from "react";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { BsHeartFill } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { IoCaretForward } from "react-icons/io5";
import { useUserPlaylists } from "../hooks/useUserPlaylists";

const PLAYER_HEIGHT = 90;
const SUB_MENU_WIDTH = 224; // w-56 = 224px

export default function TrackContextMenu({
    track,
    onClose,
    onAddToPlaylist,
    onSaveLike,
    isLiked,
    // Si se pasa, el menú se renderiza con position:fixed en esas coordenadas
    // (útil para click derecho desde el Player).
    // anchorBottom: true → el menú crece hacia arriba (bottom = y en vez de top = y)
    // Si no se pasa, usa position:absolute right-0 top-8 (comportamiento original
    // para ArtistSearch y otros usos con botón de tres puntos).
    fixedPosition,
}) {
    const { playlists, addSongToPlaylist } = useUserPlaylists();
    const [showPlaylists, setShowPlaylists] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const menuRef = useRef(null);
    const triggerRef = useRef(null);
    const [subMenuPos, setSubMenuPos] = useState({ top: 0, left: 0 });

    // Cierra al hacer click fuera
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Calcula la posición del submenú evitando salirse de la pantalla
    const calcSubMenuPos = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const subMenuHeight = 320;
        const bottomLimit = window.innerHeight - PLAYER_HEIGHT;
        const spaceRight = window.innerWidth - rect.right;
        const spaceBelow = bottomLimit - rect.top;

        const left = spaceRight >= SUB_MENU_WIDTH + 8
            ? rect.right
            : rect.left - SUB_MENU_WIDTH;

        const top = spaceBelow >= subMenuHeight
            ? rect.top
            : Math.max(8, bottomLimit - subMenuHeight);

        setSubMenuPos({ top, left });
    };

    const filteredPlaylists = playlists.filter((pl) =>
        pl.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Estilos del contenedor principal ────────────────────────────────────────
    // Con fixedPosition → position:fixed en las coords dadas (click derecho Player)
    //   anchorBottom: true → menú crece hacia arriba (bottom = y)
    //   anchorBottom: false/undefined → menú crece hacia abajo (top = y)
    // Sin fixedPosition → position:absolute right-0 top-8 (botón ⋯ ArtistSearch)
    const containerStyle = fixedPosition
        ? fixedPosition.anchorBottom
            ? { position: "fixed", bottom: window.innerHeight - fixedPosition.y, left: fixedPosition.x, background: "#282828", zIndex: 9999 }
            : { position: "fixed", top: fixedPosition.y, left: fixedPosition.x, background: "#282828", zIndex: 9999 }
        : { background: "#282828" };

    const containerClass = fixedPosition
        ? "w-56 rounded-md shadow-2xl overflow-visible"
        : "absolute right-0 top-8 z-50 w-56 rounded-md shadow-2xl overflow-visible";

    return (
        <div
            ref={menuRef}
            className={containerClass}
            style={containerStyle}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* ── Agregar a playlist ── */}
            <div
                ref={triggerRef}
                className="relative flex items-center justify-between px-4 py-3 text-sm text-white hover:bg-white/10 cursor-pointer select-none"
                onMouseEnter={() => { calcSubMenuPos(); setShowPlaylists(true); }}
                onMouseLeave={() => setShowPlaylists(false)}
            >
                <div className="flex items-center gap-3">
                    <AiOutlinePlusCircle size={16} />
                    Agregar a playlist
                </div>
                <IoCaretForward size={10} />

                {/* Submenú de playlists — siempre fixed para escapar de cualquier contenedor */}
                {showPlaylists && (
                    <div
                        className="rounded-md shadow-2xl py-2 z-[9999]"
                        style={{
                            position: "fixed",
                            top: subMenuPos.top,
                            left: subMenuPos.left,
                            width: SUB_MENU_WIDTH,
                            background: "#282828",
                        }}
                        onMouseEnter={() => setShowPlaylists(true)}
                        onMouseLeave={() => setShowPlaylists(false)}
                    >
                        {/* Buscador */}
                        <div className="px-3 py-2">
                            <div className="flex items-center gap-2 bg-[#3e3e3e] rounded px-2 py-1.5">
                                <FiSearch size={12} color="#b3b3b3" />
                                <input
                                    type="text"
                                    placeholder="Busca una playlist"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent outline-none text-white text-xs placeholder-[#b3b3b3] w-full"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div
                            className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/10 cursor-pointer"
                            onClick={async () => {
                                await onAddToPlaylist?.("nueva", track);
                                onClose();
                            }}
                        >
                            <AiOutlinePlusCircle size={14} />
                            Nueva playlist
                        </div>

                        <div className="border-t border-white/10 my-1" />

                        <div
                            className="overflow-y-auto"
                            style={{
                                maxHeight: "210px",
                                scrollbarWidth: "thin",
                                scrollbarColor: "#535353 transparent",
                            }}
                        >
                            {filteredPlaylists.map((pl) => (
                                <div
                                    key={pl.id}
                                    className="px-4 py-3 text-sm text-white hover:bg-white/10 cursor-pointer truncate"
                                    onClick={() => {
                                        // addSongToPlaylist(pl.id, track);
                                        onAddToPlaylist?.(pl.id, track);
                                        onClose();
                                    }}
                                >
                                    {pl.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Guardar en Tus me gusta ── */}
            <div
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 cursor-pointer select-none"
                style={{ color: isLiked ? "#1ed760" : "white" }}   // ← color dinámico
                onClick={() => { onSaveLike?.(track); onClose(); }}
            >
                <BsHeartFill size={16} />
                {isLiked ? "Quitar de Tus me gusta" : "Guardar en Tus me gusta"}  {/* ← texto dinámico */}
            </div>
        </div>
    );
}
