"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { esMovil } from "@/lib/scrollRitmo";
import { pasoAPaso, mandaPasoAPaso } from "@/store/pasoAPaso";

/**
 * EL TRAMO INICIAL DE LA HOME, COMO DIAPOSITIVAS. Solo en escritorio.
 *
 * Petición: "que no haya que hacer scroll constante para pasar las secciones
 * del principio, con darle un toque ya se van pasando". De la hero a las frases
 * de maestría, de ahí a la Intro, de ahí a la frase de Servicios y de ahí al
 * reel — un golpe de rueda por salto, en los dos sentidos.
 *
 * LA IDEA QUE HACE QUE ESTO SEA SENCILLO: aquí no hay que reproducir ninguna
 * animación. Las cuatro están atadas al scroll con `scrub`, así que "reproducir
 * la salida de las frases y la entrada de la Intro" es, literalmente, llevar el
 * scroll de un punto a otro. Este componente no toca ni una timeline: solo
 * decide A QUÉ ALTURA hay que dejar la página y planea hasta ahí. Todo lo demás
 * lo siguen haciendo las secciones exactamente como antes, y por eso ninguna
 * hubo que tocarla.
 *
 * DE DÓNDE SALEN LAS ETAPAS. No están escritas a mano en píxeles: se leen de
 * los propios ScrollTrigger cada vez que se da un paso, así que siguen siendo
 * correctas si cambia el recorrido de un pin, la altura de la ventana o el
 * contenido. Lo único fijo son las FRACCIONES, que sí dependen de cómo está
 * repartida cada timeline por dentro y están justificadas una a una abajo.
 *
 * DÓNDE ACABA. En la primera card del reel de Servicios, y ni un píxel más: el
 * reel tiene su propia paginación y su propio asentamiento, y dos sistemas
 * disputándose la rueda en la misma sección es la peor forma de romper los dos.
 * A partir de ahí el scroll vuelve a ser el normal.
 */

// ---- FRACCIONES DE CADA RECORRIDO ----------------------------------------

/**
 * Frases de maestría, dentro del pin del hero.
 *
 * La timeline del hero dura 3,7 unidades: el bloque de portada se desvanece de
 * 0 a 1, las frases se escriben de 1,1 a 2,1, hay una pausa de lectura hasta
 * 2,7 y de ahí a 3,7 barren hacia arriba. La etapa buena es el CENTRO de esa
 * pausa —2,4— porque es el único tramo donde las frases están completas y
 * quietas: 2,4/3,7 = 0,649.
 */
const HERO_FRASES = 0.649;

/**
 * Intro. Su ScrollTrigger mapea el progreso a una curva continua en la que
 * −1 es "entrando", +1 es "saliendo" y CERO es el bloque centrado y a pleno
 * brillo. Ese cero cae exactamente en la mitad del recorrido, así que aquí la
 * fracción no es una estimación: es la definición de la propia animación.
 */
const INTRO_CENTRO = 0.5;

/**
 * Frase de Servicios ("Todo lo que tu negocio necesita"), medida desde el
 * inicio del pin del reel y en fracción de pantalla.
 *
 * El punto de partida no es una estimación: la frase tiene su propio
 * ScrollTrigger, que termina exactamente en "top top" del sticky — es decir,
 * justo donde arranca el pin del reel. Ahí la frase acaba de revelarse del
 * todo, y a partir de ahí aguanta a brillo completo durante 0,42 pantallas
 * (PROLOGUE 0,65·vh × HOLD_FRASE 0,65) antes de empezar a disolverse.
 *
 * Se para 0,15 pantallas dentro de esa zona de brillo pleno: lo justo para
 * que el scrub (0,5s de retardo) haya terminado de asentar la entrada, y
 * todavía muy lejos del punto en que la frase empieza a irse.
 */
const SRV_FRASE_VH = 0.15;
/** Fin del prólogo: la primera card del reel. Es PROLOGUE, 0,65·vh. */
const SRV_REEL_VH = 0.65;

// ---- TACTO ---------------------------------------------------------------

/** Umbral de rueda para dar un gesto por intencionado (filtra micro-deltas). */
const UMBRAL = 8;
/** Quietud tras un paso antes de aceptar el siguiente. */
const DESCANSO_MS = 130;

