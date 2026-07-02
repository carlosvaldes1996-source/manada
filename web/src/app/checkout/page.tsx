"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioCard } from "@/components/ui/radio";
import { AppShell } from "@/components/layout";
import {
  OrderSummary,
  ShippingMethod,
  PaymentMethod,
  type ShippingOption,
  type PaymentOption,
} from "@/components/commerce";
import { useCart, useSession, usePet } from "@/components/providers";
import { SITE } from "@/config/site";
import { DEMO_USER, DEMO_SHIPPING } from "@/lib/demo-data";
import { formatCLP, formatDeliveryDate, pluralize } from "@/lib/format";

/** Direcciones guardadas demo (AUDIT U071): selección, no inputs sueltos. */
const SAVED_ADDRESSES = [
  { id: "addr_casa", label: "Casa", line: "Av. Irarrázaval 1234, depto 56", comuna: "Ñuñoa, RM" },
  { id: "addr_trabajo", label: "Trabajo", line: "Av. Apoquindo 4500, of. 1203", comuna: "Las Condes, RM" },
];

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "webpay", label: "Webpay", description: "Débito o crédito (Transbank)" },
  { id: "tarjeta", label: "Tarjeta", description: "Visa, Mastercard o Amex" },
  { id: "mercadopago", label: "Mercado Pago", description: "Saldo o tarjetas" },
];

/**
 * Checkout — UNA sola pantalla (AUDIT U047): sin numeración que prometa una
 * secuencia inexistente. Todas las secciones a la vista con encabezados claros.
 * - U048: el alcance del toggle de suscripción se explica (solo la línea de
 *   alimento se repite; el resto es compra única).
 * - U049: la creación del "perfil de recompra" es una decisión visible, no una
 *   nota al pie.
 * - U050: el ahorro por suscripción se celebra en el resumen.
 * - U071: la dirección se elige entre direcciones guardadas.
 */
