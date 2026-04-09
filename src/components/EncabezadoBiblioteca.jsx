import { AiOutlinePlus } from "react-icons/ai";
import { BiSearch } from "react-icons/bi";

export default function EncabezadoBiblioteca() {
    return (
        <div className="flex w-full justify-between items-center text-white font-bold text-xl">
            <h2>Tu biblioteca</h2>
            <div className="flex gap-4 items-center">
                <BiSearch size={24} className="cursor-pointer"/>
                <AiOutlinePlus size={24} className="cursor-pointer"/>
            </div>

        </div>
    )
}