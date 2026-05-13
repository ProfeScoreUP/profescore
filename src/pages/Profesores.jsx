import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp, ALL_TAGS, colorFor, initials, avgRating, ratingPillClass, tagClass } from "../context";

export default function ProfesoresPage() {
  const { profesores, resenas, materias } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const materiaFiltro = searchParams.get("materia") || "";

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [modalidadFilter, setModalidadFilter] = useState("");
  const [tagFilter, setTagFilter] = useState([]);
  const [tab, setTab] = useState("recientes");

  const depts = [...new Set(profesores.map(p=>p.departamento))].sort();

  function toggleTag(t) { setTagFilter(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]); }

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
        <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}><option value="">Todas las áreas</option>{depts.map(d=><option key={d} value={d}>{d}</option>)}</select>
        <select value={modalidadFilter} onChange={e=>setModalidadFilter(e.target.value)}><option value="">Presencial y online</option><option value="Presencial">Presencial</option><option value="Online">Online</option></select>
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
    </>
  );
}
