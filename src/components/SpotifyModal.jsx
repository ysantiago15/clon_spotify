import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function SpotifyModal({ isOpen, onClose, data }) {
    const panelRef = useRef(null);

    // Animación de entrada + bloquear scroll del body
    useEffect(() => {
        if (!isOpen) {
            document.body.style.overflow = "";
            return;
        }
        document.body.style.overflow = "hidden";
        // Un frame después de montar para que la transición funcione
        const raf = requestAnimationFrame(() => {
            if (panelRef.current) {
                panelRef.current.style.transform = "translateY(0)";
                panelRef.current.style.opacity   = "1";
            }
        });
        return () => cancelAnimationFrame(raf);
    }, [isOpen]);

    if (!isOpen || !data) return null;

    return (
        /* ── Overlay ── */
        <div
            className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm
                        flex items-end md:items-center justify-center"
            onClick={onClose}
        >
            {/*
             * Móvil  → sheet que sube desde abajo (items-end en el overlay)
             *           imagen cuadrada arriba + contenido debajo
             * Desktop → modal horizontal centrado (layout original)
             */}

            {/* ── MÓVIL ── */}
            <div
                ref={panelRef}
                className="md:hidden w-full rounded-t-3xl overflow-hidden shadow-2xl"
                style={{
                    background: "linear-gradient(180deg, #8B1A1A 0%, #2a0a0a 50%, #1a1a1a 100%)",
                    transform:  "translateY(100%)",
                    opacity:    0,
                    transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1), opacity 0.25s ease",
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Pastilla de arrastre */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-white/30" />
                </div>

                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white"
                >
                    <FiX size={18} />
                </button>

                {/* Imagen arriba — completa sin recortar */}
                {data.image && (
                    <div className="w-full flex justify-center px-6">
                        <img
                            src={data.image}
                            alt={data.name}
                            className="w-48 h-48 object-contain rounded-lg"
                        />
                    </div>
                )}

                {/* Contenido debajo */}
                <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
                    {data.name && (
                        <div>
                            <p className="text-white font-extrabold text-xl leading-tight line-clamp-2">{data.name}</p>
                            {data.subtitle && <p className="text-white/60 text-sm mt-1">{data.subtitle}</p>}
                        </div>
                    )}

                    <h2 className="text-white text-2xl font-extrabold leading-snug">
                        Empieza a escuchar<br />con una cuenta gratis<br />de Spotify
                    </h2>

                    <div className="flex flex-col gap-3">
                        <Link to="/register" onClick={onClose}>
                            <button className="w-full py-3.5 rounded-full bg-[#1DB954] text-black font-bold text-base active:scale-95 transition-transform">
                                Registrarse gratis
                            </button>
                        </Link>
                        <button className="w-full py-3.5 rounded-full border border-white/50 text-white font-bold text-base active:scale-95 transition-transform">
                            Descargar aplicación
                        </button>
                        <p className="text-white/70 text-sm text-center pt-1">
                            ¿Ya tienes una cuenta?{" "}
                            <Link to="/login" onClick={onClose}>
                                <span className="text-white font-bold underline hover:text-[#1DB954] transition-colors">
                                    Iniciar sesión
                                </span>
                            </Link>
                        </p>

                    </div>
                </div>
            </div>

            {/* ── DESKTOP — layout original horizontal ── */}
            <div
                className="hidden md:flex justify-between items-center relative z-10 w-202.5 mx-4 rounded-2xl overflow-hidden shadow-2xl p-16"
                style={{ background: "linear-gradient(135deg, #8B1A1A 0%, #2a0a0a 60%, #1a1a1a 100%)" }}
                onClick={e => e.stopPropagation()}
            >
                <div>
                    <img src={data.image} alt={data.name} className="w-75 h-75 object-cover" />
                </div>
                <div className="text-center">
                    <h2 className="text-white text-3xl font-extrabold leading-tight mb-6">
                        Empieza a escuchar<br />con una cuenta gratis<br />de Spotify
                    </h2>
                    <Link to="/register" onClick={onClose}>
                        <button className="py-3 px-6 rounded-full bg-[#1DB954] text-black font-bold text-base hover:scale-105 hover:bg-[#1ed760] transition-all duration-200 mb-6">
                            Registrarse gratis
                        </button>
                    </Link>
                    <button className="py-3 px-6 rounded-full border border-white/60 text-white font-bold text-base hover:border-white hover:scale-105 transition-all duration-200 bg-transparent mb-6">
                        Descargar aplicación
                    </button>
                    <p className="text-white/70 text-sm">
                        ¿Ya tienes una cuenta?{" "}
                        <Link to="/login" onClick={onClose}>
                            <span className="text-white font-bold underline cursor-pointer hover:text-[#1DB954] transition-colors">
                                Iniciar sesión
                            </span>
                        </Link>
                    </p>
                </div>
            </div>

            {/* Botón cerrar desktop (fuera del panel, como el original) */}
            <div className="hidden md:block absolute bottom-8">
                <button onClick={onClose} className="text-white/80 font-semibold text-base hover:text-white transition-all duration-200 hover:scale-105 tracking-wide px-8 py-2">
                    Cerrar
                </button>
            </div>
        </div>
    );
}
