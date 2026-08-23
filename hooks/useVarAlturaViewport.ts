"use client";

import { useEffect, useLayoutEffect } from "react";
import { alturaViewportEstable } from "@/lib/alturaViewport";

/**
 * EFECTO DE LAYOUT, Y ESTO ES LO IMPORTANTE DE ESTE ARCHIVO.
 *
 * La variable tiene que estar escrita ANTES de que ScrollTrigger cree el pin
 * del hero, porque al pinear un elemento le fija su alto medido en un estilo
 * inline. Si el pin se crea primero, congela el alto que el escenario tenía con
 * el valor de RESERVA del CSS (`100vh`, la ventana grande) en vez del que le
 * corresponde.
 *
 * Ese desfase ES el fallo de "la primera vez que cargo la home sale bien, pero
 * si voy a otra página y vuelvo sale más arriba": en la primera carga el pin se
 * fijaba contra `100vh` y al volver —con la variable ya escrita de la visita
 * anterior— se fijaba contra la medición real, que en móvil es más corta por
 * toda la barra del navegador. El escenario quedaba más bajo de alto, y lo que
 * va centrado dentro subía.
 *
 * `useGSAP` corre en un efecto de LAYOUT, así que un `useEffect` normal aquí
 * llegaba siempre tarde. Con `useLayoutEffect` y la llamada declarada por
 * encima de `useGSAP` en el componente, el orden queda garantizado.
 */
const useEfectoLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Publica el alto de viewport estable en una custom property del <html>, para
 * que el CSS dimensione escenarios sin depender de `100lvh` (ver el porqué en
 * lib/alturaViewport.ts).
 *
 * Escucha `resize` a pesar de que el valor casi nunca cambia: es la única
 * señal que existe para enterarse de un giro de pantalla. Quien decide si algo
 * cambia es `alturaViewportEstable`, que compara el ANCHO — un resize por barra
 * del navegador entra aquí y sale sin haber tocado nada.
 *
 * NO retira la propiedad al desmontar, a propósito. Retirarla dejaba un frame
 * con el valor de reserva del CSS entre que una ruta se va y la siguiente la
 * vuelve a escribir, y eso es exactamente un salto visible. Ahora el valor es
 * el mismo en todas las rutas y para todo el ancho, así que dejarlo puesto no
 * puede desincronizar nada: lo peor que pasa es que una variable siga
 * declarada con el número correcto.
 */
export function useVarAlturaViewport(nombre: string) {
  useEfectoLayout(() => {
    const raiz = document.documentElement;
    const set = () => raiz.style.setProperty(nombre, `${alturaViewportEstable()}px`);
    set();
    window.addEventListener("resize", set, { passive: true });
    window.addEventListener("orientationchange", set);
    return () => {
      window.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
    };
  }, [nombre]);
}
