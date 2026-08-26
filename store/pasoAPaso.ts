/**
 * ESTADO COMPARTIDO DEL MODO "PASO A PASO" (diapositivas en el tramo inicial).
 *
 * Deliberadamente NO es zustand, igual que `nearSections`: esto se consulta
 * dentro del manejador de scroll de Lenis, o sea en cada evento de rueda, y
 * tiene que costar una lectura de propiedad y nada más.
 *
 * Existe porque hay TRES piezas que necesitan ponerse de acuerdo sobre quién se
 * queda un gesto de rueda, y las tres viven en árboles distintos:
 *   · PasoAPaso        — lo consume: si le toca, se lleva el gesto.
 *   · SmoothScroll     — tiene que hacer que Lenis lo IGNORE, o los dos
 *                        moverían el scroll a la vez.
 *   · ScrollSnap       — tiene que apartarse: su asentamiento por proximidad
 *                        pelearía contra el destino del paso.
 *
 * La clave para que no dependa del orden en que se registren los listeners es
 * que las tres evalúan LA MISMA función pura sobre el estado, en vez de que una
 * levante una bandera que las otras leen después.
 */
export const pasoAPaso = {
  /** Hay etapas montadas (home, escritorio, sin movimiento reducido). */
  disponible: false,
  /** Posición de documento de la ÚLTIMA etapa. A partir de ahí, scroll normal. */
  fin: 0,
};

/**
 * ¿Le toca al paso a paso quedarse este gesto?
 *
 * Depende del SENTIDO, y por eso recibe el delta:
 *  · Bajando manda mientras quede etapa por delante. Justo en la última suelta
 *    el gesto, que es lo que deja entrar a Servicios con su propio ritmo en vez
 *    de quedarse atrapado en el tramo.
 *  · Subiendo manda en todo el tramo salvo arriba del todo, donde ya no hay
 *    etapa anterior a la que ir. El margen superior deja además que el gesto
 *    llegue al navegador para su "tirar para recargar".
 *
 * `deltaY > 0` es avanzar por la página, en el convenio de Lenis.
 */
export function mandaPasoAPaso(deltaY: number): boolean {
  if (!pasoAPaso.disponible) return false;
  const y = window.scrollY;
  if (deltaY > 0) return y < pasoAPaso.fin - 2;
  return y > 2 && y <= pasoAPaso.fin + 2;
}
