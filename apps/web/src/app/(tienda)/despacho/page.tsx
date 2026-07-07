import type { Metadata } from "next";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";
import { getShippingPolicy } from "@/lib/medusa";
import { formatCLP } from "@/lib/format";

export const metadata: Metadata = { title: "Despacho y cobertura" };

// El costo/umbral vienen de la política real del backend (fuente única).
export const dynamic = "force-dynamic";

export default async function DespachoPage() {
  const policy = await getShippingPolicy();

  return (
    <ContentPage
      title="Despacho y cobertura"
      lead="El costo real, siempre antes de pagar. Sin sorpresas."
    >
      <ProseBlock heading="Despacho honesto">
        <p>
          En el carrito y al momento de pagar ves el costo real de tu despacho: lo que ves es lo que
          pagas. Coordinamos la entrega contigo después de la compra y te avisamos cuando tu pedido
          vaya en camino.
        </p>
      </ProseBlock>
      <ProseBlock heading="Envío gratis">
        <p>
          Tienes despacho gratis en compras sobre {formatCLP(policy.freeShippingThreshold)}. Bajo ese
          monto, el despacho estándar cuesta {formatCLP(policy.baseShippingAmount)}. En el carrito te
          mostramos cuánto te falta para alcanzar el envío gratis.
        </p>
      </ProseBlock>
      <ProseBlock heading="Cobertura">
        <p>
          Hoy despachamos en la Región Metropolitana y seguimos sumando comunas. También puedes
          retirar en tienda cuando esté disponible para tu zona.
        </p>
      </ProseBlock>
    </ContentPage>
  );
}
