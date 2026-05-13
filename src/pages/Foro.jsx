import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useApp, CATEGORIAS_FORO, CATEGORIA_COLORS, timeAgo, isAdmin } from "../context";
import RichEditor from "../RichEditor";
import UsernameModal from "../modals/UsernameModal";
import AuthModal from "../modals/AuthModal";

export default function ForoPage() {
  const { session, perfil, hilos, respuestas, fetchAll } = useApp();
  const navigate = useNavigate();
  const [foroCat, setForoCat] = useState("");
  const [foroSearch, setForoSearch] = useState("");
  const [showNewHilo, setShowNewHilo] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [cat, setCat] = useState(CATEGORIAS_FORO[0]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const admin = session && isAdmin(session.user.id);

  const filtrados = hilos.filter(h=>{
    const catMatch = !foroCat||h.categoria===foroCat;
    const q = foroSearch.toLowerCase();
    const textMatch = !q||h.titulo.toLowerCase().includes(q)||h.contenido.toLowerCase().includes(q)||(respuestas[h.id]||[]).some(r=>r.texto.toLowerCase().includes(q));
    return catMatch&&textMatch;
  }).sort((a,b)=>{
    // Fijados primero
    if(a.fijado&&!b.fijado) return -1;
    if(!a.fijado&&b.fijado) return 1;
    return new Date(b.created_at)-new Date(a.created_at);
  });

  function openNewHilo() {
    if(!session) { setShowAuthModal(true); return; }
    if(!perfil) { setShowUsername(true); return; }
    setShowNewHilo(true);
  }

  async function submitHilo() {
    if(!titulo.trim()||!contenido.trim()) return;
    setSubmitting(true);
    await supabase.from("hilos").insert({
      user_id: session.user.id,
      username: perfil.username,
      titulo: titulo.trim(),
      contenido,
      categoria: cat,
      fijado: false,
    });
    await fetchAll();
    setShowNewHilo(false); setSubmitting(false); setTitulo(""); setContenido("");
  }

  async function toggleFijar(e, hilo) {
    e.stopPropagation();
    await supabase.from("hilos").update({ fijado: !hilo.fijado }).eq("id", hilo.id);
    await fetchAll();
  }

  async function deleteHilo(e, hilo) {
    e.stopPropagation();
    if(!window.confirm("¿Eliminar este hilo y todas sus respuestas?")) return;
    setDeletingId(hilo.id);
    await supabase.from("respuestas_foro").delete().eq("hilo_id", hilo.id);
    await supabase.from("hilos").delete().eq("id", hilo.id);
    await fetchAll();
    setDeletingId(null);
  }

  const canDelete = (hilo) => admin || (session && session.user.id === hilo.user_id);

  return (
    <>
      <div className="header">
        <div><div className="logo"><div className="dot"/>Foro</div></div>
        <button className="btn-outline" onClick={openNewHilo}>+ Nuevo hilo</button>
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
          <div key={h.id} className="hilo-card" style={{position:"relative",borderColor:h.fijado?"var(--accent)":undefined}} onClick={()=>navigate(`/foro/${h.id}`)}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  {h.fijado&&<span style={{fontSize:11,fontWeight:600,color:"var(--accent)"}}>📌 Fijado</span>}
                  <span className="cat-badge" style={{background:CATEGORIA_COLORS[h.categoria]?.bg,color:CATEGORIA_COLORS[h.categoria]?.color}}>{h.categoria}</span>
                </div>
                <div className="hilo-titulo">{h.titulo}</div>
                <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>
                  por <span style={{color:"var(--accent)"}}>@{h.username}</span> · {timeAgo(h.created_at)}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:18,fontWeight:700,color:"var(--text)"}}>{(respuestas[h.id]||[]).length}</div>
                  <div style={{fontSize:11,color:"var(--text4)"}}>respuestas</div>
                </div>
                <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                  {admin&&(
                    <button
                      className="review-action-btn admin"
                      style={{fontSize:11,padding:"2px 8px"}}
                      onClick={e=>toggleFijar(e,h)}
                    >
                      {h.fijado?"Desfijar":"📌 Fijar"}
                    </button>
                  )}
                  {canDelete(h)&&(
                    <button
                      className="review-action-btn delete"
                      style={{fontSize:11,padding:"2px 8px"}}
                      disabled={deletingId===h.id}
                      onClick={e=>deleteHilo(e,h)}
                    >
                      {deletingId===h.id?"...":"🗑"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showUsername&&<UsernameModal onClose={()=>setShowUsername(false)}/>}
      {showAuthModal&&<AuthModal onClose={()=>setShowAuthModal(false)} onNeedUsername={()=>{setShowAuthModal(false);setShowUsername(true);}}/>}

      {showNewHilo&&(
        <div className="modal-overlay" onClick={()=>setShowNewHilo(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Nuevo hilo de discusión</div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select value={cat} onChange={e=>setCat(e.target.value)}>
                {CATEGORIAS_FORO.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Título</label>
              <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="¿Sobre qué querés hablar?"/>
            </div>
            <div className="form-group">
              <label className="form-label">Contenido</label>
              <RichEditor value={contenido} onChange={setContenido} placeholder="Desarrollá tu pregunta o tema..."/>
            </div>
            <div className="foro-hint">💡 Podés pegar links de imágenes (imgur.com) o archivos (drive.google.com).</div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={()=>setShowNewHilo(false)}>Cancelar</button>
              <button className="btn-primary" onClick={submitHilo} disabled={submitting}>{submitting?"Publicando...":"Publicar hilo"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}