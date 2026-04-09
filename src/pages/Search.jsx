import { BiSearch } from "react-icons/bi";
import Encabezado from "../components/Encabezado";
import { useEffect, useState } from "react";

export default function Search() {

    const [datoImagen, setDatoImagen] = useState([]);

    useEffect(() => {
        const fetchDato = async () => {
            try {
                const res = await fetch("https://rickandmortyapi.com/api/character");
                const data = await res.json();
                setDatoImagen(data.results);
            } catch (error) {
                console.error("Error al obtener los datos:", error);
            }
        }
        fetchDato();
    }, []);


    return (
        <div className="w-full">
            <Encabezado />
            <div className="px-4 pt-5 pb-20 w-full">
                <button className="flex items-center gap-2 w-full"><BiSearch size={24} className="cursor-pointer" />¿Qué quieres escuchar?</button>

                <div className="mt-4 flex flex-col gap-4">
                    <h2 className="text-white text-xl font-bold">Descubre algo nuevo para ti</h2>
                    <div className="w-full overflow-hidden">
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" >
                            {datoImagen.map((item) => (
                                <div key={item.id} className="min-w-40 w-40 cursor-pointer relative shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full rounded-lg" />
                                    <div className="absolute bottom-0 left-0 w-full bg-black p-1 opacity-55 rounded-b-lg">
                                        <h3 className="text-white font-bold ">#{item.name}</h3>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>

                    <h2 className="text-white text-xl font-bold">Explorar todo</h2>

                    {/* <div className="grid grid-cols-2 w-full gap-4">
                        {datoImagen.map((item) => (
                            <div key={item.id} className="w-40 h-50 cursor-pointer relative shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full rounded-lg" />
                                <div className="absolute bottom-0 left-0 w-full bg-black p-1 opacity-55 rounded-b-lg">
                                    <h3 className="text-white font-bold ">#{item.name}</h3>
                                </div>

                            </div>
                        ))}

                    </div> */}
                </div>


            </div>

        </div>
    )
}