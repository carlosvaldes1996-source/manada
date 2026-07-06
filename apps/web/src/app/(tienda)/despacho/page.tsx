import type { Metadata } from "next";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";
import { SITE } from "@/config/site";
import { formatCLP } from "@/lib/format";

export const metadata: Metadata = { title: "Despacho y cobertura" };

export default function DespachoPage() {
  return (
    <ContentPage
      title="Despacho y cobertura"
      lead="Fecha y costo reales, siempre antes de pagar. Sin sorpresas."
    >
      <ProseBlock heading="Despacho honesto">
        <p>
          En cada producto y en el carrito mostramos cuándo llega y cuánto cuesta según tu comuna. Lo
          que ves es lo que pagas.
        </p>
      </ProseBlock>
      <ProseBlock heading="Envío gratis">
        <p>
          Tienes despacho gratis en compras sobre {formatCLP(SITE.commerce.freeShippingThreshold)}. En
          el carrito te mostramos cuánto te falta para alcanzarlo.
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
