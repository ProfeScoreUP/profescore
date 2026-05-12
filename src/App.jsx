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
  "Explica bien","Exigente","Accesible","Buena onda",
  "Parciales difíciles","Mucha teoría","Práctico","Impuntual","Claro","Aburrido",
];

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
function stars(r) { return "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r)); }
function tagClass(t) {
  const pos = ["Explica bien","Accesible","Buena onda","Práctico","Claro"];
  const neg = ["Impuntual","Aburrido"];
  if (pos.includes(t)) return "tag-green";
  if (neg.includes(t)) return "tag-red";
  return "tag-amber";
}
function aiSummary(prof, reviews) {
  if (!reviews.length) return "";
  const avg = avgRating(reviews);
  const allTags = {};
  reviews.forEach((r) => (r.tags || []).forEach((t) => (allTags[t] = (allTags[t] || 0) + 1)));
  const top = Object.entries(allTags).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const apellido = prof.nombre.split(" ").pop();
  if (avg >= 4.5) return `Los estudiantes tienen una opinión muy positiva de ${apellido}. Es destacado por ser ${top.slice(0,2).join(" y ")}, con parciales que requieren estudio pero asequibles. Muy recomendado.`;
  if (avg >= 3.5) return `${apellido} tiene buenas reseñas en general. Los estudiantes valoran que es ${top[0] || "accesible"}, aunque mencionan que la materia requiere dedicación.`;
  if (avg >= 2.5) return `Las opiniones sobre ${apellido} son mixtas. Algunos estudiantes rescatan ${top[0] || "su conocimiento"}, pero otros señalan dificultades con la dinámica de clase.`;
  return `La mayoría de los estudiantes tuvo dificultades con ${apellido}. Las reseñas mencionan ${top.slice(0,2).join(" y ")} como aspectos negativos recurrentes.`;
}

export default function App() {
  const [profesores, setProfesores] = useState([]);
  const [resenas, setResenas] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [tab, setTab] = useState("todos");
  const [currentProf, setCurrentProf] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAddProfModal, setShowAddProfModal] = useState(false);
  const [selectedStar, setSelectedStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [revText, setRevText] = useState("");
  const [revMateria, setRevMateria] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newMaterias, setNewMaterias] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data: profs } = await supabase.from("profesores").select("*").order("nombre");
    const { data: revs } = await supabase.from("resenas").select("*").order("created_at", { ascending: false });
    const resMap = {};
    (revs || []).forEach((r) => {
      if (!resMap[r.profesor_id]) resMap[r.profesor_id] = [];
      resMap[r.profesor_id].push(r);
    });
    setProfesores(profs || []);
    setResenas(resMap);
    setLoading(false);
  }

  function getFiltered() {
    const q = search.toLowerCase();
    let list = profesores.filter((p) => {
      const match = p.nombre.toLowerCase().includes(q) || p.departamento.toLowerCase().includes(q) || (p.materias || []).some((m) => m.toLowerCase().includes(q));
      const dMatch = !deptFilter || p.departamento === deptFilter;
      return match && dMatch;
    });
    const withAvg = list.map((p) => ({ ...p, avg: avgRating(resenas[p.id] || []), cnt: (resenas[p.id] || []).length }));
    if (tab === "mejor") withAvg.sort((a, b) => b.avg - a.avg);
    else if (tab === "recientes") withAvg.sort((a, b) => b.cnt - a.cnt);
    return withAvg;
  }

  const depts = [...new Set(profesores.map((p) => p.departamento))];

  async function submitReview() {
    if (!selectedStar) { alert("Por favor seleccioná una calificación"); return; }
    if (!revText.trim()) { alert("Por favor escribí tu opinión"); return; }
    setSubmitting(true);
    await supabase.from("resenas").insert({ profesor_id: currentProf.id, materia: revMateria, rating: selectedStar, texto: revText.trim(), tags: selectedTags });
    await fetchAll();
    setShowReviewModal(false);
    setSubmitting(false);
    setSelectedStar(0); setSelectedTags([]); setRevText("");
  }

  async function addProf() {
    if (!newNombre.trim() || !newDept.trim()) { alert("Completá nombre y departamento"); return; }
    const mats = newMaterias.split(",").map((s) => s.trim()).filter(Boolean);
    setSubmitting(true);
    await supabase.from("profesores").insert({ nombre: newNombre.trim(), departamento: newDept.trim(), materias: mats.length ? mats : [newDept.trim()] });
    await fetchAll();
    setShowAddProfModal(false);
    setSubmitting(false);
    setNewNombre(""); setNewDept(""); setNewMaterias("");
  }

  function openReview(prof) {
    setCurrentProf(prof);
    setRevMateria((prof.materias || [])[0] || "");
    setSelectedStar(0); setSelectedTags([]); setRevText("");
    setShowReviewModal(true);
  }

  const profRevs = currentProf ? (resenas[currentProf.id] || []) : [];
  const tagCounts = {};
  profRevs.forEach((r) => (r.tags || []).forEach((t) => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="app">
      {!currentProf ? (
        <>
          <div className="header">
            <div className="logo"><div className="dot" />ProfeScore</div>
            <button className="btn-outline" onClick={() => setShowAddProfModal(true)}>+ Agregar profesor</button>
          </div>
          <div className="search-bar">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar profesor o materia..." />
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">Todas las materias</option>
              {depts.map((d) => <option key={d} value={d}>{d}</option>)}
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
                const revs = resenas[p.id] || [];
                const tagC = {};
                revs.forEach((r) => (r.tags || []).forEach((t) => (tagC[t] = (tagC[t] || 0) + 1)));
                const tTop = Object.entries(tagC).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);
                return (
                  <div key={p.id} className="prof-card" onClick={() => setCurrentProf(p)}>
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
          <button className="back-btn" onClick={() => setCurrentProf(null)}>← Volver</button>
          {(() => {
            const idx = profesores.findIndex((x) => x.id === currentProf.id);
            const c = colorFor(idx);
            const avg = avgRating(profRevs);
            const summary = aiSummary(currentProf, profRevs);
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
                <div className="stats-row">
                  {[
                    [avg ? avg.toFixed(1) : "—", "calificación", avg ? ratingColor(avg) : undefined],
                    [profRevs.length, "reseñas", undefined],
                    [(currentProf.materias || []).length, "materias", undefined],
                  ].map(([v, l, col], i) => (
                    <div key={i} className="stat-card">
                      <div className="stat-val" style={col ? { color: col } : {}}>{v}</div>
                      <div className="stat-lbl">{l}</div>
                    </div>
                  ))}
                </div>
                {topTags.length > 0 && (
                  <div className="tags" style={{ marginBottom: "1.25rem" }}>
                    {topTags.map(([t, n]) => <span key={t} className={`tag ${tagClass(t)}`}>{t} <span style={{ opacity: 0.6 }}>({n})</span></span>)}
                  </div>
                )}
                {summary && (
                  <div className="ai-summary">
                    <div className="ai-label">✦ Resumen IA</div>
                    {summary}
                  </div>
                )}
                <div className="section-title">Reseñas <span style={{ fontWeight: 400, color: "var(--color-muted)", fontSize: 13 }}>{profRevs.length} en total</span></div>
                {profRevs.length === 0 && <div className="empty">Sé el primero en dejar una reseña</div>}
                {profRevs.map((r) => (
                  <div key={r.id} className="review-card">
                    <div className="review-top">
                      <div><span className="review-materia">{r.materia}</span><span className="stars" style={{ marginLeft: 8 }}>{stars(r.rating)}</span></div>
                      <div className="review-date">{new Date(r.created_at).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}</div>
                    </div>
                    <div className="review-text">{r.texto}</div>
                    {(r.tags || []).length > 0 && <div className="tags" style={{ marginTop: 6 }}>{r.tags.map((t) => <span key={t} className={`tag ${tagClass(t)}`}>{t}</span>)}</div>}
                  </div>
                ))}
                <button className="add-review-btn" onClick={() => openReview(currentProf)}>✎ Agregar mi reseña</button>
              </>
            );
          })()}
        </>
      )}

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Agregar reseña</div>
            <div className="form-group">
              <label className="form-label">Materia cursada</label>
              <select value={revMateria} onChange={(e) => setRevMateria(e.target.value)}>
                {(currentProf?.materias || []).map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Calificación</label>
              <div className="star-picker">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} className={`star-btn${selectedStar >= n ? " active" : ""}`} onClick={() => setSelectedStar(n)}>★</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="tag-picker">
                {ALL_TAGS.map((t) => (
                  <span key={t} className={`tag-option${selectedTags.includes(t) ? " selected" : ""}`}
                    onClick={() => setSelectedTags(selectedTags.includes(t) ? selectedTags.filter((x) => x !== t) : selectedTags.length < 4 ? [...selectedTags, t] : selectedTags)}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tu opinión</label>
              <textarea value={revText} onChange={(e) => setRevText(e.target.value)} placeholder="Contá tu experiencia..." />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReviewModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={submitReview} disabled={submitting}>{submitting ? "Enviando..." : "Publicar reseña"}</button>
            </div>
          </div>
        </div>
      )}

      {showAddProfModal && (
        <div className="modal-overlay" onClick={() => setShowAddProfModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Agregar profesor</div>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input value={newNombre} onChange={(e) => setNewNombre(e.target.value)} placeholder="Ej: Dra. Ana García" />
            </div>
            <div className="form-group">
              <label className="form-label">Departamento</label>
              <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Ej: Matemáticas" />
            </div>
            <div className="form-group">
              <label className="form-label">Materias que dicta (separadas por coma)</label>
              <input value={newMaterias} onChange={(e) => setNewMaterias(e.target.value)} placeholder="Ej: Cálculo I, Cálculo II" />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddProfModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addProf} disabled={submitting}>{submitting ? "Guardando..." : "Agregar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}