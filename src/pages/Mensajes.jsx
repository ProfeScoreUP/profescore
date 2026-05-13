import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useApp, Avatar, timeAgo } from "../context";

export default function MensajesPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { session, perfil, perfilesMap, mensajes, fetchMensajes } = useApp();
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef(null);

  const chatWith = userId ? perfilesMap[userId] : null;

  useEffect(()=>{
    if(userId&&session) markAsRead(userId);
  },[userId]);

  useEffect(()=>{
    chatBottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[mensajes,userId]);

  async function markAsRead(otherId) {
    await supabase.from("mensajes").update({leido:true}).eq("para_user_id",session.user.id).eq("de_user_id",otherId).eq("leido",false);
    await fetchMensajes();
  }

  async function sendMensaje() {
    if(!chatInput.trim()||!userId||!session) return;
    await supabase.from("mensajes").insert({de_user_id:session.user.id,para_user_id:userId,texto:chatInput.trim()});
    setChatInput("");await fetchMensajes();
  }

  function getConversations() {
    if(!session) return [];
    const convMap = {};
    mensajes.forEach(m=>{
      const otherId = m.de_user_id===session.user.id?m.para_user_id:m.de_user_id;
      if(!convMap[otherId]||new Date(m.created_at)>new Date(convMap[otherId].lastMsg.created_at)) convMap[otherId]={otherId,lastMsg:m,unread:0};
      if(m.para_user_id===session.user.id&&!m.leido) convMap[otherId].unread=(convMap[otherId].unread||0)+1;
    });
    return Object.values(convMap).sort((a,b)=>new Date(b.lastMsg.created_at)-new Date(a.lastMsg.created_at));
  }

  const chatMessages = userId ? mensajes.filter(m=>(m.de_user_id===session?.user.id&&m.para_user_id===userId)||(m.de_user_id===userId&&m.para_user_id===session?.user.id)) : [];
  const conversations = getConversations();

  if(!session) return <div className="empty">Iniciá sesión para ver tus mensajes.</div>;

  if(userId&&chatWith) return (
    <div className="chat-view">
      <div className="chat-header">
        <button className="back-btn" onClick={()=>navigate("/mensajes")}>← Volver</button>
        <Avatar url={chatWith.foto_url} name={chatWith.username} size={36} fontSize={13}/>
        <div><div style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>@{chatWith.username}</div>{chatWith.carrera&&<div style={{fontSize:12,color:"var(--text3)"}}>{chatWith.carrera}</div>}</div>
      </div>
      <div className="chat-messages">
        {chatMessages.length===0&&<div className="empty" style={{padding:"1rem"}}>Empezá la conversación</div>}
        {chatMessages.map(m=>{const mine=m.de_user_id===session.user.id;return(
          <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:mine?"flex-end":"flex-start"}}>
            <div className={`message-bubble ${mine?"mine":"theirs"}`}>{m.texto}<div className="message-time">{timeAgo(m.created_at)}</div></div>
          </div>
        );})}
        <div ref={chatBottomRef}/>
      </div>
      <div className="chat-input-row">
        <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Escribí un mensaje..." onKeyDown={e=>e.key==="Enter"&&sendMensaje()}/>
        <button className="chat-send-btn" onClick={sendMensaje}>Enviar</button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{marginBottom:"1.25rem"}}><div className="logo"><div className="dot"/>Mensajes</div></div>
      {conversations.length===0&&<div className="empty">No tenés conversaciones todavía.</div>}
      <div className="conversations-list">
        {conversations.map(conv=>{
          const op = perfilesMap[conv.otherId]||{username:"Usuario",foto_url:null,id:conv.otherId};
          const mine = conv.lastMsg.de_user_id===session.user.id;
          return(
            <div key={conv.otherId} className={`conversation-item${conv.unread>0?" unread":""}`} onClick={()=>navigate(`/mensajes/${conv.otherId}`)}>
              <Avatar url={op.foto_url} name={op.username} size={40} fontSize={14}/>
              <div className="conv-info"><div className="conv-username">@{op.username}</div><div className="conv-preview">{mine?"Vos: ":""}{conv.lastMsg.texto}</div></div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                <span className="conv-time">{timeAgo(conv.lastMsg.created_at)}</span>
                {conv.unread>0&&<span className="sidebar-badge">{conv.unread}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
