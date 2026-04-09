import { FaSpotify } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Login2() {

    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email;

    function ocultarEmail(email) {
        if (!email) return "";

        const [usuario, dominio] = email.split("@");

        // ocultar usuario (parte antes del @)
        const usuarioOculto =
            usuario[0] +
            "*".repeat(4) +
            usuario[usuario.length - 1];

        // ocultar dominio parcialmente
        const [nombreDominio, extension] = dominio.split(".");
        const dominioOculto =
            nombreDominio[0] +
            "*" +
            nombreDominio[nombreDominio.length - 1];

        return `${usuarioOculto}@${dominioOculto}.${extension}.`;
    }

    const emailOculto = ocultarEmail(email);

    // const handleSubmit = (e) => {
    //     e.preventDefault();

    //     if (!email) return; // validación básica

    //     navigate("/login_contrasena", { state: { email } });
    // };
    return (
        <main className="pt-8 px-4 flex flex-col bg-[#121212] h-screen max-w-screen">
            <div className="w-full h-full flex flex-col justify-between">
                {/* logo de spotify */}
                <div className="text-white mb-12">
                    <FaSpotify size={24} />
                </div>

                <div className="w-full flex items-center justify-center">
                    <div className="py-6 px-6 flex flex-col items-center justify-center w-95 text-white">
                        <div>
                            <span className="text-2xl font-bold">Escribe el código de 6 dígitos que te hemos enviado a <span>{emailOculto}</span></span>
                        </div>

                        <div className="mt-6 mb-8 w-full flex flex-col gap-5 items-center">
                            <div className="flex w-full justify-between ">
                                <input type="number" className="text-3xl text-center font-bold border border-white rounded-sm w-11 h-13 focus:ring-3 focus:ring-white focus:border-transparent outline-none" />
                                <input type="number" className="text-3xl text-center font-bold border border-white rounded-sm w-11 h-13 focus:ring-3 focus:ring-white focus:border-transparent outline-none" />
                                <input type="number" className="text-3xl text-center font-bold border border-white rounded-sm w-11 h-13 focus:ring-3 focus:ring-white focus:border-transparent outline-none" />
                                <input type="number" className="text-3xl text-center font-bold border border-white rounded-sm w-11 h-13 focus:ring-3 focus:ring-white focus:border-transparent outline-none" />
                                <input type="number" className="text-3xl text-center font-bold border border-white rounded-sm w-11 h-13 focus:ring-3 focus:ring-white focus:border-transparent outline-none" />
                                <input type="number" className="text-3xl text-center font-bold border border-white rounded-sm w-11 h-13 focus:ring-3 focus:ring-white focus:border-transparent outline-none" />
                            </div>
                            <button  className="py-0.75 px-3.75 border border-[#7C7C7C] rounded-full text-sm font-bold hover:scale-105 hover:border-2 transition-all duration-200">Reenviar código</button>
                        </div>

                        <div className="w-full">
                            <button className="w-full bg-[#1ED760] hover:bg-[#3BE477] text-black font-bold py-3 px-8 rounded-full transition-colors duration-200 text-base">Iniciar sesión</button>
                        </div>

                        <div className="mt-12">
                            <Link to="/login_contrasena" state={{ email }}>
                                <button className="py-2 text-base font-bold hover:scale-105">Iniciar sesión con contraseña</button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="w-full pb-6 pr-6 text-right">
                    <span className="text-white text-right text-base font-semibold"><small>© 2026 Spotify AB</small></span>
                </div>
            </div>
        </main >
    )
}