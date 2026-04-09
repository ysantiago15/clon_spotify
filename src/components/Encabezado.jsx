import { useLocation } from "react-router-dom";
import EncabezadoHome from "./EncabezadoHome";
import EncabezadoSearch from "./EncabezadoSearch";
import EncabezadoBiblioteca from "./EncabezadoBiblioteca";


export default function Encabezado() {

    const nombreDeLaRuta = {
        "/": "Inicio",
        "/search": "Buscar",
        "/library": "Tu Biblioteca",
    };

    const { pathname } = useLocation();
    const currentPage = nombreDeLaRuta[pathname] || "Inicio";
    return (
        <header className="flex items-center gap-4 px-4 py-2 w-screen bg-black">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex justify-center items-center text-xl font-bold text-black cursor-pointer"> Y </div>
        {
            currentPage === "Inicio" ? <EncabezadoHome /> : currentPage ==="Buscar" ? <EncabezadoSearch /> : <EncabezadoBiblioteca />
        }
        </header>
    )
}