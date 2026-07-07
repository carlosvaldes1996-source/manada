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
import { listOrders, type OrderView } from "@/lib/medusa";
import { formatCLP, formatDateLong, pluralize } from "@/lib/format";
import { AccountGate } from "../account-gate";

/** Historial de pedidos reales del cliente (Fase 5 · Etapa A). */
export function OrdersView() {
  return (
    <AccountGate>
      <OrdersList />
    </AccountGate>
  );
}

function OrdersList() {
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

  return (
    <Section spacing="md">
      <Stack gap={6}>
        <Stack gap={1}>
          <span className="overline text-text-brand">Mi cuenta</span>
          <h1 className="heading-1 text-text-primary">Mis pedidos</h1>
        </Stack>

        {error && <Alert variant="error">No pudimos cargar tus pedidos. Intenta de nuevo más tarde.</Alert>}

        {!error && orders === null && (
          <Stack gap={4}>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </Stack>
        )}

        {!error && orders?.length === 0 && (
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
        )}

        {!error && orders && orders.length > 0 && (
          <Stack gap={4}>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </Stack>
        )}
      </Stack>
    </Section>
  );
}

function OrderCard({ order }: { order: OrderView }) {
  const date = order.createdAt ? formatDateLong(new Date(order.createdAt)) : "";
  const badgeVariant = order.statusLabel === "Cancelado" ? "neutral" : order.statusLabel === "Entregado" ? "success" : "brand";

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
        {order.items.map((item) => (
          <Row key={item.id} gap={3} className="min-w-0">
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-subtle text-lg" aria-hidden>
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail} alt="" className="size-full object-cover" />
              ) : (
                "📦"
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{item.title}</span>
            <span className="shrink-0 text-[13px] text-text-secondary">×{item.quantity}</span>
          </Row>
        ))}
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
