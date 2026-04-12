
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Páginas
import Home             from "../pages/Home";
import Login            from "../pages/Login";
import Login2           from "../pages/Login2";
import LoginContraseña  from "../pages/LoginContraseña";
import Register         from "../pages/Register";
import Callback         from "../pages/Callback";
import Crear            from "../pages/Crear";
import LoginTelefono from "../pages/LoginTelefono";
import LoginCodigo from "../pages/LoginCodigo";

// ── Loading ───────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="w-screen h-screen bg-[#121212] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#1ED760] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#B3B3B3] text-sm">Cargando...</span>
      </div>
    </div>
  );
}

// ── Solo si NO hay sesión (login / register) ──────────────────────────────────
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/" replace /> : children;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<Home />} />

        <Route path="/login"              element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/login2"             element={<PublicOnlyRoute><Login2 /></PublicOnlyRoute>} />
        <Route path="/login_contrasena"   element={<PublicOnlyRoute><LoginContraseña /></PublicOnlyRoute>} />
        <Route path="/register"           element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/login_telefono" element={<PublicOnlyRoute><LoginTelefono /></PublicOnlyRoute>} />
        <Route path="/login_codigo"   element={<PublicOnlyRoute><LoginCodigo /></PublicOnlyRoute>} />

        <Route path="/callback"           element={<Callback />} />
        <Route path="/crear"              element={<Crear />} />
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
