import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import "./App.css";

const ADMIN_ID = "bb0e6c4c-c4de-4679-b3bc-0bd318f2e5c1";
const CONTACT_EMAIL = "profescoreup@gmail.com";
const UP_LOGO = "https://i.imgur.com/pkwdNzA.png";

const CATEGORIAS_FORO = [
  "Aranceles y pagos",
  "Ayuda con estudio",
  "Inscripción a materias",
  "Vida universitaria",
  "Pasantías y trabajo",
  "Tecnología y herramientas",
  "Otros / General",
];

const COLORS = [
  { bg: "#E1F5EE", color: "#085041" },
  { bg: "#E6F1FB", color: "#0C447C" },
  { bg: "#FAEEDA", color: "#633806" },
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#FBEAF0", color: "#72243E" },
  { bg: "#FAECE7", color: "#712B13" },
];

const ALL_TAGS = [
  "Explica bien","Exigente","Buena onda","Parciales difíciles","Claro","Aburrido",
  "Respondus","Buenas devoluciones","Comprometido","Oral difícil","Brinda apoyo","Muchas tareas","Buenas clases",
];

const PREGUNTAS_ONLINE = [
  "¿Qué tal es el contenido de los módulos? ¿Es claro y completo?",
  "¿Ofrece clases de consulta sincrónicas?",
  "¿Da devoluciones completas de las actividades y parciales?",
  "¿Hace un seguimiento semana a semana?",
  "¿Da actividades con entrega obligatoria en cada módulo?",
  "¿Cómo es el oral?",
];

const PREGUNTAS_PRESENCIAL = [
  "¿Cómo explica en clase? ¿Es claro y organizado?",
  "¿Está disponible para consultas antes/después de clase o por mail?",
  "¿Cómo son los parciales en relación a lo que se vio en clase?",
  "¿Da devoluciones de los parciales y trabajos prácticos?",
  "¿Cumple con el horario y el programa de la materia?",
  "¿Recomendarías cursar con este profesor?",
];

const DISCLAIMER = "Recordá que una buena reseña ayuda a tus compañeros a tomar mejores decisiones. Intentá ser objetivo/a: una mala nota no siempre significa un mal profesor. Contá tu experiencia real.";

const CARRERAS = [
  "Lic. en Administración","Lic. en Economía","Lic. en Marketing","Lic. en Recursos Humanos",
  "Lic. en Comercio Internacional","Lic. en Sistemas","Contador Público","Ing. Industrial",
  "Lic. en Psicología","Lic. en Comunicación","Diseño Gráfico","Arquitectura","Abogacía","Otra",
];

const ADJ = ["Tigre","Luna","Viento","Piedra","Nube","Rio","Fuego","Hielo","Trueno","Bosque","Mar","Estrella","Rayo","Niebla","Selva","Pico","Lago","Ola","Bruma","Cima"];
const SUST = ["Veloz","Nomade","Calmo","Sabio","Feroz","Libre","Sereno","Agil","Bravo","Fiero","Quieto","Audaz","Firme","Leve","Hondo","Vivo","Claro","Oscuro","Suave","Fuerte"];

function randomUsername() { return ADJ[Math.floor(Math.random()*ADJ.length)] + SUST[Math.floor(Math.random()*SUST.length)]; }
function initials(name) { return (name||"?").split(" ").filter((w)=>w.length>2).slice(0,2).map((w)=>w[0]).join("")||(name||"?")[0]; }
function colorFor(i) { return COLORS[i%COLORS.length]; }
function avgRating(reviews) { if(!reviews.length) return 0; return reviews.reduce((a,b)=>a+b.rating,0)/reviews.length; }
function ratingColor(r) { if(r>=4) return "#1D9E75"; if(r>=3) return "#BA7517"; return "#E24B4A"; }
function starsStr(r) { return "★".repeat(Math.round(r))+"☆".repeat(5-Math.round(r)); }
function tagClass(t) {
  const pos=["Explica bien","Buena onda","Claro","Buenas devoluciones","Comprometido","Brinda apoyo","Buenas clases"];
  const neg=["Aburrido","Oral difícil","Muchas tareas","Respondus"];
  if(pos.includes(t)) return "tag-green"; if(neg.includes(t)) return "tag-red"; return "tag-amber";
}
function isUP(email) { return email&&email.endsWith("@up.edu.ar"); }
function isAdmin(uid) { return uid===ADMIN_ID; }
function timeAgo(ts) {
  const d=new Date(ts); const now=new Date(); const diff=Math.floor((now-d)/1000);
  if(diff<60) return "ahora"; if(diff<3600) return `${Math.floor(diff/60)}m`;
  if(diff<86400) return `${Math.floor(diff/3600)}h`;
  return d.toLocaleDateString("es-AR",{day:"numeric",month:"short"});
}
function aiSummary(prof,reviews) {
  if(!reviews.length) return "";
  const avg=avgRating(reviews);
  const allTags={};
  reviews.forEach((r)=>(r.tags||[]).forEach((t)=>(allTags[t]=(allTags[t]||0)+1)));
  const top=Object.entries(allTags).sort((a,b)=>b[1]-a[1]).map(([t])=>t);
  const apellido=prof.nombre.split(" ").pop();
  if(avg>=4.5) return `Los estudiantes tienen una opinión muy positiva de ${apellido}. Destacado por ser ${top.slice(0,2).join(" y ")}. Muy recomendado.`;
  if(avg>=3.5) return `${apellido} tiene buenas reseñas. Los estudiantes valoran que es ${top[0]||"comprometido"}, aunque la materia requiere dedicación.`;
  if(avg>=2.5) return `Las opiniones sobre ${apellido} son mixtas. Algunos rescatan ${top[0]||"su conocimiento"}, pero otros señalan dificultades.`;
  return `La mayoría tuvo dificultades con ${apellido}. Las reseñas mencionan ${top.slice(0,2).join(" y ")} como aspectos negativos.`;
}

function Avatar({url,name,size=44,fontSize=14}) {
  const c=colorFor((name||"").charCodeAt(0)%COLORS.length);
  if(url) return <div style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",flexShrink:0}}><img src={url} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>;
  return <div style={{width:size,height:size,borderRadius:"50%",background:c.bg,color:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize,flexShrink:0}}>{initials(name)}</div>;
}

const CATEGORIA_COLORS = {
  "Aranceles y pagos": {bg:"#FAEEDA",color:"#854F0B"},
  "Ayuda con estudio": {bg:"#E1F5EE",color:"#0F6E56"},
  "Inscripción a materias": {bg:"#E6F1FB",color:"#185FA5"},
  "Vida universitaria": {bg:"#EEEDFE",color:"#3C3489"},
  "Pasantías y trabajo": {bg:"#FBEAF0",color:"#72243E"},
  "Tecnología y herramientas": {bg:"#FCEBEB",color:"#A32D2D"},
  "Otros / General": {bg:"#f5f5f0",color:"#555"},
};

