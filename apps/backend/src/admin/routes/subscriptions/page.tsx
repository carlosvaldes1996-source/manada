import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CurrencyDollar } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  DataTable,
  DataTablePaginationState,
  Heading,
  StatusBadge,
  Text,
  createDataTableColumnHelper,
  toast,
  usePrompt,
  useDataTable,
} from "@medusajs/ui";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { sdk } from "../../lib/sdk";

/**
 * Sección "Suscripciones" del Backoffice (D59) — el panel operativo del cobro
 * recurrente. Existe porque el 2º cobro se dispara A MANO en el MVP: el barrido
 * automático está apagado (`SUBSCRIPTION_CHARGES_ENABLED`), así que el operador
 * necesita ver a quién le va a cobrar, cuánto y con qué tarjeta ANTES de apretar.
 *
 * El botón "Cobrar ahora" llama a `POST /admin/subscriptions/:id/charge`, que pasa
 * por el MISMO motor y el MISMO lock que usaría el scheduler. No hay una segunda vía
 * de cobro: dos clics o un cron solapado no pueden cobrar dos veces el mismo período.
 *
 * Solo se habilita cuando la fila es cobrable de verdad (vencida + estado que admite
 * cobro + tarjeta tokenizada). Las suscripciones legadas sin tarjeta quedan
 * explícitamente marcadas, en vez de fallar recién al intentar el cobro.
 */

type SubscriptionRow = {
  id: string;
  status: string;
  product_title: string;
  quantity: number;
  frequency_weeks: number;
  next_delivery_date: string;
  amount: number;
  currency_code: string;
  customer: { id: string; email: string; name: string | null } | null;
  card: { brand: string; last4: string } | null;
  is_due: boolean;
  chargeable: boolean;
  last_charged_at: string | null;
  failed_charge_count: number;
  last_charge_error: string | null;
  next_charge_attempt_at: string | null;
  created_at: string;
};

type SubscriptionsResponse = {
  subscriptions: SubscriptionRow[];
  count: number;
  limit: number;
  offset: number;
  due_total: number;
};

type ChargeResponse = {
  subscription_id: string;
  outcome: string;
  order_id: string | null;
  message: string | null;
};

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
  past_due: "Cobro pendiente",
  unpaid: "Impaga",
};

const STATUS_COLOR: Record<string, "green" | "orange" | "red" | "grey"> = {
  active: "green",
  paused: "grey",
  cancelled: "grey",
  past_due: "orange",
  unpaid: "red",
};

/** Desenlaces del motor de cobro → mensaje para el operador (no traducir a booleano). */
const OUTCOME_MESSAGE: Record<string, { title: string; description: string; ok: boolean }> = {
  renewed: { title: "Cobrado", description: "Se cobró la renovación y se creó la orden.", ok: true },
  recovered: {
    title: "Cobrado (recuperado)",
    description: "El cobro ya existía en Flow; se creó la orden sin volver a cobrar.",
    ok: true,
  },
  order_resumed: {
    title: "Orden creada",
    description: "El período ya estaba pagado; solo faltaba la orden.",
    ok: true,
  },
  already_done: {
    title: "Sin cambios",
    description: "Este período ya estaba cobrado y con su orden creada.",
    ok: true,
  },
  failed: {
    title: "Cobro rechazado",
    description: "Flow rechazó el cobro. La suscripción entra en reintento (past_due).",
    ok: false,
  },
  paid_order_pending: {
    title: "Cobrado, orden pendiente",
    description: "Se cobró pero la orden falló. Se reintentará sin volver a cobrar.",
    ok: false,
  },
  skipped: {
    title: "Omitida",
    description: "El estado cambió o faltan datos; no se cobró.",
    ok: false,
  },
};

const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

const columnHelper = createDataTableColumnHelper<SubscriptionRow>();

const SubscriptionsPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const queryClient = useQueryClient();
  const prompt = usePrompt();

  const offset = pagination.pageIndex * pagination.pageSize;

  const { data, isLoading } = useQuery({
    queryKey: ["manada-subscriptions", offset, pagination.pageSize],
    queryFn: () =>
      sdk.client.fetch<SubscriptionsResponse>("/admin/subscriptions", {
        query: { limit: pagination.pageSize, offset },
      }),
    placeholderData: keepPreviousData,
  });

  const { mutateAsync: charge, isPending } = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch<ChargeResponse>(`/admin/subscriptions/${id}/charge`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["manada-subscriptions"] }),
  });

  /**
   * Confirmación explícita antes de mover dinero: el operador ve cliente, monto y
   * tarjeta en el diálogo. Es la última barrera humana contra cobrarle a quien no
   * corresponde; las barreras técnicas (estado, tarjeta, vencimiento) ya corrieron
   * en el backend y se reflejan en `chargeable`.
   */
  async function handleCharge(row: SubscriptionRow) {
    const who = row.customer?.name || row.customer?.email || "este cliente";
    const card = row.card ? `${row.card.brand} ••••${row.card.last4}` : "sin tarjeta";
    const confirmed = await prompt({
      title: "Cobrar esta suscripción",
      description:
        `Se cobrará ${CLP.format(row.amount)} a ${who} con su tarjeta guardada (${card}) ` +
        `por ${row.quantity}× ${row.product_title}. Si el cobro resulta, se crea la orden y se ` +
        `avanza la próxima entrega. Esta acción mueve dinero real.`,
      confirmText: `Cobrar ${CLP.format(row.amount)}`,
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const result = await charge(row.id);
      const info = OUTCOME_MESSAGE[result.outcome] ?? {
        title: result.outcome,
        description: result.message ?? "",
        ok: false,
      };
      const description = result.message ? `${info.description} (${result.message})` : info.description;
      if (info.ok) toast.success(info.title, { description });
      else toast.warning(info.title, { description });
    } catch (e) {
      toast.error("No se pudo cobrar", {
        description: e instanceof Error ? e.message : "Error inesperado.",
      });
    }
  }

  const columns = [
    columnHelper.accessor("customer", {
      header: "Cliente",
      enableSorting: false,
      cell: ({ getValue }) => {
        const customer = getValue();
        if (!customer) return <span className="text-ui-fg-muted">Sin dueño</span>;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{customer.name ?? customer.email}</span>
            {customer.name && (
              <span className="text-ui-fg-subtle text-xs">{customer.email}</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("product_title", {
      header: "Producto",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.product_title}</span>
          <span className="text-ui-fg-subtle text-xs">
            {row.original.quantity}× · cada {row.original.frequency_weeks} sem.
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      enableSorting: false,
      cell: ({ getValue, row }) => {
        const status = getValue();
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge color={STATUS_COLOR[status] ?? "grey"}>
              {STATUS_LABEL[status] ?? status}
            </StatusBadge>
            {row.original.failed_charge_count > 0 && (
              <span className="text-ui-fg-subtle text-xs">
                {row.original.failed_charge_count} intento(s) fallido(s)
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("next_delivery_date", {
      header: "Próxima entrega",
      enableSorting: false,
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2">
          <span>{formatDate(getValue())}</span>
          {row.original.is_due && (
            <Badge size="2xsmall" color="orange">
              Vencida
            </Badge>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("amount", {
      header: "Monto",
      enableSorting: false,
      cell: ({ getValue }) => <span className="tabular-nums">{CLP.format(getValue())}</span>,
    }),
    columnHelper.accessor("card", {
      header: "Tarjeta",
      enableSorting: false,
      cell: ({ getValue }) => {
        const card = getValue();
        if (!card) {
          return (
            <Badge size="2xsmall" color="red">
              Sin tarjeta
            </Badge>
          );
        }
        return (
          <span className="tabular-nums">
            {card.brand} ••••{card.last4}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "charge",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            size="small"
            variant="secondary"
            disabled={!row.original.chargeable || isPending}
            onClick={() => handleCharge(row.original)}
          >
            Cobrar ahora
          </Button>
        </div>
      ),
    }),
  ];

  const table = useDataTable({
    columns,
    data: data?.subscriptions ?? [],
    rowCount: data?.count ?? 0,
    getRowId: (row) => row.id,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
  });

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Suscripciones</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {data?.count ?? 0} en total · {data?.due_total ?? 0} vencida(s) por cobrar
          </Text>
        </div>
      </div>
      <div className="bg-ui-bg-subtle px-6 py-3">
        <Text className="text-ui-fg-subtle" size="small">
          El cobro automático está <strong>apagado</strong> mientras el volumen sea bajo: cada
          renovación se dispara desde aquí con &quot;Cobrar ahora&quot;. El botón solo se habilita
          si la suscripción está vencida, activa (o en reintento) y tiene tarjeta registrada.
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
  label: "Suscripciones",
  icon: CurrencyDollar,
});

export default SubscriptionsPage;
