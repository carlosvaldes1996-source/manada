"use client";

import * as React from "react";
import Link from "next/link";
import { Bone, CreditCard, Heart, Pill, ShoppingBag, Truck } from "lucide-react";
import {
  Alert,
  Avatar,
  Badge,
  Banner,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Chip,
  Combobox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Grid,
  IconButton,
  Input,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Price,
  Progress,
  Radio,
  RadioGroup,
  Rating,
  SearchBar,
  Section,
  Select,
  Skeleton,
  Slider,
  Stack,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  QuantitySelector,
  useToast,
} from "@/components/ui";
import {
  BrandCard,
  CartItem,
  CategoryCard,
  CheckoutStepper,
  Coupon,
  DiscountBadge,
  FreeShippingBar,
  HonestShippingBlock,
  OrderSummary,
  PaymentMethod,
  PersonalizationBanner,
  ProductCard,
  ProductGrid,
  ProductRail,
  ReviewCard,
  ShippingMethod,
  StockBadge,
  SubscriptionBadge,
  SubscriptionBox,
  FiltersSidebar,
  type FilterSelection,
} from "@/components/commerce";
import {
  AnticipationCapsule,
  FeedingSchedule,
  PetCard,
  PetEditCard,
  PetProfileHeader,
  PetStatus,
  RecommendationCard,
} from "@/components/pet";
import { Header } from "@/components/layout";
import { useCart } from "@/components/providers";
import {
  BRANDS,
  CATEGORIES,
  DEMO_CART,
  DEMO_NUDGE,
  DEMO_PETS,
  DEMO_SHIPPING,
  FILTER_GROUPS,
  PRODUCTS,
  REVIEWS,
} from "@/lib/demo-data";
import { Demo, GuideSection, Labeled, type SectionDef } from "./parts";

const SECTIONS: SectionDef[] = [
  { id: "layout", label: "Layout" },
  { id: "buttons", label: "Botones" },
  { id: "badges", label: "Badges y chips" },
  { id: "cards", label: "Tarjetas" },
  { id: "data", label: "Datos" },
  { id: "forms", label: "Formularios" },
  { id: "feedback", label: "Feedback" },
  { id: "overlays", label: "Overlays" },
  { id: "navigation", label: "Navegación" },
  { id: "chrome", label: "Chrome" },
  { id: "commerce", label: "Commerce" },
  { id: "pet", label: "Mascotas" },
];

const pet = DEMO_PETS[0];
const product = PRODUCTS[0];

