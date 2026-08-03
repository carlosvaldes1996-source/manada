"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Search, TrendingUp } from "lucide-react";
import { SearchBar, type SearchBarProps } from "@/components/ui/search-bar";
import { formatCLP } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

/**
 * Buscador con sugerencias mientras se escribe (patrón de Amazon / Mercado Libre
 * / Falabella): a partir de la segunda letra el desplegable ya muestra PRODUCTOS
 * abribles, sin pulsar Enter. Es la diferencia entre buscar y encontrar.
 *
 * Cómo se mantiene instantáneo sin castigar al backend:
 * - **debounce de 140 ms**: se pide cuando la persona deja de teclear, no por tecla.
 * - **caché de sesión**: cada consulta ya resuelta se guarda en memoria, así que
 *   borrar una letra o volver atrás es instantáneo y sin red.
 * - **`AbortController`**: al escribir de nuevo se cancela la petición anterior;
 *   una respuesta lenta nunca pisa a una más nueva (condición de carrera clásica).
 * - **`/api/buscar`** resuelve sobre el catálogo cacheado y responde < 2 KB.
 *
 * Accesibilidad: patrón ARIA combobox + listbox con `aria-activedescendant`,
 * navegable con ↑ ↓ Enter Esc — el desplegable no es solo para el mouse.
 */

const DEBOUNCE_MS = 140;
/** Bajo 2 caracteres las sugerencias son ruido (y el endpoint devuelve vacío). */
const MIN_CHARS = 2;
const RECENT_KEY = "manada:busquedas-recientes";
const MAX_RECENT = 4;

interface SuggestProduct {
  slug: string;
  name: string;
  brand: string;
  image?: string;
  price: number;
}

interface SuggestPayload {
  products: SuggestProduct[];
  terms: string[];
  total: number;
}

const EMPTY: SuggestPayload = { products: [], terms: [], total: 0 };

/** Caché por consulta, viva mientras dure la pestaña. */
const cache = new Map<string, SuggestPayload>();

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function pushRecent(query: string): void {
  try {
    const next = [query, ...readRecent().filter((q) => q !== query)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage bloqueado (modo privado): el buscador funciona igual.
  }
}

export interface SearchSuggestProps extends Omit<SearchBarProps, "onSubmit" | "value" | "defaultValue"> {
  /** Texto inicial del campo (la consulta activa en `/buscar`). */
  initialQuery?: string;
}

export function SearchSuggest({ initialQuery = "", className, ...props }: SearchSuggestProps) {
  const router = useRouter();
  const id = React.useId();
  const [value, setValue] = React.useState(initialQuery);
  const [open, setOpen] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [active, setActive] = React.useState(-1);
  // Solo sirve para volver a leer la caché cuando llega una respuesta.
  const [, onFetched] = React.useReducer((n: number) => n + 1, 0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  // El campo del header sobrevive a la navegación entre búsquedas: si la URL
  // cambia de consulta, el texto visible tiene que seguirla. Se ajusta en el
  // render (patrón oficial de React) en vez de con un efecto, que provocaría un
  // render extra con el texto viejo.
  const [syncedQuery, setSyncedQuery] = React.useState(initialQuery);
  if (syncedQuery !== initialQuery) {
    setSyncedQuery(initialQuery);
    setValue(initialQuery);
  }

  const query = value.trim();
  const key = query.length >= MIN_CHARS ? query.toLowerCase() : "";
  // La caché ES el estado: el render la lee y el efecto solo la llena. Así
  // volver a una consulta ya vista se pinta sin red y sin parpadeo.
  const data = (key && cache.get(key)) || EMPTY;

  React.useEffect(() => {
    if (!key || cache.has(key)) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(key)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        cache.set(key, (await res.json()) as SuggestPayload);
        onFetched();
      } catch {
        // Petición cancelada o red caída: el desplegable simplemente no crece.
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  // Cerrar al hacer clic fuera. Se registra solo mientras está abierto.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const showRecent = query.length < MIN_CHARS;
  const terms = showRecent ? recent : data.terms;
  const products = showRecent ? [] : data.products;
  // Orden de navegación con teclado: primero los términos, después los productos.
  const options = [
    ...terms.map((t) => ({ kind: "term" as const, value: t })),
    ...products.map((p) => ({ kind: "product" as const, value: p.slug })),
  ];
  const hasPanel = open && options.length > 0;

  function go(target: string) {
    setOpen(false);
    router.push(target);
  }

  function submit(raw: string) {
    const q = raw.trim();
    if (!q) return;
    pushRecent(q);
    go(`/buscar?q=${encodeURIComponent(q)}`);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return submit(value);
    if (option.kind === "term") {
      setValue(option.value);
      submit(option.value);
    } else {
      setOpen(false);
      go(`/producto/${option.value}`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(active);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    if (!hasPanel) {
      setOpen(true);
      return;
    }
    const delta = e.key === "ArrowDown" ? 1 : -1;
    // -1 = "ninguna opción activa"; el ciclo pasa por ahí para poder volver al texto.
    setActive((i) => {
      const next = i + delta;
      if (next >= options.length) return -1;
      if (next < -1) return options.length - 1;
      return next;
    });
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <SearchBar
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => {
          setRecent(readRecent());
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onSubmit={() => (active >= 0 ? choose(active) : submit(value))}
        onClear={() => {
          setValue("");
          setActive(-1);
        }}
        role="combobox"
        aria-expanded={hasPanel}
        aria-controls={`${id}-panel`}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
      />

      {hasPanel && (
        <div
          id={`${id}-panel`}
          role="listbox"
          aria-label="Sugerencias de búsqueda"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface shadow-lg"
        >
          {/* Estructura plana a propósito: dentro de un `listbox` los hijos deben
              ser `option`, así que los agrupadores van como `presentation`. */}
          {terms.length > 0 && (
            <div role="presentation" className="border-b border-border-default py-1">
              {terms.map((term, i) => (
                <button
                  key={term}
                  type="button"
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={active === i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-text-primary",
                    active === i && "bg-subtle",
                  )}
                >
                  {showRecent ? (
                    <Clock className="size-4 shrink-0 text-text-muted" aria-hidden />
                  ) : (
                    <Search className="size-4 shrink-0 text-text-muted" aria-hidden />
                  )}
                  <span className="truncate">{term}</span>
                </button>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div role="presentation" className="py-1">
              {products.map((product, i) => {
                const index = terms.length + i;
                return (
                  <Link
                    key={product.slug}
                    href={`/producto/${product.slug}`}
                    id={`${id}-opt-${index}`}
                    role="option"
                    aria-selected={active === index}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => setOpen(false)}
                    className={cn("flex items-center gap-3 px-4 py-2", active === index && "bg-subtle")}
                  >
                    <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-subtle text-xl">
                      <ProductImage image={product.image} alt={product.name} sizes="40px" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-text-secondary">{product.brand}</span>
                      <span className="block truncate text-sm font-medium text-text-primary">{product.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-text-primary">
                      {formatCLP(product.price)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {!showRecent && data.total > 0 && (
            <button
              type="button"
              onClick={() => submit(value)}
              className="flex w-full items-center gap-2 border-t border-border-default px-4 py-2.5 text-left text-sm font-semibold text-text-brand hover:bg-subtle"
            >
              <TrendingUp className="size-4 shrink-0" aria-hidden />
              Ver los {data.total} resultados para “{query}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
