"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Truck } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { AppShell } from "@/components/layout";
import {
  OrderSummary,
  ProductImage,
  ShippingMethod,
  PaymentMethod,
  AuthSheet,
  type ShippingOption,
  type PaymentOption,
} from "@/components/commerce";
import { useCart, useSession } from "@/components/providers";
import {
  listShippingOptions,
  setCheckoutInfo,
  setCartEmail,
  selectShippingMethod,
  createFlowPayment,
  createSubscriptionPayment,
  getShippingPolicy,
  saveCustomerRut,
  type CheckoutAddress,
  type ShippingOptionView,
  type ShippingPolicy,
} from "@/lib/medusa";
import { formatCLP } from "@/lib/format";
import { shippingReasonLabel } from "@/lib/shipping-copy";
import { cn } from "@/lib/utils";
import { trackBeginCheckout } from "@/lib/analytics";
import { PENDING_PURCHASE_KEY } from "@/lib/checkout-snapshot";
import { formatRut, isValidRut } from "@/lib/rut";
import { REGIONS, getComunas } from "@/lib/chile-regions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Traduce el fallo al pagar en algo que el usuario pueda accionar.
 *
 * El backend ya devuelve mensajes en español para lo que el comprador puede
 * corregir (correo rechazado por la pasarela, etc.) → esos se muestran tal cual.
 * Lo que NO hay que mostrar en crudo es el fallo de red: `fetch` rechaza con
 * `TypeError: Failed to fetch` cuando la petición ni siquiera llega (backend caído,
 * endpoint inexistente, CORS, sin conexión). Ese texto no le dice nada a nadie y
 * hace pasar por error del usuario lo que es un problema nuestro.
 */
function toPaymentErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const isNetworkFailure =
    err instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(raw);

  if (isNetworkFailure) {
    return (
      "No pudimos conectarnos para procesar el pago. Revisa tu conexión e inténtalo " +
      "de nuevo; si sigue pasando, escríbenos y lo resolvemos."
    );
  }
  return raw || "No se pudo iniciar el pago. Intenta de nuevo.";
}

/**
 * Medio de pago: Flow (D58). Flow agrupa varios medios (tarjeta de crédito/débito
 * y otros); el usuario elige en el checkout de Flow tras la redirección.
 */
const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "flow",
    label: "Pagar con Flow",
    description:
      "Tarjeta de crédito o débito y otros medios. Te llevamos al checkout seguro de Flow para completar el pago.",
  },
];

/**
 * Checkout — UNA sola pantalla (AUDIT U047), sobre el carrito REAL de Medusa
 * (Fase 5 · Etapa 3, D24). Flujo: email + dirección → shipping options → shipping
 * method → **pago con Flow** (D58): se crea la orden de pago en Flow y se redirige
 * al usuario a su checkout. La ORDEN Medusa se crea recién cuando Flow confirma el
 * pago (webhook + payment/getStatus). Compra como invitado siempre posible.
 */
