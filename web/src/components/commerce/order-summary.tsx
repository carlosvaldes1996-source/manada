import { formatCLP, formatShippingCost } from "@/lib/format";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface OrderSummaryLine {
  label: string;
  value: number;
  /** Estilo de ahorro (negativo, en verde) p. ej. descuento de suscripción. */
  saving?: boolean;
}

export interface OrderSummaryProps {
  subtotal: number;
  /** Ahorros (descuentos), se muestran en verde con signo negativo. */
  savings?: number;
  /** Costo de despacho; `undefined` = "por calcular". */
  shipping?: number;
  /** Líneas adicionales (impuestos, cupón…). */
  extraLines?: OrderSummaryLine[];
  /** CTA(s) bajo el total (botón de pago, etc.). */
  children?: React.ReactNode;
  /** Texto legal/nota bajo el CTA. */
  note?: React.ReactNode;
  className?: string;
}

/**
 * Resumen de compra (carrito/checkout). Desglose honesto y siempre visible:
 * subtotal, ahorros, despacho y total. El total es la cifra más grande (price).
 */
export function OrderSummary({ subtotal, savings = 0, shipping, extraLines = [], children, note, className }: OrderSummaryProps) {
  const total = subtotal - savings + (shipping ?? 0);

  return (
    <div className={cn("flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5", className)}>
      <h2 className="heading-4 text-text-primary">Resumen</h2>
      <dl className="flex flex-col gap-2 text-sm">
        <Row label="Subtotal" value={formatCLP(subtotal)} />
        {savings > 0 && <Row label="Ahorro" value={`−${formatCLP(savings)}`} tone="success" />}
        {extraLines.map((l) => (
          <Row key={l.label} label={l.label} value={`${l.saving ? "−" : ""}${formatCLP(Math.abs(l.value))}`} tone={l.saving ? "success" : undefined} />
        ))}
        <Row
          label="Despacho"
          value={shipping == null ? "Por calcular" : formatShippingCost(shipping)}
          tone={shipping === 0 ? "success" : undefined}
        />
      </dl>
      <Separator />
      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold text-text-primary">Total</span>
        <span className="price text-2xl text-text-primary">{formatCLP(total)}</span>
      </div>
      {children && <div className="mt-1 flex flex-col gap-2">{children}</div>}
      {note && <p className="text-[13px] text-text-muted">{note}</p>}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex justify-between">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={cn("price font-medium", tone === "success" ? "text-success-strong" : "text-text-primary")}>{value}</dd>
    </div>
  );
}