export default function ComponentsGuide() {
  return (
    <div className="mx-auto flex w-full max-w-[var(--container-max)] gap-10 px-4 md:px-8">
      <Sidebar />
      <main className="min-w-0 flex-1 py-10">
        <header className="flex flex-col gap-2 pb-6">
          <span className="overline text-text-brand">🐾 Manada · Design System</span>
          <h1 className="display-l text-text-primary">Librería de componentes</h1>
          <p className="body-l max-w-2xl text-text-secondary">
            Fase 3 · Etapa 2. Todos los componentes reutilizables de Manada, con sus variantes y
            cuándo usar cada uno. Construido sobre los design tokens (
            <Link href="/dev/tokens" className="text-text-brand underline-offset-2 hover:underline">
              ver tokens
            </Link>
            ).
          </p>
        </header>

        <LayoutSection />
        <ButtonsSection />
        <BadgesSection />
        <CardsSection />
        <DataSection />
        <FormsSection />
        <FeedbackSection />
        <OverlaysSection />
        <NavigationSection />
        <ChromeSection />
        <CommerceSection />
        <PetSection />
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-52 shrink-0 overflow-auto py-10 lg:block">
      <p className="overline px-2 text-text-muted">Secciones</p>
      <nav className="mt-2 flex flex-col">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-md px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary"
          >
            {s.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

/* ----------------------------------- Layout ----------------------------------- */
function LayoutSection() {
  return (
    <GuideSection id="layout" title="Layout" blurb="Primitivas estructurales: centran, espacian y distribuyen. Sin estilo propio más allá del ritmo.">
      <Demo name="Container · Section" when="Centran el contenido (máx 1280) con paddings responsive y bandas verticales con tono.">
        <div className="w-full overflow-hidden rounded-[var(--radius-md)] border border-border-default">
          <Section spacing="sm" tone="brand" className="text-center">
            <p className="body-m text-text-primary">Section tone=&quot;brand&quot; + Container</p>
          </Section>
          <Section spacing="sm" tone="subtle" className="text-center">
            <p className="body-m text-text-primary">Section tone=&quot;subtle&quot;</p>
          </Section>
        </div>
      </Demo>
      <Demo name="Grid" when="Grilla responsive declarativa (cols/sm/md/lg). La grilla de catálogo es 2→3→4.">
        <Grid cols={2} md={4} gap={3} className="w-full">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="grid h-16 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-text-brand">
              {n}
            </div>
          ))}
        </Grid>
      </Demo>
      <Demo name="Stack · Row" when="Flex 1D con la escala de gap del sistema. Stack = vertical, Row = horizontal centrado.">
        <Stack gap={2} className="rounded-[var(--radius-md)] bg-subtle p-4">
          <div className="rounded bg-surface px-4 py-2 text-sm">Item A</div>
          <div className="rounded bg-surface px-4 py-2 text-sm">Item B</div>
          <div className="rounded bg-surface px-4 py-2 text-sm">Item C</div>
        </Stack>
      </Demo>
    </GuideSection>
  );
}

/* ----------------------------------- Buttons ---------------------------------- */
function ButtonsSection() {
  return (
    <GuideSection id="buttons" title="Botones" blurb="Una acción primaria (Terracota) por vista. Miel = suscripción/anticipación. Pino nunca es acción.">
      <Demo name="Button · variantes" when="primary = acción; secondary/ghost = secundarias; subscribe = Miel; link = enlace de acción.">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="subscribe" leadingIcon={<Heart className="size-4" />}>Suscribe</Button>
        <Button variant="link">Link</Button>
        <Button variant="destructive">Destructive</Button>
      </Demo>
      <Demo name="Button · tamaños y estados" when="sm/md/lg, bloque completo, loading y disabled.">
        <Button size="sm">sm</Button>
        <Button size="md">md</Button>
        <Button size="lg">lg</Button>
        <Button loading>Procesando</Button>
        <Button disabled>Disabled</Button>
        <Button asChild><Link href="#buttons">asChild → Link</Link></Button>
      </Demo>
      <Demo name="IconButton · Fab" when="IconButton: acción de solo ícono (exige label a11y). Fab: acción flotante persistente.">
        <IconButton label="Favorito"><Heart className="size-5" /></IconButton>
        <IconButton label="Comprar" variant="solid"><ShoppingBag className="size-5" /></IconButton>
        <IconButton label="Comprar" variant="outline"><ShoppingBag className="size-5" /></IconButton>
        <span className="text-[13px] text-text-muted">(El FAB se fija a la pantalla; ver Commerce.)</span>
      </Demo>
    </GuideSection>
  );
}

/* ------------------------------------ Badges ---------------------------------- */
function BadgesSection() {
  const [active, setActive] = React.useState(true);
  return (
    <GuideSection id="badges" title="Badges y chips" blurb="Etiquetas de estado (no interactivas) y chips (filtros/selección). Siempre color + ícono/texto.">
      <Demo name="Badge" when="Estado semántico compacto: stock, suscripción, info, error…">
        <Badge>Neutral</Badge>
        <Badge variant="subscribe">Suscripción</Badge>
        <Badge variant="success">Éxito</Badge>
        <Badge variant="urgency">Urgencia</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="brand">Marca</Badge>
      </Demo>
      <Demo name="Chip" when="Filtro/selección interactiva con aria-pressed. removable = filtro aplicado.">
        <Chip active={active} onToggle={setActive}>Perro</Chip>
        <Chip>Gato</Chip>
        <Chip icon={<Pill className="size-4" />}>Farmacia</Chip>
        <Chip active removable onRemove={() => {}}>Adulto</Chip>
      </Demo>
    </GuideSection>
  );
}

