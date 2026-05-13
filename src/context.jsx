import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";

export const ADMIN_ID = "bb0e6c4c-c4de-4679-b3bc-0bd318f2e5c1";
export const CONTACT_EMAIL = "profescoreup@gmail.com";
export const UP_LOGO = "https://i.imgur.com/pkwdNzA.png";

export const CATEGORIAS_FORO = [
  "Aranceles y pagos","Ayuda con estudio","Exámenes","Inscripción a materias",
  "Vida universitaria","Pasantías y trabajo","Tecnología y herramientas","Otros / General",
];

export const COLORS = [
  {bg:"#E1F5EE",color:"#085041"},{bg:"#E6F1FB",color:"#0C447C"},
  {bg:"#FAEEDA",color:"#633806"},{bg:"#EEEDFE",color:"#3C3489"},
  {bg:"#FBEAF0",color:"#72243E"},{bg:"#FAECE7",color:"#712B13"},
];

export const ALL_TAGS = [
  "Explica bien","Exigente","Buena onda","Parciales difíciles","Claro","Aburrido",
  "Respondus","Buenas devoluciones","Comprometido","Oral difícil","Brinda apoyo","Muchas tareas","Buenas clases",
];

export const CARRERAS = [
  "Licenciatura en Administración","Licenciatura en Ciencias del Comportamiento","Licenciatura en Marketing",
  "Licenciatura en Management: Inteligencia Artificial","Licenciatura en Negocios Digitales",
  "Licenciatura en Management de la Innovación y Startups","Licenciatura en Management: Economía y Finanzas",
  "Licenciatura en Comercialización: Marketing y Publicidad","Contador Público",
  "Licenciatura en Comercio Internacional","Licenciatura en Recursos Humanos",
  "Licenciatura en Management en Turismo y Hospitalidad","Licenciatura en Administración de Sistemas y Empresas",
  "Licenciatura en Gastronomía","Carrera corta: Comercialización y Dirección de Empresas",
  "MBA - Maestría en Dirección de Empresas","Arquitectura","Actuación Profesional","Comunicación de Moda",
  "Dirección de Comunicación","Diseño de Ilustración","Diseño de Interiores","Diseño de Moda",
  "Diseño de Música y Sonido","Diseño Digital","Diseño Gráfico","Diseño Industrial","Diseño y Negocios de la Moda",
  "Licenciatura en Comunicación Audiovisual","Licenciatura en Comunicación Digital","Licenciatura en Creación Sonora",
  "Licenciatura en Dirección Cinematográfica","Licenciatura en Diseño","Licenciatura en Fotografía",
  "Licenciatura en Publicidad","Licenciatura en Relaciones Públicas","Marketing de la Moda",
  "Organización de Eventos","Producción de Modas","Producción Musical","Abogacía","Maestría en Derecho",
  "Crítico Universitario en Arte","Licenciatura en Arte","Licenciatura en Humanidades y Ciencias Sociales",
  "Licenciatura en Periodismo","Periodismo Deportivo","Licenciatura en Psicología",
  "Licenciatura en Relaciones Internacionales","Licenciatura en Relaciones Internacionales y Ciencia Política",
  "Ingeniería en Inteligencia Artificial","Ingeniería en Informática","Ingeniería en Ciencia de Datos",
  "Ingeniería Industrial","Ingeniería en Telecomunicaciones","Ingeniería Electrónica",
  "Licenciatura en Ciberseguridad","Licenciatura en Inteligencia Artificial","Licenciatura en Informática",
  "Licenciatura en Redes y Comunicación de Datos","Licenciatura en Organización de la Producción",
  "Licenciatura en Tecnología de la Información","Analista Universitario en Sistemas","Otra",
];

export const CATEGORIA_COLORS = {
  "Aranceles y pagos":{bg:"#FAEEDA",color:"#854F0B"},
  "Ayuda con estudio":{bg:"#E1F5EE",color:"#0F6E56"},
  "Exámenes":{bg:"#FCEBEB",color:"#A32D2D"},
  "Inscripción a materias":{bg:"#E6F1FB",color:"#185FA5"},
  "Vida universitaria":{bg:"#EEEDFE",color:"#3C3489"},
  "Pasantías y trabajo":{bg:"#FBEAF0",color:"#72243E"},
  "Tecnología y herramientas":{bg:"#f5f5f0",color:"#555"},
  "Otros / General":{bg:"#f5f5f0",color:"#555"},
};

