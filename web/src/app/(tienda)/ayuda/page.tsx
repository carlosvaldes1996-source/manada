import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "Ayuda" };

export default function AyudaPage() {
  return (
    <ContentPage
      title="Ayuda"
      lead="¿Tienes una duda? Estamos para que tú y tu mascota estén tranquilos."
    >
      <ProseBlock heading="Temas frecuentes">
        <p>
          Revisa cómo funcionan{" "}
          <Link href="/anticipacion" className="font-semibold text-text-brand hover:underline">
            nuestras anticipaciones
          </Link>
          , el{" "}
          <Link href="/despacho" className="font-semibold text-text-brand hover:underline">
            despacho y la cobertura
          </Link>{" "}
          o los{" "}
          <Link href="/devoluciones" className="font-semibold text-text-brand hover:underline">
            cambios y devoluciones
          </Link>
          .
        </p>
      </ProseBlock>
      <ProseBlock heading="Hablar con una persona">
        <p>
          Escríbenos a hola@{SITE.domain} y te respondemos a la brevedad. Si es sobre un pedido, ten a
          mano tu correo de compra.
        </p>
      </ProseBlock>
    </ContentPage>
  );
}