/* ------------------------------------- Cards ---------------------------------- */
function CardsSection() {
  return (
    <GuideSection id="cards" title="Tarjetas" blurb="Unidad base de agrupación: superficie blanca, radio lg, sombra sm.">
      <Demo name="Card" when="Contenedor genérico. interactive eleva la sombra al hover.">
        <Card className="w-60">
          <p className="heading-4 text-text-primary">Card simple</p>
          <p className="mt-1 body-s text-text-secondary">Padding 24, sombra sm.</p>
        </Card>
        <Card interactive className="w-60">
          <p className="heading-4 text-text-primary">Card interactive</p>
          <p className="mt-1 body-s text-text-secondary">Hover → sombra md + sube.</p>
        </Card>
      </Demo>
    </GuideSection>
  );
}

/* ------------------------------------- Data ----------------------------------- */
function DataSection() {
  return (
    <GuideSection id="data" title="Datos" blurb="Precio, valoración, progreso, avatar y skeleton. Cifras en Hanken tabular.">
      <Demo name="Price" when="CLP tabular. El precio anterior va tachado en gris, nunca en rojo de oferta.">
        <Labeled label="con rebaja"><Price now={24990} was={29990} size="lg" /></Labeled>
        <Labeled label="simple"><Price now={54990} size="lg" /></Labeled>
      </Demo>
      <Demo name="Rating" when="Estrellas Miel con relleno parcial; el valor va como texto accesible.">
        <Rating value={4.8} count={212} />
        <Rating value={3.5} count={12} />
      </Demo>
      <Demo name="Progress" when="Completitud de perfil, días de comida, envío gratis. role=progressbar.">
        <div className="flex w-full flex-col gap-3">
          <Progress value={75} tone="miel" label="75%" />
          <Progress value={40} tone="brand" />
          <Progress value={100} tone="success" />
        </div>
      </Demo>
      <Demo name="Avatar" when="Foto real (preferida) o fallback emoji/iniciales sobre degradado cálido.">
        <Labeled label="sm"><Avatar emoji="🐶" size="sm" /></Labeled>
        <Labeled label="md"><Avatar emoji="🐱" size="md" /></Labeled>
        <Labeled label="lg"><Avatar initials="C" size="lg" /></Labeled>
        <Labeled label="xl"><Avatar emoji="🐾" size="xl" /></Labeled>
      </Demo>
      <Demo name="Skeleton" when="Placeholder de carga con shimmer cálido (no spinners donde hay layout).">
        <div className="flex w-full gap-4">
          <Skeleton shape="circle" className="size-12" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton shape="text" className="w-1/3" />
            <Skeleton shape="text" className="w-2/3" />
          </div>
        </div>
      </Demo>
    </GuideSection>
  );
}

