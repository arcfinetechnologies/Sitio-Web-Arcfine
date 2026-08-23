/**
 * ALTURA DE VIEWPORT ESTABLE — un solo número, y que no se mueva.
 * ==============================================================
 * Varios heros dimensionan su escenario desde JavaScript en vez de con
 * unidades CSS, porque Chrome y Safari no se ponen de acuerdo en cuánto mide
 * `100lvh` en móvil y eso desplazaba visiblemente el contenido entre los dos
 * navegadores (ver la nota de --dwh-vh en DesarrolloWebHero). Una medición
 * real de JS resuelve eso; el problema es CUÁNDO se mide.
 *
 * QUÉ ESTABA MAL. Cada hero leía `window.innerHeight` y lo volvía a leer en
 * cada `resize`. Pero en móvil el `resize` no significa "ha cambiado la
 * ventana": significa, casi siempre, que la barra del navegador se ha ocultado
 * o se ha vuelto a mostrar al scrollear. Así que el escenario cambiaba de alto
 * a mitad de scroll y todo lo que iba centrado dentro se movía — "hay textos
 * que se mueven según si la navegación inferior del navegador se oculta o
 * muestra". Y como el valor dependía del estado de la barra en el instante del
 * montaje, volver a la home desde otra página podía dar un número distinto al
 * de la primera carga y la hero aparecía a otra altura.
 *
 * QUÉ HACE ESTO. El valor se fija UNA vez por ancho de ventana y no se vuelve a
 * tocar: mientras el ancho no cambie —es decir, mientras no se gire el
 * teléfono— la altura es la misma pase lo que pase con la barra. Y como el
 * estado vive en el módulo, sobrevive a los cambios de ruta: la home mide lo
 * mismo la primera vez que se carga que al volver a ella.
 *
 * SE MIDE `100svh`, LA VENTANA PEQUEÑA (la de la barra desplegada), y es
 * deliberado: es el peor caso, así que el contenido centrado contra ella cabe
 * entero SIEMPRE, con la barra puesta o quitada. Contra `100lvh` pasaría lo
 * contrario —quedaría parte por debajo de la barra cuando esta aparece— y
 * además es justo la unidad en la que los dos navegadores discrepan. `svh` ya
 * se usaba con este mismo criterio para el bloque de las frases de maestría.
 *
 * El elemento de sonda se mide y se destruye en la misma llamada, y solo se
 * vuelve a crear al girar el dispositivo.
 */
let anchoRef = -1;
let alturaRef = 0;

function medirSvh(): number {
  const sonda = document.createElement("div");
  sonda.style.cssText = "position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.documentElement.appendChild(sonda);
  const alto = sonda.getBoundingClientRect().height;
  sonda.remove();
  // Sin soporte de `svh` la sonda mide 0: se cae a la lectura de siempre, que
  // en ese caso es lo único que hay.
  return alto > 0 ? Math.round(alto) : window.innerHeight;
}

/**
 * Alto de viewport en píxeles, fijo mientras no cambie el ancho de la ventana.
 */
export function alturaViewportEstable(): number {
  const ancho = window.innerWidth;
  if (ancho !== anchoRef) {
    anchoRef = ancho;
    alturaRef = medirSvh();
  }
  return alturaRef;
}
