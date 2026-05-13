import { useNavigate } from "react-router-dom";
import { useApp, CATEGORIA_COLORS, timeAgo, avgRating, ratingPillClass } from "../context";
import { RichDisplay } from "../RichEditor";

export default function HomePage() {
  const { session, perfil, profesores, resenas, hilos, respuestas, mensajes, perfilesMap, unreadCount } = useApp();
  const navigate = useNavigate();

  const allRevenas = Object.values(resenas).flat();
  const ultimasResenas = allRevenas.slice(0, 4);
  const ultimosHilos = hilos.slice(0, 4);
  const conversations = getConversations();

  function getConversations() {
    if(!session) return [];
    const convMap = {};
    mensajes.forEach(m=>{
      const otherId = m.de_user_id===session.user.id?m.para_user_id:m.de_user_id;
      if(!convMap[otherId]||new Date(m.created_at)>new Date(convMap[otherId].lastMsg.created_at)) convMap[otherId]={otherId,lastMsg:m,unread:0};
      if(m.para_user_id===session.user.id&&!m.leido) convMap[otherId].unread=(convMap[otherId].unread||0)+1;
    });
    return Object.values(convMap).filter(c=>c.unread>0).sort((a,b)=>new Date(b.lastMsg.created_at)-new Date(a.lastMsg.created_at)).slice(0,3);
  }

  const totalProfs = profesores.length;
  const totalResenas = allRevenas.length;
  const totalUsuarios = Object.keys(perfilesMap).length;

  return (
    <div style={{maxWidth:700}}>
      {/* HERO */}
      <div className="home-hero">
        <div className="home-hero-text">
          <h1 className="home-title">Bienvenido a <span style={{color:"var(--accent)"}}>ProfeScore</span></h1>
          <p className="home-subtitle">La plataforma de estudiantes de la Universidad de Palermo para compartir experiencias reales sobre profesores, conectar con compañeros y tomar mejores decisiones al inscribirte.</p>
          {!session&&<div style={{display:"flex",gap:8,marginTop:"1rem",flexWrap:"wrap"}}>
            <button className="btn-primary" style={{flex:"none",padding:"10px 24px"}} onClick={()=>navigate("/acerca")}>Conocer más</button>
          </div>}
          {session&&perfil&&<p style={{fontSize:13,color:"var(--text3)",marginTop:"0.75rem"}}>Hola, <strong style={{color:"var(--accent)"}}>@{perfil.username}</strong> 👋</p>}
        </div>
      </div>

      {/* STATS */}
      <div className="home-stats">
        {[[totalProfs,"Profesores","👨‍🏫"],[totalResenas,"Reseñas","⭐"],[totalUsuarios,"Estudiantes","👥"]].map(([n,l,icon])=>(
          <div key={l} className="home-stat-card">
            <div className="home-stat-icon">{icon}</div>
            <div className="home-stat-num">{n}</div>
            <div className="home-stat-lbl">{l}</div>
          </div>
        ))}
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div className="home-section-title">¿Qué querés hacer?</div>
      <div className="home-actions">
        {[
          {icon:"🔍",title:"Buscar profesor",desc:"Encontrá reseñas de tus profesores",path:"/profesores",color:"#E1F5EE",textColor:"#085041"},
          {icon:"📚",title:"Ver materias",desc:"Explorá por materia y encontrá los mejores profesores",path:"/materias",color:"#E6F1FB",textColor:"#0C447C"},
          {icon:"✍️",title:"Dejar una reseña",desc:"Compartí tu experiencia con tus compañeros",path:"/profesores",color:"#FAEEDA",textColor:"#633806"},
          {icon:"💬",title:"Ir al foro",desc:"Participá en discusiones con otros estudiantes",path:"/foro",color:"#EEEDFE",textColor:"#3C3489"},
          {icon:"👥",title:"Comunidad",desc:"Conocé otros estudiantes de la UP",path:"/comunidad",color:"#FBEAF0",textColor:"#72243E"},
          {icon:"✉️",title:"Mis mensajes",desc:`${unreadCount>0?`${unreadCount} mensajes sin leer`:"Chateá con otros estudiantes"}`,path:"/mensajes",color:"#FAECE7",textColor:"#712B13"},
        ].map(a=>(
          <div key={a.title} className="home-action-card" style={{background:a.color,borderColor:a.color}} onClick={()=>navigate(a.path)}>
            <div className="home-action-icon">{a.icon}</div>
            <div className="home-action-title" style={{color:a.textColor}}>{a.title}</div>
            <div className="home-action-desc">{a.desc}</div>
            {a.path==="/mensajes"&&unreadCount>0&&<span className="sidebar-badge" style={{marginTop:6,alignSelf:"flex-start"}}>{unreadCount}</span>}
          </div>
        ))}
      </div>

      {/* MENSAJES NO LEIDOS */}
      {session&&conversations.length>0&&<>
        <div className="home-section-title" style={{marginTop:"1.5rem"}}>✉️ Mensajes sin leer</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"1.5rem"}}>
          {conversations.map(conv=>{
            const op = perfilesMap[conv.otherId]||{username:"Usuario",foto_url:null};
            return(
              <div key={conv.otherId} className="conversation-item unread" onClick={()=>navigate(`/mensajes/${conv.otherId}`)}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"var(--accent-bg)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"var(--accent-dark)",flexShrink:0}}>{(op.username||"?")[0].toUpperCase()}</div>
                <div className="conv-info"><div className="conv-username">@{op.username}</div><div className="conv-preview">{conv.lastMsg.texto}</div></div>
                <span className="sidebar-badge">{conv.unread}</span>
              </div>
            );
          })}
        </div>
      </>}

      {/* ÚLTIMOS HILOS */}
      {ultimosHilos.length>0&&<>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem",marginTop:"1.5rem"}}>
          <div className="home-section-title" style={{margin:0}}>💬 Últimas discusiones en el foro</div>
          <button className="link-btn" onClick={()=>navigate("/foro")}>Ver todo →</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"1.5rem"}}>
          {ultimosHilos.map(h=>(
            <div key={h.id} className="hilo-card" onClick={()=>navigate(`/foro/${h.id}`)}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                    <span className="cat-badge" style={{background:CATEGORIA_COLORS[h.categoria]?.bg,color:CATEGORIA_COLORS[h.categoria]?.color}}>{h.categoria}</span>
                  </div>
                  <div className="hilo-titulo" style={{fontSize:14}}>{h.titulo}</div>
                  <div style={{fontSize:12,color:"var(--text3)",marginTop:3}}>por <span style={{color:"var(--accent)"}}>@{h.username}</span> · {timeAgo(h.created_at)}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{(respuestas[h.id]||[]).length}</div>
                  <div style={{fontSize:11,color:"var(--text4)"}}>resp.</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>}

      {/* ÚLTIMAS RESEÑAS */}
      {ultimasResenas.length>0&&<>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem",marginTop:"0.5rem"}}>
          <div className="home-section-title" style={{margin:0}}>⭐ Últimas reseñas</div>
          <button className="link-btn" onClick={()=>navigate("/profesores")}>Ver profesores →</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ultimasResenas.map(r=>{
            const prof = profesores.find(p=>p.id===r.profesor_id);
            const profRevs = resenas[r.profesor_id]||[];
            const avg = avgRating(profRevs);
            if(!prof) return null;
            return(
              <div key={r.id} className="review-card" style={{cursor:"pointer"}} onClick={()=>navigate(`/profesor/${r.profesor_id}`)}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>{prof.nombre}</div>
                    <div style={{fontSize:12,color:"var(--text3)"}}>{r.materia} · <span style={{color:"var(--accent)"}}>@{r.username||"Invitado"}</span> · {timeAgo(r.created_at)}</div>
                  </div>
                  <div className={`rating-pill ${ratingPillClass(r.rating)}`} style={{padding:"4px 10px"}}>
                    <span style={{fontSize:16,fontWeight:700}}>{r.rating}</span>
                  </div>
                </div>
                <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.5,overflow:"hidden",maxHeight:48,textOverflow:"ellipsis"}}>
                  <RichDisplay html={r.texto}/>
                </div>
                {(r.tags||[]).length>0&&<div className="tags" style={{marginTop:6}}>{r.tags.slice(0,3).map(t=><span key={t} className="tag tag-green">{t}</span>)}</div>}
              </div>
            );
          })}
        </div>
      </>}
    </div>
  );
}
