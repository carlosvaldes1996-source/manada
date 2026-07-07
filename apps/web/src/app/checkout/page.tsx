"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { AppShell } from "@/components/layout";
import {
  OrderSummary,
  ShippingMethod,
  PaymentMethod,
  type ShippingOption,
  type PaymentOption,
} from "@/components/commerce";
import { useCart, useSession } from "@/components/providers";
import {
  listShippingOptions,
  setCheckoutInfo,
  selectShippingMethod,
  initManualPayment,
  completeCart,
  type CheckoutAddress,
  type ShippingOptionView,
} from "@/lib/medusa";
import { formatCLP } from "@/lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Único medio de pago del MVP: transferencia manual (Mercado Pago llega después). */
const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "manual",
    label: "Transferencia bancaria",
    description: "Te enviamos los datos para transferir y confirmamos tu pago a mano.",
  },
];

/**
 * Checkout — UNA sola pantalla (AUDIT U047), sobre el carrito REAL de Medusa
 * (Fase 5 · Etapa 3, D24). Flujo 100% nativo: email + dirección → shipping options
 * → shipping method → sesión de pago manual → `complete` = orden real (stock
 * descontado, visible en el Admin). Compra como invitado siempre posible.
 */
export default function CheckoutPage() {
  const { cart, items, subtotal, isLoading, clear } = useCart();
  const { user } = useSession();
  const router = useRouter();
  const cartId = cart?.id;

  // Datos del comprador (compra como invitado o cliente autenticado).
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [shipOptions, setShipOptions] = useState<ShippingOptionView[]>([]);
  const [shippingId, setShippingId] = useState<string>("");
  const [paymentId, setPaymentId] = useState("manual");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prellena una sola vez los datos del cliente autenticado, sin pisar lo que ya
  // escribió (ajuste de estado en render guardado — patrón recomendado de React,
  // ya que el cliente llega asíncrono desde la sesión persistida).
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    if (!firstName) setFirstName(user.firstName ?? "");
    if (!lastName) setLastName(user.lastName ?? "");
    if (!email) setEmail(user.email ?? "");
  }

  // Opciones de despacho reales del carrito.
  useEffect(() => {
    if (!cartId) return;
    let active = true;
    listShippingOptions(cartId)
      .then((opts) => {
        if (!active) return;
        setShipOptions(opts);
        setShippingId((cur) => cur || opts[0]?.id || "");
      })
      .catch(() => active && setShipOptions([]));
    return () => {
      active = false;
    };
  }, [cartId]);

  const shippingOptionsView: ShippingOption[] = useMemo(
    () =>
      shipOptions.map((o) => ({
        id: o.id,
        label: o.name,
        eta: o.description ?? "Despacho a domicilio",
        cost: o.amount,
        icon: <Truck className="size-5 text-text-brand" aria-hidden />,
      })),
    [shipOptions],
  );

  const shippingCost = shipOptions.find((o) => o.id === shippingId)?.amount ?? 0;
  const total = subtotal + shippingCost;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Cuéntanos tu nombre";
    if (!lastName.trim()) e.lastName = "Falta tu apellido";
    if (!EMAIL_RE.test(email)) e.email = "Revisa tu correo";
    if (!address1.trim()) e.address1 = "Ingresa tu dirección";
    if (!city.trim()) e.city = "Ingresa tu comuna";
    if (!shippingId) e.shipping = "Elige un despacho";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function pay() {
    if (!cartId || submitting) return;
    setSubmitError(null);
    if (!validate()) return;

    const address: CheckoutAddress = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      address_1: address1.trim(),
      city: city.trim(),
      province: province.trim() || undefined,
      phone: phone.trim() || undefined,
      country_code: "cl",
    };

    setSubmitting(true);
    try {
      // Flujo nativo de Medusa, en orden.
      await setCheckoutInfo(cartId, email.trim(), address);
      await selectShippingMethod(cartId, shippingId);
      await initManualPayment(cartId);
      const { order, error } = await completeCart(cartId);
      if (error || !order) {
        setSubmitError(error ?? "No se pudo completar la orden. Intenta de nuevo.");
        return;
      }
      // Orden creada: vaciamos el carrito (uno nuevo) y vamos a la confirmación.
      await clear();
      router.push(`/checkout/confirmacion?orden=${order.display_id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ocurrió un error al pagar.");
    } finally {
      setSubmitting(false);
    }
  }

  // Carrito vacío (o aún cargando) → no hay nada que pagar.
  if (!isLoading && items.length === 0) {
    return (
      <AppShell variant="checkout">
        <Section spacing="lg">
          <EmptyState
            icon={<span className="text-5xl">🛒</span>}
            title="Tu carrito está vacío"
            description="Agrega productos para continuar con tu compra."
            action={
              <Button asChild>
                <Link href="/categoria/todo">Ir a la tienda</Link>
              </Button>
            }
          />
        </Section>
      </AppShell>
    );
  }

  return (
    <AppShell variant="checkout">
      <Section spacing="md">
        <Stack gap={6}>
          <h1 className="heading-1 text-text-primary">Finalizar compra</h1>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <Stack gap={6}>
              {/* Identificación (compra como invitado, siempre posible) */}
              <Block title="Tus datos">
                {!user && (
                  <p className="text-sm text-text-secondary">
                    Compras como invitado.{" "}
                    <Link href="/ingresar" className="font-semibold text-text-brand underline-offset-2 hover:underline">
                      Ingresa
                    </Link>{" "}
                    si ya tienes cuenta.
                  </p>
                )}
                <Row gap={3} className="max-w-md" wrap>
                  <Input label="Nombre" placeholder="Carlos" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.firstName} className="flex-1" required />
                  <Input label="Apellido" placeholder="Valdés" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.lastName} className="flex-1" required />
                </Row>
                <Input type="email" label="Correo para la confirmación y el seguimiento" placeholder="tucorreo@ejemplo.cl" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} className="max-w-md" required />
              </Block>

              {/* Dirección de entrega */}
              <Block title="Dirección de entrega">
                <Stack gap={3} className="max-w-md">
                  <Input label="Dirección" placeholder="Calle y número, depto/casa" autoComplete="street-address" value={address1} onChange={(e) => setAddress1(e.target.value)} error={errors.address1} required />
                  <Row gap={3} wrap>
                    <Input label="Comuna" placeholder="Ñuñoa" value={city} onChange={(e) => setCity(e.target.value)} error={errors.city} className="flex-1" required />
                    <Input label="Región" placeholder="Región Metropolitana" value={province} onChange={(e) => setProvince(e.target.value)} className="flex-1" />
                  </Row>
                  <Input label="Teléfono (para coordinar la entrega)" placeholder="+56 9 ..." autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Stack>
              </Block>

              {/* Despacho: opciones reales del backend */}
              <Block title="¿Cómo lo enviamos?">
                {shippingOptionsView.length > 0 ? (
                  <ShippingMethod options={shippingOptionsView} value={shippingId} onValueChange={setShippingId} />
                ) : (
                  <p className="text-sm text-text-secondary">Cargando opciones de despacho…</p>
                )}
                {errors.shipping && <p className="text-sm text-danger">{errors.shipping}</p>}
              </Block>

              {/* Pago: transferencia manual (MP en la próxima etapa) */}
              <Block title="¿Cómo pagas?">
                <PaymentMethod options={PAYMENT_OPTIONS} value={paymentId} onValueChange={setPaymentId} />
                <p className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                  <ShieldCheck className="size-4 text-[var(--success)]" aria-hidden />
                  Coordinamos el pago por transferencia y preparamos tu despacho apenas se confirme.
                </p>
              </Block>
            </Stack>

            {/* Resumen (sticky) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Stack gap={3}>
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
                            <span className="text-[13px] text-text-secondary">Cantidad {i.quantity}</span>
                          </span>
                        </Row>
                        <span className="price shrink-0 text-sm text-text-primary">
                          {formatCLP(i.product.price.current * i.quantity)}
                        </span>
                      </Row>
                    ))}
                  </Stack>
                </div>

                {submitError && <Alert variant="error">{submitError}</Alert>}

                <OrderSummary
                  subtotal={subtotal}
                  shipping={shippingCost}
                  note="Al pagar aceptas los términos. Coordinamos la transferencia y el despacho."
                >
                  <Button block size="lg" onClick={pay} disabled={submitting || isLoading}>
                    {submitting ? "Creando tu orden…" : `Pagar ${formatCLP(total)}`}
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
