"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type AddressView,
  type AddressInput,
} from "@/lib/medusa";
import { AccountGate } from "../account-gate";

/** Direcciones reales del cliente — CRUD nativo de Medusa (Fase 5 · Etapa A). */
export function AddressesView() {
  return (
    <AccountGate>
      <AddressManager />
    </AccountGate>
  );
}

function AddressManager() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<AddressView[] | null>(null);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AddressView | null>(null);

  async function reload() {
    try {
      setAddresses(await listAddresses());
    } catch {
      setError(true);
    }
  }

  // Carga inicial (patrón promesa, sin setState síncrono en el effect).
  useEffect(() => {
    let active = true;
    listAddresses()
      .then((list) => active && setAddresses(list))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(address: AddressView) {
    setEditing(address);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteAddress(id);
      toast({ title: "Dirección eliminada", variant: "success" });
      await reload();
    } catch {
      toast({ title: "No pudimos eliminar la dirección", variant: "error" });
    }
  }

  return (
    <Section spacing="md">
      <Stack gap={6}>
        <Row justify="between" align="start" wrap className="gap-3">
          <Stack gap={1}>
            <span className="overline text-text-brand">Mi cuenta</span>
            <h1 className="heading-1 text-text-primary">Mis direcciones</h1>
          </Stack>
          {addresses && addresses.length > 0 && (
            <Button leadingIcon={<Plus className="size-4" aria-hidden />} onClick={openCreate}>
              Agregar dirección
            </Button>
          )}
        </Row>

        {error && <Alert variant="error">No pudimos cargar tus direcciones. Intenta de nuevo más tarde.</Alert>}

        {!error && addresses === null && (
          <Grid cols={1} md={2} gap={4}>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </Grid>
        )}

        {!error && addresses?.length === 0 && (
          <EmptyState
            icon={<MapPin className="size-10 text-text-muted" aria-hidden />}
            title="Aún no guardas direcciones"
            description="Guarda una dirección para agilizar tus próximas compras."
            action={
              <Button leadingIcon={<Plus className="size-4" aria-hidden />} onClick={openCreate}>
                Agregar dirección
              </Button>
            }
          />
        )}

        {!error && addresses && addresses.length > 0 && (
          <Grid cols={1} md={2} gap={4}>
            {addresses.map((address) => (
              <AddressCard key={address.id} address={address} onEdit={() => openEdit(address)} onDelete={() => handleDelete(address.id)} />
            ))}
          </Grid>
        )}
      </Stack>

      <AddressDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={reload}
      />
    </Section>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: AddressView;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5">
      <Row gap={3} align="start">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-text-brand" aria-hidden>
          <MapPin className="size-5" />
        </span>
        <Stack gap={1} className="min-w-0">
          <span className="text-[15px] font-semibold text-text-primary">
            {address.firstName} {address.lastName}
          </span>
          <span className="text-sm text-text-secondary">{address.address1}</span>
          <span className="text-sm text-text-secondary">
            {[address.city, address.province].filter(Boolean).join(", ")}
          </span>
          {address.phone && <span className="text-[13px] text-text-muted">{address.phone}</span>}
        </Stack>
      </Row>

      <div className="mt-auto flex items-center gap-2 pt-2">
        {confirming ? (
          <>
            <span className="text-[13px] text-text-secondary">¿Eliminar?</span>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              Sí, eliminar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              No
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" leadingIcon={<Pencil className="size-4" aria-hidden />} onClick={onEdit}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" leadingIcon={<Trash2 className="size-4" aria-hidden />} onClick={() => setConfirming(true)}>
              Eliminar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM: AddressInput = {
  firstName: "",
  lastName: "",
  address1: "",
  city: "",
  province: "",
  phone: "",
};

function initialForm(editing: AddressView | null): AddressInput {
  return editing
    ? {
        firstName: editing.firstName,
        lastName: editing.lastName,
        address1: editing.address1,
        city: editing.city,
        province: editing.province ?? "",
        phone: editing.phone ?? "",
      }
    : EMPTY_FORM;
}

function AddressDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AddressView | null;
  onSaved: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {/* `key` remonta el formulario con estado fresco al crear/editar (sin effect de sync). */}
        {open && (
          <AddressForm
            key={editing?.id ?? "new"}
            editing={editing}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddressForm({
  editing,
  onOpenChange,
  onSaved,
}: {
  editing: AddressView | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<AddressInput>(() => initialForm(editing));
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof AddressInput>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const next: typeof errors = {};
    if (!form.firstName.trim()) next.firstName = "Falta el nombre";
    if (!form.lastName.trim()) next.lastName = "Falta el apellido";
    if (!form.address1.trim()) next.address1 = "Ingresa la dirección";
    if (!form.city.trim()) next.city = "Ingresa la comuna";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      if (editing) await updateAddress(editing.id, form);
      else await createAddress(form);
      toast({ title: editing ? "Dirección actualizada" : "Dirección guardada", variant: "success" });
      onOpenChange(false);
      await onSaved();
    } catch {
      toast({ title: "No pudimos guardar la dirección", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Editar dirección" : "Nueva dirección"}</DialogTitle>
        <DialogDescription>Usamos estos datos para coordinar tu despacho.</DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} noValidate>
        <Stack gap={4}>
          <Row gap={3} wrap>
            <Input label="Nombre" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} error={errors.firstName} className="flex-1" autoComplete="given-name" required />
            <Input label="Apellido" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} error={errors.lastName} className="flex-1" autoComplete="family-name" required />
          </Row>
          <Input label="Dirección" placeholder="Calle y número, depto/casa" value={form.address1} onChange={(e) => set("address1", e.target.value)} error={errors.address1} autoComplete="street-address" required />
          <Row gap={3} wrap>
            <Input label="Comuna" placeholder="Ñuñoa" value={form.city} onChange={(e) => set("city", e.target.value)} error={errors.city} className="flex-1" required />
            <Input label="Región" placeholder="Región Metropolitana" value={form.province} onChange={(e) => set("province", e.target.value)} className="flex-1" />
          </Row>
          <Input label="Teléfono (opcional)" placeholder="+56 9 ..." value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Guardar cambios" : "Guardar dirección"}
            </Button>
          </DialogFooter>
        </Stack>
      </form>
    </>
  );
}
