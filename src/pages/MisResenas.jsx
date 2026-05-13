import { useApp } from "../context";
import ReviewCard from "../ReviewCard";

export default function MisResenasPage({ tipo = "resenas" }) {
  const { session, resenas, comentarios, votos, profesores } = useApp();
  const allRevenas = Object.values(resenas).flat();

  if(!session) return <div className="empty">Iniciá sesión para ver tu actividad.</div>;

  if(tipo==="comentarios") {
    const myComments = Object.values(comentarios).flat().filter(c=>c.user_id===session.user.id);
    return (
      <>
        <div className="section-title" style={{marginBottom:"1rem"}}>Mis comentarios <span style={{fontWeight:400,color:"var(--text4)",fontSize:13}}>{myComments.length} en total</span></div>
        {myComments.length===0&&<div className="empty">Todavía no comentaste ninguna reseña</div>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {myComments.map(c=>{
            const r = allRevenas.find(x=>x.id===c.resena_id);
            const prof = r?profesores.find(p=>p.id===r.profesor_id):null;
            return(
              <div key={c.id} className="review-card">
                {prof&&<div style={{fontSize:12,color:"var(--text3)",marginBottom:6}}>{prof.nombre} · {r.materia}</div>}
                <div style={{fontSize:13,color:"var(--text2)"}}>{c.texto}</div>
                <div style={{fontSize:11,color:"var(--text4)",marginTop:4}}>{new Date(c.created_at).toLocaleDateString("es-AR",{month:"short",year:"numeric"})}</div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  if(tipo==="votadas") {
    const myVotedIds = Object.entries(votos).filter(([,vs])=>vs.some(v=>v.user_id===session.user.id)).map(([id])=>id);
    const votedReviews = allRevenas.filter(r=>myVotedIds.includes(r.id));
    return (
      <>
        <div className="section-title" style={{marginBottom:"1rem"}}>Reseñas votadas <span style={{fontWeight:400,color:"var(--text4)",fontSize:13}}>{votedReviews.length}</span></div>
        {votedReviews.length===0&&<div className="empty">Todavía no votaste ninguna reseña</div>}
        {votedReviews.map(r=><ReviewCard key={r.id} r={r} showProf/>)}
      </>
    );
  }

  const myReviews = allRevenas.filter(r=>r.user_id===session.user.id);
  return (
    <>
      <div className="section-title" style={{marginBottom:"1rem"}}>Mis reseñas <span style={{fontWeight:400,color:"var(--text4)",fontSize:13}}>{myReviews.length} en total</span></div>
      {myReviews.length===0&&<div className="empty">Todavía no dejaste ninguna reseña</div>}
      {myReviews.map(r=><ReviewCard key={r.id} r={r} showProf/>)}
    </>
  );
}
