import { useEffect, useRef, useState } from "react";
import { FaApple, FaMobileAlt, FaSpotify } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebaseConfig";
import { FiChevronLeft } from "react-icons/fi";

export default function Register() {
  const [step, setStep] = useState(1); // 1 = email, 2 = nombre + contraseña
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Estados teléfono ──────────────────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState(["", "", "", "", "", ""]);
  const [verificationId, setVerificationId] = useState("");
  const recaptchaRef = useRef(null);
  const recaptchaVerifier = useRef(null);
  const digitRefs = useRef([]);
  const phoneInputRef = useRef(null);

  const navigate = useNavigate();

  // ── Autofocus según el paso ───────────────────────────────────────────────────
  useEffect(() => {
    if (step === 3) phoneInputRef.current?.focus();
    if (step === 4) digitRefs.current[0]?.focus();
  }, [step]);

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
          setError("Este correo ya tiene una cuenta. ¿Quieres iniciar sesión?");
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
    } catch (err) {
      switch (err.code) {
        case "auth/account-exists-with-different-credential":
          setError("Este correo ya está registrado con otro método (email/contraseña). Inicia sesión con ese método.");
          break;
        case "auth/popup-closed-by-user":
          setError("Cerraste la ventana de Google antes de completar el registro.");
          break;
        case "auth/popup-blocked":
          setError("El navegador bloqueó la ventana emergente. Permite ventanas emergentes e intenta de nuevo.");
          break;
        case "auth/cancelled-popup-request":
          // Silencioso: el usuario abrió otro popup
          break;
        default:
          setError("No se pudo registrar con Google. Intenta de nuevo.");
      }
    }
  };

  // ── Teléfono: enviar SMS ──────────────────────────────────────────────────────
  const handleSendSms = async (e) => {
    e.preventDefault();
    setError("");
    const fullNumber = `+57${phone.trim()}`;
    if (!phone.trim() || phone.trim().length < 7) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }
    setLoading(true);
    try {
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: "invisible",
        });
      }
      const provider = new PhoneAuthProvider(auth);
      const vId = await provider.verifyPhoneNumber(fullNumber, recaptchaVerifier.current);
      setVerificationId(vId);
      setStep(4);
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-phone-number":
          setError("Número de teléfono inválido. Verifica el formato.");
          break;
        case "auth/too-many-requests":
          setError("Demasiados intentos. Espera unos minutos e intenta de nuevo.");
          break;
        case "auth/captcha-check-failed":
          setError("Falló la verificación de seguridad. Recarga la página.");
          recaptchaVerifier.current = null;
          break;
        default:
          setError("No se pudo enviar el SMS. Intenta de nuevo.");
          recaptchaVerifier.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Teléfono: verificar código SMS ───────────────────────────────────────────
  const handleVerifySms = async (e) => {
    e.preventDefault();
    setError("");
    const code = smsCode.join("");
    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      navigate("/");
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-verification-code":
          setError("Código incorrecto. Verifica e intenta de nuevo.");
          break;
        case "auth/code-expired":
          setError("El código expiró. Vuelve atrás y solicita uno nuevo.");
          break;
        default:
          setError("No se pudo verificar el código. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Manejo de cajitas del código ─────────────────────────────────────────────
  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...smsCode];
    newCode[index] = digit;
    setSmsCode(newCode);
    if (digit && index < 5) digitRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace" && !smsCode[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  return (
    <main className="bg-[#121212] min-h-screen max-w-screen">

      {/* ── PASOS 3 y 4: pantalla completa sin scroll, botón volver arriba ── */}
      {(step === 3 || step === 4) && (
        <div className="flex flex-col h-screen overflow-hidden px-6 md:px-8 w-full md:w-97 md:mx-auto">

          {/* Botón volver — círculo con flecha < igual al diseño */}
          <div className="pt-6 pb-6 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                if (step === 3) { setStep(1); setError(""); setPhone(""); }
                if (step === 4) { setStep(3); setError(""); setSmsCode(["", "", "", "", "", ""]); recaptchaVerifier.current = null; }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#B3B3B3] hover:text-white transition-colors duration-200"
            >
              <FiChevronLeft size={28} className="-ml-2" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 flex flex-col justify-start">

            {/* ── PASO 3: número de teléfono ── */}
            {step === 3 && (
              <form onSubmit={handleSendSms} className="flex flex-col gap-6">
                <label className="text-white text-sm font-bold block">
                  Número de teléfono
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center bg-transparent border-2 border-[#7C7C7C] rounded px-3 py-3 text-white font-bold whitespace-nowrap">
                    +57
                  </div>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="numeric"
                    placeholder="3001234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 bg-transparent border-2 border-[#7C7C7C] text-white placeholder-gray-400 rounded p-3 focus:outline-none focus:border-white"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div ref={recaptchaRef} />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1ED760] hover:bg-[#1fdf64] text-black font-bold py-3 px-8 rounded-full transition-all duration-200 hover:scale-105 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Enviando SMS..." : "Continuar"}
                </button>
              </form>
            )}

            {/* ── PASO 4: código SMS — 6 cajitas ── */}
            {step === 4 && (
              <form onSubmit={handleVerifySms} className="flex flex-col gap-6">
                <p className="text-white text-2xl font-bold leading-snug">
                  Escribe el código de 6 dígitos que te hemos enviado a +57{phone}
                </p>

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

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => { setStep(3); setError(""); setSmsCode(["", "", "", "", "", ""]); recaptchaVerifier.current = null; }}
                    className="w-fit border border-[#7C7C7C] text-white text-sm font-bold px-5 py-2 rounded-full hover:border-white transition-all duration-200"
                  >
                    Reenviar código
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1ED760] hover:bg-[#1fdf64] text-black font-bold py-3 px-8 rounded-full transition-all duration-200 hover:scale-105 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Verificando..." : "Iniciar sesión"}
                </button>
              </form>
            )}
          </div>

          {/* Footer fijo abajo */}
          <div className="pb-6 pt-4 text-center text-[#B3B3B3] text-xs flex-shrink-0">
            <p>Este sitio está protegido por reCAPTCHA. Se aplican los{" "}
              <a href="#" style={{ textDecoration: "underline", textDecorationColor: "#B3B3B3" }} className="hover:text-gray-300">Términos del servicio</a>{" "}
              y la{" "}
              <a href="#" style={{ textDecoration: "underline", textDecorationColor: "#B3B3B3" }} className="hover:text-gray-300">Política de privacidad</a>{" "}
              de Google.
            </p>
          </div>
        </div>
      )}

      {/* ── PASOS 1 y 2: código original intacto ── */}
      {(step === 1 || step === 2) && (
        <div className="pt-8 md:pt-24 flex flex-col items-center justify-center bg-[#121212] min-h-screen max-w-screen">
          <div className="px-6 md:px-8 min-h-screen flex flex-col items-center w-full md:w-97">

            <div className="text-white pb-2">
              <FaSpotify size={32} />
            </div>

            <h1 className="text-white text-[40px] md:text-[40px] font-bold text-center mb-8">
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

                <button
                  onClick={() => { setError(""); setStep(3); }}
                  className="w-full border border-[#7C7C7C] text-white font-bold pr-8 py-2 pl-7 rounded-full flex items-center justify-center gap-3 hover:border-white transition-all duration-200 mb-2 hover:scale-105"
                >
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
        </div>
      )}
    </main>
  );
}