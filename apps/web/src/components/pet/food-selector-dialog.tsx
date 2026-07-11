"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Pet, Product } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ProductImage } from "@/components/commerce/product-image";
import { usePet } from "@/components/providers";

export interface FoodSelectorDialogProps {
  pet: Pet;
  /** Catálogo real ya hidratado (el caller filtra nada: aquí se filtra por especie). */
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Búsqueda tolerante a acentos (mismo criterio que el buscador de razas, F2). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Selector de alimento del PERFIL (D39) — define qué come la mascota, separado
 * del flujo de compra: elegir aquí asigna (`assignFood` → PATCH real) y NO toca
 * el carrito. El actual se marca "Su alimento actual". Comprar y definir qué
 * come se sienten relacionados, pero no son el mismo flujo — el puente en la
 * tienda es el toast de un tap de la PDP.
 */
export function FoodSelectorDialog({ pet, products, open, onOpenChange }: FoodSelectorDialogProps) {
  const { assignFood } = usePet();
  const { toast } = useToast();
  const [query, setQuery] = useState("");

  const foods = useMemo(
    () => products.filter((p) => p.category === "alimento" && p.species.includes(pet.species)),
    [products, pet.species],
  );

  const q = normalize(query.trim());
  const results = q
    ? foods.filter((p) => normalize(`${p.brand.name} ${p.name} ${p.format ?? ""}`).includes(q))
    : foods;

  function choose(product: Product) {
    assignFood(pet.id, product.id);
    toast({
      title: `Guardamos que ${pet.name} come esto`,
      description: "Te avisaremos antes de que se le acabe.",
      variant: "success",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>El alimento de {pet.name}</DialogTitle>
          <DialogDescription>
            Cuéntanos qué come y calculamos su ración y cuándo reponer. Esto no agrega nada al
            carrito.
          </DialogDescription>
        </DialogHeader>

        {foods.length === 0 ? (
          <p className="body-m text-text-secondary">
            Aún no tenemos alimento para su especie en el catálogo.{" "}
            <Link href="/categoria/todo" className="font-semibold text-text-brand underline-offset-4 hover:underline">
              Explorar la tienda
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {foods.length > 4 && (
              <Input
                leading={<Search className="size-4" aria-hidden />}
                placeholder="Buscar por marca o nombre…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar alimento"
              />
            )}

            <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
              {results.length === 0 && (
                <p className="py-4 text-center text-sm text-text-secondary">
                  Nada calza con “{query.trim()}”.
                </p>
              )}
              {results.map((p) => {
                const isCurrent = pet.currentFoodId === p.id;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-default bg-surface p-3"
                  >
                    <span
                      className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-subtle text-2xl"
                      aria-hidden
                    >
                      <ProductImage image={p.imageUrl} alt={p.name} imgClassName="p-0.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="overline text-text-secondary">{p.brand.name}</p>
                      <p className="truncate text-sm font-semibold text-text-primary">{p.name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {p.format && <span className="text-[13px] text-text-muted">{p.format}</span>}
                        {isCurrent && <Badge variant="brand">Su alimento actual</Badge>}
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button size="sm" variant="secondary" onClick={() => choose(p)}>
                        Elegir
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
