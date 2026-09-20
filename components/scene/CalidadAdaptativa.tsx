"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * MIDE SI EL DISPOSITIVO LLEGA, Y AVISA CUANDO NO.
 * =================================================
 * El problema que resuelve, dicho por Álvaro: "necesita un hardware potente
 * para ir bien, a nada que le falta potencia va lentísima".
 *
 * Y es exactamente lo que pasaba, porque la escena pedía un presupuesto FIJO
 * de relleno de GPU, el mismo en un portátil con gráfica integrada que en una
 * máquina de sobra. Por frame completo se rellenan ~2,6 VECES la pantalla:
 *
 *     muro de vídeo a pantalla completa ....... 1,00x   (y con un shader caro:
 *                                                       ruido, 8 smoothsteps,
 *                                                       grano y split RGB por
 *                                                       píxel)
 *     bloom (pirámide de mipmaps a 0,5) ....... 1,50x   <- el más caro
 *     captura de transmisión del cristal ...... 0,12x   (+ una escena entera
 *                                                       extra de draw calls)
 *
 * En una pantalla de 1080p a dpr 1,25 eso son ~8,5 millones de píxeles de
 * fragmento por frame; a 60fps, más de 500 millones por segundo. Una gráfica
 * dedicada lo absorbe sin enterarse y una integrada no, y de ahí que la misma
 * web fuera fluida o injugable según la máquina.
 *
 * LA SOLUCIÓN NO ES BAJAR LA CALIDAD PARA TODOS —eso penaliza a quien sí tiene
 * máquina— sino medir y adaptarse. Este componente vive dentro del canvas, mira
 * cuánto tarda cada frame de verdad y, si el dispositivo no llega, pide bajar
 * un escalón. En una máquina capaz nunca baja de nivel 0 y no cambia
 * absolutamente nada respecto a antes.
 *
 * DETALLES QUE HACEN QUE LA MEDIDA SEA FIABLE:
 *
 *  · SOLO MIDE CON EL BUCLE EN "always". En modo "demand" el canvas se dibuja
 *    al ritmo del vídeo (~30fps) A PROPÓSITO, así que medir ahí daría 33ms por
 *    frame y parecería que todo dispositivo va mal. `activo` lo gobierna.
 *  · MEDIANA, no media. Un pico suelto de recolección de basura o un parón de
 *    decodificación de vídeo dispara la media y no dice nada del dispositivo;
 *    la mediana de una ventana de 90 frames describe cómo va de verdad.
 *  · DOS VENTANAS MALAS SEGUIDAS antes de bajar. Son ~3 segundos sostenidos, lo
 *    que evita degradar la escena por un tropiezo puntual — por ejemplo al
 *    cruzar la Intro, que tiene su propio coste de hilo principal.
 *  · PERIODO DE GRACIA tras cada cambio de nivel: al quitar el bloom o cambiar
 *    el dpr se recompilan shaders y se reasignan búferes, y esos frames son
 *    lentos por el cambio, no por el dispositivo. Medirlos encadenaría bajadas.
 *
 * SOLO BAJA, NUNCA SUBE. Es deliberado: un dispositivo que no ha llegado no va
 * a llegar diez segundos después, y un sistema que sube y baja produce
 * exactamente el parpadeo de calidad que más se nota. Al recargar se vuelve a
 * empezar desde el nivel 0, así que tampoco se queda "castigado" para siempre.
 */

/** Frames por ventana de medida. A 60fps son ~1,5 s. */
const VENTANA = 90;
/** Por encima de esto la ventana se da por mala (~50fps). */
const MS_MALO = 20;
/** Ventanas malas seguidas que hacen falta para bajar un escalón. */
const VENTANAS_MALAS = 2;
/** Frames que se descartan tras montar o tras cambiar de nivel. */
const GRACIA = 45;

export default function CalidadAdaptativa({
  activo,
  nivel,
  onBajar,
}: {
  /** True solo mientras el bucle corre en "always" (ver arriba). */
  activo: boolean;
  /** Nivel vigente: se usa para reiniciar la medida cuando cambia. */
  nivel: number;
  onBajar: () => void;
}) {
  const ultimo = useRef(0);
  const muestras = useRef<number[]>([]);
  const malas = useRef(0);
  const gracia = useRef(GRACIA);
  const nivelVisto = useRef(nivel);

  useFrame(() => {
    // Cambio de nivel: se tira la ventana a medias y se vuelve a dar gracia.
    if (nivelVisto.current !== nivel) {
      nivelVisto.current = nivel;
      muestras.current.length = 0;
      malas.current = 0;
      gracia.current = GRACIA;
      ultimo.current = 0;
      return;
    }

    if (!activo) {
      // Al salir de "always" se descarta lo acumulado: la ventana mezclaría
      // frames de dos regímenes distintos y no significaría nada.
      muestras.current.length = 0;
      ultimo.current = 0;
      return;
    }

    const ahora = performance.now();
    const anterior = ultimo.current;
    ultimo.current = ahora;
    if (!anterior) return;

    if (gracia.current > 0) {
      gracia.current--;
      return;
    }

    muestras.current.push(ahora - anterior);
    if (muestras.current.length < VENTANA) return;

    const ordenadas = muestras.current.slice().sort((a, b) => a - b);
    const mediana = ordenadas[ordenadas.length >> 1];
    muestras.current.length = 0;

    if (mediana > MS_MALO) {
      malas.current++;
      if (malas.current >= VENTANAS_MALAS) {
        malas.current = 0;
        onBajar();
      }
    } else {
      // Una ventana buena borra el historial: solo baja quien va mal de forma
      // sostenida, no quien tuvo dos tropiezos separados en el tiempo.
      malas.current = 0;
    }
  });

  return null;
}
