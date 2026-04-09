import { BsCamera, BsCameraFill, BsCameraVideo } from "react-icons/bs";
import { FaCamera } from "react-icons/fa";

export default function EncabezadoSearch() {
    return (
        <div className="flex w-full justify-between text-white font-bold">
            <h2 className="text-xl ">Buscar</h2>
            <BsCamera size={24} className="cursor-pointer"/>
        </div>
    )
}