"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mandaPasoAPaso } from "@/store/pasoAPaso";

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
    // (autoRaf false y syncTouch true son ESTRUCTURALES — ver V16.17: el rAF
    // lo llevamos nosotros junto a ScrollTrigger.update, y sin syncTouch las
    // cards de cristal WebGL, posicionadas por frame desde rects DOM, irían un
    // frame por detrás del contenido en móvil.)
    //
    // ESTO SE PROBÓ A QUITAR EN V18.67 Y HUBO QUE DEVOLVERLO EN V18.70. Merece
    // quedar escrito porque la idea vuelve a parecer buena cada vez:
    //
    //   · Se quitó para que la barra inferior de Chrome/Safari volviera a
    //     ocultarse al scrollear. Y funciona: esos navegadores solo repliegan
    //     su barra cuando el scroll lo produce el dedo sobre el documento, así
    //     que mientras Lenis se quede el gesto y mueva la página por programa,
    //     la barra se queda fija. Es causa directa, no un efecto secundario.
    //   · Pero con el scroll táctil nativo, el navegador desplaza el contenido
    //     en el compositor por delante de lo que ve el hilo principal. Las
    //     mallas de cristal se recolocan cada frame leyendo el rect de su
    //     tarjeta, así que se dibujan donde la tarjeta ESTABA: el texto se
    //     despega visiblemente de su cristal al scrollear.
    //   · No hay término medio. No existe forma de leer el desplazamiento que
    //     el compositor ya ha aplicado, así que o el scroll lo lleva
    //     JavaScript y el cristal va clavado, o lo lleva el navegador y el
    //     cristal va un frame por detrás. Se intentó la tercera vía —pintar el
    //     cristal con CSS sobre la propia tarjeta, que no puede
    //     desincronizarse— y el acabado no llegaba: sin cúpula ni refracción
    //     no es el mismo material ("haz las cards de liquid glass como estaban
    //     antes").
    //
    // Entre las dos cosas manda el cristal. Si algún día vuelve a pesar más la
    // barra, el cambio es este único parámetro — y con él vuelven el desfase y
    // la pérdida del tope de flick de aquí abajo.
    // El reel de Servicios y ZP no dependen de esto: paginan por su cuenta en
    // touchend (glideTo con escrituras immediate que anulan la inercia de
    // Lenis) y su muro de primera llegada clampa cualquier flick fuerte.
    // NO se toca el cap de 1.35·vh de abajo: está co-afinado con el prólogo del
    // reel y bajarlo rompió su entrada dos veces en teléfono real.
    // TIRAR HACIA ABAJO ARRIBA DEL TODO RECARGA LA PÁGINA (V18.73).
    // ================================================================
    // No lo hacía, y por lo mismo que la barra del navegador no se replegaba:
    // con `syncTouch` Lenis se queda TODOS los gestos táctiles y llama a
    // `preventDefault()`, así que el navegador nunca llega a ver el
    // sobredesplazamiento del que nace el "pull to refresh".
    //
    // Pero aquí sí hay término medio, y es este `virtualScroll`: Lenis lo
    // consulta al principio de su manejador y, si devuelve `false`, SALE ANTES
    // de tocar el evento. Ni preventDefault ni scroll propio: el gesto se lo
    // queda el navegador. O sea que se puede devolver el control en un caso
    // muy concreto sin renunciar a la sincronía del cristal en todos los demás.
    //
    // El caso es exactamente uno: estar arriba del todo Y tirar hacia abajo. En
    // esa combinación no hay ningún scroll que hacer —no queda página por
    // encima—, así que ceder el gesto no le quita nada a Lenis y le devuelve al
    // navegador el único momento en el que lo necesita. Cualquier otra
    // situación (tirar hacia arriba, o hacia abajo sin estar en el tope) sigue
    // siendo suya.
    //
    // Solo TÁCTIL: con la rueda del ratón no existe este gesto, y dejar pasar
    // sus eventos en el tope rompería el suavizado de escritorio sin ganar
    // nada. `deltaY < 0` es tirar hacia abajo en el convenio de Lenis (deltaY
    // positivo = avanzar por la página).
    const lenis = new Lenis({
      autoRaf: false,
      syncTouch: true,
      syncTouchLerp: 0.05,
      touchInertiaExponent: 1.7,
      virtualScroll: ({ deltaY, event }) => {
        const esTactil = event.type.startsWith("touch");
        if (esTactil && deltaY < 0 && window.scrollY <= 0) return false;
        // MODO PASO A PASO (tramo inicial de la home en escritorio): mientras
        // le toque a él, Lenis se aparta del todo. Si no, los dos moverían el
        // scroll a la vez —Lenis siguiendo la rueda y el paso a paso planeando
        // hacia su etapa— y el resultado sería un tira y afloja. Quien impide
        // el scroll nativo en ese caso es el propio PasoAPaso, no esto.
        if (mandaPasoAPaso(deltaY)) return false;
        return true;
      },
    });
    window.__nxrLenis = lenis;

    // TOPE DE VELOCIDAD/ALCANCE POR GESTO en móvil (V16.53, petición: "que no
    // se pueda desplazar muy rápido por las páginas"). Con exponent 1.9 la
    // curva de inercia se dispara en flicks fuertes (|v|^1.9), así que un solo
    // deslizamiento podía volar varias secciones. Lenis no tiene tope propio:
    // en touchend, tras un rAF (su listener de inercia corre primero, se
    // registra al crear la instancia), se clampa cuánto puede quedar el
    // objetivo por delante de la posición actual. Al capar el hueco máximo se
    // capa también la velocidad pico del planeo (v_pico ≈ hueco·lerp), que es
    // exactamente el "tope de velocidad" pedido. El scrollTo usa el mismo
    // syncTouchLerp (0.05) para que la cola de frenado mantenga el tacto largo
    // de V16.52. Reintroduce el capFlickReach que existía antes de V16.17;
    // 1.35 pantallas está co-afinado con el prólogo del reel de Servicios (ver
    // memoria reel-geometria-validada) — la paginación del reel es inmune (sus
    // escrituras immediate por frame sobrescriben cualquier objetivo).
    const capFlickReach = () => {
      requestAnimationFrame(() => {
        const ahead = lenis.targetScroll - lenis.animatedScroll;
        const cap = window.innerHeight * 1.35;
        if (Math.abs(ahead) > cap) {
          lenis.scrollTo(lenis.animatedScroll + Math.sign(ahead) * cap, { lerp: 0.05 });
        }
      });
    };
    window.addEventListener("touchend", capFlickReach, { passive: true });

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
      window.removeEventListener("touchend", capFlickReach);
      delete window.__nxrLenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
