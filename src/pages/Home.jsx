import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, CATEGORIA_COLORS, timeAgo, avgRating, ratingPillClass, initials, colorFor, COLORS } from "../context";
import { RichDisplay } from "../RichEditor";
import AuthModal from "../modals/AuthModal";
import UsernameModal from "../modals/UsernameModal";

function Avatar({ name, url, size = 36 }) {
  const c = colorFor((name || "").charCodeAt(0) % COLORS.length);
  if(url) return <img src={url} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: c.bg, color: c.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.35, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

function BusquedaGlobal({ profesores, materias, hilos, resenas, navigate }) {
  const [query, setQuery] = useState("");

  const q = query.toLowerCase().trim();

  const profResults = q.length < 2 ? [] : profesores.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    (p.materias||[]).some(m=>m.toLowerCase().includes(q)) ||
    p.departamento.toLowerCase().includes(q)
  ).slice(0, 4);

  const matResults = q.length < 2 ? [] : materias.filter(m =>
    m.nombre.toLowerCase().includes(q)
  ).slice(0, 4);

  const hiloResults = q.length < 2 ? [] : hilos.filter(h =>
    h.titulo.toLowerCase().includes(q) ||
    h.contenido.toLowerCase().includes(q)
  ).slice(0, 3);

  const hasResults = profResults.length > 0 || matResults.length > 0 || hiloResults.length > 0;
  const showDropdown = q.length >= 2;

  return (
    <div style={{position:"relative"}}>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"var(--text3)"}}>🔍</span>
        <input
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="Buscar profesor, materia o tema del foro..."
          style={{
            width:"100%", padding:"10px 12px 10px 36px",
            border:"1px solid var(--border)", borderRadius:10,
            fontSize:14, background:"var(--surface)", color:"var(--text)",
            fontFamily:"var(--font)", outline:"none", boxSizing:"border-box",
            transition:"border-color 0.12s",
          }}
          onFocus={e=>e.target.style.borderColor="var(--accent)"}
          onBlur={e=>e.target.style.borderColor="var(--border)"}
        />
        {query && (
          <button onClick={()=>setQuery("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"var(--text3)"}}>✕</button>
        )}
      </div>

      {showDropdown && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
          background:"var(--surface)", border:"1px solid var(--border)",
          borderRadius:10, zIndex:50, overflow:"hidden",
          boxShadow:"0 4px 20px rgba(0,0,0,0.1)",
        }}>
          {!hasResults && (
            <div style={{padding:"1rem",fontSize:13,color:"var(--text3)",textAlign:"center"}}>Sin resultados para "{query}"</div>
          )}

          {profResults.length > 0 && (
            <>
              <div style={{padding:"8px 14px 4px",fontSize:11,fontWeight:600,color:"var(--text4)",textTransform:"uppercase",letterSpacing:"0.05em"}}>Profesores</div>
              {profResults.map(p => {
                const avg = avgRating(resenas[p.id]||[]);
                return (
                  <div key={p.id} onClick={()=>{navigate(`/profesor/${p.id}`);setQuery("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <Avatar name={p.nombre} size={30}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:"var(--text)"}}>{p.nombre}</div>
                      <div style={{fontSize:11,color:"var(--text3)"}}>{p.departamento}</div>
                    </div>
                    {avg>0&&<span style={{fontSize:12,color:"var(--accent)",fontWeight:500}}>★ {avg.toFixed(1)}</span>}
                  </div>
                );
              })}
            </>
          )}

          {matResults.length > 0 && (
            <>
              <div style={{padding:"8px 14px 4px",fontSize:11,fontWeight:600,color:"var(--text4)",textTransform:"uppercase",letterSpacing:"0.05em",borderTop:profResults.length>0?"1px solid var(--border2)":"none"}}>Materias</div>
              {matResults.map(m => (
                <div key={m.id} onClick={()=>{navigate(`/profesores?materia=${encodeURIComponent(m.nombre)}`);setQuery("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:18}}>📚</span>
                  <div style={{fontSize:13,color:"var(--text)"}}>{m.nombre}</div>
                </div>
              ))}
            </>
          )}

          {hiloResults.length > 0 && (
            <>
              <div style={{padding:"8px 14px 4px",fontSize:11,fontWeight:600,color:"var(--text4)",textTransform:"uppercase",letterSpacing:"0.05em",borderTop:(profResults.length>0||matResults.length>0)?"1px solid var(--border2)":"none"}}>Foro</div>
              {hiloResults.map(h => (
                <div key={h.id} onClick={()=>{navigate(`/foro/${h.id}`);setQuery("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:18}}>💬</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{h.titulo}</div>
                    <div style={{fontSize:11,color:"var(--text3)"}}>@{h.username} · {timeAgo(h.created_at)}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { session, perfil, profesores, resenas, materias, hilos, respuestas, mensajes, perfilesMap, unreadCount } = useApp();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [showUsername, setShowUsername] = useState(false);

  const allResenas = Object.values(resenas).flat();
  const ultimasResenas = allResenas.slice(0, 4);
  const ultimosHilos = hilos.slice(0, 4);

  const totalProfs = profesores.length;
  const totalResenas = allResenas.length;
  const totalUsuarios = Object.keys(perfilesMap).length;

  const profesoresDestacados = [...profesores]
    .filter(p => (resenas[p.id] || []).length > 0)
    .sort((a, b) => avgRating(resenas[b.id] || []) - avgRating(resenas[a.id] || []))
    .slice(0, 3);

  function getConversations() {
    if (!session) return [];
    const convMap = {};
    mensajes.forEach(m => {
      const otherId = m.de_user_id === session.user.id ? m.para_user_id : m.de_user_id;
      if (!convMap[otherId] || new Date(m.created_at) > new Date(convMap[otherId].lastMsg.created_at))
        convMap[otherId] = { otherId, lastMsg: m, unread: 0 };
      if (m.para_user_id === session.user.id && !m.leido)
        convMap[otherId].unread = (convMap[otherId].unread || 0) + 1;
    });
    return Object.values(convMap)
      .sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at))
      .slice(0, 3);
  }

  const conversations = getConversations();

  const acciones = [
    { icon: "🔍", title: "Buscar profesor", path: "/profesores" },
    { icon: "✍️", title: "Dejar una reseña", path: "/profesores" },
    { icon: "📚", title: "Ver materias", path: "/materias" },
    { icon: "💬", title: "Ir al foro", path: "/foro" },
    { icon: "✉️", title: "Mis mensajes", path: "/mensajes", badge: unreadCount > 0 ? unreadCount : null },
    { icon: "👥", title: "Comunidad", path: "/comunidad" },
  ];

  const starsStr = (r) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

  return (
    <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "2rem" }}>

      {/* HERO */}
      <div className="dash-hero">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: "1rem" }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
              {session && perfil
                ? <>Bienvenido, <span style={{ color: "var(--accent)" }}>@{perfil.username}</span></>
                : "Bienvenido a ProfeScore"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text3)" }}>
              Universidad de Palermo · ProfeScore
            </p>
          </div>
          {session && perfil ? (
            <div style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => navigate(`/perfil/${session.user.id}`)} title="Ver mi perfil">
              <Avatar name={perfil.username} url={perfil.foto_url} size={42} />
            </div>
          ) : (
            <button className="btn-primary" style={{ fontSize: 12, padding: "7px 14px", whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => setShowAuth(true)}>
              Iniciar sesión
            </button>
          )}
        </div>

        <div className="dash-stats">
          {[
            { icon: "👨‍🏫", val: totalProfs, lbl: "Profesores" },
            { icon: "⭐", val: totalResenas, lbl: "Reseñas" },
            { icon: "👥", val: totalUsuarios, lbl: "Estudiantes" },
          ].map(({ icon, val, lbl }) => (
            <div key={lbl} className="dash-stat">
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 500, color: "var(--text)", lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{lbl}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BÚSQUEDA GLOBAL */}
      <BusquedaGlobal profesores={profesores} materias={materias} hilos={hilos} resenas={resenas} navigate={navigate}/>

      {/* ACCIONES RÁPIDAS */}
      <div className="dash-actions">
        {acciones.map(a => (
          <div key={a.title} className="dash-action-btn" onClick={() => navigate(a.path)}>
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}>{a.title}</span>
            {a.badge && <span className="sidebar-badge" style={{ position: "absolute", top: 6, right: 6, fontSize: 10, padding: "1px 5px" }}>{a.badge}</span>}
          </div>
        ))}
      </div>

      {/* DOS COLUMNAS: RESEÑAS + PROFESORES */}
      <div className="dash-two-col">
        <div className="dash-card">
          <div className="dash-card-header">
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>⭐ Últimas reseñas</span>
            <button className="link-btn" onClick={() => navigate("/profesores")}>Ver todo →</button>
          </div>
          {ultimasResenas.length === 0 && <p style={{ padding: "1rem", fontSize: 13, color: "var(--text3)" }}>Aún no hay reseñas.</p>}
          {ultimasResenas.map(r => {
            const prof = profesores.find(p => p.id === r.profesor_id);
            if (!prof) return null;
            return (
              <div key={r.id} className="dash-list-item" onClick={() => navigate(`/profesor/${r.profesor_id}`)}>
                <Avatar name={prof.nombre} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{prof.nombre}</span>
                    <span className={`rating-pill ${ratingPillClass(r.rating)}`} style={{ fontSize: 11, padding: "1px 7px" }}>{r.rating}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 3 }}>{r.materia}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", maxHeight: 36, lineHeight: 1.5 }}>
                    <RichDisplay html={r.texto} />
                  </div>
                  {(r.tags || []).length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                      {r.tags.slice(0, 2).map(t => <span key={t} className="tag tag-green" style={{ fontSize: 10, padding: "1px 6px" }}>{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>🏆 Profesores destacados</span>
            <button className="link-btn" onClick={() => navigate("/profesores")}>Ver todo →</button>
          </div>
          {profesoresDestacados.length === 0 && <p style={{ padding: "1rem", fontSize: 13, color: "var(--text3)" }}>Aún no hay datos.</p>}
          {profesoresDestacados.map(p => {
            const avg = avgRating(resenas[p.id] || []);
            return (
              <div key={p.id} className="dash-list-item" onClick={() => navigate(`/profesor/${p.id}`)}>
                <Avatar name={p.nombre} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{(resenas[p.id] || []).length} reseña{(resenas[p.id] || []).length !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--accent)", letterSpacing: 1 }}>{starsStr(avg)}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", marginTop: 1 }}>{avg.toFixed(1)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DOS COLUMNAS: FORO + MENSAJES */}
      <div className="dash-two-col">
        <div className="dash-card">
          <div className="dash-card-header">
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>💬 Hilos del foro</span>
            <button className="link-btn" onClick={() => navigate("/foro")}>Ver todo →</button>
          </div>
          {ultimosHilos.length === 0 && <p style={{ padding: "1rem", fontSize: 13, color: "var(--text3)" }}>No hay hilos aún.</p>}
          {ultimosHilos.map(h => (
            <div key={h.id} className="dash-list-item" onClick={() => navigate(`/foro/${h.id}`)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="cat-badge" style={{ background: CATEGORIA_COLORS[h.categoria]?.bg, color: CATEGORIA_COLORS[h.categoria]?.color, fontSize: 10, padding: "1px 7px", marginBottom: 4, display: "inline-block" }}>{h.categoria}</span>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.titulo}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>@{h.username} · {timeAgo(h.created_at)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{(respuestas[h.id] || []).length}</div>
                <div style={{ fontSize: 10, color: "var(--text4)" }}>resp.</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
              ✉️ Mensajes {unreadCount > 0 && <span className="sidebar-badge" style={{ fontSize: 10, padding: "1px 6px", marginLeft: 4 }}>{unreadCount}</span>}
            </span>
            <button className="link-btn" onClick={() => navigate("/mensajes")}>Ver todo →</button>
          </div>
          {!session && (
            <div style={{ padding: "1rem" }}>
              <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 8 }}>Iniciá sesión para ver tus mensajes.</p>
              <button className="btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setShowAuth(true)}>Iniciar sesión</button>
            </div>
          )}
          {session && conversations.length === 0 && <p style={{ padding: "1rem", fontSize: 13, color: "var(--text3)" }}>No hay mensajes aún.</p>}
          {session && conversations.map(conv => {
            const op = perfilesMap[conv.otherId] || { username: "Usuario" };
            const hasUnread = conv.unread > 0;
            return (
              <div key={conv.otherId} className="dash-list-item" onClick={() => navigate(`/mensajes/${conv.otherId}`)}>
                {hasUnread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: 6 }} />}
                <Avatar name={op.username} url={op.foto_url} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: hasUnread ? 600 : 400, color: "var(--text)" }}>@{op.username}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{conv.lastMsg.texto}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", flexShrink: 0, marginLeft: 8 }}>{timeAgo(conv.lastMsg.created_at)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onNeedUsername={() => { setShowAuth(false); setShowUsername(true); }} />}
      {showUsername && <UsernameModal onClose={() => setShowUsername(false)} />}
    </div>
  );
}