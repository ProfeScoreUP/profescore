import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useApp, colorFor, initials, avgRating, ratingPillClass, tagClass, isAdmin, isUP, ALL_TAGS, PREGUNTAS_ONLINE, PREGUNTAS_PRESENCIAL, DISCLAIMER } from "../context";
import ReviewCard from "../ReviewCard";
import RichEditor from "../RichEditor";
import UsernameModal from "../modals/UsernameModal";
import AuthModal from "../modals/AuthModal";

function aiSummary(prof, reviews) {
  if(!reviews.length) return "";
  const avg = avgRating(reviews);
  const allTags = {};
  reviews.forEach(r=>(r.tags||[]).forEach(t=>(allTags[t]=(allTags[t]||0)+1)));
  const top = Object.entries(allTags).sort((a,b)=>b[1]-a[1]).map(([t])=>t);
  const apellido = prof.nombre.split(" ").pop();
  if(avg>=4.5) return `Los estudiantes tienen una opinión muy positiva de ${apellido}. Destacado por ser ${top.slice(0,2).join(" y ")}. Muy recomendado.`;
  if(avg>=3.5) return `${apellido} tiene buenas reseñas. Los estudiantes valoran que es ${top[0]||"comprometido"}, aunque la materia requiere dedicación.`;
  if(avg>=2.5) return `Las opiniones sobre ${apellido} son mixtas. Algunos rescatan ${top[0]||"su conocimiento"}, pero otros señalan dificultades.`;
  return `La mayoría tuvo dificultades con ${apellido}. Las reseñas mencionan ${top.slice(0,2).join(" y ")} como aspectos negativos.`;
}

