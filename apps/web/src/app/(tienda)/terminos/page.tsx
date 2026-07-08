import type { Metadata } from "next";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <ContentPage
      title="Términos y condiciones"
      lead={`Condiciones de uso de ${SITE.name} (${SITE.domain}).`}
      updated="29 de junio de 2026"
    >
      <ProseBlock heading="Quiénes somos">
        <p>
          {SITE.name} es una tienda de productos para mascotas en Chile. Al usar el sitio y comprar,
          aceptas estos términos.
        </p>
      </ProseBlock>
      <ProseBlock heading="Precios y comprobante">
        <p>
          Los precios se muestran en pesos chilenos (CLP) e incluyen IVA. Emitimos la boleta
          correspondiente por cada compra y te la hacemos llegar junto con tu pedido.
        </p>
      </ProseBlock>
      <ProseBlock heading="Despacho">
        <p>
          El costo de despacho se muestra de forma honesta antes de pagar y coordinamos la entrega
          contigo tras la compra. Puede variar según tu comuna y disponibilidad.
        </p>
      </ProseBlock>
      <ProseBlock heading="Contacto">
        <p>Para dudas sobre estos términos, escríbenos a hola@{SITE.domain}.</p>
      </ProseBlock>
    </ContentPage>
  );
}
