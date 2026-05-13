// Comunidad.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, Avatar } from "../context";

export function ComunidadPage() {
  const { perfilesMap, resenas, session } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const allRevenas = Object.values(resenas).flat();

  const users = Object.values(perfilesMap).filter(p=>
    p.username?.toLowerCase().includes(search.toLowerCase())||
    p.carrera?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="header"><div><div className="logo"><div className="dot"/>Comunidad</div></div></div>
      <div className="search-bar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o carrera..."/></div>
      {!session
        ?<div className="empty">Iniciá sesión para ver los perfiles.</div>
        :<div className="users-list">{users.map(p=>(
          <div key={p.id} className="user-card" onClick={()=>navigate(`/perfil/${p.id}`)}>
            <Avatar url={p.foto_url} name={p.username} size={40} fontSize={14}/>
            <div><div style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>@{p.username}</div>{p.carrera&&<div style={{fontSize:12,color:"var(--text3)"}}>{p.carrera}</div>}</div>
            <div style={{marginLeft:"auto",fontSize:12,color:"var(--text4)"}}>{allRevenas.filter(r=>r.user_id===p.id).length} reseñas</div>
          </div>
        ))}</div>
      }
    </>
  );
}

export default ComunidadPage;
