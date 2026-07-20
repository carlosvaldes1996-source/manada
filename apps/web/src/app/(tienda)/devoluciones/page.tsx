import type { Metadata } from "next";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";

export const metadata: Metadata = { title: "Cambios y devoluciones" };

export default function DevolucionesPage() {
  return (
    <ContentPage
      title="Cambios y devoluciones"
      lead="Cambiamos productos sellados y resolvemos cualquier problema de calidad. Sin letra chica."
      updated="19 de julio de 2026"
    >
      <ProseBlock heading="Productos sellados y en buen estado">
        <p>
          Aceptamos cambios y devoluciones de productos <strong>sellados y en buen estado</strong>{" "}
          dentro de 30 días de la compra. Los productos de farmacia con receta tienen condiciones
          especiales por normativa.
        </p>
        <p>
          Por higiene y seguridad, los <strong>alimentos abiertos no pueden devolverse</strong>. Si
          tienes dudas sobre cuál es el mejor formato para tu mascota, escríbenos antes de comprar y
          te ayudamos a elegir.
        </p>
      </ProseBlock>
      <ProseBlock heading="Si algo llegó mal">
        <p>
          Si tu pedido llegó dañado, vencido o equivocado, lo resolvemos <strong>sin costo</strong>:
          te enviamos el reemplazo o te devolvemos el dinero. Avísanos apenas lo recibas.
        </p>
      </ProseBlock>
      <ProseBlock heading="Cómo iniciar una devolución">
        <p>
          Escríbenos desde la sección de Ayuda o a tu correo de pedido y coordinamos el retiro sin
          que tengas que moverte.
        </p>
      </ProseBlock>
    </ContentPage>
  );
}
