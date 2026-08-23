"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Components that need to animate the scroll position programmatically
// (e.g. Servicios' card snap) MUST go through this instance — a plain
// window.scrollTo fights Lenis' own rAF-driven positioning. Exposed on
// window because the consumers live in a different React tree.
declare global {
  interface Window {
    __nxrLenis?: Lenis;
  }
}

export default function SmoothScroll() {
  // Refresh de ScrollTrigger tras navegación CLIENTE (SPA). V16.54, bug: al
  // volver a la home desde otra página, la frase "todo lo que tu negocio
  // necesita" (y potencialmente otros textos scroll-driven) no reaparecía —
  // en una navegación SPA no hay evento `load`, así que los pins/starts se
  // quedaban con las posiciones calculadas antes de que el layout de la nueva
  // página se asentara, y el clamp de la frase la dejaba apagada fuera de su
  // rango real. Un refresh diferido (2 rAF, ya montados los efectos de la
  // página nueva) recalcula todas las posiciones. Seguro: tras navegar estás
  // en el top (scroll 0), así que solo recalcula secciones fuera de pantalla,
  // sin salto visible. Se salta el montaje inicial (ese ya lo cubre `load`).
  const pathname = usePathname();
  const firstMount = useRef(true);
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname]);

  useEffect(() => {
    // Mobile browsers (Chrome/Safari) show/hide their address bar as you scroll,
    // firing a `resize` that only changes viewport HEIGHT. By default that makes
    // ScrollTrigger.refresh() recompute every pin/end, which reflows the pinned
    // sections and visibly shoves the whole page up/down — exactly the "the bar
    // hides and leaves an empty gap that pushes the site up" glitch. Telling
    // ScrollTrigger to ignore that height-only mobile resize keeps the layout
    // rock-steady while the toolbar animates (pros do this on any pinned site).
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Base V16.17 (defaults de Lenis) + alcance del flick contenido (V18.31).
    //
    // LO QUE HAY QUE SABER ANTES DE TOCAR ESTO, porque V18.30 se estrelló
    // justo aquí: en Lenis el lerp NO gobierna solo la cola de frenado. Es la
    // fracción del hueco pendiente que se recorre por frame, y ese hueco
    // existe también MIENTRAS el gesto está activo — el dedo (o la rueda)
    // mueve el objetivo y el contenido lo persigue. Así que bajar el lerp
    // alarga el frenado, sí, pero al mismo precio hace que el contenido vaya
    // por detrás del dedo todo el rato: eso es exactamente la sensación de
    // "pesado" / arrastrado que devolvió V18.30 (lerp 0.07, syncTouchLerp
    // 0.03). No hay forma de separar las dos cosas con este parámetro, y
    // entre las dos manda la respuesta al gesto.
    //
    // Por eso aquí solo queda tocado lo que NO afecta al seguimiento:
    //   - touchInertiaExponent 1.9 -> 1.7 (el default). Solo entra en juego
    //     DESPUÉS de soltar, escalando la velocidad de salida (|v|^n), así que
    //     recorta cuánto vuela un flick fuerte sin volver pesado el arrastre.
    //     Estaba en 1.9 para que el flick llegara más lejos, que es justo lo
    //     que hacía que las secciones se pasaran de golpe.
    //   - syncTouchLerp 0.05: el valor afinado en V16.52 y validado en
    //     teléfono real. Se deja como estaba.
    //   - lerp y wheelMultiplier: SIN valor propio, defaults de Lenis (0.1 y
    //     1). La rueda vuelve a responder a la primera.
    //
    // (autoRaf false es ESTRUCTURAL — ver V16.17: el rAF lo llevamos nosotros
    // junto a ScrollTrigger.update.)
    //
    // ===================================================================
    // syncTouch: FUERA (V18.67) — el scroll táctil vuelve a ser el del sistema
    // ===================================================================
    // Petición: "la barra de navegación inferior no se oculta, con el resto de
    // webs se oculta para no ocupar espacio".
    //
    // Y no se ocultaba por ESTO. Con syncTouch activo, Lenis se queda el gesto
    // (preventDefault sobre touchmove) y mueve la página por programa en cada
    // frame. Chrome y Safari repliegan su barra únicamente cuando el scroll lo
    // produce el dedo sobre el documento; un scroll programático, por muy
    // fluido que sea, nunca la repliega. O sea que la barra fija no era un
    // detalle a ajustar: era la consecuencia directa de este parámetro, y la
    // única forma de recuperarla es devolverle el gesto al navegador.
    //
    // Lo que se paga, para que conste antes de que alguien lo revierta:
    //   · Las cards de cristal WebGL se colocan cada frame leyendo rects del
    //     DOM. Con el scroll táctil sincronizado iban clavadas; con el nativo
    //     pueden quedarse un frame por detrás en un desplazamiento rápido.
    //   · El tope de flick que vivía aquí abajo ha desaparecido con él (ver el
    //     bloque siguiente): la inercia táctil ya es del navegador y no hay
    //     ningún objetivo que clampar.
    // A cambio, además de la barra, el scroll de móvil pasa a ser el nativo del
    // teléfono, que es más ligero que el que había.
    //
    // EN ESCRITORIO NO CAMBIA NADA: syncTouch solo gobierna el gesto táctil.
    // La rueda sigue con el suavizado de Lenis y su lerp por defecto.
    const lenis = new Lenis({
      autoRaf: false,
      touchInertiaExponent: 1.7,
    });
    window.__nxrLenis = lenis;

    // AQUÍ VIVÍA EL TOPE DE FLICK (V16.53 → V18.67), y conviene saber qué era
    // antes de echarlo de menos. Petición original: "que no se pueda desplazar
    // muy rápido por las páginas". Funcionaba porque con syncTouch la inercia
    // táctil era de Lenis: en `touchend`, tras un rAF, se clampaba cuánto podía
    // quedar el objetivo por delante de la posición real (tope 1.35 pantallas),
    // y al capar ese hueco se capaba la velocidad pico del planeo.
    //
    // Se ha ido con syncTouch: la inercia ahora la produce el navegador, no hay
    // ningún `targetScroll` que clampar y el mecanismo era literalmente
    // inaplicable — no "innecesario", inaplicable. No existe forma de limitar
    // la inercia nativa sin volver a secuestrar el gesto, que es exactamente lo
    // que dejaba la barra del navegador clavada.
    //
    // CONSECUENCIA REAL A VIGILAR: un flick fuerte puede volver a recorrer más
    // de lo que recorría, y el sitio donde más se nota es la entrada al reel de
    // Servicios, cuyo prólogo móvil (1.35 en Servicios.tsx) se afinó CONTRA
    // este tope. Si aparece, se corrige alargando ese prólogo, no restaurando
    // esto.

    // Any ScrollTrigger created anywhere in the app (this is the only place
    // that should own a Lenis instance) needs to recompute on Lenis' own
    // scroll event, since Lenis drives scroll via rAF rather than firing
    // native `scroll` events at the same cadence ScrollTrigger expects.
    lenis.on("scroll", ScrollTrigger.update);

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      delete window.__nxrLenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