export const PREGUNTAS_ONLINE = [
  "¿Qué tal es el contenido de los módulos? ¿Es claro y completo?",
  "¿Ofrece clases de consulta sincrónicas?",
  "¿Da devoluciones completas de las actividades y parciales?",
  "¿Hace un seguimiento semana a semana?",
  "¿Da actividades con entrega obligatoria en cada módulo?",
  "¿Cómo es el oral?",
];

export const PREGUNTAS_PRESENCIAL = [
  "¿Cómo explica en clase? ¿Es claro y organizado?",
  "¿Está disponible para consultas antes/después de clase o por mail?",
  "¿Cómo son los parciales en relación a lo que se vio en clase?",
  "¿Da devoluciones de los parciales y trabajos prácticos?",
  "¿Cumple con el horario y el programa de la materia?",
  "¿Recomendarías cursar con este profesor?",
];

export const DISCLAIMER = "Recordá que una buena reseña ayuda a tus compañeros a tomar mejores decisiones. Intentá ser objetivo/a: una mala nota no siempre significa un mal profesor. Contá tu experiencia real.";

const ADJ=["Tigre","Luna","Viento","Piedra","Nube","Rio","Fuego","Hielo","Trueno","Bosque","Mar","Estrella","Rayo","Niebla","Selva","Pico","Lago","Ola","Bruma","Cima"];
const SUST=["Veloz","Nomade","Calmo","Sabio","Feroz","Libre","Sereno","Agil","Bravo","Fiero","Quieto","Audaz","Firme","Leve","Hondo","Vivo","Claro","Oscuro","Suave","Fuerte"];
export function randomUsername(){return ADJ[Math.floor(Math.random()*ADJ.length)]+SUST[Math.floor(Math.random()*SUST.length)];}
export function initials(name){return(name||"?").split(" ").filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join("")||(name||"?")[0];}
export function colorFor(i){return COLORS[i%COLORS.length];}
export function avgRating(reviews){if(!reviews.length)return 0;return reviews.reduce((a,b)=>a+b.rating,0)/reviews.length;}
export function ratingColor(r){if(r>=4)return"#1D9E75";if(r>=3)return"#BA7517";return"#E24B4A";}
export function ratingPillClass(r){if(!r)return"gray";if(r>=4)return"green";if(r>=3)return"amber";return"red";}
export function starsStr(r){return"★".repeat(Math.round(r))+"☆".repeat(5-Math.round(r));}
export function tagClass(t){
  const pos=["Explica bien","Buena onda","Claro","Buenas devoluciones","Comprometido","Brinda apoyo","Buenas clases"];
  const neg=["Aburrido","Oral difícil","Muchas tareas","Respondus"];
  if(pos.includes(t))return"tag-green";if(neg.includes(t))return"tag-red";return"tag-amber";
}
export function isUP(email){return email&&email.endsWith("@up.edu.ar");}
export function isAdmin(uid){return uid===ADMIN_ID;}
export function timeAgo(ts){
  const d=new Date(ts.endsWith("Z")?ts:ts+"Z");const now=new Date();const diff=Math.floor((now-d)/1000);
  if(diff<60)return"ahora";if(diff<3600)return`${Math.floor(diff/60)}m`;
  if(diff<86400)return`${Math.floor(diff/3600)}h`;
  return d.toLocaleDateString("es-AR",{day:"numeric",month:"short"});
}

export const AppContext = createContext(null);
export function useApp(){return useContext(AppContext);}

export function Avatar({url,name,size=44,fontSize=14}){
  const c=colorFor((name||"").charCodeAt(0)%COLORS.length);
  if(url)return<div style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",flexShrink:0}}><img src={url} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>;
  return<div style={{width:size,height:size,borderRadius:"50%",background:c.bg,color:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize,flexShrink:0}}>{initials(name)}</div>;
}

export async function crearNotificacion({ user_id, tipo, texto, link }) {
  if(!user_id) return;
  await supabase.from("notificaciones").insert({ user_id, tipo, texto, link, leida: false });
}

