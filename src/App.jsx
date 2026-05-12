import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";

const COLORS = [
  { bg: "#E1F5EE", color: "#085041" },
  { bg: "#E6F1FB", color: "#0C447C" },
  { bg: "#FAEEDA", color: "#633806" },
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#FBEAF0", color: "#72243E" },
  { bg: "#FAECE7", color: "#712B13" },
];

const ALL_TAGS = [
  "Explica bien","Exigente","Buena onda","Parciales difíciles","Claro","Aburrido",
  "Respondus","Buenas devoluciones","Comprometido","Oral difícil","Brinda apoyo","Muchas tareas","Buenas clases",
];

const PREGUNTAS_ONLINE = [
  "¿Qué tal es el contenido de los módulos? ¿Es claro y completo?",
  "¿Ofrece clases de consulta sincrónicas?",
  "¿Da devoluciones completas de las actividades y parciales?",
  "¿Hace un seguimiento semana a semana?",
  "¿Da actividades con entrega obligatoria en cada módulo?",
  "¿Cómo es el oral?",
];

const PREGUNTAS_PRESENCIAL = [
  "¿Cómo explica en clase? ¿Es claro y organizado?",
  "¿Está disponible para consultas antes/después de clase o por mail?",
  "¿Cómo son los parciales en relación a lo que se vio en clase?",
  "¿Da devoluciones de los parciales y trabajos prácticos?",
  "¿Cumple con el horario y el programa de la materia?",
  "¿Recomendarías cursar con este profesor?",
];

const DISCLAIMER = "Recordá que una buena reseña ayuda a tus compañeros a tomar mejores decisiones. Intentá ser objetivo/a: una mala nota no siempre significa un mal profesor. Contá tu experiencia real.";

