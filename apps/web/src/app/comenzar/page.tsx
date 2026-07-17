import type { Metadata } from "next";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = {
  title: "Crear el perfil de tu mascota",
  description: "Cuéntanos de tu mascota en 2 minutos y mira cómo Manada se anticipa a lo que necesita.",
  alternates: { canonical: "/comenzar" },
};

export default function ComenzarPage() {
  return <OnboardingWizard />;
}
