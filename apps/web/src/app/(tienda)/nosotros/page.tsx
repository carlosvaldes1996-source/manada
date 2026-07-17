import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Stack } from "@/components/ui/stack";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Nuestra historia",
  description:
    "Manada nació de una idea simple: cuidar es anticiparse. Conoce por qué existimos y cómo cuidamos a tu mascota en Chile.",
  alternates: { canonical: "/nosotros" },
};

/**
 * Nuestra historia. Página de conexión emocional con la marca: hero de texto +
 * dos bloques. "Cómo lo hacemos" incorpora la foto lifestyle del pesaje
 * (Photo: persona registrando el peso de su gato con el teléfono). Los slots de
 * foto que aún faltan (hero de fundadores, "Por qué existimos") quedan como
 * texto hasta tener las imágenes; ver public/fotos/README.md.
 */
export default function NosotrosPage() {
  return (
    <>
      <Section spacing="md">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
          <span className="overline text-text-brand">Nuestra historia</span>
          <h1 className="display-l text-text-primary">
            A tu mascota nunca debería faltarle nada.
          </h1>
          <p className="body-l text-text-secondary">
            {SITE.name} nació de una idea simple: cuidar es anticiparse.
          </p>
        </div>
      </Section>

      <Section spacing="md" tone="subtle">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <Stack gap={3}>
            <h2 className="heading-2 text-text-primary">Por qué existimos</h2>
            <p className="body-l text-text-secondary">
              Cuidar a un animal es anticiparse. Construimos {SITE.name} para conocer a cada mascota
              como nadie y adelantarnos a lo que necesita: su comida, su salud y sus cuidados.
            </p>
          </Stack>
          {/* Foto lifestyle (perro comiendo su alimento Manada en casa). */}
          <div
            className="aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)] border border-terracota-100 bg-brand-soft bg-cover bg-center"
            style={{ backgroundImage: "url('/fotos/nosotros-hogar.jpg')" }}
            role="img"
            aria-label="Un perro come feliz su comida en casa"
          />
        </div>
      </Section>

      <Section spacing="md">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Foto lifestyle (Photo: persona pesando a su gato con el teléfono).
              Fallback a color de marca si aún no está subida. */}
          <div
            className="aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)] border border-terracota-100 bg-brand-soft bg-cover bg-center"
            style={{ backgroundImage: "url('/fotos/nosotros-peso.jpg')" }}
            role="img"
            aria-label="Una persona registra el peso de su gato con el teléfono"
          />
          <Stack gap={3}>
            <h2 className="heading-2 text-text-primary">Cómo lo hacemos</h2>
            <p className="body-l text-text-secondary">
              Con un perfil de mascota que aprende de su peso, etapa y rutina, y con despacho
              honesto —fecha y costo reales, siempre a la vista.
            </p>
          </Stack>
        </div>
      </Section>
    </>
  );
}
