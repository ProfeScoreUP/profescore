import { UP_LOGO, CONTACT_EMAIL } from "../context";

export default function AcercaPage() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <img src={UP_LOGO} alt="Universidad de Palermo" className="about-logo-img" onError={e=>e.target.style.display="none"}/>
        <div><div className="about-title">ProfeScore</div><div className="about-tagline">La voz de los estudiantes de la Universidad de Palermo</div></div>
      </div>

      <div className="about-section">
        <h3>¿Qué es ProfeScore?</h3>
        <p>Esta plataforma es el lugar donde los estudiantes de la UP compartimos información sobre profesores de forma honesta y directa. Sin filtros corporativos, sin versiones oficiales — solo la experiencia real de quienes ya cursaron.</p>
      </div>

      <div className="about-section">
        <h3>Más que reseñas</h3>
        <p>Además de calificar profesores, ProfeScore es un espacio para conectar con otros estudiantes. Podés explorar perfiles, ver qué materias cursaron, mandarle un mensaje privado a alguien que dejó una reseña que te resultó útil, o simplemente conocer gente que está pasando por lo mismo que vos.</p>
      </div>

      <div className="about-section">
        <h3>El foro es tuyo</h3>
        <p>¿Querés hablar con gente que ya cursó la misma materia? ¿Buscás un profesor particular? ¿Necesitás ejercicios de práctica extra? El foro de ProfeScore está dividido por temas para que puedas encontrar — y dar — respuestas rápido. Cualquier estudiante registrado puede abrir un hilo y participar en las discusiones.</p>
      </div>

      <div className="about-section">
        <h3>Valores</h3>
        <p>Pedimos a todos que sean honestos pero justos. Una mala nota no siempre significa un mal profesor, y una reseña resentida no le sirve a nadie. El objetivo es ayudarnos entre todos en nuestras carreras universitarias — y eso se logra compartiendo experiencias reales.</p>
      </div>

<div className="about-section" style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 18px"}}>
  <h3 style={{marginBottom:8}}>Compromiso y uso responsable</h3>
  <p>ProfeScore es un sitio independiente creado por estudiantes de la Universidad de Palermo, sin afiliación oficial con la institución. Fue creado con respeto por las normas y el Código de Honor de la UP: no se permiten expresiones injuriosas o degradantes hacia profesores u otros estudiantes, ni la publicación de temarios o material de evaluaciones antes de que sean tomadas. Las reseñas deben reflejar experiencias reales y honestas. El contenido publicado refleja exclusivamente las experiencias personales de los usuarios y nos comprometemos a moderar y responder ante cualquier reporte de uso indebido.</p>
</div>

      <div className="about-contact">
        <h3>📬 Contacto</h3>
        <p>¿Tenés sugerencias, encontraste un error o necesitás asistencia? Escribinos a:<br/><br/><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br/><br/>Leemos todos los mensajes y respondemos a la brevedad.</p>
      </div>
    </div>
  );
}