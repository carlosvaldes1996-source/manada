"use client";

import * as React from "react";
import { Check, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CouponProps {
  /** Valida el código y devuelve un mensaje de error o null si es válido. */
  onApply: (code: string) => Promise<string | null> | string | null;
  appliedCode?: string;
  onRemove?: () => void;
  className?: string;
}

/**
 * Campo de cupón/código de descuento. Estados: vacío, aplicando (loading),
 * aplicado (verde) y error. La validación real la inyecta el padre.
 */
export function Coupon({ onApply, appliedCode, onRemove, className }: CouponProps) {
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (appliedCode) {
    return (
      <div className={cn("flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-success-soft px-3.5 py-2.5 text-sm", className)}>
        <span className="inline-flex items-center gap-2 font-semibold text-success-strong">
          <Check className="size-4" aria-hidden />
          Cupón {appliedCode} aplicado
        </span>
        <button type="button" onClick={onRemove} aria-label="Quitar cupón" className="text-success-strong hover:opacity-70">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    const result = await onApply(code.trim());
    setError(result);
    setLoading(false);
  }

  return (
    <form onSubmit={apply} className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex gap-2">
        <div className="relative flex flex-1 items-center">
          <Tag className="pointer-events-none absolute left-3 size-4 text-text-muted" aria-hidden />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Código de descuento"
            aria-label="Código de descuento"
            aria-invalid={error ? true : undefined}
            className="h-11 w-full rounded-[var(--radius-md)] border border-border-default bg-surface pr-3 pl-9 text-[15px] uppercase placeholder:normal-case placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-terracota-100 aria-[invalid=true]:border-[var(--error)]"
          />
        </div>
        <Button type="submit" variant="secondary" loading={loading} disabled={!code.trim()}>
          Aplicar
        </Button>
      </div>
      {error && <p role="alert" className="text-[13px] font-medium text-error-strong">{error}</p>}
    </form>
  );
}
