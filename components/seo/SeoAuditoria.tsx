"use client";

import { useRef } from "react";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useTextScramble } from "@/hooks/useTextScramble";

/**
 * LA SEXTA FASE, DESPLEGADA: la auditoría técnica on-page.
 *
 * Catorce bloques. Cada uno lleva, además de su lista de comprobaciones, UNA
 * FRASE QUE EXPLICA QUÉ SIGNIFICA Y POR QUÉ IMPORTA — sin ella esto es un
 * glosario que solo entiende quien ya sabía SEO, y el visitante que tiene que
 * decidir si contratar no es esa persona. "Canibalizaciones" no le dice nada a
 * nadie; "dos páginas tuyas peleando por la misma búsqueda, y Google eligiendo
 * la que no te interesa" sí.
 *
 * Las comprobaciones van como chips y no como lista con viñetas a propósito:
 * son términos técnicos cortos y repetidos entre bloques, y en chips se leen de
 * un vistazo como lo que son —un inventario— en vez de pedir que se lean una
 * por una.
 *
 * Dos bloques (URLs y Canibalizaciones) no tienen sub-comprobaciones: son la
 * comprobación en sí. Se quedan sin chips en vez de inventarles contenido de
 * relleno para que la rejilla quede simétrica.
 *
 * Sección de lectura, sin pin ni scrub (ver la nota de SeoComoFunciona).
 */
const BLOQUES = [
  {
    k: "urls",
    titulo: "URLs",
    desc: "Direcciones limpias, legibles y estables. Una URL que cambia sin su redirección pierde de golpe todo lo que esa página había ganado.",
    items: [],
  },
  {
    k: "enlazado",
    titulo: "Enlazado interno",
    desc: "Cómo se pasan importancia las páginas entre sí. Es lo que le dice a Google qué partes de tu web son las que importan — y lo que hace que una página nueva tarde días o meses en despegar.",
    items: [
      "Home",
      "Categorías y subcategorías",
      "Páginas de producto o servicio",
      "Blog",
      "Menú",
      "Breadcrumb",
      "Footer",
      "Errores y redirecciones",
    ],
  },
  {
    k: "headings",
    titulo: "Headings",
    desc: "La jerarquía de títulos de cada página. Es el índice que un buscador lee antes que el texto, y donde más veces se encuentra una web entera compitiendo por la palabra equivocada.",
    items: ["Home", "Categorías y subcategorías", "Páginas de producto o servicio", "Blog"],
  },
  {
    k: "contenido",
    titulo: "Contenido",
    desc: "Si cada página dice algo propio y suficiente. Dos que dicen lo mismo compiten entre ellas; una que casi no dice nada no compite con nadie.",
    items: [
      "Home",
      "Categorías y subcategorías",
      "Páginas de producto o servicio",
      "Blog",
      "Contenido duplicado y thin content",
    ],
  },
  {
    k: "caniba",
    titulo: "Canibalizaciones",
    desc: "Páginas tuyas peleándose por la misma búsqueda. Google acaba eligiendo una —casi nunca la que te interesa— y las dos rinden peor de lo que rendiría una sola bien hecha.",
    items: [],
  },
  {
    k: "meta",
    titulo: "MetaTags",
    desc: "El titular y la descripción con los que apareces en los resultados. No mueven tu posición por sí solos, pero deciden cuánta gente hace clic estando ya ahí.",
    items: ["Titles", "Meta descriptions"],
  },
  {
    k: "imagenes",
    titulo: "Imágenes",
    desc: "Formato, peso y texto alternativo. Es lo que más pesa en casi cualquier web y de lo menos revisado; también es la vía de entrada al buscador de imágenes.",
    items: ["Formatos", "Alt text"],
  },
  {
    k: "datos",
    titulo: "Datos estructurados",
    desc: "El marcado que le dice a Google qué ES cada cosa: un producto, un precio, una valoración, un evento. Es lo que abre la puerta a los resultados destacados.",
    items: ["Formatos actuales", "Formatos nuevos"],
  },
  {
    k: "local",
    titulo: "SEO local",
    desc: "Si vendes en una zona concreta: cómo apareces en el mapa y en las búsquedas con intención local, que son las que traen a alguien que puede presentarse en tu puerta.",
    items: ["Perfil de empresa", "Arquitectura local"],
    condicional: true,
  },
  {
    k: "internacional",
    titulo: "SEO internacional",
    desc: "Si hay varios idiomas o países: que cada versión se le sirva a quien toca y que ninguna canibalice a las demás. Es donde más webs multiidioma pierden tráfico sin enterarse.",
    items: ["Header", "Etiquetas hreflang en código", "Hreflang en el sitemap.xml", "Errores en Search Console"],
    condicional: true,
  },
  {
    k: "indexacion",
    titulo: "Indexación",
    desc: "Qué páginas tuyas están realmente dentro del índice de Google, cuáles no y por qué. Una página que no está indexada, sencillamente, no existe.",
    items: [
      "Comparativa Google vs. Search Console",
      "Cobertura en Search Console",
      "Crawl budget",
      "Sitemap.xml",
      "Canonicals",
      "Logs de servidor",
      "URLs huérfanas",
    ],
  },
  {
    k: "accesibilidad",
    titulo: "Accesibilidad para el rastreador",
    desc: "Que el robot pueda entrar, recorrer la web entera y no chocarse con nada por el camino. Un bloqueo aquí puede tirar abajo todo lo demás por bien hecho que esté.",
    items: [
      "Robots.txt",
      "WWW",
      "HTTP",
      "Barra final",
      "Errores 4XX y 5XX",
      "Redirecciones 3XX",
      "Paginaciones",
      "Errores HTML",
      "Etiquetas HTML5",
      "Navegadores",
    ],
  },
  {
    k: "movil",
    titulo: "Optimización móvil",
    desc: "Google indexa la versión móvil de tu web, no la de escritorio. Lo que ahí no funcione, no funciona: da igual lo bien que se vea en un ordenador.",
    items: ["Responsive", "Viewport", "Navegabilidad y botones", "Errores en Search Console"],
  },
  {
    k: "wpo",
    titulo: "Rendimiento (WPO)",
    desc: "Cuánto tarda la web en ser usable de verdad. Es factor de posicionamiento, y sobre todo es lo que decide cuánta gente se queda en lugar de volver atrás.",
    items: ["Core Web Vitals", "Servidor", "Imágenes", "JavaScript", "CSS"],
  },
];

