import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useApp, starsStr, tagClass, timeAgo, isAdmin, Avatar, initials } from "../context";
import { RichDisplay } from "./RichEditor";

export default function ReviewCard({ r, showProf = false }) {
  const { session, perfil, profesores, perfilesMap, votos, setVotos, comentarios, fetchAll } = useApp();
  const navigate = useNavigate();
  const [showComs, setShowComs] = useState(false);
  const [comText, setComText] = useState("");

  const isOwner = session && r.user_id === session.user.id;
  const isAdminUser = session && isAdmin(session.user.id);
  const revVotos = votos[r.id] || [];
  const likes = revVotos.filter(v=>v.tipo==="like").length;
  const dislikes = revVotos.filter(v=>v.tipo==="dislike").length;
  const miVoto = session ? revVotos.find(v=>v.user_id===session.user.id) : null;
  const puedeVotar = session && !isOwner;
  const revComs = comentarios[r.id] || [];
  const userPerfil = perfilesMap[r.user_id];
  const prof = profesores.find(p=>p.id===r.profesor_id);

  async function handleVoto(tipo) {
    if(!session) return;
    if(session.user.id===r.user_id) return;
    const miVotoActual = revVotos.find(v=>v.user_id===session.user.id);
    if(miVotoActual) {
      if(miVotoActual.tipo===tipo) await supabase.from("votos").delete().eq("id",miVotoActual.id);
      else await supabase.from("votos").update({tipo}).eq("id",miVotoActual.id);
    } else {
      await supabase.from("votos").insert({resena_id:r.id,user_id:session.user.id,tipo});
    }
    const{data:vots}=await supabase.from("votos").select("*");
    const votMap={};(vots||[]).forEach(v=>{if(!votMap[v.resena_id])votMap[v.resena_id]=[];votMap[v.resena_id].push(v);});
    setVotos(votMap);
  }

  async function handleComment() {
    if(!session||!perfil||!comText.trim()) return;
    await supabase.from("comentarios").insert({resena_id:r.id,user_id:session.user.id,username:perfil.username,texto:comText.trim()});
    setComText("");
    await fetchAll();
  }

  async function deleteReview() {
    if(!confirm("¿Querés eliminar esta reseña?")) return;
    await supabase.from("resenas").delete().eq("id",r.id);
    await fetchAll();
  }

  return (
    <div className="review-card">
      {showProf&&prof&&<div style={{fontSize:12,color:"var(--text3)",marginBottom:6,fontWeight:600,cursor:"pointer"}} onClick={()=>navigate(`/profesor/${prof.id}`)}>{prof.nombre} · <span style={{fontWeight:400}}>{r.materia}</span></div>}
      <div className="review-top">
        <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
          {!showProf&&<span className="review-materia">{r.materia}</span>}
          <span className="stars">{starsStr(r.rating)}</span>
          <span className={`modalidad-badge${r.modalidad==="Online"?" online":""}`}>{r.modalidad||"Presencial"}</span>
          {r.verified?<span className="badge-up">✓ Alumno UP</span>:r.is_guest?<span className="badge-guest">Invitado</span>:null}
          {r.username&&<span className="review-username" onClick={()=>r.user_id&&navigate(`/perfil/${r.user_id}`)}>@{r.username}</span>}
          {userPerfil?.carrera&&<span className="review-carrera">· {userPerfil.carrera}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span className="review-date">{new Date(r.created_at).toLocaleDateString("es-AR",{month:"short",year:"numeric"})}</span>
          {(isOwner||isAdminUser)&&<div style={{display:"flex",gap:4}}>
            {isOwner&&<button className="review-action-btn" onClick={()=>navigate(`/profesor/${r.profesor_id}?editar=${r.id}`)}>✎</button>}
            <button className="review-action-btn delete" onClick={deleteReview}>✕</button>
          </div>}
        </div>
      </div>
      <RichDisplay html={r.texto}/>
      {(r.tags||[]).length>0&&<div className="tags" style={{marginTop:8}}>{r.tags.map(t=><span key={t} className={`tag ${tagClass(t)}`}>{t}</span>)}</div>}
      <div className="vote-row">
        <span className="vote-label">¿Estás de acuerdo?</span>
        <button className={`vote-btn like${miVoto?.tipo==="like"?" active":""} ${!puedeVotar?"disabled":""}`} onClick={()=>puedeVotar&&handleVoto("like")}>👍 {likes}</button>
        <button className={`vote-btn dislike${miVoto?.tipo==="dislike"?" active":""} ${!puedeVotar?"disabled":""}`} onClick={()=>puedeVotar&&handleVoto("dislike")}>👎 {dislikes}</button>
        <button className="comments-toggle" onClick={()=>setShowComs(!showComs)}>💬 {revComs.length} {showComs?"▲":"▼"}</button>
      </div>
      {showComs&&<div className="comments-section">
        {revComs.length===0&&<div className="comment-empty">No hay comentarios todavía.</div>}
        {revComs.map(c=>{const cp=perfilesMap[c.user_id];return(
          <div key={c.id} className="comment-item">
            <div className="comment-avatar" onClick={()=>c.user_id&&navigate(`/perfil/${c.user_id}`)}>{cp?.foto_url?<img src={cp.foto_url} alt={c.username}/>:initials(c.username)}</div>
            <div className="comment-body">
              <div className="comment-meta">
                <span className="comment-username" onClick={()=>c.user_id&&navigate(`/perfil/${c.user_id}`)}>@{c.username}</span>
                {cp?.carrera&&<span className="comment-carrera">{cp.carrera}</span>}
                <span className="comment-date">{timeAgo(c.created_at)}</span>
              </div>
              <div className="comment-text">{c.texto}</div>
            </div>
          </div>
        );})}
        {session
          ?<div className="comment-input-row">
            <input value={comText} onChange={e=>setComText(e.target.value)} placeholder={perfil?`Comentar como @${perfil.username}...`:"Comentar..."} onKeyDown={e=>e.key==="Enter"&&handleComment()}/>
            <button className="btn-primary" style={{flex:"none",padding:"6px 14px",fontSize:13}} onClick={handleComment}>Enviar</button>
          </div>
          :<div className="comment-login-hint">Iniciá sesión para comentar.</div>
        }
      </div>}
    </div>
  );
}