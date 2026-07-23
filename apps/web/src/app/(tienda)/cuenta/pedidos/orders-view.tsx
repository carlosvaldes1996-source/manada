"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PetAvatar } from "@/components/pet";
import { usePet } from "@/components/providers";
import { listOrders, type OrderView } from "@/lib/medusa";
import { formatCLP, formatDateLong, pluralize } from "@/lib/format";
import { AccountGate } from "../account-gate";

/** Página de pedidos reales del cliente (Fase 5 · Etapa A). */
export function OrdersView() {
  return (
    <AccountGate>
      <Section spacing="md">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="overline text-text-brand">Mi cuenta</span>
            <h1 className="heading-1 text-text-primary">Mis pedidos</h1>
          </Stack>
          <OrdersList />
        </Stack>
      </Section>
    </AccountGate>
  );
}

/**
 * Lista de pedidos SIN cabecera propia — reutilizable: la página `/cuenta/pedidos`
 * la envuelve en su `Section` + título, y la tab "Pedidos" de `/cuenta` la monta
 * directa bajo su propio encabezado. Trae sus datos al montarse.
 */
export function OrdersList() {
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    listOrders()
      .then((list) => active && setOrders(list))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <Alert variant="error">No pudimos cargar tus pedidos. Intenta de nuevo más tarde.</Alert>;
  }

  if (orders === null) {
    return (
      <Stack gap={4}>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </Stack>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-10 text-text-muted" aria-hidden />}
        title="Aún no tienes pedidos"
        description="Cuando compres, tus pedidos aparecerán aquí para que les hagas seguimiento."
        action={
          <Button asChild>
            <Link href="/categoria/todo">Ir a la tienda</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Stack gap={4}>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </Stack>
  );
}

function OrderCard({ order }: { order: OrderView }) {
  const { pets } = usePet();
  const date = order.createdAt ? formatDateLong(new Date(order.createdAt)) : "";
  const badgeVariant = order.statusLabel === "Cancelado" ? "neutral" : order.statusLabel === "Entregado" ? "success" : "brand";

  /** Si la línea es SU alimento, el pedido lo dice con su cara (D35: match por product_id). */
  const petForItem = (productId?: string) =>
    productId ? pets.find((p) => p.currentFoodId === productId) : undefined;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface p-5">
      <Row justify="between" align="start" className="gap-3" wrap>
        <Stack gap={1}>
          <span className="text-[15px] font-semibold text-text-primary">Pedido #{order.displayId}</span>
          {date && <span className="text-[13px] text-text-secondary">{date}</span>}
        </Stack>
        <Badge variant={badgeVariant}>{order.statusLabel}</Badge>
      </Row>

      <div className="my-4 h-px bg-border-default" />

      <Stack gap={2}>
        {order.items.map((item) => {
          const pet = petForItem(item.productId);
          return (
            <Row key={item.id} gap={3} className="min-w-0">
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-subtle text-lg" aria-hidden>
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt="" className="size-full object-cover" />
                ) : (
                  "📦"
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                {item.title}
                {pet && (
                  <span className="ml-2 inline-flex items-center gap-1 align-middle text-[13px] text-text-secondary">
                    · para{" "}
                    <span aria-hidden>
                      <PetAvatar pet={pet} size="xs" />
                    </span>{" "}
                    {pet.name}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[13px] text-text-secondary">×{item.quantity}</span>
            </Row>
          );
        })}
      </Stack>

      <Row justify="between" className="mt-4">
        <span className="text-[13px] text-text-secondary">
          {order.itemCount} {pluralize(order.itemCount, "producto")}
        </span>
        <span className="price text-sm font-semibold text-text-primary">{formatCLP(order.total)}</span>
      </Row>
    </div>
  );
}
