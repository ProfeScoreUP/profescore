import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp, ALL_TAGS, colorFor, initials, avgRating, ratingPillClass, tagClass, isAdmin } from "../context";
import { supabase } from "../supabase";
import AuthModal from "../modals/AuthModal";

export default function ProfesoresPage() {
  const { session, profesores, resenas, materias, fetchAll } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const materiaFiltro = searchParams.get("materia") || "";

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [modalidadFilter, setModalidadFilter] = useState("");
  const [tagFilter, setTagFilter] = useState([]);
  const [tab, setTab] = useState("recientes");

  // Nuevo profesor
  const [showNewProfModal, setShowNewProfModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newDepto, setNewDepto] = useState("");
  const [newMateria, setNewMateria] = useState("");
  const [savingProf, setSavingProf] = useState(false);
  const [profMsg, setProfMsg] = useState("");

  const depts = [...new Set(profesores.map(p=>p.departamento))].sort();

  function toggleTag(t) { setTagFilter(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]); }

  function openNewProf() {
    if(!session) { setShowAuthModal(true); return; }
    setNewNombre(""); setNewDepto(""); setNewMateria(""); setProfMsg("");
    setShowNewProfModal(true);
  }

  async function saveNewProf() {
    if(!newNombre.trim()) { setProfMsg("El nombre es obligatorio."); return; }
    setSavingProf(true);
    const materias_arr = newMateria.trim() ? [newMateria.trim()] : [];
    const { error } = await supabase.from("profesores").insert({
      nombre: newNombre.trim(),
      departamento: newDepto.trim() || "Sin departamento",
      materias: materias_arr,
    });
    if(error) { setProfMsg("Error al guardar. Intentá de nuevo."); setSavingProf(false); return; }
    // Si puso una materia, también crearla en la tabla materias si no existe
    if(newMateria.trim()) {
      const existe = materias.find(m=>m.nombre.toLowerCase()===newMateria.trim().toLowerCase());
      if(!existe) await supabase.from("materias").insert({ nombre: newMateria.trim() });
    }
    await fetchAll();
    setSavingProf(false);
    setShowNewProfModal(false);
  }

  const filtered = profesores.filter(p=>{
    const q = search.toLowerCase();
    const match = p.nombre.toLowerCase().includes(q)||p.departamento.toLowerCase().includes(q)||(p.materias||[]).some(m=>m.toLowerCase().includes(q));
    const dMatch = !deptFilter||p.departamento===deptFilter;
    const mMatch = !materiaFiltro||(p.materias||[]).includes(materiaFiltro);
    if(tagFilter.length>0){
      const profRevs = resenas[p.id]||[];
      const profTags = new Set(profRevs.flatMap(r=>r.tags||[]));
      if(!tagFilter.every(t=>profTags.has(t))) return false;
    }
    return match&&dMatch&&mMatch;
  }).map(p=>{
    let revs = resenas[p.id]||[];
    if(modalidadFilter) revs = revs.filter(r=>r.modalidad===modalidadFilter);
    const lastRev = revs.length>0 ? Math.max(...revs.map(r=>new Date(r.created_at))) : 0;
    return {...p, avg:avgRating(revs), cnt:revs.length, lastRev};
  }).sort((a,b)=>{
    if(tab==="mejor") return b.avg-a.avg;
    if(tab==="todos") return b.cnt-a.cnt;
    return b.lastRev-a.lastRev;
  });

  return (
    <>
      <div className="header">
        <div>
          <div className="logo"><div className="dot"/>Profesores</div>
          {materiaFiltro&&<div style={{fontSize:13,color:"var(--text3)",marginTop:4}}>Filtrando por: <span className="tag tag-blue" style={{marginLeft:4}}>{materiaFiltro}</span> <button className="link-btn" style={{fontSize:12,marginLeft:6}} onClick={()=>navigate("/profesores")}>✕ Quitar filtro</button></div>}
        </div>
      </div>

      <div className="search-bar">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar profesor o materia..."/>
        <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
          <option value="">Todas las áreas</option>
          {depts.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select value={modalidadFilter} onChange={e=>setModalidadFilter(e.target.value)}>
          <option value="">Presencial y online</option>
          <option value="Presencial">Presencial</option>
          <option value="Online">Online</option>
        </select>
      </div>

      <div style={{marginBottom:"1rem"}}>
        <div style={{fontSize:12,color:"var(--text3)",marginBottom:6,fontWeight:500}}>Filtrar por características:</div>
        <div className="tag-filter-row">
          {ALL_TAGS.map(t=>(
            <button key={t} className={`tag-filter-btn${tagFilter.includes(t)?" active":""}`} onClick={()=>toggleTag(t)}>{t}</button>
          ))}
          {tagFilter.length>0&&<button className="tag-filter-btn" onClick={()=>setTagFilter([])}>✕ Limpiar</button>}
        </div>
      </div>

      <div className="tabs">
        {[["recientes","Actividad reciente"],["mejor","Mejor calificados"],["todos","Más reseñas"]].map(([k,l])=>(
          <button key={k} className={`tab${tab===k?" active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {filtered.length===0&&<div className="empty">No se encontraron profesores</div>}

      <div className="prof-list">
        {filtered.map((p,i)=>{
          const c=colorFor(i);
          let revs=resenas[p.id]||[];
          if(modalidadFilter)revs=revs.filter(r=>r.modalidad===modalidadFilter);
          const tagC={};revs.forEach(r=>(r.tags||[]).forEach(t=>(tagC[t]=(tagC[t]||0)+1)));
          const tTop=Object.entries(tagC).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);
          return(
            <div key={p.id} className="prof-card" onClick={()=>navigate(`/profesor/${p.id}`)}>
              <div className="prof-row">
                <div className="avatar" style={{background:c.bg,color:c.color}}>{p.foto_url?<img src={p.foto_url} alt={p.nombre}/>:initials(p.nombre)}</div>
                <div className="prof-info">
                  <div className="prof-name">{p.nombre}</div>
                  <div className="prof-meta">{p.departamento} · {revs.length} reseña{revs.length!==1?"s":""}</div>
                  <div className="tags">{tTop.map(t=><span key={t} className={`tag ${tagClass(t)}`}>{t}</span>)}</div>
                </div>
                <div className={`rating-pill ${ratingPillClass(p.avg)}`}>
                  <span style={{fontSize:20,fontWeight:700}}>{p.avg?p.avg.toFixed(1):"—"}</span>
                  <span style={{fontSize:10,opacity:0.8}}>{p.avg?"/ 5":""}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="add-review-btn" style={{marginTop:"1rem"}} onClick={openNewProf}>
        ＋ No encontré al profesor — agregar nuevo
      </button>
      {!session&&(
        <p style={{fontSize:12,color:"var(--text3)",textAlign:"center",marginTop:6}}>
          Necesitás <button className="link-btn" onClick={()=>setShowAuthModal(true)}>iniciar sesión</button> para agregar un profesor.
        </p>
      )}

      {showAuthModal&&<AuthModal onClose={()=>setShowAuthModal(false)} onNeedUsername={()=>setShowAuthModal(false)}/>}

      {showNewProfModal&&(
        <div className="modal-overlay" onClick={()=>setShowNewProfModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Agregar profesor nuevo</div>
            <div className="info-box">
              Antes de agregar, asegurate de buscarlo arriba. El nombre debe estar completo y bien escrito para que otros estudiantes puedan encontrarlo.
            </div>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input value={newNombre} onChange={e=>setNewNombre(e.target.value)} placeholder="Ej: María García"/>
            </div>
            <div className="form-group">
              <label className="form-label">Área / Departamento</label>
              <input value={newDepto} onChange={e=>setNewDepto(e.target.value)} placeholder="Ej: Matemáticas, Economía..."/>
            </div>
            <div className="form-group">
              <label className="form-label">Materia que dicta</label>
              <input value={newMateria} onChange={e=>setNewMateria(e.target.value)} placeholder="Ej: Cálculo I"/>
            </div>
            {profMsg&&<div className="auth-msg">{profMsg}</div>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={()=>setShowNewProfModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveNewProf} disabled={savingProf}>{savingProf?"Guardando...":"Agregar profesor"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}