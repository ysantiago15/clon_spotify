import { Link } from "react-router-dom";

export default function SpotifyModal({ isOpen, onClose, data }) {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col gap-6 items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="flex justify-between items-center relative z-10 w-202.5 mx-4 rounded-2xl overflow-hidden shadow-2xl p-16" onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(135deg, #8B1A1A 0%, #2a0a0a 60%, #1a1a1a 100%)",}}>
                <div>
                    <img src={data.image} alt={data.name} className="w-75 h-75 sm:h-full object-cover"/>
                </div>
                <div className="text-center ">
                    <h2 className="text-white text-3xl font-extrabold leading-tight mb-6">
                        Empieza a escuchar<br />con una cuenta gratis<br />de Spotify
                    </h2>

                    <Link to="/register">
                        <button to="/register" className=" py-3 px-6 rounded-full bg-[#1DB954] text-black font-bold text-base hover:scale-105 hover:bg-[#1ed760] transition-all duration-200 mb-6">
                            Registrarse gratis
                        </button>
                    </Link>

                    <button to="/login"  className=" py-3 px-6 rounded-full border border-white/60 text-white font-bold text-base hover:border-white hover:scale-105 transition-all duration-200 bg-transparent mb-6">
                        Descargar aplicación
                    </button>

                    <p className="text-white/70 text-sm">
                        ¿Ya tienes una cuenta?{" "}
                        <Link to="/login">
                            <span className="text-white font-bold underline cursor-pointer hover:text-[#1DB954] transition-colors">
                                Iniciar sesión
                            </span>
                        </Link>
                    </p>
                </div>
            </div>
            <div>
                <button onClick={onClose} className="text-white/80 font-semibold text-base hover:text-white transition-all duration-200 hover:scale-105 tracking-wide px-8 py-2">
                    Cerrar
                </button>
            </div>
        </div>
    
    );
}