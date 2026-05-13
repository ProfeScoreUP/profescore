import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useApp, CATEGORIAS_FORO, CATEGORIA_COLORS, timeAgo } from "../context";
import RichEditor from "../RichEditor";
import UsernameModal from "../modals/UsernameModal";

export default function ForoPage() {
  const { session, perfil, hilos, respuestas, fetchAll } = useApp();
  const navigate = useNavigate();
  const [foroCat, setForoCat] = useState("");
  const [foroSearch, setForoSearch] = useState("");
  const [showNewHilo, setShowNewHilo] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [cat, setCat] = useState(CATEGORIAS_FORO[0]);
  const [submitting, setSubmitting] = useState(false);

  const filtrados = hilos.filter(h=>{
    const catMatch = !foroCat||h.categoria===foroCat;
    const q = foroSearch.toLowerCase();
    const textMatch = !q||h.titulo.toLowerCase().includes(q)||h.contenido.toLowerCase().includes(q)||(respuestas[h.id]||[]).some(r=>r.texto.toLowerCase().includes(q));
    return catMatch&&textMatch;
  });

  async function submitHilo() {
    if(!titulo.trim()||!contenido.trim()) return;
    if(!session){return;}
    if(!perfil){setShowNewHilo(false);setShowUsername(true);return;}
    setSubmitting(true);
    await supabase.from("hilos").insert({user_id:session.user.id,username:perfil.username,titulo:titulo.trim(),contenido,categoria:cat});
    await fetchAll();setShowNewHilo(false);setSubmitting(false);setTitulo("");setContenido("");
  }

  return (
    <>
      <div className="header">
        <div><div className="logo"><div className="dot"/>Foro</div></div>
        {session&&<button className="btn-outline" onClick={()=>setShowNewHilo(true)}>+ Nuevo hilo</button>}
      </div>
      <div className="search-bar" style={{marginBottom:"0.75rem"}}>
        <input value={foroSearch} onChange={e=>setForoSearch(e.target.value)} placeholder="Buscar en el foro..."/>
      </div>
      <div className="cat-filter-row">
        <button className={`cat-filter-btn${!foroCat?" active":""}`} onClick={()=>setForoCat("")}>Todos</button>
        {CATEGORIAS_FORO.map(c=><button key={c} className={`cat-filter-btn${foroCat===c?" active":""}`} onClick={()=>setForoCat(c)}>{c}</button>)}
      </div>
      {filtrados.length===0&&<div className="empty">No hay hilos todavía</div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtrados.map(h=>(
          <div key={h.id} className="hilo-card" onClick={()=>navigate(`/foro/${h.id}`)}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  <span className="cat-badge" style={{background:CATEGORIA_COLORS[h.categoria]?.bg,color:CATEGORIA_COLORS[h.categoria]?.color}}>{h.categoria}</span>
                </div>
                <div className="hilo-titulo">{h.titulo}</div>
                <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>por <span style={{color:"var(--accent)"}}>@{h.username}</span> · {timeAgo(h.created_at)}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:18,fontWeight:700,color:"var(--text)"}}>{(respuestas[h.id]||[]).length}</div>
                <div style={{fontSize:11,color:"var(--text4)"}}>respuestas</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showUsername&&<UsernameModal onClose={()=>setShowUsername(false)}/>}

      {showNewHilo&&<div className="modal-overlay" onClick={()=>setShowNewHilo(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Nuevo hilo de discusión</div>
        <div className="form-group"><label className="form-label">Categoría</label><select value={cat} onChange={e=>setCat(e.target.value)}>{CATEGORIAS_FORO.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Título</label><input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="¿Sobre qué querés hablar?"/></div>
        <div className="form-group"><label className="form-label">Contenido</label><RichEditor value={contenido} onChange={setContenido} placeholder="Desarrollá tu pregunta o tema..."/></div>
        <div className="foro-hint">💡 Podés pegar links de imágenes (imgur.com) o archivos (drive.google.com).</div>
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowNewHilo(false)}>Cancelar</button><button className="btn-primary" onClick={submitHilo} disabled={submitting}>{submitting?"Publicando...":"Publicar hilo"}</button></div>
      </div></div>}
    </>
  );
}
