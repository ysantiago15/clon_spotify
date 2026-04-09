import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeCode, clearSpotifyCache } from '../config/spotify'

export default function Callback() {
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      exchangeCode(code).then(() => {
        // Token guardado: limpiamos la bandera y los caches
        sessionStorage.removeItem("spotify_oauth_pending")
        clearSpotifyCache()
        navigate('/')
      })
    }
  }, [])

  return (
    <div className="w-screen h-screen bg-[#121212] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#1ED760] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#B3B3B3] text-sm">Conectando con Spotify...</span>
      </div>
    </div>
  )
}
