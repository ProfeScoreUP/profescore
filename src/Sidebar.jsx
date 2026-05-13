import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp, Avatar, initials, timeAgo } from "./context";
import AuthModal from "./modals/AuthModal";
import UsernameModal from "./modals/UsernameModal";

export default function Sidebar() {
  const { session, perfil, unreadCount, actividadReciente, darkMode, toggleDark, handleLogout } = useApp();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function tipoIcon(tipo) {
    if(tipo==="reseña") return "⭐";
    if(tipo==="comentario") return "💬";
    if(tipo==="hilo") return "📝";
    if(tipo==="respuesta") return "↩️";
    return "•";
  }

  function closeMobile() { setMobileOpen(false); }

  const navLinks = [["/materias","📚","Materias"],["/profesores","👨‍🏫","Profesores"],["/foro","💬","Foro"],["/comunidad","👥","Comunidad"],["/acerca","ℹ️","Acerca de"]];
  const actLinks = [
    ["/mensajes","✉️","Mensajes",unreadCount],
    ["/mis-resenas","✍️","Mis reseñas",0],
    ["/mis-comentarios","💬","Mis comentarios",0],
    ["/resenas-votadas","👍","Reseñas votadas",0],
  ];

  const sidebarContent = (
    <>
      <div className="sidebar-logo" onClick={()=>{navigate("/");closeMobile();}} style={{cursor:"pointer"}}>
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
        {navLinks.map(([path,icon,label])=>(
          <NavLink key={path} to={path} className={({isActive})=>`sidebar-item${isActive?" active":""}`} style={{textDecoration:"none"}} onClick={closeMobile}>
            <span className="icon">{icon}</span>{label}
          </NavLink>
        ))}
      </div>

      {session&&<div className="sidebar-section">
        <div className="sidebar-section-title">Mi actividad</div>
        {actLinks.map(([path,icon,label,badge])=>(
          <NavLink key={path} to={path} className={({isActive})=>`sidebar-item${isActive?" active":""}`} style={{textDecoration:"none"}} onClick={closeMobile}>
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
            closeMobile();
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
            <div className="sidebar-user-info" onClick={()=>{perfil&&navigate(`/perfil/${session.user.id}`);closeMobile();}}>
              <div className="sidebar-avatar">{perfil?.foto_url?<img src={perfil.foto_url} alt={perfil.username}/>:(perfil?.username?initials(perfil.username):"?")}</div>
              <div><div className="sidebar-username">{perfil?.username?`@${perfil.username}`:"Sin nombre"}</div>{perfil?.carrera&&<div className="sidebar-carrera">{perfil.carrera}</div>}</div>
            </div>
            <button className="btn-outline" style={{width:"100%",marginTop:8,fontSize:12}} onClick={handleLogout}>Cerrar sesión</button>
          </div>
        ):(
          <button className="btn-primary" style={{width:"100%"}} onClick={()=>{setShowAuth(true);closeMobile();}}>Iniciar sesión</button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* BARRA MÓVIL */}
      <div className="mobile-topbar">
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>navigate("/")}>
          <img src="/logo.svg" alt="ProfeScore" style={{width:28,height:28,objectFit:"contain"}}/>
          <span style={{fontSize:15,fontWeight:500,color:"var(--text)"}}>ProfeScore</span>
        </div>
        <button className="mobile-menu-btn" onClick={()=>setMobileOpen(true)}>☰</button>
      </div>

      {/* SIDEBAR DESKTOP */}
      <div className="sidebar">{sidebarContent}</div>

      {/* DRAWER MÓVIL */}
      {mobileOpen&&(
        <>
          <div className="mobile-overlay" onClick={closeMobile}/>
          <div className="mobile-drawer">{sidebarContent}</div>
        </>
      )}

      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onNeedUsername={()=>{setShowAuth(false);setShowUsername(true);}}/>}
      {showUsername&&<UsernameModal onClose={()=>setShowUsername(false)}/>}
    </>
  );
}