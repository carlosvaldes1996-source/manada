"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Plus,
  PawPrint,
  Package,
  User as UserIcon,
  MapPin,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PetAvatar } from "@/components/pet";
import { GuestAccountPrompt } from "./guest-account-prompt";
import { OrdersList } from "./pedidos/orders-view";
import { useSession, useAuthActions, usePet } from "@/hooks";
import { cn } from "@/lib/utils";

/**
 * Mi cuenta — hub con tabs que separa explícitamente los dos "perfiles" que antes
 * se confundían (PET_EXPERIENCE §1.4, B7): la MANADA (mascotas) y el PERFIL del
 * humano (sus datos). Rescate de UX de `cristobal-cambios`, reimplementado honesto:
 * - **Mi manada:** navegación a los perfiles de mascota (el perfil vive en
 *   `/cuenta/mascotas`, B1) + alta de otra (O6) + la suscripción como card
 *   "Próximamente" (D29: se anuncia el moat sin fingir que existe).
 * - **Pedidos:** historial real (reutiliza `OrdersList`, no lo duplica).
 * - **Mi perfil:** datos del dueño + accesos a direcciones/tarjetas + cerrar sesión.
 *
 * La home logueada sigue siendo el centro de control (Dashboard, D42); `/cuenta`
 * es gestión + perfil humano — deliberadamente NO replica el `PetStatusCard` para
 * no convertirse en un segundo dashboard.
 */
export function AccountView() {
  const router = useRouter();
  const { user, status, isLoading } = useSession();
  const { logout } = useAuthActions();
  const { pets, setActivePetId } = usePet();

  if (isLoading) {
    return (
      <Section spacing="md">
        <Stack gap={6}>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-9 w-80" />
          <Skeleton className="h-40 w-full" />
        </Stack>
      </Section>
    );
  }

  if (status !== "authenticated") {
    return (
      <GuestAccountPrompt
        title="Inicia sesión para ver tu cuenta"
        description="Entra para gestionar a tu manada, tus pedidos y tus datos."
      />
    );
  }

  async function signOut() {
    await logout();
    router.push("/");
  }

  /** Ver el perfil de una mascota = activarla y navegar (la mascota es un lugar, B1). */
  function goToPet(petId: string) {
    setActivePetId(petId);
    router.push("/cuenta/mascotas");
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <Section spacing="md">
      <Stack gap={6}>
        <Stack gap={1}>
          <span className="overline text-text-brand">Mi cuenta</span>
          <h1 className="heading-1 text-text-primary">Hola, {user?.firstName}</h1>
        </Stack>

        <Tabs defaultValue="manada">
          <TabsList>
            <TabsTrigger value="manada" className="inline-flex items-center gap-2">
              <PawPrint className="size-4" aria-hidden /> Mi manada
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="inline-flex items-center gap-2">
              <Package className="size-4" aria-hidden /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="perfil" className="inline-flex items-center gap-2">
              <UserIcon className="size-4" aria-hidden /> Mi perfil
            </TabsTrigger>
          </TabsList>

          {/* ── Mi manada: navegación a los perfiles + alta + suscripción honesta ── */}
          <TabsContent value="manada">
            <Stack gap={8}>
              <Stack gap={3}>
                <span className="overline text-text-secondary">Tu manada</span>
                <Row gap={4} wrap>
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => goToPet(pet.id)}
                      className="group flex w-16 flex-col items-center gap-1.5 rounded-[var(--radius-md)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
                    >
                      <PetAvatar
                        pet={pet}
                        size="lg"
                        className="ring-2 ring-terracota-100 transition-transform duration-[var(--duration-micro)] group-hover:scale-105"
                      />
                      <span className="max-w-full truncate text-[13px] font-semibold text-text-primary">
                        {pet.name}
                      </span>
                    </button>
                  ))}
                  <Link
                    href="/comenzar"
                    className="group flex w-16 flex-col items-center gap-1.5 rounded-[var(--radius-md)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
                  >
                    <span className="grid size-16 place-items-center rounded-full border border-dashed border-terracota-200 bg-brand-soft text-text-brand transition-colors group-hover:border-terracota-300">
                      <Plus className="size-6" aria-hidden />
                    </span>
                    <span className="text-[13px] font-semibold text-text-brand">
                      {pets.length > 0 ? "Agregar" : "Agregar mascota"}
                    </span>
                  </Link>
                </Row>
              </Stack>

              {/* Suscripción: honesta (D29). El moat recurrente aún no existe en el
                  backend; se anuncia como card inerte "Próximamente", no navegable. */}
              <Stack gap={3}>
                <span className="overline text-text-secondary">Su plan</span>
                <div
                  className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5 opacity-70"
                  aria-disabled
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-text-brand">
                    <RefreshCw className="size-5" aria-hidden />
                  </span>
                  <Stack gap={1}>
                    <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-text-primary">
                      Suscripciones <Badge variant="neutral">Próximamente</Badge>
                    </span>
                    <span className="text-[13px] text-text-secondary">
                      La entrega recurrente de su comida llega pronto. Por ahora te avisamos para reponer, sin cobros automáticos.
                    </span>
                  </Stack>
                </div>
              </Stack>
            </Stack>
          </TabsContent>

          {/* ── Pedidos: reutiliza la lista real (sin duplicar) ── */}
          <TabsContent value="pedidos">
            <OrdersList />
          </TabsContent>

          {/* ── Mi perfil: datos del humano + accesos + salir ── */}
          <TabsContent value="perfil">
            <div className="max-w-lg">
              <Stack gap={5}>
                <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface p-5">
                  <h2 className="heading-3 mb-4 text-text-primary">Datos personales</h2>
                  <Stack gap={3}>
                    <ProfileRow label="Nombre" value={fullName} />
                    <ProfileRow label="Email" value={user?.email} />
                    {user?.rut && <ProfileRow label="RUT" value={user.rut} />}
                  </Stack>
                </div>

                <Grid cols={1} sm={2} gap={4}>
                  <AccountLink href="/cuenta/direcciones" icon={MapPin} label="Mis direcciones" />
                  <AccountLink href="/cuenta/pagos" icon={CreditCard} label="Mis tarjetas" />
                </Grid>

                <div>
                  <Button variant="ghost" leadingIcon={<LogOut className="size-4" aria-hidden />} onClick={signOut}>
                    Cerrar sesión
                  </Button>
                </div>
              </Stack>
            </div>
          </TabsContent>
        </Tabs>
      </Stack>
    </Section>
  );
}

/** Tarjeta de acceso a una sección de gestión (direcciones, tarjetas). */
function AccountLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-text-brand">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-[15px] font-semibold text-text-primary">{label}</span>
    </Link>
  );
}

/** Fila etiqueta/valor de los datos personales. */
function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className={cn("flex items-center justify-between border-b border-border-default pb-3 text-sm last:border-0 last:pb-0", !value && "opacity-60")}>
      <span className="text-text-secondary">{label}</span>
      <span className="font-semibold text-text-primary">{value || "—"}</span>
    </div>
  );
}
