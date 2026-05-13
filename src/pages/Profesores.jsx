import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp, ALL_TAGS, colorFor, initials, avgRating, ratingPillClass, tagClass, isAdmin } from "../context";
import { supabase } from "../supabase";
import AuthModal from "../modals/AuthModal";

const PER_PAGE = 10;

function Paginacion({ page, total, onPrev, onNext }) {
  const totalPages = Math.ceil(total / PER_PAGE);
  if(totalPages <= 1) return null;
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,margin:"1rem 0",fontSize:13,color:"var(--text3)"}}>
      <button className="btn-outline" style={{padding:"5px 14px",fontSize:12}} onClick={onPrev} disabled={page===0}>← Anterior</button>
      <span>{page+1} / {totalPages}</span>
      <button className="btn-outline" style={{padding:"5px 14px",fontSize:12}} onClick={onNext} disabled={(page+1)*PER_PAGE>=total}>Siguiente →</button>
    </div>
  );
}

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
  const [page, setPage] = useState(0);
  const [showNewProfModal, setShowNewProfModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newDepto, setNewDepto] = useState("");
  const [newMateria, setNewMateria] = useState("");
  const [savingProf, setSavingProf] = useState(false);
  const [profMsg, setProfMsg] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const admin = session && isAdmin(session.user.id);
  const depts = [...new Set(profesores.map(p=>p.departamento))].sort();

  function toggleTag(t) { setTagFilter(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]); setPage(0); }
  function resetPage() { setPage(0); }

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
    if(newMateria.trim()) {
      const existe = materias.find(m=>m.nombre.toLowerCase()===newMateria.trim().toLowerCase());
      if(!existe) await supabase.from("materias").insert({ nombre: newMateria.trim() });
    }
    await fetchAll();
    setSavingProf(false);
    setShowNewProfModal(false);
  }

  async function deleteProfesor(e, p) {
    e.stopPropagation();
    if(!window.confirm(`¿Eliminar al profesor "${p.nombre}" y todas sus reseñas?`)) return;
    setDeletingId(p.id);
    const profResenas = resenas[p.id] || [];
    for(const r of profResenas) {
      await supabase.from("votos").delete().eq("resena_id", r.id);
      await supabase.from("comentarios").delete().eq("resena_id", r.id);
    }
    await supabase.from("resenas").delete().eq("profesor_id", p.id);
    await supabase.from("profesores").delete().eq("id", p.id);
    await fetchAll();
    setDeletingId(null);
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

  const paginated = filtered.slice(page*PER_PAGE, (page+1)*PER_PAGE);

  return (
    <>
      <div className="header">
        <div>
          <div className="logo"><div className="dot"/>Profesores</div>
          {materiaFiltro&&<div style={{fontSize:13,color:"var(--text3)",marginTop:4}}>Filtrando por: <span className="tag tag-blue" style={{marginLeft:4}}>{materiaFiltro}</span> <button className="link-btn" style={{fontSize:12,marginLeft:6}} onClick={()=>navigate("/profesores")}>✕ Quitar filtro</button></div>}
        </div>
      </div>

      <div className="search-bar">
        <input value={search} onChange={e=>{setSearch(e.target.value);resetPage();}} placeholder="Buscar profesor o materia..."/>
        <select value={deptFilter} onChange={e=>{setDeptFilter(e.target.value);resetPage();}}>
          <option value="">Todas las áreas</option>
          {depts.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select value={modalidadFilter} onChange={e=>{setModalidadFilter(e.target.value);resetPage();}}>
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
          {tagFilter.length>0&&<button className="tag-filter-btn" onClick={()=>{setTagFilter([]);resetPage();}}>✕ Limpiar</button>}
        </div>
      </div>

      <div className="tabs">
        {[["recientes","Actividad reciente"],["mejor","Mejor calificados"],["todos","Más reseñas"]].map(([k,l])=>(
          <button key={k} className={`tab${tab===k?" active":""}`} onClick={()=>{setTab(k);resetPage();}}>{l}</button>
        ))}
      </div>

      {filtered.length===0&&<div className="empty">No se encontraron profesores</div>}
      {filtered.length>0&&<div style={{fontSize:12,color:"var(--text3)",marginBottom:8}}>{filtered.length} profesor{filtered.length!==1?"es":""} encontrado{filtered.length!==1?"s":""}</div>}

      <div className="prof-list">
        {paginated.map((p,i)=>{
          const c=colorFor(i);
          let revs=resenas[p.id]||[];
          if(modalidadFilter)revs=revs.filter(r=>r.modalidad===modalidadFilter);
          const tagC={};revs.forEach(r=>(r.tags||[]).forEach(t=>(tagC[t]=(tagC[t]||0)+1)));
          const tTop=Object.entries(tagC).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);
          return(
            <div key={p.id} className="prof-card" style={{position:"relative"}} onClick={()=>navigate(`/profesor/${p.id}`)}>
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
              {admin&&(
                <button className="review-action-btn delete" style={{position:"absolute",top:10,right:10,fontSize:11,padding:"2px 8px"}} disabled={deletingId===p.id} onClick={e=>deleteProfesor(e,p)}>
                  {deletingId===p.id?"...":"🗑"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Paginacion page={page} total={filtered.length} onPrev={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>

      <button className="add-review-btn" style={{marginTop:"0.5rem"}} onClick={openNewProf}>
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
            <div className="info-box">Antes de agregar, asegurate de buscarlo arriba. El nombre debe estar completo y bien escrito.</div>
            <div className="form-group"><label className="form-label">Nombre completo *</label><input value={newNombre} onChange={e=>setNewNombre(e.target.value)} placeholder="Ej: María García"/></div>
            <div className="form-group"><label className="form-label">Área / Departamento</label><input value={newDepto} onChange={e=>setNewDepto(e.target.value)} placeholder="Ej: Matemáticas, Economía..."/></div>
            <div className="form-group"><label className="form-label">Materia que dicta</label><input value={newMateria} onChange={e=>setNewMateria(e.target.value)} placeholder="Ej: Cálculo I"/></div>
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