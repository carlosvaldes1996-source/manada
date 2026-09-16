"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

/**
 * Cuenta las navegaciones de cliente para el Pixel de Meta.
 *
 * El snippet de GTM y el tag base del Pixel disparan UNA vez, en la carga
 * inicial del documento (`All Pages - Meta` es un disparador de tipo PAGEVIEW).
 * En una app con enrutado de cliente eso deja ciego al Pixel para todo lo que
 * pasa después del aterrizaje: la PDP abierta desde el catálogo, el carrito, y
 * sobre todo `/comenzar/recomendacion`, a la que SOLO se llega por `router.push`
 * y que por lo tanto nunca generó un PageView de Meta.
 *
 * GA4 no necesita esto (la medición mejorada del tag de Google cuenta los
 * cambios de historial sola), por eso el evento se llama `virtual_page_view` y
 * no `page_view`: el nombre deja explícito en GTM que se enruta al Pixel y no a
 * GA4, donde duplicaría todas las vistas.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  // El primer montaje coincide con la carga del documento, que GTM y el Pixel
  // base YA contaron. Sin esta guarda cada aterrizaje valdría dos PageView y
  // toda métrica por sesión quedaría al doble.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