/* ------------------------------------ Forms ----------------------------------- */
function FormsSection() {
  const [qty, setQty] = React.useState(1);
  const [range, setRange] = React.useState([10000, 40000]);
  const [city, setCity] = React.useState<string>();
  return (
    <GuideSection id="forms" title="Formularios" blurb="Controles accesibles (Radix por debajo) con Field para label/hint/error y aria cableado.">
      <Demo name="Input · Textarea" when="Texto de una o varias líneas. label/hint/error auto-envuelven en Field." canvasClassName="flex-col items-stretch">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Input label="Nombre de tu mascota" placeholder="Ej: Toby" hint="Así personalizamos tu experiencia." />
          <Input label="Email" type="email" placeholder="tu@correo.cl" error="Ingresa un email válido" defaultValue="malo@" />
          <Input label="Monto" leading="$" placeholder="0" />
          <Textarea label="Notas para el despacho" placeholder="Deja el pedido en conserjería…" />
        </div>
      </Demo>
      <Demo name="Select · Combobox" when="Select para pocas opciones; Combobox (filtrable) cuando son muchas." canvasClassName="flex-col items-stretch">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Select
            label="Etapa de vida"
            options={[
              { value: "cachorro", label: "Cachorro" },
              { value: "adulto", label: "Adulto" },
              { value: "senior", label: "Senior" },
            ]}
            defaultValue="adulto"
          />
          <Combobox
            label="Comuna de despacho"
            options={["Ñuñoa", "Providencia", "Las Condes", "Maipú", "La Florida", "Puente Alto"].map((c) => ({ value: c, label: c }))}
            value={city}
            onValueChange={setCity}
            placeholder="Busca tu comuna"
          />
        </div>
      </Demo>
      <Demo name="Checkbox · Radio · Switch" when="Selección múltiple, única y on/off. Switch encendido = Miel.">
        <div className="flex flex-col gap-1">
          <Checkbox label="Royal Canin" meta={124} defaultChecked />
          <Checkbox label="Pro Plan" meta={86} />
        </div>
        <RadioGroup defaultValue="b" className="ml-8">
          <Radio value="a" label="Retiro en tienda" />
          <Radio value="b" label="Despacho a domicilio" />
        </RadioGroup>
        <div className="ml-8 w-56">
          <Switch label="Suscripción" description="Ahorra 15% en cada entrega" defaultChecked />
        </div>
      </Demo>
      <Demo name="Slider · QuantitySelector" when="Rango (precio en filtros) y cantidad (carrito/PDP).">
        <div className="w-72">
          <Slider min={0} max={60000} step={1000} value={range} onValueChange={setRange} label="Rango de precio" formatValue={(v) => `$${v[0].toLocaleString("es-CL")} – $${v[1].toLocaleString("es-CL")}`} />
        </div>
        <QuantitySelector value={qty} onChange={setQty} />
      </Demo>
    </GuideSection>
  );
}

/* ----------------------------------- Feedback --------------------------------- */
function FeedbackSection() {
  const { toast } = useToast();
  return (
    <GuideSection id="feedback" title="Feedback" blurb="Alertas contextuales, banners globales, toasts efímeros, tooltips y popovers.">
      <Demo name="Alert" when="Mensaje contextual dentro del flujo (validación, aviso). Color + ícono + texto." canvasClassName="flex-col items-stretch">
        <Alert variant="info" title="Despacho a Ñuñoa">Llega mañana sin costo sobre $30.000.</Alert>
        <Alert variant="success" title="Pago aprobado">Te enviamos la boleta a tu correo.</Alert>
        <Alert variant="urgency" title="Stock bajo">Quedan pocas unidades de este formato.</Alert>
        <Alert variant="error" title="No pudimos procesar el pago">Revisa los datos de tu tarjeta.</Alert>
      </Demo>
      <Demo name="Banner" when="Anuncio full-width (envío gratis, aviso de marca). Opcionalmente descartable." canvasClassName="flex-col items-stretch p-0">
        <Banner tone="accent" icon={<Truck className="size-4" />}>Envío gratis en compras sobre $30.000 🎉</Banner>
        <Banner tone="pino" dismissible>Nuevo: farmacia con receta en línea.</Banner>
      </Demo>
      <Demo name="Toast" when="Feedback efímero tras una acción (agregar al carrito). Vía useToast().">
        <Button onClick={() => toast({ title: "Agregado al carrito", description: "Royal Canin · Adulto", variant: "success", action: { label: "Ver carrito", onClick: () => {} } })}>Toast éxito</Button>
        <Button variant="secondary" onClick={() => toast({ title: "Guardamos tu preferencia", variant: "info" })}>Toast info</Button>
      </Demo>
      <Demo name="Tooltip · Popover · EmptyState" when="Tooltip: pista breve. Popover: contenido rico (¿por qué?). EmptyState: vacío cálido.">
        <Tooltip content="Te lo enviamos sin costo"><Button variant="ghost">Hover tooltip</Button></Tooltip>
        <Popover>
          <PopoverTrigger className="text-sm font-semibold text-text-brand underline-offset-2 hover:underline">¿Por qué te lo recomendamos?</PopoverTrigger>
          <PopoverContent>Porque Toby es adulto de 8 kg y este formato le rinde ~30 días.</PopoverContent>
        </Popover>
      </Demo>
      <Demo name="EmptyState" when="Carrito/búsqueda sin resultados. Ilustración + copy amable + acción." canvasClassName="block">
        <EmptyState icon="🛒" title="Tu carrito está vacío" description="Cuando agregues productos, aparecerán aquí." action={<Button>Explorar catálogo</Button>} />
      </Demo>
    </GuideSection>
  );
}