const TOTAL_COMPROBACIONES = BLOQUES.reduce((n, b) => n + (b.items.length || 1), 0);

export default function SeoAuditoria() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useTitleReveal<HTMLHeadingElement>();

  useTextScramble(sectionRef, ".nxr-seo-au-intro");

  return (
    <section id="nxr-seo-auditoria" ref={sectionRef}>
      <div className="nxr-seo-au-inner">
        <div className="nxr-seo-au-head nxr-reveal">
          <h2 className="nxr-section-h2" ref={titleRef}>
            Lo que se revisa,
            <br />
            <span className="nxr-gradient-text-lime">punto por punto.</span>
          </h2>
          <p className="nxr-seo-au-intro">
            La auditoría técnica al completo. No es una lista para impresionar: cada bloque explica qué significa y por
            qué puede estar costándote clientes ahora mismo.
          </p>
        </div>

        <div className="nxr-seo-au-cifras nxr-reveal">
          <span>
            <b>{BLOQUES.length}</b> bloques
          </span>
          <i aria-hidden="true" />
          <span>
            <b>{TOTAL_COMPROBACIONES}</b> comprobaciones
          </span>
          <i aria-hidden="true" />
          <span>
            <b>1</b> informe con prioridades
          </span>
        </div>

        <div className="nxr-seo-au-grid">
          {BLOQUES.map((b) => (
            <div className="nxr-seo-au-card nxr-card" key={b.k}>
              <h3 className="nxr-seo-au-t">
                {b.titulo}
                {b.condicional && <span className="nxr-seo-au-si">si procede</span>}
              </h3>
              <p className="nxr-seo-au-d">{b.desc}</p>
              {b.items.length > 0 && (
                <ul className="nxr-seo-au-chips">
                  {b.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <p className="nxr-seo-au-cierre nxr-reveal">
          De todo esto no sale un listado de errores, sale un plan: qué se arregla primero porque bloquea al resto, qué
          después porque es lo que más tráfico devuelve, y qué puede esperar.
        </p>
      </div>
    </section>
  );
}