/**
 * VELOCIDAD DEL PLANEO. Tres peticiones seguidas de "más despacio":
 *
 *     V18.74  0,55 ms/px · suelo 700     →  898 / 1005 / 1153 /  700 ms
 *     V18.75  0,90 ms/px · suelo 1100    → 1470 / 1644 / 1887 / 1100 ms
 *     V18.76  1,35 ms/px · suelo 1600    → 2205 / 2466 / 2831 / 1600 ms
 *     V18.77  1,90 ms/px · suelo 2200    → 3103 / 3471 / 3984 / 2200 ms
 *
 * (Los cuatro números de cada fila son los cuatro saltos del tramo con la
 * geometría actual: 1633, 1827, 2097 y 349 píxeles.)
 *
 * Ir despacio aquí no es solo cuestión de gusto: las animaciones de estas
 * secciones van con `scrub`, o sea con medio segundo largo de retardo respecto
 * al scroll. Cuanto más dura el planeo, más cerca va la animación de la
 * posición real y más completa se ve al llegar; con los tiempos originales
 * terminaba con parte del recorrido todavía por resolver.
 *
 *     V18.80  1,20 ms/px · suelo 1500    → 1960 / 2192 / 2516 / 1500 ms
 *
 * (Los cuatro números de cada fila son los cuatro saltos del tramo con la
 * geometría actual: 1633, 1827, 2097 y 349 píxeles.)
 *
 * Ir despacio aquí no es solo cuestión de gusto: las animaciones de estas
 * secciones van con `scrub`, o sea con medio segundo largo de retardo respecto
 * al scroll. Cuanto más dura el planeo, más cerca va la animación de la
 * posición real y más completa se ve al llegar; con los tiempos originales
 * terminaba con parte del recorrido todavía por resolver.
 *
 * V18.80 BAJA DESDE 1,9 ("se siente muy lento") PERO NO ES EL ARREGLO DE FONDO.
 * El número queda entre el 1,35 que se pidió acelerar y el 1,9 que resultó
 * lento, así que el ritmo de un solo golpe sigue siendo pausado. Lo que de
 * verdad quitaba el techo —"tiene que poder ir más rápido"— es que ahora
 * INSISTIR ACELERA: un segundo golpe comprime el planeo en curso en vez de
 * limitarse a encolarse (ver `acelerar` dentro de `planear`). Antes, dos golpes
 * costaban dos transiciones enteras y no había forma de ir más deprisa por
 * mucho que empujaras; ese techo era el problema, más que la duración.
 *
 * El tope de arriba no llega a tocarse: el salto más largo son 2097 píxeles.
 * Está solo para que, si algún pin crece, la transición no se vuelva eterna.
 */
const DUR_MIN = 1500;
const DUR_MAX = 3000;
/** Milisegundos de planeo por píxel recorrido, entre los dos topes. */
const MS_POR_PX = 1.2;
/**
 * En cuánto se termina el planeo en curso cuando el usuario vuelve a empujar.
 * Corto para que insistir se note al momento, pero no cero: un corte seco se
 * leería como un salto, y la posición debe seguir siendo continua.
 */
const ACELERA_MS = 260;

