import type { Metadata } from "next";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "Nuestra historia" };

export default function NosotrosPage() {
  return (
    <ContentPage
      title="Nuestra historia"
      lead={`${SITE.name} nació de una idea simple: a tu mascota nunca debería faltarle nada.`}
    >
      <ProseBlock heading="Por qué existimos">
        <p>
          Cuidar a un animal es anticiparse. Construimos {SITE.name} para conocer a cada mascota como
          nadie y adelantarnos a lo que necesita: su comida, su salud y sus cuidados.
        </p>
      </ProseBlock>
      <ProseBlock heading="Cómo lo hacemos">
        <p>
          Con un perfil de mascota que aprende de su peso, etapa y rutina, y con despacho honesto
          —fecha y costo reales, siempre a la vista.
        </p>
      </ProseBlock>
    </ContentPage>
  );
}
