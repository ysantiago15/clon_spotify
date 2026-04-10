// src/components/MenuMovil.jsx
import { useRef, useState } from "react";
import { AiFillHome } from "react-icons/ai";
import { FiSearch, FiX } from "react-icons/fi";
import { MdLibraryMusic } from "react-icons/md";
import { FaSpotify } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MenuMovil({ drawerOpen, setDrawerOpen, onSearch, mobileView, setMobileView }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState("");
    const inputRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        setDrawerOpen(false);
        navigate("/");
    };

    const close = () => setDrawerOpen(false);

    const handleSearchSubmit = () => {
        if (searchInput.trim()) {
            onSearch?.(searchInput.trim());
            setMobileView?.("home");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearchSubmit();
    };

    const handleClear = () => {
        setSearchInput("");
        onSearch?.("");
        inputRef.current?.focus();
    };

    const goTo = (view) => {
        setMobileView?.(view);
        if (view === "home") onSearch?.("");
        if (view === "search") setTimeout(() => inputRef.current?.focus(), 100);
    };

    return (
        <>
            {/* ── Drawer (menú de tres rayitas) — solo móvil ───────────────── */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-[200] md:hidden"
                    onClick={close}
                >
                    <div className="absolute inset-0 bg-black/70" />
                    <div
                        className="absolute inset-0 bg-black flex flex-col px-8 pt-14 pb-10 overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={close}
                            className="absolute top-5 right-6 text-white hover:text-[#B3B3B3] transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <FiX size={28} />
                        </button>

                        <nav className="flex flex-col gap-7 mt-6">
                            {user ? (
                                <div className="flex items-center gap-3 mb-2">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-black text-lg">
                                            {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-white font-bold text-base leading-tight">{user.displayName || "Usuario"}</p>
                                        <p className="text-[#B3B3B3] text-xs truncate max-w-[200px]">{user.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" onClick={close} className="text-white text-[2rem] font-black leading-none hover:text-[#1DB954] transition-colors">
                                        Iniciar sesión
                                    </Link>
                                    <Link to="/register" onClick={close} className="text-white text-[2rem] font-black leading-none hover:text-[#1DB954] transition-colors">
                                        Registrarse
                                    </Link>
                                </>
                            )}
                        </nav>

                        <div className="w-8 h-[2px] bg-white/30 my-8" />

                        <nav className="flex flex-col gap-6">
                            {[
                                { label: "Premium",                to: "/premium" },
                                { label: "Ayuda",                  to: "#" },
                                { label: "Descargar",              to: "#" },
                                { label: "Privacidad",             to: "#" },
                                { label: "Términos y Condiciones", to: "#" },
                            ].map(({ label, to }) => (
                                <Link key={label} to={to} onClick={close} className="text-white text-xl font-bold hover:text-[#1DB954] transition-colors">
                                    {label}
                                </Link>
                            ))}
                            {user && (
                                <button onClick={handleLogout} className="text-left text-[#B3B3B3] text-xl font-bold hover:text-red-400 transition-colors mt-2">
                                    Cerrar sesión
                                </button>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            {/* ── Input de búsqueda móvil — visible solo cuando mobileView === "search" ── */}
            {mobileView === "search" && (
                <div className="fixed top-16 left-0 right-0 z-[90] md:hidden bg-black px-4 py-3 border-b border-white/10">
                    <div className="flex items-center bg-[#2b2b2b] rounded-full px-4 h-11 border-2 border-white focus-within:border-white">
                        <FiSearch className="text-white text-xl flex-shrink-0" />
                        <input
                            ref={inputRef}
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            type="text"
                            placeholder="¿Qué quieres reproducir?"
                            className="bg-transparent outline-none text-white flex-1 ml-3 text-sm"
                            autoFocus
                        />
                        {searchInput ? (
                            <button onClick={handleClear} className="text-[#B3B3B3] hover:text-white transition-colors ml-2">
                                <FiX size={18} />
                            </button>
                        ) : null}
                        <button
                            onClick={handleSearchSubmit}
                            className="ml-3 text-white font-semibold text-sm bg-[#1DB954] px-3 py-1 rounded-full hover:bg-[#1fdf64] transition-colors"
                        >
                            Buscar
                        </button>
                    </div>
                </div>
            )}

            {/* ── Barra de navegación inferior — solo móvil ────────────────── */}
            <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-[#0a0a0a]/80 border-t border-white/10 pb-safe">
                <div className="flex items-center justify-around py-3 px-4 min-h-[60px]">

                    {/* Inicio */}
                    <button
                        onClick={() => goTo("home")}
                        className={`flex flex-col items-center gap-1 transition-colors min-w-[64px] ${mobileView === "home" ? "text-white" : "text-[#B3B3B3] hover:text-white"}`}
                    >
                        <AiFillHome size={26} />
                        <span className="text-[11px] font-semibold">Inicio</span>
                    </button>

                    {/* Buscar */}
                    <button
                        onClick={() => goTo(mobileView === "search" ? "home" : "search")}
                        className={`flex flex-col items-center gap-1 transition-colors min-w-[64px] ${mobileView === "search" ? "text-white" : "text-[#B3B3B3] hover:text-white"}`}
                    >
                        <FiSearch size={26} />
                        <span className="text-[11px] font-semibold">Buscar</span>
                    </button>

                    {/* Tu Biblioteca */}
                    <button
                        onClick={() => goTo(mobileView === "library" ? "home" : "library")}
                        className={`flex flex-col items-center gap-1 transition-colors min-w-[64px] ${mobileView === "library" ? "text-white" : "text-[#B3B3B3] hover:text-white"}`}
                    >
                        <MdLibraryMusic size={26} />
                        <span className="text-[11px] font-semibold">Tu Biblioteca</span>
                    </button>

                    {/* Premium */}
                    <Link
                        to="/premium"
                        className="flex flex-col items-center gap-1 text-[#B3B3B3] hover:text-white transition-colors min-w-[64px]"
                    >
                        <FaSpotify size={26} />
                        <span className="text-[11px] font-semibold">Premium</span>
                    </Link>
                </div>
            </nav>

            <div className="h-0 md:hidden flex-shrink-0" />
        </>
    );
}