export default function PasoAPaso() {
  const pathname = usePathname();

  useEffect(() => {
    // Normalizado: /en también es la home.
    const esHome = pathname === "/" || pathname === "/en";
    const activable =
      esHome && !esMovil() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!activable) {
      pasoAPaso.disponible = false;
      return;
    }

    let raf = 0;
    let planeando = false;
    let ultimoPaso = 0;
    /**
     * UN paso encolado como mucho, con el sentido del último empujón.
     *
     * Existe porque el planeo dura casi cuatro segundos: volver a empujar a
     * mitad de camino es lo normal, y descartarlo se lee como que la página no
     * responde. Encolado, la transición encadena con la siguiente sin cortarse
     * — que es el comportamiento de cualquier pase de diapositivas cuando
     * pulsas dos veces seguidas.
     *
     * UNO Y NO UNA COLA: el último empujón sobreescribe al anterior en vez de
     * acumularse. Diez golpes seguidos avanzan un paso por planeo mientras se
     * siga empujando, no diez saltos apilados que la página tendría que
     * desatascar después. Y como el sentido se sobreescribe, cambiar de idea a
     * mitad de camino funciona: manda el último gesto.
     */
    let pendiente: 0 | 1 | -1 = 0;
    /** Comprime el planeo en curso. Lo instala `planear` mientras hay uno. */
    let acelerarPlaneo: (() => void) | null = null;

    /**
     * Las etapas, en píxeles de documento. Se recalculan en CADA consulta y no
     * se cachean: los pin-spacer cambian de alto al montarse, al refrescar
     * ScrollTrigger y al redimensionar, así que una lista guardada al cargar
     * apuntaría a sitios que ya no existen. Son tres búsquedas sobre una lista
     * corta, y solo al dar un paso.
     */
    const etapas = (): number[] => {
      const vh = window.innerHeight;
      /**
       * Busca el ScrollTrigger de una sección.
       *
       * NO basta con comparar `st.trigger` con la propia sección, y esto costó
       * que el modo no se activara: el pin del reel de Servicios se ancla a su
       * `.nxr-servicios-sticky`, no a `<section id="nxr-servicios">`. Se acepta
       * cualquier disparador CONTENIDO en la sección —`contains` incluye al
       * propio elemento, así que cubre los tres casos— y, si hubiera varios, se
       * prefiere el que sea la sección exacta.
       */
      const porTrigger = (id: string, pineado: boolean) => {
        const sec = document.getElementById(id);
        if (!sec) return null;
        const candidatos = ScrollTrigger.getAll().filter((st) => {
          const t = st.trigger as Element | undefined;
          if (!t || !sec.contains(t)) return false;
          return pineado ? !!st.pin : true;
        });
        return candidatos.find((st) => st.trigger === sec) ?? candidatos[0] ?? null;
      };

      const hero = porTrigger("nxr-hero", true);
      const intro = porTrigger("nxr-intro", false);
      const srv = porTrigger("nxr-servicios", true);
      if (!hero || !intro || !srv) return [];

      const lista = [
        0,
        hero.start + (hero.end - hero.start) * HERO_FRASES,
        intro.start + (intro.end - intro.start) * INTRO_CENTRO,
        srv.start + vh * SRV_FRASE_VH,
        srv.start + vh * SRV_REEL_VH,
      ].map((v) => Math.round(v));

      // Monótona y sin duplicados: si un refresh dejara dos etapas pegadas o
      // desordenadas, el paso siguiente podría ir hacia atrás.
      for (let i = 1; i < lista.length; i++) {
        if (lista[i] <= lista[i - 1]) return [];
      }
      return lista;
    };

    /** Publica el final del tramo para que Lenis y ScrollSnap sepan hasta dónde. */
    const publicar = () => {
      const e = etapas();
      pasoAPaso.disponible = e.length > 0;
      pasoAPaso.fin = e.length ? e[e.length - 1] : 0;
    };

    const cancelar = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      planeando = false;
      pendiente = 0;
      acelerarPlaneo = null;
    };

    const planear = (destino: number) => {
      const lenis = window.__nxrLenis;
      if (!lenis) return;
      const desde = window.scrollY;
      const delta = destino - desde;
      if (Math.abs(delta) < 2) return;

      // La duración va con la DISTANCIA: los saltos de este tramo van de dos a
      // seis pantallas y con un tiempo fijo los cortos se sentirían perezosos y
      // los largos, un tirón. Con topes en los dos extremos.
      //
      // `dur` y `t0` son MUTABLES porque insistir con la rueda los reescribe
      // para acelerar el planeo en curso — ver `acelerar`.
      let dur = Math.min(DUR_MAX, Math.max(DUR_MIN, Math.abs(delta) * MS_POR_PX));
      let t0 = performance.now();
      planeando = true;

      /**
       * INSISTIR ACELERA. Es el arreglo de "se siente muy lento, tiene que
       * poder ir más rápido", y no es lo mismo que bajar la duración.
       *
       * Antes, un segundo golpe de rueda a mitad de planeo solo se ENCOLABA:
       * había que esperar a que la transición terminase entera y solo entonces
       * arrancaba la siguiente. Con transiciones largas eso significa que dos
       * golpes cuestan dos transiciones completas, y por rápido que quisieras ir
       * la página no te dejaba. Ese techo era el problema, más que el número.
       *
       * Ahora el golpe extra comprime lo que queda del planeo actual a
       * `ACELERA_MS` y encadena. Insistir tres veces seguidas cruza el tramo en
       * un momento; un solo golpe conserva el ritmo pausado de siempre.
       *
       * La cuenta preserva la POSICIÓN: se recalculan `dur` y `t0` de forma que
       * el progreso actual siga siendo el mismo en este instante y solo cambie
       * lo que queda por delante. Sin eso, acortar la duración haría saltar el
       * scroll hacia adelante de golpe, que es justo lo que no puede pasar.
       */
      const acelerar = () => {
        const ahora = performance.now();
        const t = Math.min(1, (ahora - t0) / dur);
        if (t >= 1) return;
        const restante = dur - (ahora - t0);
        if (restante <= ACELERA_MS) return;
        dur = ACELERA_MS / (1 - t);
        t0 = ahora - t * dur;
      };
      acelerarPlaneo = acelerar;

      const paso = () => {
        const t = Math.min(1, (performance.now() - t0) / dur);
        // Coseno: arranca y termina con velocidad cero. Frente a la cúbica de
        // salida de ScrollSnap, aquí importa también la ENTRADA: el gesto es un
        // toque, no un arrastre, así que si el planeo arranca a velocidad máxima
        // se lee como un salto en vez de como una transición.
        const e = 0.5 - Math.cos(Math.PI * t) / 2;
        lenis.scrollTo(desde + delta * e, { immediate: true });
        if (t < 1) {
          raf = requestAnimationFrame(paso);
        } else {
          raf = 0;
          planeando = false;
          acelerarPlaneo = null;
          ultimoPaso = performance.now();
          publicar();
          // El paso encolado arranca AQUÍ MISMO, sin esperar el descanso: ese
          // descanso está para no encadenar dos pasos por un solo gesto de
          // rueda, y aquí el segundo gesto ya existe y es intencionado. Sin
          // esta salida inmediata se vería una pausa entre transiciones y
          // volvería la sensación de que la página va por detrás.
          if (pendiente) {
            const sentido = pendiente;
            pendiente = 0;
            avanzar(sentido);
          }
        }
      };
      raf = requestAnimationFrame(paso);
    };

    /** Da un paso en el sentido pedido desde la etapa en la que se esté. */
    const avanzar = (sentido: 1 | -1) => {
      const e = etapas();
      if (!e.length) return;
      const y = window.scrollY;

      // La etapa "actual" es la más cercana, no la anterior: tras un planeo se
      // está justo encima de una, y con tolerancia se evita que un píxel de
      // diferencia cuente como estar todavía en la de atrás.
      let i = 0;
      let mejor = Infinity;
      for (let k = 0; k < e.length; k++) {
        const d = Math.abs(e[k] - y);
        if (d < mejor) {
          mejor = d;
          i = k;
        }
      }
      // Si se está claramente ENTRE dos etapas —al entrar en el tramo desde
      // fuera, o tras un refresco que ha movido los pines— no se va a la más
      // cercana, que podría estar detrás y leerse como que la página te
      // devuelve: se va a la primera que haya EN EL SENTIDO en el que empujas.
      if (mejor > 4) {
        const siguiente = sentido > 0 ? e.find((v) => v > y + 4) : [...e].reverse().find((v) => v < y - 4);
        if (siguiente !== undefined) planear(siguiente);
        return;
      }

      const destino = i + sentido;
      if (destino < 0 || destino >= e.length) return;
      planear(e[destino]);
    };

    const onWheel = (ev: WheelEvent) => {
      const dy = ev.deltaY;
      if (!mandaPasoAPaso(dy)) return;
      // Se impide el scroll nativo SIEMPRE que el tramo manda, también mientras
      // se plana: si no, el navegador seguiría moviendo la página por debajo del
      // planeo y las dos escrituras se pelearían. Lenis ya se aparta por su
      // lado (ver `virtualScroll` en SmoothScroll).
      ev.preventDefault();
      if (Math.abs(dy) < UMBRAL) return;
      const sentido = dy > 0 ? 1 : -1;
      // A mitad de planeo el gesto NO se tira: se guarda para encadenar en
      // cuanto termine. Ver `pendiente`.
      if (planeando) {
        pendiente = sentido;
        acelerarPlaneo?.();
        return;
      }
      if (performance.now() - ultimoPaso < DESCANSO_MS) return;
      avanzar(sentido);
    };

    const TECLAS_ADELANTE = ["ArrowDown", "PageDown", " ", "Spacebar"];
    const TECLAS_ATRAS = ["ArrowUp", "PageUp"];
    const onKey = (ev: KeyboardEvent) => {
      const adelante = TECLAS_ADELANTE.includes(ev.key);
      const atras = TECLAS_ATRAS.includes(ev.key);
      if (!adelante && !atras) return;
      // Nunca con el foco dentro de un campo: ahí el espacio y las flechas son
      // del campo, no de la página.
      const a = document.activeElement;
      if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || (a as HTMLElement).isContentEditable)) return;
      const sentido = adelante ? 1 : -1;
      if (!mandaPasoAPaso(sentido)) return;
      ev.preventDefault();
      // Misma cola que la rueda: mantener pulsada una flecha durante una
      // transición larga tiene que encadenar, no perderse.
      if (planeando) {
        pendiente = sentido;
        acelerarPlaneo?.();
        return;
      }
      if (performance.now() - ultimoPaso < DESCANSO_MS) return;
      avanzar(sentido);
    };

    // Un refresh de ScrollTrigger mueve los pin-spacer y con ellos las etapas.
    const onRefresh = () => publicar();

    // `passive: false` es obligatorio: sin él, preventDefault no tiene efecto y
    // el navegador scrollearía por su cuenta durante el planeo.
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    ScrollTrigger.addEventListener("refresh", onRefresh);
    // Las etapas dependen de pines que se crean después de este efecto, así que
    // la primera publicación espera a que ScrollTrigger haya montado los suyos.
    const primera = window.setTimeout(publicar, 400);

    return () => {
      window.clearTimeout(primera);
      cancelar();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      pasoAPaso.disponible = false;
    };
  }, [pathname]);

  return null;
}
