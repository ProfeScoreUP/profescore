import { useState } from "react";
import { supabase } from "../supabase";
import { useApp, randomUsername } from "../context";

export default function UsernameModal({ onClose }) {
  const { session, fetchPerfil } = useApp();
  const [username, setUsername] = useState(randomUsername());
  const [msg, setMsg] = useState("");

  async function save() {
    if(!username.trim()) return;
    setMsg("");
    const{error}=await supabase.from("perfiles").insert({id:session.user.id,username:username.trim()});
    if(error){setMsg("Ese nombre ya está en uso, elegí otro.");return;}
    await fetchPerfil(session.user.id);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Elegí tu nombre en ProfeScore</div>
        <div className="info-box">Este nombre es solo para identificarte. No tiene por qué ser tu nombre real.</div>
        <div className="form-group"><label className="form-label">Tu nombre</label><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Ej: TigreVeloz"/></div>
        <button className="add-materia-btn" style={{marginBottom:10}} onClick={()=>setUsername(randomUsername())}>🔀 Generar otro nombre aleatorio</button>
        {msg&&<div className="auth-msg">{msg}</div>}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save}>Confirmar nombre</button>
        </div>
      </div>
    </div>
  );
}