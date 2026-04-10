
import { useEffect, useState } from "react";
import { FiChevronLeft, FiEye, FiEyeOff } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebaseConfig";

export default function LoginContraseña() {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [resetSent, setResetSent]     = useState(false);
  const [hoverEtiqueta, setHoverEtiqueta]   = useState(false);
  const [hoverEtiqueta2, setHoverEtiqueta2] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.email) setEmail(location.state.email);
  }, [location.state]);

  // ── Iniciar sesión ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Completa todos los campos."); return; }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("Correo o contraseña incorrectos.");
          break;
        case "auth/too-many-requests":
          setError("Demasiados intentos. Intenta más tarde o restablece tu contraseña.");
          break;
        default:
          setError("Ocurrió un error. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperar contraseña ──────────────────────────────────────────────────────
  const handleReset = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Ingresa tu correo en el campo de arriba para restablecer tu contraseña.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch {
      setError("No se pudo enviar el correo de restablecimiento.");
    }
  };

  return (
    <main className="pt-8 md:pt-24 px-6 md:px-4 flex flex-col bg-[#121212] min-h-screen max-w-screen items-center justify-between">
      <div className="w-full md:w-81">
        <div className="mb-3">
          <button onClick={() => navigate("/login")} className="text-[#B3B3B3] hover:text-white transition-colors duration-200">
            <FiChevronLeft size={28} className="-ml-2" />
          </button>
        </div>

        <span className="text-white text-2xl font-bold mb-8">
          Iniciar sesión con contraseña
        </span>

        <form onSubmit={handleSubmit} className="mt-4 mb-2">
          <div className="mb-4">
            <label className="text-white font-bold text-sm mb-2 block">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-[#878787] rounded-md px-3 py-3 text-white outline-none focus:border-2 focus:border-white transition-all duration-150"
            />
          </div>

          <div className="mb-4">
            <label className="text-white font-bold text-sm mb-2 block">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-[#878787] rounded-md px-4 py-3 text-white outline-none focus:border-2 focus:border-white transition-all duration-150 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B3B3B3] hover:text-white transition-colors duration-200"
              >
                {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          {/* Correo de restablecimiento enviado */}
          {resetSent && (
            <p className="text-[#1ED760] text-sm mb-3">
              ✓ Correo de restablecimiento enviado. Revisa tu bandeja.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1ED760] hover:bg-[#1fdf64] text-black font-bold text-base rounded-full py-3 transition-all duration-200 hover:scale-105 mb-9 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleReset}
          className="w-full text-white font-bold text-base hover:text-[#1ED760] transition-colors duration-200 text-center"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <div className="p-8 text-center text-[#B3B3B3] text-xs mt-8">
        <p>Este sitio está protegido por reCAPTCHA. Se aplican los{" "}</p>
        <p>
          <a href="#"
            onMouseEnter={() => setHoverEtiqueta(true)}
            onMouseLeave={() => setHoverEtiqueta(false)}
            style={{ textDecoration: "underline", textDecorationColor: hoverEtiqueta ? "#1ED760" : "#B3B3B3" }}
            className="hover:text-[#1ED760] transition-all duration-200">
            Términos del servicio
          </a>{" "}y la{" "}
          <a href="#"
            onMouseEnter={() => setHoverEtiqueta2(true)}
            onMouseLeave={() => setHoverEtiqueta2(false)}
            style={{ textDecoration: "underline", textDecorationColor: hoverEtiqueta2 ? "#1ED760" : "#B3B3B3" }}
            className="transition-all duration-200 hover:text-[#1ED760]">
            Política de privacidad
          </a>{" "}de Google.
        </p>
      </div>
    </main>
  );
}

