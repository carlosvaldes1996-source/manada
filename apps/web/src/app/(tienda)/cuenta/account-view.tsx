"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { NavIcon } from "@/lib/icons";
import { ACCOUNT_NAV } from "@/config/nav";
import { useSession, useAuthActions } from "@/hooks";
import { cn } from "@/lib/utils";

/** Secciones ya implementadas — el resto se muestra sin enlace para no romper (U065). */
const LIVE_ROUTES = new Set(["/cuenta/mascotas", "/cuenta/pedidos", "/cuenta/direcciones"]);

/**
 * Mi cuenta — panel de secciones, según la sesión real:
 * - Anónimo → invita a ingresar / crear perfil (no inventa un "Carlos").
 * - Con sesión → saludo con el nombre real, las secciones y **cerrar sesión**
 *   (única salida del estado autenticado, antes inexistente).
 * Nomenclatura unificada (U057) y sin enlaces placeholder (U065).
 */
export function AccountView() {
  const router = useRouter();
  const { user, status, isLoading } = useSession();
  const { logout } = useAuthActions();

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
          description="Entra para gestionar a tu manada, tus suscripciones y tus pedidos."
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

  return (
    <Section spacing="md">
      <Stack gap={6}>
        <Stack gap={1}>
          <span className="overline text-text-brand">Mi cuenta</span>
          <h1 className="heading-1 text-text-primary">Hola, {user?.firstName}</h1>
          <p className="body-m text-text-secondary">Gestiona a tu manada, tus suscripciones y tus pedidos.</p>
        </Stack>

        <Grid cols={1} md={2} gap={4}>
          {ACCOUNT_NAV.map((item) => {
            const live = LIVE_ROUTES.has(item.href);
            const inner = (
              <>
                <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-text-brand">
                  <NavIcon name={item.icon} className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-text-primary">
                    {item.label}
                    {!live && <Badge variant="neutral">Pronto</Badge>}
                  </span>
                </span>
              </>
            );
            const base =
              "flex items-center gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5";
            return live ? (
              <Link
                key={item.href}
                href={item.href}
                className={cn(base, "transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md")}
              >
                {inner}
              </Link>
            ) : (
              <div key={item.href} className={cn(base, "opacity-70")} aria-disabled>
                {inner}
              </div>
            );
          })}
        </Grid>

        <div>
          <Button variant="ghost" leadingIcon={<LogOut className="size-4" aria-hidden />} onClick={signOut}>
            Cerrar sesión
          </Button>
        </div>
      </Stack>
    </Section>
  );
}
