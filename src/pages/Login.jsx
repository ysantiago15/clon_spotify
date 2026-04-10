
import { useState } from "react";
import { FaApple, FaFacebook, FaMobileAlt, FaSpotify } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../config/firebaseConfig";

export default function Login() {
  const [email, setEmail]               = useState("");
  const [hoverEtiqueta, setHoverEtiqueta]   = useState(false);
  const [hoverEtiqueta2, setHoverEtiqueta2] = useState(false);
  const [error, setError]               = useState("");

  const navigate = useNavigate();

  // Paso 1: solo recoge el email y lleva a la pantalla de contraseña
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    navigate("/login_contrasena", { state: { email } });
  };

  // Google
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
    <main className="pt-8 md:pt-24 flex flex-col items-center justify-center bg-[#121212] min-h-screen max-w-screen">
      <div className="px-6 md:px-8 min-h-screen flex flex-col items-center w-full md:w-97">

        <div className="text-white pb-2">
          <FaSpotify size={32} />
        </div>
        <h1 className="text-white text-[48px] font-bold text-center not-italic">¡Hola de nuevo!</h1>

        <form onSubmit={handleSubmit} className="mt-8 w-full">
          <label className="text-white text-sm font-bold mb-2 block">
            Correo electrónico
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
            Continuar
          </button>
        </form>

        <div className="flex items-center my-4">
          <span className="text-white text-base text-center">o</span>
        </div>

        <button className="w-full border border-[#7C7C7C] text-white font-bold pr-8 py-2 pl-7 rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 mb-2 hover:scale-105">
          <FaMobileAlt size={24} />
          <span className="w-full text-center">Continuar con un número de teléfono</span>
        </button>

        <button
          onClick={handleGoogle}
          className="w-full border border-[#7C7C7C] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 mb-2 pr-8 py-3 pl-7 hover:scale-105"
        >
          <FcGoogle size={24} />
          <span className="w-full text-center text-base">Continuar con Google</span>
        </button>

        <button className="w-full border border-[#7C7C7C] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 pr-8 py-3 mb-2 pl-7 hover:scale-105">
          <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
            <FaFacebook className="text-[#1877F2] w-7 h-7" />
          </div>
          <span className="w-full text-center text-base">Continuar con Facebook</span>
        </button>

        <button className="w-full border border-[#7C7C7C] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 pr-8 py-3 pl-7 hover:scale-105">
          <FaApple size={24} />
          <span className="w-full text-center text-base">Continuar con Apple</span>
        </button>

        <div className="text-center mt-16">
          <p className="text-[#B3B3B3] text-base mb-3">¿No tienes cuenta?</p>
          <Link to="/register" className="text-white inline-block font-bold text-base transition-all duration-200 py-2 hover:scale-105">
            Regístrate
          </Link>
        </div>
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
