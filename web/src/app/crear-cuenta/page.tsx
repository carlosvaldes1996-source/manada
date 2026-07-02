import type { Metadata } from "next";
import { RegisterView } from "./register-view";

export const metadata: Metadata = {
  title: "Crea tu cuenta",
  description: "Guarda el perfil de tu mascota y deja que Manada se anticipe a lo que necesita.",
};

export default function CrearCuentaPage() {
  return <RegisterView />;
}
