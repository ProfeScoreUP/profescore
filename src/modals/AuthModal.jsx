import { useState } from "react";
import { supabase } from "../supabase";
import { randomUsername } from "../context";

export default function AuthModal({ onClose, onNeedUsername }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    setLoading(true); setMsg("");
    if(mode==="login") {
      const{error}=await supabase.auth.signInWithPassword({email,password});
      if(error) setMsg("Email o contraseña incorrectos.");
      else onClose();
    } else {
      const{error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:"https://profescore-eta.vercel.app"}});
      if(error) setMsg(error.message);
      else setMsg("¡Revisá tu email y hacé clic en el link de confirmación!");
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{mode==="login"?"Iniciar sesión":"Crear cuenta"}</div>
        {mode==="register"&&<>
          <div className="info-box">Si usás tu email <strong>@up.edu.ar</strong>, tus reseñas tendrán el badge <span className="badge-up">✓ Alumno UP</span></div>
          <div className="info-box warning">⚠️ No uses una contraseña que tengas en otras cuentas. Usá una contraseña única.</div>
        </>}
        <div className="form-group"><label className="form-label">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/></div>
        <div className="form-group"><label className="form-label">Contraseña</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></div>
        {msg&&<div className={`auth-msg${msg.includes("Revisá")?" success":""}`}>{msg}</div>}
        {msg.includes("Revisá")
          ?<button className="btn-primary" onClick={onNeedUsername}>Elegir mi nombre →</button>
          :<div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleAuth} disabled={loading}>{loading?"...":mode==="login"?"Entrar":"Registrarme"}</button>
          </div>
        }
        <div className="auth-switch">
          {mode==="login"
            ?<>¿No tenés cuenta? <button onClick={()=>{setMode("register");setMsg("");}}>Registrate</button></>
            :<>¿Ya tenés cuenta? <button onClick={()=>{setMode("login");setMsg("");}}>Iniciá sesión</button></>
          }
        </div>
      </div>
    </div>
  );
}