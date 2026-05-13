import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, ALL_TAGS, isAdmin } from "../context";
import { supabase } from "../supabase";

export default function MateriasPage() {
  const { session, materias, profesores, resenas, fetchAll } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const admin = session && isAdmin(session.user.id);

  function toggleTag(t) { setTagFilter(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]); }

  async function deleteMateria(e, m) {
    e.stopPropagation();
    if(!window.confirm(`¿Eliminar la materia "${m.nombre}"?`)) return;
    setDeletingId(m.id);
    await supabase.from("materias").delete().eq("id", m.id);
    await fetchAll();
    setDeletingId(null);
  }

  const filtered = materias.filter(m=>{
    const q = search.toLowerCase();
    const textMatch = !q || m.nombre.toLowerCase().includes(q);
    const profs = profesores.filter(p=>(p.materias||[]).includes(m.nombre));
    const hasTags = tagFilter.length===0 || profs.some(p=>{
      const profTags = new Set((resenas[p.id]||[]).flatMap(r=>r.tags||[]));
      return tagFilter.every(t=>profTags.has(t));
    });
    return textMatch && hasTags;
  }).map(m=>{
    const profs = profesores.filter(p=>(p.materias||[]).includes(m.nombre));
    const revs = profs.flatMap(p=>resenas[p.id]||[]);
    const lastRev = revs.length>0 ? Math.max(...revs.map(r=>new Date(r.created_at))) : 0;
    return {...m, profCount:profs.length, lastRev};
  }).sort((a,b)=>b.lastRev-a.lastRev);

  return (
    <>
      <div className="header">
        <div><div className="logo"><div className="dot"/>Materias</div></div>
      </div>
      <div className="search-bar">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar materia..."/>
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
      {filtered.length===0&&<div className="empty">No se encontraron materias</div>}
      <div className="materias-grid">
        {filtered.map(m=>(
          <div key={m.id} className="materia-card" style={{position:"relative"}} onClick={()=>navigate(`/profesores?materia=${encodeURIComponent(m.nombre)}`)}>
            <div className="materia-nombre">{m.nombre}</div>
            <div className="materia-meta">{m.profCount} profesor{m.profCount!==1?"es":""}</div>
            {admin&&(
              <button
                className="review-action-btn delete"
                style={{position:"absolute",top:8,right:8,fontSize:11,padding:"2px 6px"}}
                disabled={deletingId===m.id}
                onClick={e=>deleteMateria(e,m)}
              >
                {deletingId===m.id?"...":"🗑"}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}