export default function App() {
  const [session,setSession]=useState(null);
  const [perfil,setPerfil]=useState(null);
  const [perfilesMap,setPerfilesMap]=useState({});
  const [profesores,setProfesores]=useState([]);
  const [resenas,setResenas]=useState({});
  const [materias,setMaterias]=useState([]);
  const [votos,setVotos]=useState({});
  const [comentarios,setComentarios]=useState({});
  const [mensajes,setMensajes]=useState([]);
  const [hilos,setHilos]=useState([]);
  const [respuestas,setRespuestas]=useState({});
  const [loading,setLoading]=useState(true);
  const [unreadCount,setUnreadCount]=useState(0);
  const [actividadReciente,setActividadReciente]=useState([]);

  const [view,setView]=useState("materias");
  const [currentProf,setCurrentProf]=useState(null);
  const [currentMateria,setCurrentMateria]=useState(null);
  const [viewingUser,setViewingUser]=useState(null);
  const [chatWith,setChatWith]=useState(null);
  const [chatInput,setChatInput]=useState("");
  const [currentHilo,setCurrentHilo]=useState(null);
  const [foroCat,setForoCat]=useState("");

  const [search,setSearch]=useState("");
  const [deptFilter,setDeptFilter]=useState("");
  const [modalidadFilter,setModalidadFilter]=useState("");
  const [profTab,setProfTab]=useState("recientes");
  const [detailModalidad,setDetailModalidad]=useState("");
  const [reviewSort,setReviewSort]=useState("reciente");
  const [reviewFilter,setReviewFilter]=useState("todos");

  const [showReviewModal,setShowReviewModal]=useState(false);
  const [editingReview,setEditingReview]=useState(null);
  const [showAddProfModal,setShowAddProfModal]=useState(false);
  const [showAddMateriaModal,setShowAddMateriaModal]=useState(false);
  const [showAuthModal,setShowAuthModal]=useState(false);
  const [showUsernameModal,setShowUsernameModal]=useState(false);
  const [showEditProfileModal,setShowEditProfileModal]=useState(false);
  const [showEditProfFotoModal,setShowEditProfFotoModal]=useState(false);
  const [showNewHiloModal,setShowNewHiloModal]=useState(false);
  const [editingProfFoto,setEditingProfFoto]=useState(null);
  const [profFotoUrl,setProfFotoUrl]=useState("");

  const [authMode,setAuthMode]=useState("login");
  const [authEmail,setAuthEmail]=useState("");
  const [authPassword,setAuthPassword]=useState("");
  const [authMsg,setAuthMsg]=useState("");
  const [authLoading,setAuthLoading]=useState(false);
  const [usernameInput,setUsernameInput]=useState("");
  const [usernameMsg,setUsernameMsg]=useState("");
  const [editFotoUrl,setEditFotoUrl]=useState("");
  const [editCarrera,setEditCarrera]=useState("");
  const [editDescripcion,setEditDescripcion]=useState("");

  const [selectedStar,setSelectedStar]=useState(0);
  const [selectedTags,setSelectedTags]=useState([]);
  const [revText,setRevText]=useState("");
  const [revMateria,setRevMateria]=useState("");
  const [revModalidad,setRevModalidad]=useState("Presencial");
  const [guestEmail,setGuestEmail]=useState("");

  const [newNombre,setNewNombre]=useState("");
  const [newDept,setNewDept]=useState("");
  const [newMaterias,setNewMaterias]=useState([]);
  const [showNewMateriaField,setShowNewMateriaField]=useState(false);
  const [nuevaMateria,setNuevaMateria]=useState("");
  const [nuevaMateriaDirecta,setNuevaMateriaDirecta]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [comentarioTexto,setComentarioTexto]=useState({});
  const [expandedComments,setExpandedComments]=useState({});

  const [hiloTitulo,setHiloTitulo]=useState("");
  const [hiloContenido,setHiloContenido]=useState("");
  const [hiloCat,setHiloCat]=useState(CATEGORIAS_FORO[0]);
  const [respuestaTexto,setRespuestaTexto]=useState("");

  const chatBottomRef=useRef(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); if(session) fetchPerfil(session.user.id); });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{ setSession(session); if(session) fetchPerfil(session.user.id); else setPerfil(null); });
    fetchAll();
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{ if(session) fetchMensajes(); },[session]);
  useEffect(()=>{ chatBottomRef.current?.scrollIntoView({behavior:"smooth"}); },[mensajes,chatWith]);

  async function fetchPerfil(userId) {
    const {data}=await supabase.from("perfiles").select("*").eq("id",userId).single();
    setPerfil(data||null);
  }

  async function fetchAll() {
    setLoading(true);
    const [
      {data:profs},{data:revs},{data:mats},{data:vots},{data:coms},{data:perfs},{data:hils},{data:resps}
    ]=await Promise.all([
      supabase.from("profesores").select("*").order("nombre"),
      supabase.from("resenas").select("*").order("created_at",{ascending:false}),
      supabase.from("materias").select("*").order("nombre"),
      supabase.from("votos").select("*"),
      supabase.from("comentarios").select("*").order("created_at",{ascending:true}),
      supabase.from("perfiles").select("*"),
      supabase.from("hilos").select("*").order("created_at",{ascending:false}),
      supabase.from("respuestas_foro").select("*").order("created_at",{ascending:true}),
    ]);
    const resMap={};
    (revs||[]).forEach((r)=>{ if(!resMap[r.profesor_id]) resMap[r.profesor_id]=[]; resMap[r.profesor_id].push(r); });
    const votMap={};
    (vots||[]).forEach((v)=>{ if(!votMap[v.resena_id]) votMap[v.resena_id]=[]; votMap[v.resena_id].push(v); });
    const comMap={};
    (coms||[]).forEach((c)=>{ if(!comMap[c.resena_id]) comMap[c.resena_id]=[]; comMap[c.resena_id].push(c); });
    const pMap={};
    (perfs||[]).forEach((p)=>{ pMap[p.id]=p; });
    const respMap={};
    (resps||[]).forEach((r)=>{ if(!respMap[r.hilo_id]) respMap[r.hilo_id]=[]; respMap[r.hilo_id].push(r); });

    setProfesores(profs||[]); setResenas(resMap); setMaterias(mats||[]);
    setVotos(votMap); setComentarios(comMap); setPerfilesMap(pMap);
    setHilos(hils||[]); setRespuestas(respMap);

    // Actividad reciente: mezclar reseñas, comentarios, hilos y respuestas
    const actividad=[];
    (revs||[]).slice(0,10).forEach((r)=>{ const p=(profs||[]).find(x=>x.id===r.profesor_id); actividad.push({tipo:"reseña",texto:`Reseña de ${p?.nombre||""}`,sub:r.materia,ts:r.created_at,profId:r.profesor_id,username:r.username}); });
    (coms||[]).slice(0,5).forEach((c)=>{ actividad.push({tipo:"comentario",texto:`Comentario de @${c.username}`,ts:c.created_at,username:c.username}); });
    (hils||[]).slice(0,5).forEach((h)=>{ actividad.push({tipo:"hilo",texto:h.titulo,sub:h.categoria,ts:h.created_at,hiloId:h.id,username:h.username}); });
    (resps||[]).slice(0,5).forEach((r)=>{ const h=(hils||[]).find(x=>x.id===r.hilo_id); actividad.push({tipo:"respuesta",texto:`Respuesta en "${h?.titulo||""}"`,ts:r.created_at,hiloId:r.hilo_id,username:r.username}); });
    actividad.sort((a,b)=>new Date(b.ts)-new Date(a.ts));
    setActividadReciente(actividad.slice(0,10));
    setLoading(false);
  }

  async function fetchMensajes() {
    if(!session) return;
    const {data}=await supabase.from("mensajes").select("*").or(`de_user_id.eq.${session.user.id},para_user_id.eq.${session.user.id}`).order("created_at",{ascending:true});
    setMensajes(data||[]);
    setUnreadCount((data||[]).filter((m)=>m.para_user_id===session.user.id&&!m.leido).length);
  }

  async function sendMensaje() {
    if(!chatInput.trim()||!chatWith||!session) return;
    await supabase.from("mensajes").insert({de_user_id:session.user.id,para_user_id:chatWith.id,texto:chatInput.trim()});
    setChatInput(""); await fetchMensajes();
  }

  async function markAsRead(otherUserId) {
    if(!session) return;
    await supabase.from("mensajes").update({leido:true}).eq("para_user_id",session.user.id).eq("de_user_id",otherUserId).eq("leido",false);
    await fetchMensajes();
  }

  function openChat(userPerfil) { setChatWith(userPerfil); setView("mensajes"); markAsRead(userPerfil.id); }

  function getConversations() {
    if(!session) return [];
    const convMap={};
    mensajes.forEach((m)=>{
      const otherId=m.de_user_id===session.user.id?m.para_user_id:m.de_user_id;
      if(!convMap[otherId]||new Date(m.created_at)>new Date(convMap[otherId].lastMsg.created_at)) convMap[otherId]={otherId,lastMsg:m,unread:0};
      if(m.para_user_id===session.user.id&&!m.leido) convMap[otherId].unread=(convMap[otherId].unread||0)+1;
    });
    return Object.values(convMap).sort((a,b)=>new Date(b.lastMsg.created_at)-new Date(a.lastMsg.created_at));
  }

  function getChatMessages() {
    if(!session||!chatWith) return [];
    return mensajes.filter((m)=>(m.de_user_id===session.user.id&&m.para_user_id===chatWith.id)||(m.de_user_id===chatWith.id&&m.para_user_id===session.user.id));
  }

  async function handleVoto(resenaId,tipo,resenaUserId) {
    if(!session){setShowAuthModal(true);setAuthMode("login");return;}
    if(session.user.id===resenaUserId) return;
    const misVotos=votos[resenaId]||[];
    const miVoto=misVotos.find((v)=>v.user_id===session.user.id);
    if(miVoto){if(miVoto.tipo===tipo) await supabase.from("votos").delete().eq("id",miVoto.id); else await supabase.from("votos").update({tipo}).eq("id",miVoto.id);}
    else await supabase.from("votos").insert({resena_id:resenaId,user_id:session.user.id,tipo});
    const {data:vots}=await supabase.from("votos").select("*");
    const votMap={}; (vots||[]).forEach((v)=>{if(!votMap[v.resena_id])votMap[v.resena_id]=[];votMap[v.resena_id].push(v);});
    setVotos(votMap);
  }

  async function handleComentario(resenaId) {
    if(!session){setShowAuthModal(true);setAuthMode("login");return;}
    if(!perfil){setUsernameInput(randomUsername());setShowUsernameModal(true);return;}
    const texto=(comentarioTexto[resenaId]||"").trim();
    if(!texto) return;
    await supabase.from("comentarios").insert({resena_id:resenaId,user_id:session.user.id,username:perfil.username,texto});
    setComentarioTexto((prev)=>({...prev,[resenaId]:""}));
    await fetchAll();
  }

  async function submitHilo() {
    if(!hiloTitulo.trim()||!hiloContenido.trim()) return;
    if(!session){setShowAuthModal(true);return;}
    if(!perfil){setUsernameInput(randomUsername());setShowUsernameModal(true);return;}
    setSubmitting(true);
    await supabase.from("hilos").insert({user_id:session.user.id,username:perfil.username,titulo:hiloTitulo.trim(),contenido:hiloContenido.trim(),categoria:hiloCat});
    await fetchAll(); setShowNewHiloModal(false); setSubmitting(false); setHiloTitulo(""); setHiloContenido("");
  }

  async function submitRespuesta() {
    if(!respuestaTexto.trim()||!currentHilo||!session) return;
    if(!perfil){setUsernameInput(randomUsername());setShowUsernameModal(true);return;}
    await supabase.from("respuestas_foro").insert({hilo_id:currentHilo.id,user_id:session.user.id,username:perfil.username,texto:respuestaTexto.trim()});
    setRespuestaTexto(""); await fetchAll();
  }

  async function saveUsername() {
    if(!usernameInput.trim()) return;
    setUsernameMsg("");
    const {error}=await supabase.from("perfiles").insert({id:session.user.id,username:usernameInput.trim()});
    if(error){setUsernameMsg("Ese nombre ya está en uso, elegí otro.");return;}
    await fetchPerfil(session.user.id); setShowUsernameModal(false);
  }

  async function saveProfile() {
    await supabase.from("perfiles").update({foto_url:editFotoUrl,carrera:editCarrera,descripcion:editDescripcion}).eq("id",session.user.id);
    await fetchPerfil(session.user.id); await fetchAll(); setShowEditProfileModal(false);
  }

  async function saveProfFoto() {
    await supabase.from("profesores").update({foto_url:profFotoUrl}).eq("id",editingProfFoto.id);
    await fetchAll(); setShowEditProfFotoModal(false); setProfFotoUrl(""); setEditingProfFoto(null);
  }

  async function handleAuth() {
    setAuthLoading(true); setAuthMsg("");
    if(authMode==="login"){
      const {error}=await supabase.auth.signInWithPassword({email:authEmail,password:authPassword});
      if(error) setAuthMsg("Email o contraseña incorrectos.");
      else{setShowAuthModal(false);setAuthEmail("");setAuthPassword("");}
    } else {
      const {error}=await supabase.auth.signUp({email:authEmail,password:authPassword,options:{emailRedirectTo:"https://profescore-eta.vercel.app"}});
      if(error) setAuthMsg(error.message);
      else{setAuthMsg("¡Revisá tu email y hacé clic en el link de confirmación!");setUsernameInput(randomUsername());}
    }
    setAuthLoading(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }
  function openEditProfile() { setEditFotoUrl(perfil?.foto_url||""); setEditCarrera(perfil?.carrera||""); setEditDescripcion(perfil?.descripcion||""); setShowEditProfileModal(true); }
  function openUserProfile(userId) { if(!session){setShowAuthModal(true);return;} const p=perfilesMap[userId]; if(p){setViewingUser(p);setView("perfil-usuario");setCurrentProf(null);} }
  function navigate(v) { setView(v); setCurrentProf(null); setCurrentMateria(null); setSearch(""); setChatWith(null); setCurrentHilo(null); }

  const allRevenas=Object.values(resenas).flat();
  const depts=[...new Set(profesores.map((p)=>p.departamento))].sort();

  function getSortedFilteredRevs(revsList) {
    let list=[...revsList];
    if(detailModalidad) list=list.filter((r)=>r.modalidad===detailModalidad);
    if(reviewFilter==="verificados") list=list.filter((r)=>r.verified);
    else if(reviewFilter==="invitados") list=list.filter((r)=>r.is_guest||!r.verified);
    if(reviewSort==="reciente") list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    else if(reviewSort==="antigua") list.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    else if(reviewSort==="mejor") list.sort((a,b)=>b.rating-a.rating);
    else if(reviewSort==="peor") list.sort((a,b)=>a.rating-b.rating);
    else if(reviewSort==="util") list.sort((a,b)=>{
      const la=(votos[a.id]||[]).filter(v=>v.tipo==="like").length;
      const lb=(votos[b.id]||[]).filter(v=>v.tipo==="like").length;
      return lb-la;
    });
    return list;
  }

  function getFilteredProfs() {
    const q=search.toLowerCase();
    let list=profesores.filter((p)=>{
      const match=p.nombre.toLowerCase().includes(q)||p.departamento.toLowerCase().includes(q)||(p.materias||[]).some((m)=>m.toLowerCase().includes(q));
      const dMatch=!deptFilter||p.departamento===deptFilter;
      if(currentMateria) return (p.materias||[]).includes(currentMateria)&&dMatch;
      return match&&dMatch;
    });
    // Sort by most recent review
    return list.map((p)=>{
      let revs=resenas[p.id]||[];
      if(modalidadFilter) revs=revs.filter((r)=>r.modalidad===modalidadFilter);
      const lastRev=revs.length>0?Math.max(...revs.map(r=>new Date(r.created_at))):0;
      return {...p,avg:avgRating(revs),cnt:revs.length,lastRev};
    }).sort((a,b)=>{
      if(profTab==="mejor") return b.avg-a.avg;
      if(profTab==="recientes") return b.cnt-a.cnt;
      return b.lastRev-a.lastRev; // default: most recent activity
    });
  }

  function getFilteredMaterias() {
    const q=search.toLowerCase();
    return materias.filter((m)=>m.nombre.toLowerCase().includes(q)).map((m)=>{
      const profs=profesores.filter((p)=>(p.materias||[]).includes(m.nombre));
      const revs=profs.flatMap((p)=>resenas[p.id]||[]);
      const lastRev=revs.length>0?Math.max(...revs.map(r=>new Date(r.created_at))):0;
      return {...m,profCount:profs.length,lastRev};
    }).sort((a,b)=>b.lastRev-a.lastRev);
  }

  const profRevs=currentProf?(resenas[currentProf.id]||[]):[];
  const sortedProfRevs=getSortedFilteredRevs(profRevs);
  const tagCounts={};
  sortedProfRevs.forEach((r)=>(r.tags||[]).forEach((t)=>(tagCounts[t]=(tagCounts[t]||0)+1)));
  const topTags=Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const preguntas=revModalidad==="Online"?PREGUNTAS_ONLINE:PREGUNTAS_PRESENCIAL;
  const myReviews=session?allRevenas.filter((r)=>r.user_id===session.user.id):[];
  const myComments=session?Object.values(comentarios).flat().filter((c)=>c.user_id===session.user.id):[];
  const myVotedIds=session?Object.entries(votos).filter(([,vs])=>vs.some((v)=>v.user_id===session.user.id)).map(([id])=>id):[];
  const myVotedReviews=allRevenas.filter((r)=>myVotedIds.includes(r.id));
  const conversations=getConversations();
  const chatMessages=getChatMessages();
  const hilosFiltrados=foroCat?hilos.filter((h)=>h.categoria===foroCat):hilos;

  function openReview(prof,reviewToEdit=null) {
    setCurrentProf(prof); setEditingReview(reviewToEdit);
    if(reviewToEdit){setRevMateria(reviewToEdit.materia);setRevModalidad(reviewToEdit.modalidad||"Presencial");setSelectedStar(reviewToEdit.rating);setSelectedTags(reviewToEdit.tags||[]);setRevText(reviewToEdit.texto);}
    else{setRevMateria((prof.materias||[])[0]||materias[0]?.nombre||"");setSelectedStar(0);setSelectedTags([]);setRevText("");setRevModalidad("Presencial");}
    setGuestEmail(""); setShowReviewModal(true);
  }

  async function submitReview() {
    if(!selectedStar){alert("Por favor seleccioná una calificación");return;}
    if(!revText.trim()){alert("Por favor escribí tu opinión");return;}
    setSubmitting(true);
    if(editingReview){await supabase.from("resenas").update({materia:revMateria,rating:selectedStar,texto:revText.trim(),tags:selectedTags,modalidad:revModalidad}).eq("id",editingReview.id);}
    else{
      const userEmail=session?session.user.email:guestEmail.trim();
      await supabase.from("resenas").insert({profesor_id:currentProf.id,materia:revMateria,rating:selectedStar,texto:revText.trim(),tags:selectedTags,modalidad:revModalidad,user_email:userEmail,verified:isUP(userEmail),is_guest:!session,user_id:session?.user?.id||null,username:perfil?.username||null});
    }
    await fetchAll(); setShowReviewModal(false); setSubmitting(false); setEditingReview(null);
    setSelectedStar(0); setSelectedTags([]); setRevText(""); setRevModalidad("Presencial"); setGuestEmail("");
  }

  async function deleteReview(reviewId) { if(!confirm("¿Querés eliminar esta reseña?")) return; await supabase.from("resenas").delete().eq("id",reviewId); await fetchAll(); }
  async function addNuevaMateria() {
    if(!nuevaMateria.trim()) return;
    const {data}=await supabase.from("materias").insert({nombre:nuevaMateria.trim()}).select().single();
    if(data){setMaterias((prev)=>[...prev,data].sort((a,b)=>a.nombre.localeCompare(b.nombre)));setNewMaterias((prev)=>[...prev,data.nombre]);}
    setNuevaMateria(""); setShowNewMateriaField(false);
  }
  async function addNuevaMateriaDirecta() {
    if(!nuevaMateriaDirecta.trim()) return;
    await supabase.from("materias").insert({nombre:nuevaMateriaDirecta.trim()});
    await fetchAll(); setNuevaMateriaDirecta(""); setShowAddMateriaModal(false);
  }
  async function addProf() {
    if(!newNombre.trim()||!newDept.trim()){alert("Completá nombre y área");return;}
    if(newMaterias.length===0){alert("Seleccioná al menos una materia");return;}
    setSubmitting(true);
    await supabase.from("profesores").insert({nombre:newNombre.trim(),departamento:newDept.trim(),materias:newMaterias});
    await fetchAll(); setShowAddProfModal(false); setSubmitting(false); setNewNombre(""); setNewDept(""); setNewMaterias([]);
  }
  function toggleNewMateria(nombre){setNewMaterias((prev)=>prev.includes(nombre)?prev.filter((x)=>x!==nombre):[...prev,nombre]);}

  function renderReviewCard(r,showProf=false) {
    const isOwner=session&&r.user_id===session.user.id;
    const isAdminUser=session&&isAdmin(session.user.id);
    const revVotos=votos[r.id]||[];
    const likes=revVotos.filter((v)=>v.tipo==="like").length;
    const dislikes=revVotos.filter((v)=>v.tipo==="dislike").length;
    const miVoto=session?revVotos.find((v)=>v.user_id===session.user.id):null;
    const puedeVotar=session&&!isOwner;
    const revComs=comentarios[r.id]||[];
    const showComs=expandedComments[r.id];
    const userPerfil=perfilesMap[r.user_id];
    const prof=profesores.find((p)=>p.id===r.profesor_id);
    return (
      <div key={r.id} className="review-card">
        {showProf&&prof&&<div style={{fontSize:12,color:"#888",marginBottom:6,fontWeight:500}}>{prof.nombre} · <span style={{fontWeight:400}}>{r.materia}</span></div>}
        <div className="review-top">
          <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
            {!showProf&&<span className="review-materia">{r.materia}</span>}
            <span className="stars">{starsStr(r.rating)}</span>
            <span className={`modalidad-badge${r.modalidad==="Online"?" online":""}`}>{r.modalidad||"Presencial"}</span>
            {r.verified?<span className="badge-up">✓ Alumno UP</span>:r.is_guest?<span className="badge-guest">Invitado</span>:null}
            {r.username&&<span className="review-username" onClick={()=>r.user_id&&openUserProfile(r.user_id)}>@{r.username}</span>}
            {userPerfil?.carrera&&<span className="review-carrera">· {userPerfil.carrera}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span className="review-date">{new Date(r.created_at).toLocaleDateString("es-AR",{month:"short",year:"numeric"})}</span>
            {(isOwner||isAdminUser)&&<div style={{display:"flex",gap:4}}>
              {isOwner&&<button className="review-action-btn" onClick={()=>{const p=profesores.find(x=>x.id===r.profesor_id);if(p)openReview(p,r);}}>✎</button>}
              <button className="review-action-btn delete" onClick={()=>deleteReview(r.id)}>✕</button>
            </div>}
          </div>
        </div>
        <div className="review-text">{r.texto}</div>
        {(r.tags||[]).length>0&&<div className="tags" style={{marginTop:6}}>{r.tags.map((t)=><span key={t} className={`tag ${tagClass(t)}`}>{t}</span>)}</div>}
        <div className="vote-row">
          <span className="vote-label">¿Estás de acuerdo?</span>
          <button className={`vote-btn like${miVoto?.tipo==="like"?" active":""} ${!puedeVotar?"disabled":""}`} onClick={()=>puedeVotar&&handleVoto(r.id,"like",r.user_id)}>👍 {likes}</button>
          <button className={`vote-btn dislike${miVoto?.tipo==="dislike"?" active":""} ${!puedeVotar?"disabled":""}`} onClick={()=>puedeVotar&&handleVoto(r.id,"dislike",r.user_id)}>👎 {dislikes}</button>
          <button className="comments-toggle" onClick={()=>setExpandedComments((prev)=>({...prev,[r.id]:!prev[r.id]}))}>💬 {revComs.length} {showComs?"▲":"▼"}</button>
          {!session&&<span className="vote-hint" onClick={()=>{setShowAuthModal(true);setAuthMode("login");}}>Iniciá sesión para votar</span>}
        </div>
        {showComs&&<div className="comments-section">
          {revComs.length===0&&<div className="comment-empty">No hay comentarios todavía.</div>}
          {revComs.map((c)=>{const cp=perfilesMap[c.user_id];return(
            <div key={c.id} className="comment-item">
              <div className="comment-avatar" onClick={()=>c.user_id&&openUserProfile(c.user_id)}>{cp?.foto_url?<img src={cp.foto_url} alt={c.username}/>:initials(c.username)}</div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-username" onClick={()=>c.user_id&&openUserProfile(c.user_id)}>@{c.username}</span>
                  {cp?.carrera&&<span className="comment-carrera">{cp.carrera}</span>}
                  <span className="comment-date">{new Date(c.created_at).toLocaleDateString("es-AR",{month:"short",year:"numeric"})}</span>
                </div>
                <div className="comment-text">{c.texto}</div>
              </div>
            </div>
          );})}
          {session?<div className="comment-input-row">
            <input value={comentarioTexto[r.id]||""} onChange={(e)=>setComentarioTexto((prev)=>({...prev,[r.id]:e.target.value}))} placeholder={perfil?`Comentar como @${perfil.username}...`:"Comentar..."} onKeyDown={(e)=>e.key==="Enter"&&handleComentario(r.id)}/>
            <button className="btn-primary" style={{flex:"none",padding:"6px 14px",fontSize:13}} onClick={()=>handleComentario(r.id)}>Enviar</button>
          </div>:<div className="comment-login-hint"><button className="link-btn" onClick={()=>{setShowAuthModal(true);setAuthMode("login");}}>Iniciá sesión</button> para comentar.</div>}
        </div>}
      </div>
    );
  }

  function tipoIcon(tipo) {
    if(tipo==="reseña") return "⭐";
    if(tipo==="comentario") return "💬";
    if(tipo==="hilo") return "📝";
    if(tipo==="respuesta") return "↩️";
    return "•";
  }

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-row">
            <img src={UP_LOGO} alt="UP" className="sidebar-logo-img" onError={(e)=>e.target.style.display="none"}/>
            <div>
              <div className="logo" style={{fontSize:16}}><div className="dot"/>ProfeScore</div>
              <div className="subtitle">Universidad de Palermo</div>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Explorar</div>
          {[["materias","📚","Materias"],["profesores","👨‍🏫","Profesores"],["foro","💬","Foro"],["comunidad","👥","Comunidad"],["acerca","ℹ️","Acerca de"]].map(([v,icon,label])=>(
            <button key={v} className={`sidebar-item${view===v&&!currentProf?" active":""}`} onClick={()=>navigate(v)}>
              <span className="icon">{icon}</span>{label}
            </button>
          ))}
        </div>

        {session&&<div className="sidebar-section">
          <div className="sidebar-section-title">Mi actividad</div>
          {[["mensajes","✉️","Mensajes",unreadCount],["mis-resenas","✍️","Mis reseñas",0],["mis-comentarios","💬","Mis comentarios",0],["resenas-votadas","👍","Reseñas votadas",0]].map(([v,icon,label,badge])=>(
            <button key={v} className={`sidebar-item${view===v?" active":""}`} onClick={()=>navigate(v)}>
              <span className="icon">{icon}</span>{label}
              {badge>0&&<span className="sidebar-badge">{badge}</span>}
            </button>
          ))}
        </div>}

        <div className="sidebar-section">
          <div className="sidebar-section-title">Actividad reciente</div>
          {actividadReciente.slice(0,6).map((a,i)=>(
            <button key={i} className="sidebar-item" style={{fontSize:12,padding:"6px 1.25rem",alignItems:"flex-start",gap:6}} onClick={()=>{
              if(a.profId){const p=profesores.find(x=>x.id===a.profId);if(p){setCurrentProf(p);setDetailModalidad("");}}
              else if(a.hiloId){const h=hilos.find(x=>x.id===a.hiloId);if(h){setCurrentHilo(h);setView("foro");}}
            }}>
              <span style={{fontSize:13,flexShrink:0}}>{tipoIcon(a.tipo)}</span>
              <div style={{minWidth:0}}>
                <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:150}}>{a.texto}</div>
                <div style={{color:"#bbb",fontSize:10}}>{timeAgo(a.ts)}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          {session?(
            <div>
              <div className="sidebar-user-info" onClick={()=>{if(perfil){setViewingUser(perfil);setView("perfil-usuario");setCurrentProf(null);}}}>
                <div className="sidebar-avatar">{perfil?.foto_url?<img src={perfil.foto_url} alt={perfil.username}/>:(perfil?.username?initials(perfil.username):"?")}</div>
                <div><div className="sidebar-username">{perfil?.username?`@${perfil.username}`:"Sin nombre"}</div>{perfil?.carrera&&<div className="sidebar-carrera">{perfil.carrera}</div>}</div>
              </div>
              <button className="btn-outline" style={{width:"100%",marginTop:8,fontSize:12}} onClick={handleLogout}>Cerrar sesión</button>
            </div>
          ):(
            <button className="btn-primary" style={{width:"100%"}} onClick={()=>{setShowAuthModal(true);setAuthMode("login");setAuthMsg("");}}>Iniciar sesión</button>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div className="main-content">
        <div className="inner">

          {currentProf ? (
            <>
              <div className="detail-topbar">
                <button className="back-btn" onClick={()=>setCurrentProf(null)}>← Volver</button>
                {session&&isAdmin(session.user.id)&&<button className="review-action-btn admin" onClick={()=>{setEditingProfFoto(currentProf);setProfFotoUrl(currentProf.foto_url||"");setShowEditProfFotoModal(true);}}>📷 Foto</button>}
              </div>
              {(()=>{
                const idx=profesores.findIndex((x)=>x.id===currentProf.id);
                const c=colorFor(idx); const avg=avgRating(sortedProfRevs); const summary=aiSummary(currentProf,profRevs);
                return (<>
                  <div className="detail-header">
                    <div className="detail-avatar" style={{background:c.bg,color:c.color}}>{currentProf.foto_url?<img src={currentProf.foto_url} alt={currentProf.nombre}/>:initials(currentProf.nombre)}</div>
                    <div>
                      <div className="detail-name">{currentProf.nombre}</div>
                      <div className="detail-dept">{currentProf.departamento}</div>
                      <div className="tags" style={{marginTop:6}}>{(currentProf.materias||[]).map((m)=><span key={m} className="tag tag-blue">{m}</span>)}</div>
                    </div>
                  </div>
                  <div className="modalidad-tabs">{[["","Todas"],["Presencial","Presencial"],["Online","Online"]].map(([k,l])=><button key={k} className={`modalidad-tab${detailModalidad===k?" active":""}`} onClick={()=>setDetailModalidad(k)}>{l}</button>)}</div>
                  <div className="stats-row">{[[avgRating(profRevs)?avgRating(profRevs).toFixed(1):"—","calificación",avgRating(profRevs)?ratingColor(avgRating(profRevs)):undefined],[profRevs.length,"reseñas",undefined],[(currentProf.materias||[]).length,"materias",undefined]].map(([v,l,col],i)=><div key={i} className="stat-card"><div className="stat-val" style={col?{color:col}:{}}>{v}</div><div className="stat-lbl">{l}</div></div>)}</div>
                  {topTags.length>0&&<div className="tags" style={{marginBottom:"1.25rem"}}>{topTags.map(([t,n])=><span key={t} className={`tag ${tagClass(t)}`}>{t} <span style={{opacity:0.6}}>({n})</span></span>)}</div>}
                  {summary&&<div className="ai-summary"><div className="ai-label">✦ Resumen IA</div>{summary}</div>}

                  {/* Sort & filter controls */}
                  <div className="review-controls">
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:"#888"}}>Ordenar:</span>
                      {[["reciente","Más reciente"],["antigua","Más antigua"],["mejor","Mejor calificada"],["peor","Peor calificada"],["util","Más útil"]].map(([k,l])=>(
                        <button key={k} className={`sort-btn${reviewSort===k?" active":""}`} onClick={()=>setReviewSort(k)}>{l}</button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginTop:6}}>
                      <span style={{fontSize:12,color:"#888"}}>Filtrar:</span>
                      {[["todos","Todos"],["verificados","Alumno UP"],["invitados","Invitados"]].map(([k,l])=>(
                        <button key={k} className={`sort-btn${reviewFilter===k?" active":""}`} onClick={()=>setReviewFilter(k)}>{l}</button>
                      ))}
                    </div>
                  </div>

                  <div className="section-title" style={{marginTop:"1rem"}}>
                    Reseñas {detailModalidad?`· ${detailModalidad}`:""}<span style={{fontWeight:400,color:"#aaa",fontSize:13}}> {sortedProfRevs.length} en total</span>
                  </div>
                  {sortedProfRevs.length===0&&<div className="empty">No hay reseñas que coincidan con los filtros</div>}
                  {sortedProfRevs.map((r)=>renderReviewCard(r))}
                  <button className="add-review-btn" onClick={()=>openReview(currentProf)}>✎ Agregar mi reseña</button>
                </>);
              })()}
            </>

          ) : view==="foro" ? (
            <>
              <div className="header">
                <div><div className="logo"><div className="dot"/>Foro</div></div>
                {session&&<button className="btn-outline" onClick={()=>setShowNewHiloModal(true)}>+ Nuevo hilo</button>}
              </div>
              {currentHilo ? (
                <>
                  <button className="back-btn" style={{marginBottom:"1rem"}} onClick={()=>setCurrentHilo(null)}>← Volver al foro</button>
                  <div className="hilo-header">
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span className="cat-badge" style={{background:CATEGORIA_COLORS[currentHilo.categoria]?.bg,color:CATEGORIA_COLORS[currentHilo.categoria]?.color}}>{currentHilo.categoria}</span>
                      <span style={{fontSize:12,color:"#aaa"}}>{timeAgo(currentHilo.created_at)}</span>
                    </div>
                    <div className="hilo-titulo">{currentHilo.titulo}</div>
                    <div style={{fontSize:12,color:"#888",marginTop:4}}>por <span className="review-username" onClick={()=>openUserProfile(currentHilo.user_id)}>@{currentHilo.username}</span></div>
                    <div className="hilo-contenido">{currentHilo.contenido}</div>
                  </div>
                  <div className="section-title" style={{margin:"1.25rem 0 10px"}}>Respuestas <span style={{fontWeight:400,color:"#aaa",fontSize:13}}>{(respuestas[currentHilo.id]||[]).length}</span></div>
                  {(respuestas[currentHilo.id]||[]).length===0&&<div className="empty">Sé el primero en responder</div>}
                  {(respuestas[currentHilo.id]||[]).map((r)=>{
                    const rp=perfilesMap[r.user_id];
                    return <div key={r.id} className="respuesta-item">
                      <Avatar url={rp?.foto_url} name={r.username} size={34} fontSize={12}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span className="comment-username" onClick={()=>r.user_id&&openUserProfile(r.user_id)}>@{r.username}</span>
                          {rp?.carrera&&<span className="comment-carrera">{rp.carrera}</span>}
                          <span className="comment-date">{timeAgo(r.created_at)}</span>
                        </div>
                        <div style={{fontSize:13,color:"#555",lineHeight:1.5}}>{r.texto}</div>
                      </div>
                    </div>;
                  })}
                  {session?<div className="comment-input-row" style={{marginTop:"1rem"}}>
                    <input value={respuestaTexto} onChange={(e)=>setRespuestaTexto(e.target.value)} placeholder="Escribí tu respuesta..." onKeyDown={(e)=>e.key==="Enter"&&submitRespuesta()}/>
                    <button className="btn-primary" style={{flex:"none",padding:"8px 16px"}} onClick={submitRespuesta}>Responder</button>
                  </div>:<div className="comment-login-hint" style={{marginTop:"1rem"}}><button className="link-btn" onClick={()=>{setShowAuthModal(true);setAuthMode("login");}}>Iniciá sesión</button> para responder.</div>}
                </>
              ) : (
                <>
                  <div className="cat-filter-row">
                    <button className={`cat-filter-btn${!foroCat?" active":""}`} onClick={()=>setForoCat("")}>Todos</button>
                    {CATEGORIAS_FORO.map((c)=><button key={c} className={`cat-filter-btn${foroCat===c?" active":""}`} onClick={()=>setForoCat(c)}>{c}</button>)}
                  </div>
                  {hilosFiltrados.length===0&&<div className="empty">No hay hilos en esta categoría todavía</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {hilosFiltrados.map((h)=>(
                      <div key={h.id} className="hilo-card" onClick={()=>setCurrentHilo(h)}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                              <span className="cat-badge" style={{background:CATEGORIA_COLORS[h.categoria]?.bg,color:CATEGORIA_COLORS[h.categoria]?.color}}>{h.categoria}</span>
                            </div>
                            <div className="hilo-titulo" style={{fontSize:14}}>{h.titulo}</div>
                            <div style={{fontSize:12,color:"#888",marginTop:4}}>por <span style={{color:"#1D9E75"}}>@{h.username}</span> · {timeAgo(h.created_at)}</div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontSize:16,fontWeight:600}}>{(respuestas[h.id]||[]).length}</div>
                            <div style={{fontSize:11,color:"#aaa"}}>respuestas</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>

          ) : view==="acerca" ? (
            <div className="about-page">
              <div className="about-hero">
                <img src={UP_LOGO} alt="Universidad de Palermo" className="about-logo-img" onError={(e)=>e.target.style.display="none"}/>
                <div><div className="about-title">ProfeScore</div><div className="about-tagline">La voz de los estudiantes de la Universidad de Palermo</div></div>
              </div>
              <div className="about-section"><h3>¿Qué es ProfeScore?</h3><p>ProfeScore es una plataforma creada por y para estudiantes de la Universidad de Palermo. Nuestro objetivo es ayudarte a tomar mejores decisiones al inscribirte en materias, compartiendo experiencias reales sobre cada profesor de forma honesta y respetuosa.</p></div>
              <div className="about-section"><h3>Nuestra misión</h3><p>Creemos que la información compartida entre estudiantes tiene un valor enorme. ProfeScore busca centralizar esa información de manera organizada, accesible y confiable, para que cada alumno pueda elegir sus materias con mayor contexto y confianza.</p></div>
              <div className="about-section"><h3>Valores</h3><p>Fomentamos la honestidad y la objetividad. Una buena reseña no solo critica o elogia — describe experiencias reales que ayudan a otros. Pedimos a todos los usuarios que sean respetuosos y constructivos en sus opiniones.</p></div>
              <div className="about-contact"><h3>📬 Contacto</h3><p>¿Tenés sugerencias, encontraste un error o necesitás asistencia? Escribinos a:<br/><br/><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br/><br/>Leemos todos los mensajes y respondemos a la brevedad.</p></div>
            </div>

          ) : view==="perfil-usuario"&&viewingUser ? (
            <>
              <button className="back-btn" style={{marginBottom:"1.25rem"}} onClick={()=>{setView("comunidad");setViewingUser(null);}}>← Volver</button>
              <div className="profile-header">
                <div className="profile-avatar">{viewingUser.foto_url?<img src={viewingUser.foto_url} alt={viewingUser.username}/>:initials(viewingUser.username||"?")}</div>
                <div style={{flex:1}}>
                  <div className="profile-username">@{viewingUser.username}</div>
                  {viewingUser.carrera&&<div className="profile-carrera">{viewingUser.carrera}</div>}
                  {viewingUser.descripcion&&<div className="profile-descripcion">{viewingUser.descripcion}</div>}
                  <div className="profile-stats" style={{marginTop:8}}>
                    <span className="profile-stat"><strong>{allRevenas.filter((r)=>r.user_id===viewingUser.id).length}</strong> reseñas</span>
                    <span className="profile-stat"><strong>{Object.values(comentarios).flat().filter((c)=>c.user_id===viewingUser.id).length}</strong> comentarios</span>
                    <span className="profile-stat"><strong>{hilos.filter((h)=>h.user_id===viewingUser.id).length}</strong> hilos</span>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {session&&viewingUser.id===session.user.id&&<button className="profile-edit-btn" onClick={openEditProfile}>✎ Editar perfil</button>}
                    {session&&viewingUser.id!==session.user.id&&<button className="msg-user-btn" onClick={()=>openChat(viewingUser)}>✉️ Enviar mensaje</button>}
                  </div>
                </div>
              </div>
              <div className="section-title">Reseñas de @{viewingUser.username}</div>
              {allRevenas.filter((r)=>r.user_id===viewingUser.id).length===0&&<div className="empty">Sin reseñas todavía</div>}
              {allRevenas.filter((r)=>r.user_id===viewingUser.id).map((r)=>renderReviewCard(r,true))}
            </>

          ) : view==="mensajes" ? (
            <>
              <div style={{marginBottom:"1.25rem"}}><div className="logo"><div className="dot"/>Mensajes</div></div>
              {!session?<div className="empty"><button className="link-btn" onClick={()=>{setShowAuthModal(true);setAuthMode("login");}}>Iniciá sesión</button> para ver tus mensajes.</div>
              :chatWith?(
                <div className="chat-view">
                  <div className="chat-header">
                    <button className="back-btn" onClick={()=>setChatWith(null)}>← Volver</button>
                    <Avatar url={chatWith.foto_url} name={chatWith.username} size={36} fontSize={13}/>
                    <div><div style={{fontWeight:500,fontSize:14}}>@{chatWith.username}</div>{chatWith.carrera&&<div style={{fontSize:12,color:"#888"}}>{chatWith.carrera}</div>}</div>
                  </div>
                  <div className="chat-messages">
                    {chatMessages.length===0&&<div className="empty" style={{padding:"1rem"}}>Empezá la conversación</div>}
                    {chatMessages.map((m)=>{const mine=m.de_user_id===session.user.id;return(
                      <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:mine?"flex-end":"flex-start"}}>
                        <div className={`message-bubble ${mine?"mine":"theirs"}`}>{m.texto}<div className="message-time">{timeAgo(m.created_at)}</div></div>
                      </div>
                    );})}
                    <div ref={chatBottomRef}/>
                  </div>
                  <div className="chat-input-row">
                    <input value={chatInput} onChange={(e)=>setChatInput(e.target.value)} placeholder="Escribí un mensaje..." onKeyDown={(e)=>e.key==="Enter"&&sendMensaje()}/>
                    <button className="chat-send-btn" onClick={sendMensaje}>Enviar</button>
                  </div>
                </div>
              ):(
                <>
                  {conversations.length===0&&<div className="empty">No tenés conversaciones todavía.</div>}
                  <div className="conversations-list">
{conversations.map((conv)=>{const op=perfilesMap[conv.otherId]||{username:"Usuario",foto_url:null,carrera:null,id:conv.otherId};                      <div key={conv.otherId} className={`conversation-item${conv.unread>0?" unread":""}`} onClick={()=>openChat(op)}>
                        <Avatar url={op.foto_url} name={op.username} size={40} fontSize={14}/>
                        <div className="conv-info"><div className="conv-username">@{op.username}</div><div className="conv-preview">{mine?"Vos: ":""}{conv.lastMsg.texto}</div></div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                          <span className="conv-time">{timeAgo(conv.lastMsg.created_at)}</span>
                          {conv.unread>0&&<span className="sidebar-badge">{conv.unread}</span>}
                        </div>
                      </div>
                    );})}
                  </div>
                </>
              )}
            </>

          ) : view==="mis-resenas" ? (
            <><div className="section-title" style={{marginBottom:"1rem"}}>Mis reseñas <span style={{fontWeight:400,color:"#aaa",fontSize:13}}>{myReviews.length} en total</span></div>
            {myReviews.length===0?<div className="empty">Todavía no dejaste ninguna reseña</div>:myReviews.map((r)=>renderReviewCard(r,true))}</>

          ) : view==="mis-comentarios" ? (
            <><div className="section-title" style={{marginBottom:"1rem"}}>Mis comentarios <span style={{fontWeight:400,color:"#aaa",fontSize:13}}>{myComments.length} en total</span></div>
            {myComments.length===0?<div className="empty">Todavía no comentaste ninguna reseña</div>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{myComments.map((c)=>{const r=allRevenas.find((x)=>x.id===c.resena_id);const prof=r?profesores.find((p)=>p.id===r.profesor_id):null;return<div key={c.id} className="review-card">{prof&&<div style={{fontSize:12,color:"#888",marginBottom:6}}>{prof.nombre} · {r.materia}</div>}<div style={{fontSize:13,color:"#555"}}>{c.texto}</div><div style={{fontSize:11,color:"#aaa",marginTop:4}}>{new Date(c.created_at).toLocaleDateString("es-AR",{month:"short",year:"numeric"})}</div></div>;})}</div>}</>

          ) : view==="resenas-votadas" ? (
            <><div className="section-title" style={{marginBottom:"1rem"}}>Reseñas votadas <span style={{fontWeight:400,color:"#aaa",fontSize:13}}>{myVotedReviews.length}</span></div>
            {myVotedReviews.length===0?<div className="empty">Todavía no votaste ninguna reseña</div>:myVotedReviews.map((r)=>renderReviewCard(r,true))}</>

          ) : view==="comunidad" ? (
            <>
              <div className="header"><div><div className="logo"><div className="dot"/>Comunidad</div></div><div style={{display:"flex",gap:8}}><button className="btn-outline" onClick={()=>setShowAddMateriaModal(true)}>+ Materia</button><button className="btn-outline" onClick={()=>setShowAddProfModal(true)}>+ Profesor</button></div></div>
              {!session?<div className="empty"><button className="link-btn" onClick={()=>{setShowAuthModal(true);setAuthMode("login");}}>Iniciá sesión</button> para ver los perfiles.</div>:<div className="users-list">{Object.values(perfilesMap).map((p)=>(
                <div key={p.id} className="user-card" onClick={()=>{setViewingUser(p);setView("perfil-usuario");}}>
                  <Avatar url={p.foto_url} name={p.username} size={40} fontSize={14}/>
                  <div><div style={{fontWeight:500,fontSize:14}}>@{p.username}</div>{p.carrera&&<div style={{fontSize:12,color:"#888"}}>{p.carrera}</div>}</div>
                  <div style={{marginLeft:"auto",fontSize:12,color:"#aaa"}}>{allRevenas.filter((r)=>r.user_id===p.id).length} reseñas</div>
                </div>
              ))}</div>}
            </>

          ) : view==="profesores" ? (
            <>
              <div className="header"><div><div className="logo"><div className="dot"/>Profesores</div></div><div style={{display:"flex",gap:8}}><button className="btn-outline" onClick={()=>setShowAddMateriaModal(true)}>+ Materia</button><button className="btn-outline" onClick={()=>setShowAddProfModal(true)}>+ Profesor</button></div></div>
              <div className="search-bar">
                <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar profesor o materia..."/>
                <select value={deptFilter} onChange={(e)=>setDeptFilter(e.target.value)}><option value="">Todas las áreas</option>{depts.map((d)=><option key={d} value={d}>{d}</option>)}</select>
                <select value={modalidadFilter} onChange={(e)=>setModalidadFilter(e.target.value)}><option value="">Presencial y online</option><option value="Presencial">Presencial</option><option value="Online">Online</option></select>
              </div>
              <div className="tabs">{[["recientes","Actividad reciente"],["mejor","Mejor calificados"],["todos","Más reseñas"]].map(([k,l])=><button key={k} className={`tab${profTab===k?" active":""}`} onClick={()=>setProfTab(k)}>{l}</button>)}</div>
              {loading?<div className="empty">Cargando...</div>:<div className="prof-list">
                {getFilteredProfs().length===0&&<div className="empty">No se encontraron profesores</div>}
                {getFilteredProfs().map((p,i)=>{const c=colorFor(i);let revs=resenas[p.id]||[];if(modalidadFilter)revs=revs.filter((r)=>r.modalidad===modalidadFilter);const tagC={};revs.forEach((r)=>(r.tags||[]).forEach((t)=>(tagC[t]=(tagC[t]||0)+1)));const tTop=Object.entries(tagC).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);return(
                  <div key={p.id} className="prof-card" onClick={()=>{setCurrentProf(p);setDetailModalidad("");}}>
                    <div className="prof-row">
                      <div className="avatar" style={{background:c.bg,color:c.color}}>{p.foto_url?<img src={p.foto_url} alt={p.nombre}/>:initials(p.nombre)}</div>
                      <div className="prof-info"><div className="prof-name">{p.nombre}</div><div className="prof-meta">{p.departamento} · {revs.length} reseña{revs.length!==1?"s":""}</div><div className="tags">{tTop.map((t)=><span key={t} className={`tag ${tagClass(t)}`}>{t}</span>)}</div></div>
                      <div className="rating-badge"><div className="rating-num" style={{color:p.avg?ratingColor(p.avg):"var(--color-muted)"}}>{p.avg?p.avg.toFixed(1):"—"}</div><div className="rating-label">{p.avg?"/ 5.0":"sin reseñas"}</div></div>
                    </div>
                  </div>
                );})}
              </div>}
            </>

          ) : (
            // MATERIAS VIEW
            <>
              <div className="header"><div><div className="logo"><div className="dot"/>Materias</div></div><div style={{display:"flex",gap:8}}><button className="btn-outline" onClick={()=>setShowAddMateriaModal(true)}>+ Materia</button><button className="btn-outline" onClick={()=>setShowAddProfModal(true)}>+ Profesor</button></div></div>
              <div className="search-bar"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar materia..."/></div>
              {currentMateria?(
                <>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem",flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <button className="back-btn" onClick={()=>setCurrentMateria(null)}>← Volver a materias</button>
                      <span className="tag tag-blue" style={{fontSize:13,padding:"4px 12px"}}>{currentMateria}</span>
                    </div>
                    <button className="btn-outline" style={{fontSize:12}} onClick={()=>setShowAddProfModal(true)}>+ Agregar profesor</button>
                  </div>
                  <div className="tabs">{[["recientes","Actividad reciente"],["mejor","Mejor calificados"],["todos","Más reseñas"]].map(([k,l])=><button key={k} className={`tab${profTab===k?" active":""}`} onClick={()=>setProfTab(k)}>{l}</button>)}</div>
                  <div className="prof-list">
                    {getFilteredProfs().length===0&&<div className="empty">No hay profesores para esta materia todavía</div>}
                    {getFilteredProfs().map((p,i)=>{const c=colorFor(i);const revs=resenas[p.id]||[];return(
                      <div key={p.id} className="prof-card" onClick={()=>{setCurrentProf(p);setDetailModalidad("");}}>
                        <div className="prof-row">
                          <div className="avatar" style={{background:c.bg,color:c.color}}>{p.foto_url?<img src={p.foto_url} alt={p.nombre}/>:initials(p.nombre)}</div>
                          <div className="prof-info"><div className="prof-name">{p.nombre}</div><div className="prof-meta">{p.departamento} · {revs.length} reseña{revs.length!==1?"s":""}</div></div>
                          <div className="rating-badge"><div className="rating-num" style={{color:p.avg?ratingColor(p.avg):"var(--color-muted)"}}>{p.avg?p.avg.toFixed(1):"—"}</div><div className="rating-label">{p.avg?"/ 5.0":"sin reseñas"}</div></div>
                        </div>
                      </div>
                    );})}
                  </div>
                </>
              ):(
                <div className="materias-grid">
                  {getFilteredMaterias().length===0&&<div className="empty">No se encontraron materias</div>}
                  {getFilteredMaterias().map((m)=>(
                    <div key={m.id} className="materia-card" onClick={()=>{setCurrentMateria(m.nombre);setProfTab("recientes");}}>
                      <div className="materia-nombre">{m.nombre}</div>
                      <div className="materia-meta">{m.profCount} profesor{m.profCount!==1?"es":""}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* USERNAME MODAL */}
      {showUsernameModal&&<div className="modal-overlay" onClick={()=>setShowUsernameModal(false)}><div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-title">Elegí tu nombre en ProfeScore</div>
        <div className="info-box">Este nombre es solo para identificarte. No tiene por qué ser tu nombre real.</div>
        <div className="form-group"><label className="form-label">Tu nombre</label><input value={usernameInput} onChange={(e)=>setUsernameInput(e.target.value)} placeholder="Ej: TigreVeloz"/></div>
        <button className="add-materia-btn" style={{marginBottom:10}} onClick={()=>setUsernameInput(randomUsername())}>🔀 Generar otro nombre aleatorio</button>
        {usernameMsg&&<div className="auth-msg">{usernameMsg}</div>}
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowUsernameModal(false)}>Cancelar</button><button className="btn-primary" onClick={saveUsername}>Confirmar nombre</button></div>
      </div></div>}

      {/* EDIT PROFILE MODAL */}
      {showEditProfileModal&&<div className="modal-overlay" onClick={()=>setShowEditProfileModal(false)}><div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-title">Editar perfil</div>
        <div className="form-group"><label className="form-label">URL de foto de perfil</label><input value={editFotoUrl} onChange={(e)=>setEditFotoUrl(e.target.value)} placeholder="https://i.imgur.com/tu-foto.jpg"/>{editFotoUrl&&<img src={editFotoUrl} alt="preview" className="foto-preview" onError={(e)=>e.target.style.display="none"}/>}<div style={{fontSize:11,color:"#888",marginTop:4}}>Podés subir tu foto a <a href="https://imgur.com" target="_blank" rel="noreferrer" style={{color:"#1D9E75"}}>imgur.com</a> y pegar el link directo.</div></div>
        <div className="form-group"><label className="form-label">Carrera</label><select value={editCarrera} onChange={(e)=>setEditCarrera(e.target.value)}><option value="">Sin especificar</option>{CARRERAS.map((c)=><option key={c} value={c}>{c}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Sobre mí</label><textarea value={editDescripcion} onChange={(e)=>setEditDescripcion(e.target.value)} placeholder="Contá algo sobre vos..."/></div>
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowEditProfileModal(false)}>Cancelar</button><button className="btn-primary" onClick={saveProfile}>Guardar</button></div>
      </div></div>}

      {/* EDIT PROF FOTO */}
      {showEditProfFotoModal&&<div className="modal-overlay" onClick={()=>setShowEditProfFotoModal(false)}><div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-title">Foto de {editingProfFoto?.nombre}</div>
        <div className="form-group"><label className="form-label">URL de la foto</label><input value={profFotoUrl} onChange={(e)=>setProfFotoUrl(e.target.value)} placeholder="https://i.imgur.com/foto.jpg"/>{profFotoUrl&&<img src={profFotoUrl} alt="preview" className="foto-preview" onError={(e)=>e.target.style.display="none"}/>}</div>
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowEditProfFotoModal(false)}>Cancelar</button><button className="btn-primary" onClick={saveProfFoto}>Guardar</button></div>
      </div></div>}

      {/* AUTH MODAL */}
      {showAuthModal&&<div className="modal-overlay" onClick={()=>setShowAuthModal(false)}><div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-title">{authMode==="login"?"Iniciar sesión":"Crear cuenta"}</div>
        {authMode==="register"&&<><div className="info-box">Si usás tu email <strong>@up.edu.ar</strong>, tus reseñas tendrán el badge <span className="badge-up">✓ Alumno UP</span></div><div className="info-box warning">⚠️ No uses una contraseña que tengas en otras cuentas. Usá una contraseña única para esta plataforma.</div></>}
        <div className="form-group"><label className="form-label">Email</label><input type="email" value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} placeholder="tu@email.com"/></div>
        <div className="form-group"><label className="form-label">Contraseña</label><input type="password" value={authPassword} onChange={(e)=>setAuthPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></div>
        {authMsg&&<div className={`auth-msg${authMsg.includes("Revisá")?" success":""}`}>{authMsg}</div>}
        {authMsg.includes("Revisá")?<button className="btn-primary" onClick={()=>{setShowAuthModal(false);setUsernameInput(randomUsername());setShowUsernameModal(true);}}>Elegir mi nombre →</button>:
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowAuthModal(false)}>Cancelar</button><button className="btn-primary" onClick={handleAuth} disabled={authLoading}>{authLoading?"...":authMode==="login"?"Entrar":"Registrarme"}</button></div>}
        <div className="auth-switch">{authMode==="login"?<>¿No tenés cuenta? <button onClick={()=>{setAuthMode("register");setAuthMsg("");}}>Registrate</button></>:<>¿Ya tenés cuenta? <button onClick={()=>{setAuthMode("login");setAuthMsg("");}}>Iniciá sesión</button></>}</div>
      </div></div>}

      {/* NEW HILO MODAL */}
      {showNewHiloModal&&<div className="modal-overlay" onClick={()=>setShowNewHiloModal(false)}><div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-title">Nuevo hilo de discusión</div>
        <div className="form-group"><label className="form-label">Categoría</label><select value={hiloCat} onChange={(e)=>setHiloCat(e.target.value)}>{CATEGORIAS_FORO.map((c)=><option key={c} value={c}>{c}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Título</label><input value={hiloTitulo} onChange={(e)=>setHiloTitulo(e.target.value)} placeholder="¿Sobre qué querés hablar?"/></div>
        <div className="form-group"><label className="form-label">Contenido</label><textarea value={hiloContenido} onChange={(e)=>setHiloContenido(e.target.value)} placeholder="Desarrollá tu pregunta o tema..." style={{height:120}}/></div>
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowNewHiloModal(false)}>Cancelar</button><button className="btn-primary" onClick={submitHilo} disabled={submitting}>{submitting?"Publicando...":"Publicar hilo"}</button></div>
      </div></div>}

      {/* REVIEW MODAL */}
      {showReviewModal&&<div className="modal-overlay" onClick={()=>setShowReviewModal(false)}><div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-title">{editingReview?"Editar reseña":"Agregar reseña"}</div>
        {!editingReview&&<div className="disclaimer-box">⚠️ {DISCLAIMER}</div>}
        {!session&&!editingReview&&<div className="info-box"><strong>Reseña como invitado.</strong> <button className="link-btn" onClick={()=>{setShowReviewModal(false);setShowAuthModal(true);setAuthMode("login");}}>Iniciá sesión</button> para verificarte.</div>}
        {session&&<div className="info-box success">{isUP(session.user.email)?<>Tu reseña tendrá el badge <span className="badge-up">✓ Alumno UP</span></>:<>Sesión iniciada como {session.user.email}</>}</div>}
        <div className="form-row">
          <div className="form-group" style={{flex:1}}><label className="form-label">Materia</label><select value={revMateria} onChange={(e)=>setRevMateria(e.target.value)}>{(currentProf?.materias||[]).map((m)=><option key={m}>{m}</option>)}</select></div>
          <div className="form-group" style={{flex:1}}><label className="form-label">Modalidad</label><select value={revModalidad} onChange={(e)=>setRevModalidad(e.target.value)}><option>Presencial</option><option>Online</option></select></div>
        </div>
        {!session&&!editingReview&&<div className="form-group"><label className="form-label">Tu email (opcional)</label><input type="email" value={guestEmail} onChange={(e)=>setGuestEmail(e.target.value)} placeholder="tu@up.edu.ar o cualquier email"/></div>}
        <div className="form-group"><label className="form-label">Calificación</label><div className="star-picker">{[1,2,3,4,5].map((n)=><button key={n} className={`star-btn${selectedStar>=n?" active":""}`} onClick={()=>setSelectedStar(n)}>★</button>)}</div></div>
        <div className="form-group"><label className="form-label">Tags</label><div className="tag-picker">{ALL_TAGS.map((t)=><span key={t} className={`tag-option${selectedTags.includes(t)?" selected":""}`} onClick={()=>setSelectedTags(selectedTags.includes(t)?selectedTags.filter((x)=>x!==t):[...selectedTags,t])}>{t}</span>)}</div></div>
        {!editingReview&&<div className="preguntas-box"><div className="preguntas-title">💡 Preguntas guía ({revModalidad}):</div><ul className="preguntas-list">{preguntas.map((p,i)=><li key={i}>{p}</li>)}</ul></div>}
        <div className="form-group"><label className="form-label">Tu opinión</label><textarea value={revText} onChange={(e)=>setRevText(e.target.value)} placeholder="Contá tu experiencia con este profesor..."/></div>
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowReviewModal(false)}>Cancelar</button><button className="btn-primary" onClick={submitReview} disabled={submitting}>{submitting?"Guardando...":editingReview?"Guardar cambios":"Publicar reseña"}</button></div>
      </div></div>}

      {/* ADD MATERIA */}
      {showAddMateriaModal&&<div className="modal-overlay" onClick={()=>setShowAddMateriaModal(false)}><div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-title">Agregar materia</div>
        <div className="form-group"><label className="form-label">Nombre</label><input value={nuevaMateriaDirecta} onChange={(e)=>setNuevaMateriaDirecta(e.target.value)} placeholder="Ej: Derecho Laboral"/></div>
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowAddMateriaModal(false)}>Cancelar</button><button className="btn-primary" onClick={addNuevaMateriaDirecta}>Agregar</button></div>
      </div></div>}

      {/* ADD PROF */}
      {showAddProfModal&&<div className="modal-overlay" onClick={()=>setShowAddProfModal(false)}><div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-title">Agregar profesor</div>
        <div className="form-group"><label className="form-label">Nombre completo</label><input value={newNombre} onChange={(e)=>setNewNombre(e.target.value)} placeholder="Ej: Dra. Ana García"/></div>
        <div className="form-group"><label className="form-label">Área / Departamento</label><input value={newDept} onChange={(e)=>setNewDept(e.target.value)} placeholder="Ej: Contabilidad"/></div>
        <div className="form-group"><label className="form-label">Materias que dicta</label>
          <div className="materia-picker">{materias.map((m)=><span key={m.id} className={`tag-option${newMaterias.includes(m.nombre)?" selected":""}`} onClick={()=>toggleNewMateria(m.nombre)}>{m.nombre}</span>)}</div>
          {!showNewMateriaField?<button className="add-materia-btn" onClick={()=>setShowNewMateriaField(true)}>+ Agregar materia que no está en la lista</button>:
          <div style={{display:"flex",gap:6,marginTop:8}}><input value={nuevaMateria} onChange={(e)=>setNuevaMateria(e.target.value)} placeholder="Nombre..." style={{flex:1}}/><button className="btn-primary" style={{flex:"none",padding:"6px 12px"}} onClick={addNuevaMateria}>Agregar</button><button className="btn-cancel" onClick={()=>setShowNewMateriaField(false)}>✕</button></div>}
          {newMaterias.length>0&&<div style={{marginTop:8,fontSize:12,color:"#0F6E56"}}>Seleccionadas: {newMaterias.join(", ")}</div>}
        </div>
        <div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowAddProfModal(false)}>Cancelar</button><button className="btn-primary" onClick={addProf} disabled={submitting}>{submitting?"Guardando...":"Agregar profesor"}</button></div>
      </div></div>}
    </div>
  );
}