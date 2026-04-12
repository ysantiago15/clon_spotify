import { useRef, useState, useEffect } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "../config/firebaseConfig";

export default function LoginCodigo() {
  const [smsCode, setSmsCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [hoverEtiqueta, setHoverEtiqueta] = useState(false);
  const [hoverEtiqueta2, setHoverEtiqueta2] = useState(false);

  const digitRefs = useRef([]);
  const recaptchaRef = useRef(null);
  const recaptchaVerifier = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const telefono = location.state?.telefono ?? "";

  useEffect(() => {
    digitRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const vId = location.state?.verificationId;
    if (vId) setVerificationId(vId);
  }, [location.state]);

  // ── Cajitas — igual que Register ─────────────────────────────────────────────
  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...smsCode];
    newCode[index] = digit;
    setSmsCode(newCode);
    setError("");
    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
    // Auto-submit al completar el último dígito
    if (digit && index === 5) {
      const code = newCode.join("");
      if (code.length === 6) autoVerify(code);
    }
  };

  const autoVerify = async (code) => {
    setError("");
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      navigate("/");
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-verification-code":
          setError("Código incorrecto. Verifica e intenta de nuevo."); break;
        case "auth/code-expired":
          setError("El código expiró. Vuelve atrás y solicita uno nuevo."); break;
        default:
          setError("No se pudo verificar el código. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace" && !smsCode[index] && index > 0)
      digitRefs.current[index - 1]?.focus();
  };

  // ── Reenviar ──────────────────────────────────────────────────────────────────
  const handleReenviar = async () => {
    setError("");
    setSmsCode(["", "", "", "", "", ""]);
    if (recaptchaVerifier.current) {
      recaptchaVerifier.current.clear();
      recaptchaVerifier.current = null;
    }
    setLoading(true);
    try {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: "invisible" });
      const provider = new PhoneAuthProvider(auth);
      const vId = await provider.verifyPhoneNumber(telefono, recaptchaVerifier.current);
      setVerificationId(vId);
      digitRefs.current[0]?.focus();
    } catch (err) {
      switch (err.code) {
        case "auth/too-many-requests":
          setError("Demasiados intentos. Espera unos minutos e intenta de nuevo."); break;
        case "auth/captcha-check-failed":
          setError("Falló la verificación de seguridad. Recarga la página.");
          recaptchaVerifier.current = null; break;
        default:
          setError("No se pudo reenviar el SMS. Intenta de nuevo.");
          recaptchaVerifier.current = null;
      }
    } finally { setLoading(false); }
  };

  // ── Verificar código ──────────────────────────────────────────────────────────
  const handleVerifySms = async (e) => {
    e.preventDefault();
    setError("");
    const code = smsCode.join("");
    if (code.length !== 6) { setError("El código debe tener 6 dígitos."); return; }
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      navigate("/");
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-verification-code":
          setError("Código incorrecto. Verifica e intenta de nuevo."); break;
        case "auth/code-expired":
          setError("El código expiró. Vuelve atrás y solicita uno nuevo."); break;
        default:
          setError("No se pudo verificar el código. Intenta de nuevo.");
      }
    } finally { setLoading(false); }
  };

  return (
    <main className="bg-[#121212] min-h-screen max-w-screen">
      <span ref={recaptchaRef} style={{ display: "none" }} />
      <div className="flex flex-col h-screen overflow-hidden px-6 md:px-8 w-full md:w-97 md:mx-auto">

        {/* Botón volver — igual que Register paso 4 */}
        <div className="pt-6 pb-6 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate("/login_telefono")}
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#B3B3B3] hover:text-white transition-colors duration-200"
          >
            <FiChevronLeft size={28} className="-ml-2" />
          </button>
        </div>

        {/* Contenido — igual que Register paso 4 */}
        <div className="flex-1 flex flex-col justify-start">
          <form onSubmit={handleVerifySms} className="flex flex-col gap-6">

            {/* Título — igual que Register */}
            <p className="text-white text-2xl font-bold leading-snug">
              Escribe el código de 6 dígitos que te hemos enviado a {telefono}
            </p>

            {/* Cajitas — igual que Register */}
            <div className="flex gap-2 justify-start">
              {smsCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (digitRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  className="w-12 h-14 bg-transparent border-2 border-[#7C7C7C] text-white text-xl font-bold text-center rounded focus:outline-none focus:border-white transition-colors"
                />
              ))}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {/* Reenviar — igual que Register */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleReenviar}
                disabled={loading}
                className="w-fit border border-[#7C7C7C] text-white text-sm font-bold px-5 py-2 rounded-full hover:border-white transition-all duration-200 disabled:opacity-60"
              >
                Reenviar código
              </button>
            </div>

            {/* Iniciar sesión — igual que Register */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1ED760] hover:bg-[#1fdf64] text-black font-bold py-3 px-8 rounded-full transition-all duration-200 hover:scale-105 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Verificando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>

        {/* Footer — igual que Register */}
        <div className="pb-6 pt-4 text-center text-[#B3B3B3] text-xs flex-shrink-0">
          <p>Este sitio está protegido por reCAPTCHA. Se aplican los{" "}
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
      </div>
    </main>
  );
}
