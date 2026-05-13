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

const LINKS_UP = [
  { icon: "🎓", title: "Campus Virtual", url: "https://campus.palermo.edu/" },
  { icon: "📱", title: "MyUP", url: "https://myup.palermo.edu/" },
  { icon: "💼", title: "Office 365", url: "https://www.office.com/" },
];

export default function HomePage() {
  const { session, perfil, profesores, resenas, hilos, respuestas, mensajes, perfilesMap, unreadCount } = useApp();
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

          {/* Avatar o botón login */}
          {session && perfil ? (
            <div
              style={{ cursor: "pointer", flexShrink: 0 }}
              onClick={() => navigate(`/perfil/${session.user.id}`)}
              title="Ver mi perfil"
            >
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

        {/* ÚLTIMAS RESEÑAS */}
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

        {/* PROFESORES DESTACADOS */}
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

        {/* HILOS DEL FORO */}
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

        {/* MENSAJES */}
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

      {/* LINKS UNIVERSIDAD */}
      <div className="dash-card">
        <div className="dash-card-header">
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>🏛️ Links de la universidad</span>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {LINKS_UP.map((l, i) => (
            <a
              key={l.title}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "14px 10px", textDecoration: "none",
                borderRight: i < LINKS_UP.length - 1 ? "1px solid var(--border2)" : "none",
                transition: "background 0.12s",
              }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <span style={{ fontSize: 22 }}>{l.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", textAlign: "center" }}>{l.title}</span>
            </a>
          ))}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onNeedUsername={() => { setShowAuth(false); setShowUsername(true); }} />}
      {showUsername && <UsernameModal onClose={() => setShowUsername(false)} />}
    </div>
  );
}