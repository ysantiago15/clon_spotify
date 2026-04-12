import { useRef, useState } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { FaApple, FaFacebook, FaSpotify } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { signInWithPopup, PhoneAuthProvider, RecaptchaVerifier } from "firebase/auth";
import { auth, googleProvider } from "../config/firebaseConfig";
import { FcGoogle } from "react-icons/fc";


export default function LoginTelefono() {
  const [numero, setNumero] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoverEtiqueta, setHoverEtiqueta] = useState(false);
  const [hoverEtiqueta2, setHoverEtiqueta2] = useState(false);

  const recaptchaRef = useRef(null);
  const recaptchaVerifier = useRef(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const soloNumeros = numero.replace(/\D/g, "");
    if (soloNumeros.length < 7) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }
    const telefonoCompleto = `+57${soloNumeros}`;
    setLoading(true);
    try {
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
      recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: "invisible" });
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(telefonoCompleto, recaptchaVerifier.current);
      navigate("/login_codigo", { state: { telefono: telefonoCompleto, verificationId } });
    } catch (err) {
      switch (err.code) {
        case "auth/too-many-requests":
          setError("Demasiados intentos. Espera unos minutos e intenta de nuevo."); break;
        case "auth/invalid-phone-number":
          setError("El número de teléfono no es válido."); break;
        case "auth/captcha-check-failed":
          setError("Falló la verificación de seguridad. Recarga la página.");
          recaptchaVerifier.current = null; break;
        default:
          setError("No se pudo enviar el SMS. Intenta de nuevo.");
          recaptchaVerifier.current = null;
      }
    } finally {
      setLoading(false);
    }
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
    <main className="pt-8 md:pt-24 flex flex-col items-center justify-between bg-[#121212] min-h-screen max-w-screen">
      <div ref={recaptchaRef} />
      <div className="px-6 md:px-8 flex flex-col items-center w-full md:w-97">

        {/* Logo */}
        <div className="text-white pb-2">
          <FaSpotify size={32} />
        </div>

        <h1 className="text-white text-[32px] md:text-[48px] font-bold text-center not-italic mb-8">
          ¡Hola de nuevo!
        </h1>

        <form onSubmit={handleSubmit} className="w-full">
          <label className="text-white text-sm font-bold mb-2 block">
            Número de teléfono
          </label>

          {/* Código fijo +57 + input número */}
          <div className="flex gap-2 mb-4">
            <div className="bg-transparent border-2 border-[#7C7C7C] text-white rounded px-4 flex items-center font-bold text-sm min-w-[72px] justify-center">
              +57
            </div>
            <input
              type="tel"
              placeholder=""
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="flex-1 bg-transparent border-2 border-[#7C7C7C] text-white placeholder-gray-400 rounded p-3 focus:outline-none focus:border-white transition-all duration-200"
            />
          </div>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1ED760] hover:bg-[#1fdf64] text-black font-bold py-3 px-8 rounded-full transition-all duration-200 hover:scale-105 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando código..." : "Continuar"}
          </button>
        </form>

        {/* Separador */}
        <div className="flex items-center my-4">
          <span className="text-white text-base text-center">o</span>
        </div>

        {/* Botón correo */}
        <button
          onClick={() => navigate("/login")}
          className="w-full border border-[#7C7C7C] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 mb-2 pr-8 py-3 pl-7 hover:scale-105"
        >
          <MdEmail size={24} />
          <span className="w-full text-center">Continuar con correo</span>
        </button>

        <button
          onClick={handleGoogle}
          className="w-full border border-[#7C7C7C] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 mb-2 pr-8 py-3 pl-7 hover:scale-105"
        >
          <FcGoogle size={24} />
          <span className="w-full text-center text-base">Continuar con Google</span>
        </button>

        {/* <button className="w-full border border-[#7C7C7C] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 pr-8 py-3 mb-2 pl-7 hover:scale-105">
          <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
            <FaFacebook className="text-[#1877F2] w-7 h-7" />
          </div>
          <span className="w-full text-center text-base">Continuar con Facebook</span>
        </button> */}

        <button className="w-full border border-[#7C7C7C] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 pr-8 py-3 pl-7 hover:scale-105">
          <FaApple size={24} />
          <span className="w-full text-center text-base">Continuar con Apple</span>
        </button>

        {/* ¿No tienes cuenta? */}
        <div className="text-center mt-10">
          <p className="text-[#B3B3B3] text-base mb-3">¿No tienes cuenta?</p>
          <button
            onClick={() => navigate("/register")}
            className="text-white font-bold text-base transition-all duration-200 py-2 hover:scale-105"
          >
            Regístrate
          </button>
        </div>
      </div>

      {/* Footer */}
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
