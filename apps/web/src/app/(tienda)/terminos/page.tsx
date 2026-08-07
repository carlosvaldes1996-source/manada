import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  alternates: { canonical: "/terminos" },
};

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
          El despacho es gratis en los pedidos con suscripción, sin monto mínimo, y en las compras
          únicas que superen el monto publicado en{" "}
          <Link href="/despacho" className="font-semibold text-text-brand hover:underline">
            Despacho y cobertura
          </Link>
          ; bajo ese monto se cobra el despacho estándar. El costo aparece en el carrito y al pagar
          antes de que confirmes la compra, y puede variar según tu comuna y disponibilidad.
          Coordinamos la entrega contigo tras la compra.
        </p>
      </ProseBlock>
      <ProseBlock heading="Contacto">
        <p>Para dudas sobre estos términos, escríbenos a hola@{SITE.domain}.</p>
      </ProseBlock>
    </ContentPage>
  );
}
