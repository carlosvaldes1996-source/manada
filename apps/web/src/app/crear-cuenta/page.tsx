import type { Metadata } from "next";
import { RegisterView } from "./register-view";

export const metadata: Metadata = {
  title: "Crea tu cuenta",
  description: "Guarda el perfil de tu mascota y deja que Manada se anticipe a lo que necesita.",
};

/**
 * Los datos de invitado (correo/nombre) pueden llegar prellenados desde la
 * confirmación de compra o el embudo — se leen en el server y se pasan como props
 * (evita `useSearchParams` + Suspense en el cliente).
 */
export default async function CrearCuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; nombre?: string }>;
}) {
  const { email, nombre } = await searchParams;
  return <RegisterView defaultEmail={email ?? ""} defaultName={nombre ?? ""} />;
}