export default function ProfesorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, perfil, profesores, resenas, materias, votos, fetchAll } = useApp();

  const prof = profesores.find(p=>p.id===id);
  const profRevs = resenas[id] || [];

  const [detailModalidad, setDetailModalidad] = useState("");
  const [reviewSort, setReviewSort] = useState("reciente");
  const [reviewFilter, setReviewFilter] = useState("todos");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showEditFotoModal, setShowEditFotoModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const [selectedStar, setSelectedStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [revText, setRevText] = useState("");
  const [revMateria, setRevMateria] = useState("");
  const [revModalidad, setRevModalidad] = useState("Presencial");
  const [submitting, setSubmitting] = useState(false);
  const [isNewMateria, setIsNewMateria] = useState(false);
  const [newMateriaInput, setNewMateriaInput] = useState("");

  if(!prof) return <div className="empty">Profesor no encontrado</div>;

  const idx = profesores.findIndex(p=>p.id===id);
  const c = colorFor(idx);
  const avg = avgRating(profRevs);
  const summary = aiSummary(prof, profRevs);

  const tagCounts = {};
  profRevs.forEach(r=>(r.tags||[]).forEach(t=>(tagCounts[t]=(tagCounts[t]||0)+1)));
  const topTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  let sorted = [...profRevs];
  if(detailModalidad) sorted = sorted.filter(r=>r.modalidad===detailModalidad);
  if(reviewFilter==="verificados") sorted = sorted.filter(r=>r.verified);
  else if(reviewFilter==="invitados") sorted = sorted.filter(r=>r.is_guest||!r.verified);
  if(reviewSort==="reciente") sorted.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  else if(reviewSort==="antigua") sorted.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  else if(reviewSort==="mejor") sorted.sort((a,b)=>b.rating-a.rating);
  else if(reviewSort==="peor") sorted.sort((a,b)=>a.rating-b.rating);
  else if(reviewSort==="util") sorted.sort((a,b)=>{
    const la=(votos[a.id]||[]).filter(v=>v.tipo==="like").length;
    const lb=(votos[b.id]||[]).filter(v=>v.tipo==="like").length;
    return lb-la;
  });

  const preguntas = revModalidad==="Online" ? PREGUNTAS_ONLINE : PREGUNTAS_PRESENCIAL;

  function openReview() {
    if(!session) { setShowAuthModal(true); return; }
    if(!perfil) { setShowUsernameModal(true); return; }
    setRevMateria((prof.materias||[])[0]||"");
    setSelectedStar(0); setSelectedTags([]); setRevText(""); setRevModalidad("Presencial");
    setIsNewMateria(false); setNewMateriaInput("");
    setShowReviewModal(true);
  }

  async function submitReview() {
    if(!selectedStar) { alert("Por favor seleccioná una calificación"); return; }
    if(!revText||revText==="<p></p>") { alert("Por favor escribí tu opinión"); return; }
    const materiaFinal = isNewMateria ? newMateriaInput.trim() : revMateria;
    if(!materiaFinal) { alert("Por favor ingresá la materia"); return; }
    setSubmitting(true);

    if(isNewMateria && newMateriaInput.trim()) {
      const updatedMaterias = [...(prof.materias||[]), newMateriaInput.trim()];
      await supabase.from("profesores").update({ materias: updatedMaterias }).eq("id", prof.id);
      const existe = materias.find(m=>m.nombre.toLowerCase()===newMateriaInput.trim().toLowerCase());
      if(!existe) await supabase.from("materias").insert({ nombre: newMateriaInput.trim() });
    }

    await supabase.from("resenas").insert({
      profesor_id: prof.id,
      materia: materiaFinal,
      rating: selectedStar,
      texto: revText,
      tags: selectedTags,
      modalidad: revModalidad,
      user_email: session.user.email,
      verified: isUP(session.user.email),
      is_guest: false,
      user_id: session.user.id,
      username: perfil?.username||null,
    });
    await fetchAll();
    setShowReviewModal(false); setSubmitting(false);
    setSelectedStar(0); setSelectedTags([]); setRevText("");
  }

  async function saveFoto() {
    await supabase.from("profesores").update({foto_url:fotoUrl}).eq("id",prof.id);
    await fetchAll(); setShowEditFotoModal(false); setFotoUrl("");
  }

  return (
    <>
      <div className="detail-topbar">
        <button className="back-btn" onClick={()=>navigate(-1)}>← Volver</button>
        {session&&isAdmin(session.user.id)&&(
          <button className="review-action-btn admin" onClick={()=>{setFotoUrl(prof.foto_url||"");setShowEditFotoModal(true);}}>📷 Foto</button>
        )}
      </div>

      <div className="detail-header">
        <div className="detail-avatar" style={{background:c.bg,color:c.color}}>
          {prof.foto_url?<img src={prof.foto_url} alt={prof.nombre}/>:initials(prof.nombre)}
        </div>
        <div style={{flex:1}}>
          <div className="detail-name">{prof.nombre}</div>
          <div className="detail-dept">{prof.departamento}</div>
          <div className="tags" style={{marginTop:6}}>{(prof.materias||[]).map(m=><span key={m} className="tag tag-blue">{m}</span>)}</div>
        </div>
        <div className={`rating-pill ${ratingPillClass(avg)}`}>
          <span style={{fontSize:26,fontWeight:700}}>{avg?avg.toFixed(1):"—"}</span>
          <span style={{fontSize:11,opacity:0.8}}>{avg?"/ 5.0":"sin reseñas"}</span>
        </div>
      </div>

      <div className="modalidad-tabs">
        {[["","Todas"],["Presencial","Presencial"],["Online","Online"]].map(([k,l])=>(
          <button key={k} className={`modalidad-tab${detailModalidad===k?" active":""}`} onClick={()=>setDetailModalidad(k)}>{l}</button>
        ))}
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-val">{profRevs.length}</div><div className="stat-lbl">reseñas</div></div>
        <div className="stat-card"><div className="stat-val">{avg?avg.toFixed(1):"—"}</div><div className="stat-lbl">promedio</div></div>
        <div className="stat-card"><div className="stat-val">{(prof.materias||[]).length}</div><div className="stat-lbl">materias</div></div>
      </div>

      {topTags.length>0&&<div className="tags" style={{marginBottom:"1.25rem"}}>{topTags.map(([t,n])=><span key={t} className={`tag ${tagClass(t)}`}>{t} <span style={{opacity:0.6}}>({n})</span></span>)}</div>}
      {summary&&<div className="ai-summary"><div className="ai-label">✦ Resumen IA</div>{summary}</div>}

      <div className="review-controls">
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:"var(--text3)",fontWeight:500}}>Ordenar:</span>
          {[["reciente","Más reciente"],["antigua","Más antigua"],["mejor","Mejor calificada"],["peor","Peor calificada"],["util","Más útil"]].map(([k,l])=>(
            <button key={k} className={`sort-btn${reviewSort===k?" active":""}`} onClick={()=>setReviewSort(k)}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginTop:6}}>
          <span style={{fontSize:12,color:"var(--text3)",fontWeight:500}}>Filtrar:</span>
          {[["todos","Todos"],["verificados","Alumno UP"],["invitados","Invitados"]].map(([k,l])=>(
            <button key={k} className={`sort-btn${reviewFilter===k?" active":""}`} onClick={()=>setReviewFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="section-title" style={{marginTop:"1rem"}}>
        Reseñas {detailModalidad?`· ${detailModalidad}`:""}<span style={{fontWeight:400,color:"var(--text4)",fontSize:13}}> {sorted.length} en total</span>
      </div>
      {sorted.length===0&&<div className="empty">No hay reseñas que coincidan</div>}
      {sorted.map(r=><ReviewCard key={r.id} r={r}/>)}

      <button className="add-review-btn" onClick={openReview}>✎ Agregar mi reseña</button>
      {!session&&(
        <p style={{fontSize:12,color:"var(--text3)",textAlign:"center",marginTop:6}}>
          Necesitás <button className="link-btn" onClick={()=>setShowAuthModal(true)}>iniciar sesión</button> para dejar una reseña.
        </p>
      )}

      {showAuthModal&&(
        <AuthModal onClose={()=>setShowAuthModal(false)} onNeedUsername={()=>{setShowAuthModal(false);setShowUsernameModal(true);}}/>
      )}
      {showUsernameModal&&<UsernameModal onClose={()=>setShowUsernameModal(false)}/>}

      {showEditFotoModal&&(
        <div className="modal-overlay" onClick={()=>setShowEditFotoModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Foto de {prof.nombre}</div>
            <div className="form-group">
              <label className="form-label">URL de la foto</label>
              <input value={fotoUrl} onChange={e=>setFotoUrl(e.target.value)} placeholder="https://i.imgur.com/foto.jpg"/>
              {fotoUrl&&<img src={fotoUrl} alt="preview" className="foto-preview" onError={e=>e.target.style.display="none"}/>}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={()=>setShowEditFotoModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveFoto}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal&&(
        <div className="modal-overlay" onClick={()=>setShowReviewModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Agregar reseña — {prof.nombre}</div>
            <div className="disclaimer-box">⚠️ {DISCLAIMER}</div>
            <div className="info-box success">
              {isUP(session.user.email)
                ?<>Tu reseña tendrá el badge <span className="badge-up">✓ Alumno UP</span></>
                :<>Sesión iniciada como {session.user.email}</>
              }
            </div>

            <div className="form-row">
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Materia</label>
                {!isNewMateria
                  ?<select value={revMateria} onChange={e=>setRevMateria(e.target.value)}>
                    {(prof.materias||[]).map(m=><option key={m}>{m}</option>)}
                  </select>
                  :<input value={newMateriaInput} onChange={e=>setNewMateriaInput(e.target.value)} placeholder="Nombre de la materia"/>
                }
                <button type="button" className="add-materia-btn" onClick={()=>{setIsNewMateria(!isNewMateria);setNewMateriaInput("");}}>
                  {isNewMateria?"← Elegir de la lista":"+ La materia no está en la lista"}
                </button>
              </div>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Modalidad</label>
                <select value={revModalidad} onChange={e=>setRevModalidad(e.target.value)}>
                  <option>Presencial</option>
                  <option>Online</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Calificación</label>
              <div className="star-picker">
                {[1,2,3,4,5].map(n=>(
                  <button key={n} className={`star-btn${selectedStar>=n?" active":""}`} onClick={()=>setSelectedStar(n)}>★</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="tag-picker">
                {ALL_TAGS.map(t=>(
                  <span key={t} className={`tag-option${selectedTags.includes(t)?" selected":""}`} onClick={()=>setSelectedTags(selectedTags.includes(t)?selectedTags.filter(x=>x!==t):[...selectedTags,t])}>{t}</span>
                ))}
              </div>
            </div>

            <div className="preguntas-box">
              <div className="preguntas-title">💡 Preguntas guía ({revModalidad}):</div>
              <ul className="preguntas-list">{preguntas.map((p,i)=><li key={i}>{p}</li>)}</ul>
            </div>

            <div className="form-group">
              <label className="form-label">Tu opinión</label>
              <RichEditor value={revText} onChange={setRevText} placeholder="Contá tu experiencia con este profesor..."/>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={()=>setShowReviewModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={submitReview} disabled={submitting}>{submitting?"Guardando...":"Publicar reseña"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}