/* ----------------------------------- Overlays --------------------------------- */
function OverlaysSection() {
  return (
    <GuideSection id="overlays" title="Overlays" blurb="Diálogo modal y paneles deslizantes (Drawer/Sheet) — foco-trap, ESC y scroll-lock (Radix).">
      <Demo name="Dialog" when="Confirmaciones y formularios cortos centrados.">
        <Dialog>
          <DialogTrigger asChild><Button variant="secondary">Abrir diálogo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Reagendar la entrega de Toby?</DialogTitle>
              <DialogDescription>La adelantaremos para que no se quede sin comida.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost">Cancelar</Button>
              <Button>Reagendar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <span className="text-[13px] text-text-muted">(El Drawer del carrito está en Commerce; el Sheet de filtros en la PLP.)</span>
      </Demo>
    </GuideSection>
  );
}

/* ---------------------------------- Navigation -------------------------------- */
function NavigationSection() {
  const [page, setPage] = React.useState(3);
  return (
    <GuideSection id="navigation" title="Navegación" blurb="Migas, paginación, búsqueda y pestañas.">
      <Demo name="Breadcrumb" when="Orientación jerárquica en PLP/PDP. El último item es la página actual.">
        <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Perro", href: "/categoria/perro" }, { label: "Alimento adulto" }]} />
      </Demo>
      <Demo name="SearchBar" when="Búsqueda prominente del catálogo. role=search con limpiar.">
        <div className="w-full max-w-md"><SearchBar /></div>
      </Demo>
      <Demo name="Tabs" when="Secciones de la PDP (Descripción · Ingredientes · Opiniones)." canvasClassName="block">
        <Tabs defaultValue="desc">
          <TabsList>
            <TabsTrigger value="desc">Descripción</TabsTrigger>
            <TabsTrigger value="ing">Ingredientes</TabsTrigger>
            <TabsTrigger value="op">Opiniones</TabsTrigger>
          </TabsList>
          <TabsContent value="desc"><p className="body-m text-text-secondary">Alimento balanceado para razas pequeñas adultas.</p></TabsContent>
          <TabsContent value="ing"><p className="body-m text-text-secondary">Pollo, arroz, grasas, vitaminas…</p></TabsContent>
          <TabsContent value="op"><p className="body-m text-text-secondary">4,8 ★ sobre 212 opiniones.</p></TabsContent>
        </Tabs>
      </Demo>
      <Demo name="Pagination" when="Catálogo paginado. Números con elipsis + prev/next.">
        <Pagination page={page} totalPages={12} onPageChange={setPage} />
      </Demo>
    </GuideSection>
  );
}

/* ------------------------------------ Chrome ---------------------------------- */
function ChromeSection() {
  return (
    <GuideSection id="chrome" title="Chrome" blurb="El esqueleto de la app: AppShell envuelve Header (con Navbar/MegaMenu/PetSwitcher), Footer y BottomNav.">
      <Demo name="Header" when="Sticky con blur: logo · buscador · selector de mascota · carrito. Navbar por necesidad en desktop." canvasClassName="block p-0 overflow-hidden">
        <div className="relative">
          <Header />
        </div>
        <p className="px-6 py-3 text-[13px] text-text-muted">AppShell además monta Footer y BottomNav (móvil). Variante &quot;checkout&quot; = header mínimo.</p>
      </Demo>
    </GuideSection>
  );
}

