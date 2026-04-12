
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import app from './config/firebaseConfig.js'

if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = "140470e9-7811-43a9-aaf6-b2ffe1e4ba7d";
}

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY),
  isTokenAutoRefreshEnabled: true
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