export default function CheckoutPage() {
  const { cart, items, subtotal, isLoading } = useCart();
  const { user } = useSession();
  const cartId = cart?.id;

  // Carrito con al menos una línea de suscripción (D59): el pago tokeniza la tarjeta
  // (Modelo A de Flow) en vez de un cobro único. Suscribir REQUIERE cuenta (no se
  // puede tokenizar a un invitado) → si no hay sesión, se pide ingresar antes.
  const hasSubscription = useMemo(() => items.some((i) => i.subscriptionWeeks), [items]);
  const needsLogin = hasSubscription && !user;

  // Inició el checkout: se dispara una vez, cuando ya hay ítems que pagar.
  const beganCheckoutRef = useRef(false);
  useEffect(() => {
    if (!beganCheckoutRef.current && items.length > 0) {
      beganCheckoutRef.current = true;
      trackBeginCheckout(items, subtotal);
    }
  }, [items, subtotal]);

  // Datos del comprador (compra como invitado o cliente autenticado).
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [rut, setRut] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState(""); // comuna
  const [province, setProvince] = useState(""); // región
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [shipOptions, setShipOptions] = useState<ShippingOptionView[]>([]);
  const [shippingId, setShippingId] = useState<string>("");
  const [policy, setPolicy] = useState<ShippingPolicy | null>(null);
  const [paymentId, setPaymentId] = useState("flow");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Gate de suscripción en contexto (opción A): al pagar sin sesión se abre el
  // modal de identificación; tras autenticar, se retoma el pago automáticamente.
  const [authOpen, setAuthOpen] = useState(false);

  // Prellena una sola vez los datos del cliente autenticado, sin pisar lo que ya
  // escribió (ajuste de estado en render guardado — patrón recomendado de React,
  // ya que el cliente llega asíncrono desde la sesión persistida).
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    if (!firstName) setFirstName(user.firstName ?? "");
    if (!lastName) setLastName(user.lastName ?? "");
    if (!email) setEmail(user.email ?? "");
    if (!rut && user.rut) setRut(user.rut);
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

  // Política de envío real (fuente única del backend) para reflejar el envío gratis.
  useEffect(() => {
    let active = true;
    getShippingPolicy()
      .then((p) => active && setPolicy(p))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Monto que decide el envío gratis: el MISMO que evalúa el backend. La promoción
  // automática (`setup-free-shipping.ts`) tiene la regla sobre `item_total`, así que
  // se lee ese total del carrito real; el subtotal local es solo el respaldo para
  // el instante en que el carrito aún no ha llegado.
  const freeShippingBase = cart?.item_total ?? subtotal;

  // ¿Aplica envío gratis? La regla es del backend (`/store/shipping-policy`): aquí
  // solo se consulta. Mientras la política no llegue, no se asume nada (cobra).
  //
  // Son las DOS ramas de la política, espejo exacto de las dos promociones
  // automáticas que el backend aplica sobre el carrito real: la suscripción incluye
  // el despacho SIN monto mínimo (`ENVIO_GRATIS_SUSCRIPCION`) y, si no la hay,
  // decide el umbral (`ENVIO_GRATIS_30K`). Si esta pantalla evaluara solo el umbral,
  // le mostraría $3.990 a quien se está suscribiendo y el backend cobraría $0.
  const includedBySubscription = Boolean(policy?.subscriptionFreeShipping) && hasSubscription;
  const freeShipping =
    policy != null && (includedBySubscription || freeShippingBase >= policy.freeShippingThreshold);

  // `freeShipping` es la ÚNICA derivación de costo de la pantalla: la aplican por
  // igual las tarjetas de despacho y el resumen, de modo que no puedan mostrar dos
  // cifras distintas para el mismo despacho. El costo efectivo de una opción es $0
  // si la promoción automática aplica —descuenta el 100% del método elegido, sea
  // cual sea— y si no, el precio real que envía Medusa. Nunca un valor hardcodeado.
  const shippingOptionsView: ShippingOption[] = useMemo(
    () =>
      shipOptions.map((o) => ({
        id: o.id,
        label: o.name,
        eta: o.description ?? "Despacho a domicilio",
        cost: freeShipping ? 0 : o.amount,
        icon: <Truck className="size-5 text-text-brand" aria-hidden />,
      })),
    [shipOptions, freeShipping],
  );

  const selectedShippingAmount = shipOptions.find((o) => o.id === shippingId)?.amount ?? 0;
  const shippingCost = freeShipping ? 0 : selectedShippingAmount;
  const total = subtotal + shippingCost;

  // Región → comuna (dependiente). Se guardan por nombre, consistente con las
  // direcciones de la cuenta (región→province, comuna→city).
  const regionOptions: SelectOption[] = useMemo(
    () => REGIONS.map((r) => ({ value: r.name, label: r.name })),
    [],
  );
  const comunaOptions: SelectOption[] = useMemo(
    () => getComunas(province).map((c) => ({ value: c, label: c })),
    [province],
  );

  function handleRegionChange(next: string) {
    setProvince(next);
    // Si la comuna ya elegida no pertenece a la nueva región, la limpiamos.
    if (city && !getComunas(next).includes(city)) setCity("");
  }

  /**
   * Persistencia temprana del correo (D79) — el comprador termina de escribirlo y
   * el carrito ya queda identificado, sin esperar a que apriete "Pagar".
   *
   * Sin esto, `setCheckoutInfo` era el único que escribía el email y solo corre al
   * enviar el pago: quien llenaba su correo y se iba quedaba anónimo en el funnel,
   * justo el segmento más valioso para recuperar (dejó contacto y tenía intención).
   *
   * Tres guardas para que NUNCA pueda estorbar al pago, que es lo único innegociable:
   *  1. No corre si ya se está enviando el pago.
   *  2. No repite la llamada si el correo no cambió desde la última vez.
   *  3. `submitPayment` **espera** esta promesa antes de tocar el carrito. Es la
   *     guarda importante: `updateCartWorkflow` toma un lock sobre el carrito con
   *     timeout de 2 s, así que dos escrituras solapadas podrían hacer fallar el
   *     pago. Encadenándolas, la contención simplemente no existe.
   * Y es best-effort de punta a punta: si falla, se traga el error en silencio —
   * perder una medición jamás puede costar una venta.
   */
  const emailPersistRef = useRef<Promise<void> | null>(null);
  const persistedEmailRef = useRef<string | null>(null);

  function persistEmail() {
    const value = email.trim();
    if (!cartId || submitting) return;
    if (!EMAIL_RE.test(value)) return;
    if (persistedEmailRef.current === value) return;
    persistedEmailRef.current = value;
    emailPersistRef.current = setCartEmail(cartId, value).catch(() => {
      // Reintentar en el siguiente blur si no quedó guardado.
      persistedEmailRef.current = null;
    });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Cuéntanos tu nombre";
    if (!lastName.trim()) e.lastName = "Falta tu apellido";
    if (!EMAIL_RE.test(email)) e.email = "Revisa tu correo";
    if (!rut.trim()) e.rut = "Ingresa tu RUT";
    else if (!isValidRut(rut)) e.rut = "Revisa tu RUT";
    if (!address1.trim()) e.address1 = "Ingresa tu dirección";
    if (!province.trim()) e.province = "Elige tu región";
    if (!city.trim()) e.city = "Elige tu comuna";
    if (!shippingId) e.shipping = "Elige un despacho";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // CTA de pago: valida el formulario, luego decide identidad. Suscribir requiere
  // cuenta → si falta sesión, identifica EN CONTEXTO (modal) en vez de rebotar a
  // /ingresar (que hacía perder el carrito y caer en onboarding). Al autenticar,
  // `onAuthenticated` retoma `submitPayment` directo (la sesión ya quedó iniciada).
  function pay() {
    if (!cartId || submitting) return;
    setSubmitError(null);
    if (!validate()) return;
    if (needsLogin) {
      setAuthOpen(true);
      return;
    }
    void submitPayment();
  }

  async function submitPayment() {
    if (!cartId || submitting || !validate()) return;
    setSubmitError(null);

    const address: CheckoutAddress = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      address_1: address1.trim(),
      city: city.trim(),
      province: province.trim() || undefined,
      phone: phone.trim() || undefined,
      country_code: "cl",
    };
    const rutFormatted = formatRut(rut);

    setSubmitting(true);
    try {
      // Si la persistencia temprana del correo (D79) está en vuelo, se espera aquí:
      // `updateCartWorkflow` toma un lock sobre el carrito y dos escrituras
      // solapadas podrían agotar su timeout de 2 s y tumbar el pago. Encadenarlas
      // elimina la contención. La promesa ya trae su propio catch, así que un fallo
      // de la medición no puede propagarse a esta ruta.
      await emailPersistRef.current;
      // Prepara el carrito. El RUT viaja en metadata (→ orden). El monto NO se
      // envía: el backend cobra el total del carrito.
      await setCheckoutInfo(cartId, email.trim(), address, rutFormatted);
      // Cliente autenticado: guardamos el RUT para prellenar futuras compras
      // (best-effort — nunca bloquea el pago).
      if (user) void saveCustomerRut(rutFormatted).catch(() => {});
      await selectShippingMethod(cartId, shippingId);
      // Suscripción → tokeniza la tarjeta (Modelo A). Compra única → cobro directo.
      const { url } = hasSubscription
        ? await createSubscriptionPayment(cartId)
        : await createFlowPayment(cartId);
      // Snapshot para medir la compra al volver de Flow (el carrito se vacía en
      // la confirmación, recién con el pago confirmado). No bloquea si falla.
      try {
        sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify({ items, total }));
      } catch {
        /* almacenamiento no disponible: la analítica degrada, el pago sigue */
      }
      // Redirige al checkout de Flow (el usuario elige el medio de pago allí).
      window.location.href = url;
      // No reseteamos `submitting`: dejamos la página. Si algo falla, el catch lo hace.
    } catch (err) {
      setSubmitError(toPaymentErrorMessage(err));
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
                  <Input label="Nombre" placeholder="Juan" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.firstName} className="flex-1" required />
                  <Input label="Apellido" placeholder="Pérez" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.lastName} className="flex-1" required />
                </Row>
                <Input type="email" label="Correo para la confirmación y el seguimiento" placeholder="tucorreo@ejemplo.cl" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={persistEmail} error={errors.email} className="max-w-md" required />
                <Input label="RUT (para tu boleta)" placeholder="12.345.678-9" inputMode="text" autoComplete="off" value={rut} onChange={(e) => setRut(e.target.value)} onBlur={() => rut.trim() && setRut(formatRut(rut))} error={errors.rut} className="max-w-md" required />
              </Block>

              {/* Dirección de entrega */}
              <Block title="Dirección de entrega">
                <Stack gap={3} className="max-w-md">
                  <Input label="Dirección" placeholder="Calle y número, depto/casa" autoComplete="street-address" value={address1} onChange={(e) => setAddress1(e.target.value)} error={errors.address1} required />
                  <Row gap={3} wrap>
                    <div className="w-full sm:flex-1">
                      <Select label="Región" placeholder="Elige tu región" options={regionOptions} value={province} onValueChange={handleRegionChange} error={errors.province} required />
                    </div>
                    <div className="w-full sm:flex-1">
                      <Select label="Comuna" placeholder={province ? "Elige tu comuna" : "Primero elige la región"} options={comunaOptions} value={city} onValueChange={setCity} error={errors.city} disabled={!province} required />
                    </div>
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
                {/* Por qué cuesta lo que cuesta: el monto solo, sin razón, es lo que
                    hace dudar justo antes de pagar. */}
                {policy && (
                  <p className={cn("text-[13px]", freeShipping ? "text-success-strong" : "text-text-secondary")}>
                    {shippingReasonLabel(policy, { free: freeShipping, bySubscription: includedBySubscription })}
                  </p>
                )}
                {errors.shipping && <p className="text-sm text-danger">{errors.shipping}</p>}
              </Block>

              {/* Pago: Flow (elige el medio en su checkout tras la redirección) */}
              <Block title="¿Cómo pagas?">
                <PaymentMethod options={PAYMENT_OPTIONS} value={paymentId} onValueChange={setPaymentId} />
                <p className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                  <ShieldCheck className="size-4 text-[var(--success)]" aria-hidden />
                  Te llevamos al checkout seguro de Flow para completar el pago. Preparamos tu pedido apenas se confirme.
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
                          <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-white text-xl" aria-hidden>
                            <ProductImage image={i.product.imageUrl} alt={i.product.name} sizes="40px" />
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

                {needsLogin && (
                  <Alert variant="info">
                    Tu pedido incluye una suscripción. Al pagar te pediremos ingresar o crear tu
                    cuenta —sin salir de aquí— para guardar tu plan y tu medio de pago de forma
                    segura.
                  </Alert>
                )}

                <OrderSummary
                  subtotal={subtotal}
                  shipping={shippingCost}
                  note="Al pagar aceptas los términos. Te llevamos a Flow para completar el pago de forma segura."
                >
                  <Button block size="lg" onClick={pay} disabled={submitting || isLoading}>
                    {submitting
                      ? "Redirigiéndote a Flow…"
                      : hasSubscription
                        ? `Suscribirme y pagar ${formatCLP(total)}`
                        : `Pagar ${formatCLP(total)}`}
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

      {/* Gate de suscripción en contexto: identificarse sin abandonar el checkout. */}
      <AuthSheet
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthenticated={() => {
          // La sesión ya quedó iniciada en el backend (login/register hicieron
          // transferCart + refresh): retomamos el pago sin esperar el re-render.
          setAuthOpen(false);
          void submitPayment();
        }}
      />
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
