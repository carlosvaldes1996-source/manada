"use client";

import { useEffect, useState } from "react";
import { CreditCard, ShieldCheck, Trash2 } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { listSavedCards, deleteSavedCard, type SavedCardView } from "@/lib/medusa";
import { AccountGate } from "../account-gate";

/**
 * Mis tarjetas — referencias a medios de pago guardados (API.md §10).
 *
 * Solo LISTAR y ELIMINAR, a propósito: las tarjetas nacen en el checkout de la
 * pasarela (Mercado Pago, fast-follow post-infra) — aquí nunca se tipea una
 * tarjeta (PCI). Mismo esqueleto que Direcciones: gate → skeleton → error /
 * vacío honesto / grid con confirmación inline de borrado.
 */
export function PaymentMethodsView() {
  return (
    <AccountGate>
      <SavedCardsManager />
    </AccountGate>
  );
}

function SavedCardsManager() {
  const { toast } = useToast();
  const [cards, setCards] = useState<SavedCardView[] | null>(null);
  const [error, setError] = useState(false);

  // Carga inicial (patrón promesa, sin setState síncrono en el effect).
  useEffect(() => {
    let active = true;
    listSavedCards()
      .then((list) => active && setCards(list))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteSavedCard(id);
      toast({ title: "Tarjeta eliminada", variant: "success" });
      setCards(await listSavedCards());
    } catch {
      toast({ title: "No pudimos eliminar la tarjeta", variant: "error" });
    }
  }

  return (
    <Section spacing="md">
      <Stack gap={6}>
        <Stack gap={1}>
          <span className="overline text-text-brand">Mi cuenta</span>
          <h1 className="heading-1 text-text-primary">Mis tarjetas</h1>
          <p className="body-m text-text-secondary">
            Los medios de pago que guardas para comprar más rápido.
          </p>
        </Stack>

        {error && (
          <Alert variant="error">No pudimos cargar tus tarjetas. Intenta de nuevo más tarde.</Alert>
        )}

        {!error && cards === null && (
          <Grid cols={1} md={2} gap={4}>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </Grid>
        )}

        {!error && cards?.length === 0 && (
          <EmptyState
            icon={<CreditCard className="size-10 text-text-muted" aria-hidden />}
            title="Aún no tienes tarjetas guardadas"
            description="Cuando pagues en línea podrás guardar tu tarjeta aquí y tu próxima compra será de un solo paso."
          />
        )}

        {!error && cards && cards.length > 0 && (
          <Grid cols={1} md={2} gap={4}>
            {cards.map((card) => (
              <SavedCardItem key={card.id} card={card} onDelete={() => handleDelete(card.id)} />
            ))}
          </Grid>
        )}

        {/* Confianza: decimos exactamente qué guardamos (y qué no). */}
        <Row gap={2} align="start" className="text-text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-[13px]">
            Manada nunca almacena el número completo ni el código de seguridad de tu tarjeta:
            solo una referencia segura de la pasarela de pago.
          </p>
        </Row>
      </Stack>
    </Section>
  );
}

function SavedCardItem({ card, onDelete }: { card: SavedCardView; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5">
      <Row gap={3} align="start">
        <span
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-text-brand"
          aria-hidden
        >
          <CreditCard className="size-5" />
        </span>
        <Stack gap={1} className="min-w-0">
          <span className="text-[15px] font-semibold text-text-primary">
            {card.brandLabel} •••• {card.last4}
          </span>
          <span className="text-sm text-text-secondary">Vence {card.expiry}</span>
        </Stack>
      </Row>

      <div className="mt-auto flex items-center gap-2 pt-2">
        {confirming ? (
          <>
            <span className="text-[13px] text-text-secondary">¿Eliminar esta tarjeta?</span>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              Sí, eliminar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              No
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            leadingIcon={<Trash2 className="size-4" aria-hidden />}
            onClick={() => setConfirming(true)}
          >
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
