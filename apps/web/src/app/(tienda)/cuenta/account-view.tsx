"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PetAvatar } from "@/components/pet";
import { NavIcon } from "@/lib/icons";
import { ACCOUNT_NAV, LIVE_ACCOUNT_HREFS } from "@/config/nav";
import { useSession, useAuthActions, usePet } from "@/hooks";

/**
 * Mi cuenta — "tu manada primero" (PET_EXPERIENCE §1.4, B7):
 * - Anónimo → invita a ingresar / crear perfil (no inventa un "Carlos").
 * - Con sesión → saludo real, la MANADA al tope (avatares que navegan al perfil
 *   + alta de otra mascota, cierra O6) y la gestión degradada a secundaria.
 * Solo secciones vivas: nada de cards "Pronto" deshabilitadas (MVP terminado
 * antes que amplio). Cerrar sesión sigue siendo la única salida del estado.
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
          <Grid cols={1} md={2} gap={4}>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </Grid>
        </Stack>
      </Section>
    );
  }

  if (status !== "authenticated") {
    return (
      <Section spacing="lg">
        <EmptyState
          icon={<span className="text-5xl">🐾</span>}
          title="Inicia sesión para ver tu cuenta"
          description="Entra para gestionar a tu manada, tus pedidos y tus direcciones."
          action={
            <Row gap={3} wrap justify="center">
              <Button asChild>
                <Link href="/ingresar">Ingresar</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/comenzar">Crear el perfil de tu mascota</Link>
              </Button>
            </Row>
          }
        />
      </Section>
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

  return (
    <Section spacing="md">
      <Stack gap={8}>
        <Stack gap={1}>
          <span className="overline text-text-brand">Mi cuenta</span>
          <h1 className="heading-1 text-text-primary">Hola, {user?.firstName}</h1>
          <p className="body-m text-text-secondary">Tu manada, tus pedidos y tus datos, en un solo lugar.</p>
        </Stack>

        {/* ── Tu manada primero (§1.4): avatares → perfil; + agrega otra (O6) ── */}
        <Stack gap={3}>
          <span className="overline text-text-brand">Tu manada</span>
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

        {/* ── Gestión (secundaria): solo secciones vivas, sin placeholders ── */}
        <Stack gap={3}>
          <span className="overline text-text-secondary">Gestión</span>
          <Grid cols={1} md={2} gap={4}>
            {ACCOUNT_NAV.filter((item) => LIVE_ACCOUNT_HREFS.has(item.href)).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-text-brand">
                  <NavIcon name={item.icon} className="size-5" />
                </span>
                <span className="text-[15px] font-semibold text-text-primary">{item.label}</span>
              </Link>
            ))}
          </Grid>
        </Stack>

        <div>
          <Button variant="ghost" leadingIcon={<LogOut className="size-4" aria-hidden />} onClick={signOut}>
            Cerrar sesión
          </Button>
        </div>
      </Stack>
    </Section>
  );
}
