import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ShoppingCart } from "@medusajs/icons";
import {
  Badge,
  Container,
  DataTable,
  DataTablePaginationState,
  Heading,
  Select,
  StatusBadge,
  Text,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { sdk } from "../../lib/sdk";

/**
 * Sección "Carritos" del Backoffice (D78) — lo que pasa ANTES de la Order.
 *
 * El Admin de Medusa v2 no trae nada parecido: sus rutas son `/orders`,
 * `/customers` y `/promotions`, así que un carrito abandonado nunca fue visible.
 * Esta pantalla lee la proyección de D75 (`GET /admin/cart-funnel`) y responde de
 * un vistazo las preguntas que antes exigían SQL: cuántos agregaron al carrito,
 * dónde se pierden, qué se está abandonando, quién es contactable y cuánto dinero
 * quedó en el camino.
 *
 * Solo lectura: no hay ninguna acción que escriba. El remarketing (escribirle al
 * cliente) es un frente aparte, gateado y todavía sin implementar.
 */

type FunnelCart = {
  id: string;
  cart_id: string;
  visitor_id: string | null;
  email: string | null;
  stage: string;
  customer: { id: string; email: string; name: string | null } | null;
  items: { title: string; quantity: number }[];
  items_count: number;
  units_count: number;
  total: number;
  has_subscription: boolean;
  promo_codes: string[] | null;
  order_display_id: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
  device_type: string | null;
  pet_species: string | null;
  pet_stage: string | null;
  payment_attempts: number;
  last_payment_status: string | null;
  last_activity_at: string;
  activated_at: string | null;
  alive_minutes: number;
  idle_minutes: number;
  is_abandoned: boolean;
};

type FunnelResponse = {
  carts: FunnelCart[];
  count: number;
  limit: number;
  offset: number;
  summary: {
    by_stage: Record<string, number>;
    total: number;
    converted: number;
    conversion_rate: number;
    abandoned_hours: number;
  };
};

const PAGE_SIZE = 20;

/** Etapas en orden de progreso — el mismo eje monótono del modelo. */
const STAGES = ["active", "identified", "checkout_started", "payment_pending", "paid"] as const;

const STAGE_LABEL: Record<string, string> = {
  active: "En el carrito",
  identified: "Llegó al checkout",
  checkout_started: "Eligió despacho",
  payment_pending: "Llegó a pagar",
  paid: "Compró",
};

const STAGE_HINT: Record<string, string> = {
  active: "Agregó productos y no dejó su correo",
  identified: "Dejó su correo en el checkout",
  checkout_started: "Eligió método de despacho",
  payment_pending: "Llegó a la pasarela de pago",
  paid: "Pagó y se creó la orden",
};

const STAGE_COLOR: Record<string, "green" | "orange" | "blue" | "grey" | "red"> = {
  active: "grey",
  identified: "blue",
  checkout_started: "blue",
  payment_pending: "orange",
  paid: "green",
};

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

/** Duración legible: el operador piensa en "hace 3 h", no en 187 minutos. */
function humanMinutes(minutes: number): string {
  if (minutes < 1) return "recién";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

const columnHelper = createDataTableColumnHelper<FunnelCart>();

const CartFunnelPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [stage, setStage] = useState<string>("all");
  const [abandonedOnly, setAbandonedOnly] = useState<string>("all");

  const offset = pagination.pageIndex * pagination.pageSize;

  const { data, isLoading } = useQuery({
    queryKey: ["manada-cart-funnel", offset, pagination.pageSize, stage, abandonedOnly],
    queryFn: () =>
      sdk.client.fetch<FunnelResponse>("/admin/cart-funnel", {
        query: {
          limit: pagination.pageSize,
          offset,
          ...(stage !== "all" ? { stage } : {}),
          ...(abandonedOnly !== "all" ? { abandoned: "true", abandoned_hours: abandonedOnly } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });

  const summary = data?.summary;

  const columns = [
    columnHelper.accessor("customer", {
      header: "Quién",
      enableSorting: false,
      cell: ({ row }) => {
        const { customer, email, visitor_id } = row.original;
        // Tres identidades posibles, y la tercera es la que antes de D75 no existía.
        if (customer) {
          return (
            <div className="flex flex-col">
              <span className="font-medium">{customer.name ?? customer.email}</span>
              <span className="text-ui-fg-subtle text-xs">Cliente con cuenta</span>
            </div>
          );
        }
        if (email) {
          return (
            <div className="flex flex-col">
              <span className="font-medium">{email}</span>
              <span className="text-ui-fg-subtle text-xs">Invitado · contactable</span>
            </div>
          );
        }
        return (
          <div className="flex flex-col">
            <span className="text-ui-fg-muted">Invitado anónimo</span>
            <span className="text-ui-fg-subtle text-xs">
              {visitor_id ? `visitante ${visitor_id.slice(0, 8)}` : "sin identificar"}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("items", {
      header: "Qué llevaba",
      enableSorting: false,
      cell: ({ row }) => {
        const { items, items_count, units_count } = row.original;
        if (items.length === 0) {
          return <span className="text-ui-fg-muted">Carrito vacío ahora</span>;
        }
        const shown = items.slice(0, 2);
        const rest = items.length - shown.length;
        return (
          <div className="flex flex-col">
            {shown.map((i, idx) => (
              <span key={idx} className="text-xs">
                {i.quantity}× {i.title}
              </span>
            ))}
            {rest > 0 && <span className="text-ui-fg-subtle text-xs">+{rest} más</span>}
            <span className="text-ui-fg-subtle text-xs">
              {items_count} línea(s) · {units_count} unidad(es)
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("total", {
      header: "Valor",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="tabular-nums">{CLP.format(row.original.total)}</span>
          {row.original.has_subscription && (
            <Badge size="2xsmall" color="purple">
              Suscripción
            </Badge>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("stage", {
      header: "Hasta dónde llegó",
      enableSorting: false,
      cell: ({ row }) => {
        const { stage: s, order_display_id, payment_attempts, last_payment_status } = row.original;
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge color={STAGE_COLOR[s] ?? "grey"}>{STAGE_LABEL[s] ?? s}</StatusBadge>
            {order_display_id && (
              <span className="text-ui-fg-subtle text-xs">Orden #{order_display_id}</span>
            )}
            {/* Eje de desenlace, separado del de progreso a propósito. */}
            {payment_attempts > 1 && (
              <span className="text-ui-fg-subtle text-xs">
                {payment_attempts} intentos de pago
              </span>
            )}
            {last_payment_status && last_payment_status !== "paid" && s !== "paid" && (
              <Badge size="2xsmall" color="red">
                pago {last_payment_status}
              </Badge>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("last_activity_at", {
      header: "Actividad",
      enableSorting: false,
      cell: ({ row }) => {
        const { alive_minutes, idle_minutes, is_abandoned, stage: s } = row.original;
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs">Duró {humanMinutes(alive_minutes)}</span>
            <span className="text-ui-fg-subtle text-xs">
              Último movimiento hace {humanMinutes(idle_minutes)}
            </span>
            {is_abandoned && s !== "paid" && (
              <Badge size="2xsmall" color="orange">
                Abandonado
              </Badge>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("utm_source", {
      header: "De dónde vino",
      enableSorting: false,
      cell: ({ row }) => {
        const { utm_source, utm_campaign, device_type, pet_species } = row.original;
        if (!utm_source && !device_type && !pet_species) {
          return <span className="text-ui-fg-muted text-xs">—</span>;
        }
        return (
          <div className="flex flex-col">
            {utm_source && (
              <span className="text-xs">
                {utm_source}
                {utm_campaign ? ` · ${utm_campaign}` : ""}
              </span>
            )}
            <span className="text-ui-fg-subtle text-xs">
              {[device_type, pet_species].filter(Boolean).join(" · ") || "—"}
            </span>
          </div>
        );
      },
    }),
  ];

  const table = useDataTable({
    columns,
    data: data?.carts ?? [],
    rowCount: data?.count ?? 0,
    getRowId: (row) => row.id,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
  });

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Carritos</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {summary?.total ?? 0} carritos con productos · {summary?.converted ?? 0} compraron ·{" "}
            {summary?.conversion_rate ?? 0}% de conversión
          </Text>
        </div>
      </div>

      {/* El embudo de un vistazo: dónde se pierde la gente, en orden de progreso. */}
      <div className="grid grid-cols-2 gap-px bg-ui-border-base md:grid-cols-5">
        {STAGES.map((s) => (
          <div key={s} className="bg-ui-bg-base px-4 py-3">
            <Text size="small" className="text-ui-fg-subtle">
              {STAGE_LABEL[s]}
            </Text>
            <Heading level="h3" className="tabular-nums">
              {summary?.by_stage?.[s] ?? 0}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              {STAGE_HINT[s]}
            </Text>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-6 py-3">
        <div className="w-[220px]">
          <Select
            value={stage}
            onValueChange={(v) => {
              setStage(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Etapa" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Todas las etapas</Select.Item>
              {STAGES.map((s) => (
                <Select.Item key={s} value={s}>
                  {STAGE_LABEL[s]}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="w-[240px]">
          <Select
            value={abandonedOnly}
            onValueChange={(v) => {
              setAbandonedOnly(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Abandono" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Todos los carritos</Select.Item>
              <Select.Item value="1">Abandonados hace +1 h</Select.Item>
              <Select.Item value="24">Abandonados hace +24 h</Select.Item>
              <Select.Item value="72">Abandonados hace +72 h</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

      <div className="bg-ui-bg-subtle px-6 py-3">
        <Text className="text-ui-fg-subtle" size="small">
          Medusa no muestra carritos: esta vista existe para ver lo que pasa{" "}
          <strong>antes</strong> de que haya una orden. Un carrito nace cuando alguien agrega su
          primer producto y se considera <strong>abandonado</strong> si no tuvo movimiento en la
          ventana elegida — no es un estado guardado, se calcula al consultar.
        </Text>
      </div>

      <DataTable instance={table}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Carritos",
  icon: ShoppingCart,
});

export default CartFunnelPage;
