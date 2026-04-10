
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { loginWithSpotify, needsReauth, clearSpotifyCache } from "../config/spotify";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        const pendingSpotify = sessionStorage.getItem("spotify_oauth_pending");

        // needsReauth() devuelve true si no hay token O si los scopes son viejos
        if (needsReauth() && !pendingSpotify) {
          sessionStorage.setItem("spotify_oauth_pending", "1");
          loginWithSpotify();
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_token_expiry");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_scopes_version");
    sessionStorage.removeItem("spotify_oauth_pending");
    clearSpotifyCache();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
