import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp, Avatar, initials, timeAgo } from "./context";
import AuthModal from "./modals/AuthModal";
import UsernameModal from "./modals/UsernameModal";

export default function Sidebar() {
  const { session, perfil, unreadCount, actividadReciente, darkMode, toggleDark, handleLogout, notificaciones, notifCount, marcarTodasLeidas } = useApp();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  function tipoIcon(tipo) {
    if(tipo==="reseña") return "⭐";
    if(tipo==="comentario") return "💬";
    if(tipo==="hilo") return "📝";
    if(tipo==="respuesta") return "↩️";
    return "•";
  }

  function closeMobile() { setMobileOpen(false); }

  function handleNotifClick() {
    setShowNotif(!showNotif);
    if(!showNotif && notifCount > 0) marcarTodasLeidas();
  }

  const navLinks = [["/materias","📚","Materias"],["/profesores","👨‍🏫","Profesores"],["/foro","💬","Foro"],["/comunidad","👥","Comunidad"],["/acerca","ℹ️","Acerca de"]];
  const actLinks = [
    ["/mensajes","✉️","Mensajes",unreadCount],
    ["/mis-resenas","✍️","Mis reseñas",0],
    ["/mis-comentarios","💬","Mis comentarios",0],
    ["/resenas-votadas","👍","Reseñas votadas",0],
  ];

  const NotifPanel = () => (
    <div style={{position:"absolute",left:"100%",top:0,marginLeft:8,width:300,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",zIndex:100,overflow:"hidden"}}>
      <div style={{padding:"12px 14px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:13,fontWeight:500,color:"var(--text)"}}>Notificaciones</span>
        {notificaciones.length>0&&<button className="link-btn" style={{fontSize:11}} onClick={marcarTodasLeidas}>Marcar todas como leídas</button>}
      </div>
      {notificaciones.length===0&&<div style={{padding:"1.5rem",fontSize:13,color:"var(--text3)",textAlign:"center"}}>No tenés notificaciones</div>}
      {notificaciones.map(n=>(
        <div key={n.id} onClick={()=>{if(n.link)navigate(n.link);setShowNotif(false);}} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderBottom:"1px solid var(--border2)",cursor:n.link?"pointer":"default",background:n.leida?"transparent":"var(--accent-bg)",transition:"background 0.12s"}} onMouseEnter={e=>{if(n.link)e.currentTarget.style.background="var(--surface2)"}} onMouseLeave={e=>e.currentTarget.style.background=n.leida?"transparent":"var(--accent-bg)"}>
          <span style={{fontSize:16,flexShrink:0}}>{tipoIcon(n.tipo)}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,color:"var(--text)",lineHeight:1.4}}>{n.texto}</div>
            <div style={{fontSize:11,color:"var(--text4)",marginTop:3}}>{timeAgo(n.created_at)}</div>
          </div>
          {!n.leida&&<div style={{width:7,height:7,borderRadius:"50%",background:"var(--accent)",flexShrink:0,marginTop:4}}/>}
        </div>
      ))}
    </div>
  );

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

        {/* NOTIFICACIONES */}
        <div style={{position:"relative"}}>
          <button className="sidebar-item" style={{width:"100%"}} onClick={handleNotifClick}>
            <span className="icon">🔔</span>
            Notificaciones
            {notifCount>0&&<span className="sidebar-badge">{notifCount}</span>}
          </button>
          {showNotif&&<NotifPanel/>}
        </div>
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