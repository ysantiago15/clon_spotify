import { Link } from "react-router-dom";

export default function BarraFooter() {

    return (
        <div className="px-2 pb-2 w-full h-16.5">
            <Link to="/register">
                <div className="bg-linear-to-r from-purple-600 via-purple-500 to-blue-500 rounded-lg pl-4 pr-6 pt-2 pb-2 flex justify-between items-center cursor-pointer">
                    <div className="">
                        <p className="text-sm font-bold text-white">Muestra de Spotify</p>
                        <p className="text-base font-normal text-white">Regístrate para acceder a canciones y podcasts ilimitados con algunos anuncios. No necesitas tarjeta de crédito.</p>
                    </div>
                        <button className="bg-white text-black text-base font-bold px-8 py-3 rounded-full transition-transform duration-300 hover:scale-105 whitespace-nowrap">
                            Regístrate gratis
                        </button>
                </div>
            </Link>
        </div>
    )
}