export function useAppData(){
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
  const [darkMode,setDarkMode]=useState(false);
  const [notificaciones,setNotificaciones]=useState([]);
  const [notifCount,setNotifCount]=useState(0);

  useEffect(()=>{
    const saved=localStorage.getItem("darkMode");
    if(saved==="true"){setDarkMode(true);document.documentElement.setAttribute("data-theme","dark");}
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);if(session)fetchPerfil(session.user.id);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{setSession(session);if(session)fetchPerfil(session.user.id);else setPerfil(null);});
    fetchAll();
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{if(session){fetchMensajes();fetchNotificaciones();}else{setNotificaciones([]);setNotifCount(0);}},[session]);

  function toggleDark(){
    const next=!darkMode;setDarkMode(next);
    document.documentElement.setAttribute("data-theme",next?"dark":"light");
    localStorage.setItem("darkMode",next?"true":"false");
  }

  async function fetchPerfil(userId){const{data}=await supabase.from("perfiles").select("*").eq("id",userId).single();setPerfil(data||null);}

  async function fetchNotificaciones(){
    if(!session)return;
    const{data}=await supabase.from("notificaciones").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false}).limit(20);
    setNotificaciones(data||[]);
    setNotifCount((data||[]).filter(n=>!n.leida).length);
  }

  async function marcarTodasLeidas(){
    if(!session)return;
    await supabase.from("notificaciones").update({leida:true}).eq("user_id",session.user.id).eq("leida",false);
    setNotificaciones(prev=>prev.map(n=>({...n,leida:true})));
    setNotifCount(0);
  }

  async function fetchAll(){
    setLoading(true);
    const [{data:profs},{data:revs},{data:mats},{data:vots},{data:coms},{data:perfs},{data:hils},{data:resps}]=await Promise.all([
      supabase.from("profesores").select("*").order("nombre"),
      supabase.from("resenas").select("*").order("created_at",{ascending:false}),
      supabase.from("materias").select("*").order("nombre"),
      supabase.from("votos").select("*"),
      supabase.from("comentarios").select("*").order("created_at",{ascending:true}),
      supabase.from("perfiles").select("*"),
      supabase.from("hilos").select("*").order("created_at",{ascending:false}),
      supabase.from("respuestas_foro").select("*").order("created_at",{ascending:true}),
    ]);
    const resMap={};(revs||[]).forEach(r=>{if(!resMap[r.profesor_id])resMap[r.profesor_id]=[];resMap[r.profesor_id].push(r);});
    const votMap={};(vots||[]).forEach(v=>{if(!votMap[v.resena_id])votMap[v.resena_id]=[];votMap[v.resena_id].push(v);});
    const comMap={};(coms||[]).forEach(c=>{if(!comMap[c.resena_id])comMap[c.resena_id]=[];comMap[c.resena_id].push(c);});
    const pMap={};(perfs||[]).forEach(p=>{pMap[p.id]=p;});
    const respMap={};(resps||[]).forEach(r=>{if(!respMap[r.hilo_id])respMap[r.hilo_id]=[];respMap[r.hilo_id].push(r);});
    setProfesores(profs||[]);setResenas(resMap);setMaterias(mats||[]);
    setVotos(votMap);setComentarios(comMap);setPerfilesMap(pMap);
    setHilos(hils||[]);setRespuestas(respMap);
    const actividad=[];
    (revs||[]).slice(0,10).forEach(r=>{const p=(profs||[]).find(x=>x.id===r.profesor_id);actividad.push({tipo:"reseña",texto:`Reseña de ${p?.nombre||""}`,ts:r.created_at,profId:r.profesor_id});});
    (coms||[]).slice(0,5).forEach(c=>{actividad.push({tipo:"comentario",texto:`Comentario de @${c.username}`,ts:c.created_at});});
    (hils||[]).slice(0,5).forEach(h=>{actividad.push({tipo:"hilo",texto:h.titulo,ts:h.created_at,hiloId:h.id});});
    (resps||[]).slice(0,5).forEach(r=>{const h=(hils||[]).find(x=>x.id===r.hilo_id);actividad.push({tipo:"respuesta",texto:`Respuesta en "${h?.titulo||""}"`,ts:r.created_at,hiloId:r.hilo_id});});
    actividad.sort((a,b)=>new Date(b.ts)-new Date(a.ts));
    setActividadReciente(actividad.slice(0,10));
    setLoading(false);
  }

  async function fetchMensajes(){
    if(!session)return;
    const{data}=await supabase.from("mensajes").select("*").or(`de_user_id.eq.${session.user.id},para_user_id.eq.${session.user.id}`).order("created_at",{ascending:true});
    setMensajes(data||[]);
    setUnreadCount((data||[]).filter(m=>m.para_user_id===session.user.id&&!m.leido).length);
  }

  async function handleLogout(){await supabase.auth.signOut();}

  return {
    session,perfil,setPerfil,perfilesMap,profesores,resenas,materias,votos,setVotos,
    comentarios,mensajes,setMensajes,hilos,respuestas,loading,unreadCount,actividadReciente,
    darkMode,toggleDark,fetchAll,fetchPerfil,fetchMensajes,handleLogout,
    notificaciones,notifCount,fetchNotificaciones,marcarTodasLeidas,
  };
}