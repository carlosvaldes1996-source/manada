import type { Metadata } from "next";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo Manada cuida los datos tuyos y de tu mascota: qué datos usamos, para qué y tus derechos. No vendemos tus datos.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <ContentPage
      title="Política de privacidad"
      lead="Cuidamos los datos tuyos y de tu mascota con el mismo cariño que tu compañero."
      updated="29 de junio de 2026"
    >
      <ProseBlock heading="Qué datos usamos">
        <p>
          Guardamos tus datos de contacto y entrega, y el perfil de tu mascota (especie, etapa, peso,
          salud) para personalizar recomendaciones y anticiparnos a lo que necesita.
        </p>
      </ProseBlock>
      <ProseBlock heading="Para qué los usamos">
        <p>
          Solo para mejorar tu experiencia: calcular cuándo se le acaba la comida, sugerir lo
          adecuado y procesar tus pedidos. <strong>No vendemos tus datos.</strong>
        </p>
      </ProseBlock>
      <ProseBlock heading="Tus derechos">
        <p>
          Puedes acceder, corregir o eliminar tus datos cuando quieras desde tu cuenta o
          escribiéndonos a privacidad@{SITE.domain}.
        </p>
      </ProseBlock>
    </ContentPage>
  );
}
