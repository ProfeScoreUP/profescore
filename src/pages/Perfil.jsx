import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useApp, Avatar, initials, CARRERAS } from "../context";
import ReviewCard from "../ReviewCard";

export default function PerfilPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, perfil, fetchPerfil, perfilesMap, resenas, comentarios, hilos, fetchAll } = useApp();

  const viewingUser = perfilesMap[id];
  const isOwnProfile = session&&session.user.id===id;
  const allRevenas = Object.values(resenas).flat();

  const [showEdit, setShowEdit] = useState(false);
  const [editFoto, setEditFoto] = useState("");
  const [editCarrera, setEditCarrera] = useState("");
  const [editDesc, setEditDesc] = useState("");

  if(!viewingUser) return <div className="empty">Perfil no encontrado</div>;

  function openEdit() {
    setEditFoto(perfil?.foto_url||"");setEditCarrera(perfil?.carrera||"");setEditDesc(perfil?.descripcion||"");setShowEdit(true);
  }

  async function saveProfile() {
    await supabase.from("perfiles").update({foto_url:editFoto,carrera:editCarrera,descripcion:editDesc}).eq("id",session.user.id);
    await fetchPerfil(session.user.id);await fetchAll();setShowEdit(false);
  }

  const userRevenas = allRevenas.filter(r=>r.user_id===id);
  const userComments = Object.values(comentarios).flat().filter(c=>c.user_id===id);
  const userHilos = hilos.filter(h=>h.user_id===id);

  return (
    <>
      <button className="back-btn" style={{marginBottom:"1.25rem"}} onClick={()=>navigate(-1)}>← Volver</button>
      <div className="profile-header">
        <div className="profile-avatar">{viewingUser.foto_url?<img src={viewingUser.foto_url} alt={viewingUser.username}/>:initials(viewingUser.username||"?")}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div className="profile-username">@{viewingUser.username}</div>
            {userRevenas.some(r=>r.verified)&&<span className="badge-up">✓ Alumno UP</span>}
          </div>
          {viewingUser.carrera&&<div className="profile-carrera">{viewingUser.carrera}</div>}
          {viewingUser.descripcion&&<div className="profile-descripcion">{viewingUser.descripcion}</div>}
          <div className="profile-stats" style={{marginTop:8}}>
            <span className="profile-stat"><strong>{userRevenas.length}</strong> reseñas</span>
            <span className="profile-stat"><strong>{userComments.length}</strong> comentarios</span>
            <span className="profile-stat"><strong>{userHilos.length}</strong> hilos</span>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8}}>
            {isOwnProfile&&<button className="profile-edit-btn" onClick={openEdit}>✎ Editar perfil</button>}
            {session&&!isOwnProfile&&<button className="msg-user-btn" onClick={()=>navigate(`/mensajes/${id}`)}>✉️ Enviar mensaje</button>}
          </div>
        </div>
      </div>

      <div className="section-title">Reseñas de @{viewingUser.username}</div>
      {userRevenas.length===0&&<div className="empty">Sin reseñas todavía</div>}
      {userRevenas.map(r=><ReviewCard key={r.id} r={r} showProf/>)}

      {showEdit&&<div className="modal-overlay" onClick={()=>setShowEdit(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Editar perfil</div>
        <div className="form-group"><label className="form-label">URL de foto de perfil</label><input value={editFoto} onChange={e=>setEditFoto(e.target.value)} placeholder="https://i.imgur.com/tu-foto.jpg"/>{editFoto&&<img src={editFoto} alt="preview" className="foto-preview" onError={e=>e.target.style.display="none"}/>}<div style={{fontSize:11,color:"var(--text4)",marginTop:4}}>Subí tu foto a <a href="https://imgur.com" target="_blank" rel="noreferrer" style={{color:"var(--accent)"}}>imgur.com</a> y pegá el link directo.</div></div>
        <div className="form-group"><label className="form-label">Carrera</label><select value={editCarrera} onChange={e=>setEditCarrera(e.target.value)}><option value="">Sin especificar</option>{CARRERAS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Sobre mí</label><textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} placeholder="Contá algo sobre vos..."/></div>
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowEdit(false)}>Cancelar</button><button className="btn-primary" onClick={saveProfile}>Guardar</button></div>
      </div></div>}
    </>
  );
}
