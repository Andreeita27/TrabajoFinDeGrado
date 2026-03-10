import "../styles/laser.css";

const LASER_EXTERNAL_URL = "https://eliminartatuajeszaragoza.com/";

const heroImage = "images/erikolaser.jpg";
const machineImage = "images/maquinaseriko.png";

const beforeAfterImages = [
  "images/laser1.jpeg",
  "images/laser2.jpeg",
  "images/laser3.png",
];

type FaqItem = {
  q: string;
  a: string;
};

const faqItems: FaqItem[] = [
  {
    q: "¿Se puede eliminar un tatuaje por completo?",
    a: "En muchos casos sí, aunque el resultado depende del tipo de tinta, la profundidad, el color, la cantidad de pigmento y la respuesta de cada piel.",
  },
  {
    q: "¿Cuántas sesiones hacen falta?",
    a: "No hay un número fijo. Influyen el tipo de tinta, la carga de pigmento, la antigüedad del tatuaje, la profundidad y cómo responde tu piel al tratamiento.",
  },
  {
    q: "¿Duele el láser?",
    a: "La sensación es intensa, pero las sesiones suelen ser rápidas. Además, se puede hacer más llevadero con sistemas de enfriamiento y pautas adaptadas a cada caso.",
  },
  {
    q: "¿Quedarán cicatrices?",
    a: "Con tecnología adecuada, una buena valoración previa y siguiendo bien los cuidados posteriores, el riesgo es mínimo.",
  },
  {
    q: "¿Se puede aclarar un tatuaje para hacer un cover?",
    a: "Sí. Muchas veces no se busca borrarlo por completo, sino rebajarlo lo suficiente para que el nuevo diseño quede más limpio y con mejor resultado.",
  },
  {
    q: "¿Se puede tratar un tatuaje recién hecho?",
    a: "No. Lo normal es esperar a que la piel cicatrice bien antes de empezar a tratarlo con láser.",
  },
];

function openLaserSite() {
  window.open(LASER_EXTERNAL_URL, "_blank", "noopener,noreferrer");
}