export default function CheckoutPage() {
  const { items, clear } = useCart();
  const { user } = useSession();
  const { activePet } = usePet();
  const router = useRouter();

  // Datos del comprador: usuario real de la sesión (recién registrado o demo).
  const buyerName = user?.firstName ?? DEMO_USER.firstName;
  const buyerEmail = user?.email ?? "carlos@ejemplo.cl";
  const buyerLocation = user?.comuna ? `${user.comuna}${user.region ? `, ${user.region}` : ""}` : undefined;

  const threshold = SITE.commerce.freeShippingThreshold;
  const effective = (i: (typeof items)[number]) =>
    i.subscriptionWeeks && i.product.subscriptionDiscount
      ? Math.round(i.product.price.current * (1 - i.product.subscriptionDiscount / 100))
      : i.product.price.current;

  const regularSubtotal = items.reduce((s, i) => s + i.product.price.current * i.quantity, 0);
  const savings = items.reduce((s, i) => s + (i.product.price.current - effective(i)) * i.quantity, 0);
  const paySubtotal = regularSubtotal - savings;

  const subscriptionLines = items.filter((i) => i.subscriptionWeeks);

  const SHIPPING_OPTIONS: ShippingOption[] = [
    {
      id: "domicilio",
      label: "Despacho a domicilio",
      eta: `Llega ${formatDeliveryDate(DEMO_SHIPPING.date)}`,
      cost: paySubtotal >= threshold ? 0 : 2990,
      icon: <Truck className="size-5 text-text-brand" aria-hidden />,
    },
    {
      id: "express",
      label: "Despacho express",
      eta: "Llega hoy antes de las 21:00",
      cost: 5990,
      icon: <Truck className="size-5 text-text-brand" aria-hidden />,
    },
    {
      id: "retiro",
      label: "Retiro en tienda",
      eta: "Providencia · listo en 2 horas",
      cost: 0,
      icon: <MapPin className="size-5 text-text-brand" aria-hidden />,
    },
  ];

  const [addressId, setAddressId] = useState(SAVED_ADDRESSES[0].id);
  const [shippingId, setShippingId] = useState("domicilio");
  const [paymentId, setPaymentId] = useState("webpay");
  const [saveRecompra, setSaveRecompra] = useState(true);

  const shippingCost = SHIPPING_OPTIONS.find((o) => o.id === shippingId)?.cost ?? 0;
  const total = regularSubtotal - savings + shippingCost;

  function pay() {
    clear();
    router.push("/bienvenida");
  }

  return (
    <AppShell variant="checkout">
      <Section spacing="md">
        <Stack gap={6}>
          <h1 className="heading-1 text-text-primary">Finalizar compra</h1>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <Stack gap={6}>
              {/* Identificación */}
              <Block title="Tus datos">
                <p className="body-m text-text-secondary">
                  Compras como <strong className="text-text-primary">{buyerName}</strong>
                  {buyerLocation ? ` · ${buyerLocation}` : ""}
                </p>
                <Input
                  type="email"
                  label="Correo para la boleta y el seguimiento"
                  defaultValue={buyerEmail}
                  className="max-w-sm"
                />
              </Block>

              {/* Dirección de entrega (U071) */}
              <Block title="Dirección de entrega">
                <RadioGroup value={addressId} onValueChange={setAddressId} aria-label="Dirección guardada">
                  <Stack gap={3}>
                    {SAVED_ADDRESSES.map((a) => (
                      <RadioCard
                        key={a.id}
                        value={a.id}
                        title={`${a.label} · ${a.comuna}`}
                        description={a.line}
                        icon={<MapPin className="size-5 text-text-brand" aria-hidden />}
                      />
                    ))}
                    <RadioCard
                      value="otra"
                      title="Usar otra dirección"
                      description="Ingresa una nueva dirección de entrega"
                    />
                  </Stack>
                </RadioGroup>
                {addressId === "otra" && (
                  <Stack gap={3} className="max-w-md">
                    <Input label="Dirección" placeholder="Calle y número" />
                    <Row gap={3}>
                      <Input label="Comuna" placeholder="Ñuñoa" />
                      <Input label="Depto / casa" placeholder="Opcional" />
                    </Row>
                  </Stack>
                )}
              </Block>

              {/* Despacho */}
              <Block title="¿Cómo lo enviamos?">
                <ShippingMethod options={SHIPPING_OPTIONS} value={shippingId} onValueChange={setShippingId} />
              </Block>

              {/* Pago */}
              <Block title="¿Cómo pagas?">
                <PaymentMethod options={PAYMENT_OPTIONS} value={paymentId} onValueChange={setPaymentId} />
                <p className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                  <ShieldCheck className="size-4 text-[var(--success)]" aria-hidden />
                  Pago seguro · emitimos boleta SII.
                </p>
              </Block>

              {/* Suscripción + perfil de recompra (U048 / U049) */}
              {subscriptionLines.length > 0 && (
                <Block title="Tu suscripción y recompra">
                  <div className="rounded-[var(--radius-md)] border-[1.5px] border-miel-400 bg-accent-soft p-4">
                    <Row gap={2}>
                      <Badge variant="subscribe">
                        <RefreshCw className="size-3.5" aria-hidden />
                        Solo esta línea se repite
                      </Badge>
                    </Row>
                    <Stack gap={1} className="mt-3">
                      {subscriptionLines.map((l) => (
                        <p key={l.product.id} className="text-sm text-text-primary">
                          {l.product.name} ·{" "}
                          <span className="text-text-secondary">
                            cada {pluralize(l.subscriptionWeeks ?? 4, "semana")}
                          </span>
                        </p>
                      ))}
                    </Stack>
                    <p className="mt-2 text-[13px] text-text-secondary">
                      El resto de tu pedido es una <strong>compra única</strong>. Sin permanencia:
                      pausa o cancela cuando quieras.
                    </p>
                  </div>

                  <Switch
                    checked={saveRecompra}
                    onCheckedChange={setSaveRecompra}
                    label={`Guardar el perfil de recompra de ${activePet?.name ?? "tu mascota"}`}
                    description="Recordamos qué le diste para avisarte antes de que se acabe. Puedes desactivarlo cuando quieras."
                  />
                </Block>
              )}
            </Stack>

            {/* Resumen (sticky) con recap de lo que se paga */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Stack gap={3}>
                {/* Recap de ítems: saber QUÉ se compra antes de pagar */}
                <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface p-5">
                  <Row justify="between" className="mb-3">
                    <h2 className="heading-4 text-text-primary">Tu pedido</h2>
                    <Link href="/carrito" className="text-sm font-semibold text-text-brand hover:underline">
                      Editar
                    </Link>
                  </Row>
                  <Stack gap={3}>
                    {items.map((i) => (
                      <Row key={i.product.id} justify="between" className="gap-3">
                        <Row gap={3} className="min-w-0">
                          <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-subtle text-xl" aria-hidden>
                            {i.product.imageUrl ?? "📦"}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-text-primary">{i.product.name}</span>
                            <span className="text-[13px] text-text-secondary">
                              {i.subscriptionWeeks ? "Suscripción · " : ""}Cantidad {i.quantity}
                            </span>
                          </span>
                        </Row>
                        <span className="price shrink-0 text-sm text-text-primary">
                          {formatCLP(effective(i) * i.quantity)}
                        </span>
                      </Row>
                    ))}
                  </Stack>
                </div>

                <OrderSummary
                  subtotal={regularSubtotal}
                  savings={savings}
                  shipping={shippingCost}
                  note="Al pagar aceptas los términos. Emitimos boleta SII."
                >
                  <Button block size="lg" onClick={pay}>
                    Pagar {formatCLP(total)}
                  </Button>
                  <Button variant="ghost" block asChild>
                    <Link href="/carrito">Volver al carrito</Link>
                  </Button>
                </OrderSummary>
              </Stack>
            </div>
          </div>
        </Stack>
      </Section>
    </AppShell>
  );
}

/** Bloque de checkout: encabezado sin número (U047) + contenido. */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap={3} as="section">
      <h2 className="heading-3 text-text-primary">{title}</h2>
      {children}
    </Stack>
  );
}
