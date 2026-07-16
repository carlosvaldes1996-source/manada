"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Plus,
  Package,
  ChevronLeft,
  ChevronRight,
  Clock,
  Scissors,
  Star,
  Syringe,
  PawPrint,
  CalendarClock,
  User,
  MapPin,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PetAvatar } from "@/components/pet";
import { GuestAccountPrompt } from "./guest-account-prompt";
import { useSession, useAuthActions, usePet } from "@/hooks";
import { listOrders, type OrderView } from "@/lib/medusa";
import { formatCLP, formatDateLong, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ─── Servicios de Manada (placeholder — se agendarán en el futuro) ─── */
const SERVICES = [
  { id: "bano", icon: Scissors, label: "Baño y peluquería completa", duration: 60, price: 15990 },
  { id: "unas", icon: Scissors, label: "Corte de uñas", duration: 20, price: 5990 },
  { id: "vacuna", icon: Syringe, label: "Vacunación", duration: 30, price: 12990 },
  { id: "paseo", icon: PawPrint, label: "Paseo diario", duration: 30, price: 6990 },
  { id: "grooming", icon: Star, label: "Grooming express", duration: 45, price: 9990 },
];

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
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-48 w-full" />
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

  function goToPet(petId: string) {
    setActivePetId(petId);
    router.push("/cuenta/mascotas");
  }

  return (
    <Section spacing="md">
      <Stack gap={6}>
        {/* ── Header ── */}
        <Stack gap={0.5 as never}>
          <h1 className="heading-1 text-text-primary">Hola, {user?.firstName}</h1>
          <p className="body-m text-text-secondary">Bienvenido al panel de tu Manada.</p>
        </Stack>

        {/* ── Tabs ── */}
        <Tabs defaultValue="manada">
          <TabsList>
            <TabsTrigger value="manada">
              <PawPrint className="size-4" aria-hidden /> Mi Manada
            </TabsTrigger>
            <TabsTrigger value="pedidos">
              <Package className="size-4" aria-hidden /> Pedidos y Servicios
            </TabsTrigger>
            <TabsTrigger value="perfil">
              <User className="size-4" aria-hidden /> Mi Perfil
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Mi Manada ── */}
          <TabsContent value="manada" className="mt-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              {/* Mis Mascotas */}
              <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface p-5">
                <Row justify="between" align="center" className="mb-4">
                  <h2 className="heading-3 text-text-primary">Mis Mascotas</h2>
                  <Button variant="secondary" size="sm" asChild>
                    <Link href="/comenzar">
                      <Plus className="size-4" aria-hidden /> Agregar
                    </Link>
                  </Button>
                </Row>

                {pets.length === 0 ? (
                  <p className="body-m py-4 text-center text-text-secondary">
                    No has registrado mascotas aún.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-4">
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
                  </div>
                )}
              </div>

              {/* Suscripciones Activas */}
              <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface p-5">
                <Row gap={2} align="center" className="mb-4">
                  <CalendarClock className="size-5 text-miel-600" aria-hidden />
                  <h2 className="heading-3 text-text-primary">Suscripciones Activas</h2>
                </Row>

                {/* Empty state — cuando no haya suscripciones reales */}
                <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-border-default py-8 text-center">
                  <Package className="size-10 text-text-muted" aria-hidden />
                  <Stack gap={1} align="center">
                    <p className="font-semibold text-text-primary">No tienes suscripciones</p>
                    <p className="text-sm text-text-secondary">
                      Olvídate de comprar comida a última hora.
                    </p>
                  </Stack>
                  <Button asChild>
                    <Link href="/comenzar">Crear plan para mi mascota</Link>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Pedidos y Servicios ── */}
          <TabsContent value="pedidos" className="mt-5">
            <InlineOrdersList />
          </TabsContent>

          {/* ── Tab: Mi Perfil ── */}
          <TabsContent value="perfil" className="mt-5">
            <div className="max-w-lg">
              <Stack gap={5}>
                {/* Datos personales */}
                <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface p-5">
                  <h2 className="heading-3 mb-4 text-text-primary">Datos personales</h2>
                  <Stack gap={3}>
                    <ProfileRow label="Nombre" value={[user?.firstName, user?.lastName].filter(Boolean).join(" ")} />
                    <ProfileRow label="Email" value={user?.email} />
                    {user?.rut && <ProfileRow label="RUT" value={user.rut} />}
                  </Stack>
                </div>

                {/* Direcciones */}
                <Link
                  href="/cuenta/direcciones"
                  className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-border-default bg-surface p-5 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-text-brand">
                    <MapPin className="size-5" aria-hidden />
                  </span>
                  <span className="text-[15px] font-semibold text-text-primary">Mis direcciones</span>
                </Link>

                {/* Cerrar sesión */}
                <div>
                  <Button
                    variant="ghost"
                    leadingIcon={<LogOut className="size-4" aria-hidden />}
                    onClick={signOut}
                  >
                    Cerrar sesión
                  </Button>
                </div>
              </Stack>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Servicios que ofrecemos (siempre visible) ── */}
        <Stack gap={3}>
          <span className="overline text-text-secondary">Servicios que ofrecemos</span>
          <ServicesCarousel />
        </Stack>
      </Stack>
    </Section>
  );
}