/* ----------------------------------- Commerce --------------------------------- */
function CommerceSection() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [filters, setFilters] = React.useState<FilterSelection>({ especie: ["perro"] });
  return (
    <GuideSection id="commerce" title="Commerce" blurb="Componentes de dominio e-commerce: catálogo, despacho honesto, suscripción y checkout.">
      <Demo name="ProductCard" when="Unidad central del catálogo. Conecta con el carrito y emite toast al agregar.">
        <div className="w-64"><ProductCard product={product} shipping={DEMO_SHIPPING} /></div>
      </Demo>
      <Demo name="Badges de e-commerce" when="Stock, descuento, suscripción y despacho honesto compacto.">
        <StockBadge stock={24} />
        <StockBadge stock={3} />
        <StockBadge stock={0} />
        <DiscountBadge percent={17} />
        <SubscriptionBadge discount={15} />
      </Demo>
      <Demo name="HonestShippingBlock" when="Fecha y costo reales, siempre visibles. Nunca en letra chica.">
        <HonestShippingBlock date={DEMO_SHIPPING.date} cost={0} comuna="Ñuñoa" size="md" />
      </Demo>
      <Demo name="ProductGrid" when="Grilla 2→3→4 con estados loading y empty integrados." canvasClassName="block">
        <ProductGrid products={PRODUCTS.slice(0, 4)} shipping={DEMO_SHIPPING} />
      </Demo>
      <Demo name="ProductRail" when="Carrusel horizontal (cross-sell, destacados de Home)." canvasClassName="block">
        <ProductRail title="Para la manada de Toby" overline="Cross-sell" products={PRODUCTS} href="/categoria/todo" />
      </Demo>
      <Demo name="CategoryCard · BrandCard" when="Accesos por necesidad y por marca.">
        {CATEGORIES.slice(0, 2).map((c) => (
          <div key={c.id} className="w-48"><CategoryCard label={c.label} href={`/categoria/${c.slug}`} icon={c.emoji} description={c.description} /></div>
        ))}
        <div className="w-40"><BrandCard brand={BRANDS[0]} href="/categoria/marcas" /></div>
      </Demo>
      <Demo name="PersonalizationBanner · FreeShippingBar" when="Catálogo personalizado y progreso a envío gratis." canvasClassName="flex-col items-stretch">
        <PersonalizationBanner pet={pet} action={<Button variant="link" size="sm">Quitar</Button>} />
        <FreeShippingBar subtotal={22000} threshold={30000} />
        <FreeShippingBar subtotal={32000} threshold={30000} />
      </Demo>
      <Demo name="SubscriptionBox" when="Caja de suscripción de la PDP (acento Miel). Frecuencia + ahorro." canvasClassName="block">
        <div className="max-w-md"><SubscriptionBox product={product} /></div>
      </Demo>
      <Demo name="FiltersSidebar" when="Filtros del catálogo (sidebar desktop / sheet móvil)." canvasClassName="block">
        <FiltersSidebar groups={FILTER_GROUPS} value={filters} onChange={setFilters} className="!block max-w-xs" />
      </Demo>
      <Demo name="CartItem" when="Línea de carrito: cantidad, subtotal y eliminar. Página y drawer." canvasClassName="block">
        <div className="max-w-md">
          {(items.length ? items : DEMO_CART).slice(0, 2).map((line) => (
            <CartItem key={line.product.id} line={line} onQuantityChange={updateQuantity} onRemove={removeItem} />
          ))}
        </div>
      </Demo>
      <Demo name="OrderSummary · Coupon" when="Resumen de compra con desglose honesto + cupón." canvasClassName="items-start">
        <div className="w-72">
          <OrderSummary subtotal={subtotal || 73970} savings={3750} shipping={0}>
            <Button block size="lg">Ir a pagar</Button>
          </OrderSummary>
        </div>
        <div className="w-72"><Coupon onApply={(c) => (c === "MANADA10" ? null : "Cupón no válido")} /></div>
      </Demo>
      <Demo name="ShippingMethod · PaymentMethod" when="Selección de despacho y pago con radio-cards." canvasClassName="items-start">
        <div className="w-72">
          <ShippingMethod
            value="express"
            onValueChange={() => {}}
            options={[
              { id: "express", label: "Despacho express", eta: "Llega mañana", cost: 0, icon: <Truck className="size-5" /> },
              { id: "normal", label: "Despacho normal", eta: "2–3 días hábiles", cost: 2990, icon: <Truck className="size-5" /> },
            ]}
          />
        </div>
        <div className="w-72">
          <PaymentMethod
            value="webpay"
            onValueChange={() => {}}
            options={[
              { id: "webpay", label: "Webpay", description: "Débito o crédito", icon: <CreditCard className="size-5" /> },
              { id: "transfer", label: "Transferencia", description: "Descuento 3%", icon: <Bone className="size-5" /> },
            ]}
          />
        </div>
      </Demo>
      <Demo name="CheckoutStepper" when="Progreso del checkout (Pino). Completados en verde." canvasClassName="items-start gap-12">
        <CheckoutStepper current={1} steps={[{ title: "Despacho", description: "Dónde lo enviamos" }, { title: "Pago", description: "Cómo pagas" }, { title: "Confirmación" }]} />
      </Demo>
      <Demo name="ReviewCard" when="Reseña de la PDP: autor, estrellas, compra verificada y mención a la mascota." canvasClassName="block">
        <div className="max-w-lg">
          {REVIEWS.slice(0, 2).map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </Demo>
    </GuideSection>
  );
}

