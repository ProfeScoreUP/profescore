import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useApp, CATEGORIA_COLORS, timeAgo, Avatar } from "../context";
import { RichDisplay } from "../RichEditor";
import RichEditor from "../RichEditor";
import UsernameModal from "../modals/UsernameModal";

export default function HiloPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, perfil, hilos, respuestas, perfilesMap, fetchAll } = useApp();

  const hilo = hilos.find(h=>h.id===id);
  const hiloRespuestas = respuestas[id] || [];

  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [showUsername, setShowUsername] = useState(false);

  if(!hilo) return <div className="empty">Hilo no encontrado</div>;

  async function submitRespuesta() {
    if(!respuestaTexto.trim()||!session) return;
    if(!perfil){setShowUsername(true);return;}
    await supabase.from("respuestas_foro").insert({hilo_id:hilo.id,user_id:session.user.id,username:perfil.username,texto:respuestaTexto});
    setRespuestaTexto("");await fetchAll();
  }

  return (
    <>
      <button className="back-btn" style={{marginBottom:"1rem"}} onClick={()=>navigate("/foro")}>← Volver al foro</button>

      <div className="hilo-header">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
          <span className="cat-badge" style={{background:CATEGORIA_COLORS[hilo.categoria]?.bg,color:CATEGORIA_COLORS[hilo.categoria]?.color}}>{hilo.categoria}</span>
          <span style={{fontSize:12,color:"var(--text4)"}}>{timeAgo(hilo.created_at)}</span>
        </div>
        <div className="hilo-titulo">{hilo.titulo}</div>
        <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>por <span className="review-username" style={{cursor:"pointer"}} onClick={()=>navigate(`/perfil/${hilo.user_id}`)}>@{hilo.username}</span></div>
        <div className="hilo-contenido"><RichDisplay html={hilo.contenido}/></div>
      </div>

      <div className="foro-hint">💡 Podés compartir links de imágenes (imgur.com) o archivos (drive.google.com) en tus respuestas.</div>

      <div className="section-title" style={{margin:"1.25rem 0 10px"}}>
        Respuestas <span style={{fontWeight:400,color:"var(--text4)",fontSize:13}}>{hiloRespuestas.length}</span>
      </div>

      {hiloRespuestas.length===0&&<div className="empty">Sé el primero en responder</div>}
      {hiloRespuestas.map(r=>{
        const rp = perfilesMap[r.user_id];
        return(
          <div key={r.id} className="respuesta-item">
            <Avatar url={rp?.foto_url} name={r.username} size={36} fontSize={13}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                <span className="comment-username" style={{cursor:"pointer"}} onClick={()=>r.user_id&&navigate(`/perfil/${r.user_id}`)}>@{r.username}</span>
                {rp?.carrera&&<span className="comment-carrera">{rp.carrera}</span>}
                <span className="comment-date">{timeAgo(r.created_at)}</span>
              </div>
              <RichDisplay html={r.texto}/>
            </div>
          </div>
        );
      })}

      {session?(
        <div style={{marginTop:"1.25rem"}}>
          <div style={{fontSize:12,color:"var(--text3)",marginBottom:6,fontWeight:500}}>Tu respuesta:</div>
          <RichEditor value={respuestaTexto} onChange={setRespuestaTexto} placeholder="Escribí tu respuesta..."/>
          <button className="btn-primary" style={{marginTop:8,width:"100%"}} onClick={submitRespuesta}>Responder</button>
        </div>
      ):(
        <div className="comment-login-hint" style={{marginTop:"1rem"}}>
          <button className="link-btn" onClick={()=>navigate("/")}>Iniciá sesión</button> para responder.
        </div>
      )}

      {showUsername&&<UsernameModal onClose={()=>setShowUsername(false)}/>}
    </>
  );
}
