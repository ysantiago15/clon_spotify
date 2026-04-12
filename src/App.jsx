// prueba git
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router/AppRouter";
import '../src/style/tailwind.css';

function App() {
  return (
    <AuthProvider>
      <div className="w-screen h-screen bg-black overflow-x-hidden">
        <AppRouter />
      </div>
    </AuthProvider>
  );
}

export default App;