/* ------------------------------------- Pet ------------------------------------ */
function PetSection() {
  return (
    <GuideSection id="pet" title="Mascotas" blurb="El núcleo del producto (el moat). El perfil de la mascota es protagonista y alimenta la anticipación.">
      <Demo name="AnticipationCapsule" when="El momento 'se adelantó por mí'. Entra con slide+fade y un pulso Miel." canvasClassName="block">
        <AnticipationCapsule petName={pet.name} daysLeft={5} percentLeft={18} runOutDate={DEMO_SHIPPING.date} reason={DEMO_NUDGE.reason} onReschedule={() => {}} onSubscribe={() => {}} />
      </Demo>
      <Demo name="PetProfileHeader" when="Cabecera del perfil: avatar, nombre como héroe y completitud." canvasClassName="block">
        <PetProfileHeader pet={pet} action={<Button variant="secondary" size="sm">Editar</Button>} />
      </Demo>
      <Demo name="PetCard · PetStatus" when="Resumen de mascota para 'Mis mascotas' y fila de badges de estado.">
        <div className="w-72"><PetCard pet={pet} href="/cuenta/mascotas" active /></div>
        <PetStatus pet={pet} show={["species", "stage", "weight", "breed"]} />
      </Demo>
      <Demo name="PetEditCard" when="Dato editable del perfil. Vacío = invitación cálida a completar." canvasClassName="items-stretch">
        <div className="w-56"><PetEditCard label="Peso" value="8 kg" onEdit={() => {}} /></div>
        <div className="w-56"><PetEditCard label="Raza" emptyHint="¿Qué raza es?" onEdit={() => {}} /></div>
      </Demo>
      <Demo name="FeedingSchedule · RecommendationCard" when="Ración calculada y recomendación con motivo transparente." canvasClassName="items-start">
        <div className="w-72"><FeedingSchedule pet={pet} /></div>
        <div className="w-80"><RecommendationCard eyebrow={`Para ${pet.name}`} title="NexGard antiparasitario" description="Toca su desparasitación trimestral." media="💊" reason="Según el peso de Toby (8 kg) y la fecha de la última dosis." action={<Button size="sm" variant="subscribe">Agregar</Button>} /></div>
      </Demo>
    </GuideSection>
  );
}
