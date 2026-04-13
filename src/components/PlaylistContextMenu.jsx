import { useEffect, useRef } from "react";
import { MdEdit, MdDelete, MdAdd } from "react-icons/md";

/**
 * PlaylistContextMenu
 * Menú contextual que aparece al hacer click derecho sobre una playlist propia.
 *
 * Props:
 *  - isOpen      {boolean}   — controla visibilidad
 *  - position    {{ x, y }}  — coordenadas donde aparece el menú
 *  - playlist    {object}    — la playlist sobre la que se hizo click derecho
 *  - onClose     {fn}        — cierra el menú
 *  - onEdit      {fn}        — abre el modal de edición
 *  - onDelete    {fn}        — elimina la playlist
 *  - onCreate    {fn}        — crea una nueva playlist
 */
export default function PlaylistContextMenu({
    isOpen,
    position,
    playlist,
    onClose,
    onEdit,
    onDelete,
    onCreate,
}) {
    const menuRef = useRef(null);

    // Cierra al hacer click fuera o al presionar Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };

        // Usamos mousedown para que cierre antes de que el siguiente click se registre
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const ITEMS = [
        {
            icon: <MdEdit size={18} />,
            label: "Editar detalles",
            action: () => { onEdit(playlist); onClose(); },
            danger: false,
        },
        {
            icon: <MdDelete size={18} />,
            label: "Eliminar",
            action: () => { onDelete(playlist); onClose(); },
            danger: true,
        },
        {
            icon: <MdAdd size={20} />,
            label: "Crear playlist",
            action: () => { onCreate(); onClose(); },
            danger: false,
        },
    ];

    return (
        /* Portal-like: fixed, encima de todo */
        <div
            ref={menuRef}
            className="fixed z-[500] bg-[#282828] rounded min-w-[196px] py-1 shadow-[0_16px_24px_rgba(0,0,0,0.3),0_6px_8px_rgba(0,0,0,0.2)]"
            style={{ top: position.y, left: position.x }}
        >
            {ITEMS.map(({ icon, label, action, danger }, idx) => (
                <button
                    key={label}
                    onClick={action}
                    className={[
                        "flex items-center gap-3 w-full px-4 bg-transparent border-none cursor-pointer text-sm font-normal text-left transition-colors duration-100",
                        "hover:bg-[#3e3e3e]",
                        danger ? "text-[#f15e6c]" : "text-white",
                        // Separador antes del último item (Crear playlist)
                        idx === 2
                            ? "border-t border-[#3e3e3e] mt-1 pt-[14px] pb-[10px]"
                            : "py-[10px]",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                >
                    <span className={`flex ${danger ? "opacity-100" : "opacity-70"}`}>
                        {icon}
                    </span>
                    {label}
                </button>
            ))}
        </div>
    );
}
