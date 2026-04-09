import { useEffect, useRef, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { BiGlobe } from "react-icons/bi";
import { BsCircleFill } from "react-icons/bs";
import { FiFolder, FiGlobe, FiPlus } from "react-icons/fi";
import { IoMusicalNotesOutline } from "react-icons/io5";
import { MdContrast, MdFolderOpen, MdLanguage, MdLibraryAdd, MdPlaylistAdd } from "react-icons/md";
import { TbCircleHalf2, TbWorld } from "react-icons/tb";

export default function Biblioteca() {

    const [mostrarTooltip, setMostrarTooltip] = useState("");
    const [menuCrear, setMenuCrear] = useState(false);
    const [modalCrearPlaylist, setModalCrearPlaylist] = useState(false);
    const menuRef = useRef(null);
    const modalCrearPlayRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuCrear(false);
            }
            if (modalCrearPlayRef.current && !modalCrearPlayRef.current.contains(e.target)) {
                setModalCrearPlaylist(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (

        <div className="bg-[#121212] w-149 h-136 rounded-lg spotify-scroll" onMouseEnter={(e) => e.currentTarget.classList.add('scrollbar-visible')}
  onMouseLeave={(e) => e.currentTarget.classList.remove('scrollbar-visible')}>
            <header className="flex items-center justify-between px-4 pt-4 pb-1 h-18">
                <p className="text-base font-bold text-white">Tu biblioteca</p>
                <div ref={menuRef} className="relative">
                    <button onMouseEnter={() => setMostrarTooltip("Crear")} onMouseLeave={() => setMostrarTooltip("")} className="flex group items-center gap-2 text-white text-sm  transition-colors duration-300 font-bold bg-[#1F1F1F] py-2 px-4 hover:bg-[#2b2b2b] rounded-3xl " onClick={() => setMenuCrear(!menuCrear)}><FiPlus className={`text-2xl text-gray-300 group-hover:text-white transition-all duration-150 focus:outline-none ${menuCrear ? "rotate-45" : "rotate-0"}`} />Crear</button>
                    {mostrarTooltip === "Crear" && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#3b3b3b] text-white font-bold text-sm px-2 py-1 rounded whitespace-nowrap">
                            Crea una playlist, carpeta o jam.
                        </span>
                    )}

                    {menuCrear && (<div className="absolute top-12 left-0 bg-[#282828] p-0.5 rounded-lg w-119.5 z-99">
                        <div className="group p-2 hover:bg-[#3D3D3D] hover:rounded-lg flex items-center gap-3 transition-all duration-200 cursor-default">
                            <div className="relative text-2xl h-12 w-12 bg-[#505050] rounded-full flex items-center justify-center transition-colors duration-150 text-white">
                                <IoMusicalNotesOutline size={26} className="group-hover:text-[#1FD460] transition-all duration-200 group-hover:rotate-12" />
                                <AiOutlinePlus className="absolute bg-[#505050] rounded-full top-2.75 left-3 text-[13px] font-black group-hover:text-[#1FD460] transition-all duration-200 group-hover:rotate-12" />
                            </div>

                            <div>
                                <span className="text-base font-bold text-white">Playlist</span>
                                <p className="text-[#B3B3B3] text-sm">Crea una playlist con canciones o episodios</p>

                            </div>
                        </div>

                        <div className="group p-2 hover:bg-[#3D3D3D] hover:rounded-lg flex items-center gap-3 transition-all duration-200 cursor-default">
                            <div className="relative text-2xl h-12 w-12 bg-[#505050] rounded-full flex items-center justify-center text-white transition-colors duration-150">
                                <BsCircleFill className="opacity-60 text-[17.5px] absolute top-3 right-3 group-hover:text-[#1FD460] transition-all duration-200 group-hover:text-[18.5px] group-hover:opacity-50 group-hover:right-2.5" />
                                <BsCircleFill className="absolute left-3 top-5 opacity-60 text-[17.5px] group-hover:text-[#1FD460] transition-all duration-200 group-hover:text-[18.5px] group-hover:opacity-50 group-hover:left-2.5" />
                            </div>
                            <div>
                                <span className="text-base font-bold text-white">Fusión</span>
                                <p className="text-[#B3B3B3] text-sm">Combina los gustos de tus personas favoritas en una playlist</p>
                            </div>
                        </div>

                        <div className="px-6 py-2">
                            <div className="w-full h-[0.1px] bg-[#B3B3B3]" >
                            </div>
                        </div>

                        <div className="group p-2 hover:bg-[#3D3D3D] hover:rounded-lg flex items-center gap-3 transition-all duration-200 cursor-default">
                            <div className="relative text-2xl h-12 w-12 bg-[#505050] rounded-full flex items-center justify-center text-white transition-colors duration-150">
                                <FiFolder size={26} className="group-hover:text-[#1FD460] transition-all duration-200 group-hover:rotate-12" />
                            </div>
                            <div>
                                <span className="text-base font-bold text-white">Carpeta</span>
                                <p className="text-[#B3B3B3] text-sm">Organiza tus playlists</p>
                            </div>
                        </div>
                    </div>)
                    }



                </div>

            </header>

            <div className="relative" ref={modalCrearPlayRef}>
                <div className=" flex flex-col px-2 pb-2 h-65 overflow-y-auto">
                    <div className=" bg-[#1f1f1f] justify-start text-white px-5 py-4 font-bold my-2 rounded-lg">
                        <div className="flex flex-col gap-2">
                            <span className="text-base">Crea tu primera playlist</span>
                            <span className="text-sm">¡Es muy fácil! Te vamos a ayudar</span>
                        </div>

                        <button className="text-sm bg-white text-black px-4 py-1.5 rounded-full hover:scale-105 transition-transform mt-5" onClick={() => setModalCrearPlaylist(!modalCrearPlaylist)}>Crear playlist</button>

                        {
                            modalCrearPlaylist && (
                                <div className="absolute top-0 left-110 z-20 flex ">
                                    <div className="relative">
                                        <div className="absolute bottom-12 -left-2.5 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-10 border-r-[#0C69D8]" />
                                        <div className="bg-[#0C69D8] w-83 h-34.5 p-4 rounded-lg">
                                            <p className="text-base font-bold mb-1">Crea una playlist</p>
                                            <p className="text-sm font-medium">Inicia sesión para crear y compartir playlists.</p>
                                            <div className="mt-6 flex justify-end gap-4">
                                                <button onClick={()=>setModalCrearPlaylist(false)} className="text-sm transition-all duration-200 hover:scale-103">Ahora no</button>
                                                <button className="bg-white text-black py-1.5 px-4 rounded-full text-sm transition-all duration-200 hover:scale-103">Iniciar sesión</button>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )
                        }

                    </div>

                    <div className="bg-[#1f1f1f] text-white px-5 py-4 font-bold my-2 rounded-lg">
                        <div className="flex flex-col gap-2">
                            <span className="text-base">Busquemos algunos podcasts para seguir</span>
                            <span className="text-sm">te mantendremos al tanto de los nuevos episodios.</span>
                        </div>

                        <button className="text-sm bg-white text-black px-4 py-1.5 rounded-full hover:scale-105 transition-transform mt-5">Explorar podcasts</button>
                    </div>
                </div>

                {/* footer */}
                <div className="px-6">
                    <div className="my-8 flex flex-col gap-4">
                        <div className=" text-[11px] text-gray-400 flex gap-4 flex-wrap">
                            <span className="cursor-pointer">Legal</span>
                            <span className="cursor-pointer">Seguridad y Centro de Privacidad</span>
                            <span className="cursor-pointer">Política de Privacidad</span>
                            <span className="cursor-pointer">Cookies</span>
                            <span className="cursor-pointer">Sobre los anuncios</span>
                            <span className="cursor-pointer">Accesibilidad</span>
                        </div>
                        <a href="#" className="text-xs text-white">Cookies</a>
                    </div>
                    <div className="mb-8">
                        <button className="flex gap-2 text-white text-sm items-center font-normal py-1 px-3 border border-white rounded-full  transition-transform duration-300 hover:scale-103 hover:border-2">
                            <FiGlobe className="text-base" />
                            Español de Latinoamérica
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}




























