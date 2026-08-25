"use client";

import { useRef } from "react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useTextScramble } from "@/hooks/useTextScramble";

/**
 * LO PRIMERO DE LA PÁGINA DESPUÉS DEL HERO: las expectativas, por delante del
 * argumentario de venta.
 *
 * Va aquí a propósito y no enterrada al final. El SEO se vende casi siempre
 * prometiendo plazos que no se pueden cumplir, así que decir de entrada cómo
 * funciona de verdad —incluido que si necesitas tráfico mañana la herramienta
 * son los anuncios y no esto— separa a quien va a quedar contento de quien iba
 * a quedar decepcionado en el mes dos. Es la sección que más confianza gana y
 * la que menos vende, en ese orden.
 *
 * Sección de LECTURA: sin pin y sin scrub (la página ya tiene el hero pineado)
 * y sin cristal volumétrico, con el acabado de .nxr-card. Mismo criterio que
 * DwhAeo y las tarjetas de /automatizaciones.
 */
const PUNTOS = [
  {
    k: "plazo",
    color: "var(--c-salmon)",
    bg: "rgba(255,157,125,.12)",
    titulo: "Los resultados llegan a medio y largo plazo",
    texto:
      "Así funciona Google, y así funciona su negocio: lo inmediato son los anuncios. Si necesitas tráfico la semana que viene, la herramienta correcta es Ads, no SEO. Lo decimos antes de empezar, no en el mes tres.",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M9 2h6" />
      </svg>
    ),
  },
  {
    k: "cero",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    titulo: "Partir de cero cuesta más",
    texto:
      "Un proyecto nuevo, o uno que nunca ha trabajado el posicionamiento, tarda más en despegar que uno con historial. Los plazos cortos solo son realistas en dos casos: una marca que ya es grande, o un sector con poca competencia.",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 21v-8" />
        <path d="M12 13c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6z" />
        <path d="M12 15c0-3-2-5-5-5 0 3 2 5 5 5z" />
      </svg>
    ),
  },
  {
    k: "constante",
    color: "var(--c-red)",
    bg: "rgba(239,61,13,.15)",
    titulo: "No es un trabajo de un mes ni de dos",
    texto:
      "Es constante. En cuanto se para, la competencia recupera el terreno, porque ellos no han parado. El SEO no es una obra que se entrega: es una posición que se mantiene.",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 12a5 5 0 015-5c2.5 0 3.5 1.6 4 2.5.5.9 1.5 2.5 4 2.5a5 5 0 010 10c-2.5 0-3.5-1.6-4-2.5-.5-.9-1.5-2.5-4-2.5a5 5 0 01-4-5z" />
      </svg>
    ),
  },
  {
    k: "estrategia",
    color: "var(--c-lime)",
    bg: "rgba(168,240,74,.12)",
    titulo: "La estrategia no se cambia cada mes",
    texto:
      "Se define, se ejecuta y se mide. Reescribirla cada vez que un dato se mueve es la forma más rápida de no llegar nunca a ningún sitio: ninguna acción llega a dar tiempo a demostrar si funcionaba.",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
      </svg>
    ),
  },
];

export default function SeoComoFunciona() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();

  useTextScramble(sectionRef, ".nxr-seo-cf-intro");

  return (
    <section id="nxr-seo-comofunciona" ref={sectionRef}>
      <div className="nxr-seo-cf-inner">
        <div className="nxr-seo-cf-head nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            Antes de empezar,
            <br />
            <span className="nxr-gradient-text-lime">cómo funciona esto.</span>
          </h2>
          <p className="nxr-seo-cf-intro">
            Cuatro cosas que conviene tener claras el primer día. Ninguna vende, pero todas son ciertas, y son las que
            separan un proyecto que acaba bien de uno que acaba decepcionado en el mes dos.
          </p>
        </div>

        <div className="nxr-seo-cf-grid">
          {PUNTOS.map((p) => (
            <div className="nxr-seo-cf-card nxr-card" key={p.k}>
              <div className="nxr-seo-cf-ico" style={{ background: p.bg, color: p.color }}>
                {p.icon}
              </div>
              <h3 className="nxr-seo-cf-t">{p.titulo}</h3>
              <p className="nxr-seo-cf-d">{p.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
