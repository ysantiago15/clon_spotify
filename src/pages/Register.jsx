// src/pages/Register.jsx
import { useState } from "react";
import { FaApple, FaMobileAlt, FaSpotify } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebaseConfig";

export default function Register() {
  const [step, setStep]         = useState(1); // 1 = email, 2 = nombre + contraseña
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  // ── Paso 1: validar email y avanzar ──────────────────────────────────────────
  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setStep(2);
  };

  // ── Paso 2: crear cuenta con email/contraseña ─────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Ingresa tu nombre."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      navigate("/");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Este correo ya está registrado. ¿Quieres iniciar sesión?");
          break;
        case "auth/weak-password":
          setError("La contraseña es muy débil. Usa al menos 6 caracteres.");
          break;
        default:
          setError("Ocurrió un error. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google ────────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch {
      setError("No se pudo iniciar sesión con Google.");
    }
  };

  return (
    <main className="pt-24 flex flex-col items-center justify-center bg-[#121212] min-h-screen max-w-screen">
      <div className="px-8 min-h-screen flex flex-col items-center w-97">

        <div className="text-white pb-2">
          <FaSpotify size={32} />
        </div>

        <h1 className="text-white text-[40px] font-semibold text-center mb-8">
          {step === 1
            ? "Regístrate para empezar a escuchar"
            : "Crea tu cuenta"}
        </h1>

        {/* ── PASO 1: email ───────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <form onSubmit={handleNextStep} className="w-full">
              <label className="text-white text-sm font-bold mb-2 block">
                Dirección de email
              </label>
              <input
                type="email"
                placeholder="nombre@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-2 border-[#7C7C7C] text-white placeholder-gray-400 rounded p-3 mb-4 focus:outline-none focus:border-white"
              />
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              <button
                type="submit"
                className="w-full bg-[#1ED760] hover:bg-[#1fdf64] text-black font-bold py-3 px-8 rounded-full transition-all duration-200 hover:scale-105 text-base"
              >
                Siguiente
              </button>
            </form>

            <div className="flex items-center my-4">
              <span className="text-white text-base text-center">o</span>
            </div>

            <button
              onClick={handleGoogle}
              className="w-full border border-[#7C7C7C] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 mb-2 pr-8 py-3 pl-7 hover:scale-105"
            >
              <FcGoogle size={24} />
              <span className="w-full text-center text-base">Registrarte con Google</span>
            </button>

            <button className="w-full border border-[#7C7C7C] text-white font-bold pr-8 py-2 pl-7 rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 mb-2 hover:scale-105">
              <FaMobileAlt size={24} />
              <span className="w-full text-center">Registrarme con un número de teléfono</span>
            </button>

            <button className="w-full border border-[#7C7C7C] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 pr-8 py-3 pl-7 hover:scale-105">
              <FaApple size={24} />
              <span className="w-full text-center text-base">Regístrate con Apple</span>
            </button>

            <div className="text-center mt-16">
              <p className="text-[#B3B3B3] text-base mb-3">¿Ya tienes una cuenta?</p>
              <Link to="/login" className="text-white inline-block font-bold text-base transition-all duration-200 py-2 hover:scale-105">
                Iniciar sesión
              </Link>
            </div>
          </>
        )}

        {/* ── PASO 2: nombre + contraseña ─────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
            <div>
              <label className="text-white text-sm font-bold mb-2 block">
                Nombre de perfil
              </label>
              <input
                type="text"
                placeholder="¿Cómo quieres que te llamemos?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-2 border-[#7C7C7C] text-white placeholder-gray-400 rounded p-3 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-white text-sm font-bold mb-2 block">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-2 border-[#7C7C7C] text-white placeholder-gray-400 rounded p-3 focus:outline-none focus:border-white"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1ED760] hover:bg-[#1fdf64] text-black font-bold py-3 px-8 rounded-full transition-all duration-200 hover:scale-105 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setError(""); }}
              className="text-[#B3B3B3] hover:text-white text-sm font-bold text-center transition-colors duration-200"
            >
              ← Volver
            </button>
          </form>
        )}
      </div>

      <div className="p-8 text-center text-[#B3B3B3] text-xs mt-8">
        <p>This site is protected by reCAPTCHA and the Google{" "}</p>
        <p>
          <a href="#" style={{ textDecoration: "underline", textDecorationColor: "#B3B3B3" }} className="hover:text-gray-300">Privacy Policy</a>{" "}
          and{" "}
          <a href="#" style={{ textDecoration: "underline", textDecorationColor: "#B3B3B3" }} className="hover:text-gray-300">Terms of Service</a>{" "}
          apply.
        </p>
      </div>
    </main>
  );
}
