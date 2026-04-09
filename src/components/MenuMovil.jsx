// src/components/MenuMovil.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Visible SOLO en móvil (clases md:hidden).
// El estado drawerOpen viene de Menu.jsx para que el botón ≡
// del header y el drawer estén sincronizados.
//
// Incluye:
//   • Drawer lateral con opciones de sesión/links
//   • Barra de navegación inferior fija
// ─────────────────────────────────────────────────────────────────────────────
import { AiFillHome } from "react-icons/ai";
import { FiSearch, FiX } from "react-icons/fi";
import { MdLibraryMusic } from "react-icons/md";
import { FaSpotify } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MenuMovil({ drawerOpen, setDrawerOpen, onSearch }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        setDrawerOpen(false);
        navigate("/");
    };

    const close = () => setDrawerOpen(false);

    return (
        <>
            {/* ── Drawer (menú de tres rayitas) — solo móvil ───────────────── */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-[200] md:hidden"
                    onClick={close}
                >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/70" />

                    {/* Panel */}
                    <div
                        className="absolute inset-0 bg-black flex flex-col px-8 pt-14 pb-10 overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Botón cerrar */}
                        <button
                            onClick={close}
                            className="absolute top-5 right-6 text-white hover:text-[#B3B3B3] transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <FiX size={28} />
                        </button>

                        {/* ── Links de sesión ── */}
                        <nav className="flex flex-col gap-7 mt-6">
                            {user ? (
                                /* Usuario logueado */
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt="avatar"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-black text-lg">
                                                {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-white font-bold text-base leading-tight">
                                                {user.displayName || "Usuario"}
                                            </p>
                                            <p className="text-[#B3B3B3] text-xs truncate max-w-[200px]">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Sin sesión */
                                <>
                                    <Link
                                        to="/login"
                                        onClick={close}
                                        className="text-white text-[2rem] font-black leading-none hover:text-[#1DB954] transition-colors"
                                    >
                                        Iniciar sesión
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={close}
                                        className="text-white text-[2rem] font-black leading-none hover:text-[#1DB954] transition-colors"
                                    >
                                        Registrarse
                                    </Link>
                                </>
                            )}
                        </nav>

                        {/* Separador */}
                        <div className="w-8 h-[2px] bg-white/30 my-8" />

                        {/* ── Links secundarios ── */}
                        <nav className="flex flex-col gap-6">
                            {[
                                { label: "Premium",                to: "/premium" },
                                { label: "Ayuda",                  to: "#" },
                                { label: "Descargar",              to: "#" },
                                { label: "Privacidad",             to: "#" },
                                { label: "Términos y Condiciones", to: "#" },
                            ].map(({ label, to }) => (
                                <Link
                                    key={label}
                                    to={to}
                                    onClick={close}
                                    className="text-white text-xl font-bold hover:text-[#1DB954] transition-colors"
                                >
                                    {label}
                                </Link>
                            ))}

                            {user && (
                                <button
                                    onClick={handleLogout}
                                    className="text-left text-[#B3B3B3] text-xl font-bold hover:text-red-400 transition-colors mt-2"
                                >
                                    Cerrar sesión
                                </button>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            {/* ── Barra de navegación inferior — solo móvil ────────────────── */}
            <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-black/70 backdrop-blur-xl border-t border-white/10 pb-safe">
                <div className="flex items-center justify-around py-3 px-4 min-h-[60px]">

                    {/* Inicio */}
                    <Link
                        to="/"
                        className="flex flex-col items-center gap-1 text-[#B3B3B3] hover:text-white active:text-white transition-colors min-w-[64px]"
                    >
                        <AiFillHome size={26} />
                        <span className="text-[11px] font-semibold">Inicio</span>
                    </Link>

                    {/* Buscar — enfoca el input de búsqueda del header */}
                    <button
                        onClick={() => {
                            const input = document.querySelector("input[placeholder*='reproducir']");
                            input?.focus();
                            input?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className="flex flex-col items-center gap-1 text-[#B3B3B3] hover:text-white transition-colors min-w-[64px]"
                    >
                        <FiSearch size={26} />
                        <span className="text-[11px] font-semibold">Buscar</span>
                    </button>

                    {/* Tu Biblioteca */}
                    <Link
                        to="/"
                        className="flex flex-col items-center gap-1 text-[#B3B3B3] hover:text-white transition-colors min-w-[64px]"
                    >
                        <MdLibraryMusic size={26} />
                        <span className="text-[11px] font-semibold">Tu Biblioteca</span>
                    </Link>

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

            {/* Espaciador para que el contenido no quede tapado por la barra inferior */}
            <div className="h-0 md:hidden flex-shrink-0" />
        </>
    );
}
