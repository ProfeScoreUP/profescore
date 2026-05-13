import { Routes, Route } from "react-router-dom";
import { AppContext, useAppData } from "./context";
import Sidebar from "./Sidebar";
import HomePage from "./pages/Home";
import MateriasPage from "./pages/Materias";
import ProfesoresPage from "./pages/Profesores";
import ProfesorPage from "./pages/Profesor";
import ForoPage from "./pages/Foro";
import HiloPage from "./pages/Hilo";
import ComunidadPage from "./pages/Comunidad";
import PerfilPage from "./pages/Perfil";
import MensajesPage from "./pages/Mensajes";
import AcercaPage from "./pages/Acerca";
import MisResenasPage from "./pages/MisResenas";
import "./App.css";

export default function App() {
  const appData = useAppData();

  return (
    <AppContext.Provider value={appData}>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <div className="inner">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/materias" element={<MateriasPage />} />
              <Route path="/profesores" element={<ProfesoresPage />} />
              <Route path="/profesor/:id" element={<ProfesorPage />} />
              <Route path="/foro" element={<ForoPage />} />
              <Route path="/foro/:id" element={<HiloPage />} />
              <Route path="/comunidad" element={<ComunidadPage />} />
              <Route path="/perfil/:id" element={<PerfilPage />} />
              <Route path="/mensajes" element={<MensajesPage />} />
              <Route path="/mensajes/:userId" element={<MensajesPage />} />
              <Route path="/acerca" element={<AcercaPage />} />
              <Route path="/mis-resenas" element={<MisResenasPage />} />
              <Route path="/mis-comentarios" element={<MisResenasPage tipo="comentarios" />} />
              <Route path="/resenas-votadas" element={<MisResenasPage tipo="votadas" />} />
            </Routes>
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}