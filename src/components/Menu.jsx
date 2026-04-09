// src/components/Menu.jsx
import { useState } from "react";
import { AiFillHome } from "react-icons/ai";
import { FaSpotify } from "react-icons/fa";
import { FiInbox, FiSearch, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Menu({ onSearch }) {
  const [inputBtnX, setInputBtnX]         = useState("");
  const [mostrarTooltip, setMostrarTooltip] = useState("");
  const [menuUser, setMenuUser]           = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleClear = () => { setInputBtnX(""); onSearch?.(""); };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSearch?.(inputBtnX);
  };

  const handleLogout = async () => {
    await logout();
    setMenuUser(false);
    navigate("/");
  };

  // Inicial o foto del usuario
  const userInitial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  const userPhoto   = user?.photoURL;

  return (
    <header className="bg-black w-screen top-0 z-10 pl-6 opacity-90 h-16 flex items-center">
      <nav className="flex w-full justify-between text-white">

        {/* ── Izquierda: logo + búsqueda ────────────────────────────────── */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <FaSpotify
              className="text-white text-4xl"
              onMouseEnter={() => setMostrarTooltip("Spotify")}
              onMouseLeave={() => setMostrarTooltip("")}
            />
            {mostrarTooltip === "Spotify" && (
              <span className="absolute -bottom-8 -right-10 bg-white text-black text-sm px-2 py-1 rounded whitespace-nowrap z-1">
                Spotify
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Link to="/">
              <div
                className="bg-[#2b2b2b] h-13 w-13 rounded-full flex items-center justify-center text-gray-300 hover:bg-[#3b3b3b] hover:text-white transition-colors duration-300 cursor-pointer relative"
                onMouseEnter={() => setMostrarTooltip("Inicio")}
                onMouseLeave={() => setMostrarTooltip("")}
              >
                <AiFillHome className="text-2xl" />
                {mostrarTooltip === "Inicio" && (
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-[#3b3b3b] text-white font-bold text-sm px-2 py-1 rounded whitespace-nowrap">
                    Inicio
                  </span>
                )}
              </div>
            </Link>

            {/* Campo de búsqueda */}
            <div className="flex items-center bg-[#2b2b2b] rounded-full px-4 h-13 py-2 sm:w-120 relative border-3 border-transparent text-gray-300 focus-within:border-white hover:bg-[#3b3b3b] hover:text-white transition-colors duration-300">
              <div className="relative">
                <FiSearch
                  className="text-gray-300 text-2xl transition-colors duration-300 hover:text-white cursor-pointer"
                  onMouseEnter={() => setMostrarTooltip("Buscar")}
                  onMouseLeave={() => setMostrarTooltip("")}
                />
                {mostrarTooltip === "Buscar" && (
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-[#3b3b3b] text-white font-bold text-sm px-2 py-1 rounded whitespace-nowrap">
                    Buscar
                  </span>
                )}
              </div>
              <input
                value={inputBtnX}
                onChange={(e) => setInputBtnX(e.target.value)}
                onKeyDown={handleKeyDown}
                type="text"
                placeholder="¿Qué quieres reproducir?"
                className="bg-transparent outline-none text-white sm:w-85 ml-3"
              />
              <div className="absolute right-0 flex items-center h-full pr-4">
                <div className="relative">
                  <FiX
                    className={`text-gray-300 text-2xl cursor-pointer transition-colors duration-300 hover:text-white ${inputBtnX ? "block" : "hidden"}`}
                    onClick={handleClear}
                    onMouseEnter={() => setMostrarTooltip("Borrar")}
                    onMouseLeave={() => setMostrarTooltip("")}
                  />
                  {mostrarTooltip === "Borrar" && (
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-[#3b3b3b] text-white font-bold text-sm px-2 py-1 rounded whitespace-nowrap">
                      Borrar campo de búsqueda
                    </span>
                  )}
                </div>
                <div className="h-6 w-px bg-gray-500 mx-2"></div>
                <div className="relative">
                  <FiInbox
                    className="text-gray-300 text-2xl cursor-pointer transition-colors duration-300 hover:text-white"
                    onMouseEnter={() => setMostrarTooltip("Explorar")}
                    onMouseLeave={() => setMostrarTooltip("")}
                  />
                  {mostrarTooltip === "Explorar" && (
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-[#3b3b3b] text-white font-bold text-sm px-2 py-1 rounded whitespace-nowrap">
                      Explorar
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Derecha: sesión iniciada vs no iniciada ───────────────────── */}
        <div className="flex items-center gap-4 pr-2">
          {user ? (
            /* ── CON SESIÓN: avatar + menú desplegable ── */
            <div className="relative">
              <button
                onClick={() => setMenuUser(!menuUser)}
                className="w-10 h-10 rounded-full bg-[#535353] flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-200 border-2 border-transparent hover:border-white"
              >
                {userPhoto
                  ? <img src={userPhoto} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-base">{userInitial}</span>
                }
              </button>

              {menuUser && (
                <div className="absolute top-13 right-0 bg-[#282828] rounded-lg shadow-2xl w-48 py-1 z-50">
                  <div className="px-4 py-3 border-b border-[#3d3d3d]">
                    <p className="text-white text-sm font-bold truncate">
                      {user.displayName || "Usuario"}
                    </p>
                    <p className="text-[#B3B3B3] text-xs truncate">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-white text-sm hover:bg-[#3d3d3d] transition-colors duration-200"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── SIN SESIÓN: botones de registro/login ── */
            <>
              <div className="flex gap-2 text-gray-300 text-base font-bold">
                <p className="hover:text-white transition-all duration-300 hover:scale-103 cursor-pointer">Premium</p>
                <p className="hover:text-white transition-all duration-300 hover:scale-103 cursor-pointer">Asistencia</p>
                <p className="hover:text-white transition-all duration-300 hover:scale-103">Descargar</p>
              </div>
              <div className="h-6 w-0.5 bg-white mx-2"></div>
              <div className="flex gap-4 text-gray-300 text-sm font-bold">
                <p className="hover:text-white transition-all duration-300 hover:scale-103 cursor-pointer">Instalar app</p>
                <Link to="/register">
                  <p className="hover:text-white transition-all duration-300 hover:scale-103 cursor-pointer">Registrarte</p>
                </Link>
              </div>
              <Link to="/login">
                <button className="text-black font-bold text-base rounded-4xl px-8 py-3 transition-transform duration-300 hover:scale-103 bg-white">
                  Iniciar sesión
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}