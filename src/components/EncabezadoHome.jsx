import { useState } from "react"

export default function EncabezadoHome() {
    const [tabActivo, setTabActive] = useState("");
    return (
        <div className="flex gap-2">
            
            <div onClick={() => setTabActive("Todas")} className={`px-5 py-1.5 rounded-full cursor-pointer transition-colors ${tabActivo === "Todas" || tabActivo === "" ? "text-black bg-green-500" : "text-white bg-gray-800"}`}>Todas</div>

            <div className={`flex items-center rounded-full overflow-hidden ${tabActivo === "Siguiendo" ? "bg-green-600" : "bg-gray-800"}`}>
                <span onClick={() => setTabActive(tabActivo === "Siguiendo" ? "Todas" : "Musica")} className={`px-4 py-1.5 cursor-pointer rounded-full transition-colors duration-200 ${tabActivo === "Musica" || tabActivo === "Siguiendo" ? "text-black bg-green-500" : "text-white"}`} >Música</span>

                <span onClick={()=>setTabActive("Siguiendo")} className={`py-1.5  rounded-full cursor-pointer transition-all duration-300 ease-in-out ${tabActivo === "Siguiendo"
                            ? "max-w-25 opacity-100 pr-4 text-black  px-4"
                            : tabActivo === "Musica"
                            ? "max-w-25 opacity-100 px-4 text-white"
                            : "max-w-0 opacity-0 pr-0 text-white"}`}>Siguiendo</span>
                {console.log(tabActivo)}
            </div>

            <div className={`flex items-center rounded-full overflow-hidden ${tabActivo === "SiguiendoPC" ? "bg-green-600" : "bg-gray-800"}`}>
                <span onClick={() => setTabActive(tabActivo === "SiguiendoPC" ? "Todas" : "Podcast")} className={`px-4 py-1.5 cursor-pointer rounded-full transition-colors duration-200 ${tabActivo === "Podcast" || tabActivo === "SiguiendoPC" ? "text-black bg-green-500" : "text-white"}`} >Podcasts</span>

                <span onClick={()=>setTabActive("SiguiendoPC")} className={`py-1.5  rounded-full cursor-pointer transition-all duration-300 ease-in-out ${tabActivo === "SiguiendoPC"
                            ? "max-w-25 opacity-100 pr-4 text-black  px-4"
                            : tabActivo === "Podcast"
                            ? "max-w-25 opacity-100 px-4 text-white"
                            : "max-w-0 opacity-0 pr-0 text-white"}`}>Siguiendo</span>
                {console.log(tabActivo)}
            </div>
        </div>
    )
}
