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

/**
 * UN GESTO = UN PASO. Esto es lo que se estuvo afinando mal tres veces.
 * =====================================================================
 * El error de fondo no era la duración: era contar EVENTOS en vez de GESTOS.
 * Un solo movimiento de rueda —y sobre todo un solo deslizamiento de trackpad—
 * no emite un evento `wheel`, emite DECENAS: la ráfaga inicial más una cola de
 * inercia que el navegador sigue entregando después de levantar el dedo.
 * Tratando cada uno como "quiero avanzar", un toque pequeño se llevaba por
 * delante todo el tramo ("haciendo poquísimo scroll se pasan todas las
 * secciones de golpe").
 *
 * La solución no es un umbral más alto —la cola también lo cruza— sino
 * segmentar la ráfaga en gestos, que es exactamente lo que hacen las dos
 * referencias del sector para este mismo problema:
 *
 *  · fullPage.js, que es la librería canónica de "una sección por gesto":
 *    acumula los deltas recientes en un buffer, lo VACÍA tras un rato de
 *    silencio, y mantiene un bloqueo duro mientras dura la transición
 *    (`isAnimating` + `scrollDelay`). Todo lo que llega durante la animación se
 *    DESCARTA; no se encola ni acelera nada.
 *  · El módulo `mousewheel` de Swiper, que expone justo estos dos parámetros
 *    —`thresholdDelta` (cuánto hay que acumular para que cuente) y
 *    `thresholdTime` (cuánto hay que esperar entre disparos)— precisamente
 *    para que la cola de inercia de un trackpad no dispare varias veces.
 *
 * De ahí salen los tres números de abajo. Y de ahí sale también la decisión de
 * QUITAR la aceleración por evento que introdujo V18.80: con los gestos bien
 * segmentados, "ir más rápido" es dar otro toque en cuanto termina la
 * transición, no que la cola de un mismo toque encadene sola.
 */

/** Silencio que da una ráfaga por terminada. Es el vaciado de fullPage.js. */
const GESTO_QUIETO_MS = 150;
/**
 * Delta acumulado dentro de una ráfaga para que cuente como intención
 * (el `thresholdDelta` de Swiper). Un clic de rueda en Chrome ronda los 100-120
 * px, así que 40 dispara a la primera con el ratón y filtra el roce accidental
 * del trackpad.
 */
const GESTO_DELTA = 40;
/** Quietud tras terminar un paso antes de aceptar el siguiente. */
const DESCANSO_MS = 150;

/**
 * VELOCIDAD DEL PLANEO. Tres peticiones seguidas de "más despacio":
 *
 *     V18.74  0,55 ms/px · suelo 700     →  898 / 1005 / 1153 /  700 ms
 *     V18.75  0,90 ms/px · suelo 1100    → 1470 / 1644 / 1887 / 1100 ms
 *     V18.76  1,35 ms/px · suelo 1600    → 2205 / 2466 / 2831 / 1600 ms
 *     V18.77  1,90 ms/px · suelo 2200    → 3103 / 3471 / 3984 / 2200 ms
 *     V18.80  1,20 ms/px · suelo 1500    → 1960 / 2192 / 2516 / 1500 ms
 *     V18.81  1,00 ms/px · suelo 1200    → 1633 / 1827 / 2097 / 1200 ms
 *
 * (Los cuatro números de cada fila son los cuatro saltos del tramo con la
 * geometría actual: 1633, 1827, 2097 y 349 píxeles.)
 *
 * Ir despacio aquí no es solo cuestión de gusto: las animaciones de estas
 * secciones van con `scrub`, o sea con medio segundo largo de retardo respecto
 * al scroll. Cuanto más dura el planeo, más cerca va la animación de la
 * posición real y más completa se ve al llegar.
 *
 * V18.81 DEJA DE MOVER ESTE NÚMERO A CIEGAS. Las cuatro versiones anteriores lo
 * subían o bajaban porque el tramo se sentía lento o rápido, pero lo que hacía
 * que se sintiera mal no era la duración: era que un solo gesto disparaba
 * varios pasos (ver el bloque de GESTO_* abajo). Con eso arreglado, el ritmo lo
 * marca "un gesto, una sección" y la duración vuelve a ser lo que dice ser.
 * Queda en 1,0 ms/px, que es el punto medio del rango que se ha ido acotando a
 * base de pruebas, y con referencia: fullPage.js usa 700 ms por sección y estos
 * saltos son de dos a seis pantallas reproduciendo una animación con scrub, así
 * que el doble largo está justificado.
 *
 * El tope de arriba no llega a tocarse: el salto más largo son 2097 píxeles.
 * Está solo para que, si algún pin crece, la transición no se vuelva eterna.
 */
