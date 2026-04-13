import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ← NUEVO

const firebaseConfig = {
  apiKey: "AIzaSyDzAncGXK3RiCIZD4kFsbFTjXKhY4vLosU",
  authDomain: "spotify-clone-b8419.firebaseapp.com",
  projectId: "spotify-clone-b8419",
  storageBucket: "spotify-clone-b8419.firebasestorage.app",
  messagingSenderId: "805970459634",
  appId: "1:805970459634:web:0345a9df7f1caf4ef3896b"
};

const app = initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const storage        = getStorage(app);        // ← NUEVO
export const googleProvider = new GoogleAuthProvider();

export default app;
