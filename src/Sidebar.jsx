import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp, UP_LOGO, Avatar, initials, randomUsername, timeAgo } from "./context";
import AuthModal from "./modals/AuthModal";
import UsernameModal from "./modals/UsernameModal";

export default function Sidebar() {
  const { session, perfil, unreadCount, actividadReciente, profesores, hilos, darkMode, toggleDark, handleLogout } = useApp();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [showUsername, setShowUsername] = useState(false);

  function tipoIcon(tipo) {
    if(tipo==="reseña") return "⭐";
    if(tipo==="comentario") return "💬";
    if(tipo==="hilo") return "📝";
    if(tipo==="respuesta") return "↩️";
    return "•";
  }

  return (
    <>
      <div className="sidebar">
<div className="sidebar-logo" onClick={() => navigate("/")} style={{cursor:"pointer"}}>
  <div className="sidebar-logo-row">
            <img src="/logo.svg" alt="ProfeScore" className="sidebar-logo-img"/>
            <div>
              <div className="logo" style={{fontSize:16}}><div className="dot"/>ProfeScore</div>
              <div className="subtitle">Universidad de Palermo</div>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Explorar</div>
          {[["/materias","📚","Materias"],["/profesores","👨‍🏫","Profesores"],["/foro","💬","Foro"],["/comunidad","👥","Comunidad"],["/acerca","ℹ️","Acerca de"]].map(([path,icon,label])=>(
            <NavLink key={path} to={path} className={({isActive})=>`sidebar-item${isActive?" active":""}`} style={{textDecoration:"none"}}>
              <span className="icon">{icon}</span>{label}
            </NavLink>
          ))}
        </div>

        {session&&<div className="sidebar-section">
          <div className="sidebar-section-title">Mi actividad</div>
          {[
            ["/mensajes","✉️","Mensajes",unreadCount],
            ["/mis-resenas","✍️","Mis reseñas",0],
            ["/mis-comentarios","💬","Mis comentarios",0],
            ["/resenas-votadas","👍","Reseñas votadas",0],
          ].map(([path,icon,label,badge])=>(
            <NavLink key={path} to={path} className={({isActive})=>`sidebar-item${isActive?" active":""}`} style={{textDecoration:"none"}}>
              <span className="icon">{icon}</span>{label}
              {badge>0&&<span className="sidebar-badge">{badge}</span>}
            </NavLink>
          ))}
        </div>}

        <div className="sidebar-section">
          <div className="sidebar-section-title">Actividad reciente</div>
          {actividadReciente.slice(0,6).map((a,i)=>(
            <button key={i} className="sidebar-item" style={{fontSize:12,padding:"6px 1.25rem",alignItems:"flex-start",gap:6}} onClick={()=>{
              if(a.profId) navigate(`/profesor/${a.profId}`);
              else if(a.hiloId) navigate(`/foro/${a.hiloId}`);
            }}>
              <span style={{fontSize:13,flexShrink:0}}>{tipoIcon(a.tipo)}</span>
              <div style={{minWidth:0}}>
                <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:150,color:"var(--text2)"}}>{a.texto}</div>
                <div style={{color:"var(--text4)",fontSize:10}}>{timeAgo(a.ts)}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="dark-toggle">
            <span>{darkMode?"🌙 Modo oscuro":"☀️ Modo claro"}</span>
            <button className={`toggle-switch${darkMode?" on":""}`} onClick={toggleDark}/>
          </div>
          {session?(
            <div>
              <div className="sidebar-user-info" onClick={()=>perfil&&navigate(`/perfil/${session.user.id}`)}>
                <div className="sidebar-avatar">{perfil?.foto_url?<img src={perfil.foto_url} alt={perfil.username}/>:(perfil?.username?initials(perfil.username):"?")}</div>
                <div><div className="sidebar-username">{perfil?.username?`@${perfil.username}`:"Sin nombre"}</div>{perfil?.carrera&&<div className="sidebar-carrera">{perfil.carrera}</div>}</div>
              </div>
              <button className="btn-outline" style={{width:"100%",marginTop:8,fontSize:12}} onClick={handleLogout}>Cerrar sesión</button>
            </div>
          ):(
            <button className="btn-primary" style={{width:"100%"}} onClick={()=>setShowAuth(true)}>Iniciar sesión</button>
          )}
        </div>
      </div>

      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onNeedUsername={()=>{setShowAuth(false);setShowUsername(true);}}/>}
      {showUsername&&<UsernameModal onClose={()=>setShowUsername(false)}/>}
    </>
  );
}