const DUR_MIN = 1200;
const DUR_MAX = 2600;
/** Milisegundos de planeo por píxel recorrido, entre los dos topes. */
const MS_POR_PX = 1.0;

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
     * Cierra la ráfaga en curso. Se llama al TERMINAR un planeo, y es lo que
     * hace que convivan los dos casos que se pisan entre sí:
     *
     *  · La COLA DE INERCIA de un toque llega durante la transición, se
     *    descarta, y para cuando esto la borra ya se ha extinguido: no puede
     *    estrenar un gesto y llevarse la sección siguiente.
     *  · Un scroll SOSTENIDO (el dedo sin levantar) también se descarta
     *    durante la transición, pero al reiniciarse aquí vuelve a acumular
     *    enseguida y avanza otra sección. Es el mismo comportamiento que
     *    fullPage.js: una sección por ciclo de animación mientras se empuje.
     */
    let reiniciarGesto = () => {};

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
      const dur = Math.min(DUR_MAX, Math.max(DUR_MIN, Math.abs(delta) * MS_POR_PX));
      const t0 = performance.now();
      planeando = true;


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
          ultimoPaso = performance.now();
          reiniciarGesto();
          publicar();
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

    /**
     * SEGMENTACIÓN DE LA RÁFAGA EN GESTOS. Aquí está el arreglo de fondo.
     *
     * `acumulado` suma los deltas de la ráfaga en curso y `ultimoEvento` marca
     * cuándo llegó el último. Si entre dos eventos pasan más de
     * `GESTO_QUIETO_MS`, la ráfaga anterior se da por terminada y empieza una
     * nueva — es el vaciado del buffer de fullPage.js. Dentro de una misma
     * ráfaga solo se avanza UNA vez, por mucho delta que siga llegando: es lo
     * que impide que la cola de inercia de un trackpad, que puede entregar
     * decenas de eventos después de levantar el dedo, se lleve por delante
     * todas las secciones.
     */
    let acumulado = 0;
    let ultimoEvento = 0;
    let gestoYaUsado = false;

    /**
     * Decide si este evento es el comienzo de una intención nueva.
     *
     * Devuelve el sentido solo UNA vez por ráfaga; el resto de eventos de esa
     * misma ráfaga devuelven 0 aunque crucen el umbral.
     */
    const sentidoDelGesto = (dy: number): 0 | 1 | -1 => {
      const ahora = performance.now();
      // Silencio suficiente, o cambio de sentido: ráfaga nueva.
      if (ahora - ultimoEvento > GESTO_QUIETO_MS || Math.sign(dy) !== Math.sign(acumulado)) {
        acumulado = 0;
        gestoYaUsado = false;
      }
      ultimoEvento = ahora;
      acumulado += dy;
      if (gestoYaUsado) return 0;
      if (Math.abs(acumulado) < GESTO_DELTA) return 0;
      // OJO: NO se marca aquí como usado. Se consume en el sitio que de verdad
      // da el paso, porque entre esto y allí todavía puede rechazarse (bloqueo
      // del planeo, descanso). Marcarlo aquí quemaba el gesto sin avanzar, y
      // dejaba un scroll SOSTENIDO clavado para siempre tras la primera
      // sección: lo detectó la simulación de ráfagas, no se dedujo leyendo.
      return acumulado > 0 ? 1 : -1;
    };

    reiniciarGesto = () => {
      acumulado = 0;
      gestoYaUsado = false;
    };

    const onWheel = (ev: WheelEvent) => {
      const dy = ev.deltaY;
      if (!mandaPasoAPaso(dy)) return;
      // Se impide el scroll nativo SIEMPRE que el tramo manda, también mientras
      // se plana: si no, el navegador seguiría moviendo la página por debajo del
      // planeo y las dos escrituras se pelearían. Lenis ya se aparta por su
      // lado (ver `virtualScroll` en SmoothScroll).
      ev.preventDefault();

      // El delta se contabiliza SIEMPRE, también durante el planeo. Es
      // deliberado: así la ráfaga que provocó este paso sigue considerándose la
      // misma mientras dura la transición, y su cola de inercia no puede
      // estrenar un gesto nuevo al terminar.
      const sentido = sentidoDelGesto(dy);

      // BLOQUEO DURO MIENTRAS SE PLANEA, como el `isAnimating` de fullPage.js:
      // lo que llegue durante la transición se DESCARTA. Ni se encola ni
      // acelera nada — encolar fue lo que convirtió una ráfaga en cuatro pasos.
      if (planeando) return;
      if (!sentido) return;
      if (performance.now() - ultimoPaso < DESCANSO_MS) return;
      gestoYaUsado = true;
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
      // Una tecla ya es un gesto discreto, así que no hace falta segmentar
      // nada; basta con ignorar la repetición automática al mantenerla pulsada
      // y respetar el mismo bloqueo que la rueda.
      if (ev.repeat || planeando) return;
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
