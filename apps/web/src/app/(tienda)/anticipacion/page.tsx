import type { Metadata } from "next";
import { ContentPage, ProseBlock } from "@/components/layout/content-page";

export const metadata: Metadata = { title: "Cómo anticipamos" };

export default function AnticipacionPage() {
  return (
    <ContentPage
      title="Cómo anticipamos"
      lead="Te avisamos antes de que se acabe, para que nunca le falte. Tú decides; nosotros recordamos."
    >
      <ProseBlock heading="A partir de su perfil">
        <p>
          Calculamos cuándo se le acaba el alimento con el tamaño de su último saco, su peso y su
          etapa de vida. Mientras más sabemos de tu mascota, mejor nos anticipamos.
        </p>
      </ProseBlock>
      <ProseBlock heading="Una sugerencia, no un cobro">
        <p>
          La anticipación es una ayuda transparente: te mostramos por qué te lo decimos y tú decides
          si pedir de nuevo o esperar. Nunca compramos por ti.
        </p>
      </ProseBlock>
    </ContentPage>
  );
}
