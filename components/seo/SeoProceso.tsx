"use client";

import { useRef } from "react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useTextScramble } from "@/hooks/useTextScramble";

/**
 * LAS CINCO FASES PREVIAS A LA AUDITORÍA TÉCNICA.
 *
 * El orden importa y por eso se numera: cada fase existe porque la anterior la
 * hace posible. No se puede proponer una arquitectura sin saber qué busca la
 * gente, y no se puede saber si algo ha funcionado sin haber medido antes de
 * tocar nada. Presentarlo como una lista de servicios sueltos perdería
 * justamente eso.
 *
 * La sexta fase —la auditoría técnica— tiene sección propia inmediatamente
 * debajo porque no cabe aquí: son catorce bloques por sí sola.
 *
 * Sección de lectura, sin pin ni scrub (ver la nota de SeoComoFunciona).
 */
const FASES = [
  {
    k: "reunion",
    titulo: "Reunión contigo",
    resumen:
      "Antes de tocar nada hay que entender qué vendes, a quién y qué se ha intentado ya. La mitad de los proyectos llegan con acciones anteriores que conviene conocer para no repetirlas ni deshacerlas.",
    items: [
      "Conocer el proyecto en profundidad",
      "Entender el modelo de negocio",
      "Revisar el histórico de acciones SEO anteriores",
      "Accesos a Google Search Console y Analytics",
      "Accesos a la web y al servidor, si hacen falta",
    ],
  },
  {
    k: "trafico",
    titulo: "Análisis del tráfico",
    resumen:
      "La foto de lo que ya tienes. Sin este punto de partida medido no hay forma honesta de decir después si algo ha funcionado — ni de detectar una caída que venía de antes.",
    items: [
      "Evolución histórica del tráfico orgánico",
      "Comparativa del año actual contra el anterior",
      "Evolución histórica de las conversiones orgánicas",
      "Comparativa de conversiones año contra año",
      "Keywords posicionadas y páginas que captan tráfico",
    ],
  },
  {
    k: "demanda",
    titulo: "Análisis de la demanda",
    resumen:
      "Qué busca de verdad quien está a punto de comprar, con qué palabras exactas y cuánta gente lo busca. El foco es transaccional: interesa la búsqueda que trae un cliente, no la que trae una visita curiosa.",
    items: ["Keyword research transaccional", "Tracking de keywords transaccionales"],
  },
  {
    k: "competencia",
    titulo: "Análisis de la competencia",
    resumen:
      "Quién se está quedando esas búsquedas hoy y con qué. Saber su autoridad es además lo que permite dar plazos realistas en vez de inventados.",
    items: [
      "Detectar a los competidores orgánicos reales",
      "Su tráfico y las keywords que tienen posicionadas",
      "Su autoridad",
    ],
  },
  {
    k: "arquitectura",
    titulo: "Arquitectura SEO",
    resumen:
      "Cómo se ordena la web para cubrir esa demanda: qué páginas hacen falta, cuáles sobran, cuáles se fusionan y cómo se enlazan entre sí. Es la fase que más cambia un proyecto y la que más se salta todo el mundo.",
    items: [
      "Propuesta de arquitectura a partir del keyword research y de la competencia",
      "Mock-ups para cada tipología de página",
    ],
  },
];

export default function SeoProceso() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();

  useTextScramble(sectionRef, ".nxr-seo-pr-intro");

  return (
    <section id="nxr-seo-proceso" ref={sectionRef}>
      <div className="nxr-seo-pr-inner">
        <div className="nxr-seo-pr-head nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            Así se audita
            <br />
            <span className="nxr-gradient-text-salmon">un proyecto.</span>
          </h2>
          <p className="nxr-seo-pr-intro">
            Seis fases, en este orden. Cada una existe porque la anterior la hace posible: no se puede proponer una
            arquitectura sin saber qué busca la gente, ni decir si algo ha funcionado sin haber medido antes de tocar.
          </p>
        </div>

        <ol className="nxr-seo-pr-lista">
          {FASES.map((f, i) => (
            <li className="nxr-seo-pr-fase nxr-card nxr-card-lg" key={f.k}>
              <div className="nxr-seo-pr-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="nxr-seo-pr-cuerpo">
                <h3 className="nxr-seo-pr-t">{f.titulo}</h3>
                <p className="nxr-seo-pr-r">{f.resumen}</p>
                <ul className="nxr-seo-pr-items">
                  {f.items.map((it) => (
                    <li key={it}>
                      <span className="nxr-seo-pr-tick" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}

          {/* La sexta fase se anuncia aquí pero se despliega en su propia
              sección: es la más larga de las seis con diferencia, y meterla
              dentro de esta lista rompería la lectura de las otras cinco. */}
          <li className="nxr-seo-pr-fase nxr-card nxr-card-lg nxr-card-lime -sexta">
            <div className="nxr-seo-pr-num">06</div>
            <div className="nxr-seo-pr-cuerpo">
              <h3 className="nxr-seo-pr-t">Auditoría técnica on-page</h3>
              <p className="nxr-seo-pr-r">
                Con la estrategia ya clara, el repaso a fondo de la web: catorce bloques y más de cincuenta
                comprobaciones, desde cómo está enlazada por dentro hasta cuánto tarda en ser usable en un móvil. Está
                entera justo debajo.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