function initials(name) {
  return name.split(" ").filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("");
}
function colorFor(i) { return COLORS[i % COLORS.length]; }
function avgRating(reviews) {
  if (!reviews.length) return 0;
  return reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
}
function ratingColor(r) {
  if (r >= 4) return "#1D9E75";
  if (r >= 3) return "#BA7517";
  return "#E24B4A";
}
function starsStr(r) { return "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r)); }
function tagClass(t) {
  const pos = ["Explica bien","Buena onda","Claro","Buenas devoluciones","Comprometido","Brinda apoyo","Buenas clases"];
  const neg = ["Aburrido","Oral difícil","Muchas tareas","Respondus"];
  if (pos.includes(t)) return "tag-green";
  if (neg.includes(t)) return "tag-red";
  return "tag-amber";
}
function isUP(email) { return email && email.endsWith("@up.edu.ar"); }
function aiSummary(prof, reviews) {
  if (!reviews.length) return "";
  const avg = avgRating(reviews);
  const allTags = {};
  reviews.forEach((r) => (r.tags || []).forEach((t) => (allTags[t] = (allTags[t] || 0) + 1)));
  const top = Object.entries(allTags).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const apellido = prof.nombre.split(" ").pop();
  if (avg >= 4.5) return `Los estudiantes tienen una opinión muy positiva de ${apellido}. Destacado por ser ${top.slice(0,2).join(" y ")}. Muy recomendado.`;
  if (avg >= 3.5) return `${apellido} tiene buenas reseñas. Los estudiantes valoran que es ${top[0] || "comprometido"}, aunque la materia requiere dedicación.`;
  if (avg >= 2.5) return `Las opiniones sobre ${apellido} son mixtas. Algunos rescatan ${top[0] || "su conocimiento"}, pero otros señalan dificultades.`;
  return `La mayoría tuvo dificultades con ${apellido}. Las reseñas mencionan ${top.slice(0,2).join(" y ")} como aspectos negativos.`;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profesores, setProfesores] = useState([]);
  const [resenas, setResenas] = useState({});
  const [materias, setMaterias] = useState([]);
  const [votos, setVotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [modalidadFilter, setModalidadFilter] = useState("");
  const [tab, setTab] = useState("todos");
  const [currentProf, setCurrentProf] = useState(null);
  const [detailModalidad, setDetailModalidad] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [showAddProfModal, setShowAddProfModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [selectedStar, setSelectedStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [revText, setRevText] = useState("");
  const [revMateria, setRevMateria] = useState("");
  const [revModalidad, setRevModalidad] = useState("Presencial");
  const [guestEmail, setGuestEmail] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newMaterias, setNewMaterias] = useState([]);
  const [showNewMateriaField, setShowNewMateriaField] = useState(false);
  const [nuevaMateria, setNuevaMateria] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    fetchAll();
    return () => subscription.unsubscribe();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: profs }, { data: revs }, { data: mats }, { data: vots }] = await Promise.all([
      supabase.from("profesores").select("*").order("nombre"),
      supabase.from("resenas").select("*").order("created_at", { ascending: false }),
      supabase.from("materias").select("*").order("nombre"),
      supabase.from("votos").select("*"),
    ]);
    const resMap = {};
    (revs || []).forEach((r) => {
      if (!resMap[r.profesor_id]) resMap[r.profesor_id] = [];
      resMap[r.profesor_id].push(r);
    });
    const votMap = {};
    (vots || []).forEach((v) => {
      if (!votMap[v.resena_id]) votMap[v.resena_id] = [];
      votMap[v.resena_id].push(v);
    });
    setProfesores(profs || []);
    setResenas(resMap);
    setMaterias(mats || []);
    setVotos(votMap);
    setLoading(false);
  }

  async function handleVoto(resenaId, tipo, resenaUserId) {
    if (!session) { setShowAuthModal(true); setAuthMode("login"); return; }
    if (session.user.id === resenaUserId) return;
    const misVotos = (votos[resenaId] || []);
    const miVoto = misVotos.find((v) => v.user_id === session.user.id);
    if (miVoto) {
      if (miVoto.tipo === tipo) {
        await supabase.from("votos").delete().eq("id", miVoto.id);
      } else {
        await supabase.from("votos").update({ tipo }).eq("id", miVoto.id);
      }
    } else {
      await supabase.from("votos").insert({ resena_id: resenaId, user_id: session.user.id, tipo });
    }
    const { data: vots } = await supabase.from("votos").select("*");
    const votMap = {};
    (vots || []).forEach((v) => {
      if (!votMap[v.resena_id]) votMap[v.resena_id] = [];
      votMap[v.resena_id].push(v);
    });
    setVotos(votMap);
  }

  async function handleAuth() {
    setAuthLoading(true);
    setAuthMsg("");
    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthMsg("Email o contraseña incorrectos.");
      else { setShowAuthModal(false); setAuthEmail(""); setAuthPassword(""); }
    } else {
      const { error } = await supabase.auth.signUp({
        email: authEmail, password: authPassword,
        options: { emailRedirectTo: "https://profescore-eta.vercel.app" }
      });
      if (error) setAuthMsg(error.message);
      else setAuthMsg("¡Revisá tu email y hacé clic en el link de confirmación para activar tu cuenta!");
    }
    setAuthLoading(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  function getFiltered() {
    const q = search.toLowerCase();
    let list = profesores.filter((p) => {
      const match = p.nombre.toLowerCase().includes(q) || p.departamento.toLowerCase().includes(q) || (p.materias || []).some((m) => m.toLowerCase().includes(q));
      const dMatch = !deptFilter || p.departamento === deptFilter;
      return match && dMatch;
    });
    const withAvg = list.map((p) => {
      let revs = resenas[p.id] || [];
      if (modalidadFilter) revs = revs.filter((r) => r.modalidad === modalidadFilter);
      return { ...p, avg: avgRating(revs), cnt: revs.length };
    });
    if (tab === "mejor") withAvg.sort((a, b) => b.avg - a.avg);
    else if (tab === "recientes") withAvg.sort((a, b) => b.cnt - a.cnt);
    return withAvg;
  }

  const depts = [...new Set(profesores.map((p) => p.departamento))].sort();

  function openReview(prof, reviewToEdit = null) {
    setCurrentProf(prof);
    setEditingReview(reviewToEdit);
    if (reviewToEdit) {
      setRevMateria(reviewToEdit.materia);
      setRevModalidad(reviewToEdit.modalidad || "Presencial");
      setSelectedStar(reviewToEdit.rating);
      setSelectedTags(reviewToEdit.tags || []);
      setRevText(reviewToEdit.texto);
    } else {
      setRevMateria((prof.materias || [])[0] || materias[0]?.nombre || "");
      setSelectedStar(0); setSelectedTags([]); setRevText(""); setRevModalidad("Presencial");
    }
    setGuestEmail("");
    setShowReviewModal(true);
  }

  async function submitReview() {
    if (!selectedStar) { alert("Por favor seleccioná una calificación"); return; }
    if (!revText.trim()) { alert("Por favor escribí tu opinión"); return; }
    setSubmitting(true);
    if (editingReview) {
      await supabase.from("resenas").update({
        materia: revMateria, rating: selectedStar, texto: revText.trim(), tags: selectedTags, modalidad: revModalidad,
      }).eq("id", editingReview.id);
    } else {
      const userEmail = session ? session.user.email : guestEmail.trim();
      const verified = isUP(userEmail);
      await supabase.from("resenas").insert({
        profesor_id: currentProf.id, materia: revMateria, rating: selectedStar,
        texto: revText.trim(), tags: selectedTags, modalidad: revModalidad,
        user_email: userEmail, verified, is_guest: !session,
        user_id: session?.user?.id || null,
      });
    }
    await fetchAll();
    setShowReviewModal(false);
    setSubmitting(false);
    setEditingReview(null);
    setSelectedStar(0); setSelectedTags([]); setRevText(""); setRevModalidad("Presencial"); setGuestEmail("");
  }

  async function deleteReview(reviewId) {
    if (!confirm("¿Querés eliminar esta reseña?")) return;
    await supabase.from("resenas").delete().eq("id", reviewId);
    await fetchAll();
  }

  async function addNuevaMateria() {
    if (!nuevaMateria.trim()) return;
    const { data } = await supabase.from("materias").insert({ nombre: nuevaMateria.trim() }).select().single();
    if (data) {
      setMaterias((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNewMaterias((prev) => [...prev, data.nombre]);
    }
    setNuevaMateria(""); setShowNewMateriaField(false);
  }

  async function addProf() {
    if (!newNombre.trim() || !newDept.trim()) { alert("Completá nombre y área"); return; }
    if (newMaterias.length === 0) { alert("Seleccioná al menos una materia"); return; }
    setSubmitting(true);
    await supabase.from("profesores").insert({ nombre: newNombre.trim(), departamento: newDept.trim(), materias: newMaterias });
    await fetchAll();
    setShowAddProfModal(false);
    setSubmitting(false);
    setNewNombre(""); setNewDept(""); setNewMaterias([]);
  }

  function toggleNewMateria(nombre) {
    setNewMaterias((prev) => prev.includes(nombre) ? prev.filter((x) => x !== nombre) : [...prev, nombre]);
  }

  const profRevs = currentProf ? (resenas[currentProf.id] || []) : [];
  const filteredProfRevs = detailModalidad ? profRevs.filter((r) => r.modalidad === detailModalidad) : profRevs;
  const tagCounts = {};
  filteredProfRevs.forEach((r) => (r.tags || []).forEach((t) => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const preguntas = revModalidad === "Online" ? PREGUNTAS_ONLINE : PREGUNTAS_PRESENCIAL;

  return (
    <div className="app">
      {!currentProf ? (
        <>
          <div className="header">
            <div>
              <div className="logo"><div className="dot" />ProfeScore</div>
              <div className="subtitle">Universidad de Palermo</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {session ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#888" }}>
                    {isUP(session.user.email) ? <span className="badge-up">✓ Alumno UP</span> : session.user.email.split("@")[0]}
                  </span>
                  <button className="btn-outline" onClick={handleLogout}>Salir</button>
                </div>
              ) : (
                <button className="btn-outline" onClick={() => { setShowAuthModal(true); setAuthMode("login"); setAuthMsg(""); }}>Iniciar sesión</button>
              )}
              <button className="btn-outline" onClick={() => setShowAddProfModal(true)}>+ Profesor</button>
            </div>
          </div>
          <div className="search-bar">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar profesor o materia..." />
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">Todas las áreas</option>
              {depts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={modalidadFilter} onChange={(e) => setModalidadFilter(e.target.value)}>
              <option value="">Presencial y online</option>
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <div className="tabs">
            {[["todos","Todos"],["mejor","Mejor calificados"],["recientes","Más reseñas"]].map(([k,l]) => (
              <button key={k} className={`tab${tab===k?" active":""}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          {loading ? <div className="empty">Cargando...</div> : (
            <div className="prof-list">
              {getFiltered().length === 0 && <div className="empty">No se encontraron profesores</div>}
              {getFiltered().map((p, i) => {
                const c = colorFor(i);
                let revs = resenas[p.id] || [];
                if (modalidadFilter) revs = revs.filter((r) => r.modalidad === modalidadFilter);
                const tagC = {};
                revs.forEach((r) => (r.tags || []).forEach((t) => (tagC[t] = (tagC[t] || 0) + 1)));
                const tTop = Object.entries(tagC).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);
                return (
                  <div key={p.id} className="prof-card" onClick={() => { setCurrentProf(p); setDetailModalidad(""); }}>
                    <div className="prof-row">
                      <div className="avatar" style={{ background: c.bg, color: c.color }}>{initials(p.nombre)}</div>
                      <div className="prof-info">
                        <div className="prof-name">{p.nombre}</div>
                        <div className="prof-meta">{p.departamento} · {revs.length} reseña{revs.length !== 1 ? "s" : ""}</div>
                        <div className="tags">{tTop.map((t) => <span key={t} className={`tag ${tagClass(t)}`}>{t}</span>)}</div>
                      </div>
                      <div className="rating-badge">
                        <div className="rating-num" style={{ color: p.avg ? ratingColor(p.avg) : "var(--color-muted)" }}>{p.avg ? p.avg.toFixed(1) : "—"}</div>
                        <div className="rating-label">{p.avg ? "/ 5.0" : "sin reseñas"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="detail-topbar">
            <button className="back-btn" onClick={() => setCurrentProf(null)}>← Volver</button>
            {session && <span style={{ fontSize: 12, color: "#888" }}>{isUP(session.user.email) ? <span className="badge-up">✓ Alumno UP</span> : session.user.email.split("@")[0]}</span>}
          </div>
          {(() => {
            const idx = profesores.findIndex((x) => x.id === currentProf.id);
            const c = colorFor(idx);
            const avg = avgRating(filteredProfRevs);
            const summary = aiSummary(currentProf, filteredProfRevs);
            return (
              <>
                <div className="detail-header">
                  <div className="detail-avatar" style={{ background: c.bg, color: c.color }}>{initials(currentProf.nombre)}</div>
                  <div>
                    <div className="detail-name">{currentProf.nombre}</div>
                    <div className="detail-dept">{currentProf.departamento}</div>
                    <div className="tags" style={{ marginTop: 6 }}>{(currentProf.materias || []).map((m) => <span key={m} className="tag tag-blue">{m}</span>)}</div>
                  </div>
                </div>
                <div className="modalidad-tabs">
                  {[["","Todas"],["Presencial","Presencial"],["Online","Online"]].map(([k,l]) => (
                    <button key={k} className={`modalidad-tab${detailModalidad===k?" active":""}`} onClick={() => setDetailModalidad(k)}>{l}</button>
                  ))}
                </div>
                <div className="stats-row">
                  {[[avg?avg.toFixed(1):"—","calificación",avg?ratingColor(avg):undefined],[filteredProfRevs.length,"reseñas",undefined],[(currentProf.materias||[]).length,"materias",undefined]].map(([v,l,col],i) => (
                    <div key={i} className="stat-card"><div className="stat-val" style={col?{color:col}:{}}>{v}</div><div className="stat-lbl">{l}</div></div>
                  ))}
                </div>
                {topTags.length > 0 && (
                  <div className="tags" style={{ marginBottom: "1.25rem" }}>
                    {topTags.map(([t,n]) => <span key={t} className={`tag ${tagClass(t)}`}>{t} <span style={{opacity:0.6}}>({n})</span></span>)}
                  </div>
                )}
                {summary && <div className="ai-summary"><div className="ai-label">✦ Resumen IA</div>{summary}</div>}
                <div className="section-title">
                  Reseñas {detailModalidad ? `· ${detailModalidad}` : ""}
                  <span style={{fontWeight:400,color:"#aaa",fontSize:13}}> {filteredProfRevs.length} en total</span>
                </div>
                {filteredProfRevs.length === 0 && <div className="empty">No hay reseñas todavía</div>}
                {filteredProfRevs.map((r) => {
                  const isOwner = session && r.user_id === session.user.id;
                  const revVotos = votos[r.id] || [];
                  const likes = revVotos.filter((v) => v.tipo === "like").length;
                  const dislikes = revVotos.filter((v) => v.tipo === "dislike").length;
                  const miVoto = session ? revVotos.find((v) => v.user_id === session.user.id) : null;
                  const puedeVotar = session && !isOwner;
                  return (
                    <div key={r.id} className="review-card">
                      <div className="review-top">
                        <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
                          <span className="review-materia">{r.materia}</span>
                          <span className="stars">{starsStr(r.rating)}</span>
                          <span className={`modalidad-badge${r.modalidad==="Online"?" online":""}`}>{r.modalidad||"Presencial"}</span>
                          {r.verified ? <span className="badge-up">✓ Alumno UP</span> : r.is_guest ? <span className="badge-guest">Invitado</span> : null}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span className="review-date">{new Date(r.created_at).toLocaleDateString("es-AR",{month:"short",year:"numeric"})}</span>
                          {isOwner && (
                            <div style={{display:"flex",gap:4}}>
                              <button className="review-action-btn" onClick={() => openReview(currentProf, r)}>✎</button>
                              <button className="review-action-btn delete" onClick={() => deleteReview(r.id)}>✕</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="review-text">{r.texto}</div>
                      {(r.tags||[]).length > 0 && <div className="tags" style={{marginTop:6}}>{r.tags.map((t) => <span key={t} className={`tag ${tagClass(t)}`}>{t}</span>)}</div>}
                      <div className="vote-row">
                        <span className="vote-label">¿Te fue útil?</span>
                        <button
                          className={`vote-btn like${miVoto?.tipo==="like"?" active":""} ${!puedeVotar?"disabled":""}`}
                          onClick={() => puedeVotar && handleVoto(r.id, "like", r.user_id)}
                          title={!session?"Iniciá sesión para votar":isOwner?"No podés votar tu propia reseña":""}
                        >
                          👍 {likes}
                        </button>
                        <button
                          className={`vote-btn dislike${miVoto?.tipo==="dislike"?" active":""} ${!puedeVotar?"disabled":""}`}
                          onClick={() => puedeVotar && handleVoto(r.id, "dislike", r.user_id)}
                          title={!session?"Iniciá sesión para votar":isOwner?"No podés votar tu propia reseña":""}
                        >
                          👎 {dislikes}
                        </button>
                        {!session && <span className="vote-hint" onClick={() => { setShowAuthModal(true); setAuthMode("login"); }}>Iniciá sesión para votar</span>}
                      </div>
                    </div>
                  );
                })}
                <button className="add-review-btn" onClick={() => openReview(currentProf)}>✎ Agregar mi reseña</button>
              </>
            );
          })()}
        </>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{authMode==="login"?"Iniciar sesión":"Crear cuenta"}</div>
            {authMode==="register" && (
              <div className="info-box">Si usás tu email <strong>@up.edu.ar</strong>, tus reseñas tendrán el badge <span className="badge-up">✓ Alumno UP</span></div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            {authMsg && <div className={`auth-msg${authMsg.includes("Revisá")?" success":""}`}>{authMsg}</div>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAuthModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAuth} disabled={authLoading}>{authLoading?"...":authMode==="login"?"Entrar":"Registrarme"}</button>
            </div>
            <div className="auth-switch">
              {authMode==="login"
                ? <>¿No tenés cuenta? <button onClick={() => {setAuthMode("register");setAuthMsg("");}}>Registrate</button></>
                : <>¿Ya tenés cuenta? <button onClick={() => {setAuthMode("login");setAuthMsg("");}}>Iniciá sesión</button></>}
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{editingReview?"Editar reseña":"Agregar reseña"}</div>

            {!editingReview && (
              <div className="disclaimer-box">
                ⚠️ {DISCLAIMER}
              </div>
            )}

            {!session && !editingReview && (
              <div className="info-box">
                <strong>Reseña como invitado.</strong> <button className="link-btn" onClick={() => { setShowReviewModal(false); setShowAuthModal(true); setAuthMode("login"); }}>Iniciá sesión</button> para verificarte como Alumno UP.
              </div>
            )}
            {session && (
              <div className="info-box success">
                {isUP(session.user.email) ? <>Tu reseña tendrá el badge <span className="badge-up">✓ Alumno UP</span></> : <>Sesión iniciada como {session.user.email}</>}
              </div>
            )}

            <div className="form-row">
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Materia cursada</label>
                <select value={revMateria} onChange={(e) => setRevMateria(e.target.value)}>
                  {(currentProf?.materias||[]).map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Modalidad</label>
                <select value={revModalidad} onChange={(e) => setRevModalidad(e.target.value)}>
                  <option>Presencial</option>
                  <option>Online</option>
                </select>
              </div>
            </div>

            {!session && !editingReview && (
              <div className="form-group">
                <label className="form-label">Tu email (opcional, para verificación UP)</label>
                <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="tu@up.edu.ar o cualquier email" />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Calificación</label>
              <div className="star-picker">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} className={`star-btn${selectedStar>=n?" active":""}`} onClick={() => setSelectedStar(n)}>★</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="tag-picker">
                {ALL_TAGS.map((t) => (
                  <span key={t} className={`tag-option${selectedTags.includes(t)?" selected":""}`}
                    onClick={() => setSelectedTags(selectedTags.includes(t)?selectedTags.filter((x)=>x!==t):[...selectedTags,t])}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {!editingReview && (
              <div className="preguntas-box">
                <div className="preguntas-title">💡 Algunas preguntas para guiar tu reseña ({revModalidad}):</div>
                <ul className="preguntas-list">
                  {preguntas.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Tu opinión</label>
              <textarea value={revText} onChange={(e) => setRevText(e.target.value)} placeholder="Contá tu experiencia con este profesor..." />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReviewModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={submitReview} disabled={submitting}>{submitting?"Guardando...":editingReview?"Guardar cambios":"Publicar reseña"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PROF MODAL */}
      {showAddProfModal && (
        <div className="modal-overlay" onClick={() => setShowAddProfModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Agregar profesor</div>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input value={newNombre} onChange={(e) => setNewNombre(e.target.value)} placeholder="Ej: Dra. Ana García" />
            </div>
            <div className="form-group">
              <label className="form-label">Área / Departamento</label>
              <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Ej: Contabilidad, Marketing..." />
            </div>
            <div className="form-group">
              <label className="form-label">Materias que dicta</label>
              <div className="materia-picker">
                {materias.map((m) => (
                  <span key={m.id} className={`tag-option${newMaterias.includes(m.nombre)?" selected":""}`} onClick={() => toggleNewMateria(m.nombre)}>{m.nombre}</span>
                ))}
              </div>
              {!showNewMateriaField ? (
                <button className="add-materia-btn" onClick={() => setShowNewMateriaField(true)}>+ Agregar materia que no está en la lista</button>
              ) : (
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <input value={nuevaMateria} onChange={(e) => setNuevaMateria(e.target.value)} placeholder="Nombre de la materia..." style={{flex:1}} />
                  <button className="btn-primary" style={{flex:"none",padding:"6px 12px"}} onClick={addNuevaMateria}>Agregar</button>
                  <button className="btn-cancel" onClick={() => setShowNewMateriaField(false)}>✕</button>
                </div>
              )}
              {newMaterias.length > 0 && <div style={{marginTop:8,fontSize:12,color:"#0F6E56"}}>Seleccionadas: {newMaterias.join(", ")}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddProfModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addProf} disabled={submitting}>{submitting?"Guardando...":"Agregar profesor"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}