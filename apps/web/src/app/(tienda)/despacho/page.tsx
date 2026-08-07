import type { Metadata } from "next";
import { ContentPage, ProseBlock, ProseList } from "@/components/layout/content-page";
import { getShippingPolicy } from "@/lib/medusa";
import { formatCLP } from "@/lib/format";

export const metadata: Metadata = {
  title: "Despacho y cobertura",
  alternates: { canonical: "/despacho" },
};

// El costo/umbral vienen de la política real del backend (fuente única).
export const dynamic = "force-dynamic";

export default async function DespachoPage() {
  const policy = await getShippingPolicy();

  return (
    <ContentPage
      title="Despacho y cobertura"
      lead={
        policy.subscriptionFreeShipping
          ? `Con suscripción, el despacho es gratis siempre. En una compra única, es gratis sobre ${formatCLP(policy.freeShippingThreshold)}.`
          : `El despacho es gratis en compras sobre ${formatCLP(policy.freeShippingThreshold)}.`
      }
    >
      <ProseBlock heading="Cuánto cuesta">
        <p>Son dos casos y no hay más letra chica que esta:</p>
        <ProseList>
          {policy.subscriptionFreeShipping && (
            <li>
              <strong>Con suscripción: gratis.</strong> Si tu pedido lleva un producto suscrito, no
              pagas despacho — ni en la primera entrega ni en las que siguen. Sin monto mínimo.
            </li>
          )}
          <li>
            <strong>Compra única: gratis sobre {formatCLP(policy.freeShippingThreshold)}.</strong>{" "}
            Bajo ese monto, el despacho estándar cuesta {formatCLP(policy.baseShippingAmount)}. En el
            carrito te mostramos cuánto te falta para llegar.
          </li>
        </ProseList>
      </ProseBlock>
      <ProseBlock heading="Lo que ves es lo que pagas">
        <p>
          El costo aparece en el carrito y al momento de pagar, antes de que confirmes nada: no hay
          cargos que aparezcan al final. Coordinamos la entrega contigo después de la compra y te
          avisamos cuando tu pedido vaya en camino.
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
