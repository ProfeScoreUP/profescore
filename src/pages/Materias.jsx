import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, ALL_TAGS } from "../context";

export default function MateriasPage() {
  const { materias, profesores, resenas } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState([]);

  function toggleTag(t) { setTagFilter(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]); }

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
          <div key={m.id} className="materia-card" onClick={()=>navigate(`/profesores?materia=${encodeURIComponent(m.nombre)}`)}>
            <div className="materia-nombre">{m.nombre}</div>
            <div className="materia-meta">{m.profCount} profesor{m.profCount!==1?"es":""}</div>
          </div>
        ))}
      </div>
    </>
  );
}
