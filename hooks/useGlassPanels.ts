"use client";

import { useEffect, type RefObject } from "react";
import { useGlassPanelsRegistry } from "@/store/useGlassPanelsRegistry";
import { cristalEnDom } from "@/lib/calidadEscena";

/**
 * Registers every `selector` match inside `rootRef` as a flat volumetric
 * fluid-glass panel (rendered by components/scene/GlassPanelsLayer.tsx in the
 * global SceneCanvas). The DOM element keeps its layout/content and drops its
 * CSS glass styling — the WebGL mesh IS the glass. Corner radius is read from
 * the element's computed border-radius so mesh and layout always agree.
 *
 * Geometry dims are captured here at registration and kept fresh with a
 * ResizeObserver (fonts loading, responsive breakpoints, Contacto's form
 * changing height between steps) — the per-frame path in GlassPanelsLayer
 * only ever SCALES the mesh, it never rebuilds geometry itself.
 *
 * `deps` should include anything that remounts the matched elements (e.g. a
 * reduced-motion re-render), mirroring Servicios' anchor-registration effect.
 */
export function useGlassPanels(
  rootRef: RefObject<HTMLElement | null>,
  selector: string,
  color: string,
  deps: readonly unknown[] = []
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reg = useGlassPanelsRegistry.getState();
    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;

    // EN MÓVIL NO SE REGISTRA NINGUNA MALLA: se marca el elemento y el cristal
    // lo pinta el CSS sobre él mismo (ver .nxr-cristal-dom en globals.css y el
    // porqué completo en `cristalEnDom`). Una malla anclada a un rect del DOM
    // no puede ir sincronizada mientras el scroll táctil lo lleve el
    // navegador, y el síntoma es el texto separándose de su cristal.
    //
    // La clase se pone desde JS, y no en el markup de cada sección, por lo
    // mismo que el registro vivía aquí: quien decide qué elementos son cristal
    // es esta llamada, así que quien los marque tiene que ser ella. Al
    // desmontar se retira, para que un cambio de ruta no deje marcado un
    // elemento que la ruta siguiente reutilice.
    if (cristalEnDom()) {
      els.forEach((el) => el.classList.add("nxr-cristal-dom"));
      return () => els.forEach((el) => el.classList.remove("nxr-cristal-dom"));
    }

    const entries = els.map((el) => {
      const r = el.getBoundingClientRect();
      // Clamp to just under half the shorter side: pill-shaped anchors (the
      // hero CTA declares border-radius: 100px on a ~48px-tall button) would
      // otherwise hit the geometry builder's r == h case, where the straight
      // edge runs collapse to repeated identical points whose central-
      // difference inward normals go zero-length → degenerate bevel quads.
      const radius = Math.min(
        parseFloat(getComputedStyle(el).borderRadius) || 20,
        Math.max(2, Math.min(r.width, r.height) / 2 - 1)
      );
      // Captured ONCE for the per-frame hot path in GlassPanelsLayer: the
      // hosting section id (activity gate) and LIVE computed-style views of
      // the anchor + 3 ancestors (effective-opacity walk without per-frame
      // getComputedStyle calls).
      const sectionId = el.closest("section[id]")?.id ?? null;
      const styles: CSSStyleDeclaration[] = [];
      let node: HTMLElement | null = el;
      for (let i = 0; i < 4 && node; i++) {
        styles.push(getComputedStyle(node));
        node = node.parentElement;
      }
      const id = reg.add(
        el,
        { color, radius },
        Math.max(2, Math.round(r.width)),
        Math.max(2, Math.round(r.height)),
        sectionId,
        styles
      );
      return { el, id };
    });

    // One observer for all this section's panels. Fires once on observe with
    // the current size, then on every real size change. borderBox keeps the
    // measured size aligned with getBoundingClientRect (untransformed layout).
    const ro = new ResizeObserver((obs) => {
      for (const entry of obs) {
        const match = entries.find((e) => e.el === entry.target);
        if (!match) continue;
        const box = entry.borderBoxSize?.[0];
        const w = box ? box.inlineSize : (entry.target as HTMLElement).offsetWidth;
        const h = box ? box.blockSize : (entry.target as HTMLElement).offsetHeight;
        if (w > 2 && h > 2) {
          useGlassPanelsRegistry.getState().updateDims(match.id, Math.round(w), Math.round(h));
        }
      }
    });
    entries.forEach(({ el }) => ro.observe(el));

    return () => {
      ro.disconnect();
      entries.forEach(({ id }) => useGlassPanelsRegistry.getState().remove(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
