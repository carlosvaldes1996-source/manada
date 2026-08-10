import type { Metadata } from "next";
import { ContentPage, ProseBlock, ProseList } from "@/components/layout/content-page";
import { getShippingPolicy } from "@/lib/medusa";
import { formatCLP } from "@/lib/format";
import { coverageLabel, coverageAreaLabel } from "@/lib/shipping-copy";

export const metadata: Metadata = {
  title: "Despacho y cobertura",
  alternates: { canonical: "/despacho" },
};

// El costo/umbral vienen de la política real del backend (fuente única).
export const dynamic = "force-dynamic";

export default async function DespachoPage() {
  const policy = await getShippingPolicy();
  // Las comunas las declara el backend (fuente única): esta página las lista, no
  // las define. Ampliar cobertura allá se refleja acá sin tocar el front.
  const comunas = policy.coverage?.comunas ?? [];

  return (
    <ContentPage
      title="Despacho y cobertura"
      lead={
        (policy.subscriptionFreeShipping
          ? `Con suscripción, el despacho es gratis siempre. En una compra única, es gratis sobre ${formatCLP(policy.freeShippingThreshold)}.`
          : `El despacho es gratis en compras sobre ${formatCLP(policy.freeShippingThreshold)}.`) +
        ` Por ahora llegamos solo a la ${coverageLabel(policy)}.`
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
      <ProseBlock heading="Dónde llegamos">
        <p>
          <strong>
            Hoy despachamos solo en la {coverageLabel(policy)}, y dentro de ella en el{" "}
            {coverageAreaLabel(policy)}.
          </strong>{" "}
          Si tu dirección queda fuera, el checkout te lo dice antes de que pagues: preferimos
          decírtelo a tiempo antes que tomar un pedido que no podríamos entregar bien.
        </p>
        {comunas.length > 0 && (
          <>
            <p>Estas son las comunas que recorre nuestro reparto:</p>
            <p className="text-text-secondary">{comunas.join(" · ")}</p>
          </>
        )}
        <p>
          Estamos trabajando para abrir nuevas zonas. Escríbenos y te avisamos apenas llegue la
          tuya.
        </p>
      </ProseBlock>
      <ProseBlock heading="Sectores rurales">
        <p>
          Hay sectores rurales dentro de la Región Metropolitana donde nuestro reparto todavía no
          entra, y no siempre podemos saberlo con solo mirar la dirección.{" "}
          <strong>Si tu pedido cae en uno de esos casos, te contactamos antes de despachar</strong>{" "}
          para buscar una alternativa contigo.
        </p>
        <p>
          Si no hay forma de llegar, anulamos el pedido y{" "}
          <strong>te devolvemos el 100% de lo que pagaste</strong>. No te vamos a dejar esperando
          un despacho que no iba a salir.
        </p>
      </ProseBlock>
      <ProseBlock heading="Si no logramos entregarte">
        <p>
          Coordinamos la entrega contigo, así que lo normal es que no pase. Si aun así no
          conseguimos ubicarte en el domicilio, te escribimos y reagendamos sin costo.
        </p>
        <p>
          Si después de reagendar tampoco resulta, anulamos el pedido y te devolvemos el 100% de lo
          pagado. <strong>No tenemos retiro en tienda</strong>: no vamos a dejarte el pedido
          esperando en un mesón ni a descontarte nada por un despacho que no llegó a destino.
        </p>
      </ProseBlock>
    </ContentPage>
  );
}