/* ─── Pedidos inline ──────────────────────────────────────────────────── */

function InlineOrdersList() {
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [error, setError] = useState(false);
  const { pets } = usePet();

  useEffect(() => {
    let active = true;
    listOrders()
      .then((list) => active && setOrders(list))
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, []);

  if (error) return <Alert variant="error">No pudimos cargar tus pedidos. Intenta de nuevo más tarde.</Alert>;
  if (orders === null) return (
    <Stack gap={3}>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </Stack>
  );
  if (orders.length === 0) return (
    <EmptyState
      icon={<Package className="size-10 text-text-muted" aria-hidden />}
      title="Aún no tienes pedidos"
      description="Cuando compres, tus pedidos aparecerán aquí."
      action={<Button asChild><Link href="/categoria/todo">Ir a la tienda</Link></Button>}
    />
  );

  const petForItem = (productId?: string) =>
    productId ? pets.find((p) => p.currentFoodId === productId) : undefined;

  return (
    <Stack gap={4}>
      {orders.map((order) => {
        const date = order.createdAt ? formatDateLong(new Date(order.createdAt)) : "";
        const badgeVariant =
          order.statusLabel === "Cancelado" ? "neutral"
          : order.statusLabel === "Entregado" ? "success"
          : "brand";
        return (
          <div key={order.id} className="rounded-[var(--radius-lg)] border border-border-default bg-surface p-5">
            <Row justify="between" align="start" className="gap-3" wrap>
              <Stack gap={1}>
                <span className="text-[15px] font-semibold text-text-primary">
                  Pedido #{order.displayId}
                </span>
                {date && <span className="text-[13px] text-text-secondary">{date}</span>}
              </Stack>
              <Badge variant={badgeVariant}>{order.statusLabel}</Badge>
            </Row>
            <div className="my-3 h-px bg-border-default" />
            <Stack gap={2}>
              {order.items.map((item) => {
                const pet = petForItem(item.productId);
                return (
                  <Row key={item.id} gap={3} className="min-w-0">
                    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-subtle text-lg" aria-hidden>
                      {item.thumbnail
                        ? <img src={item.thumbnail} alt="" className="size-full object-cover" />
                        : "📦"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                      {item.title}
                      {pet && (
                        <span className="ml-2 inline-flex items-center gap-1 align-middle text-[13px] text-text-secondary">
                          · para <PetAvatar pet={pet} size="xs" /> {pet.name}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-[13px] text-text-secondary">×{item.quantity}</span>
                  </Row>
                );
              })}
            </Stack>
            <Row justify="between" className="mt-3">
              <span className="text-[13px] text-text-secondary">
                {pluralize(order.itemCount, "producto")}
              </span>
              <span className="price text-sm font-semibold text-text-primary">
                {formatCLP(order.total)}
              </span>
            </Row>
          </div>
        );
      })}
    </Stack>
  );
}

/* ─── Carrusel de servicios ───────────────────────────────────────────── */

function ServicesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {/* Arrow left */}
      <button
        type="button"
        aria-label="Ver anteriores"
        onClick={() => scroll("left")}
        className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border-default bg-surface shadow-sm transition-shadow hover:shadow-md sm:flex size-9"
      >
        <ChevronLeft className="size-5 text-text-secondary" aria-hidden />
      </button>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {SERVICES.map((svc) => (
          <ServiceCard key={svc.id} service={svc} />
        ))}
      </div>

      {/* Arrow right */}
      <button
        type="button"
        aria-label="Ver siguientes"
        onClick={() => scroll("right")}
        className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border-default bg-surface shadow-sm transition-shadow hover:shadow-md sm:flex size-9"
      >
        <ChevronRight className="size-5 text-text-secondary" aria-hidden />
      </button>
    </div>
  );
}

function ServiceCard({ service }: { service: (typeof SERVICES)[number] }) {
  const Icon = service.icon;
  return (
    <div
      className="flex w-[220px] shrink-0 flex-col gap-3 rounded-[var(--radius-xl)] border border-border-default bg-surface p-4"
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Icon + duration */}
      <Row gap={1.5 as never} align="center" className="text-[13px] text-text-secondary">
        <Icon className="size-4 text-text-brand" aria-hidden />
        <Clock className="size-3.5" aria-hidden />
        <span>{service.duration} min</span>
      </Row>

      {/* Name + price */}
      <Stack gap={1}>
        <p className="font-semibold leading-snug text-text-primary">{service.label}</p>
        <p className="price text-lg text-text-brand">{formatCLP(service.price)}</p>
      </Stack>

      <Button size="sm" block>
        Agendar
      </Button>
    </div>
  );
}

/* ─── Fila de perfil ─────────────────────────────────────────────────── */

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className={cn("flex items-center justify-between border-b border-border-default pb-3 text-sm last:border-0 last:pb-0", !value && "opacity-60")}>
      <span className="text-text-secondary">{label}</span>
      <span className="font-semibold text-text-primary">{value ?? "—"}</span>
    </div>
  );
}