export default function LaserPage() {
  return (
    <main className="laser-page">
      <header className="laser-hero">
        <div className="laser-hero__copy">
          <p className="laser-hero__kicker">Tratamiento láser</p>

          <h1 className="laser-hero__title">
            Eliminación y aclarado
            <br />
            de tatuajes
          </h1>

          <p className="laser-hero__text">
            Si quieres quitar un tatuaje o aclararlo para preparar un cover,
            aquí tienes una vista general del servicio. El tratamiento lo realiza
            Eriko con tecnología específica para eliminación láser y valoración
            personalizada en función de cada caso.
          </p>

          <p className="laser-hero__text">
            En la web de 62 Rosas solo mostramos la información general del
            servicio. Para resolver dudas, valorar tu tatuaje o pedir cita,
            te redirigimos a su página especializada.
          </p>

          <div className="laser-hero__actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={openLaserSite}
            >
              Ir a la web de láser
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={openLaserSite}
            >
              Consultar mi caso
            </button>
          </div>

          <div className="laser-hero__note">
            Este servicio no se reserva desde 62 Rosas Tattoo. La información
            completa, la valoración y el contacto directo están en la web de Eriko.
          </div>
        </div>

        <div className="laser-hero__media">
          <img
            src={heroImage}
            alt="Eriko, especialista en eliminación y aclarado de tatuajes con láser"
            className="laser-hero__img"
          />
        </div>
      </header>

      <section className="laser-section">
        <div className="laser-section__head">
          <p className="laser-section__kicker">Cómo funciona</p>
          <h2 className="laser-section__title">Qué puede hacer el tratamiento</h2>

          <p className="laser-section__text">
            El láser actúa sobre la tinta del tatuaje para ir fragmentándola
            progresivamente. Dependiendo del objetivo, el proceso puede orientarse
            a una eliminación más completa o a un aclarado previo para facilitar
            un cover posterior.
          </p>
        </div>

        <div className="laser-benefits">
          <article className="laser-benefit">
            <h3 className="laser-benefit__title">Eliminación progresiva</h3>
            <p className="laser-benefit__text">
              Cada tatuaje responde de forma distinta según la tinta, los colores,
              la profundidad y la zona del cuerpo.
            </p>
          </article>

          <article className="laser-benefit">
            <h3 className="laser-benefit__title">Aclarado para cover</h3>
            <p className="laser-benefit__text">
              Si no quieres borrar del todo el tatuaje, muchas veces puede aclararse
              lo suficiente para que el nuevo diseño quede mucho mejor.
            </p>
          </article>

          <article className="laser-benefit">
            <h3 className="laser-benefit__title">Valoración personalizada</h3>
            <p className="laser-benefit__text">
              No todos los tatuajes necesitan el mismo enfoque. Por eso la primera
              consulta es importante antes de empezar el tratamiento.
            </p>
          </article>
        </div>
      </section>

      <section className="laser-section laser-section--dark laser-section--split">
        <div className="laser-section__copy">
          <p className="laser-section__kicker">Tecnología</p>
          <h2 className="laser-section__title">Máquinas y función de cada una</h2>

          <p className="laser-section__text">
            Eriko trabaja con equipos específicos para eliminación y aclarado de
            tatuajes. Destaca la <strong>Ink Hunter Master Pro</strong>,
            orientada a conseguir buenos resultados en eliminación y aclarado, y
            también el uso de <strong>Cryo de Zimmer</strong>, un sistema de aire
            frío pensado para hacer la sesión más soportable y cuidar mejor el tejido.
          </p>

          <div className="laser-machines">
            <article className="laser-machine-card">
              <h3 className="laser-machine-card__title">Ink Hunter Master Pro</h3>
              <p className="laser-machine-card__text">
                Es la máquina principal del tratamiento. Se utiliza para
                <strong> eliminar tatuajes</strong> y también para
                <strong> aclararlos</strong> cuando la idea es preparar la piel
                para un cover.
              </p>
            </article>

            <article className="laser-machine-card">
              <h3 className="laser-machine-card__title">Cryo de Zimmer</h3>
              <p className="laser-machine-card__text">
                Es el sistema de <strong>aire frío</strong> que ayuda a que la
                sesión sea más llevadera, mejora la sensación durante el proceso
                y contribuye a proteger mejor la piel.
              </p>
            </article>
          </div>
        </div>

        <div className="laser-section__media">
          <img
            src={machineImage}
            alt="Máquinas utilizadas por Eriko para eliminación láser"
            className="laser-machines__img"
          />
        </div>
      </section>

      <section className="laser-section">
        <div className="laser-section__head">
          <p className="laser-section__kicker">Resultados</p>
          <h2 className="laser-section__title">Antes y después</h2>

          <p className="laser-section__text">
            Algunos ejemplos de evolución del tratamiento.
          </p>
        </div>

        <div className="laser-gallery">
          {beforeAfterImages.map((img, index) => (
            <figure key={img} className="laser-gallery__item">
              <img
                src={img}
                alt={`Antes y después del tratamiento láser ${index + 1}`}
                className="laser-gallery__img"
              />
            </figure>
          ))}
        </div>
      </section>

      <section className="laser-section laser-section--dark">
        <div className="laser-section__head">
          <p className="laser-section__kicker">FAQ</p>
          <h2 className="laser-section__title">Preguntas frecuentes</h2>
        </div>

        <div className="laser-faq">
          {faqItems.map((item) => (
            <details key={item.q} className="laser-faq__item">
              <summary className="laser-faq__question">{item.q}</summary>
              <p className="laser-faq__answer">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="laser-cta">
        <div className="laser-cta__content">
          <p className="laser-cta__kicker">Contacto</p>
          <h2 className="laser-cta__title">Consulta tu caso directamente con Eriko</h2>

          <p className="laser-cta__text">
            Si quieres saber cuántas sesiones podrías necesitar, si tu tatuaje puede
            aclararse para cover o qué opción encaja mejor contigo, lo ideal es que
            lo valores directamente desde su web.
          </p>

          <div className="laser-cta__actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={openLaserSite}
            >
              Abrir web oficial
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}