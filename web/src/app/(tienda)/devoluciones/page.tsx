import type { Metadata } from "next";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";

export const metadata: Metadata = { title: "Cambios y devoluciones" };

export default function DevolucionesPage() {
  return (
    <ContentPage
      title="Cambios y devoluciones"
      lead="Si a tu mascota no le gusta, lo resolvemos. Sin letra chica."
      updated="29 de junio de 2026"
    >
      <ProseBlock heading="Garantía de sabor">
        <p>
          Si tu compañero no acepta un alimento nuevo, te devolvemos el dinero o lo cambiamos por
          otro, <strong>sin costo</strong>, dentro de los 30 días de la compra.
        </p>
      </ProseBlock>
      <ProseBlock heading="Productos en buen estado">
        <p>
          Aceptamos cambios de productos sellados y en buen estado dentro de 30 días. Los productos
          de farmacia con receta tienen condiciones especiales por normativa.
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
